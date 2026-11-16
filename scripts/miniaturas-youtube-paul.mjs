// 17 miniaturas (1280x720) do canal Robôterista Paul no YouTube, na identidade dos posts novos (azul, vinho, dourado, creme).
// Uso: SAIDA=/pasta NODE_PATH=$(npm root -g) node scripts/miniaturas-youtube-paul.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = process.env.SAIDA; fs.mkdirSync(OUT, { recursive: true });
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', OU = '#d8b879';
const F = (n) => u(`assets/fonts/${n}`);
const hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const LOGO = u('assets/originals/logo-beaterista-dourado.png');
const EPS = [
  ['A batida', 'sumiu', 'bateria'], ['O clique', 'teimoso', 'metronomo'], ['Cadê', 'o dó?', 'teclado'], ['A caixa que', 'falava', 'cajon'],
  ['A banda', 'do barulho', 'guitarra'], ['O som de', 'elástico', 'meditando'], ['O pandeiro de', 'duas surpresas', 'pandeiro'], ['A corrida', 'das palmas', 'maestro'],
  ['O robô que', 'acordou a banda', 'produtor'], ['A música', 'em camadas', 'dj'], ['O eco da', 'garagem', 'gravando'], ['O elevador', 'das notas', 'estudando'], ['O ônibus dos', 'quatro tempos', 'professor'],
  ['Bumbo e caixa', 'em dupla', 'bateria'], ['O riff', 'do Paul', 'guitarra'], ['O pedaço que', 'não saía', 'oculos'], ['Os sinos', 'que cantam', 'microfone'],
];
const tam = (a, b) => Math.max(a.length, b.length) > 12 ? 70 : Math.max(a.length, b.length) >= 10 ? 84 : 104;
const html = (i, [a, b, pose]) => { const bg = i % 3 === 0 ? AZ : i % 3 === 1 ? VI : '#14264f'; const disco = i % 3 === 1 ? '#c8374b' : OU; const n = String(i + 1).padStart(2, '0');
  return `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1280px;height:720px;background:${bg};color:${CR};position:relative;overflow:hidden;font-family:Hanken,sans-serif}.pt{position:absolute;inset:0;background:radial-gradient(${CR}1c 2px,transparent 2.6px) 0 0/34px 34px}
.d{position:absolute;left:-150px;top:130px;width:600px;height:600px;border-radius:50%;background:${disco};opacity:${i % 3 === 1 ? .9 : .95}}.p{position:absolute;left:-30px;bottom:-6px;height:600px;max-width:560px;object-fit:contain;object-position:left bottom;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.28))}
.ep{position:absolute;left:600px;top:70px;font:800 30px Hanken;letter-spacing:.12em;text-transform:uppercase;background:${OU};color:${AZ};padding:8px 22px;border-radius:99px}
.t{position:absolute;left:600px;top:160px;width:660px;white-space:nowrap;font:400 ${tam(a,b)}px/1.02 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0}.t em{display:block;font-style:normal;color:${OU};padding-left:36px}
.s{position:absolute;left:606px;top:400px;font:400 46px Gochi,cursive}.l{position:absolute;right:36px;top:30px;height:92px}.u{position:absolute;right:36px;bottom:30px;font:700 26px Hanken;background:${CR};color:${AZ};padding:8px 20px;border-radius:99px}
.r{position:absolute;left:566px;top:96px;display:none}</style><div class="pt"></div><div class="d"></div><img class="p" src="${hd(pose)}"><div class="ep">episódio ${n}</div>
<div class="t">${a}<em>${b}</em></div><div class="s">com o Robôterista Paul</div><img class="l" src="${LOGO}"><div class="u">jogos.beaterista.com.br</div>`; };
const browser = await chromium.launch();
for (const [i, e] of EPS.entries()) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html(i, e));
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  const nome = `ep${String(i + 1).padStart(2, '0')}-${e[0].concat(' ', e[1]).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/-$/, '')}.jpg`;
  await page.screenshot({ path: path.join(OUT, nome), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); console.log('ok', nome);
}
await browser.close();
