import test from 'node:test'; import assert from 'node:assert/strict';
const { quemPaga, vencedor } = await import('../js/jogos/duelo-base.js').catch(() => ({}));
test('duelo: quem ganha leva 3 ★, o outro leva 1 ★ de participação; empate = 1 ★ pros dois; sem resultado ninguém paga', () => {
  assert.deepEqual(quemPaga(0, 0), { vence: true, participa: false }); assert.deepEqual(quemPaga(0, 1), { vence: false, participa: true });
  assert.deepEqual(quemPaga(1, 1), { vence: true, participa: false }); assert.deepEqual(quemPaga(1, 0), { vence: false, participa: true });
  assert.deepEqual(quemPaga(-1, 0), { vence: false, participa: true }); assert.deepEqual(quemPaga(-1, 1), { vence: false, participa: true });
  assert.deepEqual(quemPaga(null, 0), { vence: false, participa: false });
});
