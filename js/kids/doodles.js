// Rabiscos de costas das cartas da memória: notas, clave, estrela, coração, raio, fone (traço de caneta, creme/dourado/vinho).
const C = '#f3eee4', G = '#e3a82f', R = '#d8394d';
const S = (inner) => `<svg viewBox="0 0 64 64" class="kx-doodle" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const NOTE = (c, x = 0, y = 0) => `<g transform="translate(${x} ${y})" stroke="${c}" stroke-width="3.4"><path d="M24 44V16l22-5v28"/><path d="M24 24l22-5"/><ellipse cx="19" cy="45" rx="7" ry="5.2" fill="${c}"/><ellipse cx="41" cy="40" rx="7" ry="5.2" fill="${c}"/></g>`;
export const DOODLES = [
  S(`<path d="M10 52q20 6 44-2M12 56q16 3 40-3" stroke="${R}" stroke-width="2.4"/>${NOTE(C)}<path d="M50 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${G}" stroke="${G}" stroke-width="1.5"/>`),
  S(`<path d="M32 8v38M32 12c10 0 14 8 8 14s-14 4-14 14 12 12 16 4-6-14-12-12" stroke="${C}" stroke-width="3.6"/><circle cx="30" cy="52" r="4" fill="${R}" stroke="${R}"/><path d="M10 14l-4-6M54 12l5-6" stroke="${G}" stroke-width="3"/>`),
  S(`<path d="M32 10l6 14 15 1-12 10 4 15-13-8-13 8 4-15-12-10 15-1z" stroke="${G}" stroke-width="3.6" fill="${G}" fill-opacity=".25"/><path d="M8 10q4-4 8 0M48 52q4-4 8 0" stroke="${C}" stroke-width="3"/>`),
  S(`<path d="M32 54C8 38 6 20 18 15s14 6 14 9c0-3 2-14 14-9s10 23-14 39z" stroke="${R}" stroke-width="3.6" fill="${R}" fill-opacity=".35"/><path d="M22 28l6 6 12-14" stroke="${C}" stroke-width="3" stroke-dasharray="1 7"/>${NOTE(C, 0, -2).replace(/stroke-width="3.4"/, 'stroke-width="2.4" opacity=".0"')}`),
  S(`<path d="M36 6L18 36h14l-6 22 22-30H34z" stroke="${G}" stroke-width="3.6" fill="${G}" fill-opacity=".3"/><path d="M8 20q6-6 12 0M44 48q6-6 12 0" stroke="${C}" stroke-width="3"/>`),
  S(`<path d="M12 40V30a20 20 0 0140 0v10" stroke="${C}" stroke-width="3.8"/><rect x="8" y="38" width="10" height="16" rx="5" fill="${R}" stroke="${C}" stroke-width="2.6"/><rect x="46" y="38" width="10" height="16" rx="5" fill="${R}" stroke="${C}" stroke-width="2.6"/><path d="M28 28v12l10-2" stroke="${G}" stroke-width="3"/><circle cx="26" cy="41" r="3" fill="${G}" stroke="${G}"/>`),
  S(`<path d="M8 20l14 30M26 20l14 30M44 12l12 28" stroke="${C}" stroke-width="3" opacity=".9"/><path d="M6 54l50-4" stroke="${R}" stroke-width="3.4"/><path d="M14 18l3-8 4 4" stroke="${G}" stroke-width="3"/>`),
  S(`${NOTE(G)}<circle cx="12" cy="14" r="5" stroke="${C}" stroke-width="2.6"/><path d="M50 52l4 4m0-4l-4 4" stroke="${R}" stroke-width="3"/>`),
];
/** Um rabisco por carta, sorteado do jeito que a rodada começa. */
export const pickDoodle = (i) => DOODLES[i % DOODLES.length];
