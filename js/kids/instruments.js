// Instrumentos do jogo da memória: desenho (SVG nosso) e som (sintetizado aqui, sem amostras) de cada um.
import { audio, out, kick, snare, hihat, cymbal, tom } from '../audio.js';
import { bass, epiano, guitar, voice } from '../synth.js';
import { instrumentIcon } from './icons.js';

const S = '#1b1818';
const stand = (x, y, h) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${S}" stroke-width="3"/>`;
const wrap = (inner, label) => `<svg viewBox="0 0 100 100" role="img" aria-label="${label}">${inner}</svg>`;

export const INSTRUMENTS = [
  { id: 'bumbo', name: 'bumbo', color: '#b5162b', art: null, play: (t) => kick(t) },
  { id: 'caixa', name: 'caixa', color: '#e3a82f', art: null, play: (t) => snare(t, 0.9) },
  { id: 'chimbal', name: 'chimbal', color: '#d9b54a', art: null, play: (t) => hihat(t, 0.9) },
  { id: 'prato', name: 'prato', color: '#f1c85a', art: null, play: (t) => cymbal(t) },
  { id: 'tom', name: 'tom', color: '#2c6fb5', art: null, play: (t) => tom(t, 200) },
  { id: 'guitarra', name: 'guitarra', color: '#7a2a8a', art: null, play: (t) => guitar(t, [57, 64], 0.9) },
  { id: 'baixo', name: 'baixo', color: '#1f6f5c', art: null, play: (t) => bass(t, 40, 0.5) },
  { id: 'teclado', name: 'teclado', color: '#fffdf8', art: null, play: (t) => epiano(t, [60, 64, 67], 0.7) },
  { id: 'voz', name: 'voz', color: '#d92031', art: null, play: (t) => voice(t, 64, 0.6) },
  { id: 'cordas', name: 'violino', color: '#a8502a', art: null, play: (t) => strings(t, 69) },
];
for (const x of INSTRUMENTS) x.art = instrumentIcon(x.id);
/** O desenho com cores escolhidas (o PDF usa cores escuras). */
export const artColored = (id, a, b) => instrumentIcon(id, a, b);
export const byId = Object.fromEntries(INSTRUMENTS.map((x) => [x.id, x]));
export const nameOf = (id) => (byId[id] || {}).name || id;

/** Cordas: duas serras desafinadas com ataque lento (som de violino/pad). */
function strings(t, midi, len = 0.9) {
  const c = audio(); const f = 440 * 2 ** ((midi - 69) / 12); const g = c.createGain(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(4200, f * 5);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  for (const d of [-8, 8]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(t); o.stop(t + len + 0.05); }
  lp.connect(g).connect(out());
}
export const playInstrument = (id) => { const c = audio(); const x = byId[id]; if (x) x.play(c.currentTime + 0.01); };
