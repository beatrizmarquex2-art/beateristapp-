// Recompensas do álbum: roleta a cada 30 estrelas (1 ou 2 figurinhas, exclusiva rara) e 3 figurinhas tops ao completar um jogo.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import * as L from '../js/figurinhas/album-logic.js';
const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8'));
const by = Object.fromEntries(cat.map((c) => [c.codigo, c]));

test('a roleta vem a cada 30 estrelas', () => {
  assert.equal(L.ESTRELAS_POR_ROLETA, 15);
});
test('tipos de pacote pelo id', () => {
  assert.equal(L.packKind('roleta:u1:3'), 'roleta'); assert.equal(L.packKind('jogo:kids-figuras:u1'), 'jogo'); assert.equal(L.packKind('welcome:1'), 'pacote'); assert.equal(L.packKind(L.checkinId('2026-11-05')), 'roleta');
});
test('roleta: de 1 a 3 figurinhas distintas, mesma id = mesmo resultado', () => {
  for (let i = 0; i < 400; i++) { const d = L.drawPack(cat, `roleta:p:${i}`); assert.ok(d.length >= 1 && d.length <= 3, String(d.length)); assert.equal(new Set(d).size, d.length); d.forEach((c) => assert.ok(by[c], c)); assert.deepEqual(d, L.drawPack(cat, `roleta:p:${i}`)); }
});
test('roleta: maioria comum, às vezes rara e Beatlemania, exclusiva só bem raramente', () => {
  const n = {}; let tot = 0, dois = 0, tres = 0; const N = 6000;
  for (let i = 0; i < N; i++) { const d = L.drawPack(cat, `roleta:t:${i}`); if (d.length === 2) dois++; if (d.length === 3) tres = (tres || 0) + 1; for (const c of d) { n[by[c].secao] = (n[by[c].secao] || 0) + 1; tot++; } }
  assert.ok(n.Comum / tot > 0.5 && n.Comum / tot < 0.75, `comum ${n.Comum / tot}`);
  assert.ok(n.Raras > 0 && n.Beatlemania > 0, 'raras e beatles aparecem');
  assert.ok(n.Beaterista > 0 && n.Beaterista / tot < 0.08, `exclusiva rara ${n.Beaterista / tot}`);
  assert.ok(dois / N > 0.25 && dois / N < 0.45, `2 figurinhas em ${dois / N}`);
});
test('prêmio de jogo completo: pacote de 3 distintas com pelo menos 1 rara', () => {
  for (let i = 0; i < 400; i++) { const d = L.drawPack(cat, `jogo:g:${i}`); assert.equal(d.length, 3); assert.equal(new Set(d).size, 3); assert.ok(d.some((c) => by[c].raridade === 'Rara'), 'tem rara'); }
});
test('roleta e prêmio entram uma vez só e abrem uma vez só (idempotente)', () => {
  let s = L.grantPack(L.emptyState(), 'roleta:u:1'); s = L.grantPack(s, 'roleta:u:1'); s = L.grantPack(s, 'jogo:av-x:u');
  assert.equal(L.pendingPacks(s).length, 2);
  const a = L.openPack(s, cat, 'roleta:u:1'); assert.ok(a.fresh); assert.ok(a.codes.length >= 1 && a.codes.length <= 3);
  const b = L.openPack(a.state, cat, 'roleta:u:1'); assert.equal(b.fresh, false);
  const c = L.openPack(a.state, cat, 'jogo:av-x:u'); assert.equal(c.codes.length, 3);
  assert.equal(L.pendingPacks(L.grantPack(c.state, 'roleta:u:1')).length, 0, 'já aberta não volta');
  assert.equal(L.inHand(c.state), a.codes.length + 3);
});

test('cada aluno sorteia diferente (o check-in do dia não dá a mesma carta pra todos) e o sorteio é estável depois de aberto', () => {
  const id = L.checkinId('2026-11-06'); const vistos = new Set();
  for (let i = 0; i < 60; i++) { const s = L.grantPack(L.emptyState(), id); const r = L.openPack(s, cat, id); vistos.add(r.codes.join(',')); assert.ok(r.state.seed); assert.deepEqual(L.openPack(r.state, cat, id).codes, r.codes); }
  assert.ok(vistos.size > 20, `só ${vistos.size} resultados diferentes em 60 alunos`);
});
