// Última nota: tela. Regras em cartas-logic.js.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as C from './cartas-logic.js';
import { getGame, setGame, sfx, figureEl, reduced } from './base.js';

const ID = 'cartas';
const PLAYER = (mode, p) => (mode === 'paul' ? (p === 0 ? 'você' : 'Paul') : `jogador ${p + 1}`);
const NS = 'http://www.w3.org/2000/svg';
const svg = (inner, cls = 'jg-sym', vb = '0 0 24 24') => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };
const SYM = {
  vermelho: '<path d="M12 2l3 7 7.5.6-5.7 4.9 1.8 7.4L12 18l-6.6 3.9 1.8-7.4L1.5 9.6 9 9z" fill="currentColor"/>',
  azul: '<path d="M14 1L4 14h6l-2 9 11-14h-7z" fill="currentColor"/>',
  mostarda: '<circle cx="12" cy="12" r="8" fill="currentColor"/>',
  petroleo: '<path d="M12 1l9 11-9 11-9-11z" fill="currentColor"/>',
};
const ACT = {
  pular: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="3"/>',
  inverter: '<path d="M4 8h13M13 3l5 5-5 5M20 16H7M11 11l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  curinga: '<path d="M12 12V2a10 10 0 0110 10z" fill="#BD1733"/><path d="M12 12h10a10 10 0 01-10 10z" fill="#17365B"/><path d="M12 12v10A10 10 0 012 12z" fill="#EBA332"/><path d="M12 12H2A10 10 0 0112 2z" fill="#1E7B7A"/><circle cx="12" cy="12" r="10" fill="none" stroke="#142036" stroke-width="1.4"/>',
};

/** Carta inteira: numeral no canto, figura(s) no centro e símbolo da cor. */
function face(c, small) {
  const cls = `jg-card-u c-${c.color || 'curinga'}${small ? ' sm' : ''}`;
  const corner = isNum(c) ? String(c.value) : c.kind === 'mais2' ? '+2' : '';
  const center = h('span', { class: 'jg-mid' });
  if (isNum(c)) C.FIGS[c.value].forEach((f) => center.append(figureEl(f)));
  else if (c.kind === 'mais2') center.append(h('b', { class: 'jg-plus' }, '+2'));
  else center.append(svg(ACT[c.kind], 'jg-act'));
  return h('span', { class: cls, 'aria-hidden': 'true' },
    h('i', { class: 'jg-cn' }, corner), c.color ? svg(SYM[c.color], 'jg-cs') : null, center);
}
const isNum = C.isNum;

export function mount(host) {
  let gone = false; let timer = 0;
  const saved = getGame(ID);
  const prefs = { mode: saved.mode === 'local' ? 'local' : 'paul' };
  const rec = () => ({ w: 0, l: 0, e: 0, ...(saved.rec || {}) });
  let g = null; let hidden = false; let picking = null; let recorded = false;
  const root = h('div', { class: 'jg jg-cartas' }); host.replaceChildren(root);

  const persist = () => setGame(ID, { ...prefs, game: g && !g.over ? g : null, rec: saved.rec });
  const stop = () => { clearTimeout(timer); timer = 0; };
  const human = () => g && !g.over && !(g.mode === 'paul' && g.turn === 1);

  function intro() {
    stop(); g = null; picking = null;
    const resume = C.validGame(saved.game) && !saved.game.over ? saved.game : null; const r = rec();
    const seg = h('div', { class: 'jg-seg', role: 'radiogroup' }, ...[['paul', 'contra o paul'], ['local', 'dois no aparelho']].map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(prefs.mode === v), class: prefs.mode === v ? 'on' : '', onclick: () => { prefs.mode = v; setGame(ID, { mode: v }); intro(); } }, l)));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'última nota'), h('p', { class: 'jg-p' }, 'números e figuras. neste jogo, a semínima vale 1 tempo: cada número é a soma das durações da carta.'),
      h('div', { class: 'jg-legend', role: 'list', 'aria-label': 'legenda dos números' }, ...[1, 2, 3, 4, 5, 6].map((v) => h('div', { class: 'jg-leg', role: 'listitem', 'aria-label': `${v}: ${C.FIGS[v].map((f) => ({ seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' }[f])).join(' + ')}` }, face({ color: 'azul', kind: 'num', value: v }, true), h('small', {}, C.FIGS[v].map((f) => ({ seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' }[f])).join(' + '))))),
      h('p', { class: 'jg-lab' }, 'contra quem?'), seg,
      h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'), h('ul', {},
        h('li', {}, 'cada um começa com 7 cartas. jogue uma carta da mesma cor, do mesmo número ou da mesma ação que a do descarte.'),
        h('li', {}, 'tem carta que serve? tem que jogar. não tem? compre uma. se servir, jogue ou passe; se não servir, passa sozinho.'),
        h('li', {}, 'pular e inverter (com dois jogadores) fazem o adversário perder a vez. +2: ele compra duas e perde a vez. não empilha.'),
        h('li', {}, 'curinga muda a cor. as cores têm símbolo: vermelho estrela, azul raio, mostarda círculo, verde-petróleo losango.'),
        h('li', {}, 'ficou com uma carta: “última nota!”. quem esvaziar a mão vence.'))),
      h('div', { class: 'jg-actions' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(C.newGame({ mode: prefs.mode })) }, resume ? 'nova partida' : 'iniciar')),
      r.w + r.l + r.e ? h('p', { class: 'jg-p muted' }, `contra o paul: ${r.w} vitória${r.w === 1 ? '' : 's'} · ${r.l} derrota${r.l === 1 ? '' : 's'} · ${r.e} empate${r.e === 1 ? '' : 's'}`) : null,
    ].filter(Boolean));
  }

  function begin(game) { g = game; recorded = false; picking = null; hidden = g.mode === 'local'; persist(); draw(); afterTurn(); }

  function paint() {
    const me = g.mode === 'paul' ? 0 : g.turn; const opp = 1 - me; const hand = g.hands[me];
    const top = C.topOf(g); const canMove = human() && !hidden;
    const legal = new Set(canMove ? C.legalCards(g, me).map((c) => c.id) : []);
    const status = g.over ? '' : g.mode === 'paul' ? (g.turn === 0 ? 'sua vez' : 'vez do paul…') : `vez do ${PLAYER(g.mode, g.turn)}`;
    const canD = canMove && C.canDraw(g); const canP = canMove && C.canPass(g);
    const colorTxt = `cor ativa: ${C.COLOR_NAME[g.color]} (${C.COLOR_SYMBOL[g.color]})`;
    const last = !g.over && g.last != null ? `${PLAYER(g.mode, g.last)}: última nota!` : '';
    root.replaceChildren(...[
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, g.mode === 'paul' ? 'paul' : `jogador ${opp + 1}`), h('span', {}, `${g.hands[opp].length} carta${g.hands[opp].length === 1 ? '' : 's'}`)),
        h('div', { class: 'jg-who' }, h('b', {}, 'monte'), h('span', {}, String(C.available(g))))),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, status),
      h('div', { class: 'jg-pile' },
        h('button', { type: 'button', class: `jg-deck${canD ? ' fit' : ''}`, disabled: !canD, 'aria-label': 'comprar uma carta', onclick: draw1 }, h('span', { class: 'jg-card-u back', 'aria-hidden': 'true' }, h('b', {}, '♪')), h('small', {}, 'comprar')),
        h('div', { class: 'jg-top', role: 'img', 'aria-label': `descarte: ${C.cardName(top)}` }, face(top)),
        h('div', { class: `jg-active c-${g.color}` }, svg(SYM[g.color], 'jg-cs'), h('b', {}, colorTxt))),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, g.note), last ? h('p', { class: 'jg-last', role: 'status' }, last) : null,
      picking ? h('div', { class: 'jg-pick', role: 'group', 'aria-label': 'escolha a cor' }, h('b', {}, 'escolha a cor:'), ...C.COLORS.map((k) => h('button', { type: 'button', class: `jg-pc c-${k}`, onclick: () => play(picking, k) }, svg(SYM[k], 'jg-cs'), C.COLOR_NAME[k])), h('button', { type: 'button', class: 'btn small ghost', onclick: () => { picking = null; paint(); } }, 'cancelar')) : null,
      g.over ? result() : h('div', { class: 'jg-actions row' }, h('button', { class: 'btn small', type: 'button', disabled: !canP, onclick: pass1 }, 'passar'), canMove && g.drawn ? h('small', { class: 'muted' }, 'a carta comprada serve: jogue ou passe') : null),
      h('div', { class: 'jg-hand', role: 'group', 'aria-label': hidden ? 'mão oculta' : 'sua mão' }, hidden ? h('p', { class: 'jg-empty' }, 'mão oculta') : hand.map((c) => h('button', { type: 'button', class: `jg-hbtn${legal.has(c.id) ? ' fit' : ''}${picking === c.id ? ' sel' : ''}`, disabled: !canMove, 'aria-label': C.cardName(c) + (legal.has(c.id) ? ', pode jogar' : ''), onclick: () => pick(c) }, face(c)))),
    ].filter(Boolean));
  }
  function draw() {
    paint();
    if (!(g && g.mode === 'local' && hidden && !g.over)) return;
    root.querySelector('.jg-hand').replaceChildren();
    root.append(h('div', { class: 'jg-cover', role: 'dialog', 'aria-label': 'passe o aparelho' }, h('p', { class: 'hand' }, `passe o aparelho para o ${PLAYER(g.mode, g.turn)}`), h('p', { class: 'muted' }, 'as cartas estão escondidas'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { hidden = false; sfx('tap'); paint(); } }, `sou o ${PLAYER(g.mode, g.turn)}, mostrar minha mão`)));
    root.querySelector('.jg-cover button').focus();
  }

  function pick(c) {
    if (!human() || hidden) return; sfx('tap');
    if (!C.legalCards(g, g.turn).some((x) => x.id === c.id)) { g = { ...g, note: g.drawn ? 'só a carta comprada pode ser jogada' : `essa carta não serve: o descarte é ${C.cardName(C.topOf(g))}` }; sfx('bad'); paint(); return; }
    if (C.isWild(c)) { picking = c.id; paint(); return; }
    play(c.id);
  }
  function play(id, color) {
    const who = g.turn; picking = null;
    try { g = C.applyPlay(g, who, id, color); } catch { g = { ...g, note: 'jogada inválida' }; paint(); return; }
    sfx('place'); persist(); after(who);
  }
  function draw1() { if (!human() || !C.canDraw(g)) return; const who = g.turn; g = C.applyDraw(g, who); sfx('draw'); persist(); after(who); }
  function pass1() { if (!human() || !C.canPass(g)) return; const who = g.turn; g = C.applyPass(g, who); persist(); after(who); }

  /** Depois de qualquer ação: fim, troca de vez (cobre a tela no modo local) ou continua. */
  function after(who) {
    if (g.over) return finishUp();
    if (g.mode === 'local' && g.turn !== who) hidden = true;
    draw(); afterTurn();
  }
  function afterTurn() { stop(); if (!g || g.over || gone || document.hidden) return; if (g.mode === 'paul' && g.turn === 1) timer = setTimeout(paulStep, reduced() ? 350 : 900); }
  function paulStep() {
    timer = 0; if (gone || !g || g.over || g.turn !== 1 || document.hidden) return;
    const mv = C.paulMove(g, 1);
    if (mv.type === 'play') { const c = g.hands[1].find((x) => x.id === mv.id); g = C.applyPlay(g, 1, mv.id, mv.color); g.note = `paul jogou ${C.cardName(c)}. ${g.note}`; sfx('place'); }
    else if (mv.type === 'draw') { g = C.applyDraw(g, 1); g.note = `paul: ${g.note.replace('comprou uma carta que serve: jogue ou passe', 'comprou uma carta')}`; sfx('draw'); }
    else { g = C.applyPass(g, 1); g.note = `paul: ${g.note}`; }
    persist(); if (g.over) return finishUp(); draw(); afterTurn();
  }
  function finishUp() {
    if (!recorded) { recorded = true; if (g.mode === 'paul') { const r = rec(); const w = g.result.winner; if (w === 0) r.w++; else if (w === 1) r.l++; else r.e++; saved.rec = r; } }
    setGame(ID, { ...prefs, game: null, rec: saved.rec });
    const w = g.result.winner; sfx(w == null ? 'tie' : g.mode === 'paul' && w === 1 ? 'lose' : 'win'); hidden = false; draw();
  }
  function result() {
    const r = g.result; const w = r.winner;
    const title = w == null ? 'empate' : g.mode === 'paul' ? (w === 0 ? 'você venceu! 🤘' : 'o paul venceu') : `${PLAYER(g.mode, w)} venceu!`;
    return h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, title),
      h('p', {}, w == null ? 'jogo travado com o mesmo número de cartas' : r.reason === 'mao-vazia' ? `${PLAYER(g.mode, w)} descartou a última carta` : `jogo travado: ${PLAYER(g.mode, w)} ficou com menos cartas`),
      h('p', { class: 'muted' }, `cartas restantes: ${PLAYER(g.mode, 0)} ${r.counts[0]} · ${PLAYER(g.mode, 1)} ${r.counts[1]}`),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => begin(C.newGame({ mode: prefs.mode })) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  const onVis = () => { if (document.hidden) stop(); else afterTurn(); };
  document.addEventListener('visibilitychange', onVis);
  intro();
  return {
    inProgress: () => !!(g && !g.over),
    restart: async () => { if (g && !g.over && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; stop(); intro(); },
    destroy() { gone = true; stop(); document.removeEventListener('visibilitychange', onVis); },
  };
}
