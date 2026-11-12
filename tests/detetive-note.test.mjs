import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, MODOS, FASES, cartas, poolFase, sortear, conferir, acertou, estrelas } from '../js/jogos/detetive-logic.js';
import { FOODS } from '../js/kids-logic.js';

test('figuras vem em primeiro; os 4 temas têm uma palavra por tempo e ela existe no Monte seu ritmo', () => {
  assert.deepEqual(MODOS, ['normal', 'comida', 'parque', 'corpo', 'animal']);
  for (const t of ['comida', 'parque', 'corpo', 'animal']) for (const cell of ['1000', '1010', '1111']) { const f = FOODS.find((x) => x.id === TEMAS[t][cell]); assert.ok(f, `${t} ${cell}`); assert.equal(f.cell, cell); }
});
test('cada fase muda: 1 semínima/colcheias, 2 + pausa, 3-4 + semicolcheias (sem pausa), 5-6 tudo, 7+ tudo', () => {
  assert.deepEqual(poolFase(1), ['1000', '1010']); assert.deepEqual(poolFase(2), ['1000', '1010', '0000']); assert.deepEqual(poolFase(4), ['1000', '1010', '1111']); assert.equal(poolFase(6).length, 4); assert.equal(poolFase(12).length, 4);
  assert.notDeepEqual(poolFase(1), poolFase(2)); assert.notDeepEqual(poolFase(2), poolFase(3));
  assert.equal(cartas('comida', 1).length, 2); assert.equal(cartas('comida', 2).length, 3); assert.equal(cartas('comida', 12).length, 4); assert.equal(cartas('normal', 12)[3].id, null);
});
test('sortear: 4 tempos só com as células da fase, sem começar com pausa, no máximo 1 pausa, e a fase nova sempre usa a novidade', () => {
  for (let n = 1; n <= FASES; n++) for (let i = 0; i < 80; i++) {
    const s = sortear(n); assert.equal(s.length, 4); assert.ok(s.every((c) => poolFase(n).includes(c))); assert.notEqual(s[0], '0000'); assert.ok(s.filter((c) => c === '0000').length <= 1); assert.ok(new Set(s).size >= 2);
    if (n === 2) assert.ok(s.includes('0000')); if (n === 3 || n === 4) assert.ok(s.includes('1111') && !s.includes('0000')); if (n === 5 || n === 6) assert.ok(s.includes('1111') && s.includes('0000'));
  }
});
test('conferir: certo, errado e vazio por tempo; acertou só com tudo certo', () => {
  const sec = ['1000', '1010', '1111', '1000'];
  assert.deepEqual(conferir(['1000', '1000', '1111'], sec), [true, false, true, null]);
  assert.ok(acertou(sec.slice(), sec)); assert.ok(!acertou(['1000', '1010', '1111'], sec));
});
test('estrelas da fase: completar = 1, 2 de primeira = 2, todas de primeira = 3', () => { assert.equal(estrelas(0), 1); assert.equal(estrelas(1), 1); assert.equal(estrelas(2), 2); assert.equal(estrelas(3), 3); });

test('o compasso novo nunca repete o anterior', () => { for (let n = 1; n <= 12; n++) { let ant = null; for (let i = 0; i < 60; i++) { const s = sortear(n, Math.random, ant); if (ant) assert.notEqual(s.join(), ant.join()); ant = s; } } });
