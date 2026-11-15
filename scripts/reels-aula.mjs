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
  'pad-1-treino-no-pad': { cta: 1, telas: ['beathero', 'detetive'], capas: ['ritmo', 'pratica'], t1: 'treino', t2: 'no pad', paul: 'metronomo', marca: 'gorilla', fim: ['o treino segue', 'no jogo', 'o treino do pad continua no jogo: rudimentos e ritmo pra estudar em casa'], clipes: [['IMG_6973', 'auto', 4, { nota: ['didática', 'no pad a mão aprende o movimento antes de se preocupar com o volume.'] }], ['IMG_9033', 'auto', 4, { nota: ['música', 'rudimento é o alfabeto da bateria: com ele se escreve qualquer ritmo.'] }], ['IMG_9007', 'auto', 4, { nota: ['educação', 'repetir devagar e certo fixa mais do que repetir rápido e errado.'] }], ['IMG_9004', 'auto', 4, { nota: ['criatividade', 'depois da técnica vem a parte boa: inventar o próprio ritmo.'] }], ['a0e5e4cb', 'auto', 4, { verde: true, nota: ['educação', 'tocar em grupo ensina a ouvir o outro, e não só a si mesmo.'] }]] },
  'eletronica-1-bateria-eletronica': { marca: 'nagano', cta: 0, telas: ['toque', 'beathero'], t1: 'bateria', t2: 'eletrônica', paul: 'bateria', fim: ['sem bateria', 'em casa?', 'sem bateria em casa? toca na tela e treina com os jogos'], clipes: [['IMG_7199', 'auto', 3.3, { nota: ['música', 'na eletrônica dá pra estudar de fone, sem incomodar ninguém.'] }], ['IMG_7207', 'auto', 4, { nota: ['didática', 'os pads ficam no mesmo lugar da bateria acústica: o corpo aprende igual.'] }], ['IMG_7198', 0, 2.5]] },
  'eletronica-2-bateria-de-tapete': { cta: 2, telas: ['toque', 'beathero'], capas: ['bateria-kids', 'ritmo'], t1: 'bateria', t2: 'de tapete', paul: 'bateria', fim: ['cabe na', 'mochila', 'cabe na mochila, e o treino cabe no celular'], clipes: [['IMG_4462', 'auto', 4, { nota: ['educação', 'pra começar não precisa de bateria cara: precisa de constância.'] }], ['IMG_4477', 'auto', 4, { nota: ['didática', 'cada cor é uma peça da bateria, e isso ajuda a memorizar.'] }], ['IMG_4944', 'auto', 4, { nota: ['criatividade', 'brincar de bater é o primeiro jeito de compor.'] }]] },
  'percussao-1-percussao': { cta: 0, telas: ['figurix', 'beathero'], capas: ['ritmo', 'memoria'], t1: 'aula de', t2: 'percussão', paul: 'cajon', marca: 'spark', fim: ['o ritmo começa', 'na mão', 'o ritmo começa na mão e continua nos jogos de ritmo'], clipes: [['IMG_4794', 'auto', 4, { nota: ['música', 'no cajón, o centro dá o som grave e a borda dá o agudo.'] }], ['IMG_1431', 'auto', 4, { nota: ['didática', 'tubo maior, som mais grave: a criança vê e ouve a diferença.'] }], ['IMG_1441', 'auto', 4, { crop: [0, 0.16, 0.65, 0.65], nota: ['educação', 'percussão em grupo treina a escuta, a espera e a hora de entrar.'] }]] },
  'bateria-1-agora-na-bateria': { cta: 3, telas: ['beathero', 'toque'], t1: 'agora', t2: 'na bateria', paul: 'bateria', marca: 'nagano', fim: ['do jogo', 'pra bateria', 'do jogo pra bateria: primeiro na tela, depois de verdade'], clipes: [['copy_9F', 'auto', 4, { nota: ['didática', 'fone no ouvido: tocar junto com a música treina o tempo.'] }], ['IMG_3741', 'auto', 4, { verde: true, nota: ['música', 'bumbo, caixa e chimbal: com três peças já nasce um ritmo.'] }], ['IMG_6050', 'auto', 4, { nota: ['educação', 'subir no palco ensina o que nenhum ensaio ensina: coragem.'] }], ['IMG_3740', 'auto', 4, { verde: true, nota: ['criatividade', 'o prato é o tempero: cada baterista escolhe onde colocar.'] }]] }, // sem o IMG_6629: a Bea viu coisa do Pad Gorilla nele
  'aula-3-dia-de-show': { cta: 2, telas: ['beathero', 'paulta'], capas: ['bateria-kids', 'colorir'], fim: ['seu filho', 'no palco', 'antes do palco, o treino começa brincando'],  t1: 'dia de show', t2: 'na escola', paul: 'microfone', clipes: [['IMG_6045', 1, 4, { nota: ['educação', 'apresentar pros colegas dá sentido ao estudo do ano inteiro.'] }], ['IMG_6054', 2, 4, { nota: ['didática', 'tocar pra plateia treina o foco: errou, continua.'] }]] },
  'aula-6-a-bea-no-palco': { cta: 0, telas: ['beathero', 'paulta'], capas: ['mood', 'ritmo'], fim: ['eu ensino', 'o que eu toco', 'o que eu toco no palco vira jogo e material pra você'],  t1: 'a bea', t2: 'no palco', paul: 'bateria', clipes: [['MVI_8419', 0, 3.7, { gira: true, nota: ['música', 'quem ensina também precisa tocar: o palco renova a aula.'] }], ['MVI_8407', 0.5, 5, { gira: true, nota: ['educação', 'tocar em banda é ouvir o outro o tempo todo.'] }]] },
  'teclado-1-aula-de-teclado': { cta: 0, telas: ['paulta', 'acordes'], capas: ['harmonia', 'ritmo'], fim: ['não é só', 'bateria', 'no site tem jogo pra você ir aprendendo as notas na pauta'],  t1: 'aula de', t2: 'teclado', paul: 'teclado', clipes: [['IMG_7845', 'auto', 3.9, { nota: ['didática', 'professor e aluna lado a lado: primeiro imita, depois faz sozinha.'] }], ['IMG_7847', 'auto', 4, { nota: ['música', 'cada tecla é uma nota, e a pauta mostra qual tocar.'] }], ['IMG_7848', 'auto', 4, { nota: ['educação', 'mão pequena também alcança: é só começar com poucas notas.'] }]] },
  'teclado-3-primeiras-notas': { cta: 1, telas: ['paulta', 'acordes'], capas: ['harmonia', 'memoria'], fim: ['as primeiras', 'notas', 'no site tem jogo pra você ir aprendendo as notas na pauta'],  t1: 'primeiras', t2: 'notas', paul: 'teclado', clipes: [['IMG_3879', 'auto', 4.5, { nota: ['didática', 'ler e tocar ao mesmo tempo se aprende aos poucos, nota por nota.'] }], ['IMG_3962', 'auto', 4.5, { nota: ['criatividade', 'com cinco notas já dá pra tocar muita melodia conhecida.'] }]] },
  'aula-5-musica-desde-pequeno': { cta: 1, telas: ['figurix', 'toque'], capas: ['colorir', 'bateria-kids'], fim: ['música', 'desde cedo', 'jogos e materiais pra aprender música brincando'],  t1: 'música', t2: 'desde pequeno', paul: 'pandeiro', clipes: [['IMG_8788', 2, 5, { nota: ['educação', 'musicalização começa com o corpo: bater, ouvir e esperar a vez.'] }], ['IMG_1441', 2, 4, { crop: [0, 0.16, 0.65, 0.65], nota: ['música', 'grave e agudo: com os tubos a criança ouve a diferença na hora.'] }]] },
};
// logos dos parceiros SEMPRE em branco, PNG sem fundo (pedido da Bea): assets/parceiros-branco/
const MARCAS = { gorilla: ['assets/parceiros-branco/pad-gorilla.png', 'height:84px'], spark: ['assets/parceiros-branco/spark.png', 'height:84px'], nagano: ['assets/parceiros-branco/nagano.png', 'height:120px'] };
const FONTES = `@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${u('assets/fonts/HankenGrotesk-latin.woff2')})}`;
// CARTÃO FINAL (3,5 s), pedido da Bea: "materiais e jogos" + prévia de como é (2 telas de jogo + 2 capas) + chamada + logos EMBAIXO.
// chamadas: só as frases dela, mescladas (pre + botão). Nunca "joga grátis".
const TELAS = { beathero: '59f03481c1a887c9', toque: '53c9b526fedbefb3', paulta: 'a6053f0358e0bd84', figurix: 'c0c549a9b88ef20b', acordes: '02eded2a16dc87b7', detetive: '7dfe2be6cd132427' };
const CTAS = [['tá esperando o quê?', 'acesse o site e jogue já!'], ['baixe o material e', 'jogue grátis'], ['acesse o site e', 'garanta seu acesso'], ['tá esperando o quê?', 'garanta seu acesso']];
// página de dentro de cada material (print), pra aparecer atrás da capa no mockup
const DENTRO = (id) => fs.existsSync(path.join(ROOT, `assets/loja/d-${id}-2.webp`)) ? `assets/loja/d-${id}-2.webp` : `assets/loja/d-${id}.webp`;
// celular (print do jogo) e livro (capa + página de dentro), em CSS
const cel = (tela, x, r) => `<div class="cel" style="left:${x}px;transform:rotate(${r}deg)"><i></i><img src="${u('vendas/assets/' + TELAS[tela] + '.webp')}"></div>`;
const livro = (id, y, r) => `<div class="lv" style="top:${y}px;transform:rotate(${r}deg)"><img class="pg" src="${u(DENTRO(id))}"><div class="cp"><img src="${u('assets/loja/' + id + '.webp')}"></div></div>`;
// SÓ a escola no final (sem logo de parceiro) e NADA por cima do Paul (regras da Bea)
const final = ({ fim, paul, cta = 0, telas = ['beathero', 'toque'], capas = ['ritmo', 'colorir'] }) => `<!doctype html><meta charset="utf-8"><style>${FONTES}*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#0d1a36;color:#f4ead8;position:relative;overflow:hidden}
.p{position:absolute;inset:0;background:radial-gradient(#f4ead81c 2px,transparent 2.6px) 0 0/34px 34px}
h1{position:absolute;left:70px;top:236px;font:400 112px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:#d8b879;padding-left:50px}
.sub{position:absolute;right:70px;top:300px;font:800 34px/1.2 Hanken,sans-serif;background:#f4ead8;color:#0d1a36;padding:12px 26px;border-radius:99px;transform:rotate(4deg);text-align:center}
.s{position:absolute;left:70px;right:70px;top:520px;font:400 48px/1.12 Gochi,cursive;text-wrap:balance}
.cel{position:absolute;top:690px;width:290px;height:500px;border-radius:38px;border:12px solid #05070d;outline:3px solid #f4ead855;overflow:hidden;background:#f4ead8;box-shadow:12px 14px 0 rgba(0,0,0,.45)}
.cel img{width:100%;display:block}.cel i{position:absolute;left:50%;top:8px;width:84px;height:20px;margin-left:-42px;border-radius:99px;background:#05070d;z-index:2}
.lv{position:absolute;left:730px;width:280px;height:236px}
.lv .pg{position:absolute;left:54px;top:-14px;width:210px;height:236px;object-fit:cover;object-position:50% 0;border:3px solid #fff;border-radius:6px;transform:rotate(7deg);box-shadow:6px 8px 0 rgba(0,0,0,.35)}
.lv .cp{position:absolute;left:0;top:0;width:230px;height:236px;border-radius:6px 12px 12px 6px;overflow:hidden;box-shadow:inset 14px 0 14px -8px rgba(0,0,0,.55),10px 12px 0 rgba(0,0,0,.45);border-left:8px solid #05070d}
.lv .cp img{width:100%;height:100%;object-fit:cover;display:block}.lv .cp:after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,rgba(255,255,255,.28),rgba(255,255,255,0) 32%)}
.et{position:absolute;font:400 34px Gochi,cursive;background:#d8b879;color:#0d1a36;padding:2px 18px 6px;border-radius:12px;transform:rotate(-4deg);z-index:3}
.pre{position:absolute;left:70px;top:1242px;font:400 54px Gochi,cursive;color:#d8b879}
.b{position:absolute;left:70px;top:1310px;white-space:nowrap;font:800 46px Hanken,sans-serif;background:#a8182e;padding:22px 40px;border-radius:99px;box-shadow:8px 8px 0 #f4ead8}
.u{position:absolute;left:70px;top:1424px;font:700 38px Hanken,sans-serif}
.c{position:absolute;right:26px;top:1236px;height:236px}
.m{position:absolute;left:70px;right:70px;bottom:330px;display:flex;align-items:center;gap:18px;font:800 32px/1.15 Hanken,sans-serif}.m .sl{height:92px}</style>
<div class="p"></div><h1>robôterista<em>ensina</em></h1><div class="sub">materiais<br>e jogos</div><div class="s">${fim[2]}</div>
${cel(telas[0], 70, -3)}${cel(telas[1], 388, 2)}${livro(capas[0], 700, 2)}${livro(capas[1], 962, -2)}
<div class="et" style="left:84px;top:656px">jogos</div><div class="et" style="left:760px;top:656px">materiais</div>
<div class="pre">${CTAS[cta][0]}</div><div class="b">${CTAS[cta][1]}</div><div class="u">jogos.beaterista.com.br</div><img class="c" src="${u(`assets/originals/paul-png/coloridos-hd/paul-${paul}.png`)}">
<div class="m"><img class="sl" src="${u('assets/originals/logo-beaterista-dourado.png')}"><span>Beaterista<br><span style="font-weight:500;font-size:26px">educação musical com propósito</span></span></div>`;
// ABA DE CONTEXTO (pedido da Bea): em cada corte, uma abinha pequena com uma frase sobre música / didática / criatividade / educação.
// opção do clipe: nota: ['etiqueta', 'texto curto, até ~12 palavras'] — fica acima da assinatura, à esquerda, sem encostar no Paul.
const aba = ([tag, txt]) => `<!doctype html><meta charset="utf-8"><style>${FONTES}*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:transparent;position:relative;overflow:hidden}
.a{position:absolute;left:54px;bottom:462px;width:590px;background:rgba(244,234,216,.96);color:#0d1a36;border-left:12px solid #d8b879;border-radius:6px 22px 22px 6px;padding:16px 24px 20px;box-shadow:8px 8px 0 rgba(0,0,0,.35)}
.a b{display:inline-block;font:800 22px Hanken,sans-serif;text-transform:uppercase;letter-spacing:.08em;background:#a8182e;color:#f4ead8;padding:3px 14px;border-radius:99px;margin-bottom:8px}
.a p{font:600 31px/1.25 Hanken,sans-serif;text-wrap:balance}</style><div class="a"><b>${tag}</b><p>${txt}</p></div>`;
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
  const notas = [];
  for (const [i, c] of r.clipes.entries()) { const o = c[3] || {}; if (!o.nota) continue; const pn = path.join(OUT, `${nome}-nota${i}.png`); fs.writeFileSync(tmp, aba(o.nota));
    const p3 = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await p3.goto(pathToFileURL(tmp).href); await p3.evaluate(() => document.fonts.ready); await p3.waitForTimeout(200); await p3.screenshot({ path: pn, omitBackground: true }); await p3.close(); notas.push([i, pn]); }
  const ins = [], fl = [];
  r.clipes.forEach(([id, ini, d, o = {}], i) => {
    const arq = acha(id); if (ini === 'auto') ini = melhor(arq, d);
    ins.push('-ss', String(ini), '-t', String(d), '-i', arq);
    const ro = o.gira ? 'transpose=2,' : ''; // vídeo gravado deitado: gira pra ficar em pé
    const cr = o.crop ? `crop=iw*${o.crop[2]}:ih*${o.crop[3]}:iw*${o.crop[0]}:ih*${o.crop[1]},` : '';
    fl.push(`[${i}:v]${ro}${cr}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,${hdr(arq) ? SDR : ''}setsar=1${o.verde ? ',huesaturation=hue=105:saturation=-0.25:colors=g,huesaturation=hue=40:colors=c' : ''},eq=brightness=0.04:saturation=1.08[${o.nota ? 'w' : 'v'}${i}]`);
  });
  const n = r.clipes.length;
  fl.push(r.clipes.map((_, i) => `[v${i}]`).join('') + `concat=n=${n}:v=1:a=0[vv]`, `[${n}:v]scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[ov]`, `[vv][ov]overlay=0:0${FIM ? '[cl]' : '[out]'}`);
  if (FIM) { ins.push('-loop', '1', '-t', String(FIM), '-i', pngF); fl.push(`[${n + 2}:v]scale=1080:1920:out_color_matrix=bt709:out_range=tv,fps=30,format=yuv420p,setsar=1[fc]`, `[cl]format=yuv420p[cl2]`, `[cl2][fc]concat=n=2:v=1:a=0[out]`); }
  notas.forEach(([i, pn], k) => { const ix = n + 2 + (FIM ? 1 : 0) + k; ins.push('-i', pn); fl.push(`[${ix}:v]scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[nt${i}]`, `[w${i}][nt${i}]overlay=0:0[v${i}]`); });
  const base = ins.splice(0, n * 6), resto = ins;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...base, '-i', png, '-i', wav, ...resto, '-filter_complex', fl.join(';'), '-map', '[out]', '-map', `${n + 1}:a`, '-t', String(dur), '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path.join(OUT, nome + '.mp4')]);
  fs.rmSync(tmp); fs.rmSync(png); fs.rmSync(wav); if (FIM) fs.rmSync(pngF); notas.forEach(([, pn]) => fs.rmSync(pn)); console.log('ok', nome, dur + 's');
}
await browser.close();
