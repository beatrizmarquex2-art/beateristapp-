// Modo taiko do Monte seu ritmo (regras puras): a esquerda toca o som AGUDO, a direita o GRAVE.
// Em cada tempo, a 1ª batida cai no grave (direita) e as de dentro do tempo (o "e", o "a") caem no agudo (esquerda).
export const LADO_AGUDO = 'agudo'; export const LADO_GRAVE = 'grave';
export const JANELA = 0.16; // s: folga pra acertar (generosa de propósito)
export const PERFEITO = 0.07; // s

/** Notas (instantes em s a partir do 1º tempo) de `ids` (4 tempos, via `cellOf`) repetido `bars` vezes. */
export function buildChart(cells, bpm, bars = 4) {
  const q = 60 / bpm; const out = [];
  for (let r = 0; r < bars; r++) cells.forEach((cell, b) => {
    let first = true;
    [...cell].forEach((x, k) => { if (x !== '1') return; out.push({ t: (r * cells.length + b) * q + (k * q) / 4, side: first ? LADO_GRAVE : LADO_AGUDO, res: null }); first = false; });
  });
  return out;
}

/** Confere um toque no lado `side` no instante `t`. Marca a nota mais próxima (dentro da janela) como 'perfeito', 'bom' ou 'lado' (lado trocado). */
export function judgeTap(chart, t, side, win = JANELA) {
  let best = -1; let bd = Infinity;
  chart.forEach((n, i) => { if (n.res) return; const d = Math.abs(t - n.t); if (d < bd) { bd = d; best = i; } });
  if (best < 0 || bd > win) return { kind: 'extra' };
  const n = chart[best]; const ms = Math.round((t - n.t) * 1000);
  n.res = n.side !== side ? 'lado' : bd <= PERFEITO ? 'perfeito' : 'bom';
  return { kind: n.res, i: best, ms };
}

/** Notas que já passaram da janela sem toque viram 'faltou'. Devolve quantas mudaram. */
export function sweep(chart, now, win = JANELA) { let c = 0; for (const n of chart) if (!n.res && now > n.t + win) { n.res = 'faltou'; c++; } return c; }

export function summary(chart) {
  const total = chart.length || 1; const c = (k) => chart.filter((n) => n.res === k).length;
  const hits = c('perfeito') + c('bom'); const pts = c('perfeito') + c('bom') * 0.75;
  return { total: chart.length, perfeito: c('perfeito'), bom: c('bom'), lado: c('lado'), faltou: c('faltou'), hits, acc: Math.round((pts / total) * 100) };
}
