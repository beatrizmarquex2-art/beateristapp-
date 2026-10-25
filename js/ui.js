import { h, icon, reducedMotion } from './util.js';

const root = () => document.getElementById('overlay');

/** Aviso tipo "papel que desliza". Aceita ação (ex.: desfazer). */
export function toast(msg, { action, onAction, ms = 4500 } = {}) {
  const host = document.getElementById('toasts');
  const t = h('div', { class: 'toast', role: 'status' }, h('span', {}, msg));
  if (action) {
    t.append(h('button', { class: 'toast-act', type: 'button', onclick: () => { onAction && onAction(); t.remove(); } }, action));
  }
  host.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

let lastFocus = null;
/** Bottom sheet acessível. `build(close)` devolve o conteúdo. */
export function sheet(title, build, { onClose } = {}) {
  lastFocus = document.activeElement;
  const back = h('div', { class: 'sheet-back' });
  const box = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  const close = () => {
    document.removeEventListener('keydown', onKey);
    box.classList.add('out'); back.classList.add('out');
    setTimeout(() => { back.remove(); lastFocus && lastFocus.focus && lastFocus.focus(); onClose && onClose(); }, reducedMotion() ? 0 : 200);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  box.append(
    h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
    h('div', { class: 'sheet-head' }, h('h2', {}, title), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', onclick: close }, icon('x', 20))),
    build(close),
  );
  back.append(box);
  root().append(back);
  const first = box.querySelector('input,textarea,select,button.primary');
  if (first && !matchMedia('(pointer: coarse)').matches) first.focus();
  return close;
}

export function confirmSheet(title, text, okLabel = 'Confirmar') {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    sheet(title, (close) => h('div', { class: 'sheet-body' },
      h('p', {}, text),
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { finish(false); close(); } }, 'Cancelar'),
        h('button', { class: 'btn danger', type: 'button', onclick: () => { finish(true); close(); } }, okLabel),
      )), { onClose: () => finish(false) });
  });
}

/** Carimbo de tinta (feedback tátil visual). */
export function stamp(el) {
  if (reducedMotion()) return;
  el.classList.remove('stamped'); void el.offsetWidth; el.classList.add('stamped');
}

/** Confete discreto de estrelas. */
export function stars(originEl) {
  if (reducedMotion()) return;
  const r = originEl.getBoundingClientRect();
  const cs = getComputedStyle(document.documentElement);
  const gold = cs.getPropertyValue('--gold').trim() || '#e3a82f', accent = cs.getPropertyValue('--link').trim() || '#a6192e';
  const layer = h('div', { class: 'stars-layer', 'aria-hidden': 'true' });
  for (let i = 0; i < 14; i++) {
    const s = h('span', { class: 'spark' }, '✦');
    const a = (Math.PI * 2 * i) / 14, d = 50 + Math.random() * 60;
    s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px;--rot:${Math.random() * 360}deg;color:${i % 3 ? gold : accent}`;
    layer.append(s);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1100);
}

export function banner(text, sub) {
  return h('div', { class: 'banner-wrap' },
    h('h1', { class: 'banner' }, text),
    sub ? h('p', { class: 'banner-sub' }, sub) : null);
}
