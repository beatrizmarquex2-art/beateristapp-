// Figurinha no estilo dos 8 modelos novos (M1..M8): a arte do modelo é uma imagem; a foto original entra INTEIRA dentro da janela
// (maior tamanho que cabe na forma, sem cortar) e o nome vai no rótulo. Coordenadas: 360 x 475.
import { MODELOS2 } from './modelos2-data.js';

export const W2 = 360, H2 = 475;
const FONT = "'Anton','Hanken Grotesk',Impact,sans-serif", SANS = "'Hanken Grotesk',system-ui,sans-serif";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = (n) => Math.round(n * 10) / 10;
export const hasModelo2 = (id) => !!MODELOS2[id];

/* ---------- foto dentro da janela ---------- */
function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}
const cache = new Map();
/** Maior retângulo (com a proporção da foto, girado pelo ângulo da janela) que cabe inteiro dentro da forma da janela. */
export function fitWindow(id, aspect) {
  const key = `${id}|${Math.round(aspect * 100)}`; if (cache.has(key)) return cache.get(key);
  const { poly, centro, angulo } = MODELOS2[id].janela, a = (angulo * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const fits = (cx, cy, h) => {
    const w = h * aspect, N = 22;
    for (let k = 0; k <= N; k++) {
      const t = k / N - 0.5;
      for (const [u, v] of [[t * w, -h / 2], [t * w, h / 2], [-w / 2, t * h], [w / 2, t * h]]) if (!inPoly(poly, cx + u * ca - v * sa, cy + u * sa + v * ca)) return false;
    }
    return true;
  };
  let best = { h: 0, cx: centro[0], cy: centro[1] };
  for (let dx = -16; dx <= 16; dx += 4) for (let dy = -16; dy <= 16; dy += 4) {
    const cx = centro[0] + dx, cy = centro[1] + dy; if (!inPoly(poly, cx, cy)) continue;
    let lo = 0, hi = 420; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (fits(cx, cy, m)) lo = m; else hi = m; }
    if (lo > best.h) best = { h: lo, cx, cy };
  }
  const r = { h: n1(best.h * 0.985), w: n1(best.h * 0.985 * aspect), cx: n1(best.cx), cy: n1(best.cy), ang: angulo };
  cache.set(key, r); return r;
}

/* ---------- nome no rótulo ---------- */
let mctx;
const measure = (t, size) => { if (typeof document === 'undefined') return t.length * size * 0.42; mctx ||= document.createElement('canvas').getContext('2d'); mctx.font = `${size}px ${FONT}`; return mctx.measureText(t).width; };
function wrap(words, size, lines) {
  if (lines === 1) return [words.join(' ')];
  let best = null;
  for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), w = Math.max(measure(a, size), measure(b, size)); if (!best || w < best.w) best = { w, l: [a, b] }; }
  return best ? best.l : [words.join(' ')];
}
export function fitLabel(name, maxW, maxH = 38, max = 26, min = 10) {
  const words = String(name).toUpperCase().trim().split(/\s+/);
  for (let size = max; size >= min; size--) for (const n of [1, 2]) {
    if (n > words.length || n * size * 1.05 > maxH) continue;
    const l = wrap(words, size, n); if (l.length === n && l.every((t) => measure(t, size) <= maxW)) return { size, lines: l };
  }
  return { size: min, lines: wrap(words, min, 2) };
}

/** SVG da figurinha no estilo novo. `e.modelo2` = M1..M8. Sem `url` desenha o modelo vazio. */
export function cardSVG2(e, { url = null, aspect = null } = {}) {
  const id = e.modelo2 || 'M1', m = MODELOS2[id], r = m.rotulo;
  const asp = aspect || (e.largura_px && e.altura_px ? e.largura_px / e.altura_px : 0.8);
  const name = e.artista_banda || 'Artista / Banda', fit = fitLabel(name, r.largura * 0.97), lh = fit.size * 1.05;
  const ink = r.escuro ? '#17130f' : '#f1e3c6';
  const text = fit.lines.map((l, i) => `<tspan x="0" y="${n1((i - (fit.lines.length - 1) / 2) * lh + fit.size * 0.36)}">${esc(l)}</tspan>`).join('');
  let photo = '';
  if (url) {
    const f = fitWindow(id, asp);
    photo = `<g transform="rotate(${f.ang} ${f.cx} ${f.cy})"><image href="${esc(url)}" x="${n1(f.cx - f.w / 2)}" y="${n1(f.cy - f.h / 2)}" width="${f.w}" height="${f.h}" preserveAspectRatio="xMidYMid meet"/><rect x="${n1(f.cx - f.w / 2)}" y="${n1(f.cy - f.h / 2)}" width="${f.w}" height="${f.h}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/></g>`;
  }
  const code = e.codigo ? `${e.codigo}${e.colecao && e.colecao !== 'Geral' ? ` · ${e.colecao.toUpperCase()}` : ''}` : '';
  const pill = code ? `<g><rect x="9" y="8" width="${n1(code.length * 6.4 + 12)}" height="17" rx="8.5" fill="#000" fill-opacity=".62"/><text x="15" y="20" font-family="${SANS}" font-weight="800" font-size="9.5" letter-spacing="1.2" fill="#f6ecd4">${esc(code)}</text></g>` : '';
  const label = e.codigo ? `${name}, figurinha ${e.codigo}, ${e.raridade}` : `Modelo ${id}, ${m.raridade}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="${esc(label)}" data-modelo="${id}"><image href="assets/figurinhas/modelos2/${id}.webp" width="${W2}" height="${H2}"/>${photo}<g transform="translate(${r.centro[0]} ${r.centro[1]}) rotate(${r.angulo})"><text text-anchor="middle" font-family="${FONT}" font-size="${fit.size}" letter-spacing=".4" fill="${ink}"${e.codigo ? '' : ' fill-opacity=".45"'}>${text}</text></g>${pill}</svg>`;
}
