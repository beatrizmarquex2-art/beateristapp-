import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, MODOS, cartas, sortear, conferir, acertou, estrelas } from '../js/jogos/detetive-logic.js';
import { FOODS } from '../js/kids-logic.js';

test('os 4 temas (comida, parque, corpo, animal) têm uma palavra de cada tempo e ela existe nas cartas do Monte seu ritmo', () => {
  assert.deepEqual(MODOS, ['comida', 'parque', 'corpo', 'animal', 'normal']);
  for (const t of ['comida', 'parque', 'corpo', 'animal']) for (const cell of ['1000', '1010', '1111']) { const f = FOODS.find((x) => x.id === TEMAS[t][cell]); assert.ok(f, `${t} ${cell}`); assert.equal(f.cell, cell); }
});
test('cartas: 4 por modo (semínima, 2 colcheias, 4 semicolcheias, pausa); no normal não tem palavra', () => {
  for (const m of MODOS) { const c = cartas(m); assert.deepEqual(c.map((x) => x.cell), ['1000', '1010', '1111', '0000']); assert.equal(c[3].id, m === 'normal' ? null : 'shh'); }
});
test('sortear: 4 tempos, sem começar com pausa, no máximo 1 pausa', () => {
  for (let i = 0; i < 200; i++) { const s = sortear(); assert.equal(s.length, 4); assert.notEqual(s[0], '0000'); assert.ok(s.filter((c) => c === '0000').length <= 1); }
});
test('conferir: certo, errado e vazio por tempo; acertou só com tudo certo', () => {
  const sec = ['1000', '1010', '1111', '1000'];
  assert.deepEqual(conferir(['1000', '1000', '1111'], sec), [true, false, true, null]);
  assert.ok(acertou(sec.slice(), sec)); assert.ok(!acertou(['1000', '1010', '1111'], sec)); assert.ok(!acertou(['1000', '1010', '1111', '0000'], sec));
});
test('estrelas pelas rodadas certas de primeira', () => { assert.equal(estrelas(6), 3); assert.equal(estrelas(4), 2); assert.equal(estrelas(1), 1); assert.equal(estrelas(0), 0); });
