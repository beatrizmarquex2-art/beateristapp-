import test from 'node:test';
import assert from 'node:assert/strict';
import { proximaLendaria, MISSOES, ESTRELAS_MISSAO } from '../js/resgate.js';
import { LENDARIAS, darLendaria, temLendaria } from '../js/figurinhas/lendarias.js';
test('a compra aprovada entrega a próxima lendária que a pessoa ainda não tem', () => {
  assert.equal(proximaLendaria([], LENDARIAS), 'L01'); assert.equal(proximaLendaria(['L01', 'L02'], LENDARIAS), 'L03'); assert.equal(proximaLendaria(LENDARIAS.map((x) => x.codigo), LENDARIAS), null);
  let s = {}; s = darLendaria(s, 'L01'); s = darLendaria(s, 'L01'); assert.deepEqual(s.lend, ['L01']); assert.ok(temLendaria(s, 'L01')); assert.equal(darLendaria(s, 'XX'), s);
});
test('as 3 missões e a recompensa', () => { assert.deepEqual(MISSOES.map((m) => m.tipo), ['google', 'youtube', 'amigo']); assert.equal(ESTRELAS_MISSAO, 5); });
