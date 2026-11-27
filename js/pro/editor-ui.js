// Peças compartilhadas dos editores do PRO (teclado, tablatura, bateria): toque sem atraso e sem duplicar, barras, ajustes recolhidos e redimensionamento calmo.
import { h } from '../util.js';

/** Liga uma ação ao toque do dedo NO MOMENTO em que encosta (pointerdown: sem esperar soltar) e ao teclado (Enter/Espaço).
    Sem isso, o toque dispara duas vezes (pointerdown + click) ou só depois de soltar. `fn(evento)`. */
export function toque(el, fn) {
  let tocouEm = 0;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); tocouEm = performance.now(); try { fn(e); } finally { /* ok */ } });
  el.addEventListener('click', (e) => { if (e.detail > 0 || performance.now() - tocouEm < 700) { e.preventDefault(); return; } fn(e); }); // detail 0 = veio do teclado ou de leitor de tela
  el.addEventListener('contextmenu', (e) => e.preventDefault()); // segurar o dedo não abre menu
  return el;
}
/** Chama `fn` uma vez só depois que a largura parar de mudar (barra do Safari encolhendo, girar o aparelho, abrir o menu lateral). */
export function aoMudarLargura(el, fn, ms = 120) {
  let w = el.clientWidth; let t = 0;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { const n = el.clientWidth; if (Math.abs(n - w) >= 2) { w = n; fn(); } }, ms); }) : null;
  if (ro) ro.observe(el);
  return () => { clearTimeout(t); if (ro) ro.disconnect(); };
}
/** Botão redondo só com ícone (barra de cima). */
export function iconeBtn(ico, rotulo, fn, { on = false, dis = false } = {}) { const b = h('button', { type: 'button', class: `ep-ib${on ? ' on' : ''}`, 'aria-label': rotulo, title: rotulo, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', (e) => fn(e.currentTarget)); return b; }
/** Botão com ícone e texto (ações do fim: PDF, guardar). */
export function acaoBtn(ico, texto, fn, { dis = false, rotulo = texto } = {}) { const b = h('button', { type: 'button', class: 'ep-ac', 'aria-label': rotulo, disabled: dis }); b.innerHTML = `${ico}<span>${texto}</span>`; b.addEventListener('click', (e) => fn(e.currentTarget)); return b; }
/** "Ajustes": o que se mexe pouco (andamento, cordas, kit, clave) fica recolhido; o resumo mostra os valores. */
export function ajustes(resumo, ...filhos) {
  const d = h('details', { class: 'ep-aj' }, h('summary', {}, h('span', { class: 'ep-aj-t' }, 'ajustes'), h('span', { class: 'ep-aj-r' }, resumo)), h('div', { class: 'ep-aj-c' }, ...filhos));
  return d;
}
/** Painel de correção da nota escolhida: título + fechar, setas em 2 colunas, e uma linha de botões. */
export function painelCorrige(titulo, fechar, setas, botoes) {
  return h('div', { class: 'ep-corrige', role: 'group', 'aria-label': 'Corrigir a nota escolhida' },
    h('div', { class: 'ep-cor-t' }, h('b', {}, titulo), h('button', { type: 'button', class: 'ep-x', 'aria-label': 'Fechar a correção', onclick: fechar }, '×')),
    h('div', { class: 'ep-cor-g' }, ...setas), h('div', { class: 'ep-cor-b' }, ...botoes));
}
