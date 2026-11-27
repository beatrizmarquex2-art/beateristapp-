import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../js/sazonal-boot.js');
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const id = (a, m, d) => (S.estacaoDe(new Date(a, m - 1, d)) || {}).id || null;

test('Páscoa móvel', () => {
  for (const [a, d] of [[2024, '2024-03-31'], [2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2028, '2028-04-16']]) assert.equal(iso(S.pascoa(a)), d);
});
test('Carnaval 2027 (terça = 9/fev) e 2026 (terça = 17/fev)', () => {
  assert.equal(id(2027, 2, 6), 'carnaval'); assert.equal(id(2027, 2, 9), 'carnaval'); assert.equal(id(2027, 2, 10), 'carnaval'); assert.equal(id(2027, 2, 11), null); assert.equal(id(2027, 2, 4), null);
  assert.equal(id(2026, 2, 17), 'carnaval');
});
test('Páscoa: semana até o domingo; depois volta ao normal', () => {
  assert.equal(id(2027, 3, 21), 'pascoa'); assert.equal(id(2027, 3, 28), 'pascoa'); assert.equal(id(2027, 3, 29), null); assert.equal(id(2027, 3, 20), null);
});
test('datas fixas e fora de época = tela original', () => {
  assert.equal(id(2026, 12, 25), 'natal'); assert.equal(id(2026, 12, 31), 'anonovo'); assert.equal(id(2027, 1, 2), 'anonovo'); assert.equal(id(2027, 1, 3), null);
  assert.equal(id(2026, 6, 15), 'junina'); assert.equal(id(2026, 10, 12), 'criancas'); assert.equal(id(2026, 5, 10), 'maes'); assert.equal(id(2026, 8, 9), 'pais');
  assert.equal(id(2026, 9, 20), null); assert.equal(id(2026, 11, 15), null);
});
