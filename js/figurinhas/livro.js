// O "livro" do álbum: capa, sumário por artista e páginas de colagem (4 figurinhas por página, nome do artista embaixo de cada espaço).
// Folheia deslizando (scroll-snap) ou pelos botões. Tudo desenhado aqui: papel, fitas, rabiscos (ornaments.js).
import { h } from '../util.js';
import * as O from './ornaments.js';
import { cardSVG } from './card.js';
import * as L from './album-logic.js';

const PER = 4;
export const TAPES = ['#e9b824', '#c4182c', '#17224a', '#e7d9ae', '#f1b9b0', '#7fb7a4'];
export const rot = (code, k = 1) => ((O.hashSeed(code + k) % 700) / 100 - 3.5).toFixed(2); // -3.5 .. +3.5 graus, sempre o mesmo pra mesma figurinha
const DOODLES = [
  (c) => `<g transform="rotate(${c.r} 0 0)">${O.star(0, 0, 15, '#e9b824', '#14111a', 2.5, -90, c.s)}</g>`,
  (c) => `<g transform="rotate(${c.r}) scale(.38)">${O.note('#14111a')}</g>`,
  (c) => `<g transform="rotate(${c.r}) scale(.2)">${O.bolt('#c4182c', '#14111a', 8)}</g>`,
  (c) => O.sparkle(0, 0, 13, '#fbf6ea', '#14111a'),
  (c) => `<g transform="rotate(${c.r})">${O.scribble('#17224a', 3, 48)}</g>`,
  (c) => `<g transform="rotate(${c.r}) scale(.28)">${O.vinyl('#c4182c', 50)}</g>`,
];
const SPOTS = [[22, 500], [338, 498], [180, 512], [14, 262], [348, 270], [330, 560]]; // nada em cima: o cabeçalho da página fica limpo

/** Páginas de uma coleção: capa, sumário e as páginas de figurinhas, artistas em ordem alfabética (as repetidas ficam juntas). */
export function pagesOf(catalog, colecao) {
  const cards = catalog.filter((c) => c.secao === colecao).sort((a, b) => a.artista_banda.localeCompare(b.artista_banda, 'pt') || a.codigo.localeCompare(b.codigo));
  const pages = [{ tipo: 'capa' }, ...(INTRO[colecao] ? [{ tipo: 'intro' }] : []), { tipo: 'indice' }];
  for (let i = 0; i < cards.length; i += PER) pages.push({ tipo: 'pagina', cards: cards.slice(i, i + PER) });
  return { pages, cards };
}

export function deco(seed) {
  const r = O.rng(O.hashSeed(seed)); const spots = [...SPOTS].sort(() => r() - 0.5).slice(0, 4);
  return `<svg class="lv-deco" viewBox="0 0 360 520" aria-hidden="true">${spots.map(([x, y], i) => `<g transform="translate(${x} ${y})">${DOODLES[Math.floor(r() * DOODLES.length)]({ r: Math.round(r() * 50 - 25), s: i + 3 })}</g>`).join('')}</svg>`;
}

const COVER = {
  Bandas: { titulo: 'Bandas', sub: 'os grupos que fizeram história', cls: 'cv-geral' },
  Beatlemania: { titulo: 'Beatlemania', sub: 'os quatro de Liverpool', cls: 'cv-beatles' },
  Beaterista: { titulo: 'Beaterista & Paul', sub: 'da escola pro seu álbum', cls: 'cv-bea' },
  Artistas: { titulo: 'Artistas', sub: 'cantores e músicos: as raras moram aqui', cls: 'cv-esp' },
};


const K = '#14111a', CR = '#fbf6ea', RED = '#c4182c', NAVY = '#17224a', YEL = '#e9b824';
const star = (x, y, r, f, sw = 2.2) => `<path transform="translate(${x} ${y})" fill="${f}" stroke="${K}" stroke-width="${sw}" stroke-linejoin="round" d="M0 ${-r}L${r * 0.3} ${-r * 0.3}L${r} 0L${r * 0.3} ${r * 0.3}L0 ${r}L${-r * 0.3} ${r * 0.3}L${-r} 0L${-r * 0.3} ${-r * 0.3}Z"/>`;
const placar = (cx, cy, got, total, r = 46, fundo = NAVY) => `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="${fundo}" stroke="${K}" stroke-width="3"/><text y="${r * -0.04}" font-family="'Anton',sans-serif" font-size="${r * 0.83}" fill="${CR}" text-anchor="middle">${got}</text><text y="${r * 0.42}" font-family="'Hanken Grotesk',sans-serif" font-weight="700" font-size="${r * 0.27}" fill="${CR}" text-anchor="middle" letter-spacing="1">de ${total}</text></g>`;
const dots = (cor, op) => Array.from({ length: 13 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<circle cx="${c * 44 + (r % 2 ? 22 : 0)}" cy="${r * 50 + 10}" r="${1.6 + (r / 13) * 4.2}" fill="${cor}" opacity="${op}"/>`).join('')).join('');
/** Beatlemania com o submarino amarelo: o bumbo sobe, o submarino atravessa o mar embaixo. */
function beatlesArt(got, total) {
  const cy = 300, R = 112, k = R / 140;
  const rim = Array.from({ length: 36 }, (_, i) => `<line x1="180" y1="${cy}" x2="180" y2="${cy - R + 8 * k}" stroke="${i % 2 ? RED : CR}" stroke-width="${9.5 * k}" transform="rotate(${i * 10} 180 ${cy})"/>`).join('');
  const onda = (y, c, op) => `<path d="M-10 ${y} q 22 -14 45 0 t 45 0 t 45 0 t 45 0 t 45 0 t 45 0 t 45 0 t 45 0 V 620 H -10 Z" fill="${c}" opacity="${op}"/>`;
  const nomes = ['JOHN', 'PAUL', 'GEORGE', 'RINGO'].map((n, i) => `<text x="${54 + i * 84}" y="566" font-family="'Anton',sans-serif" font-size="17" letter-spacing="1.5" fill="${i === 1 ? '#ffd21f' : CR}" text-anchor="middle">${n}</text>`).join('');
  return `<svg class="cv-art" viewBox="0 0 360 610" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="360" height="610" fill="${NAVY}"/>${dots(CR, 0.07)}
  <path d="M-10 128 L370 96 L370 150 L-10 182 Z" fill="${RED}"/><path d="M-10 190 L370 158" stroke="${YEL}" stroke-width="4" fill="none"/>
  <text x="180" y="78" font-family="'Anton',sans-serif" font-size="54" text-anchor="middle" fill="${CR}" stroke="${K}" stroke-width="6" paint-order="stroke" stroke-linejoin="round" textLength="320" lengthAdjust="spacingAndGlyphs">BEATLEMANIA</text>
  <text x="180" y="143" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="13" letter-spacing="5" text-anchor="middle" fill="${CR}" transform="rotate(-4.8 180 140)">OS QUATRO DE LIVERPOOL</text>
  <circle cx="180" cy="${cy}" r="${R + 5}" fill="#0b1026" opacity=".55" transform="translate(5 8)"/><circle cx="180" cy="${cy}" r="${R}" fill="${CR}" stroke="${K}" stroke-width="4"/>${rim}
  <circle cx="180" cy="${cy}" r="${118 * k}" fill="${YEL}" stroke="${K}" stroke-width="4"/><circle cx="180" cy="${cy}" r="${105 * k}" fill="${CR}" stroke="${K}" stroke-width="3"/>
  <path id="bt-top" d="M ${180 - 70 * k * 1.22} ${cy} A ${86 * k} ${86 * k} 0 0 1 ${180 + 70 * k * 1.22} ${cy}" fill="none"/><path id="bt-bot" d="M ${180 - 100 * k} ${cy} A ${100 * k} ${100 * k} 0 0 0 ${180 + 100 * k} ${cy}" fill="none"/>
  <text font-family="'Anton',sans-serif" font-size="17" letter-spacing="2.5" fill="${K}" text-anchor="middle"><textPath href="#bt-top" startOffset="50%">THE BEATLES</textPath></text>
  <text font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="10.5" letter-spacing="3" fill="${RED}" text-anchor="middle"><textPath href="#bt-bot" startOffset="50%">★ BEATERISTA ★</textPath></text>
  ${placar(180, cy - 2, got, total, 38)}
  ${star(38, 232, 12, YEL)}${star(326, 246, 9, CR)}${star(322, 392, 10, YEL)}
  ${onda(470, '#2f5fb3', 0.55)}${O.submarino(196, 478, 0.72, -5)}${onda(512, '#3f7fd6', 0.75)}${onda(540, '#0f1a3d', 0.9)}${nomes}</svg>`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;');
const titulo = (t, x, y, w, size, fill, st = '') => `<text x="${x}" y="${y}" font-family="'Anton',sans-serif" font-size="${size}" text-anchor="middle" fill="${fill}" ${st} textLength="${w}" lengthAdjust="spacingAndGlyphs">${esc(t)}</text>`;
const FOTOS = 'assets/figurinhas/fotos/';
const VINIL = {
  Bandas: { id: 'ba', nome: 'BANDAS', sub: 'os grupos que fizeram história', cor: RED, tcor: CR, fotos: ['F047'], nomes: ['Queen', 'Nirvana', 'Led Zeppelin', 'Linkin Park'], base: FOTOS },
  Beaterista: { id: 'be', nome: ['BEATERISTA', '& PAUL'], sub: 'exclusivas · da escola pro seu álbum', cor: RED, tcor: CR, bg: ['#ffe27a', '#ffb21f', '#ff7a1a'], txt: NAVY, ac: '#c4182c', fotos: [], foto: 'assets/figurinhas/capa-beaterista-paul.webp', nomes: ['A Bea e o Paul', 'Paul, o robôterista', 'Momentos da escola'], base: FOTOS },
  Artistas: { id: 'ar', nome: 'ARTISTAS', sub: 'cantores e músicos', cor: YEL, tcor: NAVY, fotos: ['F032'], nomes: ['Rita Lee', 'Michael Jackson', 'Pitty', 'Slash'], base: FOTOS },
};
/** Capa "disco de vinil" de Bandas e Artistas (escolha da Bea, nov/2026): o LP sai da capa quadrada com a foto, com a lista das primeiras faixas. */
function vinilArt(got, total, P) {
  const id = P.id + 'c2'; const cx = 214, cy = 252;
  const sulcos = Array.from({ length: 17 }, (_, i) => `<circle cx="${cx}" cy="${cy}" r="${58 + i * 5.4}" fill="none" stroke="${i % 3 ? '#262631' : '#34343f'}" stroke-width="${i % 3 ? 1 : 1.6}"/>`).join('');
  const defs = `<radialGradient id="${id}g" cx="30%" cy="20%" r="95%"><stop offset="0" stop-color="${(P.bg || [])[0] || '#2d3d7a'}"/><stop offset=".55" stop-color="${(P.bg || [])[1] || NAVY}"/><stop offset="1" stop-color="${(P.bg || [])[2] || '#0b1130'}"/></radialGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient><clipPath id="${id}p"><rect x="24" y="124" width="204" height="204" rx="3"/></clipPath><filter id="${id}s"><feDropShadow dx="6" dy="10" stdDeviation="7" flood-color="#000" flood-opacity=".55"/></filter>`;
  const lista = P.nomes.slice(0, 3).map((n, i) => `<text x="34" y="${542 + i * 17}" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="11.5" letter-spacing="2" fill="${P.txt || CR}"><tspan fill="${P.ac || YEL}">0${i + 1}</tspan>  ${esc(n.toUpperCase())}</text>`).join('');
  return `<svg class="cv-art" viewBox="0 0 360 610" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs><rect width="360" height="610" fill="url(#${id}g)"/>${[...Array(9)].map((_, i) => `<circle cx="${20 + i * 42}" cy="${22 + (i % 2) * 14}" r="2" fill="${CR}" opacity=".22"/>`).join('')}
  <text x="26" y="64" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="11" letter-spacing="5" fill="${P.ac || YEL}">BEATERISTA RECORDS · LADO A</text>
  <g filter="url(#${id}s)"><circle cx="${cx}" cy="${cy}" r="146" fill="#0c0c11"/></g>${sulcos}<circle cx="${cx}" cy="${cy}" r="146" fill="url(#${id}b)"/><circle cx="${cx}" cy="${cy}" r="146" fill="none" stroke="#000" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="50" fill="${P.cor}" stroke="#000" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="48" fill="none" stroke="${P.tcor}" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="2 5"/>
  <text x="${cx}" y="${cy - 8}" font-family="'Anton',sans-serif" font-size="32" fill="${P.tcor}" text-anchor="middle">${got}</text><text x="${cx}" y="${cy + 10}" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="10" fill="${P.tcor}" text-anchor="middle" letter-spacing="1">DE ${total}</text><circle cx="${cx}" cy="${cy + 26}" r="4" fill="#0c0c11"/>
  <g transform="rotate(-4 126 226)" filter="url(#${id}s)"><rect x="16" y="116" width="220" height="220" fill="${CR}"/><g clip-path="url(#${id}p)"><image href="${P.foto || `${P.base}${P.fotos[0]}.jpeg`}" x="24" y="124" width="204" height="204" preserveAspectRatio="xMidYMid slice"/></g><rect x="24" y="124" width="204" height="204" fill="none" stroke="${K}" stroke-opacity=".5" stroke-width="1.5"/>${star(226, 126, 14, YEL, 2.4, 14)}</g>
  ${Array.isArray(P.nome) ? P.nome.map((t, i) => titulo(t, 184, 418 + i * 40, i ? 150 : 232, 40, P.ac || YEL, `stroke="${K}" stroke-width="3" paint-order="stroke" stroke-linejoin="round"`)).join('') : titulo(P.nome, 184, 462, 316, 116, YEL, `stroke="${K}" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`)}
  <line x1="30" y1="476" x2="330" y2="476" stroke="${P.txt || CR}" stroke-opacity=".5" stroke-width="2"/><text x="180" y="498" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="12" letter-spacing="3.2" text-anchor="middle" fill="${P.txt || CR}" textLength="300" lengthAdjust="spacing">${esc(P.sub.toUpperCase())}</text>${lista}</svg>`;
}

/** Página "a história" da Beatlemania: por que os Beatles abrem o álbum e de onde veio o nome do Paul. */
const INTRO = {
  Bandas: `<header class="lv-head"><b>bandas</b><span>nível comum</span></header>
  <div class="lv-intro">
   <h3>música em todo lugar!</h3>
   <p>Tem música no caminho pra escola, na festa, no fone e na aula.</p>
   <p>As cartas <b>comuns</b> lembram a gente de dar valor às bandas e às músicas que já fazem parte da nossa vida.</p>
   <div class="lv-intro-paul"><img src="assets/paul/colorido/paul-ouvindo.webp" alt="" width="120" height="120" loading="lazy"><p><b>colecione todas!</b> Cada banda tem a sua história pra você descobrir.</p></div>
  </div>`,
  Artistas: `<header class="lv-head"><b>artistas</b><span>nível raro</span></header>
  <div class="lv-intro">
   <h3>olhe a banda toda!</h3>
   <p>Quem está na frente chama a atenção primeiro.</p>
   <p>Ouça também quem <b>segura o ritmo</b>, cria a <b>linha de baixo</b>, faz a <b>harmonia</b> e canta junto.</p>
   <p>Cada pessoa ajuda a construir o som da banda. As cartas <b>raras</b> mostram quem faz isso.</p>
   <div class="lv-intro-paul"><img src="assets/paul/colorido/paul-baquetas-pra-cima.webp" alt="" width="120" height="120" loading="lazy"><p><b>ouvido de músico:</b> da próxima vez, tente escutar só o baixo.</p></div>
  </div>`,
  Beaterista: `<header class="lv-head"><b>beaterista & paul</b><span>nível exclusivo</span></header>
  <div class="lv-intro">
   <h3>da escola pro seu álbum!</h3>
   <p>Estas figurinhas guardam <b>momentos da Beaterista</b> e <b>aventuras do Robôterista Paul</b>.</p>
   <p>São <b>exclusivas</b>: só quem joga e descobre os segredos do Paul consegue juntar todas.</p>
   <div class="lv-intro-paul"><img src="assets/paul/colorido/paul-selfie.webp" alt="" width="120" height="120" loading="lazy"><p><b>psiu!</b> O Paul esconde surpresas por todo o app.</p></div>
  </div>`,
  Beatlemania: `<header class="lv-head"><b>beatlemania</b><span>a história</span></header>
  <div class="lv-intro">
   <h3>por que eles abrem o álbum?</h3>
   <p>Em 1960, quatro garotos de Liverpool, na Inglaterra, montaram uma banda: <b>John, Paul, George e Ringo</b>.</p>
   <p>Eles foram a primeira banda a virar febre no mundo inteiro. A gritaria dos fãs era tanta que ganhou nome: <b>Beatlemania</b>.</p>
   <p>Até hoje são gigantes: quase toda banda que você ouve aprendeu alguma coisa com eles.</p>
   <div class="lv-intro-paul"><img src="assets/paul/colorido/paul-guitarra.webp" alt="" width="120" height="120" loading="lazy"><p><b>e o nosso Paul?</b> O Robôterista Paul ganhou esse nome por causa do <b>Paul McCartney</b>, o baixista dos Beatles.</p></div>
  </div>`,
};

export function createBook({ catalog, colecao, state, onPaste, onDetail, reduzir }) {
  const { pages, cards } = pagesOf(catalog, colecao);
  const track = h('div', { class: 'lv-track', tabindex: '0', 'aria-label': `Álbum ${colecao}: deslize para folhear` });
  const el = h('div', { class: `lv lv-${colecao.toLowerCase()}${reduzir ? ' lv-calm' : ''}` });
  const label = h('span', { class: 'lv-label', 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'lv-nav', 'aria-label': 'Página anterior', onclick: () => go(cur - 1) }, '‹');
  const next = h('button', { type: 'button', class: 'lv-nav', 'aria-label': 'Próxima página', onclick: () => go(cur + 1) }, '›');
  const OFF = pages.findIndex((p) => p.tipo === 'pagina'), IDX = pages.findIndex((p) => p.tipo === 'indice'), NPAG = pages.length - OFF; // onde começam as páginas de figurinhas
  const idxBtn = h('button', { type: 'button', class: 'lv-nav lv-idx', onclick: () => go(IDX) }, 'sumário');
  el.append(track, h('div', { class: 'lv-bar' }, prev, label, next, idxBtn));
  let cur = 0, st = state, last = null; const rendered = new Set(), drawn = new Set(); const nodes = pages.map((p, i) => h('section', { class: `lv-page lv-${p.tipo}`, 'data-i': i, 'aria-label': p.tipo === 'pagina' ? `Página ${i - pages.findIndex((q) => q.tipo === 'pagina') + 1}` : p.tipo === 'intro' ? 'a história' : p.tipo }));
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
      if (VINIL[colecao]) { node.className = `lv-page lv-capa cv-vinil`; node.innerHTML = `${vinilArt(tot.got, tot.total, VINIL[colecao])}<small class="cv-hint">deslize pra folhear ›</small>`; return; }
      if (colecao === 'Beatlemania') { node.innerHTML = `${beatlesArt(tot.got, tot.total)}<small class="cv-hint">deslize pra folhear ›</small>`; return; }
      node.innerHTML = `<div class="cv-in"><img class="cv-logo" src="assets/logo-nome.png" alt="Beaterista" width="200" height="57"><h2>${cv.titulo}</h2><p>${cv.sub}</p><div class="cv-ring" style="--p:${Math.round((tot.got / tot.total) * 100)}"><b>${tot.got}</b><span>de ${tot.total}</span></div><small>deslize pra folhear ›</small></div>${deco(colecao)}`;
      return;
    }
    if (p.tipo === 'intro') { node.innerHTML = INTRO[colecao] + deco(`${colecao}intro`); return; }
    if (p.tipo === 'indice') {
      const by = new Map(); for (const c of cards) { const o = by.get(c.artista_banda) || { n: 0, g: 0 }; o.n++; if (st.pasted[c.codigo]) o.g++; by.set(c.artista_banda, o); }
      node.innerHTML = `<header class="lv-head"><b>sumário</b><span>${tot.got}/${tot.total}</span></header><ol class="lv-ix">${[...by].map(([a, o]) => `<li><button type="button" data-a="${a.replace(/"/g, '&quot;')}" class="${o.g === o.n ? 'full' : ''}"><span>${a}</span><em>${o.g}/${o.n}</em></button></li>`).join('')}</ol>`;
      node.querySelectorAll('button[data-a]').forEach((b) => b.addEventListener('click', () => go(pageOfArtist(b.dataset.a))));
      return;
    }
    node.replaceChildren(h('header', { class: 'lv-head' }, h('b', {}, (COVER[colecao] ? COVER[colecao].titulo : colecao).toLowerCase()), h('span', {}, `pág ${i - OFF + 1} de ${NPAG}`)), h('div', { class: 'lv-slots' }, p.cards.map((e, k) => slot(e, i, k))));
    drawn.add(i);
    node.insertAdjacentHTML('beforeend', deco(`${colecao}${i}`));
  }
  const ensure = (i) => { for (const j of [i - 1, i, i + 1]) if (j >= 0 && j < pages.length && !rendered.has(j)) { rendered.add(j); draw(j); } };
  const W = () => track.clientWidth || 1;
  function go(i, smooth = true) { i = Math.max(0, Math.min(pages.length - 1, i)); ensure(i); track.scrollTo({ left: i * W(), behavior: smooth && !reduzir ? 'smooth' : 'auto' }); }
  function setCur(i) {
    cur = i; ensure(i);
    label.textContent = pages[i].tipo === 'pagina' ? `pág ${i - OFF + 1} de ${NPAG}` : pages[i].tipo === 'capa' ? 'capa' : pages[i].tipo === 'intro' ? 'a história' : 'sumário';
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
