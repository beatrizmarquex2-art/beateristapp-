// Reels feitos só de IMAGENS (sem vídeo bruto): venda de materiais, prints dos jogos e sequências de capas. Identidade nova da Bea:
// dourado do logo, azul, branco e vermelho; textura de papel e rabiscos; mockups de celular e de livro; abinha de contexto; MUDO por padrão;
// SEM preço, SEM data, SEM gibi. Final "Robôterista ensina". Uso: SAIDA=/pasta node scripts/reels-imagens.mjs [filtro]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href, F = (n) => u(`assets/fonts/${n}`), hd = (n) => u(`assets/originals/paul-png/coloridos-hd/paul-${n}.png`);
const OUT = process.env.SAIDA; fs.mkdirSync(OUT, { recursive: true });
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', OU = '#d8b879';
const TELAS = { beathero: '59f03481c1a887c9', toque: '53c9b526fedbefb3', paulta: 'a6053f0358e0bd84', figurix: 'c0c549a9b88ef20b', acordes: '02eded2a16dc87b7', detetive: '7dfe2be6cd132427' };
const LOCAIS = { roleta: 'marketing/telas-app/roleta.jpg', minhafig: 'marketing/telas-app/minha-figurinha.jpg', album: 'marketing/telas-app/album.jpg' };
const tela = (k) => LOCAIS[k] ? u(LOCAIS[k]) : u(`vendas/assets/${TELAS[k]}.webp`);
const carta = (id, x, y, r, w = 300) => `<img src="${u('marketing/cartas/' + id + '.png')}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${r}deg);filter:drop-shadow(12px 14px 0 rgba(0,0,0,.4));border-radius:18px">`;
const capa = (id) => u(`assets/loja/${id}.webp`);
const dentro = (id) => u(fs.existsSync(path.join(ROOT, `assets/loja/d-${id}-2.webp`)) ? `assets/loja/d-${id}-2.webp` : `assets/loja/d-${id}.webp`);
const fontes = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}`;
const R = { estrela: 'M0-30 L8-9 L31-8 L13 6 L20 29 L0 15 L-19 30 L-12 6 L-31-9 L-8-9 Z', coroa: 'M-40 26 L-48 -26 L-18 2 L0 -36 L18 2 L48 -26 L40 26 Z', raio: 'M10-40 L-18 6 L2 6 L-10 42 L22-8 L2-8 Z', coracao: 'M0 28 C-44 -6 -22 -40 0 -14 C22 -40 44 -6 0 28 Z', zig: 'M-40 -14 L-14 6 L-22 -18 L10 6 L0 -18 L40 8' };
const PTS = [[110, 120, 'coroa', -12], [420, 100, 'zig', 4], [720, 130, 'estrela', 10], [980, 120, 'raio', 8], [975, 330, 'coracao', 12], [985, 560, 'estrela', -10], [105, 1690, 'estrela', -14], [380, 1740, 'zig', -4], [660, 1690, 'coroa', 8], [940, 1740, 'raio', -4]];
const rab = (cores) => `<svg viewBox="0 0 1080 1920" style="position:absolute;inset:0;width:1080px;height:1920px">${PTS.map(([x, y, k, r], i) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(1.25)" d="${R[k]}" fill="none" stroke="${cores[i % cores.length]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
const assin = `<div style="display:inline-flex;align-items:center;gap:16px;background:${AZ};color:${CR};padding:8px 30px 8px 8px;border-radius:99px;font:800 30px/1.15 Hanken,sans-serif;box-shadow:6px 6px 0 ${OU}"><img src="${u('assets/originals/logo-beaterista-dourado.png')}" style="height:84px"><span>Beaterista<br><span style="font-weight:500;font-size:25px">educação musical com propósito</span></span></div>`;
const cel = (k, x, y, r, w = 300) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;border-radius:40px;border:12px solid #05070d;overflow:hidden;background:#f4ead8;transform:rotate(${r}deg);box-shadow:14px 16px 0 rgba(0,0,0,.4)"><i style="position:absolute;left:50%;top:8px;width:84px;height:20px;margin-left:-42px;border-radius:99px;background:#05070d;z-index:2"></i><img src="${tela(k)}" style="width:100%;display:block"></div>`;
const livro = (id, x, y, r, w = 360) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 1.1)}px;transform:rotate(${r}deg)"><img src="${dentro(id)}" style="position:absolute;left:${Math.round(w * .22)}px;top:-22px;width:${Math.round(w * .8)}px;height:${Math.round(w * 1.1)}px;object-fit:cover;object-position:50% 0;border:3px solid #fff;border-radius:6px;transform:rotate(7deg);box-shadow:8px 10px 0 rgba(0,0,0,.35)"><div style="position:absolute;left:0;top:0;width:${Math.round(w * .88)}px;height:${Math.round(w * 1.1)}px;border-radius:6px 14px 14px 6px;overflow:hidden;border-left:9px solid #05070d;box-shadow:inset 16px 0 16px -8px rgba(0,0,0,.55),12px 14px 0 rgba(0,0,0,.45)"><img src="${capa(id)}" style="width:100%;height:100%;object-fit:cover;display:block"></div></div>`;
// uma "cena" = fundo + título + elementos + abinha + assinatura. cor: azul | vinho | creme
const cena = ({ cor, t1, t2, tag, nota, paul, els }) => { const [BG, TX, DQ] = { azul: [AZ, CR, OU], vinho: [VI, CR, OU], creme: [CR, AZ, VI] }[cor];
  return `<!doctype html><meta charset="utf-8"><style>${fontes}*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:${BG};color:${TX};position:relative;overflow:hidden}
.tx{position:absolute;inset:0;background:radial-gradient(${TX}20 2px,transparent 2.6px) 0 0/30px 30px}.mo{position:absolute;inset:26px;border:6px solid ${TX}33;border-radius:36px}
h1{position:absolute;left:64px;right:60px;top:210px;font:400 ${Math.max(t1.length, t2.length) > 16 ? 70 : Math.max(t1.length, t2.length) > 12 ? 84 : 120}px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:${DQ};padding-left:46px}
.tg{position:absolute;left:64px;top:140px;font:800 30px Hanken,sans-serif;text-transform:uppercase;letter-spacing:.07em;background:${cor === 'vinho' ? AZ : VI};color:${CR};padding:9px 24px;border-radius:99px;transform:rotate(-3deg)}
.a{position:absolute;left:54px;bottom:462px;width:590px;background:rgba(244,234,216,.97);color:${AZ};border-left:12px solid ${OU};border-radius:6px 22px 22px 6px;padding:16px 24px 20px;box-shadow:8px 8px 0 rgba(0,0,0,.35)}
.a b{display:inline-block;font:800 22px Hanken,sans-serif;text-transform:uppercase;letter-spacing:.08em;background:${VI};color:${CR};padding:3px 14px;border-radius:99px;margin-bottom:8px}.a p{font:600 31px/1.25 Hanken,sans-serif;text-wrap:balance}
.c{position:absolute;right:26px;bottom:330px;height:420px;filter:drop-shadow(10px 12px 0 rgba(0,0,0,.35))}.as{position:absolute;left:54px;bottom:330px}</style>
<div class="tx"></div><div class="mo"></div>${rab(cor === 'creme' ? [VI, AZ, OU] : [OU, CR, cor === 'azul' ? VI : AZ])}<div class="tg">${tag}</div><h1>${t1}<em>${t2}</em></h1>${els}
<div class="a"><b>${nota[0]}</b><p>${nota[1]}</p></div><img class="c" src="${hd(paul)}"><div class="as">${assin}</div>`; };
const FINAL = (fim, paul, cta, telas, capas) => { const C = [['tá esperando o quê?', 'acesse o site e jogue já!'], ['baixe o material e', 'jogue grátis'], ['acesse o site e', 'garanta seu acesso'], ['tá esperando o quê?', 'garanta seu acesso']][cta];
  return `<!doctype html><meta charset="utf-8"><style>${fontes}*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:${AZ};color:${CR};position:relative;overflow:hidden}
.p{position:absolute;inset:0;background:radial-gradient(${CR}1c 2px,transparent 2.6px) 0 0/34px 34px}h1{position:absolute;left:70px;top:236px;font:400 112px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:${OU};padding-left:50px}
.sub{position:absolute;right:70px;top:300px;font:800 34px/1.2 Hanken,sans-serif;background:${CR};color:${AZ};padding:12px 26px;border-radius:99px;transform:rotate(4deg);text-align:center}.s{position:absolute;left:70px;right:70px;top:520px;font:400 48px/1.12 Gochi,cursive;text-wrap:balance}
.pre{position:absolute;left:70px;top:1242px;font:400 54px Gochi,cursive;color:${OU}}.b{position:absolute;left:70px;top:1310px;white-space:nowrap;font:800 46px Hanken,sans-serif;background:${VI};padding:22px 40px;border-radius:99px;box-shadow:8px 8px 0 ${CR}}
.u{position:absolute;left:70px;top:1424px;font:700 38px Hanken,sans-serif}.c{position:absolute;right:26px;top:1236px;height:236px}.m{position:absolute;left:70px;right:70px;bottom:330px}
.et{position:absolute;font:400 34px Gochi,cursive;background:${OU};color:${AZ};padding:2px 18px 6px;border-radius:12px;transform:rotate(-4deg);z-index:3}</style>
<div class="p"></div><h1>robôterista<em>ensina</em></h1><div class="sub">materiais<br>e jogos</div><div class="s">${fim}</div>
${cel(telas[0], 70, 690, -3, 290)}${cel(telas[1], 388, 690, 2, 290)}${livro(capas[0], 730, 700, 2, 270)}${livro(capas[1], 730, 962, -2, 270)}
<div class="et" style="left:84px;top:656px">jogos</div><div class="et" style="left:760px;top:656px">materiais</div>
<div class="pre">${C[0]}</div><div class="b">${C[1]}</div><div class="u">jogos.beaterista.com.br</div><img class="c" src="${hd(paul)}"><div class="m">${assin}</div>`; };
// REELS: cada cena dura `d` s; zoom lento (Ken Burns) feito no ffmpeg
export const REELS = {
  'img-03-passe': { paul: 'selfie', cta: 2, telas: ['beathero', 'toque'], capas: ['ritmo', 'pratica'], fim: 'jogos, estudos e álbum no mesmo lugar, o ano inteiro',
    cenas: [{ d: 4, cor: 'azul', tag: 'passe beaterista', t1: 'mais de 15 jogos', t2: 'de música', nota: ['pra pais', 'um passe só: o filho joga, aprende e ainda coleciona figurinhas.'], els: cel('beathero', 120, 520, -4, 330) + cel('toque', 560, 600, 4, 330) },
      { d: 4, cor: 'vinho', tag: 'dentro do passe', t1: 'jogos que ensinam', t2: 'de verdade', nota: ['didática', 'cada jogo treina uma coisa: ritmo, leitura, escuta e atenção.'], els: cel('paulta', 120, 540, 3, 330) + cel('figurix', 560, 520, -3, 330) },
      { d: 4, cor: 'creme', tag: 'e tem mais', t1: 'estudos e', t2: 'figurinhas', nota: ['educação', 'estudar e ganhar figurinha: motivação que faz voltar amanhã.'], els: cel('album', 100, 500, -3, 340) + carta('beaterista-f001', 560, 560, 5, 380) }] },
  'img-14-combo': { paul: 'professor', cta: 0, telas: ['paulta', 'beathero'], capas: ['harmonia', 'memoria'], fim: 'quatro materiais pra aprender música brincando',
    cenas: [{ d: 3.5, cor: 'azul', tag: 'combo robôterista', t1: 'ritmo e', t2: 'figuras', nota: ['música', 'figuras, pausas e levadas pra tocar com segurança.'], els: livro('ritmo', 280, 560, -3, 520) },
      { d: 3.5, cor: 'vinho', tag: 'combo robôterista', t1: 'harmonia', t2: 'e melodia', nota: ['música', 'notas e acordes no teclado e no violão.'], els: livro('harmonia', 280, 560, 3, 520) },
      { d: 3.5, cor: 'creme', tag: 'combo robôterista', t1: 'na', t2: 'prática', nota: ['didática', 'jogos, cruzadinhas e labirintos pra imprimir e treinar.'], els: livro('pratica', 280, 560, -3, 520) },
      { d: 3.5, cor: 'azul', tag: 'combo robôterista', t1: 'jogo da', t2: 'memória', nota: ['educação', 'imprima, recorte, embaralhe: aprender também é brincar.'], els: livro('memoria', 280, 560, 3, 520) }] },
  'img-16-mood': { paul: 'bateria', cta: 2, telas: ['toque', 'beathero'], capas: ['mood', 'ritmo'], fim: 'os exercícios que eu estudo e levo pro palco',
    cenas: [{ d: 4, cor: 'vinho', tag: 'beaterista mood', t1: 'exercícios que', t2: 'eu levo pro palco', nota: ['música', 'o material de estudo que a Bea usa em cima do palco.'], els: livro('mood', 260, 560, -3, 560) },
      { d: 4, cor: 'azul', tag: 'beaterista mood', t1: 'estudo que', t2: 'vira técnica', nota: ['didática', 'toque simples, acentos e sequências: o básico bem feito.'], els: livro('mood', 260, 560, 3, 560) }] },
  'img-21-apostila': { paul: 'oculos', cta: 1, telas: ['toque', 'beathero'], capas: ['bateria-start', 'curso-start'], fim: 'do zero à primeira música, no seu ritmo',
    cenas: [{ d: 4, cor: 'vinho', tag: 'apostila bateria start', t1: 'comece a tocar', t2: 'do zero', nota: ['didática', 'peças da bateria, figuras rítmicas e partitura, passo a passo.'], els: livro('bateria-start', 260, 560, -3, 560) },
      { d: 4, cor: 'azul', tag: 'apostila bateria start', t1: 'rudimentos e', t2: 'primeiros ritmos', nota: ['música', 'a base pra tocar qualquer música depois.'], els: livro('bateria-start', 260, 560, 3, 560) }] },
  'img-22-material-cada-fase': { paul: 'professor', cta: 3, telas: ['paulta', 'beathero'], capas: ['bateria-kids', 'ritmo'], fim: 'tem material pra cada fase de quem aprende música',
    cenas: [{ d: 3, cor: 'creme', tag: 'pra criança', t1: 'bateria', t2: 'kids', nota: ['pra pais', 'aprender bateria brincando e colorindo.'], els: livro('bateria-kids', 280, 560, -3, 520) },
      { d: 3, cor: 'azul', tag: 'pra família', t1: 'jogo da', t2: 'memória', nota: ['educação', 'um jogo pra mesa de casa com instrumentos e figuras.'], els: livro('memoria', 280, 560, 3, 520) },
      { d: 3, cor: 'vinho', tag: 'pra começar', t1: 'bateria', t2: 'start', nota: ['didática', 'a apostila do curso pra dar o primeiro passo.'], els: livro('bateria-start', 280, 560, -3, 520) },
      { d: 3, cor: 'azul', tag: 'pra evoluir', t1: 'beaterista', t2: 'mood', nota: ['música', 'exercícios de estudo pra quem já toca.'], els: livro('mood', 280, 560, 3, 520) }] },
  'img-18-toca-na-tela': { paul: 'bateria', cta: 0, telas: ['toque', 'beathero'], capas: ['ritmo', 'pratica'], fim: 'sem instrumento em casa? toca na tela e treina de verdade',
    cenas: [{ d: 4, cor: 'azul', tag: 'toca na tela', t1: 'sem instrumento', t2: 'em casa?', nota: ['pra pais', 'bateria, cordas, teclas e percussão no tablet ou no celular.'], els: cel('toque', 120, 520, -4, 330) + cel('beathero', 560, 600, 4, 330) },
      { d: 4, cor: 'vinho', tag: 'toca na tela', t1: 'ouve, vê', t2: 'e toca', nota: ['didática', 'o corpo aprende o gesto antes de pegar no instrumento.'], els: cel('toque', 330, 520, 2, 420) }] },
  'img-19-nao-e-so-bateria': { paul: 'guitarra', cta: 0, telas: ['acordes', 'paulta'], capas: ['harmonia', 'violao'], fim: 'acordes de violão, guitarra, baixo e teclado pra tocar na tela',
    cenas: [{ d: 4, cor: 'vinho', tag: 'não é só bateria', t1: 'acordes de', t2: 'violão e guitarra', nota: ['música', 'ver o acorde, ouvir e tocar na tela: tudo junto.'], els: cel('acordes', 120, 520, -3, 330) + cel('paulta', 560, 560, 3, 330) },
      { d: 4, cor: 'azul', tag: 'não é só bateria', t1: 'baixo e', t2: 'teclado também', nota: ['didática', 'o mesmo jeito de aprender serve pra qualquer instrumento.'], els: cel('acordes', 330, 520, 2, 420) }] },
  'img-20-roleta': { paul: 'selfie', cta: 2, telas: ['roleta', 'minhafig'], capas: ['ritmo', 'colorir'], fim: 'termina o jogo, gira a roleta e cola no álbum',
    cenas: [{ d: 4, cor: 'creme', tag: 'álbum beaterista', t1: 'gira a', t2: 'roleta', nota: ['pra pais', 'terminou o jogo? gira a roleta e ganha de 1 a 3 figurinhas.'], els: cel('roleta', 330, 480, -3, 400) },
      { d: 4.5, cor: 'vinho', tag: 'minha figurinha', t1: 'a sua foto', t2: 'vira figurinha', nota: ['criatividade', 'escolhe o modelo, enquadra a foto e a carta fica pronta.'], els: cel('minhafig', 90, 500, -3, 340) + carta('beaterista-f001', 560, 560, 5, 380) },
      { d: 4, cor: 'azul', tag: 'álbum beaterista', t1: 'cola no', t2: 'álbum', nota: ['educação', 'colecionar dá vontade de voltar e jogar de novo amanhã.'], els: cel('album', 90, 500, -3, 340) + carta('paul-p01', 560, 540, 5, 360) + carta('paul-p03', 640, 900, -6, 300) }] },
};
const so = process.argv[2]; const browser = await chromium.launch();
for (const [nome, r] of Object.entries(REELS)) { if (so && !nome.includes(so)) continue;
  const dur = r.cenas.reduce((s, c) => s + c.d, 0), FIM = 3.5; const ins = [], fl = []; const shot = async (html, arq) => { const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html); const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await p.goto(pathToFileURL(tmp).href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); await p.screenshot({ path: arq }); await p.close(); fs.rmSync(tmp); };
  for (const [i, c] of r.cenas.entries()) { const png = path.join(OUT, `${nome}-c${i}.png`); await shot(cena({ ...c, paul: r.paul }), png); ins.push('-loop', '1', '-framerate', '30', '-t', String(c.d + 0.1), '-i', png);
    fl.push(`[${i}:v]fps=30,scale=1134:2016:flags=lanczos,crop=1080:1920:'27+27*t/${c.d}':'48+0*t',setsar=1,format=yuv420p[v${i}]`); }
  const pf = path.join(OUT, `${nome}-fim.png`); await shot(FINAL(r.fim, r.paul, r.cta, r.telas, r.capas), pf); ins.push('-loop', '1', '-framerate', '30', '-t', String(FIM + 0.1), '-i', pf); const n = r.cenas.length;
  fl.push(`[${n}:v]fps=30,format=yuv420p,setsar=1[vf]`, r.cenas.map((_, i) => `[v${i}]`).join('') + `[vf]concat=n=${n + 1}:v=1:a=0[out]`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins, '-filter_complex', fl.join(';'), '-map', '[out]', '-an', '-c:v', 'libx264', '-crf', '24', '-maxrate', '3500k', '-bufsize', '7000k', '-preset', 'fast', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', path.join(OUT, nome + '.mp4')]);
  for (const f of fs.readdirSync(OUT).filter((x) => x.startsWith(nome + '-') && x.endsWith('.png'))) fs.rmSync(path.join(OUT, f));
  console.log('ok', nome, dur + FIM + 's'); }
await browser.close();
