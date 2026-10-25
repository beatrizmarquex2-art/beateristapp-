// Beat Lab: grade de bateria (passos × peças) e a biblioteca de ritmos prontos. Lógica pura, sem tela, testada em tests/beats.test.mjs.
export const ROWS = [
  { id: 'hh', label: 'Chimbal' },
  { id: 'sn', label: 'Caixa' },
  { id: 'tt', label: 'Tom' },
  { id: 'ft', label: 'Surdo' },
  { id: 'bd', label: 'Bumbo' },
];
/** Resoluções: passos por compasso de 4/4 e quantos passos cabem num tempo. */
export const GRIDS = { 8: { perBeat: 2, name: 'colcheias' }, 12: { perBeat: 3, name: 'tercinas' }, 16: { perBeat: 4, name: 'semicolcheias' } };
export const STYLES = ['Rock', 'Pop', 'Funk', 'Shuffle', 'Brasil', 'Viradas'];

const on = (n, steps) => Array.from({ length: n }, (_, i) => (steps.includes(i) ? 1 : 0));
const all = (n, every = 1, from = 0) => Array.from({ length: n }, (_, i) => (i >= from && (i - from) % every === 0 ? 1 : 0));
const beat = (name, style, bpm, steps, rows, kind = 'groove') => ({ id: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, style, bpm, steps, kind,
  rows: Object.fromEntries(ROWS.map((r) => [r.id, rows[r.id] || on(steps, [])])) });

/** Padrões de domínio público (grooves de referência de qualquer método). Os 22 ritmos do método Beaterista entram depois, revisados pela Bea. */
export const PRESETS = [
  beat('Rock Básico', 'Rock', 100, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 4]) }),
  beat('Rock 2', 'Rock', 100, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 4, 5]) }),
  beat('Rock com semicolcheia no bumbo', 'Rock', 90, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 7, 8, 10]) }),
  beat('Pop 1', 'Pop', 95, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 3, 4]) }),
  beat('Pop 2', 'Pop', 105, 8, { hh: all(8), sn: on(8, [2, 6]), bd: on(8, [0, 1, 4, 5]) }),
  beat('Funk Groove', 'Funk', 100, 16, { hh: all(16, 2), sn: on(16, [4, 12]), bd: on(16, [0, 3, 6, 10]) }),
  beat('Funk semicolcheias', 'Funk', 92, 16, { hh: all(16), sn: on(16, [4, 12]), bd: on(16, [0, 2, 7, 10]) }),
  beat('Shuffle', 'Shuffle', 120, 12, { hh: on(12, [0, 2, 3, 5, 6, 8, 9, 11]), sn: on(12, [3, 9]), bd: on(12, [0, 6]) }),
  beat('Baião', 'Brasil', 90, 16, { hh: all(16), bd: on(16, [0, 6, 8]), sn: on(16, [8]) }),
  beat('Virada Simples', 'Viradas', 90, 16, { hh: on(16, [0, 2, 4, 6]), sn: on(16, [4, 8, 9, 10, 11, 12, 13, 14, 15]), bd: on(16, [0]) }, 'virada'),
  beat('Virada Intermediária', 'Viradas', 90, 16, { hh: on(16, [0, 2, 4, 6]), sn: on(16, [4, 8, 9, 10, 11]), tt: on(16, [12, 13]), ft: on(16, [14, 15]), bd: on(16, [0]) }, 'virada'),
];

export const emptyBeat = (steps = 8) => beat('Meu ritmo', '', 100, steps, {});
export const clone = (b) => JSON.parse(JSON.stringify(b));

/** Liga/desliga uma célula sem mexer no original. */
export function toggle(b, row, i) {
  const n = clone(b); n.rows[row][i] = n.rows[row][i] ? 0 : 1; return n;
}
export const clear = (b) => ({ ...clone(b), rows: Object.fromEntries(ROWS.map((r) => [r.id, Array(b.steps).fill(0)])) });

/** Troca a resolução mantendo as notas que caem no mesmo lugar do tempo (8 ↔ 16; tercinas recomeçam vazias). */
export function resize(b, steps) {
  if (!GRIDS[steps] || steps === b.steps) return clone(b);
  const n = { ...clone(b), steps };
  for (const r of ROWS) {
    const src = b.rows[r.id] || []; const out = Array(steps).fill(0);
    if (b.steps !== 12 && steps !== 12) src.forEach((v, i) => { const pos = i * steps / b.steps; if (v && Number.isInteger(pos)) out[pos] = 1; });
    n.rows[r.id] = out;
  }
  return n;
}

/** Duração de um passo em segundos. */
export const stepSec = (bpm, steps) => 60 / bpm / GRIDS[steps].perBeat;
/** Peças que tocam no passo i. */
export const hitsAt = (b, i) => ROWS.filter((r) => (b.rows[r.id] || [])[i % b.steps]).map((r) => r.id);
/** Rótulo de contagem embaixo da grade: 1 e 2 e… / 1 e a… / 1 e & a… */
export function countLabels(steps) {
  const per = GRIDS[steps].perBeat; const sub = per === 2 ? ['e'] : per === 3 ? ['e', 'a'] : ['e', '&', 'a'];
  return Array.from({ length: steps }, (_, i) => (i % per === 0 ? String(i / per + 1) : sub[(i % per) - 1]));
}
export const isEmpty = (b) => ROWS.every((r) => !(b.rows[r.id] || []).some(Boolean));
/** Peças usadas: as vazias somem da grade compacta (Tom e Surdo só aparecem quando a virada usa). */
export const usedRows = (b) => ROWS.filter((r) => ['hh', 'sn', 'bd'].includes(r.id) || (b.rows[r.id] || []).some(Boolean));
