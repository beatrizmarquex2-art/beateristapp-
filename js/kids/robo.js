// Paul: o robô baterista que acompanha a criança. Humor muda com o jogo (feliz, comemora, pensa, ops, dorme).
// Desenho em SVG a partir do rabisco da Bea (boné vermelho virado, fone com nota, tela preta). Com mais estrelas ganha adesivos (estrela, estrelas, coroa).
import { h } from '../util.js';

export const MOODS = ['happy', 'cheer', 'think', 'oops', 'sleep'];
/** Enfeite pela quantidade de estrelas: 0 nada, 1 estrela (10), 2 duas (40), 3 coroa (100). */
export const tierOf = (stars) => (stars >= 100 ? 3 : stars >= 40 ? 2 : stars >= 10 ? 1 : 0);

const INK = '#1b1818', RED = '#a31d30', VINHO = '#6e1423', NAVY = '#14284b', CREAM = '#f3eee4', GOLD = '#e3a82f';
// carinha (olhos e boca em creme sobre a tela preta, centro em 80,71)
const FACE = {
  happy: `<path d="M50 68q8-12 16 0M94 68q8-12 16 0" class="rb-ln"/><path d="M66 79q14 15 28 0z" fill="${CREAM}"/>`,
  cheer: `<path d="M50 62l16 8-16 8M110 62l-16 8 16 8" class="rb-ln"/><path d="M64 80q16 17 32 0z" fill="${CREAM}"/>`,
  think: `<rect x="53" y="56" width="10" height="24" rx="3" fill="${CREAM}"/><rect x="97" y="56" width="10" height="24" rx="3" fill="${CREAM}"/><path d="M70 88h20" class="rb-ln"/>`,
  oops: `<path d="M50 72h16M94 72h16" class="rb-ln"/><path d="M64 88q4-6 8 0t8 0 8 0 8 0" class="rb-ln"/>`,
  sleep: `<path d="M50 70q8 7 16 0M94 70q8 7 16 0" class="rb-ln"/><ellipse cx="80" cy="86" rx="5" ry="3.5" fill="${CREAM}"/>`,
};
const EXTRA = {
  think: `<g fill="none" stroke="${NAVY}" stroke-width="3.5" stroke-linecap="round"><path d="M134 22q0-10 9-10t9 8q0 6-7 9v5"/><circle cx="145" cy="45" r=".5"/></g>`,
  cheer: `<g stroke="${GOLD}" stroke-width="4" stroke-linecap="round"><path d="M10 40l12-26M150 40l-12-26"/></g><path d="M20 94l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM140 90l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${GOLD}" stroke="${INK}" stroke-width="1"/>`,
  oops: `<path d="M126 36q5 8 0 12-5-4 0-12z" fill="${NAVY}" stroke="${INK}" stroke-width="1.5"/>`,
  sleep: `<g font-family="Permanent Marker, cursive" font-weight="700" fill="${NAVY}"><text class="rb-z" x="130" y="30" font-size="20">z</text><text class="rb-z z2" x="144" y="16" font-size="15">z</text></g>`,
  happy: `<path d="M18 30v-8m-4 4h8M146 36l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" stroke="${NAVY}" stroke-width="2.5" stroke-linecap="round" fill="${NAVY}"/>`,
};
const NOTE = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0v-12l9-2v12" fill="none" stroke="${CREAM}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="-2.4" cy="0" rx="3.4" ry="2.6" fill="${CREAM}"/><ellipse cx="6.6" cy="-2" rx="3.4" ry="2.6" fill="${CREAM}"/></g>`;
const STICKER = [
  '',
  '<path d="M16 3l3.8 8 8.7 1.1-6.4 6 1.7 8.7L16 22.5 8.2 26.8l1.7-8.7-6.4-6 8.7-1.1z" fill="#e3a82f" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M12 2l3.2 6.7 7.3.9-5.4 5 1.4 7.3L12 18.2l-6.5 3.7 1.4-7.3-5.4-5 7.3-.9z" fill="#e3a82f" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/><path d="M30 12l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7z" fill="#a31d30" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M4 26L2 8l9 8 7-12 7 12 9-8-2 18z" fill="#e3a82f" stroke="#1b1818" stroke-width="2.5" stroke-linejoin="round"/><circle cx="18" cy="5" r="2.5" fill="#a31d30" stroke="#1b1818" stroke-width="1.5"/>',
];

/** Paul em SVG (desenho nosso, traço de caneta tremido), pelo humor. */
export function roboMarkup(mood = 'happy', tier = 0) {
  const m = FACE[mood] ? mood : 'happy';
  const cup = (x) => `<circle cx="${x}" cy="72" r="16" fill="${NAVY}" stroke="${INK}" stroke-width="3.5"/><circle cx="${x}" cy="72" r="10.5" fill="none" stroke="${GOLD}" stroke-width="2.5"/>${NOTE(x - 2, 77, .75)}`;
  const st = STICKER[tier] ? `<svg class="rb-sticker t${tier}" viewBox="0 0 40 30" aria-hidden="true">${STICKER[tier]}</svg>` : '';
  return `<span class="rb mood-${m}"><svg viewBox="0 0 160 152" role="img" aria-label="Paul" class="rb-svg">
    <defs><filter id="rbw" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs>
    <g class="rb-body" filter="url(#rbw)" stroke-linejoin="round" stroke-linecap="round">
      <path d="M36 152l5-40q39-14 78 0l5 40z" fill="${NAVY}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M62 108q18 17 36 0l5 6q-23 22-46 0z" fill="${RED}" stroke="${INK}" stroke-width="3"/>
      <path d="M69 116q11 6 22 0l-4 36H73z" fill="${CREAM}" stroke="${INK}" stroke-width="2.5"/>${NOTE(78, 140, .7)}
      <path d="M66 122v14M94 122v14" stroke="${GOLD}" stroke-width="2.5"/>
      <path d="M36 128l-6-14M124 128l6-14" stroke="${RED}" stroke-width="5"/>
      ${cup(30)}${cup(130)}
      <rect x="33" y="36" width="94" height="72" rx="26" fill="${CREAM}" stroke="${INK}" stroke-width="3.5"/>
      <rect x="41" y="45" width="78" height="53" rx="18" fill="#141010"/>
      ${FACE[m].replace(/class="rb-ln"/g, `fill="none" stroke="${CREAM}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"`)}
      <path d="M28 54Q31 14 80 12Q130 14 133 52Q82 36 28 54z" fill="${RED}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M36 44l10-24M48 46l14-30M62 40l10-24M92 38l8-22M106 42l10-18" stroke="${VINHO}" stroke-width="2.4" fill="none"/>
      <path d="M58 20q22-8 44 0l-4 14q-18-6-36 0z" fill="${VINHO}" stroke="${INK}" stroke-width="2"/>${NOTE(75, 31, .62).replace(new RegExp(CREAM, 'g'), GOLD)}
      <path d="M28 54L2 70l34 -4z" fill="${NAVY}" stroke="${INK}" stroke-width="3.5"/><circle cx="80" cy="11" r="4" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
    </g>${EXTRA[m] || ''}</svg>${st}</span>`;
}
/** Elemento do Paul. `say` (opcional) vira um balão de fala ao lado. */
export function robo({ mood = 'happy', tier = 0, size = 96, say = '' } = {}) {
  const box = h('div', { class: 'rb-wrap', style: `--rb:${Math.round(size * 1.25)}px` }); const fig = h('div', { class: 'rb-fig' });
  const bubble = h('p', { class: 'rb-say', hidden: !say, 'aria-live': 'polite' }, say);
  box.append(fig, bubble);
  const api = { el: box, set(m, text) { fig.innerHTML = roboMarkup(m, tier); if (text != null) { bubble.textContent = text; bubble.hidden = !text; } } };
  api.set(mood, say);
  return api;
}

/** Paul como arquivo SVG independente (com os estilos dentro), pra desenhar no PDF. */
export function roboStandalone(mood = 'happy') {
  const m = roboMarkup(mood, 0); const svg = m.slice(m.indexOf('<svg'), m.indexOf('</svg>') + 6);
  return svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="304" ');
}
