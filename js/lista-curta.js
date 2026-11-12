// Lista que mostra só os 2 primeiros itens e uma setinha pra ver o resto (menos rolagem nas telas de Jogos e "trocar aluno").
import { h } from './util.js';
export function listaCurta(itens, max = 2) {
  const todos = itens.filter(Boolean); if (todos.length <= max) return h('div', { class: 'lc' }, ...todos);
  const resto = h('div', { class: 'lc-resto', hidden: true }, ...todos.slice(max)); const n = todos.length - max;
  const seta = h('button', { type: 'button', class: 'lc-seta', 'aria-expanded': 'false', 'aria-label': `mostrar mais ${n}`, onclick: () => { const abrir = resto.hidden; resto.hidden = !abrir; seta.setAttribute('aria-expanded', String(abrir)); seta.setAttribute('aria-label', abrir ? 'mostrar menos' : `mostrar mais ${n}`); seta.textContent = abrir ? '▴' : `▾ +${n}`; } }, `▾ +${n}`);
  return h('div', { class: 'lc' }, ...todos.slice(0, max), seta, resto);
}
