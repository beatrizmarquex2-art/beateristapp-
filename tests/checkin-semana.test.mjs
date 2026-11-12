import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkinSemana, semanaPackId, SEMANA_DIAS, SEMANA_ESTRELAS, drawPack, packSize } from '../js/figurinhas/album-logic.js';
const dias = (n, ini = '2026-11-01') => Array.from({ length: n }, (_, i) => { const d = new Date(`${ini}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); });
test('7 dias seguidos completam a semana; entrar de novo no mesmo dia não conta', () => {
  let sem; let feitos = 0; const seq = [];
  for (const d of dias(7)) { const r = checkinSemana(sem, d); sem = r.sem; seq.push(sem.seq); if (r.completou) feitos++; assert.equal(checkinSemana(sem, d).sem.seq, sem.seq, 'mesmo dia'); }
  assert.deepEqual(seq, [1, 2, 3, 4, 5, 6, 0]); assert.equal(feitos, 1); assert.equal(sem.ciclo, 1); assert.equal(SEMANA_DIAS, 7); assert.equal(SEMANA_ESTRELAS, 10);
});
test('faltou um dia: recomeça do 1', () => {
  let sem; for (const d of dias(4)) sem = checkinSemana(sem, d).sem; assert.equal(sem.seq, 4);
  const r = checkinSemana(sem, dias(1, '2026-11-06')[0]); assert.equal(r.sem.seq, 1); assert.equal(r.completou, false);
});
test('virada de mês e de ano contam como dias seguidos', () => {
  let sem; for (const d of ['2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01']) sem = checkinSemana(sem, d).sem; assert.equal(sem.seq, 4);
});
test('o prêmio da semana é 1 carta exclusiva da Bea (as fotos F0xx)', () => {
  const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../assets/figurinhas/${f}`, import.meta.url))); const cat = [...rd('catalogo.json'), ...rd('catalogo-paul.json')];
  const id = semanaPackId(1); assert.equal(packSize(id), 1); const c = drawPack(cat, id, 3, 's'); assert.equal(c.length, 1); assert.match(c[0], /^F\d+$/);
});
