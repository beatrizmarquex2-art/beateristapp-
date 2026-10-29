// Dominó musical: regras puras (sem tela). Duplo-seis, 28 peças; cada lado vale de 0 a 6.
// Referência didática: a semínima vale 1 tempo. 0 = sem figura; 1 = semínima; 2 = mínima; 3 = mínima + semínima; 4 = semibreve; 5 = semibreve + semínima; 6 = semibreve + mínima.
export const MAX = 6;
export const HAND = 7;
export const FIGS = { 0: [], 1: ['seminima'], 2: ['minima'], 3: ['minima', 'seminima'], 4: ['semibreve'], 5: ['semibreve', 'seminima'], 6: ['semibreve', 'minima'] };
export const FIG_NAMES = { seminima: 'semínima', minima: 'mínima', semibreve: 'semibreve' };
const BEATS = { seminima: 1, minima: 2, semibreve: 4 };

/** Os valores têm de bater com as figuras (a soma das durações é o valor da metade). */
export const beatsOf = (figs) => figs.reduce((s, f) => s + BEATS[f], 0);
export const valueName = (v) => (v === 0 ? 'zero — sem figura' : `${v} — ${FIGS[v].map((f) => FIG_NAMES[f]).join(' + ')}`);

export const tileId = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
export const makeTiles = () => { const t = []; for (let a = 0; a <= MAX; a++) for (let b = a; b <= MAX; b++) t.push({ id: tileId(a, b), a, b }); return t; };
export const tileSum = (t) => t.a + t.b;
export const handSum = (hand) => hand.reduce((s, t) => s + tileSum(t), 0);
export const isDouble = (t) => t.a === t.b;

/** Fisher–Yates com gerador injetável (rnd devolve [0,1)). */
export function shuffle(list, rnd = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Quem começa: maior duplo; sem duplo, maior soma, desempate pelo maior lado. */
export function starter(hands) {
  let best = null;
  hands.forEach((hand, p) => hand.forEach((t) => {
    const key = isDouble(t) ? [2, t.a, 0] : [1, tileSum(t), Math.max(t.a, t.b)];
    if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && (key[1] > best.key[1] || (key[1] === best.key[1] && key[2] > best.key[2])))) best = { p, tile: t, key };
  }));
  return best.p;
}

/** Cadeia: lista de { id, l, r } na ordem da mesa; as pontas são chain[0].l e o último .r. */
export const ends = (chain) => (chain.length ? { L: chain[0].l, R: chain[chain.length - 1].r } : null);

/** Em quais pontas a peça encaixa (mesa vazia: qualquer peça abre). */
export function sidesFor(tile, chain) {
  const e = ends(chain); if (!e) return ['R'];
  const s = [];
  if (tile.a === e.L || tile.b === e.L) s.push('L');
  if (tile.a === e.R || tile.b === e.R) s.push('R');
  return s;
}
export const legalMoves = (hand, chain) => hand.flatMap((t) => sidesFor(t, chain).map((side) => ({ id: t.id, side })));

/** Devolve a cadeia nova com a peça orientada para encaixar. Lança erro se a peça não servir. */
export function place(chain, tile, side) {
  if (!sidesFor(tile, chain).includes(side)) throw new Error('peça não encaixa');
  const e = ends(chain);
  if (!e) return [{ id: tile.id, l: tile.a, r: tile.b }];
  if (side === 'R') { const flip = tile.a !== e.R; return [...chain, { id: tile.id, l: flip ? tile.b : tile.a, r: flip ? tile.a : tile.b }]; }
  const flip = tile.b !== e.L; return [{ id: tile.id, l: flip ? tile.b : tile.a, r: flip ? tile.a : tile.b }, ...chain];
}

/* ---------- partida ---------- */
export function newGame({ mode = 'paul', rnd = Math.random } = {}) {
  const deck = shuffle(makeTiles(), rnd);
  const hands = [deck.slice(0, HAND), deck.slice(HAND, HAND * 2)];
  const stock = deck.slice(HAND * 2);
  return { v: 1, mode, hands, stock, chain: [], turn: starter(hands), passes: 0, over: false, result: null, log: [] };
}
const clone = (g) => JSON.parse(JSON.stringify(g));
const finish = (g, winner, reason) => {
  const totals = g.hands.map(handSum);
  g.over = true; g.result = { winner, reason, totals };
  return g;
};

/** O jogador da vez pode comprar? Só sem jogada e com monte. */
export const canDraw = (g) => !g.over && g.stock.length > 0 && legalMoves(g.hands[g.turn], g.chain).length === 0;
export const canPass = (g) => !g.over && g.stock.length === 0 && legalMoves(g.hands[g.turn], g.chain).length === 0;

export function applyPlay(g0, player, id, side) {
  if (g0.over || player !== g0.turn) throw new Error('não é a vez');
  const g = clone(g0); const hand = g.hands[player]; const i = hand.findIndex((t) => t.id === id);
  if (i < 0) throw new Error('peça não está na mão');
  g.chain = place(g.chain, hand[i], side); hand.splice(i, 1); g.passes = 0;
  if (!hand.length) return finish(g, player, 'mao-vazia');
  g.turn = 1 - player; return g;
}
export function applyDraw(g0, player) {
  if (player !== g0.turn || !canDraw(g0)) throw new Error('não pode comprar');
  const g = clone(g0); g.hands[player].push(g.stock.pop()); return g;
}
export function applyPass(g0, player) {
  if (player !== g0.turn || !canPass(g0)) throw new Error('não pode passar');
  const g = clone(g0); g.passes += 1;
  if (g.passes >= 2) {
    const [x, y] = g.hands.map(handSum);
    return finish(g, x === y ? null : (x < y ? 0 : 1), 'bloqueio');
  }
  g.turn = 1 - player; return g;
}

/** O Paul só enxerga a própria mão, a mesa e quantas peças o adversário tem. Prefere descartar valores altos. */
export function paulMove({ hand, chain, stockCount }, rnd = Math.random) {
  const moves = legalMoves(hand, chain);
  if (moves.length) {
    const score = (m) => { const t = hand.find((x) => x.id === m.id); return tileSum(t) + (isDouble(t) ? 0.5 : 0) + rnd() * 0.1; };
    return { type: 'play', ...moves.reduce((b, m) => (score(m) > score(b) ? m : b)) };
  }
  return stockCount > 0 ? { type: 'draw' } : { type: 'pass' };
}

/** Confere um estado salvo (dados antigos ou corrompidos não podem quebrar o app). */
export function validGame(g) {
  try {
    if (!g || g.v !== 1 || !Array.isArray(g.hands) || g.hands.length !== 2 || !Array.isArray(g.stock) || !Array.isArray(g.chain)) return false;
    if (g.turn !== 0 && g.turn !== 1) return false;
    const all = [...g.hands[0], ...g.hands[1], ...g.stock].map((t) => t.id);
    const placed = g.chain.map((c) => c.id);
    const ids = [...all, ...placed];
    if (ids.length !== 28 || new Set(ids).size !== 28) return false;
    const ref = new Set(makeTiles().map((t) => t.id)); if (!ids.every((i) => ref.has(i))) return false;
    for (const t of [...g.hands[0], ...g.hands[1], ...g.stock]) if (t.id !== tileId(t.a, t.b)) return false;
    for (let i = 1; i < g.chain.length; i++) if (g.chain[i - 1].r !== g.chain[i].l) return false;
    return Number.isInteger(g.passes) && g.passes >= 0 && g.passes < 3;
  } catch { return false; }
}
