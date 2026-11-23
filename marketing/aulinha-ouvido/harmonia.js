// Parte 3 do caderno intermediário: HARMONIA (16 páginas) + integração (3 páginas).
import { pauta, piano, caixa, tabela, fala, lin, cx, acordeBox, braco, grade } from './lib.js';
import * as T from './teoria.js';
import { ps, seq } from './melodia.js';

const nomeLetra = (s) => { const m = /^([A-G])(#*|b*)/.exec(s); return `${T.SOLFA[m[1]]}${m[2].includes('#') ? '♯'.repeat(m[2].length) : m[2].includes('b') ? '♭'.repeat(m[2].length) : ''}`; };
const lst = (notas) => notas.map(T.ptmin).join(' ');
const nomes = (l) => l.map(nomeLetra).join(' ');
const cif = (r, t) => T.nomeAcorde(r, t);
/** Acorde empilhado numa pauta: devolve as notas com oitava subindo, a partir de oitava o. */
const empilha = (notas, o = 4) => seq(notas, o);
const col = (notas, o = 4) => empilha(notas, o);
const TIPOS3 = ['maj', 'min', 'dim', 'aug'];

export function paginas(ex) {
  const P = []; const S = 'harmonia';

  /* 33 tríades */
  const exTri = [['F#', 'min'], ['Bb', 'maj'], ['E', 'dim'], ['G', 'aug'], ['A', 'min'], ['Eb', 'maj'], ['D', 'dim'], ['C#', 'min']];
  P.push({ secao: S, titulo: '1 · tríades', html: `<h2>Tríades: os 4 tipos</h2>${fala('paul-teclado', 'uma <b>tríade</b> é um acorde de <b>3 notas</b> empilhadas de 3ª em 3ª: fundamental, 3ª e 5ª. o tipo depende do tamanho das duas "terças" empilhadas.')}
${caixa('as 4 tríades a partir de Dó', pauta({ clef: 'sol', acordes: TIPOS3.map((t) => col(T.acorde('C', t), 4)), rotulos: ['C', 'Cm', 'C°', 'C+'], w: 640 }))}
${caixa('fórmulas', tabela(['tipo', 'cifra', '3ª', '5ª', 'notas em Dó', 'sensação'], [['maior', 'C', '3ª maior', '5ª justa', lst(T.acorde('C', 'maj')), 'alegre, estável'], ['menor', 'Cm', '3ª menor', '5ª justa', lst(T.acorde('C', 'min')), 'triste, estável'], ['diminuta', 'C°', '3ª menor', '5ª diminuta', lst(T.acorde('C', 'dim')), 'tensa, instável'], ['aumentada', 'C+', '3ª maior', '5ª aumentada', lst(T.acorde('C', 'aug')), 'misteriosa, suspensa']]))}
${caixa('empilhando terças (em semitons)', tabela(['tipo', '1ª → 3ª', '3ª → 5ª', 'total'], [['maior', '4 (3ª maior)', '3 (3ª menor)', '7'], ['menor', '3 (3ª menor)', '4 (3ª maior)', '7'], ['diminuta', '3 (3ª menor)', '3 (3ª menor)', '6'], ['aumentada', '4 (3ª maior)', '4 (3ª maior)', '8']]))}
${ex('H', 'monte as tríades (nome das notas)', tabela(['acorde', 'fundamental', '3ª', '5ª'], exTri.map(([r, t]) => [`<b>${cif(r, t)}</b>`, '', '', ''])), exTri.map(([r, t]) => `${cif(r, t)}: ${lst(T.acorde(r, t))}`).join('<br>'), 'use a grafia certa: fá♯ menor tem lá e dó♯ (letras F A C).')}` });

  /* 34 todos os tons */
  const RS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const exT = [['D', 'dim'], ['G', 'aug'], ['B', 'dim'], ['Eb', 'aug']];
  P.push({ secao: S, titulo: '2 · tríades nos 12 tons', html: `<h2>Tríades nos 12 tons</h2>${fala('paul-pad-metronomo'.replace('pad-metronomo', 'estudando'), 'treinar as tríades em <b>todos os tons</b> é a base da harmonia no teclado e no violão. cada linha da tabela é uma tônica.')}
${caixa('maiores e menores', tabela(['fundamental', 'maior', 'menor'], RS.map((r) => [`<b>${T.pt(T.N(r))}</b>`, lst(T.acorde(r, 'maj')), lst(T.acorde(r, 'min'))]), 'gab'))}
${caixa('diminutas e aumentadas (exemplos)', tabela(['fundamental', 'diminuta', 'aumentada'], ['C', 'D', 'E', 'F#'].map((r) => [`<b>${T.pt(T.N(r))}</b>`, lst(T.acorde(r, 'dim')), lst(T.acorde(r, 'aug'))]), 'gab') + '<p class="peq">a tríade <b>aumentada</b> é simétrica: C+, E+ e G♯+ têm as mesmas notas.</p>')}
${ex('H', 'complete', tabela(['acorde', 'notas'], exT.map(([r, t]) => [`<b>${cif(r, t)}</b>`, ''])), exT.map(([r, t]) => `${cif(r, t)}: ${lst(T.acorde(r, t))}`).join(' · '), 'diminuta: 3ª menor e 5ª diminuta. aumentada: 3ª maior e 5ª aumentada.')}` });

  /* 35 cifras */
  const tab = [['C', 'maj', 'maior'], ['Cm', 'min', 'menor'], ['C° ou Cdim', 'dim', 'diminuta'], ['C+ ou Caug', 'aug', 'aumentada'], ['Csus4', 'sus4', 'suspensa (4ª no lugar da 3ª)'], ['Csus2', 'sus2', 'suspensa (2ª no lugar da 3ª)'], ['C6', 6, 'maior com 6ª'], ['Cm6', 'm6', 'menor com 6ª'], ['Cadd9', 'add9', 'maior com 9ª (sem 7ª)'], ['C7', 7, 'dominante (7ª menor)'], ['Cmaj7 ou C△', 'maj7', '7ª maior'], ['Cm7', 'm7', 'menor com 7ª menor'], ['Cm7(♭5) ou Cø', 'm7b5', 'meio-diminuto'], ['C°7', 'dim7', 'diminuto com 7ª diminuta']];
  const exC = [['Bb', 'min'], ['F#', 7], ['D', 'sus4'], ['G', 'maj7'], ['Ab', 'maj'], ['E', 'm7b5']];
  const rev = [['A', 'min'], ['B', 'dim'], ['D', 7]];
  P.push({ secao: S, titulo: '3 · cifras', html: `<h2>Cifras e nomenclatura</h2>${fala('paul-violao'.replace('violao', 'guitarra'), 'a <b>cifra</b> é o "nome" do acorde em letras: <b>C D E F G A B</b> = dó ré mi fá sol lá si. o que vem depois da letra diz a qualidade e as notas extras.')}
${caixa('símbolos a partir de Dó', tabela(['cifra', 'notas', 'nome'], tab.map(([n, t, d]) => [`<b>${n}</b>`, lst(T.acorde('C', t)), d]), 'gab'))}
${ex('H', 'cifra → notas', tabela(['cifra', 'notas'], exC.map(([r, t]) => [`<b>${cif(r, t)}</b>`, ''])), exC.map(([r, t]) => `${cif(r, t)}: ${lst(T.acorde(r, t))}`).join('<br>'), 'sustenido/bemol depois da letra altera a fundamental: F♯ = fá♯.')}
${ex('H', 'notas → cifra', tabela(['notas', 'cifra'], rev.map(([r, t]) => [lst(T.acorde(r, t)), ''])), rev.map(([r, t]) => `${lst(T.acorde(r, t))} → ${cif(r, t)}`).join(' · '), 'descubra o 1º grau (a nota "de baixo" das terças) e veja o tipo.')}` });

  /* 36 campo harmônico maior */
  const cm = T.campo('C');
  const exCh = ['G', 'F', 'D'];
  P.push({ secao: S, titulo: '4 · campo harmônico maior', html: `<h2>Campo harmônico maior</h2>${fala('paul-teclado', 'o <b>campo harmônico</b> é o conjunto de acordes formados <b>só com as notas da escala</b>. empilhe 3ª em 3ª sobre cada grau e saem 7 acordes!')}
${caixa('campo harmônico de Dó maior', pauta({ clef: 'sol', acordes: cm.map((c) => col(c.notasTri, 4)), rotulos: cm.map((c) => c.nomeTri), w: 640 }) + `<p class="peq">os algarismos romanos: <b>maiúsculo</b> = acorde maior, <b>minúsculo</b> = menor, <b>°</b> = diminuto.</p>`)}
${caixa('a tabela', tabela(['grau', 'romano', 'acorde', 'notas', 'função'], cm.map((c) => [c.grau, `<span class="rom">${c.romano}</span>`, `<b>${c.nomeTri}</b>`, lst(c.notasTri), { T: 'tônica', S: 'subdominante', D: 'dominante' }[c.func]]), 'gab'))}
${caixa('o padrão que vale pra TODO tom maior', '<p><b>I maior · ii menor · iii menor · IV maior · V maior · vi menor · vii°</b> diminuto. decore esse padrão: ele não muda!</p>')}
${ex('H', 'monte o campo harmônico (tríades)', tabela(['tom', 'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], exCh.map((r) => [`<b>${T.pt(T.N(r))} maior</b>`, '', '', '', '', '', '', ''])), exCh.map((r) => `${T.pt(T.N(r))} maior: ${T.campo(r).map((c) => c.nomeTri).join(' · ')}`).join('<br>'), 'ache a escala primeiro (G tem fá♯) e depois decida maior/menor pelo padrão.')}` });

  /* 37 todos os tons */
  const lista = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb']; const faltam = ['B', 'Ab', 'Db'];
  P.push({ secao: S, titulo: '5 · campos harmônicos', html: `<h2>Campo harmônico nos tons</h2>${fala('paul-estudando', 'conhecendo o padrão, dá pra montar o campo harmônico em <b>qualquer tom</b>. veja os mais usados e depois complete os que faltam.')}
${caixa('tons maiores (tríades)', tabela(['tom', 'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], lista.map((r) => [`<b>${T.cifra(T.N(r))}</b>`, ...T.campo(r).map((c) => c.nomeTri)]), 'gab'))}
${caixa('dica', '<p class="peq">compare <b>I, IV e V</b>: são os 3 acordes "principais" (tônica, subdominante e dominante). com só eles dá pra tocar centenas de músicas!</p>')}
${ex('H', 'complete os tons que faltam', tabela(['tom', 'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], faltam.map((r) => [`<b>${T.cifra(T.N(r))}</b>`, '', '', '', '', '', '', ''])), faltam.map((r) => `${T.cifra(T.N(r))}: ${T.campo(r).map((c) => c.nomeTri).join(' · ')}`).join('<br>'), 'Si maior tem 5 sustenidos; Lá♭ maior tem 4 bemóis; Ré♭ maior tem 5 bemóis.')}` });

  /* 38 campo menor */
  const campN = T.campo('A', 'menor'); const campH = T.campo('A', 'menorHarm');
  const exMn = [['E', 'menor'], ['D', 'menorHarm'], ['B', 'menor']];
  P.push({ secao: S, titulo: '6 · campo harmônico menor', html: `<h2>Campo harmônico menor</h2>${fala('paul-guitarra', 'na tonalidade menor o campo harmônico muda conforme a escala. a <b>harmônica</b> é a mais usada porque cria o <b>V maior</b> (com sensível) que resolve fortemente no i.')}
${caixa('lá menor natural × harmônica (tríades)', tabela(['grau', 'natural', 'função', 'harmônica', 'diferença'], campN.map((c, i) => [`<span class="rom">${c.romano}</span> / <span class="rom">${campH[i].romano}</span>`, `<b>${c.nomeTri}</b>`, { T: 'tônica', S: 'subdom.', D: 'dominante' }[campH[i].func], `<b>${campH[i].nomeTri}</b>`, c.nomeTri === campH[i].nomeTri ? '—' : 'muda!']), 'gab') + '<p class="peq">a 7ª nota (sol♯) altera três acordes: <b>III</b> vira aumentado (C+), <b>V</b> vira maior (E) e <b>vii°</b> vira diminuto (G♯°).</p>')}
${caixa('progressões em menor (as mais comuns)', tabela(['graus', 'em Lá menor'], [['i – iv – V', T.progressao('A', [1, 4, 5], 'menorHarm').join(' – ')], ['i – VI – III – VII', T.progressao('A', [1, 6, 3, 7], 'menor').join(' – ')], ['i – VII – VI – V', T.progressao('A', [1, 7, 6, 5], 'menorHarm').join(' – ')], ['ii° – V – i', T.progressao('A', [2, 5, 1], 'menorHarm').join(' – ')]], 'l'))}
${ex('H', 'monte o campo harmônico (tríades)', tabela(['tom', 'i', 'ii°', 'III', 'iv', 'v/V', 'VI', 'VII'], exMn.map(([r, m]) => [`<b>${T.pt(T.N(r))} menor ${m === 'menorHarm' ? 'harm.' : 'natural'}</b>`, '', '', '', '', '', '', ''])), exMn.map(([r, m]) => `${T.pt(T.N(r))} menor ${m === 'menorHarm' ? 'harm.' : 'natural'}: ${T.campo(r, m).map((c) => c.nomeTri).join(' · ')}`).join('<br>'), 'natural: i, ii°, III, iv, v, VI, VII. harmônica: o V vira maior, III aumentado e vii° diminuto.')}` });

  /* 39 funções */
  const campG = T.campo('G');
  P.push({ secao: S, titulo: '7 · funções tonais', html: `<h2>Funções tonais: tônica, subdominante, dominante</h2>${fala('paul-pandeiro'.replace('pandeiro', 'ensinando'), 'os acordes têm <b>papéis</b> na música. alguns dão <b>repouso</b>, outros criam <b>tensão</b> e pedem pra voltar. entender isso é a chave pra criar progressões!')}
${caixa('as 3 funções', tabela(['função', 'sensação', 'acordes (em Dó)', 'graus'], [['<b>T</b> tônica', 'repouso, casa', `${cm[0].nomeTri} (principal) · ${cm[5].nomeTri} · ${cm[2].nomeTri}`, 'I · vi · iii'], ['<b>S</b> subdominante', 'afastar-se, preparar', `${cm[3].nomeTri} (principal) · ${cm[1].nomeTri}`, 'IV · ii'], ['<b>D</b> dominante', 'tensão que pede resolução', `${cm[4].nomeTri} (principal) · ${cm[6].nomeTri}`, 'V · vii°']]))}
${caixa('o ciclo natural', '<p style="text-align:center;font:400 22px Anton">T &nbsp;→&nbsp; S &nbsp;→&nbsp; D &nbsp;→&nbsp; T</p><p class="peq">repouso → afastar → tensão → volta pra casa. ex.: <b>C – F – G – C</b>. o <b>V → I</b> é a "volta pra casa" mais forte (a 7ª do dominante pede resolução).</p>')}
${caixa('por que funciona', '<p class="peq">o acorde de <b>dominante</b> (V) contém a <b>sensível</b> (7ª nota da escala), que fica a ½ tom da tônica e "puxa" pra ela. em Dó: o <b>si</b> do G puxa para o <b>dó</b> do C.</p>')}
${ex('H', 'dê a função de cada acorde em Sol maior (T, S ou D)', tabela(['acorde', 'grau', 'função'], campG.map((c) => [`<b>${c.nomeTri}</b>`, `<span class="rom">${c.romano}</span>`, ''])), campG.map((c) => `${c.nomeTri} = ${c.func}`).join(' · '), 'I, vi, iii = T · IV, ii = S · V, vii° = D.')}` });

  /* 40 cadências */
  const cad = [['autêntica (perfeita)', [5, 1], 'V → I: a mais conclusiva, como um ponto final.'], ['plagal ("amém")', [4, 1], 'IV → I: suave, como o "amém" das igrejas.'], ['meia-cadência', [1, 5], 'termina no V: soa como uma vírgula, deixa em suspense.'], ['deceptiva (de engano)', [5, 6], 'V → vi: promete o I mas "engana" com o vi.']];
  const seqs = [['G', 'C'], ['F', 'C'], ['C', 'G'], ['G', 'Am'], ['Dm', 'G'], ['Am', 'G']];
  const idf = (a) => { const b = a.map((n) => cm.findIndex((c) => c.nomeTri === n) + 1); if (b[1] === 1 && b[0] === 5) return 'autêntica'; if (b[1] === 1 && b[0] === 4) return 'plagal'; if (b[1] === 5) return 'meia-cadência'; if (b[0] === 5 && b[1] === 6) return 'deceptiva'; return '—'; };
  P.push({ secao: S, titulo: '8 · cadências', html: `<h2>Cadências: finais de frase</h2>${fala('paul-sax', 'a <b>cadência</b> é a fórmula de dois acordes que <b>fecha</b> uma frase musical, como a pontuação de um texto: ponto final, vírgula, interrogação...')}
${caixa('as 4 cadências principais (em Dó maior)', `<div class="mini">${cad.map(([n, g, d]) => `<div class="caixa"><h3>${n}</h3>${pauta({ clef: 'sol', acordes: g.map((x) => col(cm[x - 1].notasTri, 4)), rotulos: g.map((x) => cm[x - 1].nomeTri), w: 380, h: 152 })}<p class="peq">${d}</p></div>`).join('')}</div>`)}
${caixa('nos outros tons', tabela(['tom', 'autêntica V → I', 'plagal IV → I', 'meia → V', 'deceptiva V → vi'], ['G', 'D', 'A', 'F', 'Bb'].map((r) => { const c = T.campo(r); return [`<b>${T.cifra(T.N(r))}</b>`, `${c[4].nomeTri} → ${c[0].nomeTri}`, `${c[3].nomeTri} → ${c[0].nomeTri}`, `${c[0].nomeTri} → ${c[4].nomeTri}`, `${c[4].nomeTri} → ${c[5].nomeTri}`]; }), 'gab'))}
${ex('H', 'que cadência é? (tom de Dó maior)', tabela(['acordes', 'cadência'], seqs.map((s) => [`<b>${s.join(' → ')}</b>`, ''])), seqs.map((s) => `${s.join(' → ')}: ${idf(s)}`).join(' · '), 'olhe o acorde final: I = conclusiva (autêntica/plagal); V = meia; vi depois do V = deceptiva.')}` });

  /* 41 tétrades */
  const tet = [['7', 7, 'dominante', 'tensa, "bluesy"'], ['maj7', 'maj7', '7ª maior', 'suave, sofisticada'], ['m7', 'm7', 'menor com 7ª', 'melancólica, "jazz"'], ['m7(♭5)', 'm7b5', 'meio-diminuto', 'tensa, escura'], ['°7', 'dim7', 'diminuto', 'muito instável']];
  const exTe = [['D', 7], ['F', 'maj7'], ['B', 'm7'], ['G', 'm7b5'], ['Eb', 'maj7'], ['A', 7]];
  P.push({ secao: S, titulo: '9 · tétrades', html: `<h2>Tétrades: acordes com 7ª</h2>${fala('paul-teclado', 'somando mais uma terça por cima da tríade ganhamos a <b>7ª</b>: o acorde de <b>4 notas</b> (<b>tétrade</b>), muito usado em jazz, bossa nova e MPB.')}
${caixa('as 5 tétrades a partir de Dó', pauta({ clef: 'sol', acordes: tet.map(([, t]) => col(T.acorde('C', t), 4)), rotulos: tet.map(([c]) => `C${c}`), w: 640 }))}
${caixa('fórmulas', tabela(['cifra', 'nome', 'tríade + 7ª', 'notas', 'sensação'], tet.map(([c, t, n, s]) => { const base = { 7: 'maior + 7ª menor', maj7: 'maior + 7ª maior', m7: 'menor + 7ª menor', m7b5: 'diminuta + 7ª menor', dim7: 'diminuta + 7ª diminuta' }[t]; return [`<b>C${c}</b>`, n, base, lst(T.acorde('C', t)), s]; }), 'gab'))}
${ex('H', 'monte as tétrades', tabela(['acorde', 'notas'], exTe.map(([r, t]) => [`<b>${cif(r, t)}</b>`, ''])), exTe.map(([r, t]) => `${cif(r, t)}: ${lst(T.acorde(r, t))}`).join('<br>'), 'primeiro a tríade, depois a 7ª (menor = 2 tons e meio abaixo... ou 1 tom abaixo da tônica oitavada).')}` });

  /* 42 campo com tétrades + ii-V-I */
  const c4 = T.campo('C'); const tons = ['C', 'G', 'D', 'A', 'F', 'Bb', 'Eb', 'Ab'];
  const iiVI = (r) => { const c = T.campo(r); return [c[1].nomeTet, c[4].nomeTet, c[0].nomeTet]; };
  const exI = ['E', 'Db', 'B'];
  P.push({ secao: S, titulo: '10 · campo com tétrades e ii–V–I', html: `<h2>Campo harmônico com tétrades e o ii–V–I</h2>${fala('paul-ouvindo-musica', 'com 7ª o campo ganha novos "sabores". e a progressão <b>ii – V – I</b> é a mais importante do jazz e da bossa nova!')}
${caixa('campo de Dó maior com tétrades', tabela(['grau', '<span class="rom">I</span>', '<span class="rom">ii</span>', '<span class="rom">iii</span>', '<span class="rom">IV</span>', '<span class="rom">V</span>', '<span class="rom">vi</span>', '<span class="rom">vii</span>'], [['acorde', ...c4.map((c) => `<b>${c.nomeTet}</b>`)], ['tipo', 'maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7(♭5)'], ['função', ...c4.map((c) => c.func)]]) + '<p class="peq">repare: só o <b>V</b> é dominante (7); I e IV são maj7; ii, iii, vi são m7; vii é meio-diminuto.</p>')}
${caixa('o ii – V – I em vários tons', tabela(['tom', 'ii (m7)', 'V (7)', 'I (maj7)'], tons.map((r) => [`<b>${T.cifra(T.N(r))}</b>`, ...iiVI(r)]), 'gab') + '<p class="peq">dá pra ouvir a "puxada": o <b>7</b> do V (fá em G7) desce meio tom pro <b>mi</b> do Cmaj7, a 3ª do I.</p>')}
${ex('H', 'escreva o ii – V – I nos tons', tabela(['tom', 'ii', 'V', 'I'], exI.map((r) => [`<b>${T.pt(T.N(r))} maior</b>`, '', '', ''])), exI.map((r) => `${T.pt(T.N(r))}: ${iiVI(r).join(' – ')}`).join('<br>'), 'monte o campo do tom e pegue os graus 2, 5 e 1.')}` });

  /* 43 inversões */
  const cinv = T.acorde('C', 'maj'); const invs = [0, 1, 2].map((k) => T.inversao(cinv, k));
  const nomesInv = ['fundamental', '1ª inversão', '2ª inversão'];
  const exInv = [['F', 'maj', 1], ['G', 'maj', 1], ['A', 'min', 1], ['D', 'maj', 2], ['E', 'min', 2], ['Bb', 'maj', 1]];
  const slash = (r, t, k) => { const nn = T.acorde(r, t); return `${cif(r, t)}/${T.cifra(nn[k])}`; };
  P.push({ secao: S, titulo: '11 · inversões e baixo', html: `<h2>Inversões e acordes com baixo</h2>${fala('paul-baixo', 'as notas do acorde podem ser tocadas em <b>outra ordem</b>. a nota mais grave (o <b>baixo</b>) define a <b>inversão</b>. isso suaviza as ligações entre os acordes!')}
${caixa('as inversões de Dó maior', pauta({ clef: 'sol', acordes: invs.map((l, k) => empilha(l, 4)), rotulos: ['C', 'C/E', 'C/G'], w: 640 }) + tabela(['posição', 'nota no baixo', 'notas (de baixo pra cima)', 'cifra'], invs.map((l, k) => [nomesInv[k], T.ptmin(l[0]), lst(l), ['C', 'C/E', 'C/G'][k]]), 'gab'))}
${caixa('cifra com barra (slash chord)', '<p><b>C/E</b> lê-se "dó com baixo em mi": o acorde é dó maior, mas o <b>baixo toca mi</b>. a nota depois da barra é sempre a nota do baixo.</p><p class="peq">usos: <b>linha de baixo descendo</b> (C – G/B – Am – Am/G – F …) e acordes com a nota do baixo fixa (<b>pedal</b>).</p>')}
${ex('H', 'escreva as notas e a cifra com barra', tabela(['acorde', 'inversão', 'notas (baixo → agudo)', 'cifra com barra'], exInv.map(([r, t, k]) => [`<b>${cif(r, t)}</b>`, k === 1 ? '1ª' : '2ª', '', ''])), exInv.map(([r, t, k]) => `${cif(r, t)} (${k}ª inversão): ${lst(T.inversao(T.acorde(r, t), k))} → ${slash(r, t, k)}`).join('<br>'), '1ª inversão: a 3ª vai pro baixo. 2ª inversão: a 5ª vai pro baixo.')}` });

  /* 44 progressões */
  const prog = [['I – V – vi – IV', [1, 5, 6, 4], 'a mais famosa do pop (dezenas de hits)'], ['vi – IV – I – V', [6, 4, 1, 5], 'a mesma, começando pelo vi (versão "emotiva")'], ['I – vi – IV – V', [1, 6, 4, 5], 'doo-wop, anos 50'], ['I – IV – V – I', [1, 4, 5, 1], 'rock e folk básicos'], ['ii – V – I', [2, 5, 1], 'jazz, bossa nova'], ['I – IV – I – V', [1, 4, 1, 5], 'forró, country']];
  const tonsP = ['C', 'G', 'D', 'A', 'E', 'F'];
  const blues = (r) => { const c = T.campo(r); const I = c[0].nomeTri; const IV = c[3].nomeTri; const V = c[4].nomeTri; return [I, I, I, I, IV, IV, I, I, V, IV, I, V]; };
  const exP = [['D', [6, 4, 1, 5]], ['Bb', [1, 5, 6, 4]], ['E', [1, 6, 4, 5]]];
  P.push({ secao: S, titulo: '12 · progressões famosas', html: `<h2>Progressões famosas e o blues de 12 compassos</h2>${fala('paul-guitarra', 'agora é juntar tudo! uma <b>progressão</b> é uma sequência de acordes. escrita em graus (algarismos romanos), vale pra <b>qualquer tom</b>.')}
${caixa('as progressões mais usadas', tabela(['graus', 'em Dó', 'em Sol', 'em Ré', 'onde se ouve'], prog.map(([n, g, d]) => [`<b>${n}</b>`, T.progressao('C', g).join(' '), T.progressao('G', g).join(' '), T.progressao('D', g).join(' '), d]), 'gab'))}
${caixa('blues de 12 compassos (4 por linha)', tabela(null, [0, 1, 2].map((l) => blues('A').slice(l * 4, l * 4 + 4).map((a, i) => `<b>${a}</b>`)), '') + `<p class="peq">em <b>Lá</b>: I I I I | IV IV I I | V IV I V. a estrutura base do blues e do rock'n'roll. em <b>Mi</b>: ${blues('E').join(' ')}.</p>`)}
${ex('H', 'transponha as progressões', tabela(['tom', 'graus', 'acordes'], exP.map(([r, g]) => [`<b>${T.pt(T.N(r))} maior</b>`, g.map((x) => ['I', 'ii', 'iii', 'IV', 'V', 'vi'][x - 1]).join(' – '), ''])), exP.map(([r, g]) => `${T.pt(T.N(r))}: ${T.progressao(r, g).join(' – ')}`).join('<br>'), 'monte o campo do tom e escolha os graus pedidos.')}` });

  /* 45 violão: acordes com 7ª */
  const BX = [['C7', [-1, 3, 2, 3, 1, 0]], ['D7', [-1, -1, 0, 2, 1, 2]], ['E7', [0, 2, 0, 1, 0, 0]], ['G7', [3, 2, 0, 0, 0, 1]], ['A7', [-1, 0, 2, 0, 2, 0]], ['B7', [-1, 2, 1, 2, 0, 2]], ['Am7', [-1, 0, 2, 0, 1, 0]], ['Dm7', [-1, -1, 0, 2, 1, 1]], ['Em7', [0, 2, 0, 0, 0, 0]], ['Cmaj7', [-1, 3, 2, 0, 0, 0]], ['Fmaj7', [-1, -1, 3, 2, 1, 0]], ['Gmaj7', [3, 2, 0, 0, 0, 2]]];
  const exV = [['A', 'm7'], ['D', 7], ['C', 'maj7']];
  P.push({ secao: S, titulo: '13 · violão: acordes com 7ª', html: `<h2>Violão: acordes com sétima</h2>${fala('paul-guitarra', 'os acordes com 7ª dão mais "cor" à harmonia. veja as formas abertas mais usadas (● = dedo, ○ = corda solta, × = não toca) e depois toque o ii – V – I em Dó.')}
${caixa('formas abertas', `<div class="tres" style="grid-template-columns:repeat(4,1fr);gap:2mm">${BX.map(([n, c]) => acordeBox(n, c)).join('')}</div>`)}
${caixa('treino sugerido (ii – V – I e cadências)', '<p>• <b>Dm7 – G7 – Cmaj7</b> (ii–V–I em Dó)<br>• <b>Am7 – D7 – Gmaj7</b> (ii–V–I em Sol)<br>• <b>Em7 – A7 – Dm7 – G7 – Cmaj7</b> (cadeia de dominantes)<br>• <b>Cmaj7 – Am7 – Dm7 – G7</b> (volta clássica)</p><p class="peq">dica: troque de acorde <b>sem parar o pulso</b>. comece em ♩ = 60 e suba de 10 em 10.</p>')}
${ex('H', 'quais notas formam estes acordes? (confira cada nota nas cordas)', tabela(['acorde', 'notas'], exV.map(([r, t]) => [`<b>${cif(r, t)}</b>`, ''])), exV.map(([r, t]) => `${cif(r, t)}: ${lst(T.acorde(r, t))}`).join(' · '), 'Cmaj7 = dó mi sol si · D7 = ré fá♯ lá dó · Am7 = lá dó mi sol.')}` });

  /* 46 violão: escalas */
  const pm = [{ s: 6, f: 5, t: 'A', raiz: 1 }, { s: 6, f: 8, t: 'C' }, { s: 5, f: 5, t: 'D' }, { s: 5, f: 7, t: 'E' }, { s: 4, f: 5, t: 'G' }, { s: 4, f: 7, t: 'A', raiz: 1 }, { s: 3, f: 5, t: 'C' }, { s: 3, f: 7, t: 'D' }, { s: 2, f: 5, t: 'E' }, { s: 2, f: 8, t: 'G' }, { s: 1, f: 5, t: 'A', raiz: 1 }, { s: 1, f: 8, t: 'C' }];
  const bl = pm.concat([{ s: 5, f: 6, t: 'E♭' }, { s: 3, f: 8, t: 'E♭' }]);
  const cmA = [{ s: 6, f: 0, t: 'E' }, { s: 6, f: 1, t: 'F' }, { s: 6, f: 3, t: 'G' }, { s: 5, f: 0, t: 'A' }, { s: 5, f: 2, t: 'B' }, { s: 5, f: 3, t: 'C', raiz: 1 }, { s: 4, f: 0, t: 'D' }, { s: 4, f: 2, t: 'E' }, { s: 4, f: 3, t: 'F' }, { s: 3, f: 0, t: 'G' }, { s: 3, f: 2, t: 'A' }, { s: 3, f: 4, t: 'B' }, { s: 2, f: 0, t: 'B' }, { s: 2, f: 1, t: 'C', raiz: 1 }, { s: 2, f: 3, t: 'D' }, { s: 1, f: 0, t: 'E' }, { s: 1, f: 1, t: 'F' }, { s: 1, f: 3, t: 'G' }];
  P.push({ secao: S, titulo: '14 · violão: escalas', html: `<h2>Escalas no violão</h2>${fala('paul-guitarra', 'o braço é uma "pauta" de 6 cordas: cada casa sobe <b>meio tom</b>. as <b>formas</b> de escala se repetem em qualquer posição: aprenda a forma e mova pelo braço!')}
${caixa('pentatônica menor de Lá (forma 1, casas 5–8)', braco({ de: 4, ate: 8, marks: pm }) + '<p class="peq">● preto = a tônica (lá). comece pela corda mais grave e toque as notas em ordem, subindo pelas cordas. a mesma forma na casa 8 vira <b>dó menor</b>.</p>')}
${caixa('blues de Lá (pentatônica + ♭5)', braco({ de: 4, ate: 8, marks: bl }) + '<p class="peq">a nota <b>azul</b> (blue note) é o <b>mi♭</b> (♭5), na casa 6 da corda lá e na casa 8 da corda sol. "passe" por ela sem parar: ela dá a cor do blues.</p>')}
${caixa('Dó maior em posição aberta (casas 0–4)', braco({ de: 0, ate: 4, marks: cmA }) + '<p class="peq">3 notas por corda, na casa solta e nas casas 1 a 4. os pontos ● pretos são as tônicas (dó).</p>')}
${caixa('treino', '<p class="peq">toque cada escala <b>subindo e descendo</b> em colcheias ♩ = 60, depois 80. marque: ' + cx('penta menor') + cx('blues') + cx('Dó maior') + '</p>')}` });

  /* 47 dominantes secundários e empréstimo */
  const dsec = [['V/ii', 2], ['V/iii', 3], ['V/IV', 4], ['V/V', 5], ['V/vi', 6]];
  const secD = (r) => dsec.map(([n, g]) => { const alvo = T.campo(r)[g - 1]; const dom = T.dominanteDe(alvo.nota); return [n, cif(dom, 7), alvo.nomeTri]; });
  const emp = (r) => { const m = T.campo(r, 'menor'); return [['iv', m[3].nomeTri], ['♭III', m[2].nomeTri], ['♭VI', m[5].nomeTri], ['♭VII', m[6].nomeTri]]; };
  const exD = ['G', 'D'];
  P.push({ secao: S, titulo: '15 · dominantes secundários e empréstimo modal', html: `<h2>Dominantes secundários e empréstimo modal</h2>${fala('paul-oculos', 'pra enriquecer a harmonia dá pra "pedir emprestado" acordes de fora do campo. dois recursos clássicos: os <b>dominantes secundários</b> e o <b>empréstimo modal</b>.')}
${caixa('dominante secundário = o V7 de outro grau', `<p>qualquer acorde do campo pode ganhar o <b>seu próprio dominante</b> (um acorde 7 a uma 5ª acima), que "puxa" pra ele. em Dó maior:</p>${tabela(['nome', 'acorde', 'resolve em'], secD('C'), 'gab')}<p class="peq">ex.: <b>C – A7 – Dm – G7 – C</b>: o A7 (V/ii) puxa pro Dm.</p>`)}
${caixa('empréstimo modal = acordes da tonalidade menor homônima', `<p>em Dó maior podemos "tomar" acordes de <b>Dó menor</b> (mesma tônica):</p>${tabela(['grau', 'acorde (de Dó menor)'], emp('C'), 'gab')}<p class="peq">o mais usado é o <b>iv menor</b> (Fm) e o <b>♭VII</b> (B♭): soam "épicos" e "nostálgicos".</p>`)}
${ex('H', 'dominantes secundários e empréstimo em outros tons', tabela(['tom', 'V/V', 'V/vi', 'iv (empréstimo)', '♭VII (empréstimo)'], exD.map((r) => [`<b>${T.pt(T.N(r))} maior</b>`, '', '', '', ''])), exD.map((r) => { const s = secD(r); const e = emp(r); return `${T.pt(T.N(r))}: V/V = ${s[3][1]} · V/vi = ${s[4][1]} · iv = ${e[0][1]} · ♭VII = ${e[3][1]}`; }).join('<br>'), 'V/x = 7 uma 5ª acima do acorde x. o empréstimo vem do campo menor natural do mesmo tom.')}` });

  /* 48 harmonizando uma melodia */
  const mel = [['C4', 'E4', 'G4', 'E4'], ['F4', 'A4', 'C5', 'A4'], ['G4', 'B4', 'D5', 'B4'], ['E4', 'G4', 'C5', 'C5']];
  const opc = ['C', 'Dm', 'Em', 'F', 'G', 'Am'].map((n) => cm.find((c) => c.nomeTri === n));
  const melhor = (b) => { let best = null; let bs = -1; opc.forEach((c) => { const letras = new Set(c.notasTri.map((x) => T.LET[x.l] + (x.a > 0 ? '#' : x.a < 0 ? 'b' : ''))); const sc = b.filter((n) => letras.has(n.replace(/\d/, ''))).length; if (sc > bs) { bs = sc; best = c; } }); return best.nomeTri; };
  P.push({ secao: S, titulo: '16 · harmonizando uma melodia', html: `<h2>Harmonizando uma melodia</h2>${fala('paul-teclado', 'harmonizar é <b>escolher os acordes</b> que acompanham uma melodia. a regra de ouro: as notas dos <b>tempos fortes</b> costumam pertencer ao acorde.')}
${caixa('passo a passo', '<p><b>1)</b> descubra o tom (veja a armadura e a 1ª/última nota).<br><b>2)</b> escreva o campo harmônico (C, Dm, Em, F, G, Am).<br><b>3)</b> para cada compasso, ache o acorde que <b>contém mais notas</b> da melodia, principalmente as dos tempos fortes.<br><b>4)</b> comece e termine no I (ou termine com cadência V → I).</p>')}
${caixa('campo harmônico de Dó (opções)', `<p style="text-align:center">${opc.map((c) => `<b>${c.nomeTri}</b> (${lst(c.notasTri)})`).join(' &nbsp;·&nbsp; ')}</p>`)}
${ex('H', 'escolha o acorde de cada compasso', `${pauta({ clef: 'sol', notas: mel.flat(), compasso: '4/4', w: 640, barras: [4, 8, 12] })}<table style="margin-top:2mm">${tabela(['compasso 1', 'compasso 2', 'compasso 3', 'compasso 4'], [['&nbsp;<br>&nbsp;', '', '', '']])}</table>`, mel.map((b, i) => `compasso ${i + 1}: ${melhor(b)}`).join(' · ') + ' (cadência: ... G → C)', 'compasso 1: dó, mi, sol são do acorde de... compare com o campo harmônico.')}` });

  /* 49 treino de ouvido integrado */
  const dm = [['C4', 'D4', 'E4', 'G4'], ['E4', 'D4', 'C4', 'G3'], ['G4', 'E4', 'F4', 'D4']];
  const dp = [[1, 5, 6, 4], [1, 4, 5, 1], [6, 4, 1, 5]];
  P.push({ secao: S, titulo: '17 · treino de ouvido integrado', html: `<h2>Treino de ouvido integrado</h2>${fala('paul-ouvindo-musica', 'agora é juntar o ouvido com a teoria! faça os <b>ditados</b> com a ajuda de alguém (ou toque você mesmo e escreva de memória). e use os jogos do app pra treinar todo dia.')}
${caixa('conectando o caderno aos jogos do app', tabela(['tema do caderno', 'jogo no app', 'o que treina'], [['intervalos, 3ª e 5ª, graus', '3ª ou 5ª?', 'reconhecer o grau de ouvido'], ['tríades e tétrades', 'Que acorde é?', 'nomear o acorde que toca'], ['maior x menor, escalas', 'Maior ou menor?', 'sentir a cor da terça'], ['escalas e modos', 'Escalas', 'tocar a escala em ordem'], ['melodia e leitura', 'Copia Aí · pauLta ao Vivo', 'copiar melodias e ler notas'], ['ritmo e grooves', 'Eco de Groove · Toca Aqui', 'repetir e ler ritmos']], 'l'))}
${ex('H', 'ditado melódico (4 notas em Dó maior, a partir do dó)', [1, 2, 3].map((n) => `<div class="caixa" style="margin:1mm 0"><span class="peq"><b>ditado ${n}</b></span>${pauta({ clef: 'sol', notas: [], w: 640, h: 120 })}</div>`).join(''), dm.map((l, i) => `<b>ditado ${i + 1}</b> (toque: ${nomes(l)})${pauta({ clef: 'sol', notas: l, w: 400 })}`).join(''), 'cante a nota inicial antes de ouvir; ouça 3 vezes; escreva.')}
${ex('H', 'ditado harmônico: escreva os graus que você ouvir', tabela(['ditado', 'graus (ex.: I – V – vi – IV)'], [['1', ''], ['2', ''], ['3', '']]), dp.map((g, i) => `ditado ${i + 1}: ${g.map((x) => ['I', 'ii', 'iii', 'IV', 'V', 'vi'][x - 1]).join(' – ')} (em Dó: ${T.progressao('C', g).join(' – ')})`).join('<br>'), 'toque as progressões em Dó e compare os sons.')}` });

  /* 50 projeto */
  P.push({ secao: S, titulo: '18 · projeto: crie sua música', html: `<h2>Projeto final: crie sua música</h2>${fala('paul-colorindo', 'chegou a hora de aplicar tudo! siga os passos e crie uma <b>canção curta de 8 compassos</b> com ritmo, melodia e harmonia.')}
${caixa('1 · decisões', tabela(null, [['tom', lin('g'), 'compasso', lin('m'), 'andamento (♩ =)', lin('m')], ['escala/modo', lin('g'), 'clima', lin('g'), 'título', lin('g')]], 'l'))}
${caixa('2 · progressão (8 compassos, em graus e em acordes)', tabela(['', '1', '2', '3', '4', '5', '6', '7', '8'], [['graus', '', '', '', '', '', '', '', ''], ['acordes', '', '', '', '', '', '', '', '']]))}
${caixa('3 · groove (bateria em 16 passos)', grade({ linhas: [{ nome: 'chimbal', x: [] }, { nome: 'caixa', x: [] }, { nome: 'bumbo', x: [] }] }))}
${caixa('4 · melodia', pauta({ clef: 'sol', notas: [], compasso: '4/4', w: 640 }) + pauta({ clef: 'sol', notas: [], w: 640 }))}
${caixa('5 · checklist', `<p>${cx('usei as notas do tom')} ${cx('terminei no acorde I')} ${cx('tem 1 cadência')} ${cx('a melodia tem contorno')}<br>${cx('toquei com o groove')} ${cx('gravei')} ${cx('mostrei pra alguém')} ${cx('dei um título')}</p>`)}` });

  /* 51 plano de estudos */
  const sem = [['1', 'compassos simples e compostos', 'pauta e clave de sol', 'tríades (4 tipos)', '3ª ou 5ª? fase 1–6'], ['2', 'subdivisão e contagem', 'clave de fá e leitura', 'tríades nos 12 tons', 'Que acorde é? fase 1–6'], ['3', 'ponto e ligadura', 'acidentes e semitons', 'cifras', 'Maior ou menor? fase 1–6'], ['4', 'síncope', 'armaduras', 'campo harm. maior', 'Escalas fase 1–6'], ['5', 'contratempo e anacruse', 'círculo de quintas', 'campos nos 12 tons', '3ª ou 5ª? fase 7–12'], ['6', 'tercina e quiálteras', 'intervalos 1 e 2', 'campo harm. menor', 'Que acorde é? fase 7–12'], ['7', 'leituras rítmicas 1 e 2', 'intervalos 3', 'funções e cadências', 'Maior ou menor? fase 7–12'], ['8', 'leitura rítmica 3', 'escalas menores', 'tétrades', 'Escalas fase 7–12'], ['9', 'grooves de bateria', 'modos', 'ii–V–I', 'difícil: 3ª ou 5ª?'], ['10', 'claves', 'construindo melodias', 'inversões e baixo', 'difícil: Que acorde é?'], ['11', 'polirritmia', 'ornamentos', 'progressões e blues', 'difícil: Maior ou menor?'], ['12', 'ditado rítmico', 'transposição', 'projeto final', 'difícil: Escalas']];
  P.push({ secao: S, titulo: '19 · plano de 12 semanas', html: `<h2>Plano de estudos: 12 semanas</h2>${fala('paul-metronomo', 'um tema por semana em cada trilha. estude <b>15 a 20 minutos por dia</b>: 5 de ritmo, 5 de melodia, 5 de harmonia e 5 de jogos de ouvido. marque o que concluir!')}
${tabela(['sem.', 'ritmo', 'melodia', 'harmonia', 'jogos no app', 'ok'], sem.map((l) => [`<b>${l[0]}</b>`, l[1], l[2], l[3], l[4], cx('')]), 'l')}
${caixa('regras de ouro', '<p class="peq">• pouco todos os dias vale mais que muito de vez em quando.<br>• erre devagar, acerte devagar, só depois acelere.<br>• sempre cante ou fale a contagem antes de tocar.<br>• depois de cada exercício, toque de novo <b>sem olhar</b>.</p>')}` });
  return P;
}
