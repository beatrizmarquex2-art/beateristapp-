// Endereço do site: UM lugar (js/site.js). Nenhum outro arquivo do app escreve o endereço direto, e o script de troca funciona nos dois sentidos.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import * as S from '../js/site.js';
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('hoje o escrito e os links são jogos.beaterista.com.br (o domínio de verdade não muda)', () => {
  assert.equal(S.SITE_TEXTO, 'jogos.beaterista.com.br'); assert.equal(S.SITE_DOMINIO, 'jogos.beaterista.com.br'); assert.equal(S.SITE_URL, 'https://jogos.beaterista.com.br');
  assert.equal(S.ENDERECOS.play, 'play.beaterista.com.br');
});
test('nenhum arquivo do app escreve o endereço direto no código (só js/site.js)', () => {
  const ach = (d) => fs.readdirSync(path.join(raiz, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? ach(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
  const sujos = [];
  for (const f of ach('js')) { if (f === 'js/site.js') continue; fs.readFileSync(path.join(raiz, f), 'utf8').split('\n').forEach((l, i) => { if (/jogos\.beaterista\.com\.br/.test(l) && !l.trimStart().startsWith('//') && !/\s\/\/.*jogos\.beaterista/.test(l)) sujos.push(`${f}:${i + 1}`); }); }
  assert.deepEqual(sujos, []);
});
test('o CSS da marca nos cartões lê o endereço de uma variável (com o endereço de hoje como reserva)', () => {
  const css = fs.readFileSync(path.join(raiz, 'css/lote3.css'), 'utf8'); assert.ok(css.includes('content: var(--site-texto, "jogos.beaterista.com.br")'));
});
test('o script troca o escrito pra play e volta, sobe a versão do sw e só mexe nos links com --links', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-')); fs.mkdirSync(path.join(tmp, 'js'));
  fs.copyFileSync(path.join(raiz, 'js/site.js'), path.join(tmp, 'js/site.js')); fs.writeFileSync(path.join(tmp, 'sw.js'), "const VERSION = 'beaterista-v10';\n");
  const roda = (...a) => execFileSync('node', [path.join(raiz, 'scripts/trocar-endereco.mjs'), ...a, '--dir', tmp], { encoding: 'utf8' });
  const site = () => fs.readFileSync(path.join(tmp, 'js/site.js'), 'utf8');
  roda('play'); assert.match(site(), /ESCRITO = 'play'/); assert.match(site(), /LINKS = 'jogos'/); assert.match(fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8'), /v11/);
  roda('play', '--links'); assert.match(site(), /LINKS = 'play'/);
  roda('jogos', '--links'); assert.match(site(), /ESCRITO = 'jogos'/); assert.match(site(), /LINKS = 'jogos'/); assert.match(fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8'), /v13/);
  assert.throws(() => execFileSync('node', [path.join(raiz, 'scripts/trocar-endereco.mjs'), '--dir', tmp], { stdio: 'pipe' }));
  fs.rmSync(tmp, { recursive: true });
});
