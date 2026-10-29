import { h, icon, reducedMotion } from './util.js';

const root = () => document.getElementById('overlay');

/** Aviso tipo "papel que desliza". Aceita ação (ex.: desfazer). */
export function toast(msg, { action, onAction, ms = 4500, id } = {}) {
  const host = document.getElementById('toasts');
  if (id) host.querySelectorAll(`[data-id="${id}"]`).forEach((x) => x.remove()); // o aviso novo substitui o anterior do mesmo tipo
  const t = h('div', { class: `toast${id ? ' mini' : ''}`, role: 'status', 'data-id': id || null }, h('span', {}, msg));
  if (action) {
    t.append(h('button', { class: 'toast-act', type: 'button', onclick: () => { onAction && onAction(); t.remove(); } }, action));
  }
  host.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

const sheets = []; // folhas abertas, da de baixo pra de cima (só a de cima reage ao Esc e ao Tab)
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Enquanto houver folha aberta: a página de trás não rola nem recebe foco (e volta ao normal quando a última fecha). */
function lockPage(on) {
  document.documentElement.classList.toggle('sheet-open', on);
  const app = document.getElementById('app'); if (app) { if (on) app.setAttribute('inert', ''); else app.removeAttribute('inert'); }
}
/** Fecha todas as folhas abertas (trocou de tela: folha de uma tela antiga não pode ficar por cima da nova). */
export function closeSheets() { [...sheets].reverse().forEach((s) => s.close()); }

let lastFocus = null;
/**
 * Bottom sheet acessível. `build(close)` devolve o conteúdo (se o elemento tiver `.cleanup`, ele roda quando a folha fecha por qualquer caminho).
 * O foco fica preso dentro da folha, Esc fecha só a de cima e a rolagem da página de trás fica travada enquanto ela existe.
 */
export function sheet(title, build, { onClose } = {}) {
  const prevFocus = document.activeElement; if (!sheets.length) lastFocus = prevFocus;
  const back = h('div', { class: 'sheet-back' });
  const box = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1' });
  let closed = false; let content = null;
  const entry = { close: () => {} };
  const close = () => {
    if (closed) return; closed = true; // toque duplo no X / fundo não fecha (nem chama onClose) duas vezes
    document.removeEventListener('keydown', onKey);
    const i = sheets.indexOf(entry); if (i >= 0) sheets.splice(i, 1);
    if (!sheets.length) lockPage(false);
    try { content && content.cleanup && content.cleanup(); } catch (e) { console.error(e); }
    box.classList.add('out'); back.classList.add('out');
    setTimeout(() => { back.remove(); if (!sheets.length && lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus(); onClose && onClose(); }, reducedMotion() ? 0 : 200);
  };
  entry.close = close;
  const onKey = (e) => {
    if (sheets[sheets.length - 1] !== entry) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = [...box.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement);
    if (!items.length) { e.preventDefault(); box.focus(); return; }
    const first = items[0]; const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  sheets.push(entry); lockPage(true);
  content = build(close);
  box.append(
    h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
    h('div', { class: 'sheet-head' }, h('h2', {}, title), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', onclick: close }, icon('x', 20))),
    content,
  );
  back.append(box);
  root().append(back);
  const first = box.querySelector('input,textarea,select,button.primary');
  if (first && !matchMedia('(pointer: coarse)').matches) first.focus(); else box.focus({ preventScroll: true });
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

// Paul de cada ferramenta: o humor combina com o assunto da tela (pelo título do banner)
const PAUL_BY_TITLE = [
  [/metr|tap|bpm|tempo|cron|juiz|contar|compass/i, 'e19'], [/beat lab|groovebox|toque|rudiment|roleta|play-along|loop|ritmos?\b|jogos/i, 'e19'],
  [/ouvido|ambiente|piano|repert|setlist|artistas|bateristas|mural|colagens|club|álbuns|albuns/i, 'e03'], [/ideia/i, 'e13'], [/lembrete|checklist|esquecer|foco/i, 'e13'],
  [/arquivos|anota|conceitos|bibliotec|dicion|folhas|partitura|estudo|laborat/i, 'e06'], [/alunos?|plano/i, 'e20'], [/feed/i, 'e03'], [/favorit/i, 'e26'],
  [/desafio/i, 'e14'], [/ferrament|conex|mapa/i, 'e27'], [/ops|não achei/i, 'e28'],
];
const DOODLES = ['note', 'phones', 'bolt2', 'burst', 'phones', 'boltgold', 'ulstar', 'bolt2', 'notered', 'phones', 'stars', 'boltgold'];
const hashOf = (t) => [...String(t)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
/** Cabeçalho das telas: título, subtítulo, o Paul do assunto e dois rabiscos soltos. */
export function banner(text, sub) {
  const hit = PAUL_BY_TITLE.find(([re]) => re.test(text)); const n = hashOf(text);
  const paul = /^alunos?$/i.test(text.trim()) ? 'bateria' : `e${String(hit ? hit[1].slice(1) : [2, 30, 20, 3][n % 4]).padStart(2, '0')}`;
  const d1 = DOODLES[n % DOODLES.length];
  return h('div', { class: 'banner-wrap has-paul' },
    h('h1', { class: 'banner' }, text),
    sub ? h('p', { class: 'banner-sub' }, sub) : null,
    h('img', { class: 'bn-paul', src: `assets/paul/${paul}.webp`, alt: '', 'aria-hidden': 'true', draggable: 'false' }),
    h('img', { class: 'bn-doodle d1', src: `assets/paul/d-${d1}.webp`, alt: '', 'aria-hidden': 'true', draggable: 'false' }),
    null);
}
