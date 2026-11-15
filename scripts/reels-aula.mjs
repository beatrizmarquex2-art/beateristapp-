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
const acha = (id) => path.join(V, fs.readdirSync(V).find((f) => f.includes(id)));
// A Bea pediu pra NÃO misturar: pad com pad, bateria com bateria.
export const REELS = {
  'aula-1-treino-no-pad': { t1: 'treino', t2: 'no pad', paul: 'metronomo', clipes: [['IMG_9033', 0.5, 3], ['IMG_9004', 2, 3], ['IMG_5269', 2, 3, { verde: true }], ['IMG_5268', 1, 3, { verde: true }]] },
  'aula-2-na-bateria': { t1: 'agora', t2: 'na bateria', paul: 'bateria', clipes: [['IMG_6629', 1, 4], ['IMG_9326', 1, 3.5, { verde: true }], ['IMG_6050', 4, 3.5]] },
  'aula-3-dia-de-show': { t1: 'dia de show', t2: 'na escola', paul: 'microfone', clipes: [['IMG_6045', 1, 3.5], ['IMG_6054', 2, 4]] },
  'aula-4-bateria-de-tapete': { t1: 'bateria', t2: 'de tapete', paul: 'bateria', clipes: [['IMG_4477', 0.5, 4], ['IMG_4944', 0.5, 4]] },
  'aula-6-a-bea-no-palco': { t1: 'a bea', t2: 'no palco', paul: 'bateria', clipes: [['MVI_8419', 0, 3.5, { gira: true }], ['MVI_8407', 0.5, 5, { gira: true }]] },
  'teclado-1-aula-de-teclado': { t1: 'aula de', t2: 'teclado', paul: 'teclado', clipes: [['IMG_7845', 0.5, 3], ['IMG_7847', 1, 3.5], ['IMG_7848', 1, 3], ['IMG_7849', 3, 4]] },
  'teclado-2-lendo-a-partitura': { t1: 'lendo', t2: 'a partitura', paul: 'estudando', clipes: [['IMG_7850', 0.5, 3], ['IMG_7851', 2, 5], ['IMG_7852', 0, 3.5]] },
  'teclado-3-primeiras-notas': { t1: 'primeiras', t2: 'notas', paul: 'teclado', clipes: [['IMG_3878', 0, 2.5], ['IMG_3879', 0.5, 4.5], ['IMG_3962', 0.5, 4.5]] },
  'aula-5-musica-desde-pequeno': { t1: 'música', t2: 'desde pequeno', paul: 'pandeiro', clipes: [['IMG_8788', 2, 5], ['IMG_1441', 2, 4, { crop: [0, 0.16, 0.65, 0.65] }]] },
};
const capa = ({ t1, t2, paul }) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;background:transparent}
.g1{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(13,26,54,.92),rgba(13,26,54,0))}
.g2{position:absolute;left:0;right:0;bottom:0;height:520px;background:linear-gradient(0deg,rgba(13,26,54,.9),rgba(13,26,54,0))}
h1{position:absolute;left:64px;top:150px;font:400 112px/.98 Marker,cursive;color:#f4ead8;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:#f2b632;padding-left:46px}
.u{position:absolute;left:64px;bottom:330px;font:700 38px Hanken,sans-serif;background:#f4ead8;color:#0d1a36;padding:18px 32px;border-radius:99px}
.c{position:absolute;right:20px;bottom:300px;height:380px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.35))}</style>
<div class="g1"></div><div class="g2"></div><h1>${t1}<em>${t2}</em></h1><div class="u">jogos.beaterista.com.br</div><img class="c" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${paul}.png`)}">`;
const browser = await chromium.launch();
const SO = process.env.SO; // SO=teclado -> só os reels cujo nome começa assim
for (const [nome, r] of Object.entries(REELS)) { if (SO && !nome.startsWith(SO)) continue;
  const png = path.join(OUT, nome + '.png'), tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, capa(r));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: png, omitBackground: true }); await page.close(); fs.rmSync(tmp);
  const dur = r.clipes.reduce((s, c) => s + c[2], 0), wav = path.join(OUT, nome + '.wav');
  execFileSync('python3', [path.join(ROOT, 'marketing/reels/beat.py'), wav, String(dur)]);
  const ins = [], fl = [];
  r.clipes.forEach(([id, ini, d, o = {}], i) => {
    ins.push('-ss', String(ini), '-t', String(d), '-i', acha(id));
    const ro = o.gira ? 'transpose=2,' : ''; // vídeo gravado deitado: gira pra ficar em pé
    const cr = o.crop ? `crop=iw*${o.crop[2]}:ih*${o.crop[3]}:iw*${o.crop[0]}:ih*${o.crop[1]},` : '';
    fl.push(`[${i}:v]${ro}${cr}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1${o.verde ? ',huesaturation=hue=105:saturation=-0.25:colors=g,huesaturation=hue=40:colors=c' : ''},eq=brightness=0.04:saturation=1.08[v${i}]`);
  });
  const n = r.clipes.length;
  fl.push(r.clipes.map((_, i) => `[v${i}]`).join('') + `concat=n=${n}:v=1:a=0[vv]`, `[vv][${n}:v]overlay=0:0[out]`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins, '-i', png, '-i', wav, '-filter_complex', fl.join(';'), '-map', '[out]', '-map', `${n + 1}:a`, '-t', String(dur), '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path.join(OUT, nome + '.mp4')]);
  fs.rmSync(png); fs.rmSync(wav); console.log('ok', nome, dur + 's');
}
await browser.close();
