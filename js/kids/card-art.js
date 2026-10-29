// Arte das figurinhas, desenhada em SVG a partir do id (sempre igual para a mesma carta).
// São ilustrações pop-art de silhueta, em cores de fantasia: não são retratos nem fotos das pessoas.
import { ROLES } from './album-data.js';

const PAL = {
  baterista: ['#c8202f', '#ffd34d', '#1b1818'], guitarrista: ['#14284b', '#46c2ff', '#f3eee4'], baixista: ['#0f6b5c', '#ffb454', '#1b1818'],
  vocalista: ['#6a2bd6', '#ff6fb1', '#f3eee4'], vocalista_f: ['#e0267a', '#ffe14d', '#1b1818'], kpop: ['#1b1818', '#ff5fd2', '#6ff0ff'],
};
const FACES = ['#ffd5b0', '#ffb3c7', '#b8f0d2', '#c9b8ff', '#ffe08a', '#a8e4ff', '#ffc09a'];

export function hash(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
const rng = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

/** 1 = comum, 2 = rara, 3 = especial. Só depende do id, então não muda. */
export function rarityOf(id) { const n = hash(`r:${id}`) % 100; return n < 70 ? 1 : n < 94 ? 2 : 3; }
export const RARITY = { 1: 'comum', 2: 'rara', 3: 'especial' };

function person(cx, top, s, face, hair, ink, kind, bg) {
  const hy = top + 34 * s; const r = 22 * s;
  const hairs = [
    `<ellipse cx="${cx}" cy="${hy - 8 * s}" rx="${r * 1.05}" ry="${r * .8}" fill="${hair}"/>`,
    `<rect x="${cx - r * 1.25}" y="${hy - r}" width="${r * 2.5}" height="${r * 2.9}" rx="${r}" fill="${hair}"/>`,
    `<circle cx="${cx}" cy="${hy - 4 * s}" r="${r * 1.45}" fill="${hair}"/>`,
    `<path d="M${cx - 5 * s} ${hy - r * .7} L${cx} ${hy - r * 1.9} L${cx + 5 * s} ${hy - r * .7} Z" fill="${hair}"/>`,
    `<circle cx="${cx}" cy="${hy - r * 1.15}" r="${r * .5}" fill="${hair}"/><ellipse cx="${cx}" cy="${hy - 8 * s}" rx="${r * 1.02}" ry="${r * .72}" fill="${hair}"/>`,
    `<ellipse cx="${cx}" cy="${hy - r * .55}" rx="${r * 1.1}" ry="${r * .55}" fill="${hair}"/><rect x="${cx - r * 1.5}" y="${hy - r * .35}" width="${r * 2.2}" height="${5 * s}" rx="${2 * s}" fill="${hair}"/>`,
  ];
  const back = kind === 1 ? hairs[1] : kind === 2 ? hairs[2] : '';
  const front = kind === 1 || kind === 2 ? '' : hairs[kind];
  const glasses = kind % 2 === 0 ? `<rect x="${cx - r * .8}" y="${hy - 3 * s}" width="${r * 1.6}" height="${6 * s}" rx="${3 * s}" fill="${ink}"/>` : `<circle cx="${cx - 8 * s}" cy="${hy}" r="${2.2 * s}" fill="${ink}"/><circle cx="${cx + 8 * s}" cy="${hy}" r="${2.2 * s}" fill="${ink}"/>`;
  return `${back}<path d="M${cx - 40 * s} ${top + 120 * s} Q${cx - 38 * s} ${top + 66 * s} ${cx} ${top + 60 * s} Q${cx + 38 * s} ${top + 66 * s} ${cx + 40 * s} ${top + 120 * s} Z" fill="${bg}" stroke="${ink}" stroke-width="${2.5 * s}"/>`
    + `<rect x="${cx - 7 * s}" y="${hy + r - 4 * s}" width="${14 * s}" height="${16 * s}" fill="${face}" stroke="${ink}" stroke-width="${2.5 * s}"/>`
    + `<ellipse cx="${cx}" cy="${hy}" rx="${r}" ry="${r * 1.1}" fill="${face}" stroke="${ink}" stroke-width="${2.5 * s}"/>${front}${glasses}`
    + `<path d="M${cx - 6 * s} ${hy + 11 * s} Q${cx} ${hy + 16 * s} ${cx + 6 * s} ${hy + 11 * s}" fill="none" stroke="${ink}" stroke-width="${2 * s}" stroke-linecap="round"/>`;
}

/** String SVG (200×200) da carta. */
export function cardSvg(card) {
  const [c1, c2, c3] = PAL[card.role] || PAL.baterista; const RED = ['#e63946', '#8c1224']; const R = rng(hash(card.id));
  const ink = '#1b1818'; const rays = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `${100 + Math.cos(a) * 160},${100 + Math.sin(a) * 160}`; });
  let body = rays.map((p, i) => (i % 2 ? '' : `<path d="M100 100 L${p} L${rays[(i + 1) % 12]} Z" fill="#ffd9a0" opacity=".2"/>`)).join('');
  const dots = Array.from({ length: 14 }, () => `<circle cx="${(R() * 200) | 0}" cy="${(R() * 200) | 0}" r="${(1.5 + R() * 3).toFixed(1)}" fill="#fff3c8" opacity=".45"/>`).join('');
  if (card.role === 'kpop') {
    const f = [0, 1, 2].map(() => FACES[(R() * FACES.length) | 0]);
    body += person(52, 62, .62, f[0], c2, ink, 4, c1) + person(148, 62, .62, f[1], c3, ink, 0, c1) + person(100, 40, .78, f[2], c2, ink, 3, c1);
  } else {
    body += person(100, 40, 1, FACES[(R() * FACES.length) | 0], [ink, c2, '#7a3b1d', '#f3eee4', c1][(R() * 5) | 0], ink, (R() * 6) | 0, c1);
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g-${card.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${RED[0]}"/><stop offset="1" stop-color="${RED[1]}"/></linearGradient></defs>`
    + `<rect width="200" height="200" fill="url(#g-${card.id})"/>${body}${dots}`
    + `<circle cx="168" cy="168" r="22" fill="${c1}" stroke="${ink}" stroke-width="3"/><text x="168" y="177" font-size="24" text-anchor="middle">${ROLES[card.role][1]}</text></svg>`;
}
