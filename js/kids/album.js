// Álbum de figurinhas da área Kids: ganha figurinha nova cada vez que melhora as estrelas de uma fase.
import { h } from '../util.js';
import * as P from './progress.js';
import { CARDS, ROLES, byId, STARS_PER_CARD, owedByStars, starsToNext } from './album-data.js';
import * as FR from '../figurinhas/rewards.js';
import { artPhoto } from '../views/artist-photo.js';

export const total = () => CARDS.length;
export const owned = (pid) => (P.progOf(pid).album || []).filter((id) => byId[id]);

/** Sorteia `n` figurinhas que ainda faltam, misturando as três categorias. Salva e devolve as cartas. */
export function grant(pid, n) {
  if (!n || n < 1) return [];
  const have = new Set(owned(pid)); const won = [];
  for (let k = 0; k < n; k++) {
    const missing = CARDS.filter((x) => !have.has(x.id)); if (!missing.length) break;
    const counts = {}; for (const id of have) counts[byId[id].role] = (counts[byId[id].role] || 0) + 1;
    // prefere a categoria em que a criança tem menos cartas
    const roles = Object.keys(ROLES).filter((r) => missing.some((x) => x.role === r)).sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
    const pool = missing.filter((x) => x.role === roles[0]); const pick = pool[Math.floor(Math.random() * pool.length)];
    have.add(pick.id); won.push(pick);
  }
  if (won.length) P.patch(pid, { album: [...have] });
  return won;
}

/** A figurinha: foto (ou inicial), nome, banda e papel. `locked` = ainda não ganhou. */
export function cardEl(card, { fresh = false, locked = false, onclick } = {}) {
  const [, emoji] = ROLES[card.role];
  const el = h(onclick ? 'button' : 'div', { class: `kx-card-fig role-${card.role}${locked ? ' locked' : ''}${fresh ? ' fresh' : ''}`, type: onclick ? 'button' : null, 'aria-label': locked ? `Figurinha de ${ROLES[card.role][0].slice(0, -1)} ainda não ganhou` : `${card.name}, ${card.role}`, onclick: onclick || null },
    h('span', { class: 'kx-ph' }, locked ? h('b', { class: 'kx-q' }, '?') : artPhoto(`album-${card.id}`, card.name, 'art-ph', card.wiki)),
    h('span', { class: 'kx-nm' }, locked ? '???' : card.name), h('small', { class: 'kx-bd' }, locked ? ROLES[card.role][0].slice(0, -1) : card.band), h('span', { class: 'kx-role', 'aria-hidden': 'true' }, emoji));
  return el;
}

/* ---- estrelas e pontuação viram pacotes do álbum de 125 (id fixo por pacote: nunca entrega em dobro) ---- */
export { STARS_PER_CARD, owedByStars, starsToNext };
/** ★ dos jogos de ritmo → a cada 5 ★, 1 pacote. Devolve quantos pacotes novos. */
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
