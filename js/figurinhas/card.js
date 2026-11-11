// Desenha uma figurinha (cartão 600 x 900) em SVG a partir de um registro do catálogo.
// A foto original entra INTEIRA (preserveAspectRatio "meet"): nunca é cortada, filtrada ou refeita — só ganha moldura em volta.
import * as O from './ornaments.js';
import { cardSVG2, hasModelo2 } from './card2.js';
import { nomeRaridade } from './album-logic.js';
const { C } = O;

export const W = 600, H = 900;
export const BOX = { x: 56, y: 122, w: 488, h: 540 };
export const SEAL = { Comum: 'COMUM', Rara: 'RARA', Exclusiva: 'EXCLUSIVA' };
export const TEMPLATES = {
  C01: { raridade: 'Comum', nome: 'Vintage creme', dark: false },
  C02: { raridade: 'Comum', nome: 'Caderno e raio', dark: false },
  R01: { raridade: 'Rara', nome: 'Vinil vermelho', dark: true },
  R02: { raridade: 'Rara', nome: 'Noite do rock', dark: true },
  E01: { raridade: 'Exclusiva', nome: 'Raio e collage', dark: true },
  E02: { raridade: 'Exclusiva', nome: 'Foil e fones', dark: true },
  E03: { raridade: 'Exclusiva', nome: 'Cinema e fita', dark: true },
  E04: { raridade: 'Exclusiva', nome: 'Coroa e vinil', dark: true },
};
const HAND = "'Gochi Hand','Permanent Marker',cursive";
const SANS = "'Hanken Grotesk',system-ui,sans-serif";
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = (n) => Math.round(n * 10) / 10;

/* ---------- medir e quebrar o nome (sem cortar, sem reticências) ---------- */
let mctx;
function measure(text, size) {
  if (typeof document === 'undefined') return text.length * size * 0.46;
  mctx ||= document.createElement('canvas').getContext('2d');
  mctx.font = `${size}px ${HAND}`;
  return mctx.measureText(text).width;
}
function wrap(words, size, maxW, lines) {
  if (lines === 1) return [words.join(' ')];
  if (lines === 2) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), w = Math.max(measure(a, size), measure(b, size)); if (!best || w < best.w) best = { w, l: [a, b] }; }
    return best ? best.l : [words.join(' ')];
  }
  const out = []; let cur = '';
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (cur && measure(t, size) > maxW) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}
/** Acha o maior corpo de letra em que o nome inteiro cabe em até 3 linhas. */
export function fitName(name, maxW, max = 54, min = 22) {
  const words = String(name).trim().split(/\s+/);
  for (let size = max; size >= min; size -= 1) {
    for (const lines of [1, 2, 3]) {
      if (lines > (size >= 34 ? 2 : 3) || lines * size * 1.06 > 90) continue;
      const l = wrap(words, size, maxW, lines);
      if (l.length === lines && l.every((t) => measure(t, size) <= maxW)) return { size, lines: l };
    }
  }
  return { size: min, lines: wrap(words, min, maxW, 3) };
}

export function fitPhoto(aspect) {
  const { x, y, w, h } = BOX; let pw = w, ph = w / aspect;
  if (ph > h) { ph = h; pw = h * aspect; }
  return { x: n1(x + (w - pw) / 2), y: n1(y + (h - ph) * 0.8), w: n1(pw), h: n1(ph) };
}

/* ---------- peças comuns ---------- */
const g = (t, inner, extra = '') => `<g transform="${t}" ${extra}>${inner}</g>`;
const defs = (k) => `<defs>
<clipPath id="cl${k}"><rect width="${W}" height="${H}" rx="40"/></clipPath>
<filter id="sh${k}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".38"/></filter>
<filter id="st${k}" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"/><feFlood flood-color="#f7f0de"/><feComposite in2="d" operator="in" result="o"/><feGaussianBlur in="d" stdDeviation="3" result="b"/><feOffset in="b" dx="2" dy="4" result="s"/><feComponentTransfer in="s" result="sh"><feFuncA type="linear" slope=".42"/></feComponentTransfer><feMerge><feMergeNode in="sh"/><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="gr${k}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .25  0 0 0 0 .2  0 0 0 0 .14  0 0 0 1.1 -.5"/></filter>
<filter id="lc${k}"><feColorMatrix values="0 0 0 0 .96  0 0 0 0 .92  0 0 0 0 .82  0 0 0 1 0"/></filter>
<linearGradient id="ho${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6fb5"/><stop offset=".18" stop-color="#ffd86b"/><stop offset=".36" stop-color="#6bffb8"/><stop offset=".54" stop-color="#6bb8ff"/><stop offset=".72" stop-color="#b06bff"/><stop offset=".88" stop-color="#ff6b6b"/><stop offset="1" stop-color="#6bf0ff"/></linearGradient>
<linearGradient id="ho2${k}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6bf0ff"/><stop offset=".3" stop-color="#ffffff"/><stop offset=".55" stop-color="#ff9ad5"/><stop offset=".8" stop-color="#ffe27a"/><stop offset="1" stop-color="#8fa8ff"/></linearGradient>
<pattern id="gd${k}" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#7f95b8" stroke-opacity=".38" stroke-width="1.2"/></pattern>
</defs>`;

const logo = (k, x, y, w = 300, light = false) => `<svg x="${x}" y="${y}" width="${w}" height="${n1((w * 175) / 900)}" viewBox="0 0 900 175"><image href="assets/logo-nome.png" width="900" height="257" ${light ? `filter="url(#lc${k})"` : ''}/></svg>`;
const tapeCorner = (x, y, r, fill = '#e7d9ae') => `<g transform="translate(${x} ${y}) rotate(${r})" opacity=".9">${O.tape(70, 24, fill, x + y, 0.8)}</g>`;

function photoLayer(k, P, url, t) {
  const pad = t === 'E02' ? 4 : 9;
  const frame = t === 'E02' ? '#0b0b14' : C.paper;
  const img = url
    ? `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" fill="#0e0c12"/><image href="${esc(url)}" x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" fill="#241f2b"/><rect x="${P.x + 14}" y="${P.y + 14}" width="${P.w - 28}" height="${P.h - 28}" fill="none" stroke="#8a8397" stroke-width="3" stroke-dasharray="14 10"/><text x="${P.x + P.w / 2}" y="${P.y + P.h / 2 + 10}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="34" letter-spacing="8" fill="#8a8397">FOTO</text>`;
  return `<g filter="url(#sh${k})"><rect x="${P.x - pad}" y="${P.y - pad}" width="${P.w + pad * 2}" height="${P.h + pad * 2}" fill="${frame}"/></g>${img}<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`;
}

function nameStrip(k, name, cx, maxW, t, underline) {
  const fit = fitName(name || 'Nome do artista', maxW);
  const lh = fit.size * 1.06, bw = Math.min(maxW + 64, Math.max(...fit.lines.map((l) => measure(l, fit.size))) + 70, 440);
  const bh = fit.lines.length * lh + 42, top = 664;
  const text = fit.lines.map((l, i) => `<tspan x="${cx}" y="${n1(top + 16 + fit.size * 0.9 + i * lh)}">${esc(l)}</tspan>`).join('');
  const strip = `<g transform="rotate(-1.6 ${cx} ${top + bh / 2})"><g filter="url(#sh${k})">${O.torn(cx - bw / 2, top, bw, bh, C.paper, { amp: 3.5, step: 14, seed: O.hashSeed(name || 'x') })}</g>
  <text text-anchor="middle" font-family="${HAND}" font-size="${fit.size}" fill="${C.ink}">${text}</text>
  ${underline ? g(`translate(${cx - bw / 2 + 36} ${n1(top + bh - 13)})`, O.underline(bw - 72, underline, 4.5)) : ''}</g>`;
  return strip;
}

function seal(k, rar, kind, t) {
  const label = SEAL[rar], cx = 300, y = 802, h = 50;
  if (rar === 'Exclusiva') {
    const w = 300, r = kind === 'pill' ? 26 : 6;
    return `<g filter="url(#sh${k})"><rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#0d0b11"/></g><rect x="${cx - w / 2 + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="${Math.max(2, r - 4)}" fill="none" stroke="${C.gold}" stroke-width="2.5"/>
    <text x="${cx}" y="${y + 36}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="28" letter-spacing="5" fill="${C.gold}">${label}</text>
    ${g(`translate(${cx} ${y - 2}) scale(.34)`, O.crown(C.gold, 9, '#0d0b11'))}`;
  }
  const w = rar === 'Rara' ? 200 : 232;
  const fill = t === 'R01' ? C.yellow : t === 'R02' ? C.red : C.navy, ink = t === 'R01' ? C.black : C.paper;
  return `<g filter="url(#sh${k})">${O.torn(cx - w / 2, y + 2, w, h - 4, fill, { amp: 2.6, step: 12, seed: O.hashSeed(t) })}</g>
  <text x="${cx}" y="${y + 36}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="28" letter-spacing="8" fill="${ink}">${label}</text>`;
}

const codeText = (e, dark) => `<text x="300" y="870" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="15" letter-spacing="3.5" fill="${dark ? '#efe2c6' : C.navy}" fill-opacity=".9">${esc(e.codigo)}${e.colecao && e.colecao !== 'Geral' ? ` · ${esc(e.colecao.toUpperCase())}` : ''}</text>`;

/* ---------- os 8 modelos ---------- */
const st = (k, inner) => `<g filter="url(#st${k})">${inner}</g>`;
function TPL(t, k, P, o) {
  const TL = [P.x, P.y], TR = [P.x + P.w, P.y], BL = [P.x, P.y + P.h], BR = [P.x + P.w, P.y + P.h];
  const R = O.rng(O.hashSeed(t));
  switch (t) {
    case 'C01': return {
      bg: `<rect width="${W}" height="${H}" fill="#ecdfc2"/><path d="M0 330Q300 318 600 340M0 610Q300 600 600 620" stroke="#000" stroke-opacity=".06" stroke-width="3" fill="none"/>${O.torn(24, 112, 552, 30, C.paper, { amp: 6, seed: 4 })}`,
      logoBg: `<g transform="translate(70 30) rotate(-1.5)">${O.brush(460, 70, C.navy, 11)}</g>`, logo: logo(k, 150, 36, 300, true),
      front: st(k, g(`translate(${TL[0] - 14} ${TL[1] + 86}) rotate(-10)`, O.smile())) + g(`translate(${TR[0] - 42} ${TR[1] + 18}) rotate(8)`, `<g filter="url(#sh${k})"><rect x="-8" y="-6" width="92" height="94" fill="#e7d3a4"/></g>${tapeCorner(14, -14, -6)}<g transform="translate(2 8) scale(.78)">${O.note()}</g>`),
      front2: st(k, g('translate(96 800) rotate(-8) scale(.95)', O.snare())) + g('translate(446 826) rotate(4)', O.scribble(C.navy, 5, 90)),
      seal: 'rect', shift: 0, maxW: 360, under: C.navy, tone: 'light',
    };
    case 'C02': return {
      bg: `<rect width="${W}" height="${H}" fill="#eee2c4"/><rect width="${W}" height="${H}" fill="url(#gd${k})"/><rect x="0" y="0" width="52" height="${H}" fill="#e3d4b0"/>${[150, 450, 750].map((y) => `<circle cx="26" cy="${y}" r="11" fill="#2a2430" fill-opacity=".85"/>`).join('')}<path d="M52 0V900" stroke="${C.red}" stroke-opacity=".55" stroke-width="2.4"/>`,
      logoBg: g('translate(18 40) rotate(-26)', O.tape(170, 40, C.red, 6, 0.92)), logo: logo(k, 170, 44, 290) + g('translate(190 108)', O.underline(250, C.red, 5)),
      front: st(k, g(`translate(${TR[0] - 38} ${TR[1] + 70}) rotate(10) scale(.75)`, O.bolt(C.paper, C.red, 6))) + st(k, g(`translate(${BL[0] - 6} ${BL[1] - 40}) rotate(-12)`, O.star(0, 0, 38, C.navy, C.ink, 4, -90, 9))),
      front2: g('translate(150 774) rotate(-1.5)', O.brush(300, 14, C.navy, 21)),
      seal: 'rect', shift: 0, maxW: 360, under: C.navy, tone: 'light',
    };
    case 'R01': return {
      bg: `<rect width="${W}" height="${H}" fill="${C.wine}"/>${O.torn(-20, 420, 360, 520, C.red, { amp: 18, step: 26, seed: 8 })}<path d="M0 500Q120 560 60 700T30 900" stroke="#000" stroke-opacity=".18" stroke-width="3" fill="none"/>${O.torn(0, -10, 600, 118, C.paper, { amp: 7, step: 20, seed: 12 })}`,
      logo: logo(k, 150, 36, 300), shift: 0, maxW: 360,
      front: g(`translate(${TR[0] - 12} ${TR[1] + 46}) rotate(8)`, st(k, O.star(0, 0, 34, C.yellow, C.ink, 4, -90, 5)) + g('translate(26 52)', st(k, O.star(0, 0, 20, C.yellow, C.ink, 3.5, -80, 7)))) + st(k, g(`translate(${BL[0] - 28} ${BL[1] - 34}) rotate(-8) scale(.62)`, O.note(C.yellow))),
      front2: g('translate(536 800)', `<g filter="url(#sh${k})">${O.vinyl(C.red, 66)}</g>`),
      seal: 'rect', under: C.red, tone: 'dark',
    };
    case 'R02': return {
      bg: `<rect width="${W}" height="${H}" fill="#17141a"/>${Array.from({ length: 22 }, () => `<path d="M${n1(R() * 600)} ${n1(R() * 900)}l${n1(40 + R() * 90)} ${n1((R() - 0.5) * 30)}" stroke="#fff" stroke-opacity=".07" stroke-width="1.4"/>`).join('')}${O.torn(-10, -8, 260, 70, '#e8dcc0', { amp: 6, seed: 3 })}${O.torn(380, 800, 240, 110, '#d9cba8', { amp: 8, seed: 5 })}${O.torn(0, 100, 600, 14, '#e8dcc0', { amp: 4, seed: 6 })}`,
      logo: logo(k, 150, 34, 300, true), shift: 0, maxW: 360, under: C.red,
      front: st(k, g(`translate(${TR[0] - 8} ${TR[1] + 34}) rotate(12)`, O.star(0, 0, 46, 'none', C.red, 6, -90, 4))) + g(`translate(${BL[0] - 24} ${BL[1] - 12})`, O.rays(C.yellow, 6)),
      front2: st(k, g('translate(526 796)', `<rect x="-62" y="-70" width="132" height="130" fill="#e8dcc0" rx="6"/>${O.drumkit()}`)),
      seal: 'rect', tone: 'dark',
    };
    case 'E01': return {
      bg: `<rect width="${W}" height="${H}" fill="#15111a"/>${O.torn(-20, 560, 300, 360, C.red, { amp: 16, step: 24, seed: 21 })}${O.torn(500, 40, 120, 300, C.wine, { amp: 14, step: 24, seed: 22 })}${O.torn(0, 98, 600, 12, '#e8dcc0', { amp: 4, seed: 6 })}<path d="M0 420L180 390M420 880L600 820" stroke="#fff" stroke-opacity=".08" stroke-width="3"/>`,
      logo: logo(k, 150, 36, 300, true), shift: 0, maxW: 360, under: C.red,
      front: g(`translate(${TR[0] - 42} ${TR[1] - 6}) rotate(6)`, O.bolt('none', C.yellow, 7, 1.4)) + g(`translate(${TL[0] - 18} ${TL[1] + 56}) rotate(8)`, O.asterisk(36, C.paper, 5)),
      front2: g('translate(30 858) rotate(-90)', `<g filter="url(#sh${k})">${O.barcode(4, 96, 46)}</g>`) + g('translate(452 828)', O.scribble(C.red, 5, 100)),
      seal: 'rect', tone: 'dark',
    };
    case 'E02': return {
      bg: `<rect width="${W}" height="${H}" fill="#0c0c18"/><rect width="${W}" height="${H}" fill="#1b1b36" opacity=".55"/><path d="M0 700L600 520L600 900L0 900Z" fill="#161630"/>
      <rect x="9" y="9" width="582" height="882" rx="32" fill="none" stroke="url(#ho${k})" stroke-width="16"/><rect x="22" y="22" width="556" height="856" rx="24" fill="none" stroke="url(#ho2${k})" stroke-width="3.5" stroke-opacity=".9"/>
      <path d="M10 220L60 190L52 260ZM590 640L548 600L560 690Z" fill="url(#ho2${k})" opacity=".7"/>`,
      logo: logo(k, 150, 44, 300, true), shift: 0, maxW: 360, under: C.gold,
      front: g(`translate(${TL[0] - 18} ${TL[1] + 8})`, O.sparkle(0, 0, 36, C.white)) + g(`translate(${TR[0] + 8} ${TR[1] + 60})`, O.sparkle(0, 0, 16, '#ffe9a8')) + tapeCorner(TR[0] - 62, TR[1] - 12, 38, 'rgba(255,255,255,.55)'),
      front2: st(k, g('translate(522 800) rotate(4) scale(.82)', O.headphones())),
      seal: 'pill', tone: 'dark',
    };
    case 'E03': return {
      bg: `<rect width="${W}" height="${H}" fill="#121016"/>${O.torn(560, 80, 60, 760, C.red, { amp: 10, step: 22, seed: 31 })}${O.torn(-20, 810, 650, 110, C.red, { amp: 12, step: 22, seed: 32 })}<rect x="8" y="104" width="44" height="684" fill="#050507"/>${O.filmHoles(19, 118, 15, 45)}<path d="M0 88Q300 80 600 96" stroke="#e8dcc0" stroke-opacity=".5" stroke-width="2" fill="none"/>`,
      logo: logo(k, 160, 38, 290, true), shift: 0, maxW: 360, under: C.red,
      front: st(k, g(`translate(${TR[0] - 8} ${TR[1] + 40}) rotate(14)`, O.star(0, 0, 28, '#f1b9b0', C.ink, 4, -90, 14))) + tapeCorner(TL[0] - 8, TL[1] - 12, -24, 'rgba(230,230,230,.62)'),
      front2: st(k, g('translate(100 800) rotate(-6) scale(.82)', O.cassette())) + g('translate(436 830) rotate(-3)', O.swirl(C.red, 3.5)),
      seal: 'pill', tone: 'dark',
    };
    case 'E04': return {
      bg: `<rect width="${W}" height="${H}" fill="#14101a"/>${O.torn(-20, 380, 240, 540, C.wine, { amp: 16, step: 24, seed: 41 })}${O.torn(380, 520, 240, 400, C.red, { amp: 18, step: 26, seed: 42 })}${O.torn(0, 100, 600, 12, '#e8dcc0', { amp: 4, seed: 6 })}`,
      logo: logo(k, 190, 38, 290, true), shift: 0, maxW: 360, under: C.gold,
      front: g('translate(104 66) rotate(-12)', O.crown(C.gold, 6.5)) + g(`translate(${BL[0] - 20} ${BL[1] + 4}) rotate(-10)`, O.rays(C.yellow, 6)),
      front2: g('translate(530 806) rotate(8)', O.star(0, 0, 30, 'none', C.paper, 4, -90, 15)) + g('translate(28 770)', `<g filter="url(#sh${k})">${O.barcode(7, 40, 90)}</g>`),
      over: g('translate(574 40)', `<g filter="url(#sh${k})">${O.vinyl(C.red, 84)}</g>`),
      seal: 'rect', tone: 'dark',
    };
    default: throw new Error(`modelo desconhecido: ${t}`);
  }
}

/** SVG completo da figurinha. `e` = registro do catálogo; sem `url` desenha o modelo vazio (template). */
/** Estilo clássico (SVG desenhado aqui, modelos C01..E04). */
export function cardSVGClassic(e, { url = null, aspect = null, uid = '' } = {}) {
  const t = e.modelo, meta = TEMPLATES[t], k = uid || t + (e.codigo || 'x');
  const P = fitPhoto(aspect || (e.largura_px && e.altura_px ? e.largura_px / e.altura_px : 0.86));
  const d = TPL(t, k, P), dark = meta.dark;
  const name = e.artista_banda || '';
  const label = e.codigo ? `${name}, figurinha ${e.codigo}, ${nomeRaridade(e)}` : `Modelo ${t}, ${meta.nome}, ${meta.raridade}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" data-modelo="${t}">${defs(k)}
<g clip-path="url(#cl${k})">${d.bg}${d.logoBg || ''}${d.logo}
${photoLayer(k, P, url, t)}${d.front || ''}${nameStrip(k, name, 300 + (d.shift || 0), d.maxW || 380, t, d.under)}${d.front2 || ''}${d.over || ''}${seal(k, meta.raridade, d.seal, t)}${codeText({ ...e, codigo: e.codigo || 'F000' }, dark)}
<rect width="${W}" height="${H}" filter="url(#gr${k})" opacity="${dark ? 0.35 : 0.28}" style="mix-blend-mode:multiply" pointer-events="none"/></g>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="39" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/></svg>`;
}

/** Figurinha pronta: estilo novo (modelos M1..M8 enviados pela Bea) por padrão; `estilo: 'classico'` usa os primeiros modelos. */
export function cardSVG(e, opts = {}) {
  return (opts.estilo || 'novo') === 'novo' && hasModelo2(e.modelo2) ? cardSVG2(e, opts) : cardSVGClassic(e, opts);
}
