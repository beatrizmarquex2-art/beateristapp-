// Páginas temáticas (vários Pauls numa folha, só com nomes: NADA de aula), capa do PDF em preto e branco e capa quadrada pra Lojinha/Hotmart.
// Uso: NODE_PATH=$(npm root -g) node scripts/paul-colorir-extras.mjs
// Saída: assets/originals/paul-png/pra-colorir/extras/ (A4 2480×3508) e pra-colorir/capas/. Depende de scripts/paul-colorir-montar.py (desenhos/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = 'assets/originals/paul-png/pra-colorir';
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const D = (n) => u(`${P}/desenhos/paul-${n}.png`);

// [id, fundo, título, subtítulo, [[desenho, legenda], ...]]
export const EXTRAS = [
  ['a-banda-do-paul', '4-quadro', 'a banda do Paul', 'pinte a banda inteira!', [['bateria', 'Paul baterista'], ['guitarra', 'Paul guitarrista'], ['microfone', 'Paul cantor'], ['teclado', 'Paul tecladista']]],
  ['familia-percussao', '1-limpo', 'família da percussão', 'instrumentos de bater e chacoalhar', [['cajon', 'cajón'], ['congas', 'congas'], ['pandeiro', 'pandeiro'], ['xilofone', 'xilofone']]],
  ['familia-cordas', '4-quadro', 'família das cordas', 'instrumentos de corda', [['violino', 'violino'], ['ukulele', 'ukulele'], ['guitarra', 'guitarra']]],
  ['familia-sopros', '1-limpo', 'família dos sopros', 'instrumentos de soprar', [['sax', 'saxofone'], ['trompete', 'trompete']]],
  ['familia-teclas', '4-quadro', 'família das teclas', 'instrumentos de tecla', [['teclado', 'teclado'], ['acordeon', 'acordeon']]],
  ['caminho-do-baterista', '1-limpo', 'o caminho do baterista', 'primeiro ouve, depois lê, depois treina, depois toca', [['meditando', '1 · ouve'], ['estudando', '2 · lê'], ['pad-metronomo', '3 · treina no pad'], ['bateria', '4 · toca bateria']]],
  ['estilo-do-paul', '4-quadro', 'o estilo do Paul', 'cada dia de um jeito', [['oculos', 'de óculos'], ['breakdance', 'dançando'], ['selfie', 'na selfie'], ['amplificador', 'no amplificador']]],
  ['dia-de-musica', '1-limpo', 'um dia de música', 'o que o Paul faz no dia', [['case', 'vai pra aula'], ['professor', 'aprende'], ['colorindo', 'colore'], ['metronomo', 'marca o tempo']]],
  ['turma-toda', '4-quadro', 'todos os Pauls', 'pinte cada um de uma cor', 'TODOS'],
];
const AREA = { '1-limpo': [70, 220, 70, 200], '4-quadro': [120, 200, 120, 200] };
const fontes = `@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}`;
const todos = () => fs.readdirSync(path.join(ROOT, P, 'desenhos')).map((f) => f.slice(5, -4)).sort();

function pagina([, fundo, titulo, sub, itens]) {
  const [l, t, r, b] = AREA[fundo]; const tudo = itens === 'TODOS'; const lista = tudo ? todos().map((n) => [n, '']) : itens;
  const col = tudo ? 5 : lista.length <= 2 ? 1 : 2; const lin = Math.ceil(lista.length / col);
  return `<!doctype html><meta charset="utf-8"><style>${fontes}
body{width:1240px;height:1754px;background:#fff url(${u(`${P}/fundos/fundo-a4-${fundo}.png`)}) 0 0/1240px 1754px no-repeat;position:relative;overflow:hidden;color:#111}
.a{position:absolute;left:${l}px;top:${t}px;right:${r}px;bottom:${b}px;display:flex;flex-direction:column}
h1{font:400 ${titulo.length > 20 ? 70 : 84}px/1 Marker,cursive;text-align:center;transform:rotate(-2deg);margin-top:6px}
h2{font:400 40px/1.1 Gochi,cursive;text-align:center;margin:14px 0 10px}
.g{flex:1;min-height:0;display:grid;grid-template-columns:repeat(${col},1fr);grid-template-rows:repeat(${lin},1fr);gap:${tudo ? '6px 4px' : '16px 14px'}}
.g div{min-height:0;min-width:0;display:flex;flex-direction:column;align-items:center}
.g img{flex:1;min-height:0;max-width:100%;object-fit:contain}
.g b{font:400 ${col === 1 ? 50 : 44}px/1 Gochi,cursive;margin-top:6px;white-space:nowrap}
${lista.length === 3 ? '.g div:first-child{grid-column:1 / 3}' : ''}</style>
<div class="a"><h1>${titulo}</h1><h2>${sub}</h2><div class="g">${lista.map(([n, t2]) => `<div><img src="${D(n)}">${t2 ? `<b>${t2}</b>` : ''}</div>`).join('')}</div></div>`;
}

const L = (n) => u(`${P}/logos-pb/${n}.png`);
const capaPdf = (n) => `<!doctype html><meta charset="utf-8"><style>${fontes}
body{width:1240px;height:1754px;background:#fff;position:relative;overflow:hidden;color:#111;text-align:center}
.q{position:absolute;inset:56px;border:8px solid #111;border-radius:48px}.q2{position:absolute;inset:76px;border:3px solid #111;border-radius:32px}
.lg{position:absolute;left:0;right:0;top:120px}.lg img{height:330px}
.pc{position:absolute;left:0;right:0;top:455px;font:400 96px/1 Gochi,cursive;transform:rotate(-3deg)}.pc span{background:#111;color:#fff;padding:6px 34px 12px;border-radius:22px}
.d{position:absolute;left:150px;right:150px;top:600px;bottom:300px;display:flex;align-items:center;justify-content:center}.d img{max-width:100%;max-height:100%}
.n{position:absolute;left:0;right:0;bottom:210px;font:400 46px/1 Gochi,cursive}
.pe{position:absolute;left:0;right:0;bottom:104px;display:flex;justify-content:center;align-items:center;gap:22px}.pe img{height:86px}.pe img+img{height:62px}.pe span{font:700 30px Hanken,sans-serif}</style>
<div class="q"></div><div class="q2"></div><div class="lg"><img src="${L('roboterista-paul-pb')}"></div><div class="pc"><span>para colorir</span></div>
<div class="d"><img src="${D('bateria')}"></div><div class="n">pra pintar do seu jeito</div>
<div class="pe"><img src="${L('selo-beaterista-pb')}"><img src="${L('beaterista-escola-de-musica-pb')}"><span>· jogos.beaterista.com.br</span></div>`;

// a mesma capa, colorida (a Bea escolheu esta como capa do produto): logo e selo originais, Paul da bateria colorido, fundo creme. q = quadrada (1000×1000)
const capaCor = (n, q) => `<!doctype html><meta charset="utf-8"><style>${fontes}
body{width:${q ? 1000 : 1240}px;height:${q ? 1000 : 1754}px;background:#f4ead8;position:relative;overflow:hidden;color:#10234a;text-align:center}
.p{position:absolute;inset:0;background:radial-gradient(#10234a22 2px,transparent 2.6px) 0 0/30px 30px}
.q{position:absolute;inset:${q ? 30 : 56}px;border:8px solid #10234a;border-radius:48px}.q2{position:absolute;inset:${q ? 48 : 76}px;border:3px solid #a8182e;border-radius:32px}
.lg{position:absolute;left:0;right:0;top:${q ? 70 : 120}px}.lg img{height:${q ? 210 : 330}px}
.pc{position:absolute;left:0;right:0;top:${q ? 285 : 455}px;font:400 ${q ? 66 : 96}px/1 Gochi,cursive;transform:rotate(-3deg)}.pc span{background:#a8182e;color:#f4ead8;padding:6px 34px 12px;border-radius:22px;box-shadow:6px 6px 0 #10234a}
.d{position:absolute;left:${q ? 190 : 130}px;right:${q ? 190 : 130}px;top:${q ? 370 : 610}px;bottom:${q ? 170 : 300}px;display:flex;align-items:center;justify-content:center}.d img{max-width:100%;max-height:100%;filter:drop-shadow(10px 12px 0 rgba(16,35,74,.18))}
.n{position:absolute;left:0;right:0;bottom:${q ? 122 : 210}px;font:400 ${q ? 36 : 46}px/1 Gochi,cursive}
.pe{position:absolute;left:0;right:0;bottom:${q ? 62 : 104}px;display:flex;justify-content:center;align-items:center;gap:${q ? 14 : 22}px}.pe img{height:${q ? 56 : 86}px}.pe img+img{height:${q ? 40 : 62}px}.pe span{font:700 ${q ? 21 : 30}px Hanken,sans-serif}</style>
<div class="p"></div><div class="q"></div><div class="q2"></div><div class="lg"><img src="${u('assets/originals/logo-roboterista-paul.png')}"></div><div class="pc"><span>para colorir</span></div>
<div class="d"><img src="${u('assets/originals/paul-png/coloridos-hd/paul-bateria.png')}"></div><div class="n">pra pintar do seu jeito</div>
<div class="pe"><img src="${u('assets/originals/logo_beaterista_original.png')}"><img src="${u('assets/logo-nome.png')}"><span>· jogos.beaterista.com.br</span></div>`;

// capa quadrada da Lojinha/Hotmart (1000×1000, colorida): metade do Paul pintada, metade em linha
const TEMAS = { creme: ['#f4ead8', '#10234a', '#a8182e', '#10234a22'], noite: ['#0d1a36', '#f4ead8', '#f2b632', '#ffffff18'], vinho: ['#a8182e', '#f4ead8', '#f2b632', '#ffffff22'] };
const capaLoja = (tema, n) => { const [bg, a, b2, pt] = TEMAS[tema]; return `<!doctype html><meta charset="utf-8"><style>${fontes}
body{width:1000px;height:1000px;background:${bg};position:relative;overflow:hidden;color:${a}}
.p{position:absolute;inset:0;background:radial-gradient(${pt} 2px,transparent 2.6px) 0 0/28px 28px}
.t{position:absolute;left:54px;top:44px;font:400 86px/.98 Marker,cursive;transform:rotate(-4deg);transform-origin:0 0}.t em{display:block;font-style:normal;color:${b2};padding-left:60px}
.pc{position:absolute;left:66px;top:258px;font:400 62px/1 Gochi,cursive;background:${b2};color:${bg};padding:4px 26px 10px;border-radius:18px;transform:rotate(-4deg)}
.f{position:absolute;right:20px;top:300px;width:560px;background:#fff;border:6px solid ${tema === 'creme' ? '#10234a' : '#fff'};border-radius:22px;padding:22px;transform:rotate(4deg);box-shadow:14px 16px 0 rgba(0,0,0,.28)}.f img{width:100%;display:block}
.c{position:absolute;left:10px;bottom:120px;width:430px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))}
.n{position:absolute;left:54px;bottom:40px;font:800 34px/1 Hanken,sans-serif}.n small{display:block;font:400 34px Gochi,cursive;margin-top:4px}
.s{position:absolute;right:44px;bottom:40px;font:700 28px Hanken,sans-serif;background:${a};color:${bg};padding:14px 24px;border-radius:999px}</style>
<div class="p"></div><div class="t">Robôterista<em>Paul</em></div><div class="pc">para colorir</div>
<div class="f"><img src="${D('bateria')}"></div><img class="c" src="${u('assets/originals/paul-png/coloridos-hd/paul-colorindo.png')}">
<div class="n">${n} páginas A4<small>pra imprimir e pintar</small></div><div class="s">beaterista</div>`; };

const N = 25 + EXTRAS.length + 1; // folhas de 1 Paul + temáticas + capa
const browser = await chromium.launch();
const tira = async (html, arq, w, h, escala, tipo = 'png') => {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: escala });
  const tmp = path.join(ROOT, P, '.tmp.html'); fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
  await page.screenshot({ path: arq, type: tipo, ...(tipo === 'jpeg' ? { quality: 92 } : {}) }); await page.close(); fs.rmSync(tmp); console.log('ok', path.basename(arq));
};
for (const d of ['extras', 'capas']) fs.mkdirSync(path.join(ROOT, P, d), { recursive: true });
for (const e of EXTRAS) await tira(pagina(e), path.join(ROOT, P, 'extras', `colorir-${e[0]}.png`), 1240, 1754, 2);
await tira(capaPdf(N), path.join(ROOT, P, 'capas', 'capa-pdf-pb.png'), 1240, 1754, 2);
await tira(capaCor(N, false), path.join(ROOT, P, 'capas', 'capa-colorida-a4.png'), 1240, 1754, 2);
await tira(capaCor(N, true), path.join(ROOT, P, 'capas', 'capa-colorida-quadrada.jpg'), 1000, 1000, 1.5, 'jpeg');
for (const t of Object.keys(TEMAS)) await tira(capaLoja(t, N), path.join(ROOT, P, 'capas', `capa-lojinha-${t}.jpg`), 1000, 1000, 1, 'jpeg');
await browser.close();
