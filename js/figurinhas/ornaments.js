// Ornamentos das figurinhas: pequenos desenhos em SVG (adesivos, fitas, raios, vinil...). Tudo vetorial, desenhado aqui — nenhuma imagem de terceiros.
// Cada função devolve um trecho de SVG pronto pra entrar dentro do cartão (600 x 900).
export const C = {
  cream: '#efe2c6', paper: '#f4ead3', navy: '#17224a', black: '#14111a', wine: '#5b1424', red: '#c4182c', yellow: '#e9b824', gold: '#d9a63c', white: '#fbf6ea', ink: '#14111a',
};

export function rng(seed) { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hashSeed = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const f = (n) => Math.round(n * 10) / 10;

/** Polígono com bordas "rasgadas": cada aresta ganha pontos extras deslocados aleatoriamente (determinístico pela seed). */
export function rough(poly, amp = 5, step = 16, seed = 1) {
  const r = rng(seed); const out = [];
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(len / step));
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    for (let k = 0; k < n; k++) { const t = k / n, o = k === 0 ? 0 : (r() - 0.5) * 2 * amp; out.push([x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o]); }
  }
  return `M${out.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
}
export const rectPoly = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const torn = (x, y, w, h, fill, { amp = 5, step = 16, seed = 1, extra = '' } = {}) => `<path d="${rough(rectPoly(x, y, w, h), amp, step, seed)}" fill="${fill}" ${extra}/>`;

export const star = (cx, cy, R, fill, stroke, sw = 4, rot = -90, seed = 3) => {
  const r = rng(seed); const pts = [];
  for (let i = 0; i < 10; i++) { const a = ((rot + i * 36) * Math.PI) / 180, rr = (i % 2 ? R * 0.44 : R) * (0.95 + r() * 0.1); pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`); }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
};
export const bolt = (fill, stroke, sw = 5, s = 1) => `<g transform="scale(${s})"><polygon points="62,0 8,92 44,92 28,170 92,66 54,66" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/></g>`;
export const sparkle = (cx, cy, R, fill = C.white, stroke = 'none') => `<path d="M${cx} ${cy - R}Q${cx + R * 0.14} ${cy - R * 0.14} ${cx + R} ${cy}Q${cx + R * 0.14} ${cy + R * 0.14} ${cx} ${cy + R}Q${cx - R * 0.14} ${cy + R * 0.14} ${cx - R} ${cy}Q${cx - R * 0.14} ${cy - R * 0.14} ${cx} ${cy - R}Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;

export function smile() {
  return `<circle cx="0" cy="0" r="38" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>
  <path d="M-16 -10q4 -8 8 0M8 -10q4 -8 8 0" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  <path d="M-20 8q20 24 40 0" fill="none" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round"/>`;
}
export function note(fill = C.ink) {
  return `<g fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round"><ellipse cx="14" cy="64" rx="15" ry="11" transform="rotate(-20 14 64)"/><ellipse cx="62" cy="54" rx="15" ry="11" transform="rotate(-20 62 54)"/>
  <rect x="25" y="8" width="6" height="56"/><rect x="73" y="-2" width="6" height="56"/><polygon points="25,8 79,-2 79,18 25,28"/></g>`;
}
export function snare() {
  return `<ellipse cx="0" cy="0" rx="46" ry="16" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>
  <path d="M-46 0V40q46 24 92 0V0" fill="${C.black}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M-30 14l10 36M-10 18l6 36M10 18l-6 36M30 14l-10 36M-38 12l16 34M38 12l-16 34" stroke="${C.paper}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="0" cy="0" rx="34" ry="10" fill="none" stroke="${C.ink}" stroke-width="2.5"/>`;
}
export function vinyl(label = C.red, r = 64) {
  const rings = [0.9, 0.78, 0.66, 0.54].map((k) => `<circle r="${f(r * k)}" fill="none" stroke="#3a3540" stroke-width="2"/>`).join('');
  return `<circle r="${r}" fill="#101012" stroke="${C.ink}" stroke-width="3"/>${rings}
  <path d="M${-r * 0.7} ${-r * 0.3}A${r * 0.76} ${r * 0.76} 0 0 1 ${-r * 0.2} ${-r * 0.72}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/>
  <circle r="${f(r * 0.3)}" fill="${label}" stroke="${C.ink}" stroke-width="2"/><circle r="${f(r * 0.06)}" fill="${C.cream}"/>`;
}
export function headphones() {
  return `<path d="M-62 14V-4A62 62 0 0 1 62 -4V14" fill="none" stroke="${C.ink}" stroke-width="13" stroke-linecap="round"/><path d="M-62 14V-4A62 62 0 0 1 62 -4V14" fill="none" stroke="${C.paper}" stroke-width="5" stroke-linecap="round"/>
  <rect x="-80" y="6" width="34" height="64" rx="16" fill="${C.paper}" stroke="${C.ink}" stroke-width="4.5"/><rect x="46" y="6" width="34" height="64" rx="16" fill="${C.paper}" stroke="${C.ink}" stroke-width="4.5"/>
  <rect x="-68" y="22" width="12" height="32" rx="6" fill="${C.ink}"/><rect x="56" y="22" width="12" height="32" rx="6" fill="${C.ink}"/>`;
}
export function cassette() {
  return `<rect x="-70" y="-46" width="140" height="92" rx="9" fill="${C.paper}" stroke="${C.ink}" stroke-width="4.5"/>
  <rect x="-54" y="-36" width="108" height="34" rx="5" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.5"/><path d="M-44 -26h40M-44 -18h60" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/>
  <rect x="-40" y="8" width="80" height="26" rx="13" fill="${C.black}"/><circle cx="-22" cy="21" r="8" fill="${C.paper}"/><circle cx="22" cy="21" r="8" fill="${C.paper}"/><circle cx="-22" cy="21" r="3" fill="${C.black}"/><circle cx="22" cy="21" r="3" fill="${C.black}"/>
  <path d="M-62 38l8 -8M62 38l-8 -8" stroke="${C.ink}" stroke-width="3"/>`;
}
export function crown(stroke = C.gold, sw = 6, fill = 'none') {
  return `<path d="M-52 34L-60 -22L-26 8L0 -34L26 8L60 -22L52 34Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/><path d="M-50 46H50" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
}
export function drumkit() {
  return `<g fill="${C.black}" stroke="${C.paper}" stroke-width="2.5"><ellipse cx="0" cy="22" rx="30" ry="32"/><ellipse cx="-38" cy="-8" rx="17" ry="9"/><ellipse cx="34" cy="-4" rx="17" ry="9"/><ellipse cx="62" cy="26" rx="15" ry="24"/>
  <ellipse cx="-62" cy="-36" rx="24" ry="5"/><ellipse cx="64" cy="-44" rx="24" ry="5"/></g>
  <g stroke="${C.black}" stroke-width="3" fill="none"><path d="M-62 -34V22M64 -42V30"/></g><circle cx="0" cy="22" r="8" fill="none" stroke="${C.paper}" stroke-width="2.5"/>`;
}
export function barcode(seed = 1, w = 70, h = 46, color = C.black, bg = C.paper) {
  const r = rng(seed); let x = 5, bars = '';
  while (x < w - 5) { const bw = 1 + Math.floor(r() * 4); if (r() > 0.4) bars += `<rect x="${x}" y="5" width="${bw}" height="${h - 10}" fill="${color}"/>`; x += bw + 1 + Math.floor(r() * 2); }
  return `<rect width="${w}" height="${h}" fill="${bg}"/>${bars}`;
}
export function asterisk(R = 40, color = C.paper, sw = 5) {
  return `<g stroke="${color}" stroke-width="${sw}" stroke-linecap="round">${[0, 30, 60, 90, 120, 150].map((a) => `<line x1="0" y1="${-R}" x2="0" y2="${R}" transform="rotate(${a})"/>`).join('')}</g>`;
}
export const rays = (color = C.yellow, sw = 6) => `<g stroke="${color}" stroke-width="${sw}" stroke-linecap="round" fill="none"><path d="M0 0l-18 -48M30 -6l-4 -52M58 8l22 -42"/></g>`;
export const scribble = (color, sw = 4, w = 70) => `<path d="M0 0q${w * 0.15} -26 ${w * 0.25} 0t${w * 0.25} 0t${w * 0.25} 0t${w * 0.25} 0" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
export const swirl = (color, sw = 3.5) => `<path d="M0 0c40 -30 70 30 30 40c-40 8 -34 -50 8 -40c30 8 30 40 66 34" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;

export function tape(w, h, fill, seed = 2, op = 0.88) {
  const r = rng(seed), zig = (x0, dir) => Array.from({ length: 6 }, (_, i) => `${f(x0 + (i % 2 ? 6 : 0) * dir)},${f((h * i) / 5)}`);
  const left = zig(0, 1), right = zig(w, -1).reverse();
  return `<polygon points="${[...left, ...right].join(' ')}" fill="${fill}" fill-opacity="${op}" stroke="#000" stroke-opacity=".12" stroke-width="1"/><path d="M6 ${h * 0.3}H${w - 6}M6 ${h * 0.7}H${w - 6}" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>${r() < 0 ? '' : ''}`;
}
export function brush(w, h, fill, seed = 5) {
  const r = rng(seed); const top = [], bot = [], n = 12;
  for (let i = 0; i <= n; i++) { top.push([(w * i) / n, (r() - 0.5) * h * 0.34]); bot.push([(w * i) / n, h + (r() - 0.5) * h * 0.34]); }
  const pts = [...top, ...bot.reverse()].map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
  const streaks = Array.from({ length: 5 }, (_, i) => `<path d="M${f(w * 0.04)} ${f(h * (0.15 + i * 0.18))}H${f(w * (0.55 + r() * 0.4))}" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>`).join('');
  return `<polygon points="${pts}" fill="${fill}"/>${streaks}`;
}
export const underline = (w, color, sw = 5) => `<path d="M0 6Q${w * 0.3} -2 ${w * 0.55} 5T${w} 3" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
export function filmHoles(x, y, n, step, color = C.paper) {
  return Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * step}" width="22" height="30" rx="5" fill="${color}"/>`).join('');
}
