// peças de divulgação do gibi (Jornal do Robôterista Paul vol. 1): stories, carrossel, telas do reel e capas de destaque
// uso: node pecas.js DIR_FONTES DIR_SAIDA   (DIR_FONTES tem c10.jpg, d10.jpg, gcapa-01.png, gativ-23.png...)
const { chromium } = require('playwright'); const path = require('path');
const SRC = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const A = 'file://' + path.resolve(__dirname, '../..') + '/';
const S = f => 'file://' + SRC + '/' + f;
const css = `@font-face{font-family:PM;src:url(${A}assets/fonts/PermanentMarker-latin.woff2)}@font-face{font-family:HG;src:url(${A}assets/fonts/HankenGrotesk-latin.woff2);font-weight:100 900}@font-face{font-family:AN;src:url(${A}assets/fonts/Anton-latin.woff2)}
*{margin:0;box-sizing:border-box}body{background:#101f47;color:#f4ecdf;font-family:HG;position:relative;overflow:hidden}
.k{display:inline-block;background:#c0152f;font:800 36px HG;letter-spacing:.1em;padding:12px 28px;border-radius:999px;text-transform:uppercase}
.k.y{background:#f6b93b;color:#101f47}
h1{font:400 128px/1.02 AN;text-transform:uppercase;letter-spacing:.01em}h1 b{color:#f6b93b;font-weight:400}
.pm{font-family:PM;text-transform:none}
.p{font:600 46px/1.35 HG;color:#dfe5f5}
.card{position:absolute;background:#fff;padding:14px;border-radius:10px;box-shadow:0 30px 70px rgba(0,0,0,.45)}.card img{display:block;width:100%;border-radius:4px}
.f{position:absolute;left:0;right:0;text-align:center;font:800 34px HG;letter-spacing:.08em;color:#f6b93b}
.abs{position:absolute}.c{left:80px;right:80px;text-align:center}
.price{font:400 250px/0.9 AN;color:#f6b93b}
.grid{position:absolute;display:grid;gap:18px}.grid img{width:100%;display:block;border-radius:8px;border:8px solid #fff}`;
const H = '@jogos.beaterista';
// stories 1080x1920: zona segura = 250 em cima, 320 embaixo
const story = {
  gibi_1: `<div class="abs c" style="top:270px"><span class="k">novidade</span><h1 style="margin-top:34px">O Paul<br>virou <b>gibi</b></h1></div>
    <div class="card" style="left:90px;top:760px;width:900px;transform:rotate(-2.5deg)"><img src="${S('gcapa-01.png')}"></div>
    <div class="abs c p" style="top:1450px">20 historinhas pra aprender<br>música brincando</div>`,
  gibi_2: `<div class="abs c" style="top:270px"><span class="k y">você sabe responder?</span><h1 style="margin-top:34px;font-size:112px">Por que o violão<br>tem <b>dois mis?</b></h1></div>
    <div class="card" style="left:215px;top:700px;width:650px;transform:rotate(2deg)"><img src="${S('c10.jpg')}"></div>`,
  gibi_3: `<div class="abs c" style="top:270px"><span class="k">a resposta do paul</span></div>
    <div class="card" style="left:150px;top:350px;width:780px;transform:rotate(-1.5deg)"><img src="${S('d10.jpg')}"></div>
    <div class="abs c p" style="top:1480px">essa é só <b style="color:#f6b93b">1 das 20</b> histórias do gibi</div>`,
  gibi_4: `<div class="abs c" style="top:270px"><h1 style="font-size:104px">Toda história<br>termina num<br><b>desafio da semana</b></h1></div>
    <div class="card" style="left:190px;top:730px;width:700px;transform:rotate(2deg)"><img src="${S('d12.jpg')}"></div>`,
  gibi_5: `<div class="abs c" style="top:280px"><span class="k">gibi · vol. 1</span><h1 style="margin-top:34px;font-size:100px">Jornal do<br><b>Robôterista Paul</b></h1>
    <div class="price" style="margin-top:60px">R$ 9,90</div><div class="p" style="margin-top:36px">20 histórias + 20 desafios + atividade<br>PDF pra imprimir ou ler no tablet</div></div>
    <img class="abs" src="${A}marketing/reels/pauls/caderno.png" style="height:560px;left:270px;top:1090px">`,
  enquete_1: `<div class="abs c" style="top:300px"><span class="k y">me conta</span><h1 style="margin-top:40px;font-size:118px">Tem criança<br>aprendendo<br><b>música</b> aí?</h1></div>
    <img class="abs" src="${A}marketing/reels/pauls/baqueta.png" style="height:620px;left:260px;top:1030px">`,
  enquete_2: `<div class="abs c" style="top:300px"><span class="k">vol. 2 vem aí</span><h1 style="margin-top:40px;font-size:108px">Qual instrumento<br>o Paul deve<br><b>aprender agora?</b></h1></div>
    <img class="abs" src="${A}marketing/reels/pauls/amplificador.png" style="height:560px;left:260px;top:1090px">`,
  apostila_prazo: `<div class="abs c" style="top:280px"><span class="k">só até 30 de novembro</span><h1 style="margin-top:36px;font-size:104px">Apostila<br><b>Bateria Start</b></h1>
    <div class="p" style="margin-top:30px;text-decoration:line-through;opacity:.7">de R$ 29,90</div><div class="price" style="margin-top:6px">R$ 14,90</div>
    <div class="p" style="margin-top:36px">44 páginas pra começar do zero</div></div>
    <img class="abs" src="${A}marketing/reels/pauls/atividades.png" style="height:520px;left:280px;top:1120px">`,
  passe: `<div class="abs c" style="top:280px"><span class="k y">passe beaterista</span><h1 style="margin-top:36px;font-size:112px">Mais de 15 jogos<br>de <b>música</b></h1>
    <div class="price" style="margin-top:50px;font-size:210px">R$ 49,90</div><div class="p" style="margin-top:30px">o ano inteiro, pagamento único<br>dá pra começar grátis</div></div>
    <img class="abs" src="${A}marketing/reels/pauls/case.png" style="height:520px;left:280px;top:1120px">`,
};
// carrossel 1080x1350
const car = [
  `<div class="abs c" style="top:90px"><span class="k">novidade</span><h1 style="margin-top:28px">O Paul virou <b>gibi</b></h1></div>
   <div class="card" style="left:90px;top:440px;width:900px;transform:rotate(-2deg)"><img src="${S('gcapa-01.png')}"></div><div class="f" style="bottom:70px">arrasta pra ler uma história →</div>`,
  `<div class="abs c" style="top:80px"><h1 style="font-size:92px">Por que o violão tem <b>dois mis?</b></h1></div>
   <div class="card" style="left:200px;top:330px;width:680px"><img src="${S('c10.jpg')}"></div><div class="f" style="bottom:36px">→</div>`,
  `<div class="abs c" style="top:70px"><span class="k y">a resposta do paul</span></div>
   <div class="card" style="left:165px;top:170px;width:750px"><img src="${S('d10.jpg')}"></div><div class="f" style="bottom:56px">mesmo nome, alturas diferentes</div>`,
  `<div class="abs c" style="top:80px"><h1 style="font-size:92px">E tem mais <b>19 histórias</b></h1></div>
   <div class="grid" style="left:90px;right:90px;top:260px;grid-template-columns:repeat(3,1fr)">${['07','11','12','15','17','18'].map(n => `<img src="${S('c' + n + '.jpg')}">`).join('')}</div>
   <div class="f" style="bottom:60px">teclado · cajón · pulso · pandeiro · sinos · palco</div>`,
  `<div class="abs c" style="top:80px"><h1 style="font-size:84px">Cada uma termina num <b>desafio da semana</b></h1></div>
   <div class="card" style="left:200px;top:340px;width:680px;transform:rotate(1.5deg)"><img src="${S('d13.jpg')}"></div>`,
  `<div class="abs c" style="top:90px"><h1 style="font-size:88px">No fim, a criança <b>desenha a dela</b></h1></div>
   <div class="card" style="left:90px;top:440px;width:900px;transform:rotate(-1.5deg)"><img src="${S('gativ-23.png')}"></div>`,
  `<div class="abs c" style="top:110px"><span class="k">gibi · vol. 1</span><h1 style="margin-top:28px;font-size:88px">Jornal do<br><b>Robôterista Paul</b></h1>
   <div class="price" style="margin-top:40px">R$ 9,90</div><div class="p" style="margin-top:28px">20 histórias + 20 desafios + atividade<br>PDF pra imprimir ou ler no tablet</div></div>
   <img class="abs" src="${A}marketing/reels/pauls/caderno.png" style="height:430px;left:120px;bottom:0"><div class="abs" style="right:90px;bottom:150px;font:400 76px AN;color:#f6b93b;text-align:right">LINK<br>NA BIO</div>`,
];
// telas do reel 1080x1920 (texto no terço de cima, longe dos botões)
const tela = {
  a: `<div class="abs c" style="top:340px"><h1 style="font-size:112px">Por que o violão<br>tem <b>dois mis?</b></h1></div><div class="card" style="left:210px;top:720px;width:660px;transform:rotate(2deg)"><img src="${S('c10.jpg')}"></div>`,
  b: `<div class="abs c" style="top:340px"><h1 style="font-size:96px">O Paul <b>descobriu</b></h1></div><div class="card" style="left:140px;top:500px;width:800px;transform:rotate(-1.5deg)"><img src="${S('d10.jpg')}"></div>`,
  c: `<div class="abs c" style="top:340px"><h1 style="font-size:100px">Isso virou um <b>gibi</b><br>com 20 histórias</h1></div><div class="grid" style="left:170px;right:170px;top:700px;grid-template-columns:repeat(3,1fr)">${['07','11','12','13','15','17','18','19','20'].map(n => `<img src="${S('c' + n + '.jpg')}">`).join('')}</div>`,
};
// capas de destaque: o Instagram mostra só o círculo do meio
const dest = { 'o que é': '#f6b93b', jogos: '#c0152f', gibi: '#f6b93b', pais: '#f4ecdf', profs: '#c0152f', 'álbum': '#f6b93b', lojinha: '#f4ecdf', curso: '#c0152f', depoimentos: '#f6b93b' };
(async () => {
  const b = await chromium.launch();
  const shot = async (html, w, h, name, foot) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const tmp = path.join(OUT, '_tmp.html'); require('fs').writeFileSync(tmp, `<meta charset="utf8"><style>${css}body{width:${w}px;height:${h}px}</style>${html}${foot || ''}`); await p.goto('file://' + tmp);
    await p.evaluate(() => document.fonts.ready); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, name), type: name.endsWith('.png') ? 'png' : 'jpeg', ...(name.endsWith('.png') ? {} : { quality: 92 }) }); await p.close();
  };
  for (const [k, h] of Object.entries(story)) await shot(h, 1080, 1920, `story_${k}.jpg`, `<div class="f" style="top:196px;opacity:.85;font-size:30px">${H}</div>`);
  for (let i = 0; i < car.length; i++) await shot(car[i], 1080, 1350, `gibi_carrossel_${i + 1}.jpg`, i == 6 ? '' : `<div class="abs" style="left:40px;top:36px;font:800 26px HG;letter-spacing:.08em;opacity:.7">${H}</div>`);
  for (const [k, h] of Object.entries(tela)) await shot(h, 1080, 1920, `G_${k}.png`);
  for (const [k, cor] of Object.entries(dest)) {
    const fg = cor == '#c0152f' ? '#f4ecdf' : '#101f47';
    await shot(`<div class="abs" style="left:190px;top:610px;width:700px;height:700px;border-radius:50%;background:${cor};display:flex;align-items:center;justify-content:center"><div style="font:400 ${k.length > 8 ? 96 : k.length > 6 ? 120 : 150}px/1 PM;color:${fg};transform:rotate(-4deg);text-align:center">${k}</div></div>`, 1080, 1920, `destaque_${k.normalize('NFD').replace(/[^a-z]/gi, '')}.jpg`);
  }
  await b.close(); require('fs').unlinkSync(path.join(OUT, '_tmp.html'));
})();
