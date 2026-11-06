// Aula ao vivo do Toca Aqui: só vale partitura de 1 a 4 compassos com células conhecidas e andamento sensato. Sem DOM.
import test from 'node:test'; import assert from 'node:assert/strict';
globalThis.document = { createElement: () => ({ setAttribute() {}, append() {}, style: {} }), addEventListener() {}, documentElement: { classList: { contains: () => false } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem() {} };
const A = await import('../js/jogos/aula-toca.js');
test('barValida: múltiplos de 4 tempos (1 a 4 compassos) com células conhecidas', () => {
  assert.ok(A.barValida(['1000', '1010', '1111', '0000'])); assert.ok(A.barValida(Array(16).fill('1000')));
  for (const ruim of [null, [], ['1000'], Array(20).fill('1000'), ['1000', '1000', '1000', '9999'], ['1000', '1000', '1000', '1000', '1000'], 'abc', ['1000', '1000', '1000', { p: 1 }]]) assert.ok(!A.barValida(ruim), JSON.stringify(ruim));
});
test('bpmValido: 30 a 220', () => { assert.ok(A.bpmValido(70)); assert.ok(A.bpmValido(30)); assert.ok(A.bpmValido(220)); for (const x of [29, 221, NaN, '70', null]) assert.ok(!A.bpmValido(x), String(x)); });
test('estadoAula/aulaValida: título cortado em 60, go e rev numéricos; lixo é recusado', () => {
  const e = A.estadoAula({ titulo: 'x'.repeat(100), bar: ['1000', '1000', '1000', '1000'], bpm: 80 });
  assert.equal(e.titulo.length, 60); assert.equal(e.go, 0); assert.equal(e.rev, 1); assert.ok(A.aulaValida(e));
  assert.ok(!A.aulaValida({ ...e, bar: ['1', '2'] })); assert.ok(!A.aulaValida({ ...e, bpm: 5 })); assert.ok(!A.aulaValida({ ...e, v: 2 })); assert.ok(!A.aulaValida(null)); assert.ok(!A.aulaValida({ ...e, go: 'a' }));
});
test('nomeDaCelula: nome em português da célula', () => { assert.equal(A.nomeDaCelula('1000'), 'semínima'); assert.equal(A.nomeDaCelula('1010'), 'duas colcheias'); });
