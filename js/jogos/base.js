// Base compartilhada dos jogos musicais: armazenamento local versionado (cai pra memória se faltar), som opcional e figuras rítmicas em SVG.
import { audio } from '../audio.js';

const KEY = 'beaterista-jogos';
const SCHEMA = 1;
let mem = null; // espelho em memória: vale mesmo se o armazenamento do navegador falhar

const blank = () => ({ v: SCHEMA, sound: true, games: {} });
function read() {
  if (mem) return mem;
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch { data = null; }
  const ok = data && typeof data === 'object' && data.v === SCHEMA && data.games && typeof data.games === 'object';
  mem = ok ? { ...blank(), ...data, sound: data.sound !== false } : blank();
  return mem;
}
function write() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* sem armazenamento: segue em memória */ } }

export const soundOn = () => read().sound;
export function setSound(on) { read().sound = !!on; write(); }
export const getGame = (id) => { const g = read().games[id]; return g && typeof g === 'object' ? g : {}; };
export function setGame(id, patch) { const s = read(); s.games[id] = { ...getGame(id), ...patch }; write(); }

/** Sons curtos sintetizados; só depois de um toque (chamados a partir de cliques) e só se o som estiver ligado. */
export function sfx(kind) {
  if (!soundOn()) return;
  try {
    const c = audio(); const t0 = c.currentTime + 0.01;
    const seq = { tap: [[330, 0, 0.09]], place: [[262, 0, 0.08], [196, 0.05, 0.1]], draw: [[220, 0, 0.12]], bad: [[170, 0, 0.16]], win: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.24]], lose: [[330, 0, 0.16], [262, 0.15, 0.16], [196, 0.3, 0.26]], tie: [[392, 0, 0.14], [392, 0.16, 0.2]] }[kind] || [];
    seq.forEach(([f, d, len]) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.2, t0 + d + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + len);
      o.connect(g); g.connect(c.destination); o.start(t0 + d); o.stop(t0 + d + len + 0.02);
    });
  } catch { /* sem áudio */ }
}

export const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- figuras rítmicas (SVG preciso, sem depender de fonte) ---------- */
const INK = 'currentColor';
/** Uma figura em 24×44. Cabeça oval inclinada; haste à direita da cabeça (mínima e semínima); semibreve sem haste. */
export const FIGURE_SVG = {
  semibreve: `<ellipse cx="12" cy="30" rx="9" ry="6" fill="${INK}"/><ellipse cx="12" cy="30" rx="2.9" ry="5" transform="rotate(-32 12 30)" fill="var(--jg-hole,#fffdf7)"/>`,
  minima: `<ellipse cx="9.5" cy="34" rx="6.6" ry="4.6" transform="rotate(-24 9.5 34)" fill="none" stroke="${INK}" stroke-width="2.4"/><path d="M15.6 32.2V6" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
  seminima: `<ellipse cx="9.5" cy="34" rx="6.6" ry="4.6" transform="rotate(-24 9.5 34)" fill="${INK}"/><path d="M15.6 32.2V6" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
};
export const FIGURE_NAME = { semibreve: 'semibreve', minima: 'mínima', seminima: 'semínima' };
const NS = 'http://www.w3.org/2000/svg';
export function figureEl(kind) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', kind === 'semibreve' ? '0 22 24 16' : '0 0 24 44'); s.setAttribute('class', `jg-fig ${kind}`); s.setAttribute('role', 'img'); s.setAttribute('aria-label', FIGURE_NAME[kind]);
  s.innerHTML = FIGURE_SVG[kind];
  return s;
}
