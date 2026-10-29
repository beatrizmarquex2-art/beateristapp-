// Desenhos (bateria, pauta, figuras) e sons curtos da área Kids. Só desenho nosso, sem texto de fora.
import { h } from '../util.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio } from '../audio.js';
import { VOICE } from '../views/beatlab.js';
import { FIGURES } from '../kids-logic.js';
import { kitSvg } from './icons.js';

export const play = (id) => { const c = audio(); VOICE[id](c.currentTime + 0.01, 1); };
export const svgEl = (markup, cls) => { const d = h('div', { class: cls }); d.innerHTML = markup; return d; };

/* ---------- desenhos ---------- */
export function kitMarkup(hl, hide, only) { return kitSvg(hl, hide, only); }
/** Pauta com uma nota na casinha da peça (cabeça em x nos pratos e no chimbal). `ids` pode ser uma peça ou várias tocadas juntas
 *  (mãos com a haste pra cima, bumbo com a haste pra baixo, como na partitura de bateria). */
export function staffMarkup(ids) {
  const list = Array.isArray(ids) ? ids : [ids]; const top = 40, gap = 16, x = 170; const X = ['cr', 'rd', 'hh', 'ho', 'hf'];
  const yOf = (id) => top + (N.POS[id] * gap) / 2;
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="20" y1="${top + i * gap}" x2="300" y2="${top + i * gap}" stroke="#1b1818" stroke-width="2"/>`).join('');
  const ledger = list.some((id) => N.POS[id] <= -2) ? `<line x1="${x - 18}" y1="${top - gap}" x2="${x + 18}" y2="${top - gap}" stroke="#1b1818" stroke-width="2"/>` : '';
  const heads = list.map((id) => { const y = yOf(id); return X.includes(id) ? `<path d="M${x - 9} ${y - 9}l18 18M${x + 9} ${y - 9}l-18 18" stroke="#b5162b" stroke-width="4"/>` : `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(-20 ${x} ${y})" fill="#b5162b"/>`; }).join('');
  const feet = list.filter((id) => ['bd', 'hf'].includes(id)); const hands = list.filter((id) => !feet.includes(id));
  const up = hands.length ? `<line x1="${x + 10}" y1="${Math.max(...hands.map(yOf))}" x2="${x + 10}" y2="${Math.min(...hands.map(yOf)) - 50}" stroke="#b5162b" stroke-width="3"/>` : '';
  const down = feet.length ? `<line x1="${x - 10}" y1="${Math.min(...feet.map(yOf))}" x2="${x - 10}" y2="${Math.max(...feet.map(yOf)) + 44}" stroke="#b5162b" stroke-width="3"/>` : '';
  return `<svg viewBox="0 0 320 150" role="img" aria-label="Pauta com ${list.length > 1 ? 'duas notas juntas' : 'uma nota'}">${lines}<rect x="30" y="${top + gap}" width="6" height="${gap * 2}" fill="#1b1818"/><rect x="40" y="${top + gap}" width="6" height="${gap * 2}" fill="#1b1818"/>${ledger}${heads}${up}${down}</svg>`;
}
export function figureMarkup(id) {
  const open = id === 'semibreve' || id === 'minima'; const stem = id !== 'semibreve'; const flags = { colcheia: 1, semicolcheia: 2, fusa: 3 }[id] || 0;
  const head = `<ellipse cx="40" cy="100" rx="17" ry="12" transform="rotate(-20 40 100)" fill="${open ? '#fffdf8' : '#1b1818'}" stroke="#1b1818" stroke-width="5"/>`;
  const st = stem ? '<line x1="55" y1="96" x2="55" y2="20" stroke="#1b1818" stroke-width="5"/>' : '';
  const fl = Array.from({ length: flags }, (_, i) => `<path d="M55 ${22 + i * 18}c6 12 26 14 22 40" stroke="#1b1818" stroke-width="5" fill="none"/>`).join('');
  return `<svg viewBox="0 0 110 130" role="img" aria-label="${(FIGURES.find((f) => f.id === id) || {}).name || id}">${head}${st}${fl}</svg>`;
}
/** Pausas (o silêncio de cada figura) e símbolos da partitura, no mesmo traço das figuras. */
export function restMarkup(id) {
  const S = '#1b1818'; const ln = `<line x1="14" y1="64" x2="96" y2="64" stroke="${S}" stroke-width="3"/>`;
  const body = {
    semibreve: `${ln}<rect x="38" y="64" width="34" height="14" fill="${S}"/>`,
    minima: `${ln}<rect x="38" y="50" width="34" height="14" fill="${S}"/>`,
    seminima: `<path d="M50 28l16 20-14 14 16 22c-14-8-24 2-12 14" stroke="${S}" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
    colcheia: `<circle cx="42" cy="44" r="7" fill="${S}"/><path d="M42 50q14 2 18-10l-14 54" stroke="${S}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    semicolcheia: `<circle cx="42" cy="36" r="7" fill="${S}"/><circle cx="36" cy="58" r="7" fill="${S}"/><path d="M42 42q14 2 18-10M36 64q14 2 18-10M60 32l-16 62" stroke="${S}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    fusa: `<circle cx="44" cy="26" r="6" fill="${S}"/><circle cx="38" cy="46" r="6" fill="${S}"/><circle cx="32" cy="66" r="6" fill="${S}"/><path d="M44 31q14 2 18-10M38 51q14 2 18-10M32 71q14 2 18-10M62 21l-34 76" stroke="${S}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  }[id] || '';
  return `<svg viewBox="0 0 110 130" role="img" aria-label="pausa de ${(FIGURES.find((f) => f.id === id) || {}).name || id}">${body}</svg>`;
}
export function symbolMarkup(id) {
  const S = '#1b1818';
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="8" y1="${34 + i * 14}" x2="102" y2="${34 + i * 14}" stroke="${S}" stroke-width="2"/>`).join('');
  const body = {
    clave: `${lines}<rect x="30" y="48" width="9" height="28" fill="${S}"/><rect x="46" y="48" width="9" height="28" fill="${S}"/>`,
    formula: `${lines}<text x="55" y="76" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="40" fill="${S}">4</text><text x="55" y="104" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="40" fill="${S}">4</text>`,
    final: `${lines}<line x1="70" y1="34" x2="70" y2="90" stroke="${S}" stroke-width="3"/><rect x="80" y="34" width="9" height="56" fill="${S}"/>`,
    acento: `<path d="M24 44l62 20-62 20" stroke="${S}" stroke-width="9" fill="none" stroke-linejoin="miter"/>`,
  }[id] || '';
  return `<svg viewBox="0 0 110 130" role="img" aria-label="${id}">${body}</svg>`;
}
export const tone = (beats, bpm = 60) => { const c = audio(); const o = c.createOscillator(); const g = c.createGain(); const t = c.currentTime + 0.02; const d = (60 / bpm) * beats;
  o.type = 'triangle'; o.frequency.value = 523; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.setValueAtTime(0.3, t + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05); };

