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


/* ---------- zoom inteligente: a foto preenche a janela, sem cortar rosto ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const localCache = new Map();
/** Janela no sistema "sem inclinação" (o grupo da foto gira depois, junto com o modelo). */
function local(id) {
  if (localCache.has(id)) return localCache.get(id);
  const { poly, centro: [cx, cy], angulo } = MODELOS2[id].janela, a = (-angulo * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const p = poly.map(([x, y]) => [cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca]);
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const r = { poly: p, bb: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }, cx, cy, ang: angulo };
  localCache.set(id, r); return r;
}
/** Caixa que precisa ficar visível: rostos achados (com folga de cabelo e queixo) + a área onde está a ação da foto. */
export function caixaRostos(rostos, foco) {
  // da área de ação só o miolo (60%) é protegido: o resto pode ficar de fora pra foto preencher a janela
  let u = foco ? { x0: foco[0] + (foco[2] - foco[0]) * 0.2, y0: foco[1] + (foco[3] - foco[1]) * 0.2, x1: foco[2] - (foco[2] - foco[0]) * 0.2, y1: foco[3] - (foco[3] - foco[1]) * 0.2 } : { x0: 1, y0: 1, x1: 0, y1: 0 };
  for (const [x, y, w, h] of rostos || []) u = { x0: Math.min(u.x0, x - w * 0.45), y0: Math.min(u.y0, y - h * 0.8), x1: Math.max(u.x1, x + w * 1.45), y1: Math.max(u.y1, y + h * 1.35) };
  if (!rostos?.length && foco) u.y0 = 0; // sem rosto confirmado: nunca corta o topo (cabeças ficam no alto)
  if (u.x1 <= u.x0 || u.y1 <= u.y0) return { x0: 0.2, y0: 0.15, x1: 0.8, y1: 0.85 };
  return { x0: clamp(u.x0, 0, 1), y0: clamp(u.y0, 0, 1), x1: clamp(u.x1, 0, 1), y1: clamp(u.y1, 0, 1) };
}
const planCache = new Map();
/** Onde e em que tamanho a foto entra na janela: o maior zoom (preenchendo a janela) em que rostos e "ação" continuam inteiros. */
export function planoFoto(e, id) {
  const key = `${e.codigo}|${id}`; if (e.codigo && planCache.has(key)) return planCache.get(key);
  const L = local(id), pw = e.largura_px, ph = e.altura_px, F = caixaRostos(e.rostos, e.foco), { x0, y0, x1, y1 } = L.bb;
  const bw = x1 - x0, bh = y1 - y0, cover = Math.max(bw / pw, bh / ph), contain = Math.min(bw / pw, bh / ph);
  const axis = (v, size, lo, hi) => (size >= hi - lo ? clamp(v, hi - size, lo) : lo + (hi - lo - size) / 2);
  const place = (sc) => { const W = pw * sc, H = ph * sc; return { W, H, x: axis((x0 + x1) / 2 - ((F.x0 + F.x1) / 2) * W, W, x0, x1), y: axis((y0 + y1) / 2 - ((F.y0 + F.y1) / 2) * H, H, y0, y1) }; };
  const ok = (p) => [[F.x0, F.y0], [F.x1, F.y0], [F.x1, F.y1], [F.x0, F.y1]].every(([u, v]) => inPoly(L.poly, p.x + u * p.W, p.y + v * p.H));
  let sc = cover, p = place(sc);
  for (let i = 1; i <= 60 && !ok(p); i++) { sc = cover * Math.pow((contain * 0.5) / cover, i / 60); p = place(sc); }
  const r = { x: n1(p.x), y: n1(p.y), w: n1(p.W), h: n1(p.H), escala: sc, cobre: sc >= cover - 1e-9, poly: L.poly, cx: L.cx, cy: L.cy, ang: L.ang, foco: F };
  if (e.codigo) planCache.set(key, r); return r;
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
    const pw = e.largura_px || 1000, ph = e.altura_px || pw / asp, f = planoFoto({ ...e, largura_px: pw, altura_px: ph }, id), cid = `pc${id}${e.codigo || ''}`;
    photo = `<g transform="rotate(${f.ang} ${f.cx} ${f.cy})"><clipPath id="${cid}"><polygon points="${f.poly.map((q) => `${n1(q[0])},${n1(q[1])}`).join(' ')}"/></clipPath><image href="${esc(url)}" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" preserveAspectRatio="none" clip-path="url(#${cid})"/></g>`;
  }
  const code = e.codigo ? `${e.codigo}${e.colecao && e.colecao !== 'Geral' ? ` · ${e.colecao.toUpperCase()}` : ''}` : '';
  const pill = code ? `<g><rect x="9" y="8" width="${n1(code.length * 6.4 + 12)}" height="17" rx="8.5" fill="#000" fill-opacity=".62"/><text x="15" y="20" font-family="${SANS}" font-weight="800" font-size="9.5" letter-spacing="1.2" fill="#f6ecd4">${esc(code)}</text></g>` : '';
  const label = e.codigo ? `${name}, figurinha ${e.codigo}, ${e.raridade}` : `Modelo ${id}, ${m.raridade}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="${esc(label)}" data-modelo="${id}"><image href="assets/figurinhas/modelos2/${id}.webp" width="${W2}" height="${H2}"/>${photo}<g transform="translate(${r.centro[0]} ${r.centro[1]}) rotate(${r.angulo})"><text text-anchor="middle" font-family="${FONT}" font-size="${fit.size}" letter-spacing=".4" fill="${ink}"${e.codigo ? '' : ' fill-opacity=".45"'}>${text}</text></g>${pill}</svg>`;
}
