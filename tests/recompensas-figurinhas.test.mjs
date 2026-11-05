// Recompensas do álbum: roleta a cada 30 estrelas (1 ou 2 figurinhas, exclusiva rara) e 3 figurinhas tops ao completar um jogo.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import * as L from '../js/figurinhas/album-logic.js';
const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8'));
const by = Object.fromEntries(cat.map((c) => [c.codigo, c]));

test('a roleta vem a cada 30 estrelas', () => {
  assert.equal(L.ESTRELAS_POR_ROLETA, 30);
});
test('tipos de pacote pelo id', () => {
  assert.equal(L.packKind('roleta:u1:3'), 'roleta'); assert.equal(L.packKind('jogo:kids-figuras:u1'), 'jogo'); assert.equal(L.packKind('welcome:1'), 'pacote'); assert.equal(L.packKind('daily:2026-11-05'), 'pacote');
});
test('roleta: sempre 1 ou 2 figurinhas distintas, mesma id = mesmo resultado', () => {
  for (let i = 0; i < 400; i++) { const d = L.drawPack(cat, `roleta:p:${i}`); assert.ok(d.length === 1 || d.length === 2, String(d.length)); assert.equal(new Set(d).size, d.length); d.forEach((c) => assert.ok(by[c], c)); assert.deepEqual(d, L.drawPack(cat, `roleta:p:${i}`)); }
});
test('roleta: maioria comum, às vezes rara e Beatlemania, exclusiva só bem raramente', () => {
  const n = {}; let tot = 0, dois = 0; const N = 6000;
  for (let i = 0; i < N; i++) { const d = L.drawPack(cat, `roleta:t:${i}`); if (d.length === 2) dois++; for (const c of d) { n[by[c].secao] = (n[by[c].secao] || 0) + 1; tot++; } }
  assert.ok(n.Comum / tot > 0.5 && n.Comum / tot < 0.75, `comum ${n.Comum / tot}`);
  assert.ok(n.Raras > 0 && n.Beatlemania > 0, 'raras e beatles aparecem');
  assert.ok(n.Beaterista > 0 && n.Beaterista / tot < 0.08, `exclusiva rara ${n.Beaterista / tot}`);
  assert.ok(dois / N > 0.25 && dois / N < 0.45, `2 figurinhas em ${dois / N}`);
});
test('prêmio de jogo completo: 3 figurinhas tops (exclusivas da Beaterista e raras), distintas', () => {
  for (let i = 0; i < 400; i++) { const d = L.drawPack(cat, `jogo:g:${i}`); assert.equal(d.length, 3); assert.equal(new Set(d).size, 3); d.forEach((c) => assert.ok(by[c].raridade === 'Exclusiva' || by[c].raridade === 'Rara', `${c} ${by[c].raridade}`)); }
});
test('roleta e prêmio entram uma vez só e abrem uma vez só (idempotente)', () => {
  let s = L.grantPack(L.emptyState(), 'roleta:u:1'); s = L.grantPack(s, 'roleta:u:1'); s = L.grantPack(s, 'jogo:av-x:u');
  assert.equal(L.pendingPacks(s).length, 2);
  const a = L.openPack(s, cat, 'roleta:u:1'); assert.ok(a.fresh); assert.ok(a.codes.length === 1 || a.codes.length === 2);
  const b = L.openPack(a.state, cat, 'roleta:u:1'); assert.equal(b.fresh, false);
  const c = L.openPack(a.state, cat, 'jogo:av-x:u'); assert.equal(c.codes.length, 3);
  assert.equal(L.pendingPacks(L.grantPack(c.state, 'roleta:u:1')).length, 0, 'já aberta não volta');
  assert.equal(L.inHand(c.state), a.codes.length + 3);
});
