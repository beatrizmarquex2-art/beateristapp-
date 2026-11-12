// Sons da aba Tocar (sintetizados aqui, sem arquivos de áudio): bateria "de verdade" (cada toque varia um pouco, a posição do dedo
// muda a força, chimbal aberto fecha, prato retocado corta o anterior), violão/guitarra (corda calculada nota a nota) e xilofone.
// Também guarda a "batida de fundo" que toca por cima de qualquer instrumento.
import { audio, out } from './audio.js';
import { ROWS } from './beats.js';

let bus = null; let rev = null; let nbuf = null; let ctxOf = null;
/** Saída própria: compressor (vários dedos juntos não estouram) + um pouco de eco de sala. Recria se o AudioContext mudar. */
function init() {
  const c = audio();
  if (bus && ctxOf === c) return c;
  ctxOf = c;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
  bus = c.createGain(); bus.connect(comp).connect(out());
  const n = Math.floor(c.sampleRate * 1.3); const ir = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3.2; }
  rev = c.createConvolver(); rev.buffer = ir; const rg = c.createGain(); rg.gain.value = 0.5; rev.connect(rg).connect(comp);
  nbuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const nd = nbuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return c;
}
let C = null;
const route = (node, wet = 0) => { node.connect(bus); if (wet > 0) { const g = C.createGain(); g.gain.value = wet; node.connect(g).connect(rev); } };
const gn = (v = 1) => { const g = C.createGain(); g.gain.value = v; return g; };
const bq = (type, f, q = 1, gain = 0) => { const b = C.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = gain; return b; };
const env = (g, t, peak, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
const noiseSrc = (t, dur) => { const s = C.createBufferSource(); s.buffer = nbuf; s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.02); return s; };
const fade = (g, t, tc) => { try { if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(t); else g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, tc); } catch { /* já acabou */ } };
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

/* ---------- bateria ---------- */
function kick(t, v) {
  const o = C.createOscillator(); const g = C.createGain(); o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
  env(g, t, v, 0.002, 0.46); o.connect(g); route(g, 0.02); o.start(t); o.stop(t + 0.55);
  const o2 = C.createOscillator(); const g2 = C.createGain(); o2.type = 'triangle'; o2.frequency.value = 52; env(g2, t, 0.45 * v, 0.003, 0.3); o2.connect(g2); route(g2); o2.start(t); o2.stop(t + 0.4);
  const n = noiseSrc(t, 0.03); const g3 = gn(); n.connect(bq('bandpass', 3200, 0.9)).connect(g3); env(g3, t, 0.38 * v, 0.001, 0.014); route(g3);
}
function snare(t, v, rim) {
  const n = noiseSrc(t, 0.3); const g = gn(); n.connect(bq('highpass', 1400)).connect(g); env(g, t, 0.8 * v, 0.001, rim ? 0.13 : 0.21); route(g, 0.1);
  for (const [f, a] of [[188, 0.6], [335, 0.32]]) { const o = C.createOscillator(); const og = gn(); o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.12, t); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.08); env(og, t, a * v, 0.001, 0.11); o.connect(og); route(og); o.start(t); o.stop(t + 0.16); }
  if (rim) { const o = C.createOscillator(); const og = gn(); o.type = 'square'; o.frequency.value = 1850; env(og, t, 0.3 * v, 0.001, 0.025); o.connect(bq('bandpass', 1900, 3)).connect(og); route(og); o.start(t); o.stop(t + 0.06); }
}
function tom(t, f, v) {
  const o = C.createOscillator(); const g = C.createGain(); o.frequency.setValueAtTime(f * 1.75, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
  env(g, t, 0.95 * v, 0.002, f < 140 ? 0.6 : 0.42); o.connect(g); route(g, 0.1); o.start(t); o.stop(t + 0.7);
  const n = noiseSrc(t, 0.02); const ng = gn(); n.connect(bq('bandpass', 4200, 1)).connect(ng); env(ng, t, 0.22 * v, 0.001, 0.014); route(ng);
}
const HF = [205.3, 304.4, 369.6, 522.7, 540, 800];
function metal(t, v, { dur, hp, bpf, mul = 1, gain }) {
  const g = gn(); const bp = bq('bandpass', bpf, 0.6); const hpf = bq('highpass', hp);
  HF.forEach((f) => { const o = C.createOscillator(); o.type = 'square'; o.frequency.value = f * mul * (1 + (Math.random() - 0.5) * 0.012); o.connect(bp); o.start(t); o.stop(t + dur + 0.1); });
  bp.connect(hpf).connect(g); env(g, t, gain * v, 0.001, dur); route(g, 0.1); return g;
}
let openG = null; let crashG = null; let rideG = null;
const hatClosed = (t, v) => { if (openG) { fade(openG, t, 0.012); openG = null; } metal(t, v, { dur: 0.06, hp: 7000, bpf: 10000, gain: 0.2 }); };
const hatOpen = (t, v) => { if (openG) fade(openG, t, 0.01); openG = metal(t, v, { dur: 0.42, hp: 6500, bpf: 9500, gain: 0.19 }); };
function crash(t, v) {
  if (crashG) fade(crashG, t, 0.025);
  crashG = metal(t, v, { dur: 1.5, hp: 3500, bpf: 7000, mul: 1.25, gain: 0.26 });
  const n = noiseSrc(t, 1.2); const g = gn(); n.connect(bq('highpass', 5200)).connect(g); env(g, t, 0.28 * v, 0.002, 1.1); route(g, 0.15);
}
function ride(t, v, bell) {
  if (rideG) fade(rideG, t, 0.03);
  rideG = metal(t, v, { dur: bell ? 0.9 : 0.75, hp: 5200, bpf: 9000, mul: 1.1, gain: bell ? 0.12 : 0.15 });
  for (const f of bell ? [1180, 1790, 2650] : [2100]) { const o = C.createOscillator(); const g = gn(); o.type = 'triangle'; o.frequency.value = f; env(g, t, (bell ? 0.2 : 0.06) * v, 0.001, bell ? 0.7 : 0.18); o.connect(g); route(g, 0.12); o.start(t); o.stop(t + 0.9); }
}
const jit = (f) => f * (1 + (Math.random() - 0.5) * 0.02);
/** Cada peça: (quando, força 0–1.2, dr = distância do centro, 0 = no meio, 1 = na borda). Centro bate mais forte; borda da caixa = aro; centro da condução = sino. */
export const DRUM = {
  bd: (t, v = 1) => { C = init(); kick(t, v * (0.94 + Math.random() * 0.12)); },
  sn: (t, v = 1, dr = 0.3) => { C = init(); snare(t, v * (0.94 + Math.random() * 0.12), dr > 0.8); },
  tt: (t, v = 1) => { C = init(); tom(t, jit(205), v * (0.94 + Math.random() * 0.12)); },
  mt: (t, v = 1) => { C = init(); tom(t, jit(160), v * (0.94 + Math.random() * 0.12)); },
  ft: (t, v = 1) => { C = init(); tom(t, jit(112), v * (0.94 + Math.random() * 0.12)); },
  hh: (t, v = 1) => { C = init(); hatClosed(t, v); },
  ho: (t, v = 1) => { C = init(); hatOpen(t, v); },
  hf: (t, v = 1) => { C = init(); hatClosed(t, v * 0.6); },
  cr: (t, v = 1) => { C = init(); crash(t, v); },
  rd: (t, v = 1, dr = 0.5) => { C = init(); ride(t, v, dr < 0.28); },
};
/** Força pela posição do dedo: no centro 1, na borda ~0.72, com uma variaçãozinha. */
export const velAt = (dr) => (1 - 0.28 * Math.min(1, Math.max(0, dr))) * (0.94 + Math.random() * 0.12);

/* ---------- xilofone ---------- */
const MALLET = {
  xilofone: { p: [[1, 1, 0.55], [3, 0.3, 0.16], [6.2, 0.14, 0.07]], tick: 0.16 },
  metalofone: { p: [[1, 1, 1.5], [2.76, 0.45, 0.8], [5.4, 0.28, 0.45], [8.93, 0.12, 0.25]], tick: 0.05 },
  marimba: { p: [[1, 1, 0.75], [4, 0.35, 0.2], [9.9, 0.1, 0.09]], tick: 0.12 },
};
export function mallet(midi, vel = 0.9, kind = 'xilofone', t) {
  C = init(); if (C.state !== 'running') { C.resume().then(() => mallet(midi, vel, kind, undefined)).catch(() => {}); return; } // 1º toque no iPhone: espera o som destravar em vez de tocar no escuro
 t = t ?? C.currentTime; const m = MALLET[kind] || MALLET.xilofone; const f = hz(midi); const sc = 1.35 - ((midi - 60) / 60) * 0.55;
  const mix = gn(0.55 * vel); route(mix, 0.2);
  m.p.forEach(([r, a, d]) => { if (f * r > 12000) return; const o = C.createOscillator(); const g = gn(); o.frequency.value = f * r; env(g, t, a, 0.002, d * sc); o.connect(g).connect(mix); o.start(t); o.stop(t + d * sc + 0.1); });
  const n = noiseSrc(t, 0.03); const ng = gn(); n.connect(bq('bandpass', 3600, 1.2)).connect(ng); env(ng, t, m.tick * vel, 0.001, 0.014); route(ng);
}

/* ---------- violão e guitarra: corda de verdade (Karplus-Strong calculado em JS, uma vez por nota) ---------- */
const ks = new Map();
function ksBuf(midi, kind) {
  const key = kind + midi; if (ks.has(key)) return ks.get(key);
  const sr = C.sampleRate; const f = hz(midi); const dur = kind === 'a' ? 2.4 : 2.9; const N = (sr * dur) | 0; const buf = C.createBuffer(1, N, sr); const d = buf.getChannelData(0);
  const P = sr / f - 0.5; const L = Math.floor(P); const fr = P - L; const dec = kind === 'a' ? 0.9935 : 0.9975; const bright = kind === 'a' ? 0.5 : 0.75;
  let prev = 0; for (let i = 0; i < L + 3; i++) { prev += ((Math.random() * 2 - 1) - prev) * bright; d[i] = prev; }
  for (let i = L + 3; i < N; i++) { const a = (1 - fr) * d[i - L] + fr * d[i - L - 1]; const b = (1 - fr) * d[i - L - 1] + fr * d[i - L - 2]; d[i] = dec * 0.5 * (a + b); }
  let mx = 0; for (let i = 0; i < N; i++) { const a = Math.abs(d[i]); if (a > mx) mx = a; } const k = 0.85 / (mx || 1); for (let i = 0; i < N; i++) d[i] *= k;
  ks.set(key, buf); return buf;
}
let shaper = null;
/** Uma corda. `kind`: 'acoustic' (violão), 'clean' (guitarra limpa) ou 'rock' (distorcida). `mute` = abafada com a palma da mão. */
export function pluck(midi, vel, t, kind = 'acoustic', mute = false) {
  C = init(); if (C.state !== 'running') { const dt = Math.max(0, (t || 0) - C.currentTime); C.resume().then(() => pluck(midi, vel, C.currentTime + dt + 0.02, kind, mute)).catch(() => {}); return; } // 1º toque no iPhone: espera o som destravar
 const isA = kind === 'acoustic'; const buf = ksBuf(midi, isA ? 'a' : 'e'); const s = C.createBufferSource(); s.buffer = buf;
  const g = C.createGain(); let chain = s;
  if (isA) chain = chain.connect(bq('peaking', 110, 1, 5)).connect(bq('peaking', 240, 1, 3)).connect(bq('lowpass', 2200 + vel * 4200));
  else if (kind === 'rock') {
    if (!shaper || shaper.context !== C) { shaper = C.createWaveShaper(); const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) c[i] = Math.tanh(((i / 512) - 1) * 6); shaper.curve = c; shaper.oversample = '2x'; }
    chain = chain.connect(gn(2.4)).connect(shaper).connect(bq('lowpass', 3200)); // distorção + caixa de som
  } else chain = chain.connect(bq('lowpass', 4200 + vel * 2500));
  chain.connect(g); g.gain.setValueAtTime((kind === 'rock' ? 0.3 : 0.75) * vel, t);
  if (mute) g.gain.setTargetAtTime(0.0001, t + 0.015, 0.045); else g.gain.setTargetAtTime(0.0001, t + buf.duration - 0.35, 0.12);
  route(g, isA ? 0.2 : 0.14); s.start(t); s.stop(t + buf.duration);
}
/** Acordes abertos: uma nota (MIDI) por corda, da mais grave (de cima) pra mais aguda; null = corda abafada. */
export const CHORDS = [['C', [null, 48, 52, 55, 60, 64]], ['G', [43, 47, 50, 55, 59, 67]], ['Am', [null, 45, 52, 57, 60, 64]], ['F', [41, 48, 53, 57, 60, 65]],
  ['D', [null, null, 50, 57, 62, 66]], ['Em', [40, 47, 52, 55, 59, 64]], ['A', [null, 45, 52, 57, 61, 64]], ['E', [40, 47, 52, 56, 59, 64]]];
/** Calcula as cordas num intervalo livre pra o primeiro toque não engasgar. */
export function warmGuitar() {
  C = init(); const todo = [];
  for (const k of ['a', 'e']) for (const [, ms] of CHORDS) for (const m of ms) if (m != null && !ks.has(k + m)) todo.push([m, k]);
  const step = () => { for (let i = 0; i < 4 && todo.length; i++) { const [m, k] = todo.shift(); try { ksBuf(m, k); } catch { return; } } if (todo.length) setTimeout(step, 0); };
  setTimeout(step, 300);
}

/* ---------- batida de fundo ---------- */
export const STYLES = [['rock1', 'rock 1'], ['rock2', 'rock 2'], ['pop', 'pop'], ['samba', 'samba']];
const PAT = {
  rock1: { k: [0, 8, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
  rock2: { k: [0, 2, 8, 10], s: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14] },
  pop: { k: [0, 6, 8, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], o: [14] },
  samba: { k: [0, 8], su: [4, 12], r: [2, 6, 10, 14], h: [0, 2, 4, 6, 8, 10, 12, 14] },
};
const KEY = 'bt-backing';
const OLD = { rock: 'rock1', funk: 'rock2' }; // nomes antigos guardados no aparelho
const load = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o.style = OLD[o.style] || o.style; return { style: PAT[o.style] ? o.style : 'rock1', bpm: Math.max(60, Math.min(160, +o.bpm || 100)) }; } catch { return { style: 'rock1', bpm: 100 }; } };
export const backing = {
  on: false, step: 0, next: 0, timer: 0, ...load(),
  save() { try { localStorage.setItem(KEY, JSON.stringify({ style: this.style, bpm: this.bpm })); } catch { /* sem armazenamento */ } },
  tick() {
    const sp = 60 / this.bpm / 4;
    while (this.next < C.currentTime + 0.12) { this.play(this.step, this.next); this.next += sp; this.step = (this.step + 1) % 16; }
  },
  play(i, t) {
    const p = PAT[this.style]; const q = 0.5; const has = (a) => a && a.includes(i);
    if (has(p.k)) kick(t, 0.85 * q * 1.5); if (has(p.s)) snare(t, 0.8 * q * 1.4, false); if (has(p.g)) snare(t, 0.22 * q, false);
    if (has(p.su)) tom(t, 92, 0.9 * q * 1.4); if (has(p.r)) snare(t, 0.4 * q, true);
    if (has(p.rd)) ride(t, (i % 4 === 0 ? 0.9 : 0.55) * q, false);
    if (has(p.o)) hatOpen(t, 0.5 * q); else if (has(p.h)) hatClosed(t, (i % 4 === 0 ? 1 : 0.6) * q);
  },
  start() { if (this.on) return; C = init(); this.on = true; this.step = 0; this.next = C.currentTime + 0.08; this.tick(); this.timer = setInterval(() => this.tick(), 25); },
  stop() { if (!this.on) return; this.on = false; clearInterval(this.timer); },
  /** Chamado ao sair de uma das telas de instrumento: a batida segue se a próxima também for de instrumento, senão para. */
  leave() { setTimeout(() => { if (!/^#\/(toque|piano|violao|xilofone)(\/|$)/.test(location.hash)) this.stop(); }, 0); },
};

/** A batida escrita como ritmo de bateria (16 passos), pra desenhar a partitura: bumbo, caixa, chimbal, condução, surdo. */
export function grooveBeat(style) {
  const p = PAT[style] || PAT.rock1; const rows = Object.fromEntries(ROWS.map((r) => [r.id, Array(16).fill(0)]));
  const put = (id, a) => (a || []).forEach((i) => { rows[id][i] = 1; });
  put('bd', p.k); put('sn', p.s); put('sn', p.r); put('hh', p.h); put('rd', p.rd); put('ft', p.su);
  (p.o || []).forEach((i) => { rows.hh[i] = 0; rows.ho[i] = 1; });
  const par = Object.values(rows).every((r) => r.every((x, i) => !x || i % 2 === 0)); // só colcheias: escreve em 8 passos (senão apareceria como semicolcheia)
  const out = par ? Object.fromEntries(Object.entries(rows).map(([id, r]) => [id, r.filter((_, i) => i % 2 === 0)])) : rows;
  return { id: `fundo-${style}`, name: style, style: '', bpm: backing.bpm, steps: par ? 8 : 16, kind: 'groove', rows: out };
}
