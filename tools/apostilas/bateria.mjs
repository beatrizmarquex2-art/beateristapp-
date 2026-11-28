// Apostila "Bateria para adultos" (vinho). Toda partitura sai do motor de escrita do Beaterista PRO.
import { groove, svgBateria } from './notas.mjs';
import * as L from './lib-premium.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
const NOME = 'BATERIA PARA ADULTOS';
let MODI = 0; let IDATUAL = '';
const pg = (o) => L.pagina({ ...o, modulo: MODI, id: IDATUAL });
const nota = (linhas, o = {}, larg = 640) => { const evs = groove(linhas, o); return { evs, svg: L.comContagem(L.semB(svgBateria(evs, larg)), evs) }; };
const HH8 = 'x.x.x.x.x.x.x.x.'; const SN = '....x.......x...'; const BD = 'x.......x.......'; const HH16 = 'xxxxxxxxxxxxxxxx';
const g = (titulo, meta, linhas, texto, o) => L.card(titulo, meta, nota(linhas, o).svg, texto);
const ev = (p, ini, d = 2, extra = {}) => ({ p, ini, d, mao: '', acc: false, fan: false, ...extra });
const comp = (evs, i) => evs.map((e) => ({ ...e, ini: e.ini + i * 16 }));
const sem = (evs, larg = 640) => L.semB(svgBateria(evs, larg));

/* ---- ordem das seções (a numeração do livro sai daqui) ---- */
const MODS = [
  ['Módulo 1 · Primeiros passos', 'Primeiros passos', 'Nunca é tarde para tocar bateria. É tarde para esperar o momento perfeito.', 'Antes do primeiro groove: conhecer o instrumento, sentar direito, usar os pés e aprender a ler a partitura que você vai usar.', ['como', 'pecas', 'postura', 'pes', 'ler', 'equip']],
  ['Módulo 2 · Pulso e groove', 'Pulso e groove', 'Quem toca no tempo é lembrado. Quem toca rápido é esquecido.', 'O pulso é a base de qualquer música. Com ele firme, você monta o primeiro groove e ganha variações.', ['aquec', 'pulso', 'figuras', 'pausas', 'primeiro', 'bumbo', 'estilos', 'chimbal', 'estilos2']],
  ['Módulo 3 · Técnica e expressão', 'Técnica e expressão', 'Devagar e certo vira rápido e certo. Rápido e errado vira hábito errado.', 'Viradas, rudimentos, leitura, dinâmica e independência: o que transforma uma levada em música.', ['viradas', 'viradas2', 'rudimentos', 'rud2', 'dinamica', 'indep', 'leitura']],
  ['Módulo 4 · Tocando de verdade', 'Tocando de verdade', 'Você não precisa de talento para começar. Precisa começar para ganhar talento.', 'Rotina de estudo, forma de música e o que evitar. É aqui que você passa de exercício para música.', ['estudo', 'musica', 'exemplo', 'erros', 'desafios', 'respostas']],
  ['Para levar', null, null, null, ['plano4', 'plano8', 'registro', 'glossario', 'proximo', 'folha1', 'folha2']],
];
const TITULOS = { como: 'Como usar esta apostila', pecas: 'Conheça as peças da bateria', postura: 'Postura, banco e pegada', pes: 'Os pés: bumbo e chimbal', ler: 'Como ler a partitura de bateria', equip: 'Equipamento básico', aquec: 'Aquecimento de 5 minutos', pulso: 'Pulso e metrônomo', figuras: 'Colcheias e semicolcheias', pausas: 'Pausas e silêncios', primeiro: 'O primeiro groove', bumbo: 'Variações do bumbo', estilos: 'Grooves por estilo', chimbal: 'Chimbal aberto e fechado', estilos2: 'Mais três grooves', viradas: 'Viradas', viradas2: 'Mais viradas', rudimentos: 'Rudimentos essenciais', rud2: 'Rudimentos nos tambores', dinamica: 'Acentos e notas fantasma', indep: 'Independência: o ostinato', leitura: 'Leitura rítmica na caixa', estudo: 'Estude em 15 minutos', musica: 'Montando sua primeira música', exemplo: 'Uma música de 8 compassos', erros: 'Erros comuns de quem começa adulto', desafios: 'Desafios no papel', respostas: 'Respostas dos desafios', plano4: 'Plano das 4 primeiras semanas', plano8: 'Plano de 8 semanas', registro: 'Registro dos 30 dias', glossario: 'Glossário', proximo: 'E agora? Continue tocando', folha1: 'Pauta em branco', folha2: 'Grade de grooves' };
const ORDEM = MODS.flatMap((m) => m[4]).filter((id) => !['folha2'].includes(id)); // folha2 conta como outra página da mesma seção
const N = (id) => { const l = MODS.flatMap((m) => m[4]).filter((x) => !['respostas', 'folha2'].includes(x)); return l.indexOf(id) + 1; };
const T = (id, area) => `${N(id)} · ${area}`;
const reg = {};

/* ================= páginas ================= */
const B = {};
B.como = () => pg({ tag: T('como', 'COMECE AQUI'), titulo: 'Como usar esta apostila', sub: 'Feita pra quem tem agenda cheia e quer resultado de verdade.', corpo: `
<ul class="lista"><li><b>Quinze minutos, todo dia.</b> Estudos de aprendizagem motora mostram que treinar pouco e com frequência ensina o corpo melhor do que uma maratona por semana. O movimento se consolida entre um treino e outro.</li>
<li><b>Uma página por vez.</b> Não precisa decorar a apostila. Domine um groove, depois passe para o próximo.</li>
<li><b>Siga a ordem se estiver começando do zero.</b> Cada seção prepara a próxima. Se já toca um pouco, vá direto ao módulo 2.</li>
<li><b>Use o metrônomo sempre.</b> Ele é o professor mais honesto que existe. Qualquer aplicativo gratuito serve.</li>
<li><b>Consulte quando quiser.</b> Os grooves estão separados por estilo para você voltar e relembrar.</li></ul>
<div class="cit-p">“O cérebro adulto aprende, sim. Só pede mais repetição inteligente e menos pressa.”</div>
<h2 class="s">Sua rotina de 15 minutos</h2>
<table class="t"><tr><th>Tempo</th><th>O que fazer</th></tr><tr><td>3 min</td><td>Aquecimento: pulso no chimbal com o metrônomo, bem devagar (seção ${N('aquec')}).</td></tr><tr><td>7 min</td><td>O groove ou a virada da semana, em andamento lento.</td></tr><tr><td>3 min</td><td>Rudimento (seção ${N('rudimentos')}) para a coordenação das mãos.</td></tr><tr><td>2 min</td><td>Toque o que você já domina, sem parar, só pelo prazer.</td></tr></table>
${L.dica('Dica de estudo', 'marque o horário na agenda como um compromisso. estudar “quando sobrar tempo” quase nunca acontece.')}${L.caderno()}` });

B.pecas = () => { const evs = ['hh', 'sn', 'bd', 'tt', 'mt', 'ft', 'cr', 'rd'].map((p, i) => ev(p, i * 4, 4)); const nomes = { hh: 'chimbal', sn: 'caixa', bd: 'bumbo', tt: 'tom 1', mt: 'tom 2', ft: 'surdo', cr: 'prato', rd: 'condução' }; const leg = L.comContagem(sem(evs), evs, (e) => nomes[e.p]);
  return pg({ tag: T('pecas', 'BÁSICO'), titulo: 'Conheça as peças da bateria', sub: 'O nome de cada peça e o lugar dela na partitura.', corpo: `
${L.card('Cada peça tem um lugar na pauta', 'lido da esquerda para a direita, uma peça por tempo', leg)}
<table class="t"><tr><th>Peça</th><th>O que é</th><th>Onde aparece na pauta</th></tr>
<tr><td><b>Chimbal</b></td><td>Dois pratos pequenos, um sobre o outro. Você toca com a baqueta e fecha ou abre com o pé.</td><td>“x” em cima da pauta</td></tr>
<tr><td><b>Caixa</b></td><td>O tambor do centro. Dá o “estalo” do tempo 2 e do tempo 4.</td><td>3º espaço (de baixo para cima)</td></tr>
<tr><td><b>Bumbo</b></td><td>O tambor grande, tocado com o pé direito. É o coração do groove.</td><td>1º espaço, embaixo</td></tr>
<tr><td><b>Tom 1 e tom 2</b></td><td>Tambores agudos e médios, na frente do baterista. Usados nas viradas.</td><td>espaço de cima e 4ª linha</td></tr>
<tr><td><b>Surdo</b></td><td>O tambor grave de chão, à direita.</td><td>2º espaço</td></tr>
<tr><td><b>Prato</b></td><td>Prato grande: ataca no começo de uma parte e “explode” o som.</td><td>“x” acima do chimbal</td></tr>
<tr><td><b>Condução</b></td><td>Prato grande da direita, usado no lugar do chimbal quando a música abre.</td><td>“x” na linha de cima</td></tr></table>
${L.dica('Dica de estudo', 'a mão direita costuma ficar no chimbal e a esquerda na caixa. se você é canhoto, inverta tudo: a bateria também é sua.')}` }); };

B.postura = () => pg({ tag: T('postura', 'BÁSICO'), titulo: 'Postura, banco e pegada', sub: 'Tocar confortável é tocar por mais tempo e com menos dor.', corpo: `
<h2 class="s">O banco</h2>
<ul class="lista"><li>Sente com as <b>coxas levemente inclinadas para baixo</b>, os joelhos um pouco abaixo do quadril. Banco baixo demais cansa a lombar.</li><li>Pés <b>relaxados nos pedais</b>: o peso da perna faz o trabalho, não a tensão.</li><li>Costas retas, <b>ombros soltos</b>, cotovelos perto do corpo e nunca “lá em cima”.</li></ul>
<h2 class="s">A pegada (igual nas duas mãos)</h2>
<ul class="passos"><li>Segure a baqueta a mais ou menos <b>um terço do comprimento</b>, a partir do final (o ponto de equilíbrio).</li><li>Aperte entre o <b>polegar e o indicador</b>. Esse é o “ponto de apoio”.</li><li>Os outros dedos <b>envolvem a baqueta sem apertar</b>, como quem segura um passarinho.</li><li>O pulso é a dobradiça: a baqueta <b>sobe e desce</b>, e quem bate é o peso dela.</li><li>Deixe a baqueta <b>voltar sozinha</b> (rebote). Se você empurra de volta, trava e cansa.</li></ul>
${L.dica('Dica de estudo', 'treine o movimento em um travesseiro ou no pad: com som baixo, você escuta o ritmo e o corpo aprende a relaxar.')}
<h2 class="s">Três checagens antes de cada treino</h2>
<table class="t"><tr><th>Olhe</th><th>Pergunta</th></tr><tr><td>Ombros</td><td>Estão longe das orelhas?</td></tr><tr><td>Mãos</td><td>Apertam a baqueta ou só seguram?</td></tr><tr><td>Respiração</td><td>Está solta ou você prende o ar quando erra?</td></tr></table>${L.caderno()}` });

B.pes = () => { const bdq = nota({ bd: 'x...x...x...x...' }, { passo: 4 }); const hf = nota({ hh: HH8, hf: '....x.......x...', bd: BD }); return pg({ tag: T('pes', 'BÁSICO'), titulo: 'Os pés: bumbo e chimbal', sub: 'A bateria se toca com quatro membros. Os pés seguram o groove.', corpo: `
<h2 class="s">O pedal do bumbo (pé direito)</h2>
<ul class="lista"><li><b>Bate e solta.</b> O batedor encosta na pele e volta na hora. Se você mantém o pedal apertado, o som fica abafado e “morto”.</li><li><b>Calcanhar baixo:</b> o pé inteiro apoiado, o movimento vem do tornozelo. É o jeito mais fácil de começar e dá som mais controlado.</li><li><b>Calcanhar alto:</b> o calcanhar sobe e a perna inteira ajuda. Dá mais força, mas pede mais prática.</li></ul>
${L.card('Treino do bumbo sozinho', 'um toque em cada tempo, 60 bpm. Só o pé direito.', bdq.svg, 'Conte em voz alta. Cada batida tem que soar igual à anterior.')}
<h2 class="s">O pedal do chimbal (pé esquerdo)</h2>
<p>O pedal <b>fecha</b> os dois pratos do chimbal. Pisando, o som é curto (chimbal fechado). Solto, o som é aberto e longo. Quando você toca <b>só com o pé</b>, aparece embaixo da pauta.</p>
${L.card('Groove com o pé no chimbal nos tempos 2 e 4', 'o chimbal de pé aparece embaixo da pauta', hf.svg, 'No começo, apenas observe: ele faz o groove ficar mais firme. Treine devagar até virar automático.')}
${L.dica('Dica de estudo', 'treine os pés sentado em uma cadeira, batendo no chão com os dois pés, um de cada vez. o ritmo entra no corpo.')}` }); };

B.ler = () => { const ex = nota({ hh: HH8, sn: SN, bd: BD }); return pg({ tag: T('ler', 'BÁSICO'), titulo: 'Como ler a partitura de bateria', sub: 'Cinco linhas, um “x” e uma conta: é só isso.', corpo: `
${L.card('Um compasso de rock', 'a contagem em dourado fica embaixo de cada nota', ex.svg, 'Leia da esquerda para a direita. Cada “coluna” é um instante em que você toca.')}
<ul class="lista"><li><b>O “4/4”</b> no começo diz: quatro tempos por compasso. Você conta <b>1 – 2 – 3 – 4</b>.</li><li><b>O “&”</b> é o meio de cada tempo. Contando as colcheias: <b>1 & 2 & 3 & 4 &</b>.</li><li><b>Notas no mesmo instante</b> (uma em cima da outra) tocam juntas. No exemplo acima, no tempo 1, chimbal e bumbo caem juntos.</li><li><b>Linha vertical</b> no final é a barra do compasso: acabou, recomeça.</li></ul>
<h2 class="s">As figuras que você vai usar</h2>
<table class="t"><tr><th>Figura</th><th>Quanto vale</th><th>Como contar</th></tr><tr><td>Semínima</td><td>1 tempo</td><td>1 &nbsp; 2 &nbsp; 3 &nbsp; 4</td></tr><tr><td>Colcheia</td><td>meio tempo</td><td>1 & 2 & 3 & 4 &</td></tr><tr><td>Semicolcheia</td><td>um quarto de tempo</td><td>1 e & a 2 e & a</td></tr></table>
${L.dica('Dica de estudo', 'bata a conta com a boca antes de tocar. cante “um e dois e três e quatro e” olhando a partitura. se você consegue cantar, consegue tocar.')}` }); };

B.equip = () => pg({ tag: T('equip', 'BÁSICO'), titulo: 'Equipamento básico', sub: 'O que você realmente precisa para começar bem, sem gastar à toa.', corpo: `
<table class="t"><tr><th>Item</th><th>Para que serve</th><th>Dica na hora de escolher</th></tr>
<tr><td><b>Baquetas</b></td><td>Tocar. Compre mais de um par: elas quebram e desgastam.</td><td>Para adulto iniciante, as de espessura média, em madeira, com ponta redonda, são o caminho mais seguro.</td></tr>
<tr><td><b>Pad de estudo</b></td><td>Treinar rudimentos e pulso com pouco barulho.</td><td>Escolha um com borracha firme e boa resposta de rebote.</td></tr>
<tr><td><b>Metrônomo</b></td><td>Manter o pulso estável.</td><td>Um aplicativo gratuito serve. Se quiser, um aparelho dedicado dura anos.</td></tr>
<tr><td><b>Banco de bateria</b></td><td>Sentar na altura certa.</td><td>Regulável na altura e firme. Cadeira de cozinha atrapalha a postura.</td></tr>
<tr><td><b>Abafadores de pele</b></td><td>Diminuir o volume do kit.</td><td>Úteis em apartamento. Peça informações a um professor antes de comprar.</td></tr>
<tr><td><b>Protetor auricular</b></td><td>Proteger a audição.</td><td>Bateria é alta. Use protetores próprios para música, que reduzem o volume sem “abafar” o som.</td></tr>
<tr><td><b>Fones de ouvido</b></td><td>Tocar junto com a música sem incomodar.</td><td>Use com cuidado: volume baixo, para não cansar o ouvido.</td></tr></table>
${L.dica('Antes de comprar', 'se possível, peça a um professor para acompanhar você na loja. o mais barato e o mais caro quase nunca são os melhores para quem está começando.')}<div class="cit-p">“Instrumento bom é o que você consegue tocar todo dia.”</div>` });

B.aquec = () => { const alt = (() => { const evs = []; 'RLRLRLRLRLRLRLRL'.split('').forEach((c, i) => evs.push(ev('sn', i * 2, 2, { mao: c === 'R' ? 'D' : 'E' }))); return svgBateria(evs, 640); })(); const pu = nota({ hh: 'x...x...x...x...', bd: 'x...x...x...x...' }, { passo: 4 }); return pg({ tag: T('aquec', 'PULSO'), titulo: 'Aquecimento de 5 minutos', sub: 'Antes de tocar, prepare mãos, pés e cabeça.', corpo: `
<table class="t"><tr><th>Minuto</th><th>O que fazer</th></tr><tr><td>1</td><td>Alongue os punhos (girando devagar para os dois lados) e solte os ombros. Respire fundo três vezes.</td></tr><tr><td>2 e 3</td><td>Alternado simples na caixa, 60 bpm. O som das duas mãos tem que ser igual.</td></tr><tr><td>4</td><td>Pulso: chimbal e bumbo juntos em cada tempo.</td></tr><tr><td>5</td><td>Toque o groove que você vai estudar hoje, bem devagar, só para o corpo lembrar.</td></tr></table>
${L.card('Alternado simples na caixa', 'D E D E D E D E · 60 bpm', alt)}
${L.card('Pulso com o pé', 'chimbal e bumbo em todos os tempos · 60 bpm', pu.svg, 'Se o pé e a mão não caírem juntos, respire, pare e recomece mais devagar.')}
${L.dica('Dica de estudo', 'aquecer evita lesão e deixa o estudo mais rendoso nos primeiros minutos. faça sempre, mesmo quando estiver com pressa.')}${L.caderno()}` }); };

B.pulso = () => pg({ tag: T('pulso', 'PULSO'), titulo: 'Pulso e metrônomo', sub: 'A batida que não pára é o que sustenta a música inteira.', corpo: `
${L.card('Pulso no chimbal: um por tempo', 'treine a 60 bpm', nota({ hh: 'x...x...x...x...' }, { passo: 4 }).svg)}
<p><b>bpm</b> quer dizer “batidas por minuto”. A 60 bpm o metrônomo faz um clique por segundo. É a velocidade perfeita para o primeiro dia.</p>
<table class="t"><tr><th>bpm</th><th>Para quê</th></tr><tr><td>50 a 60</td><td>aprender um groove novo, com calma</td></tr><tr><td>70 a 80</td><td>quando o groove já sai sem parar</td></tr><tr><td>90 a 110</td><td>velocidade de muita música pop e rock</td></tr></table>
<h2 class="s">A regra dos três acertos</h2>
<p>Só aumente 5 bpm quando você tocar o exercício <b>três vezes seguidas, sem errar</b>. Se errou, volte para a velocidade anterior. É assim que a mão aprende de verdade.</p>
${L.dica('Dica de estudo', 'tocar um pouco devagar demais é muito mais útil do que tocar um pouco rápido demais. a precisão de hoje vira a velocidade de amanhã.')}${L.caderno()}` });

B.figuras = () => pg({ tag: T('figuras', 'PULSO'), titulo: 'Colcheias e semicolcheias', sub: 'Dividir o tempo em partes menores é o que dá vida ao groove.', corpo: `
${L.card('Semínimas · uma batida por tempo', '1 – 2 – 3 – 4', nota({ hh: 'x...x...x...x...' }, { passo: 4 }).svg)}
${L.card('Colcheias · duas batidas por tempo', '1 & 2 & 3 & 4 &', nota({ hh: HH8 }).svg)}
${L.card('Semicolcheias · quatro batidas por tempo', '1 e & a 2 e & a 3 e & a 4 e & a', nota({ hh: HH16 }, { passo: 1 }).svg)}
<table class="t"><tr><th>Figura</th><th>Batidas por compasso</th><th>Quando usar</th></tr><tr><td>Semínima</td><td>4</td><td>músicas lentas e pulso de base</td></tr><tr><td>Colcheia</td><td>8</td><td>a maior parte do pop e do rock</td></tr><tr><td>Semicolcheia</td><td>16</td><td>funk, viradas rápidas e passagens</td></tr></table>
${L.dica('Dica de estudo', 'toque cada figura por um minuto, sem parar, com o metrônomo a 60 bpm. a mão precisa sentir a diferença entre as três velocidades.')}` });

B.pausas = () => { const c1 = nota({ hh: 'x...x.......x...', bd: 'x...............' }, { passo: 4 }); const c2 = nota({ hh: 'x.x.x.x.x...x.x.' }); const c3 = nota({ hh: HH8, sn: '........x.......', bd: 'x...............' }); return pg({ tag: T('pausas', 'PULSO'), titulo: 'Pausas e silêncios', sub: 'O silêncio também é música. Quem sabe parar toca melhor.', corpo: `
<p>Uma <b>pausa</b> é um momento em que você <b>não toca</b>, mas continua contando. Na partitura, cada figura tem a sua pausa:</p>
<table class="t"><tr><th>Pausa</th><th>Vale o mesmo que</th><th>Como contar</th></tr><tr><td>Pausa de semínima</td><td>uma semínima (1 tempo)</td><td>conte o tempo em silêncio</td></tr><tr><td>Pausa de colcheia</td><td>uma colcheia (meio tempo)</td><td>conte só o “&”</td></tr><tr><td>Pausa de semicolcheia</td><td>uma semicolcheia (um quarto de tempo)</td><td>conte o “e” ou o “a”</td></tr></table>
${L.card('Pausa de semínima no tempo 3', 'o chimbal toca em 1, 2 e 4. No 3 você conta, mas não bate', c1.svg)}
${L.card('Pausas de colcheia', 'o chimbal pula o “&” do 4', c2.svg)}
${L.card('Groove com silêncio', 'só bumbo no 1 e caixa no 3, com chimbal contínuo', c3.svg, 'Repare como o groove soa mais “aberto” com os silêncios.')}
${L.dica('Dica', 'conte o silêncio com o pé, batendo no chão, e volte no tempo certo.')}` }); };

B.primeiro = () => pg({ tag: T('primeiro', 'GROOVE'), titulo: 'O primeiro groove', sub: 'O ritmo de rock que está em milhares de músicas. Monte em três camadas.', corpo: `
${L.card('Camada 1 · só o chimbal', 'mão direita, 60 bpm. Conte “1 & 2 & 3 & 4 &”', nota({ hh: HH8 }).svg)}
${L.card('Camada 2 · + caixa', 'a mão esquerda bate no tempo 2 e no 4', nota({ hh: HH8, sn: SN }).svg)}
${L.card('Camada 3 · + bumbo', 'o pé direito bate no tempo 1 e no 3. Este é o groove completo', nota({ hh: HH8, sn: SN, bd: BD }).svg, 'Repare: nos tempos 1 e 3, chimbal e bumbo tocam juntos. Nos tempos 2 e 4, chimbal e caixa.')}
<ol class="passos"><li>Toque só a camada 1 por 1 minuto, sem parar.</li><li>Adicione a camada 2 sem perder o chimbal. Se perder, volte uma camada.</li><li>Adicione o bumbo. Vá a 60 bpm, depois 70, depois 80.</li></ol>
${L.dica('Dica de estudo', 'se o bumbo atrapalhar o chimbal, treine só o pé: bumbo no 1 e no 3, contando alto. depois junte.')}` });

const VAR = [['Base', 'bumbo no 1 e no 3', 'x.......x.......'], ['Bumbo no “&” do 2', 'bumbo no 1, no “&” do 2 e no 3', 'x.....x.x.......'], ['Bumbo duplo no começo', 'bumbo no 1, no “&” do 1 e no 3', 'x.x.....x.......'], ['Bumbo duplo no fim', 'bumbo no 1, no 3 e no “&” do 3', 'x.......x.x.....'], ['Bumbo animado', 'bumbo no 1, no “&” do 1, no 3 e no “&” do 3', 'x.x.....x.x.....'], ['Quatro no chão', 'bumbo em todos os tempos: pulso de dance', 'x...x...x...x...']];
B.bumbo = () => pg({ tag: T('bumbo', 'GROOVE'), titulo: 'Variações do bumbo', sub: 'A mão faz sempre a mesma coisa. Só o pé muda.', corpo: `<div class="grade2">${VAR.map(([n, m, bd], i) => g(`${i + 1} · ${n}`, m, { hh: HH8, sn: SN, bd }, '')).join('')}</div>
${L.dica('Como treinar', 'comece sempre pela base. quando o chimbal e a caixa estiverem automáticos, troque só o bumbo. é a primeira vez que o cérebro faz duas coisas diferentes ao mesmo tempo, e isso demora uns dias.')}${L.caderno()}` });

const EST = [
  ['Rock', 'clássico · 90 a 120 bpm', { hh: HH8, sn: SN, bd: BD }, 'O groove que você já conhece, agora com acento na caixa para ganhar peso.'],
  ['Meio-tempo (half-time)', 'balada e pop · 60 a 80 bpm', { hh: HH8, sn: '........x.......', bd: 'x...............' }, 'A caixa cai só no tempo 3. Dá a sensação de que a música “respira” mais devagar.'],
  ['Pop dançante', 'quatro no chão · 110 a 128 bpm', { hh: HH8, sn: SN, bd: 'x...x...x...x...' }, 'O bumbo marca todos os tempos, como num pulso de pista de dança.'],
  ['Funk com semicolcheias', 'funk e soul · 80 a 100 bpm', { hh: HH16, sn: '....X.......X...', bd: 'x.....x...x.....' }, 'O chimbal toca quatro notas por tempo. Contagem: “1 e & a 2 e & a”.'],
  ['Reggae “one drop”', 'reggae · 65 a 80 bpm', { hh: HH8, sn: '........x.......', bd: '........x.......' }, 'Bumbo e caixa tocam juntos só no tempo 3. O silêncio no 1 é o que dá o balanço.'],
  ['Rock com prato', 'refrão · 100 a 130 bpm', { cr: 'x.x.x.x.x.x.x.x.', sn: SN, bd: 'x.....x.x.......' }, 'Troque o chimbal pelo prato quando a música “abrir”. O refrão ganha tamanho.'],
];
const cardEst = ([n, m, l, t], i) => L.card(`${i + 1} · ${n}`, m, nota(l, { passo: n.startsWith('Funk') ? 1 : 2 }).svg, t);
B.estilos = () => pg({ tag: T('estilos', 'GROOVE'), titulo: 'Grooves por estilo', sub: 'Seis levadas para você tocar junto com muita música.', corpo: `${EST.map(cardEst).join('')}${L.dica('Como usar', 'escolha uma música que você gosta, descubra o andamento dela com o metrônomo do celular e toque a levada por cima, no seu ritmo.')}${L.caderno()}` });

B.chimbal = () => { const aberto = (() => { const evs = groove({ hh: 'x.x.x.x.x.x.x...', sn: SN, bd: BD }); evs.push(ev('ho', 14, 2)); return L.comContagem(sem(evs), evs); })(); const disco = (() => { const evs = [...groove({ hh: 'x...x...x...x...', sn: SN, bd: 'x...x...x...x...' }, { passo: 4 })]; [2, 6, 10, 14].forEach((i) => evs.push(ev('ho', i, 2))); return L.comContagem(sem(evs), evs); })(); return pg({ tag: T('chimbal', 'GROOVE'), titulo: 'Chimbal aberto e fechado', sub: 'O mesmo instrumento com dois sons: curto e longo.', corpo: `
<table class="t"><tr><th>Chimbal</th><th>Como fazer</th><th>Som</th><th>Na partitura</th></tr><tr><td><b>Fechado</b></td><td>pedal pressionado, pratos juntos</td><td>curto e seco</td><td>“x”</td></tr><tr><td><b>Aberto</b></td><td>pedal solto, pratos afastados</td><td>longo, chiado</td><td>“x” com círculo (o)</td></tr></table>
${L.card('Rock com chimbal aberto no “&” do 4', 'o último “&” do compasso soa aberto, e o pé fecha logo em seguida', aberto, 'O aberto no fim do compasso avisa que o groove vai recomeçar. É um enfeite clássico.')}
${L.card('Disco: aberto em todos os “&”', 'chimbal fechado nos tempos e aberto no “&”, bumbo em todos os tempos', disco, 'A mão direita sobe e desce a cada colcheia: bate o fechado no tempo e o aberto no “&”.')}
${L.dica('Dica de estudo', 'treine o movimento do pé sozinho: pise (fechado) e solte (aberto) no tempo do metrônomo antes de juntar com a mão.')}` }); };

B.estilos2 = () => { const disco = (() => { const evs = groove({ hh: 'x...x...x...x...', sn: SN, bd: 'x...x...x...x...' }, { passo: 4 }); [2, 6, 10, 14].forEach((i) => evs.push(ev('ho', i, 2))); return L.comContagem(sem(evs), evs); })(); const funk = nota({ hh: HH16, sn: '....X..o.o..X...', bd: 'x.....x...x.....' }, { passo: 1 }); const slow = nota({ hh: 'x...x...x...x...', sn: SN, bd: 'x.....x.x.......' }, { passo: 4 }); return pg({ tag: T('estilos2', 'GROOVE'), titulo: 'Mais três grooves', sub: 'Para quando os seis primeiros já estiverem confortáveis.', corpo: `
${L.card('7 · Disco', 'dance · 110 a 120 bpm', disco, 'Bumbo em todos os tempos, caixa no 2 e no 4 e chimbal aberto no “&”.')}
${L.card('8 · Funk com notas fantasma', 'funk e soul · 85 a 95 bpm', funk.svg, 'As notas fantasma na caixa (entre parênteses) dão o balanço. Toque-as bem baixinho.')}
${L.card('9 · Rock lento', 'baladas e rock · 65 a 80 bpm', slow.svg, 'Chimbal só nos tempos, bumbo sincopado. Dá espaço para a voz.')}
${L.dica('Como usar', 'não passe para o próximo groove antes de tocar o anterior três vezes seguidas sem errar. repita em outros andamentos.')}${L.caderno()}` }); };

B.viradas = () => { const virada = (extra, nome) => { const evs = [...groove({ hh: 'x.x.x.x.x.x.....', sn: '....x...........', bd: 'x.......x.......' }), ...extra, ...comp(groove({ cr: 'x...............', bd: 'x...............' }), 1)]; return sem(evs); };
  const v1 = virada([12, 13, 14, 15].map((i) => ev('sn', i, 1)));
  const v2 = (() => { const evs = [...groove({ hh: 'x.x.x.x.........', sn: '....x...........', bd: 'x.......x.......' }), ev('sn', 8), ev('sn', 10), ev('sn', 12), ev('tt', 14), ...comp(groove({ cr: 'x...............', bd: 'x...............' }), 1)]; return sem(evs); })();
  const v3 = (() => { const evs = [...groove({ hh: 'x.x.x.x.........', sn: '....x...........', bd: 'x.......x.......' }), ev('tt', 8), ev('tt', 10), ev('mt', 12), ev('ft', 14), ...comp(groove({ cr: 'x...............', bd: 'x...............' }), 1)]; return sem(evs); })();
  return pg({ tag: T('viradas', 'TÉCNICA'), titulo: 'Viradas', sub: 'A virada avisa que a música vai mudar de parte.', corpo: `
<p>Uma <b>virada</b> (ou <i>fill</i>) preenche o último tempo ou os dois últimos tempos do compasso. Ela leva para a próxima parte, que geralmente começa com <b>prato e bumbo juntos</b> no tempo 1 do compasso seguinte.</p>
${L.card('Virada 1 · só a caixa', 'quatro semicolcheias no último tempo', v1, 'Toque o groove normal por três tempos e, no tempo 4, quatro batidas rápidas na caixa. Termine com prato + bumbo no 1.')}
${L.card('Virada 2 · caixa e tom', 'dois tempos de virada', v2, 'No tempo 3: caixa, caixa. No tempo 4: caixa e tom 1. A mão alterna D – E – D – E.')}
${L.card('Virada 3 · descendo os tons', 'tom 1, tom 1, tom 2, surdo', v3, 'A virada “desce” dos tambores agudos para os graves. É a mais usada em rock e pop.')}
${L.dica('Dica de estudo', 'treine a virada sozinha, sem o groove, vá a 60 bpm. só depois encaixe no compasso. o segredo é voltar ao groove sem tropeçar no prato.')}` }); };

B.viradas2 = () => { const base = () => groove({ hh: 'x.x.x.x.x.x.....', sn: '....x...........', bd: 'x.......x.......' }); const fim = () => comp(groove({ cr: 'x...............', bd: 'x...............' }), 1);
  const a = sem([...base(), ev('tt', 12, 1), ev('tt', 13, 1), ev('mt', 14, 1), ev('ft', 15, 1), ...fim()]); const b = sem([...base(), ev('sn', 12, 1), ev('sn', 13, 1), ev('bd', 14, 1), ev('bd', 15, 1), ...fim()]); const c = sem([...base(), ev('sn', 12, 2), ev('sn', 14, 2), ...fim()]);
  return pg({ tag: T('viradas2', 'TÉCNICA'), titulo: 'Mais viradas', sub: 'Variações curtas para usar no fim de cada frase.', corpo: `
${L.card('Virada 4 · semicolcheias nos tons', 'tom 1, tom 1, tom 2, surdo, tudo no último tempo', a, 'É a virada 3 acelerada: quatro batidas no tempo 4. Comece a 55 bpm.')}
${L.card('Virada 5 · caixa e bumbo', 'caixa, caixa, bumbo, bumbo no último tempo', b, 'O pé entra na virada. É ótimo para treinar a coordenação entre mãos e pés.')}
${L.card('Virada 6 · só duas colcheias', 'caixa e caixa nos dois últimos “&”', c, 'A virada mais simples. Perfeita para músicas lentas.')}
<h2 class="s">Três regras de ouro</h2><ul class="lista"><li><b>Voltar no 1.</b> A virada só funciona se você volta ao tempo 1 do compasso seguinte, com prato e bumbo.</li><li><b>Menos é mais.</b> Uma boa virada curta vale mais do que uma longa e atropelada.</li></ul>
${L.dica('Dica de estudo', 'escolha uma virada por semana e use em todos os grooves da semana. assim ela vira automática.')}` }); };

const stick = (txt, passo = 2, p = 'sn') => { const evs = []; txt.split('').forEach((c, i) => evs.push(ev(p, i * passo, passo, { mao: c === 'R' ? 'D' : 'E' }))); return svgBateria(evs, 640); };
B.rudimentos = () => pg({ tag: T('rudimentos', 'TÉCNICA'), titulo: 'Rudimentos essenciais', sub: 'Pequenos exercícios de mão que treinam o corpo para qualquer groove.', corpo: `
<p>Rudimentos são <b>padrões de mão</b>, as “escalas” da bateria. A letra em cima diz qual mão toca: <b>D</b> (direita) e <b>E</b> (esquerda). Toque todos na caixa, a 60 bpm.</p>
${L.card('Alternado simples', 'D E D E D E D E · a base de tudo', stick('RLRLRLRLRLRLRLRL'), 'As mãos alternam sem parar. O som das duas tem que ser igual.')}
${L.card('Dobrado', 'D D E E D D E E · duas batidas por mão', stick('RRLLRRLLRRLLRRLL'), 'A segunda batida de cada mão é o rebote. Deixe a baqueta quicar.')}
${L.card('Paradiddle', 'D E D D · E D E E · o rudimento mais famoso', stick('RLRRLRLLRLRRLRLL'), 'Os dois “D D” e os dois “E E” fazem a mão inverter. É ótimo para viradas.')}
${L.dica('Dica de estudo', 'comece devagar e use o metrônomo. dois minutos de cada rudimento por dia valem mais do que vinte minutos de um só.')}` });

B.rud2 = () => { const pdd = stick('RLRRLLRLRRLLRLRRLL'.slice(0, 16)); const ton = (() => { const evs = []; ['sn', 'tt', 'mt', 'ft'].forEach((p, k) => { for (let i = 0; i < 4; i++) evs.push(ev(p, (k * 4 + i) * 2, 2, { mao: i % 2 === 0 ? 'D' : 'E' })); }); return svgBateria(evs, 640); })(); const dob = (() => { const evs = []; 'RRLLRRLL'.split('').forEach((c, i) => evs.push(ev(i < 4 ? 'tt' : 'ft', i * 2, 2, { mao: c === 'R' ? 'D' : 'E' }))); return svgBateria(evs, 640); })();
  return pg({ tag: T('rud2', 'TÉCNICA'), titulo: 'Rudimentos nos tambores', sub: 'Os mesmos padrões, agora passeando pela bateria.', corpo: `
<p>Depois que um rudimento sai bem na caixa, leve-o para os <b>tons</b> e o <b>surdo</b>. É assim que as viradas ganham vida.</p>
${L.card('Paradiddle-diddle', 'D E D D E E · seis batidas, usado em viradas fluidas', pdd, 'Toque devagar. Ele é a base de muitas viradas modernas.')}
${L.card('Alternado nos tambores', 'caixa, tom 1, tom 2 e surdo, quatro batidas em cada', ton, 'Mova só os braços para o próximo tambor. Os cotovelos ficam soltos e relaxados.')}
${L.card('Dobrado entre tom 1 e surdo', 'D D E E no tom 1 e D D E E no surdo', dob, 'Treine a mudança de tambor sem perder o tempo. Comece a 55 bpm.')}
${L.dica('Dica de estudo', 'grave seu estudo e escute: se os tambores soam desiguais, a baqueta está caindo com forças diferentes. relaxe o pulso.')}${L.caderno()}` }); };

B.dinamica = () => { const dinam = (() => { const evs = []; for (let i = 0; i < 16; i += 2) evs.push(ev('hh', i)); evs.push(ev('sn', 4, 2, { acc: true }), ev('sn', 12, 2, { acc: true }), ev('bd', 0), ev('bd', 8), ev('sn', 7, 1, { fan: true })); return L.comContagem(sem(evs), evs); })();
  return pg({ tag: T('dinamica', 'EXPRESSÃO'), titulo: 'Acentos e notas fantasma', sub: 'Quem toca tudo com a mesma força soa como máquina.', corpo: `
<p>Dinâmica é a diferença entre <b>forte</b> e <b>fraco</b>. Na partitura, aparece de dois jeitos:</p>
<table class="t"><tr><th>Símbolo</th><th>Nome</th><th>Como tocar</th></tr><tr><td><b>&gt;</b> sobre a nota</td><td>acento</td><td>toque mais forte. A baqueta sobe mais alto antes de bater.</td></tr><tr><td><b>( )</b> em volta da nota</td><td>nota fantasma</td><td>toque muito baixinho, quase só um toque. A baqueta quase não sobe.</td></tr></table>
${L.card('Groove com acentos e uma nota fantasma', 'a nota fantasma está antes do tempo 3 (o “a” do 2)', dinam, 'Os dois acentos na caixa dão força aos tempos 2 e 4. A nota entre parênteses dá o balanço sem aparecer demais.')}
<h2 class="s">Três alturas de baqueta</h2>
<table class="t"><tr><th>Altura</th><th>Volume</th><th>Quando</th></tr><tr><td>Rente à pele</td><td>fraco</td><td>notas fantasma e partes calmas</td></tr><tr><td>Meio caminho</td><td>médio</td><td>a maior parte do groove</td></tr><tr><td>Bem alto</td><td>forte</td><td>acentos e viradas</td></tr></table>
${L.dica('Dica de estudo', 'grave 30 segundos tocando o groove com e sem dinâmica. você vai ouvir a diferença na hora.')}` }); };

B.indep = () => pg({ tag: T('indep', 'EXPRESSÃO'), titulo: 'Independência: o ostinato', sub: 'Quando as mãos repetem e o pé aprende coisas novas.', corpo: `
<p><b>Ostinato</b> é uma parte que se repete sem parar. No groove, o chimbal é o ostinato: ele não pode mudar enquanto o pé faz coisas diferentes. Treine em 4 degraus:</p>
<div class="grade2">${[['Degrau 1 · bumbo nos tempos', 'x · · · x · · · x · · · x · · ·', 'x...x...x...x...', 'Bumbo em todos os tempos.'], ['Degrau 2 · bumbo sincopado', 'bumbo no “&” do 2 e no “&” do 4', 'x.....x.x.....x.', 'Conte só o bumbo em voz alta antes.'], ['Degrau 3 · bumbo na frente', 'bumbo no 1, no “&” do 1 e no 3', 'x.x.....x.......', 'O pé toca duas vezes seguidas.'], ['Degrau 4 · mistura', 'bumbo no 1, “&” do 2, “&” do 3 e 4', 'x.....x...x.x...', 'Vá a 55 bpm e não tenha pressa.']].map(([t, m, bd, tx]) => L.card(t, m, nota({ hh: HH8, sn: SN, bd }).svg, tx)).join('')}</div>
${L.dica('Dica de estudo', 'se o chimbal começar a acompanhar o bumbo, pare, respire e recomece só com o chimbal por 8 compassos. é normal: o cérebro está se reorganizando.')}` });

B.leitura = () => { const pads = ['x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'x...x.x.x...x.x.', 'x.x...x.x.x...x.', 'x...x.......x...', 'xxxxx.x.x...x.x.']; return pg({ tag: T('leitura', 'EXPRESSÃO'), titulo: 'Leitura rítmica na caixa', sub: 'Seis compassos para ler à primeira vista. Só a caixa, 60 bpm.', corpo: `
<p>Ler ritmo é uma habilidade que se treina como qualquer outra. Para cada compasso: <b>1)</b> conte em voz alta, <b>2)</b> bata com as mãos na coxa, <b>3)</b> toque na caixa.</p>
<div class="grade2">${pads.map((l, i) => L.card(`Compasso ${i + 1}`, i === 5 ? 'misturando semicolcheias e colcheias' : 'só caixa, uma peça', nota({ sn: l }, { passo: i === 5 ? 1 : i === 0 || i === 4 ? 4 : 2 }).svg, '')).join('')}</div>
<ol class="passos"><li>Leia cada compasso <b>sem tocar</b>, só contando.</li><li>Toque devagar, sem parar entre os compassos.</li><li>Junte os seis em sequência, sem pausa, como uma música.</li></ol>
${L.dica('Dica de estudo', 'escolha um novo compasso por dia e invente mais, mudando só uma nota. criar o seu próprio exercício também ensina a ler.')}` }); };

B.estudo = () => pg({ tag: T('estudo', 'PRÁTICA'), titulo: 'Estude em 15 minutos', sub: 'Pouco tempo, muita eficiência.', corpo: `
<table class="t"><tr><th>Dia</th><th>Foco</th><th>O que tocar</th></tr>
<tr><td>Segunda</td><td>Pulso</td><td>Chimbal em colcheias + groove base, 60 bpm</td></tr><tr><td>Terça</td><td>Bumbo</td><td>Duas variações do bumbo (seção ${N('bumbo')})</td></tr><tr><td>Quarta</td><td>Mãos</td><td>Rudimentos (seção ${N('rudimentos')}), 2 min cada</td></tr><tr><td>Quinta</td><td>Estilo</td><td>Um groove de um estilo novo (seção ${N('estilos')})</td></tr><tr><td>Sexta</td><td>Virada</td><td>Uma virada, depois encaixada no groove</td></tr><tr><td>Sábado</td><td>Música</td><td>Toque junto com uma música que você gosta</td></tr><tr><td>Domingo</td><td>Descanso</td><td>Se quiser, só ouça e tente acompanhar com os dedos</td></tr></table>
<h2 class="s">Estudando em apartamento</h2>
<ul class="lista"><li><b>Pad de estudo</b> ou abafadores de pele diminuem o volume sem tirar a sensação.</li><li><b>Horários combinados</b> com os vizinhos evitam conflito e dão tranquilidade para estudar.</li><li><b>Sem bateria em casa?</b> Um travesseiro e duas baquetas já treinam rudimentos, pegada e pulso.</li><li><b>Fones de ouvido</b> com o metrônomo e uma música ao fundo deixam o estudo silencioso para quem está perto.</li></ul>
${L.dica('Dica de estudo', 'adulto aprende melhor quando sabe o motivo de cada exercício. se ficar sem entender para que serve algo, volte à seção do exercício e leia o que ele treina.')}${L.caderno()}` });

B.musica = () => pg({ tag: T('musica', 'MÚSICA'), titulo: 'Montando sua primeira música', sub: 'Toda música tem um mapa. Aprenda a ler o mapa e você toca qualquer uma.', corpo: `
<table class="t"><tr><th>Parte</th><th>Compassos</th><th>O que a bateria faz</th></tr>
<tr><td><b>Intro</b></td><td>4 ou 8</td><td>Groove leve (só chimbal e bumbo), ou entra de repente com uma virada.</td></tr><tr><td><b>Verso</b></td><td>8 ou 16</td><td>Groove base, discreto, para dar espaço à voz.</td></tr><tr><td><b>Pré-refrão</b></td><td>4 ou 8</td><td>Aumenta a energia: mais bumbo ou caixa mais forte.</td></tr><tr><td><b>Refrão</b></td><td>8 ou 16</td><td>Prato no lugar do chimbal, tudo mais forte.</td></tr><tr><td><b>Ponte</b></td><td>4 ou 8</td><td>Muda o groove: meio-tempo ou menos peças.</td></tr><tr><td><b>Final</b></td><td>2 a 4</td><td>Virada + prato e bumbo juntos, e silêncio.</td></tr></table>
<h2 class="s">Do papel ao palco, em 5 passos</h2>
<ol class="passos"><li>Escolha uma música com andamento lento e groove simples.</li><li>Descubra o <b>bpm</b> com um aplicativo e coloque o metrônomo nele.</li><li>Conte os compassos de cada parte (batendo com o pé).</li><li>Toque só o chimbal durante a música inteira, para fixar a forma.</li><li>Acrescente caixa e bumbo, parte por parte, e as viradas por último.</li></ol>
${L.dica('Dica de estudo', 'ouça a música três vezes só prestando atenção na bateria antes de tocar. o ouvido ensina a mão.')}` });

B.exemplo = () => { const evs = []; for (let b = 0; b < 3; b++) evs.push(...comp(groove({ hh: HH8, sn: SN, bd: BD }), b)); evs.push(...comp(groove({ hh: 'x.x.x.x.x.x.....', sn: '....x...........', bd: BD }), 3), ...[12, 13, 14, 15].map((i) => ev('sn', i + 48, 1))); for (let b = 4; b < 7; b++) evs.push(...comp(groove({ cr: HH8, sn: SN, bd: 'x.....x.x.......' }), b)); evs.push(...comp(groove({ cr: 'x...............', sn: '................', bd: 'x...............' }), 7));
  return pg({ tag: T('exemplo', 'MÚSICA'), titulo: 'Uma música de 8 compassos', sub: 'Um verso e um refrão, em partitura, para você ver o mapa funcionando.', corpo: `
${L.card('Mini música: verso e refrão', 'compassos 1 a 4: verso · compassos 5 a 8: refrão', svgBateria(evs, 700).replace(/<text[^>]*fill="#6b6558">B<\/text>/g, '').replace('<svg ', '<svg class="xl" '))}
<table class="t"><tr><th>Compassos</th><th>Parte</th><th>O que acontece</th></tr><tr><td>1 a 3</td><td>Verso</td><td>Groove de rock no chimbal, com bumbo no 1 e no 3.</td></tr><tr><td>4</td><td>Virada</td><td>Três tempos de groove e quatro semicolcheias na caixa no último tempo.</td></tr><tr><td>5 a 7</td><td>Refrão</td><td>Prato no lugar do chimbal, com bumbo variado (“&” do 2).</td></tr><tr><td>8</td><td>Final</td><td>Prato e bumbo juntos e silêncio.</td></tr></table>
<ol class="passos"><li>Toque cada parte sozinha, a 60 bpm.</li><li>Junte verso e virada, sem parar.</li><li>Toque as 8 barras direto. Se errar, volte ao começo da parte.</li></ol>
${L.dica('Dica de estudo', 'escreva no papel o mapa da música que você quer tocar, do jeito que está aqui. quem consegue desenhar o mapa consegue tocar.')}` }); };

B.erros = () => pg({ tag: T('erros', 'PRÁTICA'), titulo: 'Erros comuns de quem começa adulto', sub: 'O que mais atrapalha e como resolver.', corpo: `
<table class="t"><tr><th>O erro</th><th>Por que acontece</th><th>Como corrigir</th></tr>
<tr><td><b>Apertar demais a baqueta</b></td><td>Medo de errar e perder o controle.</td><td>Segure como um passarinho. Se a mão dói, a pegada está tensa.</td></tr>
<tr><td><b>Começar rápido demais</b></td><td>Pressa de “soar bem”.</td><td>Volte 10 bpm. Se errou, a velocidade estava acima do seu nível.</td></tr>
<tr><td><b>Olhar para as mãos</b></td><td>Insegurança.</td><td>Olhe na partitura ou na parede. O corpo precisa aprender sozinho.</td></tr>
<tr><td><b>Estudar sem metrônomo</b></td><td>Achar chato.</td><td>Ele é o seu espelho. Use em todo estudo, mesmo que sejam 5 min.</td></tr>
<tr><td><b>Maratona no fim de semana</b></td><td>Falta de tempo na semana.</td><td>Troque por 10 min diários. Rende mais e cansa menos.</td></tr>
<tr><td><b>Comparar-se com quem toca há anos</b></td><td>Redes sociais.</td><td>Compare-se com você de um mês atrás. Grave um vídeo hoje.</td></tr>
<tr><td><b>Abandonar na 3ª semana</b></td><td>A empolgação passa e o progresso fica mais devagar.</td><td>Sinta o platô como sinal de que o cérebro está consolidando. Continue.</td></tr></table>
${L.dica('Lembre-se', `dor forte no ombro, punho ou costas é sinal de parar. descanse, alongue e revise a postura (seção ${N('postura')}) antes de voltar.`)}${L.caderno()}` });

const DES = [['rock', { hh: HH8, sn: SN, bd: BD }], ['meio-tempo', { hh: HH8, sn: '........x.......', bd: 'x...............' }], ['quatro no chão', { hh: HH8, sn: SN, bd: 'x...x...x...x...' }], ['one drop', { hh: HH8, sn: '........x.......', bd: '........x.......' }]];
B.desafios = () => pg({ tag: T('desafios', 'JOGOS'), titulo: 'Desafios no papel', sub: 'Pegue um lápis. As respostas estão na página seguinte.', corpo: `
<div class="grade2">${DES.map(([, l], i) => L.card(`${i + 1} · Que groove é este?`, 'escolha: rock · meio-tempo · quatro no chão · one drop', nota(l).svg)).join('')}</div>
<h2 class="s">Perguntas rápidas</h2>
<ol class="passos"><li>Em 4/4, quantos tempos tem um compasso?</li><li>A caixa fica em qual espaço da pauta?</li><li>O que significa o símbolo “>” sobre uma nota?</li><li>Quantas colcheias cabem em um compasso 4/4?</li><li>Em que tempo a caixa toca no groove de rock?</li><li>O que é um ostinato?</li><li>O que é uma pausa?</li><li>Qual chimbal soa mais longo: o aberto ou o fechado?</li></ol>
${L.dica('Dica de estudo', 'depois de responder, toque cada groove e confira se a mão sabe o que o olho leu.')}` });
B.respostas = () => pg({ tag: T('desafios', 'JOGOS'), titulo: 'Respostas dos desafios', corpo: `
<h2 class="s">Que groove é este?</h2>
<table class="t"><tr><th>Nº</th><th>Resposta</th><th>Como reconhecer</th></tr><tr><td>1</td><td><b>Rock</b></td><td>Bumbo no 1 e no 3, caixa no 2 e no 4.</td></tr><tr><td>2</td><td><b>Meio-tempo</b></td><td>A caixa toca só no tempo 3.</td></tr><tr><td>3</td><td><b>Quatro no chão</b></td><td>O bumbo toca em todos os tempos.</td></tr><tr><td>4</td><td><b>One drop</b></td><td>Bumbo e caixa juntos só no tempo 3.</td></tr></table>
<h2 class="s">Perguntas rápidas</h2>
<table class="t"><tr><th>Nº</th><th>Resposta</th></tr><tr><td>1</td><td>Quatro tempos.</td></tr><tr><td>2</td><td>No 3º espaço, contando de baixo para cima.</td></tr><tr><td>3</td><td>Acento: tocar mais forte.</td></tr><tr><td>4</td><td>Oito colcheias.</td></tr><tr><td>5</td><td>No tempo 2 e no tempo 4.</td></tr><tr><td>6</td><td>Uma parte que se repete sem parar, como o chimbal do groove.</td></tr><tr><td>7</td><td>Um momento em que você não toca, mas continua contando.</td></tr><tr><td>8</td><td>O chimbal aberto.</td></tr></table>
<div class="cit-p" style="margin-top:10mm">“Errar é o jeito que o cérebro calibra a mira. Hoje você sabe mais do que ontem. Isso já é vitória.”</div><p class="gde" style="text-align:center;margin-top:8mm">Parabéns por chegar até aqui.</p>` });

B.plano4 = () => pg({ tag: 'PLANO · suas 4 primeiras semanas', titulo: 'Do zero ao primeiro groove', sub: '15 minutos por dia valem mais do que uma hora no domingo. Marque um X em cada dia que tocar.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta da semana</th></tr>
<tr><td><b>1</b></td><td>Pegada, pulso e chimbal</td><td>Tocar colcheias no chimbal por 2 minutos a 60 bpm, sem acelerar.</td></tr>
<tr><td><b>2</b></td><td>Primeiro groove</td><td>Groove de rock completo a 70 bpm, 3 vezes seguidas sem errar.</td></tr>
<tr><td><b>3</b></td><td>Variações e virada</td><td>Duas variações do bumbo e uma virada de um tempo.</td></tr>
<tr><td><b>4</b></td><td>Primeira música</td><td>Tocar uma música lenta inteira, só com o groove base, e gravar um vídeo.</td></tr></table>
<h2 class="s">Marque seus dias</h2><p style="font-size:15pt;letter-spacing:.2em;line-height:2">${'☐ '.repeat(28)}</p>
<h2 class="s">Minha meta pessoal</h2><p style="line-height:2.4;color:#b8b09a">____________________________________________________________________<br>____________________________________________________________________</p>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que ficou mais fácil?</th><th>O que ainda travo?</th></tr>${[1, 2, 3, 4].map((n) => `<tr><td><b>${n}</b></td><td style="height:11mm"></td><td></td></tr>`).join('')}</table>
${L.dica('Como acompanhar', 'ao final de cada semana, escreva uma frase sobre o que ficou mais fácil. o progresso é difícil de ver por dentro e fácil de ver no papel.')}` });

B.plano8 = () => pg({ tag: 'PLANO · 8 semanas', titulo: 'Do groove à música completa', sub: 'Se você terminou as 4 primeiras semanas, este é o próximo degrau.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta da semana</th></tr>
<tr><td><b>1 a 4</b></td><td>Base</td><td>Plano das 4 primeiras semanas (página anterior).</td></tr>
<tr><td><b>5</b></td><td>Estilos</td><td>Dois grooves novos: meio-tempo e pop dançante, ambos a 70 bpm.</td></tr>
<tr><td><b>6</b></td><td>Viradas</td><td>Duas viradas nos tons, encaixadas em um groove de 4 compassos.</td></tr>
<tr><td><b>7</b></td><td>Independência</td><td>Degraus 1 a 3 do ostinato (seção ${N('indep')}) sem olhar para o pé.</td></tr>
<tr><td><b>8</b></td><td>Segunda música</td><td>Uma música inteira com verso, refrão e uma virada entre as partes.</td></tr></table>
<h2 class="s">Metas de andamento</h2><table class="t"><tr><th>Exercício</th><th>Semana 5</th><th>Semana 6</th><th>Semana 7</th><th>Semana 8</th></tr><tr><td>Groove de rock</td><td>80 bpm</td><td>85 bpm</td><td>90 bpm</td><td>95 bpm</td></tr><tr><td>Alternado simples</td><td>70 bpm</td><td>75 bpm</td><td>80 bpm</td><td>85 bpm</td></tr><tr><td>Virada 1</td><td>60 bpm</td><td>65 bpm</td><td>70 bpm</td><td>75 bpm</td></tr></table>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que consegui?</th><th>O que vou melhorar?</th></tr>${[5, 6, 7, 8].map((n) => `<tr><td><b>${n}</b></td><td style="height:14mm"></td><td></td></tr>`).join('')}</table>
${L.dica('Lembre-se', 'o progresso entre as semanas 5 e 8 é mais lento do que no começo. isso é normal: você já aprendeu o básico e agora está refinando.')}` });

B.registro = () => { const col = (a, b) => `<table class="t" style="table-layout:fixed"><tr><th style="width:9mm">Dia</th><th style="width:13mm">Min.</th><th>O que toquei</th></tr>${Array.from({ length: b - a + 1 }, (_, i) => `<tr><td style="height:8.6mm"><b>${a + i}</b></td><td></td><td></td></tr>`).join('')}</table>`; return pg({ tag: 'REGISTRO', titulo: 'Os seus 30 dias', sub: 'Anote o tempo e o que tocou. Ver o caderno cheio é o melhor motivador.', corpo: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm">${col(1, 15)}${col(16, 30)}</div>${L.dica('Como preencher', 'escreva só o essencial: “groove 1, 60 bpm, 3 acertos”. se um dia você não tocou, deixe em branco e volte no dia seguinte, sem culpa.')}` }); };

B.glossario = () => pg({ tag: 'GLOSSÁRIO', titulo: 'Palavras que você vai ouvir', sub: 'Para conversar com outros músicos sem dúvida.', corpo: `
<table class="t"><tr><th>Termo</th><th>O que é</th></tr>
${[['Andamento', 'A velocidade da música, medida em bpm.'], ['bpm', 'Batidas por minuto. 60 bpm = uma batida por segundo.'], ['Compasso', 'Um “bloco” de tempos. Em 4/4, cada compasso tem quatro tempos.'], ['Pulso', 'A batida constante, como o coração da música.'], ['Groove', 'A levada: o padrão de bateria que se repete e dá a base da música.'], ['Virada (fill)', 'Um trecho curto que preenche o fim de uma frase e leva à próxima.'], ['Ostinato', 'Uma parte que se repete sem parar, enquanto o resto muda.'], ['Rudimento', 'Um padrão de mãos que treina técnica, como as escalas do pianista.'], ['Acento', 'Uma nota tocada mais forte do que as outras.'], ['Nota fantasma', 'Uma nota tocada muito baixinho, só para dar balanço.'], ['Síncope', 'Um acento fora do tempo forte, que cria balanço.'], ['Rim shot / cross-stick', 'Tocar a madeira do aro da caixa. Som seco, usado em baladas.'], ['Pad de estudo', 'Uma superfície de borracha para treinar sem barulho.'], ['Clique', 'O som do metrônomo.'], ['Prato de ataque (crash)', 'O prato que “explode”: marca o início de uma parte.'], ['Condução (ride)', 'O prato usado como pulso, no lugar do chimbal.']].map(([t, x]) => `<tr><td><b>${t}</b></td><td>${x}</td></tr>`).join('')}</table>` });

B.proximo = () => pg({ tag: 'PRÓXIMO PASSO', titulo: 'E agora? Continue tocando.', corpo: `
<p>Quem chegou até aqui já fez o mais difícil: <b>começar</b>. Agora é repetir um pouco todo dia e deixar o corpo aprender.</p>
<ul class="lista"><li><b>Grave um vídeo seu</b> tocando o groove da semana e compare daqui a 30 dias.</li><li><b>Escolha uma música nova por mês</b> e monte o mapa dela (seção ${N('musica')}).</li><li><b>Toque com outras pessoas.</b> Uma banda, um amigo no violão ou uma roda: o pulso melhora muito tocando junto.</li><li><b>Peça ajuda.</b> Um professor corrige a pegada e a postura em minutos, o que sozinho levaria meses.</li></ul>
<div class="card" style="margin-top:6mm"><h4>Aulas na Beaterista</h4><p>Aulas de bateria para adultos e crianças, em Araçatuba. Rua Liberdade, 268. WhatsApp <b>18 991804150</b>. Mais materiais em <b>beaterista.com.br</b>.</p></div>
<h2 class="s">Minha lista de músicas para tocar</h2><table class="t"><tr><th>Música</th><th>bpm</th><th>Groove</th><th>Já toco?</th></tr>${[1, 2, 3, 4, 5].map(() => '<tr><td style="height:9mm"></td><td></td><td></td><td>☐</td></tr>').join('')}</table>
<h2 class="s">O que eu aprendi</h2><ul class="trilha"><li>Sei sentar, segurar a baqueta e relaxar os ombros.</li><li>Leio um compasso de bateria e conto em voz alta.</li><li>Toco o groove de rock completo com o metrônomo.</li><li>Sei fazer uma virada e voltar ao groove.</li></ul>
<p class="mut" style="font-size:8.4pt;margin-top:6mm">folhas para imprimir: nas próximas páginas tem uma pauta de bateria em branco e uma grade para você montar os seus grooves.</p>` });

const pautaBranca = (n) => { const sist = Array.from({ length: n }, (_, i) => { const y = 14 + i * 56; return `<g><g stroke="#1d2236" stroke-width="1">${[0, 1, 2, 3, 4].map((k) => `<line x1="30" x2="690" y1="${y + k * 9}" y2="${y + k * 9}"/>`).join('')}</g><g stroke="#1d2236" stroke-width="3"><line x1="40" x2="40" y1="${y + 8}" y2="${y + 28}"/><line x1="46" x2="46" y1="${y + 8}" y2="${y + 28}"/></g><g stroke="#1d2236" stroke-width="1">${[0, 1, 2, 3, 4].map((k) => `<line x1="${210 + k * 120}" x2="${210 + k * 120}" y1="${y}" y2="${y + 36}"/>`).join('')}</g></g>`; }).join(''); return `<svg viewBox="0 0 720 ${14 + n * 56}" width="100%">${sist}</svg>`; };
B.folha1 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Pauta de bateria em branco', sub: 'Escreva seus grooves, viradas e ideias.', corpo: `<p class="mut">Nome: ______________________________ &nbsp; Data: ____/____ &nbsp; bpm: ______</p>${pautaBranca(11)}` });
B.folha2 = () => { const rows = ['prato', 'chimbal', 'caixa', 'tom 1', 'tom 2', 'surdo', 'bumbo']; const cab = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a']; const tabela = (t) => `<p class="tag" style="margin-top:3mm">${t}</p><table class="t" style="table-layout:fixed"><tr><th style="width:16mm"></th>${cab.map((c) => `<th style="text-align:center;padding:1mm 0">${c}</th>`).join('')}</tr>${rows.map((r) => `<tr><td style="padding:.8mm 2mm;font-size:8pt"><b>${r}</b></td>${cab.map((_, i) => `<td style="height:5mm;border-left:${i % 4 === 0 ? '.45mm solid #b8913f' : '.15mm solid #e3dac4'}"></td>`).join('')}</tr>`).join('')}</table>`; return pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Monte seus grooves', sub: 'Marque com um “x” onde cada peça toca. A linha dourada separa os tempos.', corpo: tabela('Groove 1') + tabela('Groove 2') + tabela('Groove 3') }); };

/* ================= montagem ================= */
const NUMS = process.env.NUMS && existsSync(process.env.NUMS) ? JSON.parse(readFileSync(process.env.NUMS, 'utf8')) : {};
const modulos = MODS.map((m, i) => ({ livro: NOME, nome: m[1] ? `MÓDULO ${String(i + 1).padStart(2, '0')} · ${m[1].toUpperCase()}` : 'PARA LEVAR' }));
const P = []; P.push(L.capa({ tipo: 'bateria', t1: 'bateria', t2: 'para adultos', lema: 'da primeira baqueta ao primeiro groove, em 15 minutos por dia.' }));
const sumPos = P.length; P.push('');
for (const [i, m] of MODS.entries()) {
  MODI = i;
  if (m[1]) P.push(L.divisor({ modulo: i + 1, titulo: m[1], citacao: m[2], itens: m[4].filter((id) => id !== 'respostas').map((id) => [N(id), TITULOS[id]]), nome: NOME }));
  for (const id of m[4]) { if (id === 'folha2') continue; IDATUAL = id; P.push(B[id]()); if (id === 'folha1') { IDATUAL = 'folha2'; P.push(B.folha2()); } }
}
P[sumPos] = L.sumario(MODS.map((m) => [m[0], m[4].filter((id) => !['folha2', 'respostas'].includes(id)).map((id) => [['plano4', 'plano8', 'registro', 'glossario', 'proximo', 'folha1'].includes(id) ? '·' : N(id), TITULOS[id], NUMS[id] || ''])]), NOME, 'cada groove desta apostila foi escrito no Beaterista PRO: o mesmo desenho que você vê aqui abre no editor, toca e dá para imprimir.');
writeFileSync('/tmp/apo/bateria.html', L.doc(P, 'Bateria para adultos · Beaterista', 'vinho', modulos));
console.log('seções:', P.length);
console.log(JSON.stringify(MODS.flatMap((m) => m[4])));
