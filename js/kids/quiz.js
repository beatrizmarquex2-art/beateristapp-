// Perguntas dos jogos com fases (peças, pauta, figuras, bumbos). Puro, testado em tests/kids-quiz.test.mjs.
// `d` = dificuldade 0 a 10 (já ajustada pela idade). Cada pergunta: { ans, options:[{id,label}], ...dados do desenho/som }.
import { PIECES, FIGURES, nameOf, shuffle } from '../kids-logic.js';

const POOL = [['bd', 'sn'], ['bd', 'sn', 'hh'], ['bd', 'sn', 'hh'], ['bd', 'sn', 'hh', 'cr'], ['bd', 'sn', 'hh', 'cr', 'rd'], ['bd', 'sn', 'hh', 'cr', 'rd', 'tt'],
  ['bd', 'sn', 'hh', 'cr', 'rd', 'tt', 'ft'], PIECES.map((p) => p.id), PIECES.map((p) => p.id), PIECES.map((p) => p.id), PIECES.map((p) => p.id)];
const NOPTS = [2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5];
export const poolOf = (d) => POOL[Math.max(0, Math.min(10, d))];

/** "Que peça é essa?" / "quem mora nessa casinha?": a certa + erradas (as parecidas entram nas fases altas). */
export function pieceQ(rnd, d) {
  const pool = poolOf(d); const ans = pool[Math.floor(rnd() * pool.length)];
  const similar = { tt: 'mt', mt: 'tt', cr: 'rd', rd: 'cr', ft: 'tt', hh: 'cr' }[ans];
  const n = Math.min(NOPTS[d], pool.length);
  let wrong = shuffle(pool.filter((p) => p !== ans), rnd);
  if (d >= 5 && similar && pool.includes(similar)) wrong = [similar, ...wrong.filter((p) => p !== similar)];
  const options = shuffle([ans, ...wrong.slice(0, n - 1)], rnd).map((id) => ({ id, label: nameOf(id) }));
  return { ans, key: ans, options };
}

const FIG_NAME = Object.fromEntries(FIGURES.map((f) => [f.id, f.name]));
export const beatsLabel = (b) => (b >= 1 ? `${b} tempo${b > 1 ? 's' : ''}` : b === 0.5 ? 'meio tempo' : '¼ de tempo');
/** Figuras: comparar (fácil), quantos tempos dura (médio) e nome da figura (difícil). */
export function figureQ(rnd, d) {
  const kind = d <= 5 ? 'dura' : d <= 8 ? 'tempos' : (rnd() < 0.5 ? 'nome' : 'tempos');
  if (kind === 'dura') {
    const gap = d <= 2 ? 2 : 1; let a; let b;
    do { a = Math.floor(rnd() * FIGURES.length); b = Math.floor(rnd() * FIGURES.length); } while (Math.abs(a - b) < gap);
    const pair = [FIGURES[a], FIGURES[b]]; const win = pair[0].beats > pair[1].beats ? pair[0] : pair[1];
    return { kind, key: 'dura', pair: pair.map((f) => f.id), ans: win.id, options: pair.map((f) => ({ id: f.id, label: f.name })) };
  }
  const f = FIGURES[Math.floor(rnd() * FIGURES.length)];
  if (kind === 'tempos') {
    const opts = shuffle(FIGURES.map((x) => x.beats), rnd).slice(0, 4); if (!opts.includes(f.beats)) opts[0] = f.beats;
    return { kind, key: 'tempos', fig: f.id, ans: String(f.beats), options: shuffle(opts, rnd).map((b) => ({ id: String(b), label: beatsLabel(b) })) };
  }
  const names = shuffle(FIGURES.filter((x) => x.id !== f.id), rnd).slice(0, 3);
  return { kind, key: 'nome', fig: f.id, ans: f.id, options: shuffle([f, ...names], rnd).map((x) => ({ id: x.id, label: x.name })) };
}

/** "Quantos bumbos?": quantos bumbos tem no compasso. Mais bumbos e andamento mais rápido nas fases altas. */
export const maxBumbos = (d) => (d <= 3 ? 3 : d <= 6 ? 4 : 5);
export function bumboQ(rnd, d) {
  const max = maxBumbos(d); const n = 1 + Math.floor(rnd() * max);
  return { key: 'bumbos', n, bpm: d >= 7 ? 90 : 70, ans: String(n), options: Array.from({ length: max }, (_, i) => ({ id: String(i + 1), label: String(i + 1) })) };
}

/** O que cada erro quer dizer (vira dica no resultado e no PDF). */
export const hintOf = (game, key) => {
  if (game === 'pecas' || game === 'pauta') return `treinar: ${nameOf(key)}`;
  if (game === 'figuras') return key === 'dura' ? 'comparar a duração das figuras' : key === 'tempos' ? 'quantos tempos cada figura dura' : 'o nome de cada figura';
  if (game === 'bumbos') return 'contar os bumbos escutando';
  return '';
};
export { FIG_NAME };
