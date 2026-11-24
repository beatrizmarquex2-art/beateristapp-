// O service worker guarda o app pra uso offline com cache.addAll(SHELL). Um item REPETIDO na lista faz o addAll falhar (InvalidStateError)
// e a instalação inteira cai: o app nunca fica guardado. Aqui garantimos que a instalação usa a lista sem repetidos e que todo arquivo existe.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
const shell = [...(/const SHELL = \[([\s\S]*?)\n\];/.exec(sw)[1]).matchAll(/'([^']+)'/g)].map((m) => m[1]);
test('a instalação do service worker deduplica a lista (ou ela não tem repetidos)', () => {
  const dedup = /addAll\(\[\.\.\.new Set\(SHELL\)\]\)/.test(sw); const rep = shell.filter((x, i) => shell.indexOf(x) !== i);
  assert.ok(dedup || rep.length === 0, `itens repetidos no SHELL derrubam a instalação: ${rep.join(', ')}`);
});
test('todo arquivo do SHELL existe', () => {
  const falta = shell.filter((x) => x !== './' && !x.startsWith('http') && !fs.existsSync(path.join(raiz, x)));
  assert.deepEqual(falta, []);
});
