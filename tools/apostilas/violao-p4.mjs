// Atividades (com gabarito calculado), planos, folhas para imprimir, glossário e a escola.
import { execFileSync } from 'node:child_process';
export function registra(B, c) {
  const { L, V, pg, N, T, ac, acs, acx, bat, part, AC, MEL } = c;
  const alt = V.altura; const nome = (s, f) => V.nomePt(alt(s, f));
  const ORD = (s) => `${s}ª`;
  const estrelas = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const campoMaior = (raiz) => { const NOT = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; const ESC = [0, 2, 4, 5, 7, 9, 11]; const Q = ['', 'm', 'm', '', '', 'm', '°']; const r = NOT.indexOf(raiz); return ESC.map((e, i) => NOT[(r + e) % 12] + Q[i]); };
  const intervalo = (a, b) => { const st = (b - a + 120) % 12; return ['uníssono', '2ª menor', '2ª maior', '3ª menor', '3ª maior', '4ª justa', '4ª aumentada (5ª diminuta)', '5ª justa', '6ª menor', '6ª maior', '7ª menor', '7ª maior'][st]; };

  /* dados dos desafios (gabarito calculado a partir das funções acima) */
  const D1 = [[6, 5], [5, 7], [4, 2], [3, 4], [2, 8], [1, 5]]; // corda, casa
  const D2 = ['G', 'Dm', 'E7', 'Am'];
  const D4 = ['A', 'F#m', 'Bm', 'G'];
  const D5 = [['E', 'G#'], ['A', 'E'], ['D', 'C'], ['G', 'B']]; // notas
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, 'G#': 8 };
  const D6 = [['C', 'D', 'E', 'F', 'G', 'A', 'B'], [0, 3, 5]]; // Dó maior sem 3 notas
  const D7 = [['G', 'C', 'D', 'Em'], ['D', 'G', 'A', 'Bm'], ['Am', 'Dm', 'E'], ['F', 'Bb', 'C', 'Dm']];
  const D7r = ['Sol maior', 'Ré maior', 'Lá menor', 'Fá maior'];
  const D8 = [['D', 'I – vi – IV – V'], ['G', 'I – V – vi – IV'], ['A', 'I – IV – V – IV']];
  const grau = { 'I – vi – IV – V': [0, 5, 3, 4], 'I – V – vi – IV': [0, 4, 5, 3], 'I – IV – V – IV': [0, 3, 4, 3] };
  const D9 = { notas: ['D4', 'E4', 'F4', 'G4'], correta: [[2, 3], [2, 5], [2, 6], [2, 8]], errada: 2 };

  const diagVazio = () => { const x0 = 24, y0 = 40, dx = 14.4, dy = 21; let o = ''; for (let k = 0; k < 6; k++) o += `<line x1="${x0 + k * dx}" y1="${y0}" x2="${x0 + k * dx}" y2="${y0 + 5 * dy}" stroke="#0a0406" stroke-width="1.4"/>`; for (let r = 0; r <= 5; r++) o += `<line x1="${x0}" y1="${y0 + r * dy}" x2="${x0 + 5 * dx}" y2="${y0 + r * dy}" stroke="#0a0406" stroke-width="${r === 0 ? 4 : 1.2}"/>`; return `<svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg"><text x="${x0 - 6}" y="${y0 + 14}" text-anchor="end" font-size="10" fill="#6b6558" font-family="Hanken, sans-serif">__ª</text>${o}</svg>`; };
  const semNome = (def) => V.diagrama(def, { rotulo: false });

  B.desafios = () => pg({ tag: T('desafios', 'JOGOS'), titulo: 'Desafios no papel', sub: `Pegue um lápis. O gabarito de todas as atividades está na seção “Respostas dos desafios” (página ${c.NUMS.respostas || ''}).`, corpo: `
<p class="mut">Nível: ★ fácil · ★★ médio · ★★★ desafio.</p>
<h2 class="s">1 · Identifique as notas ${estrelas(1)}</h2>
<table class="t"><tr><th>Corda e casa</th><th>Nota</th></tr>${D1.map(([s, f]) => `<tr><td>${ORD(s)} corda, casa ${f}</td><td></td></tr>`).join('')}</table>
<h2 class="s">2 · Descubra o acorde ${estrelas(1)}</h2>
<div class="acs">${D2.map((k, i) => `<div class="ac">${semNome(AC[k])}<b>${'abcd'[i]}</b></div>`).join('')}</div>
<p class="mut">Opções: G · Dm · E7 · Am. Resposta: a __ b __ c __ d __</p>
<h2 class="s">3 · Complete o diagrama ${estrelas(2)}</h2>
<p>Desenhe os dedos de <b>C</b> (Dó maior) e de <b>Em</b> (Mi menor). Marque ○ nas cordas soltas e ✕ nas que não tocam.</p>
<div class="acs"><div class="ac">${diagVazio()}<b>C</b></div><div class="ac">${diagVazio()}<b>Em</b></div></div>
<h2 class="s">4 · Encontre a fundamental ${estrelas(2)}</h2>
<p>Em cada acorde, diga qual <b>corda e casa</b> tem a nota que dá nome ao acorde (a bolinha dourada). Use a mais grave.</p>
<table class="t"><tr><th>Acorde</th><th>Fundamental na…</th></tr>${D4.map((k) => `<tr><td>${AC[k].c} <span class="mut">${AC[k].f}</span></td><td></td></tr>`).join('')}</table>` });
  B.desafios2 = () => pg({ tag: T('desafios2', 'JOGOS'), titulo: 'Mais desafios', corpo: `
<h2 class="s">5 · Identifique o intervalo ${estrelas(2)}</h2>
<table class="t"><tr><th>Notas (para cima)</th><th>Intervalo</th></tr>${D5.map(([a, b]) => `<tr><td>${V.nomePt(PC[a] === undefined ? 0 : PC[a])} → ${V.nomePt(PC[b])}</td><td></td></tr>`).join('')}</table>
<h2 class="s">6 · Complete a escala ${estrelas(2)}</h2>
<p>Escreva as notas que faltam na escala de Dó maior: <b>Dó · Ré · __ · Fá · __ · Lá · __ · Dó</b></p>
<h2 class="s">7 · Descubra a tonalidade ${estrelas(3)}</h2>
<table class="t"><tr><th>Acordes da música</th><th>Tom</th></tr>${D7.map((a) => `<tr><td>${a.join(' · ')}</td><td></td></tr>`).join('')}</table>
<h2 class="s">8 · Monte uma progressão ${estrelas(2)}</h2>
<table class="t"><tr><th>Tom</th><th>Graus</th><th>Acordes</th></tr>${D8.map(([t, g]) => `<tr><td>${t}</td><td>${g}</td><td></td></tr>`).join('')}</table>
<h2 class="s">9 · Corrija a tablatura ${estrelas(3)}</h2>
<p>Quero tocar <b>Ré · Mi · Fá · Sol</b> na 2ª corda. Esta tablatura tem um erro. Qual nota está errada e qual é a casa certa?</p>
<pre style="font:700 12pt/1.35 'Hanken',monospace;margin:2mm 0 3mm;letter-spacing:.06em">e |-------------------|
B |--3----5----7----8--|
G |-------------------|</pre>
<p>Nota errada: ____ · casa certa: ____</p>
<h2 class="s">10 · Crie a sua própria batida ${estrelas(1)}</h2>
${bat('Minha batida', '________ · ____ bpm', ['', '', '', '', '', '', '', ''], 8, '')}
<h2 class="s">11 · Crie uma melodia ${estrelas(3)}</h2>
<p>Use só a escala de Dó maior (seção ${N('escalas')}) e termine no Dó. Escreva a tablatura:</p>
<div class="ilus">${c.pautaVazia({ tab: true, pauta: false, sistemas: 1 })}</div>
<h2 class="s">12 · Monte o seu acompanhamento ${estrelas(3)}</h2>
<table class="t"><tr><th>Música</th><th>Tom</th><th>Acordes (em ordem)</th><th>Batida</th></tr><tr><td style="height:12mm"></td><td></td><td></td><td></td></tr></table>
${L.dica('Dica', 'confira no gabarito só depois de tentar. errar faz parte: o cérebro calibra a mira.')}` });

  B.respostas = () => { const r1 = D1.map(([s, f]) => nome(s, f)); const r2 = D2.map((k) => `${AC[k].c} (${AC[k].nome})`);
    const r4 = D4.map((k) => { const p = V.validaAcorde({ ...AC[k], d: null }); const rz = (() => { const pc = V.rootPc(AC[k].c.replace(/m$/, '')); const cand = p.tocadas.filter((n) => n.midi % 12 === pc).sort((a, b) => a.midi - b.midi)[0]; return `${ORD(cand.s)} corda, casa ${cand.f}`; })(); return rz; });
    const r5 = D5.map(([a, b]) => intervalo(PC[a], PC[b]));
    const r7 = D7r; const r8 = D8.map(([t, g]) => { const campo = campoMaior(t); return grau[g].map((i) => campo[i]).join(' · '); });
    const nomesPos = D9.correta.map(([s, f]) => nome(s, f)); const errada = D9.errada;
    return pg({ tag: 'RESPOSTAS', titulo: 'Respostas dos desafios', sub: 'Confira só depois de tentar. Errou? Volte à seção correspondente e tente de novo.', corpo: `
<table class="t"><tr><th style="width:12mm">Nº</th><th>Resposta</th></tr>
<tr><td>1</td><td>${D1.map(([s, f], i) => `${ORD(s)} corda casa ${f} = <b>${r1[i]}</b>`).join(' · ')}</td></tr>
<tr><td>2</td><td>${r2.map((x, i) => `${'abcd'[i]} = ${x}`).join(' · ')}</td></tr>
<tr><td>3</td><td>C = x32010 (dedo 3 na 5ª corda, casa 3; dedo 2 na 4ª, casa 2; dedo 1 na 2ª, casa 1; ○ na 3ª e na 1ª; ✕ na 6ª). Em = 022000 (dedo 2 na 5ª, casa 2; dedo 3 na 4ª, casa 2; as outras cordas soltas).</td></tr>
<tr><td>4</td><td>${D4.map((k, i) => `${AC[k].c}: ${r4[i]}`).join(' · ')}</td></tr>
<tr><td>5</td><td>${D5.map(([a, b], i) => `${V.nomePt(PC[a])}→${V.nomePt(PC[b])}: ${r5[i]}`).join(' · ')}</td></tr>
<tr><td>6</td><td>Dó · Ré · <b>Mi</b> · Fá · <b>Sol</b> · Lá · <b>Si</b> · Dó</td></tr>
<tr><td>7</td><td>${D7.map((a, i) => `${a.join(' ')} = ${r7[i]}`).join(' · ')}</td></tr>
<tr><td>8</td><td>${D8.map(([t, g], i) => `${t}: ${r8[i]}`).join(' · ')}</td></tr>
<tr><td>9</td><td>A nota errada é o <b>Fá</b>: a casa 7 da 2ª corda é ${nome(2, 7)}. Fá na 2ª corda está na <b>casa 6</b> (${nome(2, 6)}). Notas certas: ${nomesPos.join(' · ')}.</td></tr>
<tr><td>10, 11, 12</td><td>Respostas livres. Confira se a batida tem o número certo de tempos e se a melodia termina no Dó.</td></tr></table>
<div class="cit-p" style="margin-top:5mm">“Errar é o jeito que o cérebro calibra a mira. Hoje você sabe mais do que ontem. Isso já é vitória.”</div>` }); };

  /* ---------------- organização ---------------- */
  const sem = (n, linhas) => linhas.map(([s, foco, meta]) => `<tr><td><b>${s}</b></td><td>${foco}</td><td>${meta}</td></tr>`).join('');
  B.plano4 = () => pg({ tag: 'PLANO · suas 4 primeiras semanas', titulo: 'Do zero ao primeiro acorde tocado', sub: '15 minutos por dia valem mais que 1 hora no domingo. Marque um X em cada dia que tocar.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta</th></tr>${sem(4, [[1, 'Cordas e postura', 'Afinar o violão, nomear as 6 cordas, postura sentada e mão esquerda (seções ' + N('postura') + ' e ' + N('afinacao') + ').'], [2, 'Primeiros acordes', 'Em e Am, a troca Em ↔ Am a 60 bpm, só para baixo.'], [3, 'G, C e D', 'Sequência G → C → D com baixo e cima, a 65 bpm.'], [4, 'Primeira música', 'Melodia “Brilha, brilha” ou sequência G → D → Em → C com batida pop. Grave um vídeo seu.']])}</table>
<h2 class="s">Marque seus dias</h2><p style="font-size:15pt;letter-spacing:.2em;line-height:2">${'☐ '.repeat(28)}</p>
<h2 class="s">Minha meta pessoal</h2><p style="line-height:2.4;color:#b8b09a">____________________________________________________________________<br>____________________________________________________________________</p>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que ficou mais fácil?</th><th>O que ainda travo?</th></tr>${[1, 2, 3, 4].map((n) => `<tr><td><b>${n}</b></td><td style="height:10mm"></td><td></td></tr>`).join('')}</table>` });
  B.plano8 = () => pg({ tag: 'PLANO · 8 semanas', titulo: 'Das trocas à música completa', sub: 'Se você terminou as 4 primeiras semanas, este é o próximo degrau.', corpo: `
<table class="t"><tr><th>Semana</th><th>Foco</th><th>Meta</th></tr>${sem(8, [['1 a 4', 'Base', 'Plano das 4 primeiras semanas (página anterior).'], [5, 'Acordes novos', 'A, E, Dm e a batida com abafada; troca Am → Dm → E a 76 bpm.'], [6, 'Dedilhado', 'p i m a em Am e C, a 60 bpm.'], [7, 'Pestana', 'F (minipestana ou F/C) e Bm. Troca C → G → Am → F a 70 bpm.'], [8, 'Música completa', 'Uma música inteira com acordes e batida, ou uma melodia da seção ' + N('melodias') + '.']])}</table>
<h2 class="s">Metas de andamento</h2><table class="t"><tr><th>Exercício</th><th>Sem. 5</th><th>Sem. 6</th><th>Sem. 7</th><th>Sem. 8</th></tr><tr><td>Troca G → C → D</td><td>70 bpm</td><td>75 bpm</td><td>80 bpm</td><td>85 bpm</td></tr><tr><td>Troca C → G → Am → F</td><td>60 bpm</td><td>65 bpm</td><td>70 bpm</td><td>76 bpm</td></tr><tr><td>Dedilhado p i m a</td><td>50 bpm</td><td>56 bpm</td><td>60 bpm</td><td>66 bpm</td></tr></table>
<h2 class="s">Como foi cada semana</h2><table class="t"><tr><th>Semana</th><th>O que consegui?</th><th>O que vou melhorar?</th></tr>${[5, 6, 7, 8].map((n) => `<tr><td><b>${n}</b></td><td style="height:10mm"></td><td></td></tr>`).join('')}</table>
${L.dica('Lembre-se', 'o progresso entre as semanas 5 e 8 é mais lento do que no começo. isso é normal: você já aprendeu o básico e agora está refinando.')}` });
  B.plano12 = () => pg({ tag: 'PLANO · 12 semanas', titulo: 'Plano de 12 semanas', sub: '15 minutos por dia: 3 de aquecimento, 4 de técnica, 4 de acordes e ritmo, 4 de aplicação musical.', corpo: `
<table class="t"><tr><th>Sem.</th><th>Técnica e teoria</th><th>Acordes e ritmo</th><th>Repertório</th><th>OK</th></tr>
<tr><td>1</td><td>postura, afinação, cordas</td><td>Em e Am</td><td>cordas soltas</td><td>☐</td></tr>
<tr><td>2</td><td>figuras e pausas</td><td>troca Em ↔ Am, só para baixo</td><td>leitura 1 e 2</td><td>☐</td></tr>
<tr><td>3</td><td>leitura de tablatura</td><td>G, C, D</td><td>Brilha, brilha</td><td>☐</td></tr>
<tr><td>4</td><td>localizar notas no braço</td><td>baixo e cima</td><td>Frei João</td><td>☐</td></tr>
<tr><td>5</td><td>tom, semitom, sustenido</td><td>pop clássico</td><td>Ode à Alegria</td><td>☐</td></tr>
<tr><td>6</td><td>intervalos</td><td>abafada</td><td>Parabéns</td><td>☐</td></tr>
<tr><td>7</td><td>dedilhado p i m a</td><td>Am, Dm, E, A7</td><td>Jingle Bells</td><td>☐</td></tr>
<tr><td>8</td><td>escala de Dó maior</td><td>pestana: F/C, Fmaj7</td><td>Noite Feliz</td><td>☐</td></tr>
<tr><td>9</td><td>hammer-on e pull-off</td><td>C → G → Am → F</td><td>acompanhar uma música</td><td>☐</td></tr>
<tr><td>10</td><td>pentatônica de Lá</td><td>campo harmônico de C</td><td>improvisar 8 compassos</td><td>☐</td></tr>
<tr><td>11</td><td>capotraste e transposição</td><td>I – V – vi – IV em outro tom</td><td>escolher uma música</td><td>☐</td></tr>
<tr><td>12</td><td>revisão e projeto final</td><td>batida de um estilo</td><td>tocar uma música inteira</td><td>☐</td></tr></table>
${L.dica('Como usar', 'marque o quadrado quando conseguir cumprir a meta da semana 4 vezes seguidas, sem errar. se a semana não fechou, repita: não existe atraso, existe repetição.')}` });
  B.registro = () => { const col = (a, b) => `<table class="t" style="table-layout:fixed"><tr><th style="width:9mm">Dia</th><th style="width:13mm">Min.</th><th>O que toquei</th></tr>${Array.from({ length: b - a + 1 }, (_, i) => `<tr><td style="height:8.6mm"><b>${a + i}</b></td><td></td><td></td></tr>`).join('')}</table>`; return pg({ tag: 'REGISTRO', titulo: 'Os seus 30 dias', sub: 'Anote o tempo e o que tocou. Ver o caderno cheio é o melhor motivador.', corpo: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm">${col(1, 15)}${col(16, 30)}</div>${L.dica('Como preencher', 'escreva só o essencial: “G → C, 60 bpm, 3 acertos”. se um dia você não tocou, deixe em branco e volte no dia seguinte, sem culpa.')}` }); };
  B.controle = () => pg({ tag: 'CONTROLE', titulo: 'Controle de evolução', sub: 'BPM, repertório, trocas de acordes, dificuldades e metas.', corpo: `
<h2 class="s">Controle de bpm</h2><table class="t"><tr><th>Exercício</th><th>1ª semana</th><th>2ª</th><th>3ª</th><th>4ª</th></tr>${[1, 2, 3].map(() => '<tr><td style="height:9mm"></td><td></td><td></td><td></td><td></td></tr>').join('')}</table>
<h2 class="s">Acompanhamento de troca de acordes (quantas trocas limpas em 1 minuto)</h2><table class="t"><tr><th>Troca</th><th>Data</th><th>Trocas</th><th>Data</th><th>Trocas</th></tr>${['Em ↔ Am', 'G ↔ C', 'C ↔ G ↔ Am ↔ F'].map((x) => `<tr><td>${x}</td><td style="height:9mm"></td><td></td><td></td><td></td></tr>`).join('')}</table>
<h2 class="s">Registro de dificuldades</h2><table class="t"><tr><th>Data</th><th>O que travou</th><th>O que vou tentar</th></tr>${[1, 2, 3].map(() => '<tr><td style="height:9mm"></td><td></td><td></td></tr>').join('')}</table>
<h2 class="s">Metas semanais</h2><table class="t"><tr><th>Semana</th><th>Meta</th><th>Cumpri?</th></tr>${[1, 2, 3, 4].map((n) => `<tr><td>${n}</td><td style="height:9mm"></td><td>☐ sim ☐ em parte ☐ não</td></tr>`).join('')}</table>
<h2 class="s">Checklist de evolução</h2><ul class="trilha">${['Afino o violão sozinho', 'Leio o desenho de um acorde', 'Faço C, G, D, Em e Am limpos', 'Troco de acorde sem parar o ritmo', 'Toco 3 batidas diferentes', 'Leio uma melodia na tablatura', 'Faço o F de alguma forma', 'Toco uma música inteira'].map((t) => `<li>${t}</li>`).join('')}</ul>` });

  /* ---------------- folhas para imprimir ---------------- */
  const cab = '<p class="mut">Nome: ______________________________ &nbsp; Data: ____/____</p>';
  B.folha1 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Tablatura em branco', sub: 'Escreva as casas nas linhas: a de cima é a 1ª corda.', corpo: `${cab}<div class="ilus">${c.pautaVazia({ tab: true, pauta: false, sistemas: 7 })}</div>` });
  B.folha2 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Partitura em branco', sub: 'Clave de sol (com 8 embaixo, como se escreve para violão).', corpo: `${cab}<div class="ilus">${c.pautaVazia({ tab: false, pauta: true, sistemas: 9 })}</div>` });
  B.folha3 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Partitura e tablatura combinadas', corpo: `${cab}<div class="ilus">${c.pautaVazia({ tab: true, pauta: true, sistemas: 4 })}</div>` });
  B.folha4 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Diagramas de acordes em branco', sub: 'Desenhe os dedos e escreva o nome do acorde embaixo.', corpo: `<div class="acs">${Array.from({ length: 20 }, () => `<div class="ac">${diagVazio()}<span style="display:block;border-bottom:.3mm solid #b8913f;height:6mm;width:34mm;margin:0 auto"></span></div>`).join('')}</div>` });
  B.folha5 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Braço do violão em branco', sub: 'Escreva os nomes das notas nas casas.', corpo: `<div class="mapa">${V.braco({ modo: 'vazio' })}</div><div class="mapa">${V.braco({ modo: 'vazio' })}</div><div class="mapa">${V.braco({ modo: 'vazio' })}</div><div class="mapa">${V.braco({ modo: 'vazio' })}</div>` });
  B.folha6 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Tabelas de batidas', sub: 'Marque ↓ ↑ ✕ nas casas. Cada coluna é uma colcheia.', corpo: `${[1, 2, 3, 4, 5, 6].map((i) => bat(`Batida ${i}`, '________ · ____ bpm', ['', '', '', '', '', '', '', ''], 8, '')).join('')}` });
  B.folha7 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Planejamento semanal e registro de repertório', corpo: `${cab}<h2 class="s">Semana de ____/____ a ____/____</h2><table class="t"><tr><th>Dia</th><th>Foco</th><th>Min.</th><th>Feito</th></tr>${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((d) => `<tr><td>${d}</td><td style="height:9mm"></td><td></td><td>☐</td></tr>`).join('')}</table><h2 class="s">Registro de repertório</h2><table class="t"><tr><th>Música</th><th>Tom</th><th>Acordes</th><th>bpm</th><th>Já toco?</th></tr>${Array.from({ length: 9 }, () => '<tr><td style="height:9mm"></td><td></td><td></td><td></td><td>☐</td></tr>').join('')}</table>` });
  B.folha8 = () => pg({ tag: 'FOLHA PARA IMPRIMIR', titulo: 'Anotações livres', corpo: `${cab}<div class="linhas">${'<div></div>'.repeat(22)}</div>` });

  /* ---------------- glossário ---------------- */
  const GL = [['Abafar', 'Calar as cordas com a palma da mão ou relaxando os dedos.'], ['Acorde', 'Três ou mais notas tocadas ao mesmo tempo.'], ['Acidente', 'Sinal (♯, ♭, ♮) que altera a nota.'], ['Afinação', 'As alturas das cordas soltas: Mi, Lá, Ré, Sol, Si, Mi.'], ['Anacruse', 'Começo da música antes do primeiro tempo forte do compasso.'], ['Andamento', 'A velocidade da música, medida em bpm.'], ['Arpejo', 'As notas de um acorde tocadas uma de cada vez.'], ['Baixo', 'A nota mais grave de um acorde.'], ['Bemol (♭)', 'Desce a nota um semitom.'], ['Bend', 'Esticar a corda de lado para subir a nota.'], ['bpm', 'Batidas por minuto.'], ['Braço', 'Peça comprida do violão onde ficam as casas.'], ['Campo harmônico', 'Família de acordes de um tom.'], ['Capotraste', 'Peça que prende as cordas numa casa e sobe o tom.'], ['Casa', 'Espaço entre dois trastes.'], ['Cifra', 'Letras e símbolos que representam acordes.'], ['Clave de sol', 'Símbolo no começo da pauta que marca a nota Sol na 2ª linha.'], ['Compasso', 'Bloco de tempos separado por barras.'], ['Contratempo', 'Nota na parte fraca, com o tempo forte em silêncio.'], ['Dedilhado', 'Tocar as cordas uma a uma, com os dedos da mão direita.'], ['Diminuto (°)', 'Acorde com terça menor e quinta diminuta.'], ['Enarmonia', 'Duas notas com nomes diferentes e o mesmo som (Dó♯ e Ré♭).'], ['Escala', 'Sequência de notas em ordem, a partir de uma fundamental.'], ['Fundamental', 'A nota que dá nome ao acorde ou à escala.'], ['Hammer-on', 'Soar a nota seguinte “martelando” o dedo, sem palhetar.'], ['Harmônico', 'Som de sino, tocando de leve sobre o traste.'], ['Harmonia', 'Notas tocadas ao mesmo tempo.'], ['Intervalo', 'Distância entre duas notas.'], ['Inversão', 'O mesmo acorde com outra nota embaixo.'], ['Ligadura', 'Curva que liga notas iguais (soma) ou notas diferentes (legato).'], ['Melodia', 'Sequência de notas, uma de cada vez.'], ['Minipestana', 'Dedo 1 deitado sobre duas ou três cordas.'], ['Oitava', 'Distância entre uma nota e a próxima de mesmo nome (12 semitons).'], ['Palm mute', 'Abafar de leve com a borda da mão direita perto do cavalete.'], ['Pausa', 'Silêncio com duração marcada.'], ['Pentatônica', 'Escala de cinco notas, boa para improvisar.'], ['Pestana', 'Dedo 1 deitado sobre todas as cordas (também o osso do começo do braço).'], ['Power chord', 'Acorde só com fundamental e quinta.'], ['Pull-off', 'Puxar o dedo para soar a nota de baixo, sem palhetar.'], ['Pulso', 'A batida constante da música.'], ['Quiáltera', 'Divisão do tempo em número diferente do normal (ex.: tercina).'], ['Ritmo', 'Desenho das durações das notas.'], ['Semitom', 'Menor distância entre duas notas: uma casa.'], ['Síncope', 'Deslocamento do acento para uma parte fraca.'], ['Slide', 'Deslizar o dedo de uma casa a outra, sem soltar a corda.'], ['Sustenido (♯)', 'Sobe a nota um semitom.'], ['Tablatura', 'Notação em seis linhas, uma por corda, com o número da casa.'], ['Tarraxa', 'Parafuso que afina a corda.'], ['Tercina', 'Três notas no lugar de duas.'], ['Tom', 'Dois semitons; também o “tom” da música: a nota base.'], ['Tônica', 'O acorde ou a nota de repouso do tom.'], ['Transposição', 'Tocar a mesma música em outro tom.'], ['Traste', 'Ferrinho metálico que define a nota.'], ['Tríade', 'Acorde de três notas.'], ['Vibrato', 'Oscilar a nota para dar vida.']];
  B.glossario = () => pg({ tag: 'GLOSSÁRIO', titulo: 'Glossário musical', sub: 'Em ordem alfabética, para conversar com outros músicos sem dúvida.', corpo: `<table class="t"><tr><th>Termo</th><th>O que é</th></tr>${GL.sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([t, x]) => `<tr><td><b>${t}</b></td><td>${x}</td></tr>`).join('')}</table>` });

  /* ---------------- a escola ---------------- */
  const qr = (url) => { const svg = execFileSync('python3', ['-c', 'import segno,sys,io;b=io.BytesIO();segno.make(sys.argv[1],error="m").save(b,kind="svg",scale=4,border=1,xmldecl=False,svgns=True,nl=False,dark="#0a0406");sys.stdout.write(b.getvalue().decode())', url], { encoding: 'utf8' }); return svg.replace('<svg ', '<svg style="width:40mm;height:40mm" '); };
  B.escola = () => pg({ tag: 'A ESCOLA', titulo: 'Beaterista e os recursos digitais', sub: 'Aulas de música para adultos e crianças, em Araçatuba.', corpo: `
<p>A <b>Beaterista</b> é uma escola de música em Araçatuba, com aulas de bateria, violão, teclado, guitarra e baixo, e musicalização. Esta apostila faz parte da coleção <b>Beaterista Método</b>, com os livros <b>Toca Bateria</b>, <b>Toca Violão</b> e <b>Toca Teclado</b>.</p>
<div class="qrs"><div class="qr">${qr('https://beaterista.com.br')}<b>Site oficial</b><small>beaterista.com.br</small></div><div class="qr">${qr('https://jogos.beaterista.com.br')}<b>Beaterista Play</b><small>área dos alunos</small></div><div class="qr">${qr('https://www.instagram.com/beaterista_/')}<b>Instagram</b><small>@beaterista_</small></div></div>
<div class="card"><h4>Aulas na Beaterista</h4><p>Dúvida ou quer aula? Chame a escola no WhatsApp <b>(18) 99180-4150</b>. Rua Liberdade, 268, Araçatuba.</p></div>
<p class="mut" style="font-size:10.4pt">Os endereços acima foram conferidos. Novos recursos (afinador, metrônomo, dicionário de acordes e exercícios interativos) serão divulgados quando estiverem no ar.</p>` });
}
