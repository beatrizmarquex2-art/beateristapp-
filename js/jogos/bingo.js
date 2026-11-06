// Bingo musical v2 (tela): Kids primeiro, jogável; sozinho, online por código (backend real), 2 jogadores no mesmo aparelho (uma cartela por vez)
// e sala de aula (sorteador + cartelas para imprimir). Regras puras em bingo-logic.js; sala online em bingo-online.js + supabase/009_bingo_salas.sql.
import { h } from '../util.js';
import { confirmSheet, sheet, toast } from '../ui.js';
import { robo } from '../kids/robo.js';
import * as B from './bingo-logic.js';
import { imgEl, imgKind } from './bingo-img.js';
import { getGame, setGame, sfx, reduced } from './base.js';
import * as ON from './bingo-online.js';
import { printPack } from './bingo-print.js';
import { silence } from '../audio.js';
import { cardBg } from '../views/kids.js';
import { linha, chips, passo, ajuda } from './opcoes.js';

const ID = 'bingo';
const INTERVALS = [8, 12, 20];
const MIN_GAP = 900; // ms entre dois sorteios (toque duplo não pula item)
const KINDS = { horizontal: 'horizontal', vertical: 'vertical', diagonal: 'diagonal' };
const DEFAULTS = { tema: 'instrumentos', perfil: 'kids', vitoria: 'qualquer', mode: 'solo', draw: 'manual', intervalo: 12, marcar: 'auto', voz: false, names: ['Jogador 1', 'Jogador 2'], nome: '', seen: false, recent: [] };
const THEME_ICON = { instrumentos: 'bateria', pecas: 'bumbo', figuras: 'colcheia', simbolos: 'clave_sol', artistas: null };

export function mount(host) {
  let gone = false; let timer = 0; let auto = false; let paused = false; let lastDraw = 0; let modal = 0; let msg = ''; let flash = false;
  const saved = getGame(ID);
  const P = { ...DEFAULTS, ...(saved.prefs || {}) };
  P.names = [String(P.names[0] || 'Jogador 1').slice(0, 14), String(P.names[1] || 'Jogador 2').slice(0, 14)];
  let g = null; let on = null; let screen = 'menu';
  let prevMarks = {}; let shakeCell = null; let celebrated = false; let overlay = null;
  const root = h('div', { class: 'jg jg-bingo bg-root' }); host.replaceChildren(root);
  const savePrefs = () => setGame(ID, { prefs: P });
  const persist = () => setGame(ID, { prefs: P, game: g && !g.over ? g : null });
  const stopTimer = () => { clearTimeout(timer); timer = 0; };
  const leaveSpeech = () => { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch { /* sem voz */ } };
  const speak = (text) => { if (!P.voz) return; try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; u.rate = 0.95; speechSynthesis.speak(u); } catch { /* sem voz */ } };

  /* ================= visão normalizada (local ou online) ================= */
  function view() {
    if (on && on.state && on.state.status !== 'lobby') {
      const s = on.state; const mine = s.eu;
      return { online: true, tema: s.config.tema, perfil: s.config.perfil, vitoria: s.config.vitoria, mode: 'online', autoMarcar: !!s.config.auto_marcar, total: s.total, idx: s.idx, drawn: s.sorteados, current: s.sorteados[s.sorteados.length - 1] || null, salt: on.code,
        cards: [{ name: mine.nome, ids: mine.cartela || [], marks: mine.marcas || Array(9).fill(false), ci: 0 }], active: 0, over: s.status === 'fim', result: s.resultado, host: s.host, paused: !!s.pausado, other: s.outro, canDraw: s.host && s.status === 'jogando' && !s.pausado && s.idx < s.total, interval: s.config.intervalo, drawMode: s.config.modo, mySlot: mine.slot, allCards: s.cartelas };
    }
    if (!g) return null;
    const mesmo = g.mode === 'mesmo';
    return { online: false, tema: g.tema, perfil: g.perfil, vitoria: g.vitoria, mode: g.mode, autoMarcar: g.autoMarcar, total: B.total(g), idx: g.idx, drawn: B.drawn(g), current: B.current(g), salt: g.salt,
      cards: g.cards.map((ids, ci) => ({ name: g.names[ci] || `Jogador ${ci + 1}`, ids, marks: g.marks[ci], ci })), active: mesmo ? (g.round ? g.round.active : 0) : 0, over: g.over, result: g.result, host: true, paused, other: null, canDraw: B.canDraw(g), interval: g.intervalo, drawMode: g.draw, round: g.round };
  }
  const nameOf = (v, id) => B.nameOf(v.tema, id);

  /* ================= sorteio ================= */
  function announceNow(v) { const id = v.current; if (!id) return; const text = `Saiu: ${nameOf(v, id)}!`; speak(text); }
  async function doDraw(fromAuto) {
    const now = Date.now(); if (now - lastDraw < MIN_GAP) return; lastDraw = now;
    const v = view(); if (!v || !v.canDraw) return;
    msg = '';
    if (v.online) {
      sfx('draw'); try { await on.conn.sortear(!!fromAuto); } catch (e) { msg = e.message || 'não consegui sortear agora'; render(); }
      return;
    }
    g = B.drawNext(g); sfx('draw'); flash = !reduced(); persist(); announceNow(view()); render(); flash = false; schedule();
  }
  function schedule() {
    stopTimer(); const v = view();
    if (!auto || gone || !v || v.over || paused || document.hidden || modal || screen !== 'play') return;
    if (v.online && (!v.host || !v.other || !v.other.presente)) return;
    if (!v.canDraw) return;
    timer = setTimeout(() => { timer = 0; doDraw(true); }, (v.interval || P.intervalo) * 1000);
  }
  function setAuto(on_) { auto = on_; P.draw = on_ ? 'auto' : 'manual'; savePrefs(); render(); schedule(); }
  function setPaused(p) {
    paused = p; stopTimer();
    if (on && on.conn) on.conn.pausar(p).catch(() => {});
    render(); schedule();
  }

  /* ================= marcar / bingo / passar a vez ================= */
  const cool = new Map();
  async function markCell(ci, cell) {
    const v = view(); if (!v || v.over) return; const key = `${ci}:${cell}`; const t = Date.now(); if (cool.get(key) > t - 250) return; cool.set(key, t);
    const id = v.cards[ci === 0 && v.online ? 0 : ci].ids[cell];
    if (v.autoMarcar) { speak(nameOf(v, id)); sfx('tap'); msg = ''; render(); return; } // Kids com marcação automática: tocar só mostra/lê o nome
    if (v.online) {
      const marked = v.cards[0].marks[cell]; if (!marked && v.drawn.indexOf(id) < 0) { msg = `“${nameOf(v, id)}” ainda não saiu. Quando o Paul anunciar, é só marcar!`; shakeCell = `0:${cell}`; sfx('bad'); render(); shakeCell = null; return; }
      msg = ''; sfx('tap'); try { await on.conn.marcar(cell, !marked); } catch { msg = 'sem conexão agora'; render(); } return;
    }
    const r = B.toggleMark(g, ci, cell);
    if (!r.ok) { msg = r.reason === 'nao-sorteado' ? `“${nameOf(v, id)}” ainda não saiu. Quando o Paul anunciar, é só marcar!` : r.reason === 'vez' ? 'Não é a sua vez de marcar.' : ''; shakeCell = `${ci}:${cell}`; sfx('bad'); render(); shakeCell = null; return; }
    g = r.g; msg = ''; sfx('tap'); persist(); render();
  }
  async function claim(ci) {
    const v = view(); if (!v || v.over) return;
    if (v.online) {
      try { await on.conn.bingo(); } catch { msg = 'sem conexão agora'; render(); } return;
    }
    const r = B.declare(g, ci);
    if (!r.ok) { msg = r.reason === 'falta-marcar' ? 'Você tem três em linha, mas falta marcar essas casas. Marque e confirme de novo!' : r.reason === 'vez' ? 'Não é a sua vez.' : 'Ainda não: confira se três casas em linha já foram sorteadas e marcadas.'; sfx('bad'); render(); return; }
    g = r.g; stopTimer(); persist();
    if (r.pending) { msg = 'Bingo pedido! Passe a vez para o outro jogador ver a cartela dele.'; sfx('tap'); render(); return; }
    finishSound(); render();
  }
  function finishSound() { const v = view(); sfx('win'); setTimeout(() => sfx('win'), 650); const r = v && v.result; if (v && r) celebrate(v); if (r) { const kind = r.linhas && Object.values(r.linhas)[0] ? B.lineKind(Object.values(r.linhas)[0]) : ''; speak(r.tipo === 'empate' ? 'Empate! Bingo para os dois!' : `Bingo! Três na ${KINDS[kind] || 'linha'}!`); } }
  function passTurn() {
    const was = g.over; g = B.passTurn(g); persist(); msg = '';
    if (!was && g.over) finishSound(); else sfx('tap');
    render(); schedule();
  }

  /* ================= peças de tela ================= */
  const pic = (v, id, cls) => imgEl(v.tema, id, v.salt, cls);
  const seg = (key, list, onPick) => h('div', { class: 'jg-seg bg-seg', role: 'radiogroup' }, ...list.map(([val, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(P[key] === val), class: P[key] === val ? 'on' : '', onclick: () => { P[key] = val; savePrefs(); if (onPick) onPick(val); else menu(); } }, label)));
  const sheetOpen = (title, build) => { modal++; stopTimer(); sheet(title, build, { onClose: () => { modal = Math.max(0, modal - 1); schedule(); } }); };

  const STEPS = ['Escolha seu tema e como quer jogar.', 'Olhe as nove imagens da sua cartela.', 'O Paul anuncia o item sorteado. Você pode tocar em SORTEAR ou ativar AUTO.', 'Se o item estiver na sua cartela, marque! No Kids, pode marcar sozinho.', 'Completou três na horizontal, vertical ou diagonal? BINGO! O sistema confere se os itens realmente saíram.'];

  /* ================= MENU ================= */
  function menu() {
    stopTimer(); auto = false; paused = false; g = null; screen = 'menu'; leaveSpeech(); closeOverlay(); celebrated = false; prevMarks = {};
    const resume = B.validGame(saved.game) && !saved.game.over && saved.game.mode !== 'online' ? saved.game : null;
    const sess = ON.lerSessao ? ON.lerSessao() : null;
    const pre = salaDoLink();
    // tela de começo organizada: tema em capinhas, uma linha por escolha, regras escondidas no "?"
    const temaBtn = (t) => { const [id, nome] = t; const ico = THEME_ICON[id];
      const btn = h('button', { type: 'button', role: 'radio', 'aria-checked': String(P.tema === id), 'aria-label': nome, class: `jo-tema${P.tema === id ? ' on' : ''}`, onclick: () => { P.tema = id; savePrefs(); menu(); } });
      const icon = h('span', { class: 'jo-ticon', 'aria-hidden': 'true' }); if (id === 'artistas') icon.innerHTML = '<img src="assets/figurinhas/fotos/F001.jpeg" alt="" draggable="false">'; else icon.append(imgEl(id, ico, 'm'));
      btn.append(icon, h('b', {}, nome)); return btn; };
    const kids = P.perfil === 'kids';
    const modos = [['solo', 'Sozinho', 'um'], ['online', 'Jogar online por código', 'celular'], ['mesmo', '2 jogadores no mesmo aparelho', 'dois'], ['sala', 'Sala de aula', 'sala']];
    const go = () => { if (P.mode === 'online') return; begin(); };
    const set = (k, v, extra) => { P[k] = v; if (extra) extra(v); savePrefs(); menu(); };
    root.replaceChildren(...[
      resume ? h('div', { class: 'bg-resume' }, h('span', {}, `Partida em andamento (${B.THEME_NAME[resume.tema]}, ${B.counter(resume).toLowerCase()})`), h('button', { class: 'btn primary', type: 'button', onclick: () => { g = resume; screen = 'play'; render(); schedule(); } }, 'continuar')) : null,
      sess ? h('div', { class: 'bg-resume' }, h('span', {}, `Você tem uma sala online aberta (${sess.code}).`), h('button', { class: 'btn primary', type: 'button', onclick: () => reconnect(sess) }, 'voltar à sala'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { ON.limparSessao(); menu(); } }, 'sair da sala')) : null,
      h('div', { class: 'jo-topo' }, h('b', {}, 'tema'), ajuda('Como jogar', h('ol', {}, ...STEPS.map((x) => h('li', {}, x))))),
      h('div', { class: 'jo-temas', role: 'radiogroup', 'aria-label': 'Tema do bingo' }, ...B.THEME_LIST.map(temaBtn)),
      h('div', { class: 'jo-card' },
        linha('quem joga', chips(modos, P.mode, (v) => set('mode', v), 'Como quer jogar')),
        linha('ajuda', chips([['kids', 'kids'], ['classico', 'clássico']], P.perfil, (v) => set('perfil', v, (x) => { P.marcar = x === 'classico' ? 'eu' : 'auto'; }), 'Ajuda')),
        linha('vitória', passo(B.VICTORIES, P.vitoria, (v) => set('vitoria', v), 'vitória por')),
        linha('sorteio', chips([['manual', 'manual'], ['auto', 'automático']], P.draw, (v) => set('draw', v), 'Sorteio'), P.draw === 'auto' ? passo(INTERVALS.map((x) => [x, `${x} s`]), P.intervalo, (v) => set('intervalo', v), 'intervalo') : null),
        P.mode !== 'sala' ? linha('marcar', chips([['auto', 'automático'], ['eu', 'eu marco']], P.marcar, (v) => set('marcar', v), 'Marcação')) : null,
        linha('voz do Paul', chips([[true, 'ligada'], [false, 'desligada']], !!P.voz, (v) => set('voz', v, (x) => { if (x) speak('A voz do Paul está ligada.'); else leaveSpeech(); }), 'Voz do Paul'))),
      P.mode === 'mesmo' ? h('div', { class: 'bg-names' }, ...[0, 1].map((i) => h('label', { class: 'field' }, h('span', {}, `Jogador ${i + 1}`), h('input', { type: 'text', maxlength: 14, value: P.names[i], 'aria-label': `Nome do jogador ${i + 1}`, onchange: (e) => { P.names[i] = (e.target.value.trim() || `Jogador ${i + 1}`).slice(0, 14); savePrefs(); } })))) : null,
      P.mode === 'online' ? onlineForm(pre) : null,
      P.mode === 'sala' ? h('button', { class: 'btn', type: 'button', onclick: () => printSheet(P.tema) }, '🖨 Imprimir cartelas e fichas deste tema') : null,
      P.mode !== 'online' ? h('div', { class: 'bg-go' }, h('button', { class: 'btn primary jo-go', type: 'button', onclick: go }, P.mode === 'sala' ? 'abrir o sorteador' : 'jogar')) : null,
    ].flat().filter(Boolean));
    if (pre && P.mode !== 'online') { P.mode = 'online'; savePrefs(); menu(); }
  }
  const salaDoLink = () => { try { const m = /[?&]sala=([A-Za-z0-9]+)/.exec(location.hash); return m ? ON.codigoDoLink ? ON.codigoDoLink(location.href) : m[1].toUpperCase() : ''; } catch { return ''; } };

  function begin() {
    P.seen = true;
    const mesmo = P.mode === 'mesmo';
    g = B.newGame({ tema: P.tema, perfil: P.perfil, vitoria: P.vitoria, mode: P.mode, draw: P.draw, intervalo: P.intervalo, autoMarcar: P.marcar === 'auto', names: P.names, recent: P.recent });
    P.recent = [...P.recent.filter((x) => !g.pool.includes(x)), ...g.pool].slice(-86); // alvos de artistas usados, do mais antigo ao mais novo
    savePrefs(); auto = P.draw === 'auto'; paused = false; msg = ''; screen = 'play'; celebrated = false; prevMarks = {}; closeOverlay(); persist();
    void mesmo; render(); schedule();
  }

  /* ================= ONLINE ================= */
  function onlineForm(pre) {
    const nome = h('input', { type: 'text', maxlength: 20, placeholder: 'seu nome', value: P.nome || '', 'aria-label': 'Seu nome', autocomplete: 'off' });
    const code = h('input', { type: 'text', class: 'jg-code-in', maxlength: 6, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO', 'aria-label': 'Código da sala', value: pre || '', oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); } });
    const err = h('p', { class: 'jg-msg', 'aria-live': 'polite' });
    const needName = () => { const n = nome.value.trim(); if (!n) { err.textContent = 'Escreva seu nome primeiro.'; nome.focus(); return null; } P.nome = n; savePrefs(); return n; };
    const create = async () => {
      const n = needName(); if (!n) return; err.textContent = 'Criando a sala…'; P.seen = true;
      try {
        const s = await ON.salaCriar({ nome: n, tema: P.tema, perfil: P.perfil, vitoria: P.vitoria, modo: P.draw, intervalo: P.intervalo, autoMarcar: P.marcar === 'auto' });
        ON.salvarSessao(s); connect(s);
      } catch (e) { err.textContent = (e && e.message) || 'Não consegui criar a sala. Confira a internet e tente de novo.'; }
    };
    const join = async () => {
      const n = needName(); if (!n) return; const c = code.value.trim(); if (c.length < 6) { err.textContent = 'O código tem 6 letras ou números.'; return; }
      err.textContent = 'Entrando…';
      try { const s = await ON.salaEntrar({ code: c, nome: n }); ON.salvarSessao(s); connect(s); } catch (e) { err.textContent = (e && e.message) || 'Não achei essa sala. Confira o código com quem criou.'; }
    };
    return h('div', { class: 'bg-online' }, h('label', { class: 'field' }, h('span', {}, 'Seu nome'), nome),
      h('div', { class: 'bg-go' }, h('button', { class: 'btn primary bg-bigbtn', type: 'button', onclick: create }, 'CRIAR SALA')),
      h('p', { class: 'jg-lab' }, 'ou entre com o código'), h('div', { class: 'jg-actions row' }, code, h('button', { class: 'btn', type: 'button', onclick: join }, 'ENTRAR COM CÓDIGO')), err);
  }
  function connect(s) {
    on = { code: s.code, token: s.token, slot: s.slot, state: null, link: true, conn: null };
    on.conn = ON.conectar({ code: s.code, token: s.token, onEstado: (st) => { on.state = st; onState(); }, onLink: (ok) => { on.link = ok; if (screen !== 'menu') render(); schedule(); },
      onErro: (e) => { const m = (e && e.message) || 'A sala não existe mais.'; try { ON.limparSessao(); } catch { /* ok */ } on = null; stopTimer(); auto = false; menu(); toast(m, { ms: 4500 }); } });
    screen = 'lobby'; render();
  }
  async function reconnect(s) { connect(s); }
  let lastStatus = '';
  function onState() {
    const st = on.state; if (!st) return;
    if (st.status === 'lobby') { screen = 'lobby'; auto = false; render(); return; }
    const first = screen !== 'play'; screen = 'play';
    if (first) { auto = (st.config.modo === 'auto'); paused = false; msg = ''; flash = false; }
    if (st.idx && lastStatus !== `${st.idx}`) { lastStatus = `${st.idx}`; if (st.idx > 0) { flash = !reduced(); sfx('draw'); announceNow(view()); } }
    if (st.status === 'fim' && st.resultado) { stopTimer(); finishSound(); }
    if (st.status === 'jogando' && !st.idx) { lastStatus = ''; celebrated = false; prevMarks = {}; closeOverlay(); }
    if (st.erro === 'invalido') msg = 'Ainda não: confira se três casas em linha já saíram e estão marcadas.';
    render(); flash = false; schedule();
  }
  function lobby() {
    const st = on && on.state; const code = on.code; const host = !!(st && st.host); const other = st && st.outro;
    const invite = ON.linkConvite ? ON.linkConvite(code) : '';
    const copy = async (text, ok) => { try { await navigator.clipboard.writeText(text); toast(ok, { ms: 1800 }); } catch { toast('Copie manualmente: ' + text, { ms: 4000 }); } };
    root.replaceChildren(
      h('p', { class: 'jg-lab' }, 'Código da sala'), h('div', { class: 'jg-code', role: 'status', 'aria-label': `código ${code.split('').join(' ')}` }, code),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn', type: 'button', onclick: () => copy(code, 'Código copiado ✓') }, 'Copiar código'), h('button', { class: 'btn', type: 'button', onclick: () => copy(invite, 'Link copiado ✓') }, 'Copiar link de convite')),
      h('ul', { class: 'bg-players' }, h('li', {}, `${st && st.host ? st.eu.nome : (other ? other.nome : '…')} (anfitrião) ✓`), h('li', {}, other || !host ? `${host ? other.nome : (st ? st.eu.nome : '')} ${host ? (other.presente ? '✓ conectado' : '… ausente') : '✓'}` : 'esperando o outro jogador entrar…')),
      st ? h('p', { class: 'jg-p' }, `${B.THEME_NAME[st.config.tema]} · ${st.config.perfil === 'kids' ? 'Kids' : 'Clássico'} · ${(B.VICTORIES.find((x) => x[0] === st.config.vitoria) || [])[1]} · sorteio ${st.config.modo === 'auto' ? `automático (${st.config.intervalo} s)` : 'manual'}`) : null,
      host ? h('div', { class: 'bg-go' }, h('button', { class: 'btn primary bg-bigbtn', type: 'button', disabled: !(other && other.presente), onclick: async () => { try { await on.conn.iniciar(); } catch (e) { msg = (e && e.message) || ''; render(); } } }, 'COMEÇAR')) : h('p', { class: 'jg-p muted' }, 'Esperando o anfitrião começar…'),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, on.link ? msg : 'Sem conexão… tentando de novo.'),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: leaveOnline }, host ? 'Fechar a sala' : 'Sair da sala')));
  }
  async function leaveOnline() {
    const had = on; on = null; stopTimer(); auto = false;
    if (had) { try { await had.conn.sair(); } catch { /* ok */ } try { had.conn.fechar(); } catch { /* ok */ } }
    try { ON.limparSessao(); } catch { /* ok */ }
    menu();
  }

  /* ================= JOGO ================= */
  function callCard(v) {
    const id = v.current;
    const text = id ? `Saiu: ${nameOf(v, id)}!` : (v.mode === 'sala' ? 'Toque em SORTEAR AGORA para começar' : 'Toque em SORTEAR AGORA');
    const sparks = flash && id ? h('span', { class: 'bg-sparks', 'aria-hidden': 'true' }, ...['✦', '★', '✦', '♪', '★', '♫'].map((c, i) => h('i', { style: `--a:${i * 60}deg;--d:${i * 0.05}s` }, c))) : null;
    const card = h('button', { type: 'button', class: `bg-call${flash ? ' flash' : ''}`, 'aria-label': id ? `Item sorteado: ${nameOf(v, id)}. Toque para ampliar` : 'Nenhum item sorteado ainda', disabled: !id || null, onclick: () => bigView(v, id) },
      sparks, id ? pic(v, id, 'bg-cpic') : h('span', { class: 'bg-cpic bg-empty', 'aria-hidden': 'true' }, '🎵'), h('b', {}, id ? nameOf(v, id) : 'Vamos começar?'), v.mode === 'online' && !v.host ? h('small', {}, 'O anfitrião sorteia para os dois.') : null);
    return h('div', { class: 'bg-callwrap' }, h('div', { class: 'bg-paul' }, robo({ mood: id ? 'cheer' : 'happy', size: 46 }).el, h('p', { class: 'bg-say', role: 'status', 'aria-live': 'polite' }, text, id && v.mode !== 'sala' ? h('small', {}, ' Você tem esse na cartela?') : null)), card);
  }
  function bigView(v, id) {
    if (!id) return;
    sheetOpen(nameOf(v, id), () => h('div', { class: 'sheet-body bg-big' }, pic(v, id, 'bg-bigpic'), h('b', {}, nameOf(v, id)), h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { P.voz ? speak(nameOf(v, id)) : speakOnce(nameOf(v, id)); } }, '🔊 Ouvir o nome'))));
  }
  function speakOnce(text) { try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; speechSynthesis.speak(u); } catch { /* sem voz */ } }
  function historySheet() {
    const v = view(); if (!v) return;
    sheetOpen('Histórico', () => h('div', { class: 'sheet-body' }, h('p', { class: 'jg-p' }, B.counter({ idx: v.idx, seq: { length: v.total } })),
      v.drawn.length ? h('ol', { class: 'bg-hist' }, ...v.drawn.map((id, i) => ({ id, i })).reverse().map(({ id, i }) => h('li', { class: i === v.drawn.length - 1 ? 'last' : '' }, pic(v, id, 'bg-hpic'), h('span', {}, h('small', {}, `${i + 1}º`), ' ', nameOf(v, id))))) : h('p', { class: 'muted' }, 'Ainda não saiu nada.'),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', disabled: !v.current, onclick: () => { announceRepeat(); } }, '🔁 Repetir anúncio'))));
  }
  function announceRepeat() { const v = view(); if (!v || !v.current) return; const t = `Saiu: ${nameOf(v, v.current)}!`; if (P.voz) speak(t); else speakOnce(t); flash = !reduced(); sfx('tap'); render(); flash = false; }

  function controls(v) {
    const canHostDraw = v.canDraw; const waitTurn = v.mode === 'mesmo' && v.round && !v.round.done.every(Boolean);
    const drawBtn = h('button', { class: 'btn primary bg-bigbtn bg-draw', type: 'button', disabled: !canHostDraw || null, onclick: () => doDraw(false) }, v.idx >= v.total ? 'Acabou o sorteio' : v.online && !v.host ? 'O anfitrião sorteia' : 'SORTEAR AGORA');
    const canAuto = !v.over && (!v.online || v.host);
    return h('div', { class: 'bg-ctl' },
      drawBtn,
      waitTurn ? h('p', { class: 'jg-p muted' }, v.round.active === 0 ? `Falta ${v.cards[0].name} olhar a cartela e depois ${v.cards[1].name}.` : `Falta ${v.cards[1].name} olhar a cartela.`) : null,
      h('div', { class: 'jg-actions row' },
        canAuto ? h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(auto), onclick: () => setAuto(!auto) }, auto ? `AUTO: desligar (${v.interval || P.intervalo} s)` : 'AUTO: ligar') : null,
        auto && canAuto ? h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(paused), onclick: () => setPaused(!paused) }, paused ? '▶ Continuar' : '⏸ Pausar') : null,
        !v.online && v.mode !== 'sala' || v.online ? null : null,
        h('button', { class: 'btn small ghost', type: 'button', disabled: !v.current || null, onclick: announceRepeat }, '🔁 Repetir anúncio'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: historySheet }, '🕘 Histórico')),
      auto && canAuto ? h('label', { class: 'bg-int' }, h('span', {}, 'Intervalo'), h('select', { 'aria-label': 'Intervalo do sorteio automático', onchange: (e) => { const n = Number(e.target.value); P.intervalo = n; if (g) g.intervalo = n; savePrefs(); if (g) persist(); render(); schedule(); } }, ...INTERVALS.map((s) => h('option', { value: s, selected: (v.interval || P.intervalo) === s ? '' : null }, `${s} segundos`)))) : null);
  }

  const LETTERS = ['B', 'I', 'N', 'G', 'O'];
  function cardGrid(v, ci) {
    const c = v.cards[ci]; const win = v.over && v.result && v.result.linhas ? (v.online ? v.result.linhas[v.mySlot] : v.result.linhas[c.ci]) : null; const winSet = win ? new Set(win) : null; const drawnSet = new Set(v.drawn);
    const key = `${v.online ? 'o' : 'l'}${ci}`; const before = prevMarks[key] || []; prevMarks[key] = c.marks.slice();
    const count = c.marks.filter(Boolean).length; const lit = [1, 3, 5, 7, 9].map((n) => count >= n);
    const cells = c.ids.map((id, cell) => {
      const on_ = c.marks[cell]; const out = drawnSet.has(id); const r = Math.floor(cell / 3) + 1; const col = (cell % 3) + 1; const fresh = on_ && !before[cell] && before.length > 0;
      const label = `${nameOf(v, id)}, linha ${r}, coluna ${col}, ${out ? 'já sorteado' : 'ainda não sorteado'}, ${on_ ? 'marcado' : 'não marcado'}`;
      return h('button', { type: 'button', class: `bg-cell${on_ ? ' on' : ''}${fresh ? ' fresh' : ''}${out && !on_ ? ' out' : ''}${winSet && winSet.has(cell) ? ' win' : ''}${shakeCell === `${ci}:${cell}` ? ' bad' : ''}`, style: `--i:${cell}`, 'aria-pressed': String(on_), 'aria-label': label, onclick: () => markCell(v.online ? 0 : ci, cell) },
        pic(v, id, 'bg-cellpic'), h('small', {}, nameOf(v, id)), on_ ? h('i', { class: 'bg-stamp', 'aria-hidden': 'true' }, '★') : null);
    });
    return h('div', { class: `bg-cartela p${ci}`, role: 'group', 'aria-label': `Cartela de ${c.name}` },
      h('div', { class: 'bg-ribbon' }, h('span', { 'aria-hidden': 'true' }, '🎵'), (v.cards.length === 1 && !v.online ? ' Sua cartelinha ' : ` Cartelinha de ${c.name} `), h('span', { 'aria-hidden': 'true' }, '🎵')),
      h('div', { class: 'bg-letters', 'aria-hidden': 'true' }, ...LETTERS.map((l, i) => h('b', { class: lit[i] ? 'lit' : '', style: `--i:${i}` }, l))),
      h('div', { class: 'bg-card' }, cells));
  }
  function closeOverlay() { if (overlay) { overlay.remove(); overlay = null; modal = Math.max(0, modal - 1); } }
  /** BINGOOOO! gigante: letras pulando, confete, Paul comemorando. */
  function celebrate(v) {
    if (celebrated || gone) return; celebrated = true; const r = v.result; if (!r) return;
    const kind = r.linhas && Object.values(r.linhas)[0] ? B.lineKind(Object.values(r.linhas)[0]) : '';
    const who = r.tipo === 'empate' ? 'Empate! Bingo para os dois!' : v.online ? (r.vencedores.includes(v.mySlot) ? 'Você fez BINGO!' : `${v.other ? v.other.nome : 'O outro jogador'} fez BINGO!`) : v.cards.length > 1 ? `${v.cards[r.vencedores[0]].name} fez BINGO!` : 'Você venceu!';
    const word = 'BINGOOO!'.split('');
    const conf = Array.from({ length: 46 }, (_, i) => h('i', { style: `--x:${(i * 53) % 100}%;--d:${(i % 9) * 0.1}s;--c:${['#BD1733', '#17365B', '#EBA332', '#2f7d3a', '#fff'][i % 5]};--r:${(i * 47) % 360}deg` }));
    const box = h('div', { class: 'bg-boom', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Bingo!' },
      h('div', { class: 'bg-conf', 'aria-hidden': 'true' }, ...conf),
      h('div', { class: 'bg-boomcard' }, h('div', { class: 'bg-boompaul' }, robo({ mood: 'crown', size: 110 }).el),
        h('div', { class: 'bg-word', 'aria-hidden': 'true' }, ...word.map((ch, i) => h('span', { style: `--i:${i}` }, ch))),
        h('p', { class: 'bg-who' }, who), kind && r.tipo !== 'empate' ? h('p', { class: 'bg-kind' }, `Três na ${kind}!`) : null,
        h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: closeOverlay }, 'Ver a cartela'))));
    overlay = box; modal++; stopTimer(); root.append(box);
    if (!reduced()) { root.classList.add('bg-shake'); setTimeout(() => root.classList.remove('bg-shake'), 700); }
    setTimeout(() => { const b = box.querySelector('button'); if (b) b.focus(); }, 50);
  }
  function linePending(v, ci) { // existe linha toda sorteada (Kids: dica de "toque BINGO!")
    const set = new Set(v.drawn); return B.linesFor(v.vitoria).some((l) => l.every((cell) => set.has(v.cards[ci].ids[cell]) && v.cards[ci].marks[cell]));
  }
  function resultPanel(v) {
    const r = v.result; if (!r) return null;
    const kind = r.linhas && Object.values(r.linhas)[0] ? B.lineKind(Object.values(r.linhas)[0]) : '';
    let title;
    if (r.tipo === 'empate') title = 'Empate! Bingo para os dois 🤝';
    else if (v.online) title = r.vencedores.includes(v.mySlot) ? 'Você fez BINGO! 🤘' : `${v.other ? v.other.nome : 'O outro jogador'} fez BINGO!`;
    else if (v.cards.length > 1) title = `${v.cards[r.vencedores[0]].name} fez BINGO! 🤘`; else title = 'BINGO! Você venceu 🤘';
    return h('div', { class: 'jg-result bg-result', role: 'status' }, h('h3', { class: 'hand' }, title), kind ? h('p', {}, `Três na ${kind}.`) : null,
      h('div', { class: 'jg-actions row' },
        v.online ? (v.host ? h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { await on.conn.iniciar(); } catch { /* ok */ } } }, 'Revanche') : h('span', { class: 'muted' }, 'O anfitrião pode começar a revanche.')) : h('button', { class: 'btn primary', type: 'button', onclick: begin }, v.cards.length > 1 ? 'Revanche (cartelas novas)' : 'Jogar de novo'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => (v.online ? leaveOnline() : menu()) }, 'Voltar ao menu')));
  }
  function statusBar(v) {
    const label = v.mode === 'online' ? (on.link ? `● online · sala ${on.code}` : '○ sem conexão, tentando de novo…') : v.mode === 'mesmo' ? '2 jogadores · mesmo aparelho' : v.mode === 'sala' ? 'Sala de aula · sorteador' : 'Sozinho';
    return h('div', { class: 'bg-status' }, h('b', { 'aria-live': 'polite' }, `Sorteados: ${v.idx} de ${v.total}`), h('span', { class: on && !on.link ? 'bad' : '' }, label),
      v.paused || (v.online && v.paused) ? h('span', { class: 'bad' }, '⏸ sorteio pausado') : null,
      v.online && v.other ? h('span', { class: v.other.presente ? '' : 'bad' }, v.other.presente ? `${v.other.nome} ✓` : `${v.other.nome} ausente: sorteio pausado`) : null);
  }

  function play() {
    const v = view(); if (!v) { menu(); return; }
    const mesmo = v.mode === 'mesmo'; const ci = v.active;
    const parts = [statusBar(v)];
    if (v.mode === 'sala') {
      parts.push(callCard(v), controls(v), h('p', { class: 'jg-p' }, `Tema: ${B.THEME_NAME[v.tema]} · vitória: ${(B.VICTORIES.find((x) => x[0] === v.vitoria) || [])[1]}. Cartelas de papel não ficam conectadas: todos usam esta mesma sequência.`),
        h('div', { class: 'jg-actions row' }, h('button', { class: 'btn', type: 'button', onclick: () => printSheet(v.tema) }, '🖨 Imprimir cartelas e fichas'), h('button', { class: 'btn ghost', type: 'button', onclick: () => fullscreen() }, 'Tela cheia'), h('button', { class: 'btn ghost', type: 'button', onclick: newRound }, 'Nova rodada')));
      root.replaceChildren(...parts); return;
    }
    parts.push(callCard(v), controls(v));
    if (mesmo && !v.over) parts.push(h('div', { class: `bg-turn p${ci}`, role: 'status' }, v.round ? `Vez de ${v.cards[ci].name}: marque${v.autoMarcar ? '' : ' se tiver o item'} e passe a vez.` : 'Sorteie o primeiro item.'));
    if (v.round || !mesmo) parts.push(cardGrid(v, mesmo ? ci : 0));
    else parts.push(cardGrid(v, 0));
    parts.push(h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg));
    if (v.over) { parts.push(resultPanel(v)); }
    else {
      const hint = linePending(v, mesmo ? ci : 0);
      parts.push(h('div', { class: 'jg-actions row bg-bingorow' },
        h('button', { class: `btn primary bg-bingo${hint ? ' pulse' : ''}`, type: 'button', onclick: () => claim(mesmo ? ci : 0) }, `BINGO!${mesmo ? ` (${v.cards[ci].name})` : ''}`),
        mesmo && v.round ? h('button', { class: 'btn bg-pass', type: 'button', onclick: passTurn }, v.round.active === 0 ? `Passar para ${v.cards[1].name}` : 'Pronto: liberar o próximo sorteio') : null));
      if (hint && v.perfil === 'kids') parts.push(h('p', { class: 'bg-tip' }, 'Paul: você fez uma linha! Toque em BINGO!'));
    }
    parts.push(h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost small', type: 'button', onclick: exitGame }, v.online ? 'Sair da sala' : 'Sair para o menu')));
    root.replaceChildren(...parts);
  }
  async function exitGame() {
    const v = view(); if (v && !v.over && v.idx > 0 && !(await confirmSheet('Sair da partida?', 'A partida atual será perdida.', 'Sair'))) return;
    if (on) { leaveOnline(); return; } stopTimer(); g = null; persist(); menu();
  }
  function newRound() { if (g) { g = B.newGame({ tema: g.tema, perfil: g.perfil, vitoria: g.vitoria, mode: 'sala', draw: g.draw, intervalo: g.intervalo, recent: P.recent }); persist(); msg = ''; render(); schedule(); } }
  function fullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else if (root.requestFullscreen) root.requestFullscreen(); } catch { /* sem tela cheia */ } }

  /* ================= impressão ================= */
  function printSheet(tema) {
    let color = true;
    sheetOpen('Imprimir cartelas', (close) => h('div', { class: 'sheet-body' },
      h('p', { class: 'jg-p' }, `${B.THEME_NAME[tema]}: manual, 24 cartelas diferentes e numeradas, fichas de sorteio e marcadores recortáveis (A4).`),
      h('p', { class: 'jg-p' }, `Condição de vitória: ${(B.VICTORIES.find((x) => x[0] === P.vitoria) || [])[1]}. Ela vale para todos; defina antes de imprimir.`),
      h('div', { class: 'jg-seg' }, h('button', { type: 'button', class: 'on', onclick: (e) => { color = true; e.target.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.target)); } }, 'Colorido'), h('button', { type: 'button', onclick: (e) => { color = false; e.target.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.target)); } }, 'Preto e branco')),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); setTimeout(() => printPack(tema, { color, vitoria: P.vitoria, recent: P.recent }), 250); } }, 'Imprimir / salvar PDF')),
      h('p', { class: 'jg-p muted' }, 'No celular, escolha “salvar como PDF” na janela de impressão. Fotos de artistas são só para uso da escola.')));
  }

  /* ================= desenho ================= */
  function render() {
    if (gone) return;
    if (screen === 'menu') { return; }
    if (screen === 'lobby' && on && !(on.state && on.state.status !== 'lobby')) { lobby(); return; }
    play();
    if (overlay && !overlay.isConnected) root.append(overlay); // a comemoração sobrevive aos redesenhos da tela
  }

  const onVis = () => { if (document.hidden) stopTimer(); else schedule(); };
  document.addEventListener('visibilitychange', onVis);
  const pre = salaDoLink(); void pre; void imgKind;
  menu();
  return {
    inProgress: () => !!(g && !g.over && g.idx > 0) || !!(on && on.state && on.state.status === 'jogando'),
    restart: async () => { const v = view(); if (v && !v.over && v.idx > 0 && !(await confirmSheet('Começar de novo?', 'A partida atual será perdida.', 'Começar de novo'))) return; if (on) { await leaveOnline(); return; } stopTimer(); g = null; persist(); menu(); },
    destroy() { gone = true; closeOverlay(); stopTimer(); leaveSpeech(); silence(); document.removeEventListener('visibilitychange', onVis); if (on && on.conn) { try { on.conn.fechar(); } catch { /* ok */ } } if (document.fullscreenElement) { try { document.exitFullscreen(); } catch { /* ok */ } } },
  };
}
