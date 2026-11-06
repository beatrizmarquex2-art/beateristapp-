// Estrelas dos jogos de mesa: cada partida ganha do Paul (jogando contra o robô) vale 1 estrela, no máximo 30 por jogo por dia.
// As estrelas entram no total que libera a roleta (estrelas.js). Sem código de acesso (modo livre) nada conta, como na pauLta.
import * as P from '../kids/progress.js';
import * as AC from '../acesso.js';
import { toast } from '../ui.js';

import { LIMITE_DIA, contar, hoje, ENSINAM, starsPct, starsErros } from './mesa-logic.js';
export { LIMITE_DIA, contar, ENSINAM, starsPct, starsErros };
const livre = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();
export const totalMesa = (pid) => (P.progOf(pid).mesa || {}).total || 0;
/** Chame UMA vez por partida ganha do Paul. Devolve 1 se ganhou a estrela. */
export async function vitoria(jogo, n = 1) {
  try {
    if (livre()) return 0; const me = P.active(); if (!me) return 0;
    const r = contar(P.progOf(me.id).mesa, jogo, undefined, n); await P.patch(me.id, { mesa: r.mesa });
    if (r.ganhou) { toast(`+${r.ganhou} ★${r.resta ? '' : ' (limite de hoje neste jogo)'}`, { ms: 2200 }); import('../figurinhas/estrelas.js').then((E) => E.sincronizar(me.id)).catch(() => {}); }
    return r.ganhou;
  } catch { return 0; }
}
