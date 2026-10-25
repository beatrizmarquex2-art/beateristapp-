// Juiz de tempo e transcritor de ritmo: contas puras (sem tela, sem microfone), testadas em tests/timing.test.mjs.
import { fft } from './pitch.js';

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const SUBS = { 1: 'semínimas', 2: 'colcheias', 4: 'semicolcheias', 3: 'tercinas' };
export const POS_LABELS = { 1: ['1'], 2: ['1', 'e'], 3: ['1', 'e', 'a'], 4: ['1', 'e', '&', 'a'] };

/** Grade do exercício: instantes (s) de cada nota esperada a partir de `start`. */
export function grid(start, bpm, bars, sub) {
  const step = 60 / bpm / sub; const n = bars * 4 * sub;
  return Array.from({ length: n }, (_, i) => ({ t: start + i * step, pos: i % sub }));
}

/**
 * Compara os ataques com a grade. `latency` (s) = atraso medido do aparelho (calibração).
 * Cada ataque vai para a nota mais perto; longe demais (mais de 40% do passo) não conta.
 * Devolve desvios em ms (negativo = adiantou, positivo = atrasou), estatísticas e nota de 0 a 100.
 */
export function judge(onsets, slots, { latency = 0, step } = {}) {
  const win = (step || (slots[1] ? slots[1].t - slots[0].t : 0.5)) * 0.4;
  const used = new Map();
  for (const o of onsets) {
    const t = o - latency;
    let best = -1, bd = Infinity;
    for (let i = 0; i < slots.length; i++) { const d = Math.abs(t - slots[i].t); if (d < bd) { bd = d; best = i; } }
    if (best < 0 || bd > win) continue;
    const dev = (t - slots[best].t) * 1000;
    if (!used.has(best) || Math.abs(dev) < Math.abs(used.get(best))) used.set(best, dev); // dois ataques na mesma nota: fica o mais perto
  }
  const hits = slots.map((s, i) => ({ i, pos: s.pos, dev: used.has(i) ? used.get(i) : null }));
  const devs = hits.filter((x) => x.dev != null).map((x) => x.dev);
  const avg = mean(devs); const sd = Math.sqrt(mean(devs.map((d) => (d - avg) ** 2)));
  const absAvg = mean(devs.map(Math.abs));
  const missed = slots.length - devs.length;
  const byPos = {};
  for (const x of hits) if (x.dev != null) (byPos[x.pos] = byPos[x.pos] || []).push(x.dev);
  const perPos = Object.fromEntries(Object.entries(byPos).map(([p, a]) => [p, Math.round(mean(a))]));
  return { hits, mean: Math.round(avg), sd: Math.round(sd), absMean: Math.round(absAvg), missed, total: slots.length, perPos, score: score(absAvg, sd, missed / Math.max(slots.length, 1)) };
}

/**
 * Nota de 0 a 100. 0 ms de erro médio = 100; cada ms de erro médio tira 1,4; a irregularidade (desvio padrão) tira 0,6 por ms;
 * nota que faltou tira proporcionalmente (faltar metade = −50).
 */
export function score(absMean, sd, missRate) {
  return Math.max(0, Math.min(100, Math.round(100 - absMean * 1.4 - sd * 0.6 - missRate * 100)));
}

/** Calibração: atraso do aparelho = mediana de (ataque ouvido − clique agendado), ignorando valores absurdos. */
export function calibrate(onsets, clicks, { maxMs = 400 } = {}) {
  const diffs = [];
  for (const c of clicks) {
    let best = null;
    for (const o of onsets) { const d = o - c; if (d > -0.15 && d < maxMs / 1000 && (best == null || Math.abs(d) < Math.abs(best))) best = d; }
    if (best != null) diffs.push(best);
  }
  if (diffs.length < Math.max(4, Math.ceil(clicks.length * 0.6))) return null;
  const m = median(diffs);
  const spread = Math.sqrt(mean(diffs.map((d) => (d - m) ** 2)));
  return { latency: m, ms: Math.round(m * 1000), spreadMs: Math.round(spread * 1000), n: diffs.length, ok: spread < 0.025 };
}

/** Transcritor: põe cada ataque no passo mais perto da grade de 1 compasso. Fora do compasso não entra. */
export function quantize(notes, { start, bpm, steps, latency = 0 }) {
  const stepSec = 60 / bpm / (steps / 4);
  const out = [];
  for (const n of notes) {
    const k = Math.round((n.t - latency - start) / stepSec);
    if (k < 0 || k >= steps) continue;
    out.push({ ...n, step: k, offMs: Math.round(((n.t - latency - start) - k * stepSec) * 1000) });
  }
  return out;
}

/**
 * Adivinha a peça pelo timbre do ataque: energia em graves (bumbo), médios (caixa) e agudos (prato/chimbal).
 * Se nenhuma faixa domina, devolve '?' — a pessoa decide (não fingir certeza).
 */
export function classify(buf, sampleRate) {
  const N = 2048; const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N && i < buf.length; i++) re[i] = buf[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
  fft(re, im);
  const band = (lo, hi) => { let s = 0; const a = Math.max(1, Math.floor((lo * N) / sampleRate)), b = Math.min(N / 2, Math.ceil((hi * N) / sampleRate)); for (let k = a; k < b; k++) s += re[k] * re[k] + im[k] * im[k]; return s; };
  const low = band(30, 150), mid = band(150, 2500), high = band(4000, 14000);
  const total = low + mid + high || 1;
  const share = { bd: low / total, sn: mid / total, hh: high / total };
  const [piece, conf] = Object.entries(share).sort((a, b) => b[1] - a[1])[0];
  return { piece: conf >= 0.55 ? piece : '?', guess: piece, confidence: Math.round(conf * 100), share };
}

/** Junta as notas quantizadas numa grade do Beat Lab (peças com '?' ficam de fora até a pessoa decidir). */
export function toRows(qnotes, steps) {
  const rows = { hh: Array(steps).fill(0), sn: Array(steps).fill(0), bd: Array(steps).fill(0) };
  for (const n of qnotes) if (rows[n.piece]) rows[n.piece][n.step] = 1;
  return rows;
}

export const stats = { mean, median };
