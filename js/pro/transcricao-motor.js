// Do áudio pra partitura: ouve (analisa) um trecho e devolve SUGESTÕES de notas pra professora conferir e corrigir no editor.
// Sem internet e sem serviço de IA: só processamento de sinal (FFT, fluxo espectral, YIN, cromagrama). Funciona bem em
// bateria sozinha, melodia limpa de uma voz/instrumento e acordes simples; em música completa mixada erra bastante — por isso é sugestão.
import { fft, detectPitch, rms } from '../pitch.js';
import { ACORDES } from '../acordes.js';
import * as R from './ritmo.js';
import * as T from './teoria.js';

export const MAX_SEG = 90; // segundos analisados por vez (celular não trava)
const SR_ALVO = 11025;

/** Mistura em mono e baixa a taxa (média de blocos) pra ~11 kHz: bem mais rápido e basta pra notas e pra bateria. */
export function mono(canais, sr) {
  const n = canais[0].length; const f = Math.max(1, Math.round(sr / SR_ALVO)); const m = Math.floor(n / f); const out = new Float32Array(m);
  for (let i = 0; i < m; i++) { let s = 0; for (let k = 0; k < f; k++) { for (let c = 0; c < canais.length; c++) s += canais[c][i * f + k]; } out[i] = s / (f * canais.length); }
  return { x: out, sr: sr / f };
}
export const recorte = (x, sr, ini, dur) => x.slice(Math.max(0, Math.round(ini * sr)), Math.min(x.length, Math.round((ini + Math.min(dur, MAX_SEG)) * sr)));

const dorme = () => new Promise((r) => setTimeout(r, 0));
/** Espectrograma de magnitude: quadros de `n` amostras a cada `hop`. Devolve { mag: Float32Array[], hz(bin), hop }. */
export async function espectro(x, sr, { n = 1024, hop = 256, progresso } = {}) {
  const jan = new Float32Array(n); for (let i = 0; i < n; i++) jan[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  const q = Math.max(0, Math.floor((x.length - n) / hop) + 1); const mag = []; const re = new Float32Array(n); const im = new Float32Array(n);
  for (let k = 0; k < q; k++) {
    for (let i = 0; i < n; i++) { re[i] = x[k * hop + i] * jan[i]; im[i] = 0; }
    fft(re, im); const m = new Float32Array(n / 2); for (let i = 0; i < n / 2; i++) m[i] = Math.hypot(re[i], im[i]); mag.push(m);
    if (progresso && k % 200 === 0) { progresso(k / q); await dorme(); }
  }
  return { mag, hop, dt: hop / sr, binHz: sr / n, n };
}

const BANDAS = { bd: [35, 130], sn: [180, 420], hh: [5000, 5400] };
/** Energia por quadro numa faixa de frequências. */
const banda = (S, lo, hi) => { const a = Math.max(1, Math.floor(lo / S.binHz)); const b = Math.min(S.n / 2 - 1, Math.ceil(hi / S.binHz)); return S.mag.map((m) => { let s = 0; for (let i = a; i <= b; i++) s += m[i]; return s / (b - a + 1); }); };
/** Fluxo espectral: só o que SOBE (ataque), em escala log pra não depender do volume. */
const fluxo = (e) => { const l = e.map((v) => Math.sqrt(v)); const f = new Float32Array(l.length); for (let i = 1; i < l.length; i++) f[i] = Math.max(0, l[i] - l[i - 1]); return f; };
/** Picos acima de um limiar que se adapta ao entorno. Devolve [{ i, forca }]. */
export function picos(f, { rel = 1.6, minDist = 4, piso = 0.04 } = {}) {
  const out = []; const j = 12;
  for (let i = 1; i < f.length - 1; i++) {
    if (f[i] < f[i - 1] || f[i] < f[i + 1] || f[i] < piso) continue;
    let s = 0, c = 0; for (let k = Math.max(0, i - j); k < Math.min(f.length, i + j); k++) { s += f[k]; c++; }
    if (f[i] < (s / c) * rel) continue;
    if (out.length && i - out[out.length - 1].i < minDist) { if (f[i] > out[out.length - 1].forca) out[out.length - 1] = { i, forca: f[i] }; continue; }
    out.push({ i, forca: f[i] });
  }
  return out;
}

/** Andamento (bpm) pela autocorrelação do fluxo total. Prefere 70–160. Devolve { bpm, conf }. */
export function andamento(f, dt) {
  const n = f.length; const lagMin = Math.round(60 / 200 / dt); const lagMax = Math.min(n - 1, Math.round(60 / 55 / dt)); if (lagMax <= lagMin + 2) return { bpm: 100, conf: 0 };
  let med = 0; for (let i = 0; i < n; i++) med += f[i]; med /= n; const g = Float32Array.from(f, (v) => v - med);
  const ac = new Float32Array(lagMax + 2); let e0 = 0; for (let i = 0; i < n; i++) e0 += g[i] * g[i];
  for (let lag = lagMin; lag <= lagMax; lag++) { let s = 0; for (let i = 0; i + lag < n; i++) s += g[i] * g[i + lag]; ac[lag] = s / (e0 || 1); }
  let melhor = lagMin, v = -1;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    const bpm = 60 / (lag * dt); const peso = bpm >= 70 && bpm <= 160 ? 1 : 0.8; // um pouco de preferência por andamentos comuns
    const sc = (ac[lag] + 0.5 * (ac[lag * 2] || 0)) * peso; if (sc > v) { v = sc; melhor = lag; }
  }
  let bpm = 60 / (melhor * dt); while (bpm > 170) bpm /= 2; while (bpm < 60) bpm *= 2;
  return { bpm: Math.round(bpm), conf: Math.max(0, Math.min(1, v)) };
}

/** Acha o deslocamento da grade (em segundos) onde os ataques mais "encaixam" nas semicolcheias. */
export function fase(tempos, passo, pesos) {
  let melhor = 0, v = Infinity; const N = 24;
  for (let k = 0; k < N; k++) { const off = (k / N) * passo; let s = 0; tempos.forEach((t, i) => { const r = ((t - off) / passo); const d = Math.abs(r - Math.round(r)); s += d * d * (pesos ? pesos[i] : 1); }); if (s < v) { v = s; melhor = off; } }
  return melhor;
}

const FORMAS_D = [1, 2, 3, 4, 6, 8, 12, 16];
export const duracaoValida = (d) => FORMAS_D.reduce((m, x) => (Math.abs(x - d) < Math.abs(m - d) ? x : m), 1);

/** BATERIA: bumbo, caixa e chimbal. Devolve { evs, bpm, avisos }. `bpm` pode vir da professora (senão detecta). */
export async function bateria(x, sr, { bpm = 0, progresso } = {}) {
  const S = await espectro(x, sr, { n: 1024, hop: 256, progresso }); if (S.mag.length < 20) return { evs: [], bpm: bpm || 100, avisos: ['trecho curto demais'] };
  const fb = fluxo(banda(S, ...BANDAS.bd)); const fs = fluxo(banda(S, ...BANDAS.sn)); const fh = fluxo(banda(S, 3500, Math.min(sr / 2 - 100, 5400)));
  // ataques achados no fluxo de todas as faixas (cada uma medida contra o próprio pico); depois cada ataque é CLASSIFICADO pela energia por faixa:
  // bumbo = quase só grave; caixa = médio (tom + ruído); chimbal = agudo. (Chimbal é ruído e acenderia todas as faixas se cada faixa decidisse sozinha.)
  const p95 = (f) => { const o = Float32Array.from(f).sort(); return o[Math.floor(o.length * 0.95)] || 1e-6; }; const nb = p95(fb), ns = p95(fs), nh = p95(fh);
  const total = Float32Array.from(fb, (v, i) => v / nb + fs[i] / ns + fh[i] / nh);
  const and = bpm ? { bpm, conf: 1 } : andamento(total, S.dt); const passo = 60 / and.bpm / 4;
  const pks = picos(total, { rel: 1.7, minDist: 3, piso: 0.5 });
  const E = (f, lo, hi, i) => { const a = Math.max(1, Math.floor(lo / S.binHz)); const b2 = Math.min(S.n / 2 - 1, Math.ceil(hi / S.binHz)); let v = 0; for (let q = Math.max(0, i - 1); q <= Math.min(f.length - 1, i + 3); q++) { let s2 = 0; for (let k = a; k <= b2; k++) s2 += f[q][k]; v = Math.max(v, s2 / (b2 - a + 1)); } return v; };
  const med = pks.map((k) => ({ k, l: E(S.mag, ...BANDAS.bd, k.i), m: E(S.mag, ...BANDAS.sn, k.i), h: E(S.mag, 3500, Math.min(sr / 2 - 100, 5400), k.i) }));
  const mx = { l: Math.max(1e-9, ...med.map((v) => v.l)), m: Math.max(1e-9, ...med.map((v) => v.m)), h: Math.max(1e-9, ...med.map((v) => v.h)) };
  const todos = [];
  for (const v of med) {
    const t = v.k.i * S.dt, forca = v.k.forca, nl = v.l / mx.l, nm = v.m / mx.m, nhh = v.h / mx.h;
    const bumbo = nl >= 0.3 && v.l >= 2.5 * v.m; const caixa = !bumbo && nm >= 0.3 && v.m >= v.l;
    if (bumbo) todos.push({ p: 'bd', t, forca }); if (caixa) todos.push({ p: 'sn', t, forca });
    if (nhh >= 0.12 && (nhh >= 0.5 || (!bumbo && !caixa))) todos.push({ p: 'hh', t, forca: forca * 0.5 });
  }
  if (!todos.length) return { evs: [], bpm: and.bpm, avisos: ['não achei batidas — o áudio tem bateria clara?'] };
  const off = fase(todos.map((a) => a.t), passo, todos.map((a) => (a.p === 'hh' ? 0.4 : 1)));
  const grade = new Map();
  for (const a of todos) {
    const ini = Math.round((a.t - off) / passo); if (ini < 0) continue; const k = `${a.p}:${ini}`;
    if (!grade.has(k) || grade.get(k).forca < a.forca) grade.set(k, { p: a.p, ini, forca: a.forca });
  }
  // se bumbo e caixa caíram no mesmo tempo, fica o mais forte
  for (const [k, a] of [...grade]) { if (a.p !== 'sn') continue; const b = grade.get(`bd:${a.ini}`); if (b && b.forca > a.forca * 1.2) grade.delete(k); }
  let evs = [...grade.values()].map((a) => ({ p: a.p, ini: a.ini, d: 1, mao: '', acc: false, fan: false }));
  // o 1º bumbo vira o "1" do compasso (se não tiver bumbo, o 1º ataque); compassos vazios do começo saem
  const primeiro = evs.filter((e) => e.p === 'bd').sort((a, b) => a.ini - b.ini)[0] || evs.slice().sort((a, b) => a.ini - b.ini)[0];
  const d0 = primeiro.ini % 16; evs = evs.map((e) => ({ ...e, ini: e.ini - d0 })).filter((e) => e.ini >= 0);
  const vazios = Math.floor(Math.min(...evs.map((e) => e.ini)) / 16) * 16; evs = evs.map((e) => ({ ...e, ini: e.ini - vazios })).sort((a, b) => a.ini - b.ini || (a.p < b.p ? -1 : 1));
  return { evs, bpm: and.bpm, avisos: and.conf < 0.12 && !bpm ? ['não tenho certeza do andamento — confira o bpm e ajuste'] : [] };
}

/** MELODIA (uma nota de cada vez): YIN quadro a quadro → notas MIDI → grade. */
export async function melodia(x, sr, { bpm = 0, min = 70, max = 1100, progresso } = {}) {
  const jan = 1024, hop = Math.round(sr * 0.02); const quadros = Math.max(0, Math.floor((x.length - jan) / hop) + 1); const midi = new Int16Array(quadros).fill(-1); let pico = 0;
  for (let k = 0; k < quadros; k++) { pico = Math.max(pico, rms(x.subarray(k * hop, k * hop + jan))); }
  for (let k = 0; k < quadros; k++) {
    const buf = x.subarray(k * hop, k * hop + jan); if (rms(buf) < pico * 0.12) continue;
    const r = detectPitch(buf, sr, { min, max, threshold: 0.12 }); if (r && r.clarity > 0.8) midi[k] = Math.round(69 + 12 * Math.log2(r.freq / 440));
    if (progresso && k % 150 === 0) { progresso(k / quadros); await dorme(); }
  }
  // mediana de 5 quadros tira soluços de oitava
  const liso = Int16Array.from(midi); for (let k = 2; k < quadros - 2; k++) { const j = [midi[k - 2], midi[k - 1], midi[k], midi[k + 1], midi[k + 2]].sort((a, b) => a - b); liso[k] = j[2]; }
  const seg = []; let a = 0; for (let k = 1; k <= quadros; k++) { if (k === quadros || liso[k] !== liso[a]) { if (liso[a] >= 0 && k - a >= 4) seg.push({ m: liso[a], t: (a * hop + jan / 2) / sr, dur: (k - a) * hop / sr }); a = k; } }
  if (!seg.length) return { evs: [], bpm: bpm || 100, avisos: ['não achei uma melodia clara (uma nota de cada vez). tente um trecho só com a voz ou o instrumento.'] };
  let bp = bpm; if (!bp) { const f = new Float32Array(Math.ceil((x.length / sr) / 0.01) + 2); seg.forEach((s) => { f[Math.round(s.t / 0.01)] = 1; }); bp = andamento(f, 0.01).bpm; }
  const passo = 60 / bp / 4; const off = fase(seg.map((s) => s.t), passo);
  let evs = []; let ultimo = -1;
  for (const s of seg) { let ini = Math.max(0, Math.round((s.t - off) / passo)); if (ini <= ultimo) ini = ultimo + 1; const d = duracaoValida(Math.max(1, s.dur / passo)); evs.push({ m: s.m, ini, d }); ultimo = ini; }
  evs = evs.map((e, i) => { const prox = evs[i + 1]; return prox && e.ini + e.d > prox.ini ? { ...e, d: duracaoValida(Math.max(1, prox.ini - e.ini)) } : e; }).map((e, i, l) => { const prox = l[i + 1]; return prox && e.ini + e.d > prox.ini ? { ...e, d: Math.max(1, prox.ini - e.ini) } : e; });
  const d0 = evs[0].ini % 16; evs = evs.map((e) => ({ ...e, ini: e.ini - d0 })); // a 1ª nota cai no tempo 1 (dá pra deslocar depois)
  const vazios = Math.floor(evs[0].ini / 16) * 16; evs = evs.map((e) => ({ ...e, ini: e.ini - vazios }));
  return { evs, bpm: bp, avisos: [] };
}

/** Melodia → violão/guitarra/baixo: cada nota vira corda + casa. */
export function melodiaEmCordas(evs, cordas) {
  const out = []; let fora = 0; const base = cordas.reduce((m, c) => Math.min(m, c[1]), 999);
  for (const e of evs) { let m = e.m; while (m < base) m += 12; const pos = R.posicaoDe(cordas, m, 12); if (!pos) { fora++; continue; } out.push({ c: pos.c, f: pos.f, ini: e.ini, d: e.d }); }
  return { evs: out, fora };
}

const triadeModelos = ACORDES.map((a) => { const v = new Float32Array(12); v[a.pc] = 1; v[(a.pc + (a.tipo === 'maior' ? 4 : 3)) % 12] = 0.85; v[(a.pc + 7) % 12] = 0.75; return { a, v }; });
/** ACORDES: cromagrama por trecho + comparação com os 24 acordes do violão. `porCompasso` = quantas batidas por acorde (4 = um por compasso). */
export async function acordes(x, sr, { bpm = 0, batidas = 4, progresso } = {}) {
  const S = await espectro(x, sr, { n: 4096, hop: 1024, progresso }); if (S.mag.length < 4) return { evs: [], bpm: bpm || 100, acordes: [], avisos: ['trecho curto demais'] };
  let bp = bpm; if (!bp) { const f = fluxo(banda(S, 80, 2000)); bp = andamento(f, S.dt).bpm; }
  const seg = (60 / bp) * batidas; const nSeg = Math.max(1, Math.round(S.mag.length * S.dt / seg)); const lista = []; const evs = [];
  const cromaDe = (q0, q1) => { const c = new Float32Array(12); for (let q = q0; q < q1; q++) { const m = S.mag[q]; for (let i = 1; i < S.n / 2; i++) { const f = i * S.binHz; if (f < 65 || f > 1800) continue; const midi = 69 + 12 * Math.log2(f / 440); const pc = ((Math.round(midi) % 12) + 12) % 12; const e = Math.round(midi) - midi; c[pc] += m[i] * m[i] * Math.exp(-(e * e) / 0.08); } } return c; };
  for (let k = 0; k < nSeg; k++) {
    const c = cromaDe(Math.floor(k * seg / S.dt), Math.min(S.mag.length, Math.floor((k + 1) * seg / S.dt))); const nrm = Math.hypot(...c); if (!nrm) { lista.push(null); continue; }
    let melhor = null, v = -1; for (const t of triadeModelos) { let s = 0; for (let i = 0; i < 12; i++) s += (c[i] / nrm) * t.v[i]; if (s > v) { v = s; melhor = t.a; } }
    lista.push(melhor); if (melhor) evs.push(...T.acordeEmEventos(melhor, k * batidas * 4, batidas * 4, 6, 'b'));
  }
  return { evs, bpm: bp, acordes: lista.map((a) => (a ? T.cifraDe(a) : '—')), avisos: ['só acordes maiores e menores (sem 7ª). se o acorde certo for outro, troque no editor.'] };
}
