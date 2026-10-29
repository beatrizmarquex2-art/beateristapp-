// Ouvir o que está na peça: cada figura vira uma nota com a duração dela (semínima = 1 tempo, mínima = 2, semibreve = 4) e um tique em cada tempo.
// Assim a criança liga o desenho, o nome, o número e o som. Só soa com o som do jogo ligado.
import { audio, out, click } from '../audio.js';
import { soundOn } from './base.js';

const DUR = { seminima: 1, minima: 2, semibreve: 4 };
const PITCH = [523.25, 659.25]; // metade da esquerda e da direita soam em notas diferentes
let live = [];

function nota(c, t, dur, freq) {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.012);
  g.gain.setValueAtTime(0.3, t + Math.max(0.02, dur - 0.07)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out()); o.start(t); o.stop(t + dur + 0.02);
  live.push(o);
}

/** Toca uma ou duas metades seguidas. `values` = valores (0 = pausa de 1 tempo); `figsOf(v)` = lista de figuras do valor. Devolve a duração em segundos. */
export function ouvir(values, figsOf, { bpm = 92 } = {}) {
  if (!soundOn()) return 0;
  try {
    live.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); live = [];
    const c = audio(); const q = 60 / bpm; let t = c.currentTime + 0.05; let beat = 0;
    values.forEach((v, i) => {
      const figs = v === 0 ? [] : figsOf(v);
      if (!figs.length) { click(t, beat % 4 === 0 ? 2 : 1, 0.25); t += q; beat += 1; return; }
      figs.forEach((f) => {
        const d = DUR[f] || 1;
        for (let b = 0; b < d; b++) click(t + b * q, (beat + b) % 4 === 0 ? 2 : 1, 0.22);
        nota(c, t, d * q * 0.94, PITCH[i % 2]); t += d * q; beat += d;
      });
    });
    return t - c.currentTime;
  } catch { return 0; }
}
export const ouvirPeca = (a, b, figsOf) => ouvir([a, b], figsOf);
export const ouvirValor = (v, figsOf) => ouvir([v], figsOf);
