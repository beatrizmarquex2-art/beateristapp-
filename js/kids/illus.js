// Ilustrações dos instrumentos e da bateria: vetor desenhado aqui, com brilho, sombra e detalhes de verdade
// (aros, parafusos, anéis dos pratos, trastes, tarraxas, cordas, furos em f). Sem imagem de fora, funciona offline.
const K = '#1b1818';
const lin = (id, x1, y1, x2, y2, stops) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.4) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.75">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
const CHROME = (id) => lin(id, 0, 0, 1, 0, [[0, '#8d949b'], [0.3, '#f7f8f9'], [0.55, '#b9bfc5'], [1, '#6f767d']]);
const GOLD = (id) => lin(id, 0, 0, 1, 1, [[0, '#fff1a8'], [0.35, '#f0c13c'], [0.7, '#b8860b'], [1, '#f6d765']]);
const SKIN = (id) => rad(id, [[0, '#ffffff'], [0.7, '#f4efe6'], [1, '#d9d2c5']]);
const shell = (id, a, b, c) => lin(id, 0, 0, 1, 0, [[0, c], [0.25, b], [0.45, a], [0.7, b], [1, c]]);
const wrap = (label, defs, body) => `<svg viewBox="0 0 120 120" role="img" aria-label="${label}"><defs>${defs}</defs>${body}</svg>`;
const shadow = '<ellipse cx="60" cy="113" rx="40" ry="4.5" fill="#000" opacity=".16"/>';
const stroke = `stroke="${K}" stroke-linejoin="round" stroke-linecap="round"`;
const lugs = (n, x0, x1, y0, y1, cls = 'url(#ch)') => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return `<rect x="${(x0 + (x1 - x0) * t - 2).toFixed(1)}" y="${y0}" width="4" height="${y1 - y0}" rx="1.4" fill="${cls}" ${stroke} stroke-width="1"/>`; }).join('');
const rings = (cx, cy, rx, ry, n, col = '#7a5a0a') => Array.from({ length: n }, (_, i) => { const k = (i + 1) / (n + 1); return `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * k).toFixed(1)}" ry="${(ry * k).toFixed(1)}" fill="none" stroke="${col}" stroke-width=".7" opacity=".45"/>`; }).join('');
const tripod = (x, y) => `<path d="M${x} ${y} L${x - 26} 113 M${x} ${y} L${x + 26} 113 M${x} ${y} L${x} 115" ${stroke} stroke-width="3.2" fill="none"/><path d="M${x} ${y} L${x - 26} 113 M${x} ${y} L${x + 26} 113 M${x} ${y} L${x} 115" stroke="#c9ced3" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;

/* ---- bateria ---- */
const bumbo = wrap('bumbo', `${CHROME('ch')}${shell('sh', '#d92031', '#a8141f', '#5e0a14')}${SKIN('sk')}`, `${shadow}
  <path d="M26 90 L12 110 M94 90 L108 110" ${stroke} stroke-width="4.5" fill="none"/><path d="M26 90 L12 110 M94 90 L108 110" stroke="#c9ced3" stroke-width="2" stroke-linecap="round" fill="none"/>
  <circle cx="60" cy="56" r="49" fill="url(#sh)" ${stroke} stroke-width="2.6"/>
  ${Array.from({ length: 10 }, (_, i) => `<rect x="57.4" y="6" width="5.2" height="11" rx="2" fill="url(#ch)" ${stroke} stroke-width="1" transform="rotate(${i * 36} 60 56)"/>`).join('')}
  <circle cx="60" cy="56" r="41" fill="none" stroke="url(#ch)" stroke-width="4.5"/><circle cx="60" cy="56" r="41" fill="none" ${stroke} stroke-width="1" opacity=".6"/>
  <circle cx="60" cy="56" r="37.5" fill="url(#sk)" ${stroke} stroke-width="1.2"/>
  <circle cx="60" cy="56" r="15" fill="none" stroke="#b5162b" stroke-width="3"/><text x="60" y="62" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="17" fill="#b5162b">B</text>
  <path d="M30 44 A32 32 0 0 1 56 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>`);

const drumBody = (id, a, b, c, x0, x1, ytop, ybot, label, extra = '', nl = 6) => wrap(label, `${CHROME('ch')}${shell(id, a, b, c)}${SKIN('sk')}`, `${shadow}${extra}
  <path d="M${x0} ${ytop} L${x0} ${ybot} Q${x0} ${ybot + 12} 60 ${ybot + 12} Q${x1} ${ybot + 12} ${x1} ${ybot} L${x1} ${ytop} Z" fill="url(#${id})" ${stroke} stroke-width="2.4"/>
  <path d="M${x0} ${ybot - 2} A${(x1 - x0) / 2} 13 0 0 0 ${x1} ${ybot - 2}" fill="none" stroke="url(#ch)" stroke-width="3.4"/><path d="M${x0} ${ybot - 2} A${(x1 - x0) / 2} 13 0 0 0 ${x1} ${ybot - 2}" fill="none" ${stroke} stroke-width=".9" opacity=".6"/>
  ${lugs(nl, x0 + 9, x1 - 9, ytop + 6, ybot - 6)}
  <ellipse cx="60" cy="${ytop}" rx="${(x1 - x0) / 2 + 2}" ry="14" fill="url(#ch)" ${stroke} stroke-width="1.4"/><ellipse cx="60" cy="${ytop}" rx="${(x1 - x0) / 2 - 3}" ry="11" fill="url(#sk)" ${stroke} stroke-width="1"/>
  <path d="M${x0 + 14} ${ytop - 3} Q${x0 + 26} ${ytop - 9} ${x0 + 42} ${ytop - 8}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`);

const caixa = drumBody('sh2', '#f0c13c', '#c9961a', '#7a5a0a', 16, 104, 52, 80, 'caixa',
  `<path d="M60 96 L38 114 M60 96 L82 114 M60 96 L60 116" ${stroke} stroke-width="3" fill="none"/>`).replace('</svg>', `
  <path d="M30 88 Q60 98 90 88" fill="none" stroke="#9aa0a6" stroke-width="1" stroke-dasharray="1.5 1.5"/><rect x="100" y="70" width="9" height="6" rx="2" fill="url(#ch)" ${stroke} stroke-width="1"/>
  <path d="M64 20 L100 42" stroke="#c98a4b" stroke-width="4" stroke-linecap="round"/><path d="M64 20 L100 42" stroke="${K}" stroke-width="1" fill="none" opacity=".5"/><circle cx="62" cy="19" r="3.4" fill="#e2b27a" ${stroke} stroke-width="1"/>
  <path d="M82 14 L50 40" stroke="#c98a4b" stroke-width="4" stroke-linecap="round"/><circle cx="84" cy="13" r="3.4" fill="#e2b27a" ${stroke} stroke-width="1"/></svg>`);

const tom = drumBody('sh3', '#3b8be0', '#2c6fb5', '#12385f', 20, 100, 46, 82, 'tom',
  `<path d="M26 90 L18 112 M94 90 L102 112 M60 96 L60 116" ${stroke} stroke-width="3.4" fill="none"/><path d="M26 90 L18 112 M94 90 L102 112 M60 96 L60 116" stroke="#c9ced3" stroke-width="1.3" stroke-linecap="round" fill="none"/>`, 5);

const cym = (label, tilt, rx, withTop = false) => wrap(label, `${GOLD('gd')}${CHROME('ch')}`, `${shadow}
  <rect x="58.2" y="46" width="3.6" height="58" fill="url(#ch)" ${stroke} stroke-width="1.1"/>${tripod(60, 104)}
  <g transform="rotate(${tilt} 60 40)"><ellipse cx="60" cy="40" rx="${rx}" ry="${rx / 4.6}" fill="url(#gd)" ${stroke} stroke-width="2.2"/>${rings(60, 40, rx, rx / 4.6, 5)}
  <ellipse cx="60" cy="38.5" rx="${rx * 0.2}" ry="${rx * 0.11}" fill="#f9dd7a" ${stroke} stroke-width="1.4"/><ellipse cx="59" cy="37.6" rx="${rx * 0.09}" ry="${rx * 0.04}" fill="#fff" opacity=".7"/>
  <path d="M${60 - rx + 6} ${40 - 1} Q${60 - rx * 0.5} ${40 - rx / 4.6 + 1} 60 ${40 - rx / 4.6 + 1.5}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".6" stroke-linecap="round"/></g>`);
const prato = cym('prato', -7, 54);
const chimbal = wrap('chimbal', `${GOLD('gd')}${CHROME('ch')}`, `${shadow}
  <rect x="58.2" y="50" width="3.6" height="54" fill="url(#ch)" ${stroke} stroke-width="1.1"/>${tripod(60, 104)}
  <path d="M74 108 L110 113" ${stroke} stroke-width="5" fill="none"/><path d="M74 108 L110 113" stroke="#c9ced3" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <ellipse cx="60" cy="50" rx="46" ry="9" fill="#6b5410" ${stroke} stroke-width="2.2"/><ellipse cx="60" cy="47.5" rx="46" ry="9" fill="url(#gd)" ${stroke} stroke-width="1.6"/>
  <ellipse cx="60" cy="40" rx="46" ry="9" fill="url(#gd)" ${stroke} stroke-width="2.2"/>${rings(60, 40, 46, 9, 5)}<rect x="56.5" y="26" width="7" height="9" rx="1.4" fill="url(#ch)" ${stroke} stroke-width="1"/>
  <ellipse cx="60" cy="38.5" rx="10" ry="3.2" fill="#f9dd7a" ${stroke} stroke-width="1.3"/><ellipse cx="57" cy="37.5" rx="4" ry="1.2" fill="#fff" opacity=".7"/>`);

/* ---- cordas, teclas e voz ---- */
const neckFrets = (x, y0, y1, n) => Array.from({ length: n }, (_, i) => { const y = y0 + ((y1 - y0) * (i + 1)) / (n + 1); return `<line x1="${x - 4}" y1="${y.toFixed(1)}" x2="${x + 4}" y2="${y.toFixed(1)}" stroke="#d8d8d8" stroke-width=".9"/>`; }).join('');
const strings = (x, y0, y1, n, sp) => Array.from({ length: n }, (_, i) => { const dx = (i - (n - 1) / 2) * sp; return `<line x1="${x + dx * 0.8}" y1="${y0}" x2="${x + dx * 1.3}" y2="${y1}" stroke="#e8e8e8" stroke-width=".7"/>`; }).join('');

const guitarra = wrap('guitarra', `${lin('bd1', 0, 0, 1, 1, [[0, '#ffd34d'], [0.45, '#d9531e'], [1, '#2a0d05']])}${lin('nk', 0, 0, 1, 0, [[0, '#6b3a17'], [0.5, '#a8662b'], [1, '#6b3a17']])}${CHROME('ch')}`, `${shadow}
  <g transform="rotate(38 60 62) translate(0 6) scale(.93) translate(4 0)">
  <path d="M51 4 Q60 -2 69 4 L69 26 L51 26 Z" fill="#2b1a0c" ${stroke} stroke-width="1.6"/>${[8, 13, 18, 8, 13, 18].map((y, i) => `<circle cx="${i < 3 ? 49 : 71}" cy="${y + 2}" r="2.1" fill="url(#ch)" ${stroke} stroke-width=".8"/>`).join('')}
  <rect x="55.5" y="24" width="9" height="42" fill="url(#nk)" ${stroke} stroke-width="1.4"/><rect x="55.5" y="24" width="9" height="2.6" fill="#f4efe2"/>${neckFrets(60, 26, 66, 8)}
  <path d="M56 60 C52 58 47 52 43 49 C37 47 32 55 35 63 C37 70 34 75 35 84 C37 98 49 106 60 106 C71 106 83 98 85 84 C86 75 83 70 85 63 C88 55 83 47 77 49 C73 52 68 58 64 60 Z" fill="url(#bd1)" ${stroke} stroke-width="2.2"/>
  <path d="M50 70 C58 66 62 66 70 70 C80 78 80 94 70 100 C62 104 58 104 50 100 C40 94 40 78 50 70 Z" fill="#f4efe2" ${stroke} stroke-width="1.2" opacity=".95"/>
  ${[76, 84, 92].map((y) => `<rect x="53" y="${y}" width="14" height="4.5" rx="1.2" fill="#2b2b2b" ${stroke} stroke-width=".8"/><rect x="54.5" y="${y + 1.2}" width="11" height="1.1" fill="#8a8a8a"/>`).join('')}
  <rect x="52" y="98" width="16" height="4" rx="1" fill="url(#ch)" ${stroke} stroke-width=".9"/>${strings(60, 26, 100, 6, 1.5)}
  <circle cx="75" cy="94" r="2.6" fill="#1b1818"/><circle cx="73" cy="100" r="2.6" fill="#1b1818"/>
  <path d="M38 60 C35 66 38 72 37 78" fill="none" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/></g>`);

const baixo = wrap('baixo', `${lin('bd2', 0, 0, 1, 1, [[0, '#5dd1b4'], [0.5, '#1f8f78'], [1, '#07261f']])}${lin('nk2', 0, 0, 1, 0, [[0, '#4a2a10'], [0.5, '#7a4a21'], [1, '#4a2a10']])}${CHROME('ch')}`, `${shadow}
  <g transform="rotate(38 60 62) translate(0 4) scale(.9) translate(4 -2)">
  <path d="M50 2 Q60 -3 70 2 L68 28 L52 28 Z" fill="#2b1a0c" ${stroke} stroke-width="1.6"/>${[8, 16, 8, 16].map((y, i) => `<circle cx="${i < 2 ? 48 : 72}" cy="${y + 2}" r="2.3" fill="url(#ch)" ${stroke} stroke-width=".8"/>`).join('')}
  <rect x="55" y="26" width="10" height="44" fill="url(#nk2)" ${stroke} stroke-width="1.4"/><rect x="55" y="26" width="10" height="2.6" fill="#f4efe2"/>${neckFrets(60, 28, 70, 9)}
  <path d="M56 64 C52 62 48 56 45 53 C40 51 36 58 38 65 C40 71 37 76 38 85 C40 98 50 106 60 106 C70 106 80 98 82 85 C83 76 80 71 82 65 C84 58 80 51 75 53 C72 56 68 62 64 64 Z" fill="url(#bd2)" ${stroke} stroke-width="2.2"/>
  <path d="M51 74 C57 71 63 71 69 74 C77 80 77 94 69 99 C63 102 57 102 51 99 C43 94 43 80 51 74 Z" fill="#1b1818" ${stroke} stroke-width="1" opacity=".9"/>
  <rect x="52" y="80" width="16" height="6" rx="1.5" fill="#cfd3d6" ${stroke} stroke-width=".9"/><rect x="54" y="90" width="12" height="4.5" rx="1.2" fill="#cfd3d6" ${stroke} stroke-width=".9"/>
  <rect x="51" y="98" width="18" height="4" rx="1" fill="url(#ch)" ${stroke} stroke-width=".9"/>${strings(60, 28, 100, 4, 2.2)}
  <circle cx="77" cy="94" r="2.6" fill="#1b1818"/><circle cx="74" cy="100" r="2.6" fill="#1b1818"/>
  <path d="M41 62 C38 68 41 74 40 80" fill="none" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/></g>`);

const teclado = wrap('teclado', `${lin('pn', 0, 0, 0, 1, [[0, '#4a4f57'], [1, '#1e2126']])}${lin('ky', 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e1ddd2']])}`, `<ellipse cx="60" cy="108" rx="52" ry="5" fill="#000" opacity=".16"/>
  <path d="M6 34 L114 34 L118 96 L2 96 Z" fill="url(#pn)" ${stroke} stroke-width="2.4"/>
  <rect x="12" y="38" width="22" height="10" rx="2" fill="#7cf0ff" ${stroke} stroke-width="1.2"/><rect x="14" y="40" width="18" height="2.4" fill="#fff" opacity=".6"/>
  ${[44, 54, 64, 74, 84, 94].map((x) => `<circle cx="${x + 10}" cy="43" r="3.6" fill="#d8dbde" ${stroke} stroke-width="1"/><line x1="${x + 10}" y1="43" x2="${x + 11}" y2="40.6" stroke="${K}" stroke-width="1"/>`).join('')}
  <circle cx="106" cy="43" r="2" fill="#d92031"/>
  <rect x="6" y="52" width="108" height="42" rx="2" fill="url(#ky)" ${stroke} stroke-width="2"/>
  ${Array.from({ length: 11 }, (_, i) => `<line x1="${6 + (i + 1) * 9}" y1="52" x2="${6 + (i + 1) * 9}" y2="94" stroke="${K}" stroke-width="1"/>`).join('')}
  ${[0, 1, 3, 4, 5, 7, 8, 10].map((i) => `<rect x="${6 + (i + 1) * 9 - 3.2}" y="52" width="6.4" height="26" rx="1" fill="#1b1d20" ${stroke} stroke-width=".8"/><rect x="${6 + (i + 1) * 9 - 2}" y="53" width="1.6" height="18" fill="#6a6f76" opacity=".6"/>`).join('')}
  <rect x="2" y="94" width="116" height="5" fill="#15171a" ${stroke} stroke-width="1.4"/>`);

const voz = wrap('voz', `${lin('mt', 0, 0, 1, 0, [[0, '#8d949b'], [0.35, '#f1f3f4'], [0.6, '#aab0b6'], [1, '#5f666c']])}${lin('mb', 0, 0, 1, 0, [[0, '#15171a'], [0.4, '#4b5058'], [1, '#101215']])}<clipPath id="gr"><circle cx="60" cy="30" r="21"/></clipPath>`, `<ellipse cx="60" cy="112" rx="22" ry="4" fill="#000" opacity=".16"/>
  <g transform="rotate(-18 60 60)">
  <path d="M47 50 L73 50 L68 104 Q60 111 52 104 Z" fill="url(#mb)" ${stroke} stroke-width="2.2"/><rect x="57" y="62" width="6" height="12" rx="2" fill="#d92031" ${stroke} stroke-width="1"/>
  <circle cx="60" cy="30" r="22" fill="url(#mt)" ${stroke} stroke-width="2.4"/>
  <g clip-path="url(#gr)" stroke="#5f666c" stroke-width="1.1" opacity=".75">${Array.from({ length: 9 }, (_, i) => `<line x1="${34 + i * 6}" y1="6" x2="${34 + i * 6}" y2="56"/><line x1="34" y1="${12 + i * 5.5}" x2="86" y2="${12 + i * 5.5}"/>`).join('')}</g>
  <circle cx="60" cy="30" r="22" fill="none" ${stroke} stroke-width="1"/><path d="M44 18 A19 19 0 0 1 58 10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
  <rect x="44" y="46" width="32" height="7" rx="3.4" fill="#2b2f35" ${stroke} stroke-width="1.6"/></g>
  <path d="M92 38 Q101 48 92 58 M99 32 Q112 48 99 64" fill="none" stroke="#b5162b" stroke-width="3" stroke-linecap="round"/>`);

const violino = wrap('violino', `${lin('vb', 0, 0, 1, 1, [[0, '#d98a3f'], [0.5, '#a8502a'], [1, '#5b250f']])}${lin('bw', 0, 0, 0, 1, [[0, '#c98a4b'], [1, '#7a4a21']])}`, `${shadow}
  <path d="M22 108 L100 38" stroke="url(#bw)" stroke-width="3" stroke-linecap="round"/><path d="M22 108 L100 38" stroke="${K}" stroke-width=".8" opacity=".5"/><path d="M32 110 L96 52" stroke="#f6f1e6" stroke-width="1.8" stroke-linecap="round"/>
  <g transform="rotate(-24 60 62)">
  <rect x="57.5" y="4" width="5" height="40" rx="2" fill="#2b1a0c" ${stroke} stroke-width="1.2"/><path d="M56 6 C56 -1 66 -1 66 5 C66 10 60 12 60 8" fill="#7a4a21" ${stroke} stroke-width="1.4"/>
  <path d="M60 34 C48 34 44 42 48 49 C52 53 50 57 46 61 C40 67 40 82 51 89 C56 92 64 92 69 89 C80 82 80 67 74 61 C70 57 68 53 72 49 C76 42 72 34 60 34 Z" fill="url(#vb)" ${stroke} stroke-width="2.2"/>
  <path d="M50 62 C52 66 52 72 50 76 M70 62 C68 66 68 72 70 76" fill="none" stroke="#2b1a0c" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
  <path d="M50 52 C53 58 55 66 53 74 M70 52 C67 58 65 66 67 74" fill="none" stroke="#1b1818" stroke-width="2" stroke-linecap="round"/>
  <rect x="52" y="64" width="16" height="3" rx="1" fill="#f1e2c8" ${stroke} stroke-width="1"/><rect x="55" y="84" width="10" height="5" rx="1.4" fill="#2b1a0c" ${stroke} stroke-width="1"/>
  ${[57.2, 59.1, 60.9, 62.8].map((x) => `<line x1="${x}" y1="14" x2="${x}" y2="84" stroke="#e8e8e8" stroke-width=".7"/>`).join('')}
  <path d="M46 76 C44 80 46 86 50 88" fill="none" stroke="#fff" stroke-width="1.6" opacity=".4" stroke-linecap="round"/></g>
`);

export const ART = { bumbo, caixa, chimbal, prato, tom, guitarra, baixo, teclado, voz, cordas: violino };

/* ---- bateria completa (jogo "que peça é essa?"): cada peça é um <g class="kp" data-p> clicável ---- */
export function kitSvg(hl, hide, colorOf) {
  const c = (id) => (hide ? '#d9d2c7' : colorOf(id)); const on = (id) => (hl === id ? ' hl' : '');
  const drum = (id, x, y, w, h, nl = 5) => {
    const rx = w / 2; const yb = y + h; const gid = `kg-${id}`;
    return `<g class="kp${on(id)}" data-p="${id}"><defs>${lin(gid, 0, 0, 1, 0, [[0, 'rgb(0 0 0 / .35)'], [0.28, 'rgb(255 255 255 / .45)'], [0.5, 'rgb(255 255 255 / 0)'], [1, 'rgb(0 0 0 / .4)']])}</defs>
    <path d="M${x} ${y} L${x} ${yb} A${rx} ${h * 0.22} 0 0 0 ${x + w} ${yb} L${x + w} ${y} Z" fill="${c(id)}" ${stroke} stroke-width="2.4"/><path d="M${x} ${y} L${x} ${yb} A${rx} ${h * 0.22} 0 0 0 ${x + w} ${yb} L${x + w} ${y} Z" fill="url(#${gid})"/>
    ${Array.from({ length: nl }, (_, i) => `<rect x="${(x + 8 + ((w - 16) * i) / (nl - 1) - 2).toFixed(1)}" y="${y + h * 0.2}" width="4" height="${h * 0.55}" rx="1.4" fill="#dfe3e6" ${stroke} stroke-width="1"/>`).join('')}
    <path d="M${x} ${yb - 1} A${rx} ${h * 0.22} 0 0 0 ${x + w} ${yb - 1}" fill="none" stroke="#c9ced3" stroke-width="3.2"/>
    <ellipse cx="${x + rx}" cy="${y}" rx="${rx + 2}" ry="${h * 0.24}" fill="#c9ced3" ${stroke} stroke-width="1.6"/><ellipse cx="${x + rx}" cy="${y}" rx="${rx - 3}" ry="${h * 0.19}" fill="#fbf8f1" ${stroke} stroke-width="1"/></g>`;
  };
  const cymb = (id, x, y, rx, tilt, two) => `<g class="kp${on(id)}" data-p="${id}"><defs>${GOLD(`cg-${id}`)}</defs>
    <rect x="${x - 1.6}" y="${y}" width="3.2" height="${two ? 150 : 130}" fill="#aeb4ba" ${stroke} stroke-width="1.2"/>
    <g transform="rotate(${tilt} ${x} ${y})">${two ? `<ellipse cx="${x}" cy="${y + 10}" rx="${rx}" ry="${rx / 5}" fill="${hide ? '#bbb3a6' : '#6b5410'}" ${stroke} stroke-width="2"/>` : ''}
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx / 5}" fill="${hide ? '#d9d2c7' : `url(#cg-${id})`}" ${stroke} stroke-width="2.2"/>${hide ? '' : rings(x, y, rx, rx / 5, 4)}
    <ellipse cx="${x}" cy="${y - 1}" rx="${rx * 0.17}" ry="${rx * 0.06}" fill="${hide ? '#e6e0d6' : '#f9dd7a'}" ${stroke} stroke-width="1.2"/></g></g>`;
  return `<svg viewBox="0 0 420 300" role="img" aria-label="Bateria"><ellipse cx="210" cy="290" rx="190" ry="8" fill="#000" opacity=".12"/>
    ${cymb('cr', 85, 45, 64, -8)}${cymb('rd', 340, 55, 68, 6)}${cymb('hh', 40, 128, 40, 0, true)}
    ${drum('tt', 138, 95, 66, 46, 4)}${drum('mt', 218, 95, 66, 46, 4)}${drum('ft', 300, 165, 92, 92, 5)}${drum('sn', 72, 178, 92, 40, 5)}
    <g class="kp${on('bd')}" data-p="bd"><defs>${rad('bg', [[0, '#ffffff'], [0.8, '#f4efe6'], [1, '#d9d2c5']])}${lin('bs', 0, 0, 1, 1, [[0, 'rgb(255 255 255 / .35)'], [0.5, 'rgb(255 255 255 / 0)'], [1, 'rgb(0 0 0 / .4)']])}</defs>
      <circle cx="210" cy="218" r="76" fill="${c('bd')}" ${stroke} stroke-width="3"/><circle cx="210" cy="218" r="76" fill="url(#bs)"/>${Array.from({ length: 12 }, (_, i) => `<rect x="207" y="140" width="6" height="12" rx="2" fill="#dfe3e6" ${stroke} stroke-width="1" transform="rotate(${i * 30} 210 218)"/>`).join('')}
      <circle cx="210" cy="218" r="62" fill="#c9ced3" ${stroke} stroke-width="1.6"/><circle cx="210" cy="218" r="58" fill="url(#bg)" ${stroke} stroke-width="1.2"/>
      <text x="210" y="226" text-anchor="middle" font-family="Permanent Marker, cursive" font-size="24" fill="#b5162b">Beaterista</text><path d="M168 190 A48 48 0 0 1 205 172" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/></g></svg>`;
}
