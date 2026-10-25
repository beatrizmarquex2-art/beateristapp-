// Foto de cada artista: a que a Bea escolher (fica no aparelho) ou uma foto de licença livre do Wikimedia Commons,
// sempre com crédito do autor e da licença. Sem foto livre, fica a inicial no papel.
import { h } from '../util.js';
import * as store from '../store.js';
import { db } from '../db.js';
import { WIKI, isCommons, commonsFile, stripHtml } from '../catalog.js';
import { pickImages, saveImage, imageUrl } from './mural.js';

export const ART_KEY = 'setting-artphotos';
const WEEK = 7 * 864e5;
const mine = () => (store.get(ART_KEY) ? store.get(ART_KEY).data : {});
const pending = new Map();

async function fromWiki(slug, wiki) {
  const title = wiki || WIKI[slug]; if (!title) return null;
  const key = `wiki:${slug}`;
  const cached = await db.metaGet(key);
  if (cached && (cached.src || Date.now() - cached.ts < WEEK)) return cached.src ? cached : null;
  try {
    const sum = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)).json();
    const src = sum.thumbnail && sum.thumbnail.source; const orig = (sum.originalimage && sum.originalimage.source) || src;
    let out = { ts: Date.now(), src: null };
    if (isCommons(src) && commonsFile(orig)) {
      const file = commonsFile(orig);
      const q = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(`File:${file}`)}`)).json();
      const page = Object.values((q.query || {}).pages || {})[0] || {};
      const md = ((page.imageinfo || [])[0] || {}).extmetadata || {};
      const lic = stripHtml((md.LicenseShortName || {}).value);
      if (lic && !/fair|non-free/i.test(lic)) {
        out = { ts: Date.now(), src: src.replace(/\/\d+px-/, '/480px-'), author: stripHtml((md.Artist || {}).value).slice(0, 80), license: lic, page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}` };
      }
    }
    await db.metaSet(key, out);
    return out.src ? out : null;
  } catch { return cached && cached.src ? cached : null; }
}

/** { src, credit? } ou null. */
export async function photoOf(slug, wiki) {
  const own = mine()[slug];
  if (own) { const u = await imageUrl(own); if (u) return { src: u, own: true }; }
  if (!pending.has(slug)) pending.set(slug, fromWiki(slug, wiki).finally(() => setTimeout(() => pending.delete(slug), 1000)));
  return pending.get(slug);
}

/** <span> com a foto (ou a inicial enquanto carrega / se não houver foto livre). */
export function artPhoto(slug, name, cls = 'art-ph', wiki) {
  const box = h('span', { class: cls, 'aria-hidden': 'true' }, h('b', {}, (name || '?').trim()[0]));
  photoOf(slug, wiki).then((p) => {
    if (!p) return;
    const initial = box.firstChild;
    const img = h('img', { src: p.src, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => box.replaceChildren(initial));
    box.replaceChildren(img);
  });
  return box;
}

export function credit(slug, wiki) {
  const el = h('small', { class: 'art-credit' });
  photoOf(slug, wiki).then((p) => {
    if (!p) el.textContent = 'sem foto livre encontrada. toque em "trocar foto" para pôr a sua.';
    else if (p.own) el.textContent = 'foto escolhida por você (fica só neste aparelho).';
    else el.replaceChildren('foto: ', p.author || 'autor no Commons', ' · ', p.license, ' · ', h('a', { href: p.page, target: '_blank', rel: 'noopener' }, 'Wikimedia Commons'));
  });
  return el;
}

export async function changePhoto(slug) {
  const [blob] = await pickImages(false); if (!blob) return false;
  await store.upsert('setting', ART_KEY, { [slug]: await saveImage(blob) });
  return true;
}
export const resetPhoto = (slug) => store.upsert('setting', ART_KEY, { [slug]: null });
