// Demonstrações do Palco (pedido da Bea, 28/nov/2026): quem ainda não tem código ouve como soam os modelos trancados (bateria eletrônica e cajón, outros xilofones,
// guitarras) tocando uma frasezinha curta, em vez de só ver o cadeado. Só toca som: não destrava nada. Tudo cai em silêncio se o áudio falhar.
import { audio } from './audio.js';
import { kitSom, mallet, pluck, warmKit } from './instruments.js';

let timers = [];
const para = () => { timers.forEach(clearTimeout); timers = []; };
const em = (ms, fn) => timers.push(setTimeout(() => { try { fn(); } catch { /* sem áudio */ } }, ms));
/** Frase de bateria (rock simples, 2 compassos, ~3,5 s). Cajón só tem grave (bd) e agudo (sn): as outras peças caem nelas. */
export async function demoBateria(modelo) {
  para(); try { await warmKit(modelo); } catch { /* fica o sintético */ }
  const som = kitSom(modelo); const c = audio(); const q = 0.42; const t0 = c.currentTime + 0.08;
  const P = [['hh', 0], ['bd', 0], ['hh', 1], ['sn', 2], ['hh', 2], ['hh', 3], ['bd', 4], ['hh', 4], ['hh', 5], ['sn', 6], ['hh', 6], ['bd', 7], ['hh', 7], ['bd', 8], ['hh', 8], ['sn', 10], ['tt', 11], ['mt', 11.5], ['ft', 12], ['cr', 14]];
  for (const [id, k] of P) { const f = som[id]; if (f) f(t0 + k * q / 2, id === 'sn' || id === 'cr' ? 1 : 0.85, 0.3); }
}
/** Escala subindo e descendo no som do xilofone/marimba/vibrafone…, ~2 s. */
export function demoMallet(kind) {
  para(); audio(); const nota = [60, 64, 67, 72, 67, 64, 60, 67]; nota.forEach((m, i) => em(i * 230, () => mallet(m, 0.9, kind)));
}
/** Acorde dedilhado + riff curto no violão/guitarra. */
export function demoGuitarra(kind) {
  para(); audio(); const c = audio().currentTime;
  [[40, 0], [47, 0.1], [52, 0.2], [56, 0.3], [59, 0.4], [64, 0.5]].forEach(([m, d]) => pluck(m, 0.8, c + 0.05 + d, kind, false));
  [[52, 1.2], [55, 1.5], [57, 1.8], [55, 2.1], [52, 2.4]].forEach(([m, d]) => pluck(m, 0.9, c + d, kind, false));
}
export const paraDemo = para;
