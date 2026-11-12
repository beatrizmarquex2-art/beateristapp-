// Detetive Note (regras puras): monta as perguntas. Sem tela nem áudio, testado em tests/detetive-note.test.mjs.
import { genBar, shuffle } from '../reading.js';
import { FOODS, cellOf, randomFoods } from '../kids-logic.js';

export const QUESTOES = 8;
export const BPM = 80;
/** Opções erradas: troca 1 ou 2 tempos do certo por outros do mesmo conjunto. */
export function variantes(correta, pool, rnd = Math.random, k = 3) {
  const out = []; const seen = new Set([correta.join()]);
  for (let g = 0; out.length < k && g < 800; g++) {
    const b = correta.slice(); const n = 1 + (rnd() < 0.4 ? 1 : 0);
    for (let c = 0; c < n; c++) { const i = Math.floor(rnd() * b.length); const alt = pool.filter((x) => x !== b[i]); b[i] = alt[Math.floor(rnd() * alt.length)]; }
    if (seen.has(b.join())) continue; seen.add(b.join()); out.push(b);
  }
  return out;
}
/** Uma pergunta: `bar` = 4 células (strings '1010'), `opts` = 4 compassos embaralhados, `ok` = índice do certo. */
export function pergunta(modo, lv = 1, rnd = Math.random) {
  if (modo === 'infantil') {
    const ids = randomFoods(rnd, 2); const bar = ids.map(cellOf); const pool = FOODS.map((f) => f.cell).filter((v, i, a) => a.indexOf(v) === i);
    const opts = shuffle([bar, ...variantes(bar, pool, rnd)], rnd); return { bar, opts, ok: opts.findIndex((o) => o.join() === bar.join()) };
  }
  const bar = genBar(lv, rnd); const pool = [...new Set(Array.from({ length: 60 }, () => genBar(lv, rnd)).flat())];
  const opts = shuffle([bar, ...variantes(bar, pool, rnd)], rnd); return { bar, opts, ok: opts.findIndex((o) => o.join() === bar.join()) };
}
