// Os 12 temas do Paul (desenho ORIGINAL, sem a fita "semana") dentro de um story maior: o desenho aparece menor, perto do tamanho em que nasceu, e a qualidade deixa de aparecer ruim.
// 3 opções de moldura (pra Bea escolher). Uso: node scripts/temas-moldura.mjs [opção]  -> marketing/prontos/stories-temas-moldura/<opção>/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href, F = (n) => u(`assets/fonts/${n}`);
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', OU = '#d8b879';
const css = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;position:relative;overflow:hidden}`;
const assin = `<div style="display:inline-flex;align-items:center;gap:16px;background:${AZ};color:${CR};padding:8px 30px 8px 8px;border-radius:99px;font:800 30px/1.15 Hanken,sans-serif;box-shadow:6px 6px 0 ${OU}"><img src="${u('assets/originals/logo-beaterista-dourado.png')}" style="height:84px"><span>Beaterista<br><span style="font-weight:500;font-size:25px">educação musical com propósito</span></span></div>`;
const R = { estrela: 'M0-30 L8-9 L31-8 L13 6 L20 29 L0 15 L-19 30 L-12 6 L-31-9 L-8-9 Z', coroa: 'M-40 26 L-48 -26 L-18 2 L0 -36 L18 2 L48 -26 L40 26 Z', raio: 'M10-40 L-18 6 L2 6 L-10 42 L22-8 L2-8 Z', coracao: 'M0 28 C-44 -6 -22 -40 0 -14 C22 -40 44 -6 0 28 Z', zig: 'M-40 -14 L-14 6 L-22 -18 L10 6 L0 -18 L40 8' };
const rab = (pts, cores) => `<svg viewBox="0 0 1080 1920" style="position:absolute;inset:0">${pts.map(([x, y, k, r], i) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(1.3)" d="${R[k]}" fill="none" stroke="${cores[i % cores.length]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
const PTS = [[110, 330, 'coroa', -12], [960, 300, 'estrela', 10], [80, 860, 'raio', -8], [1000, 900, 'coracao', 12], [100, 1420, 'estrela', -14], [990, 1400, 'zig', 6]];
const OPC = {
  // 1: polaroid inclinada num fundo azul com textura e rabiscos
  'polaroid': (img, tit) => `<style>${css}body{background:${AZ}}.tx{position:absolute;inset:0;background:radial-gradient(${CR}20 2px,transparent 2.6px) 0 0/30px 30px}
.po{position:absolute;left:245px;top:290px;width:590px;background:#fff;padding:20px 20px 104px;transform:rotate(-3deg);box-shadow:16px 20px 0 rgba(0,0,0,.4)}.po img{width:100%;display:block}
.po b{position:absolute;left:0;right:0;bottom:24px;text-align:center;font:400 50px Gochi,cursive;color:${AZ}}
.fita{position:absolute;left:430px;top:254px;width:230px;height:64px;background:${OU}cc;transform:rotate(4deg)}.as{position:absolute;left:0;right:0;bottom:330px;display:flex;justify-content:center}</style>
<div class="tx"></div>${rab(PTS, [OU, CR, VI])}<div class="po"><img src="${img}"><b>${tit}</b></div><div class="fita"></div><div class="as">${assin}</div>`,
  // 2: quadro reto com moldura dourada, fundo vinho, faixa de título em cima
  'quadro': (img, tit) => `<style>${css}body{background:${VI}}.tx{position:absolute;inset:0;background:radial-gradient(${CR}22 2px,transparent 2.6px) 0 0/30px 30px}
h1{position:absolute;left:0;right:0;top:250px;text-align:center;font:400 84px/1 Marker,cursive;color:${CR};transform:rotate(-2deg)}
.q{position:absolute;left:255px;top:390px;width:570px;border:14px solid ${OU};border-radius:26px;overflow:hidden;box-shadow:14px 16px 0 ${AZ}}.q img{width:100%;display:block}
.as{position:absolute;left:0;right:0;bottom:330px;display:flex;justify-content:center}</style>
<div class="tx"></div>${rab(PTS, [OU, CR, AZ])}<h1>${tit}</h1><div class="q"><img src="${img}"></div><div class="as">${assin}</div>`,
  // 3: caderno: folha presa com fita num fundo creme pautado
  'caderno': (img, tit) => `<style>${css}body{background:${CR}}.pt{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 62px,${AZ}18 62px 64px)}
.mg{position:absolute;left:120px;top:0;bottom:0;width:4px;background:${VI}55}
.fo{position:absolute;left:260px;top:290px;width:560px;transform:rotate(2.5deg);box-shadow:14px 18px 0 rgba(13,26,54,.25);border:5px solid ${AZ}}.fo img{width:100%;display:block}
.f1,.f2{position:absolute;width:190px;height:58px;background:${OU}cc}.f1{left:200px;top:280px;transform:rotate(-38deg)}.f2{left:710px;top:1260px;transform:rotate(-38deg)}
.et{position:absolute;left:150px;top:1350px;font:400 58px Gochi,cursive;background:${AZ};color:${CR};padding:8px 32px 14px;border-radius:20px;transform:rotate(-3deg);box-shadow:8px 8px 0 ${VI}}
.as{position:absolute;left:0;right:0;bottom:330px;display:flex;justify-content:center}</style>
<div class="pt"></div><div class="mg"></div>${rab(PTS.filter((_, i) => i % 2), [VI, AZ])}<div class="fo"><img src="${img}"></div><div class="f1"></div><div class="f2"></div><div class="et">${tit}</div><div class="as">${assin}</div>`,
};
const TIT = ['apresentação', 'rotina e treino', 'figuras e tempo', 'cantar e ouvir', 'tocar em banda', 'estudo em casa', 'resultados', 'diversão', 'natal', 'férias', 'volta às aulas', 'sonhos'];
const SRC = path.join(ROOT, 'marketing/prontos/stories-temas-original'), so = process.argv[2];
const browser = await chromium.launch(); let n = 0;
for (const [op, fn] of Object.entries(OPC)) { if (so && so !== op) continue; const OUT = path.join(ROOT, 'marketing/prontos/stories-temas-moldura', op); fs.mkdirSync(OUT, { recursive: true });
  for (const [i, f] of fs.readdirSync(SRC).filter((x) => x.endsWith('.jpg')).sort().entries()) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, '<!doctype html><meta charset="utf-8">' + fn(pathToFileURL(path.join(SRC, f)).href, TIT[i]));
    await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); n++; } }
await browser.close(); console.log(n, 'imagens');
