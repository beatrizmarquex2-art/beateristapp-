// Stories e posts no MOLDE NOVO (15/nov): textura de papel + rabiscos (coroa, estrela, raio, coração, nota), dourado do logo, sem laranja,
// logo dourado + "Beaterista · educação musical com propósito" em todos.
// ATENÇÃO: a Bea NÃO quis os TEMAS neste molde (15/nov): ela gosta do desenho original; a versão que vale é marketing/prontos/stories-temas-original/ (marketing/ferramentas/tira_semana.py).
// Os TEMAS abaixo ficam só de histórico e não são mais gerados. VENDA continua valendo.
// TEMAS = os 12 temas da série do Robôterista Paul, agora SEM "semana NN" (a Bea não vai soltar por semana) e com o Paul colorido em alta.
// VENDA = os stories que eram só escrito em fundo azul, refeitos com textura e elementos.
// Uso: NODE_PATH=$(npm root -g) node scripts/stories-temas.mjs  -> marketing/prontos/stories-temas/ (story 1080×1920 + post 1080×1350) e marketing/prontos/stories-v2/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href, F = (n) => u(`assets/fonts/${n}`), hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', OU = '#d8b879';
const CORES = { creme: [CR, AZ, VI, AZ], azul: [AZ, CR, OU, CR], vinho: [VI, CR, OU, CR] }; // fundo, texto, destaque, cor da etiqueta final
// rabiscos (traço à mão)
const R = {
  estrela: 'M0-30 L8-9 L31-8 L13 6 L20 29 L0 15 L-19 30 L-12 6 L-31-9 L-8-9 Z',
  coroa: 'M-40 26 L-48 -26 L-18 2 L0 -36 L18 2 L48 -26 L40 26 Z',
  raio: 'M10-40 L-18 6 L2 6 L-10 42 L22-8 L2-8 Z',
  coracao: 'M0 28 C-44 -6 -22 -40 0 -14 C22 -40 44 -6 0 28 Z',
  zig: 'M-40 -14 L-14 6 L-22 -18 L10 6 L0 -18 L40 8',
  nota: 'M-14 22 a14 10 0 1 0 28 0 a14 10 0 1 0 -28 0 M14 22 L14 -40 L40 -30',
  tracos: 'M-30 20 L-18 -18 M0 24 L0 -24 M30 20 L18 -18',
};
// rabiscos SÓ nas áreas livres (nunca em cima de texto, logo ou Paul): faixa de cima, tira da direita e faixa de baixo
const POS_S = [[120, 130, 'coroa', -12, 1], [420, 110, 'zig', 4, 1], [700, 140, 'estrela', 10, 1.1], [960, 120, 'raio', 8, 1], [970, 330, 'coracao', 12, .9], [985, 560, 'estrela', -10, .9], [960, 760, 'tracos', 0, .9], [110, 1700, 'estrela', -14, 1], [380, 1760, 'nota', -8, .9], [660, 1690, 'coroa', 8, .9], [940, 1740, 'zig', -4, 1]];
const POS_P = [[640, 90, 'coroa', -10, .9], [820, 130, 'estrela', 10, 1], [980, 80, 'raio', 8, .9], [985, 300, 'coracao', 12, .8], [990, 450, 'tracos', 0, .8], [660, 1150, 'zig', 4, .9], [840, 1250, 'estrela', -10, .9], [990, 1140, 'nota', 8, .8]];
const rabiscos = (cores, h, salto = 0) => { const P = h > 1500 ? POS_S : POS_P; return `<svg viewBox="0 0 1080 ${h}" style="position:absolute;inset:0;width:1080px;height:${h}px">${P.map(([x, y, k, r, s], i) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s * 1.25})" d="${R[P[(i + salto) % P.length][2]]}" fill="none" stroke="${cores[i % cores.length]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`; };
const base = (w, h, cor, salto) => { const [BG, TX, DQ] = CORES[cor]; return `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}@font-face{font-family:Anton;src:url(${F('Anton-latin.woff2')})}
@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;background:${BG};color:${TX};position:relative;overflow:hidden}h1,p,.sb,.fim{text-wrap:balance}
.tx{position:absolute;inset:0;background:radial-gradient(${TX}20 2px,transparent 2.6px) 0 0/30px 30px}
.gr{position:absolute;inset:0;opacity:${cor === 'creme' ? .5 : .32};mix-blend-mode:${cor === 'creme' ? 'multiply' : 'overlay'}}
.mo{position:absolute;inset:26px;border:6px solid ${TX}33;border-radius:36px}</style>
<div class="tx"></div><svg class="gr" width="${w}" height="${h}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .5 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="mo"></div>${rabiscos(cor === 'creme' ? [VI, AZ, OU] : [OU, CR, cor === 'azul' ? VI : AZ], h, salto)}`; };
const assin = (TX, BG) => `<div style="display:inline-flex;align-items:center;gap:16px;background:${AZ};color:${CR};padding:8px 30px 8px 8px;border-radius:99px;font:800 30px/1.15 Hanken,sans-serif;box-shadow:6px 6px 0 ${OU}"><img src="${u('assets/originals/logo-beaterista-dourado.png')}" style="height:84px"><span>Beaterista<br><span style="font-weight:500;font-size:25px">educação musical com propósito</span></span></div>`;
const check = (c) => `<svg width="46" height="46" viewBox="0 0 46 46" style="flex:none"><path d="M6 25 L18 37 L41 8" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// ---- molde "tema": título, subtítulo, lista, Paul, frase final
const tema = ({ t1, t2, sub, itens, fim, paul, cor, natal }, w, h, i) => { const [BG, TX, DQ, ET] = CORES[cor]; const st = h > 1500; const k = st ? 1 : .82;
  return base(w, h, cor, i) + `<style>
.lg{position:absolute;left:54px;top:${st ? 246 : 54}px;height:${st ? 150 : 120}px;background:${CR};padding:10px 18px;border-radius:18px;transform:rotate(-3deg);box-shadow:6px 6px 0 ${cor === 'creme' ? AZ + '33' : OU}}
h1{position:absolute;left:64px;right:60px;top:${st ? 450 : 215}px;font:400 ${Math.round((Math.max(t1.length, t2.length) > 11 ? 104 : 128) * k)}px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0}h1 em{font-style:normal;display:block;color:${DQ};padding-left:44px}
.sb{position:absolute;left:70px;right:70px;top:${st ? 745 : 455}px;font:400 ${Math.round(56 * k)}px/1.1 Gochi,cursive}
.li{position:absolute;left:70px;top:${st ? 900 : 570}px;display:flex;flex-direction:column;gap:${st ? 26 : 16}px;font:400 ${Math.round(56 * k)}px/1 Gochi,cursive}.li div{display:flex;align-items:center;gap:18px}
.c{position:absolute;right:${st ? 10 : 16}px;top:${st ? 880 : 540}px;height:${st ? 600 : 480}px;max-width:${st ? 520 : 470}px;object-fit:contain;object-position:right bottom;filter:drop-shadow(10px 12px 0 rgba(0,0,0,.28))}
.fim{position:absolute;left:60px;top:${st ? 1290 : 905}px;max-width:${st ? 520 : 500}px;font:400 ${Math.round(50 * k)}px/1.1 Gochi,cursive;background:${ET};color:${ET === CR ? AZ : CR};padding:12px 30px 18px;border-radius:22px;transform:rotate(-3deg);box-shadow:8px 8px 0 ${DQ}}
.as{position:absolute;left:54px;bottom:${st ? 330 : 50}px}
.fita{position:absolute;right:120px;top:${st ? 830 : 500}px;width:210px;height:54px;background:${DQ}aa;transform:rotate(6deg)}</style>
<img class="lg" src="${u('assets/originals/logo-roboterista-paul.png')}"><h1>${t1}<em>${t2}</em></h1><div class="sb">${sub}</div>
<div class="li">${itens.map((x) => `<div>${check(DQ)}${x}</div>`).join('')}</div>
${natal ? `<svg style="position:absolute;right:${st ? 70 : 60}px;top:${st ? 300 : 215}px" width="${st ? 180 : 130}" height="${st ? 258 : 186}" viewBox="0 0 230 330"><path d="M115 10 L40 110 L78 110 L20 200 L66 200 L8 290 L222 290 L164 200 L210 200 L152 110 L190 110 Z M95 290 L95 322 L135 322 L135 290" fill="none" stroke="${TX}" stroke-width="7" stroke-linejoin="round"/><path d="M115 -2 l8 16 l18 2 l-13 12 l4 18 l-17 -9 l-17 9 l4 -18 l-13 -12 l18 -2 z" fill="${DQ}" transform="translate(0 6) scale(.9) translate(13 0)"/></svg>` : ''}
<img class="c" src="${hd(paul)}"><div class="fim">${fim}</div><div class="as">${assin()}</div>`; };
export const TEMAS = [
  ['apresentacao', { t1: 'muito', t2: 'prazer!', sub: 'coragem também se treina', itens: ['confiança', 'novos amigos', 'grandes sonhos'], fim: 'juntos na mesma batida!', paul: 'selfie', cor: 'creme' }],
  ['rotina-e-treino', { t1: 'rotina', t2: 'e treino', sub: 'pequenos passos todo dia', itens: ['disciplina', 'foco', 'evolução'], fim: 'treino também é música!', paul: 'metronomo', cor: 'azul' }],
  ['figuras-e-tempo', { t1: 'figuras', t2: 'e tempo', sub: 'a base de tudo', itens: ['figuras', 'pausas', 'ritmo e tempo'], fim: 'entender é tocar melhor!', paul: 'professor', cor: 'creme' }],
  ['cantar-e-ouvir', { t1: 'cantar', t2: 'e ouvir', sub: 'a voz também é instrumento', itens: ['afinação', 'respiração', 'expressão'], fim: 'quem escuta bem toca melhor!', paul: 'microfone', cor: 'vinho' }],
  ['tocar-em-banda', { t1: 'tocar', t2: 'em banda', sub: 'juntos é mais legal', itens: ['escuta', 'respeito', 'som em equipe'], fim: 'cada um faz parte do som!', paul: 'guitarra', cor: 'creme' }],
  ['estudo-em-casa', { t1: 'estudo', t2: 'em casa', sub: 'qualquer lugar pode ser aula', itens: ['organização', 'foco', 'resultado'], fim: 'estudar também é evolução.', paul: 'produtor', cor: 'azul' }],
  ['resultados', { t1: 'olha os', t2: 'resultados', sub: 'você já evoluiu muito', itens: ['esforço', 'constância', 'conquistas'], fim: 'você consegue mais!', paul: 'oculos', cor: 'creme' }],
  ['diversao', { t1: 'hora da', t2: 'diversão', sub: 'música também é alegria', itens: ['jogos', 'criatividade', 'liberdade'], fim: 'aprenda também brincando!', paul: 'dj', cor: 'vinho' }],
  ['natal', { t1: 'feliz', t2: 'natal!', sub: 'música que une', itens: ['família', 'música', 'muita luz'], fim: 'que a música traga muita luz!', paul: 'pandeiro', cor: 'vinho', natal: true }],
  ['ferias', { t1: 'boas', t2: 'férias!', sub: 'descanso também faz parte', itens: ['natureza', 'família', 'novas histórias'], fim: 'recarregue pra voltar ainda mais forte!', paul: 'agua', cor: 'creme' }],
  ['volta-as-aulas', { t1: 'volta', t2: 'às aulas', sub: 'novos planos, novas músicas', itens: ['recomeços', 'metas', 'motivação'], fim: 'tá na hora de voltar com tudo!', paul: 'estudando', cor: 'azul' }],
  ['sonhos', { t1: 'sonhe', t2: 'alto', sub: 'a música leva longe', itens: ['planejamento', 'foco', 'futuro'], fim: 'sonhe, planeje, toque, conquiste!', paul: 'meditando', cor: 'creme' }],
];
// ---- molde "venda": etiqueta, título, preço ou imagem, linhas, Paul
const venda = ({ tag, t1, t2, preco, de, linhas = [], img, paul, cor, fim }, i) => { const [BG, TX, DQ, ET] = CORES[cor];
  return base(1080, 1920, cor, i + 3) + `<style>
.tg{position:absolute;left:64px;top:270px;font:800 34px Hanken,sans-serif;text-transform:uppercase;letter-spacing:.06em;background:${cor === 'vinho' ? AZ : VI};color:${CR};padding:12px 30px;border-radius:99px;transform:rotate(-3deg)}
h1{position:absolute;left:64px;right:60px;top:380px;font:400 ${Math.max(t1.length, t2.length) > 14 ? 92 : 116}px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0}h1 em{font-style:normal;display:block;color:${DQ};padding-left:44px}
.pr{position:absolute;left:64px;top:${img ? 1178 : 720}px;font:400 ${img ? 150 : 210}px/1 Anton,sans-serif;color:${DQ}}.de{position:absolute;left:70px;top:${img ? 1126 : 680}px;font:600 40px Hanken,sans-serif;text-decoration:line-through;opacity:.75}
.ln{position:absolute;left:70px;top:${preco ? (img ? 1345 : 960) : 760}px;width:${img ? 900 : 500}px;display:flex;flex-direction:column;gap:16px;font:400 54px/1.1 Gochi,cursive}.ln div{display:flex;gap:16px;align-items:center}
.im{position:absolute;left:90px;top:640px;width:350px;background:#fff;padding:16px 16px 20px;transform:rotate(-4deg);box-shadow:12px 14px 0 rgba(0,0,0,.3)}.im img{width:100%;display:block}
.fita{position:absolute;left:180px;top:612px;width:190px;height:52px;background:${DQ}bb;transform:rotate(-7deg)}
.c{position:absolute;right:10px;top:${img ? 700 : 900}px;height:${img ? 520 : 600}px;max-width:500px;object-fit:contain;object-position:right bottom;filter:drop-shadow(10px 12px 0 rgba(0,0,0,.28))}
.fim{position:absolute;left:60px;bottom:470px;max-width:560px;font:400 48px/1.1 Gochi,cursive;background:${ET};color:${ET === CR ? AZ : CR};padding:12px 30px 18px;border-radius:22px;transform:rotate(-3deg);box-shadow:8px 8px 0 ${DQ}}
.as{position:absolute;left:54px;bottom:330px}</style>
<div class="tg">${tag}</div><h1>${t1}<em>${t2}</em></h1>
${img ? `<div class="im"><img src="${u(img)}"></div><div class="fita"></div>` : ''}${de ? `<div class="de">${de}</div>` : ''}${preco ? `<div class="pr">${preco}</div>` : ''}
<div class="ln">${linhas.map((x) => `<div>${check(DQ)}${x}</div>`).join('')}</div><img class="c" src="${hd(paul)}">${fim ? `<div class="fim">${fim}</div>` : ''}<div class="as">${assin()}</div>`; };
export const VENDA = [
  ['enquete-1', { tag: 'me conta', t1: 'tem criança', t2: 'aprendendo música aí?', linhas: [], paul: 'bateria', cor: 'azul', fim: 'responde na enquete!' }],
  ['enquete-2', { tag: 'você escolhe', t1: 'qual instrumento', t2: 'o Paul aprende agora?', linhas: [], paul: 'guitarra', cor: 'creme', fim: 'manda na caixinha!' }],
  ['passe', { tag: 'passe beaterista', t1: 'mais de 15 jogos', t2: 'de música', linhas: ['o ano inteiro', 'pagamento único', 'dá pra começar grátis'], paul: 'selfie', cor: 'azul', fim: 'conhece o passe!' }],
  ['apostila', { tag: 'apostila do curso', t1: 'apostila', t2: 'bateria start', img: 'assets/loja/bateria-start.webp', linhas: ['44 páginas pra começar do zero'], paul: 'oculos', cor: 'vinho' }],
];
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch(); let n = 0;
  const tira = async (html, arq, w, h) => { fs.mkdirSync(path.dirname(arq), { recursive: true }); const tmp = path.join(path.dirname(arq), '.tmp.html'); fs.writeFileSync(tmp, html);
    const page = await browser.newPage({ viewport: { width: w, height: h } }); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    await page.screenshot({ path: arq, type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); n++; };
  const P = path.join(ROOT, 'marketing/prontos');
  for (const [i, [nome, d]] of (process.env.COM_TEMAS ? TEMAS : []).entries()) { const k = String(i + 1).padStart(2, '0');
    await tira(tema(d, 1080, 1920, i), path.join(P, 'stories-temas', `tema-${k}-${nome}-story.jpg`), 1080, 1920);
    await tira(tema(d, 1080, 1350, i), path.join(P, 'stories-temas', `tema-${k}-${nome}-post.jpg`), 1080, 1350); }
  for (const [i, [nome, d]] of VENDA.entries()) await tira(venda(d, i), path.join(P, 'stories-v2', `story-${nome}.jpg`), 1080, 1920);
  await browser.close(); console.log(n, 'imagens');
}
