// Área Kids: perguntas dos jogos (peças, pauta, figuras, ritmo das comidas, quantos bumbos). Puro, testado em tests/kids.test.mjs.
// Ideias da aula infantil da Bia: peças da bateria, onde cada peça mora na pauta, árvore das figuras, contar bumbos e
// a contagem com palavras do método ("bo-lo" = colcheias, "cho-co-la-te" = semicolcheias).

export const PIECES = [
  { id: 'bd', name: 'bumbo' }, { id: 'sn', name: 'caixa' }, { id: 'hh', name: 'chimbal' }, { id: 'tt', name: 'tom 1' },
  { id: 'mt', name: 'tom 2' }, { id: 'ft', name: 'surdo' }, { id: 'cr', name: 'prato de ataque' }, { id: 'rd', name: 'prato de condução' },
];
export const nameOf = (id) => (PIECES.find((p) => p.id === id) || {}).name || id;

/** Figuras do maior pro menor, com quanto duram (em tempos). */
export const FIGURES = [
  { id: 'semibreve', name: 'semibreve', beats: 4 }, { id: 'minima', name: 'mínima', beats: 2 }, { id: 'seminima', name: 'semínima', beats: 1 },
  { id: 'colcheia', name: 'colcheia', beats: 0.5 }, { id: 'semicolcheia', name: 'semicolcheia', beats: 0.25 },
];

/** Cartas do "monte seu ritmo": cada uma é um tempo. Cada figura tem várias palavras com o mesmo ritmo (a sílaba cai em cada nota). */
const f = (id, word, syl, cell, fig, emoji) => ({ id, word, syl, cell, fig, emoji });
export const FOODS = [
  f('pao', 'pão', ['pão'], '1000', 'semínima', '🍞'), f('ceu', 'céu', ['céu'], '1000', 'semínima', '☁️'), f('mao', 'mão', ['mão'], '1000', 'semínima', '✋'), f('cao', 'cão', ['cão'], '1000', 'semínima', '🐶'),
  f('bolo', 'bolo', ['bo', 'lo'], '1010', '2 colcheias', '🎂'), f('bola', 'bola', ['bo', 'la'], '1010', '2 colcheias', '⚽'), f('corpo', 'corpo', ['cor', 'po'], '1010', '2 colcheias', '🧍'), f('pato', 'pato', ['pa', 'to'], '1010', '2 colcheias', '🦆'),
  f('chocolate', 'chocolate', ['cho', 'co', 'la', 'te'], '1111', '4 semicolcheias', '🍫'), f('bicicleta', 'bicicleta', ['bi', 'ci', 'cle', 'ta'], '1111', '4 semicolcheias', '🚲'),
  f('esqueleto', 'esqueleto', ['es', 'que', 'le', 'to'], '1111', '4 semicolcheias', '💀'), f('borboleta', 'borboleta', ['bor', 'bo', 'le', 'ta'], '1111', '4 semicolcheias', '🦋'),
  f('shh', 'shhh', ['shh'], '0000', 'pausa', '🤫'),
];
/** As figuras do jogo, com as palavras de cada uma (na ordem da paleta). */
export const FOOD_GROUPS = [['1000', 'semínima · 1 tempo'], ['1010', '2 colcheias · bo-lo'], ['1111', '4 semicolcheias · cho-co-la-te'], ['0000', 'pausa · silêncio']].map(([cell, title]) => ({ cell, title, foods: FOODS.filter((x) => x.cell === cell) }));
export const cellOf = (id) => (FOODS.find((x) => x.id === id) || FOODS[FOODS.length - 1]).cell;
export const foodOf = (id) => FOODS.find((x) => x.id === id) || FOODS[FOODS.length - 1];

export function shuffle(a, rnd = Math.random) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/** "Que peça é essa?": a certa + `n - 1` erradas, embaralhadas. `level` 1 = só as 3 básicas. */
export function pieceQuestion(rnd = Math.random, level = 1, n = 3) {
  const pool = level === 1 ? PIECES.filter((p) => ['bd', 'sn', 'hh'].includes(p.id)) : PIECES;
  const ans = pool[Math.floor(rnd() * pool.length)];
  const wrong = shuffle(pool.filter((p) => p.id !== ans.id), rnd).slice(0, Math.min(n, pool.length) - 1);
  return { ans: ans.id, options: shuffle([ans, ...wrong], rnd).map((p) => p.id) };
}

/** "Qual dura mais?": duas figuras diferentes. */
export function figurePair(rnd = Math.random) {
  const a = Math.floor(rnd() * FIGURES.length); let b = Math.floor(rnd() * (FIGURES.length - 1)); if (b >= a) b++;
  const pair = [FIGURES[a], FIGURES[b]];
  return { pair: pair.map((f) => f.id), ans: pair[0].beats > pair[1].beats ? pair[0].id : pair[1].id };
}

/** Compasso com N bumbos (1 a 3) sobre chimbal em colcheias e caixa no 2 e no 4 (grade de 8). */
export const BUMBO_SPOTS = { 1: [0], 2: [0, 4], 3: [0, 4, 5], 4: [0, 1, 4, 5], 5: [0, 1, 3, 4, 5] };
export function bumboBar(n) {
  const on = (idx) => Array.from({ length: 8 }, (_, i) => (idx.includes(i) ? 1 : 0));
  return { steps: 8, rows: { hh: on([0, 1, 2, 3, 4, 5, 6, 7]), sn: on([2, 6]), bd: on(BUMBO_SPOTS[n]) } };
}

/** Ritmo aleatório de 4 cartas pro "adivinha" (começa com som, no máximo um "shhh"); a palavra de cada figura é sorteada. */
export function randomFoods(rnd = Math.random, level = 1) {
  const cells = level === 1 ? ['1000', '1010', '0000'] : ['1000', '1010', '1111', '0000'];
  const word = (cell) => { const w = FOODS.filter((x) => x.cell === cell); return w[Math.floor(rnd() * w.length)].id; };
  for (;;) {
    const r = Array.from({ length: 4 }, () => word(cells[Math.floor(rnd() * cells.length)]));
    if (r[0] !== 'shh' && r.filter((x) => x === 'shh').length <= 1) return r;
  }
}
export const sameRhythm = (a, b) => a.length === b.length && a.every((x, i) => cellOf(x) === cellOf(b[i]));
