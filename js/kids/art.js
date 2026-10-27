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
export function kitMarkup(hl, hide) { return kitSvg(hl, hide); }
/** Pauta com uma nota na casinha da peça (cabeça em x nos pratos e no chimbal). */
export function staffMarkup(id) {
  const top = 40, gap = 16, x = 170; const y = top + (N.POS[id] * gap) / 2; const xh = ['cr', 'rd', 'hh', 'ho', 'hf'].includes(id);
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="20" y1="${top + i * gap}" x2="300" y2="${top + i * gap}" stroke="#1b1818" stroke-width="2"/>`).join('');
  const ledger = N.POS[id] <= -2 ? `<line x1="${x - 18}" y1="${top - gap}" x2="${x + 18}" y2="${top - gap}" stroke="#1b1818" stroke-width="2"/>` : '';
  const head = xh ? `<path d="M${x - 9} ${y - 9}l18 18M${x + 9} ${y - 9}l-18 18" stroke="#b5162b" stroke-width="4"/>` : `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(-20 ${x} ${y})" fill="#b5162b"/>`;
  return `<svg viewBox="0 0 320 150" role="img" aria-label="Pauta com uma nota">${lines}<rect x="30" y="${top + gap}" width="6" height="${gap * 2}" fill="#1b1818"/><rect x="40" y="${top + gap}" width="6" height="${gap * 2}" fill="#1b1818"/>${ledger}${head}<line x1="${x + 10}" y1="${y}" x2="${x + 10}" y2="${y - 50}" stroke="#b5162b" stroke-width="3"/></svg>`;
}
export function figureMarkup(id) {
  const open = id === 'semibreve' || id === 'minima'; const stem = id !== 'semibreve'; const flags = { colcheia: 1, semicolcheia: 2 }[id] || 0;
  const head = `<ellipse cx="40" cy="100" rx="17" ry="12" transform="rotate(-20 40 100)" fill="${open ? '#fffdf8' : '#1b1818'}" stroke="#1b1818" stroke-width="5"/>`;
  const st = stem ? '<line x1="55" y1="96" x2="55" y2="20" stroke="#1b1818" stroke-width="5"/>' : '';
  const fl = Array.from({ length: flags }, (_, i) => `<path d="M55 ${22 + i * 18}c6 12 26 14 22 40" stroke="#1b1818" stroke-width="5" fill="none"/>`).join('');
  return `<svg viewBox="0 0 110 130" role="img" aria-label="${(FIGURES.find((f) => f.id === id) || {}).name || id}">${head}${st}${fl}</svg>`;
}
export const tone = (beats, bpm = 60) => { const c = audio(); const o = c.createOscillator(); const g = c.createGain(); const t = c.currentTime + 0.02; const d = (60 / bpm) * beats;
  o.type = 'triangle'; o.frequency.value = 523; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.setValueAtTime(0.3, t + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05); };

