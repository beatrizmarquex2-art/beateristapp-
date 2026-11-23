// Caderno de bateria, parte 2: variações de semicolcheia no chimbal, ritmos com bumbo, bumbo encaixado no meio do chimbal, lineares e leitura rítmica,
// tudo na pauta de bateria (notação original, com pausas e ligaduras) e com baquetagem. Cada padrão é uma linha de 16 passos (semicolcheias).
import { caixa, tabela, fala, lin, cx } from './lib.js';
import { compasso, partitura } from './bat.js';

const S = 'bateria';
const PEC = { B: 'bd', H: 'hh', O: 'hh', S: 'sn', g: 'sn', T: 'tt', M: 'mt', F: 'ft', P: 'hf', C: 'cr', R: 'rd' };
const MAO = { H: 'D', O: 'D', R: 'D', C: 'D', S: 'E', g: 'e', T: 'D', M: 'E', F: 'E' };
/** Padrão linear/misto escrito em letras (1 por passo): B bumbo · H chimbal · O chimbal aberto · S caixa · g fantasma · T tom 1 · M tom 2 · F surdo · P pé do chimbal · . pausa. */
export function linear(str, passos = 16) {
  const s = str.replace(/ /g, ''); if (s.length !== passos) throw new Error(`padrão com ${s.length} passos: ${str}`);
  const rows = {}; let m = '';
  s.split('').forEach((c, i) => { if (c === '.') { m += '.'; return; } const id = PEC[c]; if (!id) throw new Error(`letra ${c}`); rows[id] = (rows[id] || '.'.repeat(passos)).split('').map((x, k) => (k === i ? (c === 'O' ? 'o' : c === 'g' ? 'f' : 'x') : x)).join(''); m += MAO[c] || '.'; });
  return compasso(passos, rows, { maos: m });
}
/** Groove com chimbal, caixa e bumbo separados (cada um com a sua linha de 16 passos) e baquetagem D no chimbal e E na caixa. */
export function groove({ hh = '', sn = '....x.......x...', bd = 'x.......x.......', extra = {}, bat = false }, passos = 16) {
  if (!bat) return compasso(passos, { hh, sn, bd, ...extra });
  const m = Array.from({ length: passos }, (_, i) => ((hh[i] || '.') !== '.' ? 'D' : (sn[i] || '.') !== '.' ? 'E' : '.')).join('');
  return compasso(passos, { hh, sn, bd, ...extra }, { maos: m });
}
const BEAT = (...b) => b.join('');
const hatDeBeats = (a, b, c, d) => BEAT(a, b, c, d);

/** Lista de padrões numa página: `itens` = [{ rot, texto, c }] em pautas de largura inteira, com a contagem só na primeira. */
const lista = (itens, { conta = true, prefixo = '' } = {}) => itens.map((it, i) => `<div class="padrao"><p class="peq"><b>${prefixo}${it.rot}</b> · ${it.texto}</p>${partitura(it.c, { conta: conta && i === 0 })}</div>`).join('');
const pagina = (titulo, h2, intro, corpo, extra = '') => ({ secao: S, titulo, html: `<h2>${h2}</h2>${intro || ''}${corpo}${extra}` });
const fatia0 = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const fatia = (arr) => [arr.slice(0, 4), ...fatia0(arr.slice(4), 5)]; // 1ª página tem o Paul e a explicação, então leva 3 padrões; as outras levam 5

export function paginas(ex) {
  const P = []; const exB = (titulo, exemplo, corpo, resp, porque = '', dica = '') => ex('B', titulo, `${exemplo ? `<p class="peq exemplo"><b>exemplo resolvido:</b> ${exemplo}</p>` : ''}${corpo}`, `${resp}${porque ? `<div class="porque"><i>por quê:</i> ${porque}</div>` : ''}`, dica);
  const BASE = { sn: '....x.......x...', bd: 'x.......x.......' };

  /* ---------- 1. chimbal em semicolcheias ---------- */
  const H1 = [
    ['H1', 'todas as semicolcheias', 'xxxx xxxx xxxx xxxx'], ['H2', 'sem o "e" de cada tempo', 'x.xx x.xx x.xx x.xx'], ['H3', 'sem o "&" de cada tempo', 'xx.x xx.x xx.x xx.x'],
    ['H4', 'sem o "a" de cada tempo', 'xxx. xxx. xxx. xxx.'], ['H5', 'colcheias nos tempos 1 e 3, semicolcheias nos 2 e 4', 'x.x. xxxx x.x. xxxx'], ['H6', 'semicolcheias nos tempos 1 e 3, colcheias nos 2 e 4', 'xxxx x.x. xxxx x.x.'],
    ['H7', 'sem o "e" nos tempos 1 e 3', 'x.xx xxxx x.xx xxxx'], ['H8', 'sem o "&" nos tempos 1 e 3', 'xx.x xxxx xx.x xxxx'], ['H9', 'sem o "a" nos tempos 2 e 4', 'xxxx xxx. xxxx xxx.'],
    ['H10', 'só "e" e "a" (contratempos de semicolcheia)', '.x.x .x.x .x.x .x.x'], ['H11', 'dois toques por tempo, no começo', 'xx.. xx.. xx.. xx..'], ['H12', 'dois toques por tempo, no fim', '..xx ..xx ..xx ..xx'],
  ].map(([rot, texto, h]) => ({ rot, texto, c: groove({ hh: h.replace(/ /g, ''), ...BASE, bat: true }) }));
  const f1 = fatia(H1, 5);
  P.push(pagina('chimbal em semicolcheias 1', 'Variações de semicolcheia no chimbal (1)', fala('paul-bateria', 'o chimbal em <b>semicolcheias</b> é a base do funk, do pop e do rock moderno. aqui a <b>caixa</b> (tempos 2 e 4) e o <b>bumbo</b> (1 e 3) ficam fixos, e só o <b>chimbal</b> muda. mão <b>direita</b> no chimbal (D), <b>esquerda</b> na caixa (E).'), lista(f1[0]) + caixa('como estudar', '<p class="peq">1) toque só o chimbal (♩ = 60), falando a contagem · 2) some a caixa · 3) some o bumbo · 4) suba de 5 em 5 bpm. a pausa do chimbal é <b>silêncio</b>: a mão continua "dançando" no ar.</p>')));
  P.push(pagina('chimbal em semicolcheias 2', 'Variações de semicolcheia no chimbal (2)', '', lista(f1[1], { conta: false }) + lista(f1[2], { conta: false, prefixo: '' })));

  /* ---------- 2. acentos e chimbal aberto ---------- */
  const HA = [
    ['A1', 'acento em cada tempo', 'axxx axxx axxx axxx'], ['A2', 'acento no "e" de cada tempo', 'xaxx xaxx xaxx xaxx'], ['A3', 'acento no "&" de cada tempo', 'xxax xxax xxax xxax'],
    ['A4', 'acento no "a" de cada tempo', 'xxxa xxxa xxxa xxxa'], ['A5', 'agrupado de 3 (3-3-3-3-4)', 'axxa xxax xaxx axxa'], ['A6', 'acento só nos contratempos', 'xxax xxax xxax xxax'],
    ['O1', 'chimbal aberto no "a" do 4', 'xxxx xxxx xxxx xxxo'], ['O2', 'chimbal aberto no "&" de cada tempo', 'xxox xxox xxox xxox'], ['O3', 'chimbal aberto no "e" de cada tempo', 'xoxx xoxx xoxx xoxx'],
    ['O4', 'colcheias com aberto no "&" dos tempos 3 e 4', 'x.x. x.x. x.o. x.o.'], ['O5', 'aberto no tempo 1 (cai e fecha no "e")', 'oxxx xxxx oxxx xxxx'], ['O6', 'aberto nos tempos 1 e 3 e fechado com o pé', 'oxxx xxxx oxxx xxxx'],
  ];
  const mkHA = ([rot, texto, h]) => { const hh = h.replace(/ /g, ''); const acent = /^A/.test(rot); const hr = acent ? hh.replace(/a/g, 'x') : hh; const o = compasso(16, { hh: hr, sn: BASE.sn, bd: BASE.bd, ...(rot === 'O6' ? { hf: '..x.......x.....' } : {}) }, { maos: Array.from({ length: 16 }, (_, i) => (hh[i] !== '.' ? 'D' : (BASE.sn[i] !== '.' ? 'E' : '.'))).join(''), acentos: acent ? hh.replace(/a/g, '>').replace(/[^>]/g, '.') : '' }); if (!acent) o.rows.hh = hh.replace(/o/g, 'o').replace(/x/g, 'x'); return { rot, texto, c: o }; };
  const f2 = fatia(HA.map(mkHA), 5);
  P.push(pagina('chimbal: acentos e aberto 1', 'Chimbal com acentos e chimbal aberto (1)', fala('paul-oculos', 'o <b>acento</b> (&gt;) é uma nota mais forte, e o <b>"o"</b> em cima do x é o <b>chimbal aberto</b> (deixe o pedal solto e o prato "respirar"). treine com a mão direita, sem mexer em caixa e bumbo.'), lista(f2[0], { conta: true })));
  P.push(pagina('chimbal: acentos e aberto 2', 'Chimbal com acentos e chimbal aberto (2)', '', lista(f2[1], { conta: false }) + lista(f2[2], { conta: false })));

  /* ---------- 3. bumbo ---------- */
  const KK = [['K1', 'bumbo nos tempos 1 e 3', 'x.......x.......'], ['K2', '1, 3 e "&" do 3', 'x.......x.x.....'], ['K3', '1, "&" do 1 e 3', 'x.x.....x.......'], ['K4', '1, "&" do 1, 3 e "&" do 3', 'x.x.....x.x.....'], ['K5', '1, "&" do 2 e 3', 'x.....x.x.......'], ['K6', 'quatro no chão (disco)', 'x...x...x...x...'],
    ['K7', '1, "a" do 1, 3 e "a" do 3', 'x..x....x..x....'], ['K8', '1, 3 e "a" do 4', 'x.......x......x'], ['K9', '1, "&" do 1, "&" do 2, 3, "&" do 3, "a" do 4', 'x.x...x.x.x....x'], ['K10', '1, "a" do 1, "&" do 2 e 3', 'x..x..x.x.......'], ['K11', '1, "&" do 2 e "&" do 3', 'x.....x...x.....'], ['K12', '1, "&" do 1, 3 e "a" do 4', 'x.x.....x.....x.'],
    ['K13', '1, 3, "a" do 3 e "&" do 4', 'x.......x..x.x..'], ['K14', '1, "&" do 1, "a" do 1 e 3', 'x.xx....x.......'], ['K15', '1, "&" do 2, 3 e "&" do 3', 'x.....x.x.x.....'], ['K16', '1, "&" do 1, "&" do 2, 3 e "&" do 3', 'x.x...x.x.x.....'], ['K17', '3-3-4: 1, "a" do 1, "&" do 2, "&" do 3, "a" do 4', 'x..x..x...x..x..'], ['K18', '1, "&" do 1, 2, "&" do 3 e "&" do 4', 'x.x.x.....x.x...']];
  const KB = KK.map(([rot, texto, bd]) => ({ rot, texto, c: groove({ hh: 'x.x.x.x.x.x.x.x.', sn: BASE.sn, bd }) }));
  const f3 = fatia(KB, 5);
  P.push(pagina('bumbo (1)', 'Ritmos com bumbo: o pé se mexe (1)', fala('paul-bateria', 'agora o <b>chimbal em colcheias</b> e a <b>caixa</b> ficam parados e só o <b>bumbo</b> muda. o segredo: o pé <b>conversa</b> com as mãos sem tirar elas do lugar. cada padrão tem a contagem em cima.'), lista(f3[0], { conta: true })));
  for (let i = 1; i < f3.length; i++) P.push(pagina(`bumbo (${i + 1})`, `Ritmos com bumbo (${i + 1})`, '', lista(f3[i], { conta: false })));

  /* ---------- 4. bumbo encaixado no meio do chimbal ---------- */
  const ENC = [['E1', 'bumbo no "a" do 1 e do 3', 'x..x....x..x....'], ['E2', '"e" do 2 e do 4', 'x....x..x....x..'], ['E3', '"&" do 1 e do 3', 'x.x.....x.x.....'], ['E4', '"a" do 2 e "e" do 3', 'x......xx.......'], ['E5', 'bumbos em sequência no 1 (1 e "e")', 'xx......x.......'],
    ['E6', '1 e "a" do 1 · 3 e "a" do 3', 'x..x....x..x....'], ['E7', '"&" do 2 e "a" do 3', 'x.....x.....x...'.replace('x...', 'x...')], ['E8', '"e" do 1, "&" do 2, "e" do 3, "&" do 4', '.x....x..x....x.'], ['E9', 'seis bumbos no compasso', 'x.x...x.x.x...x.'],
    ['E10', '1 e "e" do 3', 'x.......xx......'], ['E11', '"a" do 1, "e" do 2, "a" do 3, "e" do 4', '...x.x.....x.x..'], ['E12', '1, "&" do 2 e "a" do 4', 'x.....x........x']];
  const hh16 = 'xxxxxxxxxxxxxxxx';
  const EB = ENC.map(([rot, texto, bd]) => { const bdr = bd.slice(0, 16).padEnd(16, '.'); return { rot, texto, c: groove({ hh: hh16, sn: BASE.sn, bd: bdr }) }; });
  const f4 = fatia(EB, 5);
  P.push(pagina('bumbo encaixado (1)', 'Bumbo encaixado no meio do chimbal (1)', fala('paul-oculos', 'com o chimbal em <b>semicolcheias</b>, o bumbo cai <b>no meio</b> das notas das mãos (no "e", no "&" ou no "a"). a mão direita não pára; o pé "encaixa" entre as batidas. comece contando em voz alta.'), lista(f4[0], { conta: true })));
  for (let i = 1; i < f4.length; i++) P.push(pagina(`bumbo encaixado (${i + 1})`, `Bumbo encaixado no meio do chimbal (${i + 1})`, '', lista(f4[i], { conta: false })));

  /* ---------- 5. linear ---------- */
  const LIN = [
    ['L1', 'a base: backbeat e chimbal nas 16 notas restantes', 'BHHHSHHHBHHHSHHH'], ['L2', 'bumbo no "&" do 3', 'BHHHSHHHHHBHSHHH'], ['L3', 'bumbo no "a" do 1', 'BHHBSHHHBHHHSHHH'], ['L4', 'bumbos no "&" do 1 e do 3', 'BHBHSHHHBHBHSHHH'],
    ['L5', 'dois bumbos colados (4 e 5... passos 7 e 8)', 'BHHHSHHBBHHHSHHH'], ['L6', 'bumbo no "&" do 2 e no "&" do 4', 'BHHHSHBHBHHHSHBH'], ['L7', 'bumbos no "&" do 1 e "a" do 3', 'BHBBSHHHBHHBSHHH'], ['L8', 'bumbo extra no fim', 'BHHHSHHHBHBBSHHH'],
    ['L9', 'fantasma no "&" de cada tempo', 'BHgHSHgHBHgHSHgH'], ['L10', 'fantasma no "a" de cada tempo', 'BHHgSHHgBHHgSHHg'], ['L11', 'fantasma no "e" de cada tempo', 'BgHHSgHHBgHHSgHH'], ['L12', 'fantasmas variados', 'BHgHSHHgBHHgSHgH'],
    ['L13', 'fantasma antes e depois do backbeat', 'BHHgSgHHBHBgSHHg'], ['L14', 'fantasma em todas as semicolcheias livres da caixa', 'BgHgSHgHBgHgSHgH'], ['L15', 'caixa em 3-3-2 (S no "a" do 1 e no "&" do 2)', 'BHHSHHSHBHHSHHSH'], ['L16', 'caixa deslocada com bumbo extra', 'BHHSHHSHHHBSHHSH'],
    ['L17', '"boom-chick": bumbo e caixa alternados', 'BHSHBHSHBHSHBHSH'], ['L18', 'caixa em todos os "&"', 'BSHSBSHSBSHSBSHS'], ['L19', 'caixa deslocada para o "e"', 'BHSHHBSHBHSHHBSH'], ['L20', 'chimbal aberto no "a" do 4', 'BHHHSHHHBHHHSHHO'],
    ['L21', 'chimbal aberto no "a" do 1 e do 3', 'BHHOSHHHBHHOSHHH'], ['L22', 'virada curta nos toms no fim', 'BHHHSHHHBHHHSHTM'], ['L23', 'virada: caixa, tom 1, tom 2 e surdo no 4º tempo', 'BHHHSHHHBHHHSTMF'], ['L24', 'virada com caixa, toms e bumbo no 4º tempo', 'BHHHSHHHBHSHTTMF'],
    ['L25', 'bumbo no "a" do 3', 'BHHHSHHHBHHBSHHH'], ['L26', 'bumbos no "a" do 1 e do 2', 'BHHBSHHBBHHHSHHH'], ['L27', 'caixa também no "e" dos tempos 1 e 3', 'BHSHHHSHBHSHHHSH'], ['L28', 'duas caixas no fim do compasso', 'BHHHSHHHBHHHSHSS'],
  ];
  const LB = LIN.map(([rot, texto, str]) => ({ rot, texto, c: linear(str) }));
  const f5 = fatia(LB, 5);
  P.push(pagina('linear 1', 'Bateria linear: nunca duas peças ao mesmo tempo (1)', fala('paul-bateria', 'no <b>linear</b>, em cada passo só <b>uma peça</b> toca: bumbo, chimbal ou caixa, nunca juntos. o som é limpo e cheio de "desenho": base do funk moderno, do gospel e do groove atual. <b>D</b> = chimbal na direita, <b>E</b> = caixa na esquerda.'), lista(f5[0], { conta: true })));
  for (let i = 1; i < f5.length; i++) P.push(pagina(`linear ${i + 1}`, `Bateria linear (${i + 1})`, '', lista(f5[i], { conta: false })));

  /* ---------- 6. exercícios de criação ---------- */
  const vazio = (n = 4) => Array.from({ length: n }, () => `<div class="padrao">${partitura(compasso(16, {}), { conta: true })}</div>`).join('');
  P.push(pagina('treino: escreva e toque', 'Treino: escreva os grooves na pauta', fala('paul-oculos', 'chegou a hora de <b>escrever</b>! use a pauta em branco: <b>x</b> no chimbal (linha acima da pauta), <b>bolinha</b> na caixa (3º espaço) e no bumbo (espaço de baixo, haste pra baixo).'),
    exB('escreva o groove na pauta', 'rock: chimbal em colcheias, caixa no 2 e 4, bumbo no 1 e 3 = <b>x . x . x . x . x . x . x . x .</b> no chimbal.', `<p class="peq"><b>1)</b> chimbal em colcheias, caixa nos tempos 2 e 4, bumbo no 1 e no "&" do 3.</p>${vazio(1)}<p class="peq"><b>2)</b> chimbal em semicolcheias sem o "e", caixa no 2 e 4, bumbo no 1, no "a" do 1 e no 3.</p>${vazio(1)}<p class="peq"><b>3)</b> linear: B H H H S H H H B H B H S H H H.</p>${vazio(1)}`,
      [groove({ hh: 'x.x.x.x.x.x.x.x.', sn: BASE.sn, bd: 'x.......x.x.....' }), groove({ hh: 'x.xxx.xxx.xxx.xx', sn: BASE.sn, bd: 'x..x....x.......' }), linear('BHHHSHHHBHBHSHHH')].map((c, i) => `<b>${i + 1})</b>${partitura(c, { conta: i === 0 })}`).join(''), 'confira a contagem: o tempo 3 é o passo 8 e o "&" do 3, o passo 10; o "a" do 1 é o passo 3.', 'escreva primeiro a caixa e o bumbo, depois o chimbal.')));
  P.push(pagina('treino: ache o padrão', 'Treino: qual é o padrão?', '', exB('leia a pauta e escreva o nome do padrão (H, K, E, L...)', 'o groove que tem chimbal em todas as semicolcheias é o <b>H1</b>.', `<p class="peq">olhe a pauta e escreva o <b>código</b> do padrão das páginas anteriores:</p>${[H1[1], KB[1], EB[0], LB[8]].map((x, i) => `<div class="padrao"><p class="peq"><b>${i + 1})</b> código: ${lin('m')}</p>${partitura(x.c)}</div>`).join('')}`, `1: ${H1[1].rot} (${H1[1].texto}) · 2: ${KB[1].rot} (${KB[1].texto}) · 3: ${EB[0].rot} (${EB[0].texto}) · 4: ${LB[8].rot} (${LB[8].texto})`, 'compare o chimbal (quais notas faltam), o bumbo (em que passos cai) e se há fantasmas.')));
  return P;
}

/** Leitura rítmica na pauta de bateria (caixa, com baquetagem alternada): 3 páginas, semicolcheias, pausas, síncopes e tercinas. */
export function leituraRitmica() {
  const alt = (str) => { let k = 0; return str.split('').map((c) => (c === '.' ? '.' : (k++ % 2 === 0 ? 'D' : 'E'))).join(''); };
  const lin1 = (str, passos = 16) => compasso(passos, { sn: str }, { maos: alt(str) });
  const L = [
    { t: 'Leitura rítmica 1: semínimas, colcheias e semicolcheias', f: 'paul-estudando', txt: 'leia cada linha na <b>caixa</b>, falando a contagem e alternando as mãos (D E D E…). a baquetagem já está escrita em cima das notas.', itens: ['x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'xxxxxxxxxxxxxxxx', 'x.xxx.xxx.xxx.xx', 'xx.xxx.xxx.xxx.x', 'xxx.xxx.xxx.xxx.'].slice(0, 5).map((r) => ({ c: lin1(r) })) },
    { t: 'Leitura rítmica 2: pausas, síncopes e contratempos', f: 'paul-oculos', txt: 'agora com <b>pausas</b>: elas valem silêncio, mas a mão continua o movimento. observe as notas que começam no "e", no "&" e no "a".', itens: ['x..x..x.x..x..x.', 'x.x..x.x.x..x.x.', '.x.x.x.x.x.x.x.x', 'xx..xx..xx..xx..', 'x.xx..xxx.xx..xx', '..x...x...x...x.'].slice(0, 5).map((r) => ({ c: lin1(r) })) },
    { t: 'Leitura rítmica 3: tercinas', f: 'paul-bateria', txt: 'as <b>tercinas</b> dividem o tempo em 3 (<b>1 e a 2 e a</b>). a pauta mostra o "3" em cima das notas ligadas.', itens: ['xxxxxxxxxxxx', 'x.xx.xx.xx.x', 'xx.xx.xx.xx.', '.xx.xx.xx.xx', 'x.xx..x.xx..', 'xxx.xx.xxx.x'].slice(0, 5).map((r) => ({ c: lin1(r, 12) })) },
  ];
  return L.map((q, n) => ({ secao: 'ritmo', titulo: q.t.toLowerCase().replace(/^leitura rítmica/, 'leitura rítmica'), html: `<h2>${q.t}</h2>${fala(q.f, q.txt)}${q.itens.map((it, i) => `<div class="padrao"><p class="peq"><b>${n + 1}.${i + 1}</b></p>${partitura(it.c, { conta: i === 0 })}</div>`).join('')}<div class="caixa tracejada"><h3>progresso</h3><p class="peq">♩ = 60: ${cx()}${cx()}${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 80: ${cx()}${cx()}${cx()}${cx()}${cx()}${cx()} &nbsp; ♩ = 100: ${cx()}${cx()}${cx()}${cx()}${cx()}${cx()}</p></div>` }));
}

/** Página com a ilustração da Bea sobre empunhadura (fulcro, dedos, mãos simétricas, ângulos). */
export function empunhaduraPratica(ex) {
  return { secao: S, titulo: 'empunhadura na prática', html: `<h2>Empunhadura na prática</h2><img src="img/empunhadura-pratica.png" style="width:128mm;display:block;margin:0 auto" alt="Empunhadura: fulcro, dedos, mãos simétricas e ângulos">${caixa('como ler a ilustração', '<p class="peq"><b>quadro de cima:</b> a baqueta apoiada no <b>fulcro</b>, entre o polegar e o indicador · <b>três círculos:</b> polegar e indicador pinçando, os outros dedos envolvendo por baixo e a mão fechada vista de frente · <b>quadros do meio:</b> as duas mãos <b>simétricas</b> (matched grip), com as baquetas em "V" · <b>três quadros de baixo:</b> a mão em ângulos diferentes: o pulso gira e a baqueta acompanha, sempre solta · <b>baquetas cruzadas:</b> cuidado para não bater uma na outra nem apertar demais.</p>')}` };
}
