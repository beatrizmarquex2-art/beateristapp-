// Progresso na nuvem (js/progresso-nuvem.js): a mescla de dois aparelhos não perde nada.
import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage = { _: {}, getItem(k) { return k in this._ ? this._[k] : null; }, setItem(k, v) { this._[k] = String(v); }, removeItem(k) { delete this._[k]; } };
const { mescla, mesclaJogos } = await import('../js/progresso-nuvem.js');
test('arrays viram união, números ficam com o maior, "sim" vence', () => {
  assert.deepEqual(mescla(['a', 'b'], ['b', 'c']), ['a', 'b', 'c']);
  assert.equal(mescla(3, 7), 7); assert.equal(mescla(true, false), true); assert.equal(mescla(undefined, 5), 5); assert.equal(mescla('local', 'nuvem'), 'local');
  assert.deepEqual(mescla({ x: 1, y: [1] }, { x: 2, z: 9, y: [2] }), { x: 2, y: [1, 2], z: 9 });
});
test('por jogo, fica o que foi mexido por último; jogo que só existe de um lado entra', () => {
  const l = { quebra: { best: 5, __t: 100 }, velha: { n: 1, __t: 50 } };
  const r = { quebra: { best: 9, __t: 200 }, stop: { n: 3, __t: 10 } };
  const m = mesclaJogos(l, r);
  assert.equal(m.quebra.best, 9); assert.equal(m.velha.n, 1); assert.equal(m.stop.n, 3);
});
test('passe anual: R$ 49,90 no Pix e R$ 79,90 no cartão, sem data de fim e com o Pix escondido até ser liberado', async () => {
  const { precoPasse } = await import('../js/passe-preco.js');
  const O = await import('../js/oferta.js');
  const p = precoPasse(new Date('2027-03-01T12:00:00-03:00'));
  assert.deepEqual([p.atual, p.cartao, p.oferta], ['R$ 49,90', 'R$ 79,90', false]);
  assert.equal(O.URL_CARTAO, 'https://pay.hotmart.com/Y108629105P'); assert.equal(O.URL_PIX, 'https://jogos.beaterista.com.br/pix/');
  assert.equal(O.PIX_LIBERADO, false, 'o checkout Pix está em homologação: o botão só aparece depois de autorizado');
});
