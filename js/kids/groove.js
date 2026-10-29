// Grooves de 1 compasso (8 passos: chimbal, caixa e bumbo) pro Detetive do groove, e ritmos de 4 tempos pro Eco rítmico. Puro (sem tela).
import { shuffle } from '../kids-logic.js';

export const ROWS = ['hh', 'sn', 'bd'];
export const ROW_NAME = { hh: 'chimbal', sn: 'caixa', bd: 'bumbo' };
export const STEP_LABEL = ['1', 'e', '2', 'e', '3', 'e', '4', 'e'];
const on = (idx) => Array.from({ length: 8 }, (_, i) => (idx.includes(i) ? 1 : 0));
const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
const clone = (g) => ({ steps: 8, rows: { hh: [...g.rows.hh], sn: [...g.rows.sn], bd: [...g.rows.bd] } });
export const sameGroove = (a, b) => ROWS.every((r) => a.rows[r].every((x, i) => x === b.rows[r][i]));

/** Groove-base: chimbal em colcheias (ou semínimas nas fases altas), caixa no 2 e no 4, bumbo em lugares que não batem com a caixa. */
export function baseGroove(d, rnd = Math.random) {
  const hh = d >= 6 && rnd() < 0.5 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6, 7];
  const bd = pick([[0, 4], [0, 5], [0, 3, 4], [0, 4, 5], [0, 1, 4]], rnd);
  return { steps: 8, rows: { hh: on(hh), sn: on([2, 6]), bd: on(bd) } };
}
/** O mesmo groove com UMA mudança. Devolve { g2, change:{ row, step, op } }. Fases baixas mexem no bumbo; as altas, na caixa e no chimbal. */
export function changed(g, d, rnd = Math.random) {
  const rows = d <= 2 ? ['bd'] : d <= 5 ? ['bd', 'sn', 'hh'] : ['bd', 'sn', 'hh', 'bd'];
  const row = pick(rows, rnd);
  const spots = { bd: [0, 1, 3, 4, 5, 7], sn: [1, 2, 3, 5, 6, 7], hh: [1, 3, 5, 7, 2, 6] }[row];
  const g2 = clone(g);
  for (let tries = 0; tries < 20; tries++) {
    const step = pick(spots, rnd); const v = g.rows[row][step];
    // o bumbo não pode bater junto com a caixa; no chimbal só se mexe nas notas de fora do tempo quando dá
    if (row === 'bd' && g.rows.sn[step]) continue; if (row === 'hh' && v === 0 && g.rows.hh.filter(Boolean).length <= 4 && false) continue;
    g2.rows[row][step] = v ? 0 : 1; return { g2, change: { row, step, op: v ? 'tirou' : 'pôs' } };
  }
  g2.rows.bd[5] = g.rows.bd[5] ? 0 : 1; return { g2, change: { row: 'bd', step: 5, op: g.rows.bd[5] ? 'tirou' : 'pôs' } };
}
export const cellsMatch = (a, b) => { let ok = 0; let wrong = []; for (const r of ROWS) for (let i = 0; i < 8; i++) { if (a.rows[r][i] === b.rows[r][i]) ok++; else wrong.push(`${r}:${i}`); } return { ok, total: 24, wrong }; };
export const emptyGroove = () => ({ steps: 8, rows: { hh: Array(8).fill(0), sn: Array(8).fill(0), bd: Array(8).fill(0) } });

/** Qual linha a criança toca na parte 3 (bumbo é a mais fácil, chimbal a mais cheia). */
export const rowToPlay = (d) => (d <= 3 ? 'bd' : d <= 6 ? 'sn' : 'hh');
/** Tempos (s) de cada batida de uma linha: `bars` compassos, início `t0`, andamento `bpm`. */
export function rowTimes(g, row, bpm, bars = 1, t0 = 0) {
  const dt = 60 / bpm / 2; const out = [];
  for (let b = 0; b < bars; b++) for (let i = 0; i < 8; i++) if (g.rows[row][i]) out.push(t0 + (b * 8 + i) * dt);
  return out;
}

/* ---------- Eco rítmico: 4 tempos, cada tempo é uma célula de 4 semicolcheias ('1' = batida) ---------- */
const EASY = ['1000', '1010', '0000'];
const MID = ['1000', '1010', '1111', '0000'];
const SYNC = ['1000', '1010', '1111', '1001', '0110', '0010', '1100', '1011', '0100'];
export function ecoPattern(d, rnd = Math.random) {
  const pool = d <= 2 ? EASY : d <= 5 ? MID : SYNC; const beats = d >= 9 ? 8 : 4;
  for (;;) {
    const cells = Array.from({ length: beats }, () => pick(pool, rnd));
    const hits = cells.reduce((n, c) => n + [...c].filter((x) => x === '1').length, 0);
    if (cells[0] !== '0000' && hits >= 2 && cells.filter((c) => c === '0000').length <= 1) return { cells, beats, bpm: 66 + d * 4, key: d <= 5 ? 'figuras' : 'sincopa' };
  }
}
export const ecoTimes = ({ cells, bpm }, t0 = 0) => { const q = 60 / bpm; const out = []; cells.forEach((c, b) => [...c].forEach((x, k) => { if (x === '1') out.push(t0 + b * q + (k * q) / 4); })); return out; };

/** Compara os toques com as batidas esperadas. `win` = janela (s). */
export function judgeHits(onsets, expected, win) {
  const used = new Set(); let hits = 0; const devs = [];
  for (const e of expected) {
    let bi = -1; let bd = Infinity;
    onsets.forEach((o, i) => { if (used.has(i)) return; const dd = Math.abs(o - e); if (dd < bd) { bd = dd; bi = i; } });
    if (bi >= 0 && bd <= win) { used.add(bi); hits++; devs.push(Math.round((onsets[bi] - e) * 1000)); }
  }
  return { hits, total: expected.length, extras: onsets.length - used.size, devs };
}
export const roundOk = (j) => j.total > 0 && j.hits / j.total >= 0.8 && j.extras <= Math.max(1, Math.round(j.total * 0.25));
/** Janela de acerto: grande nas fases baixas, menor nas altas; o microfone ganha um pouco mais (latência). Fases fáceis e médias (0 a 6) têm folga extra. */
export const windowFor = (d, mic) => 0.2 - d * 0.01 + (d <= 3 ? 0.06 : d <= 6 ? 0.04 : 0) + (mic ? 0.04 : 0);
export { shuffle };
