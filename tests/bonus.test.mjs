// Bônus escondidos (segredos, vitórias online seguidas, giro épico, prêmio de jogo só de bandas e artistas).
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import * as L from '../js/figurinhas/album-logic.js';
const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../assets/figurinhas/${f}`, import.meta.url)));
const cat = [...rd('catalogo.json'), ...rd('catalogo-paul.json'), ...rd('catalogo-bea.json')]; const por = Object.fromEntries(cat.map((c) => [c.codigo, c]));
test('segredo e bônus online dão 1 exclusiva (Beaterista e Paul)', () => {
  for (const id of ['egg:paradiddle', 'egg:rudimentix', 'egg:paulbox', 'bonus:2026-11:1', 'bonus:2026-11:3']) { const d = L.drawPack(cat, id); assert.equal(d.length, 1, id); assert.equal(L.grupo(por[d[0]]), 'Beaterista', id); assert.equal(L.packSize(id), 1); }
  assert.ok(L.motivoDoPacote('egg:paulbox').includes('segredo')); assert.ok(L.motivoDoPacote('bonus:2026-11:1').includes('5 vitórias'));
});
test('giro épico: 1º dá sempre 3 (clássica + exclusiva + rara); 2º dá de 1 a 5, prioriza comuns e raras e, se for 1, é exclusiva', () => {
  let um = 0; const g2 = {};
  for (let i = 0; i < 1500; i++) { const a = L.drawPack(cat, `epico:r${i}:1`); assert.deepEqual(a.map((c) => L.grupo(por[c])).sort(), ['Beaterista', 'Beatlemania', 'Raras']); for (const c of L.drawPack(cat, `epico:r${i}:2`)) g2[L.grupo(por[c])] = (g2[L.grupo(por[c])] || 0) + 1; const d = L.drawPack(cat, `epico:r${i}:2`); assert.ok(d.length >= 1 && d.length <= 5); if (d.length === 1) { um++; assert.equal(L.grupo(por[d[0]]), 'Beaterista'); } }
  assert.ok(um > 0); assert.ok(g2.Comum > g2.Beatlemania && g2.Raras > g2.Beatlemania && g2.Comum + g2.Raras > (g2.Beatlemania || 0) * 5, JSON.stringify(g2));
  assert.equal(L.packKind('epico:x:1'), 'epico'); assert.equal(L.epicoPack('epico:x:2').n, 2); assert.equal(L.epicoPack('roleta:x'), null);
});
test('prêmio de jogo só dá cartas de bandas e artistas (comum e rara), com 1 rara garantida', () => {
  for (let i = 0; i < 800; i++) { const d = L.drawPack(cat, `jogo:t:${i}`); assert.equal(d.length, 3); assert.ok(d.every((c) => ['Comum', 'Raras'].includes(L.grupo(por[c]))), d.join()); assert.ok(d.some((c) => por[c].raridade === 'Rara')); }
});
