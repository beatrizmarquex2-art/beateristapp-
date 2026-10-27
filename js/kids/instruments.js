// Instrumentos do jogo da memória: desenho (SVG nosso) e som (sintetizado aqui, sem amostras) de cada um.
import { audio, out, kick, snare, hihat, cymbal, tom } from '../audio.js';
import { bass, epiano, guitar, voice } from '../synth.js';

const S = '#1b1818';
const stand = (x, y, h) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${S}" stroke-width="3"/>`;
const wrap = (inner, label) => `<svg viewBox="0 0 100 100" role="img" aria-label="${label}">${inner}</svg>`;

export const INSTRUMENTS = [
  { id: 'bumbo', name: 'bumbo', color: '#b5162b', art: wrap(`<circle cx="50" cy="50" r="38" fill="#b5162b" stroke="${S}" stroke-width="4"/><circle cx="50" cy="50" r="27" fill="#fffdf8" stroke="${S}" stroke-width="3"/><circle cx="50" cy="50" r="6" fill="${S}"/><rect x="44" y="84" width="12" height="10" fill="${S}"/>`, 'bumbo'), play: (t) => kick(t) },
  { id: 'caixa', name: 'caixa', color: '#e3a82f', art: wrap(`<rect x="14" y="38" width="72" height="34" fill="#e3a82f" stroke="${S}" stroke-width="4"/><ellipse cx="50" cy="38" rx="36" ry="10" fill="#fffdf8" stroke="${S}" stroke-width="4"/><path d="M20 78h60M24 84h52" stroke="${S}" stroke-width="3"/><path d="M60 14l22-6M70 22l18-4" stroke="${S}" stroke-width="4" stroke-linecap="round"/>`, 'caixa'), play: (t) => snare(t, 0.9) },
  { id: 'chimbal', name: 'chimbal', color: '#d9b54a', art: wrap(`${stand(50, 30, 62)}<ellipse cx="50" cy="26" rx="36" ry="7" fill="#d9b54a" stroke="${S}" stroke-width="3"/><ellipse cx="50" cy="36" rx="36" ry="7" fill="#b38f2c" stroke="${S}" stroke-width="3"/><path d="M34 94h32" stroke="${S}" stroke-width="4" stroke-linecap="round"/>`, 'chimbal'), play: (t) => hihat(t, 0.9) },
  { id: 'prato', name: 'prato', color: '#f1c85a', art: wrap(`${stand(50, 34, 58)}<ellipse cx="50" cy="30" rx="42" ry="9" fill="#f1c85a" stroke="${S}" stroke-width="4"/><ellipse cx="50" cy="30" rx="8" ry="3" fill="${S}"/><path d="M38 94h24" stroke="${S}" stroke-width="4" stroke-linecap="round"/>`, 'prato'), play: (t) => cymbal(t) },
  { id: 'tom', name: 'tom', color: '#2c6fb5', art: wrap(`<rect x="20" y="30" width="60" height="44" fill="#2c6fb5" stroke="${S}" stroke-width="4"/><ellipse cx="50" cy="30" rx="30" ry="9" fill="#fffdf8" stroke="${S}" stroke-width="4"/><path d="M30 38v32M50 40v32M70 38v32" stroke="${S}" stroke-width="2" opacity=".5"/><path d="M30 76l-8 16M70 76l8 16" stroke="${S}" stroke-width="4" stroke-linecap="round"/>`, 'tom'), play: (t) => tom(t, 200) },
  { id: 'guitarra', name: 'guitarra', color: '#7a2a8a', art: wrap(`<path d="M62 8l14 14-26 26" stroke="${S}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M42 44c-10-2-18 6-16 16-8 2-12 12-6 20 8 10 22 8 30-2 6-8 4-14 0-18-2-8-2-14-8-16z" fill="#7a2a8a" stroke="${S}" stroke-width="4" stroke-linejoin="round"/><circle cx="40" cy="64" r="4" fill="#fffdf8" stroke="${S}" stroke-width="2"/>`, 'guitarra'), play: (t) => guitar(t, [57, 64], 0.9) },
  { id: 'baixo', name: 'baixo', color: '#1f6f5c', art: wrap(`<path d="M70 6l12 12-34 34" stroke="${S}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M40 46c-12 0-22 8-20 20-6 4-6 14 2 18 10 6 24 0 28-12 2-6 0-10-4-12-2-6-2-14-6-14z" fill="#1f6f5c" stroke="${S}" stroke-width="4" stroke-linejoin="round"/><path d="M52 40l22-22" stroke="#fffdf8" stroke-width="1.5"/><circle cx="36" cy="66" r="4" fill="#fffdf8" stroke="${S}" stroke-width="2"/>`, 'baixo'), play: (t) => bass(t, 40, 0.5) },
  { id: 'teclado', name: 'teclado', color: '#fffdf8', art: wrap(`<rect x="8" y="30" width="84" height="44" fill="#fffdf8" stroke="${S}" stroke-width="4"/><path d="M22 30v44M36 30v44M50 30v44M64 30v44M78 30v44" stroke="${S}" stroke-width="2"/><path d="M18 30h8v26h-8zM32 30h8v26h-8zM60 30h8v26h-8zM74 30h8v26h-8z" fill="${S}"/>`, 'teclado'), play: (t) => epiano(t, [60, 64, 67], 0.7) },
  { id: 'voz', name: 'voz', color: '#d92031', art: wrap(`<rect x="38" y="10" width="24" height="40" rx="12" fill="#d92031" stroke="${S}" stroke-width="4"/><path d="M38 24h24M38 32h24" stroke="${S}" stroke-width="2"/><path d="M28 40c0 18 8 28 22 28s22-10 22-28" fill="none" stroke="${S}" stroke-width="4" stroke-linecap="round"/><path d="M50 68v18M36 90h28" stroke="${S}" stroke-width="4" stroke-linecap="round"/>`, 'voz'), play: (t) => voice(t, 64, 0.6) },
  { id: 'cordas', name: 'violino', color: '#a8502a', art: wrap(`<path d="M50 6v30" stroke="${S}" stroke-width="5" stroke-linecap="round"/><path d="M50 36c-14 0-18 8-14 14-8 4-10 18 0 24 6 4 6 12 14 12s8-8 14-12c10-6 8-20 0-24 4-6 0-14-14-14z" fill="#a8502a" stroke="${S}" stroke-width="4" stroke-linejoin="round"/><path d="M44 52v22M56 52v22" stroke="${S}" stroke-width="1.5"/><path d="M20 90l60-34" stroke="${S}" stroke-width="3" stroke-linecap="round"/>`, 'violino'), play: (t) => strings(t, 69) },
];
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
