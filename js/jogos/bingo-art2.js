// Segunda leva de desenhos vetoriais do bingo (viewBox 48×48): instrumentos, peças da bateria, figuras rítmicas e símbolos musicais.
// Mesma paleta e traço de bingo-art.js. Nenhum texto escrito, exceto os numerais dos compassos.
const I = '#142036'; const R = '#BD1733'; const N = '#17365B'; const M = '#EBA332'; const C = '#fffdf7';
const G = '#c7ced8'; // cinza de metal (aros, hastes)
const sk = (w = 2.4) => `stroke="${I}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const ln = (d, w = 2.4, col = I) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---------- notação ----------
const head = (cx, cy, rx = 6.4, ry = 4.5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${I}" transform="rotate(-22 ${cx} ${cy})"/>`;
const headOpen = (cx, cy, rx = 6.4, ry = 4.5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${I}" transform="rotate(-22 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.62}" ry="${ry * 0.36}" fill="${C}" transform="rotate(-48 ${cx} ${cy})"/>`;
const stem = (x, y1, y2, w = 2.8) => ln(`M${x} ${y1}V${y2}`, w);
const flag = (x, y) => `<path d="M${x} ${y}C${x + 1} ${y + 8} ${x + 11} ${y + 10} ${x + 10} ${y + 23}C${x + 7} ${y + 16} ${x + 3} ${y + 14} ${x} ${y + 13}Z" fill="${I}"/>`;
const beam = (x1, x2, y, h = 5.2) => `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="${h}" fill="${I}"/>`;
const staff = (x1, x2, y0 = 14, gap = 6, w = 1.4) => [0, 1, 2, 3, 4].map((i) => `<path d="M${x1} ${y0 + i * gap}H${x2}" stroke="${I}" stroke-width="${w}" fill="none"/>`).join('');
const dot = (x, y, r = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${I}"/>`;

const note = (hx, hy, kind) => {
  const rx = 6.4; const sx = hx + rx - 1.3;
  if (kind === 'minima') return headOpen(hx, hy) + stem(sx, hy - 0.5, 6);
  if (kind === 'seminima') return head(hx, hy) + stem(sx, hy - 0.5, 6);
  if (kind === 'colcheia') return head(hx, hy) + stem(sx, hy - 0.5, 6) + flag(sx, 6);
  if (kind === 'semicolcheia') return head(hx, hy) + stem(sx, hy - 0.5, 4) + flag(sx, 4) + flag(sx, 12);
  return '';
};

const beamed = (xs, beams, rx = 6.4, ry = 4.5, top = 7) => {
  let s = ''; const stems = xs.map((x) => x + rx - 1.3);
  xs.forEach((x, i) => { s += head(x, 36, rx, ry) + stem(stems[i], 35, top); });
  for (let b = 0; b < beams; b++) s += beam(stems[0] - 1.4, stems[stems.length - 1] + 1.4, top - 1 + b * 8);
  return s;
};

// pausas
const zigzag = `<path d="M19 4L29 15L20 26L28 36C21 33 16 37 18 42C19.5 45.5 25 44 24.5 40" fill="none" stroke="${I}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
const hook = (bx, by, ex, ey) => `<circle cx="${bx}" cy="${by}" r="3.6" fill="${I}"/>` + ln(`M${bx} ${by}Q${bx + 9} ${by + 3} ${ex} ${ey}`, 3);

// ---------- tambores (vista lateral com suporte) ----------
const tomStand = (rx, topY, h, shell) => {
  const cx = 24; const ry = rx * 0.34; const bot = topY + h;
  const lugs = [-0.62, -0.2, 0.2, 0.62].map((k) => `<rect x="${cx + k * rx - 1.5}" y="${topY + 3}" width="3" height="${h - 5}" rx="1" fill="${C}" opacity=".9"/>`).join('');
  const screws = [-0.85, -0.5, 0.5, 0.85].map((k) => `<circle cx="${cx + k * rx}" cy="${topY + ry * 0.55 * (1 - k * k * 0.5)}" r="1.4" fill="${I}"/>`).join('');
  return `<path d="M${cx - rx} ${topY}v${h}c0 ${ry * 1.4} ${rx * 2} ${ry * 1.4} ${rx * 2} 0V${topY}" fill="${shell}" ${sk()}/>` + lugs
    + `<ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="${G}" ${sk()}/><ellipse cx="${cx}" cy="${topY}" rx="${rx - 2.6}" ry="${ry - 1.5}" fill="${C}" ${sk(1.4)}/>` + screws
    + ln(`M${cx} ${bot + ry * 1.4}V43M${cx - 9} 46L${cx} 43L${cx + 9} 46`, 3);
};

// ---------- pele / aro ----------
const around = (n, r, f) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return f(24 + r * Math.cos(a), 24 + r * Math.sin(a), (a * 180) / Math.PI); }).join('');

export const ART2 = {
  // ===== instrumentos =====
  piano: `<path d="M9 17L33 4L44 11V18H9Z" fill="${N}" ${sk()}/><path d="M33 4L44 11" ${sk(2.4)}/><path d="M5 17H44V25H5Z" fill="${I}" ${sk()}/><rect x="4" y="25" width="32" height="8" fill="${C}" ${sk(2)}/><path d="M10 25V33M16 25V33M22 25V33M28 25V33" stroke="${I}" stroke-width="1.4"/><path d="M8 25h4v5H8zM14 25h4v5h-4zM25 25h4v5h-4z" fill="${I}"/><path d="M8 33L7 44M38 25V44M32 33V38" ${sk(3)}/><path d="M30 44h12" ${sk(3)}/>`,
  cajon: `<path d="M8 12L16 6H42L34 12Z" fill="#f7c566" ${sk()}/><path d="M34 12L42 6V34L34 40Z" fill="#c98417" ${sk()}/><rect x="8" y="12" width="26" height="28" fill="${M}" ${sk()}/><circle cx="21" cy="26" r="6.5" fill="${I}" ${sk()}/><path d="M11 17H31" stroke="${I}" stroke-width="1.6"/><path d="M11 36H31" stroke="${I}" stroke-width="1.6"/><circle cx="12" cy="15" r="1.1" fill="${I}"/><circle cx="30" cy="15" r="1.1" fill="${I}"/><path d="M10 40v3M32 40v3" ${sk(3)}/>`,
  tamborim: `<path d="M6 22v9c0 4 8 6 18 6s18-2 18-6v-9" fill="${N}" ${sk()}/><path d="M12 28v6M24 29v8M36 28v6" stroke="${G}" stroke-width="2"/><ellipse cx="24" cy="22" rx="18" ry="7" fill="${G}" ${sk()}/><ellipse cx="24" cy="22" rx="14.5" ry="5" fill="${C}" ${sk(1.6)}/><path d="M13 44L38 9" stroke="${I}" stroke-width="5.2" stroke-linecap="round"/><path d="M13 44L38 9" stroke="${M}" stroke-width="2.6" stroke-linecap="round"/>`,
  'agogô': `<path d="M18 6C18 -1 37 -1 37 12" fill="none" ${sk(3)}/><path d="M14 12H21L26 38H9Z" fill="${M}" ${sk()}/><ellipse cx="17.5" cy="38" rx="8.5" ry="2.8" fill="${I}" ${sk()}/><path d="M34 14H40L44 33H30Z" fill="${M}" ${sk()}/><ellipse cx="37" cy="33" rx="7" ry="2.4" fill="${I}" ${sk()}/><path d="M15 16L12 34" stroke="${C}" stroke-width="1.8" stroke-linecap="round"/>`,
  ukulele: `<path d="M24 12C17 12 15 19 18 24C12 27 11 37 18 41C22 44 26 44 30 41C37 37 36 27 30 24C33 19 31 12 24 12Z" fill="${M}" ${sk()}/><rect x="21.5" y="2" width="5" height="12" fill="${N}" ${sk(2)}/><rect x="20.5" y="0.5" width="7" height="4" rx="1.4" fill="${N}" ${sk(1.8)}/><circle cx="24" cy="30" r="4.2" fill="${I}"/><rect x="19" y="37" width="10" height="2.6" rx="1" fill="${I}"/><path d="M22.2 4V38M23.4 4V38M24.6 4V38M25.8 4V38" stroke="${C}" stroke-width="0.9"/><path d="M19.4 4V38M28.6 4V38" stroke="none"/>`,

  // ===== peças da bateria =====
  tom1: tomStand(11, 14, 14, R),
  tom2: tomStand(15, 11, 18, R),
  pedal_bumbo: `<path d="M3 43H32V38H3Z" fill="${N}" ${sk()}/><path d="M6 36L27 31L28 35L7 40Z" fill="${M}" ${sk()}/><path d="M27 33L35 15" ${sk(2.4)}/><path d="M36 10V38" ${sk(4.4)}/><path d="M32 20l7 2-7 2 7 2-7 2 7 2" fill="none" ${sk(2)}/><path d="M36 10C34 3 22 3 14 9" ${sk(3)}/><circle cx="12" cy="10.5" r="5" fill="${C}" ${sk()}/>`,
  pedal_chimbal: `<path d="M4 44L34 34L36 38L6 47Z" fill="${N}" ${sk()}/><path d="M32 40H44V46H32Z" fill="${I}" ${sk()}/><path d="M38 3V40" ${sk(4)} stroke="${G}"/><path d="M38 3V40" fill="none" stroke="${I}" stroke-width="1.2"/><rect x="34" y="12" width="8" height="5" rx="1.5" fill="${M}" ${sk(1.8)}/><path d="M9 43L33 35" stroke="${C}" stroke-width="1.6" stroke-linecap="round"/>`,
  banco: `<path d="M8 15v6c0 3 7 5 16 5s16-2 16-5v-6" fill="${R}" ${sk()}/><ellipse cx="24" cy="15" rx="16" ry="5.5" fill="${N}" ${sk()}/><path d="M17 27L9 44M24 28V44M31 27L39 44" ${sk(3)}/><path d="M13 36c3 2 19 2 22 0" fill="none" ${sk(2)}/><path d="M6 44h6M21 44h6M36 44h6" ${sk(3)}/>`,
  maquina_chimbal: `<path d="M8 9c6-3 26-3 32 0-6 2-26 2-32 0z" fill="${M}" ${sk()}/><path d="M9 16c6 2 24 2 30 0-6-3-24-3-30 0z" fill="${M}" ${sk()}/><circle cx="24" cy="12.5" r="1.8" fill="${I}"/><path d="M24 15V37" ${sk(5)} stroke="${G}"/><path d="M24 15V37" stroke="${I}" stroke-width="1.2"/><rect x="21" y="22" width="6" height="5" rx="1.5" fill="${R}" ${sk(1.8)}/><path d="M24 37L8 45M24 37L40 45M24 37L25 46" ${sk(3)}/><path d="M33 46L44 40" ${sk(3.4)} stroke="${N}"/>`,
  estante_prato: `<path d="M24 30V16" ${sk(5)} stroke="${G}"/><path d="M24 30V16" stroke="${I}" stroke-width="1.2"/><path d="M24 30L7 45M24 30L41 45M24 30L24 46" ${sk(3.2)}/><circle cx="24" cy="30" r="3.4" fill="${R}" ${sk(1.8)}/><path d="M24 16L38 5" ${sk(4)} stroke="${G}"/><path d="M24 16L38 5" stroke="${I}" stroke-width="1.2"/><circle cx="24" cy="16" r="3.8" fill="${M}" ${sk(1.8)}/><path d="M37 8l5-4" ${sk(3)}/><ellipse cx="38" cy="4.5" rx="4" ry="2" fill="${C}" ${sk(1.6)} transform="rotate(-34 38 4.5)"/>`,
  pele: `<circle cx="24" cy="24" r="21" fill="${G}" ${sk()}/><circle cx="24" cy="24" r="16" fill="${C}" ${sk(1.8)}/><circle cx="24" cy="24" r="6" fill="none" stroke="${I}" stroke-width="1.2" opacity=".5"/>` + around(8, 18.6, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${I}"/>`),
  aro: `<path fill-rule="evenodd" d="M24 6a18 18 0 1 0 .01 0ZM24 13a11 11 0 1 1-.01 0Z" fill="${G}" ${sk()}/>` + around(8, 18, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.8" fill="${G}" ${sk(2)}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.2" fill="${I}"/>`),

  // ===== figuras rítmicas =====
  semibreve: `<ellipse cx="24" cy="24" rx="15" ry="10" fill="${I}" transform="rotate(-8 24 24)"/><ellipse cx="24" cy="24" rx="4.6" ry="8.6" fill="${C}" transform="rotate(32 24 24)"/>`,
  minima: note(19, 38, 'minima'),
  seminima: note(19, 38, 'seminima'),
  colcheia: note(16, 38, 'colcheia'),
  semicolcheia: note(16, 38, 'semicolcheia'),
  pausa_semibreve: staff(4, 44, 8, 8) + `<rect x="16" y="16" width="16" height="6.5" fill="${I}"/>`,
  pausa_minima: staff(4, 44, 8, 8) + `<rect x="16" y="17.5" width="16" height="6.5" fill="${I}"/>`,
  pausa_seminima: zigzag,
  pausa_colcheia: `<path d="M30 8L21 41" stroke="${I}" stroke-width="3" stroke-linecap="round"/>` + hook(16, 18, 28.4, 13),
  pausa_semicolcheia: `<path d="M31 5L19 42" stroke="${I}" stroke-width="3" stroke-linecap="round"/>` + hook(18, 14, 29.6, 9.5) + hook(14.5, 26, 25.7, 21.5),
  duas_colcheias: beamed([11, 31], 1),
  quatro_semicolcheias: beamed([6, 17, 28, 39], 2, 5.2, 3.8),
  minima_pontuada: headOpen(17, 36) + stem(22.1, 35.5, 6) + dot(31, 36, 2.8),
  seminima_pontuada: head(17, 36) + stem(22.1, 35.5, 6) + dot(31, 36, 2.8),
  colcheia_pontuada: head(14, 36) + stem(19.1, 35.5, 6) + flag(19.1, 6) + dot(28, 36, 2.8),
  duas_semicolcheias: beamed([11, 31], 2),

  // ===== símbolos =====
  clave_sol: staff(3, 45, 14, 6, 1.3) + `<path d="M20 43C20 46.5 26 46.5 26 42L29 10C30 2 36 2 33 11C31 17 21 22 20 29C19 36 27 38 30 33C32 28 26 24 22 28C20 30 22 32 24 31" fill="none" stroke="${I}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  clave_fa: staff(3, 45, 12, 6, 1.3) + `<circle cx="13" cy="18" r="4.4" fill="${I}"/><path d="M13 18C13 8 32 8 32 22C32 31 24 37 14 42" fill="none" stroke="${I}" stroke-width="3" stroke-linecap="round"/>` + dot(37, 14.5, 2.4) + dot(37, 21.5, 2.4),
  sustenido: `<path d="M18 5V42M29 3V40" ${sk(2.6)}/><path d="M12 29L35 21M12 40L35 32" ${sk(5.4)}/>`,
  bemol: `<path d="M16 4V42" ${sk(3)}/><path d="M16 42C30 34 38 28 32 22C28 18 20 22 16 28Z" fill="${I}" ${sk(2.4)}/><path d="M16 36C23 31 28 28 27 25C25 23 20 26 16 31Z" fill="${C}"/>`,
  bequadro: `<path d="M16 5V31M32 17V43" ${sk(2.8)}/><path d="M16 22L32 17" ${sk(5)}/><path d="M16 32L32 27" ${sk(5)}/>`,
  fermata: `<path d="M6 34C6 7 42 7 42 34C40 14 8 14 6 34Z" fill="${I}" ${sk(2)}/><circle cx="24" cy="29" r="3.6" fill="${I}"/>`,
  ponto_aumento: staff(3, 45, 12, 6, 1.4) + head(16, 33, 5.4, 3.7) + stem(20.1, 32.5, 7) + dot(29, 33, 2.8),
  ligadura_prolongamento: staff(3, 45, 12, 6, 1.4) + head(11, 27, 5.2, 3.6) + head(35, 27, 5.2, 3.6) + stem(15.1, 26.5, 5) + stem(39.1, 26.5, 5) + `<path d="M11 32.5Q23 46 36 32.5Q23 40.5 11 32.5Z" fill="${I}" ${sk(1.6)}/>`,
  staccato: staff(3, 45, 12, 6, 1.4) + head(20, 33, 5.4, 3.7) + stem(24.1, 32.5, 7) + dot(20, 43, 2.8),
  acento: staff(3, 45, 18, 6, 1.4) + head(24, 33, 5.8, 4) + `<path d="M13 3L35 8.5L13 14" fill="none" ${sk(3.6)}/>`,
  crescendo: `<path d="M5 24L43 10M5 24L43 38" ${sk(2.2)}/>`,
  decrescendo: `<path d="M5 10L43 24M5 38L43 24" ${sk(2.2)}/>`,
  barra_dupla: staff(4, 42, 14, 6, 1.4) + `<path d="M33 14V38M40 14V38" ${sk(2)}/>`,
  ritornello: staff(4, 42, 14, 6, 1.4) + dot(20, 23, 2.4) + dot(20, 29, 2.4) + `<path d="M27 14V38" ${sk(1.8)}/><path d="M34 14V38" ${sk(5)} stroke-linecap="butt"/>`,
  compasso_3_4: staff(3, 45, 14, 6, 1.3) + `<path d="M5 14V38" ${sk(1.8)}/><text x="24" y="26.5" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-weight="700" font-size="18" fill="${I}" stroke="${C}" stroke-width="3" paint-order="stroke">3</text><text x="24" y="38.5" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-weight="700" font-size="18" fill="${I}" stroke="${C}" stroke-width="3" paint-order="stroke">4</text>`,
  compasso_4_4: staff(3, 45, 14, 6, 1.3) + `<path d="M5 14V38" ${sk(1.8)}/><text x="24" y="26.5" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-weight="700" font-size="18" fill="${I}" stroke="${C}" stroke-width="3" paint-order="stroke">4</text><text x="24" y="38.5" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-weight="700" font-size="18" fill="${I}" stroke="${C}" stroke-width="3" paint-order="stroke">4</text>`,
};
export const ART2_IDS = Object.keys(ART2);
