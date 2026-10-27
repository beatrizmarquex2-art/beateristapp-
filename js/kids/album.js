// Álbum de figurinhas da área Kids: ganha figurinha nova cada vez que melhora as estrelas de uma fase.
import { h } from '../util.js';
import * as P from './progress.js';
import { CARDS, ROLES, byId } from './album-data.js';
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
