// Perguntas dos jogos com fases (peças, pauta, figuras, bumbos). Puro, testado em tests/kids-quiz.test.mjs.
// `d` = dificuldade 0 a 10 (já ajustada pela idade). Cada pergunta: { ans, options:[{id,label}], ...dados do desenho/som }.
import { PIECES, nameOf, shuffle } from '../kids-logic.js';
import { FIGS, FIG_NAME, GROUPS, beatsLabel, specId, wrongSpecs } from './figs.js';

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

/** Quantas figuras já entram na fase d (da mais longa pra mais curta): semibreve, mínima, semínima, colcheia, semicolcheia, fusa, semifusa. */
export const figCount = (d) => [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7][Math.max(0, Math.min(10, d))];
/** Tipos de pergunta que cada fase liberta. dura/tempos/nome desde o começo; desenho e montar logo depois; pausas no meio; tercina e sextina no fim. */
export const figKinds = (d) => (d <= 1 ? ['dura', 'tempos', 'nome'] : d === 2 ? ['dura', 'tempos', 'nome', 'desenho', 'montar']
  : d <= 4 ? ['dura', 'tempos', 'nome', 'desenho', 'montar', 'pausa'] : d <= 6 ? ['dura', 'tempos', 'nome', 'desenho', 'montar', 'pausa', 'pausaValor']
    : ['dura', 'tempos', 'nome', 'montar', 'pausa', 'pausaValor', 'grupo', 'grupoN']);
const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];
const nOpts = (d) => (d <= 1 ? 3 : 4);
/** Figuras rítmicas: comparar, quanto vale, nome, desenho, montar o desenho, pausas, tercina e sextina. */
export function figureQ(rnd, d) {
  const pool = FIGS.slice(0, figCount(d)); const kind = pick(figKinds(d), rnd);
  if (kind === 'dura') {
    const gap = d <= 2 ? 2 : 1; let a; let b; let guard = 0;
    do { a = Math.floor(rnd() * pool.length); b = Math.floor(rnd() * pool.length); guard++; } while (Math.abs(a - b) < gap && guard < 200);
    const pair = [pool[a], pool[b]]; const win = pair[0].beats > pair[1].beats ? pair[0] : pair[1];
    return { kind, key: 'dura', pair: pair.map((f) => f.id), ans: win.id, options: pair.map((f) => ({ id: f.id, label: f.name })) };
  }
  if (kind === 'grupo') { const g = pick(GROUPS, rnd);
    return { kind, key: 'grupo', group: g.id, ans: g.id, options: shuffle([{ id: 'tercina', label: 'tercina' }, { id: 'sextina', label: 'sextina' }, { id: 'col2', label: 'duas colcheias' }, { id: 'semi4', label: 'quatro semicolcheias' }], rnd) }; }
  if (kind === 'grupoN') { const g = pick(GROUPS, rnd); const opts = [...new Set([g.n, g.normal, 3, 4, 6, 8])].slice(0, 4); if (!opts.includes(g.n)) opts[0] = g.n;
    return { kind, key: 'grupo', group: g.id, ans: String(g.n), options: shuffle([...new Set(opts)].map((n) => ({ id: String(n), label: `${n} notas` })), rnd) }; }
  const f = pick(pool, rnd);
  if (kind === 'tempos' || kind === 'pausaValor') {
    const opts = shuffle([...new Set(pool.map((x) => x.beats))], rnd).slice(0, nOpts(d)); if (!opts.includes(f.beats)) opts[0] = f.beats;
    return { kind, key: kind === 'tempos' ? 'tempos' : 'pausa', fig: f.id, ans: String(f.beats), options: shuffle(opts, rnd).map((b) => ({ id: String(b), label: beatsLabel(b) })) };
  }
  if (kind === 'montar') {
    const wrong = wrongSpecs(f, rnd, nOpts(d) - 1);
    return { kind, key: 'montar', fig: f.id, ans: specId(f), options: shuffle([specId(f), ...wrong], rnd).map((id) => ({ id, label: 'desenho' })) };
  }
  const others = shuffle(pool.filter((x) => x.id !== f.id), rnd).slice(0, nOpts(d) - 1);
  if (kind === 'desenho') return { kind, key: 'desenho', fig: f.id, ans: f.id, options: shuffle([f, ...others], rnd).map((x) => ({ id: x.id, label: x.name })) };
  return { kind, key: kind === 'pausa' ? 'pausa' : 'nome', fig: f.id, ans: f.id, options: shuffle([f, ...others], rnd).map((x) => ({ id: x.id, label: kind === 'pausa' ? `pausa de ${x.name}` : x.name })) };
}

/** "Quantos bumbos?": quantos bumbos tem no compasso. Mais bumbos e andamento mais rápido nas fases altas. */
export const maxBumbos = (d) => (d <= 3 ? 3 : d <= 6 ? 4 : 5);
export function bumboQ(rnd, d) {
  const max = maxBumbos(d); const n = 1 + Math.floor(rnd() * max);
  return { key: 'bumbos', n, bpm: d >= 7 ? 90 : 70, ans: String(n), options: Array.from({ length: max }, (_, i) => ({ id: String(i + 1), label: String(i + 1) })) };
}

/** "Onde mora na pauta?": nas fases mais difíceis aparecem duas peças juntas (chimbal + bumbo, chimbal + caixa…). */
const PAIRS = [['hh', 'bd'], ['hh', 'sn']]; const PAIRS_HARD = [...PAIRS, ['cr', 'bd']];
const joinName = (ids) => ids.map(nameOf).join(' + ');
export const pairName = (key) => joinName(String(key).split('+'));
export function pautaQ(rnd, d) {
  const chance = d < 6 ? 0 : d === 6 ? 0.4 : d === 7 ? 0.5 : d === 8 ? 0.65 : d === 9 ? 0.8 : 1;
  if (rnd() >= chance) { const q = pieceQ(rnd, d); return { ...q, ids: [q.ans] }; }
  const pool = d >= 9 ? PAIRS_HARD : PAIRS; const ids = pool[Math.floor(rnd() * pool.length)]; const ans = ids.join('+');
  const wrongPairs = [...pool.filter((p) => p.join('+') !== ans), ['sn', 'bd']].map((p) => p.join('+'));
  const singles = ids.map((x) => x); // a peça sozinha também é uma pegadinha
  const wrong = shuffle([...wrongPairs, ...singles], rnd).slice(0, Math.max(3, NOPTS[d] - 1));
  const options = shuffle([ans, ...wrong], rnd).map((id) => ({ id, label: pairName(id) }));
  return { ans, ids, key: ans, options };
}

/** O que cada erro quer dizer (vira dica no resultado e no PDF). */
export const hintOf = (game, key) => {
  if (game === 'pecas' || game === 'pauta') return `treinar: ${pairName(key)}`;
  if (game === 'figuras') return { dura: 'comparar a duração das figuras', tempos: 'quanto cada figura vale', nome: 'o nome de cada figura', desenho: 'reconhecer o desenho de cada figura', montar: 'montar o desenho: cabeça, haste e bandeirinhas', pausa: 'as pausas e quanto elas valem', grupo: 'tercina e sextina' }[key] || 'as figuras rítmicas';
  if (game === 'bumbos') return 'contar os bumbos escutando';
  return '';
};
export { FIG_NAME, beatsLabel };
