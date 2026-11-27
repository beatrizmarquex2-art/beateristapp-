// Sons da Fuga: acerto soa como acerto (sobe, sem ronco grave descendo) e só o alarme de erro é áspero e desce (bug: a porta abrindo parecia erro).
import test from 'node:test'; import assert from 'node:assert/strict';
import { PLANO_SFX } from '../js/jogos/fuga-som.js';
const descendo = (a) => a[2] < a[1] * 0.9; // desce de verdade
test('acerto (porta abrindo e vitória) nunca usa serra/quadrada nem ronco grave descendo', () => {
  for (const nome of ['porta', 'vitoria', 'laser']) { const v = PLANO_SFX[nome]; assert.ok(v.length, nome); assert.ok(v.every((a) => !['sawtooth', 'square'].includes(a[0])), `${nome} sem onda áspera`); }
  assert.ok(PLANO_SFX.porta.every((a) => !(descendo(a) && a[1] < 200 && a[4] > 0.3)), 'sem ronco grave longo descendo');
});
test('acerto termina mais agudo do que começa (arpejo sobe); o alarme é o áspero', () => {
  const notas = PLANO_SFX.porta.filter((a) => a[0] === 'triangle').map((a) => a[1]); assert.deepEqual(notas, [...notas].sort((a, b) => a - b)); assert.ok(notas[notas.length - 1] > notas[0]);
  assert.ok(PLANO_SFX.alarme.every((a) => a[0] === 'square')); assert.ok(PLANO_SFX.laser[0][2] > PLANO_SFX.laser[0][1], 'começar a porta sobe');
});
