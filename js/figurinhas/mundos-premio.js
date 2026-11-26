// Prêmio por CONCLUIR UM MUNDO (o Modo Aventura = os mundos, só nos jogos de aprender: Toca Aqui, Detetive Note, Figurix e pauLta; regra da Bea, nov/2026).
// Dá 1 pacote de figurinhas de BANDAS e ARTISTAS (comum e rara, 1 rara garantida) por mundo, uma vez só (o id do pacote leva o mundo e o aluno).
// A pauLta já tem os pacotinhos próprios dela (js/paulta/recompensas.js).
import * as P from '../kids/progress.js';
import * as AC from '../acesso.js';
import { toast } from '../ui.js';

const livre = () => { try { return document.documentElement.classList.contains('aluno-on') && !AC.liberado(); } catch { return true; } };
/** `chave` = jogo:mundo (ex.: `figurix:floresta`, `detetive:comida`, `toca:ini`). Devolve 1 se entregou agora. */
const feitos = new Map();
/** Promessa do prêmio daquele mundo (n entregues agora), pra festa poder avisar que chegou no baú. */
export const premioDe = (chave) => feitos.get(chave) || Promise.resolve(0);
export function premiarMundo(chave) { const p = premiar(chave); feitos.set(chave, p); return p; }
async function premiar(chave) {
  try {
    if (livre()) return 0; const me = P.active(); if (!me) return 0;
    const E = await import('./estrelas.js'); const n = await E.premioJogo(me.id, `mundo-${chave}`);
    if (n) toast('🏆 mundo concluído! um pacote de figurinhas (bandas e artistas) chegou no baú, em Stars', { ms: 5200 });
    return n;
  } catch { return 0; }
}
