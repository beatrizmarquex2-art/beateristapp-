// Quebra-cabeça: regras puras. Peça i pertence à posição i (linha = ⌊i/cols⌋, coluna = i % cols).
export const DIFFS = { 6: { cols: 3, rows: 2 }, 12: { cols: 4, rows: 3 }, 24: { cols: 6, rows: 4 } };
export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Divisões calculadas a partir do tamanho natural: retângulos que ladrilham a imagem inteira, sem folga nem sobreposição. */
export function pieceRects(W, H, cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = Math.round((c * W) / cols); const x1 = Math.round(((c + 1) * W) / cols); const y0 = Math.round((r * H) / rows); const y1 = Math.round(((r + 1) * H) / rows);
    out.push({ i: r * cols + c, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  return out;
}
/** Posição CSS (background-position em %) para mostrar só a peça (col,row) com background-size cols×rows (em %). */
export const bgPos = (c, r, cols, rows) => `${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${rows > 1 ? (r / (rows - 1)) * 100 : 0}%`;

export function newGame({ diff = 6, free = false, rnd = Math.random } = {}) {
  if (!DIFFS[diff]) throw new Error('dificuldade inválida');
  const n = diff; let tray = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  if (n > 1 && tray.every((p, i) => p === i)) tray = tray.slice(1).concat(tray[0]); // nunca começa montado
  return { v: 1, diff, free, tray, placed: Array(n).fill(false), hints: 0, errors: 0, elapsed: 0, started: false, over: false };
}
const clone = (g) => JSON.parse(JSON.stringify(g));
/** Encaixa a peça se (e só se) a posição for a dela; erro devolve a peça à bandeja (não muda nada). */
export function place(g0, piece, pos) {
  if (g0.over) throw new Error('fim de jogo');
  if (!g0.tray.includes(piece)) throw new Error('peça não está na bandeja');
  if (!Number.isInteger(pos) || pos < 0 || pos >= g0.diff) throw new Error('posição inválida');
  const g = clone(g0); g.started = true;
  if (piece !== pos || g.placed[pos]) { g.errors++; return { g, ok: false }; }
  g.placed[pos] = true; g.tray = g.tray.filter((p) => p !== piece);
  if (g.placed.every(Boolean)) g.over = true;
  return { g, ok: true };
}
export function useHint(g0) { const g = clone(g0); g.hints++; g.started = true; return g; }
export const placedCount = (g) => g.placed.filter(Boolean).length;
/** Melhor tempo separado: "sem dicas" e "com dicas" nunca se misturam; modo livre não conta. */
export const bestKey = (g) => `${g.diff}:${g.hints > 0 ? 'com' : 'sem'}`;
export function recordBest(best, g) {
  if (g.free || !g.over) return { best, record: false };
  const k = bestKey(g); const prev = best[k]; const record = prev == null || g.elapsed < prev;
  return { best: record ? { ...best, [k]: g.elapsed } : best, record };
}
export function validGame(g) {
  try {
    if (!g || g.v !== 1 || !DIFFS[g.diff] || g.placed.length !== g.diff || !g.tray.every((p) => Number.isInteger(p) && p >= 0 && p < g.diff)) return false;
    const inTray = new Set(g.tray); if (inTray.size !== g.tray.length) return false;
    return g.placed.every((p, i) => p !== inTray.has(i)) && g.elapsed >= 0; // cada peça: ou fixa, ou na bandeja
  } catch { return false; }
}
export const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
