// Fileira de opções numa linha só (não quebra em várias linhas): arrasta pro lado e tem setinhas ‹ › que somem quando não há mais pra onde ir.
// Serve pras fileiras do painel dos instrumentos (som, escala, tema...). A fileira pode ser redesenhada à vontade: as setinhas ficam de fora dela.
import { h } from '../util.js';

export function rolar(el) {
  const alvo = () => (el.classList.contains('kd-modes') ? el : el.querySelector('.kd-modes'));
  const ir = (dir) => { const r = alvo(); if (r) r.scrollBy({ left: dir * Math.max(120, r.clientWidth * 0.7), behavior: 'smooth' }); };
  const esq = h('button', { type: 'button', class: 'kd-rolar-b esq', 'aria-label': 'ver as opções anteriores', onclick: () => ir(-1) }, '‹');
  const dir = h('button', { type: 'button', class: 'kd-rolar-b dir', 'aria-label': 'ver mais opções', onclick: () => ir(1) }, '›');
  const wrap = h('div', { class: 'kd-rolar' }, el, esq, dir);
  const atualiza = () => {
    const r = alvo(); let e = true, d = true; // só mexe no atributo se mudou (mexer sem mudar também conta pro observador e entra em loop)
    if (r && !r.hidden) { const max = r.scrollWidth - r.clientWidth; e = max < 6 || r.scrollLeft < 4; d = max < 6 || r.scrollLeft > max - 4; }
    if (esq.hidden !== e) esq.hidden = e; if (dir.hidden !== d) dir.hidden = d;
  };
  const mostraEscolhida = () => { // depois de escolher/redesenhar, a opção ligada não pode ficar escondida fora da tela
    const r = alvo(); const on = r && r.querySelector('.on, [aria-pressed="true"], [aria-checked="true"]'); if (!on) return;
    const a = on.getBoundingClientRect(), b = r.getBoundingClientRect();
    if (a.left < b.left + 4) r.scrollLeft -= b.left - a.left + 12; else if (a.right > b.right - 4) r.scrollLeft += a.right - b.right + 12;
  };
  wrap.addEventListener('scroll', atualiza, true);
  if ('MutationObserver' in window) new MutationObserver(() => { mostraEscolhida(); atualiza(); }).observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'aria-checked', 'aria-pressed'] });
  if ('ResizeObserver' in window) new ResizeObserver(atualiza).observe(wrap);
  requestAnimationFrame(() => { mostraEscolhida(); atualiza(); });
  return wrap;
}
