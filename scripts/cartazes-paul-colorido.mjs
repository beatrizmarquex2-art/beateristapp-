// Cartazes 1080×1350 com os Pauls coloridos em alta (assets/originals/paul-png/coloridos-hd).
// Uso: NODE_PATH=$(npm root -g) node scripts/cartazes-paul-colorido.mjs [pasta de saída]
// Saída padrão: marketing/prontos/cartazes-paul/ (jpg pra postar). Pra mudar frase ou cor, edite a lista CARTAZES.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'marketing/prontos/cartazes-paul'));
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;

// tema: creme (fundo creme, título azul + vinho) · noite (fundo azul-marinho, título creme + mostarda) · palco (creme com moldura vermelha rabiscada)
export const CARTAZES = [
  { id: '01-bateria', paul: 'bateria', tema: 'noite', t1: 'tum tá', t2: 'tum tum tá!', sub: 'canta o ritmo antes de tocar.\na mão aprende mais rápido.' },
  { id: '02-professor', paul: 'professor', tema: 'creme', t1: 'hoje tem aula', t2: 'com o Paul.', sub: 'a Bea ensina.\neu treino com você!' },
  { id: '03-oculos', paul: 'oculos', tema: 'palco', t1: 'estudou?', t2: 'então brilha.', sub: 'jogou, ganhou estrela.\ntreinou, ganhou groove.' },
  { id: '04-cajon', paul: 'cajon', tema: 'creme', t1: 'toda caixa', t2: 'vira banda.', sub: 'cajón: grave no meio,\nagudo perto da borda.' },
  { id: '05-microfone', paul: 'microfone', tema: 'noite', t1: 'solta a voz,', t2: 'o ritmo vem.', sub: 'cantar o ritmo também\né estudar música.' },
  { id: '06-estudando', paul: 'estudando', tema: 'creme', t1: '10 minutinhos', t2: 'todo dia.', sub: 'valem mais que 1 hora\nsó no sábado.' },
  { id: '07-guitarra', paul: 'guitarra', tema: 'palco', t1: 'aumenta o som.', t2: 'bora tocar!', sub: 'devagar e certo hoje,\nrápido amanhã.' },
  { id: '08-agua', paul: 'agua', tema: 'noite', t1: 'pausa também', t2: 'é treino.', sub: 'bebe uma água, respira e volta.\no cérebro guarda o que você tocou.' },
  { id: '09-teclado', paul: 'teclado', tema: 'creme', t1: 'tecla por tecla', t2: 'vira música.', sub: 'dó ré mi fá sol lá si.\ncomeça pelas brancas!' },
];

const TEMAS = {
  creme: { bg: '#f4ead8', a: '#10234a', b: '#a8182e', sub: '#10234a', risco: '#e9a820', ponto: '#10234a22', logo: 'creme' },
  noite: { bg: '#0d1a36', a: '#f4ead8', b: '#f2b632', sub: '#f4ead8', risco: '#f2b632', ponto: '#ffffff18', logo: 'noite' },
  palco: { bg: '#f8eedb', a: '#b0162b', b: '#b0162b', sub: '#10234a', risco: '#e9a820', ponto: '#b0162b1c', logo: 'creme' },
};

const estrela = (x, y, s, cor, rot = 0) => `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0-30 L8-9 L31-8 L13 6 L20 29 L0 15 L-19 30 L-12 6 L-31-9 L-8-9 Z" fill="none" stroke="${cor}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
const risco = (x, y, w, cor, rot = 0) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0 C ${w * 0.25} -14, ${w * 0.5} 12, ${w * 0.75} -6 S ${w} 4, ${w} 0" fill="none" stroke="${cor}" stroke-width="9" stroke-linecap="round"/>`;
const raios = (x, y, cor, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})" stroke="${cor}" stroke-width="8" stroke-linecap="round"><path d="M0 0 L0 -44"/><path d="M34 8 L64 -24"/><path d="M-34 8 L-64 -24"/></g>`;
const coroa = (x, y, cor, rot = 0) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0 L-8 -52 L22 -24 L44 -64 L64 -22 L96 -50 L86 2 Z" fill="none" stroke="${cor}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
const zigue = (x, y, cor, rot = 0) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0 L70 -22 L10 26 L84 6 L26 52 L92 36" fill="none" stroke="${cor}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;

function html(c) {
  const T = TEMAS[c.tema];
  const moldura = c.tema === 'palco'
    ? `<path d="M30 40 L1048 26 L1054 1322 L26 1326 Z M42 54 L38 1312 M1040 40 L1046 1308" fill="none" stroke="#b0162b" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const dood = c.tema === 'noite'
    ? estrela(968, 350, 1.05, T.risco, 12) + estrela(70, 640, .75, '#f4ead8', -14) + zigue(948, 1090, '#c2233a', 8) + raios(990, 640, T.risco, 40) + coroa(52, 1150, T.risco, -10)
    : c.tema === 'palco'
      ? estrela(96, 660, .85, T.risco, -10) + estrela(972, 600, 1.05, T.risco, 16) + zigue(930, 1090, '#10234a', 6) + zigue(66, 1060, '#b0162b', -12) + coroa(900, 400, T.risco, 10)
      : estrela(968, 350, 1.05, T.b, 14) + coroa(50, 700, T.risco, -12) + zigue(60, 1080, T.a, -6) + raios(988, 640, T.risco, 40) + estrela(990, 1120, .7, T.risco, -8);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;position:relative;overflow:hidden;background:${T.bg};font-family:Hanken,system-ui,sans-serif}
.papel{position:absolute;inset:0;background:radial-gradient(${T.ponto} 2px,transparent 2.6px) 0 0/30px 30px}
.grao{position:absolute;inset:0;opacity:.5;mix-blend-mode:${c.tema === 'noite' ? 'screen' : 'multiply'}}
svg.d{position:absolute;inset:0;width:1080px;height:1350px;filter:url(#giz)}
h1{position:absolute;left:78px;top:92px;right:60px;font:400 ${c.fs || 112}px/1.02 Marker,cursive;color:${T.a};transform:rotate(-4deg);transform-origin:0 0;letter-spacing:-.01em;filter:url(#giz)}
h1 em{display:block;font-style:normal;color:${T.b};padding-left:34px}
.palco{position:absolute;left:60px;right:60px;top:500px;bottom:150px;display:flex;align-items:flex-end;justify-content:center}
.paul{max-width:100%;max-height:100%;filter:drop-shadow(10px 14px 0 rgba(0,0,0,${c.tema === 'noite' ? '.45' : '.16'}))}
.sub{position:absolute;left:92px;top:392px;right:80px;font:400 46px/1.1 Gochi,cursive;color:${T.sub};white-space:pre-line;transform:rotate(-3deg);transform-origin:0 0}
.pe{position:absolute;left:0;right:0;bottom:${c.tema === 'palco' ? 22 : 8}px;height:122px;display:flex;align-items:center;justify-content:space-between;padding:0 70px}
.logo{font:400 66px/1 Gochi,cursive;color:${T.a};transform:rotate(-5deg);position:relative;-webkit-text-stroke:1.6px ${T.a}}
.logo:after{content:"";position:absolute;left:8px;right:-10px;bottom:-12px;height:7px;border-radius:9px;background:${T.risco};transform:rotate(-1.5deg)}
.url{font:700 30px/1 Hanken,sans-serif;letter-spacing:.02em;color:${c.tema === 'noite' ? '#0d1a36' : '#f4ead8'};background:${c.tema === 'noite' ? T.risco : '#10234a'};padding:17px 26px;border-radius:999px}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="giz" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .22 0"/></filter></svg>
<div class="papel"></div><svg class="grao" width="1080" height="1350"><rect width="1080" height="1350" filter="url(#gr)"/></svg>
<svg class="d" viewBox="0 0 1080 1350">${moldura}${dood}${risco(88, 372, c.rw || 430, T.risco, -5)}</svg>
<h1>${c.t1}<em>${c.t2}</em></h1>
<div class="palco"><img class="paul" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${c.paul}.png`)}"></div>
<p class="sub">${c.sub}</p>
<div class="pe"><span class="logo">beaterista</span><span class="url">jogos.beaterista.com.br</span></div>
</body></html>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(OUT, '.tmp.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const c of CARTAZES) {
    fs.writeFileSync(tmp, html(c));
    await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, `paul-${c.id}.jpg`), type: 'jpeg', quality: 92 });
    console.log('ok', c.id);
  }
  fs.rmSync(tmp); await browser.close();
}
