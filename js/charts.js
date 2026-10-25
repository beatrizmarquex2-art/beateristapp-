// Gráficos do app em SVG puro (sem biblioteca): barras, anel de progresso e barras deitadas.
// Uma série por gráfico, cor de destaque do tema; texto sempre na cor da tinta. Cada barra tem <title> (dica ao tocar/passar).
import { todayKey, weekdayOf } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v); kids.forEach((c) => e.append(c)); return e; };

/* ---------- dados ---------- */
const addDays = (key, n) => new Date(Date.parse(`${key}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const WD_LETTER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
/** Os 7 dias (segunda a domingo) da semana de `key`. */
export function weekKeys(key = todayKey()) { const off = (weekdayOf(key) + 6) % 7; return Array.from({ length: 7 }, (_, i) => addDays(key, i - off)); }

/** Aulas dadas, faltas e minutos de estudo por dia da semana. */
export function weekStats(lessons, practice, key = todayKey()) {
  const days = weekKeys(key).map((k) => ({ key: k, aulas: 0, faltas: 0, min: 0 }));
  const at = Object.fromEntries(days.map((d) => [d.key, d]));
  for (const l of lessons) { const d = at[l.data.date]; if (!d) continue; if (l.data.attendance === 'presente') d.aulas++; else if (l.data.attendance === 'faltou') d.faltas++; }
  for (const p of practice) { if (!p.data.at || !p.data.minutes) continue; const d = at[todayKey(new Date(p.data.at))]; if (d) d.min += p.data.minutes; }
  const sum = (f) => days.reduce((n, d) => n + d[f], 0);
  return { days, aulas: sum('aulas'), faltas: sum('faltas'), min: sum('min') };
}

/* ---------- formas ---------- */
/** Barras verticais. data: [{label, value, title, strong}] */
export function bars(data, { height = 120, label = 'gráfico de barras' } = {}) {
  const w = 300, top = 18, base = height - 22, slot = w / data.length, bw = Math.min(26, slot * 0.56);
  const max = Math.max(1, ...data.map((d) => d.value));
  const svg = el('svg', { viewBox: `0 0 ${w} ${height}`, class: 'ch ch-bars', role: 'img', 'aria-label': label });
  svg.append(el('line', { x1: 0, x2: w, y1: base + 0.5, y2: base + 0.5, class: 'ch-axis' }));
  data.forEach((d, i) => {
    const x = i * slot + (slot - bw) / 2; const hgt = d.value ? Math.max(3, (base - top) * d.value / max) : 0;
    const g = el('g', { class: `ch-col${d.strong ? ' strong' : ''}`, tabindex: '0' }, el('title', {}, d.title || `${d.label}: ${d.value}`));
    g.append(el('rect', { x: i * slot, y: 0, width: slot, height, class: 'ch-hit' }));
    if (hgt) g.append(el('rect', { x, y: base - hgt, width: bw, height: hgt, class: 'ch-bar', style: `--d:${i * 60}ms` }));
    if (d.value) g.append(el('text', { x: x + bw / 2, y: base - hgt - 5, class: 'ch-val', 'text-anchor': 'middle' }, String(d.value)));
    g.append(el('text', { x: x + bw / 2, y: height - 5, class: 'ch-lab', 'text-anchor': 'middle' }, d.label));
    svg.append(g);
  });
  return svg;
}

/** Anel de progresso com o número no meio. */
export function ring(value, total, { size = 112, caption = '' } = {}) {
  const r = 44, c = 2 * Math.PI * r, p = total ? Math.min(1, value / total) : 0;
  return el('svg', { viewBox: '0 0 112 112', width: size, height: size, class: 'ch ch-ring', role: 'img', 'aria-label': `${value} de ${total} ${caption}` },
    el('circle', { cx: 56, cy: 56, r, class: 'ch-track' }),
    el('circle', { cx: 56, cy: 56, r, class: 'ch-arc', 'stroke-dasharray': `${c * p} ${c}`, transform: 'rotate(-90 56 56)', style: `--c:${c}` }),
    el('text', { x: 56, y: 58, class: 'ch-ring-n', 'text-anchor': 'middle' }, String(value)),
    el('text', { x: 56, y: 76, class: 'ch-ring-t', 'text-anchor': 'middle' }, `de ${total}`));
}
