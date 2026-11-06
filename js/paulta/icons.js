// pauLta: ícones de linha no mesmo estilo dos cartazes do Kids (duas cores: --ia traço principal, --ib detalhe).
import { gameIcon } from '../kids/icons.js';
const wrap = (inner) => `<svg viewBox="0 0 64 64" class="kx-ico" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const A = 'style="stroke:var(--ia)"'; const B = 'style="stroke:var(--ib)"'; const BF = 'style="stroke:var(--ib);fill:var(--ib)"'; const AF = 'style="stroke:var(--ia);fill:var(--ia)"';
export const worldIcon = (w) => {
  if (w === 'drum' || /^drum[FID]$/.test(w)) return gameIcon('pecas');
  if (w === 'sol') return wrap(`<path ${A} stroke-width="2" d="M4 22h56M4 30h56M4 38h56M4 46h56M4 54h56" opacity=".55"/><path ${B} stroke-width="3.6" d="M34 4c-9 9-11 20-5 28 6 8 11 14 3 21-6 5-13 0-9-6 4-5 11-2 10 5"/><path ${B} d="M34 4v6"/>`);
  if (w === 'fa') return wrap(`<path ${A} stroke-width="2" d="M4 22h56M4 30h56M4 38h56M4 46h56M4 54h56" opacity=".55"/><circle ${AF} cx="18" cy="30" r="4.6"/><path ${B} stroke-width="3.6" d="M18 25c16-3 26 3 24 16-2 9-10 15-22 19"/><circle ${BF} cx="50" cy="26" r="2.6"/><circle ${BF} cx="50" cy="38" r="2.6"/>`);
  return wrap(`<path ${A} d="M10 10l34 34M54 10L20 44"/><path ${B} d="M10 10l5 1-4 4zM54 10l-5 1 4 4z"/><path ${B} d="M40 48l8 8M24 48l-8 8"/><circle ${BF} cx="32" cy="27" r="3"/>`);
};
