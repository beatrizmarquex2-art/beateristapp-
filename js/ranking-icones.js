// Ícones do Ranking: desenhados em SVG no estilo dos ícones do app (contorno escuro grosso, cores da marca). Sem emoji. `icone(nome)` devolve um <svg>.
const I = '#142036'; // tinta
const T = { stroke: I, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
const g = (c) => `<g ${attrs(T)}>${c}</g>`;
const SVG = {
  mundos: g('<circle cx="32" cy="32" r="24" fill="#3b8cff"/><path d="M14 24c3-5 9-6 12-4s2 6 0 8-1 5-4 7-6 4-8 2-3-8 0-13z" fill="#fff4d6"/><path d="M36 14c4-1 8 1 11 4-1 4-4 5-4 9s2 6 0 10-6 5-8 2 0-6-2-9-3-5-1-8 2-6 4-8z" fill="#fff4d6"/><path d="M10 38h44M12 26h40" fill="none" stroke-opacity=".3"/><path d="M49 8c3 2 6 5 7 8" fill="none" stroke="#fff4d6" stroke-width="3" stroke-opacity=".7"/>'),
  longe: g('<path d="M32 6c9 7 13 17 11 30H21C19 23 23 13 32 6z" fill="#fff4d6"/><path d="M32 6c5 4 8 8 9 13H23c1-5 4-9 9-13z" fill="#e8384f"/><circle cx="32" cy="27" r="5" fill="#3b8cff"/><path d="M21 30c-6 3-9 9-9 15l11-5zM43 30c6 3 9 9 9 15l-11-5z" fill="#e8384f"/><path d="M26 40h12l-3 9c-1 4-2 8-3 10-1-2-2-6-3-10z" fill="#f7b733"/>'),
  figurinhas: g('<rect x="9" y="14" width="28" height="38" rx="5" transform="rotate(-10 23 33)" fill="#e8384f"/><rect x="24" y="11" width="29" height="39" rx="5" transform="rotate(8 38 30)" fill="#f7b733"/><path d="M39 20l3 6.500 7 .9-5.200 4.800 1.400 7-6.200-3.500-6.200 3.500 1.400-7-5.200-4.800 7-.9z" fill="#fff4d6"/>'),
  estudos: g('<path d="M6 14c9-3 18-2 26 3v36c-8-5-17-6-26-3z" fill="#fff4d6"/><path d="M58 14c-9-3-18-2-26 3v36c8-5 17-6 26-3z" fill="#fff4d6"/><path d="M12 22c5-1 10 0 14 2M12 30c5-1 10 0 14 2M38 24c4-2 9-3 14-2M38 32c4-2 9-3 14-2" fill="none" stroke="#3b8cff"/><path d="M32 17v36" fill="none"/><path d="M46 6v14M46 6l7 3" fill="none" stroke="#e8384f" stroke-width="4"/>'),
  eco: g('<ellipse cx="32" cy="26" rx="22" ry="9" fill="#fff4d6"/><path d="M10 26v16c0 5 10 9 22 9s22-4 22-9V26" fill="#e8384f"/><path d="M10 26c0 5 10 9 22 9s22-4 22-9" fill="none"/><path d="M20 36l4 12M32 38v13M44 36l-4 12" fill="none" stroke="#fff4d6"/><path d="M14 4l18 18M50 4L32 22" stroke="#f7b733" stroke-width="5" fill="none"/>'),
  estrelas: g('<path d="M32 5l7.500 15.500 17 2.300-12.400 11.900 3 16.800L32 43.400 16.900 51.500l3-16.800L7.500 22.800l17-2.300z" fill="#f7b733"/><path d="M32 14l4 9 9.500 1.200-7 6.600 1.800 9.400-8.300-4.700" fill="none" stroke="#fff4d6" stroke-width="3.500"/>'),
  dias: g('<path d="M32 4c2 9 11 13 11 26 0 5-2 8-4 10 1-5-1-9-4-11 0 6-3 8-5 11-3-3-5-5-5-9-4 3-6 7-6 11 0 9 6 17 13 17s14-7 14-17C46 22 36 17 32 4z" fill="#e8384f"/><path d="M32 30c1 5 7 8 7 15 0 5-3 8-7 8s-7-3-7-8c0-4 3-6 4-9 1 2 2 3 3 4 0-3 0-6 0-10z" fill="#f7b733"/>'),
  trofeu: g('<path d="M18 8h28v14c0 9-6 16-14 16S18 31 18 22z" fill="#f7b733"/><path d="M18 12H8c0 8 4 13 11 14M46 12h10c0 8-4 13-11 14" fill="none"/><path d="M32 38v8M22 56h20l-2-10H24z" fill="#f7b733"/><path d="M25 14v9" stroke="#fff4d6" stroke-width="3.500" fill="none"/>'),
  coroa: g('<path d="M8 20l11 10 13-16 13 16 11-10-5 28H13z" fill="#f7b733"/><circle cx="8" cy="19" r="3.500" fill="#fff4d6"/><circle cx="32" cy="12" r="3.500" fill="#fff4d6"/><circle cx="56" cy="19" r="3.500" fill="#fff4d6"/><path d="M14 50h36" fill="none"/>'),
  seta_esq: `<g ${attrs({ ...T, 'stroke-width': 7 })} fill="none"><path d="M40 12L20 32l20 20"/></g>`,
  seta_dir: `<g ${attrs({ ...T, 'stroke-width': 7 })} fill="none"><path d="M24 12l20 20-20 20"/></g>`,
};
const MEDALHA = { 1: ['#f7b733', '#ffe58a'], 2: ['#b9c2d3', '#eef1f6'], 3: ['#c07c3f', '#f0b27a'] };
/** Medalha 1/2/3 (ouro, prata, bronze) com fita e o número no meio. */
export function medalha(pos) { const [a, b] = MEDALHA[pos] || MEDALHA[3]; return `<g ${attrs(T)}><path d="M20 4h10l6 18H26zM44 4H34l-6 18h10z" fill="#e8384f"/><circle cx="32" cy="40" r="19" fill="${a}"/><circle cx="32" cy="40" r="13" fill="${b}" stroke-width="2"/><text x="32" y="47" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="20" fill="${I}" stroke="none">${pos}</text></g>`; }
/** `nome`: mundos, longe, figurinhas, estudos, eco, trofeu, coroa, seta_esq, seta_dir, medalha1/2/3. */
export function icone(nome, classe = 'rk-i') {
  const m = /^medalha(\d)$/.exec(nome); const corpo = m ? medalha(Number(m[1])) : SVG[nome] || '';
  const t = document.createElement('template'); t.innerHTML = `<svg class="${classe}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${corpo}</svg>`; return t.content.firstChild;
}
export const NOMES_ICONES = [...Object.keys(SVG), 'medalha1', 'medalha2', 'medalha3'];
