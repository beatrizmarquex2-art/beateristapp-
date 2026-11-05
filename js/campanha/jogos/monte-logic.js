// Lógica PURA do Modo Aventura do Monte Seu Ritmo (sem tela, testável no node). Cada carta é UM TEMPO e vale uma célula de js/kids-logic.js:
//   '1000' = semínima (pão, céu, mão, cão) · '1010' = 2 colcheias (bolo, bola, braço, pato) · '1111' = 4 semicolcheias (chocolate…) · '0000' = pausa (shhh).
// Um compasso tem 4 tempos (4 cartas). A VALIDAÇÃO olha a ESTRUTURA rítmica (células), nunca a palavra: qualquer carta do mesmo grupo vale.
import { FOODS } from '../../kids-logic.js';

export const P = '1000'; export const B = '1010'; export const C = '1111'; export const R = '0000';
export const SOUNDS = [P, B, C];
export const CELL_NAME = { [P]: 'semínima (pão)', [B]: '2 colcheias (bolo)', [C]: '4 semicolcheias (chocolate)', [R]: 'pausa (shhh)' };
export const CELL_SHORT = { [P]: 'pão', [B]: 'bolo', [C]: 'chocolate', [R]: 'shhh' };
export const BEATS = 4;
/** Primeira palavra de cada célula (a carta que a missão pré-coloca nos tempos fixos). */
export const FOOD_OF_CELL = Object.fromEntries([P, B, C, R].map((c) => [c, FOODS.find((f) => f.cell === c).id]));
/** Célula de uma carta (id de FOODS), ou null se vazio/desconhecido. */
export const cellFor = (id) => { const f = id ? FOODS.find((x) => x.id === id) : null; return f ? f.cell : null; };
const bar = (cells, b) => cells.slice(b * BEATS, (b + 1) * BEATS);
const distinctSounds = (cs) => new Set(cs.filter((c) => c && c !== R)).size;
const plural = (n, a, b) => (n === 1 ? a : b);

/**
 * Requisitos (todos opcionais): bars (nº de compassos, 1), fixed {tempo: célula}, cells (cartas permitidas), use [células], minRests, maxRests,
 * minDistinct (durações sonoras diferentes no total), barMinDistinct (por compasso), startSound, barRest, endRest, sequence [células exatas],
 * repeatBar (2º compasso igual ao 1º), differentBars, allDistinct (as 4 células aparecem), minCount {célula: n}, listened (ouviu antes de conferir).
 * Devolve a lista de itens exibíveis: [{ key, label, hidden? }].
 */
export function describe(req) {
  const bars = req.bars || 1; const n = bars * BEATS; const out = [{ key: 'complete', label: bars > 1 ? `preencha os ${bars} compassos (${n} tempos)` : 'preencha os 4 tempos do compasso' }];
  if (req.fixed) out.push({ key: 'fixed', label: 'os tempos com 🔒 já estão prontos', hidden: true });
  if (req.cells) out.push({ key: 'cells', label: 'só cartas permitidas', hidden: true });
  (req.use || []).forEach((c) => out.push({ key: `use:${c}`, label: `use ${CELL_NAME[c]}` }));
  if (req.sequence) out.push({ key: 'sequence', label: `siga a sequência: ${req.sequence.map((c) => CELL_SHORT[c]).join(' · ')}` });
  if (req.minRests) out.push({ key: 'minRests', label: `use ${plural(req.minRests, 'uma pausa', `${req.minRests} pausas`)} (shhh)` });
  if (req.maxRests != null) out.push({ key: 'maxRests', label: `no máximo ${plural(req.maxRests, 'uma pausa', `${req.maxRests} pausas`)}` });
  if (req.minDistinct) out.push({ key: 'minDistinct', label: `use pelo menos ${req.minDistinct} durações diferentes (pão, bolo, chocolate)` });
  if (req.barMinDistinct) out.push({ key: 'barMinDistinct', label: `${bars > 1 ? 'em cada compasso, ' : ''}use ${req.barMinDistinct} durações diferentes` });
  if (req.startSound) out.push({ key: 'startSound', label: bars > 1 ? 'comece cada compasso com som (não com shhh)' : 'comece com som (não com shhh)' });
  if (req.barRest) out.push({ key: 'barRest', label: bars > 1 ? 'cada compasso tem uma pausa (shhh)' : 'tenha uma pausa (shhh)' });
  if (req.endRest) out.push({ key: 'endRest', label: 'termine com uma pausa (shhh)' });
  (req.minCount ? Object.entries(req.minCount) : []).forEach(([c, k]) => out.push({ key: `minCount:${c}`, label: `use ${CELL_SHORT[c]} pelo menos ${k}×` }));
  if (req.repeatBar) out.push({ key: 'repeatBar', label: 'o 2º compasso repete o ritmo do 1º' });
  if (req.differentBars) out.push({ key: 'differentBars', label: 'o 2º compasso é diferente do 1º' });
  if (req.allDistinct) out.push({ key: 'allDistinct', label: 'use as 4 coisas: pão, bolo, chocolate e shhh' });
  if (req.listened) out.push({ key: 'listened', label: 'ouça seu ritmo (▶ tocar) antes de conferir' });
  return out;
}

/**
 * Confere a estrutura. `slots` = ids de FOODS por tempo (null = vazio), `ctx.plays` = quantas vezes ouviu.
 * Devolve { complete, ok, checks: [{ key, label, ok, hidden? }], facts } — `ok` só é true com TUDO cumprido (inclusive o compasso totalmente preenchido).
 */
export function check(slots, req, ctx = {}) {
  const bars = req.bars || 1; const n = bars * BEATS; const cells = Array.from({ length: n }, (_, i) => cellFor((slots || [])[i]));
  const complete = cells.every((c) => c !== null);
  const rests = cells.filter((c) => c === R).length; const dist = distinctSounds(cells);
  const bs = Array.from({ length: bars }, (_, b) => bar(cells, b));
  const res = {
    complete,
    fixed: Object.entries(req.fixed || {}).every(([i, c]) => cells[Number(i)] === c),
    cells: !req.cells || cells.every((c) => c === null || req.cells.includes(c)),
    minRests: rests >= (req.minRests || 0), maxRests: req.maxRests == null || rests <= req.maxRests,
    minDistinct: dist >= (req.minDistinct || 0), barMinDistinct: bs.every((b) => distinctSounds(b) >= (req.barMinDistinct || 0)),
    startSound: !req.startSound || bs.every((b) => b[0] !== null && b[0] !== R),
    barRest: !req.barRest || bs.every((b) => b.includes(R)),
    endRest: !req.endRest || cells[n - 1] === R,
    sequence: !req.sequence || (req.sequence.length === n && req.sequence.every((c, i) => cells[i] === c)),
    repeatBar: !req.repeatBar || (bars >= 2 && bs[0].every((c, i) => c !== null && c === bs[1][i])),
    differentBars: !req.differentBars || (bars >= 2 && bs[0].join() !== bs[1].join()),
    allDistinct: !req.allDistinct || [P, B, C, R].every((c) => cells.includes(c)),
    listened: !req.listened || (ctx.plays || 0) >= 1,
  };
  const checks = describe(req).map((d) => {
    let ok;
    if (d.key.startsWith('use:')) ok = cells.includes(d.key.slice(4));
    else if (d.key.startsWith('minCount:')) { const c = d.key.slice(9); ok = cells.filter((x) => x === c).length >= req.minCount[c]; }
    else ok = res[d.key];
    return { ...d, ok: !!ok };
  });
  return { complete, ok: checks.every((c) => c.ok), checks, facts: { cells, rests, distinct: dist } };
}

/** Todas as combinações de células (4^n) que cumprem `req`: usada pra PROVAR que a missão tem solução (e quantas). */
export function solutions(req, ctx = { plays: 1 }) {
  const n = (req.bars || 1) * BEATS; const pool = req.cells || [P, B, C, R]; const out = [];
  const rec = (acc) => {
    if (acc.length === n) { const slots = acc.map((c) => FOOD_OF_CELL[c]); if (check(slots, req, ctx).ok) out.push(acc.slice()); return; }
    const fx = req.fixed && req.fixed[acc.length]; for (const c of fx ? [fx] : pool) { acc.push(c); rec(acc); acc.pop(); }
  };
  rec([]); return out;
}

/** Junta o desafio extra ao requisito base (listas `use` somam; o resto do extra sobrescreve). */
export const mergeReq = (base, extra) => ({ ...base, ...extra, use: [...(base.use || []), ...((extra && extra.use) || [])], ...(base.minCount || (extra && extra.minCount) ? { minCount: { ...(base.minCount || {}), ...((extra && extra.minCount) || {}) } } : {}) });
