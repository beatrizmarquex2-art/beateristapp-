// Gera todas as imagens do kit a partir dos prints reais (kit-divulgacao/prints) e da identidade do app.
// Rodar na raiz do repo: NODE_PATH=$(npm root -g) node kit-divulgacao/_fontes/gerar.mjs [filtro]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'kit-divulgacao');
const FILTRO = process.argv[2] ? new RegExp(process.argv[2]) : null;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'access-control-allow-origin': '*', 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${srv.address().port}`;

// ---------- identidade ----------
const C = { red: '#b5162b', wine: '#6e1219', cream: '#f1ebe1', ink: '#1b1818', navy: '#0e2347', gold: '#f6c44f', white: '#fffdf8' };
const P = (n) => `/kit-divulgacao/prints/${n}.png`;
const PAUL = { bateria: '/assets/aluno/paul-bateria.webp', violao: '/assets/aluno/paul-violao.webp', paz: '/assets/aluno/paul-paz.webp', apontando: '/assets/aluno/paul-apontando.webp', skate: '/assets/aluno/paul-skate.webp', selfie: '/assets/aluno/paul-selfie.webp', normal: '/assets/aluno/paul.webp', feliz: '/assets/paul/e02.webp', fone: '/assets/paul/e05.webp' };
const SITE = 'jogos.beaterista.com.br';
const REDES = '@beaterista_ · @beaterista · @beateristadrummer';

// bg/fg/acc por jogo (alterna as 4 cores da escola)
const JOGOS = [
  { id: 'beat-hero', nome: 'Beat Hero', lab: 'ritmo e bateria', frase: 'toque no tempo certo e ganhe XP', dev: ['coordenação motora', 'precisão de tempo', 'atenção'], img: 'beat-hero-jogando', bg: C.red, fg: C.cream, acc: C.gold, paul: 'bateria' },
  { id: 'toca-aqui', nome: 'Toca Aqui', lab: 'ritmo e bateria', frase: 'leia a figura e toque no pulso, na tela ou no microfone', dev: ['leitura rítmica', 'pulso', 'escuta'], img: 'toca-aqui-jogando', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'apontando' },
  { id: 'detetive-note', nome: 'Detetive Note', lab: 'ritmo e bateria', frase: 'ouça o ritmo e monte com as cartas', dev: ['percepção auditiva', 'memória rítmica', 'concentração'], img: 'detetive-note-jogando', bg: C.gold, fg: C.ink, acc: C.red, paul: 'fone' },
  { id: 'figurix', nome: 'Figurix', lab: 'figuras rítmicas', frase: '62 fases pra dominar semínima, colcheia, pausa e cia', dev: ['valor das figuras', 'raciocínio', 'memória'], img: 'figurix-jogando', bg: C.cream, fg: C.ink, acc: C.red, paul: 'feliz' },
  { id: 'paulta', nome: 'pauLta', lab: 'leitura musical', frase: 'aprenda a ler a pauta da bateria, clave de sol e de fá', dev: ['leitura de partitura', 'notas e claves', 'reflexo de leitura'], img: 'paulta-jogando', bg: C.wine, fg: C.cream, acc: C.gold, paul: 'paz' },
  { id: 'uno-musical', nome: 'Uno Musical', lab: 'cartas e tabuleiro', frase: 'combine a cor ou a figura rítmica e vença o Paul', dev: ['reconhecer figuras', 'estratégia', 'jogar em grupo'], img: 'uno-musical-jogando', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'selfie' },
  { id: 'stop-musical', nome: 'STOP Musical', lab: 'cartas e tabuleiro', frase: 'a letra é sorteada, você escreve rápido: 12 categorias de música', dev: ['vocabulário musical', 'agilidade', 'cultura musical'], img: 'stop-musical', bg: C.gold, fg: C.ink, acc: C.red, paul: 'skate' },
  { id: 'jogo-da-velha', nome: 'Jogo da Velha Musical', lab: 'cartas e tabuleiro', frase: 'responda a pergunta de música pra marcar a casa', dev: ['conhecimento musical', 'raciocínio', 'atenção'], img: 'jogo-da-velha', bg: C.red, fg: C.cream, acc: C.gold, paul: 'apontando' },
  { id: 'quebra-cabeca', nome: 'Quebra-cabeça', lab: 'cartas e tabuleiro', frase: 'monte o palco, a guitarra, o estúdio e mais', dev: ['percepção visual', 'paciência', 'foco'], img: 'quebra-cabeca', bg: C.cream, fg: C.ink, acc: C.red, paul: 'violao' },
  { id: 'memoria', nome: 'Jogo da Memória', lab: 'cartas e tabuleiro', frase: 'instrumentos, figuras, bandas e profissões da música', dev: ['memória', 'vocabulário musical', 'atenção'], img: 'memoria-jogando', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'feliz' },
  { id: 'letras', nome: 'Letras', lab: 'palavras', frase: 'caça-palavras, cruzadinha e quiz com o vocabulário da música', dev: ['vocabulário', 'leitura', 'concentração'], img: 'letras', bg: C.gold, fg: C.ink, acc: C.red, paul: 'paz' },
  { id: 'estudos', nome: 'Estudos', lab: 'aprender brincando', frase: 'ritmo, melodia e teoria em passos curtinhos, com som', dev: ['teoria básica', 'hábito de estudo', 'meta do dia'], img: 'estudos-ritmo', bg: C.red, fg: C.cream, acc: C.gold, paul: 'bateria' },
  { id: 'ritmos-de-bateria', nome: 'Ritmos de bateria', lab: 'estudos', frase: 'veja o desenho do ritmo, a partitura e ouça: rock, pop, samba, baião…', dev: ['levadas', 'leitura de grade', 'escuta ativa'], img: 'estudos-ritmos-de-bateria', bg: C.cream, fg: C.ink, acc: C.red, paul: 'bateria' },
  { id: 'acordes', nome: 'Acordes de violão', lab: 'estudos', frase: '16 acordes: veja onde pôr o dedo e ouça no violão, guitarra e baixo', dev: ['mapa do braço', 'escuta', 'harmonia'], img: 'estudos-acordes-violao', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'violao' },
  { id: 'dicionario', nome: 'Dicionário da bateria', lab: 'estudos', frase: '44 termos explicados com exemplo tocando', dev: ['vocabulário técnico', 'autonomia', 'curiosidade'], img: 'dicionario-da-bateria', bg: C.gold, fg: C.ink, acc: C.red, paul: 'apontando' },
  { id: 'tocar', nome: 'Bateria de Toque', lab: 'tocar', frase: 'toque nas peças com vários dedos e grave seu ritmo', dev: ['coordenação', 'criatividade', 'senso de tempo'], img: 'tocar-bateria', bg: C.red, fg: C.cream, acc: C.gold, paul: 'bateria' },
  { id: 'violao-tela', nome: 'Violão', lab: 'tocar', frase: 'escolha o acorde e passe o dedo nas cordas', dev: ['timbre', 'harmonia', 'coordenação'], img: 'tocar-violao', bg: C.cream, fg: C.ink, acc: C.red, paul: 'violao' },
  { id: 'piano', nome: 'Piano e xilofone', lab: 'tocar', frase: 'teclado e barras coloridas: nenhuma nota soa errada', dev: ['melodia', 'ouvido', 'criatividade'], img: 'tocar-piano', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'paz' },
  { id: 'roleta', nome: 'Roleta Musical', lab: 'tocar', frase: 'gire e descubra qual artista você vai tocar hoje', dev: ['repertório', 'curiosidade', 'prática'], img: 'roleta-musical', bg: C.wine, fg: C.cream, acc: C.gold, paul: 'selfie' },
];

// ---------- peças ----------
const fonts = `<link rel="stylesheet" href="/css/fonts.css">`;
const base = (w, h, css, body) => `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/">${fonts}<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:'Hanken Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.A{font-family:'Anton',Impact,sans-serif;text-transform:uppercase;letter-spacing:.01em;line-height:.95}
.M{font-family:'Permanent Marker','Gochi Hand',cursive}.T{font-family:'Special Elite',monospace}
.logo{height:60px}.logo.w{filter:brightness(0) invert(1)}
.phone{position:relative;border:14px solid #151213;border-radius:64px;overflow:hidden;background:#151213;box-shadow:0 40px 60px -20px rgba(0,0,0,.55),0 0 0 3px rgba(255,255,255,.12)}
.phone img{display:block;width:100%}
.phone::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:34%;height:26px;background:#151213;border-radius:0 0 18px 18px;z-index:3}
.btn{display:inline-block;font-family:'Anton';text-transform:uppercase;letter-spacing:.04em;padding:.5em 1.1em;border-radius:.3em;box-shadow:.12em .12em 0 rgba(0,0,0,.85);border:.06em solid #151213}
.chip{display:inline-block;font-family:'Special Elite';padding:.25em .7em;border:2px solid currentColor;border-radius:999px}
${css}</style></head><body>${body}</body></html>`;

const logoFor = (g) => `<img class="logo ${[C.red, C.navy, C.wine].includes(g.bg) ? 'w' : ''}" src="/assets/logo-nome.png">`;

function feed(g) {
  const W = 1080, H = 1350;
  return [W, H, base(W, H, `
body{background:${g.bg};color:${g.fg};position:relative}
.dots{position:absolute;inset:0;background:radial-gradient(${g.fg}22 2px,transparent 2.5px) 0 0/26px 26px}
.top{position:absolute;left:70px;right:70px;top:60px;display:flex;justify-content:space-between;align-items:center}
.top .chip{font-size:30px}
.txt{position:absolute;left:70px;top:150px;width:520px;display:flex;flex-direction:column;gap:26px}
h1{font-size:${g.nome.length > 14 ? 120 : 150}px;color:${g.fg}}
.fr{font-size:42px;font-weight:700;line-height:1.15}
.dev{display:flex;flex-direction:column;gap:12px}
.dev b{font-family:'Special Elite';font-weight:400;font-size:26px;opacity:.8}
.dev .chip{font-size:30px;align-self:flex-start;background:${g.acc};color:${g.bg === C.gold ? C.cream : g.bg === C.cream ? C.cream : C.ink};border-color:transparent}
.phone{position:absolute;right:40px;top:260px;width:470px;transform:rotate(4deg)}
.paul{position:absolute;left:20px;bottom:90px;width:360px;transform:rotate(-4deg);filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))}
.foot{position:absolute;left:0;right:0;bottom:0;height:80px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:center;gap:30px;font-size:30px;font-family:'Special Elite'}
.foot b{color:${C.gold};font-family:'Anton';font-weight:400;letter-spacing:.04em;font-size:34px}
`, `<div class="dots"></div>
<div class="top">${logoFor(g)}<span class="chip">${g.lab}</span></div>
<div class="txt"><h1 class="A">${g.nome}</h1><p class="fr">${g.frase}</p>
<div class="dev"><b>desenvolve:</b>${g.dev.map((d) => `<span class="chip">${d}</span>`).join('')}</div></div>
<div class="phone"><img src="${P(g.img)}"></div>
<img class="paul" src="${PAUL[g.paul]}">
<div class="foot"><b>jogue agora</b> ${SITE}</div>`)];
}

function story(g) {
  const W = 1080, H = 1920;
  return [W, H, base(W, H, `
body{background:${g.bg};color:${g.fg};position:relative}
.dots{position:absolute;inset:0;background:radial-gradient(${g.fg}22 2.5px,transparent 3px) 0 0/30px 30px}
.top{position:absolute;left:70px;top:150px;display:flex;flex-direction:column;gap:20px}
.top .chip{font-size:32px;align-self:flex-start}
h1{font-size:${g.nome.length > 14 ? 130 : 170}px;width:940px}
.fr{font-size:48px;font-weight:700;line-height:1.15;width:880px}
.phone{position:absolute;left:50%;top:620px;width:640px;margin-left:-320px;transform:rotate(-3deg)}
.paul{position:absolute;right:20px;top:560px;width:300px;transform:rotate(6deg);z-index:5;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.25))}
.cta{position:absolute;left:0;right:0;bottom:210px;text-align:center;font-size:56px}
.cta .btn{background:${g.acc};color:${g.acc === C.gold ? C.ink : C.cream}}
.site{position:absolute;left:0;right:0;bottom:140px;text-align:center;font-family:'Special Elite';font-size:34px}
`, `<div class="dots"></div>
<div class="top">${logoFor(g)}<span class="chip">${g.lab}</span><h1 class="A">${g.nome}</h1><p class="fr">${g.frase}</p></div>
<div class="phone"><img src="${P(g.img)}"></div><img class="paul" src="${PAUL[g.paul]}">
<div class="cta"><span class="btn">jogar agora</span></div><div class="site">${SITE}</div>`)];
}

// ---------- WhatsApp (pais) ----------
const WA = {
  'wa-01-brincar-e-estudar': [1080, 1080, () => base(1080, 1080, `
body{background:${C.red};color:${C.cream};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#ffffff1f 2px,transparent 2.5px) 0 0/26px 26px}
h1{position:absolute;left:60px;top:60px;width:960px;font-size:118px}h1 span{color:${C.gold}}
p.s{position:absolute;left:60px;top:370px;width:900px;font-size:40px;font-weight:700;line-height:1.2}
.row{position:absolute;left:0;right:0;top:500px;display:flex;justify-content:center;gap:26px}
.phone{width:290px;height:600px;border-width:10px;border-radius:44px}.phone img{width:100%}
.phone:nth-child(1){transform:rotate(-4deg) translateY(20px)}.phone:nth-child(3){transform:rotate(4deg) translateY(20px)}.phone:nth-child(2){transform:translateY(-10px)}
.foot{position:absolute;left:0;right:0;bottom:0;height:70px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:center;font-family:'Special Elite';font-size:30px;gap:20px}.foot b{font-family:Anton;font-weight:400;color:${C.gold}}
`, `<div class="dots"></div><h1 class="A">brincar também é <span>estudar música</span></h1><p class="s">jogos de ritmo, leitura e teoria feitos pela professora Bea, direto no celular.</p>
<div class="row"><div class="phone"><img src="${P('toca-aqui-jogando')}"></div><div class="phone"><img src="${P('uno-musical-jogando')}"></div><div class="phone"><img src="${P('beat-hero-jogando')}"></div></div>
<div class="foot"><b>testar grátis</b> ${SITE}</div>`)],
  'wa-02-o-que-cada-jogo-desenvolve': [1080, 1080, () => base(1080, 1080, `
body{background:${C.cream};color:${C.ink};position:relative}
h1{position:absolute;left:60px;top:50px;font-size:96px;color:${C.red};width:760px}
.paul{position:absolute;right:30px;top:20px;width:240px}
.l{position:absolute;left:60px;right:60px;top:290px;display:flex;flex-direction:column;gap:14px}
.i{display:flex;align-items:center;gap:20px;background:#fff;border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};padding:12px 20px;border-radius:14px}
.i b{font-family:Anton;font-weight:400;text-transform:uppercase;font-size:40px;width:330px;color:${C.red}}.i span{font-size:31px;font-weight:600;line-height:1.1}
.foot{position:absolute;left:0;right:0;bottom:0;height:70px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:center;font-family:'Special Elite';font-size:30px}
`, `<h1 class="A">o que cada jogo desenvolve</h1><img class="paul" src="${PAUL.apontando}">
<div class="l">${[['Beat Hero', 'coordenação e precisão de tempo'], ['Toca Aqui', 'leitura rítmica e pulso'], ['Detetive Note', 'escuta e memória rítmica'], ['pauLta', 'leitura de partitura e claves'], ['Uno Musical', 'reconhecer as figuras rítmicas'], ['STOP Musical', 'vocabulário e cultura musical']].map(([a, b]) => `<div class="i"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<div class="foot">${SITE} · professora Bea</div>`)],
  'wa-03-teste-gratis': [1080, 1080, () => base(1080, 1080, `
body{background:${C.gold};color:${C.ink};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#00000014 2px,transparent 2.5px) 0 0/24px 24px}
h1{position:absolute;left:60px;top:60px;width:540px;font-size:104px;color:${C.red}}
p{position:absolute;left:60px;top:470px;width:520px;font-size:38px;font-weight:700;line-height:1.2}
.btn{position:absolute;left:60px;top:700px;font-size:50px;background:${C.red};color:${C.cream}}
.u{position:absolute;left:60px;top:840px;font-family:'Special Elite';font-size:34px}
.phone{position:absolute;right:50px;top:110px;width:420px;transform:rotate(4deg)}
.paul{position:absolute;right:400px;bottom:20px;width:230px}
.logo{position:absolute;left:60px;bottom:50px;height:90px}
`, `<div class="dots"></div><h1 class="A">teste grátis o app da bea</h1><p>abre no celular ou no tablet, sem instalar nada. tem jogo liberado pra experimentar agora.</p><span class="btn">jogar agora</span><div class="u">${SITE}</div>
<div class="phone"><img src="${P('lista-de-jogos')}"></div><img class="paul" src="${PAUL.paz}"><img class="logo" src="/assets/logo-nome.png">`)],
  'wa-04-black-friday-bateria-start': [1080, 1080, () => base(1080, 1080, `
body{background:${C.ink};color:${C.cream};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#ffffff12 2px,transparent 2.5px) 0 0/24px 24px}
.sel{position:absolute;left:60px;top:60px;font-size:40px;background:${C.gold};color:${C.ink};padding:8px 26px;transform:rotate(-2deg)}
h1{position:absolute;left:60px;top:150px;font-size:150px;width:520px}h1 span{color:${C.gold}}
.pr{position:absolute;left:60px;top:560px;font-family:Anton;font-size:60px;opacity:.7;text-decoration:line-through}
.po{position:absolute;left:60px;top:640px;font-family:Anton;font-size:190px;color:${C.gold};line-height:1}
.l{position:absolute;left:60px;top:880px;font-size:34px;font-weight:700;width:520px;line-height:1.2}
.cap{position:absolute;right:50px;top:120px;width:430px;transform:rotate(5deg);box-shadow:20px 30px 0 rgba(0,0,0,.4);border:6px solid ${C.cream}}
.foot{position:absolute;left:0;right:0;bottom:0;height:70px;background:${C.red};display:flex;align-items:center;justify-content:center;font-family:'Special Elite';font-size:30px}
`, `<div class="dots"></div><div class="sel A">black friday · metade do preço</div><h1 class="A">bateria <span>start</span></h1><div class="pr">R$ 29,90</div><div class="po">R$ 14,90</div>
<div class="l">ebook pra iniciantes: peças, figuras rítmicas, partitura e rudimentos · 44 páginas em PDF</div><img class="cap" src="/assets/loja/bateria-start.webp"><div class="foot">link na descrição / chama a Bea no zap</div>`)],
  'wa-05-materiais-pdf': [1080, 1080, () => base(1080, 1080, `
body{background:${C.cream};color:${C.ink};position:relative}
h1{position:absolute;left:60px;top:40px;font-size:92px;color:${C.red};width:960px}
.g{position:absolute;left:50px;right:50px;top:190px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.c{background:#fff;border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};padding:10px;text-align:center}.c img{width:100%;height:290px;object-fit:cover;object-position:top;display:block}
.c b{display:block;font-family:Anton;font-weight:400;text-transform:uppercase;font-size:30px;margin-top:8px;line-height:1}.c span{font-size:26px;font-weight:800;color:${C.red}}.c small{display:block;font-size:20px;font-weight:600;opacity:.7}
.foot{position:absolute;left:0;right:0;bottom:0;height:70px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:center;font-family:'Special Elite';font-size:30px}
`, `<h1 class="A">materiais da bea em pdf</h1><div class="g">${[['memoria', 'Jogo da Memória', '61 pares', 'R$ 19,90'], ['bateria-kids', 'Bateria Kids', '36 páginas', 'R$ 19,90'], ['roboterista', 'Robôterista Ensina', '70 páginas', 'R$ 29,90'], ['violao', 'Violão do Zero', '47 páginas', 'R$ 29,90'], ['mood', 'Beaterista Mood', '55 páginas', 'R$ 29,90'], ['bateria-start', 'Bateria Start', '44 páginas', 'R$ 14,90 (black friday)']].map(([i, n, t, p]) => `<div class="c"><img src="/assets/loja/${i}.webp"><b>${n}</b><small>${t}</small><span>${p}</span></div>`).join('')}</div>
<div class="foot">digitais: estude na tela ou imprima pra treinar</div>`)],
  'wa-06-como-funciona': [1080, 1080, () => base(1080, 1080, `
body{background:${C.navy};color:${C.cream};position:relative}
h1{position:absolute;left:60px;top:50px;font-size:110px;color:${C.gold}}
.s{position:absolute;left:60px;right:60px;top:230px;display:flex;flex-direction:column;gap:26px}
.s div{display:flex;gap:28px;align-items:center;background:${C.cream};color:${C.ink};border-radius:18px;padding:22px 30px;box-shadow:10px 10px 0 ${C.red}}
.s i{font-family:Anton;font-style:normal;font-size:96px;color:${C.red};width:80px}.s b{font-family:Anton;font-weight:400;text-transform:uppercase;font-size:44px;display:block}.s span{font-size:30px;font-weight:600}
.paul{position:absolute;right:30px;top:30px;width:220px}
.foot{position:absolute;left:0;right:0;bottom:0;height:70px;background:${C.red};display:flex;align-items:center;justify-content:center;font-family:'Special Elite';font-size:30px}
`, `<h1 class="A">como funciona</h1><img class="paul" src="${PAUL.selfie}">
<div class="s"><div><i>1</i><p><b>entra pelo link</b><span>${SITE}: celular, tablet ou computador</span></p></div><div><i>2</i><p><b>joga e estuda</b><span>jogos de ritmo, leitura e teoria, com o Paul explicando</span></p></div><div><i>3</i><p><b>ganha estrelas</b><span>com o código do aluno: estrelas, roleta e álbum de figurinhas</span></p></div></div>
<div class="foot">${SITE}</div>`)],
};

// ---------- banners (site, Google Display, mobile) ----------
function banner(w, h, kind) {
  const u = Math.min(w, h);
  const common = `body{background:${C.red};color:${C.cream};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#ffffff22 ${u * 0.004}px,transparent ${u * 0.006}px) 0 0/${u * 0.05}px ${u * 0.05}px}
.phone{position:absolute;border-width:${u * 0.018}px;border-radius:${u * 0.09}px}.phone::before{height:${u * 0.03}px}
.btn{background:${C.gold};color:${C.ink};border-width:${u * 0.006}px;position:absolute}.logo{position:absolute}.paul{position:absolute}`;
  if (kind === 'strip') { // 728x90, 320x100, 320x50
    const small = w < 400;
    const lh = small ? (h >= 100 ? h * 0.34 : h * 0.5) : h * 0.5;
    return base(w, h, `${common}
.logo{height:${lh}px;left:${h * 0.15}px;top:${small && h >= 100 ? h * 0.1 : (h - lh) / 2}px;filter:brightness(0) invert(1)}
.t{position:absolute;${small ? `left:${h * 0.15}px;top:${h * 0.52}px;font-size:${h * 0.2}px;width:${w * 0.6}px` : `left:${h * 2.9}px;top:0;height:${h}px;display:flex;align-items:center;font-size:${h * 0.3}px;width:${w - h * 2.9 - h * 2.2}px`};font-family:Anton;text-transform:uppercase;line-height:1;white-space:nowrap;color:${C.cream}}.t em{font-style:normal;color:${C.gold}}
.btn{right:${h * 0.15}px;top:${small && h < 100 ? h * 0.2 : h * 0.3}px;font-size:${h * (small && h < 100 ? 0.34 : 0.28)}px;padding:${h * 0.1}px ${h * 0.2}px;white-space:nowrap}`,
      `<div class="dots"></div><img class="logo" src="/assets/logo-nome.png">${!(small && h < 100) ? `<div class="t">${small ? 'jogos que <em>ensinam</em> música' : 'jogue, ouça e <em>aprenda música</em>'}</div>` : ''}<span class="btn A">jogar</span>`);
  }
  if (kind === 'tall') { // 160x600, 300x600
    const pw = w * 0.74;
    return base(w, h, `${common}
.logo{left:${w * 0.12}px;top:${w * 0.1}px;width:${w * 0.76}px;filter:brightness(0) invert(1)}
.t{position:absolute;left:${w * 0.08}px;right:${w * 0.08}px;top:${w * 0.45}px;font-family:Anton;text-transform:uppercase;font-size:${w * 0.17}px;line-height:1;text-align:center}.t em{font-style:normal;color:${C.gold}}
.phone{left:${(w - pw) / 2}px;top:${w * 0.95}px;width:${pw}px;transform:rotate(3deg)}
.btn{left:${w * 0.1}px;right:${w * 0.1}px;bottom:${w * 0.08}px;text-align:center;font-size:${w * 0.13}px;z-index:4}.paul{display:none}`,
      `<div class="dots"></div><img class="logo" src="/assets/logo-nome.png"><div class="t">jogos que <em>ensinam</em> música</div><div class="phone"><img src="${P('toca-aqui-jogando')}"></div><span class="btn A">jogar grátis</span>`);
  }
  // wide / box / square
  const sq = w / h < 1.3;
  const ph = sq ? h * 0.62 : h * 0.96; const pw = ph * 390 / 844;
  return base(w, h, `${common}
.logo{left:${u * 0.06}px;top:${u * 0.06}px;height:${u * (sq ? 0.12 : 0.15)}px;filter:brightness(0) invert(1)}
.t{position:absolute;left:${u * 0.06}px;top:${sq ? u * 0.24 : u * 0.28}px;width:${sq ? w * 0.88 : w * 0.4}px;font-family:Anton;text-transform:uppercase;font-size:${u * (sq ? 0.115 : 0.12)}px;line-height:.98}.t em{font-style:normal;color:${C.gold}}
.s{position:absolute;left:${u * 0.06}px;top:${sq ? u * 0.52 : u * 0.64}px;width:${sq ? w * 0.6 : w * 0.42}px;font-size:${u * (sq ? 0.042 : 0.052)}px;font-weight:700;line-height:1.15}
.btn{left:${u * 0.06}px;bottom:${u * 0.07}px;font-size:${u * (sq ? 0.07 : 0.075)}px}
.phone{width:${pw}px;${sq ? `right:${u * 0.06}px;bottom:-${ph * 0.12}px;transform:rotate(4deg)` : `right:${w * 0.08}px;top:${h * 0.1}px;transform:rotate(4deg)`}}
.phone2{${sq ? 'display:none' : `right:${w * 0.08 + pw * 0.85}px;top:${h * 0.2}px;transform:rotate(-5deg);z-index:0`}}
.paul{${u < 400 ? 'display:none;' : ''}height:${u * (sq ? 0.32 : 0.42)}px;${sq ? `left:${u * 0.52}px;bottom:${u * 0.02}px` : `right:${w * 0.08 + pw * 0.9}px;bottom:0`}}`,
    `<div class="dots"></div><img class="logo" src="/assets/logo-nome.png"><div class="t">jogos que <em>ensinam</em> música</div><div class="s">ritmo, leitura de partitura e teoria brincando, com a professora Bea e o Paul</div>
${sq ? '' : `<div class="phone phone2"><img src="${P('uno-musical-jogando')}"></div>`}<div class="phone"><img src="${P('toca-aqui-jogando')}"></div><span class="btn A">jogar grátis</span><img class="paul" src="${PAUL.bateria}">`);
}

// ---------- YouTube ----------
const YT = {
  'yt-01-jogos-que-ensinam': (W, H) => base(W, H, `body{background:${C.red};color:${C.cream};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#ffffff22 3px,transparent 4px) 0 0/40px 40px}
h1{position:absolute;left:60px;top:50px;font-size:190px;width:780px}h1 span{color:${C.gold}}.sub{position:absolute;left:60px;bottom:50px;font-size:58px;background:${C.gold};color:${C.ink};padding:6px 28px;transform:rotate(-2deg)}
.phone{position:absolute;right:90px;top:50px;width:340px;transform:rotate(5deg);border-width:12px}.paul{position:absolute;right:340px;bottom:0;width:360px}
`, `<div class="dots"></div><h1 class="A">jogos que <span>ensinam</span> bateria</h1><div class="sub A">teste no celular</div><div class="phone"><img src="${P('beat-hero-jogando')}"></div><img class="paul" src="${PAUL.bateria}">`),
  'yt-02-aprenda-a-ler-partitura': (W, H) => base(W, H, `body{background:${C.navy};color:${C.cream};position:relative}
h1{position:absolute;left:60px;top:40px;font-size:175px;width:800px}h1 span{color:${C.gold}}.sub{position:absolute;left:60px;bottom:50px;font-size:56px;background:${C.red};padding:6px 28px;transform:rotate(-2deg)}
.phone{position:absolute;right:80px;top:60px;width:340px;transform:rotate(-4deg);border-width:12px}.paul{position:absolute;right:360px;bottom:0;width:320px}
`, `<h1 class="A">ler <span>partitura</span> jogando</h1><div class="sub A">pauLta · grátis pra testar</div><div class="phone"><img src="${P('paulta-jogando')}"></div><img class="paul" src="${PAUL.apontando}">`),
  'yt-03-bateria-pelo-celular': (W, H) => base(W, H, `body{background:${C.gold};color:${C.ink};position:relative}
h1{position:absolute;left:60px;top:40px;font-size:200px;width:760px;color:${C.red}}.sub{position:absolute;left:60px;bottom:50px;font-size:56px;background:${C.ink};color:${C.cream};padding:6px 28px;transform:rotate(2deg)}
.phone{position:absolute;right:80px;top:50px;width:340px;transform:rotate(4deg);border-width:12px}.paul{position:absolute;right:360px;bottom:0;width:340px}
`, `<h1 class="A">bateria no celular?</h1><div class="sub A">toque, grave e estude</div><div class="phone"><img src="${P('tocar-bateria')}"></div><img class="paul" src="${PAUL.paz}">`),
  'yt-04-uno-musical': (W, H) => base(W, H, `body{background:${C.wine};color:${C.cream};position:relative}
h1{position:absolute;left:60px;top:40px;font-size:200px;width:800px}h1 span{color:${C.gold}}.sub{position:absolute;left:60px;bottom:50px;font-size:56px;background:${C.gold};color:${C.ink};padding:6px 28px;transform:rotate(-2deg)}
.phone{position:absolute;right:80px;top:50px;width:340px;transform:rotate(-4deg);border-width:12px}.paul{position:absolute;right:360px;bottom:0;width:330px}
`, `<h1 class="A">uno <span>musical</span></h1><div class="sub A">vença o Paul nas figuras</div><div class="phone"><img src="${P('uno-musical-jogando')}"></div><img class="paul" src="${PAUL.selfie}">`),
};
const YTBANNER = () => base(2560, 1440, `body{background:${C.red};color:${C.cream};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#ffffff22 4px,transparent 5px) 0 0/60px 60px}
.safe{position:absolute;left:507px;top:508px;width:1546px;height:423px;display:flex;align-items:center;gap:40px}
.t{font-size:150px;line-height:.95}.t em{font-style:normal;color:${C.gold}}.s{font-family:'Special Elite';font-size:44px;margin-top:20px}.paul{height:420px}
.side1{position:absolute;left:60px;top:60px;height:300px;transform:rotate(-8deg)}.side2{position:absolute;right:80px;bottom:80px;height:360px;transform:rotate(6deg)}
`, `<div class="dots"></div><img class="side1" src="${PAUL.skate}"><img class="side2" src="${PAUL.violao}"><div class="safe"><img class="paul" src="${PAUL.bateria}"><div><div class="t A">bateria, música e <em>jogos</em></div><div class="s">@beateristadrummer · ${SITE}</div></div></div>`);

// ---------- render ----------
const browser = await chromium.launch({ args: ['--no-sandbox'] });
async function shot(file, w, h, html, scale = 1) {
  if (FILTRO && !FILTRO.test(file)) return;
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(async () => { await Promise.all(['1em Anton','1em "Special Elite"','1em "Permanent Marker"','700 1em "Hanken Grotesk"','400 1em "Hanken Grotesk"'].map((f) => document.fonts.load(f, 'aAÇãé'))); await document.fonts.ready; }); await pg.waitForTimeout(250);
  await pg.screenshot({ path: path.join(OUT, file) }); await pg.close(); console.log('ok', file);
}
for (const g of JOGOS) { const [w, h, html] = feed(g); await shot(`posts-feed/${g.id}.png`, w, h, html); const [w2, h2, html2] = story(g); await shot(`stories/${g.id}.png`, w2, h2, html2); }
for (const [n, [w, h, f]] of Object.entries(WA)) await shot(`whatsapp-pais/${n}.png`, w, h, f());
const BN = [['site-hero-1920x600', 1920, 600, 'wide'], ['google-landscape-1200x628', 1200, 628, 'wide'], ['google-square-1200x1200', 1200, 1200, 'sq'], ['google-300x250', 300, 250, 'wide'], ['google-336x280', 336, 280, 'wide'], ['google-970x250', 970, 250, 'wide'], ['google-728x90', 728, 90, 'strip'], ['google-320x100', 320, 100, 'strip'], ['google-320x50', 320, 50, 'strip'], ['google-160x600', 160, 600, 'tall'], ['google-300x600', 300, 600, 'tall']];
for (const [n, w, h, k] of BN) await shot(`banners/${n}.png`, w, h, banner(w, h, k === 'sq' ? 'wide' : k), (w < 400 || h < 300) ? 2 : 1);
for (const [n, f] of Object.entries(YT)) await shot(`youtube/${n}.png`, 1280, 720, f(1280, 720));
await shot('youtube/canal-banner-2560x1440.png', 2560, 1440, YTBANNER());
await shot('banners/logo-quadrado-1200x1200.png', 1200, 1200, base(1200, 1200, `body{background:${C.cream};display:flex;align-items:center;justify-content:center}img{width:900px}`, `<img src="/assets/logo-nome.png">`));
await shot('banners/logo-horizontal-1200x300.png', 1200, 300, base(1200, 300, `body{background:${C.cream};display:flex;align-items:center;justify-content:center}img{height:240px}`, `<img src="/assets/logo-nome.png">`));
await browser.close(); srv.close();
