import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, MODOS, FASES, cartas, poolFase, sortear, conferir, acertou, estrelas } from '../js/jogos/detetive-logic.js';
import { FOODS } from '../js/kids-logic.js';

test('figuras vem em primeiro; os 4 temas têm uma palavra por tempo e ela existe no Monte seu ritmo', () => {
  assert.deepEqual(MODOS, ['normal', 'comida', 'parque', 'corpo', 'animal']);
  for (const t of ['comida', 'parque', 'corpo', 'animal']) for (const cell of ['1000', '1010', '1111']) { const f = FOODS.find((x) => x.id === TEMAS[t][cell]); assert.ok(f, `${t} ${cell}`); assert.equal(f.cell, cell); }
});
test('a dificuldade sobe: 1-2 só semínima/colcheias, 3-4 + pausa, 5-6 + semicolcheias, 7+ tudo', () => {
  assert.deepEqual(poolFase(1), ['1000', '1010']); assert.deepEqual(poolFase(4), ['1000', '1010', '0000']); assert.deepEqual(poolFase(6), ['1000', '1010', '1111']); assert.equal(poolFase(12).length, 4);
  assert.equal(cartas('comida', 1).length, 2); assert.equal(cartas('comida', 12).length, 4); assert.equal(cartas('normal', 12)[3].id, null);
});
test('sortear: 4 tempos só com as células da fase, sem começar com pausa, no máximo 1 pausa, e a fase nova sempre usa a novidade', () => {
  for (let n = 1; n <= FASES; n++) for (let i = 0; i < 80; i++) {
    const s = sortear(n); assert.equal(s.length, 4); assert.ok(s.every((c) => poolFase(n).includes(c))); assert.notEqual(s[0], '0000'); assert.ok(s.filter((c) => c === '0000').length <= 1); assert.ok(new Set(s).size >= 2);
    if (n === 3 || n === 4) assert.ok(s.includes('0000')); if (n === 5 || n === 6) assert.ok(s.includes('1111'));
  }
});
test('conferir: certo, errado e vazio por tempo; acertou só com tudo certo', () => {
  const sec = ['1000', '1010', '1111', '1000'];
  assert.deepEqual(conferir(['1000', '1000', '1111'], sec), [true, false, true, null]);
  assert.ok(acertou(sec.slice(), sec)); assert.ok(!acertou(['1000', '1010', '1111'], sec));
});
test('estrelas da fase igual à pauLta: 3 de 3 = 3 estrelas, 2 de 3 = 1 estrela (67%), menos de 60% = 0', () => { assert.equal(estrelas(0), 0); assert.equal(estrelas(1), 0); assert.equal(estrelas(2), 1); assert.equal(estrelas(3), 3); assert.equal(estrelas(4, 5), 2); });
