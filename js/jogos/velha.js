// Jogo da velha musical: tela. Regras e perguntas em velha-logic.js / velha-data.js.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as V from './velha-logic.js';
import { getGame, setGame, sfx, figureEl, reduced } from './base.js';

const ID = 'velha';
const NS = 'http://www.w3.org/2000/svg';
const svg = (inner, cls, vb = '0 0 40 40') => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
const MARKS = [
  '<path d="M6 6l28 28M34 6L6 34" stroke="#17365B" stroke-width="4" stroke-linecap="round"/><circle cx="6" cy="6" r="3.2" fill="#EBA332"/><circle cx="34" cy="6" r="3.2" fill="#EBA332"/>',
  '<path d="M20 5c9 0 15 3 15 11 0 9-8 19-15 19S5 25 5 16C5 8 11 5 20 5z" fill="#BD1733" stroke="#142036" stroke-width="2.4"/>',
];
const mark = (who) => svg(MARKS[who], 'jg-mk');
const NAMES = (mode) => (mode === 'local' ? ['jogador 1', 'jogador 2'] : ['você', 'Paul']);
const MODES = [['local', 'dois no aparelho'], ['facil', 'contra o paul · fácil'], ['estrategico', 'contra o paul · estratégico']];
const VARIANTS = [['classico', 'clássico'], ['desafio', 'desafio musical']];

export function mount(host) {
  let gone = false; let timer = 0;
  const saved = getGame(ID);
  const prefs = { mode: MODES.some((m) => m[0] === saved.mode) ? saved.mode : 'local', variant: saved.variant === 'desafio' ? 'desafio' : 'classico' };
  let g = null; let msg = '';
  const root = h('div', { class: 'jg jg-velha' }); host.replaceChildren(root);
  const persist = () => setGame(ID, { ...prefs, match: g });
  const stop = () => { clearTimeout(timer); timer = 0; };
  const human = () => g && !g.over && !g.offer && !V.isPaulTurn(g);

  function intro() {
    stop(); g = null;
    const resume = V.validMatch(saved.match) ? saved.match : null;
    const seg = (key, list) => h('div', { class: 'jg-seg', role: 'radiogroup' }, ...list.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs[key] === v), class: prefs[key] === v ? 'on' : '', onclick: () => { prefs[key] = v; setGame(ID, { [key]: v }); intro(); } }, l)));
    root.replaceChildren(
      h('h2', { class: 'jg-h hand' }, 'jogo da velha'),
      h('p', { class: 'jg-p' }, 'três em linha ganha: baquetas contra palheta.'),
      h('p', { class: 'jg-lab' }, 'quem joga?'), seg('mode', MODES),
      h('p', { class: 'jg-lab' }, 'variante'), seg('variant', VARIANTS),
      h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'), h('ul', {},
        h('li', {}, 'clássico: tocou numa casa vazia, marcou.'),
        h('li', {}, 'desafio musical: tocar abre uma pergunta. acertou, marca. errou, a casa fica vazia e passa a vez.'),
        h('li', {}, 'contra o paul no desafio: só você responde perguntas; o paul joga automático, sem perguntas.'),
        h('li', {}, 'fácil joga em casa aleatória; estratégico não deixa ninguém ganhar de bobeira.'),
        h('li', {}, 'nas perguntas, a semínima vale 1 tempo.'))),
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, `continuar (rodada ${resume.round})`) : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(V.newMatch(prefs)) }, resume ? 'novo placar' : 'iniciar')));
  }
  function begin(m) { g = m; msg = ''; persist(); draw(); afterTurn(); }

  function draw() {
    const names = NAMES(g.mode); const w = g.result && g.result.line; const q = g.pending ? V.questionById(g.pending.qid) : null;
    const canTap = human() && !g.pending;
    const status = g.over ? '' : g.offer ? 'muitos erros seguidos…' : V.isPaulTurn(g) ? 'vez do paul…' : `vez de ${names[g.turn]} (${V.MARK_NAME[g.turn]})`;
    const cells = g.board.map((v, i) => h('button', { type: 'button', class: `jg-cell${w && w.includes(i) ? ' win' : ''}${g.pending && g.pending.cell === i ? ' ask' : ''}`, disabled: !(canTap && v == null),
      'aria-label': `casa ${i + 1}, linha ${Math.floor(i / 3) + 1} coluna ${(i % 3) + 1}: ${v == null ? 'vazia' : V.MARK_NAME[v]}`, onclick: () => tap(i) }, v == null ? null : mark(v)));
    root.replaceChildren(...[
      h('div', { class: 'jg-score', role: 'group', 'aria-label': 'placar' },
        h('div', {}, mark(0), h('b', {}, `${names[0]}`), h('span', {}, String(g.scores[0]))), h('div', {}, h('b', {}, 'empates'), h('span', {}, String(g.draws))), h('div', {}, mark(1), h('b', {}, `${names[1]}`), h('span', {}, String(g.scores[1])))),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, `rodada ${g.round}${status ? ` · ${status}` : ''}`),
      h('div', { class: 'jg-board', role: 'group', 'aria-label': 'tabuleiro 3 por 3' }, ...cells),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      q ? question(q) : null,
      g.offer ? h('div', { class: 'jg-pick', role: 'alertdialog', 'aria-label': 'muitos erros' }, h('b', {}, `já são ${g.errors} erros. encerrar em empate ou continuar?`),
        h('button', { class: 'btn small', type: 'button', onclick: () => { g = V.resolveOffer(g, true); persist(); finish(); } }, 'encerrar em empate'), h('button', { class: 'btn small primary', type: 'button', onclick: () => { g = V.resolveOffer(g, false); persist(); draw(); afterTurn(); } }, 'continuar')) : null,
      g.over ? result() : null,
    ].filter(Boolean));
  }

  function question(q) {
    const opts = g.pending.order.map((orig, pos) => h('button', { type: 'button', class: 'jg-opt', onclick: () => answer(pos) }, q.options[orig]));
    return h('div', { class: 'jg-q', role: 'group', 'aria-label': 'pergunta' },
      q.img ? h('img', { class: 'jg-qimg', src: `assets/jogos/instrumentos/${q.img}.webp`, alt: 'instrumento da pergunta', draggable: 'false' }) : null,
      q.fig ? h('span', { class: 'jg-qfig', role: 'img', 'aria-label': `figura: ${q.figName}` }, figureEl(q.fig)) : null,
      h('p', { class: 'jg-qt' }, q.text),
      q.img ? h('details', { class: 'jg-desc' }, h('summary', {}, 'ver descrição em texto'), h('p', {}, q.desc)) : null,
      h('div', { class: 'jg-opts' }, ...opts),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { g = V.cancelQuestion(g); msg = 'sem pressa: a pergunta continua a mesma'; persist(); draw(); } }, 'voltar ao tabuleiro'));
  }

  function tap(i) {
    if (!human() || g.pending || g.board[i] != null) return;
    sfx('tap');
    if (g.variant === 'classico' || V.isPaulTurn(g)) { g = V.applyMark(g, i); msg = ''; sfx('place'); return after(); }
    g = V.openQuestion(g, i); msg = ''; draw();
    const f = root.querySelector('.jg-opt'); if (f) f.focus();
  }
  function answer(pos) {
    if (!g.pending) return;
    const q = V.questionById(g.pending.qid); const ok = g.pending.order[pos] === q.answer;
    g = V.answerQuestion(g, pos);
    msg = ok ? `isso! ${q.explain}` : `quase! a resposta era “${q.options[q.answer]}”. ${q.explain}`; sfx(ok ? 'place' : 'bad'); after();
  }
  function after() { persist(); if (g.over) return finish(); draw(); afterTurn(); }
  function afterTurn() { stop(); if (!g || g.over || g.offer || gone || document.hidden) return; if (V.isPaulTurn(g)) timer = setTimeout(paulStep, reduced() ? 300 : 800); }
  function paulStep() {
    timer = 0; if (gone || !g || g.over || !V.isPaulTurn(g) || document.hidden) return;
    const cell = g.mode === 'estrategico' ? V.bestMove(g.board, 1) : V.easyMove(g.board);
    g = V.applyMark(g, cell); msg = `paul marcou a casa ${cell + 1}`; sfx('place'); after();
  }
  function finish() { const w = g.result.winner; sfx(w == null ? 'tie' : g.mode !== 'local' && w === 1 ? 'lose' : 'win'); draw(); }
  function result() {
    const w = g.result.winner; const names = NAMES(g.mode);
    const title = w == null ? 'empate' : g.mode !== 'local' ? (w === 0 ? 'você venceu! 🤘' : 'o paul venceu') : `${names[w]} venceu!`;
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, title), g.result.early ? h('p', {}, 'encerrada em empate depois de muitos erros') : null,
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { g = V.nextRound(g); msg = ''; persist(); draw(); afterTurn(); } }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  const onVis = () => { if (document.hidden) stop(); else afterTurn(); };
  document.addEventListener('visibilitychange', onVis);
  intro();
  return {
    inProgress: () => !!(g && !g.over && g.board.some((x) => x != null)),
    restart: async () => { if (g && !g.over && g.board.some((x) => x != null) && !(await confirmSheet('começar nova partida?', 'a rodada atual será perdida (o placar fica salvo).', 'nova partida'))) return; stop(); intro(); },
    destroy() { gone = true; stop(); document.removeEventListener('visibilitychange', onVis); },
  };
}
