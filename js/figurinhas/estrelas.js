// Estrelas -> roleta e jogo completo -> prêmio. Tudo idempotente: cada roleta/prêmio tem id fixo (por jogador), então nunca entrega em dobro.
//  * a cada 30 estrelas (fases dos Kids + jogos de ritmo + missões do Modo Aventura) libera 1 roleta (1 ou 2 figurinhas)
//  * terminar um jogo inteiro (todas as fases ou todas as missões, pelo menos 1 estrela em cada) dá 3 figurinhas tops (exclusivas e raras)
import * as P from '../kids/progress.js';
import * as CS from '../campanha/store.js';
import * as FR from './rewards.js';
import { ESTRELAS_POR_ROLETA } from './album-logic.js';
import { MAX_LEVEL } from '../kids/levels.js';

export const estrelasTotais = (pid) => P.totalStars(pid) + (P.progOf(pid).ritmoStars || 0) + CS.allStars(pid);
export const roletasDevidas = (total) => Math.floor((total || 0) / ESTRELAS_POR_ROLETA);
/** Quantas estrelas faltam pra próxima roleta. */
export const faltamParaRoleta = (total) => ESTRELAS_POR_ROLETA - ((total || 0) % ESTRELAS_POR_ROLETA);
/** Entrega as roletas devidas pelo total de estrelas. Devolve quantas roletas NOVAS. */
export async function sincronizar(pid) {
  const n = roletasDevidas(estrelasTotais(pid));
  return FR.grantPacks(Array.from({ length: n }, (_, k) => `roleta:${pid}:${k + 1}`));
}
/** Prêmio de jogo completo (3 figurinhas tops). Devolve 1 se foi entregue agora, 0 se já tinha. */
export const premioJogo = (pid, jogoId) => FR.grantPacks([`jogo:${jogoId}:${pid}`]);
/** Jogo de fases dos Kids completo: as 11 fases (0..MAX_LEVEL) com pelo menos 1 estrela. */
export const kidsCompleto = (pid, game) => Array.from({ length: MAX_LEVEL + 1 }, (_, l) => l).every((l) => P.starsAt(pid, game, l) >= 1);
