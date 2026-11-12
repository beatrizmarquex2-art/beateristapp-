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
  if (card.kind === 'mais4') return !hand || (hand.length >= 3 && !hand.some((c) => c.color === color)); // nunca como última carta nem pra ficar com UNO (ganharia na hora)
  if (card.color === color) return true;
  if (isWild(top)) return false;
  return isFig(card) ? isFig(top) && card.sym === top.sym : card.kind === top.kind;
}
export const topOf = (g) => g.discard[g.discard.length - 1];
/** Com carta recém-comprada só ela pode ser jogada. */
export const legalCards = (g, p) => g.hands[p].filter((c) => (g.drawn ? c.id === g.drawn : true) && canPlayCard(g, c, g.hands[p]));
/** Uma carta pode ser jogada agora? No UN🚫: o +4 sai quando quiser, e com +2/+4 acumulado só dá pra responder com o mesmo tipo. */
export function canPlayCard(g, card, hand) {
  if (g.un) {
    if (g.pend) return card.kind === g.pend.kind;
    if (card.kind === 'mais4') return true;
  }
  return playable(card, topOf(g), g.color, hand);
}
/** Cartas que ainda dá para comprar (monte + descarte reciclável sem o topo). */
export const available = (g) => g.draw.length + Math.max(0, g.discard.length - 1);
/** Jogador que vem `k` passos depois de `p`, no sentido atual. */
export const adv = (g, p, k = 1) => (((p + g.dir * k) % g.n) + g.n) % g.n;

export function newGame({ mode = 'paul', players = 2, rnd = Math.random, un = false } = {}) {
  const n = mode === 'paul' || mode === 'local' ? Math.max(2, Math.min(4, players | 0 || 2)) : 2; // contra o computador e no mesmo celular: 2 a 4 jogadores
  const deck = shuffle(makeDeck(), rnd);
  const hands = Array.from({ length: n }, (_, i) => deck.slice(i * HAND, (i + 1) * HAND));
  let rest = deck.slice(n * HAND);
  const i = rest.findIndex(isFig); const open = rest[i];
  rest = shuffle(rest.filter((_, k) => k !== i), rnd); // a carta aberta é sempre de figura; as outras voltam ao monte embaralhadas
  return { v: 2, mode, n, dir: 1, hands, draw: rest, discard: [open], color: open.color, turn: Math.floor(rnd() * n), drawn: null, passes: 0, over: false, result: null, unoPending: null, unoSaid: null, shuf: 0, seq: 0, ev: { t: 'start' }, ...(un ? { un: true, pend: null } : {}) };
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

export const canDraw = (g) => !g.over && !g.drawn && (g.pend || legalCards(g, g.turn).length === 0) && available(g) > 0;
export const canPass = (g) => !g.over && !g.pend && (g.drawn ? true : legalCards(g, g.turn).length === 0 && available(g) === 0);

export function applyPlay(g0, p, cardId, color, rnd = Math.random) {
  if (g0.over || p !== g0.turn) throw new Error('não é a vez');
  const g = clone(g0); const hand = g.hands[p]; const i = hand.findIndex((c) => c.id === cardId);
  if (i < 0) throw new Error('carta não está na mão');
  const card = hand[i];
  if (g.drawn && g.drawn !== cardId) throw new Error('só a carta comprada');
  if (!canPlayCard(g, card, hand)) throw new Error('carta não serve');
  if (isWild(card) && !COLORS.includes(color)) throw new Error('escolha uma cor');
  if (g.un) fechaJanelaUno(g, p);
  hand.splice(i, 1); g.discard.push(card); g.color = isWild(card) ? color : card.color; g.drawn = null; g.passes = 0;
  if (g.unoPending === p) g.unoPending = null; g.unoSaid = g.unoSaid === p ? null : g.unoSaid;
  const ev = { t: 'play', by: p, id: card.id, kind: card.kind, color: g.color, victim: null, n: 0 };
  const first = adv(g, p, 1);
  let nxt = first;
  if (card.kind === 'pular') { ev.victim = first; nxt = adv(g, p, 2); }
  else if (card.kind === 'inverter') {
    g.dir = -g.dir;
    if (g.n === 2) { ev.victim = first; nxt = p; } else nxt = adv(g, p, 1);
  } else if (g.un && (card.kind === 'mais2' || card.kind === 'mais4')) {
    // UN🚫: o +2 e o +4 acumulam; quem recebe responde com o mesmo tipo ou compra tudo
    const add = card.kind === 'mais2' ? 2 : 4; g.pend = { kind: card.kind, n: (g.pend ? g.pend.n : 0) + add };
    ev.victim = first; ev.pend = g.pend.n;
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
  const g = clone(g0);
  if (g.un) fechaJanelaUno(g, p);
  if (g.un && g.pend) { // UN🚫: não tem como responder (ou não quis): compra tudo que acumulou e perde a vez
    const got = take(g, g.pend.n, rnd); g.hands[p].push(...got); const n = got.length; g.pend = null; g.passes = 0; g.drawn = null;
    if (g.unoPending === p) g.unoPending = null; if (g.unoSaid === p) g.unoSaid = null;
    g.turn = adv(g, p, 1); return next(g, { t: 'draw', by: p, n, id: got.length ? got[got.length - 1].id : null, fits: false, pend: true });
  }
  if (g.un) { // UN🚫: compra até achar uma carta que dá pra jogar
    let n = 0; let c = null; let fits = false;
    while (available(g) > 0) { [c] = take(g, 1, rnd); if (!c) break; g.hands[p].push(c); n++; if (canPlayCard(g, c, g.hands[p])) { fits = true; break; } }
    g.passes = 0; if (g.unoPending === p) g.unoPending = null; if (g.unoSaid === p) g.unoSaid = null;
    if (fits) g.drawn = c.id; else { g.drawn = null; g.turn = adv(g, p, 1); }
    return next(g, { t: 'draw', by: p, n, id: c ? c.id : null, fits });
  }
  const [c] = take(g, 1, rnd); g.hands[p].push(c); g.passes = 0;
  if (g.unoPending === p) g.unoPending = null; if (g.unoSaid === p) g.unoSaid = null;
  const fits = playable(c, topOf(g), g.color, g.hands[p]);
  if (fits) g.drawn = c.id; else { g.drawn = null; g.turn = adv(g, p, 1); }
  return next(g, { t: 'draw', by: p, n: 1, id: c.id, fits });
}
export function applyPass(g0, p) {
  if (p !== g0.turn || !canPass(g0)) throw new Error('não pode passar');
  const g = clone(g0); if (g.un) fechaJanelaUno(g, p);
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


/* ---------- UN🚫 (variante): cartas iguais juntas, UNO silencioso, acusação errada ---------- */
/** No UN🚫 a chance de pegar quem esqueceu o UNO acaba quando a próxima pessoa joga, compra ou passa. */
function fechaJanelaUno(g, p) { if (g.unoPending != null && g.unoPending !== p) g.unoPending = null; }
const sameCard = (a, b) => a.kind === b.kind && a.color === b.color && a.sym === b.sym;
/** Cartas da mão idênticas a `card` (mesma cor e figura), contando ela mesma. Só figuras repetem juntas. */
export const twins = (g, p, card) => (g.un && isFig(card) && !g.drawn && !g.pend ? g.hands[p].filter((c) => isFig(c) && sameCard(c, card)) : [card]);
/** Joga 2 ou mais figuras idênticas de uma vez (UN🚫). */
export function applyPlayMany(g0, p, ids) {
  if (!g0.un || g0.over || p !== g0.turn || g0.drawn || g0.pend) throw new Error('não pode jogar junto');
  const g = clone(g0); const hand = g.hands[p]; const cards = ids.map((id) => hand.find((c) => c.id === id));
  if (cards.length < 2 || cards.some((c) => !c || !isFig(c) || !sameCard(c, cards[0]))) throw new Error('só figuras iguais');
  if (!canPlayCard(g, cards[0], hand)) throw new Error('carta não serve');
  fechaJanelaUno(g, p);
  g.hands[p] = hand.filter((c) => !ids.includes(c.id)); g.discard.push(...cards); g.color = cards[0].color; g.drawn = null; g.passes = 0;
  if (g.unoPending === p) g.unoPending = null; g.unoSaid = g.unoSaid === p ? null : g.unoSaid;
  const ev = { t: 'play', by: p, id: cards[cards.length - 1].id, kind: 'fig', color: g.color, victim: null, n: 0, many: cards.length, dir: g.dir };
  if (!g.hands[p].length) { g.turn = p; next(g, ev); return end(g, p, 'mao-vazia'); }
  if (g.hands[p].length === 1) g.unoPending = p;
  g.turn = adv(g, p, 1); return next(g, ev);
}
/** Acusou "pegou!" sem ninguém ter esquecido o UNO: quem acusou compra 2. */
export function wrongCatch(g0, p, rnd = Math.random) {
  if (!g0.un || g0.over) throw new Error('não vale aqui');
  const g = clone(g0); const got = take(g, 2, rnd); g.hands[p].push(...got);
  return next(g, { t: 'wrong', by: p, n: got.length });
}
/** Alguém que dá pra pegar agora (esqueceu o UNO e a janela ainda está aberta)? Devolve o número do jogador ou null. */
export const catchable = (g, me) => (g.un && g.unoPending != null && g.unoPending !== me && mustUno(g, g.unoPending) ? g.unoPending : null);

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

/* ---------- Modo Aventura: estilos de adversário e medição (só acrescenta; as regras e o paulMove ficam como estão) ---------- */
export const AI_STYLES = ['distraido', 'paul', 'guardiao', 'pintor', 'esperto'];
export const isSpecial = (c) => c.kind !== 'fig'; // pular, inverter, +2, curinga e +4
/** Gerador com semente (mesma semente = mesma sequência): baralho/embaralhadas das missões. */
export const seededRnd = (s) => { let x = (Number(s) || 1) >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32; }; };
const countColors = (hand, skipId) => { const cnt = Object.fromEntries(COLORS.map((k) => [k, 0])); hand.forEach((c) => { if (c.color && c.id !== skipId) cnt[c.color]++; }); return cnt; };
const bestColor = (hand, card, fallback) => { const cnt = countColors(hand, card.id); return COLORS.reduce((b, k) => (cnt[k] > cnt[b] ? k : b), fallback); };
const pickMax = (list, score, rnd) => list.reduce((b, c) => { const s = score(c) + rnd() * 0.01; return s > b.s ? { c, s } : b; }, { c: null, s: -Infinity }).c;

/**
 * Jogada do computador por estilo (mesmas regras do jogo; só muda a escolha entre as cartas que já servem — legalCards já cuida do +4):
 *  distraido: qualquer carta que serve, cor do curinga ao acaso. paul: o Paul de sempre (prefere ações).
 *  guardiao: guarda as cartas especiais pro fim (ou pra quando o adversário está com 2 cartas ou menos); curinga só sem outra saída.
 *  pintor: joga primeiro as cores que tem pouco, para ficar só com uma cor; curinga escolhe a cor mais frequente.
 *  esperto: ações cedo (valem jogada extra), cor mais frequente, guarda curinga/+4 pro fim; com o adversário quase ganhando corta a vez.
 */
export function aiMove(g, p = 1, style = 'paul', rnd = Math.random) {
  if (style === 'paul' || !AI_STYLES.includes(style)) return paulMove(g, p, rnd);
  const legal = legalCards(g, p);
  if (!legal.length) return canDraw(g) ? { type: 'draw' } : { type: 'pass' };
  const hand = g.hands[p]; const opp = Math.min(...g.hands.filter((_, i) => i !== p).map((x) => x.length)); const cnt = countColors(hand);
  let card;
  if (style === 'distraido') card = legal[Math.floor(rnd() * legal.length)];
  else if (style === 'guardiao') {
    const figs = legal.filter(isFig); const sp = legal.filter((c) => !isWild(c) && isSpecial(c)); const wild = legal.filter(isWild);
    const spRank = (c) => (c.kind === 'mais2' ? 3 : 2);
    if (opp <= 2 && (sp.length || wild.length)) card = sp.length ? pickMax(sp, spRank, rnd) : wild.find((c) => c.kind === 'mais4') || wild[0];
    else if (figs.length) card = pickMax(figs, (c) => cnt[c.color], rnd);
    else card = sp.length ? pickMax(sp, spRank, rnd) : wild[0];
  } else if (style === 'pintor') {
    const non = legal.filter((c) => !isWild(c));
    card = non.length ? pickMax(non, (c) => -cnt[c.color], rnd) : legal[0];
  } else { // esperto
    const non = legal.filter((c) => !isWild(c));
    if (non.length && !(opp <= 2 && legal.some(isWild) && !non.some(isSpecial))) {
      card = pickMax(non, (c) => (c.kind === 'mais2' ? 50 : isSpecial(c) ? 40 : 0) + (opp <= 2 && isSpecial(c) ? 30 : 0) + cnt[c.color] * 2, rnd);
    } else card = legal.find((c) => c.kind === 'mais4') || legal.find(isWild) || legal[0];
  }
  let color;
  if (isWild(card)) color = style === 'distraido' ? COLORS[Math.floor(rnd() * 4)] : bestColor(hand, card, g.color);
  return { type: 'play', id: card.id, color };
}

/** Medição da partida do jogador (só o que o motor realmente observa). `caught` = vezes que esqueceu o UNO e comprou 2. */
export const newStats = () => ({ rounds: 0, draws: 0, plays: 0, passes: 0, specials: 0, caught: 0, byKind: { pular: 0, inverter: 0, mais2: 0, curinga: 0, mais4: 0 }, open: false });
/** Registra UMA ação do jogador `me`. `before`/`after` = estado antes/depois; `act` = { type:'play'|'draw'|'pass', id }. Rodada = vez do jogador (jogadas extras por pular/+2 contam na mesma). */
export function track(st, before, after, act, me = 0) {
  if (!st.open) { st.rounds++; st.open = true; }
  if (act.type === 'draw') st.draws++;
  else if (act.type === 'pass') st.passes++;
  else {
    st.plays++; const c = before.hands[me].find((x) => x.id === act.id);
    if (c && isSpecial(c)) { st.specials++; st.byKind[c.kind]++; }
  }
  if (after.over || after.turn !== me) st.open = false;
  return st;
}
/** Resultado entregue ao Modo Aventura. `me` = índice do jogador (0). */
export function matchResult(g, st, me = 0) {
  const w = g.result.winner;
  return { won: w === me, tie: w == null, lost: w != null && w !== me, reason: g.result.reason, rounds: st.rounds, draws: st.draws, plays: st.plays, specials: st.specials, caught: st.caught || 0, byKind: { ...st.byKind }, mine: g.result.counts[me], theirs: Math.min(...g.result.counts.filter((_, i) => i !== me)) };
}

/**
 * Partida inteira de 2 jogadores simulada com a MESMA ordem de uso do sorteio que a tela usa (viabilidade das missões e testes).
 * params = { seed, style }; policy(g, rnd) → jogada do jogador 0 ({type,id,color}). O jogador sempre aperta UNO; o computador também.
 * Devolve { ...matchResult, g, acts } (acts = ações do jogador, com `uno` quando apertou o botão) ou null se não terminou.
 */
export function simulate(params, policy, maxSteps = 3000) {
  const rnd = seededRnd(params.seed); const prnd = seededRnd((Number(params.seed) || 1) + 99991); /* sorteio PRÓPRIO do jogador: a pessoa não consome o sorteio da mesa */
  let g = newGame({ mode: 'paul', players: 2, rnd }); const st = newStats(); const acts = []; let n = 0;
  while (!g.over && n++ < maxSteps) {
    if (g.turn === 0) {
      const mv = policy(g, prnd); const b = g;
      acts.push({ type: mv.type, idx: mv.type === 'play' ? g.hands[0].findIndex((c) => c.id === mv.id) : -1, id: mv.id, color: mv.color });
      g = mv.type === 'play' ? applyPlay(g, 0, mv.id, mv.color, rnd) : mv.type === 'draw' ? applyDraw(g, 0, rnd) : applyPass(g, 0);
      track(st, b, g, mv, 0);
      if (!g.over && mustUno(g, 0)) { g = callUno(g, 0); acts.push({ type: 'uno' }); }
    } else {
      const mv = aiMove(g, 1, params.style, rnd);
      g = mv.type === 'play' ? applyPlay(g, 1, mv.id, mv.color, rnd) : mv.type === 'draw' ? applyDraw(g, 1, rnd) : applyPass(g, 1);
      if (!g.over && mustUno(g, 1)) g = callUno(g, 1);
    }
  }
  return g.over ? { ...matchResult(g, st, 0), g, acts } : null;
}
/** Jogador de referência: usa o mesmo critério de cada estilo de computador. */
export const playerPolicy = (style = 'esperto') => (g, rnd) => aiMove(g, 0, style, rnd);
