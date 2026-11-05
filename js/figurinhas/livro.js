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
  const cards = catalog.filter((c) => c.secao === colecao).sort((a, b) => a.artista_banda.localeCompare(b.artista_banda, 'pt') || a.codigo.localeCompare(b.codigo));
  const pages = [{ tipo: 'capa' }, { tipo: 'indice' }];
  for (let i = 0; i < cards.length; i += PER) pages.push({ tipo: 'pagina', cards: cards.slice(i, i + PER) });
  return { pages, cards };
}

function deco(seed) {
  const r = O.rng(O.hashSeed(seed)); const spots = [...SPOTS].sort(() => r() - 0.5).slice(0, 4);
  return `<svg class="lv-deco" viewBox="0 0 360 520" aria-hidden="true">${spots.map(([x, y], i) => `<g transform="translate(${x} ${y})">${DOODLES[Math.floor(r() * DOODLES.length)]({ r: Math.round(r() * 50 - 25), s: i + 3 })}</g>`).join('')}</svg>`;
}

const COVER = {
  Comum: { titulo: 'Comum', sub: 'o mundo da música', cls: 'cv-geral' },
  Beatlemania: { titulo: 'Beatlemania', sub: 'edição psicodélica', cls: 'cv-beatles' },
  Beaterista: { titulo: 'Beaterista', sub: 'edição exclusiva da Bea', cls: 'cv-bea' },
  Raras: { titulo: 'Raras', sub: 'as mais difíceis de achar', cls: 'cv-esp' },
};


/** Capa psicodélica dos Beatles: raios coloridos, o tambor da banda (desenhado aqui), margaridas e estrelas. */
function beatlesArt(got, total) {
  const rays = Array.from({ length: 28 }, (_, i) => { const a1 = (i * 360) / 28, a2 = ((i + 1) * 360) / 28, p = (a) => `${(180 + 520 * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(335 + 520 * Math.sin((a * Math.PI) / 180)).toFixed(1)}`; return `<polygon points="180,335 ${p(a1)} ${p(a2)}" fill="${['#ff3d81', '#ffb02e', '#ffe94d', '#3ddc97', '#35b4ff', '#9b5cff', '#ff7a3d'][i % 7]}"/>`; }).join('');
  const waves = [150, 190, 235, 290].map((r, i) => `<circle cx="180" cy="335" r="${r}" fill="none" stroke="${['#ffffff', '#14111a', '#ffffff', '#14111a'][i]}" stroke-opacity=".22" stroke-width="${7 - i}" stroke-dasharray="${10 + i * 6} ${8 + i * 3}"/>`).join('');
  const daisy = (x, y, r, c, k = 8) => `<g transform="translate(${x} ${y})">${Array.from({ length: k }, (_, i) => `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.28}" ry="${r * 0.46}" fill="${c}" stroke="#14111a" stroke-width="2" transform="rotate(${(360 / k) * i})"/>`).join('')}<circle r="${r * 0.3}" fill="#ffe94d" stroke="#14111a" stroke-width="2.4"/></g>`;
  const flowers = [[44, 520, 24, '#ff3d81'], [92, 560, 20, '#ffffff'], [150, 546, 26, '#35b4ff'], [214, 562, 21, '#ff7a3d'], [270, 540, 26, '#ffffff'], [322, 566, 22, '#9b5cff'], [22, 585, 18, '#ffe94d'], [338, 520, 22, '#ff3d81']].map(([x, y, r, c]) => daisy(x, y, r, c)).join('');
  const rim = Array.from({ length: 36 }, (_, i) => `<line x1="180" y1="335" x2="180" y2="203" stroke="${i % 2 ? '#c4182c' : '#fbf6ea'}" stroke-width="9.5" stroke-linecap="butt" transform="rotate(${i * 10} 180 335)"/>`).join('');
  return `<svg class="cv-art" viewBox="0 0 360 610" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="360" height="610" fill="#14111a"/>${rays}${waves}
  <circle cx="180" cy="335" r="146" fill="#14111a" opacity=".35" transform="translate(5 8)"/>
  <circle cx="180" cy="335" r="140" fill="#fbf6ea" stroke="#14111a" stroke-width="4"/>${rim}
  <circle cx="180" cy="335" r="118" fill="#e9b824" stroke="#14111a" stroke-width="4"/><circle cx="180" cy="335" r="105" fill="#fbf6ea" stroke="#14111a" stroke-width="3"/>
  <circle cx="180" cy="335" r="70" fill="none" stroke="#c4182c" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/>
  <path id="bt-top" d="M 94 335 A 86 86 0 0 1 266 335" fill="none"/><path id="bt-bot" d="M 80 335 A 100 100 0 0 0 280 335" fill="none"/>
  <text font-family="'Abril Fatface',serif" font-size="21" letter-spacing="2.5" fill="#14111a" text-anchor="middle"><textPath href="#bt-top" startOffset="50%">THE BEATLES</textPath></text>
  <text font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="13" letter-spacing="4" fill="#c4182c" text-anchor="middle"><textPath href="#bt-bot" startOffset="50%">★ BEATERISTA ★</textPath></text>
  <g transform="translate(180 333)"><circle r="46" fill="#17224a" stroke="#14111a" stroke-width="3"/><text y="-2" font-family="'Anton',sans-serif" font-size="38" fill="#fbf6ea" text-anchor="middle">${got}</text><text y="19" font-family="'Hanken Grotesk',sans-serif" font-weight="700" font-size="12" fill="#fbf6ea" text-anchor="middle" letter-spacing="1">de ${total}</text></g>
  ${flowers}
  <g fill="#fbf6ea" stroke="#14111a" stroke-width="2.4" stroke-linejoin="round">${[[34, 150, 18], [330, 186, 15], [58, 262, 11], [312, 300, 12]].map(([x, y, r]) => `<path transform="translate(${x} ${y})" d="M0 ${-r}L${r * 0.3} ${-r * 0.3}L${r} 0L${r * 0.3} ${r * 0.3}L0 ${r}L${-r * 0.3} ${r * 0.3}L${-r} 0L${-r * 0.3} ${-r * 0.3}Z"/>`).join('')}</g>
  <text x="180" y="60" font-family="'Abril Fatface',serif" font-size="37" text-anchor="middle" fill="#fbf6ea" stroke="#14111a" stroke-width="7" paint-order="stroke" stroke-linejoin="round" textLength="332" lengthAdjust="spacingAndGlyphs">BEATLEMANIA</text>
  <text x="180" y="94" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="13" letter-spacing="6" text-anchor="middle" fill="#14111a">EDIÇÃO PSICODÉLICA</text></svg>`;
}

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
      if (colecao === 'Beatlemania') { node.innerHTML = `${beatlesArt(tot.got, tot.total)}<small class="cv-hint">deslize pra folhear ›</small>`; return; }
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
    /** Página que interessa ao abrir: a primeira com figurinha NA MÃO pra colar; senão a primeira com buraco; senão a capa. */
    firstTarget: () => { const c = cards.find((x) => L.canPaste(st, x.codigo)) || cards.find((x) => !st.pasted[x.codigo]); return c ? pages.findIndex((p) => p.tipo === 'pagina' && p.cards.includes(c)) : 0; },
    /** Vai direto pra uma página, sem animação, já marcando como a página atual. */
    jump: (i) => { i = Math.max(0, Math.min(pages.length - 1, i)); ensure(i); setCur(i); track.scrollTo({ left: i * W(), behavior: 'auto' }); },
    firstMissing: () => { const c = cards.find((x) => !st.pasted[x.codigo]); return c ? pages.findIndex((p) => p.tipo === 'pagina' && p.cards.includes(c)) : 0; },
  };
}
