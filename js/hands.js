// Modo mão ocupada: botões grandes de voltar / desfazer / próxima ferramenta no lugar da barra de baixo.
import { h, icon } from './util.js';
const KEY = 'beaterista-hands';
export const handsOn = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export function setHands(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* sem armazenamento */ }
  document.documentElement.classList.toggle('hands', on);
  document.dispatchEvent(new CustomEvent('hands-changed'));
}
export const initHands = () => document.documentElement.classList.toggle('hands', handsOn());
export function handsBar({ back, undo, next, nextName }) {
  const nxt = h('button', { type: 'button', class: 'hb-btn', onclick: next }, h('span', { class: 'hb-l' }, 'próxima'), h('span', { class: 'hb-s' }, ''), icon('back', 30));
  nxt.lastChild.style.transform = 'scaleX(-1)';
  const bar = h('div', { class: 'hands-bar', role: 'toolbar', 'aria-label': 'Modo mão ocupada' },
    h('button', { type: 'button', class: 'hb-btn', onclick: back }, icon('back', 30), h('span', { class: 'hb-l' }, 'voltar')),
    h('button', { type: 'button', class: 'hb-btn hands-undo', onclick: undo }, icon('undo', 30), h('span', { class: 'hb-l' }, 'desfazer')),
    nxt);
  bar.paint = () => { nxt.querySelector('.hb-s').textContent = nextName(); };
  return bar;
}
