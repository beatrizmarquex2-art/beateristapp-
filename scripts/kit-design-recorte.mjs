// SEM LARANJA (Bea, 15/nov): nada de fundo amarelo/alaranjado; fundos só azul, vinho e creme.
// Design D "recorte": foto sem fundo (scripts/foto-recorta.py), com contorno de figurinha, sobre raios ou palavra gigante. Cores da marca, Paul em todos.
// Uso: [RECORTES_ALUNOS=pasta SAIDA_ALUNOS=pasta] node scripts/kit-design-recorte.mjs -> marketing/prontos/apresentacao/v3-recortes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const F = (n) => u(`assets/fonts/${n}`), hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', AM = '#f2b632';
// bordas.json = bordas em que cada PNG vem cortado: a foto encosta nessa borda do post (pedido da Bea)
const BORDAS = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing/fotos-bea/recortes/bordas.json'), 'utf8'));
const CORES = { azul: [AZ, CR, AM, VI], vinho: [VI, CR, AM, AZ], creme: [CR, AZ, VI, '#e3d3b4'], claro: [CR, AZ, VI, '#e3d3b4'] }; // fundo, texto, destaque, raio
const css = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}
@font-face{font-family:Anton;src:url(${F('Anton-latin.woff2')})}@font-face{font-family:Anton;src:url(${F('Anton-latin-ext.woff2')});unicode-range:U+0100-024F}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;position:relative;overflow:hidden}`;
const arte = ({ rec, cor, modo = 'raios', t1, t2, sub, paul = 'bateria', alt = 800, giro = -3 }, dir) => { const [BG, TX, DQ, RA] = CORES[cor]; const bd = BORDAS[rec] || []; const grande = (t2 || t1).split(' ').pop();
  return `<!doctype html><meta charset="utf-8"><style>${css}body{background:${BG};color:${TX}}
.r{position:absolute;left:50%;top:56%;width:2200px;height:2200px;margin:-1100px;border-radius:50%;background:repeating-conic-gradient(${RA}55 0 9deg,transparent 9deg 18deg)}
.o{position:absolute;left:50%;top:56%;width:760px;height:760px;margin:-380px;border-radius:50%;background:${RA};border:10px solid ${TX}}
.gg{position:absolute;left:-20px;right:-20px;top:300px;text-align:center;font:400 ${grande.length > 8 ? 250 : 340}px/.9 Anton,sans-serif;text-transform:uppercase;color:${RA};opacity:.9;white-space:nowrap}
h1{position:absolute;left:56px;right:56px;top:54px;font:400 ${Math.max(t1.length, (t2 || '').length) > 14 ? 82 : 110}px/.96 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:${DQ};padding-left:46px}
.ft{position:absolute;${bd.includes('esq') ? 'left:0' : bd.includes('dir') ? 'right:0' : 'left:50%;transform:translateX(-50%)'};${bd.includes('baixo') ? 'bottom:0' : 'bottom:150px'};max-height:${alt}px;max-width:${bd.length ? 960 : 900}px;filter:drop-shadow(14px 16px 0 rgba(0,0,0,.3))}
.s{position:absolute;${bd.includes('baixo') || bd.includes('esq') ? 'right:40px;bottom:340px;max-width:520px;text-align:right' : 'left:56px;bottom:52px;max-width:700px'};z-index:3;font:400 50px/1.1 Gochi,cursive;background:${TX};color:${BG};padding:10px 28px 16px;border-radius:20px;transform:rotate(-2deg)}
.c{position:absolute;right:14px;bottom:14px;height:300px;z-index:3;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.3))}</style>
${modo === 'raios' ? '<div class="r"></div>' + (bd.length ? '' : '<div class="o"></div>') : `<div class="gg">${grande}</div>`}
<h1>${t1}<em>${t2 || ''}</em></h1><img class="ft" src="${pathToFileURL(path.join(dir, rec + '.png')).href}">
<div class="s">${sub}</div><img class="c" src="${hd(paul)}">`; };
// SÓ OBJETOS: a Bea não quer recorte de pessoa (15/nov). Pessoas vão nos designs de kit-designs-novos.mjs.
// 15/nov: a Bea não gostou dos recortes automáticos (nem de objeto). Ela manda os PNGs já recortados; pôr em marketing/fotos-bea/recortes/ e listar aqui.
export const RECORTES = { // PNGs que a Bea mandou já recortados (sem contorno automático)
  '1-copo': { rec: 'copo', cor: 'claro', t1: 'o copo', t2: 'da beaterista', sub: 'preto com dourado', paul: 'agua', alt: 860, giro: 0 },
  '2-bones': { rec: 'bones', cor: 'vinho', t1: 'tem boné', t2: 'também', sub: 'quem quer?', paul: 'oculos', alt: 820, giro: 0 },
  '3-camiseta-preta': { rec: 'camiseta-preta', cor: 'claro', modo: 'palavra', t1: 'preta', t2: 'com dourado', sub: 'tem do tamanho dos pequenos', paul: 'oculos', alt: 860, giro: 0 },
  '4-adesivos': { rec: 'adesivos', cor: 'azul', t1: 'adesivo', t2: 'pra colar em tudo', sub: 'no caderno, no case, na bateria', paul: 'selfie', alt: 820, giro: 0 },
  '5-cartoes': { rec: 'cartoes', cor: 'vinho', t1: 'vem conhecer', t2: 'a escola', sub: 'Araçatuba, SP', paul: 'professor', alt: 880, giro: 0 },
  '6-arara': { rec: 'arara', cor: 'claro', t1: 'veste', t2: 'a camiseta', sub: 'qual é a sua cor?', paul: 'oculos', alt: 880, giro: 0 },
};
const RA = process.env.RECORTES_ALUNOS, SA = process.env.SAIDA_ALUNOS;
const browser = await chromium.launch(); let n = 0;
for (const [out, dir, pre, serie] of [[path.join(ROOT, 'marketing/prontos/apresentacao/v3-recortes'), path.join(ROOT, 'marketing/fotos-bea/recortes'), 'recorte', RECORTES]]) {
  fs.mkdirSync(out, { recursive: true });
  for (const [nome, d] of Object.entries(serie)) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } }); const tmp = path.join(out, '.tmp.html'); fs.writeFileSync(tmp, arte(d, dir));
    await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, `${pre}-${nome}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); n++;
  }
}
await browser.close(); console.log(n, 'posts');
