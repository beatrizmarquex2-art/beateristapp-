// Módulos 3 e 4: acordes, pestana, dicionário, batidas, estilos, trocas, dedilhado.
export function registra(B, c) {
  const { L, V, pg, N, T, ac, acs, acx, bat, part, AC, MEL } = c;

  B.formacao = () => pg({ tag: T('formacao', 'ACORDES'), titulo: 'Como se formam os acordes', sub: 'Acorde é um conjunto de notas tocadas juntas. Todo acorde nasce de uma nota (a fundamental) e de intervalos empilhados.', corpo: `
<h2 class="s">Tríades: três notas</h2>
<table class="t"><tr><th>Tríade</th><th>Fórmula (intervalos)</th><th>Semitons</th><th>Cifra</th><th>Em Dó</th></tr>
<tr><td>Maior</td><td>fundamental · 3ª maior · 5ª justa</td><td>0 · 4 · 7</td><td>C</td><td>Dó · Mi · Sol</td></tr>
<tr><td>Menor</td><td>fundamental · 3ª menor · 5ª justa</td><td>0 · 3 · 7</td><td>Cm</td><td>Dó · Mi♭ · Sol</td></tr>
<tr><td>Diminuta</td><td>fundamental · 3ª menor · 5ª diminuta</td><td>0 · 3 · 6</td><td>C°</td><td>Dó · Mi♭ · Sol♭</td></tr>
<tr><td>Aumentada</td><td>fundamental · 3ª maior · 5ª aumentada</td><td>0 · 4 · 8</td><td>C+ ou Caug</td><td>Dó · Mi · Sol♯</td></tr></table>
<h2 class="s">Acordes com sétima</h2>
<table class="t"><tr><th>Acorde</th><th>Fórmula</th><th>Semitons</th><th>Cifra</th><th>Em Dó</th></tr>
<tr><td>Maior com sétima menor (dominante)</td><td>1 · 3 · 5 · ♭7</td><td>0 · 4 · 7 · 10</td><td>C7</td><td>Dó · Mi · Sol · Si♭</td></tr>
<tr><td>Maior com sétima maior</td><td>1 · 3 · 5 · 7</td><td>0 · 4 · 7 · 11</td><td>C7M, Cmaj7</td><td>Dó · Mi · Sol · Si</td></tr>
<tr><td>Menor com sétima</td><td>1 · ♭3 · 5 · ♭7</td><td>0 · 3 · 7 · 10</td><td>Cm7</td><td>Dó · Mi♭ · Sol · Si♭</td></tr></table>
<h2 class="s">Acordes suspensos</h2>
<table class="t"><tr><th>Acorde</th><th>Fórmula</th><th>Semitons</th><th>Cifra</th><th>Em Dó</th></tr><tr><td>Suspenso de 2ª</td><td>1 · 2 · 5</td><td>0 · 2 · 7</td><td>Csus2</td><td>Dó · Ré · Sol</td></tr><tr><td>Suspenso de 4ª</td><td>1 · 4 · 5</td><td>0 · 5 · 7</td><td>Csus4</td><td>Dó · Fá · Sol</td></tr></table>
<p>“Suspenso” quer dizer que a terça sai e entra outra nota no lugar: o acorde fica sem o caráter de maior ou menor, esperando resolver.</p>
<h2 class="s">Baixo invertido (inversões)</h2>
<p>Quando outra nota do acorde fica <b>embaixo</b>, escrevemos uma barra e o nome dessa nota: <b>C/E</b> (Dó com Mi no baixo). Com a terça no baixo é a <b>1ª inversão</b>; com a quinta no baixo, a <b>2ª inversão</b>. As notas são as mesmas; muda só a que fica mais grave.</p>
<div class="acs">${acs(['C', 'C/E', 'C/G'])}</div>
${L.dica('Como ler', 'o diagrama mostra todas as cordas tocadas. bolinha dourada = fundamental. no C/E a fundamental (Dó) não está no baixo: o baixo é a 6ª corda solta (Mi).')}` });

  B.maiores = () => pg({ tag: T('maiores', 'ACORDES'), titulo: 'Acordes maiores', sub: 'Na cifra, é só a letra. A estrutura é sempre a mesma.', corpo: `
<p>Uma <b>tríade maior</b> tem <b>fundamental</b>, <b>terça maior</b> (4 semitons acima da fundamental) e <b>quinta justa</b> (7 semitons acima). Em E maior: fundamental Mi, terça maior Sol♯ (4 semitons acima de Mi), quinta justa Si (7 semitons).</p>
<h2 class="s">Maior × menor: o que muda</h2>
<p>O acorde menor tem a <b>terça menor</b>, 3 semitons acima da fundamental. Comparando acordes da mesma fundamental, só <b>uma nota muda</b>: a terça desce um semitom. A quinta e a fundamental continuam iguais.</p>
<table class="t"><tr><th>Par</th><th>Notas do maior</th><th>Notas do menor</th><th>O que mudou</th></tr>
<tr><td>E e Em</td><td>Mi · Sol♯ · Si</td><td>Mi · Sol · Si</td><td>Sol♯ → Sol (3ª maior → 3ª menor)</td></tr>
<tr><td>A e Am</td><td>Lá · Dó♯ · Mi</td><td>Lá · Dó · Mi</td><td>Dó♯ → Dó</td></tr>
<tr><td>D e Dm</td><td>Ré · Fá♯ · Lá</td><td>Ré · Fá · Lá</td><td>Fá♯ → Fá</td></tr></table>
<div class="acs">${acs(['E', 'Em', 'A', 'Am', 'D', 'Dm'])}</div>
<p>Ao trocar de maior para menor, o <b>som muda</b>: em geral, o maior soa mais claro e aberto, e o menor mais sombrio ou contido. Mas o clima de uma música também depende do ritmo, do andamento e da melodia: não é uma regra fixa. Toque os pares e escute você mesmo.</p>
${L.dica('Compare', 'toque E, depois Em. repare que a única diferença no desenho é o dedo 1 na 3ª corda (Sol♯) que sai. um dedo a menos, um som diferente.')}` });

  B.maiores2 = () => pg({ tag: T('maiores2', 'ACORDES'), titulo: 'Os acordes maiores abertos', sub: 'Posições com cordas soltas: as primeiras que quase todo mundo aprende.', corpo: `
${['C', 'D', 'E', 'G', 'A'].map((k) => acx(k)).join('')}
${L.dica('Dica de estudo', 'monte cada acorde e toque corda por corda. todas precisam soar limpas, sem chiado. aperte pertinho do traste.')}${L.caderno()}` });

  B.menores = () => pg({ tag: T('menores', 'ACORDES'), titulo: 'Acordes menores', sub: 'Na cifra ganham um “m”. A terça é menor: um semitom mais perto da fundamental.', corpo: `
<p>Uma <b>tríade menor</b> tem <b>fundamental</b>, <b>terça menor</b> (3 semitons acima) e <b>quinta justa</b> (7 semitons acima). Em Mi menor: Mi, Sol (3 semitons acima de Mi) e Si (7 semitons).</p>
${['Am', 'Dm', 'Em'].map((k) => acx(k)).join('')}
<h2 class="s">Atividade complementar: acordes relativos</h2>
<p><b>C</b> (Dó · Mi · Sol) e <b>Am</b> (Lá · Dó · Mi) têm duas notas em comum, Dó e Mi, mas <b>não é a mesma nota que mudou</b>: a <b>fundamental muda</b> (de Dó para Lá), e por isso são acordes diferentes. Chamamos de acordes <b>relativos</b>. O mesmo vale para G e Em, e para F e Dm.</p>
${L.dica('Dica de estudo', 'toque E e Em, A e Am, D e Dm, um depois do outro, e perceba só uma nota mudando. depois toque C e Am (relativos) e compare.')}${L.caderno()}` });

  B.pestana = () => pg({ tag: T('pestana', 'ACORDES'), titulo: 'Pestana e minipestana', sub: 'A pestana não é força. É posição. Leia antes de tentar.', corpo: `
<table class="t"><tr><th>Técnica</th><th>O que é</th><th>Exemplo</th></tr>
<tr><td>Pestana</td><td>o dedo 1 deitado sobre <b>todas ou quase todas</b> as cordas na mesma casa</td><td>F completo (1ª casa, 6 cordas)</td></tr>
<tr><td>Minipestana</td><td>o dedo 1 deitado sobre <b>duas ou três</b> cordas</td><td>F simplificado (1ª casa, 1ª e 2ª cordas)</td></tr>
<tr><td>Sem pestana</td><td>nenhum dedo deita sobre várias cordas</td><td>F/C (Fá com Dó no baixo)</td></tr></table>
<p><b>Atenção:</b> o Fá chamado de “sem pestana” em muitas apostilas (xx3211) usa uma <b>minipestana de duas cordas</b>, então não é rigorosamente sem pestana. Aqui, usamos o nome certo.</p>
<h2 class="s">Quatro formas de tocar Fá</h2>
${acx('F')}${acx('Fmini')}${acx('F/C')}${acx('Fmaj7')}
<p><b>F/C</b> (x3321x) é uma possibilidade realmente sem pestana: o baixo é o Dó (a quinta do acorde), então é a <b>2ª inversão</b> de Fá maior. As notas são Dó, Fá, Lá e Dó (sem a 6ª e a 1ª cordas). O <b>Fmaj7</b> (xx3210) é outro acorde (Fá com sétima maior), parecido e fácil, mas não substitui o F em todo lugar.</p>
<h2 class="s">5 ajustes que destravam a pestana</h2>
<ol class="passos"><li>Use a <b>lateral do indicador</b>, não a parte macia da ponta.</li><li>Fique <b>colado no traste</b>, quase em cima dele.</li><li><b>Polegar</b> atrás do braço, no meio. Aperte com o braço, não só com o dedo.</li><li><b>Cotovelo solto</b>, ombro baixo.</li><li>Treine <b>2 minutos e descanse</b>. A mão cansa; pare se doer.</li></ol>
<p><b>Teste do som:</b> toque corda por corda. Se alguma abafar, ajuste a posição do dedo antes de apertar mais.</p>` });

  B.dicionario = () => pg({ tag: T('dicionario', 'CONSULTA'), titulo: 'Dicionário de acordes: maiores e menores', sub: 'Para dar uma olhada rápida e relembrar. A bolinha dourada é a fundamental.', corpo: `
<h2 class="s">Maiores</h2><div class="acs">${acs(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb'])}</div>
<h2 class="s">Menores</h2><div class="acs">${acs(['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'F#m', 'C#m', 'G#m'])}</div>` });
  B.dicionario2 = () => pg({ tag: T('dicionario2', 'CONSULTA'), titulo: 'Dicionário de acordes: sétimas e outros', corpo: `
<h2 class="s">Com sétima menor (dominantes)</h2><div class="acs">${acs(['A7', 'B7', 'C7', 'D7', 'E7', 'G7'])}</div>
<h2 class="s">Com sétima maior</h2><div class="acs">${acs(['Cmaj7', 'Dmaj7', 'Fmaj7', 'Gmaj7', 'Amaj7'])}</div>
<h2 class="s">Menores com sétima</h2><div class="acs">${acs(['Am7', 'Dm7', 'Em7'])}</div>
<h2 class="s">Diminutos e aumentados</h2><div class="acs">${acs(['Bdim', 'Cdim', 'Caug', 'Gaug'])}</div>
<h2 class="s">Suspensos</h2><div class="acs">${acs(['Asus2', 'Dsus2', 'Asus4', 'Dsus4', 'Esus4'])}</div>` });

  B.moveis = () => pg({ tag: T('moveis', 'ACORDES'), titulo: 'Formas móveis, power chords e baixo invertido', sub: 'Uma forma com pestana pode ser deslocada pelo braço: a mesma mão, outro acorde.', corpo: `
<p>As formas do <b>F</b> (raiz na 6ª corda) e do <b>B</b> (raiz na 5ª corda) não usam cordas soltas. Por isso, ao andar a forma para a direita, o nome do acorde sobe junto com a fundamental. O nome sai da <b>nota que o dedo 1 toca na corda da fundamental</b>.</p>
<table class="t"><tr><th>Forma</th><th>Fundamental na…</th><th>Casa 1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>7</th></tr>
<tr><td>F (maior) e Fm (menor)</td><td>6ª corda</td><td>F</td><td>F♯</td><td>G</td><td>G♯</td><td>A</td><td>B</td></tr>
<tr><td>B (maior) e Bm (menor)</td><td>5ª corda</td><td>A♯ (B♭)</td><td>B</td><td>C</td><td>C♯</td><td>D</td><td>E</td></tr></table>
<div class="acs">${acs(['F', 'Fm', 'Gm', 'B', 'Bm', 'Cm'])}</div>
<p>Exemplo: a forma do Fm na casa 3 é Gm; a forma do Bm na casa 3 é Cm.</p>
<h2 class="s">Power chords (acordes de quinta)</h2>
<p>Um <b>power chord</b> tem só <b>fundamental e quinta justa</b> (às vezes repetindo a fundamental uma oitava acima). Sem a terça, não é maior nem menor: serve para os dois. É a base do rock. A forma anda pelo braço como as outras.</p>
<div class="acs">${acs(['E5', 'A5', 'G5', 'C5', 'D5'])}</div>
<h2 class="s">Baixo invertido</h2>
<div class="acs">${acs(['C/E', 'C/G', 'D/F#', 'G/B', 'F/C', 'Am/E'])}</div>
<p>Esses acordes ajudam a caminhar o baixo: <b>C → G/B → Am → Am/E → F</b> desce quase de grau em grau. Leia a nota depois da barra: ela é o baixo.</p>` });

  /* ---------------- módulo 4 ---------------- */
  B.batidas = () => pg({ tag: T('batidas', 'RITMO'), titulo: 'Tipos de batida', sub: 'A mão direita desce no número e sobe no “e”, sempre, mesmo quando não encosta nas cordas.', corpo: `
<p>↓ para baixo · ↑ para cima · ✕ abafada (palma da mão nas cordas) · · pausa, com a mão se mexendo no ar. Os números são os tempos e o “e” é o meio do tempo.</p>
<h2 class="s">Em 4/4: “1 e 2 e 3 e 4 e”</h2>
${bat('Só para baixo', 'Treine com G e C', ['D', '.', 'D', '.', 'D', '.', 'D', '.'], 8, 'Uma batida para baixo em cada tempo. É a base de tudo, e é aqui que a mão aprende a ficar solta.')}
${bat('Baixo e cima', 'Treine com G e C', ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'], 8, 'Para baixo no tempo, para cima no “e”. A mão vai e volta como um pêndulo, sem parar.')}
${bat('Pop clássico', 'Treine com G e C', ['D', '.', 'D', 'U', '.', 'U', 'D', 'U'], 8, 'A mais usada em pop, rock e MPB acústica. O segredo: a mão continua o movimento mesmo quando não encosta nas cordas.')}
${bat('Com abafada', 'Treine com G e C', ['D', 'U', 'X', 'U', 'D', 'U', 'X', 'U'], 8, 'No ✕ você bate a palma da mão nas cordas para abafar. Dá aquele estalo percussivo de violão de roda.')}
<h2 class="s">Em 3/4: “1 e 2 e 3 e”</h2>
${bat('Valsa (3 tempos)', 'Treine com C e G', ['D', '.', 'D', 'U', 'D', 'U'], 6, 'Compasso de três. Acento forte no 1, e dois tempos leves depois. Ótima para Parabéns e valsas.')}
<p>Conte em voz alta: <b>4/4</b> “um e dois e três e quatro e” · <b>3/4</b> “um e dois e três e”. A mão desce no número e sobe no “e”.</p>` });

  B.baiao = () => pg({ tag: T('baiao', 'RITMO'), titulo: 'Baião, contratempo e a regra do movimento', sub: 'Quando a batida foge do “desce no número, sobe no e”.', corpo: `
<h2 class="s">Baião 3 + 3 + 2</h2>
<p>As oito colcheias do compasso se dividem em grupos de <b>3 + 3 + 2</b>. Os acentos caem no começo de cada grupo: na 1ª colcheia (o <b>1</b>), na 4ª (o “e” depois do 2) e na 7ª (o <b>4</b>).</p>
${bat('Baião: só os acentos (simplificado)', 'Treine com G e C · 70 bpm', ['D', '.', '.', 'D', '.', '.', 'D', '.'], 8, 'Representação simplificada: só marca os três acentos. É um exercício para a contagem 3 + 3 + 2, não a batida completa de baião.', [0, 3, 6])}
${bat('Baião: movimento contínuo (um pouco mais completo)', 'Treine com G e C · 70 bpm', ['D', 'U', 'X', 'D', 'U', 'X', 'D', 'U'], 8, 'Cada grupo começa com ↓ e segue ↑ ✕. Os acentos continuam em 1, “e” do 2 e 4.', [0, 3, 6])}
<p><b>Exceção ao movimento alternado.</b> Nas batidas anteriores, a mão descia nos números e subia nos “e”. No baião, o acento da 4ª colcheia é um <b>↓ que cai no contratempo</b> (o “e”). Isso <b>quebra a alternância</b> normal: você precisa pensar em grupos de 3, não em pares. Treine devagar contando <b>“1 e a, 2 e a, 3 e”</b> (3 + 3 + 2).</p>
<p>A batida de baião de um violonista de forró ou de um sanfoneiro é mais rica: tem baixos, abafadas e variações. O que está aqui é a <b>base rítmica</b> para você aprender a dividir o compasso. Para o padrão completo de cada região, vale ouvir os mestres e estudar com um professor.</p>
<h2 class="s">Contratempo</h2>
${bat('Contratempo (reggae e ska)', 'Treine com Am e Dm', ['.', 'U', '.', 'U', '.', 'U', '.', 'U'], 8, 'Só no contratempo, para cima e curtinho. A base do reggae (70 a 90 bpm) e do ska (bem mais rápido, 150 bpm ou mais).')}
${L.dica('Dica de estudo', 'bata o pé em todo tempo (1, 2, 3, 4) e toque o acorde só entre as batidas do pé. o pé é a pulsação, a mão faz o contratempo.')}` });

  B.estilos = () => pg({ tag: T('estilos', 'RITMO'), titulo: 'Batidas por estilo', sub: 'Primeiro a versão introdutória; depois, o padrão característico, quando existe uma forma consagrada.', corpo: `
<p>Em cada estilo, <b>introdutório</b> é um exercício simplificado para a mão aprender o desenho. <b>Característico</b> é o padrão que quem toca o estilo reconhece. Quando o característico completo é mais rico que o espaço deste livro permite, dizemos isso em vez de fingir que ele está aqui.</p>
<table class="t"><tr><th>Estilo</th><th>Métrica e andamento</th><th>Acentos</th><th>Padrão</th></tr>
<tr><td>Pop</td><td>4/4 · 80 a 110 bpm</td><td>tempos 1 e 3, mais o “e” do 2</td><td>pop clássico (seção ${N('batidas')})</td></tr>
<tr><td>Rock</td><td>4/4 · 100 a 140 bpm</td><td>tempos 2 e 4</td><td>colcheias alternadas, com acento no 2 e no 4</td></tr>
<tr><td>MPB</td><td>4/4 · 80 a 100 bpm</td><td>2 e 4 abafados</td><td>baixo e cima com abafada</td></tr>
<tr><td>Sertanejo</td><td>4/4 · 90 a 110 bpm</td><td>baixo no 1 e no 3</td><td>baixo alternado e acorde</td></tr>
<tr><td>Reggae e ska</td><td>4/4 · 70 a 90 (reggae); 150+ (ska)</td><td>contratempo</td><td>só no “e”, para cima e curto</td></tr>
<tr><td>Baião</td><td>4/4 · 70 a 100 bpm</td><td>1, “e” do 2 e 4 (3 + 3 + 2)</td><td>seção ${N('baiao')}</td></tr>
<tr><td>Valsa</td><td>3/4 · 80 a 120 bpm</td><td>tempo 1</td><td>baixo e dois acordes</td></tr>
<tr><td>Blues</td><td>12/8 (ou 4/4 com swing) · 60 a 100 bpm</td><td>1, 2, 3 e 4 (tercinas)</td><td>shuffle: 1, pula o “la”, “li”</td></tr></table>
${bat('Rock · introdutório e característico', 'Treine com E5, A5, G5 · 110 bpm', ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'], 8, 'Palhetada alternada em colcheias. Característico: acento forte no 2 e no 4 (nos números 3 e 7 da contagem) e, no violão elétrico ou de aço, com <b>palm mute</b> (mão apoiada no cavalete) nas notas sem acento.', [2, 6])}
${bat('Sertanejo · baixo alternado', 'Treine com G, C, D · 100 bpm', ['B', '.', 'D', 'U', 'B', '.', 'D', 'U'], 8, '<b>B</b> = baixo: a fundamental no 1 e a quinta (ou outra nota grave do acorde) no 3, tocadas com o polegar. Depois, o acorde para baixo e para cima. É o padrão “baixo–acorde”, comum no sertanejo e no folk.')}
${bat('Valsa · caracterizada', 'Treine com C e G · 100 bpm', ['B', '.', 'D', 'U', 'D', 'U'], 6, 'Baixo (fundamental) no 1 e acorde nos tempos 2 e 3. É o padrão clássico da valsa no violão.')}
<p class="mut" style="font-size:10.4pt">Blues: veja o shuffle na seção ${N('progressoes')}. Samba, bossa nova e forró: o padrão característico completo depende de variações de dedos, abafadas e baixos que não cabem aqui com precisão; use os exercícios das próximas páginas como introdução e aprenda a levada completa com um professor ou por gravações.</p>` });

  B.estilos2 = () => pg({ tag: T('estilos2', 'RITMO'), titulo: 'Mais batidas: samba, bossa, forró e blues', sub: 'Exercícios inspirados nesses estilos. Eles preparam a mão; não substituem a levada completa.', corpo: `
<p class="mut">Introdutórios, inspirados no estilo. O padrão característico completo é mais rico e varia entre intérpretes.</p>
${bat('Samba · introdutório', 'Treine com Am, Dm, E7 · 2/4 · 90 bpm', ['D', 'U', 'X', 'U'], 4, 'Em 2/4 a mão faz “desce, sobe, abafa, sobe”. É a base percussiva. A levada completa de samba usa semicolcheias e baixos sincopados.')}
${bat('Bossa nova · introdutório', 'Treine com Cmaj7, Dm7, G7 · 4/4 · 80 bpm', ['B', '.', 'D', '.', 'B', '.', 'D', '.'], 8, 'Polegar no baixo (1 e 3) e acorde curtinho logo depois. A bossa completa usa uma síncope característica entre baixo e acorde que se aprende ouvindo e com professor.')}
${bat('Forró (xote) · introdutório', 'Treine com G, C, D · 2/4 · 80 bpm', ['D', 'U', 'D', 'U'], 4, 'Só a marcação de colcheias em 2/4. O padrão característico do forró é rico em baixos e abafadas e varia por região: não está incluído para não passar uma versão incompleta.')}
${bat('Blues · shuffle', 'Treine com E7, A7, B7 · 12/8 · 80 bpm', ['D', '.', 'U', 'D', '.', 'U', 'D', '.', 'U', 'D', '.', 'U'], 12, 'Doze colcheias: “1 la li, 2 la li, 3 la li, 4 la li”. Toque no 1 e no “li”, pule o “la”. Dá aquele balanço “manco” do blues.')}
${L.dica('Como estudar', 'escolha um estilo por semana. toque só a batida (acorde abafado) até ficar automática, depois acrescente a troca de acordes.')}` });

  B.trocas = () => pg({ tag: T('trocas', 'RITMO'), titulo: 'Batida + troca de acordes', sub: 'O segredo é antecipar: no último tempo do compasso, os dedos já começam a viajar.', corpo: `
<h2 class="s">Troca em câmera lenta: Em → Am</h2>
<p>Em os dedos <b>2 e 3</b> estão nas cordas 5 e 4 (2ª casa). Em Am, esses dois dedos <b>trocam de corda</b> e o <b>dedo 1 é acrescentado</b>. Não é “só um dedo que muda”: são três movimentos.</p>
<div class="acs">${acs(['Em', 'Am'], { g: true })}</div>
<table class="t"><tr><th>Passo</th><th>O que acontece</th></tr>
<tr><td>1</td><td>No Em: dedo 2 na <b>5ª corda</b>, dedo 3 na <b>4ª corda</b>, ambos na 2ª casa.</td></tr>
<tr><td>2</td><td>Levante os dois dedos juntos, quase colados, sem abrir a mão.</td></tr>
<tr><td>3</td><td>Desça <b>uma corda</b> (em direção à 1ª): dedo 2 na <b>4ª corda</b> e dedo 3 na <b>3ª corda</b>, 2ª casa.</td></tr>
<tr><td>4</td><td>Acrescente o <b>dedo 1</b> na <b>2ª corda</b>, 1ª casa.</td></tr>
<tr><td>5</td><td>No Am, a 6ª corda não toca (✕): comece a batida pela 5ª.</td></tr></table>
<p>Treine os passos 2 a 4 sem batida, devagar, e só depois com a mão direita. Os dedos 2 e 3 viajam juntos, como uma dupla.</p>
<h2 class="s">Exercícios</h2>` });

  const exer = (n, nivel, titulo, txt, acordes, batida, bpm, comp, extra = '') => `<div class="card"><h4><span>Exercício ${n} · ${nivel}</span></h4><div class="meta">${titulo}</div><div class="acs">${acs(acordes)}</div><p>${txt} <b>Batida:</b> ${batida} · <b>${bpm} bpm</b> · ${comp}.${extra}</p></div>`;
  B.trocas2 = () => pg({ tag: T('trocas2', 'RITMO'), titulo: 'Exercícios de troca', sub: 'Do muito fácil ao desafio. Comece devagar e só suba 5 bpm quando sair limpo três vezes seguidas.', corpo: `
${exer(1, 'muito fácil', 'Em ↔ Am', 'Siga os passos da página anterior.', ['Em', 'Am'], 'só para baixo', 60, '2 compassos em cada acorde')}
${exer(2, 'fácil', 'G → C', 'Uma das trocas mais comuns da música brasileira.', ['G', 'C'], 'baixo e cima', 60, '2 compassos em cada acorde')}
${exer(3, 'fácil', 'A → D → E', 'Três acordes que tocam meio mundo do rock e do forró.', ['A', 'D', 'E'], 'baixo e cima', 70, '2 compassos em cada acorde')}
${exer(4, 'médio', 'G → D → Em → C', 'A sequência do pop.', ['G', 'D', 'Em', 'C'], 'pop clássico', 72, '1 compasso em cada acorde')}
${L.dica('Antes de cada exercício', 'lento · sem parar · sem olhar. se a troca falhar, treine só ela, 1 minuto, e volte.')}` });
  B.trocas3 = () => pg({ tag: T('trocas3', 'RITMO'), titulo: 'Mais trocas', corpo: `
${exer(5, 'médio', 'Am → Dm → E', 'Com abafada. Soa como violão de roda.', ['Am', 'Dm', 'E'], 'com abafada', 76, '1 compasso em cada acorde')}
${exer(6, 'médio', 'C → G (valsa)', 'Três tempos: “um, dois, três, um, dois, três”.', ['C', 'G'], 'valsa (3 tempos)', 90, '1 compasso em cada acorde')}
${exer(7, 'desafio', 'C → G → Am → F', 'Com o Fá de pestana. Se o Fá ainda não sair, use a minipestana ou o F/C (seção ' + N('pestana') + '): o tempo continua.', ['C', 'G', 'Am', 'F'], 'pop clássico', 76, '1 compasso em cada acorde')}
<h2 class="s">Crie a sua própria sequência</h2>
<p>Escolha 4 acordes do dicionário (seção ${N('dicionario')}), uma batida e um andamento. Anote:</p>
<table class="t"><tr><th>Acordes</th><th>Batida</th><th>bpm</th></tr><tr><td style="height:11mm"></td><td></td><td></td></tr><tr><td style="height:11mm"></td><td></td><td></td></tr></table>
${L.dica('Descanse a mão', 'a dor forte é sinal de parar. pare, alongue e volte amanhã. sensibilidade leve na ponta dos dedos pode acontecer nas primeiras semanas; dor intensa, persistente ou nas articulações não é normal.')}${L.caderno()}` });

  B.dedilhado = () => pg({ tag: T('dedilhado', 'RITMO'), titulo: 'Dedilhado', sub: 'A mão direita toca as cordas uma a uma. Cada dedo cuida de uma região.', corpo: `
<p>A distribuição mais comum para começar é: <b>p (polegar)</b> nas cordas graves (6ª, 5ª e 4ª), <b>i (indicador)</b> na 3ª, <b>m (médio)</b> na 2ª e <b>a (anelar)</b> na 1ª. Essa é uma <b>configuração inicial, não uma regra</b>: o polegar pode tocar diferentes cordas graves (alternando o baixo), e i, m e a também podem trocar de corda conforme o arranjo e o conforto da mão.</p>
<h2 class="s">p · i · m · a</h2>
${part('ded1', [{ n: 'A2', d: 2 }, { n: 'A3', d: 2 }, { n: 'C4', d: 2 }, { n: 'E4', d: 2 }, { n: 'A2', d: 2 }, { n: 'A3', d: 2 }, { n: 'C4', d: 2 }, { n: 'E4', d: 2 }, { n: 'C3', d: 2 }, { n: 'G3', d: 2 }, { n: 'C4', d: 2 }, { n: 'E4', d: 2 }, { n: 'C3', d: 2 }, { n: 'G3', d: 2 }, { n: 'C4', d: 2 }, { n: 'E4', d: 2 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2 })}
<p>Compasso 1 em <b>Am</b> (p na 5ª corda, i na 3ª, m na 2ª, a na 1ª), compasso 2 em <b>C</b>. Polegar no baixo, depois indicador, médio e anelar subindo. O dedilhado mais clássico de todos.</p>
<h2 class="s">p · i · m · i (baixo alternado)</h2>
${part('ded2', [{ n: 'A2', d: 2 }, { n: 'A3', d: 2 }, { n: 'C4', d: 2 }, { n: 'A3', d: 2 }, { n: 'E3', d: 2 }, { n: 'A3', d: 2 }, { n: 'C4', d: 2 }, { n: 'A3', d: 2 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2 })}
<p>Aqui o polegar <b>alterna o baixo</b>: Lá (5ª corda) e depois Mi (4ª corda, casa 2). Soa como violão de balada. Veja como o p não fica preso a uma corda só.</p>
<h2 class="s">p · i · m · a · m · i (valsa)</h2>
${part('ded3', [{ n: 'A2', d: 2 }, { n: 'A3', d: 2 }, { n: 'C4', d: 2 }, { n: 'E4', d: 2 }, { n: 'C4', d: 2 }, { n: 'A3', d: 2 }, { n: 'C3', d: 2 }, { n: 'G3', d: 2 }, { n: 'C4', d: 2 }, { n: 'E4', d: 2 }, { n: 'C4', d: 2 }, { n: 'G3', d: 2 }], { compasso: '3/4', tempo: '♩ = 70', porLinha: 2 })}
<p>Seis notas em três tempos. Lindo para valsas e canções de ninar. Comece a 60 bpm e depois troque de acorde a cada repetição: Am, C, G, Em.</p>
<h2 class="s">Baixo + bloco</h2>
<p>O polegar toca sozinho, depois <b>i, m e a juntos</b>, como se você beliscasse as três cordas agudas ao mesmo tempo. Por ser simultâneo, não cabe na pauta de uma só voz acima; treine com os acordes Am, C e G.</p>
${L.dica('Dica de estudo', 'deixe o pulso solto. a mão não pula, só os dedos se mexem. se doer, pare e solte a mão.')}${L.caderno()}` });
}
