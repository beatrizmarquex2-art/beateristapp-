// Fundos de página A4 (2480×3508) pras folhas de colorir da Lojinha. O desenho entra depois, na área livre do meio.
// Todos levam, com os LOGOS em preto e branco (pedido da Bea: selo + beaterista escola de música, e Robôterista escola de música + Paul): beaterista · jogos.beaterista.com.br · Robôterista Paul.
// Uso: NODE_PATH=$(npm root -g) node scripts/paul-colorir-fundos.mjs [PASTA_SAIDA] [desenho.png pra ver como fica]
// Área livre do desenho (em px da folha final): ver AREA de cada fundo, impressa no fim.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'assets/originals/paul-png/pra-colorir/fundos'));
const DESENHO = process.argv[3] ? pathToFileURL(path.resolve(process.argv[3])).href : null;
const L = (n) => u(`assets/originals/paul-png/pra-colorir/logos-pb/${n}.png`);
const ROBO = (h) => `<span style="display:inline-flex;align-items:center;gap:${h * .12}px"><img src="${L('roboterista-escola-de-musica-pb')}" style="height:${h}px"><span class="paul" style="font-size:${h * .42}px;transform:rotate(-3deg)">Paul</span></span>`;
const BEA = (h) => `<span style="display:inline-flex;align-items:center;gap:${h * .22}px"><img src="${L('selo-beaterista-pb')}" style="height:${h}px"><img src="${L('beaterista-escola-de-musica-pb')}" style="height:${h * .72}px"></span>`;
const URL_ = 'jogos.beaterista.com.br';

const base = `@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}body{width:1240px;height:1754px;background:#fff;position:relative;overflow:hidden;font-family:Hanken,sans-serif;color:#111}
.area{position:absolute;display:flex;align-items:center;justify-content:center}.area img{max-width:100%;max-height:100%}
.paul{font:400 62px/1 Marker,cursive;white-space:nowrap}.bea{font:800 52px/1 Hanken,sans-serif;letter-spacing:-.02em}.url{font:700 30px/1 Hanken,sans-serif;letter-spacing:.02em}
svg{position:absolute;inset:0;width:1240px;height:1754px}`;
const st = 'fill="none" stroke="#111" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
const estrela = (x, y, s, r = 0) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0-30 L8-9 L31-8 L13 6 L20 29 L0 15 L-19 30 L-12 6 L-31-9 L-8-9 Z" ${st}/>`;
const nota = (x, y, s, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" ${st}><ellipse cx="0" cy="0" rx="15" ry="11"/><ellipse cx="46" cy="-10" rx="15" ry="11"/><path d="M15 0 L15 -62 L61 -74 L61 -10 M15 -44 L61 -56"/></g>`;
const raio = (x, y, s, r = 0) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M10-40 L-18 6 L2 6 L-10 42 L22-8 L2-8 Z" ${st}/>`;
const coroa = (x, y, s, r = 0) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M-40 26 L-48 -26 L-18 2 L0 -36 L18 2 L48 -26 L40 26 Z" ${st}/>`;
const baqueta = (x, y, s, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" ${st}><path d="M-60 6 L52 -4 L52 4 L-60 14 Z"/><ellipse cx="62" cy="0" rx="12" ry="9"/></g>`;
const pauta = (y, x0 = 70, x1 = 1170) => [0, 1, 2, 3, 4].map((i) => `<path d="M${x0} ${y + i * 16} L${x1} ${y + i * 16}" stroke="#111" stroke-width="2.5" fill="none"/>`).join('');

export const FUNDOS = [
  { id: '1-limpo', nome: 'limpo', area: [70, 220, 70, 200],
    html: `<div style="position:absolute;left:70px;top:56px;display:flex;align-items:center;gap:18px">${ROBO(135)}</div>
<div style="position:absolute;left:70px;right:70px;bottom:164px;border-top:4px solid #111"></div>
<div style="position:absolute;left:70px;right:70px;bottom:44px;display:flex;justify-content:space-between;align-items:center">${BEA(98)}<span class="url">${URL_}</span></div>` },
  { id: '2-rabiscos', nome: 'moldura de rabiscos (dá pra pintar a moldura também)', area: [150, 300, 150, 250],
    html: `<svg viewBox="0 0 1240 1754"><path d="M52 60 Q620 38 1190 54 Q1204 870 1188 1700 Q620 1716 50 1698 Q36 880 52 60 Z" ${st} stroke-width="7"/>
${estrela(120, 250, 1.3, -10)}${nota(1090, 330, 1.1, 8)}${raio(110, 640, 1.5, -8)}${coroa(1120, 700, 1, 10)}${estrela(1120, 1080, 1.1, 14)}${nota(96, 1090, 1, -10)}${baqueta(120, 1420, 1, -40)}${raio(1130, 1400, 1.3, 12)}</svg>
<div style="position:absolute;left:0;right:0;top:104px;display:flex;justify-content:center;align-items:center;gap:20px">${ROBO(167)}</div>
<div style="position:absolute;left:120px;right:120px;bottom:96px;display:flex;justify-content:space-between;align-items:center">${BEA(106)}<span class="url" style="background:#111;color:#fff;padding:14px 24px;border-radius:999px">${URL_}</span></div>` },
  { id: '3-caderno', nome: 'caderno de música (pauta, nome e data)', area: [80, 350, 80, 340],
    html: `<svg viewBox="0 0 1240 1754">${pauta(244)}${pauta(1440)}${nota(960, 292, .62)}${nota(1060, 276, .62)}${nota(170, 1488, .62)}${nota(270, 1472, .62)}</svg>
<div style="position:absolute;left:70px;right:70px;top:54px;display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:16px">${ROBO(142)}</div><span style="font:400 40px Gochi,cursive">pinte do seu jeito!</span></div>
<div style="position:absolute;left:70px;right:70px;bottom:166px;display:flex;gap:26px;font:400 40px Gochi,cursive"><span>nome:</span><span style="flex:1;border-bottom:4px solid #111"></span><span>data:</span><span style="flex:.4;border-bottom:4px solid #111"></span></div>
<div style="position:absolute;left:70px;right:70px;bottom:44px;display:flex;justify-content:space-between;align-items:center">${BEA(93)}<span class="url">${URL_}</span></div>` },
  { id: '4-quadro', nome: 'quadro duplo, com os nomes encaixados na moldura', area: [120, 200, 120, 200],
    html: `<div style="position:absolute;inset:70px 56px;border:7px solid #111;border-radius:44px"></div><div style="position:absolute;inset:88px 74px;border:3px solid #111;border-radius:30px"></div>
<div style="position:absolute;left:0;right:0;top:36px;text-align:center"><span style="background:#fff;padding:0 30px;display:inline-block">${ROBO(150)}</span></div>
<div style="position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center"><span style="background:#fff;padding:0 30px;display:flex;align-items:center;gap:22px">${BEA(106)}<span style="font-size:40px">·</span><span class="url">${URL_}</span></span></div>` },
];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(OUT, '.tmp.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 2 });
  for (const f of FUNDOS) {
    const [l, t, r, b] = f.area;
    const meio = DESENHO ? `<div class="area" style="left:${l}px;top:${t}px;right:${r}px;bottom:${b}px"><img src="${DESENHO}"></div>` : '';
    fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>${base}</style>${f.html}${meio}`);
    await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, `fundo-a4-${f.id}${DESENHO ? '-exemplo' : ''}.png`) });
    console.log(f.id, '· área livre (px):', `x ${l * 2} a ${2480 - r * 2}, y ${t * 2} a ${3508 - b * 2}`);
  }
  fs.rmSync(tmp); await browser.close();
}
