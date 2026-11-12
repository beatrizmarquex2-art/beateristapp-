import test from 'node:test';
import assert from 'node:assert/strict';
import { estrelasFase, ganhoEstrelas } from '../js/toca-estrelas.js';

test('na tela (mão): igual à pauLta, 60% = 1 ★, 80% = 2 ★, 100% = 3 ★ e abaixo de 60% nenhuma', () => {
  for (const tier of ['ini', 'int', 'ava']) for (const bpm of [80, 160]) {
    assert.deepEqual([59, 60, 79, 80, 99, 100].map((score) => estrelasFase({ score, mic: false, tier, bpm })), [0, 1, 1, 2, 2, 3]);
  }
  assert.equal(estrelasFase({ score: 59, mic: true, tier: 'ini', bpm: 100 }), 0);
});
test('microfone vale no mínimo: iniciante 2; intermediário 2 até 100 e 3 de 120; avançado 2 a 80 e 3 de 100 (e a precisão alta continua valendo)', () => {
  for (const bpm of [80, 100, 120, 140, 160]) assert.equal(estrelasFase({ score: 60, mic: true, tier: 'ini', bpm }), 2);
  assert.deepEqual([80, 100, 120, 140, 160].map((bpm) => estrelasFase({ score: 60, mic: true, tier: 'int', bpm })), [2, 2, 3, 3, 3]);
  assert.deepEqual([80, 100, 120, 140, 160].map((bpm) => estrelasFase({ score: 60, mic: true, tier: 'ava', bpm })), [2, 3, 3, 3, 3]);
  assert.equal(estrelasFase({ score: 100, mic: true, tier: 'ini', bpm: 80 }), 3);
});
test('só ganha a diferença sobre o melhor', () => { assert.equal(ganhoEstrelas(2, 1), 1); assert.equal(ganhoEstrelas(1, 2), 0); assert.equal(ganhoEstrelas(3, 0), 3); });
