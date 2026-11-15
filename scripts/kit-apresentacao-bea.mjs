// Opções do post "oi, eu sou a bea!" (1080×1350) nas cores da marca (azul, vinho, creme; a Bea não quer verde) com as fotos do ensaio (marketing/fotos-bea/).
// Uso: NODE_PATH=$(npm root -g) node scripts/kit-apresentacao-bea.mjs  -> marketing/prontos/apresentacao/opcoes-bea/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = path.join(ROOT, 'marketing/prontos/apresentacao/opcoes-bea'); fs.mkdirSync(OUT, { recursive: true });
const CORES = { azul: ['#0d1a36', '#f4ead8', '#f2b632', '#a8182e'], vinho: ['#a8182e', '#f4ead8', '#f2b632', '#10234a'], creme: ['#f4ead8', '#10234a', '#a8182e', '#10234a'] }; // fundo, texto, destaque, etiqueta 2
const arte = (foto, pos, [VERDE, CREME, AMARELO, ET2]) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;background:${VERDE};color:${CREME};position:relative;overflow:hidden}
.p{position:absolute;inset:0;background:radial-gradient(${CREME}1c 2px,transparent 2.6px) 0 0/30px 30px}
.f{position:absolute;right:54px;top:230px;width:520px;height:800px;background:#fff;border-radius:16px;box-shadow:12px 14px 0 rgba(0,0,0,.35);padding:12px;transform:rotate(3deg)}
.f img{width:100%;height:100%;object-fit:cover;object-position:${pos};display:block;border-radius:8px}
h1{position:absolute;left:60px;top:70px;font:400 100px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0}h1 em{font-style:normal;display:block;color:${AMARELO};padding-left:44px}
.li{position:absolute;font:400 46px/1.1 Gochi,cursive;padding:8px 22px 14px;border-radius:16px}
.s{position:absolute;font:400 44px/1.14 Gochi,cursive}
.c{position:absolute;right:20px;bottom:14px;height:250px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.3))}</style><div class="p"></div>
<h1>oi, eu sou<em>a bea!</em></h1>
<div class="f"><img src="${u('marketing/fotos-bea/' + foto + '.jpg')}"></div>
<div class="li" style="left:50px;top:400px;background:${CREME};color:${VERDE};transform:rotate(-2deg)">professora de bateria</div>
<div class="li" style="left:70px;top:500px;background:${ET2 === VERDE ? AMARELO : ET2};color:#f4ead8;transform:rotate(1.5deg)">fundadora da Beaterista</div>
<div class="s" style="left:60px;top:650px;width:420px">quando um aluno trava, eu penso: como transformar isso num desafio que ele queira tentar de novo?</div>
<div class="s" style="left:60px;top:1120px;font-size:58px;color:${AMARELO};transform:rotate(-2deg)">foi assim que<br>nasceram os jogos.</div>
<img class="c" src="${u('assets/originals/paul-png/coloridos-hd/paul-bateria.png')}">`;
const FOTOS = { baquetas: ['bea-baquetas-rindo', '50% 15%'], sorriso: ['bea-casaco-close', '50% 25%'] };
const OPC = {}; let n = 0; for (const [fn, fv] of Object.entries(FOTOS)) for (const cor of Object.keys(CORES)) OPC[`${++n}-${fn}-${cor}`] = [...fv, CORES[cor]];
const browser = await chromium.launch();
for (const [nome, [foto, pos, cores]] of Object.entries(OPC)) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } }); const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, arte(foto, pos, cores));
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `bea-${nome}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); console.log('ok', nome);
}
await browser.close();
