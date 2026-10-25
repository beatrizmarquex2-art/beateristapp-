export const TZ = 'America/Sao_Paulo';

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const x = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

/** Hyperscript seguro: texto sempre vira nó de texto (nunca innerHTML com dados do usuário). */
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
export const todayKey = (d = new Date()) => dayFmt.format(d);
/** 0=domingo … 6=sábado para uma chave YYYY-MM-DD */
export const weekdayOf = (key) => new Date(`${key}T12:00:00Z`).getUTCDay();

const longFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });
export const longDate = (d = new Date()) => longFmt.format(d);
const shortFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
export const shortDate = (d = new Date()) => shortFmt.format(d).replace('.', '').replace(/\./g, '');
export const clock = (d = new Date()) => timeFmt.format(d);

export function debounce(fn, ms) {
  let t;
  const wrapped = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  wrapped.flush = (...a) => { clearTimeout(t); fn(...a); };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Adesivo decorativo (imagem em assets/stk). `css` aceita variáveis: --r (rotação), --d (atraso da animação). */
export function stk(name, cls = '', css = '') {
  const e = document.createElement('img');
  e.src = `assets/stk/${name}.svg`; e.alt = ''; e.setAttribute('aria-hidden', 'true'); e.decoding = 'async';
  e.className = `stk ${cls}`.trim(); if (css) e.style.cssText = css;
  return e;
}

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  check: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12.5l3 3 5-6"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/>',
  star: '<path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2 6.4 20.3l1.2-6.3L3 9.6l6.3-.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  metro: '<path d="M8 21h8l-2-17h-4z"/><path d="M12 17L16 7"/><circle cx="16.4" cy="6" r="1"/>',
  study: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
  staff: '<path d="M3 8h18M3 11h18M3 14h18M3 17h18"/><circle cx="9" cy="17" r="2"/><path d="M11 17V6"/>',
  folder: '<path d="M3 6h7l2 2h9v11H3z"/>',
  drummer: '<circle cx="12" cy="9" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
  mural: '<rect x="3" y="4" width="8" height="9" rx="1"/><rect x="13" y="4" width="8" height="5" rx="1"/><rect x="13" y="11" width="8" height="9" rx="1"/><rect x="3" y="15" width="8" height="5" rx="1"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  pin: '<path d="M9 3h6l-1 6 3 3H7l3-3z"/><path d="M12 12v9"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  up: '<path d="M6 14l6-6 6 6"/>',
  down: '<path d="M6 10l6 6 6-6"/>',
  edit: '<path d="M4 20l1-5L16 4l4 4L9 19z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  repeat: '<path d="M4 11V9a3 3 0 013-3h11l-3-3M20 13v2a3 3 0 01-3 3H6l3 3"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1"/>',
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.4 0 2-1 1.5-2.2-.5-1.2.2-2.3 1.5-2.3H17a4 4 0 004-4c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.2" r="1"/><circle cx="14.5" cy="7.2" r="1"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>',
  crop: '<path d="M7 3v14h14M3 7h14v14"/>',
  rotate: '<path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5"/>',
  front: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V4h12"/>',
  backw: '<rect x="4" y="4" width="12" height="12" rx="1.5"/><path d="M8 20h12V8"/>',
  resize: '<path d="M14 20h6v-6M10 4H4v6M20 20L13 13M4 4l7 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  stop: '<rect x="7" y="7" width="10" height="10" fill="currentColor"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  book: '<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/>',
  news: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h6M7 12h10M7 15h10"/><rect x="14.5" y="8" width="3" height="2" rx=".5"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M15 10h3M15 13h3"/>',
  kit: '<ellipse cx="12" cy="10" rx="7" ry="2.5"/><path d="M5 10v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6"/><path d="M3.5 3l5.5 5.5M20.5 3L15 8.5"/>',
};
export function icon(name, size = 24) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.9'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICONS[name] || ''; // constantes internas, nunca dados do usuário
  return s;
}

/** Estrelinha de 4 pontas (brilho dourado). */
export function sparkle() {
  const w = document.createElement('span'); w.className = 'spk-i';
  w.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.8 6.4 3.6 9.2 12 12-8.4 2.8-11.2 5.6-12 12-.8-6.4-3.6-9.2-12-12 8.4-2.8 11.2-5.6 12-12z"/></svg>';
  return w.firstChild;
}
