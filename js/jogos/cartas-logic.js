// Última nota: regras puras. 76 cartas (4 cores × 18 + 4 curingas). Referência didática: a semínima vale 1 tempo.
export const COLORS = ['vermelho', 'azul', 'mostarda', 'petroleo'];
export const COLOR_NAME = { vermelho: 'vermelho', azul: 'azul', mostarda: 'mostarda', petroleo: 'verde-petróleo' };
export const COLOR_SYMBOL = { vermelho: 'estrela', azul: 'raio', mostarda: 'círculo', petroleo: 'losango' };
export const ACTIONS = ['pular', 'inverter', 'mais2'];
export const ACTION_NAME = { pular: 'pular', inverter: 'inverter', mais2: '+2', curinga: 'mudar cor' };
// figuras de cada valor (mesmo mapa do dominó)
export const FIGS = { 1: ['seminima'], 2: ['minima'], 3: ['minima', 'seminima'], 4: ['semibreve'], 5: ['semibreve', 'seminima'], 6: ['semibreve', 'minima'] };
const BEATS = { seminima: 1, minima: 2, semibreve: 4 };
export const beatsOf = (figs) => figs.reduce((s, f) => s + BEATS[f], 0);
export const HAND = 7;

export const isNum = (c) => c.kind === 'num';
export const isWild = (c) => c.kind === 'curinga';
export const cardName = (c) => (isWild(c) ? 'curinga: mudar cor' : `${COLOR_NAME[c.color]} (${COLOR_SYMBOL[c.color]}) ${isNum(c) ? `número ${c.value}` : ACTION_NAME[c.kind]}`);

export function makeDeck() {
  const d = []; let n = 0;
  for (const color of COLORS) {
    for (let v = 1; v <= 6; v++) for (let k = 0; k < 2; k++) d.push({ id: `c${n++}`, color, kind: 'num', value: v });
    for (const a of ACTIONS) for (let k = 0; k < 2; k++) d.push({ id: `c${n++}`, color, kind: a, value: 0 });
  }
  for (let k = 0; k < 4; k++) d.push({ id: `c${n++}`, color: null, kind: 'curinga', value: 0 });
  return d;
}
export function shuffle(list, rnd = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Joga na carta do topo se: curinga; mesma cor ativa; mesmo número; ou mesma ação (topo curinga só vale pela cor escolhida). */
export function playable(card, top, color) {
  if (isWild(card)) return true;
  if (card.color === color) return true;
  if (isWild(top)) return false;
  return isNum(card) ? isNum(top) && card.value === top.value : card.kind === top.kind;
}
export const topOf = (g) => g.discard[g.discard.length - 1];
/** Com carta recém-comprada só ela pode ser jogada. */
export const legalCards = (g, p) => g.hands[p].filter((c) => (g.drawn ? c.id === g.drawn : true) && playable(c, topOf(g), g.color));
/** Cartas que ainda dá para comprar (monte + descarte reciclável sem o topo). */
export const available = (g) => g.draw.length + Math.max(0, g.discard.length - 1);

export function newGame({ mode = 'paul', rnd = Math.random } = {}) {
  const deck = shuffle(makeDeck(), rnd);
  const hands = [deck.slice(0, HAND), deck.slice(HAND, HAND * 2)];
  let rest = deck.slice(HAND * 2);
  const i = rest.findIndex(isNum); const open = rest[i];
  rest = shuffle(rest.filter((_, k) => k !== i), rnd); // ações sorteadas voltam ao monte embaralhadas
  return { v: 1, mode, hands, draw: rest, discard: [open], color: open.color, turn: Math.floor(rnd() * 2), drawn: null, passes: 0, over: false, result: null, note: '', last: null };
}
const clone = (g) => JSON.parse(JSON.stringify(g));

function take(g, n, rnd) {
  const got = [];
  for (let k = 0; k < n; k++) {
    if (!g.draw.length && g.discard.length > 1) { const top = g.discard.pop(); g.draw = shuffle(g.discard, rnd); g.discard = [top]; }
    if (!g.draw.length) break;
    got.push(g.draw.pop());
  }
  return got;
}
const end = (g, winner, reason) => { g.over = true; g.result = { winner, reason, counts: g.hands.map((h) => h.length) }; return g; };

export const canDraw = (g) => !g.over && !g.drawn && legalCards(g, g.turn).length === 0 && available(g) > 0;
export const canPass = (g) => !g.over && (g.drawn ? true : legalCards(g, g.turn).length === 0 && available(g) === 0);

export function applyPlay(g0, p, cardId, color, rnd = Math.random) {
  if (g0.over || p !== g0.turn) throw new Error('não é a vez');
  const g = clone(g0); const hand = g.hands[p]; const i = hand.findIndex((c) => c.id === cardId);
  if (i < 0) throw new Error('carta não está na mão');
  const card = hand[i];
  if (g.drawn && g.drawn !== cardId) throw new Error('só a carta comprada');
  if (!playable(card, topOf(g), g.color)) throw new Error('carta não serve');
  if (isWild(card) && !COLORS.includes(color)) throw new Error('escolha uma cor');
  hand.splice(i, 1); g.discard.push(card); g.color = isWild(card) ? color : card.color; g.drawn = null; g.passes = 0; g.last = null;
  const opp = 1 - p; let next = opp;
  if (card.kind === 'pular') { g.note = 'pular: o adversário perde a vez'; next = p; }
  else if (card.kind === 'inverter') { g.note = 'inverter: com 2 jogadores, o adversário perde a vez'; next = p; }
  else if (card.kind === 'mais2') { const got = take(g, 2, rnd); g.hands[opp].push(...got); g.note = `+2: o adversário compra ${got.length} e perde a vez`; next = p; }
  else if (isWild(card)) g.note = `curinga: a cor agora é ${COLOR_NAME[g.color]}`;
  else g.note = '';
  if (!hand.length) return end(g, p, 'mao-vazia');
  if (hand.length === 1) g.last = p;
  g.turn = next; return g;
}
export function applyDraw(g0, p, rnd = Math.random) {
  if (p !== g0.turn || !canDraw(g0)) throw new Error('não pode comprar');
  const g = clone(g0); const [c] = take(g, 1, rnd); g.hands[p].push(c); g.passes = 0;
  if (playable(c, topOf(g), g.color)) { g.drawn = c.id; g.note = 'comprou uma carta que serve: jogue ou passe'; }
  else { g.drawn = null; g.note = 'comprou uma carta que não serve e passou'; g.turn = 1 - p; }
  return g;
}
export function applyPass(g0, p) {
  if (p !== g0.turn || !canPass(g0)) throw new Error('não pode passar');
  const g = clone(g0);
  if (g.drawn) { g.drawn = null; g.note = 'passou'; g.turn = 1 - p; return g; }
  g.passes += 1; g.note = 'sem jogada e sem cartas para comprar: passou';
  if (g.passes >= 2) { const [a, b] = g.hands.map((h) => h.length); return end(g, a === b ? null : (a < b ? 0 : 1), 'bloqueio'); }
  g.turn = 1 - p; return g;
}

/** O Paul só usa a própria mão (g.hands[p]), o descarte, a cor ativa e se pode comprar. Prefere ações; no curinga escolhe a cor mais frequente da mão. */
export function paulMove(g, p = 1, rnd = Math.random) {
  const legal = legalCards(g, p);
  if (legal.length) {
    const rank = (c) => (c.kind === 'mais2' ? 40 : c.kind === 'pular' || c.kind === 'inverter' ? 30 : isNum(c) ? 10 + c.value : 0) + rnd() * 0.5;
    const card = legal.reduce((b, c) => (rank(c) > rank(b) ? c : b));
    let color; if (isWild(card)) {
      const cnt = Object.fromEntries(COLORS.map((k) => [k, 0])); g.hands[p].forEach((c) => { if (c.color && c.id !== card.id) cnt[c.color]++; });
      color = COLORS.reduce((b, k) => (cnt[k] > cnt[b] ? k : b), g.color);
    }
    return { type: 'play', id: card.id, color };
  }
  if (canDraw(g)) return { type: 'draw' };
  return { type: 'pass' };
}

export function validGame(g) {
  try {
    if (!g || g.v !== 1 || !Array.isArray(g.hands) || g.hands.length !== 2 || !Array.isArray(g.draw) || !Array.isArray(g.discard) || !g.discard.length) return false;
    if (g.turn !== 0 && g.turn !== 1) return false; if (!COLORS.includes(g.color)) return false;
    const all = [...g.hands[0], ...g.hands[1], ...g.draw, ...g.discard]; const ref = new Map(makeDeck().map((c) => [c.id, c]));
    if (all.length !== 76 || new Set(all.map((c) => c.id)).size !== 76) return false;
    for (const c of all) { const r = ref.get(c.id); if (!r || r.kind !== c.kind || r.value !== c.value || r.color !== c.color) return false; }
    if (g.drawn && !g.hands[g.turn].some((c) => c.id === g.drawn)) return false;
    return Number.isInteger(g.passes) && g.passes >= 0 && g.passes < 3;
  } catch { return false; }
}

/* ---------- Modo Aventura: estilos de adversário e medição (só acrescenta; as regras e o paulMove ficam como estão) ---------- */
export const AI_STYLES = ['distraido', 'paul', 'guardiao', 'pintor', 'esperto'];
export const isSpecial = (c) => c.kind !== 'num';
/** Gerador com semente (mesma semente = mesma sequência): baralho/embaralhadas das missões. */
export const seededRnd = (s) => { let x = (Number(s) || 1) >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32; }; };
const countColors = (hand, skipId) => { const cnt = Object.fromEntries(COLORS.map((k) => [k, 0])); hand.forEach((c) => { if (c.color && c.id !== skipId) cnt[c.color]++; }); return cnt; };
const bestColor = (hand, card, fallback) => { const cnt = countColors(hand, card.id); return COLORS.reduce((b, k) => (cnt[k] > cnt[b] ? k : b), fallback); };
const pickMax = (list, score, rnd) => list.reduce((b, c) => { const s = score(c) + rnd() * 0.01; return s > b.s ? { c, s } : b; }, { c: null, s: -Infinity }).c;

/**
 * Jogada do computador por estilo (mesmas regras do jogo; só muda a escolha entre as cartas que já servem):
 *  distraido: qualquer carta que serve, cor do curinga ao acaso. paul: o Paul de sempre (prefere ações).
 *  guardiao: guarda as cartas especiais pro fim (ou pra quando o adversário está com 2 cartas ou menos); curinga só sem outra saída.
 *  pintor: joga primeiro as cores que tem pouco, para ficar só com uma cor; curinga escolhe a cor mais frequente.
 *  esperto: especiais cedo (valem jogada extra), cor mais frequente, guarda curinga pro fim; com o adversário quase ganhando corta a vez.
 */
export function aiMove(g, p = 1, style = 'paul', rnd = Math.random) {
  if (style === 'paul' || !AI_STYLES.includes(style)) return paulMove(g, p, rnd);
  const legal = legalCards(g, p);
  if (!legal.length) return canDraw(g) ? { type: 'draw' } : { type: 'pass' };
  const hand = g.hands[p]; const opp = g.hands[1 - p].length; const cnt = countColors(hand);
  let card;
  if (style === 'distraido') card = legal[Math.floor(rnd() * legal.length)];
  else if (style === 'guardiao') {
    const nums = legal.filter(isNum); const sp = legal.filter((c) => !isWild(c) && isSpecial(c)); const wild = legal.filter(isWild);
    const spRank = (c) => (c.kind === 'mais2' ? 3 : 2);
    if (opp <= 2 && (sp.length || wild.length)) card = sp.length ? pickMax(sp, spRank, rnd) : wild[0];
    else if (nums.length) card = pickMax(nums, (c) => cnt[c.color], rnd);
    else card = sp.length ? pickMax(sp, spRank, rnd) : wild[0];
  } else if (style === 'pintor') {
    const non = legal.filter((c) => !isWild(c));
    card = non.length ? pickMax(non, (c) => -cnt[c.color], rnd) : legal[0];
  } else { // esperto
    const non = legal.filter((c) => !isWild(c));
    if (non.length && !(opp <= 2 && legal.some(isWild) && !non.some(isSpecial))) {
      card = pickMax(non, (c) => (c.kind === 'mais2' ? 50 : isSpecial(c) ? 40 : 0) + (opp <= 2 && isSpecial(c) ? 30 : 0) + cnt[c.color] * 2 - (hand.length <= 3 ? 0 : 0), rnd);
    } else card = legal.find(isWild) || legal[0];
  }
  let color;
  if (isWild(card)) color = style === 'distraido' ? COLORS[Math.floor(rnd() * 4)] : bestColor(hand, card, g.color);
  return { type: 'play', id: card.id, color };
}

/** Medição da partida do jogador (só o que o motor realmente observa). */
export const newStats = () => ({ rounds: 0, draws: 0, plays: 0, passes: 0, specials: 0, byKind: { pular: 0, inverter: 0, mais2: 0, curinga: 0 }, open: false });
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
  return { won: w === me, tie: w == null, lost: w != null && w !== me, reason: g.result.reason, rounds: st.rounds, draws: st.draws, plays: st.plays, specials: st.specials, byKind: { ...st.byKind }, mine: g.result.counts[me], theirs: g.result.counts[1 - me] };
}

/**
 * Partida inteira simulada com a MESMA ordem de uso do sorteio que a tela usa (viabilidade das missões e testes).
 * params = { seed, style }; policy(g, rnd) → jogada do jogador 0 ({type,id,color}). Devolve { won, ...matchResult }.
 */
export function simulate(params, policy, maxSteps = 3000) {
  const rnd = seededRnd(params.seed); let g = newGame({ mode: 'paul', rnd }); const st = newStats(); let n = 0;
  while (!g.over && n++ < maxSteps) {
    if (g.turn === 0) {
      const mv = policy(g, rnd); const b = g;
      g = mv.type === 'play' ? applyPlay(g, 0, mv.id, mv.color, rnd) : mv.type === 'draw' ? applyDraw(g, 0, rnd) : applyPass(g, 0);
      track(st, b, g, mv, 0);
    } else {
      const mv = aiMove(g, 1, params.style, rnd);
      g = mv.type === 'play' ? applyPlay(g, 1, mv.id, mv.color, rnd) : mv.type === 'draw' ? applyDraw(g, 1, rnd) : applyPass(g, 1);
    }
  }
  return g.over ? { ...matchResult(g, st, 0), g } : null;
}
/** Jogador de referência: usa o mesmo critério de cada estilo de computador (exceto distraido, que joga como esperto). `fit` limita/ajusta a política. */
export const playerPolicy = (style = 'esperto') => (g, rnd) => aiMove(g, 0, style, rnd);
