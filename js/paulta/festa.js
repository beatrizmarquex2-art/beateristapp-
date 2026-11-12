// Festa musical da pauLta (pedido da Bea): ao concluir os 12 níveis de um modo da bateria, uma chuva de notas e estrelas com o Paul comemorando
// e uma musiquinha de festa. Some sozinha. Respeita "reduzir movimento" (sem animação, só a mensagem) e o mudo da pauLta.
import { h } from '../util.js';
import { audio, out } from '../audio.js';
import { muted } from './sfx.js';

const NOTAS = ['♪', '♫', '★', '♬', '✦'];
const CORES = ['#2d8cff', '#7a5cff', '#b14dff', '#ff3d57', '#ffffff']; // só azul, roxo e vermelho (nada de verde)
const reduz = () => { try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const tom = (f, t, d, tipo = 'triangle', v = 0.18) => { const c = audio(); const o = c.createOscillator(); const g = c.createGain(); o.type = tipo; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(out()); o.start(t); o.stop(t + d + 0.05); };
/** Musiquinha de festa (~4 s): subida em dó maior, um "tchan" e um refrãozinho. */
export function musicaDaFesta() {
  try {
    if (muted()) return; const t = audio().currentTime + 0.05; const m = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568];
    m.forEach((f, i) => tom(f, t + i * 0.14, i === m.length - 1 ? 0.9 : 0.16)); [262, 330, 392].forEach((f) => tom(f, t + 1.5, 1.2, 'sawtooth', 0.07));
    [784, 988, 1175, 1568].forEach((f, i) => tom(f, t + 1.9 + i * 0.16, 0.2, 'square', 0.08)); tom(1568, t + 2.6, 1, 'triangle', 0.2);
  } catch { /* sem áudio */ }
}
/** Mostra a festa. `titulo`/`sub` = o que aparece no meio. Devolve a função que fecha na hora. */
export function festa({ titulo = 'FESTA!', sub = '' } = {}) {
  const parts = []; const n = reduz() ? 0 : 60;
  for (let i = 0; i < n; i++) parts.push(h('i', { class: 'pf-p', 'aria-hidden': 'true', style: `--x:${Math.round(Math.random() * 100)}%;--d:${(2.4 + Math.random() * 2.4).toFixed(2)}s;--w:${(Math.random() * 1.6).toFixed(2)}s;--s:${Math.round(18 + Math.random() * 26)}px;--c:${CORES[i % CORES.length]};--r:${Math.round(Math.random() * 360)}deg` }, NOTAS[i % NOTAS.length]));
  const fundo = reduz() ? [] : [h('i', { class: 'pf-beam b1' }), h('i', { class: 'pf-beam b2' }), h('i', { class: 'pf-beam b3' }), h('i', { class: 'pf-ring' }), h('i', { class: 'pf-ring r2' }), h('i', { class: 'pf-ring r3' }), h('div', { class: 'pf-eq', 'aria-hidden': 'true' }, ...Array.from({ length: 28 }, () => h('i', { style: `--t:${(0.35 + Math.random() * 0.6).toFixed(2)}s;--l:-${(Math.random() * 1).toFixed(2)}s` })))];
  const caixa = h('div', { class: 'pf-box', role: 'status' }, h('img', { class: 'pf-paul', src: 'assets/paul/e20.webp', alt: '', draggable: 'false' }), h('b', {}, titulo), sub ? h('p', {}, sub) : null, h('button', { type: 'button', class: 'kd-btn', onclick: () => fecha() }, 'valeu!'));
  const el = h('div', { class: 'pf' }, ...fundo, ...parts, caixa); document.body.append(el); musicaDaFesta();
  let tm = 0; function fecha() { clearTimeout(tm); el.classList.add('out'); setTimeout(() => el.remove(), reduz() ? 0 : 350); } tm = setTimeout(fecha, 9000);
  return fecha;
}
