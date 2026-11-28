// Módulos 5 a 7: técnicas, melodias, escalas, harmonia, rotina.
export function registra(B, c) {
  const { L, V, pg, N, T, ac, acs, acx, bat, part, AC, MEL, melodia } = c;

  B.tecnicas = () => pg({ tag: T('tecnicas', 'TÉCNICA'), titulo: 'Técnicas de violão', sub: 'Introdução progressiva: cada técnica tem um símbolo e um exemplo curto em tablatura.', corpo: `
<table class="t"><tr><th>Técnica</th><th>Símbolo</th><th>Como fazer</th></tr>
<tr><td>Palhetada alternada</td><td>↓ ↑</td><td>palheta para baixo no tempo e para cima no “e”, sem parar o movimento</td></tr>
<tr><td>Dedilhado e arpejo</td><td>p i m a</td><td>notas do acorde tocadas uma a uma (seção ${N('dedilhado')})</td></tr>
<tr><td>Pestana e minipestana</td><td>barra no diagrama</td><td>dedo 1 deitado sobre várias cordas (seção ${N('pestana')})</td></tr>
<tr><td>Abafamento</td><td>✕</td><td>apoiar a palma da mão direita (ou relaxar a esquerda) para calar as cordas</td></tr>
<tr><td>Palm mute (PM)</td><td>PM</td><td>borda da mão direita apoiada de leve sobre as cordas, perto do cavalete: som curto e “seco”, muito usado no rock</td></tr>
<tr><td>Hammer-on</td><td>H (arco)</td><td>toque uma nota e “martele” o dedo na casa seguinte, sem palhetar de novo</td></tr>
<tr><td>Pull-off</td><td>P (arco)</td><td>puxe o dedo para o lado, soltando a corda e fazendo soar a nota de baixo, sem palhetar</td></tr>
<tr><td>Slide</td><td>linha diagonal</td><td>deslize o dedo de uma casa até outra, sem soltar a corda</td></tr>
<tr><td>Vibrato</td><td>~</td><td>mexa o dedo levemente para os lados (ou sobe e desce) para a nota “tremer”</td></tr>
<tr><td>Bend (bend ou “esticada”)</td><td>seta para cima</td><td>empurre a corda de lado para subir a afinação; mais fácil em cordas finas de aço, difícil em nylon</td></tr>
<tr><td>Harmônico natural</td><td>◇</td><td>encoste o dedo de leve sobre o traste 12 (ou 7 ou 5), sem apertar, e solte logo depois de tocar</td></tr></table>
<h2 class="s">Hammer-on e pull-off</h2>
${part('tec-hp', [{ n: 'G3', d: 4, t: 'h' }, { n: 'A3', d: 4 }, { n: 'A3', d: 4, t: 'p' }, { n: 'G3', d: 4 }, { n: 'B3', d: 4, t: 'h' }, { n: 'C4', d: 4 }, { n: 'C4', d: 4, t: 'p' }, { n: 'B3', d: 4 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2 })}
<p>Compasso 1, na 3ª corda: Sol (solta) com <b>H</b> para Lá (2ª casa), depois Lá com <b>P</b> de volta para o Sol. Compasso 2, na 2ª corda: Si solto com H para Dó (1ª casa) e de volta.</p>
<h2 class="s">Slide e vibrato</h2>
${part('tec-sv', [{ n: 'D4', d: 4, t: '/', cordaFixa: 2 }, { n: 'E4', d: 4, cordaFixa: 2 }, { n: 'E4', d: 8, t: '~', cordaFixa: 2 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 2 })}
<p>Na 2ª corda, deslize da casa 3 (Ré) até a casa 5 (Mi) e segure o Mi com vibrato.</p>` });
  B.tecnicas2 = () => pg({ tag: T('tecnicas2', 'TÉCNICA'), titulo: 'Bend, harmônicos e abafamento', corpo: `
<h2 class="s">Bend (para cordas de aço)</h2>
${part('tec-b', [{ n: 'D4', d: 4, t: 'b', cordaFixa: 2, bl: '1' }, { n: 'D4', d: 4 }, { r: true, d: 8 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 1 })}
<p>Na 2ª corda, casa 3 (Ré), empurre a corda até soar o Mi (bend de um tom, indicado por “1”). Em cordas de nylon o bend é difícil e pouco usado; prefira o vibrato.</p>
<h2 class="s">Harmônicos naturais</h2>
${part('tec-harm', [{ n: 'E3', d: 4, t: 'harm', cordaFixa: 6 }, { n: 'A3', d: 4, t: 'harm', cordaFixa: 5 }, { n: 'D4', d: 4, t: 'harm', cordaFixa: 4 }, { n: 'G4', d: 4, t: 'harm', cordaFixa: 3 }], { compasso: '4/4', tempo: '♩ = 60', porLinha: 1 })}
<p>Encoste o dedo sobre o traste 12 de cada corda, <b>sem apertar</b>, bem em cima do metal, e toque. Sai um som de sino, uma oitava acima da corda solta (Mi, Lá, Ré, Sol). Tire o dedo logo depois de tocar. Repare que o som é o mesmo da nota na casa 12; o que muda é o timbre. (Os harmônicos nas casas 7 e 5 soam mais agudos ainda.)</p>
<h2 class="s">Abafamento e palm mute</h2>
<ul class="lista"><li><b>Abafar com a mão direita (✕):</b> apoie a palma sobre as cordas no momento da batida e solte. Dá o estalo percussivo.</li><li><b>Abafar com a mão esquerda:</b> relaxe os dedos sobre as cordas sem apertar: a corda não soa.</li><li><b>Palm mute (PM):</b> a borda da mão direita encosta nas cordas perto do cavalete enquanto você palheta. O som fica curto e abafado. Tire o peso aos poucos até achar o ponto em que ainda dá para ouvir a nota.</li></ul>
<h2 class="s">Palhetada alternada</h2>
<p>Em notas únicas, palhete sempre <b>↓ no tempo e ↑ no “e”</b>. Treine nas cordas soltas, devagar: ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑ na 1ª corda, depois na 2ª, 3ª… subindo e descendo. Só acelere quando o movimento estiver solto.</p>
${L.dica('Dica de estudo', 'uma técnica nova por semana. se a mão doer ou travar, pare e volte amanhã com mais calma.')}` });

  const pecas = (k) => { const m = MEL[k]; return `<div class="card"><h4><span>${m.titulo}</span></h4><div class="meta">${m.origem} · tom: ${m.tom} · compasso ${m.compasso} · ${m.tempo}${m.anacruse ? ' · começa em anacruse' : ''}</div>${melodia(k)}</div>`; };
  B.melodias = () => pg({ tag: T('melodias', 'REPERTÓRIO'), titulo: 'Melodias populares', sub: 'Melodia é uma nota de cada vez. Partitura em cima, tablatura embaixo, com o ritmo exato.', corpo: `
<p>Em cada exemplo, a <b>partitura</b> mostra o ritmo e a altura; a <b>tablatura</b> mostra a corda (linha) e a casa (número). O número <b>0</b> é corda solta. As barras separam os compassos; os números pequenos em cima contam os compassos. Quando a música começa antes do tempo forte, o primeiro compasso é incompleto e se chama <b>anacruse</b>.</p>
${pecas('parabens')}${pecas('brilha')}
<p class="mut" style="font-size:10.4pt">“Parabéns pra você” em 3/4 começa com anacruse de uma semínima (a dupla “Pa-ra-béns”: colcheia pontuada + semicolcheia). As músicas desta seção são tradicionais ou de domínio público (Gruber, Pierpont, Beethoven e melodias de tradição oral); as notas foram conferidas contra as alturas das cordas e a soma dos compassos.</p>` });
  B.melodias2 = () => pg({ tag: T('melodias2', 'REPERTÓRIO'), titulo: 'Mais melodias', corpo: `${pecas('frei')}${pecas('ode')}${pecas('jingle')}` });
  B.melodias3 = () => pg({ tag: T('melodias3', 'REPERTÓRIO'), titulo: 'Noite Feliz', sub: 'Em 6/8, dois tempos “balançados” de três colcheias.', corpo: `${pecas('noite')}
<p>No 6/8, conte <b>“1 la li, 2 la li”</b>. A primeira nota de cada grupo é <b>colcheia pontuada + semicolcheia + colcheia</b> (3 + 1 + 2 semicolcheias). O final fecha em Sol, uma oitava e meia abaixo do ponto mais agudo.</p>
${L.dica('Dica de estudo', 'cante junto, baixinho, enquanto toca. o ritmo aparece sozinho. toque a melodia, depois acompanhe com os acordes G, D, Em e C.')}` });

  B.escalas = () => pg({ tag: T('escalas', 'TÉCNICA'), titulo: 'Escalas: cromática, maior e menor natural', sub: 'Escalas treinam coordenação e ensinam ao ouvido como as notas se organizam.', corpo: `
<h2 class="s">Escala cromática (uma oitava, de Mi a Mi)</h2>
${part('esc-cro', ['E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3'].map((n) => ({ n, d: 2 })).concat([{ r: true, d: 2 }, { r: true, d: 4 }]), { compasso: '4/4', tempo: '♩ = 60', porLinha: 2, nomes: true })}
<p>Todas as 12 notas, uma casa por vez: 6ª corda (casas 0 a 4), 5ª corda (casas 0 a 4) e 4ª corda (casas 0 a 2). Use um dedo por casa. A escala cromática sobe de semitom em semitom: com sustenidos subindo e bemóis descendo.</p>
<h2 class="s">Exercício de dedos 1-2-3-4</h2>
<p>Em cada corda, da 6ª à 1ª, toque as casas <b>1, 2, 3 e 4</b> com os dedos 1, 2, 3 e 4 e volte. Aquece e dá independência aos dedos. (Não é uma escala completa: pula as cordas soltas; é um exercício de coordenação.)</p>
<h2 class="s">Dó maior (uma oitava, posição aberta)</h2>
${part('esc-dom', ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'].map((n) => ({ n, d: 2 })), { compasso: '4/4', tempo: '♩ = 70', porLinha: 1, nomes: true })}
<p>De Dó (5ª corda, casa 3) a Dó (2ª corda, casa 1): <b>8 notas, uma oitava</b>. Repare no semitom entre Mi–Fá e Si–Dó: é a fórmula T T S T T T S.</p>
<h2 class="s">Extensão da escala de Dó maior até Sol</h2>
${part('esc-dom2', ['C4', 'D4', 'E4', 'F4', 'G4'].map((n) => ({ n, d: 2 })).concat([{ r: true, d: 2 }, { r: true, d: 4 }]).concat(['G4', 'F4', 'E4', 'D4', 'C4'].map((n) => ({ n, d: 2 }))).concat([{ r: true, d: 6 }]), { compasso: '4/4', tempo: '♩ = 70', porLinha: 2, nomes: true })}
<p>A primeira escala termina no Dó (oitava). Aqui você <b>continua</b> uma quinta acima, até o Sol da 1ª corda, casa 3. O exercício completo, portanto, vai de Dó a Sol (uma oitava e uma quinta): na primeira parte, Dó–Dó; na extensão, Dó–Sol.</p>` });
  B.escalas2 = () => pg({ tag: T('escalas2', 'TÉCNICA'), titulo: 'Sol maior e Lá menor natural', corpo: `
<h2 class="s">Sol maior (uma oitava)</h2>
${part('esc-sol', ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F#3', 'G3'].map((n) => ({ n, d: 2 })), { compasso: '4/4', tempo: '♩ = 70', porLinha: 1, nomes: true })}
<p>Tem um sustenido: <b>Fá♯</b>. Ótima para tocar músicas no tom de Sol.</p>
<h2 class="s">Lá menor natural (uma oitava)</h2>
${part('esc-lam', ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'].map((n) => ({ n, d: 2 })), { compasso: '4/4', tempo: '♩ = 70', porLinha: 1, nomes: true })}
<p>Mesmas notas da escala de Dó maior, começando no Lá. Fórmula do menor natural: <b>T S T T S T T</b>. Compare: o <b>Lá menor</b> é o relativo menor de Dó maior.</p>
<table class="t"><tr><th>Escala</th><th>Fórmula</th><th>Notas</th></tr><tr><td>Maior</td><td>T T S T T T S</td><td>Dó Ré Mi Fá Sol Lá Si Dó</td></tr><tr><td>Menor natural</td><td>T S T T S T T</td><td>Lá Si Dó Ré Mi Fá Sol Lá</td></tr></table>
<h2 class="s">Como a escala se liga ao tom da música</h2>
<p>A <b>fundamental</b> (primeira nota) dá o nome à escala e geralmente ao tom. Se a música usa os acordes C, F, G e Am, as notas dessas melodias vêm da escala de Dó maior (ou de Lá menor, que tem as mesmas notas). Para <b>descobrir a tonalidade</b>, veja onde a música “descansa”: o acorde final costuma ser o do tom (seção ${N('campo')}).</p>
${L.dica('Dica de estudo', 'toque com metrônomo a 60 bpm, uma nota por clique. depois desça a escala, do fim para o começo.')}` });
  B.pentatonicas = () => pg({ tag: T('pentatonicas', 'TÉCNICA'), titulo: 'Pentatônicas, blues e improvisação', sub: 'Cinco notas (ou seis) que combinam com quase tudo no tom certo.', corpo: `
<h2 class="s">Pentatônica menor de Lá (5ª casa)</h2>
${part('pent-am', [{ n: 'A2', d: 2, cordaFixa: 6 }, { n: 'C3', d: 2, cordaFixa: 6 }, { n: 'D3', d: 2, cordaFixa: 5 }, { n: 'E3', d: 2, cordaFixa: 5 }, { n: 'G3', d: 2, cordaFixa: 4 }, { n: 'A3', d: 2, cordaFixa: 4 }, { n: 'C4', d: 2, cordaFixa: 3 }, { n: 'D4', d: 2, cordaFixa: 3 }], { compasso: '4/4', tempo: '♩ = 70', porLinha: 1, nomes: true })}
<p>Notas: <b>Lá · Dó · Ré · Mi · Sol</b> (fórmula 1, ♭3, 4, 5, ♭7). A forma mais usada em solos de rock e blues. Dedo 1 na 5ª casa, dedos 3 ou 4 na 7ª e 8ª.</p>
<h2 class="s">Pentatônica maior de Dó (uma oitava)</h2>
${part('pent-c', ['C3', 'D3', 'E3', 'G3', 'A3', 'C4'].map((n) => ({ n, d: 2 })).concat([{ r: true, d: 2 }, { r: true, d: 2 }]), { compasso: '4/4', tempo: '♩ = 70', porLinha: 1, nomes: true })}
<p>Notas: <b>Dó · Ré · Mi · Sol · Lá</b> (1, 2, 3, 5, 6). Soa alegre, “country”. Relativa da pentatônica menor de Lá: as duas têm as mesmas cinco notas.</p>
<p>Em <b>Mi menor</b>, a mesma forma usa cordas soltas e as casas 2 e 3 (Mi · Sol · Lá · Si · Ré): perfeita para começar a improvisar sem pestana.</p>
<h2 class="s">Escala de blues de Lá</h2>
${part('blues-a', [{ n: 'A2', d: 2, cordaFixa: 6 }, { n: 'C3', d: 2, cordaFixa: 6 }, { n: 'D3', d: 2, cordaFixa: 5 }, { n: 'Eb3', d: 2, cordaFixa: 5 }, { n: 'E3', d: 2, cordaFixa: 5 }, { n: 'G3', d: 2, cordaFixa: 4 }, { n: 'A3', d: 2, cordaFixa: 4 }, { r: true, d: 2 }], { compasso: '4/4', tempo: '♩ = 70', porLinha: 1, nomes: true })}
<p>É a pentatônica menor com uma nota a mais: a <b>blue note</b> (♭5, aqui o Mi♭). Fórmula: 1, ♭3, 4, ♭5, 5, ♭7. Passe por ela, não pare nela.</p>
<h2 class="s">Para improvisar</h2>
<ol class="passos"><li>Escolha a escala do <b>tom da música</b> (Am → pentatônica menor de Lá).</li><li>Toque uma ideia de 2 compassos com <b>3 notas</b> e repita.</li><li>Troque o ritmo, não as notas: nota longa, curta, pausa.</li><li>Termine a frase na <b>fundamental</b> (Lá) quando o acorde for Am.</li></ol>` });

  /* ---------------- harmonia ---------------- */
  B.campo = () => pg({ tag: T('campo', 'HARMONIA'), titulo: 'Campo harmônico', sub: 'A família de acordes de um tom: nascem da mesma escala, por isso combinam.', corpo: `
<h2 class="s">Campo harmônico maior (em tríades)</h2>
<p>Em uma escala <b>maior</b>, empilhando terças sobre cada grau, a sequência é <b>maior, menor, menor, maior, maior, menor, diminuto</b>. Os números romanos marcam o grau: maiúsculo para maior, minúsculo para menor, e <b>°</b> para diminuto.</p>
<table class="t"><tr><th>Tom</th><th>I</th><th>ii</th><th>iii</th><th>IV</th><th>V</th><th>vi</th><th>vii°</th></tr>
<tr><td>C · Dó</td><td>C</td><td>Dm</td><td>Em</td><td>F</td><td>G</td><td>Am</td><td>B°</td></tr><tr><td>G · Sol</td><td>G</td><td>Am</td><td>Bm</td><td>C</td><td>D</td><td>Em</td><td>F♯°</td></tr><tr><td>D · Ré</td><td>D</td><td>Em</td><td>F♯m</td><td>G</td><td>A</td><td>Bm</td><td>C♯°</td></tr><tr><td>A · Lá</td><td>A</td><td>Bm</td><td>C♯m</td><td>D</td><td>E</td><td>F♯m</td><td>G♯°</td></tr><tr><td>E · Mi</td><td>E</td><td>F♯m</td><td>G♯m</td><td>A</td><td>B</td><td>C♯m</td><td>D♯°</td></tr><tr><td>F · Fá</td><td>F</td><td>Gm</td><td>Am</td><td>B♭</td><td>C</td><td>Dm</td><td>E°</td></tr></table>
<p class="mut" style="font-size:10.4pt">Esta fórmula vale <b>especificamente</b> para o campo harmônico <b>maior em tríades</b>. Não é uma regra universal da música: o campo menor e os modos têm outras sequências.</p>
<h2 class="s">Campo harmônico menor natural (em tríades)</h2>
<p>Na escala menor natural, a sequência é <b>i – ii° – III – iv – v – VI – VII</b>: menor, diminuto, maior, menor, menor, maior, maior.</p>
<table class="t"><tr><th>Tom</th><th>i</th><th>ii°</th><th>III</th><th>iv</th><th>v</th><th>VI</th><th>VII</th></tr>
<tr><td>Am · Lá menor</td><td>Am</td><td>B°</td><td>C</td><td>Dm</td><td>Em</td><td>F</td><td>G</td></tr><tr><td>Em · Mi menor</td><td>Em</td><td>F♯°</td><td>G</td><td>Am</td><td>Bm</td><td>C</td><td>D</td></tr><tr><td>Dm · Ré menor</td><td>Dm</td><td>E°</td><td>F</td><td>Gm</td><td>Am</td><td>B♭</td><td>C</td></tr></table>
<p>O <b>vi</b> do campo maior (por exemplo, Am em Dó maior) é o <b>i</b> do campo menor relativo (Am em Lá menor): os dois campos têm os mesmos acordes, só mudam o ponto de partida.</p>
<p>Para quem está começando, os tons mais fáceis são <b>G (Sol)</b> e <b>C (Dó)</b>. O tom de D usa F♯m e o de A usa C♯m, que são com pestana.</p>` });

  B.progressoes = () => pg({ tag: T('progressoes', 'HARMONIA'), titulo: 'Funções, progressões e blues', sub: 'Quem manda e quem obedece dentro do tom.', corpo: `
<h2 class="s">Três funções</h2>
<table class="t"><tr><th>Função</th><th>Graus</th><th>Sensação</th></tr><tr><td><b>Tônica (T)</b></td><td>I (e vi, iii)</td><td>repouso, “casa”</td></tr><tr><td><b>Subdominante (SD)</b></td><td>IV (e ii)</td><td>afasta da casa, prepara</td></tr><tr><td><b>Dominante (D)</b></td><td>V (e vii°)</td><td>tensão, pede para voltar à tônica</td></tr></table>
<h2 class="s">Progressões comuns (em Dó maior)</h2>
<table class="t"><tr><th>Graus</th><th>Em Dó</th><th>Onde aparece</th></tr><tr><td><b>I – IV – V</b></td><td>C · F · G</td><td>rock, blues, forró, sertanejo</td></tr><tr><td><b>I – V – vi – IV</b></td><td>C · G · Am · F</td><td>a mais usada do pop mundial</td></tr><tr><td><b>I – vi – IV – V</b></td><td>C · Am · F · G</td><td>a clássica dos anos 50</td></tr><tr><td><b>vi – IV – I – V</b></td><td>Am · F · C · G</td><td>começando no menor, mais melancólica</td></tr><tr><td><b>ii – V – I</b></td><td>Dm · G · C</td><td>bossa nova e jazz: leva de volta para casa</td></tr><tr><td><b>I – iii – IV – V</b></td><td>C · Em · F · G</td><td>músicas de louvor, MPB</td></tr></table>
<h2 class="s">Blues de 12 compassos</h2>
<p>Uma estrutura em <b>três linhas de 4 compassos</b>, com os acordes I, IV e V. Em Lá (com sétimas dominantes):</p>
<table class="t"><tr><th>Compassos</th><th>1</th><th>2</th><th>3</th><th>4</th></tr><tr><td>1 a 4</td><td>A7</td><td>A7</td><td>A7</td><td>A7</td></tr><tr><td>5 a 8</td><td>D7</td><td>D7</td><td>A7</td><td>A7</td></tr><tr><td>9 a 12</td><td>E7</td><td>D7</td><td>A7</td><td>E7 (virada)</td></tr></table>
<p>Toque com o shuffle (seção ${N('estilos2')}). Os acordes <b>A7, D7 e E7</b> estão no dicionário.</p>
<h2 class="s">Monte as suas progressões</h2>
<table class="t"><tr><th>Tom</th><th>Progressão (graus)</th><th>Acordes no tom</th></tr><tr><td style="height:11mm"></td><td></td><td></td></tr><tr><td style="height:11mm"></td><td></td><td></td></tr><tr><td style="height:11mm"></td><td></td><td></td></tr></table>` });

  B.transposicao = () => pg({ tag: T('transposicao', 'HARMONIA'), titulo: 'Transposição e capotraste', sub: 'Mudar o tom sem mudar a música.', corpo: `
<p><b>Transpor</b> é tocar a mesma música em outro tom. Os <b>graus</b> continuam os mesmos; só mudam os nomes dos acordes. Para transpor, escolha o campo harmônico do novo tom e troque grau por grau.</p>
<table class="t"><tr><th>Grau</th><th>I</th><th>V</th><th>vi</th><th>IV</th></tr><tr><td>Em C</td><td>C</td><td>G</td><td>Am</td><td>F</td></tr><tr><td>Em G</td><td>G</td><td>D</td><td>Em</td><td>C</td></tr><tr><td>Em D</td><td>D</td><td>A</td><td>Bm</td><td>G</td></tr></table>
<h2 class="s">Capotraste</h2>
<p>O <b>capotraste</b> prende todas as cordas em uma casa, como uma pestana móvel. Você continua tocando as <b>formas</b> que conhece, mas o som sobe: cada casa do capotraste sobe <b>um semitom</b>.</p>
<table class="t"><tr><th>Formas que você toca</th><th>Capotraste na casa</th><th>Tom que soa</th></tr><tr><td>G · D · Em · C (tom de G)</td><td>0</td><td>G</td></tr><tr><td>G · D · Em · C</td><td>2</td><td>A (2 semitons acima de G)</td></tr><tr><td>G · D · Em · C</td><td>4</td><td>B</td></tr><tr><td>C · G · Am · F (tom de C)</td><td>3</td><td>E♭ (3 semitons acima de C)</td></tr></table>
<p><b>Para descobrir a casa:</b> conte quantos semitons há entre o tom das formas e o tom que você quer. Ex.: você sabe tocar em Sol e a cantora canta em Si: Sol → Si são 4 semitons: capotraste na <b>casa 4</b>.</p>
<h2 class="s">Atividade: descubra a casa do capotraste</h2>
<table class="t"><tr><th>Forma</th><th>Tom desejado</th><th>Casa</th></tr><tr><td>tom de Sol</td><td>Lá</td><td></td></tr><tr><td>tom de Dó</td><td>Ré</td><td></td></tr><tr><td>tom de Sol</td><td>Dó</td><td></td></tr></table>
<p class="mut" style="font-size:10.4pt">Respostas: Sol → Lá = casa 2 · Dó → Ré = casa 2 · Sol → Dó = casa 5 (Sol–Dó são 5 semitons).</p>` });

  /* ---------------- rotina ---------------- */
  B.treino = () => pg({ tag: T('treino', 'TRILHA'), titulo: 'Treino progressivo', sub: 'Do zero até a primeira música completa. Faça uma ou duas etapas por dia e marque o quadradinho quando terminar.', corpo: `
<ul class="trilha">${[['Conheça as cordas', 'Toque cada corda solta e diga o nome em voz alta: Mi, Lá, Ré, Sol, Si, Mi.'], ['Primeiros acordes: Em e Am', 'Monte cada um e toque corda por corda. Todas precisam soar limpas, sem chiado.'], ['Troca Em ↔ Am', 'Só para baixo, 60 bpm, dois compassos em cada acorde. Siga os passos em câmera lenta.'], ['Os acordes C e G', 'Dois acordes que aparecem em quase toda música. Capriche na 5ª corda do C.'], ['Sequência G → C → D', 'Só para baixo a 65 bpm. Antecipe a troca no último tempo.'], ['Mão em pêndulo', 'Baixo e cima sem parar a mão, com G, D, Em e C.'], ['A batida pop', 'Agora com a batida clássica, um compasso por acorde, a 70 bpm.'], ['Primeiro dedilhado', 'p i m a em Am e depois em C. Devagar e com som limpo.'], ['Batida com abafada', 'Am, Dm e E com abafada, a 75 bpm.'], ['A pestana: F e Bm', 'Dedo 1 deitado, perto do traste. Não aperte com força, aperte no lugar certo.'], ['Desafio final', 'C, G, Am e F com batida pop a 80 bpm. Se chegou aqui, você toca violão.']].map(([t, x], i) => `<li><b>${i + 1} ${t}</b><br><span class="mut">${x}</span></li>`).join('')}</ul>
<p class="mut" style="margin-top:3mm">Terminou a trilha? Agora é repertório: escolha uma música da seção ${N('melodias')} ou uma sequência nova do campo harmônico por semana.</p>${L.caderno()}` });

  B.rotina = () => pg({ tag: T('rotina', 'TRILHA'), titulo: 'Rotina de 15 minutos', sub: 'Pouco tempo, bem usado.', corpo: `
<table class="t"><tr><th>Tempo</th><th>Bloco</th><th>O que fazer</th></tr>
<tr><td>3 min</td><td>Aquecimento</td><td>Solte punhos e ombros; escala cromática ou exercício 1-2-3-4, devagar.</td></tr>
<tr><td>4 min</td><td>Técnica</td><td>Uma técnica da semana: pestana, dedilhado, palhetada alternada ou hammer-on.</td></tr>
<tr><td>4 min</td><td>Acordes e ritmo</td><td>Uma troca de acordes com batida, no andamento em que você acerta.</td></tr>
<tr><td>4 min</td><td>Aplicação musical</td><td>Parte de uma música: melodia, sequência de acordes ou dedilhado.</td></tr></table>
<h2 class="s">Planejamento da semana</h2>
<table class="t"><tr><th>Dia</th><th>Foco</th><th>Feito</th></tr>${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((d) => `<tr><td>${d}</td><td style="height:10mm"></td><td>☐</td></tr>`).join('')}</table>
${L.dica('Descanse', 'um dia de pausa por semana também é estudo. se a mão doer, pare. dor intensa ou nas articulações não é normal: procure um profissional se continuar.')}` });

  B.dicas = () => pg({ tag: T('dicas', 'PRÁTICA'), titulo: 'Dicas práticas', sub: 'Pequenos hábitos que aceleram o aprendizado.', corpo: `
<div class="grade2">${[['Pouco e todo dia', 'Dez a quinze minutos diários rendem mais que uma maratona por semana. O cérebro consolida a memória motora entre as sessões, principalmente no sono.'], ['Devagar primeiro', 'Velocidade é consequência de precisão. Treine no tempo em que você acerta.'], ['Sensibilidade e dor', 'Nas primeiras semanas, a ponta dos dedos pode ficar sensível, pois a pele está se adaptando. Se der dor forte, dor que não passa ou dor nas articulações, pare e descanse. Não force.'], ['Ombro e pulso soltos', 'Tensão é inimiga do som. A cada poucos minutos, solte os ombros, respire e chacoalhe as mãos.'], ['Polegar atrás do braço', 'Fica atrás do braço, mais ou menos atrás do dedo médio. É apoio, não força.'], ['Afine sempre', 'Afine antes de cada treino. Violão desafinado faz o ouvido aprender errado.'], ['Grave seu progresso', 'Grave 30 segundos hoje e de novo daqui a um mês. A diferença motiva.'], ['Corte em pedacinhos', 'Travou numa troca? Treine só ela, por um minuto. O cérebro aprende melhor problemas pequenos.'], ['Cante junto', 'Cantar enquanto toca deixa o ritmo mais natural. Comece cantarolando.']].map(([t, x]) => `<div class="card"><h4>${t}</h4><p>${x}</p></div>`).join('')}</div>` });
}
