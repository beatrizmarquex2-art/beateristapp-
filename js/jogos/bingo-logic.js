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
  l.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + i), Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)));
  return l;
})();
export const GOALS = { linha: 'linha, coluna ou diagonal', cheia: 'cartela cheia' };

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
  return LINES.find((line) => line.every(ok)) || null;
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
    if (!g || g.v !== 1 || !['solo', 'dupla', 'prof'].includes(g.mode) || !['linha', 'cheia'].includes(g.goal)) return false;
    if (g.order.length !== 24 || new Set(g.order).size !== 24 || !g.order.every((i) => ITEM[i])) return false;
    if (!Number.isInteger(g.drawn) || g.drawn < 0 || g.drawn > 24) return false;
    return g.cards.length === g.marks.length && g.cards.every((c, i) => c.length === 16 && new Set(c).size === 16 && c.every((x) => ITEM[x]) && g.marks[i].length === 16);
  } catch { return false; }
}
