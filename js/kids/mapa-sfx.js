// Sons curtinhos do mapa (sintetizados na hora, sem arquivo). Sem trilha e sem nota aleatória: só cliques e jingles de interface.
// Usa o gerenciador de áudio do app (audio()/out()), então o mudo geral do app vale aqui também; além disso o mapa tem o seu botão.
import { audio, out, isMuted } from '../audio.js';

const KEY = 'beaterista-mapa-som';
export const soundOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };
export const setSound = (on) => { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* sem armazenamento */ } };

// nome → [[freq, início, duração, tipo, volume]]
const SONGS = {
  click: [[880, 0, 0.05, 'square', 0.12]],
  disc: [[440, 0, 0.06, 'square', 0.12], [660, 0.05, 0.08, 'square', 0.12]],
  locked: [[150, 0, 0.1, 'square', 0.12], [110, 0.09, 0.12, 'square', 0.12]],
  unlock: [[523, 0, 0.09, 'triangle', 0.18], [659, 0.09, 0.09, 'triangle', 0.18], [784, 0.18, 0.14, 'triangle', 0.18]],
  star: [[988, 0, 0.07, 'triangle', 0.16], [1319, 0.07, 0.12, 'triangle', 0.16]],
  win: [[523, 0, 0.1, 'square', 0.12], [659, 0.1, 0.1, 'square', 0.12], [784, 0.2, 0.1, 'square', 0.12], [1047, 0.3, 0.22, 'square', 0.12]],
  region: [[330, 0, 0.08, 'square', 0.1], [392, 0.08, 0.08, 'square', 0.1], [494, 0.16, 0.12, 'square', 0.1]],
};
/** Cria o tocador de uma tela de mapa. Limita vozes ao mesmo tempo, ignora o mesmo som repetido em sequência e cala tudo no fim. */
export function mapSfx({ maxVoices = 4 } = {}) {
  const live = new Set(); const last = {}; let gone = false;
  return {
    play(name) {
      if (gone || !SONGS[name] || !soundOn() || isMuted()) return;
      const t0 = performance.now(); if (last[name] && t0 - last[name] < 90) return; last[name] = t0; // sem som duplicado
      try {
        const c = audio(); if (c.state === 'closed') return; const t = c.currentTime + 0.01;
        for (const [f, at, dur, type, vol] of SONGS[name]) {
          if (live.size >= maxVoices) break;
          const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(vol, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
          o.connect(g); g.connect(out()); o.start(t + at); o.stop(t + at + dur + 0.03); live.add(o);
          o.onended = () => { live.delete(o); try { g.disconnect(); } catch { /* já solto */ } };
        }
      } catch { /* sem áudio */ }
    },
    /** Sai da tela: nada continua tocando. */
    dispose() { gone = true; live.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); live.clear(); },
  };
}
