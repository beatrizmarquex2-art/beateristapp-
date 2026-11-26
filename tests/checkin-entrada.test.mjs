import test from 'node:test'; import assert from 'node:assert/strict';
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const L = await import('../js/figurinhas/album-logic.js');
const { aplicar } = await import('../js/checkin-entrada.js').catch(() => ({ aplicar: null }));
test('entrar no app conta o dia e dá o giro do dia', { skip: !aplicar }, () => {
  const r = aplicar(L.emptyState(), '2026-11-20');
  assert.equal(r.state.sem.seq, 1); assert.ok(r.state.granted.includes(L.checkinId('2026-11-20'))); assert.equal(r.completou, false);
  const r2 = aplicar(r.state, '2026-11-20'); assert.equal(r2.state.sem.seq, 1);
});
test('sétimo dia seguido fecha a semana e entrega o pacote', { skip: !aplicar }, () => {
  let s = L.emptyState(); let ult;
  for (let d = 14; d <= 20; d++) { ult = aplicar(s, `2026-11-${d}`); s = ult.state; }
  assert.equal(ult.completou, true); assert.ok(s.granted.includes(L.semanaPackId(1)));
});

import { grantSemana, semanaPacks, epicoPack, packKind } from '../js/figurinhas/album-logic.js';
test('semana fechada: 1 exclusiva + giro duplo épico (2 pacotes), sem entregar em dobro', () => {
  const s = grantSemana({ ...L.emptyState() }, 3); assert.deepEqual(semanaPacks(3).filter((id) => s.granted.includes(id)), semanaPacks(3));
  assert.equal(epicoPack('epico:sem3:1').n, 1); assert.equal(epicoPack('epico:sem3:2').n, 2); assert.equal(packKind('epico:sem3:1'), 'epico');
  assert.equal(grantSemana(s, 3), s);
});
