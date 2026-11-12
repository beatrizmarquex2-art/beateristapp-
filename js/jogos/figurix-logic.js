// Figurix (regras puras, sem tela): 12 fases com as ideias da Bea sobre as figuras rítmicas. Testado em tests/figurix.test.mjs.
import { FIGS, FIG_BY } from '../kids/figs.js';

export const FASES = 12;
/** As 12 fases (a ordem é a da lista de ideias da Bea; as duas últimas repetem quiz e tetris mais difíceis). */
export const PHASES = [
  { n: 1, tipo: 'rapida', titulo: 'qual é a mais rápida?' },
  { n: 2, tipo: 'lenta', titulo: 'qual é a mais lenta?' },
  { n: 3, tipo: 'monte', titulo: 'monte a figura' },
  { n: 4, tipo: 'ligar', k: 3, titulo: 'ligue as 3 figuras' },
  { n: 5, tipo: 'ligar', k: 5, titulo: 'ligue as 5 figuras' },
  { n: 6, tipo: 'memoria', titulo: 'memória das pausas' },
  { n: 7, tipo: 'quiz', nivel: 1, titulo: 'quiz' },
  { n: 8, tipo: 'caca', titulo: 'caça-palavras' },
  { n: 9, tipo: 'notas', titulo: 'monte as notas' },
  { n: 10, tipo: 'tetris', nivel: 1, titulo: 'tetris do Roboterista' },
  { n: 11, tipo: 'quiz', nivel: 2, titulo: 'quiz difícil' },
  { n: 12, tipo: 'tetris', nivel: 2, titulo: 'tetris rápido' },
];
export const ids = FIGS.map((f) => f.id);
const shuffle = (a, rnd = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export { shuffle };
const pick = (a, n, rnd) => shuffle(a, rnd).slice(0, n);

/** "qual é a mais rápida/lenta?": 3 figuras com valores diferentes. A 1ª pergunta de cada fase é a da Bea (semínima/colcheia/semicolcheia; mínima/semibreve/semínima). */
export function rapidaLenta(tipo, i, rnd = Math.random) {
  const fixa = tipo === 'rapida' ? ['seminima', 'colcheia', 'semicolcheia'] : ['minima', 'semibreve', 'seminima'];
  const figs = i === 0 ? fixa : pick(ids.slice(0, i < 3 ? 5 : 7), 3, rnd);
  const ordem = figs.slice().sort((a, b) => FIG_BY[a].beats - FIG_BY[b].beats); // mais curta primeiro
  return { figs: i === 0 ? shuffle(fixa, rnd) : figs, ok: tipo === 'rapida' ? ordem[0] : ordem[2] }; // rápida = a que dura MENOS; lenta = a que dura MAIS
}
/** "monte a figura": cada rodada pede uma figura; o aluno escolhe a cabeça, a haste e os colchetes. A 1ª é a colcheia (ideia da Bea). */
export const MONTES = ['colcheia', 'seminima', 'minima', 'semicolcheia', 'semibreve'];
export const peçasDe = (id) => ({ cabeca: FIG_BY[id].open ? 'vazia' : 'cheia', haste: FIG_BY[id].stem, colchetes: FIG_BY[id].flags });
export const confereMonte = (id, m) => { const p = peçasDe(id); return { cabeca: m.cabeca === p.cabeca, haste: m.haste === p.haste, colchetes: m.colchetes === p.colchetes }; };
/** "ligar": k figuras de um lado e os nomes embaralhados do outro. */
export function paresLigar(k, rnd = Math.random) { const fs = pick(ids, k, rnd); return { figs: fs, nomes: shuffle(fs, rnd) }; }
/** "memória das pausas": k pares figura ↔ pausa dela (as 4 pausas que mais aparecem primeiro). */
export function paresPausa(k = 4, rnd = Math.random) {
  const f = pick(['seminima', 'colcheia', 'semicolcheia', 'minima', 'semibreve'], k, rnd);
  const cartas = f.flatMap((id) => [{ id, tipo: 'fig', par: id }, { id, tipo: 'pausa', par: id }]);
  return shuffle(cartas, rnd).map((c, i) => ({ ...c, k: i }));
}
export const mesmoPar = (a, b) => a.k !== b.k && a.par === b.par && a.tipo !== b.tipo;
/** Quiz: valor (quanto vale), nome (qual é o nome) e pausa (qual é a pausa dela). */
export function quizQ(nivel, rnd = Math.random) {
  const pool = nivel === 1 ? ids.slice(0, 5) : ids; const tipo = pick(nivel === 1 ? ['valor', 'nome'] : ['valor', 'nome', 'pausa'], 1, rnd)[0]; const fig = pick(pool, 1, rnd)[0];
  if (tipo === 'nome') return { tipo, fig, opcoes: shuffle([fig, ...pick(pool.filter((x) => x !== fig), 2, rnd)], rnd), ok: fig };
  if (tipo === 'pausa') return { tipo, fig, opcoes: shuffle([fig, ...pick(pool.filter((x) => x !== fig), 2, rnd)], rnd), ok: fig }; // mostra a pausa; escolhe de qual figura ela é
  const valores = [...new Set(pool.map((x) => FIG_BY[x].beats))]; const ok = FIG_BY[fig].beats;
  return { tipo, fig, opcoes: shuffle([ok, ...pick(valores.filter((v) => v !== ok), 2, rnd)], rnd), ok };
}
/** "monte as notas" (árvore): quantas figuras de cada cabem em UMA semibreve. A semibreve e a mínima já vêm certas. */
export const ARVORE = ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia'].map((id) => ({ id, cabem: 4 / FIG_BY[id].beats, pronto: id === 'semibreve' || id === 'minima' }));
export function opcoesArvore(cabem, rnd = Math.random) { const base = [1, 2, 4, 8, 16, 32]; return shuffle([cabem, ...pick(base.filter((v) => v !== cabem), 3, rnd)], rnd).sort((a, b) => a - b); }
/** Caça-palavras da fase 8. */
export const PALAVRAS = ['fusa', 'semifusa', 'silencio', 'pausa', 'oito', 'minima'];
/** Tetris do Roboterista: a figura cai, de um lado o nome certo e do outro um errado. */
export function itensTetris(nivel, n = 8, rnd = Math.random) {
  const pool = nivel === 1 ? ids.slice(0, 4) : ids; const out = [];
  for (let i = 0; i < n; i++) { const fig = pick(pool, 1, rnd)[0]; const outro = pick(pool.filter((x) => x !== fig), 1, rnd)[0]; const certoEsq = rnd() < 0.5; out.push({ fig, esq: certoEsq ? fig : outro, dir: certoEsq ? outro : fig, ok: certoEsq ? 'esq' : 'dir' }); }
  return out;
}
export const SEG_QUEDA = { 1: 6, 2: 3.6 }; // segundos que cada figura leva pra cair
/** Estrelas da fase: terminou = 1; até 2 erros = 2; sem erros = 3. */
export const estrelasFigurix = (erros) => (erros <= 0 ? 3 : erros <= 2 ? 2 : 1);
