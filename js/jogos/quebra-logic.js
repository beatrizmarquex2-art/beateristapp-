// Quebra-cabeça: regras puras. Peça i pertence à posição i (linha = ⌊i/cols⌋, coluna = i % cols).
export const DIFFS = { 6: { cols: 3, rows: 2 }, 12: { cols: 4, rows: 3 }, 24: { cols: 6, rows: 4 }, 48: { cols: 8, rows: 6 }, 70: { cols: 10, rows: 7 } };
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

/* ================= peças de encaixe (jigsaw) ================= */
/** Profundidade do "dente" de encaixe e margem extra do desenho da peça (em pixels da imagem). */
export const tabDepth = (cw, ch) => Math.min(cw, ch) * 0.22;
/** Sinais dos encaixes, sempre os mesmos pra mesma grade (os dois celulares do duelo veem as mesmas peças). h[r][c] (r≥1): fronteira entre a linha r-1 e r; v[r][c] (c≥1): entre a coluna c-1 e c. +1 = o dente sai da peça (r,c) pra cima/esquerda. */
export function jigsawEdges(cols, rows) {
  let a = (cols * 7919 + rows * 104729) >>> 0 || 1; const rnd = () => { a ^= a << 13; a >>>= 0; a ^= a >> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; };
  const sg = () => (rnd() < 0.5 ? -1 : 1);
  const h = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, () => (r > 0 ? sg() : 0)));
  const v = Array.from({ length: rows }, () => Array.from({ length: cols }, (_, c) => (c > 0 ? sg() : 0)));
  return { h, v };
}
function edge(px, py, qx, qy, s, D) {
  if (!s) return `L${qx.toFixed(1)} ${qy.toFixed(1)}`;
  const dx = qx - px; const dy = qy - py; const L = Math.hypot(dx, dy); const ux = dx / L; const uy = dy / L; const nx = uy; const ny = -ux;
  const P = (t, k) => `${(px + ux * t * L + nx * k * s * D).toFixed(1)} ${(py + uy * t * L + ny * k * s * D).toFixed(1)}`;
  return `L${P(0.37, 0)}C${P(0.42, 0)} ${P(0.40, 0.30)} ${P(0.34, 0.45)}C${P(0.28, 0.62)} ${P(0.30, 1)} ${P(0.5, 1)}C${P(0.70, 1)} ${P(0.72, 0.62)} ${P(0.66, 0.45)}C${P(0.60, 0.30)} ${P(0.58, 0)} ${P(0.63, 0)}L${qx.toFixed(1)} ${qy.toFixed(1)}`;
}
/** Contorno SVG da peça i (em coordenadas da imagem): 4 lados, cada um reto (borda do quadro), com dente ou com encaixe. */
export function piecePath(i, cols, rows, cw, ch, E) {
  const r = Math.floor(i / cols); const c = i % cols; const x0 = c * cw; const y0 = r * ch; const x1 = x0 + cw; const y1 = y0 + ch; const D = tabDepth(cw, ch);
  const top = r > 0 ? E.h[r][c] : 0; const right = c < cols - 1 ? -E.v[r][c + 1] : 0; const bottom = r < rows - 1 ? -E.h[r + 1][c] : 0; const left = c > 0 ? E.v[r][c] : 0;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}${edge(x0, y0, x1, y0, top, D)}${edge(x1, y0, x1, y1, right, D)}${edge(x1, y1, x0, y1, bottom, D)}${edge(x0, y1, x0, y0, left, D)}Z`;
}
