// Páginas A4 pra imprimir e colorir (2480×3508), a partir dos traços de scripts/paul-traco.py.
// Uso: NODE_PATH=$(npm root -g) node scripts/paul-colorir-paginas.mjs PASTA_SAIDA [modelo: 1, 2 ou 3] [nome ...]
// Modelos: 1 = traço puro · 2 = traço + guia de cores (Paul colorido pequeno e paleta) · 3 = folha de atividade (título, nome e sombra cinza clarinha)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const [OUT, MODELO, ...NOMES] = process.argv.slice(2);
const P = 'assets/originals/paul-png';
const nomes = NOMES.length ? NOMES : fs.readdirSync(path.join(ROOT, P, 'pra-colorir/traco')).map((f) => f.slice(5, -4));
const CORES = [['#c8202f', 'vermelho'], ['#1d3c8f', 'azul'], ['#f2b632', 'amarelo'], ['#f4ead8', 'creme'], ['#3a3a40', 'cinza'], ['#c98a3c', 'madeira']];
const base = `@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}body{width:1240px;height:1754px;background:#fff;position:relative;overflow:hidden;font-family:Gochi,cursive;color:#111}
.d{position:absolute;display:flex;align-items:center;justify-content:center}.d img{max-width:100%;max-height:100%}
.pe{position:absolute;left:70px;right:70px;bottom:44px;display:flex;justify-content:space-between;align-items:flex-end;font-size:34px}
.pe b{font:400 40px Gochi;-webkit-text-stroke:1px #111}`;
const pe = `<div class="pe"><b>beaterista</b><span>jogos.beaterista.com.br</span></div>`;
const html = (m, n) => m === '1'
  ? `<style>${base}</style><div class="d" style="inset:70px 60px 130px"><img src="${u(`${P}/pra-colorir/traco/paul-${n}.png`)}"></div>${pe}`
  : m === '2'
    ? `<style>${base}.t{position:absolute;left:70px;top:56px;font:400 78px/1 Marker;transform:rotate(-2deg)}.ref{position:absolute;right:60px;top:40px;width:270px;text-align:center;font-size:30px;border:4px dashed #111;border-radius:26px;padding:14px}.ref img{width:100%}
.pal{position:absolute;left:70px;right:70px;bottom:120px;display:flex;justify-content:space-between}.pal div{text-align:center;font-size:30px}.pal i{display:block;width:120px;height:120px;border-radius:50%;border:5px solid #111;margin:0 auto 6px}</style>
<div class="t">pinte o Paul!</div><div class="ref"><img src="${u(`${P}/coloridos-hd/paul-${n}.png`)}">as cores do Paul<br>(ou invente as suas!)</div>
<div class="d" style="inset:330px 60px 330px"><img src="${u(`${P}/pra-colorir/traco/paul-${n}.png`)}"></div>
<div class="pal">${CORES.map(([c, t]) => `<div><i style="background:${c}"></i>${t}</div>`).join('')}</div>${pe}`
    : `<style>${base}.q{position:absolute;inset:36px;border:7px solid #111;border-radius:40px}.t{position:absolute;left:0;right:0;top:84px;text-align:center;font:400 96px/1 Marker}.s{position:absolute;left:0;right:0;top:196px;text-align:center;font-size:44px}
.nome{position:absolute;left:100px;right:100px;bottom:150px;font-size:42px;display:flex;gap:30px}.nome span{flex:1;border-bottom:4px solid #111}.nome span+b+span{flex:.4}.nome b{font-weight:400}.pe{bottom:70px;left:100px;right:100px}</style>
<div class="q"></div><div class="t">pinte o Paul!</div><div class="s">use as cores que você quiser e deixe o Paul do seu jeito</div>
<div class="d" style="inset:290px 90px 250px"><img src="${u(`${P}/pra-colorir/sombra/paul-${n}.png`)}"></div>
<div class="nome"><b>nome:</b><span></span><b>data:</b><span></span></div>${pe}`;
fs.mkdirSync(OUT, { recursive: true });
const tmp = path.join(OUT, '.tmp.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 2 });
for (const m of (MODELO && MODELO !== 'todos' ? [MODELO] : ['1', '2', '3'])) for (const n of nomes) {
  fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8">${html(m, n)}`);
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `colorir-modelo${m}-paul-${n}.png`) }); console.log('ok', m, n);
}
fs.rmSync(tmp); await browser.close();
