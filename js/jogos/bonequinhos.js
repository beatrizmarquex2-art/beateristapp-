// Ícones de "quem joga?": uma pessoa, duas pessoas, um celular (linhas simples, na cor do texto) e o rostinho do Paul.
import { h } from '../util.js';

const LINHA = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
// Linha azul com um toque de vermelho (.ac = traço de cor, .fa = preenchido); quando o botão está ligado o toque vira amarelo (css/jogos.css).
const SVG = {
  paul: LINHA('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle class="fa" cx="12" cy="3.600" r="1.600"/><circle class="fa" cx="9.500" cy="13" r="1.100"/><circle class="fa" cx="14.500" cy="13" r="1.100"/><path d="M9.500 16.500h5"/>'),
  um: LINHA('<circle class="ac" cx="12" cy="8" r="4"/><path d="M4.500 21c0-4.500 3.300-7 7.500-7s7.500 2.500 7.500 7"/>'),
  dois: LINHA('<circle cx="9" cy="8.500" r="3.500"/><path d="M2.500 20.500c0-4 3-6.300 6.500-6.300s6.500 2.300 6.500 6.300"/><circle class="ac" cx="17" cy="9.500" r="3"/><path class="ac" d="M16 14.300c3.600-.3 5.500 1.800 5.500 5.200"/>'),
  celular: LINHA('<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path class="ac" d="M10.500 8l-1 6M13.500 8l-1 6M9 10h6.500M8.500 12.500H15"/>'),
  mais: LINHA('<circle class="ac" cx="12" cy="7.500" r="3"/><circle cx="5.500" cy="9.500" r="2.300"/><circle cx="18.500" cy="9.500" r="2.300"/><path class="ac" d="M6.500 20c0-3.500 2.400-5.500 5.500-5.500s5.500 2 5.500 5.500"/><path d="M1.500 18c0-2.500 1.600-4 4-4M22.500 18c0-2.500-1.600-4-4-4"/>'),
  sala: LINHA('<rect x="3" y="4" width="18" height="11" rx="1.500"/><path class="ac" d="M7 8.500h6M7 11.500h9"/><path d="M8 21l2.500-6M16 21l-2.500-6"/>'),
};
/** `kind`: 'paul' (1 contra o robô) | 'um' | 'dois' | 'celular' (código) | 'mais' (3 ou mais) | 'sala'. Devolve um <span class="ic-bq"> pronto pra entrar num botão. */
export function bq(kind) {
  const s = h('span', { class: 'ic-bq', 'aria-hidden': 'true' });
  s.innerHTML = SVG[kind] || ''; // SVG interno, nunca dado do usuário
  return s;
}
