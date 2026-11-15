// Desenho dos 3 modelos da bateria de toque, feitos a partir de fotos de instrumentos de verdade:
//  - acústica: kit preto laqueado, ferragens cromadas, bumbo com pele fumê e furo, pratos dourados em hastes (vista de frente);
//  - eletrônica: vista de cima, pads de malha branca com aro de cor, pratos pretos meio coloridos, módulo e pedais;
//  - cajón (Spark): frente de madeira clara com furinhos, laterais pretas, assento acolchoado, só GRAVE e AGUDO.
// Mesmas peças e mesmos ids (cr rd hh tt mt ft sn bd) nos 3, pra gravação, partitura e teclado funcionarem igual.
// Cores = partitura colorida do Beat Lab (bumbo verde, caixa vermelha, chimbal azul, tom laranja, surdo roxo, prato dourado, condução azul-petróleo):
// aparecem no aro da pele, na borda dos pratos, no anel dos pads e na etiqueta com o nome de cada peça.
// Regra do CSS dos temas (kids.css): repinta tudo que tem [fill-opacity] e [stroke] dentro de .kp. Por isso aqui NÃO se usa fill-opacity
// (transparência é "opacity") e traço só por style="" (que vence o tema). O dedo mede o centro da peça pelo elemento marcado com data-head.
import { COLORS } from '../beats.js';

const COR = { cr: COLORS.cr, rd: COLORS.rd, hh: COLORS.hh, tt: COLORS.tt, mt: COLORS.mt, ft: COLORS.ft, sn: COLORS.sn, bd: COLORS.bd };
const NOME = { cr: 'crash', rd: 'condução', hh: 'chimbal', tt: 'tom 1', mt: 'tom 2', ft: 'surdo', sn: 'caixa', bd: 'bumbo' };

/* ---------- cores ---------- */
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (h, alvo, k) => { const a = rgb(h); const b = rgb(alvo); return hex(a.map((v, i) => v + (b[i] - v) * k)); };
const claro = (h, k) => mix(h, '#ffffff', k);
const escuro = (h, k) => mix(h, '#000000', k);
const lum = (h) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

/* ---------- gradientes ---------- */
const DEFS = `<defs>
  <linearGradient id="km-cromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfbfb"/><stop offset=".22" stop-color="#9b9ba4"/><stop offset=".45" stop-color="#ffffff"/><stop offset=".7" stop-color="#7a7a84"/><stop offset="1" stop-color="#dcdce1"/></linearGradient>
  <linearGradient id="km-cromo2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2f2f2"/><stop offset=".5" stop-color="#8b8b95"/><stop offset="1" stop-color="#e8e8ec"/></linearGradient>
  <linearGradient id="km-laca" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#08090b"/><stop offset=".13" stop-color="#2d303b"/><stop offset=".26" stop-color="#101116"/><stop offset=".7" stop-color="#06070a"/><stop offset=".9" stop-color="#1d1f27"/><stop offset="1" stop-color="#09090c"/></linearGradient>
  <radialGradient id="km-laca-r" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="#3a3d49"/><stop offset=".45" stop-color="#14151a"/><stop offset="1" stop-color="#050507"/></radialGradient>
  <radialGradient id="km-pele" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eeeae0"/><stop offset="1" stop-color="#cdc7b6"/></radialGradient>
  <radialGradient id="km-fumaca" cx=".36" cy=".3" r=".95"><stop offset="0" stop-color="#c3c8d2"/><stop offset=".5" stop-color="#6a6f7b"/><stop offset="1" stop-color="#2d3037"/></radialGradient>
  <linearGradient id="km-ouro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fcebb0"/><stop offset=".35" stop-color="#e4b94e"/><stop offset=".7" stop-color="#b98620"/><stop offset="1" stop-color="#7c540d"/></linearGradient>
  <radialGradient id="km-brilho" cx=".3" cy=".25" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="km-sombra" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="km-malhaE" cx=".4" cy=".34" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e4ea"/><stop offset="1" stop-color="#bbbcc8"/></radialGradient>
  <linearGradient id="km-borracha" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3a42"/><stop offset="1" stop-color="#0b0b0e"/></linearGradient>
  <pattern id="km-trama" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 2h4M2 0v4" stroke="#6b6d7c" stroke-opacity=".28" stroke-width=".6"/></pattern>
  <linearGradient id="km-feixe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="km-pinho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d49c"/><stop offset=".5" stop-color="#e7b975"/><stop offset="1" stop-color="#d49f5a"/></linearGradient>
  <linearGradient id="km-lateral" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#26262c"/><stop offset=".5" stop-color="#101013"/><stop offset="1" stop-color="#050506"/></linearGradient>
  <linearGradient id="km-banco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3b42"/><stop offset="1" stop-color="#0f0f12"/></linearGradient>
</defs>`;

const volta = (n, f) => Array.from({ length: n }, (_, i) => f((i * 360) / n, i)).join('');
const FONTE = "'Gochi Hand','Comic Sans MS',cursive";
/** Etiqueta com o nome da peça, na cor dela (a cor da partitura). `fundo` pode ser trocado (pads escuros). */
function pilula(x, y, txt, fundo, { escura = false, extra = '' } = {}) {
  const w = Math.round(txt.length * 7 + 15);
  const fg = escura ? 'rt-claro' : lum(fundo) > 0.6 ? 'rt-preto' : 'rt-claro';
  const cor = escura ? '#fff' : lum(fundo) > 0.6 ? '#1c1710' : '#fff';
  return `<g><rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="18" rx="9" fill="${escura ? '#121216' : fundo}"/><text class="${fg} rt-fica" x="${x}" y="${y + 4.6}" text-anchor="middle" font-family="${FONTE}" font-size="13" font-weight="700" fill="${cor}" stroke="none"${extra}>${txt}</text></g>`;
}
const brilhaE = (cx, cy, rx, ry, c) => `<ellipse class="km-brilha" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke-opacity="0" style="stroke:${claro(c, 0.3)};stroke-width:5"/>`;
const brilhaC = (cx, cy, r, c) => brilhaE(cx, cy, r, r, c).replace('<ellipse', '<circle').replace(` rx="${r}" ry="${r}"`, ` r="${r}"`);

/* ================= ACÚSTICA (vista de frente, preta laqueada) ================= */
/** Tambor (tom, caixa, surdo): casco preto laqueado, aro cromado, aro da pele na cor da peça, pele branca em cima, parafusos nas laterais. */
function casco(id, cx, top, w, h, ry, { lugs = 3, snare = false } = {}) {
  const c = COR[id]; const rx = w / 2; const x = cx - rx; const yc = top + ry; const yb = yc + h;
  const lug = [-0.34, 0, 0.34].slice(lugs === 4 ? 0 : 0, lugs).map((k) => `<rect x="${cx + k * w - 2.6}" y="${yc + h * 0.26}" width="5.2" height="${h * 0.46}" rx="2" fill="url(#km-cromo)"/><circle cx="${cx + k * w}" cy="${yc + h * 0.49}" r="1.2" fill="#3a3a44"/>`).join('');
  return `<g class="kp" data-p="${id}" style="--c:${c}">
    <ellipse cx="${cx + 4}" cy="${yb + ry * 0.7}" rx="${rx + 6}" ry="${ry + 3}" fill="url(#km-sombra)"/>
    <ellipse cx="${cx}" cy="${yb}" rx="${rx + 1.5}" ry="${ry + 1.5}" fill="url(#km-cromo2)"/>
    <path d="M${x} ${yc} V${yb - 3.5} A${rx} ${ry} 0 0 0 ${x + w} ${yb - 3.5} V${yc} Z" fill="url(#km-laca)"/>
    <rect x="${x + w * 0.1}" y="${yc + 2}" width="${w * 0.07}" height="${h - 8}" rx="${w * 0.035}" fill="#fff" opacity=".16"/>
    ${lug}
    ${snare ? `<rect x="${x + w - 3}" y="${yc + h * 0.3}" width="7" height="${h * 0.4}" rx="2" fill="url(#km-cromo)"/><circle cx="${x + w + 3.5}" cy="${yc + h * 0.5}" r="2" fill="#c8c8d0"/>` : ''}
    <ellipse cx="${cx}" cy="${yc}" rx="${rx + 1.6}" ry="${ry + 1.6}" fill="#0b0b0e"/>
    <ellipse cx="${cx}" cy="${yc}" rx="${rx}" ry="${ry}" fill="url(#km-cromo)"/>
    <ellipse cx="${cx}" cy="${yc}" rx="${rx - 3}" ry="${ry - 2.2}" fill="${c}"/>
    <ellipse cx="${cx}" cy="${yc}" rx="${rx - 5.2}" ry="${ry - 3.6}" fill="url(#km-pele)" data-head="1"/>
    <ellipse cx="${cx}" cy="${yc}" rx="${rx - 5.2}" ry="${ry - 3.6}" fill="url(#km-brilho)"/>
    ${pilula(cx, yc + h * 0.55, NOME[id], c)}
    ${brilhaE(cx, yc, rx + 6, ry + 5, c)}
  </g>`;
}
/** Prato dourado visto de lado (elipse), borda na cor da peça, cúpula e brilho. */
function prato(id, cx, cy, rx, ry, { rot = 0, chimbal = false } = {}) {
  const c = COR[id];
  const disco = (y, esc) => `<ellipse cx="${cx}" cy="${y}" rx="${rx + 1.6}" ry="${ry + 1.6}" fill="#1a1408"/><ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="${esc ? '#8d6416' : 'url(#km-ouro)'}"/>`;
  const aneis = [0.8, 0.62, 0.44].map((k) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx * k}" ry="${ry * k}" fill="none" style="stroke:#000;stroke-opacity:.14;stroke-width:.8"/>`).join('');
  return `<g class="kp" data-p="${id}" style="--c:${c}">
    <g transform="rotate(${rot} ${cx} ${cy})">
      <ellipse cx="${cx + 4}" cy="${cy + ry + 6}" rx="${rx}" ry="${ry * 0.6}" fill="url(#km-sombra)"/>
      ${chimbal ? disco(cy + 6, true) : ''}
      ${disco(cy, false)}
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.94}" ry="${ry * 0.94}" fill="${c}" data-head="1"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.86}" ry="${ry * 0.86}" fill="url(#km-ouro)"/>
      ${aneis}
      <ellipse cx="${cx - rx * 0.28}" cy="${cy - ry * 0.28}" rx="${rx * 0.42}" ry="${ry * 0.3}" fill="url(#km-brilho)"/>
      <ellipse cx="${cx}" cy="${cy - ry * 0.12}" rx="${rx * 0.2}" ry="${ry * 0.5}" fill="#c99a30"/>
      <ellipse cx="${cx - rx * 0.04}" cy="${cy - ry * 0.22}" rx="${rx * 0.08}" ry="${ry * 0.2}" fill="#fff" opacity=".6"/>
      ${brilhaE(cx, cy, rx + 5, ry + 5, c)}
    </g>
    ${pilula(cx, cy + ry + (chimbal ? 20 : 15), NOME[id], c)}
  </g>`;
}
/** Bumbo de frente: círculo grande, casco preto, aro cromado, aro verde, pele fumê com furo, pedal. O logo da Beaterista entra por cima (putLogo). */
function bumbo(cx, cy, R) {
  const c = COR.bd;
  const parafusos = volta(10, (a) => `<g transform="rotate(${a} ${cx} ${cy})"><rect x="${cx - 3}" y="${cy - R + 0.5}" width="6" height="9" rx="2" fill="url(#km-cromo)"/><circle cx="${cx}" cy="${cy - R + 5}" r="1.2" fill="#3a3a44"/></g>`);
  const hx = cx - 15; const hy = cy + 21;
  return `<g class="kp" data-p="bd" data-logo="${cx - 40},${cy - 46},80,41" style="--c:${c}">
    <ellipse cx="${cx + 5}" cy="${cy + R * 0.92}" rx="${R + 4}" ry="${R * 0.26}" fill="url(#km-sombra)"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 1.6}" fill="#0b0b0e"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#km-laca-r)"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 3}" fill="url(#km-cromo)"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 8}" fill="#0e0e12"/>
    ${parafusos}
    <circle cx="${cx}" cy="${cy}" r="${R - 10.5}" fill="#d9b27c"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 14}" fill="${c}"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 17}" fill="url(#km-fumaca)" data-head="1"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 17}" fill="url(#km-brilho)"/>
    <circle cx="${hx}" cy="${hy}" r="17.5" fill="#d9b27c"/><circle cx="${hx}" cy="${hy}" r="15" fill="#fbf6e8"/><circle cx="${hx + 3}" cy="${hy + 4}" r="11" fill="url(#km-sombra)" opacity=".35"/>
    <rect x="${hx - 6}" y="${hy - 4}" width="11" height="9" rx="2" fill="#16161a"/><rect x="${hx - 5}" y="${hy + 4}" width="9" height="9" rx="2.4" fill="#ece1bb"/>
    <path d="M${cx - 22} ${cy + R - 6} h26 l4 12 h-34 Z" fill="#2a2c35"/><rect x="${cx - 20}" y="${cy + R + 2}" width="22" height="6" rx="2" fill="#8a8c97"/>
    ${pilula(cx + 26, cy + 36, NOME.bd, c)}
    ${brilhaC(cx, cy, R + 6, c)}
  </g>`;
}
/** Hastes de pratos e do chimbal (fora das peças: o tema não mexe nelas). */
const haste = (x, y1, y2) => `<path d="M${x} ${y1} V${y2} M${x} ${y2} L${x - 26} ${y2 + 12} M${x} ${y2} L${x + 26} ${y2 + 12}" stroke="#a3a5b0" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="${x}" cy="${y1 + 12}" r="3.6" fill="#d9dae0"/>`;

export function acustica() {
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria acústica preta">${DEFS}
    ${haste(98, 62, 248)}${haste(352, 74, 250)}${haste(36, 128, 262)}
    <path d="M326 232 V268 M366 232 V268" stroke="#a3a5b0" stroke-width="3.2" stroke-linecap="round"/><rect x="321" y="266" width="10" height="6" rx="2" fill="#111"/><rect x="361" y="266" width="10" height="6" rx="2" fill="#111"/>
    ${bumbo(208, 196, 62)}
    ${prato('cr', 98, 54, 42, 11, { rot: -7 })}${prato('rd', 352, 64, 48, 12, { rot: 5 })}${prato('hh', 38, 120, 30, 8, { chimbal: true })}
    ${casco('tt', 164, 90, 66, 46, 12)}${casco('mt', 252, 90, 66, 46, 12)}${casco('sn', 98, 148, 84, 22, 12, { snare: true })}${casco('ft', 346, 140, 80, 78, 14, { lugs: 3 })}
  </svg>`;
}

/* ================= ELETRÔNICA (vista de cima, malha branca + pratos pretos) ================= */
/** Pad de malha branca, aro grosso preto e anel na cor da peça (na foto é laranja). Sensor no meio. */
function pad(id, cx, cy, R, { extra = '' } = {}) {
  const c = COR[id]; const rm = R - 10;
  return `<g class="kp" data-p="${id}" ${id === 'bd' ? `data-logo="${cx - 26},${cy - 22},52,27" ` : ''}style="--c:${c}">
    ${extra}
    <circle cx="${cx + 4}" cy="${cy + 7}" r="${R + 7}" fill="url(#km-sombra)"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 1.5}" fill="#050507"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#km-borracha)"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 4.5}" fill="${c}"/>
    <circle cx="${cx}" cy="${cy}" r="${rm + 1.6}" fill="#0b0b0e"/>
    <circle cx="${cx}" cy="${cy}" r="${rm}" fill="url(#km-malhaE)" data-head="1"/>
    <circle cx="${cx}" cy="${cy}" r="${rm}" fill="url(#km-trama)"/>
    ${id === 'bd' ? '' : `<circle cx="${cx}" cy="${cy - rm * 0.2}" r="${rm * 0.13}" fill="#c9cad4"/>`}
    <circle cx="${cx}" cy="${cy}" r="${rm}" fill="url(#km-brilho)"/>
    ${pilula(cx, cy + rm * 0.55, NOME[id], c, { escura: true })}
    ${brilhaC(cx, cy, R + 5, c)}
  </g>`;
}
/** Prato eletrônico: disco preto, metade na cor da peça (como o amarelo da foto), cúpula e brilho. */
function pratoE(id, cx, cy, R, { extra = '' } = {}) {
  const c = COR[id];
  return `<g class="kp" data-p="${id}" style="--c:${c}">
    ${extra}
    <circle cx="${cx + 4}" cy="${cy + 7}" r="${R + 7}" fill="url(#km-sombra)"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 1.5}" fill="#050507"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}" data-head="1"/>
    <g transform="rotate(-24 ${cx} ${cy})"><path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="#17171b"/></g>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#km-brilho)"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 0.22}" fill="#0b0b0e"/><circle cx="${cx - R * 0.05}" cy="${cy - R * 0.06}" r="${R * 0.09}" fill="#fff" opacity=".5"/>
    ${pilula(cx + R * 0.1, cy + R * 0.55, NOME[id], c, { escura: true })}
    ${brilhaC(cx, cy, R + 5, c)}
  </g>`;
}
export function eletronica() {
  const tubo = (d, w = 6) => `<path d="${d}" stroke="#1d1d22" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const pedalHH = '<g transform="rotate(10 60 262)"><rect x="40" y="236" width="40" height="52" rx="7" fill="#1d1d22"/><rect x="45" y="242" width="30" height="38" rx="5" fill="url(#km-cromo2)"/><path d="M50 250 h20 M50 258 h20 M50 266 h20" style="stroke:#3a3a44;stroke-width:2"/></g>';
  const pedalBD = '<rect x="222" y="262" width="36" height="34" rx="7" fill="#1d1d22"/><rect x="227" y="267" width="26" height="24" rx="5" fill="url(#km-cromo2)"/><path d="M231 274 h18 M231 281 h18" style="stroke:#3a3a44;stroke-width:2"/>';
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria eletrônica">${DEFS}
    ${tubo('M40 96 L40 84 L394 84 L394 236', 7)}${tubo('M40 150 L22 236', 7)}${tubo('M394 236 L402 282', 7)}
    ${tubo('M118 84 V52', 5)}${tubo('M310 84 V52', 5)}${tubo('M50 124 L40 96', 5)}${tubo('M330 154 L394 154', 5)}
    <rect x="176" y="10" width="62" height="34" rx="5" fill="#101013"/><rect x="182" y="16" width="30" height="16" rx="3" fill="#e9b73a"/><circle cx="224" cy="22" r="4" fill="#4a4a54"/><circle cx="224" cy="35" r="3" fill="#4a4a54"/><rect x="184" y="36" width="24" height="3" rx="1.5" fill="#4a4a54"/>
    ${pratoE('cr', 118, 46, 40)}${pratoE('rd', 310, 46, 40)}${pratoE('hh', 52, 124, 36, { extra: pedalHH })}
    ${pad('tt', 190, 100, 30)}${pad('mt', 256, 100, 30)}${pad('ft', 330, 154, 33)}${pad('sn', 160, 178, 38)}${pad('bd', 240, 226, 40, { extra: pedalBD })}
  </svg>`;
}

/* ================= CAJÓN (Spark): frente de madeira clara, laterais pretas, assento, grave e agudo ================= */
export function cajon() {
  const furos = [[112, 69], [150, 66], [190, 66], [230, 67], [262, 71], [106, 114], [104, 170], [100, 226], [108, 270], [148, 271], [188, 271], [228, 271], [268, 267], [270, 130], [272, 190], [274, 240]];
  const veios = volta(9, (_, i) => `<path d="M${114 + i * 18} 70 C ${110 + i * 18} 140, ${120 + i * 18} 200, ${114 + i * 18} 270" fill="none" style="stroke:#8a5420;stroke-opacity:${i % 2 ? 0.1 : 0.17};stroke-width:${i % 3 ? 1 : 1.5}"/>`);
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Cajón Spark">${DEFS}
    <ellipse cx="200" cy="284" rx="130" ry="10" fill="url(#km-sombra)"/>
    <path d="M272 58 L322 44 C332 110 334 200 326 262 L278 278 Z" fill="url(#km-lateral)"/>
    <path d="M290 74 C 298 120 298 200 292 252" fill="none" style="stroke:#fff;stroke-opacity:.08;stroke-width:3"/>
    <g transform="rotate(-7 304 160)"><rect x="293" y="138" width="24" height="40" rx="4" fill="#f4f4f6"/><text class="rt-fica" x="305" y="170" text-anchor="middle" font-family="'Arial Black',Impact,sans-serif" font-size="30" font-weight="900" fill="#121216" stroke="none">S</text></g>
    <path d="M96 40 C 140 18, 262 16, 322 34 L 326 48 L 274 60 L 98 60 Z" fill="url(#km-banco)"/>
    <path d="M122 34 C 170 24, 246 24, 306 36" fill="none" style="stroke:#fff;stroke-opacity:.22;stroke-width:2.2;stroke-linecap:round"/>
    <path d="M100 58 L272 58 L278 278 L94 278 Z" fill="url(#km-pinho)"/>
    ${veios}
    ${furos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.3" fill="#16110b"/>`).join('')}
    <g transform="translate(106 252)"><rect x="0" y="0" width="12" height="12" rx="2" fill="#16110b"/><path d="M9 3 h-6 v2.4 h6 v3.6 h-6 v1 h6" fill="none" style="stroke:#f4d9a8;stroke-width:1.6"/><text class="rt-fica" x="16" y="11.5" font-family="'Arial Black',Impact,sans-serif" font-size="14" font-weight="900" fill="#16110b" stroke="none">SPARK</text><text class="rt-fica" x="76" y="1" font-family="Arial,sans-serif" font-size="5.5" font-weight="700" fill="#16110b" stroke="none" transform="rotate(90 76 1)">CAJONS</text></g>
    <g class="kp" data-p="sn" style="--c:${COR.sn}">
      <rect x="118" y="76" width="140" height="56" rx="12" fill="#c58f50"/>
      <rect x="121" y="79" width="134" height="50" rx="10" fill="${COR.sn}"/>
      <rect x="125" y="83" width="126" height="42" rx="8" fill="#efc88f" data-head="1"/><rect x="125" y="83" width="126" height="42" rx="8" fill="url(#km-brilho)"/>
      ${pilula(188, 104, 'agudo', COR.sn)}
      <rect class="km-brilha" x="114" y="72" width="148" height="64" rx="14" fill="none" stroke-opacity="0" style="stroke:${claro(COR.sn, 0.3)};stroke-width:5"/>
    </g>
    <g class="kp" data-p="bd" style="--c:${COR.bd}">
      <circle cx="188" cy="190" r="54" fill="#c58f50"/><circle cx="188" cy="190" r="50" fill="${COR.bd}"/>
      <circle cx="188" cy="190" r="44" fill="#efc88f" data-head="1"/><circle cx="188" cy="190" r="44" fill="url(#km-brilho)"/>
      ${pilula(188, 192, 'grave', COR.bd)}
      <circle class="km-brilha" cx="188" cy="190" r="60" fill="none" stroke-opacity="0" style="stroke:${claro(COR.bd, 0.3)};stroke-width:5"/>
    </g>
    <rect x="102" y="276" width="26" height="8" rx="4" fill="#1a1a1e"/><rect x="246" y="276" width="26" height="8" rx="4" fill="#1a1a1e"/>
  </svg>`;
}
export const arte = (modelo) => (modelo === 'eletronica' ? eletronica() : modelo === 'cajon' ? cajon() : acustica());
