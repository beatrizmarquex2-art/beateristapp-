// Parte 1 do caderno intermediário: RITMO (13 páginas).
import { ritmo, grade, caixa, tabela, fala, lin, cx, piano } from './lib.js';

const D = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
export const durItem = (it) => D[it.replace(/^r/, '')[0]] * (it.includes('.') ? 1.5 : 1);
export const durGrupo = (g) => (Array.isArray(g) ? g.reduce((t, i) => t + durItem(i), 0) : g.itens.reduce((t, i) => t + durItem(i), 0) * (g.tup === 3 ? 2 / 3 : g.tup === 6 ? 4 / 6 : g.tup === 5 ? 4 / 5 : 1));
export const durComp = (c) => c.reduce((t, g) => t + durGrupo(g), 0);
const beatsOf = (fc) => { const [a, b] = fc.split('/').map(Number); return a * (4 / b); }; // em semínimas
export const avisos = (window.__avisos = window.__avisos || []);
const confere = (fc, comps, onde) => comps.forEach((c, i) => { if (Math.abs(durComp(c) - beatsOf(fc)) > 1e-6) avisos.push(`${onde}: compasso ${i + 1} soma ${durComp(c)} em vez de ${beatsOf(fc)}`); });
/** Contagem em voz alta: simples (1 e i a) ou composta (1 la li). */
export function contaDe(fc, comps) {
  const [a, b] = fc.split('/').map(Number); const composto = b === 8 && a % 3 === 0 && a > 3; const out = []; const per = beatsOf(fc);
  comps.forEach((c) => { let t = 0; c.forEach((g) => { const lst = Array.isArray(g) ? g : g.itens; const tup = Array.isArray(g) ? 0 : g.tup;
    lst.forEach((it, k) => { const d = tup ? durGrupo(g) / lst.length : durItem(it); const tt = Math.round(t * 1000) / 1000;
      let lab; if (composto) { const u = Math.round(t * 2 * 1000) / 1000; const r = Math.round((u % 3) * 1000) / 1000; lab = r === 0 ? String(Math.floor(u / 3) + 1) : r === 1 ? 'la' : r === 2 ? 'li' : '·'; }
      else { const fr = Math.round((tt - Math.floor(tt)) * 1000) / 1000; lab = fr === 0 ? String(Math.floor(tt) + 1) : fr === 0.5 ? '&' : fr === 0.25 ? 'e' : fr === 0.75 ? 'a' : (tup === 3 ? (k === 1 ? 'la' : 'li') : '·'); if (tup === 3 && k === 0) lab = String(Math.floor(tt) + 1); }
      out.push(lab); t += tup ? d : durItem(it); }); }); });
  return out;
}
const R = (fc, comps, o = {}) => { if (!o.livre) confere(fc, comps, o.onde || fc); return ritmo({ fc, compassos: comps, conta: o.conta ? contaDe(fc, comps) : null }); };
const sincope = (c) => { let t = 0; let achou = false; c.forEach((g) => { const lst = Array.isArray(g) ? g : g.itens; lst.forEach((it) => { const d = durItem(it); const fr = Math.round((t - Math.floor(t)) * 1000) / 1000; if (!it.startsWith('r') && fr !== 0 && (d >= 1 || it.endsWith('~')) && !(Array.isArray(g) ? false : true)) achou = true; t += d; }); }); return achou; };

export function paginas(ex) {
  const P = []; const S = 'ritmo';

  /* 4 compasso */
  const m24 = [[['q'], ['q']], [['q'], ['e', 'e']]]; const m34 = [[['q'], ['q'], ['q']], [['h'], ['q']]]; const m44 = [[['q'], ['q'], ['q'], ['q']], [['q'], ['e', 'e'], ['h']]];
  const cheios = [['4/4', [['q'], ['e', 'e'], ['q'], ['q']], 'C'], ['3/4', [['q'], ['q'], ['e', 'e']], 'I'], ['2/4', [['q'], ['e', 'e'], ['q']], 'I'], ['4/4', [['h'], ['q'], ['rq']], 'C'], ['3/4', [['h'], ['q']], 'C'], ['6/8', [['e', 'e', 'e'], ['q.']], 'C'], ['2/4', [['q'], ['s', 's', 'e']], 'C'], ['4/4', [['h.'], ['e', 'e']], 'C']];
  const certo = cheios.map(([fc, c]) => Math.abs(durComp(c) - beatsOf(fc)) < 1e-6);
  P.push({ secao: S, titulo: '1 · compasso', html: `<h2>Compasso e fórmula de compasso</h2>${fala('paul-metronomo', 'a música tem um pulso, e o <b>compasso</b> agrupa esses pulsos em "caixinhas" separadas por <b>barras</b>. a <b>fórmula de compasso</b> diz como é cada caixinha.')}
<div class="duas">${caixa('numerador (em cima)', '<p>quantos <b>tempos</b> cabem no compasso.</p>')}${caixa('denominador (embaixo)', '<p>qual figura vale <b>1 tempo</b>: 2 = mínima, 4 = semínima, 8 = colcheia.</p>')}</div>
${caixa('os 3 compassos simples mais usados (cada tempo se divide em 2)', `<div class="mini3" style="grid-template-columns:1fr"><div>${R('2/4', m24, { conta: 1 })}<p class="peq"><b>2/4 · binário</b> — forte, fraco. marcha, samba.</p></div><div>${R('3/4', m34, { conta: 1 })}<p class="peq"><b>3/4 · ternário</b> — forte, fraco, fraco. valsa.</p></div><div>${R('4/4', m44, { conta: 1 })}<p class="peq"><b>4/4 · quaternário</b> — forte, fraco, meio-forte, fraco. rock, pop, funk.</p></div></div>`)}
${ex('R', 'compasso completo (C) ou incompleto (I)?', `<table>${tabela(null, cheios.map(([fc, c], i) => [`<b>${i + 1}</b>`, R(fc, [c], { livre: true }).replace(/class="ritmo"/, 'class="ritmo" style="max-height:11mm"'), cx('C') + ' &nbsp; ' + cx('I')]), 'l')}</table>`, cheios.map(([, c], i) => `${i + 1}: ${certo[i] ? 'C (completo)' : 'I (incompleto)'}`).join(' · '), 'some os valores (semínima = 1, colcheia = ½, mínima = 2, ponto aumenta metade) e compare com o numerador.')}
${(() => { cheios.forEach(([fc, c], i) => { /* já validado pelo gabarito */ }); return ''; })()}` });
  // o exercício acima usa compassos propositalmente errados: tira os avisos deles
  avisos.length = 0;

  /* 5 compasso composto */
  const c68 = [[['e', 'e', 'e'], ['e', 'e', 'e']], [['q.'], ['q.']]]; const c98 = [[['e', 'e', 'e'], ['e', 'e', 'e'], ['e', 'e', 'e']]]; const c128 = [[['q.'], ['e', 'e', 'e'], ['q.'], ['q.']]];
  const fcs = ['2/4', '6/8', '3/4', '9/8', '4/4', '12/8', '3/8', '5/4'];
  const cls = (fc) => { const [a, b] = fc.split('/').map(Number); const comp = b === 8 && a % 3 === 0 && a > 3; const t = comp ? a / 3 : a; return [comp ? 'composto' : 'simples', { 2: 'binário', 3: 'ternário', 4: 'quaternário' }[t] || 'misto/irregular', t]; };
  P.push({ secao: S, titulo: '2 · compasso composto', html: `<h2>Compasso composto</h2>${fala('paul-bateria', 'no <b>compasso composto</b> cada tempo vale uma figura <b>pontuada</b> e se divide em <b>3</b> partes (e não em 2). o 6/8 parece 2 tempos "balançados": <b>1</b>-la-li <b>2</b>-la-li.')}
${caixa('6/8 · 2 tempos de 3 colcheias', R('6/8', c68, { conta: 1 }) + '<p class="peq">a unidade de tempo é a <b>semínima pontuada</b> (3 colcheias). contagem: 1 la li 2 la li.</p>')}
<div class="duas">${caixa('9/8 · 3 tempos', R('9/8', c98, { conta: 1 }))}${caixa('12/8 · 4 tempos', R('12/8', c128, { conta: 1 }))}</div>
${caixa('simples × composto', tabela(['', 'simples', 'composto'], [['cada tempo divide em', '2 partes', '3 partes'], ['unidade de tempo', 'figura simples (semínima)', 'figura pontuada (semínima pontuada)'], ['exemplos', '2/4 · 3/4 · 4/4', '6/8 · 9/8 · 12/8'], ['sensação', 'reto, "quadrado"', 'balançado, "ternário"'], ['como achar o nº de tempos', 'numerador', 'numerador ÷ 3']]))}
${ex('R', 'classifique as fórmulas de compasso', tabela(['fórmula', 'simples ou composto?', 'quantos tempos?', 'nome'], fcs.map((fc) => [`<b>${fc}</b>`, '', '', ''])), tabela(['fórmula', 'tipo', 'tempos', 'nome'], fcs.map((fc) => { const [t, n, q] = cls(fc); return [fc, t, q, n]; }), 'gab'), 'só os compassos 6/8, 9/8 e 12/8 são compostos nesta lista; o 3/8 é simples e o 5/4 é irregular.')}` });

  /* 6 subdivisão e contagem */
  const sub1 = [[['q'], ['q'], ['q'], ['q']]]; const sub2 = [[['e', 'e'], ['e', 'e'], ['e', 'e'], ['e', 'e']]]; const sub3 = [[['s', 's', 's', 's'], ['s', 's', 's', 's'], ['s', 's', 's', 's'], ['s', 's', 's', 's']]]; const sub4 = [[['e', 's', 's'], ['s', 's', 'e'], ['s', 'e', 's'], ['q']]];
  const exSub = [[[['q'], ['e', 'e'], ['q'], ['e', 'e']]], [[['e', 'e'], ['s', 's', 's', 's'], ['q'], ['e', 'e']]], [[['e', 's', 's'], ['s', 's', 'e'], ['q'], ['rq']]]];
  P.push({ secao: S, titulo: '3 · subdivisão e contagem', html: `<h2>Subdivisão e contagem</h2>${fala('paul-pad-metronomo', 'subdividir é "cortar" cada tempo em partes iguais. contar em voz alta é o jeito mais rápido de ler e tocar certo!')}
${caixa('cada tempo em 1, 2 ou 4 partes', `${R('4/4', sub1, { conta: 1 })}<p class="peq">1 nota por tempo: <b>1 · 2 · 3 · 4</b></p>${R('4/4', sub2, { conta: 1 })}<p class="peq">2 notas por tempo: <b>1 & 2 & 3 & 4 &</b></p>${R('4/4', sub3, { conta: 1 })}<p class="peq">4 notas por tempo: <b>1 e & a 2 e & a…</b> (fale "1 e & a" bem rápido)</p>`)}
${caixa('combinações dentro de um tempo', `${R('4/4', sub4, { conta: 1 })}<p class="peq">colcheia + 2 semicolcheias = "1 · &" + "e a" ... depois 2 semicolcheias + colcheia = "2 e &" + "(a)".</p>`)}
${ex('R', 'escreva a contagem embaixo de cada nota', exSub.map((c, i) => `<div style="margin-bottom:2mm">${R('4/4', c, { onde: `exR3.${i}` })}<div class="linha"></div></div>`).join(''), exSub.map((c, i) => `linha ${i + 1}: ${contaDe('4/4', c).join(' ')}`).join('<br>'), 'tempo = número · meio do tempo = "&" · quartos = "e" e "a".')}` });

  /* 7 ponto e ligadura */
  const pontos = [[['q.', 'e'], 1.5 + 0.5], [['h.'], 3], [['e.', 's'], 0.75 + 0.25], [['q', 'q~', 'q'], 3], [['h~', 'q'], 3], [['q.~', 'e'], 2]];
  const val = ['semibreve = 4', 'mínima = 2', 'semínima = 1', 'colcheia = ½', 'semicolcheia = ¼'];
  P.push({ secao: S, titulo: '4 · ponto e ligadura', html: `<h2>Ponto de aumento e ligadura</h2>${fala('paul-professor', 'o <b>ponto</b> depois da nota aumenta a duração em <b>metade</b> do valor. a <b>ligadura</b> junta duas notas iguais numa só, somando as durações.')}
${caixa('ponto de aumento', tabela(['figura', 'vale', 'com ponto', 'soma'], [['semínima', '1 tempo', 'semínima pontuada', '1 + ½ = <b>1½</b>'], ['mínima', '2 tempos', 'mínima pontuada', '2 + 1 = <b>3</b>'], ['colcheia', '½ tempo', 'colcheia pontuada', '½ + ¼ = <b>¾</b>'], ['semibreve', '4 tempos', 'semibreve pontuada', '4 + 2 = <b>6</b>']]))}
${caixa('exemplos', `${R('4/4', [[['q.', 'e'], ['h']]], { conta: 1 })}<p class="peq">semínima pontuada + colcheia: 1½ + ½ = 2 tempos, depois uma mínima.</p>${R('4/4', [[['q', 'q~'], ['q', 'h']]].map((c) => [['q'], ['q~'], ['q'], ['q']]), { onde: 'lig' })}<p class="peq">a <b>ligadura</b> liga a 2ª semínima à 3ª: soa 1 vez e dura 2 tempos (só se articula a primeira).</p>`)}
${ex('R', 'quantos tempos dura cada grupo? (semínima = 1)', `<table>${tabela(['', 'grupo', 'tempos'], [['a', 'semínima pontuada + colcheia', ''], ['b', 'mínima pontuada', ''], ['c', 'colcheia pontuada + semicolcheia', ''], ['d', 'semínima ligada a semínima + semínima', ''], ['e', 'mínima ligada a semínima', ''], ['f', 'semínima pontuada ligada a colcheia', ''], ['g', 'colcheia + colcheia pontuada + semicolcheia', '']])}</table>`, 'a: 2 · b: 3 · c: 1 · d: 3 · e: 3 · f: 2 · g: ½ + ¾ + ¼ = 1½', 'o ponto vale metade da nota que ele acompanha.')}
<div class="caixa"><h3>resumo dos valores</h3><p>${val.join(' · ')}</p></div>` });

  /* 8 síncope */
  const sinc = [[['e', 'q', 'e'], ['h']], [['q'], ['e', 'q', 'e'], ['q']], [['e', 'e'], ['e', 'e'], ['q'], ['q']], [['q'], ['q~'], ['q'], ['q']]];
  P.push({ secao: S, titulo: '5 · síncope', html: `<h2>Síncope</h2>${fala('paul-guitarra', 'a <b>síncope</b> é o "gingado" da música brasileira: o som começa num tempo <b>fraco</b> (ou parte fraca) e se prolonga sobre o tempo <b>forte</b>, deslocando o acento.')}
${caixa('como reconhecer', '<p>• uma nota começa na parte fraca do tempo (no "&") e dura até o tempo seguinte;<br>• ou uma nota fraca é ligada a um tempo forte;<br>• o ouvido "espera" o acento no tempo, mas ele chega antes ou depois.</p>')}
${caixa('formas mais comuns (4/4)', `${R('4/4', [[['e', 'q', 'e'], ['q'], ['q']]], { conta: 1 })}<p class="peq"><b>colcheia – semínima – colcheia</b>: a semínima do meio começa no "&" do tempo 1 e vai até o "&" do 2.</p>${R('4/4', [[['q'], ['e', 'q', 'e'], ['q']]], { conta: 1 })}<p class="peq">a mesma figura no meio do compasso (samba!).</p>${R('4/4', [[['e', 'q', 'e'], ['e', 'q', 'e']]], { conta: 1 })}<p class="peq">repetida: o "balanço" que vira groove.</p>${R('4/4', [[['q'], ['q~'], ['q'], ['q']]], { onde: 'sincope ligada' })}<p class="peq">síncope com <b>ligadura</b>: a nota do tempo 2 é ligada ao tempo 3.</p>`)}
${ex('R', 'esse compasso tem síncope? (marque S ou N)', `<table>${tabela(null, sinc.map((c, i) => [`<b>${i + 1}</b>`, R('4/4', [c], { onde: `ex sinc ${i}` }), cx('S') + ' &nbsp; ' + cx('N')]), 'l')}</table>`, '1: S (e q e) · 2: S · 3: N (só colcheias e semínimas no tempo) · 4: S (ligada ao tempo seguinte)', 'procure notas longas que começam no "&".')}` });

  /* 9 contratempo e anacruse */
  P.push({ secao: S, titulo: '6 · contratempo e anacruse', html: `<h2>Contratempo e anacruse</h2>${fala('paul-sax', '<b>contratempo</b>: a nota toca no tempo <b>fraco</b> e o tempo forte fica em silêncio. <b>anacruse</b>: a música começa "antes" do primeiro tempo forte.')}
${caixa('contratempo = pausa no tempo + nota no "&"', `${R('4/4', [[['re', 'e'], ['re', 'e'], ['re', 'e'], ['re', 'e']]], { conta: 1 })}<p class="peq">"(1) & (2) & (3) & (4) &": só falamos os "&". muito usado no reggae e no ska!</p>`)}
${caixa('anacruse (início anacrúsico)', `${R('4/4', [[['q']], [['q'], ['q'], ['q'], ['q']], [['q'], ['q'], ['q']]], { livre: true })}<p class="peq">a 1ª "caixinha" tem só 1 tempo (a anacruse) e a última fica com os 3 tempos que faltam: juntas formam 1 compasso inteiro. ex.: "Parabéns pra você" começa no último tempo.</p>`)}
${caixa('tipos de início de frase', tabela(['tipo', 'começa em', 'exemplo'], [['tético', 'no 1º tempo (forte)', '"Brilha, brilha estrelinha"'], ['anacrúsico', 'no tempo fraco, antes do forte', '"Parabéns pra você"'], ['acéfalo', 'depois do 1º tempo (começa com pausa)', 'muitas músicas de samba e bossa']]))}
${ex('R', 'contratempo ou não?', `<table>${tabela(null, [['1', R('4/4', [[['re', 'e'], ['re', 'e'], ['q'], ['q']]], { onde: 'ct1' }), cx('contratempo') + ' ' + cx('não')], ['2', R('4/4', [[['e', 'e'], ['q'], ['re', 'e'], ['q']]], { onde: 'ct2' }), cx('contratempo') + ' ' + cx('não')], ['3', R('4/4', [[['q'], ['q'], ['q'], ['q']]], { onde: 'ct3' }), cx('contratempo') + ' ' + cx('não')]], 'l')}</table>`, '1: contratempo nos tempos 1 e 2 (pausa + colcheia) · 2: contratempo no tempo 3 · 3: não (nota em todos os tempos fortes)', 'procure pausas nos tempos fortes seguidas de notas no "&".')}` });

  /* 10 tercina e quiálteras */
  const T3 = [[{ tup: 3, itens: ['e', 'e', 'e'] }, ['q'], ['q'], ['q']]]; const T6 = [[{ tup: 6, itens: ['s', 's', 's', 's', 's', 's'] }, ['q'], ['h']]];
  P.push({ secao: S, titulo: '7 · tercina e quiálteras', html: `<h2>Tercina e quiálteras</h2>${fala('paul-teclado', '<b>quiáltera</b> é quando dividimos um tempo em um número diferente do normal. a mais famosa é a <b>tercina</b>: 3 notas no lugar de 2.')}
${caixa('tercina de colcheias', R('4/4', T3, { conta: 1 }) + '<p class="peq">3 colcheias no tempo de 1 semínima. contagem: <b>1 la li</b>, 2, 3, 4. cada nota vale ⅓ de tempo.</p>')}
${caixa('sextina', R('4/4', T6, { conta: 0 }) + '<p class="peq">6 semicolcheias no tempo de 1 semínima (cada nota vale ⅙ de tempo). é "duas tercinas coladas".</p>')}
${caixa('as quiálteras mais comuns', tabela(['nome', 'notas', 'ocupa o lugar de', 'cada nota vale (colcheias)'], [['duolo', '2', '3 (em compasso composto)', '¾ de tempo'], ['tercina', '3', '2', '⅓ de tempo (3 colcheias = 1 tempo)'], ['quartina', '4', '3 (composto)', '—'], ['quintina', '5', '4', '⅕ de tempo (5 semicolcheias = 1 tempo)'], ['sextina', '6', '4', '⅙ de tempo (6 semicolcheias = 1 tempo)'], ['septina', '7', '4', '—']]))}
${ex('R', 'quanto vale cada nota? (semínima = 1 tempo)', `<table>${tabela(['quiáltera', 'duração total', 'cada nota vale'], [['tercina de colcheias', '', ''], ['tercina de semínimas (ocupa 2 tempos)', '', ''], ['sextina de semicolcheias', '', ''], ['quintina de semicolcheias', '', '']])}</table>`, 'tercina de colcheias: 1 tempo · ⅓ · tercina de semínimas: 2 tempos · ⅔ · sextina: 1 tempo · ⅙ · quintina: 1 tempo · ⅕', 'divida a duração total pelo número de notas.')}` });

  /* 11-13 leitura */
  const mk = (fc, linhas) => linhas.map((c, i) => `<div style="margin-bottom:2mm"><span class="peq"><b>${i + 1}</b></span>${R(fc, c, { onde: `leitura ${fc} ${i}` }).replace('class="ritmo"', 'class="ritmo" style="max-height:25mm"')}</div>`).join('');
  const L1 = [[[['q'], ['q'], ['q'], ['q']], [['q'], ['e', 'e'], ['q'], ['q']]], [[['h'], ['q'], ['q']], [['q'], ['q'], ['h']]], [[['e', 'e'], ['e', 'e'], ['q'], ['q']], [['q'], ['rq'], ['q'], ['q']]], [[['q'], ['e', 'e'], ['e', 'e'], ['q']], [['h.'], ['rq']]], [[['q'], ['q'], ['e', 'e'], ['q']], [['e', 'e'], ['q'], ['q'], ['rq']]], [[['h'], ['e', 'e'], ['q']], [['q'], ['q'], ['q'], ['q']]]];
  P.push({ secao: S, titulo: '8 · leitura rítmica 1', html: `<h2>Leitura rítmica 1: semínimas e colcheias</h2>${fala('paul-estudando', 'leia com calma: <b>1)</b> conte o pulso em voz alta · <b>2)</b> bata palmas só o ritmo · <b>3)</b> fale a contagem e bata junto. comece em ♩ = 60.')}
${mk('4/4', L1)}
<div class="caixa tracejada"><h3>progresso</h3><p>♩ = 60: ${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 80: ${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 100: ${cx()}${cx()}${cx()}${cx()}<br><span class="peq">marque uma caixinha por linha que você leu sem errar.</span></p></div>
${caixa('contagem da linha 1', `<p class="peq">${contaDe('4/4', L1[0]).join(' ')}</p>`)}` });
  const L2fix = [[[['e', 's', 's'], ['s', 's', 'e'], ['q'], ['q']], [['s', 's', 's', 's'], ['e', 'e'], ['q'], ['q']]], [[['q.', 'e'], ['q'], ['q']], [['e.', 's'], ['q'], ['q'], ['q']]], [[['e', 'e'], ['s', 's', 'e'], ['q'], ['q']], [['q'], ['e', 's', 's'], ['q'], ['q']]], [[['q'], ['e', 'e'], ['q.', 'e']], [['q'], ['re', 'e'], ['q'], ['q']]], [[['s', 's', 'e'], ['e', 's', 's'], ['q'], ['q']], [['q.', 'e'], ['q.', 'e']]], [[['e.', 's'], ['e.', 's'], ['q'], ['q']], [['q'], ['s', 's', 's', 's'], ['e', 'e'], ['q']]]];
  P.push({ secao: S, titulo: '9 · leitura rítmica 2', html: `<h2>Leitura rítmica 2: semicolcheias e pontuadas</h2>${fala('paul-guitarra', 'agora com <b>semicolcheias</b> e <b>pontuadas</b>. desafio: leia cada linha duas vezes seguidas, sem parar entre elas.')}
${mk('4/4', L2fix)}
<div class="caixa tracejada"><h3>progresso</h3><p>♩ = 60: ${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 80: ${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 100: ${cx()}${cx()}${cx()}${cx()}</p></div>
${caixa('contagem da linha 2', `<p class="peq">${contaDe('4/4', L2fix[1]).join(' ')}</p>`)}` });
  const L3 = [[[['e', 'q', 'e'], ['q'], ['q']], [['q'], ['e', 'q', 'e'], ['q']]], [[['re', 'e'], ['re', 'e'], ['re', 'e'], ['re', 'e']], [['q'], ['rq'], ['e', 'e'], ['q']]], [[{ tup: 3, itens: ['e', 'e', 'e'] }, ['q'], ['q'], ['q']], [['q'], { tup: 3, itens: ['e', 'e', 'e'] }, ['h']]], [[['e', 'q', 'e'], ['e', 'q', 'e']], [['q.'], ['q.'], ['q']]], [[['q'], ['e', 'q', 'e'], ['q']], [['re', 'e'], ['q'], ['re', 'e'], ['q']]], [[{ tup: 3, itens: ['e', 'e', 'e'] }, { tup: 3, itens: ['e', 'e', 'e'] }, ['q'], ['q']], [['q.'], ['q.'], ['q']]]];
  P.push({ secao: S, titulo: '10 · leitura rítmica 3', html: `<h2>Leitura rítmica 3: síncopes, contratempos e tercinas</h2>${fala('paul-oculos', 'as linhas de cima têm síncope, depois contratempo, tercina e um "3 + 3 + 2" (o ritmo mais usado em música brasileira e latina!).')}
${mk('4/4', L3)}
<div class="caixa tracejada"><h3>progresso</h3><p>♩ = 60: ${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 80: ${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 100: ${cx()}${cx()}${cx()}${cx()}</p></div>
${caixa('o "3 + 3 + 2"', '<p class="peq">a última linha agrupa 8 colcheias em <b>3 + 3 + 2</b> (semínima pontuada, semínima pontuada, semínima). ouça: "1 · · 2 · · 3 ·". é a base de muitos grooves (baião, rock, funk).</p>')}` });

  /* 14 grooves */
  const gRock = grade({ linhas: [{ nome: 'chimbal', x: [0, 2, 4, 6, 8, 10, 12, 14] }, { nome: 'caixa', x: [4, 12] }, { nome: 'bumbo', x: [0, 8] }] });
  const gFunk = grade({ linhas: [{ nome: 'chimbal', x: Array.from({ length: 16 }, (_, i) => i) }, { nome: 'caixa', x: [4, 12] }, { nome: 'bumbo', x: [0, 10] }] });
  const gDisco = grade({ linhas: [{ nome: 'chimbal ab.', x: [2, 6, 10, 14] }, { nome: 'caixa', x: [4, 12] }, { nome: 'bumbo', x: [0, 4, 8, 12] }] });
  const gSamba = grade({ linhas: [{ nome: 'pandeiro', x: Array.from({ length: 16 }, (_, i) => i) }, { nome: 'surdo', x: [4, 12] }, { nome: 'caixa', x: [0, 3, 6, 10, 12] }] });
  P.push({ secao: S, titulo: '11 · grooves de bateria', html: `<h2>Grooves: lendo a grade de 16 passos</h2>${fala('paul-bateria', 'cada compasso de 4/4 vira uma <b>grade de 16 passos</b> (semicolcheias). a linha de cima do quadro mostra a contagem: <b>1 e & a 2 e & a…</b> cada ● é uma batida!')}
${caixa('rock (colcheias no chimbal)', gRock + '<p class="peq">chimbal em todas as colcheias · caixa nos tempos 2 e 4 · bumbo nos tempos 1 e 3.</p>')}
${caixa('funk (16 passos no chimbal)', gFunk + '<p class="peq">chimbal em semicolcheias · bumbo no 1 e no "&" do 3 (passo 10) · caixa no 2 e 4.</p>')}
${caixa('disco ("4 no chão")', gDisco + '<p class="peq">bumbo em todos os tempos · chimbal aberto nos "&" (contratempos).</p>')}
${caixa('samba (base simplificada)', gSamba + '<p class="peq">pandeiro em semicolcheias · surdo marcando os tempos 2 e 4 · caixa com acentos deslocados (síncope!).</p>')}` });

  /* 15 claves + criar groove */
  const clave = (x) => grade({ linhas: [{ nome: 'clave', x }], passos: 16 });
  const alvos = [['rock simples', 'chimbal em colcheias (passos 0, 2, 4, …), caixa nos tempos 2 e 4, bumbo nos tempos 1 e 3', { hh: [0, 2, 4, 6, 8, 10, 12, 14], sn: [4, 12], bd: [0, 8] }], ['batida de pop', 'chimbal em colcheias, caixa nos tempos 2 e 4, bumbo no 1, no "&" do 2 (passo 6) e no 3', { hh: [0, 2, 4, 6, 8, 10, 12, 14], sn: [4, 12], bd: [0, 6, 8] }]];
  const gv = () => grade({ linhas: [{ nome: 'chimbal', x: [] }, { nome: 'caixa', x: [] }, { nome: 'bumbo', x: [] }] });
  const gAns = ([, , o]) => grade({ linhas: [{ nome: 'chimbal', x: o.hh }, { nome: 'caixa', x: o.sn }, { nome: 'bumbo', x: o.bd }] });
  P.push({ secao: S, titulo: '12 · claves e criação', html: `<h2>Claves e criando grooves</h2>${fala('paul-ouvindo-musica', 'a <b>clave</b> é um padrão curto que organiza toda a música latina e afro-cubana. ela é repetida sem parar e todos os outros instrumentos "encaixam" nela.')}
${caixa('3 claves famosas (16 passos)', `${clave([0, 3, 6, 10, 12])}<p class="peq"><b>clave de son 3-2</b>: 3 batidas na 1ª metade (passos 0, 3, 6) e 2 na 2ª (10, 12).</p>${clave([0, 3, 7, 10, 12])}<p class="peq"><b>clave de rumba 3-2</b>: igual ao son, mas a 3ª batida cai um passo depois (passo 7).</p>${clave([0, 3, 6, 10, 13])}<p class="peq"><b>clave de bossa nova</b>: é a base do violão da bossa (a última batida em 13).</p>`)}
${ex('R', 'monte o groove', `${alvos.map(([n, d], i) => `<p class="peq"><b>${i + 1}) ${n}:</b> ${d}.</p>${gv()}`).join('<br>')}<p class="peq" style="margin-top:2mm"><b>3) seu groove:</b> invente o seu, escolha os passos e toque na bateria ou no pad.</p>${gv()}`, alvos.map((a, i) => `<b>${i + 1}) ${a[0]}</b>${gAns(a)}`).join(''), 'pinte um ● em cada passo da linha. o bumbo marca onde o "pé" bate!')}` });

  /* 16 polirritmia + ditado */
  const cab12 = ['1', '', '', '2', '', '', '3', '', '', '4', '', ''];
  const g32 = grade({ passos: 12, cab: Array.from({ length: 12 }, (_, i) => (i % 6 === 0 ? String(1 + i / 6) : i % 3 === 0 ? '·' : '')), linhas: [{ nome: '3 contra', x: [0, 4, 8] }, { nome: '2', x: [0, 6] }] });
  const g43 = grade({ passos: 12, cab: Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? String(1 + i / 3) : '')), linhas: [{ nome: '4 contra', x: [0, 3, 6, 9] }, { nome: '3', x: [0, 4, 8] }] });
  const dit = [[[['q'], ['e', 'e'], ['q'], ['q']], [['e', 'e'], ['q'], ['h']]], [[['q.', 'e'], ['q'], ['q']], [['e', 'e'], ['e', 'e'], ['h']]], [[['e', 'q', 'e'], ['q'], ['q']], [['q'], ['q'], ['q'], ['rq']]]];
  P.push({ secao: S, titulo: '13 · polirritmia e ditado', html: `<h2>Polirritmia e ditado rítmico</h2>${fala('paul-pandeiro', '<b>polirritmia</b> é tocar dois ritmos diferentes ao mesmo tempo. o clássico é o <b>3 contra 2</b>: uma mão toca 3 batidas enquanto a outra toca 2, no mesmo espaço de tempo.')}
${caixa('3 contra 2 (12 passos)', g32 + '<p class="peq">as duas linhas se encontram só no passo 0. diga: <b>"não-é-fá-cil"</b> (3: não · é · fá) com a outra mão batendo "cil" no meio (2).</p>')}
${caixa('4 contra 3', g43 + '<p class="peq">mesmo princípio com 4 e 3 batidas no mesmo tempo.</p>')}
${ex('R', 'ditado rítmico (peça pra alguém bater, ou use o app)', `<p class="peq">escreva o ritmo que você ouvir nas pautas rítmicas abaixo (use só as figuras desta aula).</p>${[1, 2, 3].map((n) => `<div class="caixa" style="margin:1mm 0"><span class="peq"><b>ditado ${n}</b> (4/4, 2 compassos)</span><div style="height:16mm;border-bottom:1.6px solid #000"></div></div>`).join('')}`, dit.map((c, i) => `<b>ditado ${i + 1}</b>${R('4/4', c, { onde: `ditado ${i}` })}`).join(''), 'bata o ritmo 3 vezes antes de escrever. escreva primeiro as notas longas.')}` });
  return P;
}
