import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChart, judgeTap, sweep, summary } from '../js/kids/taiko-logic.js';

test('1ª batida do tempo = grave, as de dentro do tempo = agudo, pausa = nada', () => {
  const c = buildChart(['1010', '0000', '1111', '1000'], 120, 1); // q = .5
  assert.deepEqual(c.map((n) => n.side), ['grave', 'agudo', 'grave', 'agudo', 'agudo', 'agudo', 'grave']);
  assert.equal(c[0].t, 0); assert.ok(Math.abs(c[1].t - 0.25) < 1e-9); assert.ok(Math.abs(c[2].t - 1.0) < 1e-9);
});
test('repete o padrão nas rodadas', () => { assert.equal(buildChart(['1000', '1000', '1000', '1000'], 100, 3).length, 12); });
test('acerto: lado certo dentro da janela; lado trocado e extra são reconhecidos', () => {
  const c = buildChart(['1010', '0000', '0000', '0000'], 120, 1);
  assert.equal(judgeTap(c, 0.05, 'grave').kind, 'perfeito');
  assert.equal(judgeTap(c, 0.25 + 0.12, 'agudo').kind, 'bom'); // 120 ms: dentro da folga
  assert.equal(judgeTap(c, 3, 'grave').kind, 'extra');
  const d = buildChart(['1000', '0000', '0000', '0000'], 120, 1); assert.equal(judgeTap(d, 0, 'agudo').kind, 'lado');
});
test('nota sem toque vira faltou e o resumo conta', () => {
  const c = buildChart(['1010', '0000', '0000', '0000'], 120, 1); judgeTap(c, 0, 'grave'); sweep(c, 5);
  const s = summary(c); assert.equal(s.perfeito, 1); assert.equal(s.faltou, 1); assert.equal(s.acc, 50);
});
