// Quiz Uno Musical: rodada de 5 perguntas com 3 opções, giro só com as 5 certas, no máximo 3 giros por dia. Sem DOM.
import test from 'node:test'; import assert from 'node:assert/strict';
globalThis.document = { createElement: () => ({ setAttribute() {}, append() {}, style: {} }), createElementNS: () => ({ setAttribute() {}, append() {}, style: {} }), addEventListener() {}, documentElement: { classList: { contains: () => false } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem() {} };
const Z = await import('../js/jogos/quizuno-logic.js');
test('rodada: 5 figuras diferentes, 3 opções cada, a certa está entre as opções, sem opção repetida', () => {
  for (let k = 0; k < 40; k++) { const r = Z.novaRodada(); assert.equal(r.qs.length, 5); assert.equal(new Set(r.qs.map((q) => q.sym)).size, 5);
    for (const q of r.qs) { assert.equal(q.opcoes.length, 3); assert.equal(new Set(q.opcoes).size, 3); assert.equal(q.opcoes[q.certa], q.sym); } }
});
test('5 certas seguidas = perfeita; qualquer erro tira o giro', () => {
  let r = Z.novaRodada(); for (let i = 0; i < 5; i++) r = Z.responder(r, r.qs[i].certa).r; assert.ok(r.fim && Z.perfeita(r));
  let e = Z.novaRodada(); for (let i = 0; i < 5; i++) e = Z.responder(e, i === 2 ? (e.qs[i].certa + 1) % 3 : e.qs[i].certa).r; assert.ok(e.fim && !Z.perfeita(e)); assert.equal(e.acertos, 4);
  assert.ok(!Z.perfeita(Z.novaRodada()));
});
test('giros por dia: no máximo 3, id fixo e crescente, zera no dia seguinte', () => {
  let q = null; const ids = []; for (let i = 0; i < 5; i++) { const c = Z.contarGiro(q, '2026-11-12'); q = c.q; ids.push(c.id); }
  assert.deepEqual(ids, [1, 2, 3, null, null]);
  const d = Z.contarGiro(q, '2026-11-13'); assert.ok(d.ganhou); assert.equal(d.id, 4);
});
