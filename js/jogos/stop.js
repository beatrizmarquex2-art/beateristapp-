// STOP musical Beaterista: tela. Regras em stop-logic.js, banco/validação em stop-valid.js, sons em stop-sfx.js.
// Texto digitado só entra na tela como texto (textContent / value), nunca como HTML.
import { h } from '../util.js';
import { confirmSheet, sheet, stars, toast } from '../ui.js';
import * as S from './stop-logic.js';
import { addCustom, bankSize } from './stop-valid.js';
import * as FX from './stop-sfx.js';
import { getGame, setGame } from './base.js';
import { lobby, linkBadge, salaAutoPara } from './online.js';
import { linha, chips, ajuda } from './opcoes.js';
import * as Q from './stop-sim-logic.js';
import { montarSimultaneo, garantirCss, caixaPausa } from './stop-simultaneo.js';

const ID = 'stop';
const PAUL = 'assets/paul/';
const MODE_LABEL = { solo: 'individual', dupla: 'dupla', sala: 'sala de aula', online: '2 celulares' };
const STATUS = { valida: ['válida', '✔'], invalida: ['inválida', '✖'], pendente: ['aguardando revisão', '?'] };
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const sleepToken = (ms, fn) => setTimeout(fn, ms);

export function mount(host, opts) {
  const M = opts && opts.mission ? opts.mission : null; // Modo Aventura: partida montada pelos params, sem ler nem gravar nada do Modo Livre
  const saved = M ? {} : getGame(ID);
  const prefs = {
    mode: ['solo', 'dupla', 'sala', 'online'].includes(saved.mode) ? saved.mode : 'solo',
    cats: S.catsOk(saved.cats) ? saved.cats : S.randomCats(6),
    seconds: Number.isInteger(saved.seconds) && saved.seconds >= 10 && saved.seconds <= 600 ? saved.seconds : 60,
    rounds: Number.isInteger(saved.rounds) && saved.rounds >= 1 && saved.rounds <= 20 ? saved.rounds : 3,
    names: Array.isArray(saved.names) && saved.names.length >= 2 ? saved.names.slice(0, S.MAX_PLAYERS).map((n) => String(n).slice(0, 20)) : ['jogador 1', 'jogador 2'],
    sim: saved.sim !== false, // 2 celulares: 'ao mesmo tempo' (padrão) ou 'um de cada vez'
    salaNames: Array.isArray(saved.salaNames) && saved.salaNames.length >= 2 ? saved.salaNames.slice(0, S.MAX_PLAYERS).map((n) => String(n).slice(0, 20)) : ['aluno 1', 'aluno 2', 'aluno 3'],
  };
  const save = (patch = {}) => { Object.assign(prefs, patch); if (!M) setGame(ID, { ...prefs }); };
  const favs = () => (S.catsOk(getGame(ID).fav) ? getGame(ID).fav : null);
  let g = null; let view = 'intro'; let gone = false; let token = 0; let introSeen = false; let reported = false;
  let conn = null; let lob = null; let sim = null; let paused = false; let remain = 0; let tickRef = null; let pauseEl = null; const badge = linkBadge();
  let clk = 0; let deadline = 0; let timeEl = null; let live = null; let lastSec = -1; let locked = false; let revealed = false; let skipReveal = false; const timers = new Set();
  const root = h('div', { class: 'jg jg-stop st' }); host.replaceChildren(root);
  const me0 = () => (conn ? conn.me : 0);
  const pn = (p) => (g.online ? (p === me0() ? 'você' : 'o outro') : g.players[p]);
  const ro = () => !!(g && g.online && me0() !== 0); // 2 celulares: quem criou a sala revisa; o outro acompanha
  const later = (fn, ms) => { const id = sleepToken(ms, () => { timers.delete(id); if (!gone) fn(); }); timers.add(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
  const stopClock = () => { clearInterval(clk); clk = 0; };
  const nextToken = () => { token++; stopClock(); clearTimers(); locked = false; paused = false; pauseEl = null; root.classList.remove('ss-pausado'); return token; };
  const persist = () => { if (M || (g && g.online)) return; setGame(ID, { match: g && g.stage !== 'done' ? g : null }); };
  const leave = () => { if (sim) { sim.destroy(); sim = null; } if (conn) { conn.close(); conn = null; } if (lob) { lob.close(); lob = null; } };
  const sync = () => { if (conn && g && g.online) conn.push(g); };
  const motion = () => !FX.reducedMotion();
  const sr = (t) => { if (live) live.textContent = t; };
  const mk = (tag, cls, ...kids) => h(tag, { class: cls }, ...kids);
  const goalOf = () => (M && M.params ? M.params.goal : 0);
  /** Modo Aventura: lembra a meta e o que já foi somado (pontos confirmados; pendente não conta). */
  const missionLine = () => (M && g ? h('p', { class: 'jg-p muted st-mission', role: 'status' }, `missão: meta de ${goalOf()} pontos · você tem ${g.totals[0]} · máximo possível ${g.rounds * g.cats.length * S.POINTS.unique}`) : null);

  /* ================= abertura (fliperama) ================= */
  function sticks() { // baquetas cruzando (SVG de verdade, com o namespace certo)
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); el.setAttribute('class', 'st-sticks'); el.setAttribute('viewBox', '0 0 120 60'); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<g stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M12 8L108 52" class="a"/><path d="M108 8L12 52" class="b"/></g><circle cx="12" cy="8" r="5" fill="currentColor"/><circle cx="108" cy="8" r="5" fill="currentColor"/>'; return el;
  }
  function intro() {
    nextToken(); leave(); view = 'intro'; g = null; FX.stopAll();
    const quick = introSeen || !motion();
    root.replaceChildren(h('div', { class: `st-intro${quick ? ' quick' : ''}` },
      h('div', { class: 'st-notes', 'aria-hidden': 'true' }, ...['♪', '♫', '♩', '♬', '♪', '♫'].map((n, i) => h('i', { style: `--i:${i}` }, n))),
      h('p', { class: 'st-logo' }, 'beaterista'),
      h('h2', { class: 'st-title', 'aria-label': 'STOP musical' }, ...'STOP'.split('').map((l, i) => h('span', { style: `--i:${i}`, 'aria-hidden': 'true' }, l))),
      h('p', { class: 'st-sub' }, 'musical'),
      sticks(),
      h('img', { class: 'st-paul', src: `${PAUL}e04.webp`, alt: '', draggable: 'false', decoding: 'async' }),
      h('button', { class: 'btn primary st-play', type: 'button', onclick: () => { introSeen = true; FX.play('intro'); FX.vibrate(15); setup(); } }, 'JOGAR'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: audioPanel }, 'som e animações')));
  }

  /* ================= opções da partida ================= */
  function setup() {
    nextToken(); leave(); view = 'setup'; g = null; FX.startMusic();
    const eligible = S.lettersFor(prefs.cats); const okCats = S.catsOk(prefs.cats); const resume = S.validMatch(saved.match) && saved.match.stage !== 'done' ? saved.match : null;
    const seg = (list, cur, on, label) => h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': label }, ...list.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(cur === v), class: cur === v ? 'on' : '', onclick: () => { FX.play('tap'); on(v); } }, l)));
    const toggle = (id) => {
      const has = prefs.cats.includes(id);
      if (!has && prefs.cats.length >= S.MAX_CATS) { toast(`no máximo ${S.MAX_CATS} categorias`, { id: 'stop-cats' }); return; }
      save({ cats: has ? prefs.cats.filter((c) => c !== id) : [...prefs.cats, id] }); FX.play('tap'); setup();
    };
    const simOn = prefs.mode === 'online' && prefs.sim;
    const secs = prefs.mode === 'sala' ? [...S.SECONDS, 0] : S.SECONDS; const secsLabel = (v) => (v === 0 ? 'outro' : `${v} s`);
    const customSecs = prefs.mode === 'sala' && !S.SECONDS.includes(prefs.seconds);
    const roundsList = prefs.mode === 'sala' ? [...S.ROUNDS, 0] : S.ROUNDS; const customRounds = prefs.mode === 'sala' && !S.ROUNDS.includes(prefs.rounds);
    const namesBox = () => {
      if (prefs.mode === 'dupla') return h('div', { class: 'st-names' }, ...[0, 1].map((i) => h('label', { class: 'jg-field' }, h('span', {}, `nome do jogador ${i + 1}`), h('input', { type: 'text', value: prefs.names[i], maxlength: 20, autocomplete: 'off', oninput: (e) => { const n = prefs.names.slice(); n[i] = e.target.value; save({ names: n }); } }))));
      if (prefs.mode === 'sala') return h('div', { class: 'st-names' }, h('p', { class: 'jg-lab' }, `participantes (${prefs.salaNames.length})`),
        ...prefs.salaNames.map((nm, i) => h('div', { class: 'st-namerow' }, h('input', { type: 'text', value: nm, maxlength: 20, 'aria-label': `participante ${i + 1}`, autocomplete: 'off', oninput: (e) => { const n = prefs.salaNames.slice(); n[i] = e.target.value; save({ salaNames: n }); } }),
          h('button', { class: 'btn small ghost', type: 'button', disabled: prefs.salaNames.length <= 2, 'aria-label': `tirar participante ${i + 1}`, onclick: () => { save({ salaNames: prefs.salaNames.filter((_, k) => k !== i) }); setup(); } }, '✕'))),
        h('button', { class: 'btn small', type: 'button', disabled: prefs.salaNames.length >= S.MAX_PLAYERS, onclick: () => { save({ salaNames: [...prefs.salaNames, `aluno ${prefs.salaNames.length + 1}`] }); setup(); } }, '+ participante'));
      return null;
    };
    const catBtns = S.CATS.map((c) => { const on = prefs.cats.includes(c.id); return h('button', { type: 'button', class: `st-cat${on ? ' on' : ''}`, 'aria-pressed': String(on), onclick: () => toggle(c.id) }, h('i', { 'aria-hidden': 'true' }, on ? '✔' : ''), h('span', {}, c.label)); });
    const start = () => {
      if (!okCats || !eligible.length) return;
      save({}); try { begin(newMatch()); } catch (e) { toast(e.message === 'sem-letra' ? 'nenhuma letra serve pra essas categorias' : e.message); }
    };
    root.replaceChildren(...[
      h('div', { class: 'st-head' }, h('h2', { class: 'jg-h hand' }, 'STOP musical'), h('div', { class: 'st-tools' }, h('button', { class: 'btn small ghost', type: 'button', onclick: audioPanel }, '⚙ som'), h('button', { class: 'btn small ghost', type: 'button', onclick: historyPanel }, 'histórico'))),
      h('div', { class: 'jo-card' },
        linha('quem joga', chips([['solo', 'individual', 'um'], ['dupla', 'dupla', 'dois'], ['sala', 'sala de aula', 'sala'], ['online', '2 celulares', 'celular']], prefs.mode, (v) => { FX.play('tap'); save({ mode: v }); setup(); }, 'modo de jogo'),
          ajuda('Como funciona', prefs.mode === 'dupla' ? 'um celular só: cada um joga o seu turno, com a mesma letra, as mesmas categorias e o mesmo tempo. as respostas ficam escondidas até o fim da rodada.'
            : prefs.mode === 'sala' ? 'modo professor: de 2 a 12 participantes jogam um depois do outro neste aparelho. você escolhe tempo e rodadas, revisa as respostas e aprova ou rejeita as contestadas.'
            : prefs.mode === 'online' ? (prefs.sim ? 'cada um joga no seu celular ao mesmo tempo, com a mesma letra. quem apertar STOP primeiro para o outro também. quem cria a sala revisa as respostas.' : 'cada um joga no seu celular, um depois do outro (turnos). quem cria a sala revisa as respostas.')
            : 'escreva uma palavra de cada categoria que comece com a letra sorteada. 10 pontos por resposta válida e única, 5 se outro jogador escreveu a mesma.'))),
      prefs.mode === 'online' ? h('div', { class: 'jo-card' }, linha('como', chips([['sim', 'ao mesmo tempo'], ['turnos', 'um de cada vez']], prefs.sim ? 'sim' : 'turnos', (v) => { FX.play('tap'); save({ sim: v === 'sim' }); setup(); }, 'como jogar em 2 celulares'))) : null,
      namesBox(),
      h('p', { class: 'jg-lab' }, `categorias: ${prefs.cats.length} escolhida${prefs.cats.length === 1 ? '' : 's'} (de ${S.MIN_CATS} a ${S.MAX_CATS})`),
      h('div', { class: 'st-cats', role: 'group', 'aria-label': 'categorias' }, ...catBtns),
      h('div', { class: 'jg-actions row st-catact' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { save({ cats: S.randomCats(5 + Math.floor(Math.random() * 4)) }); FX.play('tap'); setup(); } }, '🎲 sortear'),
        h('button', { class: 'btn small', type: 'button', disabled: !favs(), onclick: () => { save({ cats: favs() }); setup(); } }, '★ minhas favoritas'),
        h('button', { class: 'btn small', type: 'button', disabled: !okCats, onclick: () => { setGame(ID, { fav: prefs.cats }); toast('categorias favoritas salvas'); setup(); } }, 'salvar como favoritas'),
        h('button', { class: 'btn small', type: 'button', disabled: !S.catsOk(getGame(ID).last), onclick: () => { save({ cats: getGame(ID).last }); setup(); } }, 'repetir a última'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { save({ cats: [] }); setup(); } }, 'limpar')),
      h('p', { class: `st-warn${okCats && eligible.length ? ' ok' : ''}`, role: 'status', 'aria-live': 'polite' }, !okCats ? `escolha de ${S.MIN_CATS} a ${S.MAX_CATS} categorias pra começar` : eligible.length ? `${eligible.length} de 16 letras servem pra essa escolha` : 'nenhuma letra serve pra todas essas categorias juntas. troque alguma categoria.'),
      h('div', { class: 'jo-card' },
        linha('tempo', seg(secs.map((v) => [v, secsLabel(v)]), customSecs ? 0 : prefs.seconds, (v) => { save({ seconds: v === 0 ? 45 : v }); setup(); }, 'tempo por jogador')),
        customSecs ? h('label', { class: 'jg-field' }, h('span', {}, 'segundos (10 a 600)'), h('input', { type: 'number', inputmode: 'numeric', min: 10, max: 600, value: prefs.seconds, onchange: (e) => { const n = Math.round(Number(e.target.value)); save({ seconds: Math.min(600, Math.max(10, n || 60)) }); setup(); } })) : null,
        simOn ? null : linha('rodadas', seg(roundsList.map((v) => [v, v === 0 ? 'outro' : String(v)]), customRounds ? 0 : prefs.rounds, (v) => { save({ rounds: v === 0 ? 4 : v }); setup(); }, 'rodadas')),
        customRounds && !simOn ? h('label', { class: 'jg-field' }, h('span', {}, 'rodadas (1 a 20)'), h('input', { type: 'number', inputmode: 'numeric', min: 1, max: 20, value: prefs.rounds, onchange: (e) => { const n = Math.round(Number(e.target.value)); save({ rounds: Math.min(20, Math.max(1, n || 3)) }); setup(); } })) : null,
        linha('conferência', ajuda('Como o jogo confere', 'sem diferença de maiúscula, acento ou espaço. “the beatles” vale B (o artigo não conta). se o jogo não conhece a resposta, ela fica amarela, “aguardando revisão”: você decide, e o que for aprovado entra no banco deste aparelho.'))),
      prefs.mode === 'online' ? (lob = lobby({ jogo: ID, makeState: () => (prefs.sim ? newSim() : { ...newMatch('dupla'), online: true }), onStart: startOnline })).el
        : h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => resumeMatch(resume) }, 'continuar partida') : null,
          h('button', { class: `btn ${resume ? '' : 'primary'}`, type: 'button', disabled: !okCats || !eligible.length, onclick: start }, resume ? 'nova partida' : 'iniciar')),
    ].filter(Boolean));
  }
  /** Sala 'ao mesmo tempo': mesma letra e mesmas categorias nos dois celulares. */
  function newSim() {
    const st = Q.novoEstado({ cats: prefs.cats, seconds: S.SECONDS.includes(prefs.seconds) ? prefs.seconds : 60, usadas: getGame(ID).cycle || [] });
    setGame(ID, { cycle: st.usadas, last: prefs.cats }); return st;
  }
  function newMatch(forceMode) {
    const mode = forceMode || prefs.mode; const used = getGame(ID).cycle || [];
    const players = mode === 'dupla' ? prefs.names : mode === 'sala' ? prefs.salaNames : [prefs.names[0] === 'jogador 1' ? 'você' : prefs.names[0]];
    const m = S.newMatch({ mode: mode === 'online' ? 'dupla' : mode, cats: prefs.cats, seconds: prefs.seconds, rounds: prefs.rounds, players: forceMode === 'dupla' && prefs.mode === 'online' ? ['jogador 1', 'jogador 2'] : players, used });
    setGame(ID, { cycle: m.cycle, last: prefs.cats }); return m;
  }
  /** Modo Aventura: monta a partida individual dos params e vai direto pra primeira vez de jogar. */
  function startMission() {
    const q = M.params || {}; nextToken(); leave(); view = 'cover'; FX.stopAll();
    try { begin(S.newMatch({ mode: 'solo', cats: q.cats, seconds: q.seconds, rounds: q.rounds, players: ['você'], letters: q.letters, free: true })); } catch (e) { toast(e.message === 'sem-letra' ? 'nenhuma letra serve pra essas categorias' : e.message); }
  }
  function begin(m) { g = m; persist(); turnStart(); }
  function resumeMatch(m) { g = m; if (g.stage === 'review') { revealed = true; return reviewView(); } turnStart(); }

  /* ================= online (2 celulares, por turnos) ================= */
  function startSim(c, state) {
    conn = c; lob = null; nextToken(); view = 'sim'; g = null; badge.set(true); FX.stopMusic();
    if (!Q.estadoValido(state)) { toast('não consegui abrir essa sala'); return setup(); }
    sim = montarSimultaneo({ root, conn: c, estado: state, badge, sair: () => setup() });
  }
  function startOnline(c, state) { if (state && state.sim) return startSim(c, state); conn = c; lob = null; badge.set(true); c.on.link = (v) => badge.set(v); c.on.state = (st) => { g = st; route(); }; g = state; route(); }
  function route() {
    if (g.stage === 'done') return finalView();
    if (g.stage === 'review') { if (view === 'play') nextToken(); revealed = false; return reviewView(); }
    if (g.turn === me0()) { if (view === 'play' || view === 'draw') return; return turnStart(); }
    waiting();
  }
  function waiting() {
    nextToken(); view = 'waiting';
    root.replaceChildren(badge.el, h('div', { class: 'jg-cover2', role: 'status' }, h('p', { class: 'hand' }, 'esperando o outro jogar…'), h('p', { class: 'muted' }, `rodada ${g.round + 1} de ${g.rounds} · as respostas dele ficam escondidas até o fim`),
      g.history.length ? h('p', {}, `acumulado: ${g.totals.map((t, p) => `${pn(p)} ${t}`).join(' · ')}`) : null));
  }

  /* ================= vez de jogar: passagem → sorteio → 3,2,1 → resposta ================= */
  function turnStart() {
    nextToken(); view = 'cover';
    const first = g.turn === 0; const solo = g.players.length === 1;
    const who = solo ? `rodada ${g.round + 1} de ${g.rounds}` : g.online ? `sua vez! rodada ${g.round + 1} de ${g.rounds}` : `passe o aparelho para ${pn(g.turn)}`;
    root.replaceChildren(g.online ? badge.el : null, h('div', { class: 'jg-cover2', role: 'dialog', 'aria-label': 'passagem' },
      h('p', { class: 'hand' }, who), g.players.length > 1 && !g.online ? h('p', { class: 'muted' }, `rodada ${g.round + 1} de ${g.rounds} · as respostas anteriores ficam escondidas`) : null,
      h('p', {}, `${g.cats.length} categorias · ${clock(g.seconds)} · ${first ? 'a letra será sorteada' : `letra ${S.letterOf(g)}`}`), missionLine(),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { FX.play('tap'); first ? drawView() : countdown(); } }, first ? 'sortear a letra' : 'pronto')));
    const b = root.querySelector('.jg-cover2 button'); if (b) b.focus({ preventScroll: true });
  }
  /** O sorteio já foi feito pela lógica (letterOf); a animação só mostra. */
  function drawView() {
    const my = nextToken(); view = 'draw'; const L = S.letterOf(g); FX.stopMusic();
    const big = h('div', { class: 'st-reel', role: 'status', 'aria-label': 'sorteando a letra' }, '?');
    root.replaceChildren(g.online ? badge.el : null, h('div', { class: 'st-drawbox' }, h('p', { class: 'hand' }, 'sorteando a letra…'), big, h('p', { class: 'muted' }, `${g.cats.length} categorias`)));
    const land = () => { big.textContent = L; big.classList.add('land'); big.setAttribute('aria-label', `letra ${L}`); sr(`letra ${L}`); FX.play('reveal'); FX.vibrate(40); later(() => { if (token === my) countdown(); }, motion() ? 900 : 400); };
    if (!motion()) return land();
    FX.play('spin'); let i = 0; const total = 16;
    const spin = () => { if (token !== my || gone) return; if (i >= total) return land(); big.textContent = S.LETTERS[Math.floor(Math.random() * S.LETTERS.length)]; i++; later(spin, 40 + i * i * 1.2); };
    spin();
  }
  function countdown() {
    const my = nextToken(); view = 'draw'; const L = S.letterOf(g);
    const num = h('div', { class: 'st-count', role: 'status', 'aria-live': 'assertive' }, '3');
    root.replaceChildren(g.online ? badge.el : null, h('div', { class: 'st-drawbox' }, h('p', { class: 'hand' }, `letra ${L}`), h('div', { class: 'st-reel land' }, L), num));
    const step = (n) => { if (token !== my) return; if (n === 0) { FX.play('count', 'go'); num.textContent = 'valendo!'; return later(() => { if (token === my) playView(); }, 350); } num.textContent = String(n); num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); FX.play('count'); later(() => step(n - 1), motion() ? 750 : 500); };
    step(3);
  }

  /* ================= resposta ================= */
  function playView() {
    const my = nextToken(); view = 'play'; const L = S.letterOf(g); const p = g.turn; const ans = g.cur.answers[p]; let saveT = 0;
    live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
    const bar = h('i', { class: 'st-bar-in' }); const count = h('b', {}, '0'); const inputs = [];
    const filled = () => inputs.filter((i) => i.value.trim()).length;
    const upd = () => { const f = filled(); count.textContent = String(f); bar.style.width = `${(f / g.cats.length) * 100}%`; };
    const fields = g.cats.map((cid, c) => {
      const inp = h('input', { type: 'text', value: ans[c], autocomplete: 'off', autocapitalize: 'words', autocorrect: 'off', spellcheck: 'false', maxlength: 80, enterkeyhint: c === g.cats.length - 1 ? 'done' : 'next', 'data-c': c, 'aria-label': `${S.CAT[cid].label}, letra ${L}`,
        oninput: (e) => { if (locked) return; g = S.setAnswer(g, p, c, e.target.value); row.classList.toggle('done', !!e.target.value.trim()); upd(); clearTimeout(saveT); saveT = setTimeout(persist, 500); },
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); const n = inputs[c + 1]; if (n) n.focus(); else inp.blur(); } },
        onfocus: () => { inp.scrollIntoView({ block: 'center', behavior: motion() ? 'smooth' : 'auto' }); } });
      const row = h('label', { class: `jg-field st-field${ans[c].trim() ? ' done' : ''}` }, h('span', {}, S.CAT[cid].label, h('em', { 'aria-hidden': 'true' }, ' ✔')), inp);
      inputs.push(inp); return row;
    });
    timeEl = h('b', { class: 'st-time', role: 'timer', 'aria-label': 'tempo restante' }, clock(g.seconds));
    const stopBtn = h('button', { class: 'st-stop', type: 'button', onclick: () => stopPress(stopBtn) }, 'STOP!');
    root.replaceChildren(...[g.online ? badge.el : null, live,
      h('div', { class: 'st-top' }, h('div', { class: 'jg-who' }, h('b', {}, pn(p)), h('span', {}, `rodada ${g.round + 1}/${g.rounds}`)), h('div', { class: 'st-letter', 'aria-label': `letra ${L}` }, L), h('div', { class: 'jg-who st-timebox' }, h('b', {}, 'tempo'), timeEl)),
      h('div', { class: 'st-progress' }, h('span', {}, count, ` de ${g.cats.length} preenchidos`), h('div', { class: 'st-bar' }, bar)),
      M ? missionLine() : null,
      h('p', { class: 'jg-msg', 'aria-live': 'assertive' }),
      h('div', { class: 'jg-fields st-fields' }, ...fields),
      h('div', { class: 'st-stopbar' }, stopBtn)].filter(Boolean));
    upd(); const f = inputs[0]; if (f) f.focus({ preventScroll: true });
    deadline = Date.now() + g.seconds * 1000; lastSec = -1; // tempo real decorrido: teclado, giro de tela e troca de aba não mexem nele
    const tick = () => { if (token !== my) return; const rem = deadline - Date.now(); const sec = Math.max(0, Math.ceil(rem / 1000));
      timeEl.textContent = clock(sec); const box = root.querySelector('.st-timebox');
      if (box) { box.classList.toggle('warn', sec <= 10 && sec > 5); box.classList.toggle('hot', sec <= 5); box.classList.toggle('last', sec <= 3); }
      if (sec !== lastSec) { lastSec = sec; if (sec > 0 && sec <= 3) FX.play('last3'); else if (sec > 0 && sec <= 10) FX.play('metro'); if (sec === 10 || sec === 5) sr(`${sec} segundos`); }
      if (rem <= 0) timeUp(my); };
    tickRef = tick; clk = setInterval(tick, 200); tick();
  }
  function freeze() { locked = true; stopClock(); root.querySelectorAll('.st-field input').forEach((i) => { i.readOnly = true; i.blur(); }); const b = root.querySelector('.st-stop'); if (b) b.disabled = true; }
  function usedSec() { return Math.min(g.seconds, Math.max(0, g.seconds - (deadline - Date.now()) / 1000)); }
  function stopPress(btn) {
    if (locked || paused || view !== 'play') return; const used = usedSec(); freeze(); const my = token; // um clique só: trava na hora
    FX.play('stop'); FX.duck(2500); FX.vibrate([40, 30, 70]);
    if (motion()) { btn.classList.add('hit'); root.classList.add('shake'); const ov = h('div', { class: 'st-stopword', 'aria-hidden': 'true' }, 'STOP!'); root.append(ov); later(() => { ov.remove(); root.classList.remove('shake'); }, 900); }
    sr('stop!'); later(() => { if (token === my) endTurn(used, true); }, motion() ? 800 : 150);
  }
  function timeUp(my) {
    if (locked || view !== 'play') return; freeze(); FX.play('timeup'); FX.vibrate(180); const m = root.querySelector('.jg-msg'); if (m) m.textContent = 'tempo! suas respostas foram guardadas.'; sr('tempo esgotado');
    later(() => { if (token === my) endTurn(g.seconds, false); }, motion() ? 1000 : 300);
  }
  function endTurn(used, byStop) {
    root.querySelectorAll('.st-field input').forEach((i) => { const c = Number(i.dataset.c); if (i.value !== g.cur.answers[g.turn][c]) g = S.setAnswer(g, g.turn, c, i.value); }); // texto final garantido
    g = S.finishTurn(g, used, byStop); persist(); sync(); stopClock(); live = null;
    if (g.stage === 'review') { revealed = false; skipReveal = false; return reviewView(); }
    if (g.online) return waiting();
    turnStart();
  }

  /* ================= correção ================= */
  function reviewView() {
    const my = nextToken(); view = 'review'; const L = S.letterOf(g); const RO = ro(); const sc = S.scoreRound(g); const np = g.players.length;
    const pend = sc.pending.reduce((a, b) => a + b, 0);
    const cards = g.cats.map((cid, c) => {
      const rows = g.players.map((_, p) => {
        const r = sc.res[p][c]; const pt = sc.points[p][c]; const txt = g.cur.answers[p][c].trim(); const [lab, ico] = STATUS[r.status];
        const empty = r.empty;
        return h('div', { class: `st-ans ${r.status}${revealed ? '' : ' hid'}`, 'data-st': r.status, 'data-pt': pt == null ? '' : String(pt) },
          h('span', { class: 'st-who' }, pn(p)), h('span', { class: 'st-txt' }, empty ? '(vazio)' : txt),
          h('span', { class: 'st-badge', role: 'status' }, h('i', { 'aria-hidden': 'true' }, ico), ` ${empty ? 'vazia' : lab}`, h('b', {}, pt == null ? ' ?' : ` +${pt}`.replace('+0', '0'))),
          h('small', { class: 'muted' }, r.manual ? `decisão da revisão: ${r.why}` : r.status === 'valida' ? (r.name && keyDiff(r.name, txt) ? `reconhecida como “${r.name}”` : '') : r.why),
          r.suggest && !r.manual && !RO ? h('button', { class: 'btn small', type: 'button', onclick: () => { g = S.decide(g, p, c, 'valida', { why: `grafia corrigida pra “${r.suggest}”`, by: byWho(), canon: r.suggestId }); persist(); sync(); reviewView(); } }, `era “${r.suggest}”`) : null,
          !RO && !empty ? h('button', { class: 'btn small ghost st-contest', type: 'button', onclick: () => contest(p, c) }, 'contestar resposta') : null);
      });
      return h('div', { class: 'jg-rv st-card' }, h('b', {}, S.CAT[cid].label), ...rows,
        np > 1 ? h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', disabled: RO ? true : null, checked: g.cur.equiv[c] ? true : null, onchange: (e) => { g = S.setEquiv(g, c, e.target.checked); persist(); sync(); reviewView(); } }), ' as respostas válidas são equivalentes (valem 5)') : null);
    });
    const totals = h('div', { class: 'st-totals', role: 'status', 'aria-live': 'polite' }, ...g.players.map((_, p) => h('span', {}, h('b', {}, pn(p)), ` ${sc.sums[p]} pts`, sc.pending[p] ? h('em', {}, ` (+${sc.pending[p]} pendente${sc.pending[p] > 1 ? 's' : ''})`) : null)));
    root.replaceChildren(...[g.online ? badge.el : null,
      h('h2', { class: 'jg-h hand' }, `correção · letra ${L}`),
      h('p', { class: 'jg-p' }, RO ? 'quem criou a sala está revisando. as marcas aparecem aqui.' : pend ? `${pend} resposta${pend > 1 ? 's' : ''} que o jogo não conhece. toque em “contestar resposta” pra aprovar ou rejeitar.` : 'confira e confirme a rodada.'),
      revealed ? null : h('button', { class: 'btn small ghost st-skip', type: 'button', onclick: () => { skipReveal = true; root.querySelectorAll('.st-ans.hid').forEach((e) => e.classList.remove('hid')); } }, 'pular animação'),
      ...cards, totals,
      RO ? null : h('div', { class: 'jg-actions' },
        h('button', { class: 'btn primary', type: 'button', disabled: pend > 0, onclick: () => confirmReview(false) }, pend ? `resolva as ${pend} pendente${pend > 1 ? 's' : ''}` : 'confirmar rodada'),
        pend ? h('button', { class: 'btn ghost', type: 'button', onclick: () => confirmReview(true) }, 'deixar pendentes (valem 0 por enquanto)') : null)].filter(Boolean));
    if (revealed) return;
    // revelação progressiva: uma resposta de cada vez, com o som do resultado (sem repetir efeito em cima de efeito)
    const els = [...root.querySelectorAll('.st-ans.hid')]; let k = 0;
    const next = () => {
      if (token !== my || skipReveal || !els.length || k >= els.length) { els.forEach((e) => e.classList.remove('hid')); revealed = true; return; }
      const e = els[k++]; e.classList.remove('hid'); e.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      const stt = e.dataset.st; if (e.querySelector('.st-txt').textContent !== '(vazio)' || stt !== 'invalida') FX.play(stt === 'valida' ? (e.dataset.pt === '10' ? 'points' : 'ok') : stt === 'pendente' ? 'pending' : 'bad');
      later(next, e.querySelector('.st-txt').textContent === '(vazio)' ? 120 : 420);
    };
    if (!motion()) { els.forEach((e) => e.classList.remove('hid')); revealed = true; return; }
    later(next, 300);
  }
  const keyDiff = (a, b) => a.toLowerCase().replace(/[^a-z0-9]/g, '') !== b.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byWho = () => (g.mode === 'sala' ? 'professor' : g.mode === 'dupla' ? 'jogadores (acordo)' : 'jogador');

  /** Contestar: aprovar, rejeitar ou voltar ao automático, com motivo. Aprovada pode entrar no banco deste aparelho. */
  function contest(p, c) {
    const r = S.eff(g, p, c); const txt = g.cur.answers[p][c].trim();
    sheet('contestar resposta', (close) => {
      const why = h('input', { type: 'text', maxlength: 160, placeholder: 'motivo (opcional)', 'aria-label': 'motivo da decisão' });
      const agree = h('input', { type: 'checkbox' }); const saveBank = h('input', { type: 'checkbox', checked: !M });
      const needAgree = g.mode === 'dupla';
      const apply = (d) => {
        if (needAgree && !agree.checked) { toast('os dois precisam concordar com a decisão'); return; }
        g = S.decide(g, p, c, d, { why: why.value.trim() || (d === 'valida' ? 'aprovada na revisão' : d === 'invalida' ? 'rejeitada na revisão' : 'voltou ao automático'), by: byWho() });
        if (d === 'valida' && !M && saveBank.checked) addCustom(g.cats[c], txt);
        persist(); sync(); FX.play(d === 'valida' ? 'ok' : 'bad'); close(); reviewView();
      };
      return h('div', { class: 'sheet-body st-contest' },
        h('p', {}, h('b', {}, txt), ` · ${S.CAT[g.cats[c]].label} · letra ${S.letterOf(g)}`), h('p', { class: 'muted' }, `agora: ${STATUS[r.status][0]}${r.why ? ` (${r.why})` : ''}`), why,
        M ? null : h('label', { class: 'jg-chk' }, saveBank, ' ao aprovar, guardar no banco deste aparelho'),
        needAgree ? h('label', { class: 'jg-chk' }, agree, ' os dois jogadores concordam') : null,
        h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => apply('valida') }, 'aprovar'), h('button', { class: 'btn', type: 'button', onclick: () => apply('invalida') }, 'rejeitar'),
          r.manual ? h('button', { class: 'btn ghost', type: 'button', onclick: () => apply(null) }, 'voltar ao automático') : null));
    });
  }
  function confirmReview(allow) {
    try { g = S.confirmRound(g, { allowPending: allow }); } catch { return toast('ainda há respostas pendentes'); }
    persist(); sync(); summaryView();
  }

  /* ================= resumo da rodada ================= */
  function summaryView() {
    const my = nextToken(); view = 'summary'; const hst = g.history[g.history.length - 1]; const last = g.stage === 'done'; const perfect = hst.perfect.map((x, p) => (x ? p : -1)).filter((p) => p >= 0);
    root.replaceChildren(...[g.online ? badge.el : null,
      perfect.length ? h('div', { class: 'st-perfect', role: 'status' }, h('b', {}, 'RODADA PERFEITA!'), h('span', {}, perfect.map((p) => pn(p)).join(' e ')), h('img', { src: `${PAUL}e20.webp`, alt: '', draggable: 'false' })) : null,
      h('h2', { class: 'jg-h hand' }, `rodada com a letra ${hst.letter}`), table(hst),
      h('p', { class: 'jg-p' }, `acumulado: ${hst.totals.map((t, p) => `${pn(p)} ${t}`).join(' · ')}`),
      hst.pending.some((x) => x) ? h('p', { class: 'jg-p muted' }, M ? 'respostas pendentes não contaram nem a favor nem contra na missão (valeram 0).' : 'respostas pendentes valeram 0. você pode aprová-las depois no histórico (o que for aprovado entra no banco).') : null,
      M ? missionLine() : null,
      h('div', { class: 'jg-actions' }, last ? h('button', { class: 'btn primary', type: 'button', onclick: finalView }, 'ver resultado final') : h('button', { class: 'btn primary', type: 'button', onclick: () => (g.online && g.turn !== me0() ? waiting() : turnStart()) }, 'próxima rodada'))].filter(Boolean));
    if (perfect.length) { const el = root.querySelector('.st-perfect'); FX.play('perfect'); FX.duck(1500); if (motion()) { stars(el); later(() => { if (token === my) stars(el); }, 600); } }
  }
  function table(hst) {
    return h('div', { class: 'st-tblwrap' }, h('table', { class: 'jg-tbl' }, h('thead', {}, h('tr', {}, h('th', {}, 'categoria'), ...g.players.map((_, p) => h('th', {}, pn(p))))),
      h('tbody', {}, ...g.cats.map((cid, c) => h('tr', {}, h('td', {}, S.CAT[cid].label), ...hst.points.map((row, p) => { const r = hst.results[p][c]; return h('td', { class: `st-c ${r.status}` }, `${row[c] == null ? '?' : row[c]} · `, h('small', {}, hst.answers[p][c] || '—')); }))),
        h('tr', { class: 'tot' }, h('td', {}, 'rodada'), ...hst.sums.map((s) => h('td', {}, String(s)))))));
  }

  /* ================= fim da partida ================= */
  function finalView() {
    const my = nextToken(); view = 'final'; FX.stopMusic(); const w = S.winner(g); const order = g.totals.map((t, p) => [p, t]).sort((a, b) => b[1] - a[1]);
    let recordMsg = '';
    if (!g.counted) { g.counted = true; recordMsg = M ? '' : record(); }
    persist();
    const title = g.players.length === 1 ? `total: ${g.totals[0]} pontos` : w.tie ? 'empate!' : `${pn(w.winners[0])} venceu!`;
    FX.play(g.players.length > 1 && w.tie ? 'tie' : 'win'); FX.duck(2500); FX.vibrate([60, 40, 60, 40, 120]);
    root.replaceChildren(...[g.online ? badge.el : null,
      h('div', { class: `jg-result st-final${w && w.tie ? ' tie' : ''}`, role: 'status' }, h('img', { class: 'st-fpaul', src: `${PAUL}${w && w.tie ? 'e26' : 'e03'}.webp`, alt: '', draggable: 'false' }), h('h3', { class: 'hand' }, title), recordMsg ? h('p', { class: 'st-rec' }, recordMsg) : null,
        h('ol', { class: `st-rank${w && w.tie ? ' side' : ''}` }, ...order.map(([p, t], i) => h('li', { class: w && w.winners.includes(p) && g.players.length > 1 ? 'first' : '' }, h('span', {}, g.players.length > 1 ? `${i + 1}º` : '★'), h('b', {}, pn(p)), h('em', {}, `${t} pts`))))),
      h('h3', { class: 'hand' }, 'rodadas'), ...g.history.map((x) => h('details', { class: 'jg-rules' }, h('summary', {}, `letra ${x.letter} · ${x.sums.join(' x ')}${x.perfect.some(Boolean) ? ' · perfeita!' : ''}`), table(x))),
      M ? null : h('div', { class: 'jg-actions' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => rematch() }, g.players.length > 1 ? 'revanche' : 'jogar de novo'),
        h('button', { class: 'btn', type: 'button', onclick: historyPanel }, 'histórico'), h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'voltar às opções'))].filter(Boolean));
    if (motion() && (!w || !w.tie)) { const el = root.querySelector('.st-final'); stars(el); later(() => { if (token === my) stars(el); }, 700); }
    if (M && !reported && g.stage === 'done') { reported = true; if (opts.onResult) opts.onResult(S.matchSummary(g)); } // fim REAL da partida: uma vez só
  }
  function rematch() {
    if (g.online) { const ng = { ...newMatch('dupla'), online: true }; g = ng; sync(); return turnStartOrWait(); }
    try { begin(newMatch()); } catch (e) { toast(e.message); }
  }
  const turnStartOrWait = () => (g.turn === me0() ? turnStart() : waiting());

  /* ================= histórico e recordes (neste aparelho) ================= */
  function record() {
    const s = getGame(ID); const hist = Array.isArray(s.hist) ? s.hist.slice(-29) : []; const rec = { best: 0, bestRound: 0, wins: {}, ...(s.rec || {}) }; let msg = '';
    const bestRound = Math.max(...g.history.map((x) => Math.max(...x.sums)));
    if (g.players.length === 1) { if (g.totals[0] > rec.best) { rec.best = g.totals[0]; msg = g.totals[0] > 0 ? 'novo recorde da partida! 🏆' : ''; } if (bestRound > rec.bestRound) { rec.bestRound = bestRound; if (!msg && bestRound > 0) msg = 'novo recorde de rodada!'; } }
    else { const w = S.winner(g); if (!w.tie) { const n = pn(w.winners[0]); rec.wins[n] = (rec.wins[n] || 0) + 1; } }
    hist.push({ at: Date.now(), mode: g.online ? 'online' : g.mode, cats: g.cats, rounds: g.rounds, seconds: g.seconds, letters: g.letters, players: g.players.map((n, p) => ({ name: pn(p), total: g.totals[p] })), rodadas: g.history.map((x) => ({ letter: x.letter, answers: x.answers, points: x.points, sums: x.sums, perfect: x.perfect })), perfect: g.history.filter((x) => x.perfect.some(Boolean)).length });
    setGame(ID, { hist, rec }); return msg;
  }
  function historyPanel() {
    const s = getGame(ID); const hist = (Array.isArray(s.hist) ? s.hist : []).slice().reverse(); const rec = { best: 0, bestRound: 0, wins: {}, ...(s.rec || {}) };
    sheet('histórico do STOP', (close) => h('div', { class: 'sheet-body st-hist' },
      h('p', {}, `recorde individual: ${rec.best} pts · melhor rodada: ${rec.bestRound} pts`), Object.keys(rec.wins).length ? h('p', {}, `vitórias em dupla/sala: ${Object.entries(rec.wins).map(([n, v]) => `${n} ${v}`).join(' · ')}`) : null,
      hist.length ? h('div', {}, ...hist.map((m) => h('details', { class: 'jg-rules' }, h('summary', {}, `${new Date(m.at).toLocaleDateString('pt-BR')} · ${MODE_LABEL[m.mode] || m.mode} · ${m.players.map((p) => `${p.name} ${p.total}`).join(' × ')}`),
        h('p', { class: 'muted' }, `categorias: ${m.cats.map((c) => S.CAT[c] ? S.CAT[c].label : c).join(', ')}`), h('p', { class: 'muted' }, `letras: ${m.letters.join(' ')} · ${m.seconds}s${m.perfect ? ` · ${m.perfect} rodada(s) perfeita(s)` : ''}`),
        ...m.rodadas.map((r) => h('p', { class: 'st-hr' }, h('b', {}, `${r.letter}: `), r.answers.map((row) => row.filter(Boolean).join(', ') || '—').join(' | '), ` → ${r.sums.join(' x ')}`))))) : h('p', { class: 'muted' }, 'nenhuma partida ainda.'),
      hist.length ? h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await confirmSheet('apagar o histórico?', 'os recordes também voltam a zero.', 'apagar')) { setGame(ID, { hist: [], rec: null }); close(); } } }, 'apagar histórico') : null));
  }

  /* ================= som e animações ================= */
  function audioPanel() {
    sheet('som e animações', () => {
      const c = FX.settings();
      const sw = (k, label) => h('label', { class: 'jg-chk st-sw' }, h('input', { type: 'checkbox', checked: c[k] ? true : null, onchange: (e) => { FX.setSetting(k, e.target.checked); if (k === 'music') { if (e.target.checked) FX.startMusic(); } if (k === 'fx' && e.target.checked) FX.play('tap'); } }), ` ${label}`);
      const rg = (k, label) => h('label', { class: 'jg-field' }, h('span', {}, label), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: c[k], 'aria-label': label, oninput: (e) => FX.setSetting(k, Number(e.target.value)), onchange: () => FX.play('tap') }));
      return h('div', { class: 'sheet-body st-audio' }, sw('fx', 'efeitos sonoros'), rg('fxVol', 'volume dos efeitos'), sw('timer', 'sons do cronômetro'), sw('music', 'música de fundo (instrumental, só durante o menu)'), rg('musicVol', 'volume da música'),
        sw('vibrate', typeof navigator.vibrate === 'function' ? 'vibração' : 'vibração (este aparelho não suporta)'), sw('reduce', 'reduzir animações'));
    });
  }

  /* ================= ciclo de vida ================= */
  const onVis = () => { if (!document.hidden && view === 'play' && !locked && !paused) { const rem = deadline - Date.now(); if (rem <= 0) timeUp(token); } };
  document.addEventListener('visibilitychange', onVis);
  const onUnload = () => { if (g && g.stage === 'play') persist(); };
  addEventListener('pagehide', onUnload);
  if (M) startMission(); else if (salaAutoPara(ID)) { prefs.mode = 'online'; introSeen = true; setup(); } else intro(); // veio de "tenho um código de sala": abre direto em 2 celulares
  /** Pausa do app: para só o relógio deste celular (no 'ao mesmo tempo' o outro não é afetado). */
  function pause() {
    if (sim) return sim.pause();
    if (view !== 'play' || locked || paused) return false;
    paused = true; remain = Math.max(0, deadline - Date.now()); stopClock(); root.querySelectorAll('.st-field input').forEach((i) => i.blur()); garantirCss();
    pauseEl = caixaPausa(() => resume()); root.append(pauseEl); root.classList.add('ss-pausado'); return true;
  }
  function resume() {
    if (sim) return sim.resume();
    if (!paused) return false;
    paused = false; deadline = Date.now() + remain; if (pauseEl) pauseEl.remove(); pauseEl = null; root.classList.remove('ss-pausado'); stopClock(); if (tickRef) { clk = setInterval(tickRef, 200); tickRef(); } return true;
  }
  return {
    pause, resume,
    inProgress: () => !!(sim && sim.inProgress()) || !!(g && ['cover', 'draw', 'play', 'review', 'summary'].includes(view)),
    restart: async () => { if (g && ['cover', 'draw', 'play', 'review', 'summary'].includes(view) && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; setup(); },
    destroy() { gone = true; nextToken(); FX.stopAll(); document.removeEventListener('visibilitychange', onVis); removeEventListener('pagehide', onUnload); leave(); },
  };
}
