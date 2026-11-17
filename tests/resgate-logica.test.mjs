import test from 'node:test';
import assert from 'node:assert/strict';
import { proximaLendaria, MISSOES, ESTRELAS_MISSAO } from '../js/resgate.js';
import { LENDARIAS, darLendaria, temLendaria, totalPorProdutos, produtosDoResgate, completarLendarias } from '../js/figurinhas/lendarias.js';
test('a compra aprovada entrega a próxima lendária que a pessoa ainda não tem', () => {
  assert.equal(proximaLendaria([], LENDARIAS), 'L01'); assert.equal(proximaLendaria(['L01', 'L02'], LENDARIAS), 'L03'); assert.equal(proximaLendaria(LENDARIAS.map((x) => x.codigo), LENDARIAS), null);
  let s = {}; s = darLendaria(s, 'L01'); s = darLendaria(s, 'L01'); assert.deepEqual(s.lend, ['L01']); assert.ok(temLendaria(s, 'L01')); assert.equal(darLendaria(s, 'XX'), s);
});
test('as 3 missões e a recompensa', () => { assert.deepEqual(MISSOES.map((m) => m.tipo), ['google', 'youtube', 'amigo']); assert.equal(ESTRELAS_MISSAO, 5); });

test('lendárias: cada produto = 1, combo = todas', () => {
  assert.equal(totalPorProdutos(0), 0); assert.equal(totalPorProdutos(1), 1); assert.equal(totalPorProdutos(2), 2); assert.equal(totalPorProdutos(6), 6); assert.equal(totalPorProdutos(9), 6);
  assert.equal(produtosDoResgate('compras:2'), 2); assert.equal(produtosDoResgate('produtos:2'), 2); assert.equal(produtosDoResgate('combo'), 6); assert.equal(produtosDoResgate(''), 1); assert.equal(produtosDoResgate(null), 1); assert.equal(produtosDoResgate('compras:99'), 6);
});
test('completar lendárias: sobe de faixa sem repetir e nunca tira', () => {
  let r = completarLendarias({}, 1); assert.deepEqual(r.novas, ['L01']); assert.deepEqual(r.state.lend, ['L01']);
  r = completarLendarias(r.state, 3); assert.deepEqual(r.novas, ['L02', 'L03']); assert.equal(r.state.lend.length, 3);
  r = completarLendarias(r.state, 3); assert.deepEqual(r.novas, []); r = completarLendarias(r.state, 1); assert.deepEqual(r.novas, []); assert.equal(r.state.lend.length, 3);
  r = completarLendarias(r.state, 5); assert.deepEqual(r.novas, ['L04', 'L05']); assert.equal(r.state.lend.length, 5); assert.deepEqual(completarLendarias(r.state, 5).novas, []);
  assert.deepEqual(completarLendarias({ lend: ['L05'] }, 3).state.lend, ['L05', 'L01', 'L02']);
});

test('missão de postar: tipo por jogo e nome legível pra Bea', async () => {
  const R = await import('../js/resgate.js');
  assert.equal(R.tipoPost('uno'), 'post:uno'); assert.match(R.tipoPost('paulbox'), /^post:[a-z0-9-]{1,24}$/);
  assert.ok(R.JOGOS_POST.every(([id]) => /^[a-z0-9-]{1,24}$/.test(id)), 'todo id de jogo passa na regra do banco (017)');
  assert.equal(new Set(R.JOGOS_POST.map((x) => x[0])).size, R.JOGOS_POST.length);
  assert.equal(R.nomeTipo('post:uno'), 'postou e marcou a escola: Uno Musical'); assert.equal(R.nomeTipo('google'), 'avaliou no Google');
});
test('baú e roleta explicam por que a pessoa ganhou', async () => {
  const L = await import('../js/figurinhas/album-logic.js');
  assert.match(L.motivoDoPacote('roleta:dia:2026-11-15'), /check-in/); assert.match(L.motivoDoPacote('roleta:p1:3'), /15 ★/); assert.match(L.motivoDoPacote('roleta:fases3:p1:1'), /4 fases/);
  assert.match(L.motivoDoPacote('jogo:kids-figuras:p1'), /jogo inteiro/); assert.match(L.motivoDoPacote('jogo:av-cartas:p1'), /Aventura/); assert.match(L.motivoDoPacote('plf:drumF:a:p1'), /Bateria/); assert.match(L.motivoDoPacote('semana:3'), /7 dias/);
});
