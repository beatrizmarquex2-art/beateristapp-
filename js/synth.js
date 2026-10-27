// Sons extras do groovebox (sintetizados aqui, sem amostras de ninguém): palma, aro, shaker, cowbell, estalo,
// baixo, piano elétrico, guitarra e voz "ah". Bateria básica vem do audio.js.
import { audio, out, noise, kick, snare, hihat, cymbal, tom } from './audio.js';
import { midiHz } from './tools-logic.js';

const env = (g, t, peak, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
function burst(t, { type = 'bandpass', f = 1200, q = 1, peak = 0.5, len = 0.05, at = 0 }) {
  const c = audio(); const n = c.createBufferSource(); n.buffer = noise(); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain(); env(g, t + at, peak, 0.002, len); n.connect(fl).connect(g).connect(out()); n.start(t + at, Math.random() * 0.1); n.stop(t + at + len + 0.05);
}
export const clap = (t, v = 1) => { burst(t, { f: 1300, q: 1.2, peak: 0.5 * v, len: 0.012 }); burst(t, { f: 1300, q: 1.2, peak: 0.5 * v, len: 0.012, at: 0.012 }); burst(t, { f: 1200, q: 0.9, peak: 0.6 * v, len: 0.12, at: 0.024 }); };
export const rim = (t, v = 1) => { const c = audio(); const o = c.createOscillator(); const g = c.createGain(); o.type = 'triangle'; o.frequency.value = 1750; env(g, t, 0.35 * v, 0.001, 0.03); o.connect(g).connect(out()); o.start(t); o.stop(t + 0.06); burst(t, { f: 3000, q: 2, peak: 0.25 * v, len: 0.02 }); };
export const shaker = (t, v = 1) => burst(t, { type: 'highpass', f: 6000, peak: 0.22 * v, len: 0.05 });
export const snap = (t, v = 1) => burst(t, { f: 2600, q: 3, peak: 0.6 * v, len: 0.03 });
export function cowbell(t, v = 1) {
  const c = audio(); const g = c.createGain(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 2; env(g, t, 0.3 * v, 0.002, 0.25);
  for (const f of [540, 800]) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(bp); o.start(t); o.stop(t + 0.3); }
  bp.connect(g).connect(out());
}
export function bass(t, midi, len = 0.22, v = 1) {
  const c = audio(); const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(midi);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(200, t + len); lp.Q.value = 4;
  const g = c.createGain(); env(g, t, 0.45 * v, 0.005, len); o.connect(lp).connect(g).connect(out()); o.start(t); o.stop(t + len + 0.05);
}
export function epiano(t, notes, len = 0.5, v = 1) {
  const c = audio();
  for (const m of notes) {
    const o = c.createOscillator(); const mod = c.createOscillator(); const mg = c.createGain(); const g = c.createGain();
    o.type = 'sine'; o.frequency.value = midiHz(m); mod.frequency.value = midiHz(m) * 2; mg.gain.setValueAtTime(midiHz(m) * 1.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.3);
    mod.connect(mg).connect(o.frequency); env(g, t, (0.22 / Math.sqrt(notes.length)) * v, 0.004, len);
    o.connect(g).connect(out()); o.start(t); mod.start(t); o.stop(t + len + 0.05); mod.stop(t + len + 0.05);
  }
}
let curve = null;
export function guitar(t, notes, len = 0.3, v = 1) {
  const c = audio();
  if (!curve) { curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = (i / 512) - 1; curve[i] = Math.tanh(x * 4); } }
  const ws = c.createWaveShaper(); ws.curve = curve; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  const g = c.createGain(); env(g, t, 0.14 * v, 0.004, len); ws.connect(lp).connect(g).connect(out());
  notes.forEach((m, k) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(m - 12); o.connect(ws); o.start(t + k * 0.008); o.stop(t + len + 0.05); });
}
export function voice(t, midi, len = 0.4, v = 1) {
  const c = audio(); const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(midi);
  const vib = c.createOscillator(); const vg = c.createGain(); vib.frequency.value = 5.5; vg.gain.value = 3; vib.connect(vg).connect(o.frequency);
  const g = c.createGain(); env(g, t, 0.2 * v, 0.06, len);
  for (const [f, q, a] of [[730, 8, 1], [1090, 10, 0.5], [2440, 12, 0.25]]) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const ga = c.createGain(); ga.gain.value = a; o.connect(bp).connect(ga).connect(g); }
  g.connect(out()); o.start(t); vib.start(t); o.stop(t + len + 0.1); vib.stop(t + len + 0.1);
}

/** Os 16 pads: id, nome, cor (família) e como toca. `ch` = acorde atual ({ root, notes }). */
export const PADS = [
  ['bd', 'Bumbo', 'red', (t) => kick(t)], ['sn', 'Caixa', 'red', (t) => snare(t, 0.9)], ['cp', 'Palma', 'red', (t) => clap(t)], ['rim', 'Aro', 'red', (t) => rim(t)],
  ['hh', 'Chimbal', 'gold', (t) => hihat(t, 0.9)], ['ho', 'Chimbal aberto', 'gold', (t) => hihat(t, 0.9, true)], ['sh', 'Shaker', 'gold', (t) => shaker(t)], ['cr', 'Prato', 'gold', (t) => cymbal(t)],
  ['tt', 'Tom agudo', 'teal', (t) => tom(t, 210)], ['ft', 'Tom grave', 'teal', (t) => tom(t, 110)], ['cb', 'Cowbell', 'teal', (t) => cowbell(t)], ['sp', 'Estalo', 'teal', (t) => snap(t)],
  ['bs', 'Baixo', 'ink', (t, ch) => bass(t, ch.root)], ['ep', 'Piano elétrico', 'ink', (t, ch) => epiano(t, ch.notes)], ['gt', 'Guitarra', 'ink', (t, ch) => guitar(t, ch.notes)], ['vx', 'Voz “ah”', 'ink', (t, ch) => voice(t, ch.notes[ch.notes.length - 1])],
];
