// UN🚫: variante do Uno Musical com regras próprias (cartas iguais juntas, comprar até achar, UNO silencioso, +2 e +4 acumulam, +4 quando quiser).
// A tela e as animações são as do Uno Musical; as regras novas ficam em cartas-logic.js (g.un).
import * as cartas from './cartas.js';
export const mount = (host, opts = {}) => cartas.mount(host, { ...opts, un: true });
