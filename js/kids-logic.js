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

/** Cartas do "monte seu ritmo": cada uma é um tempo. */
export const FOODS = [
  { id: 'pao', word: 'pão', syl: ['pão'], cell: '1000', fig: 'semínima' },
  { id: 'bolo', word: 'bolo', syl: ['bo', 'lo'], cell: '1010', fig: '2 colcheias' },
  { id: 'chocolate', word: 'chocolate', syl: ['cho', 'co', 'la', 'te'], cell: '1111', fig: '4 semicolcheias' },
  { id: 'shh', word: 'shhh', syl: ['shh'], cell: '0000', fig: 'pausa' },
];
export const cellOf = (id) => (FOODS.find((f) => f.id === id) || FOODS[3]).cell;

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

/** Ritmo aleatório de 4 cartas pro "adivinha" (começa com som, no máximo um "shhh"). */
export function randomFoods(rnd = Math.random, level = 1) {
  const pool = level === 1 ? ['pao', 'bolo', 'shh'] : ['pao', 'bolo', 'chocolate', 'shh'];
  for (;;) {
    const r = Array.from({ length: 4 }, () => pool[Math.floor(rnd() * pool.length)]);
    if (r[0] !== 'shh' && r.filter((x) => x === 'shh').length <= 1) return r;
  }
}
export const sameRhythm = (a, b) => a.length === b.length && a.every((x, i) => cellOf(x) === cellOf(b[i]));
