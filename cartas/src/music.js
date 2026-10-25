/* Cartas de Groove · Beaterista — DADOS MUSICAIS E REGRAS (sem tela, sem som).
   Tudo o que aparece numa carta (no app e no PDF) sai daqui, pelo mesmo identificador.
   Unidade de tempo: 96 ticks = 1 semínima. Um compasso 4/4 = 384 ticks. */
(function (root) {
  'use strict';
  var Q = 96, BAR = 4 * Q;

  /* ---------- figuras ---------- */
  // d: duração VexFlow · t: ticks reais · tup: quiáltera (3 = tercina de colcheias, 6 = sextina de semicolcheias)
  var FIG = {
    q: { d: 'q', t: 96 }, h: { d: 'h', t: 192 }, w: { d: 'w', t: 384 },
    e: { d: '8', t: 48 }, s: { d: '16', t: 24 }, f: { d: '32', t: 12 },
    t: { d: '8', t: 32, tup: 3 }, x: { d: '16', t: 16, tup: 6 },
  };
  function ev(code) { // "e" = colcheia, "e_" = pausa de colcheia
    var rest = code.slice(-1) === '_'; var k = rest ? code.slice(0, -1) : code; var f = FIG[k];
    if (!f) throw new Error('figura desconhecida: ' + code);
    return { code: k, dur: f.d, ticks: f.t, rest: rest, tup: f.tup || 0 };
  }

  /* ---------- células de 1 tempo (cada uma soma exatamente 96 ticks) ---------- */
  var CELLS = {
    // fácil
    Q: { lv: 1, seq: ['q'] },
    QR: { lv: 1, seq: ['q_'] },
    E2: { lv: 1, seq: ['e', 'e'] },
    S4: { lv: 1, seq: ['s', 's', 's', 's'] },
    // médio
    ESS: { lv: 2, seq: ['e', 's', 's'] },
    SSE: { lv: 2, seq: ['s', 's', 'e'] },
    SES: { lv: 2, seq: ['s', 'e', 's'] },
    REe: { lv: 2, seq: ['e_', 'e'] },
    ERe: { lv: 2, seq: ['e', 'e_'] },
    RSS: { lv: 2, seq: ['e_', 's', 's'] },
    // difícil
    TRI: { lv: 3, seq: ['t', 't', 't'] },
    TRR: { lv: 3, seq: ['t', 't_', 't'] },
    SEX: { lv: 3, seq: ['x', 'x', 'x', 'x', 'x', 'x'] },
    F8: { lv: 3, seq: ['f', 'f', 'f', 'f', 'f', 'f', 'f', 'f'] },
    SSF: { lv: 3, seq: ['s', 's', 'f', 'f', 'f', 'f'] },
    FSS: { lv: 3, seq: ['f', 'f', 'f', 'f', 's', 's'] },
    EF4: { lv: 3, seq: ['e', 'f', 'f', 'f', 'f'] },
  };
  Object.keys(CELLS).forEach(function (k) {
    var sum = CELLS[k].seq.reduce(function (a, c) { return a + ev(c).ticks; }, 0);
    if (sum !== Q) throw new Error('célula ' + k + ' soma ' + sum);
  });

  /* ---------- sorteio determinístico (as 36 cartas são sempre as mesmas, no app e no PDF) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var LEVEL_NAMES = { 1: 'fácil', 2: 'médio', 3: 'difícil' };
  function buildRhythmDeck(level) {
    var pool = Object.keys(CELLS).filter(function (k) { return CELLS[k].lv <= level; });
    var r = rng(1000 + level * 77); var out = []; var seen = {};
    var guard = 0;
    while (out.length < 12 && guard++ < 20000) {
      var beats = [0, 1, 2, 3].map(function () { return pool[Math.floor(r() * pool.length)]; });
      var key = beats.join('|');
      var lvCount = beats.filter(function (b) { return CELLS[b].lv === level; }).length;
      var rests = beats.filter(function (b) { return b === 'QR'; }).length;
      var kinds = new Set(beats).size;
      if (seen[key] || kinds < 2 || rests > 1 || beats[0] === 'QR') continue;
      if (level === 1 && beats.indexOf('S4') < 0 && beats.indexOf('E2') < 0) continue;
      if (level >= 2 && lvCount < 2) continue;
      if (level === 3 && !beats.some(function (b) { return b === 'TRI' || b === 'TRR' || b === 'SEX'; })) continue;
      seen[key] = 1; out.push(beats);
    }
    // o baralho difícil precisa ter fusas e sextinas em algum lugar (e o médio, pausa de colcheia)
    return out.map(function (beats, i) {
      return { id: 'FP-' + ['F', 'M', 'D'][level - 1] + '-' + String(i + 1).padStart(2, '0'), deck: 'figuras', level: level, n: i + 1, beats: beats, bpm: [80, 72, 60][level - 1] };
    });
  }
  /** Nome da carta de figuras pelo conteúdo (sem número): ex. "colcheias, pausa e semicolcheias". */
  var FIG_NAMES = [['q', 0, 'semínima'], ['q', 1, 'pausa de semínima'], ['e', 0, 'colcheia'], ['e', 1, 'pausa de colcheia'], ['s', 0, 'semicolcheia'], ['t', 2, 'tercina'], ['x', 0, 'sextina'], ['f', 0, 'fusa']];
  function rhythmTitle(card) {
    var evs = rhythmEvents(card); var out = [];
    FIG_NAMES.forEach(function (f) { if (evs.some(function (e) { return e.code === f[0] && (f[1] === 2 || e.rest === !!f[1]); })) out.push(f[2]); });
    return out.length > 1 ? out.slice(0, -1).join(', ') + ' e ' + out[out.length - 1] : out[0];
  }
  function rhythmEvents(card) { // [{beat, ...ev}] com início em ticks
    var at = 0; var out = [];
    card.beats.forEach(function (cellKey, b) {
      CELLS[cellKey].seq.forEach(function (c) { var e = ev(c); e.beat = b; e.at = at; e.cell = cellKey; at += e.ticks; out.push(e); });
    });
    return out;
  }
  function validateRhythm(card) {
    var evs = rhythmEvents(card); var total = evs.reduce(function (a, e) { return a + e.ticks; }, 0);
    var errs = [];
    if (total !== BAR) errs.push('soma ' + total + ' ≠ ' + BAR);
    for (var b = 0; b < 4; b++) {
      var s = evs.filter(function (e) { return e.beat === b; }).reduce(function (a, e) { return a + e.ticks; }, 0);
      if (s !== Q) errs.push('tempo ' + (b + 1) + ' soma ' + s);
    }
    evs.forEach(function (e) { if (e.tup === 3 && evs.filter(function (x) { return x.beat === e.beat && x.tup === 3; }).length !== 3) errs.push('tercina incompleta'); if (e.tup === 6 && evs.filter(function (x) { return x.beat === e.beat && x.tup === 6; }).length !== 6) errs.push('sextina incompleta'); });
    return errs;
  }

  /* ---------- grooves (bumbo, caixa, chimbal) em semicolcheias ---------- */
  // hh: x fechado · o aberto · > fechado acentuado   sn: o normal · > acento · g ghost   bd: o
  var GROOVES = [
    // fácil
    { id: 'RP-F-01', level: 1, name: 'Rock básico', bpm: 100, hh: 'x-x-x-x-x-x-x-x-', sn: '----o-------o---', bd: 'o-------o-------', tip: 'chimbal em colcheias bem regular; caixa forte no 2 e no 4. conte em voz alta: 1 e 2 e…' },
    { id: 'RP-F-02', level: 1, name: 'Pop básico', bpm: 92, hh: 'x-x-x-x-x-x-x-x-', sn: '----o-------o---', bd: 'o-----o-o-----o-', tip: 'os bumbos no “e” do 2 e do 4 empurram o groove pra frente. deixa o pé leve, sem enterrar a batida.' },
    { id: 'RP-F-03', level: 1, name: 'Rock com variação de bumbo', bpm: 100, hh: 'x-x-x-x-x-x-x-x-', sn: '----o-------o---', bd: 'o-------o-o---o-', tip: 'três bumbos no 3, no “e” do 3 e no “e” do 4, sempre junto com o chimbal: mão e pé chegam no mesmo instante.' },
    { id: 'RP-F-04', level: 1, name: 'Pop com variação de caixa', bpm: 96, hh: 'x-x-x-x-x-x-x-x-', sn: '----o-o-----o-o-', bd: 'o-------o-------', tip: 'a caixa extra no “e” do 2 e do 4 faz um eco do tempo. toca mais leve que o 2 e o 4.' },
    { id: 'RP-F-05', level: 1, name: 'Groove com chimbal aberto', bpm: 98, hh: 'x-x-x-x-x-x-x-o-', sn: '----o-------o---', bd: 'o-------o-----o-', tip: 'abre o chimbal junto com o bumbo no “e” do 4 e fecha com o pé exatamente no 1 seguinte.' },
    // médio
    { id: 'RP-M-01', level: 2, name: 'Contratempo (chimbal aberto)', bpm: 112, hh: '--o---o---o---o-', sn: '----o-------o---', bd: 'o---o---o---o---', tip: 'bumbo nos 4 tempos e o chimbal aberto só no “e”. o pé esquerdo fecha o chimbal em cada tempo.' },
    { id: 'RP-M-02', level: 2, name: 'Semicolcheias no chimbal', bpm: 88, hh: 'xxxxxxxxxxxxxxxx', sn: '----o-------o---', bd: 'o--o----o-o-----', tip: 'chimbal com uma mão só (ou alternando, se ficar rápido). o bumbo no “a” do 1 cai entre duas batidas do chimbal.' },
    { id: 'RP-M-03', level: 2, name: 'Ghost notes', bpm: 86, hh: 'x-x-x-x-x-x-x-x-', sn: '----o--g-g--o--g', bd: 'o-------o-o-----', tip: 'ghost = baqueta bem baixinha, a 2 dedos da pele. o contraste com o 2 e o 4 é o que faz o groove.' },
    { id: 'RP-M-04', level: 2, name: 'Bumbo deslocado', bpm: 94, hh: 'x-x-x-x-x-x-x-x-', sn: '----o-------o---', bd: 'o-----o---o--o--', tip: 'só o 1 fica no lugar. os outros bumbos caem no contratempo: segura o chimbal firme pra não correr.' },
    { id: 'RP-M-05', level: 2, name: 'Acentos no contratempo', bpm: 100, hh: 'x->-x->-x->-x->-', sn: '----o-------o---', bd: 'o-------o-------', tip: 'acentua o “e” no chimbal (ombro da baqueta) e toca o tempo com a ponta. muda o balanço sem mudar as notas.' },
    // difícil
    { id: 'RP-D-01', level: 3, name: 'Síncope bumbo e caixa', bpm: 92, hh: 'x-x-x-x-x-x-x-x-', sn: '----o--o----o---', bd: 'o--o--o---o--o--', tip: 'caixa no “a” do 2 e bumbos no “a”: pensa em semicolcheias o tempo todo, mesmo onde não tem nota.' },
    { id: 'RP-D-02', level: 3, name: 'Independência no bumbo', bpm: 80, hh: 'x-x-x-x-x-x-x-x-', sn: '----o-------o---', bd: 'o-oo--o-o-oo--o-', tip: 'as mãos não mudam; só o pé trabalha. estuda o pé sozinho com o metrônomo antes de juntar.' },
    { id: 'RP-D-03', level: 3, name: 'Ghost notes combinadas', bpm: 90, hh: 'x-x-x-x-x-x-x-x-', sn: '-g--o-gg-g--o-gg', bd: 'o-----o---o--o--', tip: 'as ghosts ficam entre as batidas do chimbal (mão da caixa). dinâmica: ghost quase sem som, 2 e 4 cheios.' },
    { id: 'RP-D-04', level: 3, name: 'Chimbal abre e fecha', bpm: 100, hh: 'x-o-x-x-x-o-x-xx', sn: '----o-------o---', bd: 'o--o----o-o-----', tip: 'abre no “e” do 1 e do 3 e fecha no tempo seguinte. no fim, duas semicolcheias fechadas puxam o 1.' },
    { id: 'RP-D-05', level: 3, name: 'Semicolcheias com acento e síncope', bpm: 94, hh: '>xxx>xxx>xxx>x>x', sn: '----o-------o---', bd: 'o--o--o-o--o--o-', tip: 'acentos do chimbal no tempo, bumbo em semicolcheias soltas. começa a 70 BPM e sobe de 4 em 4.' },
  ];
  GROOVES.forEach(function (g) { g.deck = 'rockpop'; g.n = +g.id.slice(-2); });
  function grooveHits(g) { // por passo de semicolcheia: lista de peças tocadas
    var out = [];
    for (var i = 0; i < 16; i++) {
      var hits = [];
      if (g.hh[i] === 'x') hits.push({ p: 'hh' }); if (g.hh[i] === '>') hits.push({ p: 'hh', acc: 1 }); if (g.hh[i] === 'o') hits.push({ p: 'ho' });
      if (g.sn[i] === 'o') hits.push({ p: 'sn' }); if (g.sn[i] === '>') hits.push({ p: 'sn', acc: 1 }); if (g.sn[i] === 'g') hits.push({ p: 'sn', ghost: 1 });
      if (g.bd[i] === 'o') hits.push({ p: 'bd' });
      out.push(hits);
    }
    return out;
  }
  /** Voz da partitura: em cada tempo, cada nota dura até a próxima (com pausa antes, se o tempo começa vazio). */
  var DUR16 = { 1: '16', 2: '8', 3: '8d', 4: 'q' };
  function grooveVoice(g, pieces) {
    var hits = grooveHits(g); var out = [];
    for (var b = 0; b < 4; b++) {
      var on = [];
      for (var k = 0; k < 4; k++) { var hs = hits[b * 4 + k].filter(function (h) { return pieces.indexOf(h.p) >= 0; }); if (hs.length) on.push({ k: k, hits: hs }); }
      if (!on.length) { out.push({ rest: true, dur: 'q', ticks: 96, beat: b, step: b * 4 }); continue; }
      if (on[0].k > 0) out.push({ rest: true, dur: DUR16[on[0].k], ticks: on[0].k * 24, beat: b, step: b * 4 });
      on.forEach(function (o, j) { var len = (j + 1 < on.length ? on[j + 1].k : 4) - o.k; out.push({ rest: false, dur: DUR16[len], ticks: len * 24, beat: b, step: b * 4 + o.k, hits: o.hits }); });
    }
    return out;
  }

  /* ---------- rudimentos ---------- */
  // st: baqueteamento (D = direita, E = esquerda), acc: posições acentuadas (0 = 1ª nota), fig: figura de cada nota
  function rep(s, n) { var o = []; for (var i = 0; i < n; i++) o = o.concat(s); return o; }
  var RUDIMENTS = [
    { id: 'RU-F-01', level: 1, name: 'Toque simples', en: 'Single Stroke Roll', bpm: 80, st: rep(['D', 'E'], 8), fig: rep(['s'], 16), acc: [], tip: 'mãos alternadas, mesma altura e mesmo volume. olha se a esquerda soa igual à direita.' },
    { id: 'RU-F-02', level: 1, name: 'Toque duplo', en: 'Double Stroke Roll', bpm: 70, st: rep(['D', 'D', 'E', 'E'], 4), fig: rep(['s'], 16), acc: [], tip: 'duas notas por mão: a 2ª nasce do rebote, com os dedos. as duas precisam ter o mesmo volume.' },
    { id: 'RU-F-03', level: 1, name: 'Paradiddle', en: 'Single Paradiddle', bpm: 76, st: rep(['D', 'E', 'D', 'D', 'E', 'D', 'E', 'E'], 2), fig: rep(['s'], 16), acc: [], tip: 'pa-ra-di-dle: duas simples e uma dupla. a mão que começa troca a cada grupo.' },
    { id: 'RU-F-04', level: 1, name: 'Paradiddle duplo', en: 'Double Paradiddle', bpm: 72, st: rep(['D', 'E', 'D', 'E', 'D', 'D', 'E', 'D', 'E', 'D', 'E', 'E'], 2), fig: rep(['x'], 24), acc: [], tip: 'quatro simples e uma dupla, em sextinas: cada grupo de 6 começa num tempo.' },
    { id: 'RU-F-05', level: 1, name: 'Paradiddle triplo', en: 'Triple Paradiddle', bpm: 70, st: ['D', 'E', 'D', 'E', 'D', 'E', 'D', 'D', 'E', 'D', 'E', 'D', 'E', 'D', 'E', 'E'], fig: rep(['s'], 16), acc: [], tip: 'seis simples e uma dupla. o grupo ocupa 2 tempos; no 3 a mão esquerda começa.' },
    { id: 'RU-F-06', level: 1, name: 'Paradiddle-diddle', en: 'Paradiddle-Diddle', bpm: 72, st: rep(['D', 'E', 'D', 'D', 'E', 'E'], 4), fig: rep(['x'], 24), acc: [], tip: 'duas simples e duas duplas, sempre começando com a direita. ótimo pra viradas entre tons.' },
    { id: 'RU-M-01', level: 2, name: 'Rulo de 5 toques', en: 'Five Stroke Roll', bpm: 66, st: rep(['D', 'D', 'E', 'E', 'D', 'E', 'E', 'D', 'D', 'E'], 2), fig: rep(['f', 'f', 'f', 'f', 'e'], 4), acc: [4, 9, 14, 19], tip: 'dois duplos rápidos (em fusas) e um toque acentuado no fim. o acento cai sempre na mão que fecha o grupo.' },
    { id: 'RU-M-02', level: 2, name: 'Simples com acento no 1º', en: 'Accent on 1', bpm: 80, st: rep(['D', 'E', 'D', 'E'], 4), fig: rep(['s'], 16), acc: [0, 4, 8, 12], tip: 'acento sempre na direita, no tempo. as outras três notas bem baixas (a 2 dedos da pele).' },
    { id: 'RU-M-03', level: 2, name: 'Paradiddle com acento no 1º e 5º', en: 'Accented Paradiddle', bpm: 76, st: rep(['D', 'E', 'D', 'D', 'E', 'D', 'E', 'E'], 2), fig: rep(['s'], 16), acc: [0, 4, 8, 12], tip: 'o acento cai na primeira nota de cada paradiddle: alterna entre a direita e a esquerda.' },
    { id: 'RU-M-04', level: 2, name: 'Simples com acento no 1º e 4º', en: 'Accents on 1 & 4', bpm: 80, st: rep(['D', 'E', 'D', 'E'], 4), fig: rep(['s'], 16), acc: [0, 3, 4, 7, 8, 11, 12, 15], tip: 'acento na direita (1º) e na esquerda (4º). a 4ª nota acentuada prepara o tempo seguinte.' },
    { id: 'RU-M-05', level: 2, name: 'Simples com acento no 1º e 2º', en: 'Accents on 1 & 2', bpm: 80, st: rep(['D', 'E', 'D', 'E'], 4), fig: rep(['s'], 16), acc: [0, 1, 4, 5, 8, 9, 12, 13], tip: 'dois acentos seguidos (direita e esquerda) e duas notas baixas. a altura da baqueta muda rápido.' },
    { id: 'RU-M-06', level: 2, name: 'Paradiddle com acento no 2º e 6º', en: 'Paradiddle, accents 2 & 6', bpm: 72, st: rep(['D', 'E', 'D', 'D', 'E', 'D', 'E', 'E'], 2), fig: rep(['s'], 16), acc: [1, 5, 9, 13], tip: 'acento na 2ª nota de cada grupo de 4 (contratempo): esquerda, direita, esquerda, direita.' },
  ];
  RUDIMENTS.forEach(function (r) { r.deck = 'rudimentos'; r.n = +r.id.slice(-2) + (r.level === 2 ? 6 : 0); });
  function rudimentEvents(r) {
    var at = 0; return r.fig.map(function (c, i) { var e = ev(c); e.at = at; e.beat = Math.floor(at / Q); e.hand = r.st[i]; e.acc = r.acc.indexOf(i) >= 0; at += e.ticks; return e; });
  }
  function validateRudiment(r) {
    var errs = []; var evs = rudimentEvents(r);
    if (r.st.length !== r.fig.length) errs.push('baqueteamento e figuras com tamanhos diferentes');
    var total = evs.reduce(function (a, e) { return a + e.ticks; }, 0); if (total !== BAR) errs.push('soma ' + total);
    for (var b = 0; b < 4; b++) { var s = evs.filter(function (e) { return e.beat === b; }).reduce(function (a, e) { return a + e.ticks; }, 0); if (s !== Q) errs.push('tempo ' + (b + 1) + ' soma ' + s); }
    r.acc.forEach(function (a) { if (a >= r.st.length) errs.push('acento fora do compasso'); });
    if (r.st.some(function (h) { return h !== 'D' && h !== 'E'; })) errs.push('mão desconhecida');
    return errs;
  }
  function stickingText(r, n) { // texto pro jogo da memória: um ciclo do padrão, com acentos marcados
    n = n || r.st.length; return r.st.slice(0, n).map(function (h, i) { return (r.acc.indexOf(i) >= 0 ? '>' : '') + h; });
  }
  var CYCLE = { 'RU-F-01': 4, 'RU-F-02': 4, 'RU-F-03': 8, 'RU-F-04': 12, 'RU-F-05': 16, 'RU-F-06': 6, 'RU-M-01': 10, 'RU-M-02': 4, 'RU-M-03': 8, 'RU-M-04': 4, 'RU-M-05': 4, 'RU-M-06': 8 };

  /* ---------- jogos da memória ---------- */
  var MEMORY = [
    { id: 'instrumentos', name: 'Instrumentos de percussão', kind: 'ilustração ↔ nome', pairs: [
      ['pandeiro', 'Pandeiro'], ['tamborim', 'Tamborim'], ['agogo', 'Agogô'], ['ganza', 'Ganzá'], ['triangulo', 'Triângulo'], ['surdo', 'Surdo'],
      ['conga', 'Conga'], ['bongo', 'Bongô'], ['cajon', 'Cajón'], ['clave', 'Clave'], ['cowbell', 'Cowbell'], ['chocalho', 'Chocalho'],
    ].map(function (p) { return { id: p[0], a: { type: 'illus', v: p[0] }, b: { type: 'text', v: p[1] } }; }) },
    { id: 'pecas', name: 'Peças da bateria na pauta', kind: 'nome ↔ notação', pairs: [
      ['bumbo', 'Bumbo'], ['caixa', 'Caixa'], ['hhf', 'Chimbal fechado'], ['hha', 'Chimbal aberto'], ['ride', 'Ride (condução)'], ['crash', 'Crash (ataque)'], ['tom1', 'Tom 1'], ['surdo', 'Surdo'],
    ].map(function (p) { return { id: p[0], a: { type: 'text', v: p[1] }, b: { type: 'drumnote', v: p[0] } }; }) },
    { id: 'figuras', name: 'Figuras e pausas', kind: 'figura ↔ pausa equivalente', pairs: [
      ['w', 'Semibreve'], ['h', 'Mínima'], ['q', 'Semínima'], ['8', 'Colcheia'], ['16', 'Semicolcheia'], ['32', 'Fusa'],
    ].map(function (p) { return { id: p[0], name: p[1], a: { type: 'figure', v: p[0], label: p[1] }, b: { type: 'rest', v: p[0], label: 'pausa' } }; }) },
    { id: 'rudimentos', name: 'Rudimentos', kind: 'nome ↔ baqueteamento', pairs: RUDIMENTS.map(function (r) { return { id: r.id, a: { type: 'text', v: r.name, sub: r.en }, b: { type: 'sticking', v: stickingText(r, CYCLE[r.id]) } }; }) },
    { id: 'bandas', name: 'Bandas de rock', kind: 'banda ↔ integrante', pairs: [
      ['The Beatles', 'Ringo Starr'], ['Nirvana', 'Kurt Cobain'], ['Foo Fighters', 'Dave Grohl'], ['Blink-182', 'Travis Barker'], ['Arctic Monkeys', 'Alex Turner'], ['Queen', 'Freddie Mercury'],
      ['Led Zeppelin', 'John Bonham'], ['Red Hot Chili Peppers', 'Chad Smith'], ['Paramore', 'Hayley Williams'], ['Radiohead', 'Thom Yorke'], ['Twenty One Pilots', 'Josh Dun'], ['The Rolling Stones', 'Mick Jagger'],
    ].map(function (p) { return { id: p[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'), a: { type: 'text', v: p[0], tag: 'banda' }, b: { type: 'text', v: p[1], tag: 'integrante' } }; }),
      // Dave Grohl também foi baterista do Nirvana: as duas bandas nunca entram no mesmo tabuleiro
      conflicts: [['nirvana', 'foo-fighters']] },
  ];
  var MEM_LEVELS = { 1: { name: 'fácil', pairs: 4 }, 2: { name: 'médio', pairs: 6 }, 3: { name: 'difícil', pairs: 8 } };
  function pickPairs(game, level, rand) {
    rand = rand || Math.random; var want = Math.min(MEM_LEVELS[level].pairs, game.pairs.length);
    var pool = game.pairs.slice(); var out = [];
    while (out.length < want && pool.length) {
      var i = Math.floor(rand() * pool.length); var p = pool.splice(i, 1)[0];
      var clash = (game.conflicts || []).some(function (c) { return c.indexOf(p.id) >= 0 && out.some(function (o) { return c.indexOf(o.id) >= 0; }); });
      if (!clash) out.push(p);
    }
    return out;
  }
  function shuffle(a, rand) { rand = rand || Math.random; a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function dealBoard(game, level, rand) {
    var pairs = pickPairs(game, level, rand);
    var cards = []; pairs.forEach(function (p) { cards.push({ pair: p.id, side: 'a', face: p.a }); cards.push({ pair: p.id, side: 'b', face: p.b }); });
    return shuffle(cards, rand).map(function (c, i) { c.key = i; return c; });
  }

  /* ---------- sorteador sem repetir até esgotar ---------- */
  function drawFrom(ids, bag, rand) { // bag = ids que ainda não saíram nesta volta
    rand = rand || Math.random; bag = (bag || []).filter(function (x) { return ids.indexOf(x) >= 0; });
    if (!bag.length) bag = ids.slice();
    var i = Math.floor(rand() * bag.length); var id = bag[i]; bag.splice(i, 1);
    return { id: id, bag: bag };
  }

  var DECKS = {
    figuras: { id: 'figuras', title: 'Figuras e Pausas', short: 'Figuras', no: '01', cards: [].concat(buildRhythmDeck(1), buildRhythmDeck(2), buildRhythmDeck(3)) },
    rockpop: { id: 'rockpop', title: 'Ritmos Rock/Pop', short: 'Rock/Pop', no: '02', cards: GROOVES },
    rudimentos: { id: 'rudimentos', title: 'Rudimentos', short: 'Rudimentos', no: '03', cards: RUDIMENTS },
  };

  var api = { Q: Q, BAR: BAR, FIG: FIG, CELLS: CELLS, ev: ev, rng: rng, LEVEL_NAMES: LEVEL_NAMES, DECKS: DECKS, GROOVES: GROOVES, RUDIMENTS: RUDIMENTS, MEMORY: MEMORY, MEM_LEVELS: MEM_LEVELS,
    rhythmEvents: rhythmEvents, rhythmTitle: rhythmTitle, validateRhythm: validateRhythm, grooveHits: grooveHits, grooveVoice: grooveVoice, rudimentEvents: rudimentEvents, validateRudiment: validateRudiment,
    stickingText: stickingText, CYCLE: CYCLE, pickPairs: pickPairs, dealBoard: dealBoard, shuffle: shuffle, drawFrom: drawFrom };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CGMusic = api;
})(typeof window !== 'undefined' ? window : globalThis);
