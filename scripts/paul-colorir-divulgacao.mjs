// Artes de divulgação do livro "Robôterista Paul para colorir": 2 posts (1080×1350) e 2 stories (1080×1920).
// Uso: NODE_PATH=$(npm root -g) node scripts/paul-colorir-divulgacao.mjs  -> marketing/prontos/colorir/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const P = 'assets/originals/paul-png/pra-colorir';
const pg = (n) => u(`${P}/paginas/colorir-paul-${n}.png`), ex = (n) => u(`${P}/extras/colorir-${n}.png`);
const hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const OUT = path.join(ROOT, 'marketing/prontos/colorir'); fs.mkdirSync(OUT, { recursive: true });
const N = 50;
const base = (w, h, bg, cor) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;background:${bg};color:${cor};position:relative;overflow:hidden;font-family:Hanken,sans-serif}
.p{position:absolute;inset:0;background:radial-gradient(${cor}22 2px,transparent 2.6px) 0 0/30px 30px}
.lg{position:absolute}.f{position:absolute;background:#fff;border-radius:14px;box-shadow:10px 12px 0 rgba(0,0,0,.25);padding:10px}.f img{width:100%;display:block}
h1{position:absolute;font:400 92px/1 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0}h1 em{font-style:normal;display:block}
.s{position:absolute;font:400 50px/1.1 Gochi,cursive}.b{position:absolute;font:700 32px/1 Hanken;padding:18px 30px;border-radius:999px}.c{position:absolute;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.22))}</style><div class="p"></div>`;
const logo = u('assets/originals/logo-roboterista-paul.png');
const ARTES = {
  'post-1-novidade': [1080, 1350, base(1080, 1350, '#f4ead8', '#10234a') + `<img class="lg" src="${logo}" style="left:60px;top:50px;height:230px">
<div class="s" style="left:74px;top:290px;background:#a8182e;color:#f4ead8;padding:4px 28px 12px;border-radius:18px;transform:rotate(-3deg);font-size:62px">para colorir</div>
<div class="f" style="left:430px;top:330px;width:360px;transform:rotate(-7deg)"><img src="${pg('guitarra')}"></div>
<div class="f" style="left:650px;top:400px;width:380px;transform:rotate(6deg)"><img src="${pg('bateria')}"></div>
<img class="c" src="${hd('colorindo')}" style="left:10px;top:560px;width:520px">
<div class="s" style="left:70px;bottom:150px">${N} páginas A4 pra imprimir<br>e pintar do seu jeito</div>
<div class="b" style="left:70px;bottom:54px;background:#10234a;color:#f4ead8">na Lojinha · jogos.beaterista.com.br</div>`],
  'post-2-o-que-tem': [1080, 1350, base(1080, 1350, '#0d1a36', '#f4ead8') + `<h1 style="left:64px;top:70px">o que tem<em style="color:#f2b632;padding-left:40px">no livro?</em></h1>
${[['bateria', 70, 300, -4], ['a', 400, 285, 3], ['sax', 730, 305, -3], ['b', 70, 720, 4], ['selfie', 400, 710, -3], ['c', 730, 725, 4]].map(([n, x, y, r]) => `<div class="f" style="left:${x}px;top:${y}px;width:270px;transform:rotate(${r}deg)"><img src="${n === 'a' ? ex('a-banda-do-paul') : n === 'b' ? ex('familia-percussao') : n === 'c' ? ex('voce-na-banda') : pg(n)}"></div>`).join('')}
<div class="s" style="left:64px;bottom:60px;font-size:44px">25 Pauls, a banda, as famílias<br>dos instrumentos e mais</div>
<div class="b" style="right:54px;bottom:66px;background:#f2b632;color:#0d1a36">Robôterista Paul para colorir</div>`],
  'story-1-novidade': [1080, 1920, base(1080, 1920, '#a8182e', '#f4ead8') + `<div class="s" style="left:0;right:0;top:150px;text-align:center;font-size:70px">novidade na Lojinha!</div>
<div class="f" style="left:150px;top:300px;width:780px;padding:40px 40px 30px;border-radius:26px;transform:rotate(-2deg)"><img src="${u(`${P}/capas/capa-colorida-quadrada.jpg`)}" style="border-radius:14px"></div>
<div class="s" style="left:0;right:0;top:1180px;text-align:center;font-size:62px">${N} páginas pra imprimir<br>e pintar do seu jeito</div>
<img class="c" src="${hd('colorindo')}" style="left:250px;top:1340px;width:560px">`],
  'story-2-pinte': [1080, 1920, base(1080, 1920, '#f4ead8', '#10234a') + `<h1 style="left:80px;top:170px;font-size:120px">pinte<em style="color:#a8182e;padding-left:50px">o Paul!</em></h1>
<div class="f" style="left:110px;top:520px;width:560px;transform:rotate(-5deg)"><img src="${pg('oculos')}"></div>
<div class="f" style="left:460px;top:760px;width:540px;transform:rotate(5deg)"><img src="${pg('microfone')}"></div>
<img class="c" src="${hd('oculos')}" style="left:40px;top:1260px;width:330px">
<div class="s" style="left:400px;top:1560px;font-size:58px">livro de colorir<br>Robôterista Paul</div>
<div class="b" style="left:400px;top:1720px;background:#10234a;color:#f4ead8">na Lojinha</div>`],
};
const browser = await chromium.launch(); const tmp = path.join(OUT, '.tmp.html');
for (const [nome, [w, h, html]] of Object.entries(ARTES)) {
  const page = await browser.newPage({ viewport: { width: w, height: h } }); fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, `colorir-${nome}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); console.log('ok', nome);
}
fs.rmSync(tmp); await browser.close();
