// pauLta: desenhos em SVG (texto puro, sem DOM): pautas de bateria e de clave, teclado, bateria com selos, legenda.
import { kitSvg } from '../kids/icons.js';
import { CLEFS, posOf, letterOf, mk, noteName } from './music.js';

const INK = '#1b1818'; const RED = '#b5162b';
export const DRUM = {
  bd: { name: 'bumbo', pos: 7, foot: true, kit: ['bd'], where: 'no 1º espaço, embaixo' },
  sn: { name: 'caixa', pos: 3, kit: ['sn'], where: 'no 3º espaço, no meio' },
  hh: { name: 'chimbal', pos: -1, x: true, kit: ['hh'], where: 'com um X logo acima da pauta' },
  ho: { name: 'chimbal aberto', pos: -1, x: true, mark: 'open', kit: ['hh'], badge: 'open', where: 'com um X acima da pauta e um pequeno círculo (o) em cima' },
  hf: { name: 'chimbal com o pé', pos: 9, x: true, foot: true, kit: ['hh'], badge: 'pedal', where: 'com um X logo abaixo da pauta' },
  rd: { name: 'prato de condução (ride)', pos: 0, x: true, kit: ['rd'], where: 'com um X na 5ª linha, a de cima' },
  cr: { name: 'prato de ataque (crash)', pos: -3, x: true, kit: ['cr'], where: 'com um X na linha suplementar, bem acima da pauta' },
  tt: { name: 'tom 1', pos: 1, kit: ['tt'], where: 'no 4º espaço' },
  mt: { name: 'tom 2', pos: 2, kit: ['mt'], where: 'na 4ª linha' },
  ft: { name: 'surdo', pos: 5, kit: ['ft'], where: 'no 2º espaço' },
  sg: { name: 'caixa: nota fantasma', pos: 3, ghost: true, kit: ['sn'], badge: 'ghost', where: 'no 3º espaço, entre parênteses' },
  sa: { name: 'caixa com acento', pos: 3, mark: 'accent', kit: ['sn'], badge: 'accent', where: 'no 3º espaço, com o sinal de acento (>)' },
  sr: { name: 'caixa: aro (cross-stick)', pos: 3, x: true, kit: ['sn'], badge: 'rim', where: 'com um X no 3º espaço, o lugar da caixa' },
};
const TOP = 56; const GAP = 16; const U = GAP / 2; // 1 "pos" = meia linha
const yp = (pos) => TOP + pos * U;
const lines = (x1, x2, n = 5) => Array.from({ length: n }, (_, i) => `<line x1="${x1}" y1="${TOP + i * GAP}" x2="${x2}" y2="${TOP + i * GAP}" stroke="${INK}" stroke-width="2"/>`).join('');
const head = (d, x) => {
  const y = yp(d.pos);
  if (d.x) return `<path d="M${x - 8} ${y - 8}l16 16M${x + 8} ${y - 8}l-16 16" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>`;
  const e = `<ellipse cx="${x}" cy="${y}" rx="10.5" ry="7.5" transform="rotate(-20 ${x} ${y})" fill="${RED}"/>`;
  return d.ghost ? `${e}<path d="M${x - 19} ${y - 9}q-7 9 0 18M${x + 19} ${y - 9}q7 9 0 18" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` : e;
};
const mark = (d, x, top) => (d.mark === 'open' ? `<circle cx="${x}" cy="${top - 14}" r="5.5" fill="none" stroke="${INK}" stroke-width="2.6"/>` : d.mark === 'accent' ? `<path d="M${x - 9} ${top - 22}l18 7-18 7" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : '');
const ledgerAt = (x, ids) => (ids.some((i) => DRUM[i].pos <= -2) ? `<line x1="${x - 16}" y1="${yp(-2)}" x2="${x + 16}" y2="${yp(-2)}" stroke="${INK}" stroke-width="2"/>` : '');
const FIGN = { seminima: 1, colcheia: 2, semicolcheia: 4 };

/** Pauta de percussão. `parts` = peças tocadas juntas (alinhadas na vertical). `fig` = quantas notas dentro de um tempo (com ligadura). */
export function drumStaff(parts, fig = null) {
  const ids = [].concat(parts); const d = ids.map((i) => DRUM[i]);
  const n = fig ? FIGN[fig] : 1; const xs = n === 1 ? [190] : n === 2 ? [160, 230] : [140, 187, 234, 281]; const W = n === 4 ? 340 : 320;
  const heads = xs.map((x) => `${ledgerAt(x, ids)}${d.map((k) => head(k, x)).join('')}`).join('');
  const handsD = d.filter((k) => !k.foot); const feetD = d.filter((k) => k.foot);
  const topY = Math.min(...d.map((k) => yp(k.pos)));
  const stems = xs.map((x) => {
    const up = handsD.length ? `<line x1="${x + 10}" y1="${Math.max(...handsD.map((k) => yp(k.pos)))}" x2="${x + 10}" y2="${(fig ? TOP - 46 : topY - 44)}" stroke="${RED}" stroke-width="3"/>` : '';
    const down = feetD.length ? `<line x1="${x - 10}" y1="${Math.min(...feetD.map((k) => yp(k.pos)))}" x2="${x - 10}" y2="${Math.max(...feetD.map((k) => yp(k.pos))) + 42}" stroke="${RED}" stroke-width="3"/>` : '';
    return up + down;
  }).join('');
  const beams = fig && n > 1 ? Array.from({ length: n === 2 ? 1 : 2 }, (_, k) => `<line x1="${xs[0] + 10}" y1="${TOP - 46 + k * 9}" x2="${xs[n - 1] + 10}" y2="${TOP - 46 + k * 9}" stroke="${RED}" stroke-width="6"/>`).join('') : '';
  const flag = fig === 'seminima' ? '' : '';
  const marks = xs.map((x) => d.map((k) => mark(k, x, Math.min(topY, fig ? TOP - 30 : topY))).join('')).join('');
  const lab = `Pauta de bateria com ${ids.length > 1 ? 'notas tocadas juntas' : 'uma nota'}${fig ? ' repetida dentro de um tempo' : ''}`;
  return `<svg viewBox="0 0 ${W} 190" role="img" aria-label="${lab}">${lines(18, W - 18)}<rect x="30" y="${TOP + GAP}" width="6" height="${GAP * 2}" fill="${INK}"/><rect x="41" y="${TOP + GAP}" width="6" height="${GAP * 2}" fill="${INK}"/>${heads}${stems}${beams}${marks}${flag}</svg>`;
}

/* ---------- pauta com clave ---------- */
const BOT = 134; // y da 1ª linha
const yn = (s) => BOT - s * U;
const TREBLE = (cx) => `<path d="M${cx + 2} ${yn(2) + 12} C${cx - 16} ${yn(2) + 2} ${cx - 14} ${yn(5)} ${cx + 4} ${yn(8) + 6} C${cx + 16} ${yn(11)} ${cx + 12} ${yn(13)} ${cx + 4} ${yn(13) + 2} C${cx - 2} ${yn(12)} ${cx + 2} ${yn(9)} ${cx + 4} ${yn(7)} L${cx + 6} ${yn(-1) - 2} C${cx + 8} ${yn(-3)} ${cx - 2} ${yn(-4)} ${cx - 8} ${yn(-3)} C${cx - 14} ${yn(-2)} ${cx - 8} ${yn(0) + 4} ${cx - 2} ${yn(-1)}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx + 12} ${yn(3)} C${cx + 14} ${yn(0)} ${cx} ${yn(0) - 2} ${cx - 8} ${yn(2)} C${cx - 14} ${yn(4)} ${cx - 8} ${yn(7)} ${cx + 2} ${yn(6)} C${cx + 10} ${yn(5)} ${cx + 9} ${yn(2)} ${cx + 2} ${yn(2)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="${cx + 5}" cy="${yn(-3) + 2}" r="0" />`;
const BASS = (cx) => `<circle cx="${cx - 4}" cy="${yn(6)}" r="5.5" fill="${INK}"/><path d="M${cx - 4} ${yn(6) - 5} C${cx + 14} ${yn(6) - 8} ${cx + 22} ${yn(7.5)} ${cx + 20} ${yn(5)} C${cx + 18} ${yn(2)} ${cx + 4} ${yn(0)} ${cx - 8} ${yn(-1)}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx + 30}" cy="${yn(7)}" r="3.2" fill="${INK}"/><circle cx="${cx + 30}" cy="${yn(5)}" r="3.2" fill="${INK}"/>`;

/** Pauta de sol ou de fá com 1 a 3 notas em sequência. */
export function clefStaff(clef, notes) {
  const list = [].concat(notes); const xs = list.length === 1 ? [200] : list.length === 2 ? [160, 240] : [135, 195, 255];
  let ledger = ''; let body = '';
  list.forEach((n, i) => {
    const s = posOf(clef, n); const x = xs[i]; const y = yn(s);
    if (s < 0) for (let k = -2; k >= s; k -= 2) ledger += `<line x1="${x - 16}" y1="${yn(k)}" x2="${x + 16}" y2="${yn(k)}" stroke="${INK}" stroke-width="2"/>`;
    if (s > 8) for (let k = 10; k <= s; k += 2) ledger += `<line x1="${x - 16}" y1="${yn(k)}" x2="${x + 16}" y2="${yn(k)}" stroke="${INK}" stroke-width="2"/>`;
    const up = s < 4; const sx = up ? x + 10 : x - 10;
    body += `<ellipse cx="${x}" cy="${y}" rx="10.5" ry="7.5" transform="rotate(-20 ${x} ${y})" fill="${INK}"/><line x1="${sx}" y1="${y}" x2="${sx}" y2="${up ? y - 46 : y + 46}" stroke="${INK}" stroke-width="2.6"/>`;
  });
  const cx = 44;
  return `<svg viewBox="0 0 320 196" role="img" aria-label="Pauta na ${CLEFS[clef].name} com ${list.length > 1 ? `${list.length} notas em sequência` : 'uma nota'}">${Array.from({ length: 5 }, (_, i) => `<line x1="18" y1="${yn(i * 2)}" x2="302" y2="${yn(i * 2)}" stroke="${INK}" stroke-width="2"/>`).join('')}${clef === 'sol' ? TREBLE(cx) : BASS(cx)}${ledger}${body}</svg>`;
}

/* ---------- teclado (imagens do modo visual: sem nomes) ---------- */
export const KB = { sol: [mk('C', 4), mk('C', 6)], fa: [mk('C', 2), mk('C', 4)] };
export function keyboard(clef, marks, range) {
  const [lo, hi] = range || KB[clef]; const m = [].concat(marks); const W = 20; const total = (hi - lo + 1) * W;
  let white = ''; let black = '';
  for (let n = lo; n <= hi; n++) {
    const x = (n - lo) * W; const k = m.indexOf(n);
    white += `<rect x="${x + 0.5}" y="2" width="${W - 1}" height="86" rx="2" fill="${k >= 0 ? RED : '#fffdf8'}" stroke="${INK}" stroke-width="1.5"/>`;
    if (k >= 0 && m.length > 1) white += `<text x="${x + W / 2}" y="78" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="13" fill="#fff">${k + 1}</text>`;
    if (n === mk('C', 4)) white += `<circle cx="${x + W / 2}" cy="${k >= 0 ? 62 : 74}" r="2.6" fill="${k >= 0 ? '#fff' : INK}" opacity=".55"/>`;
    const L = letterOf(n);
    if (n < hi && ['C', 'D', 'F', 'G', 'A'].includes(L)) black += `<rect x="${x + W - 6}" y="2" width="12" height="52" rx="2" fill="${INK}"/>`;
  }
  return `<svg viewBox="0 0 ${total} 90" role="img" aria-label="Teclado com ${m.length > 1 ? 'teclas destacadas' : 'uma tecla destacada'}">${white}${black}</svg>`;
}

/* ---------- bateria com selo de articulação (imagens do modo visual) ---------- */
const BADGE = {
  open: `<circle cx="0" cy="0" r="22" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="0" r="9" fill="none" stroke="${INK}" stroke-width="4"/>`,
  pedal: `<circle cx="0" cy="0" r="22" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M0 -12v18M-8 0l8 9 8-9" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="-10" y="11" width="20" height="4" rx="2" fill="${INK}"/>`,
  ghost: `<circle cx="0" cy="0" r="22" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M-9 -9q-7 9 0 18M9 -9q7 9 0 18" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><circle cx="0" cy="0" r="3.2" fill="${INK}" opacity=".5"/>`,
  accent: `<circle cx="0" cy="0" r="22" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M-9 -9l18 9-18 9" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  rim: `<circle cx="0" cy="0" r="22" fill="#fffdf8" stroke="${INK}" stroke-width="3"/><path d="M-9 -9l18 18M9 -9l-18 18" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>`,
};
const DOTS = (n) => `<svg viewBox="0 0 120 34" role="img" aria-label="batidas dentro de um tempo">${Array.from({ length: n }, (_, i) => `<ellipse cx="${n === 1 ? 60 : n === 2 ? 40 + i * 40 : 18 + i * 28}" cy="17" rx="9" ry="7" fill="${RED}" transform="rotate(-20 ${n === 1 ? 60 : n === 2 ? 40 + i * 40 : 18 + i * 28} 17)"/>`).join('')}</svg>`;
/** A bateria com as peças pintadas (e selos: círculo, pedal, parênteses, >, X). Sem nenhum nome. */
export function kitImage(parts, fig = null) {
  const ids = [].concat(parts); const d = ids.map((i) => DRUM[i]);
  const only = [...new Set(d.flatMap((k) => k.kit))].join('+');
  const badges = d.filter((k) => k.badge).map((k, i) => `<g transform="translate(${44 + i * 52} 40)">${BADGE[k.badge]}</g>`).join('');
  const svg = kitSvg(null, false, only).replace(/<\/svg>\s*$/, `${badges}</svg>`);
  return fig ? `<div class="pl-kit">${svg}<div class="pl-dots">${DOTS(FIGN[fig])}</div></div>` : svg;
}
export const dotsImage = (fig) => `<div class="pl-dots big">${DOTS(FIGN[fig])}</div>`;

/** Legenda de toda a notação de bateria deste jogo (uma convenção só). */
export function legendHtml() {
  const rows = ['bd', 'sn', 'hh', 'ho', 'hf', 'rd', 'cr', 'tt', 'mt', 'ft', 'sg', 'sa', 'sr'];
  return rows.map((id) => ({ id, name: DRUM[id].name, where: DRUM[id].where, svg: drumStaff(id) }));
}
export { noteName };
