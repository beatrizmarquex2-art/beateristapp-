import test from 'node:test';
import assert from 'node:assert/strict';
import { FASES, BLOCOS, TEMPOS, buildChart, passo, janela, judgeTap, sweep, summary, guardar, melhoresDe, estrelas, liberada, totalEstrelas } from '../js/jogos/rudimentos-logic.js';

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
test('o gráfico repete o padrão no passo certo (semicolcheia) e cada nota sabe seu lado', () => {
  const c = buildChart('DE', 60); // passo = .25 s
  assert.equal(passo(60), 0.25); assert.equal(c.length, 64); assert.equal(c[0].t, 0); assert.equal(c[1].t, 0.25); assert.equal(c[1].side, 'E'); assert.equal(c[63].t, 63 * 0.25);
  assert.equal(buildChart(FASES[5].seq, 70).length, 64); assert.equal(buildChart(FASES[0].seq, 70).length, 64);
});
test('a janela de acerto nunca passa de 60% do passo (andamento rápido não pega a nota vizinha)', () => {
  for (const [, bpm] of TEMPOS) assert.ok(janela(bpm) <= passo(bpm) * 0.6 + 1e-9);
  assert.ok(janela(50) <= 0.16);
});
test('toque no lado certo conta; no lado trocado vira "lado"; sem toque vira faltou', () => {
  const c = buildChart('DE', 60); const w = janela(60);
  assert.equal(judgeTap(c, 0.01, 'D', w).kind, 'perfeito');
  assert.equal(judgeTap(c, 0.25, 'D', w).kind, 'lado'); // era E
  sweep(c, 30, w); const s = summary(c); assert.equal(s.perfeito, 1); assert.equal(s.lado, 1); assert.ok(s.faltou > 50);
});
test('estrelas = andamentos acima de 80%; a fase seguinte abre com 1 estrela', () => {
  let est = {}; assert.equal(estrelas(est, 1), 0); assert.equal(liberada(est, 1), true); assert.equal(liberada(est, 2), false);
  est = guardar(est, 1, 0, 79); assert.equal(estrelas(est, 1), 0);
  est = guardar(est, 1, 0, 85); assert.equal(estrelas(est, 1), 1); assert.equal(liberada(est, 2), true);
  est = guardar(est, 1, 0, 60); assert.deepEqual(melhoresDe(est, 1), [85, 0, 0]); // não piora
  est = guardar(est, 1, 2, 100); assert.equal(estrelas(est, 1), 2); assert.equal(totalEstrelas(est), 2);
});
test('dados salvos estragados não quebram', () => { assert.deepEqual(melhoresDe({ 1: 'x' }, 1), [0, 0, 0]); assert.deepEqual(melhoresDe(null, 3), [0, 0, 0]); });
