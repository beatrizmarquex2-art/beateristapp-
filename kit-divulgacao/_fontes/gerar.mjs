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
const ZAP = '(18) 99180-4150';
const PARC = `<img class="parc" src="/assets/parceiros-preto.png" alt="Pad Gorilla, Spark, Nagano">`;
const BF = JSON.parse(fs.readFileSync(path.join(OUT, '_fontes/bf-config.json'), 'utf8'));
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
  { id: 'cara-a-cara', nome: 'Cara a Cara', lab: 'cartas e tabuleiro', frase: 'o Paul escolheu um instrumento em segredo: faça perguntas de sim ou não e descubra qual é', dev: ['dedução', 'vocabulário de instrumentos', 'atenção'], img: 'cara-instrumentos-jogando', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'apontando' },
  { id: 'quebra-cabeca', nome: 'Quebra-cabeça', lab: 'cartas e tabuleiro', frase: 'monte o palco, a guitarra, o estúdio e mais', dev: ['percepção visual', 'paciência', 'foco'], img: 'quebra-cabeca', bg: C.cream, fg: C.ink, acc: C.red, paul: 'violao' },
  { id: 'memoria', nome: 'Jogo da Memória', lab: 'cartas e tabuleiro', frase: 'instrumentos, figuras, bandas e profissões da música', dev: ['memória', 'vocabulário musical', 'atenção'], img: 'memoria-instrumentos', bg: C.navy, fg: C.cream, acc: C.gold, paul: 'feliz' },
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
.logo{height:60px;width:auto;align-self:flex-start}.logo.w{filter:brightness(0) invert(1)}
.phone{position:relative;border:14px solid #151213;border-radius:64px;overflow:hidden;background:#151213;box-shadow:0 40px 60px -20px rgba(0,0,0,.55),0 0 0 3px rgba(255,255,255,.12)}
.phone img{display:block;width:100%}
.phone::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:34%;height:26px;background:#151213;border-radius:0 0 18px 18px;z-index:3}
.btn{display:inline-block;font-family:'Anton';text-transform:uppercase;letter-spacing:.04em;padding:.5em 1.1em;border-radius:.3em;box-shadow:.12em .12em 0 rgba(0,0,0,.85);border:.06em solid #151213}
.chip{display:inline-block;font-family:'Special Elite';padding:.25em .7em;border:2px solid currentColor;border-radius:999px}
${css}</style></head><body>${body}</body></html>`;

const logoFor = (g) => `<img class="logo ${[C.red, C.navy, C.wine, C.ink].includes(g.bg) ? 'w' : ''}" src="/assets/logo-nome.png">`;

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
.foot{position:absolute;left:0;right:0;bottom:0;height:90px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:space-between;padding:0 50px;gap:20px;font-size:28px;font-family:'Special Elite'}.foot .parc{height:56px;filter:brightness(0) invert(1);opacity:.9}.foot span{white-space:nowrap}
.foot b{color:${C.gold};font-family:'Anton';font-weight:400;letter-spacing:.04em;font-size:34px}
`, `<div class="dots"></div>
<div class="top">${logoFor(g)}<span class="chip">${g.lab}</span></div>
<div class="txt"><h1 class="A">${g.nome}</h1><p class="fr">${g.frase}</p>
<div class="dev"><b>desenvolve:</b>${g.dev.map((d) => `<span class="chip">${d}</span>`).join('')}</div></div>
<div class="phone"><img src="${P(g.img)}"></div>
<img class="paul" src="${PAUL[g.paul]}">
<div class="foot"><span><b>jogue agora</b> ${SITE}</span>${PARC}</div>`)];
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
.site{position:absolute;left:0;right:0;bottom:150px;text-align:center;font-family:'Special Elite';font-size:34px}.parc{position:absolute;left:50%;margin-left:-230px;bottom:70px;height:56px;filter:brightness(0) invert(1);opacity:.85}.pt{position:absolute;left:0;right:0;bottom:38px;text-align:center;font-family:'Special Elite';font-size:22px;opacity:.7}
`, `<div class="dots"></div>
<div class="top">${logoFor(g)}<span class="chip">${g.lab}</span><h1 class="A">${g.nome}</h1><p class="fr">${g.frase}</p></div>
<div class="phone"><img src="${P(g.img)}"></div><img class="paul" src="${PAUL[g.paul]}">
<div class="cta"><span class="btn">jogar agora</span></div><div class="site">${SITE}</div>${PARC}<div class="pt">em parceria com Pad Gorilla · Spark · Nagano</div>`)];
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
.logo{position:absolute;left:60px;bottom:50px;height:90px}.zap{position:absolute;left:60px;top:900px;font-size:30px;font-weight:800}
`, `<div class="dots"></div><h1 class="A">teste grátis o app da bea</h1><p>abre no celular ou no tablet, sem instalar nada. tem jogo liberado pra experimentar agora.</p><span class="btn">jogar agora</span><div class="u">${SITE}</div><div class="zap">whatsapp ${ZAP}</div>
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
<div class="l">ebook pra iniciantes: peças, figuras rítmicas, partitura e rudimentos · 44 páginas em PDF</div><img class="cap" src="/assets/loja/bateria-start.webp"><div class="foot">link na lojinha · whatsapp ${ZAP}</div>`)],
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
<div class="foot">${SITE} · whatsapp ${ZAP}</div>`)],
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


// ---------- álbum de figurinhas ----------
const CARD = (c) => `/kit-divulgacao/_fontes/cartas/${c}.webp`;
const ALBUM = {
  'album-paul-e-beaterista': { bg: C.ink, fg: C.cream, acc: C.gold, lab: 'álbum de figurinhas', t: 'colecione o <em>Paul</em> e a <em>Beaterista</em>', s: 'cartas exclusivas, só aqui', cards: ['P01', 'F001', 'P03', 'F004', 'P05'] },
  'album-rock': { bg: C.red, fg: C.cream, acc: C.gold, lab: 'álbum de figurinhas', t: 'figurinhas de <em>rock</em>', s: 'Queen, Metallica, Guns, KISS, Led Zeppelin…', cards: ['F045', 'F046', 'F047', 'F048', 'F050'] },
  'album-pop': { bg: C.navy, fg: C.cream, acc: C.gold, lab: 'álbum de figurinhas', t: 'figurinhas de <em>pop</em>', s: 'Michael Jackson, Britney, Avril, Billie, Ed Sheeran…', cards: ['F044', 'F114', 'F058', 'F042', 'F128'] },
  'album-colecao-completa': { bg: C.gold, fg: C.ink, acc: C.red, lab: 'álbum de figurinhas', t: 'bandas, <em>pop</em> e o <em>Paul</em>', s: 'jogue, ganhe pacotes e complete o álbum', cards: ['F013', 'P02', 'F044', 'F001', 'F104'] },
};
function album(a, W, H) {
  const story = H > 1500; const cw = story ? 330 : 280; const rots = [-22, -11, 0, 11, 22]; const dy = [60, 14, 0, 14, 60]; const step = story ? 170 : 145;
  const x0 = W / 2 - cw / 2;
  return base(W, H, `body{background:${a.bg};color:${a.fg};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(${a.fg}22 2.5px,transparent 3px) 0 0/30px 30px}
.top{position:absolute;left:70px;right:70px;top:${story ? 150 : 60}px;display:flex;flex-direction:column;gap:18px}.top .chip{font-size:30px;align-self:flex-start}
h1{font-size:${story ? 170 : 112}px;color:${a.fg}}h1 em{font-style:normal;color:${a.acc}}.s{font-size:${story ? 48 : 40}px;font-weight:700;line-height:1.15;max-width:900px}
.k{position:absolute;width:${cw}px;filter:drop-shadow(10px 14px 0 rgba(0,0,0,.35))}
.btn{position:absolute;left:0;right:0;margin:auto;width:fit-content;bottom:${story ? 330 : 190}px;font-size:${story ? 56 : 46}px;background:${a.acc};color:${a.acc === C.gold ? C.ink : C.cream}}
.foot{position:absolute;left:0;right:0;bottom:0;height:90px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:center;font-size:28px;font-family:'Special Elite';gap:18px}.foot b{color:${C.gold};font-family:Anton;font-weight:400}
.fine{position:absolute;left:0;right:0;bottom:${story ? 240 : 100}px;text-align:center;font-family:'Special Elite';font-size:24px;opacity:.8}`,
    `<div class="dots"></div><div class="top">${logoFor({ bg: a.bg })}<span class="chip">${a.lab}</span><h1 class="A">${a.t}</h1><p class="s">${a.s}</p></div>
${a.cards.map((c, i) => `<img class="k" src="${CARD(c)}" style="left:${x0 + (i - 2) * step}px;top:${(story ? 760 : 660) + dy[i]}px;transform:rotate(${rots[i]}deg);z-index:${i === 2 ? 5 : 3 - Math.abs(i - 2)}">`).join('')}
<span class="btn A">jogue e colecione</span><div class="fine">131 figurinhas pra colecionar · ganhe pacotes jogando</div><div class="foot"><b>${SITE}</b> · estrelas, roleta e álbum com o código de aluno</div>`);
}
// faça a sua figurinha
function suaFigurinha(W, H) {
  const story = H > 1500;
  return base(W, H, `body{background:${C.cream};color:${C.ink};position:relative}.dots{position:absolute;inset:0;background:radial-gradient(#00000012 2.5px,transparent 3px) 0 0/30px 30px}
.top{position:absolute;left:70px;top:${story ? 150 : 60}px;right:70px;display:flex;flex-direction:column;gap:18px}.top .chip{font-size:30px;align-self:flex-start}
h1{font-size:${story ? 170 : 140}px;color:${C.red}}h1 em{font-style:normal;color:${C.ink}}.s{font-size:${story ? 48 : 36}px;font-weight:700;line-height:1.15;max-width:${story ? 760 : 520}px}
.k{position:absolute;width:${story ? 420 : 380}px;filter:drop-shadow(10px 14px 0 rgba(0,0,0,.3))}
.p{position:absolute;width:180px}
.btn{position:absolute;left:70px;bottom:${story ? 330 : 140}px;font-size:${story ? 56 : 46}px;background:${C.red};color:${C.cream}}
.foot{position:absolute;left:0;right:0;bottom:0;height:90px;background:${C.ink};color:${C.cream};display:flex;align-items:center;justify-content:center;font-size:28px;font-family:'Special Elite'}`,
    `<div class="dots"></div><div class="top"><img class="logo" src="/assets/logo-nome.png"><span class="chip">perfil do aluno</span><h1 class="A">faça a <em>sua</em> figurinha</h1><p class="s">escolha o modelo, ajuste sua foto e baixe sua cartinha. a foto fica só no seu aparelho.</p></div>
<img class="k" src="${CARD('F001')}" style="right:${story ? 70 : 90}px;top:${story ? 760 : 500}px;transform:rotate(7deg)"><img class="k" src="${CARD('P03')}" style="right:${story ? 420 : 400}px;top:${story ? 900 : 620}px;transform:rotate(-8deg)">
<img class="p" src="${PAUL.selfie}" style="left:60px;bottom:${story ? 520 : 240}px"><span class="btn A">criar a minha</span><div class="foot">${SITE} · aba perfil</div>`);
}

// ---------- black friday geral (um post por material) ----------
const CAPA_NOVA = { melodia: '/kit-divulgacao/material-da-bea/capas-e-produtos/capa-melodia-harmonia.jpg', 'combo-kids': '/kit-divulgacao/material-da-bea/capas-e-produtos/combo-kids-composto.jpg', 'bateria-kids': '/kit-divulgacao/minhas-artes/capas-dos-materiais/capa-bateria-kids.jpg', mood: '/kit-divulgacao/minhas-artes/capas-dos-materiais/capa-beaterista-mood.jpg' };
const capaSrc = (id) => CAPA_NOVA[id] || `/assets/loja/${CAPAS[id]}.webp`;
const CAPAS = { melodia: 'x', 'combo-kids': 'x', start: 'bateria-start', memoria: 'memoria', 'bateria-kids': 'bateria-kids', roboterista: 'roboterista', violao: 'violao', mood: 'mood' };
const PAUL_BF = { start: 'baqueta', roboterista: 'piscando', melodia: 'ouvindo', mood: 'amp', violao: 'andando', 'combo-kids': 'piscando', memoria: 'duvida', 'bateria-kids': 'baqueta', geral: 'andando' };
const bfCss = (W, H, story) => `body{background:${C.cream};color:${C.ink};position:relative;overflow:hidden}
.kraft{position:absolute;inset:0;background:radial-gradient(#0000000d 2px,transparent 2.5px) 0 0/26px 26px}
.brush{position:absolute;left:-40px;top:${story ? 90 : 40}px;width:${W + 80}px;height:${story ? 190 : 170}px;background:url(/assets/mural/brush-red.svg) center/100% 100% no-repeat;display:flex;align-items:center;padding-left:${story ? 190 : 250}px;gap:26px;transform:rotate(-1.5deg)}
.brush b{font-family:Anton;font-weight:400;font-size:${story ? 100 : 92}px;color:${C.cream};text-transform:uppercase;letter-spacing:.02em}
.brush span{font-family:'Special Elite';font-size:30px;background:${C.gold};color:${C.ink};padding:4px 16px;transform:rotate(2deg)}
.nt{position:absolute;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.18))}
.ttl{position:absolute;left:60px;top:${story ? 360 : 260}px;width:${story ? 520 : 500}px}
.ttl h1{color:${C.navy};line-height:.95}.ttl p{font-size:${story ? 36 : 32}px;font-weight:700;margin-top:18px;line-height:1.2}
.cov{position:absolute;right:${story ? 50 : 40}px;top:${story ? 360 : 260}px;width:${story ? 440 : 470}px;transform:rotate(4deg);box-shadow:16px 20px 0 rgba(27,24,24,.25);border:6px solid #fff;background:#fff}
.tp{position:absolute;width:130px;right:${story ? 420 : 430}px;top:${story ? 330 : 232}px;transform:rotate(-30deg);z-index:3}
.paul{position:absolute;left:30px;bottom:${story ? 330 : 225}px;width:${story ? 330 : 270}px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.18));z-index:4}
.burst{position:absolute;right:${story ? 70 : 60}px;bottom:${story ? 260 : 130}px;width:${story ? 400 : 380}px;height:${story ? 400 : 380}px;border-radius:50%;background:${C.red};border:8px solid ${C.navy};box-shadow:10px 12px 0 rgba(27,24,24,.3),inset 0 0 0 8px ${C.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${C.cream};transform:rotate(-6deg);z-index:5}
.burst s{font-family:Anton;font-size:44px;opacity:.9}.burst b{font-family:Anton;font-weight:400;font-size:${story ? 96 : 92}px;line-height:1;color:${C.gold}}.burst small{font-family:'Special Elite';font-size:24px}
.btn{position:absolute;left:60px;bottom:${story ? 220 : 110}px;font-size:44px;background:${C.navy};color:${C.cream};z-index:6}
.foot{position:absolute;left:0;right:0;bottom:0;height:90px;background:${C.navy};color:${C.cream};display:flex;align-items:center;justify-content:center;font-size:28px;font-family:'Special Elite';gap:16px}.foot b{color:${C.gold};font-family:Anton;font-weight:400}
.parc{position:absolute;right:60px;bottom:${story ? 130 : 20}px;height:50px;opacity:.9}`;
const bfDecor = (story) => `<img class="nt" src="/assets/rabiscos/notas-terracota.png" style="width:110px;left:${story ? 560 : 520}px;top:${story ? 190 : 130}px;transform:rotate(10deg);z-index:2"><img class="nt" src="/assets/rabiscos/explosao-ouro.png" style="width:300px;right:10px;top:${story ? 700 : 500}px;z-index:0;opacity:.9">`;
function bfProduto(id, W, H) {
  const p = BF.produtos[id]; const story = H > 1500; const por = p.por && p.por.trim();
  const fs = p.nome.length > 22 ? (story ? 84 : 76) : p.nome.length > 12 ? (story ? 100 : 104) : (story ? 130 : 120);
  return base(W, H, bfCss(W, H, story), `<div class="kraft"></div>${bfDecor(story)}
<div class="brush"><b>black friday</b><span>${BF.periodo}</span></div>
<div class="ttl"><h1 class="A" style="font-size:${fs}px">${p.nome}</h1><p>${p.info}</p></div>
<img class="cov" src="${capaSrc(id)}"><img class="tp" src="/assets/rabiscos/fita-1.png">
<img class="paul" src="/kit-divulgacao/_fontes/paul/${PAUL_BF[id] || 'andando'}.png">
<div class="burst">${por ? `<s>${p.de}</s><b>${p.por}</b><small>só até ${BF.periodo.split(' a ')[1]}</small>` : `<b style="font-size:60px;text-align:center">preço<br>especial</b>`}</div>
<span class="btn A">pegar na lojinha</span><div class="foot"><b>${BF.link}</b> · whatsapp ${ZAP}</div>`);
}
function bfGeral(W, H) {
  const story = H > 1500; const ids = Object.keys(CAPAS).filter((k) => !['memoria', 'bateria-kids'].includes(k));
  return base(W, H, bfCss(W, H, story) + `.t2{position:absolute;left:60px;top:${story ? 340 : 250}px;width:960px}.t2 h1{font-size:${story ? 118 : 112}px;color:${C.navy}}.t2 h1 em{font-style:normal;color:${C.red}}.t2 p{font-size:${story ? 44 : 36}px;font-weight:700;margin-top:10px;max-width:760px}
.g{position:absolute;left:50px;right:50px;top:${story ? 780 : 640}px;display:grid;grid-template-columns:repeat(${story ? 3 : 4},1fr);gap:${story ? 26 : 18}px;z-index:2}
.g img{width:100%;aspect-ratio:${story ? '1/1.1' : '1/.9'};object-fit:cover;object-position:top;border:5px solid #fff;box-shadow:8px 8px 0 rgba(27,24,24,.25);background:#fff}.g img:nth-child(odd){transform:rotate(-2deg)}.g img:nth-child(even){transform:rotate(2deg)}
.paul{left:auto;right:30px;bottom:${story ? 330 : 160}px;width:${story ? 300 : 230}px}.btn{bottom:${story ? 240 : 120}px}`,
    `<div class="kraft"></div>${bfDecor(story)}<div class="brush"><b>black friday</b><span>${BF.periodo}</span></div>
<div class="t2"><h1 class="A">tudo de <em>R$ 29,90</em><br>por R$ 19,90</h1><p>materiais em PDF de bateria, violão, partitura e jogos pra imprimir. Bateria Start por R$ 14,90.</p></div>
<div class="g">${ids.map((k) => `<img src="${capaSrc(k)}">`).join('')}</div>
<img class="paul" src="/kit-divulgacao/_fontes/paul/piscando.png"><span class="btn A">ver na lojinha</span><div class="foot"><b>${BF.link}</b> · whatsapp ${ZAP}</div>`);
}

// ---------- render ----------
const browser = await chromium.launch({ args: ['--no-sandbox'] });
async function shot(file, w, h, html, scale = 1) {
  if (FILTRO && !FILTRO.test(file)) return;
  const jpg = /^(posts-feed|stories|album|black-friday|whatsapp-pais|youtube|banners)\//.test(file) && !/logo|parceiros/.test(file); const saida = jpg ? file.replace(/\.png$/, '.jpg') : file;
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(async () => { await Promise.all(['1em Anton','1em "Special Elite"','1em "Permanent Marker"','700 1em "Hanken Grotesk"','400 1em "Hanken Grotesk"'].map((f) => document.fonts.load(f, 'aAÇãé'))); await document.fonts.ready; }); await pg.waitForTimeout(250);
  await pg.screenshot(jpg ? { path: path.join(OUT, saida), type: 'jpeg', quality: 92 } : { path: path.join(OUT, saida) }); await pg.close(); console.log('ok', saida);
}
for (const g of JOGOS) { const [w, h, html] = feed(g); await shot(`posts-feed/${g.id}.png`, w, h, html); const [w2, h2, html2] = story(g); await shot(`stories/${g.id}.png`, w2, h2, html2); }
for (const [n, [w, h, f]] of Object.entries(WA)) await shot(`whatsapp-pais/${n}.png`, w, h, f());
const BN = [['site-hero-1920x600', 1920, 600, 'wide'], ['google-landscape-1200x628', 1200, 628, 'wide'], ['google-square-1200x1200', 1200, 1200, 'sq'], ['google-300x250', 300, 250, 'wide'], ['google-336x280', 336, 280, 'wide'], ['google-970x250', 970, 250, 'wide'], ['google-728x90', 728, 90, 'strip'], ['google-320x100', 320, 100, 'strip'], ['google-320x50', 320, 50, 'strip'], ['google-160x600', 160, 600, 'tall'], ['google-300x600', 300, 600, 'tall']];
for (const [n, w, h, k] of BN) await shot(`banners/${n}.png`, w, h, banner(w, h, k === 'sq' ? 'wide' : k), (w < 400 || h < 300) ? 2 : 1);
for (const [n, f] of Object.entries(YT)) await shot(`youtube/${n}.png`, 1280, 720, f(1280, 720));
await shot('youtube/canal-banner-2560x1440.png', 2560, 1440, YTBANNER());
await shot('banners/logo-quadrado-1200x1200.png', 1200, 1200, base(1200, 1200, `body{background:${C.cream};display:flex;align-items:center;justify-content:center}img{width:900px}`, `<img src="/assets/logo-nome.png">`));
await shot('banners/logo-horizontal-1200x300.png', 1200, 300, base(1200, 300, `body{background:${C.cream};display:flex;align-items:center;justify-content:center}img{height:240px}`, `<img src="/assets/logo-nome.png">`));

for (const [n, a] of Object.entries(ALBUM)) { await shot(`album/${n}-feed.png`, 1080, 1350, album(a, 1080, 1350)); await shot(`album/${n}-story.png`, 1080, 1920, album(a, 1080, 1920)); }
await shot('album/album-faca-a-sua-figurinha-feed.png', 1080, 1350, suaFigurinha(1080, 1350)); await shot('album/album-faca-a-sua-figurinha-story.png', 1080, 1920, suaFigurinha(1080, 1920));
for (const id of Object.keys(BF.produtos)) { await shot(`black-friday/bf-${id}-feed.png`, 1080, 1350, bfProduto(id, 1080, 1350)); await shot(`black-friday/bf-${id}-story.png`, 1080, 1920, bfProduto(id, 1080, 1920)); }
await shot('black-friday/bf-geral-feed.png', 1080, 1350, bfGeral(1080, 1350)); await shot('black-friday/bf-geral-story.png', 1080, 1920, bfGeral(1080, 1920));
await shot('banners/parceiros-1200x300.png', 1200, 300, base(1200, 300, `body{background:${C.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}img{height:150px}small{font-family:'Special Elite';font-size:24px}`, `<img src="/assets/parceiros-preto.png"><small>Beaterista em parceria com Pad Gorilla · Spark · Nagano</small>`));
await browser.close(); srv.close();
