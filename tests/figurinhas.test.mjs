// Figurinhas: catálogo íntegro (125 fotos, hashes, raridades da usuária) e lógica do álbum idempotente.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import crypto from 'node:crypto';
import * as L from '../js/figurinhas/album-logic.js';
const root = new URL('../', import.meta.url);
const cat = JSON.parse(fs.readFileSync(new URL('assets/figurinhas/catalogo.json', root), 'utf8'));
const count = (k) => cat.reduce((m, c) => ({ ...m, [c[k]]: (m[c[k]] || 0) + 1 }), {});

test('125 registros únicos, cada um com sua foto original intacta (SHA256)', () => {
  assert.equal(cat.length, 125); assert.equal(new Set(cat.map((c) => c.codigo)).size, 125); assert.equal(new Set(cat.map((c) => c.foto)).size, 125);
  for (const c of cat) { const b = fs.readFileSync(new URL(c.foto, root)); assert.equal(crypto.createHash('sha256').update(b).digest('hex'), c.sha256, c.codigo); assert.ok(c.artista_banda, c.codigo); }
});
test('distribuição de coleções e raridades fechadas', () => {
  assert.deepEqual(count('colecao'), { Geral: 91, Beatles: 22, Beaterista: 10, Especial: 2 });
  assert.deepEqual(count('raridade'), { Comum: 101, Rara: 14, Exclusiva: 10 });
  assert.equal(cat.find((c) => c.codigo === 'F102').artista_banda, 'Jimi Hendrix');
});
test('raridades conforme a decisão da usuária', () => {
  const ids = (r) => cat.filter((c) => c.raridade === r).map((c) => c.codigo).sort().join();
  assert.equal(ids('Exclusiva'), 'F001,F004,F005,F010,F011,F012,F015,F129,F131,F132');
  assert.equal(ids('Rara'), 'F016,F018,F020,F022,F025,F044,F047,F052,F087,F093,F107,F108,F112,F124');
  for (const c of cat.filter((c) => c.colecao === 'Beaterista')) assert.equal(c.raridade, 'Exclusiva');
  for (const c of cat.filter((c) => /Justin/.test(c.artista_banda))) assert.equal(c.raridade, 'Rara', c.codigo);
  assert.equal(cat.find((c) => c.codigo === 'F053').raridade, 'Comum');
});
test('modelo combina com a raridade (C=Comum, R=Rara, E=Exclusiva)', () => {
  for (const c of cat) assert.equal({ C: 'Comum', R: 'Rara', E: 'Exclusiva' }[c.modelo[0]], c.raridade, c.codigo);
});
test('pacote: mesmo id = mesmas figurinhas, entrega e abertura só uma vez', () => {
  assert.deepEqual(L.drawPack(cat, 'daily:2026-11-05'), L.drawPack(cat, 'daily:2026-11-05'));
  let s = L.grantPack(L.emptyState(), 'daily:2026-11-05'); s = L.grantPack(s, 'daily:2026-11-05');
  assert.equal(L.pendingPacks(s).length, 1);
  const a = L.openPack(s, cat, 'daily:2026-11-05'); assert.equal(a.fresh, true); assert.equal(a.codes.length, L.PACK_SIZE);
  const b = L.openPack(a.state, cat, 'daily:2026-11-05'); assert.equal(b.fresh, false); assert.deepEqual(b.state, a.state);
  assert.equal(L.inHand(a.state), L.PACK_SIZE);
  assert.equal(L.pendingPacks(L.grantPack(a.state, 'daily:2026-11-05')).length, 0, 'pacote já aberto não volta');
});
test('colar: uma por espaço, repetida fica na mão', () => {
  let s = L.grantPack(L.emptyState(), 'p'); s = L.openPack(s, cat, 'p').state;
  const code = Object.keys(s.inv)[0];
  s = L.paste(s, code); assert.ok(s.pasted[code]); assert.equal(L.paste(s, code), s);
  s = L.pasteAll(s); assert.equal(Object.keys(s.pasted).length, new Set(L.drawPack(cat, 'p')).size);
  assert.equal(L.stats(s, cat).got, Object.keys(s.pasted).length);
});
test('raridade das figurinhas sorteadas respeita o catálogo (não existem códigos inventados)', () => {
  const codes = new Set(cat.map((c) => c.codigo));
  for (let i = 0; i < 300; i++) for (const c of L.drawPack(cat, `t${i}`)) assert.ok(codes.has(c));
});
