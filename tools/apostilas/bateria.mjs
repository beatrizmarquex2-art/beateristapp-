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
  ['Módulo 1 · Primeiros passos', 'Primeiros passos', 'Nunca é tarde para tocar bateria. É tarde para esperar o momento perfeito.', 'Antes do primeiro groove: conhecer o instrumento, sentar direito, usar os pés e aprender a ler a partitura que você vai usar.', ['como', 'pecas', 'postura', 'empunhadura', 'rebote', 'pes', 'ler', 'duasvozes', 'equip']],
  ['Módulo 2 · Pulso e groove', 'Pulso e groove', 'Quem toca no tempo é lembrado. Quem toca rápido é esquecido.', 'O pulso é a base de qualquer música. Com ele firme, você monta o primeiro groove e ganha variações.', ['aquec', 'pulso', 'contar', 'figuras', 'ponto', 'pausas', 'sincope', 'tercinas', 'compasso', 'primeiro', 'bumbo', 'bumbo2', 'bumbo8', 'estilos', 'chimbal', 'estilos2']],
  ['Módulo 3 · Técnica e expressão', 'Técnica e expressão', 'Devagar e certo vira rápido e certo. Rápido e errado vira hábito errado.', 'Viradas, rudimentos, leitura, dinâmica e independência: o que transforma uma levada em música.', ['viradas', 'viradas2', 'variar', 'rudimentos', 'mao', 'paradiddles', 'moeller', 'flam', 'rud2', 'pad', 'dinamica', 'indep', 'linear', 'leitura']],
  ['Módulo 4 · Tocando de verdade', 'Tocando de verdade', 'Você não precisa de talento para começar. Precisa começar para ganhar talento.', 'Rotina de estudo, forma de música e o que evitar. É aqui que você passa de exercício para música.', ['estudo', 'musica', 'exemplo', 'ritornelo', 'erros', 'desafios', 'respostas']],
  ['Para levar', null, null, null, ['plano4', 'plano8', 'plano12', 'registro', 'glossario', 'proximo', 'folha1', 'folha2']],
];
const TITULOS = { empunhadura: 'Empunhadura: o fulcro', rebote: 'Rebote: deixar a baqueta voltar', duasvozes: 'Duas vozes: mãos e pés', ponto: 'Ponto de aumento e ligadura', sincope: 'Síncope e contratempo', tercinas: 'Tercinas e o shuffle', compasso: 'Compasso: simples e composto', bumbo8: 'Bumbo independente: 8 padrões', moeller: 'Técnica Moeller: o chicote', flam: 'Flam, rimshot e cross-stick', ritornelo: 'Sinais de repetição', plano12: 'Plano de 12 semanas', contar: 'Contar é o que segura o groove', bumbo2: 'Rock com dois bumbos', variar: 'Não fique sempre na mesma variação', mao: 'A mão alternada: D E e suas variações', paradiddles: 'Paradiddle: simples, duplo e triplo', pad: 'Treinando no pad: uma mão de cada vez', linear: 'Ritmos lineares', como: 'Como usar esta apostila', pecas: 'Conheça as peças da bateria', postura: 'Postura, banco e pegada', pes: 'Os pés: bumbo e chimbal', ler: 'Como ler a partitura de bateria', equip: 'Equipamento básico', aquec: 'Aquecimento de 5 minutos', pulso: 'Pulso e metrônomo', figuras: 'Colcheias e semicolcheias', pausas: 'Pausas e silêncios', primeiro: 'O primeiro groove', bumbo: 'Variações do bumbo', estilos: 'Grooves por estilo', chimbal: 'Chimbal aberto e fechado', estilos2: 'Mais três grooves', viradas: 'Viradas', viradas2: 'Mais viradas', rudimentos: 'Rudimentos essenciais', rud2: 'Rudimentos nos tambores', dinamica: 'Acentos e notas fantasma', indep: 'Independência: o ostinato', leitura: 'Leitura rítmica na caixa', estudo: 'Estude em 15 minutos', musica: 'Montando sua primeira música', exemplo: 'Uma música de 8 compassos', erros: 'Erros comuns de quem começa adulto', desafios: 'Desafios no papel', respostas: 'Respostas dos desafios', plano4: 'Plano das 4 primeiras semanas', plano8: 'Plano de 8 semanas', registro: 'Registro dos 30 dias', glossario: 'Glossário', proximo: 'E agora? Continue tocando', folha1: 'Pauta em branco', folha2: 'Grade de grooves' };
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

B.pecas = () => { const evs = ['hh', 'sn', 'bd', 'tt', 'mt', 'ft', 'cr', 'rd'].map((p, i) => ev(p, i * 4, 4)); const nomes = { hh: 'chimbal', sn: 'caixa', bd: 'bumbo', tt: 'tom 1', mt: 'tom 2', ft: 'surdo', cr: 'prato', rd: 'condução' }; const leg = L.comContagem(sem(evs), evs, (e) => nomes[e.p], 14);
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

const baseV = (hh = 'x.x.x.x.x.x.....') => groove({ hh, sn: '....x...........', bd: 'x.......x.......' });
const fimV = () => comp(groove({ cr: 'x...............', bd: 'x...............' }), 1);
const mv = (lista, ini0) => lista.map(([p, m], i) => ev(p, ini0 + i, 1, { mao: m })); // lista de [peça, mão] em semicolcheias
B.viradas = () => {
  const v1 = sem([...baseV(), ...mv([['sn', 'D'], ['sn', 'E'], ['sn', 'D'], ['sn', 'E']], 12), ...fimV()]);
  const v2 = sem([...baseV('x.x.x.x.........'), ev('sn', 8, 2, { mao: 'E' }), ev('sn', 10, 2, { mao: 'D' }), ev('sn', 12, 2, { mao: 'E' }), ev('tt', 14, 2, { mao: 'D' }), ...fimV()]);
  const v3 = sem([...baseV('x.x.x.x.........'), ...mv([['tt', 'D'], ['sn', 'E'], ['tt', 'D'], ['sn', 'E'], ['mt', 'D'], ['sn', 'E'], ['ft', 'D'], ['sn', 'E']], 8), ...fimV()]);
  return pg({ tag: T('viradas', 'TÉCNICA'), titulo: 'Viradas', sub: 'A virada avisa que a música vai mudar de parte.', corpo: `
<p>Uma <b>virada</b> (ou <i>fill</i>) preenche o último tempo ou os dois últimos tempos do compasso. Ela leva para a próxima parte, que geralmente começa com <b>prato e bumbo juntos</b> no tempo 1 do compasso seguinte.</p>
<div class="dica" style="margin-top:0"><b>Regra de mão (a mais importante)</b><span>Para quem é destro: <b>os tambores (tom 1, tom 2 e surdo) ficam sempre com a mão DIREITA</b>; a mão esquerda cuida da caixa. Assim as mãos nunca se cruzam e o movimento é natural. Os métodos clássicos chamam isso de “mão líder”.</span></div>
${L.card('Virada 1 · só a caixa', 'quatro semicolcheias no último tempo', v1, 'Toque o groove normal por três tempos e, no tempo 4, quatro batidas rápidas na caixa: D E D E. Termine com prato + bumbo no 1.')}
${L.card('Virada 2 · caixa e tom', 'dois tempos de virada', v2, 'Tempo 3: caixa E, caixa D. Tempo 4: caixa E e tom 1 com a D. O tom sempre cai na direita.')}
${L.card('Virada 3 · a direita passeia pelos tons', 'tom 1, tom 1, tom 2, surdo com a mão D; a esquerda marca a caixa', v3, 'A direita desce pelos tambores (D) e a esquerda volta à caixa entre cada batida (E). É a mais usada em rock e pop.')}
${L.dica('Dica de estudo', 'treine a virada sozinha, sem o groove, a 60 bpm. só depois encaixe no compasso. o segredo é voltar ao groove sem tropeçar no prato.')}` }); };

B.viradas2 = () => { const base = () => baseV('x.x.x.x.........'); const fim = fimV;
  const a = sem([...base(), ...mv([['tt', 'D'], ['sn', 'E'], ['mt', 'D'], ['sn', 'E'], ['mt', 'D'], ['sn', 'E'], ['ft', 'D'], ['sn', 'E']], 8), ...fim()]);
  const b = sem([...baseV(), ev('sn', 12, 1, { mao: 'D' }), ev('sn', 13, 1, { mao: 'E' }), ev('bd', 14, 1), ev('bd', 15, 1), ...fim()]);
  const c = sem([...baseV(), ev('sn', 12, 2, { mao: 'D' }), ev('sn', 14, 2, { mao: 'E' }), ...fim()]);
  return pg({ tag: T('viradas2', 'TÉCNICA'), titulo: 'Mais viradas', sub: 'Variações curtas para usar no fim de cada frase.', corpo: `
${L.card('Virada 4 · de ponta a ponta', 'tom 1, tom 2, tom 2, surdo (todos com a D), caixa entre eles (E)', a, 'A direita faz o caminho do tom mais agudo ao mais grave e a esquerda marca a caixa. Comece a 55 bpm.')}
${L.card('Virada 5 · caixa e bumbo', 'caixa D, caixa E, bumbo, bumbo no último tempo', b, 'Os pés entram na virada. É ótimo para treinar a coordenação entre mãos e pés.')}
${L.card('Virada 6 · só duas colcheias', 'caixa D e caixa E nos dois últimos “&”', c, 'A virada mais simples. Perfeita para músicas lentas.')}
<h2 class="s">Três regras de ouro</h2><ul class="lista"><li><b>Voltar no 1.</b> A virada só funciona se você volta ao tempo 1 do compasso seguinte, com prato e bumbo.</li><li><b>Menos é mais.</b> Uma boa virada curta vale mais do que uma longa e atropelada.</li><li><b>Sem cruzar os braços.</b> Tons na direita, caixa na esquerda.</li></ul>
${L.dica('Dica de estudo', 'escolha uma virada por semana e use em todos os grooves da semana. assim ela vira automática.')}` }); };

const stick = (txt, passo = 2, p = 'sn') => { const evs = []; txt.split('').forEach((c, i) => evs.push(ev(p, i * passo, passo, { mao: c === 'R' ? 'D' : 'E' }))); return svgBateria(evs, 640); };
B.rudimentos = () => pg({ tag: T('rudimentos', 'TÉCNICA'), titulo: 'Rudimentos essenciais', sub: 'Pequenos exercícios de mão que treinam o corpo para qualquer groove.', corpo: `
<p>Rudimentos são <b>padrões de mão</b>, as “escalas” da bateria. A letra em cima diz qual mão toca: <b>D</b> (direita) e <b>E</b> (esquerda). Toque todos na caixa, a 60 bpm.</p>
${L.card('Alternado simples', 'D E D E D E D E · a base de tudo', stick('RLRLRLRLRLRLRLRL'), 'As mãos alternam sem parar. O som das duas tem que ser igual.')}
${L.card('Dobrado', 'D D E E D D E E · duas batidas por mão', stick('RRLLRRLLRRLLRRLL'), 'A segunda batida de cada mão é o rebote. Deixe a baqueta quicar.')}
${L.card('Paradiddle', 'D E D D · E D E E · o rudimento mais famoso', stick('RLRRLRLLRLRRLRLL'), 'Os dois “D D” e os dois “E E” fazem a mão inverter. É ótimo para viradas.')}
${L.dica('Dica de estudo', 'comece devagar e use o metrônomo. dois minutos de cada rudimento por dia valem mais do que vinte minutos de um só.')}` });

B.rud2 = () => { const pdd = stick('RLRRLLRLRRLLRLRRLL'.slice(0, 16)); const lider = (() => { const evs = []; [['tt', 'R'], ['sn', 'L'], ['tt', 'R'], ['sn', 'L'], ['mt', 'R'], ['sn', 'L'], ['mt', 'R'], ['sn', 'L'], ['ft', 'R'], ['sn', 'L'], ['ft', 'R'], ['sn', 'L'], ['ft', 'R'], ['sn', 'L'], ['ft', 'R'], ['sn', 'L']].forEach(([p, m], i) => evs.push(ev(p, i, 1, { mao: m === 'R' ? 'D' : 'E' }))); return svgBateria(evs, 640); })();
  const dob = (() => { const evs = []; [['mt', 'R'], ['mt', 'R'], ['sn', 'L'], ['sn', 'L'], ['ft', 'R'], ['ft', 'R'], ['sn', 'L'], ['sn', 'L'], ['tt', 'R'], ['tt', 'R'], ['sn', 'L'], ['sn', 'L'], ['mt', 'R'], ['mt', 'R'], ['sn', 'L'], ['sn', 'L']].forEach(([p, m], i) => evs.push(ev(p, i * 2, 2, { mao: m === 'R' ? 'D' : 'E' }))); return svgBateria(evs, 640); })();
  return pg({ tag: T('rud2', 'TÉCNICA'), titulo: 'Rudimentos nos tambores', sub: 'Os mesmos padrões, agora passeando pela bateria sem cruzar os braços.', corpo: `
<p>Depois que um rudimento sai bem na caixa, leve-o para os tambores com a <b>mão líder</b>: a <b>direita passeia</b> pelo tom 1, tom 2 e surdo, e a <b>esquerda fica sempre na caixa</b>. É o jeito de orquestrar um padrão sem forçar o corpo. A ideia vem dos métodos clássicos de mão, como o <i>Stick Control</i>, de George Lawrence Stone, aplicados à bateria.</p>
${L.card('Paradiddle-diddle', 'D E D D E E · seis batidas, usado em viradas fluidas', pdd, 'Toque devagar, na caixa. Ele é a base de muitas viradas modernas.')}
${L.card('Mão líder: direita nos tambores', 'D no tom 1, tom 2 e surdo, E sempre na caixa', lider, 'Alternado simples: a direita desce pelos tambores e a esquerda volta à caixa a cada batida. Dezesseis semicolcheias, a 55 bpm.')}
${L.card('Dobrado: direita nos tambores, esquerda na caixa', 'D D nos tambores · E E na caixa', dob, 'Duas batidas da direita num tambor, duas da esquerda na caixa. Troque o tambor a cada par.')}
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
${[['Andamento', 'A velocidade da música, medida em bpm.'], ['bpm', 'Batidas por minuto. 60 bpm = uma batida por segundo.'], ['Compasso', 'Um “bloco” de tempos. Em 4/4, cada compasso tem quatro tempos.'], ['Pulso', 'A batida constante, como o coração da música.'], ['Groove', 'A levada: o padrão de bateria que se repete e dá a base da música.'], ['Virada (fill)', 'Um trecho curto que preenche o fim de uma frase e leva à próxima.'], ['Ostinato', 'Uma parte que se repete sem parar, enquanto o resto muda.'], ['Rudimento', 'Um padrão de mãos que treina técnica, como as escalas do pianista.'], ['Acento', 'Uma nota tocada mais forte do que as outras.'], ['Nota fantasma', 'Uma nota tocada muito baixinho, só para dar balanço.'], ['Fulcro', 'O ponto entre o polegar e o indicador em que a baqueta gira, a ≈ 1/3 do comprimento.'], ['Rebote', 'A volta da baqueta depois do golpe. Com a mão solta, ela quica sozinha.'], ['Síncope', 'Uma nota que começa no “&” e atravessa o tempo seguinte.'], ['Tercina', 'Três notas no lugar de duas: cada nota vale ⅓ de tempo.'], ['Mão líder', 'A mão que passeia pelos tambores (a direita, para destros) enquanto a outra fica na caixa, sem cruzar os braços.'], ['Síncope', 'Um acento fora do tempo forte, que cria balanço.'], ['Rim shot / cross-stick', 'Tocar a madeira do aro da caixa. Som seco, usado em baladas.'], ['Pad de estudo', 'Uma superfície de borracha para treinar sem barulho.'], ['Clique', 'O som do metrônomo.'], ['Prato de ataque (crash)', 'O prato que “explode”: marca o início de uma parte.'], ['Condução (ride)', 'O prato usado como pulso, no lugar do chimbal.']].map(([t, x]) => `<tr><td><b>${t}</b></td><td>${x}</td></tr>`).join('')}</table>` });

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


/* ---------- conteúdo novo (explicação + exercícios de juntar) ---------- */
const col = (txt, passo = 2, p = 'sn', vezes = 1) => stick(txt.replace(/\s+/g, '').replace(/D/g, 'R').replace(/E/g, 'L').repeat(vezes), passo, p);
B.contar = () => { const r1 = nota({ sn: 'x...x.x.x...x...' }, { passo: 2 }); const r2 = nota({ sn: 'x.x...x.x.x.....' }, { passo: 2 }); const r3 = nota({ sn: 'x..xx..xx..xx..x' }, { passo: 1 }); return pg({ tag: T('contar', 'PULSO'), titulo: 'Contar é o que segura o groove', sub: 'Quem conta em voz alta toca no tempo. Quem “sente” sem contar, desacelera sem perceber.', corpo: `
<p>Contar não é coisa de iniciante: <b>todo baterista profissional conta</b>, por dentro ou em voz alta. A contagem dá o endereço de cada batida. Sem endereço, a mão chuta.</p>
<h2 class="s">Os três níveis da contagem</h2>
<table class="t"><tr><th>Nível</th><th>Como contar</th><th>Quando usar</th></tr><tr><td>1 · Tempos</td><td>1 – 2 – 3 – 4</td><td>pulso, grooves lentos, pausas longas</td></tr><tr><td>2 · Colcheias</td><td>1 & 2 & 3 & 4 &</td><td>grooves de rock e pop, quase tudo</td></tr><tr><td>3 · Semicolcheias</td><td>1 e & a 2 e & a…</td><td>funk, viradas rápidas, leitura difícil</td></tr></table>
<h2 class="s">Treino: fale tudo, toque só o que está escrito</h2>
<p>Em cada compasso abaixo, <b>conte todas as batidas em voz alta</b> e toque na caixa <b>só onde há nota</b>. Onde há silêncio, a boca continua contando.</p>
${L.card('Compasso A', 'conte “1 & 2 & 3 & 4 &”', r1.svg)}${L.card('Compasso B', 'o silêncio também tem número', r2.svg)}${L.card('Compasso C', 'semicolcheias: “1 e & a 2 e & a…”', r3.svg)}
<h2 class="s">Quatro jeitos de treinar a contagem</h2>
<ul class="lista"><li><b>Pé no chão.</b> Bata o pé em todo tempo (1, 2, 3, 4) enquanto toca. O pé é o relógio.</li><li><b>Cante a conta.</b> Se a boca para, a mão perde o endereço. Comece em voz alta e vá diminuindo.</li><li><b>Grave e escute.</b> Grave um minuto de você tocando com o metrônomo e confira onde o tempo escapa.</li><li><b>Toque sem olhar.</b> Depois que a contagem fica clara, feche os olhos por 8 compassos.</li></ul>
${L.dica('Regra de ouro', 'se você não consegue contar uma frase em voz alta, ainda não está pronto pra tocar ela rápido. volte duas casas no metrônomo.')}${L.caderno()}` }); };

B.bumbo2 = () => { const a = nota({ hh: HH8, sn: SN, bd: 'x.x.....x.x.....' }); const b = nota({ hh: HH8, sn: SN, bd: 'x.....x.x.x.....' }); const c = nota({ hh: HH8, sn: SN, bd: 'x.x...x.x.x...x.' }); return pg({ tag: T('bumbo2', 'GROOVE'), titulo: 'Rock com dois bumbos', sub: 'Dois bumbos seguidos mudam o peso do groove. E o lugar onde você coloca o segundo muda o gênero.', corpo: `
<p>Quando o bumbo toca <b>duas vezes seguidas</b>, o groove ganha empurrão. Mas a graça está em <b>onde</b> cai o segundo bumbo: se você mexe nele, o mesmo desenho de mãos soa como outro ritmo.</p>
${L.card('A · dois bumbos no começo', 'bumbo no 1, no “&” do 1, no 3 e no “&” do 3', a.svg, 'O rock “pesado”. A mão direita segue direto no chimbal.')}
${L.card('B · o segundo bumbo desloca', 'bumbo no 1, no “&” do 2, no 3 e no “&” do 3', b.svg, 'O primeiro bumbo ficou parado e o segundo foi para o meio do compasso. O groove passa a “andar” em vez de empurrar.')}
${L.card('C · bumbo nas pontas', 'bumbo no 1, “&” do 1, “&” do 2, 3 e “&” do 4', c.svg, 'Bumbo ocupando quase todo o compasso. Exige o pé relaxado e o chimbal firme.')}
<h2 class="s">Como estudar</h2><ol class="passos"><li>Treine só o pé, contando em voz alta, a 60 bpm.</li><li>Junte o chimbal, sem a caixa.</li><li>Acrescente a caixa e suba 5 bpm a cada acerto triplo.</li><li>Troque o groove A pelo B sem parar: é o jeito de sentir a “virada de gênero”.</li></ol>
<div class="cit-p">Mudar uma única nota do bumbo pode mudar o gênero inteiro da música.</div>
${L.dica('Ouça', 'ponha no celular uma música de forró e uma de rock e escute o bumbo de cada uma. o desenho das mãos é parecido; o do pé é que muda tudo.')}` }); };

B.variar = () => { const par = (toms) => { const evs = []; toms.forEach((tm, i) => { evs.push(ev(tm, i * 2, 1, { mao: 'D' }), ev('sn', i * 2 + 1, 1, { mao: 'E' })); }); return svgBateria(evs, 640).replace(/<text[^>]*fill="#6b6558">B<\/text>/g, ''); };
  const quadrado = (() => { const evs = []; ['sn', 'tt', 'mt', 'ft'].forEach((p, k) => { for (let i = 0; i < 4; i++) evs.push(ev(p, k * 4 + i, 1)); }); return svgBateria(evs, 640).replace(/<text[^>]*fill="#6b6558">B<\/text>/g, ''); })();
  return pg({ tag: T('variar', 'TÉCNICA'), titulo: 'Não fique sempre na mesma variação', sub: 'O erro de quem aprende a virada é decorar “4 na caixa, 4 no tom 1, 4 no tom 2, 4 no surdo”.', corpo: `
<p>Contar de quatro em quatro é <b>o caminho mais fácil</b>, e por isso todo mundo soa igual. A virada fica interessante quando a quantidade de notas e o tambor <b>variam no meio</b>.</p>
${L.card('Evite sempre isso · o “quadrado”', 'caixa ×4 · tom 1 ×4 · tom 2 ×4 · surdo ×4', quadrado, 'Funciona, mas é previsível, e as mãos se enrolam: você acaba cruzando os braços. Use só como aquecimento.')}
<div class="dica" style="margin-top:2mm"><b>Como orquestrar sem se enrolar</b><span>Use a <b>mão líder</b>: a direita toca todos os tambores (tom 1, tom 2 e surdo) e a esquerda fica na caixa. A mão que lidera é sempre a que vai para os tambores. Isso vem dos métodos clássicos de mão e é o que os bateristas usam para fazer viradas fluidas.</span></div>
<h2 class="s">Três variações que quebram o quadrado</h2>
${L.card('Variação 1', 'a direita: tom 1 ×2 · tom 2 ×1 · surdo ×3 · tom 2 ×1 · tom 1 ×1', par(['tt', 'tt', 'mt', 'ft', 'ft', 'ft', 'mt', 'tt']), 'Cada batida da direita é um tambor; a esquerda marca a caixa entre elas. O surdo aparece três vezes seguidas, no meio.')}
${L.card('Variação 2', 'a direita: tom 2 ×3 · tom 1 ×1 · surdo ×2 · tom 1 ×1 · surdo ×1', par(['mt', 'mt', 'mt', 'tt', 'ft', 'ft', 'tt', 'ft']), 'Começa em um tambor diferente. O tom 2 abre a frase e o surdo fecha.')}
${L.card('Variação 3', 'a direita: surdo ×2 · tom 1 ×3 · tom 2 ×1 · surdo ×2', par(['ft', 'ft', 'tt', 'tt', 'tt', 'mt', 'ft', 'ft']), 'Começa e termina no surdo: a frase “sobe e volta”.')}
<h2 class="s">Receita para criar as suas</h2>
<ol class="passos"><li><b>Mude a quantidade</b> de notas em cada tambor: 3, 2, 1, 2…</li><li><b>Mude o tambor de saída</b>: comece pelo surdo, pelo tom 2 ou pelo tom 1.</li><li><b>Pule tambores</b>: vá do tom 1 direto ao surdo.</li><li><b>Deixe um silêncio</b> no meio da frase: ela respira.</li><li><b>Conte em 16 notas</b> sempre, pra não perder o tempo 1 do próximo compasso.</li></ol>
${L.dica('Exercício', 'escreva 3 viradas suas, trocando só a quantidade de notas em cada tambor da direita. toque cada uma 4 vezes seguidas e depois emende todas.')}` }); };

B.mao = () => { const e = (txt, vezes = 2) => col(txt, 2, 'sn', vezes); return pg({ tag: T('mao', 'TÉCNICA'), titulo: 'A mão alternada: D E e suas variações', sub: 'Com as mesmas duas mãos, trocar só o agrupamento já cria dezenas de exercícios.', corpo: `
<p>O <b>D E D E</b> (alternado simples) é o ponto de partida. A partir dele, você pode <b>mudar o agrupamento</b> das mãos sem mudar o andamento. Pense nos agrupamentos como blocos de montar:</p>
<table class="t"><tr><th>Bloco</th><th>Sticking</th><th>Nome</th></tr><tr><td>A</td><td><b>D E D E</b></td><td>alternado simples</td></tr><tr><td>B</td><td><b>D D E E</b></td><td>dobrado</td></tr><tr><td>C</td><td><b>E D E D</b></td><td>alternado, começando pela esquerda</td></tr></table>
${L.card('1 · A + A', 'D E D E · D E D E', e('DEDEDEDE'), 'O alternado simples: a base de tudo.')}
${L.card('2 · B + B', 'D D E E · D D E E', e('DDEEDDEE'), 'O dobrado: a segunda batida é o rebote.')}
${L.card('3 · A + B', 'D E D E · D D E E', e('DEDEDDEE'), 'Um compasso de simples seguido de um de dobrado, sem parar.')}
${L.card('4 · B + A', 'D D E E · D E D E', e('DDEEDEDE'), 'Mesma mistura, ordem invertida.')}
${L.card('5 · C + A', 'E D E D · D E D E', e('EDEDDEDE'), 'Comece com a esquerda: treina a mão mais fraca.')}
<h2 class="s">Como juntar sem se perder</h2>
<ol class="passos"><li>Toque cada bloco quatro vezes, sozinho, a 60 bpm.</li><li>Junte dois blocos diferentes (A + B) e repita quatro vezes.</li><li>Troque a ordem (B + A). O cérebro estranha, e isso é bom.</li><li>Misture três blocos: A + B + C, sem pausa.</li><li>Leve para os tambores com a mão líder: a direita passeia pelos tons e a esquerda fica na caixa.</li></ol>
${L.dica('Regra', 'mude uma coisa por vez: ou o agrupamento, ou o andamento, ou o tambor. se mudar tudo junto, o exercício vira bagunça.')}` }); };

B.paradiddles = () => { return pg({ tag: T('paradiddles', 'TÉCNICA'), titulo: 'Paradiddle: simples, duplo e triplo', sub: 'Um padrão que cresce: cada tipo acrescenta um par de batidas alternadas antes da dobrada.', corpo: `
<p>O nome imita o som: <b>pa-ra-did-dle</b>. O segredo é a <b>mão que inverte</b> no final: depois de uma dobrada, a mão que começa troca de lado.</p>
<table class="t"><tr><th>Tipo</th><th>Sticking</th><th>Batidas</th></tr><tr><td>Simples</td><td><b>D E D D · E D E E</b></td><td>8</td></tr><tr><td>Duplo</td><td><b>D E D E D D · E D E D E E</b></td><td>12</td></tr><tr><td>Triplo</td><td><b>D E D E D E D D · E D E D E D E E</b></td><td>16</td></tr></table>
${L.card('Paradiddle simples', 'D E D D E D E E · 2 compassos de colcheias', col('DEDDEDEE', 2, 'sn', 2), 'Quatro batidas por mão, em dois tempos.')}
${L.card('Paradiddle duplo', 'D E D E D D E D E D E E · 3 compassos de colcheias', col('DEDEDDEDEDEE', 2, 'sn', 2), 'Doze batidas: conte em grupos de 6 (“1 2 3 4 5 6”).')}
${L.card('Paradiddle triplo', 'D E D E D E D D E D E D E D E E · 2 compassos de colcheias', col('DEDEDEDDEDEDEDEE', 2, 'sn', 1), 'Dezesseis batidas: cabe exatamente em dois compassos de colcheias.')}
<h2 class="s">Como estudar</h2><ol class="passos"><li>Fale o sticking em voz alta antes de tocar: “D E D D, E D E E”.</li><li>Toque o simples até ele sair limpo 4 vezes seguidas.</li><li>Passe ao duplo, e só então ao triplo.</li><li>Leve para os tambores: o simples na caixa e a “dobrada” indo para o tom.</li></ol>
${L.dica('Aviso', 'não acelere antes de o triplo sair limpo. o paradiddle é um exercício de controle, não de velocidade.')}` }); };

B.pad = () => { const so = (m, vezes = 2) => col(m.repeat(8), 2, 'sn', 1); return pg({ tag: T('pad', 'TÉCNICA'), titulo: 'Treinando no pad: uma mão de cada vez', sub: 'Treinar cada mão sozinha deixa a mão fraca igual à forte.', corpo: `
<p>No pad (ou no travesseiro), você <b>escuta cada batida</b> e não tem desculpas: o toque ou sai limpo ou não sai. É o jeito mais rápido de igualar as duas mãos.</p>
${L.card('Só mão direita', 'D D D D D D D D · 60 bpm', so('D'), 'Oito batidas iguais, uma depois da outra. O som tem que ser idêntico.')}
${L.card('Só mão esquerda', 'E E E E E E E E · 60 bpm', so('E'), 'A mão que “não manda” precisa de tempo: faça o mesmo número de repetições.')}
${L.card('Juntando as duas', 'D E D E D E D E', so('DE', 4).replace(/$/, ''), 'Só depois das duas mãos limpas é que o alternado faz sentido.')}
<h2 class="s">Escada de treino (15 minutos)</h2>
<table class="t"><tr><th>Tempo</th><th>O que fazer</th></tr><tr><td>3 min</td><td>Mão fraca sozinha, devagar, 60 bpm.</td></tr><tr><td>3 min</td><td>Mão forte sozinha, no mesmo andamento.</td></tr><tr><td>4 min</td><td>Alternado simples, escutando se as duas soam iguais.</td></tr><tr><td>3 min</td><td>Um rudimento da semana (paradiddle, dobrado…).</td></tr><tr><td>2 min</td><td>Dinâmica: baixinho, médio e forte.</td></tr></table>
<h2 class="s">Dicas que fazem diferença</h2>
<ul class="lista"><li><b>Mão fraca primeiro.</b> Comece sempre por ela, quando você está mais descansado.</li><li><b>Altura da baqueta.</b> Baqueta baixa, som fraco; alta, som forte. Treine as três alturas.</li><li><b>Sem tensão.</b> Se o ombro sobe, pare: você está forçando.</li><li><b>Sessões curtas.</b> Quinze minutos bem feitos valem mais do que uma hora cansada.</li></ul>` }); };

B.linear = () => { const lin = (arr, larg = 640) => { const evs = arr.map(([p, i]) => ev(p, i, 1)); return L.comContagem(sem(evs, larg), evs); };
  const l1 = (() => { const evs = [['bd', 0], ['hh', 2], ['sn', 4], ['hh', 6], ['bd', 8], ['hh', 10], ['sn', 12], ['hh', 14]].map(([p, i]) => ev(p, i, 2)); return L.comContagem(sem(evs), evs); })();
  const l2 = lin([['bd', 0], ['hh', 1], ['hh', 2], ['sn', 3], ['hh', 4], ['bd', 5], ['hh', 6], ['sn', 7], ['bd', 8], ['hh', 9], ['hh', 10], ['sn', 11], ['hh', 12], ['bd', 13], ['sn', 14], ['hh', 15]]);
  const l3 = lin([['bd', 0], ['hh', 2], ['sn', 3], ['tt', 4], ['bd', 6], ['sn', 7], ['hh', 8], ['bd', 10], ['sn', 11], ['mt', 12], ['ft', 13], ['bd', 14], ['sn', 15]]);
  return pg({ tag: T('linear', 'EXPRESSÃO'), titulo: 'Ritmos lineares', sub: 'Um som de cada vez: nenhuma parte da bateria toca junto com outra.', corpo: `
<p>No groove comum, o chimbal e o bumbo caem <b>juntos</b>. No ritmo <b>linear</b>, isso nunca acontece: cada batida tem o seu lugar. O resultado é um groove limpo, ótimo para <b>funk, fusion e viradas</b>.</p>
<p>Repare nas notas abaixo: <b>nunca há duas notas na mesma coluna</b>.</p>
${L.card('Linear 1 · colcheias', 'bumbo, chimbal, caixa, chimbal…', l1, 'O mais simples: quatro “frases” de bumbo, chimbal, caixa e chimbal.')}
${L.card('Linear 2 · semicolcheias', 'bumbo, chimbal, chimbal, caixa…', l2, 'O mesmo ritmo, agora com semicolcheias. Conte “1 e & a 2 e & a”.')}
${L.card('Linear 3 · com tons', 'o groove sobe para os tambores', l3, 'O fim do compasso leva o groove ao tom 2 e ao surdo. É assim que o linear vira virada.')}
<h2 class="s">Como estudar</h2><ol class="passos"><li>Leia como uma frase: “bumbo, chimbal, caixa, chimbal”.</li><li>Toque devagar, a 55 bpm, contando alto.</li><li>Procure a “mão que descansa”: no linear, uma mão espera enquanto a outra toca.</li><li>Troque uma nota por vez: um chimbal por um tom, um bumbo por silêncio.</li></ol>
${L.dica('Ideia', 'pegue um groove que você já sabe e “abra” as notas que caem juntas: toque o chimbal logo antes do bumbo. você acabou de criar um linear.')}` }); };


/* ---------- conteúdo vindo do caderno "Robôterista Explica · Next Level" (reescrito no padrão deste livro) ---------- */
const bdPad = (passos, hh = HH8, sn = SN) => { const evs = groove({ hh, sn }); passos.forEach((p) => evs.push(ev('bd', p, p % 2 ? 1 : 2))); return evs; };
const cardBd = (n, txt, passos, extra = '') => L.card(`${n} · bumbo`, txt, (() => { const e = bdPad(passos); return L.comContagem(sem(e), e); })(), extra);

B.empunhadura = () => pg({ tag: T('empunhadura', 'BÁSICO'), titulo: 'Empunhadura: o fulcro', sub: 'Como segurar a baqueta sem apertar. É o que decide se a mão corre ou trava.', corpo: `
<p>A empunhadura mais usada hoje é a <b>simétrica</b> (<i>matched grip</i>): as duas mãos seguram do mesmo jeito. O segredo é o <b>fulcro</b>: o ponto em que a baqueta “gira”, como numa gangorra.</p>
<h2 class="s">O fulcro</h2>
<ul class="passos"><li>Ache o <b>ponto de equilíbrio</b>: mais ou menos <b>1/3 do comprimento</b>, contando a partir da parte grossa (o “pé” da baqueta).</li><li>Segure ali entre o <b>polegar e a lateral do indicador</b>.</li><li>Os outros dedos (médio, anelar e mínimo) <b>envolvem a baqueta sem apertar</b>.</li><li>As pontas das duas baquetas formam um <b>“V” de 60° a 90°</b> sobre a caixa.</li><li>A baqueta <b>volta sozinha</b> depois de bater (rebote): você só guia.</li></ul>
<h2 class="s">Quem trabalha em cada situação</h2>
<table class="t"><tr><th>Quando</th><th>Quem trabalha</th></tr><tr><td>notas rápidas e baixas</td><td>os dedos (controle fino)</td></tr><tr><td>notas médias, groove normal</td><td>o pulso (movimento principal)</td></tr><tr><td>notas fortes e grandes</td><td>pulso e antebraço, sem esticar o ombro</td></tr></table>
<h2 class="s">Erros comuns</h2>
<table class="t"><tr><th>Erro</th><th>Sintoma</th><th>Correção</th></tr><tr><td>apertar demais</td><td>baqueta “morta”, dor no antebraço</td><td>afrouxe os dedos e deixe quicar</td></tr><tr><td>fulcro solto</td><td>a baqueta escorrega</td><td>feche o polegar no indicador</td></tr><tr><td>polegar esticado</td><td>perde o controle das notas rápidas</td><td>dobre o polegar e apoie no indicador</td></tr><tr><td>punhos duros</td><td>cansaço rápido</td><td>relaxe: o punho é uma dobradiça</td></tr><tr><td>baquetas muito juntas</td><td>uma bate na outra</td><td>abra o “V” entre as pontas</td></tr></table>
<h2 class="s">Ângulo na pele</h2>
<p>A baqueta bate <b>quase paralela à pele</b> (uns 10° a 20°). Bata no <b>centro</b> da caixa para o som cheio e <b>perto da borda</b> para um som mais fino.</p>
${L.dica('Teste do rebote', 'solte a baqueta de uns 5 cm sobre o pad: ela deve quicar 3 vezes ou mais. se morrer logo, você está apertando. faça com as duas mãos e compare.')}${L.caderno()}` });

B.rebote = () => pg({ tag: T('rebote', 'BÁSICO'), titulo: 'Rebote: deixar a baqueta voltar', sub: 'Quem aprende a usar o rebote toca mais rápido, com menos esforço e com menos dor.', corpo: `
<p>O <b>rebote</b> é a volta da baqueta depois do golpe. Cada rebote é menor e mais rápido que o anterior, até a baqueta parar. <b>Mão solta, muitos rebotes. Mão apertada, o rebote morre na hora.</b></p>
<h2 class="s">O segredo é soltar</h2>
<ul class="lista"><li>Depois de bater, <b>não pare a baqueta</b>: deixe ela voltar.</li><li>O fulcro é <b>firme mas leve</b>. Se você aperta, mata o rebote.</li><li>A mão só guia: <b>levanta a baqueta até a altura certa e solta</b>.</li><li>Quanto mais <b>baixo</b> o golpe, mais <b>rápido</b> o rebote.</li></ul>
<h2 class="s">O papel do rebote em cada rudimento</h2>
<table class="t"><tr><th>Rudimento</th><th>Papel do rebote</th></tr><tr><td>dobrada (D D)</td><td>a 2ª nota é só o rebote, controlado pelos dedos</td></tr><tr><td>rolo fechado</td><td>rebotes encadeados, quase sem esforço</td></tr><tr><td>paradiddle</td><td>as dobradas usam o rebote; as alternadas usam o pulso</td></tr><tr><td>flam</td><td>a notinha vem de uma altura baixa, quase só rebote</td></tr></table>
<h2 class="s">Teste: quantos toques?</h2>
<table class="t"><tr><th>Teste</th><th>Mão direita</th><th>Mão esquerda</th></tr><tr><td>solte de ≈ 5 cm, sem apertar</td><td>____ toques</td><td>____ toques</td></tr><tr><td>segure apertando bem e solte</td><td>____ toques</td><td>____ toques</td></tr><tr><td>segure leve no fulcro e solte</td><td>____ toques</td><td>____ toques</td></tr></table>
${L.dica('Leitura do teste', 'se a mão esquerda dá menos toques que a direita, ela está mais apertada. é a mão que precisa de mais treino no pad.')}` });

B.duasvozes = () => { const ex = nota({ hh: HH8, sn: SN, bd: BD }); return pg({ tag: T('duasvozes', 'BÁSICO'), titulo: 'Duas vozes: mãos e pés', sub: 'A partitura de bateria tem duas vozes. O cérebro aprende a ler as duas ao mesmo tempo.', corpo: `
<ul class="lista"><li><b>Mãos:</b> as notas com a haste para <b>cima</b> (chimbal, caixa, toms e pratos).</li><li><b>Pés:</b> as notas com a haste para <b>baixo</b> (bumbo e chimbal de pé).</li></ul>
${L.card('Rock básico: as duas vozes', 'em cima, as mãos (chimbal e caixa) · embaixo, o pé (bumbo)', ex.svg, 'Leia a voz de cima e a de baixo ao mesmo tempo, sempre de cima para baixo na mesma coluna.')}
<h2 class="s">Notas na mesma coluna tocam juntas</h2>
<p>No tempo 1, o chimbal (haste para cima) e o bumbo (haste para baixo) estão <b>na mesma coluna</b>: tocam <b>ao mesmo tempo</b>. No tempo 2, são o chimbal e a caixa.</p>
<h2 class="s">Pausas</h2>
<p>Quando uma voz <b>não toca</b> num tempo, existe uma pausa. Em muitas partituras os pés têm as pausas escritas; <b>aqui, para limpar a leitura, não escrevemos as pausas dos pés</b>: um tempo sem nota de bumbo é um tempo de silêncio do pé.</p>
<div class="cit-p">Uma nota sozinha no tempo vale uma semínima: escrevemos assim para não confundir.</div>
${L.dica('Dica de estudo', 'bata o pé no chão em todo tempo e leia só a voz de baixo. depois leia só a de cima. por fim, as duas juntas.')}${L.caderno()}` }); };

B.ponto = () => pg({ tag: T('ponto', 'PULSO'), titulo: 'Ponto de aumento e ligadura', sub: 'Duas ferramentas para escrever durações que não cabem numa figura só.', corpo: `
<p>O <b>ponto</b> depois da nota aumenta a duração em <b>metade do valor</b>. A <b>ligadura</b> junta duas notas iguais numa só, <b>somando as durações</b>.</p>
<table class="t"><tr><th>Figura</th><th>Vale</th><th>Com ponto</th><th>Soma</th></tr><tr><td>semínima</td><td>1 tempo</td><td>semínima pontuada</td><td>1 + ½ = 1½</td></tr><tr><td>mínima</td><td>2 tempos</td><td>mínima pontuada</td><td>2 + 1 = 3</td></tr><tr><td>colcheia</td><td>½ tempo</td><td>colcheia pontuada</td><td>½ + ¼ = ¾</td></tr><tr><td>semibreve</td><td>4 tempos</td><td>semibreve pontuada</td><td>4 + 2 = 6</td></tr></table>
<h2 class="s">Exemplos</h2>
<ul class="lista"><li><b>Semínima pontuada + colcheia:</b> 1½ + ½ = <b>2 tempos</b>.</li><li><b>Ligadura:</b> uma semínima ligada à outra soa <b>uma vez</b> e dura <b>2 tempos</b> (só se bate a primeira).</li></ul>
<h2 class="s">Resumo dos valores</h2>
<table class="t"><tr><th>semibreve</th><th>mínima</th><th>semínima</th><th>colcheia</th><th>semicolcheia</th></tr><tr><td>4</td><td>2</td><td>1</td><td>½</td><td>¼</td></tr></table>
<h2 class="s">Exercício: quantos tempos dura cada grupo? (semínima = 1)</h2>
<table class="t"><tr><th style="width:10mm"></th><th>Grupo</th><th style="width:30mm">Tempos</th></tr><tr><td>a</td><td>semínima pontuada + colcheia</td><td></td></tr><tr><td>b</td><td>mínima pontuada</td><td></td></tr><tr><td>c</td><td>colcheia pontuada + semicolcheia</td><td></td></tr><tr><td>d</td><td>semínima ligada a semínima + semínima</td><td></td></tr><tr><td>e</td><td>mínima ligada a semínima</td><td></td></tr></table>
<p class="mut" style="font-size:10.4pt">Respostas: a = 2 · b = 3 · c = 1 · d = 3 · e = 3.</p>
${L.dica('Regra', 'o ponto vale metade da nota que ele acompanha.')}` });

B.sincope = () => { const ct = nota({ hh: '..x...x...x...x.', bd: 'x...x...x...x...' }, { passo: 2 }); return pg({ tag: T('sincope', 'PULSO'), titulo: 'Síncope e contratempo', sub: 'O gingado da música brasileira vem de colocar o acento fora do lugar em que o ouvido espera.', corpo: `
<h2 class="s">Síncope</h2>
<p>Na <b>síncope</b>, o som começa numa parte fraca do tempo (no “&”) e <b>se prolonga sobre o tempo seguinte</b>, deslocando o acento. O ouvido espera o acento no tempo, mas ele chega antes ou depois.</p>
<ul class="lista"><li>Uma nota começa no <b>“&”</b> e dura até o tempo seguinte.</li><li>Ou uma nota fraca é <b>ligada</b> a um tempo forte.</li></ul>
<p><b>Forma mais comum em 4/4:</b> colcheia, semínima, colcheia. A semínima do meio começa no “&” do tempo 1 e vai até o “&” do tempo 2. Essa mesma figura no meio do compasso é a levada do <b>samba</b>.</p>
<h2 class="s">Contratempo</h2>
<p>No <b>contratempo</b>, a nota toca no tempo fraco e o <b>tempo forte fica em silêncio</b>: conte “(1) & (2) & (3) & (4) &” e fale só os “&”. É a base do <b>reggae</b> e do <b>ska</b>.</p>
${L.card('Contratempo no chimbal', 'o pé marca o tempo; o chimbal toca só nos “&”', ct.svg, 'Bata o pé no chão em todo tempo e toque o chimbal só entre as batidas do pé.')}
<h2 class="s">Anacruse: começar antes do tempo 1</h2>
<table class="t"><tr><th>Tipo de início</th><th>Começa em</th><th>Exemplo</th></tr><tr><td>tético</td><td>no 1º tempo (forte)</td><td>“Brilha, brilha, estrelinha”</td></tr><tr><td>anacrúsico</td><td>no tempo fraco, antes do forte</td><td>“Parabéns pra você”</td></tr><tr><td>acéfalo</td><td>depois do 1º tempo (começa com pausa)</td><td>muitas músicas de samba e bossa</td></tr></table>
${L.dica('Exercício', 'encontre no seu repertório uma música anacrúsica e uma tética. cante o começo contando e descubra em que tempo cai a primeira nota.')}` }); };

B.tercinas = () => pg({ tag: T('tercinas', 'PULSO'), titulo: 'Tercinas e o shuffle', sub: 'Dividir o tempo em 3 em vez de 2 ou 4: o balanço do blues, do shuffle e da música ternária.', corpo: `
<p>A <b>tercina</b> coloca <b>3 notas no lugar de 2</b>: três colcheias ocupam o tempo de uma semínima, e cada nota vale <b>⅓ de tempo</b>. É um exemplo de <b>quiáltera</b>: dividir o tempo em um número diferente do normal.</p>
<div class="dica" style="margin-top:2mm"><b>Atenção à contagem</b><span>Para não confundir com as semicolcheias (“1 e & a”), neste livro as tercinas se contam <b>“1 la li, 2 la li…”</b>. Se você ouvir “1 e a”, é a mesma tercina com outra sílaba.</span></div>
<h2 class="s">Como contar</h2>
<table class="t"><tr><th>Divisão</th><th>Notas por tempo</th><th>Contagem</th><th>Cada nota vale</th></tr><tr><td>semínimas</td><td>1</td><td>1 · 2 · 3 · 4</td><td>1 tempo</td></tr><tr><td>colcheias</td><td>2</td><td>1 & 2 & 3 & 4 &</td><td>½ tempo</td></tr><tr><td>tercinas</td><td>3</td><td>1 la li · 2 la li…</td><td>⅓ de tempo</td></tr><tr><td>semicolcheias</td><td>4</td><td>1 e & a · 2 e & a…</td><td>¼ de tempo</td></tr><tr><td>sextinas</td><td>6</td><td>1 la li 2 la li (rápido)</td><td>⅙ de tempo</td></tr></table>
<h2 class="s">O shuffle</h2>
<p>No <b>shuffle</b> e no blues, o chimbal toca a <b>1ª e a 3ª notas</b> de cada tercina e <b>pula a do meio</b>. Conte “1 la li”, e toque em “1” e em “li”. O resultado é aquele balanço “manco” e gostoso.</p>
<ol class="passos"><li>Conte em voz alta “1 la li 2 la li 3 la li 4 la li”, batendo o pé nos números.</li><li>Toque o chimbal em todas as sílabas (12 batidas por compasso).</li><li>Agora tire a sílaba do meio (“la”): é o shuffle.</li><li>Acrescente a caixa nos tempos 2 e 4 e o bumbo nos tempos 1 e 3.</li></ol>
<h2 class="s">Outras quiálteras</h2>
<table class="t"><tr><th>Nome</th><th>Notas</th><th>Ocupa o lugar de</th></tr><tr><td>tercina</td><td>3</td><td>2</td></tr><tr><td>quintina</td><td>5</td><td>4</td></tr><tr><td>sextina</td><td>6</td><td>4</td></tr></table>
<p class="mut" style="font-size:10.4pt">As partituras deste livro escrevem as divisões em 2 e em 4 (colcheias e semicolcheias). As tercinas aparecem aqui como conceito e contagem; para ler e tocar tercinas na partitura, use o Beaterista PRO quando ele ganhar essa escrita.</p>
${L.dica('Dica de estudo', 'tercinas começam na boca: conte “1 la li” em voz alta com o metrônomo a 60 bpm até ficar automático. só depois leve para as mãos.')}${L.caderno()}` });

B.compasso = () => pg({ tag: T('compasso', 'PULSO'), titulo: 'Compasso: simples e composto', sub: 'A fórmula de compasso diz como é cada “caixinha” de tempos.', corpo: `
<p>O compasso agrupa os pulsos em “caixinhas” separadas por barras. A <b>fórmula</b> tem dois números: o de cima diz <b>quantos tempos</b> cabem no compasso; o de baixo diz <b>qual figura vale 1 tempo</b> (2 = mínima, 4 = semínima, 8 = colcheia).</p>
<h2 class="s">Compassos simples (cada tempo se divide em 2)</h2>
<table class="t"><tr><th>Fórmula</th><th>Nome</th><th>Sensação</th><th>Onde aparece</th></tr><tr><td>2/4</td><td>binário</td><td>forte, fraco</td><td>marcha, samba</td></tr><tr><td>3/4</td><td>ternário</td><td>forte, fraco, fraco</td><td>valsa</td></tr><tr><td>4/4</td><td>quaternário</td><td>forte, fraco, meio-forte, fraco</td><td>rock, pop, funk</td></tr></table>
<h2 class="s">Compassos compostos (cada tempo se divide em 3)</h2>
<p>No compasso composto, cada tempo vale uma figura <b>pontuada</b>. O 6/8 parece <b>2 tempos “balançados”</b>: “1 la li 2 la li”. A unidade de tempo é a semínima pontuada (3 colcheias).</p>
<table class="t"><tr><th>Fórmula</th><th>Tempos</th><th>Contagem</th></tr><tr><td>6/8</td><td>2</td><td>1 la li · 2 la li</td></tr><tr><td>9/8</td><td>3</td><td>1 la li · 2 la li · 3 la li</td></tr><tr><td>12/8</td><td>4</td><td>1 la li · 2 la li · 3 la li · 4 la li</td></tr></table>
<h2 class="s">Simples × composto</h2>
<table class="t"><tr><th></th><th>Simples</th><th>Composto</th></tr><tr><td>cada tempo se divide em</td><td>2 partes</td><td>3 partes</td></tr><tr><td>unidade de tempo</td><td>figura simples (semínima)</td><td>figura pontuada (semínima pontuada)</td></tr><tr><td>exemplos</td><td>2/4 · 3/4 · 4/4</td><td>6/8 · 9/8 · 12/8</td></tr><tr><td>como achar o nº de tempos</td><td>o numerador</td><td>numerador ÷ 3</td></tr></table>
<h2 class="s">Exercício: classifique</h2>
<table class="t"><tr><th>Fórmula</th><th>Simples ou composto?</th><th>Quantos tempos?</th></tr><tr><td>2/4</td><td></td><td></td></tr><tr><td>6/8</td><td></td><td></td></tr><tr><td>3/4</td><td></td><td></td></tr><tr><td>9/8</td><td></td><td></td></tr></table>
<p class="mut" style="font-size:10.4pt">Respostas: 2/4 simples, 2 tempos · 6/8 composto, 2 tempos · 3/4 simples, 3 tempos · 9/8 composto, 3 tempos.</p>` });

B.bumbo8 = () => pg({ tag: T('bumbo8', 'GROOVE'), titulo: 'Bumbo independente: 8 padrões', sub: 'Chimbal e caixa ficam fixos. Só o pé muda de desenho.', corpo: `
<p><b>Independência</b> é o pé fazer um desenho enquanto as mãos fazem outro. Toque o groove de rock (chimbal e caixa) sem mudar nada e <b>troque só o bumbo</b>. Os números embaixo são o endereço de cada batida do pé.</p>
${cardBd('1', 'nos tempos 1 e 3', [0, 8])}${cardBd('2', '1, 3 e “&” do 3', [0, 8, 10])}${cardBd('3', 'nos 4 tempos', [0, 4, 8, 12])}${cardBd('4', '1, “a” do 1, 3 e “a” do 3', [0, 3, 8, 11])}
${cardBd('5', '1, “&” do 2 e 3', [0, 6, 8])}${cardBd('6', '1, “&” do 1, 3 e “&” do 3', [0, 2, 8, 10])}${cardBd('7', '1, 3 e “a” do 4', [0, 8, 15])}${cardBd('8', 'sincopado: 1, “&” do 1, “e” do 2, 3, “&” do 3, “e” do 4', [0, 2, 5, 8, 10, 13])}
<h2 class="s">Exercício: qual é o padrão?</h2>
<table class="t"><tr><th style="width:10mm"></th><th>Passos do bumbo (0 a 15)</th><th>Em palavras</th></tr><tr><td>a</td><td>0, 4, 8, 12</td><td></td></tr><tr><td>b</td><td>0, 8, 10</td><td></td></tr><tr><td>c</td><td>0, 3, 8, 11</td><td></td></tr></table>
<p class="mut" style="font-size:10.4pt">Os passos contam de 0 a 15: o tempo 1 é o passo 0, o tempo 2 é o passo 4, o tempo 3 é o passo 8 e o tempo 4 é o passo 12. Dentro do tempo: “e” = +1, “&” = +2, “a” = +3. Respostas: a = nos 4 tempos · b = 1, 3 e “&” do 3 · c = 1, “a” do 1, 3 e “a” do 3.</p>
${L.dica('Como estudar', 'conte o desenho do pé em voz alta, sozinho. depois junte o chimbal. por último, acrescente a caixa e suba 5 bpm a cada acerto triplo.')}` });

B.moeller = () => { const m = (txt, passo) => stick(txt.replace(/D/g, 'R').replace(/E/g, 'L'), passo, 'sn'); return pg({ tag: T('moeller', 'TÉCNICA'), titulo: 'Técnica Moeller: o chicote', sub: 'Acento forte sem tensão: o braço joga a baqueta como a ponta de um chicote.', corpo: `
<p>A técnica <b>Moeller</b> usa o movimento de chicote do braço para dar <b>acento forte sem esforço</b>. Vem dos tambores militares e foi descrita pelo baterista Sanford Moeller (livro de 1925).</p>
<h2 class="s">O movimento em 4 quadros</h2>
<table class="t"><tr><th>Quadro</th><th>O que acontece</th></tr><tr><td>1 · preparo</td><td>o antebraço sobe primeiro; o pulso e a baqueta vêm atrás</td></tr><tr><td>2 · chicote</td><td>o braço desce, como a ponta de um chicote</td></tr><tr><td>3 · golpe</td><td>a baqueta bate (nota forte)</td></tr><tr><td>4 · rebote</td><td>a baqueta volta sozinha e leva o antebraço de volta para cima</td></tr></table>
<h2 class="s">As três fases</h2>
<table class="t"><tr><th>Fase</th><th>O que acontece</th><th>Som</th></tr><tr><td>1 · golpe (down)</td><td>o braço desce em chicote</td><td>nota forte (acento)</td></tr><tr><td>2 · toque (tap)</td><td>o rebote dá uma nota macia</td><td>nota suave</td></tr><tr><td>3 · subida (up)</td><td>a mão sobe e prepara o próximo acento</td><td>nota suave</td></tr></table>
<p>Padrão clássico: <b>acento – toque – toque</b> (uma forte e duas suaves por mão), alternando D e E. Maiúscula é acento; minúscula é toque suave.</p>
${L.card('Moeller em semicolcheias', 'D d E e D d E e · acento + toque, trocando de mão', m('DdEeDdEeDdEeDdEe', 1), 'Toque a 55 bpm. A maiúscula é o chicote; a minúscula é só o rebote.')}
<h2 class="s">Quando usar</h2>
<table class="t"><tr><th>Situação</th><th>Por quê</th></tr><tr><td>acentos que alternam as mãos</td><td>o chicote dá o acento sem esforço</td></tr><tr><td>semicolcheias e tercinas rápidas</td><td>poupa força e evita tensão no braço</td></tr><tr><td>dinâmica de forte para fraco</td><td>o movimento cresce ou diminui junto</td></tr></table>
${L.dica('Dica de estudo', 'comece em colcheias, bem devagar, e só depois acelere. no pad, a mão tem que parecer “jogar” a baqueta, não empurrar.')}` }); };

B.flam = () => pg({ tag: T('flam', 'TÉCNICA'), titulo: 'Flam, rimshot e cross-stick', sub: 'Três recursos que mudam o som da caixa sem mudar o ritmo.', corpo: `
<h2 class="s">Flam (pivô)</h2>
<p>O <b>flam</b> é uma notinha pequena colada na nota principal: duas baquetas quase juntas, <b>uma baixa e uma alta</b>. Soa como uma nota “gorda”. Na partitura, a notinha pequena vem <b>antes</b> da nota principal.</p>
<ul class="lista"><li><b>Baqueta baixa:</b> toca a notinha, bem suave.</li><li><b>Baqueta alta:</b> toca a principal, mais forte.</li><li>O intervalo é <b>minúsculo</b>: as duas notas quase se juntam.</li><li>A mão da notinha é <b>sempre a contrária</b> da mão da nota principal.</li></ul>
<p>Baquetagem: <b>e D</b> (notinha na esquerda, principal na direita) e <b>d E</b> (o contrário). Minúscula é a notinha suave.</p>
<h2 class="s">Rimshot e cross-stick</h2>
<table class="t"><tr><th>Técnica</th><th>Como</th><th>Som</th><th>Uso</th></tr><tr><td><b>rimshot</b></td><td>a ponta bate na pele e no aro ao mesmo tempo</td><td>forte e brilhante</td><td>backbeat de rock, pop e funk</td></tr><tr><td><b>cross-stick</b></td><td>baqueta deitada na pele; a parte de trás bate no aro</td><td>seco e baixinho</td><td>baladas, bossa e samba-jazz</td></tr></table>
<p>Os dois aparecem como <b>“aro”</b> na partitura, no lugar da bolinha da caixa.</p>
<h2 class="s">Exercício: baquetagem do flam</h2>
<table class="t"><tr><th>Principal na…</th><th>Baquetagem</th></tr><tr><td>direita</td><td></td></tr><tr><td>esquerda</td><td></td></tr></table>
<p class="mut" style="font-size:10.4pt">Respostas: principal na direita = e D · principal na esquerda = d E.</p>
${L.dica('Dica de estudo', 'treine o flam devagar, no pad, ouvindo uma “nota gorda” e não duas separadas. se você ouve duas, aproxime as baquetas.')}` });

B.ritornelo = () => pg({ tag: T('ritornelo', 'MÚSICA'), titulo: 'Sinais de repetição', sub: 'O ritornelo e os atalhos de leitura poupam papel e organizam a música em partes.', corpo: `
<h2 class="s">Barras de repetição</h2>
<p><b>|: … :|</b> manda repetir o trecho entre as barras. A 1ª barra (com os pontos para a direita) abre a repetição; a 2ª (com os pontos para a esquerda) manda voltar.</p>
<p><b>1ª e 2ª casas:</b> na primeira vez, toque a casa 1 e volte; na segunda vez, <b>pule a casa 1</b> e toque a casa 2.</p>
<h2 class="s">Atalhos de leitura</h2>
<table class="t"><tr><th>Sinal</th><th>Nome</th><th>O que fazer</th></tr><tr><td>D.C.</td><td>da capo</td><td>volte ao começo</td></tr><tr><td>D.S.</td><td>dal segno</td><td>volte ao sinal (segno)</td></tr><tr><td>Fine</td><td>fim</td><td>termine aqui (depois do D.C. ou do D.S.)</td></tr><tr><td>Coda</td><td>coda</td><td>pule para a coda (o final) ao chegar no “To Coda”</td></tr><tr><td>x2, x4</td><td>repetições</td><td>toque o trecho o número de vezes indicado</td></tr></table>
<h2 class="s">Uma música em partes</h2>
<table class="t"><tr><th>Parte</th><th>O que acontece</th></tr><tr><td>intro</td><td>prepara: pode ser só a bateria</td></tr><tr><td>verso</td><td>conta a história, groove mais leve</td></tr><tr><td>refrão</td><td>a parte mais forte e cantada</td></tr><tr><td>ponte</td><td>muda o clima e prepara a volta</td></tr><tr><td>final (coda)</td><td>fecha a música</td></tr></table>
<h2 class="s">Exercício: qual é a ordem de execução?</h2>
<p><b>1.</b> |: A B :| → <b>A B A B</b> (exemplo resolvido).</p>
<p><b>2.</b> |: A B C :| 1. D · 2. E → escreva a ordem: ____________________</p>
<p><b>3.</b> |: verso :| refrão, ponte, D.C. al Fine (o Fine está no fim do refrão) → escreva a ordem: ____________________</p>
<p class="mut" style="font-size:10.4pt">Respostas: 2 = A B C D A B C E · 3 = verso, verso, refrão, ponte, verso, refrão (na volta do D.C., o ritornelo não se repete).</p>
${L.dica('Dica de estudo', 'antes de tocar uma música com sinais, escreva a ordem das partes num papel. quem lê o roteiro não se perde no meio.')}` });

B.plano12 = () => pg({ tag: 'PLANO · 12 semanas', titulo: 'Plano de 12 semanas', sub: '20 a 30 minutos por dia: 10 de pad, 10 de grooves e 5 de leitura. Pouco todo dia vale mais que muito de vez em quando.', corpo: `
<table class="t"><tr><th>Sem.</th><th>Técnica e leitura</th><th>Grooves</th><th>Pad</th><th>OK</th></tr>
<tr><td>1</td><td>postura, empunhadura e rebote</td><td>rock básico</td><td>alternado simples, 60 bpm</td><td>☐</td></tr>
<tr><td>2</td><td>leitura da pauta e contagem</td><td>rock com bumbo extra</td><td>paradiddle simples, 60 bpm</td><td>☐</td></tr>
<tr><td>3</td><td>dobrada e paradiddle simples</td><td>bumbo independente (padrões 1 a 4)</td><td>paradiddle simples, 70 bpm</td><td>☐</td></tr>
<tr><td>4</td><td>acentos e notas fantasma</td><td>funk com fantasma</td><td>acentos móveis, 70 bpm</td><td>☐</td></tr>
<tr><td>5</td><td>tercinas e shuffle</td><td>shuffle e rock em tercina</td><td>tercinas alternadas, 60 bpm</td><td>☐</td></tr>
<tr><td>6</td><td>paradiddle duplo</td><td>chimbal em semicolcheias</td><td>duplo, 60 bpm</td><td>☐</td></tr>
<tr><td>7</td><td>paradiddle triplo e paradiddle-diddle</td><td>chimbal aberto e fechado</td><td>triplo, 60 bpm</td><td>☐</td></tr>
<tr><td>8</td><td>flam, rimshot e cross-stick</td><td>abertura de chimbal com o pé</td><td>flam, 60 bpm</td><td>☐</td></tr>
<tr><td>9</td><td>dinâmica: de pp a ff</td><td>cúpula do ride</td><td>crescendo e diminuendo, 70 bpm</td><td>☐</td></tr>
<tr><td>10</td><td>ritmos lineares</td><td>viradas (1 a 3)</td><td>linear, 60 bpm</td><td>☐</td></tr>
<tr><td>11</td><td>sinais de repetição</td><td>viradas (4 a 6)</td><td>padrões lineares, 70 bpm</td><td>☐</td></tr>
<tr><td>12</td><td>revisão e projeto final</td><td>montar uma música completa</td><td>todos os rudimentos, 80 bpm</td><td>☐</td></tr></table>
${L.dica('Como usar', 'marque o quadrado quando conseguir tocar a meta da semana 4 vezes seguidas, sem errar. se a semana não fechou, repita: não existe atraso, existe repetição.')}` });

/* ================= montagem ================= */
const EXTRAS = process.env.EXTRAS && existsSync(process.env.EXTRAS) ? JSON.parse(readFileSync(process.env.EXTRAS, 'utf8')) : {};
const NUMS = process.env.NUMS && existsSync(process.env.NUMS) ? JSON.parse(readFileSync(process.env.NUMS, 'utf8')) : {};
const modulos = MODS.map((m, i) => ({ livro: NOME, nome: m[1] ? `MÓDULO ${String(i + 1).padStart(2, '0')} · ${m[1].toUpperCase()}` : 'PARA LEVAR' }));
const P = []; P.push(L.capa({ tipo: 'bateria', t1: 'bateria', t2: 'para adultos', lema: 'da primeira baqueta ao primeiro groove, em 15 minutos por dia.' }));
const sumPos = P.length; P.push('');
for (const [i, m] of MODS.entries()) {
  MODI = i;
  if (m[1]) P.push(L.divisor({ modulo: i + 1, titulo: m[1], citacao: m[2], itens: m[4].filter((id) => id !== 'respostas').map((id) => [N(id), TITULOS[id]]), nome: NOME }));
  for (const id of m[4]) { if (id === 'folha2') continue; IDATUAL = id; P.push(B[id]()); if (id === 'folha1') { IDATUAL = 'folha2'; P.push(B.folha2()); } }
  if (m[1] && m[1] !== null && EXTRAS[i] !== undefined) P.push(L.revisao({ modulo: i, titulos: m[4].filter((id) => id !== 'respostas').map((id) => TITULOS[id]), linhas: EXTRAS[i] }));
}
P[sumPos] = L.sumario(MODS.map((m) => [m[0], m[4].filter((id) => !['folha2', 'respostas'].includes(id)).map((id) => [['plano4', 'plano8', 'registro', 'glossario', 'proximo', 'folha1'].includes(id) ? '·' : N(id), TITULOS[id], NUMS[id] || ''])]), NOME, 'cada groove desta apostila foi escrito no Beaterista PRO: o mesmo desenho que você vê aqui abre no editor, toca e dá para imprimir.');
writeFileSync('/tmp/apo/bateria.html', L.doc(P, 'Bateria para adultos · Beaterista', 'vinho', modulos));
console.log('seções:', P.length);
console.log('MODS:' + JSON.stringify(MODS.map((m) => ({ primeira: m[4][0], divisor: !!m[1] }))));
console.log(JSON.stringify(MODS.flatMap((m) => m[4])));
