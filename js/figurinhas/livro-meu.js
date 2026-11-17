// "Meu álbum" no formato de livro (pedido da Bea, nov/2026): capa, página "como funciona" e páginas de colagem com 4 espaços,
// do mesmo jeito dos álbuns oficiais (papel quadriculado, fitas, folhear deslizando). Só desenha: quem guarda e cola é minhas.js.
import { h } from '../util.js';
import * as O from './ornaments.js';
import { TAPES, rot, deco } from './livro.js';
import { ESPACOS } from './minhas-regras.js';

export const POR_PAGINA = 4;
export const PAGINAS_LIVRO = Math.ceil(ESPACOS / POR_PAGINA); // 42 espaços = 11 páginas (a última com 2)
const ANTES = 2; // capa + "como funciona"
export const paginaDoEspaco = (n) => ANTES + Math.ceil(n / POR_PAGINA) - 1;

const K = '#14111a', CR = '#fbf6ea', NAVY = '#17224a', RED = '#c4182c', YEL = '#e9b824';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Capa: caderno de colagem com o Paul tirando selfie, molduras vazias e o placar. */
function capaSVG(got, total, nome) {
  const nm = esc((nome || '').trim().slice(0, 14));
  const moldura = (x, y, r, n) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-4" y="-4" width="98" height="118" fill="#fff" stroke="${K}" stroke-opacity=".25"/><rect x="6" y="6" width="78" height="82" fill="none" stroke="${K}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="5 5"/><text x="45" y="62" font-family="'Anton',sans-serif" font-size="40" text-anchor="middle" fill="${K}" opacity=".22">${n}</text><rect x="24" y="-12" width="44" height="17" fill="${[RED, YEL, NAVY][n % 3]}" opacity=".85" transform="rotate(-5 46 -4)"/></g>`;
  return `<svg class="cv-art" viewBox="0 0 360 610" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="mg" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#7f95b8" stroke-opacity=".28"/></pattern><filter id="ms"><feDropShadow dx="2" dy="5" stdDeviation="3" flood-color="#000" flood-opacity=".35"/></filter></defs>
  <rect width="360" height="610" fill="#f1e6cc"/><rect width="360" height="610" fill="url(#mg)"/>
  <rect width="360" height="196" fill="${NAVY}"/><rect y="196" width="360" height="9" fill="${RED}"/>
  <text x="180" y="52" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="12" letter-spacing="4" text-anchor="middle" fill="${YEL}" textLength="270" lengthAdjust="spacing">BEATERISTA · COLEÇÃO PESSOAL</text>
  <text x="180" y="150" font-family="'Anton',sans-serif" font-size="92" text-anchor="middle" fill="${CR}" stroke="${K}" stroke-width="5" paint-order="stroke" stroke-linejoin="round" textLength="300" lengthAdjust="spacingAndGlyphs">MEU ÁLBUM</text>
  <text x="180" y="180" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="12" letter-spacing="4" text-anchor="middle" fill="${CR}" opacity=".9">${nm ? `DE ${nm.toUpperCase()}` : 'AS MINHAS CARTINHAS'}</text>
  <g filter="url(#ms)">${moldura(22, 236, -6, 1)}${moldura(128, 252, 4, 2)}${moldura(234, 230, -3, 3)}</g>
  <image href="assets/paul/colorido/paul-selfie.webp" x="150" y="372" width="200" height="200" preserveAspectRatio="xMidYMax meet"/>
  <g transform="translate(76 482) rotate(-8)" filter="url(#ms)"><circle r="52" fill="${YEL}" stroke="${K}" stroke-width="3.5"/><text y="6" font-family="'Anton',sans-serif" font-size="46" fill="${K}" text-anchor="middle">${got}</text><text y="28" font-family="'Hanken Grotesk',sans-serif" font-weight="800" font-size="11" fill="${K}" text-anchor="middle" letter-spacing="1">DE ${total}</text></g>
  <text x="30" y="566" font-family="'Permanent Marker',cursive" font-size="21" fill="${RED}" transform="rotate(-3 30 566)">só as minhas!</text></svg>`;
}

const COMO = `<header class="lv-head"><b>meu álbum</b><span>como funciona</span></header>
<div class="lv-intro">
 <h3>vire figurinha também!</h3>
 <p><b>1.</b> No <b>Perfil</b>, escolha uma foto, um modelo de cartinha e escreva o nome.</p>
 <p><b>2.</b> A cartinha aparece em <b>"pra colar"</b>, em cima do livro. Toque nela.</p>
 <p><b>3.</b> Toque num <b>espaço vazio</b> pra colar. Pronto: ela fica no seu livro!</p>
 <div class="lv-intro-paul"><img src="assets/paul/colorido/paul-selfie.webp" alt="" width="120" height="120" loading="lazy"><p><b>só neste celular.</b> O livro é só seu: não aparece em outro aparelho nem pra outra pessoa.</p></div>
 <a class="btn primary wide lv-intro-cta" href="#/perfil">criar uma cartinha</a>
</div>`;

/**
 * Livro. `el` vai pra tela; `render({ nome, presas, urls, escolhida, novo, aoEspaco, aoAbrir })` redesenha tudo (sem perder a página),
 * `presas` = cartinhas coladas ({ id, nome, slot }), `urls` = { id: url da imagem }.
 */
export function livroMeu({ reduzir = false } = {}) {
  const total = 2 + PAGINAS_LIVRO; let cur = 0;
  const track = h('div', { class: 'lv-track', tabindex: '0', 'aria-label': 'Meu álbum: deslize para folhear' });
  const el = h('div', { class: `lv lv-meu${reduzir ? ' lv-calm' : ''}` });
  const label = h('span', { class: 'lv-label', 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'lv-nav', 'aria-label': 'Página anterior', onclick: () => go(cur - 1) }, '‹');
  const next = h('button', { type: 'button', class: 'lv-nav', 'aria-label': 'Próxima página', onclick: () => go(cur + 1) }, '›');
  el.append(track, h('div', { class: 'lv-bar' }, prev, label, next, h('button', { type: 'button', class: 'lv-nav lv-idx', 'aria-label': 'como funciona', onclick: () => go(1) }, '?')));
  const W = () => track.clientWidth || 1;
  function go(i, smooth = true) { i = Math.max(0, Math.min(total - 1, i)); track.scrollTo({ left: i * W(), behavior: smooth && !reduzir ? 'smooth' : 'auto' }); setCur(i); }
  function setCur(i) { cur = i; label.textContent = i === 0 ? 'capa' : i === 1 ? 'como funciona' : `pág ${i - 1} de ${PAGINAS_LIVRO}`; prev.disabled = i === 0; next.disabled = i === total - 1; }
  let tm; track.addEventListener('scroll', () => { clearTimeout(tm); tm = setTimeout(() => { const i = Math.round(track.scrollLeft / W()); if (i !== cur) setCur(i); }, 60); }, { passive: true });
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
  let drawnOnce = false;
  function render({ nome = '', presas = [], urls = {}, escolhida = null, novo = 0, aoEspaco = () => {}, aoAbrir = () => {} } = {}) {
    const pg = [];
    const capa = h('section', { class: 'lv-page lv-capa cv-meu', 'aria-label': 'capa' }); capa.innerHTML = `${capaSVG(presas.length, ESPACOS, nome)}<small class="cv-hint">deslize pra folhear ›</small>`; pg.push(capa);
    const como = h('section', { class: 'lv-page lv-intro-pg', 'aria-label': 'como funciona' }); como.innerHTML = COMO + deco('meu-como'); pg.push(como);
    for (let p = 0; p < PAGINAS_LIVRO; p++) {
      const de = p * POR_PAGINA + 1, slots = [];
      for (let n = de; n < de + POR_PAGINA && n <= ESPACOS; n++) {
        const it = presas.find((x) => x.slot === n), k = n - de, code = `meu${n}`;
        const t = TAPES[O.hashSeed(code) % TAPES.length], t2 = TAPES[(O.hashSeed(code) + 2) % TAPES.length];
        const b = h('button', { type: 'button', class: `lv-slot ${it ? 'got' : escolhida ? 'hand' : 'empty'}${novo === n ? ' pop' : ''}`, style: `--rot:${rot(code)}deg;--d:${k * 90}ms`, 'data-slot': String(n),
          'aria-label': it ? `espaço ${n}: ${it.nome || 'cartinha'}, abrir` : `espaço ${n}, vazio${escolhida ? ': colar aqui' : ''}`, onclick: () => (it ? aoAbrir(it) : aoEspaco(n)) });
        b.innerHTML = `<i class="lv-tape" style="background:${t}"></i><i class="lv-tape b" style="background:${t2}"></i>`
          + (it ? `<div class="lv-card">${urls[it.id] ? `<img src="${urls[it.id]}" alt="${esc(it.nome || 'cartinha')}" width="360" height="475">` : ''}</div>` : `<div class="lv-hole"><b>${String(n).padStart(2, '0')}</b><span>${escolhida ? 'colar!' : '+'}</span></div>`)
          + `<span class="lv-cap">${it ? esc(it.nome || '') : '— — —'}</span>`;
        slots.push(b);
      }
      const page = h('section', { class: 'lv-page', 'aria-label': `Página ${p + 1}` }, h('header', { class: 'lv-head' }, h('b', {}, nome ? `álbum de ${nome}`.toLowerCase() : 'meu álbum'), h('span', {}, `pág ${p + 1} de ${PAGINAS_LIVRO}`)), h('div', { class: 'lv-slots' }, ...slots));
      page.insertAdjacentHTML('beforeend', deco(`meu${p}`)); pg.push(page);
    }
    track.replaceChildren(...pg); setCur(cur);
    requestAnimationFrame(() => { track.scrollTo({ left: cur * W(), behavior: 'auto' }); });
    drawnOnce = true;
  }
  return { el, render, go, current: () => cur, jump: (i) => { cur = Math.max(0, Math.min(total - 1, i)); setCur(cur); requestAnimationFrame(() => track.scrollTo({ left: cur * W(), behavior: 'auto' })); }, desenhado: () => drawnOnce };
}
