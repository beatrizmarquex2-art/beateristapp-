import test from 'node:test';
import assert from 'node:assert/strict';
import { estrelasFase, ganhoEstrelas } from '../js/toca-estrelas.js';

test('na tela (mão) é sempre 1 estrela, e abaixo de 50% nenhuma', () => {
  for (const tier of ['ini', 'int', 'ava']) for (const bpm of [80, 100, 120, 140, 160]) assert.equal(estrelasFase({ score: 100, mic: false, tier, bpm }), 1);
  assert.equal(estrelasFase({ score: 49, mic: true, tier: 'ini', bpm: 100 }), 0);
});
test('microfone: iniciante 2; intermediário 2 até 100 e 3 de 120; avançado 2 a 80 e 3 de 100', () => {
  for (const bpm of [80, 100, 120, 140, 160]) assert.equal(estrelasFase({ score: 60, mic: true, tier: 'ini', bpm }), 2);
  assert.deepEqual([80, 100, 120, 140, 160].map((bpm) => estrelasFase({ score: 60, mic: true, tier: 'int', bpm })), [2, 2, 3, 3, 3]);
  assert.deepEqual([80, 100, 120, 140, 160].map((bpm) => estrelasFase({ score: 60, mic: true, tier: 'ava', bpm })), [2, 3, 3, 3, 3]);
});
test('só ganha a diferença sobre o melhor', () => { assert.equal(ganhoEstrelas(2, 1), 1); assert.equal(ganhoEstrelas(1, 2), 0); assert.equal(ganhoEstrelas(3, 0), 3); });
