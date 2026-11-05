// Uno Musical: regras puras (sem tela). 112 cartas = 4 cores × (10 figuras × 2 + pular/inverter/+2 × 2) + 4 curingas + 4 curingas +4.
// As figuras são só CATEGORIAS de associação (mesma cor ou mesma figura). 2 a 4 jogadores, com sentido de jogo.
import { SYMS, SYM_NAME } from './cartas-simbolos.js';

export const COLORS = ['vermelho', 'amarelo', 'azul', 'verde'];
export const COLOR_NAME = { vermelho: 'vermelho', amarelo: 'amarelo', azul: 'azul', verde: 'verde' };
export const ACTIONS = ['pular', 'inverter', 'mais2'];
export const ACTION_NAME = { pular: 'pular', inverter: 'inverter', mais2: '+2', curinga: 'curinga', mais4: '+4' };
export { SYMS, SYM_NAME };
export const HAND = 7;
export const DECK_SIZE = 112;

export const isFig = (c) => c.kind === 'fig';
export const isWild = (c) => c.kind === 'curinga' || c.kind === 'mais4';
export const isAction = (c) => !isFig(c);
export const cardName = (c) => (c.kind === 'curinga' ? 'curinga (muda a cor)' : c.kind === 'mais4' ? 'curinga +4' : `${isFig(c) ? SYM_NAME[c.sym] : ACTION_NAME[c.kind]} ${COLOR_NAME[c.color]}`);

export function makeDeck() {
  const d = []; let n = 0;
  for (const color of COLORS) {
    for (const sym of SYMS) for (let k = 0; k < 2; k++) d.push({ id: `c${n++}`, color, kind: 'fig', sym });
    for (const a of ACTIONS) for (let k = 0; k < 2; k++) d.push({ id: `c${n++}`, color, kind: a, sym: null });
  }
  for (const w of ['curinga', 'mais4']) for (let k = 0; k < 4; k++) d.push({ id: `c${n++}`, color: null, kind: w, sym: null });
  return d;
}
export function shuffle(list, rnd = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * Pode jogar `card` sobre `top` com a cor ativa `color`?
 * Curinga sempre; curinga +4 só sem carta da cor ativa na mão (`hand`); senão mesma cor, ou mesma figura (carta de figura),
 * ou mesma ação (carta de ação). Topo curinga só vale pela cor escolhida.
 */
export function playable(card, top, color, hand) {
  if (card.kind === 'curinga') return true;
  if (card.kind === 'mais4') return !hand || !hand.some((c) => c.color === color);
  if (card.color === color) return true;
  if (isWild(top)) return false;
  return isFig(card) ? isFig(top) && card.sym === top.sym : card.kind === top.kind;
}
export const topOf = (g) => g.discard[g.discard.length - 1];
/** Com carta recém-comprada só ela pode ser jogada. */
export const legalCards = (g, p) => g.hands[p].filter((c) => (g.drawn ? c.id === g.drawn : true) && playable(c, topOf(g), g.color, g.hands[p]));
/** Cartas que ainda dá para comprar (monte + descarte reciclável sem o topo). */
export const available = (g) => g.draw.length + Math.max(0, g.discard.length - 1);
/** Jogador que vem `k` passos depois de `p`, no sentido atual. */
export const adv = (g, p, k = 1) => (((p + g.dir * k) % g.n) + g.n) % g.n;

export function newGame({ mode = 'paul', players = 2, rnd = Math.random } = {}) {
  const n = mode === 'paul' ? Math.max(2, Math.min(4, players | 0 || 2)) : 2;
  const deck = shuffle(makeDeck(), rnd);
  const hands = Array.from({ length: n }, (_, i) => deck.slice(i * HAND, (i + 1) * HAND));
  let rest = deck.slice(n * HAND);
  const i = rest.findIndex(isFig); const open = rest[i];
  rest = shuffle(rest.filter((_, k) => k !== i), rnd); // a carta aberta é sempre de figura; as outras voltam ao monte embaralhadas
  return { v: 2, mode, n, dir: 1, hands, draw: rest, discard: [open], color: open.color, turn: Math.floor(rnd() * n), drawn: null, passes: 0, over: false, result: null, unoPending: null, unoSaid: null, shuf: 0, seq: 0, ev: { t: 'start' } };
}
const clone = (g) => JSON.parse(JSON.stringify(g));

function take(g, k, rnd) {
  const got = [];
  for (let i = 0; i < k; i++) {
    if (!g.draw.length && g.discard.length > 1) { const top = g.discard.pop(); g.draw = shuffle(g.discard, rnd); g.discard = [top]; g.shuf += 1; }
    if (!g.draw.length) break;
    got.push(g.draw.pop());
  }
  return got;
}
const end = (g, winner, reason) => { g.over = true; g.result = { winner, reason, counts: g.hands.map((h) => h.length) }; return g; };
const next = (g, ev) => { g.seq += 1; g.ev = ev; return g; };

export const canDraw = (g) => !g.over && !g.drawn && legalCards(g, g.turn).length === 0 && available(g) > 0;
export const canPass = (g) => !g.over && (g.drawn ? true : legalCards(g, g.turn).length === 0 && available(g) === 0);

export function applyPlay(g0, p, cardId, color, rnd = Math.random) {
  if (g0.over || p !== g0.turn) throw new Error('não é a vez');
  const g = clone(g0); const hand = g.hands[p]; const i = hand.findIndex((c) => c.id === cardId);
  if (i < 0) throw new Error('carta não está na mão');
  const card = hand[i];
  if (g.drawn && g.drawn !== cardId) throw new Error('só a carta comprada');
  if (!playable(card, topOf(g), g.color, hand)) throw new Error('carta não serve');
  if (isWild(card) && !COLORS.includes(color)) throw new Error('escolha uma cor');
  hand.splice(i, 1); g.discard.push(card); g.color = isWild(card) ? color : card.color; g.drawn = null; g.passes = 0;
  if (g.unoPending === p) g.unoPending = null; g.unoSaid = g.unoSaid === p ? null : g.unoSaid;
  const ev = { t: 'play', by: p, id: card.id, kind: card.kind, color: g.color, victim: null, n: 0 };
  const first = adv(g, p, 1);
  let nxt = first;
  if (card.kind === 'pular') { ev.victim = first; nxt = adv(g, p, 2); }
  else if (card.kind === 'inverter') {
    g.dir = -g.dir;
    if (g.n === 2) { ev.victim = first; nxt = p; } else nxt = adv(g, p, 1);
  } else if (card.kind === 'mais2' || card.kind === 'mais4') {
    const got = take(g, card.kind === 'mais2' ? 2 : 4, rnd); g.hands[first].push(...got);
    ev.victim = first; ev.n = got.length; nxt = adv(g, p, 2);
  }
  ev.dir = g.dir;
  if (!hand.length) { g.turn = p; next(g, ev); return end(g, p, 'mao-vazia'); }
  if (hand.length === 1) g.unoPending = p;
  g.turn = nxt; return next(g, ev);
}
export function applyDraw(g0, p, rnd = Math.random) {
  if (p !== g0.turn || !canDraw(g0)) throw new Error('não pode comprar');
  const g = clone(g0); const [c] = take(g, 1, rnd); g.hands[p].push(c); g.passes = 0;
  if (g.unoPending === p) g.unoPending = null; if (g.unoSaid === p) g.unoSaid = null;
  const fits = playable(c, topOf(g), g.color, g.hands[p]);
  if (fits) g.drawn = c.id; else { g.drawn = null; g.turn = adv(g, p, 1); }
  return next(g, { t: 'draw', by: p, n: 1, id: c.id, fits });
}
export function applyPass(g0, p) {
  if (p !== g0.turn || !canPass(g0)) throw new Error('não pode passar');
  const g = clone(g0);
  if (g.drawn) { g.drawn = null; g.turn = adv(g, p, 1); return next(g, { t: 'pass', by: p }); }
  g.passes += 1;
  if (g.passes >= g.n) {
    const lens = g.hands.map((h) => h.length); const min = Math.min(...lens); const who = lens.flatMap((l, i) => (l === min ? [i] : []));
    next(g, { t: 'pass', by: p }); return end(g, who.length === 1 ? who[0] : null, 'bloqueio');
  }
  g.turn = adv(g, p, 1); return next(g, { t: 'pass', by: p });
}

/** Quem ficou com 1 carta avisa "UNO!" (botão). Só vale se a carta que sobrou ainda é a única. */
export const mustUno = (g, p) => !g.over && g.unoPending === p && g.hands[p].length === 1;
export function callUno(g0, p) {
  if (!mustUno(g0, p)) throw new Error('não precisa de UNO');
  const g = clone(g0); g.unoPending = null; g.unoSaid = p; return next(g, { t: 'uno', by: p });
}
/** Esqueceu o UNO e foi pego: compra 2 cartas. */
export function catchUno(g0, p, rnd = Math.random) {
  if (!mustUno(g0, p)) throw new Error('ninguém a pegar');
  const g = clone(g0); const got = take(g, 2, rnd); g.hands[p].push(...got); g.unoPending = null;
  return next(g, { t: 'catch', by: p, n: got.length });
}

/**
 * Computador: só usa a própria mão (g.hands[p]), o descarte, a cor ativa e se pode comprar. Prefere ações, guarda curingas pro fim
 * e, no curinga, escolhe a cor que mais aparece na mão. As mesmas regras do jogador (legalCards/canDraw).
 */
export function paulMove(g, p, rnd = Math.random) {
  const legal = legalCards(g, p);
  if (legal.length) {
    const cnt = Object.fromEntries(COLORS.map((k) => [k, 0])); g.hands[p].forEach((c) => { if (c.color) cnt[c.color]++; });
    const rank = (c) => (c.kind === 'mais2' ? 40 : c.kind === 'pular' || c.kind === 'inverter' ? 30 : isFig(c) ? 10 + cnt[c.color] * 0.3 : 0) + rnd() * 0.5;
    const card = legal.reduce((b, c) => (rank(c) > rank(b) ? c : b));
    let color; if (isWild(card)) color = COLORS.reduce((b, k) => ((cnt[k] || 0) > (cnt[b] || 0) ? k : b), g.color);
    return { type: 'play', id: card.id, color };
  }
  if (canDraw(g)) return { type: 'draw' };
  return { type: 'pass' };
}

export function validGame(g) {
  try {
    if (!g || g.v !== 2 || !Array.isArray(g.hands) || g.hands.length !== g.n || g.n < 2 || g.n > 4 || !Array.isArray(g.draw) || !Array.isArray(g.discard) || !g.discard.length) return false;
    if (!Number.isInteger(g.turn) || g.turn < 0 || g.turn >= g.n || (g.dir !== 1 && g.dir !== -1) || !COLORS.includes(g.color)) return false;
    const all = [...g.hands.flat(), ...g.draw, ...g.discard]; const ref = new Map(makeDeck().map((c) => [c.id, c]));
    if (all.length !== DECK_SIZE || new Set(all.map((c) => c.id)).size !== DECK_SIZE) return false;
    for (const c of all) { const r = ref.get(c.id); if (!r || r.kind !== c.kind || r.sym !== c.sym || r.color !== c.color) return false; }
    if (g.drawn && !g.hands[g.turn].some((c) => c.id === g.drawn)) return false;
    return Number.isInteger(g.passes) && g.passes >= 0 && g.passes < g.n && Number.isInteger(g.seq);
  } catch { return false; }
}
