// Ícones "neon" de linha (estilo arcade): jogos da Kids e instrumentos. Duas cores: `a` (principal) e `b` (detalhe).
// No app as cores vêm do CSS (var(--vio) e var(--mint)); no PDF passam cores fixas.
const svg = (inner, a, b, label = '') => `<svg viewBox="0 0 64 64" class="kx-ico" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}>${inner.replace(/<(\w+) class="a"/g, `<$1 style="stroke:${a}"`).replace(/<(\w+) class="b"/g, `<$1 style="stroke:${b}"`).replace(/<(\w+) class="af"/g, `<$1 style="stroke:${a};fill:${a};fill-opacity:.18"`).replace(/<(\w+) class="bf"/g, `<$1 style="stroke:${b};fill:${b};fill-opacity:.18"`)}</svg>`;

const D = {
  /* ---- jogos ---- */
  pecas: `<ellipse class="af" cx="32" cy="26" rx="20" ry="6"/><path class="a" d="M12 26v16q0 7 20 7t20-7V26"/><path class="b" d="M20 31v14M32 33v16M44 31v14"/><path class="b" d="M42 6l12 11M54 6L42 17"/>`,
  pauta: `<path class="a" d="M6 18h52M6 25h52M6 32h52M6 39h52M6 46h52"/><ellipse class="bf" cx="30" cy="39" rx="6" ry="4.4" transform="rotate(-20 30 39)"/><path class="b" d="M35.5 37V12"/>`,
  figuras: `<ellipse class="bf" cx="20" cy="46" rx="6.4" ry="4.8" transform="rotate(-20 20 46)"/><ellipse class="bf" cx="44" cy="42" rx="6.4" ry="4.8" transform="rotate(-20 44 42)"/><path class="b" d="M26 44V18M50 40V14"/><path class="a" d="M26 18l24-4" stroke-width="5"/>`,
  bumbos: `<circle class="af" cx="30" cy="32" r="19"/><circle class="b" cx="30" cy="32" r="10"/><circle class="b" cx="30" cy="32" r="1.4"/><path class="a" d="M16 49l-6 8M44 49l6 8"/><path class="b" d="M53 22q6 10 0 20M58 16q10 16 0 32"/>`,
  memoria: `<rect class="af" x="8" y="14" width="26" height="34" rx="5" transform="rotate(-9 21 31)"/><rect class="bf" x="28" y="14" width="26" height="34" rx="5" transform="rotate(9 41 31)"/><path class="b" d="M41 26v14M41 26l6 2"/><circle class="b" cx="38" cy="41" r="3"/>`,
  detetive: `<circle class="af" cx="27" cy="27" r="16"/><path class="a" d="M39 39l16 16"/><path class="b" d="M17 27h4l3-8 4 16 3-8h5"/>`,
  eco: `<path class="af" d="M8 26v12h8l12 10V16L16 26z"/><path class="b" d="M36 24q6 8 0 16M43 18q11 14 0 28M50 12q16 20 0 40"/>`,
  album: `<rect class="af" x="12" y="8" width="40" height="48" rx="6"/><path class="b" d="M32 20l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L32 38.4l-7.2 4 1.4-8.1-5.9-5.7 8.1-1.2z"/><path class="a" d="M18 50h28"/>`,
  relatorio: `<path class="af" d="M14 6h26l12 12v40H14z"/><path class="a" d="M40 6v12h12"/><path class="b" d="M22 28h20M22 36h20M22 44h12"/>`,
  explorar: `<path class="b" d="M10 10l26 26M54 10L28 36"/><circle class="af" cx="32" cy="46" r="12"/><circle class="a" cx="32" cy="46" r="4"/>`,
  ritmo: `<rect class="af" x="6" y="22" width="12" height="20" rx="3"/><rect class="a" x="20" y="22" width="12" height="20" rx="3"/><rect class="bf" x="34" y="22" width="12" height="20" rx="3"/><rect class="b" x="48" y="22" width="10" height="20" rx="3"/><path class="b" d="M12 14v4M26 14v4M40 14v4"/>`,
  robo: `<rect class="af" x="14" y="18" width="36" height="30" rx="9"/><path class="b" d="M32 18v-8"/><circle class="b" cx="32" cy="8" r="2.4"/><circle class="a" cx="25" cy="32" r="3"/><circle class="a" cx="39" cy="32" r="3"/><path class="b" d="M26 41q6 4 12 0"/>`,
  /* ---- instrumentos ---- */
  bumbo: `<circle class="af" cx="32" cy="29" r="22"/><circle class="b" cx="32" cy="29" r="13"/><circle class="a" cx="32" cy="29" r="2"/><path class="a" d="M14 46l-7 10M50 46l7 10"/><path class="b" d="M32 3v5M32 50v5M9 29h5M50 29h5"/>`,
  caixa: `<ellipse class="af" cx="32" cy="26" rx="22" ry="7"/><path class="a" d="M10 26v17q0 8 22 8t22-8V26"/><path class="b" d="M18 31v16M26 33v18M38 33v18M46 31v16"/><path class="b" d="M42 6l14 12M54 4L38 16"/>`,
  chimbal: `<ellipse class="af" cx="32" cy="22" rx="24" ry="5.5"/><ellipse class="a" cx="32" cy="30" rx="24" ry="5.5"/><path class="b" d="M32 36v20M32 56l-12 4M32 56l12 4M32 56v5"/><path class="b" d="M32 10v7"/>`,
  prato: `<ellipse class="af" cx="32" cy="20" rx="27" ry="7" transform="rotate(-8 32 20)"/><ellipse class="b" cx="32" cy="19" rx="7" ry="2.4" transform="rotate(-8 32 19)"/><path class="a" d="M32 28v28M32 56l-13 5M32 56l13 5"/>`,
  tom: `<ellipse class="af" cx="32" cy="22" rx="22" ry="7"/><path class="a" d="M10 22v20q0 7 22 7t22-7V22"/><path class="b" d="M20 28v16M32 30v18M44 28v16"/><path class="a" d="M16 48l-6 11M48 48l6 11"/>`,
  guitarra: `<g transform="rotate(38 32 32)"><path class="a" d="M27 8l-2-5h14l-2 5v14h-10z"/><path class="b" d="M29 22v18M35 22v18"/><path class="af" d="M25 38c-4 0-7 5-4 9 2 3 1 5-1 8-3 6 1 9 12 9s15-3 12-9c-2-3-3-5-1-8 3-4 0-9-4-9-3 0-4 2-7 2s-4-2-7-2z"/><path class="b" d="M28 46h8M28 52h8"/></g>`,
  baixo: `<g transform="rotate(38 32 32)"><path class="a" d="M28 6l-1-4h10l-1 4v16h-8z"/><path class="b" d="M30 22v20M34 22v20"/><path class="af" d="M26 40c-3 0-6 4-3 8 2 3 0 5-1 8-2 5 2 8 10 8s12-3 10-8c-1-3-3-5-1-8 3-4 0-8-3-8-3 0-4 2-6 2s-3-2-6-2z"/><path class="b" d="M28 49h8M28 55h8"/></g>`,
  teclado: `<rect class="af" x="4" y="16" width="56" height="34" rx="4"/><path class="b" d="M14 50V34M24 50V34M34 50V34M44 50V34M54 50V34"/><path class="a" d="M12 16v18M22 16v18M42 16v18M52 16v18" stroke-width="5"/><path class="b" d="M8 24h6M46 24h10"/>`,
  voz: `<g transform="rotate(-18 32 32)"><circle class="af" cx="32" cy="17" r="12"/><path class="b" d="M22 13h20M21 19h22M26 8v18M38 8v18"/><path class="a" d="M25 29h14l-3 28q-4 4-8 0z"/><path class="b" d="M30 38h4"/></g><path class="b" d="M52 20q6 8 0 16M57 14q10 14 0 28"/>`,
  pandeiro: `<circle class="af" cx="32" cy="32" r="22"/><circle class="b" cx="32" cy="32" r="14"/><path class="a" d="M32 10v8M32 46v8M10 32h8M46 32h8M16 16l6 6M42 42l6 6M48 16l-6 6M22 42l-6 6"/><circle class="bf" cx="32" cy="32" r="3"/>`,
  flauta: `<g transform="rotate(-35 32 32)"><rect class="af" x="4" y="26" width="56" height="12" rx="6"/><circle class="b" cx="16" cy="32" r="2.2"/><circle class="b" cx="26" cy="32" r="2.2"/><circle class="b" cx="36" cy="32" r="2.2"/><circle class="b" cx="46" cy="32" r="2.2"/><path class="a" d="M8 26v-5"/></g>`,
  cordas: `<g transform="rotate(-18 32 32)"><path class="a" d="M32 3v18"/><path class="af" d="M32 18c-9 0-12 5-9 10 3 3 1 6-1 9-4 6-1 14 6 17 3 1 7 1 10 0 7-3 10-11 6-17-2-3-4-6-1-9 3-5 0-10-9-10z"/><path class="b" d="M26 30c2 4 2 8 0 12M38 30c-2 4-2 8 0 12"/><path class="b" d="M32 22v26"/></g><path class="a" d="M8 58L58 14"/>`,
};
export const gameIcon = (id, a = 'var(--ia, #1b1818)', b = 'var(--ib, #a31d30)', label = '') => svg(D[id] || D.pecas, a, b, label);
export const instrumentIcon = gameIcon;

/* ---- bateria completa (jogo "que peça é essa?"): cada peça é um <g class="kp" data-p> clicável ---- */
export const KIT_COLORS = { bd: '#a31d30', sn: '#e3a82f', hh: '#1b1818', tt: '#14284b', mt: '#4a6a9c', ft: '#6e1423', cr: '#b8860b', rd: '#8a5a14' };
/** `only`: pinta só essa peça e deixa o resto cinza (cartas da memória). */
export function kitSvg(hl, hide, only) {
  const set = only ? String(only).split('+') : null; // `only` pode ser mais de uma peça ("hh+bd")
  const col = (id) => (hide || (set && !set.includes(id)) ? '#cfc6b6' : KIT_COLORS[id]); const on = (id) => (hl === id ? ' hl' : '');
  const sw = 'fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const drum = (id, x, y, w, h, nl) => { const rx = w / 2; const c = col(id); return `<g class="kp${on(id)}" data-p="${id}" style="--c:${c}"><path d="M${x} ${y} V${y + h} A${rx} ${h * 0.2} 0 0 0 ${x + w} ${y + h} V${y}" ${sw} stroke="${c}" fill="${c}" fill-opacity=".14"/><ellipse cx="${x + rx}" cy="${y}" rx="${rx}" ry="${h * 0.22}" ${sw} stroke="${c}" fill="${c}" fill-opacity=".1"/>${Array.from({ length: nl }, (_, i) => `<path d="M${(x + 9 + ((w - 18) * i) / (nl - 1)).toFixed(1)} ${y + h * 0.28}V${y + h * 0.78}" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`).join('')}</g>`; };
  const cym = (id, x, y, rx, tilt, two) => { const c = col(id); return `<g class="kp${on(id)}" data-p="${id}" style="--c:${c}"><path d="M${x} ${y + 6}V${y + (two ? 150 : 130)}" ${sw} stroke="${c}" opacity=".7"/><g transform="rotate(${tilt} ${x} ${y})">${two ? `<ellipse cx="${x}" cy="${y + 12}" rx="${rx}" ry="${rx / 5}" ${sw} stroke="${c}" opacity=".7"/>` : ''}<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx / 5}" ${sw} stroke="${c}" fill="${c}" fill-opacity=".14"/><ellipse cx="${x}" cy="${y - 1}" rx="${rx * 0.18}" ry="${rx * 0.06}" stroke="${c}" stroke-width="2" fill="none"/></g></g>`; };
  const bc = col('bd');
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria">
    ${cym('cr', 85, 45, 64, -8)}${cym('rd', 340, 55, 68, 6)}${cym('hh', 40, 128, 40, 0, true)}
    ${drum('tt', 138, 95, 66, 46, 4)}${drum('mt', 218, 95, 66, 46, 4)}${drum('ft', 300, 165, 92, 92, 5)}${drum('sn', 72, 178, 92, 40, 5)}
    <g class="kp${on('bd')}" data-p="bd" style="--c:${bc}"><circle cx="210" cy="218" r="76" ${sw} stroke="${bc}" fill="${bc}" fill-opacity=".1"/><circle cx="210" cy="218" r="58" ${sw} stroke="${bc}" stroke-width="2.4" opacity=".8"/>${Array.from({ length: 12 }, (_, i) => `<path d="M210 146v-8" stroke="${bc}" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 30} 210 218)"/>`).join('')}<text x="210" y="224" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="19" textLength="92" lengthAdjust="spacingAndGlyphs" fill="${bc}">Beaterista</text></g></svg>`;
}
