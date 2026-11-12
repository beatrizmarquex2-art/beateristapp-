// Estrelas -> roleta e jogo completo -> prêmio. Tudo idempotente: cada roleta/prêmio tem id fixo (por jogador), então nunca entrega em dobro.
//  * a cada 15 estrelas (fases dos Kids + jogos de ritmo + missões do Modo Aventura) libera 1 roleta (1 a 3 figurinhas)
//  * terminar um jogo inteiro (todas as fases ou todas as missões, pelo menos 1 estrela em cada) dá 1 pacote de 3 com uma rara garantida
import * as P from '../kids/progress.js';
import * as CS from '../campanha/store.js';
import * as FR from './rewards.js';
import { ESTRELAS_POR_ROLETA } from './album-logic.js';
import { MAX_LEVEL } from '../kids/levels.js';
import { getGame } from '../jogos/base.js';

export const estrelasTotais = (pid) => P.totalStars(pid) + (P.progOf(pid).ritmoStars || 0) + ((P.progOf(pid).mesa || {}).total || 0) + CS.allStars(pid);
export const roletasDevidas = (total) => Math.floor((total || 0) / ESTRELAS_POR_ROLETA);
/** Quantas estrelas faltam pra próxima roleta. */
export const faltamParaRoleta = (total) => ESTRELAS_POR_ROLETA - ((total || 0) % ESTRELAS_POR_ROLETA);
/** Jogos de APRENDER (fases dos Kids, pauLta, Figurix e Detetive Note): a cada 3 fases CONCLUÍDAS (pelo menos 1 ★) o aluno ganha 1 giro EXTRA da roleta (além das 15 ★). A revisão do Paul não entra. */
export const FASES_POR_GIRO_EXTRA = 3;
const contaEst = (est) => Object.values(est || {}).filter((v) => (v || 0) >= 1).length;
export const fasesConcluidas = (pid) => Object.entries(P.progOf(pid).lv || {}).filter(([k, x]) => (x.s || 0) >= 1 && !k.startsWith('pl-revisao')).length + contaEst(getGame('figurix').est) + contaEst(getGame('detetive').est);
export const fases3Estrelas = fasesConcluidas; // nome antigo (a regra agora é fase concluída, não só 3 ★)
export const girosExtras = (pid) => Math.floor(fasesConcluidas(pid) / FASES_POR_GIRO_EXTRA);
/** Quantas fases concluídas faltam pro próximo giro extra. */
export const faltamFases3 = (pid) => FASES_POR_GIRO_EXTRA - (fasesConcluidas(pid) % FASES_POR_GIRO_EXTRA);
/** Entrega as roletas devidas pelo total de estrelas e os giros extras das fases com 3 ★. Devolve quantas roletas NOVAS. */
export async function sincronizar(pid) {
  const n = roletasDevidas(estrelasTotais(pid)); const x = girosExtras(pid);
  return FR.grantPacks([...Array.from({ length: n }, (_, k) => `roleta:${pid}:${k + 1}`), ...Array.from({ length: x }, (_, k) => `roleta:fases3:${pid}:${k + 1}`)]);
}
/** Prêmio de jogo completo (1 pacote de 3 com uma rara). Devolve 1 se foi entregue agora, 0 se já tinha. */
export const premioJogo = (pid, jogoId) => FR.grantPacks([`jogo:${jogoId}:${pid}`]);
/** Jogo de fases dos Kids completo: as 11 fases (0..MAX_LEVEL) com pelo menos 1 estrela. */
export const kidsCompleto = (pid, game) => Array.from({ length: MAX_LEVEL + 1 }, (_, l) => l).every((l) => P.starsAt(pid, game, l) >= 1);
