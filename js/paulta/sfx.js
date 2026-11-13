// pauLta: sons musicais curtos (sem texto, só sintetizados). Nada fica tocando depois que a fase fecha.
import { audio, out, silence, isMuted } from '../audio.js';
import { VOICE } from '../views/beatlab.js';
import { freqOf } from './music.js';
import { DRUM } from './draw.js';
import { tocarEfeito } from '../jogos/efeitos.js'; // sons próprios da pauLta (pizzicato), aprovados pela Bea

const KEY = 'beaterista-paulta-mute';
export const muted = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const setMute = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ok */ } if (v) silence(); };
const on = () => !muted() && !isMuted();

function tone(freq, t, dur, type = 'triangle', vol = 0.22) {
  const c = audio(); const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.05);
}
export const ok = () => { if (!on()) return; tocarEfeito('paulta', 'acertou'); };
export const no = () => { if (!on()) return; tocarEfeito('paulta', 'errou'); };
export const tick = (hi) => { if (!on()) return; tone(hi ? 988 : 660, audio().currentTime + 0.01, 0.12, 'square', 0.08); };
export const fanfare = (big) => { if (!on()) return; tocarEfeito('paulta', big ? 'mundo concluído' : 'passou de fase'); };
export const note = (n) => { if (!on()) return; tone(freqOf(n), audio().currentTime + 0.01, 0.7, 'triangle', 0.26); };
const VEL = { sg: 0.3, sa: 1.3, sr: 0.5 };
const VOX = { sg: 'sn', sa: 'sn', sr: 'sn' };
export function drum(ids, fig) {
  if (!on()) return; const c = audio(); const t0 = c.currentTime + 0.02; const n = fig ? { seminima: 1, colcheia: 2, semicolcheia: 4 }[fig] : 1; const step = 0.5 / n;
  for (let k = 0; k < n; k++) for (const id of ids) { const v = VOX[id] || id; if (VOICE[v]) VOICE[v](t0 + k * step, VEL[id] || 1); }
}
export const piece = (id) => drum([id]);
