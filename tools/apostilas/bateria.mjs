// Apostila "Bateria para adultos" — versão premium. Todo desenho de partitura sai do motor do Beaterista PRO.
import { groove, svgBateria } from './notas.mjs';
import * as L from './lib.mjs';
import { writeFileSync } from 'node:fs';
const NOME = 'Bateria para adultos · Beaterista';
const PROMO = ['quer aula? <i>beaterista.com.br</i> · escola em Araçatuba', 'dúvida? chame a escola no WhatsApp <i>18 991804150</i>', 'material feito por quem ensina bateria todos os dias'];
let pr = 0; const promo = () => PROMO[pr++ % PROMO.length];
const pg = (o) => L.pagina({ ...o, nome: NOME, promo: promo() });
const nota = (linhas, o = {}, larg = 640) => { const evs = groove(linhas, o); return { evs, svg: L.comContagem(L.semB(svgBateria(evs, larg)), evs) }; };
const sem = (linhas, o = {}, larg = 640) => { const evs = groove(linhas, o); return { evs, svg: L.semB(svgBateria(evs, larg)) }; };
const HH8 = 'x.x.x.x.x.x.x.x.'; const SN = '....x.......x...'; const BD = 'x.......x.......'; const HH16 = 'xxxxxxxxxxxxxxxx';
const g = (titulo, meta, linhas, texto, o) => L.card(titulo, meta, nota(linhas, o, 430).svg, texto);
const P = [];

/* capa */
const tambor = `<svg viewBox="0 0 200 200" width="200" height="200" fill="none" stroke="#d9b866" stroke-width="1.1"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="84" stroke-opacity=".6"/><circle cx="100" cy="100" r="62" stroke-width="1.6"/><circle cx="100" cy="100" r="54" stroke-opacity=".5"/><circle cx="100" cy="100" r="8" fill="#d9b866" stroke="none"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * 30) * Math.PI / 180; return `<line x1="${100 + 62 * Math.cos(a)}" y1="${100 + 62 * Math.sin(a)}" x2="${100 + 84 * Math.cos(a)}" y2="${100 + 84 * Math.sin(a)}" stroke-opacity=".55"/><circle cx="${100 + 88 * Math.cos(a)}" cy="${100 + 88 * Math.sin(a)}" r="2.2" fill="#d9b866" stroke="none"/>`; }).join('')}<path d="M52 150 L96 104 M148 150 L104 104" stroke-width="2.4" stroke-linecap="round"/></svg>`;
P.push(L.capa({ t1: 'bateria', t2: 'para adultos', lema: 'da primeira baqueta ao primeiro groove, em 15 minutos por dia', arte: tambor, faixa: 'apostila de bateria · método Beaterista' }));

/* sumário */
P.push(L.sumario([
  ['Módulo 1 · Primeiros passos', [[1, 'Como usar esta apostila', 4], [2, 'Conheça as peças da bateria', 5], [3, 'Postura, banco e pegada', 6], [4, 'Como ler a partitura de bateria', 7]]],
  ['Módulo 2 · Pulso e groove', [[5, 'Pulso e metrônomo', 9], [6, 'O primeiro groove', 10], [7, 'Variações do bumbo', 11], [8, 'Grooves por estilo', 12]]],
  ['Módulo 3 · Técnica e expressão', [[9, 'Viradas', 15], [10, 'Rudimentos essenciais', 16], [11, 'Acentos e notas fantasma', 17], [12, 'Independência: o ostinato', 18]]],
  ['Módulo 4 · Tocando de verdade', [[13, 'Estude em 15 minutos', 20], [14, 'Montando sua primeira música', 21], [15, 'Erros comuns de quem começa adulto', 22], [16, 'Desafios e respostas', 23]]],
  ['Para levar', [['·', 'Plano das suas 4 primeiras semanas', 25], ['·', 'Folhas para imprimir', 27]]],
], NOME, 'cada groove desta apostila foi escrito no Beaterista PRO: o mesmo desenho que você vê aqui abre no editor, toca e dá para imprimir.'));

/* ================= MÓDULO 1 ================= */
P.push(L.divisor({ modulo: 1, titulo: 'Primeiros passos', citacao: 'Nunca é tarde para tocar bateria. É tarde para esperar o momento perfeito.', texto: 'Antes do primeiro groove: conhecer o instrumento, sentar direito e aprender a ler a partitura que você vai usar.', itens: [[1, 'Como usar esta apostila'], [2, 'Conheça as peças da bateria'], [3, 'Postura, banco e pegada'], [4, 'Como ler a partitura de bateria']], nome: NOME }));

P.push(pg({ tag: '1 · COMECE AQUI', titulo: 'Como usar esta apostila', sub: 'Feita pra quem tem agenda cheia e quer resultado de verdade.', corpo: `
<ul class="lista"><li><b>Quinze minutos, todo dia.</b> Estudos de aprendizagem motora mostram que treinar pouco e com frequência ensina o corpo melhor do que uma maratona por semana. O movimento se consolida entre um treino e outro.</li>
<li><b>Uma página por vez.</b> Não precisa decorar a apostila. Domine um groove, depois passe para o próximo.</li>
<li><b>Siga a ordem se estiver começando do zero.</b> Cada seção prepara a próxima. Se já toca um pouco, vá direto ao módulo 2.</li>
<li><b>Use o metrônomo sempre.</b> Ele é o professor mais honesto que existe. Qualquer aplicativo gratuito serve.</li>
<li><b>Consulte quando quiser.</b> Os grooves estão separados por estilo para você voltar e relembrar.</li></ul>
<div class="cit-p">“O cérebro adulto aprende, sim. Só pede mais repetição inteligente e menos pressa.”</div>
<h2 class="s">Sua rotina de 15 minutos</h2>
<table class="t"><tr><th>Tempo</th><th>O que fazer</th></tr><tr><td>3 min</td><td>Aquecimento: pulso no chimbal com o metrônomo, bem devagar.</td></tr><tr><td>7 min</td><td>O groove ou a virada da semana, em andamento lento.</td></tr><tr><td>3 min</td><td>Rudimento (seção 10) para a coordenação das mãos.</td></tr><tr><td>2 min</td><td>Toque o que você já domina, sem parar, só pelo prazer.</td></tr></table>
${L.dica('Dica de estudo', 'marque o horário na agenda como um compromisso. estudar “quando sobrar tempo” quase nunca acontece.')}${L.caderno()}` }));

// peças
const legenda = (() => { const evs = []; const ord = ['hh', 'sn', 'bd', 'tt', 'mt', 'ft', 'cr', 'rd']; ord.forEach((p, i) => evs.push({ p, ini: i * 4, d: 4, mao: '', acc: false, fan: false })); const nomes = { hh: 'chimbal', sn: 'caixa', bd: 'bumbo', tt: 'tom 1', mt: 'tom 2', ft: 'surdo', cr: 'prato', rd: 'condução' }; return L.comContagem(L.semB(svgBateria(evs, 640)), evs, (e) => nomes[e.p]); })();
P.push(pg({ tag: '2 · BÁSICO', titulo: 'Conheça as peças da bateria', sub: 'O nome de cada peça e o lugar dela na partitura.', corpo: `
${L.card('Cada peça tem um lugar na pauta', 'lido da esquerda para a direita, uma peça por tempo', legenda)}
<table class="t"><tr><th>Peça</th><th>O que é</th><th>Onde aparece na pauta</th></tr>
<tr><td><b>Chimbal</b></td><td>Dois pratos pequenos, um sobre o outro. Você toca com a baqueta e fecha ou abre com o pé.</td><td>“x” em cima da pauta</td></tr>
<tr><td><b>Caixa</b></td><td>O tambor do centro. Dá o “estalo” do tempo 2 e do tempo 4.</td><td>3º espaço (de baixo para cima)</td></tr>
<tr><td><b>Bumbo</b></td><td>O tambor grande, tocado com o pé direito. É o coração do groove.</td><td>1º espaço, embaixo</td></tr>
<tr><td><b>Tom 1 e tom 2</b></td><td>Tambores agudos e médios, na frente do baterista. Usados nas viradas.</td><td>espaço de cima e 4ª linha</td></tr>
<tr><td><b>Surdo</b></td><td>O tambor grave de chão, à direita.</td><td>2º espaço</td></tr>
<tr><td><b>Prato</b></td><td>Prato grande: ataca no começo de uma parte e “explode” o som.</td><td>“x” acima do chimbal</td></tr>
<tr><td><b>Condução</b></td><td>Prato grande da direita, usado no lugar do chimbal quando a música abre.</td><td>“x” na linha de cima</td></tr></table>
${L.dica('Dica de estudo', 'a mão direita costuma ficar no chimbal e a esquerda na caixa. se você é canhoto, inverta tudo: a bateria também é sua.')}` }));

P.push(pg({ tag: '3 · BÁSICO', titulo: 'Postura, banco e pegada', sub: 'Tocar confortável é tocar por mais tempo e com menos dor.', corpo: `
<h2 class="s">O banco</h2>
<ul class="lista"><li>Sente com as <b>coxas levemente inclinadas para baixo</b>, os joelhos um pouco abaixo do quadril. Banco baixo demais cansa a lombar.</li><li>Pés <b>relaxados nos pedais</b>: o peso da perna faz o trabalho, não a tensão.</li><li>Costas retas, <b>ombros soltos</b>, cotovelos perto do corpo e nunca “lá em cima”.</li></ul>
<h2 class="s">A pegada (pegada igual nas duas mãos)</h2>
<ul class="passos"><li>Segure a baqueta a mais ou menos <b>um terço do comprimento</b>, a partir do final (o ponto de equilíbrio).</li><li>Aperte entre o <b>polegar e o indicador</b>. Esse é o “ponto de apoio”.</li><li>Os outros dedos <b>envolvem a baqueta sem apertar</b>, como quem segura um passarinho.</li><li>O pulso é a dobradiça: a baqueta <b>sobe e desce</b>, e quem bate é o peso dela.</li><li>Deixe a baqueta <b>voltar sozinha</b> (rebote). Se você empurra de volta, trava e cansa.</li></ul>
${L.dica('Dica de estudo', 'treine o movimento em um travesseiro ou no pad: com som baixo, você escuta o ritmo e o corpo aprende a relaxar.')}
<h2 class="s">Três checagens antes de cada treino</h2>
<table class="t"><tr><th>Olhe</th><th>Pergunta</th></tr><tr><td>Ombros</td><td>Estão longe das orelhas?</td></tr><tr><td>Mãos</td><td>Apertam a baqueta ou só seguram?</td></tr><tr><td>Respiração</td><td>Está solta ou você prende o ar quando erra?</td></tr></table>${L.caderno()}` }));

// ler partitura
const exLer = nota({ hh: HH8, sn: SN, bd: BD });
P.push(pg({ tag: '4 · BÁSICO', titulo: 'Como ler a partitura de bateria', sub: 'Cinco linhas, um “x” e uma conta: é só isso.', corpo: `
${L.card('Um compasso de rock', 'a contagem em dourado fica embaixo de cada nota', exLer.svg, 'Leia da esquerda para a direita. Cada “coluna” é um instante em que você toca.')}
<ul class="lista"><li><b>O “4/4”</b> no começo diz: quatro tempos por compasso. Você conta <b>1 – 2 – 3 – 4</b>.</li><li><b>O “&”</b> é o meio de cada tempo. Contando as colcheias: <b>1 & 2 & 3 & 4 &</b>.</li><li><b>Notas no mesmo instante</b> (uma em cima da outra) tocam juntas. No exemplo acima, no tempo 1, chimbal e bumbo caem juntos.</li><li><b>Linha vertical</b> no final é a barra do compasso: acabou, recomeça.</li></ul>
<h2 class="s">As figuras que você vai usar</h2>
<table class="t"><tr><th>Figura</th><th>Quanto vale</th><th>Como contar</th></tr><tr><td>Semínima</td><td>1 tempo</td><td>1 &nbsp; 2 &nbsp; 3 &nbsp; 4</td></tr><tr><td>Colcheia</td><td>meio tempo</td><td>1 & 2 & 3 & 4 &</td></tr><tr><td>Semicolcheia</td><td>um quarto de tempo</td><td>1 e & a 2 e & a</td></tr></table>
${L.dica('Dica de estudo', 'bata a conta com a boca antes de tocar. cante “um e dois e três e quatro e” olhando a partitura. se você consegue cantar, consegue tocar.')}` }));

/* ================= MÓDULO 2 ================= */
P.push(L.divisor({ modulo: 2, titulo: 'Pulso e groove', citacao: 'Quem toca no tempo é lembrado. Quem toca rápido é esquecido.', texto: 'O pulso é a base de qualquer música. Com ele firme, você monta o primeiro groove e ganha variações.', itens: [[5, 'Pulso e metrônomo'], [6, 'O primeiro groove'], [7, 'Variações do bumbo'], [8, 'Grooves por estilo']], nome: NOME }));

P.push(pg({ tag: '5 · PULSO', titulo: 'Pulso e metrônomo', sub: 'A batida que não pára é o que sustenta a música inteira.', corpo: `
${L.card('Pulso no chimbal: um por tempo', 'treine a 60 bpm', nota({ hh: 'x...x...x...x...' }, { passo: 4 }).svg)}
<p><b>bpm</b> quer dizer “batidas por minuto”. A 60 bpm o metrônomo faz um clique por segundo. É a velocidade perfeita para o primeiro dia.</p>
<table class="t"><tr><th>bpm</th><th>Para quê</th></tr><tr><td>50 a 60</td><td>aprender um groove novo, com calma</td></tr><tr><td>70 a 80</td><td>quando o groove já sai sem parar</td></tr><tr><td>90 a 110</td><td>velocidade de muita música pop e rock</td></tr></table>
<h2 class="s">A regra dos três acertos</h2>
<p>Só aumente 5 bpm quando você tocar o exercício <b>três vezes seguidas, sem errar</b>. Se errou, volte para a velocidade anterior. É assim que a mão aprende de verdade.</p>
${L.dica('Dica de estudo', 'tocar um pouco devagar demais é muito mais útil do que tocar um pouco rápido demais. a precisão de hoje vira a velocidade de amanhã.')}${L.caderno()}` }));

// primeiro groove
const g1a = nota({ hh: HH8 }); const g1b = nota({ hh: HH8, sn: SN }); const g1c = nota({ hh: HH8, sn: SN, bd: BD });
P.push(pg({ tag: '6 · GROOVE', titulo: 'O primeiro groove', sub: 'O ritmo de rock que está em milhares de músicas. Monte em três camadas.', corpo: `
${L.card('Camada 1 · só o chimbal', 'mão direita, 60 bpm. Conte “1 & 2 & 3 & 4 &”', g1a.svg)}
${L.card('Camada 2 · + caixa', 'a mão esquerda bate no tempo 2 e no 4', g1b.svg)}
${L.card('Camada 3 · + bumbo', 'o pé direito bate no tempo 1 e no 3. Este é o groove completo', g1c.svg, 'Repare: nos tempos 1 e 3, chimbal e bumbo tocam juntos. Nos tempos 2 e 4, chimbal e caixa.')}
<ol class="passos"><li>Toque só a camada 1 por 1 minuto, sem parar.</li><li>Adicione a camada 2 sem perder o chimbal. Se perder, volte uma camada.</li><li>Adicione o bumbo. Vá a 60 bpm, depois 70, depois 80.</li></ol>
${L.dica('Dica de estudo', 'se o bumbo atrapalhar o chimbal, treine só o pé: bumbo no 1 e no 3, contando alto. depois junte.')}` }));

// variações do bumbo
const VAR = [['Base', 'bumbo no 1 e no 3', 'x.......x.......'], ['Bumbo no “&” do 2', 'bumbo no 1, no “&” do 2 e no 3', 'x.....x.x.......'], ['Bumbo duplo no começo', 'bumbo no 1, no “&” do 1 e no 3', 'x.x.....x.......'], ['Bumbo duplo no fim', 'bumbo no 1, no 3 e no “&” do 3', 'x.......x.x.....'], ['Bumbo animado', 'bumbo no 1, no “&” do 1, no 3 e no “&” do 3', 'x.x.....x.x.....'], ['Quatro no chão', 'bumbo em todos os tempos: pulso de dance', 'x...x...x...x...']];
P.push(pg({ tag: '7 · GROOVE', titulo: 'Variações do bumbo', sub: 'A mão faz sempre a mesma coisa. Só o pé muda.', corpo: `<div class="grade2">${VAR.map(([n, m, bd], i) => g(`${i + 1} · ${n}`, m, { hh: HH8, sn: SN, bd }, '')).join('')}</div>
${L.dica('Como treinar', 'comece sempre pela base. quando o chimbal e a caixa estiverem automáticos, troque só o bumbo. é a primeira vez que o cérebro faz duas coisas diferentes ao mesmo tempo, e isso demora uns dias.')}${L.caderno()}` }));

// estilos
const EST = [
  ['Rock', 'clássico · 90 a 120 bpm', { hh: HH8, sn: SN, bd: BD }, 'O groove que você já conhece, agora com acento na caixa para ganhar peso.'],
  ['Meio-tempo (half-time)', 'balada e pop · 60 a 80 bpm', { hh: HH8, sn: '........x.......', bd: 'x...............' }, 'A caixa cai só no tempo 3. Dá a sensação de que a música “respira” mais devagar.'],
  ['Pop dançante', 'quatro no chão · 110 a 128 bpm', { hh: HH8, sn: SN, bd: 'x...x...x...x...' }, 'O bumbo marca todos os tempos, como num pulso de pista de dança.'],
  ['Funk com semicolcheias', 'funk e soul · 80 a 100 bpm', { hh: HH16, sn: '....X.......X...', bd: 'x.....x...x.....' }, 'O chimbal toca quatro notas por tempo. Contagem: “1 e & a 2 e & a”.'],
  ['Reggae “one drop”', 'reggae · 65 a 80 bpm', { hh: HH8, sn: '........x.......', bd: '........x.......' }, 'Bumbo e caixa tocam juntos só no tempo 3. O silêncio no 1 é o que dá o balanço.'],
  ['Rock com prato', 'refrão · 100 a 130 bpm', { cr: 'x.x.x.x.x.x.x.x.', sn: SN, bd: 'x.....x.x.......' }, 'Troque o chimbal pelo prato quando a música “abrir”. O refrão ganha tamanho.'],
];
P.push(pg({ tag: '8 · GROOVE', titulo: 'Grooves por estilo', sub: 'Seis levadas para você tocar junto com muita música.', corpo: `${EST.slice(0, 3).map(([n, m, l, t], i) => L.card(`${i + 1} · ${n}`, m, nota(l, { passo: n.startsWith('Funk') ? 1 : 2 }).svg, t)).join('')}${L.dica('Como usar', 'escolha uma música que você gosta, descubra o andamento dela com o metrônomo do celular e toque a levada por cima, no seu ritmo.')}` }));
P.push(pg({ tag: '8 · GROOVE', titulo: 'Grooves por estilo', sub: 'Continuação.', corpo: `${EST.slice(3).map(([n, m, l, t], i) => L.card(`${i + 4} · ${n}`, m, nota(l, { passo: n.startsWith('Funk') ? 1 : 2 }).svg, t)).join('')}${L.dica('Pense assim', 'cada estilo é só uma combinação diferente de quem toca onde. o resto é o mesmo: pulso, braço solto e atenção.')}${L.caderno()}` }));

/* ================= MÓDULO 3 ================= */
P.push(L.divisor({ modulo: 3, titulo: 'Técnica e expressão', citacao: 'Devagar e certo vira rápido e certo. Rápido e errado vira hábito errado.', texto: 'Viradas, rudimentos, dinâmica e independência: o que transforma uma levada em música.', itens: [[9, 'Viradas'], [10, 'Rudimentos essenciais'], [11, 'Acentos e notas fantasma'], [12, 'Independência: o ostinato']], nome: NOME }));

// viradas
const fill1 = (() => { const evs = [...groove({ hh: 'x.x.x.x.x.x.....', sn: '....x...........', bd: 'x.......x.......' }), ...[12, 13, 14, 15].map((i) => ({ p: 'sn', ini: i, d: 1, mao: '', acc: false, fan: false })), ...groove({ cr: 'x...............', bd: 'x...............' }).map((e) => ({ ...e, ini: e.ini + 16 }))]; return L.semB(svgBateria(evs, 640)); })();
const fill2 = (() => { const evs = [...groove({ hh: 'x.x.x.x.........', sn: '....x...........', bd: 'x.......x.......' }), ...[['sn', 12], ['tt', 14]].map(([p, i]) => ({ p, ini: i, d: 2, mao: '', acc: false, fan: false })), ...[['sn', 8], ['sn', 10]].map(([p, i]) => ({ p, ini: i, d: 2, mao: '', acc: false, fan: false })), ...groove({ cr: 'x...............', bd: 'x...............' }).map((e) => ({ ...e, ini: e.ini + 16 }))]; return L.semB(svgBateria(evs, 640)); })();
const fill3 = (() => { const evs = [...groove({ hh: 'x.x.x.x.........', sn: '....x...........', bd: 'x.......x.......' }), ...[['tt', 8], ['tt', 10], ['mt', 12], ['ft', 14]].map(([p, i]) => ({ p, ini: i, d: 2, mao: '', acc: false, fan: false })), ...groove({ cr: 'x...............', bd: 'x...............' }).map((e) => ({ ...e, ini: e.ini + 16 }))]; return L.semB(svgBateria(evs, 640)); })();
P.push(pg({ tag: '9 · TÉCNICA', titulo: 'Viradas', sub: 'A virada avisa que a música vai mudar de parte.', corpo: `
<p>Uma <b>virada</b> (ou <i>fill</i>) preenche o último tempo ou os dois últimos tempos do compasso. Ela leva para a próxima parte, que geralmente começa com <b>prato e bumbo juntos</b> no tempo 1 do compasso seguinte.</p>
${L.card('Virada 1 · só a caixa', 'quatro semicolcheias no último tempo', fill1, 'Toque o groove normal por três tempos e, no tempo 4, quatro batidas rápidas na caixa. Termine com prato + bumbo no 1.')}
${L.card('Virada 2 · caixa e tom', 'dois tempos de virada', fill2, 'No tempo 3: caixa, caixa. No tempo 4: caixa e tom 1. A mão alterna D – E – D – E.')}
${L.card('Virada 3 · descendo os tons', 'tom 1, tom 1, tom 2, surdo', fill3, 'A virada “desce” dos tambores agudos para os graves. É a mais usada em rock e pop.')}
${L.dica('Dica de estudo', 'treine a virada sozinha, sem o groove, vá a 60 bpm. só depois encaixe no compasso. o segredo é voltar ao groove sem tropeçar no prato.')}` }));

// rudimentos
const stick = (txt, passo = 1, p = 'sn') => { const evs = []; txt.split(' ').join('').split('').forEach((c, i) => evs.push({ p, ini: i * passo, d: passo, mao: c === 'R' ? 'D' : 'E', acc: false, fan: false })); return svgBateria(evs, 640); };
P.push(pg({ tag: '10 · TÉCNICA', titulo: 'Rudimentos essenciais', sub: 'Pequenos exercícios de mão que treinam o corpo para qualquer groove.', corpo: `
<p>Rudimentos são <b>padrões de mão</b>, as “escalas” da bateria. A letra embaixo diz qual mão toca: <b>D</b> (direita) e <b>E</b> (esquerda). Toque todos na caixa, a 60 bpm.</p>
${L.card('Alternado simples', 'D E D E D E D E · a base de tudo', stick('RLRLRLRLRLRLRLRL', 2), 'As mãos alternam sem parar. O som das duas tem que ser igual.')}
${L.card('Dobrado', 'D D E E D D E E · duas batidas por mão', stick('RRLLRRLLRRLLRRLL', 2), 'A segunda batida de cada mão é o rebote. Deixe a baqueta quicar.')}
${L.card('Paradiddle', 'D E D D · E D E E · o rudimento mais famoso', stick('RLRRLRLLRLRRLRLL', 2), 'Os dois “D D” e os dois “E E” fazem a mão inverter. É ótimo para viradas.')}
${L.dica('Dica de estudo', 'comece devagar e use o metrônomo. dois minutos de cada rudimento por dia valem mais do que vinte minutos de um só.')}` }));

// dinâmica
const dinam = (() => { const evs = []; for (let b = 0; b < 1; b++) { for (let i = 0; i < 16; i += 2) evs.push({ p: 'hh', ini: i, d: 2, mao: '', acc: false, fan: false }); evs.push({ p: 'sn', ini: 4, d: 2, mao: '', acc: true, fan: false }, { p: 'sn', ini: 12, d: 2, mao: '', acc: true, fan: false }, { p: 'bd', ini: 0, d: 2, mao: '', acc: false, fan: false }, { p: 'bd', ini: 8, d: 2, mao: '', acc: false, fan: false }, { p: 'sn', ini: 7, d: 1, mao: '', acc: false, fan: true }); } return L.comContagem(L.semB(svgBateria(evs, 640)), evs); })();
P.push(pg({ tag: '11 · EXPRESSÃO', titulo: 'Acentos e notas fantasma', sub: 'Quem toca tudo com a mesma força soa como máquina.', corpo: `
<p>Dinâmica é a diferença entre <b>forte</b> e <b>fraco</b>. Na partitura, aparece de dois jeitos:</p>
<table class="t"><tr><th>Símbolo</th><th>Nome</th><th>Como tocar</th></tr><tr><td><b>&gt;</b> sobre a nota</td><td>acento</td><td>toque mais forte. A baqueta sobe mais alto antes de bater.</td></tr><tr><td><b>( )</b> em volta da nota</td><td>nota fantasma</td><td>toque muito baixinho, quase só um toque. A baqueta quase não sobe.</td></tr></table>
${L.card('Groove com acentos e uma nota fantasma', 'a nota fantasma está antes do tempo 3 (o “a” do 2)', dinam, 'Os dois acentos na caixa dão força aos tempos 2 e 4. A nota entre parênteses dá o balanço sem aparecer demais.')}
<h2 class="s">Três alturas de baqueta</h2>
<table class="t"><tr><th>Altura</th><th>Volume</th><th>Quando</th></tr><tr><td>Rente à pele</td><td>fraco</td><td>notas fantasma e partes calmas</td></tr><tr><td>Meio caminho</td><td>médio</td><td>a maior parte do groove</td></tr><tr><td>Bem alto</td><td>forte</td><td>acentos e viradas</td></tr></table>
${L.dica('Dica de estudo', 'grave 30 segundos tocando o groove com e sem dinâmica. você vai ouvir a diferença na hora.')}` }));

// independência
const ost = (bd) => nota({ hh: HH8, sn: SN, bd }).svg;
P.push(pg({ tag: '12 · EXPRESSÃO', titulo: 'Independência: o ostinato', sub: 'Quando as mãos repetem e o pé aprende coisas novas.', corpo: `
<p><b>Ostinato</b> é uma parte que se repete sem parar. No groove, o chimbal é o ostinato: ele não pode mudar enquanto o pé faz coisas diferentes. Treine em 4 degraus:</p>
<div class="grade2">${[['Degrau 1 · bumbo nos tempos', 'x · · · x · · · x · · · x · · ·', 'x...x...x...x...', 'Bumbo em todos os tempos.'], ['Degrau 2 · bumbo sincopado', 'bumbo no “&” do 2 e no “&” do 4', 'x.....x.x.....x.', 'Conte só o bumbo em voz alta antes.'], ['Degrau 3 · bumbo na frente', 'bumbo no 1, no “&” do 1 e no 3', 'x.x.....x.......', 'O pé toca duas vezes seguidas.'], ['Degrau 4 · mistura', 'bumbo no 1, “&” do 2, “&” do 3 e 4', 'x.....x...x.x...', 'Vá a 55 bpm e não tenha pressa.']].map(([t, m, bd, tx]) => L.card(t, m, nota({ hh: HH8, sn: SN, bd }, {}, 430).svg, tx)).join('')}</div>
${L.dica('Dica de estudo', 'se o chimbal começar a acompanhar o bumbo, pare, respire e recomece só com o chimbal por 8 compassos. é normal: o cérebro está se reorganizando.')}` }));

/* ================= MÓDULO 4 ================= */
P.push(L.divisor({ modulo: 4, titulo: 'Tocando de verdade', citacao: 'Você não precisa de talento para começar. Precisa começar para ganhar talento.', texto: 'Rotina de estudo, forma de música e o que evitar. É aqui que você passa de exercício para música.', itens: [[13, 'Estude em 15 minutos'], [14, 'Montando sua primeira música'], [15, 'Erros comuns de quem começa adulto'], [16, 'Desafios e respostas']], nome: NOME }));

P.push(pg({ tag: '13 · PRÁTICA', titulo: 'Estude em 15 minutos', sub: 'Pouco tempo, muita eficiência.', corpo: `
<table class="t"><tr><th>Dia</th><th>Foco</th><th>O que tocar</th></tr>
<tr><td>Segunda</td><td>Pulso</td><td>Chimbal em colcheias + groove base, 60 bpm</td></tr><tr><td>Terça</td><td>Bumbo</td><td>Duas variações do bumbo (seção 7)</td></tr><tr><td>Quarta</td><td>Mãos</td><td>Rudimentos (seção 10), 2 min cada</td></tr><tr><td>Quinta</td><td>Estilo</td><td>Um groove de um estilo novo (seção 8)</td></tr><tr><td>Sexta</td><td>Virada</td><td>Uma virada, depois encaixada no groove</td></tr><tr><td>Sábado</td><td>Música</td><td>Toque junto com uma música que você gosta</td></tr><tr><td>Domingo</td><td>Descanso</td><td>Se quiser, só ouça e tente acompanhar com os dedos</td></tr></table>
<h2 class="s">Estudando em apartamento</h2>
<ul class="lista"><li><b>Pad de estudo</b> ou abafadores de pele diminuem o volume sem tirar a sensação.</li><li><b>Horários combinados</b> com os vizinhos evitam conflito e dão tranquilidade para estudar.</li><li><b>Sem bateria em casa?</b> Um travesseiro e duas baquetas já treinam rudimentos, pegada e pulso.</li><li><b>Fones de ouvido</b> com o metrônomo e uma música ao fundo deixam o estudo silencioso para quem está perto.</li></ul>
${L.dica('Dica de estudo', 'adulto aprende melhor quando sabe o motivo de cada exercício. se ficar sem entender para que serve algo, volte à seção do exercício e leia o que ele treina.')}${L.caderno()}` }));

P.push(pg({ tag: '14 · MÚSICA', titulo: 'Montando sua primeira música', sub: 'Toda música tem um mapa. Aprenda a ler o mapa e você toca qualquer uma.', corpo: `
<table class="t"><tr><th>Parte</th><th>Compassos</th><th>O que a bateria faz</th></tr>
<tr><td><b>Intro</b></td><td>4 ou 8</td><td>Groove leve (só chimbal e bumbo), ou entra de repente com uma virada.</td></tr><tr><td><b>Verso</b></td><td>8 ou 16</td><td>Groove base, discreto, para dar espaço à voz.</td></tr><tr><td><b>Pré-refrão</b></td><td>4 ou 8</td><td>Aumenta a energia: mais bumbo ou caixa mais forte.</td></tr><tr><td><b>Refrão</b></td><td>8 ou 16</td><td>Prato no lugar do chimbal, tudo mais forte.</td></tr><tr><td><b>Ponte</b></td><td>4 ou 8</td><td>Muda o groove: meio-tempo ou menos peças.</td></tr><tr><td><b>Final</b></td><td>2 a 4</td><td>Virada + prato e bumbo juntos, e silêncio.</td></tr></table>
<h2 class="s">Do papel ao palco, em 5 passos</h2>
<ol class="passos"><li>Escolha uma música com andamento lento e groove simples.</li><li>Descubra o <b>bpm</b> com um aplicativo e coloque o metrônomo nele.</li><li>Conte os compassos de cada parte (batendo com o pé).</li><li>Toque só o chimbal durante a música inteira, para fixar a forma.</li><li>Acrescente caixa e bumbo, parte por parte, e as viradas por último.</li></ol>
${L.dica('Dica de estudo', 'ouça a música três vezes só prestando atenção na bateria antes de tocar. o ouvido ensina a mão.')}` }));

P.push(pg({ tag: '15 · PRÁTICA', titulo: 'Erros comuns de quem começa adulto', sub: 'O que mais atrapalha e como resolver.', corpo: `
<table class="t"><tr><th>O erro</th><th>Por que acontece</th><th>Como corrigir</th></tr>
<tr><td><b>Apertar demais a baqueta</b></td><td>Medo de errar e perder o controle.</td><td>Segure como um passarinho. Se a mão dói, a pegada está tensa.</td></tr>
<tr><td><b>Começar rápido demais</b></td><td>Pressa de “soar bem”.</td><td>Volte 10 bpm. Se errou, a velocidade estava acima do seu nível.</td></tr>
<tr><td><b>Olhar para as mãos</b></td><td>Insegurança.</td><td>Olhe na partitura ou na parede. O corpo precisa aprender sozinho.</td></tr>
<tr><td><b>Estudar sem metrônomo</b></td><td>Achar chato.</td><td>Ele é o seu espelho. Use em todo estudo, mesmo que sejam 5 min.</td></tr>
<tr><td><b>Maratona no fim de semana</b></td><td>Falta de tempo na semana.</td><td>Troque por 10 min diários. Rende mais e cansa menos.</td></tr>
<tr><td><b>Comparar-se com quem toca há anos</b></td><td>Redes sociais.</td><td>Compare-se com você de um mês atrás. Grave um vídeo hoje.</td></tr>
<tr><td><b>Abandonar na 3ª semana</b></td><td>A empolgação passa e o progresso fica mais devagar.</td><td>Sinta o platô como sinal de que o cérebro está consolidando. Continue.</td></tr></table>
${L.dica('Lembre-se', 'dor forte no ombro, punho ou costas é sinal de parar. descanse, alongue e revise a postura (seção 3) antes de voltar.')}${L.caderno()}` }));

/* desafios */
const des = [['Que groove é este?', 'rock', { hh: HH8, sn: SN, bd: BD }], ['Que groove é este?', 'meio-tempo', { hh: HH8, sn: '........x.......', bd: 'x...............' }], ['Que groove é este?', 'quatro no chão', { hh: HH8, sn: SN, bd: 'x...x...x...x...' }], ['Que groove é este?', 'one drop', { hh: HH8, sn: '........x.......', bd: '........x.......' }]];
P.push(pg({ tag: '16 · JOGOS', titulo: 'Desafios no papel', sub: 'Pegue um lápis. As respostas estão na página seguinte.', corpo: `
<div class="grade2">${des.map(([t, , l], i) => L.card(`${i + 1} · ${t}`, 'escolha: rock · meio-tempo · quatro no chão · one drop', nota(l).svg)).join('')}</div>
<h2 class="s">Perguntas rápidas</h2>
<ol class="passos"><li>Em 4/4, quantos tempos tem um compasso?</li><li>A caixa fica em qual espaço da pauta?</li><li>O que significa o símbolo “>” sobre uma nota?</li><li>Quantas colcheias cabem em um compasso 4/4?</li><li>Em que tempo a caixa toca no groove de rock?</li><li>O que é um ostinato?</li></ol>
${L.dica('Dica de estudo', 'depois de responder, toque cada groove e confira se a mão sabe o que o olho leu.')}` }));
P.push(pg({ tag: '17 · JOGOS', titulo: 'Respostas dos desafios', corpo: `
<h2 class="s">Que groove é este?</h2>
<table class="t"><tr><th>Nº</th><th>Resposta</th><th>Como reconhecer</th></tr><tr><td>1</td><td><b>Rock</b></td><td>Bumbo no 1 e no 3, caixa no 2 e no 4.</td></tr><tr><td>2</td><td><b>Meio-tempo</b></td><td>A caixa toca só no tempo 3.</td></tr><tr><td>3</td><td><b>Quatro no chão</b></td><td>O bumbo toca em todos os tempos.</td></tr><tr><td>4</td><td><b>One drop</b></td><td>Bumbo e caixa juntos só no tempo 3.</td></tr></table>
<h2 class="s">Perguntas rápidas</h2>
<table class="t"><tr><th>Nº</th><th>Resposta</th></tr><tr><td>1</td><td>Quatro tempos.</td></tr><tr><td>2</td><td>No 3º espaço, contando de baixo para cima.</td></tr><tr><td>3</td><td>Acento: tocar mais forte.</td></tr><tr><td>4</td><td>Oito colcheias.</td></tr><tr><td>5</td><td>No tempo 2 e no tempo 4.</td></tr><tr><td>6</td><td>Uma parte que se repete sem parar, como o chimbal do groove.</td></tr></table>
<div class="cit-p" style="margin-top:10mm">“Errar é o jeito que o cérebro calibra a mira. Hoje você sabe mais do que ontem. Isso já é vitória.”</div><p class="gde" style="text-align:center;margin-top:8mm">Parabéns por chegar até aqui.</p>` }));

/* plano 4 semanas */
P.push(pg({ tag: 'PLANO · suas 4 primeiras semanas', titulo: 'Do zero ao primeiro groove', sub: '15 minutos por dia valem mais do que uma hora no domingo. Marque um X em cada dia que tocar.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta da semana</th></tr>
<tr><td><b>1</b></td><td>Pegada, pulso e chimbal</td><td>Tocar colcheias no chimbal por 2 minutos a 60 bpm, sem acelerar.</td></tr>
<tr><td><b>2</b></td><td>Primeiro groove</td><td>Groove de rock completo a 70 bpm, 3 vezes seguidas sem errar.</td></tr>
<tr><td><b>3</b></td><td>Variações e virada</td><td>Duas variações do bumbo e uma virada de um tempo.</td></tr>
<tr><td><b>4</b></td><td>Primeira música</td><td>Tocar uma música lenta inteira, só com o groove base, e gravar um vídeo.</td></tr></table>
<h2 class="s">Marque seus dias</h2><p style="font-size:15pt;letter-spacing:.2em;line-height:2">${'☐ '.repeat(28)}</p>
<h2 class="s">Minha meta pessoal</h2><p style="line-height:2.4;color:#b8b09a">____________________________________________________________________<br>____________________________________________________________________</p>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que ficou mais fácil?</th><th>O que ainda travo?</th></tr>${[1, 2, 3, 4].map((n) => `<tr><td><b>${n}</b></td><td style="height:13mm"></td><td></td></tr>`).join('')}</table>
${L.dica('Como acompanhar', 'ao final de cada semana, escreva uma frase sobre o que ficou mais fácil. o progresso é difícil de ver por dentro e fácil de ver no papel.')}` }));

/* próximo passo */
P.push(pg({ tag: 'PRÓXIMO PASSO', titulo: 'E agora? Continue tocando.', corpo: `
<p>Quem chegou até aqui já fez o mais difícil: <b>começar</b>. Agora é repetir um pouco todo dia e deixar o corpo aprender.</p>
<ul class="lista"><li><b>Grave um vídeo seu</b> tocando o groove da semana e compare daqui a 30 dias.</li><li><b>Escolha uma música nova por mês</b> e monte o mapa dela (seção 14).</li><li><b>Toque com outras pessoas.</b> Uma banda, um amigo no violão ou uma roda: o pulso melhora muito tocando junto.</li><li><b>Peça ajuda.</b> Um professor corrige a pegada e a postura em minutos, o que sozinho levaria meses.</li></ul>
<div class="card" style="margin-top:6mm"><h4>Aulas na Beaterista</h4><p>Aulas de bateria para adultos e crianças, em Araçatuba. Rua Liberdade, 268. WhatsApp <b>18 991804150</b>. Mais materiais em <b>beaterista.com.br</b>.</p></div>
<h2 class="s">Minha lista de músicas para tocar</h2><table class="t"><tr><th>Música</th><th>bpm</th><th>Groove</th><th>Já toco?</th></tr>${[1, 2, 3, 4, 5].map(() => '<tr><td style="height:9mm"></td><td></td><td></td><td>☐</td></tr>').join('')}</table>
<h2 class="s">O que eu aprendi</h2><ul class="trilha"><li>Sei sentar, segurar a baqueta e relaxar os ombros.</li><li>Leio um compasso de bateria e conto em voz alta.</li><li>Toco o groove de rock completo com o metrônomo.</li><li>Sei fazer uma virada e voltar ao groove.</li></ul>
<p class="mut" style="font-size:8.4pt;margin-top:6mm">folhas para imprimir: nas próximas páginas tem uma pauta de bateria em branco e uma grade para você montar os seus grooves.</p>` }));

/* folhas */
const pautaBranca = (n) => { const sist = Array.from({ length: n }, (_, i) => { const y = 14 + i * 56; return `<g><g stroke="#1d2236" stroke-width="1">${[0, 1, 2, 3, 4].map((k) => `<line x1="30" x2="690" y1="${y + k * 9}" y2="${y + k * 9}"/>`).join('')}</g><g stroke="#1d2236" stroke-width="3"><line x1="40" x2="40" y1="${y + 8}" y2="${y + 28}"/><line x1="46" x2="46" y1="${y + 8}" y2="${y + 28}"/></g><g stroke="#1d2236" stroke-width="1">${[0, 1, 2, 3, 4].map((k) => `<line x1="${210 + k * 120}" x2="${210 + k * 120}" y1="${y}" y2="${y + 36}"/>`).join('')}</g></g>`; }).join(''); return `<svg viewBox="0 0 720 ${14 + n * 56}" width="100%">${sist}</svg>`; };
P.push(pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Pauta de bateria em branco', sub: 'Escreva seus grooves, viradas e ideias.', corpo: `<p class="mut">Nome: ______________________________ &nbsp; Data: ____/____ &nbsp; bpm: ______</p>${pautaBranca(11)}` }));
const grade = (() => { const rows = ['prato', 'chimbal', 'caixa', 'tom 1', 'tom 2', 'surdo', 'bumbo']; const cab = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a']; const tabela = (t) => `<p class="tag" style="margin-top:6mm">${t}</p><table class="t" style="table-layout:fixed"><tr><th style="width:16mm"></th>${cab.map((c) => `<th style="text-align:center;padding:1.6mm 0">${c}</th>`).join('')}</tr>${rows.map((r) => `<tr><td style="padding:1.6mm 2mm;font-size:8pt"><b>${r}</b></td>${cab.map((_, i) => `<td style="height:7.4mm;border-left:${i % 4 === 0 ? '.45mm solid #b8913f' : '.15mm solid #e3dac4'}"></td>`).join('')}</tr>`).join('')}</table>`; return tabela('Groove 1') + tabela('Groove 2') + tabela('Groove 3'); })();
P.push(pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Monte seus grooves', sub: 'Marque com um “x” onde cada peça toca. A linha dourada separa os tempos.', corpo: grade }));

writeFileSync('/tmp/apo/bateria.html', L.doc(P, 'Bateria para adultos · Beaterista'));
console.log('páginas:', P.length);
