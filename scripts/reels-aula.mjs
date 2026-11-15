// Reels a partir dos vídeos da Bea (aula, show, pequenos). Vídeo bruto e reel com aluno NÃO entram no repo: tudo por pasta de fora.
// Uso: VIDEOS=/pasta/dos/.mov SAIDA=/pasta node scripts/reels-aula.mjs
// Cada reel: cortes de 2,5 a 4 s em 1080×1920, título em cima, Paul e site embaixo, batida gerada (marketing/reels/beat.py, sem direito autoral).
// "verde: true" troca a luz verde por azul (a Bea não quer verde). "crop" = [x, y, w, h] em fração do quadro, pra tirar pé/perna de quem filma.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const V = process.env.VIDEOS, OUT = process.env.SAIDA; fs.mkdirSync(OUT, { recursive: true });
const hdr = (f) => /arib-std-b67|smpte2084/.test(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=color_transfer', '-of', 'csv=p=0', f]).toString());
const SDR = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,';
const dura = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
// melhor trecho: 4 quadros/s em 48×48 cinza, soma da diferença entre quadros; devolve o início (múltiplo de 0,25 s) da janela de d segundos com mais movimento
const melhor = (f, d) => { const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, '-vf', 'fps=4,scale=48:48,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 }); const N = Math.floor(b.length / 2304), df = [];
  for (let k = 1; k < N; k++) { let s = 0; for (let p = 0; p < 2304; p++) s += Math.abs(b[k * 2304 + p] - b[(k - 1) * 2304 + p]); df.push(s); }
  const w = Math.round(d * 4), lim = Math.min(df.length - w, Math.floor((dura(f) - d - 0.1) * 4)); let bi = 0, bs = -1;
  for (let k = 0; k <= lim; k++) { let s = 0; for (let q = k; q < k + w; q++) s += df[q]; if (s > bs) { bs = s; bi = k; } } return Math.max(0, bi / 4); };
const acha = (id) => path.join(V, fs.readdirSync(V).find((f) => f.includes(id)));
// A Bea pediu pra NÃO misturar: pad com pad, bateria com bateria.
export const REELS = {
  // ini 'auto' = pega o trecho com mais movimento do vídeo (a Bea pediu "só a melhor parte")
  'pad-1-treino-no-pad': { cta: 1, telas: ['beathero', 'detetive'], capas: ['ritmo', 'pratica'], t1: 'treino', t2: 'no pad', paul: 'metronomo', marca: 'gorilla', fim: ['o treino segue', 'no jogo', 'o treino do pad continua no jogo: rudimentos e ritmo pra estudar em casa'], clipes: [['IMG_6973', 'auto', 3], ['IMG_9033', 'auto', 3], ['IMG_9007', 'auto', 3], ['IMG_9004', 'auto', 3], ['a0e5e4cb', 'auto', 3, { verde: true }]] },
  'eletronica-1-bateria-eletronica': { marca: 'nagano', cta: 0, telas: ['toque', 'beathero'], t1: 'bateria', t2: 'eletrônica', paul: 'bateria', fim: ['sem bateria', 'em casa?', 'sem bateria em casa? toca na tela e treina com os jogos'], clipes: [['IMG_7199', 'auto', 3], ['IMG_7207', 'auto', 4], ['IMG_7198', 0, 2.5]] },
  'eletronica-2-bateria-de-tapete': { cta: 2, telas: ['toque', 'beathero'], capas: ['bateria-kids', 'ritmo'], t1: 'bateria', t2: 'de tapete', paul: 'bateria', fim: ['cabe na', 'mochila', 'cabe na mochila, e o treino cabe no celular'], clipes: [['IMG_4462', 'auto', 3.5], ['IMG_4477', 'auto', 3.5], ['IMG_4944', 'auto', 3.5]] },
  'percussao-1-percussao': { cta: 0, telas: ['figurix', 'beathero'], capas: ['ritmo', 'memoria'], t1: 'aula de', t2: 'percussão', paul: 'cajon', marca: 'spark', fim: ['o ritmo começa', 'na mão', 'o ritmo começa na mão e continua nos jogos de ritmo'], clipes: [['IMG_4794', 'auto', 3.5], ['IMG_1431', 'auto', 3.5], ['IMG_1441', 'auto', 3.5, { crop: [0, 0.16, 0.65, 0.65] }]] },
  'bateria-1-agora-na-bateria': { cta: 3, telas: ['beathero', 'toque'], t1: 'agora', t2: 'na bateria', paul: 'bateria', marca: 'nagano', fim: ['do jogo', 'pra bateria', 'do jogo pra bateria: primeiro na tela, depois de verdade'], clipes: [['copy_9F', 'auto', 4], ['IMG_3741', 'auto', 3.5, { verde: true }], ['IMG_6050', 'auto', 3.5], ['IMG_3740', 'auto', 3, { verde: true }]] }, // sem o IMG_6629: a Bea viu coisa do Pad Gorilla nele
  'aula-3-dia-de-show': { cta: 2, telas: ['beathero', 'paulta'], capas: ['bateria-kids', 'colorir'], fim: ['seu filho', 'no palco', 'antes do palco, o treino começa brincando'],  t1: 'dia de show', t2: 'na escola', paul: 'microfone', clipes: [['IMG_6045', 1, 3.5], ['IMG_6054', 2, 4]] },
  'aula-6-a-bea-no-palco': { cta: 0, telas: ['beathero', 'paulta'], capas: ['mood', 'ritmo'], fim: ['eu ensino', 'o que eu toco', 'o que eu toco no palco vira jogo e material pra você'],  t1: 'a bea', t2: 'no palco', paul: 'bateria', clipes: [['MVI_8419', 0, 3.5, { gira: true }], ['MVI_8407', 0.5, 5, { gira: true }]] },
  'teclado-1-aula-de-teclado': { cta: 0, telas: ['paulta', 'acordes'], capas: ['harmonia', 'ritmo'], fim: ['não é só', 'bateria', 'no site tem jogo pra você ir aprendendo as notas na pauta'],  t1: 'aula de', t2: 'teclado', paul: 'teclado', clipes: [['IMG_7845', 'auto', 3.5], ['IMG_7847', 'auto', 3.5], ['IMG_7848', 'auto', 3.5]] },
  'teclado-3-primeiras-notas': { cta: 1, telas: ['paulta', 'acordes'], capas: ['harmonia', 'memoria'], fim: ['as primeiras', 'notas', 'no site tem jogo pra você ir aprendendo as notas na pauta'],  t1: 'primeiras', t2: 'notas', paul: 'teclado', clipes: [['IMG_3879', 'auto', 4.5], ['IMG_3962', 'auto', 4.5]] },
  'aula-5-musica-desde-pequeno': { cta: 1, telas: ['figurix', 'toque'], capas: ['colorir', 'bateria-kids'], fim: ['música', 'desde cedo', 'jogos e materiais pra aprender música brincando'],  t1: 'música', t2: 'desde pequeno', paul: 'pandeiro', clipes: [['IMG_8788', 2, 5], ['IMG_1441', 2, 4, { crop: [0, 0.16, 0.65, 0.65] }]] },
};
// logos dos parceiros SEMPRE em branco, PNG sem fundo (pedido da Bea): assets/parceiros-branco/
const MARCAS = { gorilla: ['assets/parceiros-branco/pad-gorilla.png', 'height:84px'], spark: ['assets/parceiros-branco/spark.png', 'height:84px'], nagano: ['assets/parceiros-branco/nagano.png', 'height:120px'] };
const FONTES = `@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')})}`;
// CARTÃO FINAL (3,5 s), pedido da Bea: "materiais e jogos" + prévia de como é (2 telas de jogo + 2 capas) + chamada + logos EMBAIXO.
// chamadas: só as frases dela, mescladas (pre + botão). Nunca "joga grátis".
const TELAS = { beathero: '59f03481c1a887c9', toque: '53c9b526fedbefb3', paulta: 'a6053f0358e0bd84', figurix: 'c0c549a9b88ef20b', acordes: '02eded2a16dc87b7', detetive: '7dfe2be6cd132427' };
const CTAS = [['tá esperando o quê?', 'acesse o site e jogue já!'], ['baixe o material e', 'jogue grátis'], ['acesse o site e', 'garanta seu acesso'], ['tá esperando o quê?', 'garanta seu acesso']];
const final = ({ fim, paul, marca, cta = 0, telas = ['beathero', 'toque'], capas = ['ritmo', 'colorir'] }) => `<!doctype html><meta charset="utf-8"><style>${FONTES}*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#0d1a36;color:#f4ead8;position:relative;overflow:hidden}
.p{position:absolute;inset:0;background:radial-gradient(#f4ead81c 2px,transparent 2.6px) 0 0/34px 34px}
h1{position:absolute;left:70px;top:240px;font:400 116px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:#d8b879;padding-left:50px}
.s{position:absolute;left:70px;right:70px;top:520px;font:400 50px/1.12 Gochi,cursive;text-wrap:balance}
.t{position:absolute;top:680px;width:300px;height:520px;border-radius:30px;border:8px solid #f4ead8;overflow:hidden;box-shadow:10px 12px 0 rgba(0,0,0,.4);background:#f4ead8}.t img{width:100%;display:block}
.k{position:absolute;left:740px;width:270px;height:250px;border-radius:18px;border:6px solid #f4ead8;overflow:hidden;box-shadow:10px 12px 0 rgba(0,0,0,.4)}.k img{width:100%;height:100%;object-fit:cover;display:block}
.et{position:absolute;font:400 34px Gochi,cursive;background:#d8b879;color:#0d1a36;padding:2px 18px 6px;border-radius:12px;transform:rotate(-4deg)}
.pre{position:absolute;left:70px;top:1236px;font:400 56px Gochi,cursive;color:#d8b879}
.b{position:absolute;left:70px;top:1306px;white-space:nowrap;font:800 54px Hanken,sans-serif;background:#a8182e;padding:22px 44px;border-radius:99px;box-shadow:8px 8px 0 #f4ead8}
.u{position:absolute;left:70px;top:1428px;font:700 40px Hanken,sans-serif}
.c{position:absolute;right:20px;top:1190px;height:280px;filter:drop-shadow(10px 12px 0 rgba(0,0,0,.4))}
.m{position:absolute;left:70px;right:70px;bottom:330px;display:flex;align-items:center;gap:18px;font:800 32px/1.15 Hanken,sans-serif}.m .sl{height:92px}.m .mk{margin-left:auto}</style>
<div class="p"></div><h1>materiais<em>e jogos</em></h1><div class="s">${fim[2]}</div>
<div class="t" style="left:70px;transform:rotate(-3deg)"><img src="${u('vendas/assets/' + TELAS[telas[0]] + '.webp')}"></div><div class="t" style="left:400px;transform:rotate(2deg)"><img src="${u('vendas/assets/' + TELAS[telas[1]] + '.webp')}"></div>
<div class="k" style="top:680px;transform:rotate(3deg)"><img src="${u('assets/loja/' + capas[0] + '.webp')}"></div><div class="k" style="top:950px;transform:rotate(-3deg)"><img src="${u('assets/loja/' + capas[1] + '.webp')}"></div>
<div class="et" style="left:90px;top:650px">jogos</div><div class="et" style="left:770px;top:650px">materiais</div>
<div class="pre">${CTAS[cta][0]}</div><div class="b">${CTAS[cta][1]}</div><div class="u">jogos.beaterista.com.br</div><img class="c" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${paul}.png`)}">
<div class="m"><img class="sl" src="${u('assets/originals/logo-beaterista-dourado.png')}"><span>Beaterista<br><span style="font-weight:500;font-size:26px">educação musical com propósito</span></span>${marca ? `<img class="mk" src="${u(MARCAS[marca][0])}" style="${MARCAS[marca][1]}">` : ''}</div>`;
const capa = ({ t1, t2, paul, marca }) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;background:transparent}
.g1{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(13,26,54,.92),rgba(13,26,54,0))}
.g2{position:absolute;left:0;right:0;bottom:0;height:520px;background:linear-gradient(0deg,rgba(13,26,54,.9),rgba(13,26,54,0))}
h1{position:absolute;left:64px;top:150px;font:400 112px/.98 Marker,cursive;color:#f4ead8;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:#d8b879;padding-left:46px}
.u{position:absolute;left:64px;bottom:330px;font:700 38px Hanken,sans-serif;background:#0d1a36;color:#f4ead8;padding:18px 32px;border-radius:99px}
.c{position:absolute;right:20px;bottom:450px;height:360px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.35))}</style>
<div class="g1"></div><div class="g2"></div><h1>${t1}<em>${t2}</em></h1><div style="position:absolute;left:54px;right:54px;bottom:330px;display:flex;align-items:center;gap:26px">${marca ? `<img src="${u(MARCAS[marca][0])}" style="${MARCAS[marca][1]};order:2;margin-left:auto">` : ''}<div class="u" style="position:static;display:flex;align-items:center;gap:16px;padding:8px 28px 8px 8px;font:800 31px/1.15 Hanken,sans-serif"><img src="${u('assets/originals/logo-beaterista-dourado.png')}" style="height:84px"><span>Beaterista<br><span style="font-weight:500;font-size:25px">educação musical com propósito</span></span></div></div><img class="c" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${paul}.png`)}">`;
const browser = await chromium.launch();
const SO = process.env.SO; // SO=teclado -> só os reels cujo nome começa assim
for (const [nome, r] of Object.entries(REELS)) { if (SO && !SO.split(',').some((s) => nome.startsWith(s))) continue;
  const png = path.join(OUT, nome + '.png'), tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, capa(r));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: png, omitBackground: true }); await page.close(); 
  const FIM = r.fim ? 3.5 : 0, pngF = path.join(OUT, nome + '-fim.png');
  if (FIM) { fs.writeFileSync(tmp, final(r)); const p2 = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await p2.goto(pathToFileURL(tmp).href); await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(300); await p2.screenshot({ path: pngF }); await p2.close(); }
  const durC = r.clipes.reduce((s, c) => s + c[2], 0), dur = durC + FIM, wav = path.join(OUT, nome + '.wav');
  execFileSync('python3', [path.join(ROOT, 'marketing/reels/beat.py'), wav, String(dur), ...(FIM ? [String(durC)] : [])]);
  const ins = [], fl = [];
  r.clipes.forEach(([id, ini, d, o = {}], i) => {
    const arq = acha(id); if (ini === 'auto') ini = melhor(arq, d);
    ins.push('-ss', String(ini), '-t', String(d), '-i', arq);
    const ro = o.gira ? 'transpose=2,' : ''; // vídeo gravado deitado: gira pra ficar em pé
    const cr = o.crop ? `crop=iw*${o.crop[2]}:ih*${o.crop[3]}:iw*${o.crop[0]}:ih*${o.crop[1]},` : '';
    fl.push(`[${i}:v]${ro}${cr}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,${hdr(arq) ? SDR : ''}setsar=1${o.verde ? ',huesaturation=hue=105:saturation=-0.25:colors=g,huesaturation=hue=40:colors=c' : ''},eq=brightness=0.04:saturation=1.08[v${i}]`);
  });
  const n = r.clipes.length;
  fl.push(r.clipes.map((_, i) => `[v${i}]`).join('') + `concat=n=${n}:v=1:a=0[vv]`, `[${n}:v]scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[ov]`, `[vv][ov]overlay=0:0${FIM ? '[cl]' : '[out]'}`);
  if (FIM) { ins.push('-loop', '1', '-t', String(FIM), '-i', pngF); fl.push(`[${n + 2}:v]scale=1080:1920:out_color_matrix=bt709:out_range=tv,fps=30,format=yuv420p,setsar=1[fc]`, `[cl]format=yuv420p[cl2]`, `[cl2][fc]concat=n=2:v=1:a=0[out]`); }
  const base = ins.splice(0, n * 6), resto = ins;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...base, '-i', png, '-i', wav, ...resto, '-filter_complex', fl.join(';'), '-map', '[out]', '-map', `${n + 1}:a`, '-t', String(dur), '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path.join(OUT, nome + '.mp4')]);
  fs.rmSync(tmp); fs.rmSync(png); fs.rmSync(wav); if (FIM) fs.rmSync(pngF); console.log('ok', nome, dur + 's');
}
await browser.close();
