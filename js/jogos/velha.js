// Jogo da velha musical: tela. Regras e perguntas em velha-logic.js / velha-data.js.
import { bq } from './bonequinhos.js';
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as V from './velha-logic.js';
import { getGame, setGame, sfx, figureEl, reduced } from './base.js';
import { LEVELS } from './velha-data.js';
import { lobby, linkBadge } from './online.js';

const ID = 'velha';
const NS = 'http://www.w3.org/2000/svg';
const svg = (inner, cls, vb = '0 0 40 40') => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
const MARKS = [
  '<path d="M6 6l28 28M34 6L6 34" stroke="#17365B" stroke-width="4" stroke-linecap="round"/><circle cx="6" cy="6" r="3.2" fill="#EBA332"/><circle cx="34" cy="6" r="3.2" fill="#EBA332"/>',
  '<path d="M20 5c9 0 15 3 15 11 0 9-8 19-15 19S5 25 5 16C5 8 11 5 20 5z" fill="#BD1733" stroke="#142036" stroke-width="2.4"/>',
];
const mark = (who) => svg(MARKS[who], 'jg-mk');
const MODES = [['local', 'dois no aparelho', 'dois'], ['online', '2 celulares (código)', 'celular'], ['paul', 'jogar contra o Paul (às vezes fácil, às vezes difícil)', 'paul'], ['estrategico', 'jogar contra o Paul no desafio: ele joga sempre bem', '#desafio']]; // 3º item: ícone (só ele aparece; o texto vira dica); '#texto' = pílula pequenininha
const LEVEL_HELP = { infantil: 'perguntas bem simples', facil: 'perguntas fáceis de música', intermediario: 'perguntas mais difíceis' };

/** opts (opcional): { mission: { params: { ai, variant, level, rounds } }, onResult } = Modo Aventura. Sem opts.mission nada muda no Modo Livre. */
export function mount(host, opts) {
  const mission = opts && opts.mission ? opts : null; const MP = mission ? (mission.mission.params || {}) : null;
  const rounds = mission ? Math.max(1, Math.floor(Number(MP.rounds) || 1)) : 0; const outcomes = []; const stat = { answered: 0, correct: 0 }; let reported = false;
  let gone = false; let timer = 0;
  const saved = mission ? {} : getGame(ID);
  const prefs = mission ? { mode: MP.ai === 'estrategica' ? 'estrategico' : 'facil', variant: MP.variant === 'desafio' ? 'desafio' : 'classico', level: LEVELS.some((l) => l[0] === MP.level) ? MP.level : 'facil' } : { mode: MODES.some((m) => m[0] === saved.mode) ? saved.mode : (saved.mode === 'facil' || saved.mode === 'estrategico') ? 'paul' : 'local', variant: 'desafio', level: LEVELS.some((l) => l[0] === saved.level) ? saved.level : 'facil' };
  let g = null; let msg = ''; let fb = null; let mv = null; // mv: null | { from: null | número } = escolhendo a troca de lugar
  let conn = null; let lob = null; const badge = linkBadge();
  const me0 = () => (conn ? conn.me : 0);
  const NAMES = (mode) => (mode === 'local' ? ['jogador 1', 'jogador 2'] : mode === 'online' ? (me0() === 0 ? ['você', 'o outro'] : ['o outro', 'você']) : ['você', 'Paul']);
  const root = h('div', { class: `jg jg-velha${mission ? ' jg-game' : ''}` }); host.replaceChildren(root);
  const persist = () => { if (mission || (g && g.mode === 'online')) return; setGame(ID, { ...prefs, match: g }); };
  const leave = () => { if (conn) { conn.close(); conn = null; } if (lob) { lob.close(); lob = null; } };
  const stop = () => { clearTimeout(timer); timer = 0; };
  const human = () => g && !g.over && !g.offer && !V.isPaulTurn(g) && !(g.mode === 'online' && g.turn !== me0());

  function intro() {
    stop(); leave(); g = null;
    const resume = V.validMatch(saved.match) && saved.match.variant === 'desafio' ? saved.match : null; // partida antiga do modo clássico não continua
    const seg = (key, list) => h('div', { class: 'jg-seg', role: 'radiogroup' }, ...list.map(([v, l, ic]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs[key] === v), 'aria-label': ic ? l : null, title: ic ? l : null, class: `${prefs[key] === v ? 'on' : ''}${ic ? (ic[0] === '#' ? ' jg-tiny' : ' jg-ic') : ''}`, onclick: () => { prefs[key] = v; setGame(ID, { [key]: v }); intro(); } }, ic ? (ic[0] === '#' ? ic.slice(1) : bq(ic)) : l)));
    root.replaceChildren(
      h('h2', { class: 'jg-h hand' }, 'jogo da velha'),
      h('ol', { class: 'jg-big' },
        h('li', {}, prefs.variant === 'desafio' ? 'toque numa casa e responda a pergunta' : 'toque numa casa vazia'),
        h('li', {}, '3 marcas em linha ganha'),
        h('li', {}, h('b', {}, '1 vez por rodada'), ' você pode mudar uma marca de lugar')),
      h('p', { class: 'jg-lab big' }, 'quem joga?'), seg('mode', MODES),
      prefs.variant === 'desafio' ? h('div', {}, h('p', { class: 'jg-lab big' }, 'nível das perguntas'), seg('level', LEVELS), h('p', { class: 'jg-big' }, LEVEL_HELP[prefs.level])) : null,
      prefs.mode === 'online' ? (lob = lobby({ jogo: ID, makeState: () => V.newMatch({ ...prefs, mode: 'online' }), onStart: startOnline })).el
        : h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, `continuar (rodada ${resume.round})`) : null,
          h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(V.newMatch(prefs)) }, resume ? 'novo placar' : 'iniciar')));
  }
  function startOnline(c, state) {
    conn = c; lob = null; badge.set(true); c.on.link = (v) => badge.set(v);
    c.on.state = (st) => { const was = g && g.over; g = st; msg = ''; if (g.over && !was) finish(); else draw(); };
    g = state; msg = ''; draw();
  }
  /** manda a jogada pro outro celular (jogada completa; a pergunta aberta fica só no celular de quem joga) */
  function sync() { if (conn && g.mode === 'online') conn.push(g).then((ok) => { if (!ok) msg = 'o outro celular jogou ao mesmo tempo, veja o tabuleiro'; }); }
  function begin(m) { mv = null; g = m; msg = ''; fb = null; persist(); draw(); afterTurn(); }

  function draw() {
    const names = NAMES(g.mode); const w = g.result && g.result.line; const q = g.pending ? V.questionById(g.pending.qid) : null;
    const canTap = human() && !g.pending; const mvOn = !!mv && canTap && V.canMove(g);
    const status = g.over ? '' : g.offer ? 'muitos erros seguidos…' : V.isPaulTurn(g) ? 'vez do paul…' : g.mode === 'online' && g.turn !== me0() ? 'vez do outro celular…' : `vez de ${names[g.turn]} (${V.MARK_NAME[g.turn]})`;
    const cells = g.board.map((v, i) => h('button', { type: 'button', class: `jg-cell${w && w.includes(i) ? ' win' : ''}${mvOn && mv.from === i ? ' ask' : ''}${g.pending && g.pending.cell === i ? ' ask' : ''}`, disabled: mvOn ? !(mv.from == null ? v === g.turn : (v == null || v === g.turn)) : !(canTap && v == null),
      'aria-label': `casa ${i + 1}, linha ${Math.floor(i / 3) + 1} coluna ${(i % 3) + 1}: ${v == null ? 'vazia' : V.MARK_NAME[v]}`, onclick: () => tap(i) }, v == null ? null : mark(v)));
    root.replaceChildren(...[
      g.mode === 'online' ? badge.el : null,
      h('div', { class: 'jg-score', role: 'group', 'aria-label': 'placar' },
        h('div', {}, mark(0), h('b', {}, `${names[0]}`), h('span', {}, String(g.scores[0]))), h('div', {}, h('b', {}, 'empates'), h('span', {}, String(g.draws))), h('div', {}, mark(1), h('b', {}, `${names[1]}`), h('span', {}, String(g.scores[1])))),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, `rodada ${g.round}${mission ? ` de ${rounds}` : ''}${status ? ` · ${status}` : ''}`),
      h('div', { class: 'jg-board', role: 'group', 'aria-label': 'tabuleiro 3 por 3' }, ...cells),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      moveBox(canTap),
      fb ? feedback() : null,
      q ? question(q) : null,
      g.offer ? h('div', { class: 'jg-pick', role: 'alertdialog', 'aria-label': 'muitos erros' }, h('b', {}, `já são ${g.errors} erros. encerrar em empate ou continuar?`),
        h('button', { class: 'btn small', type: 'button', onclick: () => { g = V.resolveOffer(g, true); persist(); sync(); finish(); } }, 'encerrar em empate'), h('button', { class: 'btn small primary', type: 'button', onclick: () => { g = V.resolveOffer(g, false); persist(); sync(); draw(); afterTurn(); } }, 'continuar')) : null,
      g.over ? result() : null,
    ].filter(Boolean));
  }

  /** Troca de lugar: avisa sempre que só dá 1 vez por rodada; some do jogo depois de usada. */
  function moveBox(canTap) {
    if (g.over || g.pending || g.offer) return null;
    const used = g.moved || [false, false]; const names = NAMES(g.mode);
    if (mv && canTap && V.canMove(g)) return h('div', { class: 'jg-move on', role: 'status' }, h('b', {}, mv.from == null ? 'toque numa marca SUA para pegar' : 'agora toque na casa vazia onde ela vai ficar'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { mv = null; draw(); } }, 'cancelar'));
    const note = (i) => (used[i] ? `${names[i]}: troca já usada` : `${names[i]}: troca disponível`);
    return h('div', { class: 'jg-move' },
      canTap && V.canMove(g) ? h('button', { class: 'btn small', type: 'button', onclick: () => { mv = { from: null }; msg = ''; draw(); } }, 'mudar uma marca de lugar (só 1 vez)') : null,
      h('p', { class: 'jg-movenote' }, `${note(0)} · ${note(1)}`));
  }

  function question(q) {
    const opts = g.pending.order.map((orig, pos) => h('button', { type: 'button', class: 'jg-opt', onclick: () => answer(pos) }, q.options[orig]));
    return h('div', { class: 'jg-q', role: 'group', 'aria-label': 'pergunta' },
      h('p', { class: 'jg-qt' }, q.text),
      h('div', { class: 'jg-opts' }, ...opts),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { g = V.cancelQuestion(g); msg = 'sem pressa: a pergunta continua a mesma'; persist(); draw(); } }, 'voltar ao tabuleiro'));
  }

  /** Foto/figura da resposta: só aparece DEPOIS de responder (antes entregaria o gabarito). */
  function feedback() {
    const f = fb; const alt = f.artist ? `foto de ${f.name}` : `imagem: ${f.name}`;
    return h('div', { class: 'jg-fb' },
      f.src ? h('img', { class: 'jg-fbimg', src: f.src, alt, draggable: 'false', onerror: (e) => e.target.remove() }) : null,
      f.fig ? h('span', { class: 'jg-qfig', role: 'img', 'aria-label': `figura: ${f.name}` }, figureEl(f.fig)) : null,
      h('b', {}, f.name));
  }

  function tap(i) {
    if (mv && human() && !g.pending && V.canMove(g)) {
      if (mv.from == null) { if (g.board[i] === g.turn) { mv.from = i; sfx('tap'); draw(); } return; }
      if (g.board[i] === g.turn) { mv.from = i; sfx('tap'); draw(); return; }
      if (g.board[i] != null) return;
      g = V.moveMark(g, mv.from, i); mv = null; msg = 'marca mudada de lugar! a troca dessa pessoa já foi usada.'; fb = null; sfx('place'); return after();
    }
    if (!human() || g.pending || g.board[i] != null) return;
    sfx('tap');
    if (g.variant === 'classico' || V.isPaulTurn(g)) { g = V.applyMark(g, i); msg = ''; fb = null; sfx('place'); return after(); }
    g = V.openQuestion(g, i); msg = ''; fb = null; if (mission && g.over) return finish(); draw();
    const f = root.querySelector('.jg-opt'); if (f) f.focus();
  }
  function answer(pos) {
    if (!g.pending) return;
    const q = V.questionById(g.pending.qid); const ok = g.pending.order[pos] === q.answer;
    if (mission) { stat.answered++; if (ok) stat.correct++; }
    g = V.answerQuestion(g, pos);
    msg = ok ? `isso! ${q.explain}` : `quase! a resposta era “${q.options[q.answer]}”. ${q.explain}`;
    fb = q.show ? { ...q.show, name: q.options[q.answer] } : null; sfx(ok ? 'place' : 'bad'); after();
  }
  function after() { mv = null; persist(); sync(); if (g.over) return finish(); draw(); afterTurn(); }
  function afterTurn() { stop(); if (!g || g.over || g.offer || gone || document.hidden) return; if (V.isPaulTurn(g)) timer = setTimeout(paulStep, reduced() ? 300 : 800); }
  function paulStep() {
    timer = 0; if (gone || !g || g.over || !V.isPaulTurn(g) || document.hidden) return;
    const cell = mission ? V.aiMove(MP.ai, g.board, 1) : V.paulMove(g.mode, g.board);
    g = V.applyMark(g, cell); msg = `paul marcou a casa ${cell + 1}`; sfx('place'); after();
  }
  /** Aventura: registra o fim de cada rodada; no fim da última, avisa o resultado UMA vez. */
  function missionRound() {
    if (!mission || reported || !g.over || outcomes.length >= g.round) return;
    const w = g.result.winner; outcomes.push(w === 0 ? 'W' : w === 1 ? 'L' : 'D');
    if (outcomes.length < rounds) return;
    reported = true; const wins = outcomes.filter((x) => x === 'W').length; const losses = outcomes.filter((x) => x === 'L').length;
    let best = 0; let run = 0; for (const o of outcomes) { run = o === 'W' ? run + 1 : 0; best = Math.max(best, run); }
    mission.onResult({ outcomes: outcomes.slice(), rounds, wins, losses, draws: rounds - wins - losses, bestStreak: best, errors: g.errors, answered: stat.answered, correct: stat.correct, ai: MP.ai, variant: prefs.variant, level: prefs.level });
  }
  function finish() { missionRound(); const w = g.result.winner; sfx(w == null ? 'tie' : g.mode === 'online' ? (w === me0() ? 'win' : 'lose') : g.mode !== 'local' && w === 1 ? 'lose' : 'win'); draw(); }
  function result() {
    const w = g.result.winner; const names = NAMES(g.mode);
    const title = g.result.exhausted ? 'perguntas esgotadas' : w == null ? 'empate' : g.mode === 'online' ? (w === me0() ? 'você venceu! 🤘' : 'o outro venceu') : g.mode !== 'local' ? (w === 0 ? 'você venceu! 🤘' : 'o paul venceu') : `${names[w]} venceu!`;
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, title), g.result.early ? h('p', {}, 'encerrada em empate depois de muitos erros') : null, g.result.exhausted ? h('p', {}, 'perguntas esgotadas neste nível! o placar fica salvo; jogue de novo ou mude o nível.') : null,
      mission ? (outcomes.length < rounds ? h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { g = V.nextRound(g); mv = null; msg = ''; fb = null; draw(); afterTurn(); } }, 'próxima rodada')) : null)
        : h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { g = V.nextRound(g); mv = null; msg = ''; fb = null; persist(); sync(); draw(); afterTurn(); } }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  const onVis = () => { if (document.hidden) stop(); else afterTurn(); };
  document.addEventListener('visibilitychange', onVis);
  if (mission) begin(V.newMatch(prefs)); else intro();
  return {
    inProgress: () => !!(g && !g.over && g.board.some((x) => x != null)),
    restart: async () => { if (g && !g.over && g.board.some((x) => x != null) && !(await confirmSheet('começar nova partida?', 'a rodada atual será perdida (o placar fica salvo).', 'nova partida'))) return; stop(); intro(); },
    destroy() { gone = true; stop(); leave(); document.removeEventListener('visibilitychange', onVis); },
  };
}
