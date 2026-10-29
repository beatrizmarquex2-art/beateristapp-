// Álbum de figurinhas da área Kids: ganha figurinha nova cada vez que melhora as estrelas de uma fase.
// A figurinha chega no pacotinho (pack.js), fica na folha de colar e só conta como colada depois de colada no álbum.
import { h } from '../util.js';
import * as P from './progress.js';
import { CARDS, ROLES, byId } from './album-data.js';
import { cardSvg, rarityOf, RARITY } from './card-art.js';
import { photoOf } from '../views/artist-photo.js';

const SIZE = {}; for (const x of CARDS) SIZE[x.role] = (SIZE[x.role] || 0) + 1;
export const PACK_SIZE = 2; // figurinhas por pacotinho
export const total = () => CARDS.length;
export const owned = (pid) => (P.progOf(pid).album || []).filter((id) => byId[id]);
/** coladas no álbum; quem já tinha figurinhas antes da folha de colar conta como colada */
export const pasted = (pid) => { const p = P.progOf(pid); return (p.pasted || p.album || []).filter((id) => byId[id]); };
export const tray = (pid) => { const done = new Set(pasted(pid)); return owned(pid).filter((id) => !done.has(id)); };
export const paste = (pid, id) => { const p = P.progOf(pid); if (!owned(pid).includes(id)) return; return P.patch(pid, { pasted: [...new Set([...pasted(pid), id])], album: p.album }); };

/** Sorteia `n` figurinhas que ainda faltam (as raras saem menos), misturando as categorias. Salva e devolve as cartas. */
export function grant(pid, n) {
  if (!n || n < 1) return [];
  const have = new Set(owned(pid)); const won = []; const keep = pasted(pid);
  for (let k = 0; k < n; k++) {
    const missing = CARDS.filter((x) => !have.has(x.id)); if (!missing.length) break;
    const counts = {}; for (const id of have) counts[byId[id].role] = (counts[byId[id].role] || 0) + 1;
    const roles = Object.keys(ROLES).filter((r) => missing.some((x) => x.role === r)).sort((a, b) => (counts[a] || 0) / SIZE[a] - (counts[b] || 0) / SIZE[b] + (Math.random() - .5) * .6);
    const pool = missing.filter((x) => x.role === roles[0]); const wts = pool.map((x) => 1 / rarityOf(x.id) ** 2);
    let r = Math.random() * wts.reduce((a, b) => a + b, 0); let pick = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) { r -= wts[i]; if (r <= 0) { pick = pool[i]; break; } }
    have.add(pick.id); won.push(pick);
  }
  if (won.length) P.patch(pid, { album: [...have], pasted: keep });
  return won;
}

/** A figurinha: arte (e foto livre por cima, se houver), nome, banda e raridade. `locked` = ainda não ganhou; `slot` = número no álbum. */
export function cardEl(card, { fresh = false, locked = false, onclick, slot } = {}) {
  const [, emoji] = ROLES[card.role]; const rar = rarityOf(card.id);
  const ph = h('span', { class: 'kx-ph' });
  if (locked) ph.append(h('b', { class: 'kx-q' }, ROLES[card.role][1]));
  else {
    ph.innerHTML = cardSvg(card);
    const addPhoto = (src, onFail) => { const img = h('img', { class: 'kx-photo', src, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' }); img.addEventListener('load', () => ph.isConnected && ph.append(img)); img.addEventListener('error', onFail); };
    // foto guardada no app (assets/figurinhas/<id>.webp) vale para todos; se não houver, tenta uma foto livre do Commons
    addPhoto(`assets/figurinhas/${card.id}.webp`, () => photoOf(`album-${card.id}`, card.wiki).then((p) => { if (p && ph.isConnected) addPhoto(p.src, () => {}); }).catch(() => {}));
  }
  return h(onclick ? 'button' : 'div', { class: `kx-card-fig role-${card.role} rar-${rar}${locked ? ' locked' : ''}${fresh ? ' fresh' : ''}`, 'data-id': card.id, type: onclick ? 'button' : null, 'aria-label': locked ? `Espaço da figurinha ${slot || ''} ${card.name}, ainda não colada` : `${card.name}, ${ROLES[card.role][0]}, ${RARITY[rar]}`, onclick: onclick || null },
    slot ? h('i', { class: 'kx-num' }, String(slot).padStart(3, '0')) : null,
    ph, h('span', { class: 'kx-nm' }, card.name), h('small', { class: 'kx-bd' }, locked ? 'falta colar' : card.band),
    locked ? null : h('span', { class: 'kx-stars-r', 'aria-hidden': 'true' }, '★'.repeat(rar)), h('span', { class: 'kx-role', 'aria-hidden': 'true' }, emoji));
}
