// Memória: categorias de artistas (The Beatles, Bandas, Solo) com as fotos do catálogo. Cada uma precisa de pelo menos 12 pares.
import fs from 'node:fs'; import assert from 'node:assert/strict';
import { buildPhotoThemes } from '../js/kids/memory-photos.js';
const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url)));
const T = buildPhotoThemes(cat); const by = Object.fromEntries(T.map((t) => [t.id, t]));
assert.deepEqual(T.map((t) => t.id), ['beatles', 'bandas', 'solo'], 'três categorias, nessa ordem');
for (const t of T) {
  assert.ok(t.items.length >= 12, `${t.id}: ${t.items.length} itens (precisa de 12 pra 12 pares)`);
  assert.equal(new Set(t.items.map((x) => x.id)).size, t.items.length, `${t.id}: ids repetidos`);
  assert.equal(new Set(t.items.map((x) => x.img)).size, t.items.length, `${t.id}: fotos repetidas`);
  assert.ok(t.items.every((x) => /^assets\/figurinhas\/mini\/F\d+\.webp$/.test(x.img) && fs.existsSync(new URL('../' + x.img, import.meta.url))), `${t.id}: foto ausente`);
  assert.equal(t.cover.length, 3); assert.equal(t.open, t.id === 'beatles', 'só The Beatles fica aberto');
}
assert.equal(by.beatles.items.length, cat.filter((c) => c.colecao === 'Beatles').length, 'Beatles = toda a coleção Beatles');
const nomes = (t) => t.items.map((x) => x.name);
assert.ok(!nomes(by.bandas).includes('The Beatles') && !nomes(by.solo).includes('Beaterista'), 'Beatles e Beaterista ficam fora de Bandas e Solo');
console.log(`ok · Beatles ${by.beatles.items.length} · Bandas ${by.bandas.items.length} · Solo ${by.solo.items.length}`);
