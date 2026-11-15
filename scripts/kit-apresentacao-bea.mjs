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
const CORES = { azul: ['#0d1a36', '#f4ead8', '#d8b879', '#a8182e'], vinho: ['#a8182e', '#f4ead8', '#d8b879', '#10234a'], creme: ['#f4ead8', '#10234a', '#a8182e', '#10234a'] }; // fundo, texto, destaque, etiqueta 2
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
  '8-depois-do-show': { foto: 'bea-palco-rindo', pos: '50% 45%', cor: 'vinho', larga: true, t1: 'quando o show', t2: 'dá certo', e1: 'microfone na mão', e2: 'sorriso no rosto', corpo: 'ver aluno no palco é a melhor parte de ser professora.', fim: 'obrigada, turma!', paul: 'microfone' },
  '9-dia-do-baterista': { foto: 'bea-dia-do-baterista', pos: '55% 30%', cor: 'azul', t1: 'feliz dia', t2: 'do baterista', e1: 'pra quem toca', e2: 'e pra quem vai tocar', corpo: 'o melhor instrumento do mundo merece um dia só dele.', fim: 'marca um<br>baterista!' },
  '10-ukulele': { foto: 'bea-ukulele', pos: '50% 45%', cor: 'creme', t1: 'hoje é dia', t2: 'de ukulele', e1: 'quatro cordas', e2: 'um sorrisão', corpo: 'na Beaterista tem instrumento de todo tamanho.', fim: 'qual você<br>quer aprender?', paul: 'guitarra' },
  '11-tambem-tem-teclado': { foto: 'bea-teclado', pos: '45% 50%', cor: 'vinho', t1: 'também tem', t2: 'teclado', e1: 'teclas', e2: 'e acordes', corpo: 'a baterista também se aventura nas teclas.', fim: 'já tentou?', paul: 'teclado' },
  // frases que a Bea APROVOU (15/nov), palavra por palavra: não reescrever
  '12-a-beaterista-sou-eu': { des: 'A-foto-cheia', foto: 'bea-casaco-close-claro', pos: '50% 20%', cor: 'azul', t1: 'a beaterista', t2: 'sou eu', e1: '', e2: '', corpo: 'estudando, lendo, testando com aluno e refazendo até ficar bom. cada jogo que você abre aqui passou por isso.', fim: '' },
  '13-troco-o-sono-pelo-site': { des: 'A-foto-cheia', foto: 'bea-casaco-gola', pos: '50% 20%', cor: 'vinho', t1: 'tem noite que eu', t2: 'troco o sono pelo site', e1: '', e2: '', corpo: 'porque eu sei exatamente onde meu aluno trava, e quero que o jogo resolva isso.', fim: '', paul: 'produtor' },
  '14-parece-muita-coisa': { des: 'A-foto-cheia', foto: 'bea-pb-banquinho', pos: '50% 35%', cor: 'azul', t1: 'parece muito?', t2: 'e é mesmo.', e1: '', e2: '', corpo: 'estudo, leitura, live, parceria, YouTube, aula e palco. mas é assim que nasce cada material que chega na sua casa.', fim: '', paul: 'estudando' },
  '5-nao-e-so-bateria': { foto: 'bea-guitarra', pos: '62% 60%', cor: 'vinho', t1: 'não é só', t2: 'bateria', e1: 'violão e guitarra', e2: 'baixo e teclado', corpo: 'na escola e nos jogos tem lugar pra mais de um instrumento.', fim: 'qual é o seu?', paul: 'guitarra' },
};
// 7 versões do "oi, eu sou a bea!", uma pra cada frase que a Bea aprovou (15/nov; a 2 ela recusou). Frases palavra por palavra.
export const INTRO = {
  '1-por-tras-dos-jogos': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-camiseta-baquetas', pos: '70% 25%', corpo: 'professora de bateria, fundadora da Beaterista e a pessoa por trás dos jogos do Paul.' },
  '3-com-proposito': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-moldura-proposito', pos: '50% 30%', corpo: 'eu acredito em educação musical com propósito: na sala de aula, no palco e na tela.', paul: 'professor' },
  '4-apaixonar-por-musica': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-ukulele', pos: '50% 45%', corpo: 'meu trabalho é fazer criança e adulto se apaixonarem por música.', paul: 'guitarra' },
  '5-toco-ensino-crio': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-palco-vermelha', pos: '30% 40%', corpo: 'eu toco, eu ensino e eu crio os jogos que meus alunos jogam.' },
  '6-levo-pro-palco': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-palco-rindo', pos: '50% 45%', corpo: 'tudo que eu ensino aqui eu também levo pro palco.', paul: 'microfone' },
  '7-quando-um-aluno-trava': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-dia-do-baterista', pos: '55% 30%', corpo: 'quando um aluno trava na pauta, eu penso: como transformar isso num desafio que ele queira tentar de novo? foi assim que nasceram os jogos.', paul: 'estudando' },
  '8-prazer': { des: 'A-foto-cheia', cor: 'azul', t1: 'oi, eu sou', t2: 'a bea!', e1: '', e2: '', fim: '', foto: 'bea-cajon', pos: '50% 20%', corpo: 'dou aula de bateria, invento jogo de música e ainda toco no palco. prazer!', paul: 'cajon' },
};
// exemplo de como fica "o Paul falando da Bea" (no lugar das 3 frases que o assistente tinha escrito na voz dela)
export const PAULFALA = {
  '1-lugar-favorito': { des: 'C-gibi', foto: 'bea-bateria-rindo', pos: '45% 40%', cor: 'azul', t1: 'o lugar favorito', t2: 'da bea', e1: '', e2: '', corpo: 'é daqui, de trás da bateria, que saem as ideias pros jogos e pras aulas.', fim: '' },
  '2-show-da-certo': { des: 'C-gibi', foto: 'bea-palco-rindo', pos: '50% 45%', cor: 'vinho', t1: 'quando o show', t2: 'dá certo', e1: '', e2: '', corpo: 'a Bea diz que ver aluno no palco é a melhor parte de ser professora.', fim: '', paul: 'microfone' },
  '3-ensina-o-que-toca': { des: 'C-gibi', foto: 'bea-palco-vermelha', pos: '30% 35%', cor: 'azul', t1: 'a bea ensina', t2: 'o que ela toca', e1: '', e2: '', corpo: 'os exercícios que ela estuda são os mesmos que ela ensina e leva pro palco.', fim: '' },
};
// série "a marca" (perfil do Paul): só objetos e mãos, sem rosto de aluno
export const MARCA = {
  '1-desenha-o-som': { foto: 'marca-desenhando-figuras', pos: '40% 40%', cor: 'creme', t1: 'aqui a gente', t2: 'desenha o som', e1: 'semínima, colcheia', e2: 'fusa e semifusa', corpo: 'antes de tocar, o aluno aprende a reconhecer e desenhar cada figura.', fim: 'depois vira jogo.', paul: 'colorindo' },
  '2-ate-a-palheta': { foto: 'marca-palhetas', pos: '60% 60%', cor: 'azul', t1: 'até a palheta', t2: 'é beaterista', e1: 'pra violão', e2: 'e guitarra', corpo: 'cada detalhe da escola leva a nossa marca.', fim: 'qual é o seu<br>instrumento?', paul: 'guitarra' },
  '3-cada-detalhe': { foto: 'marca-copo-adesivo', pos: '50% 45%', cor: 'vinho', t1: 'cada detalhe', t2: 'tem a nossa cara', e1: 'copo e adesivo', e2: 'camiseta e palheta', corpo: 'quem estuda aqui leva a Beaterista pra casa.', fim: 'é time!', paul: 'oculos' },
  '4-bastidores': { foto: 'marca-cracha-producao', pos: '50% 35%', cor: 'azul', t1: 'bastidores', t2: 'do show', e1: 'Beaterista Team', e2: 'produção', corpo: 'por trás de cada apresentação dos alunos tem um time inteiro.', fim: 'bora pro palco?', paul: 'microfone' },
  '5-vem-conhecer': { foto: 'marca-cartao', pos: '55% 40%', cor: 'creme', t1: 'vem conhecer', t2: 'a escola', e1: 'Araçatuba, SP', e2: 'aulas presenciais', corpo: 'a Beaterista também existe fora da tela.', fim: '@beaterista<br>.escolademusica', paul: 'professor' },
  '7-veste-a-camiseta': { foto: 'marca-camisetas-arara', pos: '40% 35%', cor: 'vinho', t1: 'veste', t2: 'a camiseta', e1: 'azul, amarela', e2: 'ou branca', corpo: 'tem do tamanho bebê ao tamanho adulto.', fim: 'qual é a sua cor?', paul: 'oculos' },
  '8-tem-bone-tambem': { foto: 'marca-bones', pos: '50% 40%', cor: 'creme', t1: 'tem boné', t2: 'também', e1: 'azul-marinho', e2: 'bordado dourado', corpo: 'mais um item com a marca da Beaterista.', fim: 'quem quer?', paul: 'oculos' },
  '9-aprenda-com-a-gente': { foto: 'marca-fachada-cursos', pos: '20% 50%', cor: 'azul', t1: 'aprenda a tocar', t2: 'com a gente', e1: 'bateria e violão', e2: 'guitarra e teclado', corpo: 'contrabaixo e musicalização infantil também.', fim: 'chama no direct!', paul: 'professor' },
  '10-caca-palavras': { foto: 'marca-caca-palavras', pos: '50% 50%', cor: 'vinho', t1: 'caça-palavras', t2: 'musical', e1: 'flauta, harpa, tuba', e2: 'pandeiro e violino', corpo: 'atividade da nossa apostila. achou todas?', fim: 'tem mais nos jogos!', paul: 'estudando' },
  '11-domino': { foto: 'marca-domino', pos: '50% 60%', cor: 'vinho', t1: 'aqui se aprende', t2: 'jogando', e1: 'dominó de figuras', e2: 'e de claves', corpo: 'o jogo sai do chão da sala e vai parar na tela.', fim: 'bora jogar?', paul: 'estudando' },
  '12-tablet-na-bateria': { foto: 'marca-tablet-bateria', pos: '50% 45%', cor: 'azul', t1: 'do tablet', t2: 'pra bateria', e1: 'paradiddle', e2: 'no Bateria Start', corpo: 'primeiro lê na tela, depois toca de verdade.', fim: 'é assim que a gente estuda.', paul: 'bateria' },
  '13-castelo-de-domino': { foto: 'marca-castelo-domino', pos: '50% 50%', cor: 'azul', t1: 'castelo', t2: 'de dominó', e1: 'figuras e claves', e2: 'empilhadas', corpo: 'quando a aula acaba e o jogo vira arquitetura.', fim: 'quem derruba?', paul: 'estudando' },
  '15-complete-o-tempo': { foto: 'marca-jogo-figuras', pos: '50% 50%', cor: 'azul', t1: 'complete', t2: 'o tempo', e1: 'semínima, colcheia', e2: 'semicolcheia', corpo: 'qual figura falta pra fechar o compasso?', fim: 'testa no app!', paul: 'metronomo' },
  '14-quebra-cabeca': { foto: 'marca-quebra-cabeca', pos: '50% 50%', cor: 'vinho', t1: 'quebra-cabeça', t2: 'do paul', e1: '6, 12 ou 24 peças', e2: 'no tablet', corpo: 'monta o Paul baterista peça por peça.', fim: 'jogue grátis!', paul: 'bateria' },
  '16-camiseta-preta': { foto: 'marca-camiseta-preta', pos: '50% 50%', cor: 'creme', t1: 'preta', t2: 'com dourado', e1: 'camiseta', e2: 'da Beaterista', corpo: 'a versão que brilha na luz do estúdio.', fim: 'quem quer?', paul: 'oculos' },
  '17-sala-de-bateria': { foto: 'marca-sala-bateria', pos: '50% 60%', cor: 'azul', t1: 'a sala onde', t2: 'tudo acontece', e1: 'duas baterias', e2: 'e muito neon', corpo: 'é aqui que nascem as aulas e os jogos.', fim: 'vem conhecer!', paul: 'bateria' },
  '18-sala-de-violao': { foto: 'marca-sala-violao', pos: '40% 50%', cor: 'creme', larga: true, t1: 'a sala', t2: 'de violão', e1: 'violões na parede', e2: 'e mesinha dos pequenos', corpo: 'tem sala pra corda, pra tecla e pros pequenos.', fim: 'escolhe a sua!', paul: 'guitarra' },
  '19-camisetas-na-mesa': { foto: 'marca-camisetas-mesa', pos: '50% 50%', cor: 'azul', t1: 'camiseta nova', t2: 'chegou', e1: 'azul-marinho', e2: 'com amarelo', corpo: 'mesa cheia no dia do evento.', fim: 'já garantiu a sua?', paul: 'oculos' },
  '20-adesivos': { foto: 'marca-adesivos', pos: '50% 50%', cor: 'vinho', t1: 'adesivo', t2: 'da beaterista', e1: 'pra colar', e2: 'em tudo', corpo: 'no caderno, no case, na bateria.', fim: 'quem quer?', paul: 'selfie' },
  '6-toda-peca-tem-nome': { foto: 'marca-folha-pecas', pos: '45% 40%', cor: 'azul', t1: 'toda peça', t2: 'tem nome', e1: 'bumbo, caixa, surdo', e2: 'chimbal, tons e pratos', corpo: 'a primeira folha de quem começa bateria na Beaterista.', fim: 'sabe todas?', paul: 'bateria' },
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
  '9-duas-baterias': { foto: 'duas-baterias', pos: '55% 60%', cor: 'vinho', t1: 'duas baterias', t2: 'um show só', e1: 'aluno na frente', e2: 'a Bea logo atrás', corpo: 'no palco ninguém toca sozinho: a professora vai junto.', fim: 'olha o sorriso<br>dela!' },
  '10-vai-com-medo-mesmo': { foto: 'plaquinhas', pos: '50% 40%', cor: 'azul', larga: true, t1: 'vai com', t2: 'medo mesmo', e1: 'se der errado', e2: 'foi improviso', corpo: 'as plaquinhas do nosso show dizem tudo.', fim: 'hoje é dia de rock!', paul: 'oculos' },
  '11-musica-nao-tem-idade': { foto: 'adulta-bateria', pos: '50% 25%', cor: 'creme', t1: 'música', t2: 'não tem idade', e1: 'bateria', e2: 'no palco', corpo: 'na Beaterista tem lugar pra quem começa cedo e pra quem começa agora.', fim: 'e você,<br>começa quando?' },
  '12-cada-sino-uma-nota': { foto: 'sinos', pos: '30% 50%', cor: 'azul', larga: true, t1: 'cada sino', t2: 'uma nota', e1: 'musicalização', e2: 'infantil', corpo: 'os pequenos tocam junto com o violão do professor.', fim: 'olha esse olhar!', paul: 'pandeiro' },
  '13-dia-de-show': { foto: 'dia-de-show', pos: '50% 50%', cor: 'vinho', larga: true, t1: 'dia de', t2: 'show', e1: 'a plateia filma', e2: 'a gente toca', corpo: 'é no palco que o estudo do ano inteiro aparece.', fim: 'educação musical com propósito.', paul: 'microfone' },
  '14-lugar-de-menina': { foto: 'menina-bateria', pos: '45% 30%', cor: 'azul', t1: 'lugar de menina', t2: 'é na bateria', e1: 'baqueta na mão', e2: 'foco total', corpo: 'aqui toda criança escolhe o instrumento que quiser.', fim: 'bora tocar?' },
  '15-beaterista-team': { foto: 'team-moldura', pos: '50% 40%', cor: 'creme', larga: true, t1: 'beaterista', t2: '#team', e1: 'quem toca junto', e2: 'ri junto', corpo: 'dia de show também é dia de foto na moldura.', fim: 'vem pro time!', paul: 'selfie' },
  '16-oculos-e-atitude': { foto: 'oculos-palco', pos: '50% 35%', cor: 'azul', t1: 'óculos, baqueta', t2: 'e atitude', e1: 'bateria azul', e2: 'luz de palco', corpo: 'tem aluno que sobe no palco e vira outra pessoa.', fim: 'isso é rock!', paul: 'oculos' },
  '17-cara-de-quem-vai-arrasar': { foto: 'baquetas-no-alto', pos: '50% 30%', cor: 'vinho', t1: 'cara de quem', t2: 'vai arrasar', e1: 'baquetas no alto', e2: 'prato na mira', corpo: 'um segundo antes da virada. segura essa!', fim: 'e arrasou.' },
  '18-um-pad-pra-cada-mao': { foto: 'dois-pads', pos: '50% 45%', cor: 'creme', t1: 'um pad', t2: 'pra cada mão', e1: 'treino no pad', e2: 'antes da bateria', corpo: 'é no pad que a mão aprende o caminho.', fim: 'igual nos<br>jogos do Paul.', paul: 'metronomo' },
  '19-canta-e-toca': { foto: 'microfone-fone', pos: '50% 40%', cor: 'azul', t1: 'canta, toca', t2: 'e se diverte', e1: 'microfone', e2: 'fone e baqueta', corpo: 'aula de música também é hora de brincar.', fim: 'solta a voz!', paul: 'microfone' },
  '20-o-rock-mora-aqui': { foto: 'rock-oculos-escuros', pos: '30% 45%', cor: 'vinho', larga: true, t1: 'o rock', t2: 'mora aqui', e1: 'colete jeans', e2: 'óculos escuros', corpo: 'na Beaterista cada um toca com o seu estilo.', fim: 'qual é o seu?', paul: 'oculos' },
  '21-foco-total': { foto: 'foco-azul', pos: '55% 40%', cor: 'creme', t1: 'foco', t2: 'total', e1: 'olho na caixa', e2: 'baqueta na mão', corpo: 'quem estuda durante o ano toca tranquilo no dia do show.', fim: 'bora estudar?' },
  '22-ja-tem-camiseta': { foto: 'bebes', pos: '50% 40%', cor: 'creme', t1: 'ainda não tocam', t2: 'mas já têm camiseta', e1: 'azul ou amarela?', e2: 'as duas!', corpo: 'os menores da turma já vestem a Beaterista.', fim: 'que dupla!', paul: 'selfie' },
  '23-sorteio': { foto: 'sorteio', pos: '50% 35%', cor: 'azul', larga: true, t1: 'teve sorteio', t2: 'de camiseta', e1: 'dia de evento', e2: 'dia de presente', corpo: 'olha a cara de quem ganhou.', fim: 'parabéns!', paul: 'oculos' },
  '24-baqueta-no-alto': { foto: 'menina-baqueta-alto', pos: '45% 35%', cor: 'vinho', t1: 'baqueta', t2: 'no alto', e1: 'bateria azul', e2: 'olho no prato', corpo: 'ela sabe exatamente onde vai bater.', fim: 'toca muito!' },
  '25-gente-grande': { foto: 'menino-serio', pos: '50% 35%', cor: 'azul', t1: 'concentração', t2: 'de gente grande', e1: 'duas baquetas', e2: 'um objetivo', corpo: 'quando a música começa, ele nem pisca.', fim: 'respeita o<br>baterista!' },
  '26-aprende-brincando': { foto: 'sinos-bea', pos: '45% 50%', cor: 'creme', larga: true, t1: 'música se aprende', t2: 'brincando', e1: 'sinos coloridos', e2: 'cada cor, um som', corpo: 'é assim que os pequenos descobrem as notas.', fim: 'toca mais um!', paul: 'pandeiro' },
  '27-o-time': { foto: 'time-bolo', pos: '50% 0%', cor: 'azul', larga: true, t1: 'o time', t2: 'da beaterista', e1: 'professores', e2: 'e um bolo', corpo: 'por trás de cada aula tem essa turma.', fim: 'parabéns pra nós!', paul: 'professor' },
  '28-pose-de-artista': { foto: 'pose-artista', pos: '50% 30%', cor: 'azul', t1: 'pose de', t2: 'artista', e1: 'bandana azul', e2: 'camiseta amarela', corpo: 'depois do show, a foto com a prof é obrigatória.', fim: 'arrasou!', paul: 'selfie' },
  '29-missao-cumprida': { foto: 'missao-cumprida', pos: '60% 0%', cor: 'vinho', t1: 'missão', t2: 'cumprida', e1: 'baquetas na mão', e2: 'sorriso no rosto', corpo: 'tocou, agradeceu e ainda ganhou abraço da prof.', fim: 'isso aí!' },
  '30-quem-apresenta': { foto: 'bea-apresenta', pos: '50% 35%', cor: 'creme', larga: true, t1: 'quem apresenta', t2: 'é a bea', e1: 'microfone', e2: 'e muita risada', corpo: 'no nosso show a prof apresenta e a turma se diverte.', fim: 'próximo!', paul: 'microfone' },
  '31-pequeno-gigante': { foto: 'pequeno-gigante', pos: '60% 30%', cor: 'azul', t1: 'pequeno', t2: 'gigante', e1: 'baqueta no alto', e2: 'olhar de fera', corpo: 'ele mal aparece atrás dos pratos, mas o som chega longe.', fim: 'que fera!' },
  '32-no-embalo': { foto: 'no-embalo', pos: '50% 35%', cor: 'vinho', t1: 'no embalo', t2: 'da música', e1: 'caixa e tom', e2: 'no tempo certo', corpo: 'quando o aluno entra no groove, a foto até sai torta.', fim: 'bora tocar!' },
  '33-olhar-de-rockstar': { foto: 'rockstar', pos: '20% 25%', cor: 'azul', t1: 'olhar de', t2: 'rockstar', e1: 'luz de palco', e2: 'bateria azul', corpo: 'tem foto que parece capa de disco.', fim: 'e é aluno nosso!', paul: 'oculos' },
  '34-o-cajon-e-dela': { foto: 'cajon-dela', pos: '55% 45%', cor: 'creme', t1: 'o cajón', t2: 'é dela', e1: 'duas mãos', e2: 'um batuque', corpo: 'percussão também tem vez no nosso palco.', fim: 'toca, menina!', paul: 'cajon' },
  '35-colorir-e-musica': { foto: 'colorindo', pos: '50% 50%', cor: 'azul', t1: 'colorir também', t2: 'é música', e1: 'lápis de cor', e2: 'e instrumentos', corpo: 'tem folha de colorir com a marca da escola.', fim: 'igual ao livro<br>do Paul!', paul: 'colorindo' },
  '36-bateria-em-cena': { foto: 'luz-azul', pos: '55% 35%', cor: 'vinho', t1: 'bateria', t2: 'em cena', e1: 'luz de palco', e2: 'baqueta na mão', corpo: 'olha pro lado, respira e manda ver.', fim: 'vai com tudo!' },
  '37-a-prof-no-violao': { foto: 'violao-dupla', pos: '55% 45%', cor: 'azul', larga: true, t1: 'a prof também', t2: 'toca violão', e1: 'dois violões', e2: 'um som só', corpo: 'professores da Beaterista tocando juntos.', fim: 'que dupla!', paul: 'guitarra' },
  '38-cabe-mais-um': { foto: 'moldura-menino', pos: '35% 45%', cor: 'creme', larga: true, t1: 'cabe mais um', t2: 'na moldura', e1: 'educação musical', e2: 'com propósito', corpo: 'sorriso de quem acabou de tocar.', fim: 'beaterista #team', paul: 'selfie' },
  '39-piano-de-cauda': { foto: 'piano-cauda', pos: '60% 40%', cor: 'vinho', larga: true, t1: 'piano de cauda', t2: 'e coragem', e1: 'recital', e2: 'de piano', corpo: 'ela toca, a prof apresenta e comemora junto.', fim: 'bravo!', paul: 'teclado' },
  '40-lembrancinha': { foto: 'lembrancinha', pos: '50% 35%', cor: 'azul', t1: 'lembrancinha', t2: 'do show', e1: 'sacolinha de música', e2: 'camiseta amarela', corpo: 'ninguém vai embora de mão vazia.', fim: 'até o próximo!', paul: 'selfie' },
  '41-solo-de-guitarra': { foto: 'solo-guitarra', pos: '45% 30%', cor: 'creme', t1: 'solo de', t2: 'guitarra', e1: 'palco', e2: 'e amplificador', corpo: 'concentrado em cada nota.', fim: 'toca muito!', paul: 'guitarra' },
  '42-a-prof-vibra': { foto: 'prof-vibra', pos: '40% 30%', cor: 'azul', t1: 'a prof vibra', t2: 'junto', e1: 'ele toca', e2: 'ela comemora', corpo: 'cada batida certa vira festa.', fim: 'boa!' },
  '43-violao-grande': { foto: 'violao-grande', pos: '60% 40%', cor: 'vinho', t1: 'o violão é grande', t2: 'o talento também', e1: 'banquinho amarelo', e2: 'luz de palco', corpo: 'ele quase some atrás do violão.', fim: 'e toca!', paul: 'guitarra' },
  '44-aluno-e-professor': { foto: 'aluno-professor', pos: '50% 50%', cor: 'creme', t1: 'aluno e professor', t2: 'no mesmo som', e1: 'guitarra', e2: 'e violão', corpo: 'no palco o professor toca junto e sorri junto.', fim: 'isso é aula!', paul: 'guitarra' },
  '45-sorriso-de-baterista': { foto: 'sorriso-baterista', pos: '35% 40%', cor: 'azul', t1: 'sorriso de', t2: 'baterista', e1: 'bateria azul', e2: 'duas baquetas', corpo: 'olhou pra câmera e não perdeu o tempo.', fim: 'craque!' },
  '46-banda-formada': { foto: 'banda-pb', pos: '55% 50%', cor: 'vinho', larga: true, t1: 'banda', t2: 'formada', e1: 'duas baterias', e2: 'e uma guitarra', corpo: 'a prof numa bateria, os alunos no resto do palco.', fim: 'som na caixa!', paul: 'oculos' },
  '47-domino-musical': { foto: 'domino-menino', pos: '50% 40%', cor: 'azul', t1: 'dominó', t2: 'musical', e1: 'claves e figuras', e2: 'no chão da sala', corpo: 'ele montou a trilha inteira antes de ir pra bateria.', fim: 'sua vez!', paul: 'estudando' },
  '48-memoria-na-aula': { foto: 'memoria-menino', pos: '30% 50%', cor: 'creme', larga: true, t1: 'jogo da memória', t2: 'na aula', e1: 'instrumentos', e2: 'em pares', corpo: 'antes de tocar, a gente brinca de reconhecer cada instrumento.', fim: 'achou o par?', paul: 'professor' },
  '49-tubos-coloridos': { foto: 'tubos-coloridos', pos: '30% 50%', cor: 'azul', t1: 'cada cor', t2: 'uma nota', e1: 'tubos sonoros', e2: 'do grave ao agudo', corpo: 'ele bate no tubo e descobre o som de cada nota.', fim: 'dó, ré, mi!', paul: 'maestro' },
  '50-dupla-no-domino': { foto: 'domino-maos', pos: '50% 50%', cor: 'vinho', t1: 'dupla', t2: 'no dominó', e1: 'clave de sol', e2: 'clave de fá', corpo: 'pra encaixar a peça tem que reconhecer a figura.', fim: 'quem ganhou?', paul: 'estudando' },
  '51-cantinho-de-colorir': { foto: 'mesa-colorir', pos: '50% 55%', cor: 'creme', t1: 'cantinho', t2: 'de colorir', e1: 'lápis de cor', e2: 'e canetinha', corpo: 'enquanto espera a aula, a criançada pinta.', fim: 'igual ao livro<br>do Paul!', paul: 'colorindo' },
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
