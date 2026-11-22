// Peças de tela dos jogos de ouvido: fileira de opções que arrasta pro lado (com setinhas ‹ ›) e o toque do som.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { tocaNota } from './vivo-ui.js';

/** Toca uma lista de notas (MIDI): `junto` = acorde (com um leve arrastar), senão uma depois da outra. Devolve a duração em ms. */
export function toca(midis, { junto = false, passo = 0.8, dur = 0.8, vol = 0.5 } = {}) {
  const t0 = audio().currentTime + 0.05;
  midis.forEach((m, i) => tocaNota(m, t0 + (junto ? i * 0.045 : i * passo), junto ? 1.5 : dur, junto ? vol * 0.7 : vol));
  return junto ? 1600 : (midis.length - 1) * passo * 1000 + dur * 1000 + 100;
}

/** Fileira de chips numa linha só: arrasta pro lado e tem setinhas ‹ › (somem quando não há mais pra onde ir). `opts` = [[valor, texto]]. */
export function linhaRolar(rotulo, opts, atual, onPick) {
  const fila = h('div', { class: 'vv-rol-fila', role: 'radiogroup', 'aria-label': rotulo },
    ...opts.map(([v, txt]) => h('button', { type: 'button', role: 'radio', class: `vv-chip${v === atual ? ' on' : ''}`, 'aria-checked': String(v === atual), 'data-v': String(v), onclick: () => { if (v !== atual) onPick(v); } }, txt)));
  const ir = (d) => fila.scrollBy({ left: d * Math.max(120, fila.clientWidth * 0.7), behavior: 'smooth' });
  const esq = h('button', { type: 'button', class: 'vv-rol-b esq', 'aria-label': 'ver as opções anteriores', onclick: () => ir(-1) }, '‹');
  const dir = h('button', { type: 'button', class: 'vv-rol-b dir', 'aria-label': 'ver mais opções', onclick: () => ir(1) }, '›');
  const atualiza = () => { const max = fila.scrollWidth - fila.clientWidth; const e = max < 6 || fila.scrollLeft < 4; const d = max < 6 || fila.scrollLeft > max - 4; if (esq.hidden !== e) esq.hidden = e; if (dir.hidden !== d) dir.hidden = d; };
  fila.addEventListener('scroll', atualiza, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(atualiza).observe(fila);
  requestAnimationFrame(() => { const on = fila.querySelector('.on'); if (on) fila.scrollLeft = Math.max(0, on.offsetLeft - 60); atualiza(); });
  return h('div', { class: 'vv-rol' }, h('span', { class: 'vv-lab' }, rotulo), h('div', { class: 'vv-rol-cx' }, fila, esq, dir));
}
