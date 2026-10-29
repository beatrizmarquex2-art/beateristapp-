// Dominó musical: tela. As regras estão em domino-logic.js; aqui só desenho, toques e a vez do Paul.
import { h } from '../util.js';
import { confirmSheet } from '../ui.js';
import * as G from './domino-logic.js';
import { getGame, setGame, sfx, figureEl, reduced } from './base.js';

const ID = 'domino';
const PLAYER = (mode, p) => (mode === 'paul' ? (p === 0 ? 'você' : 'Paul') : `jogador ${p + 1}`);
const REASON = { 'mao-vazia': 'esvaziou a mão', bloqueio: 'jogo travado: venceu a menor soma' };

/** Metade de uma peça: numeral pequeno + figuras. No desafio o numeral some (o nome fica no aria-label). */
function half(v, { hideNum }) {
  const figs = h('span', { class: 'jg-figs' });
  if (v === 0) figs.append(h('span', { class: 'jg-zero', 'aria-hidden': 'true' }, '—'));
  else G.FIGS[v].forEach((f) => figs.append(figureEl(f)));
  return h('span', { class: `jg-half v${v}`, 'aria-hidden': 'true' }, hideNum ? null : h('i', { class: 'jg-num' }, String(v)), figs);
}
const tileLabel = (a, b) => `peça ${G.valueName(a)} | ${G.valueName(b)}`;
const tileEl = (l, r, opts) => h('span', { class: `jg-tile${l === r ? ' dbl' : ''}`, 'data-l': l, 'data-r': r }, half(l, opts), h('b', { class: 'jg-cut', 'aria-hidden': 'true' }), half(r, opts));

export function mount(host) {
  let gone = false; let timer = 0;
  const saved = getGame(ID);
  const prefs = { mode: saved.mode === 'local' ? 'local' : 'paul', level: saved.level === 'desafio' ? 'desafio' : 'iniciante' };
  const rec = () => ({ w: 0, l: 0, e: 0, ...(saved.rec || {}) });
  let g = null; let selected = null; let msg = ''; let hidden = false; let names = false; let recorded = false;
  const root = h('div', { class: 'jg jg-domino' });
  host.replaceChildren(root);

  const persist = () => setGame(ID, { ...prefs, game: g && !g.over ? g : null, rec: saved.rec });
  const stop = () => { clearTimeout(timer); timer = 0; };
  const human = () => g && !g.over && !(g.mode === 'paul' && g.turn === 1);
  const say = (t) => { msg = t; const el = root.querySelector('.jg-msg'); if (el) el.textContent = t; };

  /* ---------- abertura ---------- */
  function intro() {
    stop(); g = null; selected = null;
    const resume = G.validGame(saved.game) && !saved.game.over ? saved.game : null;
    const r = rec();
    const seg = (key, opts) => h('div', { class: 'jg-seg', role: 'radiogroup' }, ...opts.map(([val, label]) => h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(prefs[key] === val), class: prefs[key] === val ? 'on' : '', onclick: () => { prefs[key] = val; setGame(ID, { [key]: val }); intro(); },
    }, label)));
    const legend = h('div', { class: 'jg-legend', role: 'list', 'aria-label': 'legenda das durações' }, ...[0, 1, 2, 3, 4, 5, 6].map((v) => h('div', { class: 'jg-leg', role: 'listitem', 'aria-label': G.valueName(v) }, half(v, {}), h('small', {}, v === 0 ? 'zero' : G.FIGS[v].map((f) => ({ seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' }[f])).join(' + ')))));
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'dominó'),
      h('p', { class: 'jg-p' }, 'neste jogo, a semínima vale 1 tempo. encaixe pelo valor total da metade, somando as durações.'),
      legend,
      h('p', { class: 'jg-lab' }, 'contra quem?'), seg('mode', [['paul', 'contra o paul'], ['local', 'dois no aparelho']]),
      h('p', { class: 'jg-lab' }, 'nível'), seg('level', [['iniciante', 'iniciante · com números'], ['desafio', 'desafio · sem números']]),
      h('details', { class: 'jg-rules' }, h('summary', {}, 'regras rápidas'),
        h('ul', {}, h('li', {}, 'cada um começa com 7 peças; o monte guarda as outras 14.'), h('li', {}, 'começa quem tem o maior duplo (sem duplo, a maior soma). quem começa abre com qualquer peça.'),
          h('li', {}, 'toque numa peça da mão e depois na ponta onde ela encaixa. o valor da metade precisa ser igual ao da ponta.'),
          h('li', {}, 'sem jogada? compre uma peça por vez até poder jogar. monte vazio e sem jogada: passe.'),
          h('li', {}, 'vence quem esvaziar a mão. duas passagens seguidas travam o jogo: vence a menor soma restante.'))),
      h('div', { class: 'jg-actions' },
        resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => begin(resume) }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => { g = null; begin(G.newGame({ mode: prefs.mode })); } }, resume ? 'nova partida' : 'iniciar')),
      r.w + r.l + r.e ? h('p', { class: 'jg-p muted' }, `contra o paul: ${r.w} vitória${r.w === 1 ? '' : 's'} · ${r.l} derrota${r.l === 1 ? '' : 's'} · ${r.e} empate${r.e === 1 ? '' : 's'}`) : null].filter(Boolean));
  }

  function begin(game) {
    g = game; recorded = false; names = false; selected = null; hidden = g.mode === 'local'; msg = '';
    if (g.mode === 'local') say(''); else say(`${PLAYER(g.mode, g.turn)} começa`);
    persist(); draw(); afterTurn();
  }

  /* ---------- mesa ---------- */
  const opts = () => ({ hideNum: prefs.level === 'desafio' });

  function paint() {
    if (!g) return;
    const e = G.ends(g.chain); const me = g.mode === 'paul' ? 0 : g.turn; const opp = 1 - me;
    const hand = g.hands[me];
    const sel = selected && hand.find((t) => t.id === selected);
    const sides = sel && !g.over ? G.sidesFor(sel, g.chain) : [];
    const canMove = human() && !hidden;
    const status = g.over ? '' : g.mode === 'paul' ? (g.turn === 0 ? 'sua vez' : 'vez do paul…') : `vez do ${PLAYER(g.mode, g.turn)}`;

    const chain = h('div', { class: 'jg-chain', tabindex: '0', role: 'group', 'aria-label': 'mesa: cadeia de peças, role para os lados' },
      g.chain.length ? g.chain.map((c) => h('div', { class: 'jg-slot', role: 'img', 'aria-label': tileLabel(c.l, c.r) }, tileEl(c.l, c.r, opts()))) : h('p', { class: 'jg-empty' }, 'mesa vazia: abra com qualquer peça'));
    const endBtn = (side) => {
      const ok = sides.includes(side) && g.chain.length > 0 && canMove;
      return h('button', { type: 'button', class: `jg-end${ok ? ' go' : ''}`, disabled: !ok, 'aria-label': `encaixar na ponta ${side === 'L' ? 'esquerda' : 'direita'}${e ? ` (valor ${e[side]})` : ''}`, onclick: () => play(side) },
        side === 'L' ? '◀' : null, h('b', {}, e ? String(e[side]) : '–'), side === 'R' ? '▶' : null);
    };
    const canD = human() && !hidden && G.canDraw(g); const canP = human() && !hidden && G.canPass(g);

    const handStrip = h('div', { class: 'jg-hand', role: 'group', 'aria-label': hidden ? 'mão oculta' : 'sua mão' }, hidden ? h('p', { class: 'jg-empty' }, 'mão oculta') : hand.map((t) => {
      const fits = G.sidesFor(t, g.chain).length > 0;
      return h('div', { class: 'jg-hcell' },
        h('button', { type: 'button', class: `jg-hbtn${t.id === selected ? ' sel' : ''}${canMove && fits ? ' fit' : ''}`, 'aria-pressed': String(t.id === selected), 'aria-label': tileLabel(t.a, t.b), disabled: !canMove, onclick: () => pick(t) }, tileEl(t.a, t.b, opts())),
        names ? h('small', { class: 'jg-nm' }, [t.a, t.b].map((v) => (v === 0 ? 'zero' : G.FIGS[v].map((f) => ({ seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' }[f])).join('+'))).join(' | ')) : null);
    }));

    root.replaceChildren(
      h('div', { class: 'jg-bar' },
        h('div', { class: 'jg-who' }, h('b', {}, g.mode === 'paul' ? 'paul' : `jogador ${opp + 1}`), h('span', {}, `${g.hands[opp].length} peça${g.hands[opp].length === 1 ? '' : 's'}`), h('span', { class: 'jg-back', 'aria-hidden': 'true' }, ...g.hands[opp].slice(0, 7).map(() => h('i', {})))),
        h('div', { class: 'jg-who' }, h('b', {}, 'monte'), h('span', {}, `${g.stock.length}`)),
        h('div', { class: 'jg-who' }, h('b', {}, 'pontas'), h('span', {}, e ? `${e.L} e ${e.R}` : '—'))),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, status),
      h('div', { class: 'jg-table' }, endBtn('L'), chain, endBtn('R')),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, msg),
      g.over ? result() : h('div', { class: 'jg-actions row' },
        h('button', { class: 'btn small', type: 'button', disabled: !canD, onclick: draw1 }, 'comprar'),
        h('button', { class: 'btn small', type: 'button', disabled: !canP, onclick: pass1 }, 'passar'),
        sel && canMove && g.chain.length && sides.length === 2 ? h('small', { class: 'muted' }, 'serve nas duas pontas: escolha uma') : null,
        prefs.level === 'desafio' && !hidden ? h('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': String(names), onclick: () => { names = !names; draw(); } }, names ? 'esconder nomes' : 'ver nomes') : null),
      handStrip);
    const ch = root.querySelector('.jg-chain'); if (ch && g.chain.length) ch.scrollLeft = ch.scrollWidth; // mostra a jogada mais recente
  }

  function pick(t) {
    if (!human() || hidden) return;
    sfx('tap');
    const sides = G.sidesFor(t, g.chain);
    if (!sides.length) { selected = null; const e = G.ends(g.chain); say(`essa peça não encaixa: as pontas valem ${e.L} e ${e.R}`); sfx('bad'); draw(); return; }
    selected = t.id; say('');
    if (sides.length === 1) { play(sides[0]); return; }
    say('escolha a ponta: ◀ ou ▶'); draw();
  }

  /* ---------- jogadas ---------- */
  function commit(next, note) {
    g = next; selected = null; say(note || ''); persist();
  }
  function play(side) {
    if (!human() || !selected) return;
    try { commit(G.applyPlay(g, g.turn, selected, side), ''); } catch (err) { say('jogada inválida'); draw(); return; }
    sfx('place'); afterMove();
  }
  function draw1() {
    if (!human() || !G.canDraw(g)) return;
    commit(G.applyDraw(g, g.turn), 'você comprou uma peça'); sfx('draw'); draw();
  }
  function pass1() {
    if (!human() || !G.canPass(g)) return;
    const who = g.turn; commit(G.applyPass(g, who), `${PLAYER(g.mode, who)} passou`); afterMove();
  }

  /** Depois de uma jogada/passada: fim de jogo, vez do Paul ou passagem do aparelho. */
  function afterMove() {
    if (g.over) return finishUp();
    if (g.mode === 'local') { hidden = true; draw(); return; }
    draw(); afterTurn();
  }
  function afterTurn() {
    stop();
    if (!g || g.over || gone || document.hidden) return;
    if (g.mode === 'paul' && g.turn === 1) timer = setTimeout(paulStep, reduced() ? 350 : 900);
  }
  function paulStep() {
    timer = 0; if (gone || !g || g.over || g.turn !== 1 || document.hidden) return;
    const mv = G.paulMove({ hand: g.hands[1], chain: g.chain, stockCount: g.stock.length });
    let note = '';
    if (mv.type === 'play') { g = G.applyPlay(g, 1, mv.id, mv.side); sfx('place'); const t = g.chain.find((c) => c.id === mv.id); note = `paul jogou ${t.l}|${t.r}`; }
    else if (mv.type === 'draw') { g = G.applyDraw(g, 1); sfx('draw'); note = 'paul comprou uma peça'; }
    else { g = G.applyPass(g, 1); note = 'paul passou'; }
    say(note); persist();
    if (g.over) { draw(); return finishUp(); }
    draw(); afterTurn();
  }

  function finishUp() {
    if (!recorded) {
      recorded = true;
      if (g.mode === 'paul') {
        const r = rec(); const w = g.result.winner;
        if (w === 0) r.w++; else if (w === 1) r.l++; else r.e++;
        saved.rec = r;
      }
    }
    setGame(ID, { ...prefs, game: null, rec: saved.rec });
    const w = g.result.winner; sfx(w == null ? 'tie' : g.mode === 'paul' && w === 1 ? 'lose' : 'win');
    draw();
  }

  function result() {
    const r = g.result; const w = r.winner;
    const title = w == null ? 'empate' : g.mode === 'paul' ? (w === 0 ? 'você venceu! 🤘' : 'o paul venceu') : `${PLAYER(g.mode, w)} venceu!`;
    return h('div', { class: 'jg-result', role: 'status' },
      h('h3', { class: 'hand' }, title),
      h('p', {}, w == null ? 'jogo travado com a mesma soma' : `${PLAYER(g.mode, w)} ${REASON[r.reason]}`),
      h('p', { class: 'muted' }, `soma restante: ${PLAYER(g.mode, 0)} ${r.totals[0]} · ${PLAYER(g.mode, 1)} ${r.totals[1]}`),
      h('div', { class: 'jg-actions row' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => begin(G.newGame({ mode: prefs.mode })) }, 'jogar de novo'),
        h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')));
  }

  function draw() {
    paint();
    if (!(g && g.mode === 'local' && hidden && !g.over)) return;
    root.querySelector('.jg-hand').replaceChildren();
    root.append(h('div', { class: 'jg-cover', role: 'dialog', 'aria-label': 'passe o aparelho' },
      h('p', { class: 'hand' }, `passe o aparelho para o ${PLAYER(g.mode, g.turn)}`), h('p', { class: 'muted' }, 'as peças estão escondidas'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => { hidden = false; sfx('tap'); paint(); } }, `sou o ${PLAYER(g.mode, g.turn)}, mostrar minha mão`)));
    root.querySelector('.jg-cover button').focus();
  }

  /* ---------- controles do topo (usados pela tela do catálogo) ---------- */
  const onVis = () => { if (document.hidden) stop(); else afterTurn(); };
  document.addEventListener('visibilitychange', onVis);

  intro();
  return {
    inProgress: () => !!(g && !g.over),
    restart: async () => { if (g && !g.over && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; stop(); intro(); },
    destroy() { gone = true; stop(); document.removeEventListener('visibilitychange', onVis); },
  };
}
