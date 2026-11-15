// 3 designs alternativos pro mesmo post (pra Bea escolher). Cores da marca, sem verde, Paul em todos.
// Uso: NODE_PATH=$(npm root -g) node scripts/kit-designs-teste.mjs PASTA_SAIDA
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = path.resolve(process.argv[2]); fs.mkdirSync(OUT, { recursive: true });
const F = (n) => u(`assets/fonts/${n}`), hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`), foto = (n) => path.isAbsolute(n) ? pathToFileURL(n).href : u(`marketing/fotos-bea/${n}.jpg`);
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', AM = '#f2b632';
const css = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}
@font-face{font-family:Anton;src:url(${F('Anton-latin.woff2')})}@font-face{font-family:Anton;src:url(${F('Anton-latin-ext.woff2')});unicode-range:U+0100-024F}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;position:relative;overflow:hidden}`;
const selo = u('assets/originals/logo_beaterista_original.png');
export const DESIGNS = {
  // A: foto ocupando tudo, título gigante por cima
  'A-foto-cheia': ({ f, pos, t1, t2, sub, paul }) => `<style>${css}
body{background:${AZ}}.ft{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${pos}}
.g{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,26,54,.0) 48%,rgba(13,26,54,.95) 80%)}
h1{position:absolute;left:60px;right:300px;bottom:200px;font:400 118px/.94 Anton,sans-serif;color:${CR};text-transform:uppercase;letter-spacing:.01em}h1 em{font-style:normal;color:${AM};display:block}
.s{position:absolute;left:64px;bottom:90px;right:320px;font:400 50px/1.1 Gochi,cursive;color:${CR}}
.c{position:absolute;right:10px;bottom:20px;height:340px;filter:drop-shadow(0 0 0 #fff) drop-shadow(8px 10px 0 rgba(0,0,0,.35))}
.tp{position:absolute;left:60px;top:56px;display:flex;align-items:center;gap:16px;font:800 30px Hanken,sans-serif;color:${CR};background:rgba(13,26,54,.75);padding:12px 26px 12px 12px;border-radius:99px}.tp img{height:64px}</style>
<img class="ft" src="${foto(f)}"><div class="g"></div><div class="tp"><img src="${selo}">jogos.beaterista.com.br</div>
<h1>${t1}<em>${t2}</em></h1><div class="s">${sub}</div><img class="c" src="${hd(paul)}">`,
  // B: polaroid com fita, papel creme, tudo "feito à mão"
  'B-polaroid': ({ f, pos, t1, t2, sub, paul }) => `<style>${css}
body{background:${CR};color:${AZ}}.p{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 58px,${AZ}14 58px 60px)}
.fx{position:absolute;left:0;right:0;top:0;height:300px;background:${VI}}
h1{position:absolute;left:60px;top:54px;font:400 104px/.95 Marker,cursive;color:${CR};transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;color:${AM};display:block;padding-left:50px}
.po{position:absolute;left:190px;top:330px;width:660px;background:#fff;padding:26px 26px 130px;transform:rotate(3deg);box-shadow:14px 18px 0 rgba(13,26,54,.22)}
.po img{width:100%;height:640px;object-fit:cover;object-position:${pos};display:block}.po b{position:absolute;left:0;right:0;bottom:30px;text-align:center;font:400 54px Gochi,cursive;color:${AZ}}
.tape{position:absolute;left:420px;top:300px;width:230px;height:66px;background:${AM}cc;transform:rotate(-5deg)}
.c{position:absolute;right:-6px;bottom:6px;height:300px;filter:drop-shadow(8px 10px 0 rgba(13,26,54,.25))}
.u{position:absolute;left:60px;bottom:60px;font:700 32px Hanken,sans-serif;background:${AZ};color:${CR};padding:16px 28px;border-radius:99px}</style>
<div class="p"></div><div class="fx"></div><h1>${t1}<em>${t2}</em></h1>
<div class="po"><img src="${foto(f)}"><b>${sub}</b></div><div class="tape"></div><img class="c" src="${hd(paul)}"><div class="u">jogos.beaterista.com.br</div>`,
  // C: quadrinho, o Paul fala no balão
  'C-gibi': ({ f, pos, t1, t2, sub, paul }) => `<style>${css}
body{background:${AM}}.p{position:absolute;inset:0;background:radial-gradient(${VI}55 5px,transparent 5.6px) 0 0/34px 34px}
.q{position:absolute;left:50px;right:50px;top:50px;height:820px;border:10px solid ${AZ};background:#fff;box-shadow:14px 14px 0 ${AZ};overflow:hidden}.q img{width:100%;height:100%;object-fit:cover;object-position:${pos}}
.tt{position:absolute;left:30px;top:90px;background:${VI};color:${CR};font:400 96px/.95 Anton,sans-serif;text-transform:uppercase;padding:14px 30px 18px;border:8px solid ${AZ};transform:rotate(-4deg);box-shadow:8px 8px 0 ${AZ}}.tt em{font-style:normal;color:${AM}}
.bl{position:absolute;left:60px;bottom:90px;width:620px;background:#fff;border:8px solid ${AZ};border-radius:60px;padding:34px 40px 40px;font:400 54px/1.12 Gochi,cursive;color:${AZ};box-shadow:8px 8px 0 ${AZ}}
.bl:after{content:'';position:absolute;right:-58px;bottom:70px;border:30px solid transparent;border-left:44px solid ${AZ}}.bl:before{content:'';position:absolute;right:-38px;bottom:78px;border:22px solid transparent;border-left:34px solid #fff;z-index:1}
.c{position:absolute;right:0;bottom:10px;height:470px;filter:drop-shadow(8px 10px 0 rgba(13,26,54,.3))}</style>
<div class="p"></div><div class="q"><img src="${foto(f)}"></div><div class="tt">${t1} <em>${t2}</em></div>
<div class="bl">${sub}</div><img class="c" src="${hd(paul)}">`,
};
const FA = process.env.FOTOS_ALUNOS || ''; const al = (n) => path.join(FA, n + '.jpg');
const EXS = [['A-foto-cheia', 'bea', { f: 'bea-camiseta-baquetas', pos: '70% 25%', t1: 'oi, eu sou', t2: 'a bea!', paul: 'bateria', sub: 'professora de bateria e fundadora da Beaterista' }],
  ['B-polaroid', 'bea', { f: 'bea-camiseta-baquetas', pos: '70% 25%', t1: 'oi, eu sou', t2: 'a bea!', paul: 'bateria', sub: 'professora e fundadora' }],
  ['C-gibi', 'bea', { f: 'bea-camiseta-baquetas', pos: '70% 25%', t1: 'oi, eu sou', t2: 'a bea!', paul: 'bateria', sub: 'essa é a Bea! professora de bateria e fundadora da Beaterista.' }],
  ...(FA ? [['A-foto-cheia', 'aluno', { f: al('rockstar'), pos: '25% 30%', t1: 'olhar de', t2: 'rockstar', paul: 'oculos', sub: 'tem foto que parece capa de disco' }],
    ['B-polaroid', 'aluno', { f: al('cajon-dela'), pos: '55% 45%', t1: 'o cajón', t2: 'é dela', paul: 'cajon', sub: 'percussão no palco' }],
    ['C-gibi', 'aluno', { f: al('missao-cumprida'), pos: '45% 25%', t1: 'missão', t2: 'cumprida!', paul: 'bateria', sub: 'tocou, agradeceu e ainda ganhou abraço da prof!' }]] : [])];
const browser = await chromium.launch();
for (const [nome, tag, ex] of EXS) { const fn = DESIGNS[nome];
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } }); const tmp = path.join(OUT, '.tmp.html');
  fs.writeFileSync(tmp, '<!doctype html><meta charset="utf-8">' + fn(ex)); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `design-${nome}-${tag}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); console.log('ok', nome);
}
await browser.close();
