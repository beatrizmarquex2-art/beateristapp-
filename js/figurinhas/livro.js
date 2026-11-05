// O "livro" do álbum: capa, sumário por artista e páginas de colagem (4 figurinhas por página, nome do artista embaixo de cada espaço).
// Folheia deslizando (scroll-snap) ou pelos botões. Tudo desenhado aqui: papel, fitas, rabiscos (ornaments.js).
import { h } from '../util.js';
import * as O from './ornaments.js';
import { cardSVG } from './card.js';
import * as L from './album-logic.js';

const PER = 4;
const TAPES = ['#e9b824', '#c4182c', '#17224a', '#e7d9ae', '#f1b9b0', '#7fb7a4'];
const rot = (code, k = 1) => ((O.hashSeed(code + k) % 700) / 100 - 3.5).toFixed(2); // -3.5 .. +3.5 graus, sempre o mesmo pra mesma figurinha
const DOODLES = [
  (c) => `<g transform="rotate(${c.r} 0 0)">${O.star(0, 0, 15, '#e9b824', '#14111a', 2.5, -90, c.s)}</g>`,
  (c) => `<g transform="rotate(${c.r}) scale(.38)">${O.note('#14111a')}</g>`,
  (c) => `<g transform="rotate(${c.r}) scale(.2)">${O.bolt('#c4182c', '#14111a', 8)}</g>`,
  (c) => O.sparkle(0, 0, 13, '#fbf6ea', '#14111a'),
  (c) => `<g transform="rotate(${c.r})">${O.scribble('#17224a', 3, 48)}</g>`,
  (c) => `<g transform="rotate(${c.r}) scale(.28)">${O.vinyl('#c4182c', 50)}</g>`,
];
const SPOTS = [[24, 22], [336, 24], [22, 500], [338, 498], [180, 12], [180, 508], [14, 262], [348, 270]];

/** Páginas de uma coleção: capa, sumário e as páginas de figurinhas, artistas em ordem alfabética (as repetidas ficam juntas). */
export function pagesOf(catalog, colecao) {
  const cards = catalog.filter((c) => c.colecao === colecao).sort((a, b) => a.artista_banda.localeCompare(b.artista_banda, 'pt') || a.codigo.localeCompare(b.codigo));
  const pages = [{ tipo: 'capa' }, { tipo: 'indice' }];
  for (let i = 0; i < cards.length; i += PER) pages.push({ tipo: 'pagina', cards: cards.slice(i, i + PER) });
  return { pages, cards };
}

function deco(seed) {
  const r = O.rng(O.hashSeed(seed)); const spots = [...SPOTS].sort(() => r() - 0.5).slice(0, 4);
  return `<svg class="lv-deco" viewBox="0 0 360 520" aria-hidden="true">${spots.map(([x, y], i) => `<g transform="translate(${x} ${y})">${DOODLES[Math.floor(r() * DOODLES.length)]({ r: Math.round(r() * 50 - 25), s: i + 3 })}</g>`).join('')}</svg>`;
}

const COVER = {
  Geral: { titulo: 'Álbum', sub: 'o mundo da música', cls: 'cv-geral' },
  Beatles: { titulo: 'The Beatles', sub: 'edição psicodélica', cls: 'cv-beatles' },
  Beaterista: { titulo: 'Beaterista', sub: 'edição exclusiva da Bea', cls: 'cv-bea' },
  Especial: { titulo: 'Especial', sub: 'duplas e colaborações', cls: 'cv-esp' },
};

export function createBook({ catalog, colecao, state, onPaste, onDetail, reduzir }) {
  const { pages, cards } = pagesOf(catalog, colecao);
  const track = h('div', { class: 'lv-track', tabindex: '0', 'aria-label': `Álbum ${colecao}: deslize para folhear` });
  const el = h('div', { class: `lv lv-${colecao.toLowerCase()}${reduzir ? ' lv-calm' : ''}` });
  const label = h('span', { class: 'lv-label', 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'lv-nav', 'aria-label': 'Página anterior', onclick: () => go(cur - 1) }, '‹');
  const next = h('button', { type: 'button', class: 'lv-nav', 'aria-label': 'Próxima página', onclick: () => go(cur + 1) }, '›');
  const idxBtn = h('button', { type: 'button', class: 'lv-nav lv-idx', onclick: () => go(1) }, 'sumário');
  el.append(track, h('div', { class: 'lv-bar' }, prev, label, next, idxBtn));
  let cur = 0, st = state, last = null; const rendered = new Set(), drawn = new Set(); const nodes = pages.map((p, i) => h('section', { class: `lv-page lv-${p.tipo}`, 'data-i': i, 'aria-label': p.tipo === 'pagina' ? `Página ${i - 1}` : p.tipo }));
  nodes.forEach((n) => track.append(n));
  const pageOfArtist = (a) => pages.findIndex((p) => p.tipo === 'pagina' && p.cards.some((c) => c.artista_banda === a));

  function slot(e, pi, k) {
    const fresh = !drawn.has(pi);
    const got = !!st.pasted[e.codigo], hand = L.canPaste(st, e.codigo), n = L.slotNumber(catalog, e);
    const b = h('button', { type: 'button', class: `lv-slot ${got ? 'got' : hand ? 'hand' : 'empty'} r-${e.raridade.toLowerCase()}${last === e.codigo ? ' pop' : ''}${fresh ? ' fresh' : ''}`, style: `--rot:${rot(e.codigo)}deg;--d:${k * 90}ms`, 'aria-label': got ? `${e.artista_banda}, número ${n}, colada. Abrir detalhe` : hand ? `${e.artista_banda}, número ${n}, está na sua mão. Colar` : `Número ${n}, ainda falta`, onclick: () => (got ? onDetail(e) : hand ? onPaste(e) : null) });
    const t = TAPES[O.hashSeed(e.codigo) % TAPES.length];
    b.innerHTML = `<i class="lv-tape" style="background:${t}"></i><i class="lv-tape b" style="background:${TAPES[(O.hashSeed(e.codigo) + 2) % TAPES.length]}"></i>`
      + (got ? `<div class="lv-card${e.raridade !== 'Comum' ? ' shine' : ''}">${cardSVG(e, { url: e.foto, aspect: e.largura_px / e.altura_px, uid: `lv${e.codigo}` })}</div>`
        : `<div class="lv-hole"><b>${String(n).padStart(2, '0')}</b><span>${hand ? 'colar!' : e.raridade === 'Comum' ? '?' : e.raridade === 'Rara' ? '★' : '♛'}</span></div>`)
      + `<span class="lv-cap">${got || hand ? e.artista_banda : '— — —'}</span>`;
    return b;
  }
  function draw(i) {
    const p = pages[i], node = nodes[i], tot = L.stats(st, catalog, colecao);
    if (p.tipo === 'capa') {
      const cv = COVER[colecao];
      node.className = `lv-page lv-capa ${cv.cls}`;
      node.innerHTML = `<div class="cv-in"><img class="cv-logo" src="assets/logo-nome.png" alt="Beaterista" width="200" height="57"><h2>${cv.titulo}</h2><p>${cv.sub}</p><div class="cv-ring" style="--p:${Math.round((tot.got / tot.total) * 100)}"><b>${tot.got}</b><span>de ${tot.total}</span></div><small>deslize pra folhear ›</small></div>${deco(colecao)}`;
      return;
    }
    if (p.tipo === 'indice') {
      const by = new Map(); for (const c of cards) { const o = by.get(c.artista_banda) || { n: 0, g: 0 }; o.n++; if (st.pasted[c.codigo]) o.g++; by.set(c.artista_banda, o); }
      node.innerHTML = `<header class="lv-head"><b>sumário</b><span>${tot.got}/${tot.total}</span></header><ol class="lv-ix">${[...by].map(([a, o]) => `<li><button type="button" data-a="${a.replace(/"/g, '&quot;')}" class="${o.g === o.n ? 'full' : ''}"><span>${a}</span><em>${o.g}/${o.n}</em></button></li>`).join('')}</ol>`;
      node.querySelectorAll('button[data-a]').forEach((b) => b.addEventListener('click', () => go(pageOfArtist(b.dataset.a))));
      return;
    }
    node.replaceChildren(h('header', { class: 'lv-head' }, h('b', {}, colecao.toLowerCase()), h('span', {}, `pág ${i - 1}`)), h('div', { class: 'lv-slots' }, p.cards.map((e, k) => slot(e, i, k))));
    drawn.add(i);
    node.insertAdjacentHTML('beforeend', deco(`${colecao}${i}`));
  }
  const ensure = (i) => { for (const j of [i - 1, i, i + 1]) if (j >= 0 && j < pages.length && !rendered.has(j)) { rendered.add(j); draw(j); } };
  const W = () => track.clientWidth || 1;
  function go(i, smooth = true) { i = Math.max(0, Math.min(pages.length - 1, i)); ensure(i); track.scrollTo({ left: i * W(), behavior: smooth && !reduzir ? 'smooth' : 'auto' }); }
  function setCur(i) {
    cur = i; ensure(i);
    label.textContent = pages[i].tipo === 'pagina' ? `pág ${i - 1} de ${pages.length - 2}` : pages[i].tipo === 'capa' ? 'capa' : 'sumário';
    prev.disabled = i === 0; next.disabled = i === pages.length - 1;
    nodes.forEach((n, j) => n.classList.toggle('in', Math.abs(j - i) === 0));
  }
  let tm; track.addEventListener('scroll', () => { clearTimeout(tm); tm = setTimeout(() => { const i = Math.round(track.scrollLeft / W()); if (i !== cur) setCur(i); }, 60); }, { passive: true });
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
  setCur(0);
  return {
    el, colecao, pageOfArtist, go, current: () => cur,
    /** Estado novo (colou, abriu pacote): redesenha só as páginas já abertas, sem perder o lugar. */
    update(ns, justPasted = null) { st = ns; last = justPasted; for (const j of rendered) draw(j); setCur(cur); if (last) setTimeout(() => { last = null; }, 900); },
    firstMissing: () => { const c = cards.find((x) => !st.pasted[x.codigo]); return c ? pages.findIndex((p) => p.tipo === 'pagina' && p.cards.includes(c)) : 0; },
  };
}
