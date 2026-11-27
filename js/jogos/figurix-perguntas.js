// Perguntas NOVAS do quiz do Figurix (pedido da Bea, nov/2026: "as perguntas repetem"). Puro (sem tela), testado em tests/figurix-perguntas.test.mjs.
// Tipos: compare (qual dura mais/menos), soma (quantos tempos juntas), completa (completa o compasso de 4 tempos), vf (verdade ou mentira),
// pausaValor (quanto dura essa pausa), dobro (qual vale o dobro) e texto (banco de perguntas escritas, por nível). O "quizN" antigo continua como o tipo "classico".
import { FIG_BY, beatsLabel } from '../kids/figs.js';

const shuffle = (a, rnd = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = (a, n, rnd) => shuffle(a, rnd).slice(0, n);
const IDS = ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia', 'fusa', 'semifusa'];
const POOL = (nivel) => (nivel <= 1 ? IDS.slice(0, 5) : IDS);
const unicos = (l) => [...new Set(l)];

/** Qual dura mais / menos: 2 figuras (nível 1-2) ou 3 (nível 3+). */
export function qCompare(nivel, rnd = Math.random) {
  const n = nivel >= 3 ? 3 : 2; const figs = pick(POOL(nivel), n, rnd); const mais = rnd() < 0.5; const ord = figs.slice().sort((a, b) => FIG_BY[a].beats - FIG_BY[b].beats);
  return { tipo: 'compare', mais, opcoes: figs, ok: mais ? ord[ord.length - 1] : ord[0] };
}
const SOMAS = { 2: [['seminima', 'seminima'], ['minima', 'seminima'], ['seminima', 'colcheia', 'colcheia'], ['colcheia', 'colcheia', 'colcheia', 'colcheia'], ['minima', 'minima'], ['seminima', 'seminima', 'minima'], ['minima', 'colcheia', 'colcheia']], 3: [['seminima', 'colcheia'], ['minima', 'colcheia'], ['seminima', 'semicolcheia', 'semicolcheia'], ['colcheia', 'semicolcheia', 'semicolcheia'], ['semicolcheia', 'semicolcheia', 'colcheia', 'seminima'], ['minima', 'seminima', 'colcheia']] };
/** Quantos tempos valem essas figuras juntas? (soma). */
export function qSoma(nivel, rnd = Math.random) {
  const lista = nivel >= 3 ? [...SOMAS[2], ...SOMAS[3]] : SOMAS[2]; const figs = shuffle(lista, rnd)[0].slice(); if (rnd() < 0.5) figs.reverse();
  const ok = figs.reduce((t, f) => t + FIG_BY[f].beats, 0); const cand = unicos([ok + 1, ok - 1, ok + 0.5, ok - 0.5, ok * 2, ok / 2, 4, 2, 3, 1].filter((v) => v > 0 && v !== ok));
  return { tipo: 'soma', figs, opcoes: shuffle([ok, ...pick(cand, 2, rnd)], rnd), ok };
}
/** Completa o compasso de 4 tempos: faltam 1, 2 ou meio tempo (qual figura completa?). */
export function qCompleta(nivel, rnd = Math.random) {
  const falta = pick([1, 2, 0.5], 1, rnd)[0]; const ok = falta === 1 ? 'seminima' : falta === 2 ? 'minima' : 'colcheia'; let resto = 4 - falta; const figs = [];
  while (resto > 0.0001) { const opcoes = [2, 1, 0.5].filter((b) => b <= resto && (nivel >= 3 || b >= 1)); const b = opcoes.length ? pick(opcoes, 1, rnd)[0] : resto; figs.push(b === 2 ? 'minima' : b === 1 ? 'seminima' : 'colcheia'); resto -= b; if (figs.length > 5) break; }
  if (Math.abs(resto) > 0.0001) return qCompleta(nivel, rnd);
  return { tipo: 'completa', figs: shuffle(figs, rnd), opcoes: shuffle([ok, ...pick(['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia'].filter((x) => x !== ok), 2, rnd)], rnd), ok };
}
/** Verdade ou mentira: "a colcheia vale meio tempo". */
export function qVf(nivel, rnd = Math.random) {
  const fig = pick(POOL(nivel), 1, rnd)[0]; const verdade = rnd() < 0.5; const real = FIG_BY[fig].beats;
  const outros = unicos(POOL(nivel).map((f) => FIG_BY[f].beats)).filter((b) => b !== real); const dito = verdade ? real : pick(outros, 1, rnd)[0];
  return { tipo: 'vf', fig, dito, opcoes: ['verdade', 'mentira'], ok: dito === real ? 'verdade' : 'mentira' };
}
/** Quanto dura essa pausa? */
export function qPausaValor(nivel, rnd = Math.random) {
  const fig = pick(POOL(nivel).filter((f) => f !== 'semibreve' || nivel >= 2), 1, rnd)[0]; const ok = FIG_BY[fig].beats; const valores = unicos(POOL(nivel).map((f) => FIG_BY[f].beats));
  return { tipo: 'pausaValor', fig, opcoes: shuffle([ok, ...pick(valores.filter((v) => v !== ok), 2, rnd)], rnd), ok };
}
/** Qual figura vale o dobro da figura mostrada? */
export function qDobro(nivel, rnd = Math.random) {
  const i = 1 + Math.floor(rnd() * (IDS.length - 1 - (nivel >= 3 ? 0 : 1))); const base = IDS[i]; const ok = IDS[i - 1];
  return { tipo: 'dobro', fig: base, opcoes: shuffle([ok, ...pick(IDS.filter((x) => x !== ok && x !== base), 2, rnd)], rnd), ok };
}
/** Banco de perguntas escritas (nível 1 = fácil, 2 = médio, 3 = mais difícil). `e` = as 3 erradas. */
export const TEXTOS = [
  { n: 1, q: 'quantos tempos tem cada compasso em 4/4?', ok: '4', e: ['2', '3', '5'] }, { n: 1, q: 'e em 3/4, quantos tempos tem cada compasso?', ok: '3', e: ['2', '4', '6'] },
  { n: 1, q: 'o que é o pulso da música?', ok: 'a batida constante, que a gente marca com o pé', e: ['a nota mais aguda', 'o nome de um instrumento', 'o final da música'] },
  { n: 1, q: 'qual peça da bateria faz o som mais grave ("tum")?', ok: 'o bumbo', e: ['o chimbal', 'o prato de ataque', 'a caixa'] },
  { n: 1, q: 'qual peça da bateria tem o som seco e estalado ("tá")?', ok: 'a caixa', e: ['o bumbo', 'o surdo', 'o pedal do chimbal'] },
  { n: 1, q: 'o metrônomo serve pra quê?', ok: 'marcar o tempo (o pulso) em batidas iguais', e: ['afinar o violão', 'aumentar o volume', 'escrever partitura'] },
  { n: 1, q: 'a pausa de semínima é um silêncio de quanto tempo?', ok: '1 tempo', e: ['meio tempo', '2 tempos', '4 tempos'] },
  { n: 1, q: 'o andamento da música é a sua...', ok: 'velocidade (rápida ou lenta)', e: ['altura (aguda ou grave)', 'força (forte ou fraca)', 'cor'] },
  { n: 1, q: 'que figura dura mais?', ok: 'a semibreve', e: ['a colcheia', 'a semínima', 'a fusa'] }, { n: 1, q: 'que figura dura menos (a mais rápida)?', ok: 'a semifusa', e: ['a mínima', 'a semínima', 'a semibreve'] },
  { n: 2, q: 'o ponto depois da nota faz ela durar...', ok: 'a metade a mais', e: ['o dobro', 'a metade a menos', 'igual'] }, { n: 2, q: 'quantas colcheias cabem em um compasso de 4/4?', ok: '8', e: ['4', '6', '16'] },
  { n: 2, q: 'quantas semicolcheias cabem em um tempo?', ok: '4', e: ['2', '3', '8'] }, { n: 2, q: 'o acento serve pra deixar a nota...', ok: 'mais forte', e: ['mais curta', 'mais aguda', 'em silêncio'] },
  { n: 2, q: 'a fórmula de compasso 4/4 tem o 4 de cima que quer dizer...', ok: '4 tempos por compasso', e: ['4 notas diferentes', '4 instrumentos', '4 segundos'] },
  { n: 2, q: 'a figura que vale 1 tempo é a...', ok: 'semínima', e: ['mínima', 'colcheia', 'semibreve'] }, { n: 2, q: 'qual pausa dura o compasso inteiro de 4 tempos?', ok: 'a pausa de semibreve', e: ['a pausa de semínima', 'a pausa de colcheia', 'a pausa de mínima'] },
  { n: 2, q: 'duas colcheias juntas valem quanto?', ok: '1 tempo (uma semínima)', e: ['2 tempos', 'meio tempo', '4 tempos'] }, { n: 2, q: 'o chimbal fechado, no rock, costuma marcar...', ok: 'as colcheias (o "tss tss tss")', e: ['só o tempo 1', 'nada: ele fica mudo', 'a melodia'] },
  { n: 3, q: 'a tercina coloca quantas notas no espaço de duas?', ok: '3', e: ['2', '4', '6'] }, { n: 3, q: 'o que é uma síncope?', ok: 'uma nota que começa fora do tempo forte e se prolonga nele', e: ['uma pausa longa', 'uma nota muito aguda', 'o fim da música'] },
  { n: 3, q: 'a mínima pontuada vale quantos tempos?', ok: '3', e: ['2', '4', '1,5'] }, { n: 3, q: 'a semínima pontuada vale quantos tempos?', ok: '1 tempo e meio', e: ['2 tempos', 'meio tempo', '1 tempo'] },
  { n: 3, q: 'uma ligadura entre duas notas iguais faz o quê?', ok: 'soma a duração das duas, tocando só a primeira', e: ['toca as duas mais forte', 'pula a segunda nota', 'troca de instrumento'] },
  { n: 3, q: 'num compasso de 2/4, quantas colcheias cabem?', ok: '4', e: ['2', '8', '3'] }, { n: 3, q: 'o contratempo é quando a nota cai...', ok: 'entre os tempos (no "e")', e: ['sempre no tempo 1', 'só no fim da música', 'junto com todo mundo'] },
];
/** Uma pergunta escrita do nível `nivel` (nível do jogo 1-2 → fácil, 3-4 → até médio, 5+ → todas). */
export function qTexto(nivel, rnd = Math.random) {
  const teto = nivel <= 2 ? 1 : nivel <= 4 ? 2 : 3; const it = pick(TEXTOS.filter((x) => x.n <= teto), 1, rnd)[0];
  return { tipo: 'texto', pergunta: it.q, opcoes: shuffle([it.ok, ...it.e], rnd), ok: it.ok, n: it.n };
}
/** Os tipos de pergunta de cada nível do jogo (peso: aparece mais vezes na lista = mais comum). "classico" = as perguntas de sempre (valor, nome, pausa, metade, cabem). */
export function tiposDoNivel(nivel) {
  const t = ['classico', 'classico', 'compare', 'vf', 'texto', 'texto'];
  if (nivel >= 2) t.push('pausaValor', 'soma');
  if (nivel >= 3) t.push('dobro', 'completa', 'soma', 'texto');
  return t;
}
export function quizVariado(nivel, quizClassico, rnd = Math.random) {
  const tipo = pick(tiposDoNivel(nivel), 1, rnd)[0];
  return { classico: () => quizClassico(nivel, rnd), compare: () => qCompare(nivel, rnd), vf: () => qVf(nivel, rnd), texto: () => qTexto(nivel, rnd), pausaValor: () => qPausaValor(nivel, rnd), soma: () => qSoma(nivel, rnd), dobro: () => qDobro(nivel, rnd), completa: () => qCompleta(nivel, rnd) }[tipo]();
}
/** Chave que identifica a pergunta (pra não repetir na fase nem logo depois de outra fase). */
export function chaveQuiz(q) {
  if (q.tipo === 'texto') return `texto|${q.pergunta}`;
  if (q.tipo === 'soma' || q.tipo === 'completa') return `${q.tipo}|${q.figs.slice().sort().join(',')}`;
  if (q.tipo === 'compare') return `compare|${q.mais ? 'mais' : 'menos'}|${q.opcoes.slice().sort().join(',')}`;
  if (q.tipo === 'vf') return `vf|${q.fig}|${q.dito}`;
  return `${q.tipo}|${q.fig}|${q.peq || ''}`;
}
