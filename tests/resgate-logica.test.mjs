import test from 'node:test';
import assert from 'node:assert/strict';
import { proximaLendaria, MISSOES, ESTRELAS_MISSAO } from '../js/resgate.js';
import { LENDARIAS, darLendaria, temLendaria, FAIXAS, totalPorProdutos, produtosDoResgate, completarLendarias } from '../js/figurinhas/lendarias.js';
test('a compra aprovada entrega a próxima lendária que a pessoa ainda não tem', () => {
  assert.equal(proximaLendaria([], LENDARIAS), 'L01'); assert.equal(proximaLendaria(['L01', 'L02'], LENDARIAS), 'L03'); assert.equal(proximaLendaria(LENDARIAS.map((x) => x.codigo), LENDARIAS), null);
  let s = {}; s = darLendaria(s, 'L01'); s = darLendaria(s, 'L01'); assert.deepEqual(s.lend, ['L01']); assert.ok(temLendaria(s, 'L01')); assert.equal(darLendaria(s, 'XX'), s);
});
test('as 3 missões e a recompensa', () => { assert.deepEqual(MISSOES.map((m) => m.tipo), ['google', 'youtube', 'amigo']); assert.equal(ESTRELAS_MISSAO, 5); });

test('lendárias por faixa: 1 produto = 1, 2 produtos = 3 (mais 2), 3 produtos = as 5 (mais 2)', () => {
  assert.deepEqual(FAIXAS, { 1: 1, 2: 3, 3: 5 }); assert.equal(totalPorProdutos(0), 0); assert.equal(totalPorProdutos(1), 1); assert.equal(totalPorProdutos(2), 3); assert.equal(totalPorProdutos(3), 5); assert.equal(totalPorProdutos(9), 5);
  assert.equal(produtosDoResgate('produtos:2'), 2); assert.equal(produtosDoResgate(''), 1); assert.equal(produtosDoResgate(null), 1); assert.equal(produtosDoResgate('produtos:7'), 1);
});
test('completar lendárias: sobe de faixa sem repetir e nunca tira', () => {
  let r = completarLendarias({}, 1); assert.deepEqual(r.novas, ['L01']); assert.deepEqual(r.state.lend, ['L01']);
  r = completarLendarias(r.state, 3); assert.deepEqual(r.novas, ['L02', 'L03']); assert.equal(r.state.lend.length, 3);
  r = completarLendarias(r.state, 3); assert.deepEqual(r.novas, []); r = completarLendarias(r.state, 1); assert.deepEqual(r.novas, []); assert.equal(r.state.lend.length, 3);
  r = completarLendarias(r.state, 5); assert.deepEqual(r.novas, ['L04', 'L05']); assert.equal(r.state.lend.length, 5); assert.deepEqual(completarLendarias(r.state, 5).novas, []);
  assert.deepEqual(completarLendarias({ lend: ['L05'] }, 3).state.lend, ['L05', 'L01', 'L02']);
});
