// Ícones de "quem joga?": uma pessoa, duas pessoas, um celular (linhas simples, na cor do texto) e o rostinho do Paul.
import { h } from '../util.js';

const LINHA = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const SVG = {
  um: LINHA('<circle cx="12" cy="8" r="4"/><path d="M4.500 21c0-4.500 3.300-7 7.500-7s7.500 2.500 7.500 7"/>'),
  dois: LINHA('<circle cx="9" cy="8.500" r="3.500"/><path d="M2.500 20.500c0-4 3-6.300 6.500-6.300s6.500 2.300 6.500 6.300"/><circle cx="17" cy="9.500" r="3"/><path d="M16 14.300c3.600-.3 5.500 1.800 5.500 5.200"/>'),
  celular: LINHA('<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>'),
};
/** `kind`: 'um' | 'dois' | 'celular' | 'paul'. Devolve um <span class="ic-bq"> pronto pra entrar num botão. */
export function bq(kind) {
  const s = h('span', { class: 'ic-bq', 'aria-hidden': 'true' });
  if (kind === 'paul') s.append(h('img', { src: 'assets/paul/e02.webp', alt: '', draggable: 'false' })); else s.innerHTML = SVG[kind] || ''; // SVG interno, nunca dado do usuário
  return s;
}
