// Álbum de figurinhas da área Kids: ganha figurinha nova cada vez que melhora as estrelas de uma fase.
import { h } from '../util.js';
import * as P from './progress.js';
import { CARDS, ROLES, byId, STARS_PER_CARD, owedByStars, starsToNext } from './album-data.js';
import { artPhoto } from '../views/artist-photo.js';
import * as Cloud from './album-cloud.js';
import * as FR from '../figurinhas/rewards.js';

export const total = () => CARDS.length;
export const owned = (pid) => (P.progOf(pid).album || []).filter((id) => byId[id]);

/** Sorteia `n` figurinhas que ainda faltam, misturando as três categorias. Salva e devolve as cartas. */
export function grant(pid, n, extra = {}) {
  Cloud.soon(pid); // se já tem código BEA-0000, salva sozinho daqui a pouco
  if (!n || n < 1) { if (Object.keys(extra).length) P.patch(pid, extra); return []; }
  const have = new Set(owned(pid)); const won = [];
  for (let k = 0; k < n; k++) {
    const missing = CARDS.filter((x) => !have.has(x.id)); if (!missing.length) break;
    const counts = {}; for (const id of have) counts[byId[id].role] = (counts[byId[id].role] || 0) + 1;
    // prefere a categoria em que a criança tem menos cartas
    const roles = Object.keys(ROLES).filter((r) => missing.some((x) => x.role === r)).sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
    const pool = missing.filter((x) => x.role === roles[0]); const pick = pool[Math.floor(Math.random() * pool.length)];
    have.add(pick.id); won.push(pick);
  }
  if (won.length || Object.keys(extra).length) P.patch(pid, { ...(won.length ? { album: [...have] } : {}), ...extra });
  return won;
}

/* ---- ★ dos jogos de ritmo (músicas longas) também valem figurinha: a cada 5 ★ ganha 1 ---- */
export { STARS_PER_CARD, owedByStars, starsToNext };
/** ★ do ritmo → pacotes do álbum de 125 (a cada 5 ★, 1 pacote; id fixo por lote, nunca repete). Devolve quantos pacotes novos. */
export async function grantByStars(pid, totalStars) {
  const prog = P.progOf(pid); const paid = prog.ritmoPaid || 0; const n = owedByStars(totalStars, paid);
  const ids = Array.from({ length: n }, (_, k) => `ritmo:${pid}:${paid + k + 1}`);
  const got = await FR.grantPacks(ids);
  await P.patch(pid, { ritmoStars: totalStars, ritmoPaid: paid + n });
  if (got) Cloud.soon(pid);
  return got;
}
/** Estrelas novas nas fases dos Kids → 1 pacote por estrela nova. Devolve quantos pacotes novos. */
export async function grantPacks(pid, n) {
  if (!n || n < 1) return 0;
  const t = Date.now().toString(36);
  const got = await FR.grantPacks(Array.from({ length: n }, (_, k) => `kids:${pid}:${t}:${k}`));
  if (got) Cloud.soon(pid);
  return got;
}
