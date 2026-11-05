// Bingo musical: regras puras. 24 itens; cartela 4×4 com 16 sorteados, sem casa livre.
export const IMG = { violao: 'violao', guitarra: 'guitarra', baixo: 'baixo', teclado: 'teclado', trompete: 'trompete', saxofone: 'saxofone', flauta: 'flauta', violino: 'violino', bateria: 'bateria', pandeiro: 'pandeiro', triangulo: 'triangulo', acordeao: 'acordeao' };
export const ITEMS = [
  ['violao', 'violão', 'instrumento de cordas de corpo grande, tocado com os dedos'],
  ['guitarra', 'guitarra', 'instrumento de cordas elétrico, de corpo fino'],
  ['baixo', 'baixo', 'instrumento de cordas elétrico que faz os sons graves'],
  ['teclado', 'teclado', 'instrumento com teclas pretas e brancas'],
  ['trompete', 'trompete', 'instrumento de sopro dourado, com três válvulas'],
  ['saxofone', 'saxofone', 'instrumento de sopro curvo, com palheta e chaves'],
  ['flauta', 'flauta transversal', 'tubo prateado de sopro, segurado de lado'],
  ['violino', 'violino', 'instrumento pequeno de cordas, tocado com arco'],
  ['bateria', 'bateria', 'conjunto de tambores e pratos tocado com baquetas'],
  ['pandeiro', 'pandeiro', 'instrumento redondo de pele, com platinelas'],
  ['triangulo', 'triângulo', 'barra de metal em três lados, tocada com um batedor'],
  ['acordeao', 'acordeão', 'instrumento de fole, com teclas e botões'],
  ['bumbo', 'bumbo', 'tambor grande da bateria, tocado com o pedal'],
  ['caixa', 'caixa', 'tambor da bateria com esteira, de som seco'],
  ['chimbal', 'chimbal', 'par de pratos que abre e fecha com o pedal'],
  ['tom', 'tom', 'tambor médio da bateria, preso no suporte'],
  ['surdo', 'surdo da bateria', 'tambor grande e grave da bateria, de pé no chão'],
  ['crash', 'prato crash', 'prato da bateria de som forte e rápido'],
  ['ride', 'prato ride', 'prato grande da bateria, usado para marcar o ritmo'],
  ['baquetas', 'baquetas', 'par de varinhas para tocar tambores'],
  ['microfone', 'microfone', 'aparelho que capta a voz'],
  ['amplificador', 'amplificador', 'caixa que aumenta o volume do instrumento elétrico'],
  ['fone', 'fone', 'aparelho que se usa nos ouvidos para escutar'],
  ['metronomo', 'metrônomo', 'marca o pulso com cliques regulares'],
].map(([id, name, desc]) => ({ id, name, desc, img: IMG[id] || null }));
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const SIZE = 4;
export const LINES = (() => {
  const l = []; for (let r = 0; r < SIZE; r++) l.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c));
  for (let c = 0; c < SIZE; c++) l.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c));
  return l;
})();
export const GOALS = { linha: 'linha ou coluna', cheia: 'cartela cheia' };

export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const makeCard = (rnd = Math.random) => shuffle(ITEMS.map((i) => i.id), rnd).slice(0, SIZE * SIZE);

export function newGame({ mode = 'solo', goal = 'linha', rnd = Math.random } = {}) {
  const n = mode === 'dupla' ? 2 : mode === 'solo' ? 1 : 0;
  return { v: 1, mode, goal, cards: Array.from({ length: n }, () => makeCard(rnd)), marks: Array.from({ length: n }, () => Array(SIZE * SIZE).fill(false)), order: shuffle(ITEMS.map((i) => i.id), rnd), drawn: 0, active: 0, over: false, result: null };
}
const clone = (g) => JSON.parse(JSON.stringify(g));
export const calledIds = (g) => g.order.slice(0, g.drawn);
export const current = (g) => (g.drawn ? g.order[g.drawn - 1] : null);
export const remaining = (g) => g.order.length - g.drawn;

export function drawNext(g0) {
  if (g0.over || g0.drawn >= g0.order.length) throw new Error('sem sorteio');
  const g = clone(g0); g.drawn++; return g;
}
/** Marca/desmarca. Marcar só vale se o item já foi sorteado. Devolve { g, ok, reason }. */
export function toggleMark(g0, card, cell) {
  if (g0.over) return { g: g0, ok: false, reason: 'fim' };
  const id = g0.cards[card][cell];
  if (g0.marks[card][cell]) { const g = clone(g0); g.marks[card][cell] = false; return { g, ok: true }; }
  if (!calledIds(g0).includes(id)) return { g: g0, ok: false, reason: 'nao-sorteado' };
  const g = clone(g0); g.marks[card][cell] = true; return { g, ok: true };
}
/** Combinação vencedora da cartela (casas marcadas E sorteadas), ou null. */
export function winning(g, card) {
  const called = new Set(calledIds(g)); const ok = (c) => g.marks[card][c] && called.has(g.cards[card][c]);
  if (g.goal === 'cheia') return g.cards[card].every((_, c) => ok(c)) ? Array.from({ length: SIZE * SIZE }, (_, i) => i) : null;
  // objetivos extras (só as missões do Modo Aventura usam: 'duas', 'lincol' e `cat`); 'linha' sem `cat` é exatamente o de sempre
  const full = LINES.filter((line) => line.every(ok) && (!g.cat || line.every((c) => g.cat.includes(g.cards[card][c]))));
  if (g.goal === 'duas') return full.length >= 2 ? [...new Set([...full[0], ...full[1]])] : null;
  if (g.goal === 'lincol') { const r = full.find((l) => LINES.indexOf(l) < SIZE); const c = full.find((l) => LINES.indexOf(l) >= SIZE); return r && c ? [...new Set([...r, ...c])] : null; }
  return full[0] || null;
}
/** "bingo!" de uma cartela. Valida todas as cartelas agora; mais de uma válida = empate. */
export function declare(g0, card) {
  if (g0.over) return { g: g0, ok: false };
  const wins = g0.cards.map((_, i) => winning(g0, i));
  if (!wins[card]) return { g: g0, ok: false };
  const g = clone(g0); const winners = wins.map((w, i) => (w ? i : -1)).filter((i) => i >= 0);
  g.over = true; g.result = { winners, lines: Object.fromEntries(winners.map((i) => [i, wins[i]])), tie: winners.length > 1, reason: 'bingo' }; return { g, ok: true };
}
export function validGame(g) {
  try {
    if (!g || g.v !== 1 || !['solo', 'dupla', 'prof'].includes(g.mode) || !['linha', 'cheia', 'duas', 'lincol'].includes(g.goal)) return false;
    if (g.order.length !== 24 || new Set(g.order).size !== 24 || !g.order.every((i) => ITEM[i])) return false;
    if (!Number.isInteger(g.drawn) || g.drawn < 0 || g.drawn > 24) return false;
    return g.cards.length === g.marks.length && g.cards.every((c, i) => c.length === 16 && new Set(c).size === 16 && c.every((x) => ITEM[x]) && g.marks[i].length === 16);
  } catch { return false; }
}

/* ---------- Modo Aventura (missões): cartela e sorteio fixos por semente, para que cada objetivo seja sempre alcançável ---------- */
/** Grupos legítimos dos 24 itens existentes (nada inventado): os 12 instrumentos, 7 peças da bateria e os 4 equipamentos. */
export const CATS = {
  instrumentos: { name: 'instrumentos', ids: ITEMS.filter((i) => i.img).map((i) => i.id) },
  bateria: { name: 'peças da bateria', ids: ['bumbo', 'caixa', 'chimbal', 'tom', 'surdo', 'crash', 'ride'] },
  equipamentos: { name: 'equipamentos', ids: ['microfone', 'amplificador', 'fone', 'metronomo'] },
};
export const MISSION_GOALS = { linha: 'uma linha ou coluna', lincol: 'uma linha e uma coluna', duas: 'duas linhas (ou colunas)', cheia: 'a cartela cheia' };
export const seededRnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
/** Partida de missão: 1 cartela e ordem de sorteio determinísticas pela `seed`. Com `cat` (chave de CATS), a cartela leva ao menos 4 itens do grupo (ou todos, se o grupo tem 4) alinhados numa linha. */
export function newMissionGame({ seed = 1, goal = 'linha', cat = null } = {}) {
  const rnd = seededRnd(seed); let card = makeCard(rnd); const ids = cat ? CATS[cat].ids : null;
  if (ids) {
    const want = Math.min(4, ids.length); const inCard = card.filter((i) => ids.includes(i));
    for (const add of ids) { if (inCard.length >= want) break; if (inCard.includes(add)) continue; const k = card.findIndex((i) => !ids.includes(i)); card[k] = add; inCard.push(add); }
    const four = card.filter((i) => ids.includes(i)).slice(0, 4); const rest = card.filter((i) => !four.includes(i)); const r = seed % SIZE;
    card = []; for (let c = 0; c < SIZE * SIZE; c++) card.push(c >= r * SIZE && c < r * SIZE + SIZE ? four[c - r * SIZE] : rest.shift());
  }
  const order = shuffle(ITEMS.map((i) => i.id), rnd);
  return { v: 1, mode: 'solo', goal, cat: ids ? ids.slice() : null, cards: [card], marks: [Array(SIZE * SIZE).fill(false)], order, drawn: 0, active: 0, over: false, result: null };
}
/** Menor nº de sorteios em que o objetivo já é possível nesta partida (marcando tudo que saiu), ou null. */
export function needDraws(g) {
  for (let k = 0; k <= g.order.length; k++) {
    const called = new Set(g.order.slice(0, k)); const t = { ...g, drawn: k, over: false, marks: [g.cards[0].map((id) => called.has(id))] };
    if (winning(t, 0)) return k;
  }
  return null;
}
/** Limites exatos para QUALQUER cartela/ordem (sem `cat`): por enumeração das 2^16 combinações de casas sorteadas. { min, max } = menor e maior nº de sorteios até o objetivo ser possível. */
export function drawBounds(goal) {
  let minSet = 99; let maxNot = -1; const N = SIZE * SIZE;
  for (let m = 0; m < 1 << N; m++) {
    let n = 0; for (let b = m; b; b &= b - 1) n++;
    const full = LINES.filter((l) => l.every((c) => m >> c & 1)); const rows = full.filter((l) => LINES.indexOf(l) < SIZE).length;
    const ok = goal === 'cheia' ? m === (1 << N) - 1 : goal === 'duas' ? full.length >= 2 : goal === 'lincol' ? rows >= 1 && full.length - rows >= 1 : full.length >= 1;
    if (ok) minSet = Math.min(minSet, n); else maxNot = Math.max(maxNot, n);
  }
  return { min: minSet, max: ITEMS.length - N + maxNot + 1 };
}
