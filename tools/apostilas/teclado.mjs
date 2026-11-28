// Apostila "Teclado do zero" — mesmo livro da apostila de violão (azul e dourado). Pautas feitas pelo motor do Beaterista PRO; teclados desenhados aqui.
import { melodia, svgTeclado } from './notas.mjs';
import * as L from './lib.mjs';
import { writeFileSync } from 'node:fs';
const NOME = 'Teclado do zero · Beaterista';
const PROMO = ['quer aula? <i>beaterista.com.br</i> · escola em Araçatuba', 'dúvida? chame a escola no WhatsApp <i>18 991804150</i>', 'quer a bateria também? conheça os guias no <i>beaterista.com.br</i>'];
let pr = 0; const promo = () => PROMO[pr++ % PROMO.length];
const pg = (o) => L.pagina({ ...o, nome: NOME, promo: promo() });
const NOTAS = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si']; const nm = (m) => NOTAS[((m % 12) + 12) % 12];
const BR = [0, 2, 4, 5, 7, 9, 11]; const PRETA_APOS = { 0: 1, 2: 3, 5: 6, 7: 8, 9: 10 }; // pc da branca → pc da preta logo à direita
/** Teclado desenhado: de `de` (um Dó) a `ate` (inclusive). `lit` = { midi: 'rótulo' } teclas em destaque; `todos` = escreve o nome em todas as brancas. */
export function teclas({ de = 60, ate = 72, lit = {}, todos = false, largura = 330, nomesPretas = false } = {}) {
  const brancas = []; for (let m = de; m <= ate; m++) if (BR.includes(m % 12)) brancas.push(m); const kw = 22; const W = brancas.length * kw; const H = 92; let o = '';
  brancas.forEach((m, i) => { const on = lit[m] !== undefined; o += `<rect x="${i * kw}" y="0" width="${kw - 1}" height="${H}" rx="2" fill="${on ? '#e8c46a' : '#fff'}" stroke="#1d2236" stroke-width="1"/>`; const r = on ? lit[m] : (todos ? nm(m) : (m % 12 === 0 ? 'Dó' : '')); if (r) o += `<text x="${i * kw + kw / 2 - .5}" y="${H - 7}" text-anchor="middle" font-size="${on ? 8.6 : 8}" font-weight="700" fill="#0e1a3a" font-family="Hanken, sans-serif">${r}</text>`; });
  brancas.forEach((m, i) => { const p = PRETA_APOS[m % 12]; if (p === undefined || m + 1 > ate) return; const mm = m + 1; const on = lit[mm] !== undefined; o += `<rect x="${i * kw + kw * .66}" y="0" width="${kw * .66}" height="${H * .58}" rx="1.6" fill="${on ? '#c9962b' : '#1d2236'}"/>`; if (on) o += `<text x="${i * kw + kw}" y="${H * .5}" text-anchor="middle" font-size="7.4" font-weight="700" fill="#fff" font-family="Hanken, sans-serif">${lit[mm]}</text>`; else if (nomesPretas) o += `<text x="${i * kw + kw}" y="${H * .5}" text-anchor="middle" font-size="6.4" font-weight="700" fill="#e8c46a" font-family="Hanken, sans-serif">${nm(mm)}</text>`; });
  return `<svg viewBox="-1 -1 ${W + 2} ${H + 2}" width="${largura}" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
}
const acordeKbd = (nome, notas, tipo, g = false) => `<div class="kbd${g ? ' g' : ''}">${teclas({ de: 60, ate: 76, lit: Object.fromEntries(notas.map((m) => [m, nm(m)])), largura: 150 })}${nome}<br><span style="font-weight:400;color:#6b6a78">${tipo}</span></div>`;
/** Nomes embaixo das notas de uma pauta de 1 sistema. */
const comNomes = (svg, evs) => { const col = new Map(); for (const m of svg.matchAll(/<g class="pm-n[^"]*" data-ev="(\d+)"><rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)) { const e = evs[+m[1]]; if (e) col.set(Math.round(+m[2] + (+m[3]) / 2), { x: +m[2] + (+m[3]) / 2, e }); } const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); if (!vb || !col.size) return svg; const W = +vb[1]; const H = +vb[2]; const lbl = [...col.values()].map((c) => `<text x="${c.x}" y="${H + 12}" text-anchor="middle" font-size="11" font-weight="700" fill="#b8913f" font-family="Hanken, sans-serif">${nm(c.e.m)}</text>`).join(''); return svg.replace(/viewBox="0 0 [\d.]+ [\d.]+"/, `viewBox="0 0 ${W} ${H + 18}"`).replace('</svg>', `${lbl}</svg>`); };
const pauta = (lista, { clave = 'sol', larg = 640, nomes = true } = {}) => { const evs = melodia(lista); const svg = svgTeclado(evs, larg, { clave }); return nomes ? comNomes(svg, evs) : svg; };
const Q = 4, M = 8, SB = 16; // semínima, mínima, semibreve (em semicolcheias)
const seq = (midis, d = Q) => midis.map((m) => [m, d]);

const sis = (evs, clave = 'sol') => svgTeclado(evs, 800, { clave });
const MODS = [
  ['Módulo 1 · Primeiros passos', 'Primeiros passos', 'O primeiro acorde é o mais difícil. Todos os outros ficam mais fáceis depois dele.', 'Conhecer o teclado, posicionar as mãos e ler a pauta: o mapa que leva você da tecla ao som.', ['como', 'notas', 'postura', 'pauta', 'equip']],
  ['Módulo 2 · Mão direita e mão esquerda', 'Mão direita e mão esquerda', 'Dedo doendo é calo nascendo. É o teclado te dando um crachá.', 'Primeiro as notas da mão direita, depois a esquerda, e por fim as duas juntas.', ['aquec', 'primeiras', 'ritmo', 'melodias', 'melodias2', 'fa', 'esquerda', 'intervalos', 'duas']],
  ['Módulo 3 · Acordes e ritmo', 'Acordes e ritmo', 'Cada repetição fortalece a conexão entre os seus neurônios. Literalmente.', 'Acordes são três notas tocadas juntas. Com poucos você acompanha centenas de músicas.', ['maiores', 'menores', 'trocas', 'inversoes', 'acomp', 'express', 'treino', 'dicas']],
  ['Módulo 4 · Mais avançado', 'Mais avançado', 'Entender a música por dentro transforma quem só repete em quem cria.', 'Escalas, tom e semitom, teclas pretas e o campo harmônico: o que organiza toda a música.', ['escala', 'tom', 'campo']],
  ['Hora de brincar', null, null, null, ['desafios', 'respostas']],
  ['Para levar', null, null, null, ['plano4', 'plano8', 'registro', 'glossario', 'proximo', 'folha1', 'folha2']],
];
const TITULOS = { como: 'Como usar esta apostila', notas: 'O teclado e o nome das notas', postura: 'Postura e posição das mãos', pauta: 'Como ler a pauta', equip: 'Escolhendo seu teclado', aquec: 'Aquecimento das mãos', primeiras: 'As primeiras notas', ritmo: 'Figuras e pausas', melodias: 'Melodias populares', melodias2: 'Mais melodias e improviso', fa: 'Lendo a clave de fá', esquerda: 'Mão esquerda', intervalos: 'Intervalos', duas: 'Duas mãos juntas', maiores: 'Acordes maiores', menores: 'Acordes menores', trocas: 'Trocas e arpejos', inversoes: 'Inversões de acordes', acomp: 'Padrões da mão esquerda', express: 'Expressão: forte, fraco e ligado', treino: 'Treino progressivo', dicas: 'Dicas práticas', escala: 'Escala de Dó maior', tom: 'Tom, semitom, sustenido e bemol', campo: 'Campo harmônico de Dó', desafios: 'Desafios no papel', respostas: 'Respostas dos desafios', plano4: 'Plano das 4 primeiras semanas', plano8: 'Plano de 8 semanas', registro: 'Registro dos 30 dias', glossario: 'Glossário', proximo: 'E agora? Continue tocando', folha1: 'Pauta em branco', folha2: 'Seu teclado em branco' };
const SEMNUM = ['respostas', 'folha2', 'plano4', 'plano8', 'registro', 'glossario', 'proximo', 'folha1'];
const N = (id) => MODS.flatMap((m) => m[4]).filter((x) => !SEMNUM.includes(x)).indexOf(id) + 1;
const T = (id, area) => `${N(id)} · ${area}`;
const reg = {}; const B = {};

B.como = () => pg({ tag: T('como', 'COMECE AQUI'), titulo: 'Como usar esta apostila', sub: 'Siga na ordem se estiver começando do zero. Volte quantas vezes quiser.', corpo: `
<ul class="lista"><li><b>Pouco e todo dia.</b> Quinze minutos por dia rendem mais do que duas horas uma vez por semana. O cérebro grava o movimento entre um treino e outro, principalmente durante o sono.</li>
<li><b>Uma página por vez.</b> Não precisa decorar tudo. Aprenda cinco notas, treine, e só depois passe para o próximo passo.</li>
<li><b>Use a trilha.</b> Na seção ${N('treino')}, o treino progressivo tem etapas com quadradinhos para marcar. É o caminho mais curto até tocar a primeira música inteira.</li>
<li><b>Consulte quando quiser.</b> As seções de acordes e de escala servem de consulta rápida.</li></ul>
<div class="cit-p">“Você não precisa de talento para começar. Precisa começar para ganhar talento.”</div>
<div class="grade2"><div class="card"><h4>Mão direita e esquerda</h4><p>Cada mão tem uma função. A direita costuma tocar a melodia; a esquerda, o acompanhamento (acordes e notas graves).</p></div><div class="card"><h4>Sem teclado em casa?</h4><p>Dá para começar em um aplicativo de teclado no celular ou em um teclado de 49 ou 61 teclas, que já tem tudo que você precisa.</p></div></div>
${L.dica('Dica de estudo', 'toque devagar. devagar e certo vira rápido e certo; rápido e errado vira hábito errado.')}${L.caderno()}` });

B.notas = () => pg({ tag: T('notas', 'BÁSICO'), titulo: 'O teclado e o nome das notas', sub: 'O teclado é uma sequência de sete notas que se repete.', corpo: `
<div class="card"><h4>As sete notas</h4><div class="meta">dó · ré · mi · fá · sol · lá · si, e de novo dó</div>${teclas({ de: 60, ate: 83, todos: true, largura: 560 }).replace('width="560"', 'width="100%"')}</div>
<ul class="lista"><li><b>As teclas pretas aparecem em grupos de 2 e de 3.</b> É o seu mapa.</li><li><b>Dó</b> é a tecla branca logo à <b>esquerda do grupo de 2 pretas</b>.</li><li><b>Fá</b> é a tecla branca logo à <b>esquerda do grupo de 3 pretas</b>.</li><li>Depois do <b>Si</b>, as notas recomeçam em <b>Dó</b>: é uma nova “oitava”.</li><li>A tecla <b>Dó mais perto do meio</b> do teclado é o <b>Dó central</b>, sua casa base.</li></ul>
<div class="grade2"><div class="card"><h4>Para a direita, mais agudo</h4><p>Quanto mais à direita, mais fino e agudo o som.</p></div><div class="card"><h4>Para a esquerda, mais grave</h4><p>Quanto mais à esquerda, mais grosso e grave o som.</p></div></div>
${L.dica('Dica de estudo', 'aperte só as teclas Dó do seu teclado, da esquerda para a direita, e escute o som subindo. é a mesma nota, em alturas diferentes.')}` });

B.postura = () => pg({ tag: T('postura', 'BÁSICO'), titulo: 'Postura e posição das mãos', sub: 'Mão relaxada em arco, como se segurasse uma bola pequena.', corpo: `
<h2 class="s">Os dedos têm números</h2><div class="dedos"><div><b>1</b>polegar</div><div><b>2</b>indicador</div><div><b>3</b>médio</div><div><b>4</b>anelar</div><div><b>5</b>mínimo</div></div>
<p class="mut" style="text-align:center;margin-top:2mm">a numeração é igual nas duas mãos.</p>
<h2 class="s">Posição de Dó (mão direita)</h2><div class="card">${teclas({ de: 60, ate: 72, lit: { 60: '1', 62: '2', 64: '3', 65: '4', 67: '5' }, largura: 330 }).replace('width="330"', 'width="85%"')}<p>Polegar (1) no <b>Dó</b>, indicador (2) no <b>Ré</b>, médio (3) no <b>Mi</b>, anelar (4) no <b>Fá</b> e mínimo (5) no <b>Sol</b>. Os dedos ficam sobre as teclas, prontos.</p></div>
<h2 class="s">Postura</h2><ul class="lista"><li>Sente na ponta da cadeira, <b>costas retas</b>, pés no chão.</li><li><b>Cotovelos</b> na altura do teclado, nem encolhidos nem levantados.</li><li><b>Pulsos</b> retos, sem dobrar para cima ou para baixo.</li><li><b>Dedos curvos</b>: toque com a ponta, não com o dedo esticado.</li></ul>
${L.dica('Dica de estudo', 'respire e solte os ombros a cada poucos minutos. tensão no braço é o que mais atrapalha no começo.')}${L.caderno()}` });

B.pauta = () => pg({ tag: T('pauta', 'BÁSICO'), titulo: 'Como ler a pauta', sub: 'Cinco linhas e quatro espaços. A posição da nota diz qual tecla tocar.', corpo: `
<div class="card"><h4>Dó central até o Dó seguinte</h4><div class="meta">clave de sol, nota por nota</div>${pauta(seq([60, 62, 64, 65, 67, 69, 71, 72]), { larg: 640 })}<p>As notas sobem pela pauta quando você sobe no teclado. O Dó central fica numa linha pequenina embaixo da pauta (“linha suplementar”).</p></div>
<div class="grade2"><div class="card"><h4>Linhas (de baixo para cima)</h4><p style="font-size:14pt;letter-spacing:.1em"><b>Mi · Sol · Si · Ré · Fá</b></p><p class="mut">frase para lembrar: “Mi Sol Si Ré Fá”.</p></div><div class="card"><h4>Espaços (de baixo para cima)</h4><p style="font-size:14pt;letter-spacing:.1em"><b>Fá · Lá · Dó · Mi</b></p><p class="mut">formam a palavra “FÁ-LÁ-DÓ-MI”.</p></div></div>
<h2 class="s">A clave de sol e a clave de fá</h2><ul class="lista"><li>A <b>clave de sol</b> (o desenho no começo) é a da <b>mão direita</b>: notas mais agudas.</li><li>A <b>clave de fá</b> é a da <b>mão esquerda</b>: notas mais graves.</li></ul>
<h2 class="s">As figuras que você vai usar</h2><table class="t"><tr><th>Figura</th><th>Quanto vale</th></tr><tr><td>Semínima</td><td>1 tempo</td></tr><tr><td>Mínima</td><td>2 tempos</td></tr><tr><td>Semibreve</td><td>4 tempos</td></tr></table>
${L.dica('Dica de estudo', 'bata o pulso com o pé e conte em voz alta “1 – 2 – 3 – 4” enquanto toca.')}` });

B.equip = () => pg({ tag: T('equip', 'BÁSICO'), titulo: 'Escolhendo seu teclado', sub: 'O que olhar antes de comprar o primeiro instrumento.', corpo: `
<table class="t"><tr><th>Item</th><th>O que significa</th><th>Dica para quem começa</th></tr>
<tr><td><b>Número de teclas</b></td><td>49, 61, 76 ou 88 teclas.</td><td>61 teclas já cobrem a maior parte das músicas de iniciante. 88 é o tamanho de um piano completo.</td></tr>
<tr><td><b>Teclas sensíveis ao toque</b></td><td>O som fica mais forte ou fraco conforme você toca.</td><td>É a característica mais importante: ensina a expressão. Dê preferência a ela.</td></tr>
<tr><td><b>Pedal de sustentação</b></td><td>Faz o som continuar depois de soltar a tecla.</td><td>Vale ter, mas pode vir depois.</td></tr>
<tr><td><b>Saída para fones</b></td><td>Permite estudar sem incomodar.</td><td>Indispensável em apartamento.</td></tr>
<tr><td><b>Suporte e banco</b></td><td>A altura em que você toca.</td><td>Antebraços na altura das teclas. Banco firme, de preferência regulável.</td></tr>
<tr><td><b>Aplicativo no celular</b></td><td>Um teclado virtual na tela.</td><td>Serve para os primeiros dias, mas a tela não ensina o peso da tecla.</td></tr></table>
${L.dica('Antes de comprar', 'sempre que possível, toque o teclado na loja. se uma tecla “prende” ou o som engasga, escolha outro.')}<div class="cit-p">“O melhor instrumento é o que você tem em casa e toca todo dia.”</div>` });

B.aquec = () => pg({ tag: T('aquec', 'MÃO ESQUERDA'.length ? 'MÃOS' : ''), titulo: 'Aquecimento das mãos', sub: 'Cinco minutos antes de cada treino fazem diferença.', corpo: `
<table class="t"><tr><th>Minuto</th><th>O que fazer</th></tr><tr><td>1</td><td>Gire os punhos devagar, solte os ombros e alongue cada dedo com a outra mão.</td></tr><tr><td>2 a 4</td><td>Os exercícios abaixo, a 60 bpm, em cada mão.</td></tr><tr><td>5</td><td>Toque a melodia que vai estudar hoje, bem devagar.</td></tr></table>
<div class="card"><h4>1 · cinco dedos subindo e descendo</h4><div class="meta">dedos 1 – 2 – 3 – 4 – 5 – 4 – 3 – 2</div>${pauta(seq([60, 62, 64, 65, 67, 65, 64, 62]))}</div>
<div class="card"><h4>2 · repetindo cada nota</h4><div class="meta">duas batidas em cada tecla</div>${pauta([[60, 2], [60, 2], [62, 2], [62, 2], [64, 2], [64, 2], [65, 2], [65, 2]])}</div>
<div class="card"><h4>3 · saltos de terça</h4><div class="meta">1–3, 2–4, 3–5, volta</div>${pauta(seq([60, 64, 62, 65, 64, 67, 65, 62]))}</div>
${L.dica('Dica de estudo', 'o aquecimento deixa o dedo preciso e evita lesão. se sentir dor, pare.')}${L.caderno()}` });

B.primeiras = () => pg({ tag: T('primeiras', 'BÁSICO'), titulo: 'As primeiras notas', sub: 'Cinco notas, cinco dedos. Treine subindo e descendo.', corpo: `
<div class="card"><h4>Exercício 1 · subindo e descendo</h4><div class="meta">mão direita · dedos 1 – 2 – 3 – 4 – 5 – 4 – 3 – 2 · 60 bpm</div>${pauta(seq([60, 62, 64, 65, 67, 65, 64, 62]))}<p>Um dedo por tecla, sem olhar para as mãos. Cada nota dura um tempo.</p></div>
<div class="card"><h4>Exercício 2 · pulando teclas</h4><div class="meta">dedos 1 – 3 – 2 – 4 – 3 – 5 – 4 – 2</div>${pauta(seq([60, 64, 62, 65, 64, 67, 65, 62]))}<p>As notas não vão em ordem. Esse movimento treina a independência entre os dedos.</p></div>
<div class="card"><h4>Exercício 3 · notas longas e curtas</h4><div class="meta">mínima = 2 tempos · semínima = 1 tempo</div>${pauta([[60, M], [64, M], [62, Q], [62, Q], [60, M]])}<p>Conte em voz alta: “um dois, um dois, um, dois, um dois”. A nota longa fica pressionada até o fim.</p></div>
${L.dica('Dica de estudo', 'só aumente a velocidade quando sair limpo três vezes seguidas, sem tropeçar.')}${L.caderno()}` });

B.ritmo = () => pg({ tag: T('ritmo', 'RITMO'), titulo: 'Figuras e pausas', sub: 'Quanto dura cada nota e como contar o silêncio.', corpo: `
<table class="t"><tr><th>Figura</th><th>Duração</th><th>Pausa correspondente</th></tr><tr><td>Semibreve</td><td>4 tempos</td><td>pausa de semibreve (4 tempos de silêncio)</td></tr><tr><td>Mínima</td><td>2 tempos</td><td>pausa de mínima</td></tr><tr><td>Semínima</td><td>1 tempo</td><td>pausa de semínima</td></tr><tr><td>Colcheia</td><td>meio tempo</td><td>pausa de colcheia</td></tr></table>
<div class="card"><h4>Semibreve e mínimas</h4><div class="meta">1 nota = 4 tempos · 2 notas = 2 tempos cada</div>${pauta([[60, SB], [60, M], [60, M]])}</div>
<div class="card"><h4>Semínimas e colcheias</h4><div class="meta">conte “1 – 2 – 3 – 4” e “1 & 2 & 3 & 4 &”</div>${pauta([[60, Q], [60, Q], [60, Q], [60, Q], [60, 2], [60, 2], [60, 2], [60, 2], [60, 2], [60, 2], [60, 2], [60, 2]])}</div>
<div class="card"><h4>Com pausas</h4><div class="meta">o silêncio também conta</div>${pauta([[60, Q], [null, Q], [60, Q], [null, Q], [60, M], [null, M]], { nomes: false })}<p>Quando aparecer uma pausa, levante a mão e conte o tempo em silêncio. Voltar no tempo certo é metade da música.</p></div>
${L.dica('Dica de estudo', 'bata o pulso com o pé, conte em voz alta e toque só a nota Dó até o ritmo sair sem pensar.')}` });

const ode = melodia([[64, Q], [64, Q], [65, Q], [67, Q], [67, Q], [65, Q], [64, Q], [62, Q], [60, Q], [60, Q], [62, Q], [64, Q], [64, 6], [62, 2], [62, M]]);
const estrela = melodia([[60, Q], [60, Q], [67, Q], [67, Q], [69, Q], [69, Q], [67, M], [65, Q], [65, Q], [64, Q], [64, Q], [62, Q], [62, Q], [60, M]]);
const frere = melodia([[60, Q], [62, Q], [64, Q], [60, Q], [60, Q], [62, Q], [64, Q], [60, Q], [64, Q], [65, Q], [67, M], [64, Q], [65, Q], [67, M]]);
B.melodias = () => pg({ tag: T('melodias', 'BÁSICO'), titulo: 'Melodias populares', sub: 'Músicas que você já conhece, com a mão direita na posição de Dó.', corpo: `
<div class="card"><h4>Ode à Alegria</h4><div class="meta">Beethoven · clássica</div>${sis(ode)}<p><b>Mi Mi Fá Sol · Sol Fá Mi Ré · Dó Dó Ré Mi · Mi Ré Ré</b> (a última nota é mais longa). Toda a melodia cabe nas cinco notas da posição de Dó. Comece no <b>Mi</b>, com o dedo 3.</p></div>
<div class="card"><h4>Brilha, brilha, estrelinha</h4><div class="meta">cantiga tradicional</div>${sis(estrela)}<p><b>Dó Dó Sol Sol Lá Lá Sol · Fá Fá Mi Mi Ré Ré Dó</b>. Você pula do Dó para o Sol (do dedo 1 para o dedo 5) e estica o dedo 5 até o Lá.</p></div>
<div class="card"><h4>Frei João (Frère Jacques)</h4><div class="meta">cantiga tradicional</div>${sis(frere)}<p><b>Dó Ré Mi Dó · Dó Ré Mi Dó · Mi Fá Sol · Mi Fá Sol</b>. Cada frase se repete duas vezes: é fácil de decorar.</p></div>
${L.dica('Dica de estudo', 'cante junto, baixinho, enquanto toca. o ritmo aparece sozinho e a memória fica melhor.')}` });

B.melodias2 = () => { const clair = melodia([[60, Q], [60, Q], [60, Q], [62, Q], [64, M], [62, M], [60, Q], [64, Q], [62, Q], [62, Q], [60, SB]]); const idea1 = melodia([[60, Q], [64, Q], [67, Q], [69, Q], [67, Q], [64, Q], [62, M]]); const idea2 = melodia([[67, Q], [69, Q], [67, Q], [64, Q], [62, Q], [60, Q], [60, M]]);
  return pg({ tag: T('melodias2', 'MELODIAS'), titulo: 'Mais melodias e improviso', sub: 'Uma nova melodia e o primeiro passo para criar a sua.', corpo: `
<div class="card"><h4>Ao luar (Au clair de la lune)</h4><div class="meta">canção tradicional francesa</div>${sis(clair)}<p><b>Dó Dó Dó Ré · Mi (longo) Ré (longo) · Dó Mi Ré Ré · Dó (muito longo)</b>. Quatro compassos, só com as cinco notas da posição de Dó.</p></div>
<h2 class="s">Improvise com cinco notas</h2>
<p>A escala <b>pentatônica</b> de Dó usa só cinco teclas brancas: <b>Dó · Ré · Mi · Sol · Lá</b>. Com elas, nenhuma nota “soa errada”: dá para improvisar à vontade.</p>
<div class="card"><h4>Ideia 1 · subindo e voltando</h4>${sis(idea1)}</div>
<div class="card"><h4>Ideia 2 · descendo</h4>${sis(idea2)}</div>
<ol class="passos"><li>Toque uma ideia, repita e mude uma nota.</li><li>Troque o ritmo: nota longa, curta, pausa.</li><li>Invente uma frase de dois compassos e anote no papel.</li></ol>
${L.dica('Dica de estudo', 'grave sua improvisação no celular e escute depois. o que soar bem, escreva na pauta em branco.')}` }); };

B.fa = () => { const sobe = pauta(seq([48, 50, 52, 53, 55, 57, 59, 60]), { clave: 'fa' }); const graves = pauta(seq([43, 45, 47, 48, 47, 45, 43, 41]), { clave: 'fa' }); return pg({ tag: T('fa', 'MÃOS'), titulo: 'Lendo a clave de fá', sub: 'A clave da mão esquerda: notas mais graves, o mesmo raciocínio.', corpo: `
<div class="grade2"><div class="card"><h4>Linhas (de baixo para cima)</h4><p style="font-size:14pt;letter-spacing:.08em"><b>Sol · Si · Ré · Fá · Lá</b></p><p class="mut">“Sol Si Ré Fá Lá”.</p></div><div class="card"><h4>Espaços (de baixo para cima)</h4><p style="font-size:14pt;letter-spacing:.08em"><b>Lá · Dó · Mi · Sol</b></p><p class="mut">“Lá Dó Mi Sol”.</p></div></div>
<div class="card"><h4>Do Dó grave ao Dó central</h4><div class="meta">clave de fá · nota por nota</div>${sobe}<p>O último Dó, no alto, é o <b>Dó central</b>, o mesmo que aparece abaixo da pauta na clave de sol. As duas claves se encontram nele.</p></div>
<div class="card"><h4>Notas graves</h4><div class="meta">Sol, Lá, Si, Dó, Si, Lá, Sol, Fá</div>${graves}</div>
<ul class="lista"><li>Na clave de sol, o <b>Dó central</b> fica embaixo da pauta; na de fá, em cima.</li><li><b>Cuidado:</b> a linha de baixo da clave de sol é <b>Mi</b>, e a linha de baixo da clave de fá é <b>Sol</b>. Não confunda as duas.</li></ul>
${L.dica('Dica de estudo', 'escreva o nome das notas numa folha em branco, só da clave de fá, e treine uma linha por dia.')}` }); };

B.esquerda = () => pg({ tag: T('esquerda', 'BÁSICO'), titulo: 'Mão esquerda', sub: 'Posição de Dó grave: o mínimo (5) fica no Dó e o polegar (1) no Sol.', corpo: `
<div class="card">${teclas({ de: 48, ate: 60, lit: { 48: '5', 50: '4', 52: '3', 53: '2', 55: '1' }, largura: 330 }).replace('width="330"', 'width="85%"')}<p>Na mão esquerda a numeração dos dedos é a mesma, mas ela <b>sobe do dedo 5 ao dedo 1</b>: mínimo no Dó, anelar no Ré, médio no Mi, indicador no Fá e polegar no Sol.</p></div>
<div class="card"><h4>Exercício 1 · subindo</h4><div class="meta">clave de fá · dedos 5 – 4 – 3 – 2 – 1 – 2 – 3 – 4</div>${pauta(seq([48, 50, 52, 53, 55, 53, 52, 50]), { clave: 'fa' })}</div>
<div class="card"><h4>Exercício 2 · notas longas</h4><div class="meta">Dó e Sol, duas batidas cada</div>${pauta([[48, M], [55, M], [48, M], [55, M]], { clave: 'fa' })}<p>O Dó e o Sol juntos formam a base de muitos acompanhamentos. Treine até sair sem olhar.</p></div>
<div class="cit-p">“Toda mão esquerda já foi desajeitada um dia.”</div>
${L.dica('Dica de estudo', 'a mão esquerda costuma ser mais lenta no começo. é normal: o cérebro precisa de repetição para dar a ela a mesma habilidade da direita.')}${L.caderno()}` });

B.intervalos = () => { const par = (a, b) => pauta([[a, Q], [b, Q], [a, Q], [b, Q]], { larg: 320 }); return pg({ tag: T('intervalos', 'BÁSICO'), titulo: 'Intervalos', sub: 'A distância entre duas notas. Conhecer os intervalos acelera a leitura.', corpo: `
<p>Um <b>intervalo</b> é a distância entre duas notas. Conta-se o número de notas da escala, incluindo as duas pontas: de Dó a Mi são três notas (Dó, Ré, Mi), então é uma <b>terça</b>.</p>
<table class="t"><tr><th>Intervalo</th><th>De Dó até…</th><th>Semitons (teclas)</th><th>Como soa</th></tr><tr><td>2ª</td><td>Ré</td><td>2</td><td>vizinhas, “subindo um degrau”</td></tr><tr><td>3ª</td><td>Mi</td><td>4</td><td>doce, parte do acorde maior</td></tr><tr><td>4ª</td><td>Fá</td><td>5</td><td>aberto e firme</td></tr><tr><td>5ª</td><td>Sol</td><td>7</td><td>estável, a nota mais forte depois da raiz</td></tr><tr><td>6ª</td><td>Lá</td><td>9</td><td>brilhante</td></tr><tr><td>7ª</td><td>Si</td><td>11</td><td>tenso, pede resolução</td></tr><tr><td>8ª</td><td>Dó</td><td>12</td><td>a mesma nota, mais aguda</td></tr></table>
<div class="grade2"><div class="card"><h4>Terça · Dó e Mi</h4>${par(60, 64)}</div><div class="card"><h4>Quinta · Dó e Sol</h4>${par(60, 67)}</div></div>
<div class="grade2"><div class="card"><h4>Quarta · Dó e Fá</h4>${par(60, 65)}</div><div class="card"><h4>Oitava · Dó e Dó</h4>${par(60, 72)}</div></div>
${L.dica('Dica de estudo', 'toque o primeiro intervalo cantando as duas notas. o ouvido aprende a reconhecer cada distância, e isso ajuda a ler e a tocar de ouvido.')}` }); };

const mdEst = melodia([[60, Q], [60, Q], [67, Q], [67, Q], [69, Q], [69, Q], [67, M], [65, Q], [65, Q], [64, Q], [64, Q], [62, Q], [62, Q], [60, M]]);
const meEst = melodia([[48, SB], [53, M], [48, M], [53, M], [48, M], [55, M], [48, M]]);
B.duas = () => pg({ tag: T('duas', 'BÁSICO'), titulo: 'Duas mãos juntas', sub: 'A direita toca a melodia. A esquerda segura o acompanhamento.', corpo: `
<p>Toque devagar, uma mão de cada vez, até cada uma estar firme. Só depois junte as duas. Aqui, “Brilha, brilha, estrelinha” com a esquerda tocando <b>Dó, Fá e Sol</b>.</p>
<div class="card"><h4>Mão direita · melodia</h4>${sis(mdEst)}</div>
<div class="card"><h4>Mão esquerda · acompanhamento</h4>${sis(meEst, 'fa')}<p>Quatro compassos de Dó, Fá e Sol: <b>Dó (um compasso inteiro)</b> · <b>Fá e Dó</b> · <b>Fá e Dó</b> · <b>Sol e Dó</b>.</p></div>
<ol class="passos"><li>Toque só a direita, a 60 bpm, três vezes.</li><li>Toque só a esquerda, três vezes.</li><li>Junte as duas bem devagar, a 50 bpm. Se travar, volte a uma mão.</li><li>Quando sair limpo, suba para 60 bpm.</li></ol>
${L.dica('Dica de estudo', 'se uma mão contaminar a outra, pare e treine só a que erra. o cérebro precisa de pequenos blocos.')}` });

B.maiores = () => pg({ tag: T('maiores', 'BÁSICO'), titulo: 'Acordes maiores', sub: 'Soam alegres e abertos. Na cifra, é só a letra.', corpo: `
<p>Um acorde é <b>três notas ao mesmo tempo</b>, pulando uma tecla branca entre elas: a 1ª, a 3ª e a 5ª. Use os dedos <b>1 – 3 – 5</b> da mão direita.</p>
<div style="display:flex;gap:6mm;flex-wrap:wrap;justify-content:center">${acordeKbd('C · Dó maior', [60, 64, 67], 'Dó · Mi · Sol', true)}${acordeKbd('F · Fá maior', [65, 69, 72], 'Fá · Lá · Dó', true)}${acordeKbd('G · Sol maior', [67, 71, 74], 'Sol · Si · Ré', true)}</div>
<table class="t"><tr><th>Cifra</th><th>Nome</th><th>Notas</th><th>Dedos (mão direita)</th></tr><tr><td><b>C</b></td><td>Dó maior</td><td>Dó · Mi · Sol</td><td>1 · 3 · 5</td></tr><tr><td><b>F</b></td><td>Fá maior</td><td>Fá · Lá · Dó</td><td>1 · 3 · 5</td></tr><tr><td><b>G</b></td><td>Sol maior</td><td>Sol · Si · Ré</td><td>1 · 3 · 5</td></tr></table>
<p><b>Cifra</b> é a letra que representa o acorde: C = Dó, D = Ré, E = Mi, F = Fá, G = Sol, A = Lá, B = Si.</p>
${L.dica('Dica de estudo', 'aperte as três teclas ao mesmo tempo, sem atrasar nenhuma. se o som sair “quebrado”, treine só o movimento de abaixar a mão inteira.')}${L.caderno()}` });

B.menores = () => pg({ tag: T('menores', 'BÁSICO'), titulo: 'Acordes menores', sub: 'Soam mais tristes e emotivos. Na cifra ganham um “m”.', corpo: `
<p>O acorde menor difere do maior em <b>uma só nota</b>: a do meio desce uma tecla. Compare <b>C</b> (Dó · Mi · Sol) com <b>Cm</b> (Dó · Mi♭ · Sol): só o Mi muda, e o humor da música inteira muda junto.</p>
<div style="display:flex;gap:6mm;flex-wrap:wrap;justify-content:center">${acordeKbd('Am · Lá menor', [69, 72, 76], 'Lá · Dó · Mi', true)}${acordeKbd('Dm · Ré menor', [62, 65, 69], 'Ré · Fá · Lá', true)}${acordeKbd('Em · Mi menor', [64, 67, 71], 'Mi · Sol · Si', true)}</div>
<table class="t"><tr><th>Cifra</th><th>Nome</th><th>Notas</th><th>Dedos (mão direita)</th></tr><tr><td><b>Am</b></td><td>Lá menor</td><td>Lá · Dó · Mi</td><td>1 · 3 · 5</td></tr><tr><td><b>Dm</b></td><td>Ré menor</td><td>Ré · Fá · Lá</td><td>1 · 3 · 5</td></tr><tr><td><b>Em</b></td><td>Mi menor</td><td>Mi · Sol · Si</td><td>1 · 3 · 5</td></tr></table>
<div class="cit-p">Maior soa alegre. Menor soa triste. Toque os dois e sinta a diferença.</div>
${L.dica('Dica de estudo', 'toque C e Am, um depois do outro, e depois G e Em. escute como a música muda de cor só com uma nota.')}` });

B.trocas = () => pg({ tag: T('trocas', 'BÁSICO'), titulo: 'Trocas e arpejos', sub: 'Tocar acordes em sequência é a base de qualquer acompanhamento.', corpo: `
<h2 class="s">A sequência mais usada do pop</h2>
<p>Quatro acordes que aparecem em centenas de músicas. Um compasso para cada um, a 60 bpm:</p>
<div style="display:flex;gap:4mm;justify-content:center;flex-wrap:wrap">${acordeKbd('C', [60, 64, 67], 'Dó maior')}${acordeKbd('G', [67, 71, 74], 'Sol maior')}${acordeKbd('Am', [69, 72, 76], 'Lá menor')}${acordeKbd('F', [65, 69, 72], 'Fá maior')}</div>
<p style="text-align:center;font-family:'Bodoni',serif;font-size:15pt;color:var(--marinho)">C → G → Am → F</p>
<ol class="passos"><li>Toque cada acorde uma vez, contando 1 – 2 – 3 – 4, e troque.</li><li>Antecipe a troca: no último tempo do compasso, a mão já começa a viajar.</li><li>Depois, toque o acorde em cada tempo: C, C, C, C, G, G, G, G…</li></ol>
<h2 class="s">Arpejo: o acorde tocado em partes</h2>
<div class="card"><h4>Arpejo de Dó maior (C)</h4><div class="meta">Dó – Mi – Sol – Mi · duas vezes</div>${pauta([[60, 2], [64, 2], [67, 2], [64, 2], [60, 2], [64, 2], [67, 2], [64, 2]])}</div>
<div class="card"><h4>Arpejo de Lá menor (Am)</h4><div class="meta">Lá – Dó – Mi – Dó · duas vezes</div>${pauta([[57, 2], [60, 2], [64, 2], [60, 2], [57, 2], [60, 2], [64, 2], [60, 2]])}</div>
${L.dica('Dica de estudo', 'depois do arpejo, toque o acorde fechado. as notas são as mesmas: só muda o jeito de tocá-las.')}` });

B.inversoes = () => { const kb = (nome, notas, tipo) => `<div class="kbd g">${teclas({ de: 59, ate: 76, lit: Object.fromEntries(notas.map((m) => [m, nm(m)])), largura: 160 })}${nome}<br><span style="font-weight:400;color:#6b6a78">${tipo}</span></div>`; return pg({ tag: T('inversoes', 'ACORDES'), titulo: 'Inversões de acordes', sub: 'As mesmas três notas, em outra ordem: trocas mais suaves e menos movimento.', corpo: `
<p>Em vez de sempre tocar o acorde com a raiz embaixo, você pode <b>mudar a ordem das notas</b>. O acorde continua o mesmo, só muda qual nota fica embaixo.</p>
<div style="display:flex;gap:4mm;justify-content:center;flex-wrap:wrap">${kb('C · posição fundamental', [60, 64, 67], 'Dó · Mi · Sol')}${kb('C · 1ª inversão', [64, 67, 72], 'Mi · Sol · Dó')}${kb('C · 2ª inversão', [67, 72, 76], 'Sol · Dó · Mi')}</div>
<table class="t"><tr><th>Posição</th><th>Nota mais grave</th><th>Notas do acorde de Dó</th></tr><tr><td>Fundamental</td><td>Dó (a raiz)</td><td>Dó · Mi · Sol</td></tr><tr><td>1ª inversão</td><td>Mi (a 3ª)</td><td>Mi · Sol · Dó</td></tr><tr><td>2ª inversão</td><td>Sol (a 5ª)</td><td>Sol · Dó · Mi</td></tr></table>
<h2 class="s">Para que serve?</h2>
<p>Para a mão <b>quase não se mexer</b> entre dois acordes. Veja a sequência <b>C → F → G → C</b> sem sair da mesma região do teclado:</p>
<div style="display:flex;gap:2mm;justify-content:center;flex-wrap:wrap">${kb('C', [60, 64, 67], 'fundamental')}${kb('F', [60, 65, 69], '2ª inversão (Dó · Fá · Lá)')}${kb('G', [59, 62, 67], '1ª inversão (Si · Ré · Sol)')}</div>
<p class="mut">Repare como as notas ficam sempre pertinho umas das outras: o dedo 1 quase não anda.</p>
${L.dica('Dica de estudo', 'toque a sequência acima devagar, ouvindo como a troca fica suave. depois repita só com a fundamental e compare.')}` }); };

B.acomp = () => pg({ tag: T('acomp', 'ACORDES'), titulo: 'Padrões da mão esquerda', sub: 'Como transformar um acorde em acompanhamento.', corpo: `
<p>A mão esquerda dá a base da música. Estes três padrões servem para a maior parte das canções simples. Toque todos em <b>Dó maior</b>, a 60 bpm, até ficarem automáticos.</p>
<div class="card"><h4>Raiz e quinta</h4><div class="meta">Dó – Sol (grave) – Dó – Sol · o acompanhamento mais simples</div>${pauta([[48, Q], [43, Q], [48, Q], [43, Q], [48, Q], [43, Q], [48, Q], [43, Q]], { clave: 'fa' })}</div>
<div class="card"><h4>Arpejo ascendente</h4><div class="meta">Dó – Mi – Sol – Mi · soa como balada</div>${pauta([[48, 2], [52, 2], [55, 2], [52, 2], [48, 2], [52, 2], [55, 2], [52, 2]], { clave: 'fa' })}</div>
<div class="card"><h4>Baixo de Alberti</h4><div class="meta">Dó – Sol – Mi – Sol · clássico da música para piano</div>${pauta([[48, 2], [55, 2], [52, 2], [55, 2], [48, 2], [55, 2], [52, 2], [55, 2]], { clave: 'fa' })}</div>
<ol class="passos"><li>Toque o padrão com a esquerda, sozinho, até sair sem olhar.</li><li>Junte com uma melodia simples na direita (por exemplo, “Brilha, brilha, estrelinha”).</li><li>Troque o acorde da esquerda a cada compasso, seguindo a cifra.</li></ol>
${L.dica('Dica de estudo', 'o acompanhamento tem que ser mais baixo do que a melodia. toque a esquerda um pouco mais fraca para a melodia aparecer.')}` });

B.express = () => pg({ tag: T('express', 'EXPRESSÃO'), titulo: 'Expressão: forte, fraco e ligado', sub: 'O que faz uma música soar viva e não mecânica.', corpo: `
<h2 class="s">Dinâmica: o volume da música</h2>
<table class="t"><tr><th>Símbolo</th><th>Nome</th><th>Como tocar</th></tr><tr><td><b>p</b></td><td>piano</td><td>suave, com pouco peso nos dedos</td></tr><tr><td><b>mf</b></td><td>meio-forte</td><td>volume médio, o mais comum</td></tr><tr><td><b>f</b></td><td>forte</td><td>com mais peso do braço, não só dos dedos</td></tr><tr><td><b>&lt;</b> (crescendo)</td><td>crescendo</td><td>vai aumentando o volume aos poucos</td></tr><tr><td><b>&gt;</b> (diminuendo)</td><td>diminuendo</td><td>vai diminuindo o volume aos poucos</td></tr></table>
<h2 class="s">Articulação: como a nota começa e termina</h2>
<table class="t"><tr><th>Termo</th><th>Símbolo</th><th>Como tocar</th></tr><tr><td><b>Legato</b></td><td>uma curva sobre as notas</td><td>ligado: solte uma tecla só quando a próxima já soou</td></tr><tr><td><b>Staccato</b></td><td>um ponto sobre a nota</td><td>curto e destacado: solte logo depois de tocar</td></tr></table>
<h2 class="s">Para treinar</h2>
<ol class="passos"><li>Toque “Brilha, brilha, estrelinha” em <b>p</b> e depois em <b>f</b>. Escute a diferença.</li><li>Faça um <b>crescendo</b> da primeira à última nota da escala de Dó.</li><li>Toque a mesma frase em <b>legato</b> e em <b>staccato</b>.</li></ol>
<h2 class="s">O pedal de sustentação</h2>
<p>O pedal da direita <b>prolonga o som</b> depois que você solta a tecla. Use-o para ligar os acordes e deixar o som mais cheio. Pise logo depois de tocar o acorde e solte antes do próximo, para o som não “borrar”.</p>
${L.dica('Dica de estudo', 'ouça uma gravação sua e pergunte: tem diferença entre as frases? se não tem, falta dinâmica.')}` });

B.treino = () => pg({ tag: T('treino', 'TRILHA'), titulo: 'Treino progressivo', sub: 'Do zero até a primeira música completa. Uma ou duas etapas por dia; marque o quadradinho quando terminar.', corpo: `
<ul class="trilha">${[['Conheça o teclado', 'Ache todas as notas Dó do seu teclado e diga o nome de cada tecla branca.'], ['Posição de Dó', 'Mão direita, dedos 1 – 2 – 3 – 4 – 5 em Dó – Ré – Mi – Fá – Sol. Suba e desça.'], ['Leia as notas', `Toque o exercício da seção ${N('primeiras')}, olhando só a partitura.`], ['Uma melodia', 'Escolha “Brilha, brilha, estrelinha” e toque devagar com a mão direita.'], ['Mão esquerda', `Posição de Dó grave. Exercícios 1 e 2 da seção ${N('esquerda')}, a 60 bpm.`], ['Duas mãos', `Junte a direita e a esquerda, devagar, como na seção ${N('duas')}.`], ['Primeiros acordes', 'C, F e G: três teclas juntas. Treine cada um 10 vezes.'], ['Acordes menores', 'Am, Dm e Em. Compare o som de C e Am.'], ['Troca de acordes', 'C → G → Am → F, um por compasso, a 60 bpm.'], ['Arpejos', 'Toque o arpejo de C e de Am com a mão esquerda.'], ['Desafio final', 'Melodia na direita e C – G – Am – F na esquerda. Se chegou aqui, você toca teclado.']].map(([t, x], i) => `<li><b>${i + 1} ${t}</b><br><span class="mut">${x}</span></li>`).join('')}</ul>
<p class="mut" style="margin-top:3mm">Terminou a trilha? Agora é repertório. Escolha uma sequência nova do campo harmônico (seção ${N('campo')}) por semana.</p>${L.caderno()}` });

B.dicas = () => pg({ tag: T('dicas', 'PRÁTICA'), titulo: 'Dicas práticas', sub: 'Pequenos hábitos que aceleram o aprendizado.', corpo: `
<div class="grade2">${[['Pouco e todo dia', 'Dez a quinze minutos diários rendem mais que uma maratona por semana.'], ['Devagar primeiro', 'A velocidade vem da precisão. Toque no tempo em que você acerta.'], ['Olhe menos para as mãos', 'Olhe para a partitura. Os dedos aprendem a achar as teclas sozinhos.'], ['Mãos e ombros soltos', 'A tensão é inimiga do som. A cada poucos minutos, solte os ombros e sacuda as mãos.'], ['Use o metrônomo', 'Um aplicativo gratuito já serve. Comece a 50 ou 60 bpm.'], ['Corte em pedacinhos', 'Travou num compasso? Treine só ele, por um minuto, e volte ao resto.'], ['Grave seu progresso', 'Grave 30 segundos hoje e de novo daqui a um mês. A diferença motiva.'], ['Cante junto', 'Cantar enquanto toca deixa o ritmo mais natural.']].map(([t, x]) => `<div class="card"><h4>${t}</h4><p>${x}</p></div>`).join('')}</div>
<table class="t"><tr><th>bpm</th><th>Para quê</th></tr><tr><td>50 a 60</td><td>aprender uma troca ou melodia nova</td></tr><tr><td>70 a 80</td><td>quando a troca já sai sem parar</td></tr><tr><td>90 a 110</td><td>velocidade de muitas músicas pop</td></tr></table>
${L.dica('Dica de estudo', 'celebre as vitórias. cada acorde que soa limpo libera dopamina, e dopamina reforça o aprendizado.')}${L.caderno()}` });

B.escala = () => pg({ tag: T('escala', 'AVANÇADO'), titulo: 'Escala de Dó maior', sub: 'A escala mais famosa: só teclas brancas.', corpo: `
<div class="card"><h4>Dó maior · mão direita</h4><div class="meta">dedos: 1 – 2 – 3 – 1 – 2 – 3 – 4 – 5</div>${pauta([[60, Q], [62, Q], [64, Q], [65, Q], [67, Q], [69, Q], [71, Q], [72, Q]])}<p>Depois do <b>Mi</b> (dedo 3), o polegar passa <b>por baixo</b> da mão e cai no Fá. É o movimento mais importante da escala.</p></div>
<div class="card"><h4>Dó maior · mão esquerda</h4><div class="meta">dedos: 5 – 4 – 3 – 2 – 1 – 3 – 2 – 1</div>${pauta([[48, Q], [50, Q], [52, Q], [53, Q], [55, Q], [57, Q], [59, Q], [60, Q]], { clave: 'fa' })}<p>Na esquerda, depois do <b>Sol</b> (dedo 1), o dedo 3 passa <b>por cima</b> do polegar e cai no Lá.</p></div>
<ol class="passos"><li>Toque a escala subindo e descendo, devagar, a 60 bpm.</li><li>Cada nota dura um tempo. Escute se todas têm o mesmo volume.</li><li>Quando sair limpo três vezes, suba 5 bpm.</li></ol>
${L.dica('Dica de estudo', 'a escala de Dó é a “escala de mão” do pianista: ela treina precisão, passagem do polegar e leitura ao mesmo tempo.')}${L.caderno()}` });

B.tom = () => pg({ tag: T('tom', 'AVANÇADO'), titulo: 'Tom, semitom, sustenido e bemol', sub: 'As teclas pretas e o que acontece entre as notas.', corpo: `
<p>O teclado tem <b>12 notas</b> que se repetem. A menor distância entre duas teclas vizinhas é o <b>semitom</b>. Um <b>tom</b> são dois semitons, ou seja, uma tecla de distância no meio.</p>
<div class="card"><h4>Todas as 12 notas</h4><div class="meta">brancas e pretas, com o nome das pretas em sustenido</div>${teclas({ de: 60, ate: 72, todos: true, nomesPretas: true, largura: 330 }).replace('width="330"', 'width="100%"')}</div>
<ul class="lista"><li><b>Mi – Fá</b> e <b>Si – Dó</b> são os dois lugares onde <b>não há tecla preta</b> no meio: são semitons.</li><li>Todas as outras notas brancas vizinhas ficam <b>um tom</b> uma da outra, com uma preta no meio.</li></ul>
<table class="t"><tr><th>Símbolo</th><th>Nome</th><th>O que faz</th></tr><tr><td><b>♯</b></td><td>Sustenido</td><td>sobe a nota um semitom: para a tecla à direita.</td></tr><tr><td><b>♭</b></td><td>Bemol</td><td>desce a nota um semitom: para a tecla à esquerda.</td></tr></table>
<p><b>Dó♯</b> e <b>Ré♭</b> são a mesma tecla preta com dois nomes. Isso se chama <b>enarmonia</b>.</p>
<div class="cit-p">Fórmula da escala maior: tom – tom – semitom – tom – tom – tom – semitom.</div>
${L.dica('Dica de estudo', 'encontre no teclado todos os pares Mi–Fá e Si–Dó. depois toque sempre uma tecla de cada vez, subindo, e conte os semitons.')}` });

B.campo = () => pg({ tag: T('campo', 'AVANÇADO'), titulo: 'Campo harmônico de Dó', sub: 'A família de acordes de um tom: nascem da mesma escala, por isso combinam.', corpo: `
<table class="t"><tr><th>Grau</th><th>I</th><th>ii</th><th>iii</th><th>IV</th><th>V</th><th>vi</th><th>vii°</th></tr><tr><td><b>Acorde</b></td><td>C</td><td>Dm</td><td>Em</td><td>F</td><td>G</td><td>Am</td><td>B°</td></tr><tr><td><b>Nome</b></td><td>Dó</td><td>Ré m</td><td>Mi m</td><td>Fá</td><td>Sol</td><td>Lá m</td><td>Si dim</td></tr></table>
<p>A receita é sempre a mesma: <b>maior, menor, menor, maior, maior, menor, diminuto</b>. Os números romanos marcam a posição: maiúsculo para maior, minúsculo para menor.</p>
<h2 class="s">Sequências que funcionam em Dó</h2>
<table class="t"><tr><th>Graus</th><th>Em Dó</th><th>Clima</th></tr><tr><td><b>I – V – vi – IV</b></td><td>C · G · Am · F</td><td>A mais usada do pop mundial.</td></tr><tr><td><b>I – vi – IV – V</b></td><td>C · Am · F · G</td><td>Clássica dos anos 50 e das baladas.</td></tr><tr><td><b>vi – IV – I – V</b></td><td>Am · F · C · G</td><td>Mais melancólica.</td></tr><tr><td><b>I – IV – V – IV</b></td><td>C · F · G · F</td><td>Base de rock, blues e forró.</td></tr><tr><td><b>I – iii – IV – V</b></td><td>C · Em · F · G</td><td>Subida suave: ótima para MPB e louvor.</td></tr></table>
<div style="display:flex;gap:2.4mm;justify-content:center;flex-wrap:wrap">${acordeKbd('C', [60, 64, 67], 'I')}${acordeKbd('Dm', [62, 65, 69], 'ii')}${acordeKbd('Em', [64, 67, 71], 'iii')}${acordeKbd('F', [65, 69, 72], 'IV')}${acordeKbd('G', [67, 71, 74], 'V')}${acordeKbd('Am', [69, 72, 76], 'vi')}</div>
${L.dica('Dica de estudo', 'escolha uma sequência por semana e toque em todas as combinações de ritmo que você conhece: acorde, arpejo e batida.')}${L.caderno()}` });

B.desafios = () => pg({ tag: T('desafios', 'JOGOS'), titulo: 'Desafios no papel', sub: 'Pegue um lápis. As respostas estão na página seguinte.', corpo: `
<h2 class="s">Que nota é esta?</h2><div class="grade2">${[[62], [67], [64], [71]].map(([m], i) => `<div class="card"><h4>${i + 1}</h4>${svgTeclado(melodia([[m, 16]]), 320, { clave: 'sol' })}</div>`).join('')}</div>
<h2 class="s">Qual é o acorde?</h2><div style="display:flex;gap:4mm;justify-content:center;flex-wrap:wrap">${[['A', [60, 64, 67]], ['B', [65, 69, 72]], ['C', [69, 72, 76]], ['D', [67, 71, 74]]].map(([n, ms]) => `<div class="kbd">${teclas({ de: 60, ate: 76, lit: Object.fromEntries(ms.map((m) => [m, ''])), largura: 150 })}<b>${n}</b></div>`).join('')}</div>
<p class="mut" style="text-align:center">As opções: C · F · G · Am</p>
<h2 class="s">Perguntas rápidas</h2><ol class="passos"><li>Quantas teclas de distância tem um tom? E um semitom?</li><li>Entre Mi e Fá existe tom ou semitom?</li><li>Dó♯ é a mesma tecla que qual nota com bemol?</li><li>Qual dedo toca o Dó na posição de Dó da mão direita?</li><li>O que quer dizer o “m” em Am?</li></ol>` });
B.respostas = () => pg({ tag: T('desafios', 'JOGOS'), titulo: 'Respostas dos desafios', corpo: `
<h2 class="s">Que nota é esta?</h2><table class="t"><tr><th>1</th><th>2</th><th>3</th><th>4</th></tr><tr><td>Ré</td><td>Sol</td><td>Mi</td><td>Si</td></tr></table>
<h2 class="s">Qual é o acorde?</h2><table class="t"><tr><th>A</th><th>B</th><th>C</th><th>D</th></tr><tr><td>C (Dó maior)</td><td>F (Fá maior)</td><td>Am (Lá menor)</td><td>G (Sol maior)</td></tr></table>
<h2 class="s">Perguntas rápidas</h2><table class="t"><tr><th>Nº</th><th>Resposta</th></tr><tr><td>1</td><td>Um tom são duas teclas de distância (uma no meio); um semitom é a tecla vizinha.</td></tr><tr><td>2</td><td>Semitom.</td></tr><tr><td>3</td><td>Ré♭.</td></tr><tr><td>4</td><td>O polegar (dedo 1).</td></tr><tr><td>5</td><td>Menor (Lá menor).</td></tr></table>
<div class="cit-p" style="margin-top:8mm">“Errar é o jeito que o cérebro calibra a mira. Hoje você sabe mais do que ontem. Isso já é vitória.”</div><p class="gde" style="text-align:center;margin-top:8mm">Parabéns por chegar até aqui.</p>` });

B.plano4 = () => pg({ tag: 'PLANO · suas 4 primeiras semanas', titulo: 'Do zero à primeira música', sub: '10 a 15 minutos por dia valem mais que 1 hora no domingo. Marque um X em cada dia que tocar.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta</th></tr><tr><td><b>1</b></td><td>Mão e ouvido</td><td>Achar todas as notas Dó, posição de Dó e exercício 1 da seção ${N('primeiras')}.</td></tr><tr><td><b>2</b></td><td>Melodia</td><td>“Brilha, brilha, estrelinha” com a mão direita, sem olhar as mãos.</td></tr><tr><td><b>3</b></td><td>Acordes</td><td>C, F, G, Am: trocar entre dois acordes a 60 bpm.</td></tr><tr><td><b>4</b></td><td>Duas mãos</td><td>Melodia na direita e acompanhamento na esquerda. Grave um vídeo seu.</td></tr></table>
<h2 class="s">Marque seus dias</h2><p style="font-size:15pt;letter-spacing:.2em;line-height:2">${'☐ '.repeat(28)}</p>
<h2 class="s">Minha meta pessoal</h2><p style="line-height:2.4;color:#b8b09a">____________________________________________________________________<br>____________________________________________________________________</p>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que ficou mais fácil?</th><th>O que ainda travo?</th></tr>${[1, 2, 3, 4].map((n) => `<tr><td><b>${n}</b></td><td style="height:13mm"></td><td></td></tr>`).join('')}</table>` });
B.plano8 = () => pg({ tag: 'PLANO · 8 semanas', titulo: 'Da melodia à música completa', sub: 'Se você terminou as 4 primeiras semanas, este é o próximo degrau.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta da semana</th></tr><tr><td><b>1 a 4</b></td><td>Base</td><td>Plano das 4 primeiras semanas (página anterior).</td></tr><tr><td><b>5</b></td><td>Clave de fá</td><td>Ler as notas da clave de fá sem olhar a tabela (seção ${N('fa')}).</td></tr><tr><td><b>6</b></td><td>Acompanhamento</td><td>Os três padrões da mão esquerda, em Dó maior (seção ${N('acomp')}).</td></tr><tr><td><b>7</b></td><td>Inversões</td><td>Tocar C → F → G → C com inversões, sem tirar a mão do lugar.</td></tr><tr><td><b>8</b></td><td>Música completa</td><td>Uma música inteira com melodia e acompanhamento. Grave um vídeo.</td></tr></table>
<h2 class="s">Metas de andamento</h2><table class="t"><tr><th>Exercício</th><th>Sem. 5</th><th>Sem. 6</th><th>Sem. 7</th><th>Sem. 8</th></tr><tr><td>Escala de Dó (direita)</td><td>70 bpm</td><td>75 bpm</td><td>80 bpm</td><td>85 bpm</td></tr><tr><td>Troca C → G → Am → F</td><td>60 bpm</td><td>65 bpm</td><td>70 bpm</td><td>75 bpm</td></tr><tr><td>Duas mãos</td><td>55 bpm</td><td>60 bpm</td><td>65 bpm</td><td>70 bpm</td></tr></table>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que consegui?</th><th>O que vou melhorar?</th></tr>${[5, 6, 7, 8].map((n) => `<tr><td><b>${n}</b></td><td style="height:14mm"></td><td></td></tr>`).join('')}</table>
${L.dica('Lembre-se', 'o progresso entre as semanas 5 e 8 é mais lento do que no começo. isso é normal: você já aprendeu o básico e agora está refinando.')}` });
B.registro = () => { const col = (a, b) => `<table class="t" style="table-layout:fixed"><tr><th style="width:9mm">Dia</th><th style="width:13mm">Min.</th><th>O que toquei</th></tr>${Array.from({ length: b - a + 1 }, (_, i) => `<tr><td style="height:8.6mm"><b>${a + i}</b></td><td></td><td></td></tr>`).join('')}</table>`; return pg({ tag: 'REGISTRO', titulo: 'Os seus 30 dias', sub: 'Anote o tempo e o que tocou. Ver o caderno cheio é o melhor motivador.', corpo: `<div class="grade2">${col(1, 15)}${col(16, 30)}</div>${L.dica('Como preencher', 'escreva só o essencial: “escala de Dó, 60 bpm, 3 acertos”. se um dia você não tocou, deixe em branco e volte no dia seguinte, sem culpa.')}` }); };
B.glossario = () => pg({ tag: 'GLOSSÁRIO', titulo: 'Palavras que você vai ouvir', sub: 'Para conversar com outros músicos sem dúvida.', corpo: `
<table class="t"><tr><th>Termo</th><th>O que é</th></tr>
${[['Acorde', 'Três ou mais notas tocadas ao mesmo tempo.'], ['Arpejo', 'As notas de um acorde tocadas uma de cada vez.'], ['Cifra', 'A letra que representa um acorde: C, Dm, G7…'], ['Clave', 'O símbolo no começo da pauta que diz quais são as notas.'], ['Compasso', 'Um bloco de tempos. Em 4/4, quatro tempos por compasso.'], ['Dinâmica', 'A variação de volume: forte, fraco, crescendo…'], ['Escala', 'Sequência de notas em ordem, como a escala de Dó maior.'], ['Intervalo', 'A distância entre duas notas.'], ['Inversão', 'O mesmo acorde com outra nota embaixo.'], ['Legato', 'Tocar ligado, sem separar as notas.'], ['Oitava', 'A distância entre uma nota e a próxima com o mesmo nome.'], ['Pedal', 'O pedal de sustentação, que prolonga o som.'], ['Pentatônica', 'Escala de cinco notas, boa para improvisar.'], ['Semitom', 'A menor distância entre duas teclas vizinhas.'], ['Staccato', 'Tocar curto, destacando cada nota.'], ['Tom', 'Dois semitons. Também significa o “tom” da música: a nota base.']].map(([t, x]) => `<tr><td><b>${t}</b></td><td>${x}</td></tr>`).join('')}</table>` });
B.proximo = () => pg({ tag: 'PRÓXIMO PASSO', titulo: 'E agora? Continue tocando.', corpo: `
<p>Quem chegou até aqui já sabe o mais difícil: <b>começar</b>. Agora é repetir um pouco todo dia.</p>
<ul class="lista"><li><b>Escolha uma música nova por mês</b> e descubra os acordes dela com a cifra.</li><li><b>Toque com outras pessoas.</b> Um violão, uma voz ou uma roda de amigos: o ritmo melhora muito tocando junto.</li><li><b>Grave um vídeo</b> e compare daqui a 30 dias.</li><li><b>Peça ajuda.</b> Um professor corrige a postura e a posição das mãos em minutos.</li></ul>
<h2 class="s">O que eu aprendi</h2><ul class="trilha"><li>Sei o nome das teclas brancas e onde ficam o Dó e o Fá.</li><li>Leio notas na clave de sol e na clave de fá.</li><li>Toco uma melodia com a direita e um acompanhamento com a esquerda.</li><li>Faço os acordes C, F, G, Am, Dm e Em.</li></ul>
<h2 class="s">Minha lista de músicas para tocar</h2><table class="t"><tr><th>Música</th><th>Tom</th><th>Acordes</th><th>Já toco?</th></tr>${[1, 2, 3, 4, 5].map(() => '<tr><td style="height:9mm"></td><td></td><td></td><td>☐</td></tr>').join('')}</table>
<div class="card" style="margin-top:4mm"><h4>Aulas na Beaterista</h4><p>Aulas de música para adultos e crianças, em Araçatuba. Rua Liberdade, 268. WhatsApp <b>18 991804150</b>. Mais materiais em <b>beaterista.com.br</b>.</p></div>` });
const sist = (n, grande) => { let o = ''; for (let i = 0; i < n; i++) { const y = 20 + i * (grande ? 128 : 62); const linhas = (yy) => [0, 1, 2, 3, 4].map((k) => `<line x1="30" x2="690" y1="${yy + k * 10}" y2="${yy + k * 10}" stroke="#1d2236" stroke-width="1"/>`).join(''); o += linhas(y); if (grande) o += linhas(y + 62); o += `<line x1="30" x2="30" y1="${y}" y2="${y + (grande ? 102 : 40)}" stroke="#1d2236" stroke-width="1.4"/>`; for (let k = 1; k <= 4; k++) o += `<line x1="${30 + k * 165}" x2="${30 + k * 165}" y1="${y}" y2="${y + 40}" stroke="#1d2236"/>` + (grande ? `<line x1="${30 + k * 165}" x2="${30 + k * 165}" y1="${y + 62}" y2="${y + 102}" stroke="#1d2236"/>` : ''); } return `<svg viewBox="0 0 720 ${20 + n * (grande ? 128 : 62)}" width="100%">${o}</svg>`; };
B.folha1 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Pauta em branco', sub: 'Duas pautas ligadas (clave de sol em cima, clave de fá embaixo): para as duas mãos.', corpo: `<p class="mut">Nome: ______________________________ &nbsp; Data: ____/____</p>${sist(4, true)}` });
const tec = () => `<div style="margin:4mm 0">${teclas({ de: 48, ate: 84, largura: 700 }).replace('width="700"', 'width="100%"')}</div>`;
B.folha2 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Seu teclado em branco', sub: 'Pinte as teclas e escreva o nome das notas.', corpo: `${tec()}${tec()}<p class="mut">Pinte as teclas de cada acorde e escreva o nome dele ao lado:</p>${[1, 2, 3, 4].map(() => `<div style="display:flex;align-items:center;gap:6mm;margin:2mm 0">${teclas({ de: 60, ate: 76, largura: 220 })}<span style="border-bottom:.3mm solid #b8913f;flex:1;height:7mm"></span></div>`).join('')}` });

/* montagem */
const arte = (() => { const w = 22; let o = ''; for (let i = 0; i < 14; i++) o += `<rect x="${i * w}" y="0" width="${w - 1.5}" height="78" rx="2" fill="none" stroke="#d9b866" stroke-width="1.1"/>`; [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].forEach((i) => { o += `<rect x="${i * w + 15}" y="0" width="14" height="46" rx="1.5" fill="#d9b866"/>`; }); return `<svg viewBox="0 0 ${14 * w} 80" width="${14 * w * .95}" height="76" xmlns="http://www.w3.org/2000/svg">${o}</svg>`; })();
const P = []; P.push(L.capa({ t1: 'teclado', t2: 'do zero', lema: 'da primeira tecla à primeira música', arte, faixa: 'apostila de teclado · método Beaterista' }));
P.push('@@SUMARIO@@'); L.pular();
for (const [i, m] of MODS.entries()) {
  if (m[1]) P.push(L.divisor({ modulo: i + 1, titulo: m[1], citacao: m[2], texto: m[3], itens: m[4].map((id) => [N(id), TITULOS[id]]), nome: NOME }));
  for (const id of m[4]) { if (id === 'folha1') { reg[id] = L.paginaAtual() + 1; P.push(B.folha1(), B.folha2()); continue; } if (id === 'folha2') continue; reg[id] = L.paginaAtual() + 1; P.push(B[id]()); }
}
const sum = L.sumario(MODS.map((m) => [m[0], m[4].filter((id) => !['folha2', 'respostas'].includes(id)).map((id) => [SEMNUM.includes(id) ? '·' : N(id), TITULOS[id], reg[id]])]), NOME, '', 2);
P[1] = sum;
writeFileSync('/tmp/apo/teclado.html', L.doc(P, 'Teclado do zero · Beaterista', 'azul'));
console.log('páginas:', P.length);
