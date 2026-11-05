// Som de bateria da roleta: rufo de caixa/tons que acelera e termina com bumbo + prato quando a roleta para. Só sintetizado (sem arquivos).
import { audio, now, snare, tom, kick, cymbal } from '../audio.js';
/** Toca o rufo por `dur` segundos (combina com o giro da roleta). Devolve nada; sem som se o app estiver no mudo (o mestre de áudio já cuida). */
export function rufo(dur = 3.2) {
  try {
    audio(); const t0 = now() + 0.04; let t = 0, gap = 0.26, i = 0;
    while (t < dur - 0.35) {
      const vel = 0.35 + 0.55 * (t / dur); // vai ficando mais forte
      if (i % 4 === 3) tom(t0 + t, 150 + (i % 8) * 12, vel); else snare(t0 + t, vel * 0.8);
      gap = Math.max(0.045, gap * 0.92); t += gap; i++;
    }
    kick(t0 + dur - 0.3, 1); cymbal(t0 + dur - 0.3, false, 0.9);
  } catch { /* sem áudio: segue sem som */ }
}
