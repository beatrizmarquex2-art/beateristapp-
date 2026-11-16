// Reels em forma de historinha, com os Pauls animados (GIFs de assets/paul/animado) como personagem.
// Identidade dos posts novos (azul e vinho, título Marker, balão em Gochi, assinatura da escola), sem som, sem preço, sem data.
// Cada cena troca de Paul (um GIF por cena). Termina no cartão "robôterista ensina" com chamada de venda.
// Uso: SAIDA=/pasta NODE_PATH=$(npm root -g) node scripts/reels-historinha.mjs [prefixo-do-reel]
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
const LOGO = u('assets/originals/logo-beaterista-dourado.png');
const GIFDIR = path.join(ROOT, 'assets/paul/animado');
const gif = (n) => path.join(GIFDIR, `paul-${n}.gif`);
const F = (n) => u(`assets/fonts/${n}`);
const FONTES = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}`;
const tela = (n) => u(`marketing/telas-app/app-${n}.jpg`);
const assin = `<div style="display:inline-flex;align-items:center;gap:16px;background:${AZ};color:${CR};padding:8px 30px 8px 8px;border-radius:99px;font:800 30px/1.15 Hanken,sans-serif;box-shadow:6px 6px 0 ${OU}"><img src="${LOGO}" style="height:84px"><span>Beaterista<br><span style="font-weight:500;font-size:25px">educação musical com propósito</span></span></div>`;
const mk = (s) => `<mark style="background:${OU};color:${AZ};padding:0 .2em;border-radius:6px;-webkit-box-decoration-break:clone;box-decoration-break:clone">${s}</mark>`;
const css = (bg, fg = CR) => `${FONTES}*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:${bg};color:${fg};position:relative;overflow:hidden;font-family:Hanken,sans-serif}.pt{position:absolute;inset:0;background:radial-gradient(${fg}1c 2px,transparent 2.6px) 0 0/34px 34px}`;

// cena: passo, título, balão (o Paul fica no meio, o GIF entra por cima no ffmpeg), cor de fundo
const cena = ({ passo, t1, t2, fala, cor = 'azul' }) => { const branco = cor === 'branco'; const bg = branco ? '#fbfbfa' : cor === 'vinho' ? VI : AZ, dq = branco ? VI : OU, fg = branco ? AZ : CR;
  return `<!doctype html><meta charset="utf-8"><style>${css(bg, fg)}</style><div class="pt"></div>
<div style="position:absolute;left:64px;top:96px;font:800 28px Hanken;letter-spacing:.1em;text-transform:uppercase;background:${dq};color:${branco ? CR : AZ};padding:8px 20px;border-radius:99px">${passo}</div>
<h1 style="position:absolute;left:64px;top:190px;font:400 112px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap">${t1}<em style="font-style:normal;display:block;color:${dq};padding-left:50px">${t2}</em></h1>
<div style="position:absolute;left:64px;right:64px;top:1330px;background:${branco ? AZ : CR};color:${branco ? CR : AZ};border-radius:26px;padding:26px 34px 30px;box-shadow:10px 10px 0 rgba(0,0,0,.35)"><p style="font:400 52px/1.2 Gochi,cursive">${fala}</p></div>
<div style="position:absolute;left:54px;bottom:60px">${assin}</div>`; };
const CTAS = [['tá esperando o quê?', 'acesse o site e jogue já!'], ['baixe o material e', 'jogue grátis'], ['acesse o site e', 'garanta seu acesso'], ['tá esperando o quê?', 'garanta seu acesso']];
const phone = (n, x, y, w, r) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 1.72)}px;border:9px solid #05070d;border-radius:${w / 8}px;overflow:hidden;background:${CR};transform:rotate(${r}deg);box-shadow:14px 16px 0 rgba(0,0,0,.4)"><img src="${tela(n)}" style="width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block"></div>`;
const final = ({ cta, telas }) => `<!doctype html><meta charset="utf-8"><style>${css(AZ)}</style><div class="pt"></div>
<h1 style="position:absolute;left:70px;top:200px;font:400 112px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap">robôterista<em style="font-style:normal;display:block;color:${OU};padding-left:50px">ensina</em></h1>
<div style="position:absolute;right:70px;top:270px;font:800 34px/1.2 Hanken;background:${CR};color:${AZ};padding:12px 26px;border-radius:99px;transform:rotate(4deg);text-align:center">jogos<br>e estudos</div>
${phone(telas[0], 70, 560, 330, -3)}${phone(telas[1], 420, 620, 330, 2)}
<div style="position:absolute;left:70px;top:1260px;font:400 56px Gochi,cursive;color:${OU}">${CTAS[cta][0]}</div>
<div style="position:absolute;left:70px;top:1340px;font:800 48px Hanken;background:${VI};padding:22px 42px;border-radius:99px;box-shadow:8px 8px 0 ${CR};white-space:nowrap">${CTAS[cta][1]}</div>
<div style="position:absolute;left:70px;top:1470px;font:700 40px Hanken">jogos.beaterista.com.br</div>
<div style="position:absolute;left:54px;bottom:60px">${assin}</div>`;

const REELS = {
  'historia-1-um-dia-de-estudo': { cta: 2, telas: ['estudos-home', 'acordes-teclado'], fimGif: 'palmas', cenas: [
    { gif: 'estudando', passo: 'cena 1', t1: 'hoje tem', t2: 'estudo!', fala: `vou fazer uma ${mk('aulinha')} de música.`, cor: 'branco' },
    { gif: 'agua', passo: 'cena 2', t1: 'pausa pra', t2: 'beber água', fala: `${mk('meta pequena')} por dia rende mais que treino solto.`, cor: 'vinho' },
    { gif: 'teclado', passo: 'cena 3', t1: 'agora é hora', t2: 'de treinar', fala: `ouvir o acorde e ${mk('tocar junto')}.`, cor: 'azul' },
    { gif: 'palmas', passo: 'cena 4', t1: 'consegui!', t2: 'eu evoluí', fala: `um passo de cada vez, e ${mk('a música aparece')}.`, cor: 'vinho' }] },
  'historia-2-a-banda-do-paul': { cta: 0, telas: ['paulbox', 'mapa'], fimGif: 'danca-v1', cenas: [
    { gif: 'cajon', passo: 'cena 1', t1: 'primeiro', t2: 'entra o ritmo', fala: `todo som começa com ${mk('uma batida')}.`, cor: 'azul' },
    { gif: 'teclado', passo: 'cena 2', t1: 'depois', t2: 'o teclado', fala: `as teclas ${mk('completam')} o ritmo.`, cor: 'vinho' },
    { gif: 'guitarra', passo: 'cena 3', t1: 'chega a', t2: 'guitarra', fala: `cada instrumento ${mk('troca o ritmo')} da banda.`, cor: 'azul' },
    { gif: 'bateria', passo: 'cena 4', t1: 'a bateria', t2: 'segura a base', fala: `quem toca bateria ${mk('conduz')} a música.`, cor: 'vinho' },
    { gif: 'microfone', passo: 'cena 5', t1: 'e agora', t2: 'eu canto!', fala: `${mk('monte a banda')} do Paul no PaulBox.`, cor: 'azul' }] },
  'historia-3-do-estudo-ao-palco': { cta: 3, telas: ['palco-bateria', 'hero-drum'], fimGif: 'danca-v2', cenas: [
    { gif: 'estudando', passo: 'cena 1', t1: 'primeiro', t2: 'eu estudo', fala: `ler, ouvir e entender ${mk('devagar')}.`, cor: 'branco' },
    { gif: 'bateria', passo: 'cena 2', t1: 'depois', t2: 'eu treino', fala: `treinar ${mk('toda semana')} deixa o ritmo no corpo.`, cor: 'vinho' },
    { gif: 'palmas', passo: 'cena 3', t1: 'e a plateia', t2: 'aplaude', fala: `errar faz parte. o importante é ${mk('continuar')}.`, cor: 'azul' },
    { gif: 'cantando', passo: 'cena 4', t1: 'agora é', t2: 'a minha vez!', fala: `quem ${mk('se apresenta')} cedo perde o medo do palco.`, cor: 'vinho' }] },
};

const SO = process.argv[2];
const browser = await chromium.launch();
const shot = async (html, file) => { const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 }); const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300); await page.screenshot({ path: file }); await page.close(); fs.rmSync(tmp); };
const D = 3.4, FIM = 3.6, PAUL = 720;
for (const [nome, r] of Object.entries(REELS)) {
  if (SO && !nome.startsWith(SO)) continue;
  const dir = path.join(OUT, 'cenas', nome); fs.mkdirSync(dir, { recursive: true });
  const itens = [];
  for (const [i, c] of r.cenas.entries()) { const p = path.join(dir, `c${i + 1}.png`); await shot(cena(c), p); itens.push({ p, d: D, gif: c.gif, w: PAUL, y: 520 }); }
  const pf = path.join(dir, 'fim.png'); await shot(final(r), pf); itens.push({ p: pf, d: FIM, gif: r.fimGif, w: 430, y: 1330, x: 'right' });
  const total = itens.reduce((s, x) => s + x.d, 0);
  const args = ['-loglevel', 'error', '-y'];
  itens.forEach((it) => args.push('-loop', '1', '-t', String(it.d), '-i', it.p));
  itens.forEach((it) => args.push('-stream_loop', '-1', '-t', String(it.d), '-i', gif(it.gif)));
  const g = itens.length, fl = [];
  itens.forEach((it, i) => {
    const pos = it.x === 'right' ? `x=W-w+10:y=H-h-90` : `x=(W-w)/2:y=${it.y}`;
    fl.push(`[${g + i}:v]scale=${it.w}:-1:flags=lanczos,format=rgba[p${i}]`);
    fl.push(`[${i}:v]scale=1080:1920,setsar=1,format=rgba[b${i}]`);
    fl.push(`[b${i}][p${i}]overlay=${pos}:shortest=1,format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st=${it.d - 0.25}:d=0.25[v${i}]`);
  });
  fl.push(`${itens.map((_, i) => `[v${i}]`).join('')}concat=n=${g}:v=1:a=0[out]`);
  args.push('-filter_complex', fl.join(';'), '-map', '[out]', '-t', String(total), '-an', '-r', '30', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-movflags', '+faststart', path.join(OUT, nome + '.mp4'));
  execFileSync('ffmpeg', args); console.log('ok', nome, total.toFixed(1) + 's');
}
await browser.close();
