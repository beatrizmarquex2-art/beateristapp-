// Raio-x do groove (fase M4): curva de andamento (correu/arrastou), mapa de calor por subdivisão e a "impressão digital
// rítmica" (arte gerada do jeito de tocar). Contas puras, testadas em tests/xray.test.mjs.
import { tempoOf } from './pitch.js';

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
/** Reta que melhor passa pelos pontos (mínimos quadrados): devolve inclinação e intercepto. */
export function trend(xs, ys) {
  const n = xs.length; if (n < 2) return { slope: 0, icpt: ys[0] || 0 };
  const mx = mean(xs), my = mean(ys); let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0; return { slope, icpt: my - slope * mx };
}

/** Modo livre (tocando junto de uma música): BPM em janelas que andam pela gravação. */
export function tempoCurve(onsets, { win = 6, hop = 1.5 } = {}) {
  if (onsets.length < 6) return { points: [], slopePerMin: 0, start: null, end: null };
  const t0 = onsets[0], t1 = onsets[onsets.length - 1]; const pts = [];
  for (let a = t0; a + win <= t1 + 0.01; a += hop) {
    const w = onsets.filter((t) => t >= a && t < a + win); const r = tempoOf(w);
    if (r && r.confidence >= 50) pts.push({ t: a + win / 2 - t0, bpm: r.exact });
  }
  // dobra/divide pontos que pularam de oitava (o detector às vezes acha o dobro)
  if (pts.length) { const ref = pts[0].bpm; pts.forEach((p) => { while (p.bpm > ref * 1.45) p.bpm /= 2; while (p.bpm < ref / 1.45) p.bpm *= 2; }); }
  const tr = trend(pts.map((p) => p.t), pts.map((p) => p.bpm));
  return { points: pts, slopePerMin: tr.slope * 60, start: pts.length ? tr.icpt + tr.slope * pts[0].t : null, end: pts.length ? tr.icpt + tr.slope * pts[pts.length - 1].t : null };
}

/** Modo metrônomo: desvio médio por compasso (ms) e a tendência (ms por compasso: + = arrastando, − = correndo). */
export function barDrift(devs, perBar) {
  const bars = [];
  for (let b = 0; b * perBar < devs.length; b++) { const d = devs.slice(b * perBar, (b + 1) * perBar).filter((x) => x != null); bars.push(d.length ? mean(d) : null); }
  const xs = [], ys = []; bars.forEach((v, i) => { if (v != null) { xs.push(i); ys.push(v); } });
  const tr = trend(xs, ys);
  return { bars, slope: tr.slope, icpt: tr.icpt };
}
export function driftText(slopeMsPerBar, bars) {
  const total = Math.round(slopeMsPerBar * Math.max(bars - 1, 1));
  if (Math.abs(total) < 8) return { kind: 'firme', text: 'andamento firme do começo ao fim' };
  return total < 0 ? { kind: 'correu', text: `correu: no fim, chegava ${-total} ms antes do clique` } : { kind: 'arrastou', text: `arrastou: no fim, chegava ${total} ms depois do clique` };
}
/** Veredito do modo livre pela mudança real do começo ao fim (não extrapola um trecho curto pra "por minuto"). */
export function bpmDriftText(slopePerMin, durSec = 60) {
  const delta = Math.round((slopePerMin / 60) * durSec * 10) / 10;
  if (Math.abs(delta) < 2) return { kind: 'firme', text: `andamento firme (mudou ${Math.abs(delta)} BPM do começo ao fim)` };
  return delta > 0 ? { kind: 'correu', text: `correu: subiu ${delta} BPM do começo ao fim` } : { kind: 'arrastou', text: `arrastou: caiu ${-delta} BPM do começo ao fim` };
}

/** Mapa de calor: linhas = grupos de compassos, colunas = posições do compasso (1 e & a…). Valor = desvio médio (ms). */
export function heatmap(devs, perBar, maxRows = 8) {
  const nBars = Math.ceil(devs.length / perBar); const group = Math.max(1, Math.ceil(nBars / maxRows));
  const rows = [];
  for (let r = 0; r * group < nBars; r++) {
    const cells = [];
    for (let k = 0; k < perBar; k++) {
      const vals = []; let total = 0;
      for (let b = r * group; b < Math.min(nBars, (r + 1) * group); b++) { const v = devs[b * perBar + k]; total++; if (v != null) vals.push(v); }
      cells.push({ dev: vals.length ? Math.round(mean(vals)) : null, hit: total ? vals.length / total : 0 });
    }
    rows.push({ from: r * group + 1, to: Math.min(nBars, (r + 1) * group), cells });
  }
  return rows;
}

/** Cor do desvio: verde no tempo, azul adiantado, vermelho atrasado (com texto junto: não depende só de cor). */
export function devColor(ms) {
  if (ms == null) return '#d8d2c6';
  const a = Math.min(1, Math.abs(ms) / 40);
  if (Math.abs(ms) <= 6) return '#1f9d4a';
  const mix = (c1, c2) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(c1.slice(i + 1, i + 3), 16) * (1 - a) + parseInt(c2.slice(i + 1, i + 3), 16) * a).toString(16).padStart(2, '0')).join('');
  return ms < 0 ? mix('#9ec1f0', '#1f4fbf') : mix('#f2b0b6', '#b5162b');
}

/**
 * Impressão digital rítmica: cada nota vira um ponto num círculo (ângulo = lugar no compasso, anel = qual compasso);
 * o desvio empurra o ponto pra fora (atrasou) ou pra dentro (adiantou). Devolve primitivas (desenhadas em SVG e em canvas).
 */
export function fingerprint(devs, perBar, { size = 360, seed = 0 } = {}) {
  const c = size / 2; const nBars = Math.max(1, Math.ceil(devs.length / perBar));
  const r0 = size * 0.12, r1 = size * 0.44; const ring = (r1 - r0) / nBars;
  const rot = ((seed % 360) * Math.PI) / 180;
  const pts = devs.map((d, i) => {
    const b = Math.floor(i / perBar), k = i % perBar;
    const ang = rot - Math.PI / 2 + (2 * Math.PI * k) / perBar;
    const push = d == null ? 0 : Math.max(-1, Math.min(1, d / 40)) * ring * 0.9;
    const r = r0 + ring * (b + 0.5) + push;
    return { x: c + r * Math.cos(ang), y: c + r * Math.sin(ang), d, miss: d == null, r: d == null ? 1.6 : 2.2 + 3.2 * (1 - Math.min(1, Math.abs(d) / 30)), color: devColor(d) };
  });
  const rings = Array.from({ length: nBars + 1 }, (_, i) => r0 + ring * i);
  const spokes = Array.from({ length: perBar }, (_, k) => { const ang = rot - Math.PI / 2 + (2 * Math.PI * k) / perBar; return { x1: c + r0 * Math.cos(ang), y1: c + r0 * Math.sin(ang), x2: c + r1 * Math.cos(ang), y2: c + r1 * Math.sin(ang), beat: k % (perBar / 4) === 0 }; });
  return { size, c, pts, rings, spokes, path: pts.filter((p) => !p.miss) };
}
export function seedOf(devs) { let h = 2166136261; devs.forEach((d) => { h ^= (d == null ? 999 : d + 500); h = Math.imul(h, 16777619); }); return h >>> 0; }
