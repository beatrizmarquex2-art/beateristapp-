import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// simula um iPhone antigo: sem randomUUID, sem .at, sem findLast, sem hasOwn, sem structuredClone
const prog = `
const rv = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues: rv }, configurable: true });
delete Array.prototype.at; delete String.prototype.at; delete Array.prototype.findLast; delete Array.prototype.findLastIndex; delete Object.hasOwn; delete globalThis.structuredClone;
if (typeof crypto.randomUUID === 'function' || [].at) throw new Error('simulação não removeu');
await import('${raiz}/js/polyfills.js');
const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(crypto.randomUUID()) && crypto.randomUUID() !== crypto.randomUUID()
  && [1, 2, 3].at(-1) === 3 && 'abc'.at(-1) === 'c' && [1, 2, 3, 4].findLast((x) => x % 2 === 1) === 3 && [1, 2, 3].findLastIndex((x) => x === 9) === -1
  && Object.hasOwn({ a: 1 }, 'a') && !Object.hasOwn({}, 'a') && 'a-b-c'.replaceAll('-', '+') === 'a+b+c' && structuredClone({ a: [1, { b: 2 }] }).a[1].b === 2;
console.log(ok ? 'OK' : 'FALHOU');`;
test('com os polyfills, um iPhone antigo (sem randomUUID, .at, findLast, hasOwn, structuredClone) funciona', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', prog], { encoding: 'utf8' });
  assert.equal(r.stdout.trim(), 'OK', r.stderr);
});
test('aluno.js e app.js importam os polyfills ANTES de qualquer outro módulo', async () => {
  const { readFileSync } = await import('node:fs');
  for (const f of ['js/aluno.js', 'js/app.js']) { const l = readFileSync(`${raiz}/${f}`, 'utf8').split('\n').find((x) => x.startsWith('import ')); assert.match(l, /polyfills\.js/, f); }
});
