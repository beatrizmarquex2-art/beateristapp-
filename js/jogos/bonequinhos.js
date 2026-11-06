// Bonequinhos dos jogos (ícones de "quem joga?"): uma criança de boné, duas crianças, o Paul e um celular. SVG próprio, nas cores do site.
import { h } from '../util.js';

const KID = (cap, shirt, t = '') => `<g${t ? ` transform="${t}"` : ''}><path d="M5 31c0-6.500 5-10 11-10s11 3.500 11 10z" fill="${shirt}"/><circle cx="16" cy="13.500" r="7.500" fill="#f5d9b0"/><path d="M8.500 13c0-5.500 3-9 7.500-9s7.500 3.500 7.500 9z" fill="${cap}"/><path d="M7 13h18" fill="none"/><circle cx="13" cy="16" r=".9" fill="#1b1818" stroke="none"/><circle cx="19" cy="16" r=".9" fill="#1b1818" stroke="none"/><path d="M13 18.500q3 2.300 6 0" fill="none"/></g>`;
const WRAP = (inner) => `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g stroke="#1b1818" stroke-width="1.700" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;
const SVG = {
  um: WRAP(KID('#a31d30', '#17365B')),
  dois: WRAP(`${KID('#e3a82f', '#a31d30', 'translate(11 3) scale(.74)')}${KID('#a31d30', '#17365B', 'translate(-1 5) scale(.78)')}`),
  celular: WRAP('<rect x="9" y="3" width="14" height="26" rx="3.500" fill="#17365B"/><rect x="11.500" y="6.500" width="9" height="15" rx="1.500" fill="#f5d9b0" stroke="none"/><circle cx="16" cy="25" r="1.300" fill="#f5d9b0" stroke="none"/>'),
};
/** `kind`: 'um' | 'dois' | 'celular' | 'paul'. Devolve um <span class="ic-bq"> pronto pra entrar num botão. */
export function bq(kind) {
  const s = h('span', { class: 'ic-bq', 'aria-hidden': 'true' });
  if (kind === 'paul') s.append(h('img', { src: 'assets/paul/e02.webp', alt: '', draggable: 'false' })); else s.innerHTML = SVG[kind] || ''; // SVG interno, nunca dado do usuário
  return s;
}
