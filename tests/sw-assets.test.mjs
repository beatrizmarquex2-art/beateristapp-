// O cache offline só funciona se todo arquivo listado existe (um 404 derrubaria a instalação) e se as artes dos jogos estão listadas.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const list = (name) => [...sw.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`))[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const root = new URL('../', import.meta.url);
test('todo arquivo de SHELL e EXTRA existe', () => {
  const miss = [...list('SHELL'), ...list('EXTRA')].filter((f) => f !== './' && !fs.existsSync(new URL(f, root)));
  assert.deepEqual(miss, []);
});
test('ícones e artes dos jogos estão no cache offline', () => {
  const all = new Set([...list('SHELL'), ...list('EXTRA')]);
  for (const f of ['assets/jogos/icones/domino.webp', 'assets/mural/tape.svg', 'assets/mural/brush-gold.svg', 'assets/memoria/rock/verso.webp', 'assets/zine/fita-1.webp', 'assets/paul/e20.webp', 'js/jogos/ouvir.js', 'js/dragsort.js']) assert.ok(all.has(f), f);
});
