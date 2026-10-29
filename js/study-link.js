// Do bilhete do início pro estudo: acha, dentro do app, o álbum (Arsenal discos) ou o texto (Estudos) sobre a música/artista citada.
import { loadDiscos, albumSlug, artistKey } from './views/arsenal.js';
import * as lib from './lib.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const same = (a, b) => { const x = artistKey(a).replace(/[^a-z0-9 ]+/g, ' ').trim(), y = artistKey(b).replace(/[^a-z0-9 ]+/g, ' ').trim(); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };

/** { href, label, q? } ou null. q = busca pra abrir pré-preenchida (guardada na sessão). */
export async function findStudy(title, artist) {
  try {
    const all = await loadDiscos();
    const t = norm(title);
    const byArtist = all.filter((x) => artist && same(x.a, artist));
    const withTrack = byArtist.find((x) => x.k.some((k) => norm(k) === t || norm(k).startsWith(t))) || all.find((x) => t.length > 3 && x.k.some((k) => norm(k) === t));
    if (withTrack) return { href: `#/estudos/club/arsenal:${albumSlug(withTrack)}`, label: `📖 estudar o álbum “${withTrack.t}”` };
    if (byArtist.length) return { href: '#/estudos/club/arsenal', q: byArtist[0].a, label: `📖 ver ${byArtist[0].a} no Arsenal` };
  } catch { /* sem arquivo: tenta o resto */ }
  try {
    const idx = await lib.loadIndex(); const a = norm(artist), t = norm(title);
    const hit = idx.find((x) => { const n = norm(x.title); return (a && a.length > 2 && n.includes(a)) || (t.length > 3 && n.includes(t)); });
    if (hit) return { href: `#/estudos/a/${hit.slug}`, label: `📖 estudar: ${hit.title}` };
  } catch { /* sem biblioteca */ }
  return null;
}
export const openStudy = (s) => { try { if (s.q) sessionStorage.setItem('ar-q', s.q); } catch { /* ok */ } location.hash = s.href; };
