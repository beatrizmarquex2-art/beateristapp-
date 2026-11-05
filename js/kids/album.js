// Recompensas do álbum de figurinhas (o novo, de 125): estrelas e pontos dos jogos viram PACOTES. O sistema antigo de cartas (bateristas/guitarristas/vocalistas) foi removido.
import * as P from './progress.js';
import * as FR from '../figurinhas/rewards.js';
import { STARS_PER_CARD, owedByStars, starsToNext } from './pacotes-logic.js';

export { STARS_PER_CARD, owedByStars, starsToNext };
/** Endereço do álbum novo (área dos alunos x app da Bea) e da aba dos pacotes. */
export const albumHref = (aba = '') => `${document.documentElement.classList.contains('aluno-on') ? '#/album' : '#/figurinhas'}${aba ? `/${aba}` : ''}`;
/** ★ dos jogos de ritmo → a cada 5 ★, 1 pacote. Devolve quantos pacotes novos (id fixo por pacote: nunca entrega em dobro). */
export async function grantByStars(pid, totalStars) {
  const prog = P.progOf(pid); const paid = prog.ritmoPaid || 0; const n = owedByStars(totalStars, paid);
  const ids = Array.from({ length: n }, (_, k) => `ritmo:${pid}:${paid + k + 1}`);
  const got = await FR.grantPacks(ids);
  await P.patch(pid, { ritmoStars: totalStars, ritmoPaid: paid + n });
  return got;
}
/** Estrelas novas nas fases dos Kids → 1 pacote por estrela nova. Devolve quantos pacotes novos. */
export async function grantPacks(pid, n) {
  if (!n || n < 1) return 0;
  const t = Date.now().toString(36);
  return FR.grantPacks(Array.from({ length: n }, (_, k) => `kids:${pid}:${t}:${k}`));
}
