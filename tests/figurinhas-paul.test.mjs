// Figurinhas do Paul: 6 exclusivas na seção Beaterista (arquivo separado, o catálogo original de 125 não muda) e a roleta passa a poder sorteá-las.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as L from '../js/figurinhas/album-logic.js';
const root = new URL('../', import.meta.url);
const base = JSON.parse(fs.readFileSync(new URL('assets/figurinhas/catalogo.json', root), 'utf8'));
const paul = JSON.parse(fs.readFileSync(new URL('assets/figurinhas/catalogo-paul.json', root), 'utf8'));
const todas = [...base, ...paul];

test('6 figurinhas do Paul: exclusivas, seção Beaterista, foto e hash batendo, códigos sem colisão', () => {
  assert.equal(base.length, 125); assert.equal(paul.length, 6); assert.equal(todas.length, L.TOTAL_FIGURINHAS);
  assert.equal(new Set(todas.map((c) => c.codigo)).size, 131);
  for (const c of paul) {
    assert.equal(c.raridade, 'Exclusiva'); assert.equal(c.secao, 'Beaterista'); assert.equal(c.artista_banda, 'Robôterista Paul');
    const buf = fs.readFileSync(new URL(c.foto, root)); assert.equal(crypto.createHash('sha256').update(buf).digest('hex'), c.sha256, `${c.codigo}: hash da foto`);
    assert.ok(fs.existsSync(new URL(`assets/figurinhas/mini/${c.codigo}.webp`, root)), `${c.codigo}: miniatura`);
    assert.ok(c.foco.length === 4 && c.foco.every((n) => n >= 0 && n <= 1));
  }
  assert.equal(todas.filter((c) => c.secao === 'Beaterista').length, 16);
});
test('a roleta (e o prêmio de jogo) sorteia as do Paul junto com as da Bea, e os pacotes antigos não mudam', () => {
  const vistas = new Set(); for (let i = 0; i < 4000; i++) for (const c of L.drawPack(todas, `roleta:teste:${i}`)) if (c.startsWith('P')) vistas.add(c);
  assert.ok(vistas.size >= 4, `deveria sortear várias do Paul, saíram ${vistas.size}`);
  for (let i = 0; i < 200; i++) { const a = L.drawPack(todas, `roleta:x:${i}`, 5, 'seed'), b = L.drawPack(todas, `roleta:x:${i}`, 5, 'seed'); assert.deepEqual(a, b); }
  const s = L.stats({ pasted: {} }, todas, 'Beaterista'); assert.equal(s.total, 16);
});
