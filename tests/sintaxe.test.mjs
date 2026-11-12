// Pega erro de sintaxe em qualquer arquivo do app (um comentário "//" no meio de uma linha, por exemplo, pode engolir código e só estourar no navegador).
import test from 'node:test'; import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
test('todos os .js do app (js/ e assets/rhythm-games) têm sintaxe válida', () => {
  const files = [...walk(path.join(root, 'js')), path.join(root, 'assets/rhythm-games/rhythm-games.js')]; const ruins = [];
  for (const f of files) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { ruins.push(`${path.relative(root, f)}: ${String(e.stderr || e.message).split('\n').slice(0, 3).join(' ')}`); } }
  assert.deepEqual(ruins, [], ruins.join('\n'));
});
