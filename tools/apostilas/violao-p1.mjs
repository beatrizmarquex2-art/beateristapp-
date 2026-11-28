// Módulos 1 e 2: primeiros passos e música essencial.
import * as I from './violao-ilus.mjs';
export function registra(B, c) {
  const { L, V, pg, N, T, ac, acs, part, AC, MEL } = c;

  B.como = () => pg({ tag: T('como', 'COMECE AQUI'), titulo: 'Como usar esta apostila', sub: 'Siga na ordem se estiver começando do zero. Volte quantas vezes quiser.', corpo: `
<ul class="lista"><li><b>Pouco e todo dia.</b> Quinze minutos por dia rendem mais do que duas horas uma vez por semana. O cérebro grava o movimento entre um treino e outro, principalmente durante o sono.</li>
<li><b>Uma página por vez.</b> Não precisa decorar tudo. Aprenda dois acordes, treine a troca entre eles, e só depois passe para o próximo.</li>
<li><b>Use a trilha.</b> Na seção ${N('treino')}, o treino progressivo tem 11 etapas com quadradinhos para marcar. É o caminho mais curto até tocar a primeira música inteira.</li>
<li><b>Consulte e revise.</b> O dicionário de acordes (seção ${N('dicionario')}) e os mapas do braço (seção ${N('braco')}) servem de consulta rápida. Cada módulo termina com revisão e autoavaliação.</li></ul>
<h2 class="s">A sua mão vai se adaptar, e tem um limite</h2>
<p>Nas primeiras semanas, é comum sentir uma <b>sensibilidade leve</b> na ponta dos dedos da mão esquerda: a pele está se adaptando às cordas. Isso pode acontecer, e costuma melhorar com treinos curtos e regulares.</p>
<p><b>Dor intensa, dor que não passa ou dor nas articulações (dedos, punho, cotovelo, ombro) não é normal.</b> Pare o exercício na hora, descanse, solte a mão e revise a postura. Se a dor continuar, procure um profissional de saúde. Tensão excessiva piora o som e machuca: aperte só o necessário.</p>
${L.dica('Dica de estudo', 'afine antes de tocar. um violão desafinado engana o ouvido. use um afinador de celular, todos os dias.')}${L.caderno()}` });

  B.anatomia = () => pg({ tag: T('anatomia', 'COMECE AQUI'), titulo: 'Anatomia do violão', sub: 'Conhecer o nome das partes ajuda a entender os livros, os vídeos e o que o professor fala.', corpo: `
<div class="ilus" style="max-width:86mm;margin:0 auto 3mm">${I.anatomia()}</div>
<table class="t"><tr><th style="width:8mm">Nº</th><th>Parte</th><th>Para que serve</th></tr>${I.ANATOMIA_TABELA.map(([n, nome, f]) => `<tr><td>${n}</td><td><b>${nome}</b></td><td>${f}</td></tr>`).join('')}</table>
<p class="mut" style="font-size:10.4pt">Desenho esquemático em escala: os trastes seguem a regra real de distância (cada casa é menor que a anterior). Na casa 12 você chega à metade do comprimento das cordas.</p>` });

  B.escolha = () => pg({ tag: T('escolha', 'COMECE AQUI'), titulo: 'Escolhendo o primeiro violão', sub: 'O melhor violão para começar é o que fica confortável e afinado, não o mais caro.', corpo: `
<table class="t"><tr><th>Tipo</th><th>Cordas</th><th>Como é</th><th>Para quem</th></tr>
<tr><td>Clássico</td><td>nylon</td><td>braço mais largo, som macio e redondo</td><td>quem começa, crianças, repertório clássico, MPB e bossa; é o mais gentil com os dedos</td></tr>
<tr><td>Folk (acústico)</td><td>aço</td><td>braço mais fino, som brilhante e forte</td><td>pop, rock acústico, sertanejo, voz e violão; pede mais força nos dedos no começo</td></tr>
<tr><td>Eletroacústico</td><td>nylon ou aço</td><td>igual ao acústico, com captação e saída para amplificador</td><td>quem vai tocar em palco, igreja ou gravar direto na interface</td></tr></table>
<p><b>Violão acústico</b> é o nome geral para o violão que soa sem precisar de amplificador. Ele pode ser clássico (nylon) ou folk (aço); o eletroacústico é o acústico com microfone embutido.</p>
${L.dica('Atenção', 'não coloque cordas de aço em um violão feito só para nylon. a tensão é maior e pode entortar o braço, soltar o cavalete ou rachar o tampo. na dúvida, leia a etiqueta interna ou pergunte na loja.')}
<h2 class="s">O que olhar antes de comprar</h2>
<table class="t"><tr><th>Item</th><th>O que verificar</th></tr>
<tr><td>Tamanho</td><td>Escala padrão (adulto) tem cerca de 65 cm de diapasão. Há versões 3/4 e 1/2, melhores para crianças e mãos pequenas.</td></tr>
<tr><td>Altura das cordas</td><td>Cordas muito altas cansam e doem. Perto do traste 12, a distância da corda ao traste deve ser pequena (em geral, 2 a 3 mm). Uma regulagem simples resolve.</td></tr>
<tr><td>Afinação e trastes</td><td>Toque a casa 12 de cada corda: a nota tem que ser a mesma da corda solta, uma oitava acima. Trastes não devem estar pontudos nas laterais.</td></tr>
<tr><td>Conforto</td><td>Sente com o violão antes de comprar. O braço precisa caber na sua mão sem esforço.</td></tr></table>
<h2 class="s">Acessórios essenciais</h2>
<table class="t"><tr><th>Item</th><th>Para quê</th></tr>
<tr><td>Afinador</td><td>De clipe ou aplicativo de celular. Veja como usar na seção ${N('afinacao')}.</td></tr>
<tr><td>Capotraste</td><td>Prende todas as cordas numa casa e muda o tom sem mudar as formas dos acordes (seção ${N('transposicao')}).</td></tr>
<tr><td>Palhetas</td><td>De espessura média (por volta de 0,7 mm) para começar. Úteis no violão de aço.</td></tr>
<tr><td>Correia e banco</td><td>Para tocar em pé e para sentar na altura certa.</td></tr>
<tr><td>Cordas reserva</td><td>Troque quando soarem opacas ou não afinarem mais.</td></tr></table>` });

  B.postura = () => pg({ tag: T('postura', 'COMECE AQUI'), titulo: 'Postura e posição das mãos', sub: 'Tocar confortável é tocar por mais tempo, com som melhor e menos tensão.', corpo: `
<h2 class="s">Sentado: duas posturas</h2>
<table class="t"><tr><th>Postura</th><th>Como é</th><th>Quando usar</th></tr><tr><td>Clássica</td><td>pé esquerdo num apoio, violão sobre a perna esquerda, braço inclinado para cima</td><td>estudo, repertório clássico, quem quer as duas mãos bem livres</td></tr><tr><td>Popular</td><td>sem apoio, violão sobre a perna direita</td><td>rodas, ensaios, acompanhar cantando</td></tr></table>
<ul class="lista"><li><b>Costas retas e apoiadas</b>, ombros soltos, cotovelos perto do corpo.</li><li>Sente na <b>ponta da cadeira</b>, sem encostar a coxa na borda.</li><li>O violão fica <b>firme</b>: se ele se mexe a cada acorde, a mão esquerda trabalha dobrado.</li></ul>
<h2 class="s">Mão esquerda</h2>
<div class="grade-ilus"><div class="ilus">${I.maoEsquerdaCorte()}</div><div class="ilus">${I.dedoNaCasa(true)}${I.dedoNaCasa(false)}</div></div>
<ul class="lista"><li><b>Polegar atrás do braço</b>, mais ou menos atrás do dedo médio. Ele é apoio, não força.</li><li><b>Dedos curvos:</b> aperte com a ponta, quase de cima, sem deitar o dedo e abafar a corda vizinha.</li><li><b>Pertinho do traste</b>, não no meio da casa: faz menos força e o som sai limpo.</li></ul>
<h2 class="s">Mão direita e palheta</h2>

<ul class="lista"><li>O antebraço apoia na borda do corpo. O <b>punho fica solto</b>; o movimento vem do pulso, não do ombro.</li><li>A mão trabalha <b>entre a boca e o cavalete</b>. Mais perto do cavalete o som fica mais brilhante; sobre a boca, mais redondo.</li><li>Palheta entre a <b>ponta do polegar e a lateral do indicador</b>, sem apertar demais.</li></ul>
<h2 class="s">Erros de tensão e postura</h2>
<table class="t"><tr><th>O que acontece</th><th>Por quê</th><th>Como corrigir</th></tr>
<tr><td>Ombro sobe</td><td>braço cansado ou violão baixo</td><td>respire, solte o ombro, ajuste a altura do violão</td></tr>
<tr><td>Polegar por cima do braço</td><td>hábito de apertar com a mão toda</td><td>volte o polegar para trás; aperte com a ponta dos dedos</td></tr>
<tr><td>Punho muito dobrado</td><td>violão baixo ou braço pouco inclinado</td><td>levante um pouco o braço do violão; punho quase reto</td></tr>
<tr><td>Dor nas costas</td><td>costas curvadas</td><td>sente na ponta da cadeira e apoie as costas</td></tr>
<tr><td>Dor forte ou formigamento</td><td>tensão, repetição demais ou lesão</td><td>pare, descanse e procure um profissional se continuar</td></tr></table>
<h2 class="s">Violonistas canhotos</h2>
<p>Quem escreve com a mão esquerda tem duas opções. Pode tocar um <b>violão destro</b> do jeito tradicional (a maior parte do material didático e dos professores usa esta forma), ou usar um <b>violão canhoto</b>, com as cordas na ordem inversa, e <b>espelhar</b> todos os diagramas deste livro: tudo o que a mão esquerda faz passa a ser feito pela direita. Violão destro com as cordas trocadas ao contrário não é recomendado: o cavalete e o rastilho são feitos para a ordem normal e a afinação sofre.</p>` });

  B.afinacao = () => pg({ tag: T('afinacao', 'COMECE AQUI'), titulo: 'Afinação', sub: 'Afinado, tudo soa melhor. Desafinado, o ouvido aprende errado.', corpo: `
<h2 class="s">A afinação padrão</h2>
<table class="t"><tr><th>Corda</th><th>Nota</th><th>Cifra e oitava</th><th>Frequência (A4 = 440 Hz)</th></tr>
<tr><td>6ª (a mais grossa)</td><td>Mi grave</td><td>E2</td><td>82,41 Hz</td></tr><tr><td>5ª</td><td>Lá</td><td>A2</td><td>110,00 Hz</td></tr><tr><td>4ª</td><td>Ré</td><td>D3</td><td>146,83 Hz</td></tr><tr><td>3ª</td><td>Sol</td><td>G3</td><td>196,00 Hz</td></tr><tr><td>2ª</td><td>Si</td><td>B3</td><td>246,94 Hz</td></tr><tr><td>1ª (a mais fina)</td><td>Mi agudo</td><td>E4</td><td>329,63 Hz</td></tr></table>
<p>A referência é o <b>Lá 4 = 440 Hz</b>, a mesma de afinadores e aplicativos. A letra e o número identificam a nota: E2 é o Mi da 6ª corda; E4, o Mi da 1ª, duas oitavas acima.</p>
<h2 class="s">Com afinador cromático</h2>
<ol class="passos"><li>Ligue o afinador e escolha o modo cromático. Se for de clipe, prenda na cabeça do violão.</li><li>Toque <b>uma corda solta por vez</b>, com força média, e deixe soar.</li><li>O afinador mostra o nome da nota mais próxima e se você está <b>abaixo</b> (nota grave demais, ponteiro à esquerda ou seta para o ♭) ou <b>acima</b> (aguda demais, ponteiro à direita ou seta para o ♯).</li><li><b>Abaixo da nota:</b> aperte a tarraxa devagar até o ponteiro chegar ao meio. <b>Acima:</b> afrouxe um pouco e suba de novo, sempre chegando por baixo.</li><li>Depois de afinar as seis, <b>confira de novo a primeira</b>: a tensão do braço muda enquanto você afina.</li></ol>
<h2 class="s">De ouvido, pela 5ª casa</h2>
<table class="t"><tr><th>Aperte</th><th>O som tem que ser igual a</th></tr><tr><td>6ª corda, casa 5</td><td>5ª corda solta (Lá)</td></tr><tr><td>5ª corda, casa 5</td><td>4ª corda solta (Ré)</td></tr><tr><td>4ª corda, casa 5</td><td>3ª corda solta (Sol)</td></tr><tr><td>3ª corda, casa 4</td><td>2ª corda solta (Si)</td></tr><tr><td>2ª corda, casa 5</td><td>1ª corda solta (Mi)</td></tr></table>
<p>Entre a 3ª e a 2ª corda, a casa é a <b>4</b>, não a 5: é o único lugar diferente. Quando dois sons iguais soam juntos, aquele “uóu-uóu” (batimento) some.</p>` });

  B.cordas = () => pg({ tag: T('cordas', 'COMECE AQUI'), titulo: 'O nome das cordas e as cifras', sub: 'A corda mais grossa é a 6ª; a mais fina, a 1ª. Os números contam de baixo para cima.', corpo: `
<p>Da mais grossa para a mais fina: <b>Mi · Lá · Ré · Sol · Si · Mi</b>. Na cifra: <b>E · A · D · G · B · E</b>. Frase para lembrar: <b>“Meu Lindo Rei, Sou Sua Musa.”</b></p>
<h2 class="s">As letras da cifra</h2>
<table class="t"><tr><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>A</th><th>B</th></tr><tr><td>Dó</td><td>Ré</td><td>Mi</td><td>Fá</td><td>Sol</td><td>Lá</td><td>Si</td></tr></table>
<p>A cifra começa no Lá (A) porque segue o alfabeto: A, B, C... Depois da letra, símbolos dizem <b>que tipo de acorde</b> é. Tomando o Dó como exemplo:</p>
<table class="t"><tr><th>Símbolo</th><th>Nome</th><th>O que significa</th><th>Notas do exemplo</th></tr>
<tr><td>C</td><td>Dó maior</td><td>tríade maior: fundamental, terça maior, quinta justa</td><td>Dó · Mi · Sol</td></tr>
<tr><td>Cm</td><td>Dó menor</td><td>troca a terça maior por menor</td><td>Dó · Mi♭ · Sol</td></tr>
<tr><td>C7</td><td>Dó com sétima</td><td>maior, mais a sétima menor (acorde dominante)</td><td>Dó · Mi · Sol · Si♭</td></tr>
<tr><td>C7M, Cmaj7</td><td>Dó com sétima maior</td><td>maior, mais a sétima maior (som suave)</td><td>Dó · Mi · Sol · Si</td></tr>
<tr><td>Cm7</td><td>Dó menor com sétima</td><td>menor, mais a sétima menor</td><td>Dó · Mi♭ · Sol · Si♭</td></tr>
<tr><td>C°</td><td>Dó diminuto</td><td>duas terças menores empilhadas (som tenso)</td><td>Dó · Mi♭ · Sol♭</td></tr>
<tr><td>Caug, C+</td><td>Dó aumentado</td><td>duas terças maiores empilhadas (som suspenso)</td><td>Dó · Mi · Sol♯</td></tr>
<tr><td>Csus4</td><td>Dó com quarta suspensa</td><td>a terça sai e entra a quarta justa</td><td>Dó · Fá · Sol</td></tr></table>
<p>Uma barra seguida de uma letra (<b>C/E</b>) indica o <b>baixo</b>: o acorde de Dó, com a nota Mi tocada embaixo (seção ${N('formacao')}).</p>
${L.dica('Dica', 'no começo, só importam três: a letra sozinha (maior), o “m” (menor) e o “7”. o resto você aprende aos poucos, quando aparecer numa música.')}` });

  B.desenho = () => pg({ tag: T('desenho', 'COMECE AQUI'), titulo: 'Como ler o desenho do acorde', corpo: `
<div class="meio"><div class="ac g">${V.diagrama(AC.C)}<b>C</b><small>Dó maior</small></div><div class="texto">
<p>O desenho é o <b>braço do violão em pé</b>, visto de frente.</p>
<p><b>Linhas em pé</b> são as cordas. A da esquerda é a 6ª (Mi grave); a da direita, a 1ª (Mi agudo). As letras embaixo (E A D G B E) dizem a corda.</p>
<p><b>Linhas deitadas</b> são os trastes. O espaço entre dois trastes é uma <b>casa</b>. A linha grossa no topo é a pestana (o começo do braço).</p>
<p><b>Bolinhas</b> mostram onde apertar. O número dentro é o dedo: <b>1</b> indicador, <b>2</b> médio, <b>3</b> anelar, <b>4</b> mínimo.</p>
<p><b>O</b> em cima: corda solta (toca sem apertar). <b>✕</b> em cima: não toque essa corda.</p></div></div>
<ul class="lista"><li><b>Bolinha dourada = fundamental</b>, a nota que dá nome ao acorde (no C, as bolinhas douradas são as notas Dó). Ela também aparece em cordas soltas, com o círculo dourado.</li>
<li>Quando aparece um número ao lado (<b>3ª</b>), o desenho <b>começa naquela casa</b>, não na primeira.</li>
<li>Uma barra comprida é a <b>pestana</b>: o dedo 1 deita sobre várias cordas (seção ${N('pestana')}).</li></ul>
<div class="grade-3"><div class="card"><h4>Dedos da mão esquerda</h4><p>1 indicador<br>2 médio<br>3 anelar<br>4 mínimo<br><span class="mut">o polegar fica atrás do braço</span></p></div><div class="card"><h4>Dedos da mão direita</h4><p>p polegar<br>i indicador<br>m médio<br>a anelar<br><span class="mut">o mínimo (c) quase não é usado</span></p></div><div class="card"><h4>Tablatura</h4><p>cada linha é uma corda: a de cima é a 1ª (mais fina). O número é a casa; <b>0</b> é corda solta.</p></div></div>
${L.dica('Dica de estudo', 'aperte pertinho do traste, não no meio da casa. faz menos força e o som sai limpo.')}` });

  /* ---------------- módulo 2 ---------------- */
  B.pulso = () => pg({ tag: T('pulso', 'MÚSICA'), titulo: 'Pulso, ritmo, melodia e harmonia', sub: 'Quatro palavras que organizam toda a música. Você já usa as quatro sem perceber.', corpo: `
<table class="t"><tr><th>Palavra</th><th>O que é</th><th>No violão</th></tr>
<tr><td>Pulso</td><td>a batida constante, como o coração da música. Você bate o pé nele.</td><td>a mão direita que não para de se mover</td></tr>
<tr><td>Ritmo</td><td>o desenho das notas curtas e longas em cima do pulso.</td><td>a batida ou o dedilhado</td></tr>
<tr><td>Melodia</td><td>uma nota de cada vez, a parte que você canta.</td><td>as melodias da seção ${N('melodias')}</td></tr>
<tr><td>Harmonia</td><td>várias notas ao mesmo tempo, que sustentam a melodia.</td><td>os acordes</td></tr></table>
<h2 class="s">Tempo e andamento</h2>
<p><b>Tempo</b> é cada batida do pulso. <b>Andamento</b> é a velocidade, medida em <b>bpm</b> (batidas por minuto). 60 bpm é uma batida por segundo. Um aplicativo de metrônomo marca o pulso com um clique.</p>
<table class="t"><tr><th>bpm</th><th>Para quê</th></tr><tr><td>50 a 60</td><td>aprender uma troca ou melodia nova</td></tr><tr><td>70 a 80</td><td>quando a troca já sai sem parar</td></tr><tr><td>90 a 110</td><td>velocidade de muitas músicas pop</td></tr></table>
<h2 class="s">Teste de pulso</h2>
<p>Coloque o metrônomo a 60 bpm e <b>bata palmas em cada clique</b> durante um minuto. Depois bata só nos cliques 1 e 3 e fique em silêncio nos outros, contando mentalmente. Se você errar o clique, o seu pulso ainda está se firmando: é por isso que treinamos com metrônomo.</p>
${L.dica('Dica de estudo', 'bata o pé no chão em todo tempo enquanto toca. o pé é o relógio.')}` });

  B.figuras = () => pg({ tag: T('figuras', 'MÚSICA'), titulo: 'Figuras, pausas e durações', sub: 'Cada figura diz quanto tempo a nota dura. Cada figura tem a sua pausa.', corpo: `
<p>Os valores abaixo consideram a <b>semínima como unidade de tempo</b> (uma semínima = 1 tempo), como em 4/4. Se a unidade mudasse (por exemplo, em 6/8), a proporção continuaria a mesma, mas o que vale “1 tempo” seria outra figura.</p>
<table class="t"><tr><th>Figura</th><th>Duração (em tempos)</th><th>Pausa</th><th>Em semicolcheias</th></tr>
<tr><td>Semibreve</td><td>4</td><td>pausa de semibreve</td><td>16</td></tr><tr><td>Mínima</td><td>2</td><td>pausa de mínima</td><td>8</td></tr><tr><td>Semínima</td><td>1</td><td>pausa de semínima</td><td>4</td></tr><tr><td>Colcheia</td><td>½</td><td>pausa de colcheia</td><td>2</td></tr><tr><td>Semicolcheia</td><td>¼</td><td>pausa de semicolcheia</td><td>1</td></tr></table>
<h2 class="s">Ponto de aumento e ligadura</h2>
<ul class="lista"><li><b>Ponto de aumento:</b> o ponto depois da nota soma <b>metade do valor</b> dela. Mínima pontuada = 2 + 1 = 3 tempos. Semínima pontuada = 1 + ½ = 1½ tempo.</li><li><b>Ligadura de prolongamento:</b> uma curva liga duas notas <b>iguais</b>: você toca só a primeira e segura até o fim da segunda. Soma as durações.</li></ul>
<table class="t"><tr><th>Exemplo</th><th>Duração</th></tr><tr><td>semínima pontuada + colcheia</td><td>1½ + ½ = 2 tempos</td></tr><tr><td>mínima ligada a uma semínima</td><td>2 + 1 = 3 tempos</td></tr><tr><td>colcheia pontuada + semicolcheia</td><td>¾ + ¼ = 1 tempo</td></tr></table>
<h2 class="s">Contagem</h2>
<table class="t"><tr><th>Divisão</th><th>Contagem</th></tr><tr><td>semínimas</td><td>1 · 2 · 3 · 4</td></tr><tr><td>colcheias</td><td>1 e 2 e 3 e 4 e</td></tr><tr><td>semicolcheias</td><td>1 e & a 2 e & a 3 e & a 4 e & a</td></tr></table>
<p>Exercício: quantos tempos dura cada grupo? (a) mínima pontuada = ___ (b) semínima + colcheia + colcheia = ___ (c) semínima ligada a uma mínima = ___ (d) pausa de mínima + semínima = ___. <span class="mut">Respostas: a = 3 · b = 2 · c = 3 · d = 3.</span></p>` });

  B.compassos = () => pg({ tag: T('compassos', 'MÚSICA'), titulo: 'Compasso, contratempo, síncope e tercinas', sub: 'O compasso agrupa os tempos em “caixinhas” separadas por barras.', corpo: `
<p>A <b>fórmula de compasso</b> tem dois números. O de cima diz <b>quantas unidades</b> cabem no compasso; o de baixo diz <b>qual figura é essa unidade</b> (4 = semínima, 8 = colcheia).</p>
<table class="t"><tr><th>Fórmula</th><th>Tipo</th><th>Unidade de tempo</th><th>Contagem</th><th>Onde aparece</th></tr>
<tr><td>2/4</td><td>simples</td><td>semínima</td><td>1 e 2 e</td><td>marcha, samba</td></tr>
<tr><td>3/4</td><td>simples</td><td>semínima</td><td>1 e 2 e 3 e</td><td>valsa</td></tr>
<tr><td>4/4</td><td>simples</td><td>semínima</td><td>1 e 2 e 3 e 4 e</td><td>pop, rock, MPB</td></tr>
<tr><td>6/8</td><td>composto</td><td>semínima pontuada</td><td>1 la li 2 la li</td><td>baladas, Noite Feliz</td></tr>
<tr><td>9/8</td><td>composto</td><td>semínima pontuada</td><td>1 la li 2 la li 3 la li</td><td>raro, algumas canções</td></tr>
<tr><td>12/8</td><td>composto</td><td>semínima pontuada</td><td>1 la li 2 la li 3 la li 4 la li</td><td>blues lento</td></tr></table>
<p><b>Simples:</b> cada tempo se divide em 2. <b>Composto:</b> cada tempo se divide em 3; o 6/8 normalmente tem dois tempos principais, cada um com três colcheias.</p>
<h2 class="s">Contratempo e síncope</h2>
<ul class="lista"><li><b>Contratempo:</b> a nota toca na parte fraca (o “e”) e o tempo forte fica em silêncio. É a base do reggae e do ska.</li><li><b>Síncope:</b> o acento é deslocado: uma nota começa numa parte fraca e se prolonga sobre uma parte mais forte. Pode ocorrer no “e”, no “a” ou em tempos fracos do compasso, e dá o gingado da música brasileira.</li></ul>
<h2 class="s">Tercinas</h2>
<p>A <b>tercina</b> coloca <b>3 notas no lugar de 2</b>: três colcheias ocupam o tempo de uma semínima, e cada nota vale ⅓ de tempo. Conte “1 la li, 2 la li…”. Ela dá o balanço ternário do blues e do shuffle.</p>
<p class="mut" style="font-size:10.4pt">Neste livro, as tercinas são explicadas em texto e na contagem, sem partitura. As músicas e exercícios escritos usam divisões em 2 e em 4, e, no caso de Noite Feliz, a divisão em 3 do 6/8.</p>` });

  B.partitura = () => pg({ tag: T('partitura', 'MÚSICA'), titulo: 'Lendo partitura e tablatura', sub: 'A partitura mostra a altura e a duração. A tablatura mostra onde colocar os dedos.', corpo: `
<h2 class="s">Pauta e clave de sol</h2>
<p>A pauta tem <b>cinco linhas e quatro espaços</b>, contados de baixo para cima. A <b>clave de sol</b> (o desenho no começo) marca o Sol na 2ª linha. Notas fora da pauta usam <b>linhas suplementares</b>, pequenas linhas extras acima ou abaixo.</p>
<table class="t"><tr><th>Posição</th><th>Notas (de baixo para cima, na clave de sol)</th></tr><tr><td>linhas</td><td><b>Mi · Sol · Si · Ré · Fá</b></td></tr><tr><td>espaços</td><td><b>Fá · Lá · Dó · Mi</b></td></tr></table>
<div class="cit-p">O violão soa uma oitava abaixo do escrito.</div>
<p>A música de violão é escrita na <b>clave de sol com um 8 embaixo</b> (ou, em muitas edições, na clave de sol comum): o instrumento <b>soa uma oitava abaixo</b> da altura escrita. Neste livro, a partitura vem sempre com o 8, e a nota que você ouve é a que a tablatura indica.</p>
<h2 class="s">Partitura e tablatura juntas</h2>
${part('exemplo-pauta', [{ n: 'E2', d: 4 }, { n: 'A2', d: 4 }, { n: 'D3', d: 4 }, { n: 'G3', d: 4 }, { n: 'B3', d: 4 }, { n: 'E4', d: 4 }, { n: 'B3', d: 4 }, { n: 'G3', d: 4 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2, nomes: true })}
<p>As seis cordas soltas, de baixo para cima e de volta. Na <b>tablatura</b> (linhas T A B), cada linha é uma corda: a de cima é a <b>1ª, a mais fina</b>. O número é a casa; <b>0</b> é corda solta. A partitura mostra o <b>ritmo</b> (todas semínimas); a tablatura mostra <b>onde</b> tocar.</p>
<h2 class="s">Acidentes e sinais</h2>
<table class="t"><tr><th>Sinal</th><th>Nome</th><th>O que faz</th></tr><tr><td>♯</td><td>sustenido</td><td>sobe a nota um semitom (uma casa para a frente)</td></tr><tr><td>♭</td><td>bemol</td><td>desce a nota um semitom (uma casa para trás)</td></tr><tr><td>♮</td><td>bequadro</td><td>cancela um sustenido ou bemol anterior</td></tr><tr><td>|: :|</td><td>ritornelo</td><td>repete o trecho entre as barras</td></tr><tr><td>1ª e 2ª casas</td><td>casas de repetição</td><td>na primeira vez toque a casa 1; na segunda, pule para a casa 2</td></tr><tr><td>D.C. · D.S. · Fine</td><td>da capo · dal segno · fim</td><td>volte ao começo · volte ao sinal · termine aqui</td></tr></table>
<p>Um acidente vale até o fim do compasso, para a mesma nota naquela oitava.</p>` });
  B.partitura2 = () => pg({ tag: T('partitura2', 'MÚSICA'), titulo: 'Primeiros exercícios de leitura', sub: 'Cordas soltas e as primeiras casas, com partitura e tablatura lado a lado.', corpo: `
<h2 class="s">1 · Cordas soltas, em semínimas</h2>
${part('leit1', [{ n: 'B3', d: 4 }, { n: 'B3', d: 4 }, { n: 'E4', d: 4 }, { n: 'E4', d: 4 }, { n: 'G3', d: 4 }, { n: 'G3', d: 4 }, { n: 'B3', d: 8 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2, nomes: true })}
<h2 class="s">2 · Mi, Fá e Sol na 1ª corda</h2>
${part('leit2', [{ n: 'E4', d: 4 }, { n: 'F4', d: 4 }, { n: 'G4', d: 4 }, { n: 'F4', d: 4 }, { n: 'E4', d: 8 }, { r: true, d: 4 }, { n: 'E4', d: 4 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2, nomes: true })}
<p>Repare na <b>pausa de semínima</b> no 2º compasso: você conta o tempo em silêncio e volta no tempo certo.</p>
<h2 class="s">3 · Colcheias na 2ª corda</h2>
${part('leit3', [{ n: 'B3', d: 2 }, { n: 'C4', d: 2 }, { n: 'D4', d: 2 }, { n: 'C4', d: 2 }, { n: 'B3', d: 8 }, { n: 'D4', d: 2 }, { n: 'C4', d: 2 }, { n: 'B3', d: 2 }, { n: 'C4', d: 2 }, { n: 'B3', d: 8 }], { compasso: '4/4', tempo: '♩ = 70', porLinha: 2, nomes: true })}
<p>Conte “1 e 2 e 3 e 4 e”. A cada colcheia, um “e” ou um número.</p>
${L.dica('Como estudar', 'leia a partitura, diga o nome das notas em voz alta, depois olhe só a tablatura e toque. por último, toque olhando só a partitura.')}` });

  B.intervalos = () => pg({ tag: T('intervalos', 'MÚSICA'), titulo: 'Intervalos', sub: 'A distância entre duas notas. Conhecer os intervalos acelera a leitura e a escolha de acordes.', corpo: `
<p>Um <b>intervalo</b> é a distância entre duas notas. O <b>número</b> conta as notas da escala, incluindo as duas pontas (de Dó a Mi: Dó, Ré, Mi = terça). A <b>qualidade</b> (maior, menor, justa, aumentada, diminuta) diz o tamanho exato em semitons.</p>
<table class="t"><tr><th>Intervalo</th><th>Semitons</th><th>Exemplo em Dó</th><th>No braço (mesma corda)</th></tr>
<tr><td>2ª menor</td><td>1</td><td>Dó → Ré♭</td><td>1 casa</td></tr><tr><td>2ª maior</td><td>2</td><td>Dó → Ré</td><td>2 casas</td></tr><tr><td>3ª menor</td><td>3</td><td>Dó → Mi♭</td><td>3 casas</td></tr><tr><td>3ª maior</td><td>4</td><td>Dó → Mi</td><td>4 casas</td></tr><tr><td>4ª justa</td><td>5</td><td>Dó → Fá</td><td>5 casas (ou a mesma casa na corda seguinte, mais aguda, exceto entre a 3ª e a 2ª)</td></tr><tr><td>4ª aumentada ou 5ª diminuta</td><td>6</td><td>Dó → Fá♯</td><td>6 casas</td></tr><tr><td>5ª justa</td><td>7</td><td>Dó → Sol</td><td>7 casas</td></tr><tr><td>6ª menor</td><td>8</td><td>Dó → Lá♭</td><td>8 casas</td></tr><tr><td>6ª maior</td><td>9</td><td>Dó → Lá</td><td>9 casas</td></tr><tr><td>7ª menor</td><td>10</td><td>Dó → Si♭</td><td>10 casas</td></tr><tr><td>7ª maior</td><td>11</td><td>Dó → Si</td><td>11 casas</td></tr><tr><td>8ª justa (oitava)</td><td>12</td><td>Dó → Dó</td><td>12 casas</td></tr></table>
<ul class="lista"><li><b>Justos:</b> 4ª, 5ª e 8ª (e o uníssono). Não têm versão maior ou menor.</li><li><b>Maiores e menores:</b> 2ª, 3ª, 6ª e 7ª. A menor é um semitom mais curta que a maior.</li><li><b>Aumentado:</b> um semitom a mais que o justo ou o maior. <b>Diminuto:</b> um semitom a menos que o justo ou o menor.</li></ul>
<h2 class="s">Exercício: identifique o intervalo</h2>
<table class="t"><tr><th>Notas</th><th>Intervalo</th></tr><tr><td>Mi – Sol</td><td></td></tr><tr><td>Lá – Mi</td><td></td></tr><tr><td>Ré – Fá♯</td><td></td></tr><tr><td>Sol – Fá</td><td></td></tr></table>
<p class="mut" style="font-size:10.4pt">Respostas: Mi–Sol = 3ª menor (3 semitons) · Lá–Mi = 5ª justa (7) · Ré–Fá♯ = 3ª maior (4) · Sol–Fá = 7ª menor (10).</p>` });

  B.braco = () => pg({ tag: T('braco', 'MÚSICA'), titulo: 'O braço do violão: onde ficam as notas', sub: 'Do Mi solto até a casa 12. Na casa 12, tudo recomeça uma oitava acima.', corpo: `
<h2 class="s">Notas naturais</h2>
<div class="mapa">${V.braco({ modo: 'naturais' })}</div>
<p>Cada corda solta é uma nota, e cada casa sobe um semitom. As <b>notas naturais</b> (douradas) não têm ♯ nem ♭. Só em dois lugares elas ficam coladas, a um semitom: <b>Mi–Fá</b> e <b>Si–Dó</b>.</p>
<h2 class="s">Padrões para localizar notas</h2>
<ul class="lista"><li><b>Oitavas:</b> a mesma nota, duas cordas acima. Da 6ª para a 4ª e da 5ª para a 3ª, <b>duas casas à frente</b> (ex.: Lá da 5ª corda solta e Lá da 3ª corda, casa 2). Da 4ª para a 2ª e da 3ª para a 1ª, <b>três casas à frente</b>.</li><li><b>Mi grave e Mi agudo:</b> a 6ª e a 1ª cordas têm as mesmas notas, duas oitavas de diferença. Se você sabe uma, sabe a outra.</li><li><b>Casa 12:</b> a nota é a mesma da corda solta, uma oitava acima.</li><li><b>Marcadores</b> (casas 3, 5, 7, 9 e 12): use como referência para achar casas sem contar.</li></ul>
<h2 class="s">Exercícios para memorizar</h2>
<ol class="passos"><li>Escolha uma nota (Sol) e <b>encontre-a em todas as cordas</b> até a casa 12. Diga o nome em voz alta.</li><li>Toque a <b>escala de Dó maior</b> da seção ${N('escalas')}, olhando o mapa e dizendo o nome de cada nota.</li><li>Com os olhos fechados, peça a um amigo uma nota; ache em até 5 segundos.</li><li>Nos acordes que você já sabe, <b>ache a fundamental</b>: a bolinha dourada do diagrama é a nota que dá nome ao acorde.</li></ol>` });
  B.braco2 = () => pg({ tag: T('braco2', 'MÚSICA'), titulo: 'O braço com sustenidos e bemóis', sub: 'As notas pretas do piano também existem no violão: são as casas entre as naturais.', corpo: `
<h2 class="s">Com sustenidos (♯)</h2>
<div class="mapa">${V.braco({ modo: 'sustenidos' })}</div>
<h2 class="s">Com bemóis (♭)</h2>
<div class="mapa">${V.braco({ modo: 'bemois' })}</div>
<p>Dourado = nota natural. Branco = nota com ♯ ou ♭. A mesma casa tem dois nomes: Dó♯ e Ré♭ são o mesmo som (enarmonia). Na casa 12 tudo recomeça uma oitava acima.</p>
<h2 class="s">Exercício: encontre as notas</h2>
<table class="t"><tr><th>Nota</th><th>6ª corda</th><th>5ª corda</th><th>4ª corda</th></tr><tr><td>Sol</td><td>casa ___</td><td>casa ___</td><td>casa ___</td></tr><tr><td>Si♭</td><td>casa ___</td><td>casa ___</td><td>casa ___</td></tr><tr><td>Fá♯</td><td>casa ___</td><td>casa ___</td><td>casa ___</td></tr></table>
<p class="mut" style="font-size:10.4pt">Respostas: Sol = 3, 10, 5 · Si♭ = 6, 1, 8 · Fá♯ = 2, 9, 4.</p>` });

  B.tom = () => pg({ tag: T('tom', 'MÚSICA'), titulo: 'Tom, semitom, sustenido e bemol', sub: 'A música usa 12 notas que se repetem. O violão as organiza em casas.', corpo: `
<p>O sistema usado na música ocidental divide a oitava em <b>12 classes de altura</b> (12 semitons iguais, no temperamento igual). A menor distância entre duas notas é o <b>semitom</b>, que no violão é uma casa. Um <b>tom</b> são dois semitons, ou seja, duas casas.</p>
<p style="text-align:center;font-size:14pt;font-weight:800;line-height:1.9">Dó <span class="tt">T</span> Ré <span class="tt">T</span> Mi <span class="tt">S</span> Fá <span class="tt">T</span> Sol <span class="tt">T</span> Lá <span class="tt">T</span> Si <span class="tt">S</span> Dó</p>
<p>T = tom (2 casas) · S = semitom (1 casa). Essa sequência <b>T T S T T T S</b> é a fórmula de toda escala maior. Entre as notas naturais, o semitom aparece em <b>Mi–Fá</b> e <b>Si–Dó</b>.</p>
<h2 class="s">Sustenido, bemol e enarmonia</h2>
<p><b>Sustenido (♯)</b> sobe a nota um semitom; <b>bemol (♭)</b> desce. Por isso Dó♯ e Ré♭ são a mesma casa: o mesmo som com dois nomes. Isso se chama <b>enarmonia</b>.</p>
<table class="t"><tr><th>Sustenido</th><th>Dó♯</th><th>Ré♯</th><th>Fá♯</th><th>Sol♯</th><th>Lá♯</th></tr><tr><th>Bemol</th><td>Ré♭</td><td>Mi♭</td><td>Sol♭</td><td>Lá♭</td><td>Si♭</td></tr></table>
<h2 class="s">Mi♯, Si♯, Fá♭ e Dó♭ existem</h2>
<p>É comum ouvir que “Mi♯ e Si♯ não existem”. Existem, sim: são nomes de notas que soam igual a outras, e aparecem na teoria e em certas tonalidades.</p>
<table class="t"><tr><th>Nota</th><th>Soa igual a</th><th>Por quê</th></tr><tr><td>Mi♯</td><td>Fá</td><td>Mi sobe um semitom</td></tr><tr><td>Si♯</td><td>Dó</td><td>Si sobe um semitom</td></tr><tr><td>Fá♭</td><td>Mi</td><td>Fá desce um semitom</td></tr><tr><td>Dó♭</td><td>Si</td><td>Dó desce um semitom</td></tr></table>
<p>Elas aparecem, por exemplo, nas escalas de Fá♯ maior (tem Mi♯) e Dó♯ maior (tem Si♯). No dia a dia do violão, você quase sempre usará os nomes mais comuns.</p>
${L.dica('Dica de estudo', 'no mapa do braço, ache todos os pares Mi–Fá e Si–Dó. depois toque, numa corda só, subindo casa por casa, e conte os semitons.')}` });
}
