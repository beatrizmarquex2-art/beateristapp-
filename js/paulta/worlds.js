// pauLta: mundos, fases e perguntas (puro, sem tela, testado em tests/paulta.test.mjs).
// Cada pergunta: { kind, key, ans, options:[{id,label,img}], promptSvg, say, sound, tags, explain(idEscolhido) }.
import { DRUM, drumStaff, clefStaff, keyboard, kitImage, dotsImage } from './draw.js';
import { mk, noteName, CLEFS, OTHER, posOf, placeText, sameSpotOther, range, inStaff, letterOf, octOf, shuffle, pick, sylOf } from './music.js';

export const MODES = [['nomes', '🔤 nomes'], ['imagens', '🖼 imagens']];
export const MAIN = ['drum', 'sol', 'fa'];
export const WORLDS = {
  drum: { id: 'drum', name: 'Mundo da Bateria', short: 'Bateria', count: 12, color: '#a31d30', blurb: 'ler percussão na pauta', levels: ['drumF', 'drumI', 'drumD'] },
  drumF: { id: 'drumF', name: 'Selva da Bateria', short: 'Selva da Bateria', count: 12, color: '#a31d30', blurb: 'sem acentos, fantasmas, chimbal aberto nem semicolcheias', parent: 'drum', lv: 'F' },
  drumI: { id: 'drumI', name: 'Deserto das Colcheias', short: 'Deserto das Colcheias', count: 12, color: '#a31d30', blurb: 'todos os símbolos, só com colcheias', parent: 'drum', lv: 'I' },
  drumD: { id: 'drumD', name: 'Vulcão das Semicolcheias', short: 'Vulcão das Semicolcheias', count: 12, color: '#a31d30', blurb: 'tudo, até semicolcheias', parent: 'drum', lv: 'D' },
  sol: { id: 'sol', name: 'Mundo da Clave de Sol', short: 'Clave de Sol', count: 15, color: '#14284b', blurb: 'ler notas agudas' },
  fa: { id: 'fa', name: 'Mundo da Clave de Fá', short: 'Clave de Fá', count: 15, color: '#1f5d63', blurb: 'ler notas graves' },
  duel: { id: 'duel', name: 'Duelo das Claves', short: 'Duelo das Claves', count: 6, color: '#8a5a14', blurb: 'sol e fá, uma contra a outra', bonus: true },
};
export const WORLD_IDS = ['drumF', 'drumI', 'drumD', 'sol', 'fa', 'duel'];
export const isDrum = (w) => /^drum[FID]$/.test(String(w));
export const LEVELS = [['drumF', 'fácil'], ['drumI', 'intermediário'], ['drumD', 'difícil']];

/* ================= BATERIA ================= */
const ALL1 = ['bd', 'sn', 'hh', 'rd', 'cr', 'tt', 'mt', 'ft', 'hf'];
const C610 = ['hh+bd', 'cr+bd', 'rd+sn', 'hh+sn', 'tt+ft', 'bd+hf'];
const FIGLAB = { seminima: 'semínima', colcheia: 'colcheias', semicolcheia: 'semicolcheias' };
const FIGN = { seminima: 1, colcheia: 2, semicolcheia: 4 };
const ORDER = ['bd', 'sn', 'sg', 'sa', 'sr', 'hh', 'ho', 'hf', 'rd', 'cr', 'tt', 'mt', 'ft'];
const sortIds = (ids) => ids.slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
export const partsOf = (id) => String(id).split('@')[0].split('+');
export const figOf = (id) => String(id).split('@')[1] || null;
export const symName = (id) => { const p = partsOf(id).map((x) => DRUM[x].name).join(' + '); const f = figOf(id); return f ? `${p} · ${FIGLAB[f]}` : p; };
const comboId = (ids, fig) => `${sortIds(ids).join('+')}${fig ? `@${fig}` : ''}`;

const dp = (title, rounds, o) => ({ title, rounds, secs: null, optSecs: null, sudden: false, need: 0.6, ...o });
/** Regras de cada modo. Fácil: sem semicolcheia, acento, nota fantasma, aro nem chimbal aberto. Intermediário: todos os símbolos, só colcheias.
 *  Difícil: tudo. `kinds` = tipos de pergunta usados nas fases mistas. */
const ART = ['ho', 'sg', 'sa', 'sr'];
const ALLI = [...ALL1, ...ART];
const CART = ['sa+bd', 'sg+bd', 'ho+bd', 'sa+hh', 'cr+sa'];
const cn = (id) => comboId(partsOf(id), figOf(id));
export const LV = {
  F: { singles: ALL1, combos: C610.map(cn), figs: ['seminima', 'colcheia'], artBases: [], artFigs: [], kinds: ['single', 'combo', 'fig'] },
  I: { singles: ALLI, combos: [...C610, ...CART].map(cn), figs: ['seminima', 'colcheia'], artBases: ['sn', 'sg', 'sa', 'sr', 'hh', 'ho'], artFigs: ['colcheia'], kinds: ['single', 'combo', 'fig', 'artfig'] },
  D: { singles: ALLI, combos: [...C610, ...CART].map(cn), figs: ['seminima', 'colcheia', 'semicolcheia'], artBases: ['sn', 'sg', 'sa', 'sr', 'hh', 'ho'], artFigs: ['colcheia', 'semicolcheia'], kinds: ['single', 'combo', 'fig', 'artfig'] },
};
const NOTIME = ['single', 'combo']; // fases com cronômetro não têm figuras (colcheia/semicolcheia nunca valem com tempo)
export const DRUM_LEVELS = {
  drumF: [
    dp('Bumbo, caixa e chimbal', 4, { q: 'single', pool: ['bd', 'sn', 'hh'] }),
    dp('Pratos: chimbal, condução e ataque (sem errar)', 4, { q: 'single', pool: ['hh', 'rd', 'cr'], sudden: true, need: 1 }),
    dp('Tom 1 e surdo', 4, { q: 'single', pool: ['tt', 'ft'], optSecs: 10 }),
    dp('Tom 1 e tom 2', 4, { q: 'single', pool: ['tt', 'mt'], streak: true }),
    dp('Revisão geral + chimbal com o pé', 5, { q: 'single', pool: ALL1 }),
    dp('Chimbal + bumbo (sem errar)', 5, { q: 'combo', pool: ['hh+bd'], sudden: true, need: 1 }),
    dp('Prato de ataque + bumbo', 5, { q: 'combo', pool: ['cr+bd'] }),
    dp('Condução + caixa; chimbal + caixa', 5, { q: 'combo', pool: ['rd+sn', 'hh+sn'], secs: 10 }),
    dp('Tom 1 + surdo; bumbo + chimbal com o pé', 5, { q: 'combo', pool: ['tt+ft', 'bd+hf'] }),
    dp('Combinações com cronômetro', 6, { q: 'combo', pool: C610, secs: 10 }),
    dp('Colcheias', 5, { q: 'fig', pool: ['hh', 'sn'], figs: ['seminima', 'colcheia'] }),
    dp('Mestre da bateria fácil', 6, { q: 'mix', kinds: NOTIME, secs: 10, need: 0.7 }),
  ],
  drumI: [
    dp('Revisão geral das peças', 5, { q: 'single', pool: ALL1 }),
    dp('Chimbal fechado, aberto e com o pé', 5, { q: 'single', pool: ['hh', 'ho', 'hf'] }),
    dp('Caixa normal, fantasma e acento', 6, { q: 'single', pool: ['sn', 'sg', 'sa'] }),
    dp('Caixa, aro, fantasma e acento', 6, { q: 'single', pool: ['sn', 'sr', 'sg', 'sa'], secs: 10 }),
    dp('Combinações', 6, { q: 'combo', pool: C610, optSecs: 10 }),
    dp('Combinações sem errar', 6, { q: 'combo', pool: C610, sudden: true, need: 1 }),
    dp('Semínima ou colcheias?', 6, { q: 'fig', pool: ['hh', 'sn'], figs: ['seminima', 'colcheia'] }),
    dp('Técnica + colcheias', 6, { q: 'artfig' }),
    dp('Combinações com articulações', 6, { q: 'combo', pool: [...C610, ...CART], secs: 10 }),
    dp('Misto com cronômetro', 7, { q: 'mix', kinds: NOTIME, secs: 10 }),
    dp('Misto sem errar', 6, { q: 'mix', sudden: true, need: 1 }),
    dp('Mestre da bateria intermediário', 8, { q: 'mix', kinds: NOTIME, secs: 7, need: 0.8 }),
  ],
  drumD: [
    dp('Revisão geral das peças', 5, { q: 'single', pool: ALLI, secs: 10 }),
    dp('Todas as técnicas', 6, { q: 'single', pool: ['hh', 'ho', 'hf', 'sn', 'sg', 'sa', 'sr'] }),
    dp('Combinações', 6, { q: 'combo', pool: C610, secs: 10 }),
    dp('Combinações com articulações', 6, { q: 'combo', pool: [...C610, ...CART], secs: 8 }),
    dp('Colcheias e semicolcheias', 6, { q: 'fig', pool: ['hh', 'sn'], figs: ['seminima', 'colcheia', 'semicolcheia'] }),
    dp('Técnica + figura', 7, { q: 'artfig' }),
    dp('Combinações sem errar', 6, { q: 'combo', pool: [...C610, ...CART], sudden: true, need: 1 }),
    dp('Misto com cronômetro', 8, { q: 'mix', kinds: NOTIME, secs: 8 }),
    dp('Figuras sem errar', 5, { q: 'fig', pool: ['hh', 'sn'], figs: ['seminima', 'colcheia', 'semicolcheia'], sudden: true, need: 1 }),
    dp('Tudo misturado sem errar', 7, { q: 'mix', rot: true, sudden: true, need: 1 }),
    dp('Misto relâmpago', 8, { q: 'mix', kinds: NOTIME, secs: 7 }),
    dp('Mestre da bateria difícil', 10, { q: 'mix', rot: true, need: 0.8 }),
  ],
};
/** Peças/símbolos que a fase ensina pela primeira vez (Paul apresenta antes das perguntas). */
export function drumPoolOf(lv, n) {
  const sp = DRUM_LEVELS[lv][n - 1];
  if (sp.q === 'mix') return LV[lv.slice(-1)].singles;
  if (sp.q === 'artfig') return LV[lv.slice(-1)].artBases;
  if (sp.q === 'fig') return sp.pool;
  return [...new Set(sp.pool.flatMap(partsOf))];
}
export function teachOf(world, n) {
  if (isDrum(world)) {
    const sp = DRUM_LEVELS[world][n - 1]; if (sp.q === 'mix' || sp.q === 'fig' || sp.q === 'artfig') return [];
    const seen = new Set(); for (let k = 1; k < n; k++) drumPoolOf(world, k).forEach((x) => seen.add(x));
    return drumPoolOf(world, n).filter((x) => !seen.has(x));
  }
  if (world === 'sol' || world === 'fa') {
    const seen = new Set(); for (let k = 1; k < n; k++) notePool(world, k).forEach((x) => seen.add(x));
    return notePool(world, n).filter((x) => !seen.has(x)).slice(0, 7);
  }
  return [];
}

/* ----- explicações da bateria ----- */
const FAMILY = [['rd', 'cr'], ['hh', 'ho', 'hf'], ['tt', 'mt', 'ft'], ['sn', 'sg', 'sa', 'sr'], ['bd', 'sn']];
const HINT = {
  cym: 'O prato de condução (ride) fica na 5ª linha; o prato de ataque (crash) fica acima da pauta, numa linha suplementar.',
  hat: 'O X do chimbal fica acima da pauta. Com um círculo (o) em cima, é chimbal aberto. Um X abaixo da pauta é o chimbal tocado com o pé.',
  tom: 'Tom 1 = 4º espaço, tom 2 = 4ª linha, surdo = 2º espaço. Quanto mais baixo na pauta, mais grave é a peça.',
  sn: 'Na caixa: parênteses = nota fantasma (bem baixinha); sinal > = acento (mais forte); X no 3º espaço = aro (cross-stick). Rimshot é outra técnica (pele e aro juntos) e não aparece aqui.',
  bdsn: 'O bumbo mora no 1º espaço, embaixo. A caixa mora no 3º espaço, no meio.',
};
function hintFor(a, c) {
  const fam = FAMILY.find((f) => f.includes(a) && f.includes(c)); if (!fam) return '';
  return fam[0] === 'rd' ? HINT.cym : fam[0] === 'hh' ? HINT.hat : fam[0] === 'tt' ? HINT.tom : fam[0] === 'sn' ? HINT.sn : HINT.bdsn;
}
function explainDrum(q, c) {
  const a = partsOf(q.ans); const ch = partsOf(c); const fa = figOf(q.ans); const fc = figOf(c); const out = [];
  if (a.length > 1) {
    out.push(`Essas ${a.length === 2 ? 'duas notas estão alinhadas' : 'notas estão alinhadas'} verticalmente. Isso indica que as peças são tocadas simultaneamente: ${a.map((x) => DRUM[x].name).join(' + ')}.`);
    if (ch.length === 1) out.push(`Você escolheu só ${DRUM[ch[0]].name}.`);
    else { const miss = a.filter((x) => !ch.includes(x)); if (miss.length) out.push(`Na sua resposta faltou ${DRUM[miss[0]].name}${ch.find((x) => !a.includes(x)) ? ` e sobrou ${DRUM[ch.find((x) => !a.includes(x))].name}` : ''}.`); }
    for (const x of a) { const w = ch.find((y) => !a.includes(y) && FAMILY.some((f) => f.includes(x) && f.includes(y))); if (w) { out.push(hintFor(x, w)); break; } }
  } else {
    const wrongName = DRUM[ch[0]] ? DRUM[ch[0]].name : c;
    out.push(`Você escolheu ${wrongName}, mas a posição apresentada corresponde a ${DRUM[a[0]].name} na legenda deste jogo: ${DRUM[a[0]].where}.`);
    const t = hintFor(a[0], ch[0]); if (t) out.push(t);
  }
  if (fa && fa !== fc) out.push(`Conte as notas dentro de um tempo: aqui são ${FIGN[fa]} (${FIGLAB[fa]}). ${fa === 'seminima' ? 'Uma nota só, sem ligação.' : fa === 'colcheia' ? 'Duas notas ligadas por 1 traço.' : 'Quatro notas ligadas por 2 traços.'}`);
  return out.join(' ');
}
const explainFig = (q, c) => `Conte as notas dentro de um tempo: semínima = 1 nota sem ligação; colcheias = 2 notas ligadas por 1 traço; semicolcheias = 4 notas ligadas por 2 traços. Aqui são ${FIGN[q.ans]} notas, então é ${FIGLAB[q.ans]}.${c ? ` Você escolheu ${FIGLAB[c]}.` : ''}`;

/* ----- perguntas da bateria ----- */
const unique = (a) => [...new Set(a)];
const CLASH = [['hh', 'ho', 'hf'], ['rd', 'cr'], ['sn', 'sg', 'sa', 'sr']]; // duas peças da mesma família não tocam juntas
const clash = (a, b) => CLASH.some((g) => g.includes(a) && g.includes(b));
/** Combinações "parecidas": troca uma das peças por outra já conhecida (sempre com duas peças). */
function neighbors(ans, parts, fig) {
  const ap = partsOf(ans); const out = [];
  ap.forEach((p, k) => { const keep = ap.filter((_, j) => j !== k); for (const r of parts) { if (ap.includes(r) || keep.some((x) => clash(x, r))) continue; out.push(comboId([...keep, r], fig)); } });
  return out;
}
function drumOptions(ans0, pool, learned, rnd, n) {
  const ans = partsOf(ans0).length > 1 ? cn(ans0) : ans0; // mesma ordem das peças em todas as alternativas (não repete "a+b" e "b+a")
  const ap = partsOf(ans); const fig = figOf(ans); const set = new Set([ans]);
  const add = (id) => { if (set.size < n && id) set.add(id); };
  if (ap.length > 1) { // combinação: pelo menos 2 alternativas também com duas peças, e só 1 solta
    const known = learned.filter((x) => DRUM[x]);
    const combos = unique([...shuffle(pool.map(cn).filter((x) => x !== ans), rnd), ...shuffle(neighbors(ans, known, fig), rnd)]).filter((x) => x !== ans);
    const want2 = Math.max(2, n - 2); let c2 = 0;
    for (const c of combos) { if (c2 >= want2) break; add(c); c2++; }
    add(comboId([shuffle(ap, rnd)[0]], fig));
    for (const c of combos) add(c);
    shuffle(ap, rnd).forEach((p) => add(comboId([p], fig)));
  } else {
    shuffle(pool.filter((x) => x !== ans), rnd).forEach(add);
    const fam = FAMILY.find((f) => f.includes(ap[0])); if (fam && pool.length < n) shuffle(fam.filter((x) => learned.includes(x)), rnd).forEach(add);
    shuffle(learned.filter((x) => x !== ans), rnd).forEach(add);
  }
  return shuffle([...set].slice(0, n).map((x) => (x === ans ? ans0 : x)), rnd);
}
const learnedParts = (lv, n) => unique(Array.from({ length: n }, (_, k) => drumPoolOf(lv, k + 1)).flat().flatMap(partsOf)).filter((x) => DRUM[x]);
function drumQuestion(lv, n, mode, rnd, i) {
  const sp = DRUM_LEVELS[lv][n - 1]; const L = LV[lv.slice(-1)]; const learned = learnedParts(lv, n);
  let kind = sp.q;
  if (kind === 'mix') { const ks = sp.kinds || L.kinds; kind = sp.rot ? ks[i % ks.length] : pick(ks, rnd); }
  const figs = sp.figs || L.figs; let pool = sp.pool; let ans; let fig = null; let piece_ = null;
  // fases com poucos itens novos: as perguntas ímpares revisam o que já foi aprendido (senão a mesma pergunta voltaria seguida)
  if ((kind === 'single' || kind === 'combo') && sp.q !== 'mix' && pool.length < 4 && rnd() < 0.5) {
    const extra = kind === 'single' ? learned.filter((x) => !pool.includes(x)) : L.combos.filter((c) => partsOf(c).every((x) => learned.includes(x)) && !pool.map(cn).includes(c));
    if (extra.length) pool = extra;
  }
  if (kind === 'single' && sp.q === 'mix') pool = L.singles;
  if (kind === 'combo' && sp.q === 'mix') pool = L.combos;
  if (kind === 'fig') { fig = pick(figs, rnd); piece_ = pick(['hh', 'sn'], rnd); ans = fig; }
  else if (kind === 'artfig') { const base = pick(L.artBases, rnd); fig = pick(L.artFigs, rnd); ans = comboId([base], fig); pool = []; }
  else ans = pick(pool, rnd);
  if (pool && pool.length > 1 && !pool.includes(ans)) pool = [ans, ...pool];
  if (kind === 'fig') {
    const options = figs.map((f) => ({ id: f, label: `${FIGLAB[f]} (${FIGN[f]} por tempo)`, img: dotsImage(f) }));
    return { kind: 'fig', key: `fig:${ans}`, sig: `fig:${ans}:${piece_}`, ans, options: shuffle(options, rnd), promptSvg: drumStaff(piece_, ans), say: 'quantas notas cabem dentro de um tempo?', sound: { type: 'drum', ids: [piece_], fig: ans }, tags: [`fig:${ans}`], explain: (c) => explainFig({ ans }, c) };
  }
  if (kind === 'artfig') {
    const set = new Set([ans]); const [bp] = partsOf(ans); const f0 = figOf(ans);
    const arts = ['sn', 'sg', 'sa', 'sr'].includes(bp) ? ['sn', 'sg', 'sa', 'sr'] : ['hh', 'ho', 'hf'];
    shuffle(arts.filter((x) => x !== bp), rnd).slice(0, 2).forEach((x) => set.add(comboId([x], f0)));
    const other = L.artFigs.find((f) => f !== f0) || (f0 === 'colcheia' ? 'seminima' : 'colcheia'); set.add(comboId([bp], other));
    const options = shuffle([...set].slice(0, 4), rnd).map((id) => ({ id, label: symName(id), img: kitImage(partsOf(id), figOf(id)) }));
    return { kind: 'drum', key: `art:${ans}`, ans, options, promptSvg: drumStaff(partsOf(ans), figOf(ans)), say: 'que peça, técnica e figura é essa?', sound: { type: 'drum', ids: partsOf(ans), fig: figOf(ans) }, tags: [`art:${bp}`, `fig:${f0}`], explain: (c) => explainDrum({ ans }, c) };
  }
  const ap = partsOf(ans); const nOpts = ap.length > 1 ? 4 : Math.min(4, Math.max(3, pool.length));
  const ids = drumOptions(ans, pool, learned, rnd, nOpts);
  const options = ids.map((id) => ({ id, label: symName(id), img: kitImage(partsOf(id)) }));
  const key = ap.length > 1 ? `combo:${ans}` : `peca:${ans}`;
  return { kind: 'drum', key, ans, options, promptSvg: drumStaff(ap), say: ap.length > 1 ? 'quem toca nessas notas juntas?' : 'que peça é essa?', sound: { type: 'drum', ids: ap }, tags: [key], explain: (c) => explainDrum({ ans }, c) };
}

/* ================= CLAVES ================= */
const N = (l, o) => mk(l, o);
const E4 = 30; // base de sol
// Pools de sol por fase. Fá usa as MESMAS posições na pauta, 12 casas abaixo.
const SOL = [
  [N('E', 4), N('F', 4), N('G', 4)], [N('A', 4), N('B', 4), N('C', 5)], [N('D', 5), N('E', 5), N('F', 5)],
  range(N('E', 4), N('B', 4)), range(N('C', 5), N('G', 5)),
  range(N('E', 4), N('D', 5)), range(N('G', 4), N('F', 5)), range(E4, E4 + 8),
  range(N('C', 4), N('G', 4)), range(N('F', 5), N('C', 6)),
  [N('C', 4), N('C', 5), N('C', 6), N('G', 4), N('G', 5), N('E', 4), N('E', 5), N('A', 4), N('A', 5)],
  range(E4, E4 + 8), range(N('C', 4), N('C', 6)), range(N('C', 4), N('C', 6)), range(N('C', 4), N('C', 6)),
];
export const NOTE_PHASES = [
  { title: 'Mi, fá e sol', rounds: 5, pool: 0 }, { title: 'Lá, si e dó', rounds: 5, pool: 1 }, { title: 'Ré, mi e fá (em cima)', rounds: 5, pool: 2 },
  { title: 'Cinco notas: mi até si', rounds: 6, pool: 3 }, { title: 'Cinco notas: dó até sol', rounds: 6, pool: 4 },
  { title: 'Sete notas naturais (1)', rounds: 7, pool: 5 }, { title: 'Sete notas naturais (2)', rounds: 7, pool: 6 }, { title: 'Linhas e espaços da pauta', rounds: 7, pool: 7 },
  { title: 'Linhas suplementares de baixo', rounds: 7, pool: 8 }, { title: 'Linhas suplementares de cima', rounds: 7, pool: 9 }, { title: 'Oitavas', rounds: 7, pool: 10, oct: true },
  { title: 'Duas notas seguidas', rounds: 6, pool: 11, seq: 2 }, { title: 'Pequenas sequências', rounds: 6, pool: 12, seq: 3 },
  { title: 'Revisão com velocidade', rounds: 8, pool: 13, secs: 10 }, { title: 'Desafio de precisão', rounds: 10, pool: 14, secs: 8, mixseq: true, need: 0.8 },
].map((p) => ({ secs: null, optSecs: null, sudden: false, need: 0.6, ...p }));
export const notePool = (clef, n) => SOL[NOTE_PHASES[n - 1].pool].map((x) => (clef === 'fa' ? x - 12 : x));
export const phaseCount = (w) => WORLDS[w].count;

/** Duelo das Claves (6 fases). */
export const DUEL_PHASES = [
  { title: 'Reconhecimento', rounds: 6, secs: null, sudden: false, need: 0.6, opts: 4 },
  { title: 'Troca de claves', rounds: 8, secs: null, sudden: false, need: 0.6, opts: 4, same: true },
  { title: 'Atenção musical', rounds: 8, secs: 12, sudden: false, need: 0.6, opts: 6, wide: true },
  { title: 'Oitavas', rounds: 8, secs: 14, sudden: false, need: 0.6, opts: 4, oct: true },
  { title: 'Duelo perfeito', rounds: 8, secs: null, sudden: true, need: 1, opts: 5, wide: true },
  { title: 'Desafio final', rounds: 8, secs: 10, sudden: true, need: 1, opts: 5, wide: true },
].map((p) => ({ optSecs: null, ...p }));

export function phaseSpec(world, n) {
  const base = isDrum(world) ? DRUM_LEVELS[world][n - 1] : world === 'duel' ? DUEL_PHASES[n - 1] : NOTE_PHASES[n - 1];
  if (!base) return null;
  return { world, n, title: base.title, rounds: base.rounds, secs: base.secs || null, optSecs: base.optSecs || null, sudden: !!base.sudden, need: base.need, streak: !!base.streak };
}

const seqName = (arr) => arr.map(noteName).join(' · ');
function explainNote(q, c) {
  const { clef, notes } = q; const out = [];
  const cn = String(c).split(',').map(Number); const an = notes;
  if (an.length === 1) {
    const a = an[0]; const ch = cn[0];
    if (ch === sameSpotOther(clef, a)) out.push(`Você encontrou a nota certa, mas observou a clave errada. Aqui é a ${CLEFS[clef].name}${clef === 'fa' ? ': as posições representam outras alturas, bem mais graves que na clave de sol' : ': as posições são mais agudas que na clave de fá'}. Esta nota é ${noteName(a)}.`);
    else if (letterOf(ch) === letterOf(a)) out.push(`A letra está certa (${sylOf(a)}), mas a oitava não: esta nota é ${noteName(a)}. ${octOf(ch) < octOf(a) ? 'Você escolheu uma oitava mais grave; esta é mais aguda.' : 'Você escolheu uma oitava mais aguda; esta é mais grave.'}${a === mk('C', 4) ? ' Dó4 é o dó central, na 1ª linha suplementar abaixo da clave de sol (ou acima da de fá).' : ''}`);
    else out.push(`Você escolheu ${noteName(ch)}, mas a nota está ${placeText(clef, a)}: é ${noteName(a)}. Conte as linhas e os espaços de baixo pra cima.`);
  } else {
    const bad = an.findIndex((x, i) => x !== cn[i]);
    out.push(`Na ${bad + 1}ª nota você respondeu ${noteName(cn[bad])}, mas ela está ${placeText(clef, an[bad])}: é ${noteName(an[bad])}. A sequência certa é ${seqName(an)}.`);
    if (cn.every((x, i) => x === sameSpotOther(clef, an[i]))) out.push('As posições estão certas, mas na clave errada: confira se é sol ou fá.');
  }
  return out.join(' ');
}
function noteOptions(clef, notes, pool, rnd, nOpts, oct) {
  const len = notes.length; const ansId = notes.join(',');
  const set = new Set([ansId]); const lo = posOf(clef, 0) * 0; void lo;
  const cand = (arr) => arr.filter((x) => x >= CLEFS[clef].bottom - 4 && x <= CLEFS[clef].bottom + 12);
  if (len === 1) {
    const a = notes[0]; const sibs = cand([a - 7, a + 7, a - 14, a + 14]);
    const near = cand([a - 1, a + 1, a - 2, a + 2]); const trap = sameSpotOther(clef, a);
    const order = oct ? [...sibs, ...near] : [...shuffle(pool.filter((x) => x !== a), rnd), ...(rnd() < 0.5 ? [trap] : []), ...near, ...sibs, trap];
    for (const x of order) if (set.size < nOpts) set.add(String(x));
  } else {
    while (set.size < nOpts) {
      const alt = notes.slice(); const k = Math.floor(rnd() * len); const d = pick([-2, -1, 1, 2], rnd); alt[k] = notes[k] + d;
      if (rnd() < 0.3) alt.reverse();
      if (alt.every((x) => x >= CLEFS[clef].bottom - 4 && x <= CLEFS[clef].bottom + 12)) set.add(alt.join(','));
    }
  }
  return shuffle([...set].slice(0, nOpts), rnd);
}
function noteQuestion(world, n, mode, rnd, i, forced) {
  const clef = forced.clef || world; const sp = forced.sp || NOTE_PHASES[n - 1];
  const pool = forced.pool || notePool(clef, n); const len = forced.len || (sp.mixseq ? (rnd() < 0.5 ? 1 : 2) : sp.seq || 1);
  const notes = forced.notes ? forced.notes.slice() : []; let guard = 0;
  while (notes.length < len && guard++ < 50) { const x = pick(pool, rnd); if (!notes.length || x !== notes[notes.length - 1]) notes.push(x); }
  const nOpts = forced.opts || (n <= 3 ? 3 : 4);
  const ids = noteOptions(clef, notes, pool, rnd, nOpts, forced.oct || sp.oct);
  const options = ids.map((id) => { const arr = String(id).split(',').map(Number); return { id: String(id), label: seqName(arr), img: keyboard(clef, arr) }; });
  const q = { clef, notes };
  return { kind: 'note', clef, notes, key: `nota:${notes.join(',')}@${clef}`, ans: notes.join(','), options, promptSvg: clefStaff(clef, notes), say: len > 1 ? 'que notas são essas, na ordem?' : `que nota é essa? (${CLEFS[clef].name})`, sound: { type: 'note', ns: notes }, tags: len === 1 ? [`nota:${noteName(notes[0])}`, ...(forced.oct || sp.oct ? ['oitava'] : [])] : ['sequencia'], explain: (c) => explainNote(q, c), clefName: CLEFS[clef].name };
}
function duelQuestion(n, mode, rnd, i) {
  const sp = DUEL_PHASES[n - 1]; const clef = i % 2 === 0 ? 'sol' : 'fa';
  let pool = sp.wide ? range(CLEFS[clef].bottom - 2, CLEFS[clef].bottom + 10) : inStaff(clef);
  if (sp.same) { const s = Math.floor(rnd() * 9); pool = [CLEFS[clef].bottom + s]; }
  if (sp.oct) { const L = pick(['C', 'D', 'E', 'F', 'G', 'A', 'B'], rnd); pool = range(CLEFS[clef].bottom - 4, CLEFS[clef].bottom + 12).filter((x) => letterOf(x) === L); if (pool.length < 2) pool = range(CLEFS[clef].bottom - 4, CLEFS[clef].bottom + 12).filter((x) => letterOf(x) === 'C'); }
  const q = noteQuestion('duel', n, mode, rnd, i, { clef, sp, pool, opts: sp.opts, oct: sp.oct, len: 1 });
  q.say = `que nota é essa? (${CLEFS[clef].name})`; q.tags.push('clave'); return q;
}

/** Cria a pergunta `i` (0-based) da fase. `rnd` = sorteio (use seeded() nos testes). `avoid` = assinaturas das últimas perguntas (não repete seguidas). */
export function makeQuestion(world, n, mode, rnd = Math.random, i = 0, avoid = []) {
  let q = null;
  for (let t = 0; t < 40; t++) {
    q = isDrum(world) ? drumQuestion(world, n, mode, rnd, i) : world === 'duel' ? duelQuestion(n, mode, rnd, i) : noteQuestion(world, n, mode, rnd, i, {});
    if (!avoid.includes(q.sig || q.key)) break;
  }
  q.world = world; q.n = n; q.mode = mode; return q;
}
/** Reforço: pergunta montada a partir de uma "tag" de dificuldade guardada no histórico (ex.: peca:hh, combo:hh+bd, fig:colcheia, nota:mi4, oitava, clave). */
const SYLN = { 'dó': 'C', 'ré': 'D', mi: 'E', 'fá': 'F', sol: 'G', 'lá': 'A', si: 'B' };
export function parseNoteName(s) { const m = /^(dó|ré|mi|fá|sol|lá|si)(\d)$/.exec(String(s)); return m ? mk(SYLN[m[1]], Number(m[2])) : null; }
export function reinforceQuestion(tag, mode, rnd = Math.random) {
  const [t, v] = String(tag).split(/:(.+)/); let q = null;
  const learned = ['bd', 'sn', 'hh', 'rd', 'cr', 'tt', 'mt', 'ft', 'hf', 'ho', 'sg', 'sa', 'sr'];
  if (t === 'peca' || t === 'combo') {
    const ap = partsOf(v); const pool = t === 'combo' ? C610 : ap.some((x) => ['sg', 'sa', 'sr'].includes(x)) ? ['sn', 'sg', 'sa', 'sr'] : ap[0] === 'ho' ? ['hh', 'ho', 'hf'] : ALL1;
    const ids = drumOptions(v, pool.includes(v) ? pool : [v, ...pool], learned, rnd, 4);
    q = { kind: 'drum', key: tag, ans: v, options: ids.map((id) => ({ id, label: symName(id), img: kitImage(partsOf(id)) })), promptSvg: drumStaff(ap), say: ap.length > 1 ? 'quem toca nessas notas juntas?' : 'que peça é essa?', sound: { type: 'drum', ids: ap }, tags: [tag], explain: (c) => explainDrum({ ans: v }, c) };
  } else if (t === 'fig') q = drumFigQ(v, rnd);
  else if (t === 'art') q = reinforceQuestion(`peca:${v}`, mode, rnd);
  else if (t === 'nota') { const nn = parseNoteName(v); if (nn != null) { const clef = nn < 28 ? 'fa' : nn > 28 ? 'sol' : (rnd() < 0.5 ? 'sol' : 'fa'); const pool = unique([...notePool(clef, 8), nn]); q = noteQuestion(clef, 8, mode, rnd, 0, { clef, pool, notes: [nn], len: 1, opts: 4, sp: { oct: false } }); } }
  else if (t === 'oitava') q = duelQuestion(4, mode, rnd, Math.floor(rnd() * 2));
  else if (t === 'clave') q = duelQuestion(2, mode, rnd, Math.floor(rnd() * 2));
  else if (t === 'sequencia') q = noteQuestion('sol', 12, mode, rnd, 0, {});
  if (q) { q.world = 'reforco'; q.mode = mode; q.tag = tag; }
  return q;
}
function drumFigQ(fig, rnd) {
  const piece = pick(['hh', 'sn'], rnd); const figs = ['seminima', 'colcheia', 'semicolcheia'];
  return { kind: 'fig', key: `fig:${fig}`, ans: fig, options: shuffle(figs.map((f) => ({ id: f, label: `${FIGLAB[f]} (${FIGN[f]} por tempo)`, img: dotsImage(f) })), rnd), promptSvg: drumStaff(piece, fig), say: 'quantas notas cabem dentro de um tempo?', sound: { type: 'drum', ids: [piece], fig }, tags: [`fig:${fig}`], explain: (c) => explainFig({ ans: fig }, c) };
}
/** A resposta certa em palavras (aparece depois que a pessoa responde, ou quando o tempo acaba). */
export function revealOf(q) {
  if (q.kind === 'fig') return `${FIGLAB[q.ans]} (${FIGN[q.ans]} nota${FIGN[q.ans] > 1 ? 's' : ''} por tempo)`;
  if (q.kind === 'drum') { const ap = partsOf(q.ans); return ap.length > 1 ? symName(q.ans) : `${symName(q.ans)}, ${DRUM[ap[0]].where}`; }
  return q.notes.length === 1 ? `${noteName(q.notes[0])}, ${placeText(q.clef, q.notes[0])}` : seqName(q.notes);
}
export { symName as drumName };
