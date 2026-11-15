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
  'pad-1-treino-no-pad': { t1: 'treino', t2: 'no pad', paul: 'metronomo', marca: 'gorilla', fim: ['o treino segue', 'no jogo', 'rudimentos e ritmo pra treinar em casa'], clipes: [['IMG_6973', 'auto', 3], ['IMG_9033', 'auto', 3], ['IMG_9007', 'auto', 3], ['IMG_9004', 'auto', 3], ['a0e5e4cb', 'auto', 3, { verde: true }]] },
  'eletronica-1-bateria-eletronica': { t1: 'bateria', t2: 'eletrônica', paul: 'bateria', fim: ['sem bateria', 'em casa?', 'toca na tela e treina com os jogos'], clipes: [['IMG_7199', 'auto', 3], ['IMG_7207', 'auto', 4], ['IMG_7198', 0, 2.5]] },
  'eletronica-2-bateria-de-tapete': { t1: 'bateria', t2: 'de tapete', paul: 'bateria', fim: ['cabe na', 'mochila', 'e o treino cabe no celular'], clipes: [['IMG_4462', 'auto', 3.5], ['IMG_4477', 'auto', 3.5], ['IMG_4944', 'auto', 3.5]] },
  'percussao-1-percussao': { t1: 'aula de', t2: 'percussão', paul: 'cajon', marca: 'spark', fim: ['o ritmo começa', 'na mão', 'e continua nos jogos de ritmo'], clipes: [['IMG_4794', 'auto', 3.5], ['IMG_1431', 'auto', 3.5], ['IMG_1441', 'auto', 3.5, { crop: [0, 0.16, 0.65, 0.65] }]] },
  'bateria-1-agora-na-bateria': { t1: 'agora', t2: 'na bateria', paul: 'bateria', marca: 'nagano', fim: ['do jogo', 'pra bateria', 'primeiro na tela, depois de verdade'], clipes: [['copy_9F', 'auto', 4], ['IMG_3741', 'auto', 3.5, { verde: true }], ['IMG_6629', 'auto', 3.5], ['IMG_3740', 'auto', 3, { verde: true }]] },
  'aula-3-dia-de-show': { fim: ['seu filho', 'no palco', 'começa brincando com os jogos'],  t1: 'dia de show', t2: 'na escola', paul: 'microfone', clipes: [['IMG_6045', 1, 3.5], ['IMG_6054', 2, 4]] },
  'aula-6-a-bea-no-palco': { fim: ['eu ensino', 'o que eu toco', 'aprende comigo nos jogos'],  t1: 'a bea', t2: 'no palco', paul: 'bateria', clipes: [['MVI_8419', 0, 3.5, { gira: true }], ['MVI_8407', 0.5, 5, { gira: true }]] },
  'teclado-1-aula-de-teclado': { fim: ['não é só', 'bateria', 'acordes e notas pra tocar na tela'],  t1: 'aula de', t2: 'teclado', paul: 'teclado', clipes: [['IMG_7845', 0.5, 3], ['IMG_7847', 1, 3.5], ['IMG_7848', 1, 3], ['IMG_7849', 3, 4]] },
  'teclado-2-lendo-a-partitura': { fim: ['ler partitura', 'brincando', 'tem jogo de leitura no app'],  t1: 'lendo', t2: 'a partitura', paul: 'estudando', clipes: [['IMG_7850', 0.5, 3], ['IMG_7851', 2, 5], ['IMG_7852', 0, 3.5]] },
  'teclado-3-primeiras-notas': { fim: ['as primeiras', 'notas', 'começa hoje, na tela'],  t1: 'primeiras', t2: 'notas', paul: 'teclado', clipes: [['IMG_3878', 0, 2.5], ['IMG_3879', 0.5, 4.5], ['IMG_3962', 0.5, 4.5]] },
  'aula-5-musica-desde-pequeno': { fim: ['música', 'desde cedo', 'jogos pra aprender brincando'],  t1: 'música', t2: 'desde pequeno', paul: 'pandeiro', clipes: [['IMG_8788', 2, 5], ['IMG_1441', 2, 4, { crop: [0, 0.16, 0.65, 0.65] }]] },
};
// logos dos parceiros SEMPRE em branco, PNG sem fundo (pedido da Bea): assets/parceiros-branco/
const MARCAS = { gorilla: ['assets/parceiros-branco/pad-gorilla.png', 'height:84px'], spark: ['assets/parceiros-branco/spark.png', 'height:84px'], nagano: ['assets/parceiros-branco/nagano.png', 'height:120px'] };
const FONTES = `@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')})}`;
// cartão final (2,5 s) pra converter: promessa + "joga grátis" + site + parceiro
const final = ({ fim, paul, marca }) => `<!doctype html><meta charset="utf-8"><style>${FONTES}*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#0d1a36;color:#f4ead8;position:relative;overflow:hidden}
.p{position:absolute;inset:0;background:radial-gradient(#f4ead81c 2px,transparent 2.6px) 0 0/34px 34px}
h1{position:absolute;left:70px;top:300px;font:400 124px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:#d8b879;padding-left:50px}
.s{position:absolute;left:70px;right:70px;top:640px;font:400 62px/1.12 Gochi,cursive}
.b{position:absolute;left:70px;top:900px;font:800 70px Hanken,sans-serif;background:#a8182e;padding:26px 50px;border-radius:99px;box-shadow:10px 10px 0 #f4ead8}
.u{position:absolute;left:70px;top:1090px;font:700 50px Hanken,sans-serif}.u small{display:block;font:400 46px Gochi,cursive;margin-top:10px;color:#d8b879}
.c{position:absolute;right:30px;bottom:560px;height:440px;filter:drop-shadow(10px 12px 0 rgba(0,0,0,.4))}
.m{position:absolute;left:70px;bottom:360px;display:flex;align-items:center;gap:24px;font:400 44px Gochi,cursive}.m span{display:flex;align-items:center}.m img{display:block}.m .sl{height:110px}</style>
<div class="p"></div><h1>${fim[0]}<em>${fim[1]}</em></h1><div class="s">${fim[2]}</div><div class="b">joga grátis</div><div class="u">jogos.beaterista.com.br<small>link na bio</small></div>
<div class="m"><img class="sl" src="${u('assets/originals/logo-beaterista-dourado.png')}"><span style="background:none;padding:0;font:800 40px/1.15 Hanken,sans-serif;display:block">Beaterista<br><span style="font-weight:500;font-size:32px;background:none;padding:0;display:inline">educação musical com propósito</span></span></div><div class="m" style="bottom:210px">${marca ? `<span style="background:none;padding:0">com</span> <span><img src="${u(MARCAS[marca][0])}" style="${MARCAS[marca][1]}"></span>` : ''}</div><img class="c" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${paul}.png`)}">`;
const capa = ({ t1, t2, paul, marca }) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;background:transparent}
.g1{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(13,26,54,.92),rgba(13,26,54,0))}
.g2{position:absolute;left:0;right:0;bottom:0;height:520px;background:linear-gradient(0deg,rgba(13,26,54,.9),rgba(13,26,54,0))}
h1{position:absolute;left:64px;top:150px;font:400 112px/.98 Marker,cursive;color:#f4ead8;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:#d8b879;padding-left:46px}
.u{position:absolute;left:64px;bottom:330px;font:700 38px Hanken,sans-serif;background:#0d1a36;color:#f4ead8;padding:18px 32px;border-radius:99px}
.c{position:absolute;right:20px;bottom:300px;height:380px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.35))}</style>
<div class="g1"></div><div class="g2"></div><h1>${t1}<em>${t2}</em></h1>${marca ? `<div style="position:absolute;left:64px;bottom:470px;display:flex;align-items:center;gap:16px;font:400 40px 'Marker',cursive;color:#f4ead8"><span style="display:flex"><img src="${u(MARCAS[marca][0])}" style="${MARCAS[marca][1].replace('150px', '90px').replace('300px', '200px').replace('120px', '90px').replace('56px', '44px')}"></span></div>` : ''}<div class="u" style="display:flex;align-items:center;gap:18px;padding:10px 34px 10px 10px;font:800 36px/1.15 Hanken,sans-serif"><img src="${u('assets/originals/logo-beaterista-dourado.png')}" style="height:96px"><span>Beaterista<br><span style="font-weight:500;font-size:29px">educação musical com propósito</span></span></div><img class="c" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${paul}.png`)}">`;
const browser = await chromium.launch();
const SO = process.env.SO; // SO=teclado -> só os reels cujo nome começa assim
for (const [nome, r] of Object.entries(REELS)) { if (SO && !SO.split(',').some((s) => nome.startsWith(s))) continue;
  const png = path.join(OUT, nome + '.png'), tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, capa(r));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: png, omitBackground: true }); await page.close(); 
  const FIM = r.fim ? 2.5 : 0, pngF = path.join(OUT, nome + '-fim.png');
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
