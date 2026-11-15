// Série "a Bea e a escola" (1080×1350) no modelo que a Bea aprovou, nas cores da marca (azul, vinho, creme; NADA de verde).
// Fotos em marketing/fotos-bea/ (já clareadas). Textos só com fatos da página de vendas e do banner da escola.
// Uso: NODE_PATH=$(npm root -g) node scripts/kit-apresentacao-bea.mjs  -> marketing/prontos/apresentacao/serie-bea/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = path.join(ROOT, 'marketing/prontos/apresentacao/serie-bea'); fs.mkdirSync(OUT, { recursive: true });
const CORES = { azul: ['#0d1a36', '#f4ead8', '#f2b632', '#a8182e'], vinho: ['#a8182e', '#f4ead8', '#f2b632', '#10234a'], creme: ['#f4ead8', '#10234a', '#a8182e', '#10234a'] }; // fundo, texto, destaque, etiqueta 2
const arte = ({ foto, pos, cor, t1, t2, e1, e2, corpo, fim, paul = 'bateria', larga = false, dir = '' }) => { const [BG, TX, DQ, ET2] = CORES[cor]; return `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Marker;src:url(${u('assets/fonts/PermanentMarker-latin.woff2')}) format('woff2')}
@font-face{font-family:Gochi;src:url(${u('assets/fonts/GochiHand-latin.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;background:${BG};color:${TX};position:relative;overflow:hidden}
.p{position:absolute;inset:0;background:radial-gradient(${TX}1c 2px,transparent 2.6px) 0 0/30px 30px}
.f{position:absolute;right:54px;top:250px;width:520px;height:780px;background:#fff;border-radius:16px;box-shadow:12px 14px 0 rgba(0,0,0,.35);padding:12px;transform:rotate(3deg)}
.f img{width:100%;height:100%;object-fit:cover;object-position:${pos};display:block;border-radius:8px}
h1{position:absolute;left:60px;top:70px;font:400 ${Math.max(t1.length, t2.length) > 10 ? 78 : 100}px/.98 Marker,cursive;transform:rotate(-3deg);transform-origin:0 0;white-space:nowrap}h1 em{font-style:normal;display:block;color:${DQ};padding-left:44px}
.li{position:absolute;font:400 46px/1.1 Gochi,cursive;padding:8px 22px 14px;border-radius:16px;white-space:nowrap}
.s{position:absolute;font:400 44px/1.14 Gochi,cursive}
.c{position:absolute;right:20px;bottom:14px;height:250px;filter:drop-shadow(8px 10px 0 rgba(0,0,0,.3))}
${larga ? '.f{left:60px;right:60px;top:270px;width:auto;height:610px;transform:rotate(-2deg)}.li.a{top:915px!important}.li.b{top:1010px!important}.s.co{left:520px!important;top:925px!important;width:500px!important;font-size:40px}.s.fi{top:1150px!important}' : ''}</style><div class="p"></div>
<h1>${t1}<em>${t2}</em></h1>
<div class="f"><img src="${(dir ? pathToFileURL(path.join(dir, foto + '.jpg')).href : u('marketing/fotos-bea/' + foto + '.jpg'))}"></div>
<div class="li a" style="left:50px;top:400px;background:${TX};color:${BG};transform:rotate(-2deg)">${e1}</div>
<div class="li b" style="left:70px;top:500px;background:${ET2 === BG ? DQ : ET2};color:#f4ead8;transform:rotate(1.5deg)">${e2}</div>
<div class="s co" style="left:60px;top:650px;width:420px">${corpo}</div>
<div class="s fi" style="left:60px;top:1120px;width:600px;font-size:58px;color:${DQ};transform:rotate(-2deg)">${fim}</div>
<img class="c" src="${u('assets/originals/paul-png/coloridos-hd/paul-' + paul + '.png')}">`; };
export const SERIE = {
  '1-oi-eu-sou-a-bea': { foto: 'bea-camiseta-baquetas', pos: '70% 30%', cor: 'vinho', t1: 'oi, eu sou', t2: 'a bea!', e1: 'professora de bateria', e2: 'fundadora da Beaterista', corpo: 'quando um aluno trava, eu penso: como transformar isso num desafio que ele queira tentar de novo?', fim: 'foi assim que<br>nasceram os jogos.' },
  '2-educacao-com-proposito': { foto: 'bea-moldura-proposito', pos: '50% 40%', cor: 'azul', t1: 'educação musical', t2: 'com propósito', e1: 'esse é o nosso lema', e2: 'na Beaterista', corpo: 'na sala de aula, no palco e agora também na tela.', fim: 'vem tocar<br>com a gente.', paul: 'professor' },
  '3-da-sala-pro-palco': { foto: 'bea-palco-rindo', pos: '40% 30%', cor: 'creme', t1: 'da sala de aula', t2: 'pro palco', e1: 'escola de música', e2: 'em Araçatuba, SP', corpo: 'na Beaterista a música acontece em sala de aula e no palco.', fim: 'bora tocar?', paul: 'microfone' },
  '4-eu-ensino-o-que-eu-toco': { foto: 'bea-palco-vermelha', pos: '30% 40%', cor: 'azul', t1: 'eu ensino', t2: 'o que eu toco', e1: 'baterista', e2: 'e professora', corpo: 'os exercícios que eu estudo são os mesmos que eu ensino e levo pro palco.', fim: 'do palco<br>pra aula.' },
  '6-o-ritmo-cabe-numa-caixa': { foto: 'bea-cajon', pos: '50% 20%', cor: 'creme', t1: 'o ritmo cabe', t2: 'numa caixa', e1: 'cajón', e2: 'percussão', corpo: 'bateria, cajón ou pandeiro: tudo começa no mesmo pulso.', fim: 'já tocou um?', paul: 'cajon' },
  '7-rindo-na-bateria': { foto: 'bea-bateria-rindo', pos: '45% 40%', cor: 'azul', larga: true, t1: 'meu lugar', t2: 'favorito', e1: 'atrás da bateria', e2: 'com a camiseta da escola', corpo: 'é daqui que saem as ideias pros jogos e pras aulas.', fim: 'bora tocar?' },
  '5-nao-e-so-bateria': { foto: 'bea-guitarra', pos: '62% 60%', cor: 'vinho', t1: 'não é só', t2: 'bateria', e1: 'violão e guitarra', e2: 'baixo e teclado', corpo: 'na escola e nos jogos tem lugar pra mais de um instrumento.', fim: 'qual é o seu?', paul: 'guitarra' },
};
// série "a marca" (perfil do Paul): só objetos e mãos, sem rosto de aluno
export const MARCA = {
  '1-desenha-o-som': { foto: 'marca-desenhando-figuras', pos: '40% 40%', cor: 'creme', t1: 'aqui a gente', t2: 'desenha o som', e1: 'semínima, colcheia', e2: 'fusa e semifusa', corpo: 'antes de tocar, o aluno aprende a reconhecer e desenhar cada figura.', fim: 'depois vira jogo.', paul: 'colorindo' },
  '2-ate-a-palheta': { foto: 'marca-palhetas', pos: '60% 60%', cor: 'azul', t1: 'até a palheta', t2: 'é beaterista', e1: 'pra violão', e2: 'e guitarra', corpo: 'cada detalhe da escola leva a nossa marca.', fim: 'qual é o seu<br>instrumento?', paul: 'guitarra' },
  '3-cada-detalhe': { foto: 'marca-copo-adesivo', pos: '50% 45%', cor: 'vinho', t1: 'cada detalhe', t2: 'tem a nossa cara', e1: 'copo e adesivo', e2: 'camiseta e palheta', corpo: 'quem estuda aqui leva a Beaterista pra casa.', fim: 'é time!', paul: 'oculos' },
  '4-bastidores': { foto: 'marca-cracha-producao', pos: '50% 35%', cor: 'azul', t1: 'bastidores', t2: 'do show', e1: 'Beaterista Team', e2: 'produção', corpo: 'por trás de cada apresentação dos alunos tem um time inteiro.', fim: 'bora pro palco?', paul: 'microfone' },
  '5-vem-conhecer': { foto: 'marca-cartao', pos: '55% 40%', cor: 'creme', t1: 'vem conhecer', t2: 'a escola', e1: 'Araçatuba, SP', e2: 'aulas presenciais', corpo: 'a Beaterista também existe fora da tela.', fim: '@beaterista<br>.escolademusica', paul: 'professor' },
};
// série "nossos alunos": a Bea confirmou (15/nov) que os pais autorizam. As FOTOS e as ARTES com criança NÃO entram no repositório (é público):
// rodar com FOTOS_ALUNOS=/pasta/das/fotos SAIDA_ALUNOS=/pasta/de/saida
export const ALUNOS = {
  '1-todo-mundo-e-da-banda': { foto: 'time-rock', pos: '50% 40%', cor: 'azul', larga: true, t1: 'aqui todo mundo', t2: 'é da banda', e1: 'alunos', e2: 'da Beaterista', corpo: 'cada um no seu tempo, todo mundo no mesmo palco.', fim: 'vem pra banda!', paul: 'oculos' },
  '2-pequeno-na-bateria': { foto: 'pequeno-bateria', pos: '40% 50%', cor: 'creme', larga: true, t1: 'a bateria é grande', t2: 'a vontade é maior', e1: 'musicalização', e2: 'infantil', corpo: 'os pequenos também têm lugar na Beaterista.', fim: 'bora tocar?' },
  '3-sorriso-de-quem-tocou': { foto: 'sorriso-oculos', pos: '45% 40%', cor: 'vinho', larga: true, t1: 'esse sorriso', t2: 'é de quem tocou', e1: 'aula de bateria', e2: 'na Beaterista', corpo: 'aprender música tem que ser gostoso assim.', fim: 'é ou não é?' },
  '4-baqueta-pra-cima': { foto: 'baqueta-pra-cima', pos: '45% 40%', cor: 'azul', larga: true, t1: 'baqueta pra cima', t2: 'que é festa', e1: 'aluno toca', e2: 'a Bea vibra junto', corpo: 'cada conquista na bateria a gente comemora.', fim: 'toca aqui!' },
  '5-concentracao': { foto: 'teclado-concentrado', pos: '55% 30%', cor: 'creme', t1: 'concentração', t2: 'nível máximo', e1: 'teclado', e2: 'no palco', corpo: 'língua pra fora ajuda a acertar a nota. quem nunca?', fim: 'dia de<br>apresentação.', paul: 'teclado' },
  '6-do-acorde-ao-palco': { foto: 'violao-palco', pos: '50% 35%', cor: 'azul', t1: 'do primeiro acorde', t2: 'ao palco', e1: 'violão', e2: 'apresentação', corpo: 'na Beaterista o aluno estuda na sala e mostra no palco.', fim: 'qual música<br>você tocaria?', paul: 'guitarra' },
  '7-palco-e-diversao': { foto: 'palco-risada', pos: '45% 25%', cor: 'vinho', t1: 'palco também', t2: 'é diversão', e1: 'aluno e professor', e2: 'juntos no palco', corpo: 'aqui o professor sobe junto, e o medo vai embora.', fim: 'olha essa<br>alegria!', paul: 'microfone' },
  '8-fone-e-baqueta': { foto: 'fone-pad', pos: '70% 40%', cor: 'azul', t1: 'fone no ouvido', t2: 'baqueta na mão', e1: 'treino no pad', e2: 'antes da bateria', corpo: 'primeiro ouve, depois treina no pad, depois vai pra bateria.', fim: 'igual nos<br>jogos do Paul.', paul: 'metronomo' },
};
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch();
  const FA = process.env.FOTOS_ALUNOS, SA = process.env.SAIDA_ALUNOS;
  for (const [pasta, pre, serie] of [['serie-bea', 'bea', SERIE], ['serie-marca', 'marca', MARCA], ...(FA && SA ? [[SA, 'alunos', ALUNOS]] : [])]) for (let [nome, d] of Object.entries(serie)) {
    if (pre === 'alunos') d = { ...d, dir: FA };
    const OUT = path.isAbsolute(pasta) ? pasta : path.join(ROOT, 'marketing/prontos/apresentacao', pasta); fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } }); const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, arte(d));
    await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${pre}-${nome}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); console.log('ok', nome);
  }
  await browser.close();
}
