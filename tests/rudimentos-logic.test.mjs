import test from 'node:test';
import assert from 'node:assert/strict';
import { FASES, BLOCOS, TEMPOS, FIGURAS, buildChart, passo, janela, judgeTap, judgeOnsets, sweep, summary, guardar, melhoresDe, estrelas, liberada, totalEstrelas } from '../js/jogos/rudimentos-logic.js';

test('são as 11 fases da Bea, em 3 blocos, só com D e E e com 16 toques (a fase do paradiddle duplo dos dois lados tem 32)', () => {
  assert.equal(FASES.length, 11); assert.equal(BLOCOS.length, 3);
  for (const f of FASES) { assert.match(f.seq, /^[DE]+$/, `fase ${f.n}`); assert.equal(f.seq.length, f.n === 6 ? 32 : 16, `fase ${f.n}`); assert.ok(BLOCOS.some((b) => b.n === f.bloco)); }
  assert.deepEqual(FASES.map((f) => f.bloco), [1, 1, 1, 1, 1, 2, 3, 3, 3, 3, 3]);
});
test('as linhas do jeito que a Bea mandou', () => {
  assert.equal(FASES[0].seq, 'DEDEDEDEDEDEDEDE'.slice(0, 16));
  assert.equal(FASES[1].seq, 'DDEEDDEEDDEEDDEE');
  assert.equal(FASES[2].seq, 'DEDDEDEEDEDDEDEE');
  assert.equal(FASES[3].seq, 'DEDEDDEDEDEEDEDE');
  assert.equal(FASES[4].seq, 'DEDEDDEDEDEEDDEE');
  assert.equal(FASES[5].seq, 'DEDEDDEDEDEEDEDD' + 'EDEDEEDEDEDDEDEE');
  assert.equal(FASES[6].seq, 'DEDEDEDDEDEDEDEE');
  assert.equal(FASES[7].seq, 'DDDDDDDDEEEEEEEE');
  assert.equal(FASES[8].seq, 'DDDDEEEEDDDDEEEE');
  assert.equal(FASES[9].seq, 'DEEDEDDEDEEDEDDE');
  assert.equal(FASES[10].seq, 'DDEDEEDEDDEDEEDE');
});
test('o toque simples é mesmo alternado e o toque duplo tem duas de cada', () => {
  assert.ok([...FASES[0].seq].every((c, i) => c === (i % 2 ? 'E' : 'D')));
  assert.ok([...FASES[1].seq].every((c, i) => c === (Math.floor(i / 2) % 2 ? 'E' : 'D')));
});
test('andamentos 80, 100, 120 e 140; figuras colcheia (2 por tempo) e semicolcheia (4 por tempo)', () => {
  assert.deepEqual(TEMPOS.map((t) => t[1]), [80, 100, 120, 140]); assert.deepEqual(FIGURAS, [['colcheia', 2], ['semicolcheia', 4]]);
  assert.equal(passo(120, 2), 0.25); assert.equal(passo(120, 4), 0.125);
});
test('o gráfico repete o padrão no passo certo e cada nota sabe seu lado', () => {
  const c = buildChart('DE', 60, 4); // passo = .25 s
  assert.equal(c.length, 64); assert.equal(c[0].t, 0); assert.equal(c[1].t, 0.25); assert.equal(c[1].side, 'E'); assert.equal(c[63].t, 63 * 0.25);
  assert.equal(buildChart('DE', 60, 2)[1].t, 0.5); // colcheia: 2 por tempo
  assert.equal(buildChart(FASES[5].seq, 80, 2).length, 64); assert.equal(buildChart(FASES[0].seq, 80, 4).length, 64);
});
test('a janela de acerto: até 60% do passo, nunca menos de 70 ms nem mais de 160 ms', () => {
  for (const [, bpm] of TEMPOS) for (const por of [2, 4]) { const w = janela(bpm, por); assert.ok(w >= 0.07 - 1e-9 && w <= 0.16 + 1e-9); assert.ok(w <= Math.max(0.07, passo(bpm, por) * 0.6) + 1e-9); }
  assert.equal(janela(80, 2), 0.16); assert.equal(janela(140, 4), 0.07);
});
test('toque no lado certo conta; no lado trocado vira "lado"; sem toque vira faltou', () => {
  const c = buildChart('DE', 60, 4); const w = janela(60, 4);
  assert.equal(judgeTap(c, 0.01, 'D', w).kind, 'perfeito');
  assert.equal(judgeTap(c, 0.25, 'D', w).kind, 'lado'); // era E
  sweep(c, 30, w); const s = summary(c); assert.equal(s.perfeito, 1); assert.equal(s.lado, 1); assert.ok(s.faltou > 50);
});
test('microfone: confere só o tempo (qualquer mão), o que não tocou vira faltou e os ataques a mais são contados', () => {
  const c = buildChart('DE', 60, 4); const w = janela(60, 4);
  const r = judgeOnsets(c, [0.01, 0.26, 0.5, 0.75, 0.9, 0.95], w); // 0.9 e 0.95: um acerta a nota de 1.0? não (fora da janela de .15 pra 0.9? .1 sim), o outro sobra
  const s = summary(c); assert.ok(s.hits >= 4); assert.ok(s.faltou > 50); assert.ok(r.extras >= 0);
  const c2 = buildChart('DE', 60, 4); judgeOnsets(c2, c2.map((n) => n.t)); assert.equal(summary(c2).acc, 100); // tocou tudo no tempo, sem saber a mão
  const c3 = buildChart('DE', 60, 4); const r3 = judgeOnsets(c3, [50, 51]); assert.equal(r3.extras, 2); assert.equal(summary(c3).acc, 0);
});
test('estrelas: 1 = colcheia, 2 = + semicolcheia, 3 = semicolcheia a 120 ou mais; a fase seguinte abre com 1 estrela', () => {
  let est = {}; assert.equal(estrelas(est, 1), 0); assert.equal(liberada(est, 1), true); assert.equal(liberada(est, 2), false);
  est = guardar(est, 1, 0, 0, 79); assert.equal(estrelas(est, 1), 0);
  est = guardar(est, 1, 0, 0, 85); assert.equal(estrelas(est, 1), 1); assert.equal(liberada(est, 2), true);
  est = guardar(est, 1, 0, 0, 60); assert.deepEqual(melhoresDe(est, 1).c, [85, 0, 0, 0]); // não piora
  est = guardar(est, 1, 1, 0, 90); assert.equal(estrelas(est, 1), 2); // semicolcheia a 80
  est = guardar(est, 1, 1, 2, 82); assert.equal(estrelas(est, 1), 3); // semicolcheia a 120
  assert.equal(totalEstrelas(est), 3);
});
test('dados salvos estragados não quebram', () => { assert.deepEqual(melhoresDe({ 1: 'x' }, 1), { c: [0, 0, 0, 0], s: [0, 0, 0, 0] }); assert.deepEqual(melhoresDe(null, 3), { c: [0, 0, 0, 0], s: [0, 0, 0, 0] }); assert.deepEqual(melhoresDe({ 1: [1, 2, 3] }, 1), { c: [0, 0, 0, 0], s: [0, 0, 0, 0] }); });
