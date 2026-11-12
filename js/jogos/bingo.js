// Bingo musical v3 (tela): primeira tela simples (4 jeitos de jogar + "mais opções"), SORTEAR e BINGO grandes lado a lado; sozinho, online por código (backend real), 2 jogadores no mesmo aparelho (uma cartela por vez)
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
import { ganhou } from './estrelas-jogo.js';
import { bq } from './bonequinhos.js';
import { linha, chips, passo } from './opcoes.js';

// o CSS novo do bingo carrega sozinho (arquivo css/bingo-v3.css), assim não depende de outro lugar ligar
function cssV3() { try { if (!document.querySelector('link[data-bingo-v3]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/bingo-v3.css'; l.setAttribute('data-bingo-v3', ''); document.head.append(l); } } catch { /* sem DOM */ } }

const ID = 'bingo';
const INTERVALS = [8, 12, 20];
const MIN_GAP = 900; // ms entre dois sorteios (toque duplo não pula item)
const KINDS = { horizontal: 'horizontal', vertical: 'vertical', diagonal: 'diagonal' };
const DEFAULTS = { tema: 'instrumentos', perfil: 'kids', vitoria: 'qualquer', mode: 'solo', draw: 'manual', intervalo: 12, marcar: 'auto', voz: false, names: ['Jogador 1', 'Jogador 2'], nome: '', seen: false, recent: [] };
const THEME_ICON = { instrumentos: 'bateria', pecas: 'bumbo', figuras: 'colcheia', simbolos: 'clave_sol', artistas: null };

export function mount(host) {
  let gone = false; let timer = 0; let due = 0; let left = 0; let extPaused = false; let maisAberto = false; let auto = false; let paused = false; let lastDraw = 0; let modal = 0; let msg = ''; let flash = false;
  const saved = getGame(ID);
  const P = { ...DEFAULTS, ...(saved.prefs || {}) };
  P.names = [String(P.names[0] || 'Jogador 1').slice(0, 14), String(P.names[1] || 'Jogador 2').slice(0, 14)];
  let g = null; let on = null; let screen = 'menu';
  let prevMarks = {}; let shakeCell = null; let celebrated = false; let overlay = null;
  cssV3();
  const root = h('div', { class: 'jg jg-bingo bg-root' }); host.replaceChildren(root);
  const savePrefs = () => setGame(ID, { prefs: P });
  const persist = () => setGame(ID, { prefs: P, game: g && !g.over ? g : null });
  const stopTimer = () => { clearTimeout(timer); timer = 0; due = 0; };
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
      sfx('draw'); try { await on.conn.sortear(!!fromAuto); } catch (e) { msg = (e && e.message) || 'não consegui sortear agora. tente de novo'; render(); }
      return;
    }
    g = B.drawNext(g); sfx('draw'); flash = !reduced(); persist(); announceNow(view()); render(); flash = false; stopTimer(); schedule();
  }
  /** Agenda o próximo sorteio automático. `ms`: tempo que falta (ao retomar); sem `ms`, mantém o relógio que já corre. */
  function schedule(ms) {
    const v = view();
    if (!auto || gone || !v || v.over || paused || extPaused || document.hidden || modal || screen !== 'play') { stopTimer(); return; }
    if (v.online && (!v.host || !v.other || !v.other.presente)) { stopTimer(); return; }
    if (!v.canDraw) { stopTimer(); return; }
    if (timer && ms == null) return; // já tem um relógio andando: não reinicia a cada atualização da tela
    stopTimer(); const wait = ms != null ? ms : (v.interval || P.intervalo) * 1000; due = Date.now() + wait;
    timer = setTimeout(() => { timer = 0; due = 0; doDraw(true); }, wait);
  }
  function setAuto(on_) { auto = on_; P.draw = on_ ? 'auto' : 'manual'; savePrefs(); stopTimer(); render(); schedule(); }
  function setPaused(p) {
    paused = p; stopTimer(); left = 0;
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
      const marked = v.cards[0].marks[cell]; if (!marked && v.drawn.indexOf(id) < 0) { msg = `“${nameOf(v, id)}” ainda não saiu. quando o Paul sortear, é só tocar!`; shakeCell = `0:${cell}`; sfx('bad'); render(); shakeCell = null; return; }
      msg = ''; sfx('tap'); try { await on.conn.marcar(cell, !marked); } catch { msg = 'sem internet agora. tente de novo'; render(); } return;
    }
    const r = B.toggleMark(g, ci, cell);
    if (!r.ok) { msg = r.reason === 'nao-sorteado' ? `“${nameOf(v, id)}” ainda não saiu. quando o Paul sortear, é só tocar!` : r.reason === 'vez' ? 'não é a sua vez de marcar' : ''; shakeCell = `${ci}:${cell}`; sfx('bad'); render(); shakeCell = null; return; }
    g = r.g; msg = ''; sfx('tap'); persist(); render();
  }
  async function claim(ci) {
    const v = view(); if (!v || v.over) return;
    if (v.online) {
      try { await on.conn.bingo(); } catch (e) { msg = (e && e.message) || 'sem internet agora. tente de novo'; render(); } return;
    }
    const r = B.declare(g, ci);
    if (!r.ok) { msg = r.reason === 'falta-marcar' ? 'você tem 3 em linha, mas falta marcar. toque nas figuras e aperte BINGO de novo' : r.reason === 'vez' ? 'não é a sua vez' : 'ainda não: precisa de 3 em linha que já saíram'; sfx('bad'); render(); return; }
    g = r.g; stopTimer(); persist();
    if (r.pending) { msg = 'bingo pedido! passe a vez pro outro jogador ver a cartela dele'; sfx('tap'); render(); return; }
    finishSound(); render();
  }
  let pago = false; // 3 ★ uma vez por partida, quando VOCÊ faz bingo (sozinho com o Paul ou em 2 celulares)
  function finishSound() { const v = view(); if (!pago && v && v.over && v.result && v.result.tipo === 'vitoria' && v.result.vencedores && (v.online ? v.result.vencedores.includes(v.mySlot) : v.mode === 'solo' && v.result.vencedores.includes(0))) { pago = true; ganhou('bingo'); }
    sfx('win'); setTimeout(() => sfx('win'), 650); const r = v && v.result; if (v && r) celebrate(v); if (r) { const kind = r.linhas && Object.values(r.linhas)[0] ? B.lineKind(Object.values(r.linhas)[0]) : ''; speak(r.tipo === 'empate' ? 'Empate! Bingo para os dois!' : `Bingo! Três na ${KINDS[kind] || 'linha'}!`); } }
  function passTurn() {
    const was = g.over; g = B.passTurn(g); persist(); msg = '';
    if (!was && g.over) finishSound(); else sfx('tap');
    render(); schedule();
  }

  /* ================= peças de tela ================= */
  const pic = (v, id, cls) => imgEl(v.tema, id, v.salt, cls);
  const seg = (key, list, onPick) => h('div', { class: 'jg-seg bg-seg', role: 'radiogroup' }, ...list.map(([val, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(P[key] === val), class: P[key] === val ? 'on' : '', onclick: () => { P[key] = val; savePrefs(); if (onPick) onPick(val); else menu(); } }, label)));
  const sheetOpen = (title, build) => { modal++; stopTimer(); sheet(title, build, { onClose: () => { modal = Math.max(0, modal - 1); schedule(); } }); };

  const COMO = ['1  olhe a sua cartela', '2  o Paul sorteia um item: toque nele se você tem', '3 em linha = BINGO!'];
  const MODOS = [['solo', 'sozinho', 'você e o Paul'], ['online', 'com alguém', 'em 2 celulares'], ['mesmo', 'no mesmo aparelho', '2 jogadores'], ['sala', 'sala de aula', 'sorteador e cartelas']];

  /* ================= MENU ================= */
  function menu() {
    stopTimer(); auto = false; paused = false; left = 0; g = null; screen = 'menu'; leaveSpeech(); closeOverlay(); celebrated = false; prevMarks = {};
    const fresh = getGame(ID); // sempre lê de novo: a partida guardada muda enquanto a pessoa joga
    const resume = B.validGame(fresh.game) && !fresh.game.over && fresh.game.mode !== 'online' ? fresh.game : null;
    const sess = ON.lerSessao ? ON.lerSessao() : null;
    const pre = salaDoLink();
    const temaBtn = (t) => { const [id, nome] = t; const ico = THEME_ICON[id];
      const btn = h('button', { type: 'button', role: 'radio', 'aria-checked': String(P.tema === id), 'aria-label': nome, class: `jo-tema${P.tema === id ? ' on' : ''}`, onclick: () => { P.tema = id; savePrefs(); menu(); } });
      const icon = h('span', { class: 'jo-ticon', 'aria-hidden': 'true' }); if (id === 'artistas') icon.innerHTML = '<img src="assets/figurinhas/fotos/F001.jpeg" alt="" draggable="false">'; else icon.append(imgEl(id, ico, 'm'));
      btn.append(icon, h('b', {}, nome)); return btn; };
    const set = (k, v, extra) => { P[k] = v; if (extra) extra(v); savePrefs(); menu(); };
    const ICM = { solo: 'paul', online: 'celular', mesmo: 'dois', sala: 'sala' };
    const modo = (m) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(P.mode === m[0]), 'aria-label': `${m[1]}: ${m[2]}`, title: `${m[1]}: ${m[2]}`, class: `bv-modo bv-ic${P.mode === m[0] ? ' on' : ''}`, onclick: () => set('mode', m[0]) }, bq(ICM[m[0]]));
    const mais = h('details', { class: 'bv-mais', open: maisAberto ? '' : null, ontoggle: (e) => { maisAberto = e.target.open; } }, h('summary', {}, 'mais opções'),
      h('div', { class: 'jo-card' },
        P.mode !== 'sala' ? linha('marcar', chips([['auto', 'o jogo marca'], ['eu', 'eu marco']], P.marcar, (v) => set('marcar', v, (x) => { P.perfil = x === 'auto' ? 'kids' : 'classico'; }), 'Quem marca')) : null,
        linha('vitória', passo(B.VICTORIES, P.vitoria, (v) => set('vitoria', v), 'vitória por')),
        linha('sorteio', chips([['manual', 'eu aperto'], ['auto', 'automático']], P.draw, (v) => set('draw', v), 'Sorteio'), P.draw === 'auto' ? passo(INTERVALS.map((x) => [x, `${x} s`]), P.intervalo, (v) => set('intervalo', v), 'intervalo') : null),
        linha('voz do Paul', chips([[true, 'ligada'], [false, 'desligada']], !!P.voz, (v) => set('voz', v, (x) => { if (x) speak('A voz do Paul está ligada.'); else leaveSpeech(); }), 'Voz do Paul'))));
    root.replaceChildren(...[
      sess ? h('div', { class: 'bg-resume bv-volta' }, h('button', { class: 'btn primary bv-bigbtn', type: 'button', onclick: () => reconnect(sess) }, `voltar pra sala ${sess.code}`), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { ON.limparSessao(); menu(); } }, 'sair dessa sala')) : null,
      resume ? h('div', { class: 'bg-resume bv-volta' }, h('button', { class: 'btn primary bv-bigbtn', type: 'button', onclick: () => { g = resume; auto = g.draw === 'auto'; screen = 'play'; render(); schedule(); } }, 'continuar partida'), h('small', {}, `${B.THEME_NAME[resume.tema].toLowerCase()} · ${B.counter(resume).toLowerCase()}`)) : null,
      h('ol', { class: 'bv-como', 'aria-label': 'Como jogar' }, ...COMO.map((x) => h('li', {}, x))),
      h('p', { class: 'bv-tit' }, 'como quer jogar?'),
      h('div', { class: 'bv-modos', role: 'radiogroup', 'aria-label': 'Como quer jogar' }, ...MODOS.map(modo)),
      h('p', { class: 'bv-tit' }, 'tema'),
      h('div', { class: 'jo-temas', role: 'radiogroup', 'aria-label': 'Tema do bingo' }, ...B.THEME_LIST.map(temaBtn)),
      P.mode === 'mesmo' ? h('div', { class: 'bg-names' }, ...[0, 1].map((i) => h('label', { class: 'field' }, h('span', {}, `jogador ${i + 1}`), h('input', { type: 'text', maxlength: 14, value: P.names[i], 'aria-label': `Nome do jogador ${i + 1}`, onchange: (e) => { P.names[i] = (e.target.value.trim() || `Jogador ${i + 1}`).slice(0, 14); savePrefs(); } })))) : null,
      P.mode === 'online' ? onlineForm(pre) : null,
      P.mode === 'sala' ? h('button', { class: 'btn small', type: 'button', onclick: () => printSheet(P.tema) }, 'imprimir cartelas e fichas deste tema') : null,
      P.mode !== 'online' ? h('div', { class: 'bg-go' }, h('button', { class: 'btn primary bv-bigbtn bv-go', type: 'button', onclick: begin }, P.mode === 'sala' ? 'abrir o sorteador' : 'jogar')) : null,
      mais,
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
    const needName = () => { const n = nome.value.trim(); if (!n) { err.textContent = 'escreva seu nome primeiro'; nome.focus(); return null; } P.nome = n; savePrefs(); return n; };
    const create = async () => {
      const n = needName(); if (!n) return; err.textContent = 'criando a sala…'; P.seen = true;
      try {
        const s = await ON.salaCriar({ nome: n, tema: P.tema, perfil: P.perfil, vitoria: P.vitoria, modo: P.draw, intervalo: P.intervalo, autoMarcar: P.marcar === 'auto' });
        ON.salvarSessao(s); connect(s);
      } catch (e) { err.textContent = (e && e.message) || 'não consegui criar a sala. confira a internet e tente de novo'; }
    };
    const join = async () => {
      const n = needName(); if (!n) return; const c = code.value.trim(); if (c.length < 6) { err.textContent = 'o código tem 6 letras ou números'; return; }
      err.textContent = 'entrando…';
      try { const s = await ON.salaEntrar({ code: c, nome: n }); ON.salvarSessao(s); connect(s); } catch (e) { err.textContent = (e && e.message) || 'não achei essa sala. confira o código com quem criou'; }
    };
    return h('div', { class: 'bg-online' }, h('label', { class: 'field' }, h('span', {}, 'seu nome'), nome),
      h('div', { class: 'bg-go' }, h('button', { class: 'btn primary bv-bigbtn', type: 'button', onclick: create }, 'criar sala')),
      h('p', { class: 'jg-lab' }, 'ou entre na sala de um amigo'), h('div', { class: 'jg-actions row' }, code, h('button', { class: 'btn', type: 'button', onclick: join }, 'entrar com código')), err);
  }
  function connect(s) {
    on = { code: s.code, token: s.token, slot: s.slot, state: null, link: true, conn: null };
    on.conn = ON.conectar({ code: s.code, token: s.token, onEstado: (st) => { on.state = st; onState(); }, onLink: (ok) => { on.link = ok; if (screen !== 'menu') render(); schedule(); },
      onErro: (e) => { const m = (e && e.message) || 'essa sala não existe mais'; try { ON.limparSessao(); } catch { /* ok */ } on = null; stopTimer(); auto = false; menu(); toast(m, { ms: 4500 }); } });
    screen = 'lobby'; render();
  }
  async function reconnect(s) { connect(s); }
  let lastStatus = '';
  function onState() {
    const st = on.state; if (!st) return;
    if (st.status === 'lobby') { screen = 'lobby'; auto = false; pago = false; render(); return; }
    if (st.status === 'jogando' && !st.idx) pago = false;
    const first = screen !== 'play'; screen = 'play';
    if (first) { auto = (st.config.modo === 'auto'); paused = false; msg = ''; flash = false; }
    if (st.idx && lastStatus !== `${st.idx}`) { lastStatus = `${st.idx}`; if (st.idx > 0) { flash = !reduced(); sfx('draw'); announceNow(view()); } }
    if (st.status === 'fim' && st.resultado) { stopTimer(); finishSound(); }
    if (st.status === 'jogando' && !st.idx) { lastStatus = ''; celebrated = false; prevMarks = {}; closeOverlay(); }
    if (st.erro === 'invalido') msg = 'ainda não: precisa de 3 em linha que já saíram';
    render(); flash = false; schedule();
  }
  function lobby() {
    const st = on && on.state; const code = on.code; const host = !!(st && st.host); const other = st && st.outro;
    const invite = ON.linkConvite ? ON.linkConvite(code) : '';
    const copy = async (text, ok) => { try { await navigator.clipboard.writeText(text); toast(ok, { ms: 1800 }); } catch { toast('Copie manualmente: ' + text, { ms: 4000 }); } };
    root.replaceChildren(
      h('p', { class: 'jg-lab' }, 'código da sala: passe pro seu amigo'), h('div', { class: 'jg-code', role: 'status', 'aria-label': `código ${code.split('').join(' ')}` }, code),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn', type: 'button', onclick: () => copy(code, 'código copiado ✓') }, 'copiar código'), h('button', { class: 'btn', type: 'button', onclick: () => copy(invite, 'link copiado ✓') }, 'copiar link')),
      h('ul', { class: 'bg-players' }, h('li', {}, `${st && st.host ? st.eu.nome : (other ? other.nome : '…')} (criou a sala) ✓`), h('li', {}, other || !host ? `${host ? other.nome : (st ? st.eu.nome : '')} ${host ? (other.presente ? '✓ conectado' : '… ausente') : '✓'}` : 'esperando o outro jogador entrar…')),
      st ? h('p', { class: 'jg-p' }, `${B.THEME_NAME[st.config.tema]} · ${st.config.perfil === 'kids' ? 'o jogo marca' : 'cada um marca'} · ${(B.VICTORIES.find((x) => x[0] === st.config.vitoria) || [])[1]} · sorteio ${st.config.modo === 'auto' ? `automático (${st.config.intervalo} s)` : 'manual'}`) : null,
      host ? h('div', { class: 'bg-go' }, h('button', { class: 'btn primary bv-bigbtn', type: 'button', disabled: !(other && other.presente), onclick: async () => { try { await on.conn.iniciar(); } catch (e) { msg = (e && e.message) || ''; render(); } } }, 'começar')) : h('p', { class: 'jg-p muted' }, 'esperando quem criou a sala começar…'),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, on.link ? msg : 'sem internet… tentando de novo'),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: leaveOnline }, host ? 'fechar a sala' : 'sair da sala')));
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
    const text = id ? `Saiu: ${nameOf(v, id)}!` : 'aperte SORTEAR pro Paul começar';
    const sparks = flash && id ? h('span', { class: 'bg-sparks', 'aria-hidden': 'true' }, ...['✦', '★', '✦', '♪', '★', '♫'].map((c, i) => h('i', { style: `--a:${i * 60}deg;--d:${i * 0.05}s` }, c))) : null;
    const card = h('button', { type: 'button', class: `bg-call${flash ? ' flash' : ''}`, 'aria-label': id ? `Item sorteado: ${nameOf(v, id)}. Toque para ampliar` : 'Nenhum item sorteado ainda', disabled: !id || null, onclick: () => bigView(v, id) },
      sparks, id ? pic(v, id, 'bg-cpic') : h('span', { class: 'bg-cpic bg-empty', 'aria-hidden': 'true' }, '🎵'), h('b', {}, id ? nameOf(v, id) : 'vamos começar?'), v.mode === 'online' && !v.host ? h('small', {}, 'quem criou a sala sorteia pros dois') : null);
    return h('div', { class: 'bg-callwrap' }, h('div', { class: 'bg-paul' }, robo({ mood: id ? 'cheer' : 'happy', size: 46 }).el, h('p', { class: 'bg-say', role: 'status', 'aria-live': 'polite' }, text, id && v.mode !== 'sala' ? h('small', {}, ' você tem esse na cartela?') : null)), card);
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
    const canAuto = !v.over && (!v.online || v.host);
    const fim = v.idx >= v.total;
    const sortearTxt = fim ? 'acabou o sorteio' : v.online && !v.host ? 'quem criou sorteia' : 'SORTEAR';
    const drawBtn = h('button', { class: 'btn primary bv-bigbtn bg-draw', type: 'button', disabled: !v.canDraw || null, onclick: () => doDraw(false) }, sortearTxt);
    const bingoBtn = v.mode === 'sala' ? null : h('button', { class: 'btn primary bv-bigbtn bg-bingo', type: 'button', onclick: () => claim(v.mode === 'mesmo' ? v.active : 0) }, 'BINGO!');
    const waitTurn = v.mode === 'mesmo' && v.round && !v.round.done.every(Boolean);
    return h('div', { class: 'bg-ctl' },
      h('div', { class: 'bv-duo' }, drawBtn, bingoBtn),
      waitTurn ? h('p', { class: 'jg-p muted' }, v.round.active === 0 ? `falta ${v.cards[0].name} olhar a cartela e depois ${v.cards[1].name}` : `falta ${v.cards[1].name} olhar a cartela`) : null,
      h('div', { class: 'jg-actions row bv-peq' },
        canAuto ? h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(auto), onclick: () => setAuto(!auto) }, auto ? `automático: desligar (${v.interval || P.intervalo} s)` : 'sortear sozinho') : null,
        auto && canAuto ? h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(paused), onclick: () => setPaused(!paused) }, paused ? '▶ continuar' : '⏸ pausar') : null,
        h('button', { class: 'btn small ghost', type: 'button', disabled: !v.current || null, onclick: announceRepeat }, '🔁 repetir'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: historySheet }, '🕘 histórico')),
      auto && canAuto ? h('label', { class: 'bg-int' }, h('span', {}, 'intervalo'), h('select', { 'aria-label': 'Intervalo do sorteio automático', onchange: (e) => { const n = Number(e.target.value); P.intervalo = n; if (g) g.intervalo = n; savePrefs(); if (g) persist(); stopTimer(); render(); schedule(); } }, ...INTERVALS.map((s) => h('option', { value: s, selected: (v.interval || P.intervalo) === s ? '' : null }, `${s} segundos`)))) : null);
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
    if (r.tipo === 'empate') title = 'empate! bingo pros dois 🤝';
    else if (v.online) title = r.vencedores.includes(v.mySlot) ? 'você fez BINGO! 🤘' : `${v.other ? v.other.nome : 'o outro jogador'} fez BINGO!`;
    else if (v.cards.length > 1) title = `${v.cards[r.vencedores[0]].name} fez BINGO! 🤘`; else title = 'BINGO! você venceu 🤘';
    return h('div', { class: 'jg-result bg-result', role: 'status' }, h('h3', { class: 'hand' }, title), kind ? h('p', {}, `3 na ${kind}.`) : null,
      h('div', { class: 'jg-actions row' },
        v.online ? (v.host ? h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { await on.conn.iniciar(); } catch { /* ok */ } } }, 'jogar de novo') : h('span', { class: 'muted' }, 'quem criou a sala começa outra rodada')) : h('button', { class: 'btn primary', type: 'button', onclick: begin }, 'jogar de novo'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => (v.online ? leaveOnline() : menu()) }, 'voltar ao início')));
  }
  function statusBar(v) {
    const label = v.mode === 'online' ? (on.link ? `● online · sala ${on.code}` : '○ sem internet, tentando de novo…') : v.mode === 'mesmo' ? '2 jogadores · mesmo aparelho' : v.mode === 'sala' ? 'sala de aula · sorteador' : 'sozinho';
    return h('div', { class: 'bg-status' }, h('b', { 'aria-live': 'polite' }, `saíram ${v.idx} de ${v.total}`), h('span', { class: on && !on.link ? 'bad' : '' }, label),
      v.paused || (v.online && v.paused) ? h('span', { class: 'bad' }, '⏸ pausado') : null,
      v.online && v.other ? h('span', { class: v.other.presente ? '' : 'bad' }, v.other.presente ? `${v.other.nome} ✓` : `${v.other.nome} saiu da tela: sorteio parado`) : null);
  }

  function play() {
    const v = view(); if (!v) { menu(); return; }
    const mesmo = v.mode === 'mesmo'; const ci = v.active;
    const parts = [statusBar(v)];
    if (v.mode === 'sala') {
      parts.push(callCard(v), controls(v), h('p', { class: 'jg-p' }, `tema: ${B.THEME_NAME[v.tema].toLowerCase()} · vitória: ${((B.VICTORIES.find((x) => x[0] === v.vitoria) || [])[1] || '').toLowerCase()}. as cartelas de papel não ficam ligadas ao aparelho: todo mundo usa esta mesma sequência`),
        h('div', { class: 'jg-actions row' }, h('button', { class: 'btn small', type: 'button', onclick: () => printSheet(v.tema) }, '🖨 imprimir cartelas'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => fullscreen() }, 'tela cheia'), h('button', { class: 'btn small ghost', type: 'button', onclick: newRound }, 'nova rodada')),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost small', type: 'button', onclick: exitGame }, 'voltar ao início')));
      root.replaceChildren(...parts); return;
    }
    const hint = !v.over && linePending(v, mesmo ? ci : 0);
    parts.push(callCard(v), controls(v));
    const bb = parts[parts.length - 1].querySelector('.bg-bingo'); if (bb && hint) bb.classList.add('pulse');
    if (!v.over) parts.push(h('p', { class: 'bv-passo', role: 'status' }, hint ? 'você fez 3 em linha! aperte BINGO!' : !v.current ? '1 olhe a sua cartela · 2 aperte SORTEAR' : v.autoMarcar ? 'o jogo marca sozinho. fez 3 em linha? BINGO!' : 'tem esse item? toque nele na cartela. 3 em linha = BINGO!'));
    if (mesmo && !v.over) parts.push(h('div', { class: `bg-turn p${ci}`, role: 'status' }, v.round ? `vez de ${v.cards[ci].name}: ${v.autoMarcar ? 'olhe a cartela' : 'marque se tiver o item'} e passe a vez` : 'sorteie o primeiro item'));
    parts.push(cardGrid(v, mesmo ? ci : 0));
    parts.push(h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg));
    if (v.over) parts.push(resultPanel(v));
    else if (mesmo && v.round) parts.push(h('div', { class: 'jg-actions row bg-bingorow' }, h('button', { class: 'btn bg-pass', type: 'button', onclick: passTurn }, v.round.active === 0 ? `passar para ${v.cards[1].name}` : 'pronto: liberar o próximo sorteio')));
    parts.push(h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost small', type: 'button', onclick: exitGame }, v.online ? 'sair da sala' : 'voltar ao início')));
    root.replaceChildren(...parts);
  }
  async function exitGame() {
    if (on) { const v = view(); if (v && !v.over && v.idx > 0 && !(await confirmSheet('sair da sala?', 'você sai da partida e não volta mais pra essa sala.', 'sair'))) return; leaveOnline(); return; }
    stopTimer(); persist(); menu(); // partida local fica guardada: no início aparece "continuar partida"
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
    /** Pausa geral do app: segura o sorteio automático daqui (e a voz). Online, só o relógio local de quem sorteia; o outro jogador não é afetado. */
    pause() { if (extPaused) return; extPaused = true; left = due ? Math.max(0, due - Date.now()) : 0; stopTimer(); leaveSpeech(); },
    /** Retoma de onde parou: o próximo sorteio sai quando faltava. */
    resume() { if (!extPaused) return; extPaused = false; const l = left; left = 0; schedule(l > 0 ? l : undefined); },
    restart: async () => { if (screen === 'menu') return; const v = view(); if (v && !v.over && v.idx > 0 && !(await confirmSheet('começar de novo?', 'a partida atual será perdida.', 'começar de novo'))) return; if (on) { await leaveOnline(); return; } stopTimer(); g = null; persist(); menu(); },
    destroy() { gone = true; closeOverlay(); stopTimer(); leaveSpeech(); silence(); document.removeEventListener('visibilitychange', onVis); if (on && on.conn) { try { on.conn.fechar(); } catch { /* ok */ } } if (document.fullscreenElement) { try { document.exitFullscreen(); } catch { /* ok */ } } },
  };
}
