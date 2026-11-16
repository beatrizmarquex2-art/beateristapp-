// Artes do app (banners do site, stories, posts em carrossel e reels com o Paul animado) na identidade dos posts novos:
// fundo azul pontilhado, título em Permanent Marker (creme + dourado), frases em Gochi Hand, grifo dourado, abinha de contexto,
// assinatura "Beaterista · educação musical com propósito". Sem laranja, sem preço, sem data. Reels sem som.
// Telas: marketing/telas-app/app-*.jpg (prints do app, sem o código nem a barra do celular).
// Uso: SAIDA=/pasta NODE_PATH=$(npm root -g) node scripts/arte-app-paul.mjs [banners|stories|posts|reels]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = process.env.SAIDA; fs.mkdirSync(OUT, { recursive: true });
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', OU = '#d8b879';
const hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const tela = (n) => u(`marketing/telas-app/app-${n}.jpg`);
const LOGO = u('assets/originals/logo-beaterista-dourado.png');
const GIF = Object.fromEntries(fs.readdirSync(path.join(ROOT, 'assets/paul/animado')).filter((n) => n.endsWith('.gif')).map((n) => [n.replace(/^paul-|\.gif$/g, ''), path.join(ROOT, 'assets/paul/animado', n)]));
const F = (n) => u(`assets/fonts/${n}`);
const FONTES = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}`;
const URLSITE = 'jogos.beaterista.com.br';
const CTAS = [['tá esperando o quê?', 'acesse o site e jogue já!'], ['baixe o material e', 'jogue grátis'], ['acesse o site e', 'garanta seu acesso'], ['tá esperando o quê?', 'garanta seu acesso']];

const mk = (s) => `<mark style="background:${OU};color:${AZ};padding:0 .2em;border-radius:6px;-webkit-box-decoration-break:clone;box-decoration-break:clone">${s}</mark>`;
const assin = (sz = 1) => `<div style="display:inline-flex;align-items:center;gap:${16 * sz}px;background:${AZ};color:${CR};padding:${8 * sz}px ${30 * sz}px ${8 * sz}px ${8 * sz}px;border-radius:99px;font:800 ${30 * sz}px/1.15 Hanken,sans-serif;box-shadow:6px 6px 0 ${OU}"><img src="${LOGO}" style="height:${84 * sz}px"><span>Beaterista<br><span style="font-weight:500;font-size:${25 * sz}px">educação musical com propósito</span></span></div>`;
const phone = (nome, x, y, w, r = 0, h = 1.72) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * h)}px;border:${Math.max(8, w / 40)}px solid #05070d;border-radius:${w / 8}px;overflow:hidden;background:${CR};transform:rotate(${r}deg);box-shadow:14px 16px 0 rgba(0,0,0,.4)"><img src="${tela(nome)}" style="width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block"></div>`;
const etiqueta = (t, x, y, r = -4) => `<div style="position:absolute;left:${x}px;top:${y}px;font:400 36px Gochi,cursive;background:${OU};color:${AZ};padding:2px 22px 7px;border-radius:12px;transform:rotate(${r}deg);z-index:5">${t}</div>`;
const abinha = (nota, x, y, w) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;background:${CR};color:${AZ};border-radius:18px;padding:16px 24px 20px;box-shadow:8px 8px 0 rgba(0,0,0,.35)"><b style="display:inline-block;background:${VI};color:${CR};font:800 20px Hanken;letter-spacing:.08em;text-transform:uppercase;padding:4px 14px;border-radius:99px">${nota[0]}</b><p style="font:400 38px/1.15 Gochi,cursive;margin-top:8px">${nota[1]}</p></div>`;
const baseCss = (w, h) => `${FONTES}*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;background:${AZ};color:${CR};position:relative;overflow:hidden;font-family:Hanken,sans-serif}.pt{position:absolute;inset:0;background:radial-gradient(${CR}1c 2px,transparent 2.6px) 0 0/34px 34px}h1{position:absolute;font:400 112px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:${OU};padding-left:50px}`;
const doc = (w, h, inner) => `<!doctype html><meta charset="utf-8"><style>${baseCss(w, h)}</style><div class="pt"></div>${inner}`;

// ---------- STORY / CENA DE REEL (1080×1920). paul: PNG parado (story) ou null (no reel o Paul animado entra por cima, no canto de baixo à direita) ----------
const story = ({ t1, t2, phones, nota, paul = null, tags = [], ps = 1, aw = 0 }) => doc(1080, 1920, `<h1 style="left:64px;top:150px">${t1}<em>${t2}</em></h1>
${phones.map(([n, x, y, w, r]) => phone(n, x, y, w, r)).join('')}${tags.map(([t, x, y, r]) => etiqueta(t, x, y, r)).join('')}
${abinha(nota, 64, 1400, aw || (ps > 1 ? 500 : 640))}${paul ? `<img src="${hd(paul)}" style="position:absolute;right:${ps > 1 ? -10 : 20}px;bottom:${ps > 1 ? 110 : 130}px;height:${Math.round(430 * ps)}px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))">` : ''}
<div style="position:absolute;left:54px;bottom:60px">${assin()}</div>`);
const finalCard = ({ cta = 0, paul = null, phones = [['hero-drum', 70, 560, 330, -3], ['figurix', 420, 620, 330, 2]] }) => doc(1080, 1920, `<h1 style="left:70px;top:200px">robôterista<em>ensina</em></h1>
<div style="position:absolute;right:70px;top:270px;font:800 34px/1.2 Hanken;background:${CR};color:${AZ};padding:12px 26px;border-radius:99px;transform:rotate(4deg);text-align:center">jogos<br>e estudos</div>
${phones.map(([n, x, y, w, r]) => phone(n, x, y, w, r)).join('')}
<div style="position:absolute;left:70px;top:1260px;font:400 56px Gochi,cursive;color:${OU}">${CTAS[cta][0]}</div>
<div style="position:absolute;left:70px;top:1340px;font:800 48px Hanken;background:${VI};padding:22px 42px;border-radius:99px;box-shadow:8px 8px 0 ${CR};white-space:nowrap">${CTAS[cta][1]}</div>
<div style="position:absolute;left:70px;top:1470px;font:700 40px Hanken">${URLSITE}</div>
${paul ? `<img src="${hd(paul)}" style="position:absolute;right:20px;bottom:100px;height:390px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))">` : ''}
<div style="position:absolute;left:54px;bottom:60px">${assin()}</div>`);

// ---------- POST (1080×1350) ----------
const post = ({ t1, t2, phone: [n, x, y, w, r], nota, paul, rodape = true, ps = 1 }) => doc(1080, 1350, `<h1 style="left:64px;top:84px;font-size:96px">${t1}<em>${t2}</em></h1>
${phone(n, x, y, w, r)}<img src="${hd(paul)}" style="position:absolute;right:${ps > 1 ? -10 : 10}px;bottom:${ps > 1 ? 150 : 170}px;height:${Math.round(400 * ps)}px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))">
${abinha(nota, 64, 1065, ps > 1 ? 560 : 640)}${rodape ? `<div style="position:absolute;left:54px;bottom:36px">${assin(.8)}</div>` : ''}`);

// ---------- BANNER do site (1200×600) ----------
const banner = ({ t1, t2, sub, phones, cta = 'jogar agora' }) => doc(1200, 600, `<h1 style="left:60px;top:70px;font-size:84px">${t1}<em>${t2}</em></h1>
<div style="position:absolute;left:60px;top:290px;width:600px;font:400 36px/1.2 Gochi,cursive">${sub}</div>
<div style="position:absolute;left:60px;top:485px;font:800 34px Hanken;background:${OU};color:${AZ};padding:16px 34px;border-radius:99px;box-shadow:6px 6px 0 rgba(0,0,0,.35)">${cta}</div>
${phones.map(([n, x, y, w, r]) => phone(n, x, y, w, r)).join('')}
<img src="${LOGO}" style="position:absolute;left:430px;top:470px;height:100px">`);

const STORIES = {
  'story-1-oi-eu-sou-o-paul': () => doc(1080, 1920, `<h1 style="left:70px;top:150px">oi, eu sou<em>o paul!</em></h1>
<div style="position:absolute;left:70px;top:470px;font:400 48px/1.15 Gochi,cursive;width:470px">Robôterista Paul, assistente da Bea</div>
<div style="position:absolute;left:60px;top:700px;font:400 44px Gochi,cursive;background:${OU};color:${AZ};padding:10px 24px 14px;border-radius:18px;transform:rotate(-2deg)">aqui a gente joga</div>
<div style="position:absolute;left:100px;top:820px;font:400 44px Gochi,cursive;background:${CR};color:${AZ};padding:10px 24px 14px;border-radius:18px;transform:rotate(1.5deg)">aprende música</div>
<div style="position:absolute;left:60px;top:940px;font:400 44px Gochi,cursive;background:${VI};color:${CR};padding:10px 24px 14px;border-radius:18px;transform:rotate(-1.5deg)">e toca de verdade</div>
<img src="${hd('selfie')}" style="position:absolute;right:-90px;top:640px;height:730px;filter:drop-shadow(10px 12px 0 rgba(0,0,0,.25))">
<div style="position:absolute;left:70px;top:1560px;font:400 50px Gochi,cursive">começa grátis, é só entrar:</div>
<div style="position:absolute;left:70px;top:1640px;font:800 44px Hanken;background:${CR};color:${AZ};padding:20px 36px;border-radius:99px">${URLSITE}</div>
<img src="${LOGO}" style="position:absolute;right:60px;bottom:60px;height:120px">`),
  'story-2-jogos': () => story({ t1: 'jogue e aprenda', t2: 'ao mesmo tempo', phones: [['hero-drum', 70, 470, 440, -3], ['figurix', 570, 560, 440, 3]], tags: [['jogos', 90, 440, -5]], nota: ['didática', 'cada jogo treina uma coisa: ritmo, figuras, escuta.'], paul: 'oculos' }),
  'story-3-estudos': () => story({ t1: 'estude com', t2: 'o Paul', phones: [['estudos-lista', 70, 470, 440, -3], ['acordes-violao', 570, 560, 440, 3]], tags: [['estudos', 90, 440, -5]], nota: ['educação', 'com a ajuda do Paul, o Robôterista assistente da Bea: teoria, bateria, teclado e violão.'], paul: 'professor' }),
  'story-4-palco': () => story({ t1: 'toque na tela', t2: 'de verdade', phones: [['palco-bateria', 70, 470, 440, -3], ['palco-acordes', 570, 560, 440, 3]], tags: [['palco', 90, 440, -5]], nota: ['música', 'bateria, acordes e notas pra tocar no celular ou no tablet.'], paul: 'bateria' }),
  'story-5-banda-do-paul': () => story({ t1: 'monte a banda', t2: 'do Paul', phones: [['paulbox', 70, 470, 440, -3], ['mapa', 570, 560, 440, 3]], tags: [['PaulBox', 90, 440, -5]], nota: ['criatividade', 'escolha os instrumentos e troque o ritmo de cada um.'], paul: 'maestro', ps: 1.25 }),
  'story-6-jogue-agora': () => finalCard({ cta: 0, paul: 'selfie' }),
};
const POSTS = {
  'post-1-jogos': () => post({ t1: 'jogue e aprenda', t2: 'ao mesmo tempo', phone: ['hero-drum', 100, 290, 420, -2], nota: ['didática', 'cada jogo treina uma coisa: ritmo, figuras, escuta.'], paul: 'oculos' }),
  'post-2-estudos': () => post({ t1: 'estude com', t2: 'o Paul', phone: ['estudos-lista', 100, 290, 420, 2], nota: ['educação', 'com a ajuda do Paul, o Robôterista assistente da Bea.'], paul: 'professor' }),
  'post-3-palco': () => post({ t1: 'toque na tela', t2: 'de verdade', phone: ['palco-bateria', 100, 290, 420, -2], nota: ['música', 'bateria, acordes e notas pra tocar no celular ou no tablet.'], paul: 'bateria' }),
  'post-4-acordes': () => post({ t1: 'veja, ouça', t2: 'e toque o acorde', phone: ['acordes-violao', 100, 290, 420, 2], nota: ['música', 'violão, guitarra, baixo e teclado: o desenho e o som.'], paul: 'guitarra', ps: 1.25 }),
  'post-5-banda': () => post({ t1: 'monte a banda', t2: 'do Paul', phone: ['paulbox', 100, 290, 420, -2], nota: ['criatividade', 'escolha os instrumentos e troque o ritmo de cada um.'], paul: 'maestro', ps: 1.25 }),
};
const BANNERS = {
  'banner-1-joga-aprende-toca': () => banner({ t1: 'jogue, aprenda', t2: 'e toque', sub: 'jogos, estudos e palco com o Robôterista Paul, assistente da Bea', phones: [['hero-drum', 700, 60, 250, -3], ['figurix', 940, 110, 250, 3]] }),
  'banner-2-estudos': () => banner({ t1: 'estude com', t2: 'o Paul', sub: 'com o Paul, o Robôterista assistente da Bea: teoria, bateria, teclado e violão', phones: [['estudos-lista', 700, 60, 250, -3], ['acordes-violao', 940, 110, 250, 3]] }),
  'banner-3-palco': () => banner({ t1: 'toque na tela', t2: 'de verdade', sub: 'bateria, acordes e notas para tocar no celular ou no tablet', phones: [['palco-bateria', 700, 60, 250, -3], ['palco-acordes', 940, 110, 250, 3]] }),
  'banner-4-banda-do-paul': () => banner({ t1: 'monte a banda', t2: 'do Paul', sub: 'escolha os instrumentos e troque o ritmo de cada um', phones: [['paulbox', 700, 60, 250, -3], ['mapa', 940, 110, 250, 3]] }),
};
// reels: cenas (3,6 s cada) + cartão final (3,5 s) e o Paul animado (GIF) no canto de baixo à direita, sempre
const REELS = {
  'reel-1-o-app-por-dentro': { gif: 'danca', cta: 0, cenas: [
    { t1: 'jogue', t2: 'e aprenda', phones: [['hero-drum', 70, 470, 440, -3], ['figurix', 570, 560, 440, 3]], tags: [['jogos', 90, 440, -5]], nota: ['didática', 'cada jogo treina uma coisa: ritmo, figuras, escuta.'] },
    { t1: 'estude', t2: 'com o Paul', phones: [['estudos-lista', 70, 470, 440, -3], ['acordes-violao', 570, 560, 440, 3]], tags: [['estudos', 90, 440, -5]], nota: ['educação', 'com a ajuda do Paul, o Robôterista assistente da Bea: teoria, bateria, teclado e violão.'] },
    { t1: 'toque', t2: 'na tela', phones: [['palco-bateria', 70, 470, 440, -3], ['palco-acordes', 570, 560, 440, 3]], tags: [['palco', 90, 440, -5]], nota: ['música', 'bateria, acordes e notas pra tocar no celular ou no tablet.'] }] },
  'reel-2-estudar-jogando': { gif: 'palmas', cta: 2, cenas: [
    { t1: 'figuras', t2: 'rítmicas', phones: [['figurix', 70, 470, 440, -3], ['uno', 570, 560, 440, 3]], tags: [['jogos', 90, 440, -5]], nota: ['didática', 'reconhecer as figuras é o segredo: no Figurix e no Uno Musical.'] },
    { t1: 'monte a banda', t2: 'do Paul', phones: [['paulbox', 70, 470, 440, -3], ['mapa', 570, 560, 440, 3]], tags: [['PaulBox', 90, 440, -5]], nota: ['criatividade', 'escolha os instrumentos e troque o ritmo de cada um.'] },
    { t1: 'e tem aulas', t2: 'também', phones: [['estudos-home', 70, 470, 440, -3], ['estudos-lista', 570, 560, 440, 3]], tags: [['estudos', 90, 440, -5]], nota: ['educação', 'dicas do Paul, dicionário musical e aulinhas de instrumento.'] }] },
  'reel-3-toca-na-tela': { gif: 'danca', cta: 3, cenas: [
    { t1: 'bateria', t2: 'na tela', phones: [['palco-bateria', 70, 470, 440, -3], ['hero-drum', 570, 560, 440, 3]], tags: [['palco', 90, 440, -5]], nota: ['música', 'acústica, eletrônica ou cajón: escolha o modelo e toque.'] },
    { t1: 'toque os', t2: 'acordes', phones: [['palco-acordes', 70, 470, 440, -3], ['acordes-teclado', 570, 560, 440, 3]], tags: [['acordes', 90, 440, -5]], nota: ['música', 'monte a sequência de acordes e ouça o resultado.'] },
    { t1: 'veja as notas', t2: 'no braço', phones: [['palco-notas', 70, 470, 440, -3], ['acordes-violao', 570, 560, 440, 3]], tags: [['notas', 90, 440, -5]], nota: ['educação', 'o nome de cada nota no braço do violão, corda por corda.'] }] },
  'reel-4-estude-com-o-paul': { gif: 'oculos', cta: 2, cenas: [
    { t1: 'estude com', t2: 'o Paul', phones: [['estudos-home', 70, 470, 440, -3], ['estudos-lista', 570, 560, 440, 3]], tags: [['estudos', 90, 440, -5]], nota: ['educação', 'com a ajuda do Paul, o Robôterista assistente da Bea.'] },
    { t1: 'teoria em', t2: 'aulinhas curtas', phones: [['estudos-lista', 70, 470, 440, -3], ['acordes-teclado', 570, 560, 440, 3]], tags: [['estudos', 90, 440, -5]], nota: ['didática', 'um passo de cada vez: bateria, teclado e violão.'] },
    { t1: 'veja e ouça', t2: 'os acordes', phones: [['acordes-violao', 70, 470, 440, -3], ['acordes-teclado', 570, 560, 440, 3]], tags: [['acordes', 90, 440, -5]], nota: ['música', 'cada acorde com o desenho e o som.'] }] },
  'reel-5-toque-a-bateria': { gif: 'bateria', cta: 3, ps: 520, cenas: [
    { t1: 'toque a', t2: 'bateria na tela', phones: [['palco-bateria', 70, 470, 440, -3], ['hero-drum', 570, 560, 440, 3]], tags: [['palco', 90, 440, -5]], nota: ['música', 'acústica, eletrônica ou cajón: escolha o modelo e toque.'] },
    { t1: 'jogue e', t2: 'siga o ritmo', phones: [['hero-drum', 70, 470, 440, -3], ['figurix', 570, 560, 440, 3]], tags: [['jogos', 90, 440, -5]], nota: ['didática', 'o jogo mostra o ritmo e você toca junto.'] }] },
  'reel-6-acordes-e-notas': { gif: 'guitarra', cta: 0, cenas: [
    { t1: 'toque os', t2: 'acordes', phones: [['palco-acordes', 70, 470, 440, -3], ['acordes-violao', 570, 560, 440, 3]], tags: [['palco', 90, 440, -5]], nota: ['música', 'monte a sequência de acordes e ouça o resultado.'] },
    { t1: 'veja as notas', t2: 'no braço', phones: [['palco-notas', 70, 470, 440, -3], ['palco-acordes', 570, 560, 440, 3]], tags: [['notas', 90, 440, -5]], nota: ['educação', 'o nome de cada nota no braço do violão, corda por corda.'] }] },
};

const SO = process.argv[2];
const browser = await chromium.launch();
const shot = async (html, w, h, file, tipo = 'png') => {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  await page.screenshot({ path: file, type: tipo === 'jpg' ? 'jpeg' : 'png', ...(tipo === 'jpg' ? { quality: 92 } : {}) }); await page.close(); fs.rmSync(tmp);
};
const sub = (n) => { const d = path.join(OUT, n); fs.mkdirSync(d, { recursive: true }); return d; };
if (!SO || SO === 'banners') for (const [n, f] of Object.entries(BANNERS)) { await shot(f(), 1200, 600, path.join(sub('banners'), n + '.jpg'), 'jpg'); console.log('ok', n); }
if (!SO || SO === 'stories') for (const [n, f] of Object.entries(STORIES)) { await shot(f(), 1080, 1920, path.join(sub('stories'), n + '.jpg'), 'jpg'); console.log('ok', n); }
if (!SO || SO === 'posts') for (const [n, f] of Object.entries(POSTS)) { await shot(f(), 1080, 1350, path.join(sub('posts'), n + '.jpg'), 'jpg'); console.log('ok', n); }
if (!SO || SO === 'reels') {
  const D = 3.6, FIM = 3.5;
  for (const [nome, r] of Object.entries(REELS)) {
    const dir = sub('reels-cenas/' + nome); const png = [];
    for (const [i, c] of r.cenas.entries()) { const p = path.join(dir, `c${i + 1}.png`); await shot(story({ ...c, aw: (r.ps || 430) > 430 ? 470 : 540 }), 1080, 1920, p); png.push([p, D]); }
    const pf = path.join(dir, 'fim.png'); await shot(finalCard({ cta: r.cta }), 1080, 1920, pf); png.push([pf, FIM]);
    const total = png.reduce((s, x) => s + x[1], 0);
    const args = ['-loglevel', 'error', '-y'];
    png.forEach(([p, d]) => args.push('-loop', '1', '-t', String(d), '-i', p));
    args.push('-stream_loop', '-1', '-i', GIF[r.gif]);
    const g = png.length;
    const fl = png.map(([, d], i) => `[${i}:v]scale=1080:1920,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${d - 0.25}:d=0.25[v${i}]`);
    fl.push(`${png.map((_, i) => `[v${i}]`).join('')}concat=n=${g}:v=1:a=0[bg]`);
    fl.push(`[${g}:v]scale=${r.ps || 430}:-1:flags=lanczos,format=rgba[pa]`);
    fl.push(`[bg][pa]overlay=x=W-w+${(r.ps || 430) > 430 ? 10 : -10}:y=H-h-${(r.ps || 430) > 430 ? 90 : 110}:shortest=0,format=yuv420p[out]`);
    args.push('-filter_complex', fl.join(';'), '-map', '[out]', '-t', String(total), '-an', '-r', '30', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-movflags', '+faststart', path.join(sub('reels'), nome + '.mp4'));
    execFileSync('ffmpeg', args); console.log('ok', nome, total + 's');
  }
}
await browser.close();
