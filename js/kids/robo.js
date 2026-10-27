// Robôterista: o robô baterista que acompanha a criança. Humor muda com o jogo (feliz, comemora, pensa, ops, dorme).
// Desenho nosso (SVG), sem imagem de fora. Com mais estrelas ganha enfeites (faixa, boné, coroa).
import { h } from '../util.js';

export const MOODS = ['happy', 'cheer', 'think', 'oops', 'sleep'];
/** Enfeite pela quantidade de estrelas: 0 nada, 1 faixa (10), 2 boné (40), 3 coroa (100). */
export const tierOf = (stars) => (stars >= 100 ? 3 : stars >= 40 ? 2 : stars >= 10 ? 1 : 0);

const EYES = {
  happy: '<circle class="rb-eye" cx="50" cy="48" r="6"/><circle class="rb-eye" cx="70" cy="48" r="6"/>',
  cheer: '<path class="rb-line" d="M43 52q7-12 14 0M63 52q7-12 14 0"/>',
  think: '<circle class="rb-eye" cx="50" cy="48" r="6"/><circle class="rb-eye" cx="70" cy="46" r="8"/><path class="rb-line" d="M62 34l16-4"/>',
  oops: '<path class="rb-line" d="M44 42l12 12M56 42l-12 12M64 42l12 12M76 42l-12 12"/>',
  sleep: '<path class="rb-line" d="M43 50h14M63 50h14"/>',
};
const MOUTH = {
  happy: '<path class="rb-line" d="M50 60q10 8 20 0"/>',
  cheer: '<path class="rb-fill" d="M48 58q12 16 24 0z"/>',
  think: '<path class="rb-line" d="M52 62h16"/>',
  oops: '<path class="rb-line" d="M48 64q4-6 8 0t8 0 8 0"/>',
  sleep: '<ellipse class="rb-fill" cx="60" cy="62" rx="4" ry="3"/>',
};
const EXTRA = {
  think: '<g class="rb-bubble"><circle cx="100" cy="14" r="11" fill="#fffdf8" stroke="#1b1818" stroke-width="3"/><text x="100" y="19" text-anchor="middle" font-size="15" font-weight="700" fill="#1b1818">?</text></g>',
  sleep: '<text class="rb-z" x="96" y="22" font-size="16" font-weight="700" fill="#1b1818">z</text><text class="rb-z z2" x="104" y="12" font-size="12" font-weight="700" fill="#1b1818">z</text>',
  cheer: '<path class="rb-spark" d="M12 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM108 36l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e3a82f" stroke="#1b1818" stroke-width="1.5"/>',
};
const HAT = [
  '',
  '<path d="M26 32h68" stroke="#e3a82f" stroke-width="7" stroke-linecap="round"/><circle cx="94" cy="32" r="4" fill="#d92031"/>',
  '<path d="M28 30q32-26 64 0z" fill="#1b1818" stroke="#1b1818" stroke-width="3"/><path d="M24 30h74" stroke="#1b1818" stroke-width="5" stroke-linecap="round"/>',
  '<path d="M30 28l6-16 12 10 12-14 12 14 12-10 6 16z" fill="#e3a82f" stroke="#1b1818" stroke-width="3" stroke-linejoin="round"/>',
];

export function roboMarkup(mood = 'happy', tier = 0) {
  const arms = mood === 'cheer'
    ? '<g class="rb-arm l"><path d="M38 90L16 66" class="rb-limb"/><path d="M16 66l-8-14" class="rb-stick"/></g><g class="rb-arm r"><path d="M82 90l22-24" class="rb-limb"/><path d="M104 66l8-14" class="rb-stick"/></g>'
    : '<g class="rb-arm l"><path d="M38 92L20 112" class="rb-limb"/><path d="M20 112l-8 12" class="rb-stick"/></g><g class="rb-arm r"><path d="M82 92l18 20" class="rb-limb"/><path d="M100 112l8 12" class="rb-stick"/></g>';
  return `<svg viewBox="0 0 120 140" role="img" aria-label="Robôterista" class="rb mood-${mood}">
    <g class="rb-body">
      <line x1="60" y1="24" x2="60" y2="12" stroke="#1b1818" stroke-width="4" stroke-linecap="round"/><circle class="rb-led" cx="60" cy="9" r="6" fill="#d92031" stroke="#1b1818" stroke-width="3"/>
      <rect x="16" y="40" width="10" height="22" rx="4" fill="#e3a82f" stroke="#1b1818" stroke-width="3"/><rect x="94" y="40" width="10" height="22" rx="4" fill="#e3a82f" stroke="#1b1818" stroke-width="3"/>
      <rect x="26" y="24" width="68" height="54" rx="16" fill="#f3eee4" stroke="#1b1818" stroke-width="4"/>
      <rect x="34" y="32" width="52" height="38" rx="10" fill="#1b1818"/>
      ${EYES[mood] || EYES.happy}${MOUTH[mood] || MOUTH.happy}
      <rect x="36" y="80" width="48" height="38" rx="12" fill="#d92031" stroke="#1b1818" stroke-width="4"/>
      <circle cx="60" cy="99" r="11" fill="#fffdf8" stroke="#1b1818" stroke-width="3"/><path d="M54 99h12M60 93v12" stroke="#1b1818" stroke-width="2.5" stroke-linecap="round"/>
      ${arms}
      <rect x="42" y="118" width="12" height="14" rx="4" fill="#1b1818"/><rect x="66" y="118" width="12" height="14" rx="4" fill="#1b1818"/>
      ${HAT[tier] || ''}
    </g>${EXTRA[mood] || ''}</svg>`;
}
/** Elemento do robô. `say` (opcional) vira um balão de fala ao lado. */
export function robo({ mood = 'happy', tier = 0, size = 96, say = '' } = {}) {
  const box = h('div', { class: 'rb-wrap', style: `--rb:${size}px` }); const fig = h('div', { class: 'rb-fig' });
  const bubble = h('p', { class: 'rb-say', hidden: !say, 'aria-live': 'polite' }, say);
  box.append(fig, bubble);
  const api = { el: box, set(m, text) { fig.innerHTML = roboMarkup(m, tier); if (text != null) { bubble.textContent = text; bubble.hidden = !text; } } };
  api.set(mood, say);
  return api;
}
