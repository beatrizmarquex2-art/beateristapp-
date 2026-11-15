// 3 posts de apresentação do perfil @jogos.beaterista (1080×1350): o Paul, a Beaterista e a Bea.
// Textos sobre a Bea e a escola saem da página de vendas (vendas/index.html), sem inventar nada.
// Uso: NODE_PATH=$(npm root -g) node scripts/kit-apresentacao.mjs  -> marketing/prontos/apresentacao/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const OUT = path.join(ROOT, 'marketing/prontos/apresentacao'); fs.mkdirSync(OUT, { recursive: true });
const base = (bg, cor) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;background:${bg};color:${cor};position:relative;overflow:hidden;font-family:Hanken,sans-serif}
.p{position:absolute;inset:0;background:radial-gradient(${cor}22 2px,transparent 2.6px) 0 0/30px 30px}
.f{position:absolute;background:#fff;border-radius:16px;box-shadow:12px 14px 0 rgba(0,0,0,.28);padding:12px;overflow:hidden}.f img{width:100%;height:100%;object-fit:cover;display:block;border-radius:8px}
h1{position:absolute;font:400 104px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0}h1 em{font-style:normal;display:block}
.s{position:absolute;font:400 52px/1.12 Gochi,cursive}.b{position:absolute;font:700 32px/1 Hanken;padding:18px 30px;border-radius:999px}
.c{position:absolute;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))}.li{position:absolute;font:400 50px/1.1 Gochi,cursive;padding:10px 26px 16px;border-radius:18px}
.sel{position:absolute;height:120px}</style><div class="p"></div>`;
const selo = u('assets/originals/logo_beaterista_original.png');
const ARTES = { // o post 3 (a Bea) agora sai de scripts/kit-apresentacao-bea.mjs (serie-bea)
  'apresentacao-1-paul': base('#0d1a36', '#f4ead8') + `<h1 style="left:64px;top:84px">oi, eu sou<em style="color:#f2b632;padding-left:50px">o paul!</em></h1>
<img class="c" src="${hd('selfie')}" style="right:10px;top:250px;height:800px">
<div class="s" style="left:64px;top:400px;width:440px">o robô baterista<br>da Beaterista</div>
<div class="li" style="left:54px;top:620px;background:#f2b632;color:#0d1a36;transform:rotate(-2deg)">aqui a gente joga</div>
<div class="li" style="left:84px;top:730px;background:#f4ead8;color:#0d1a36;transform:rotate(1.5deg)">aprende música</div>
<div class="li" style="left:54px;top:840px;background:#a8182e;color:#f4ead8;transform:rotate(-1.5deg)">e toca de verdade</div>
<div class="s" style="left:64px;top:1090px;font-size:46px">começa grátis, é só entrar:</div>
<div class="b" style="left:64px;top:1180px;background:#f4ead8;color:#0d1a36;font-size:40px;padding:22px 36px">jogos.beaterista.com.br</div>
<img class="sel" src="${selo}" style="right:60px;bottom:60px">`,
  'apresentacao-2-beaterista': base('#f4ead8', '#10234a') + `<h1 style="left:64px;top:80px;font-size:96px">o que é a<em style="color:#a8182e;padding-left:40px">beaterista?</em></h1>
<div class="f" style="right:56px;top:330px;width:440px;height:580px;transform:rotate(4deg)"><img src="${u('vendas/assets/d4a3b8edf7059b52.webp')}"></div>
<div class="li" style="left:54px;top:380px;background:#10234a;color:#f4ead8;transform:rotate(-2deg)">uma escola de música</div>
<div class="li" style="left:74px;top:490px;background:#a8182e;color:#f4ead8;transform:rotate(1.5deg)">em Araçatuba, SP</div>
<div class="s" style="left:64px;top:650px;width:470px;font-size:48px">aqui a música acontece na sala de aula e no palco.</div>
<div class="s" style="left:64px;top:950px;width:500px;font-size:48px">e agora também na tela: jogos e materiais pra estudar em casa.</div>
<img class="c" src="${hd('professor')}" style="right:30px;bottom:30px;height:400px">
<div class="b" style="left:64px;top:1200px;background:#10234a;color:#f4ead8;font-size:36px">jogos.beaterista.com.br</div>`,
  'apresentacao-3-bea': base('#a8182e', '#f4ead8') + `<h1 style="left:64px;top:76px">oi, eu sou<em style="color:#f2b632;padding-left:50px">a bea!</em></h1>
<div class="f" style="left:70px;top:330px;width:940px;height:520px;transform:rotate(-2deg)"><img src="${u('vendas/assets/d46fe097df0f9ef3.webp')}" style="object-position:50% 30%"></div>
<div class="li" style="left:54px;top:880px;background:#f4ead8;color:#10234a;transform:rotate(1.5deg);font-size:46px">professora de bateria e fundadora da Beaterista</div>
<div class="s" style="left:64px;top:1010px;width:760px;font-size:44px">quando um aluno trava, eu penso: como transformar isso num desafio que ele queira tentar de novo?</div>
<div class="s" style="left:64px;top:1230px;font-size:52px;color:#f2b632">foi assim que nasceram os jogos.</div>
<img class="c" src="${hd('bateria')}" style="right:16px;bottom:16px;height:300px">`,
};
const browser = await chromium.launch();
for (const [nome, html] of Object.entries(ARTES)) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${nome}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); console.log('ok', nome);
}
await browser.close();
