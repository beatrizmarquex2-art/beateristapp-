// Motor do estúdio de ambiente: sons gerados aqui no aparelho (ruído filtrado + eventos aleatórios), sem baixar áudio de ninguém.
// Fica vivo no módulo: trocar de tela não para o som. O player do YouTube mora no "dock" (fora da tela que troca).
import { audio } from './audio.js';
import { clean, ytEmbed, sleepLeft } from './ambient-logic.js';

let out = null; let mix = {}; let playing = false; let sleepAt = 0; let sleepTimer = 0; let yt = null;
const chans = {}; const subs = new Set(); const bufs = {};
const emit = () => subs.forEach((f) => f(state()));
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const state = () => ({ playing, mix: { ...mix }, sleepAt, yt });

function noise(c, kind) {
  if (bufs[kind]) return bufs[kind];
  const n = c.sampleRate * 4; const b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w * 0.5;
    else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.05) * 1.6; }
    else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  }
  return (bufs[kind] = b);
}
function loop(c, kind, dest) { const s = c.createBufferSource(); s.buffer = noise(c, kind); s.loop = true; s.loopStart = Math.random(); s.connect(dest); s.start(); return s; }
function filt(c, type, f, q = 0.7) { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; }
function lfo(c, rate, depth, param, base) { const o = c.createOscillator(); const g = c.createGain(); o.frequency.value = rate; g.gain.value = depth; param.value = base; o.connect(g).connect(param); o.start(); return o; }
/** Repete `fn` em intervalos aleatórios entre `a` e `b` ms enquanto o canal existir. */
function every(id, a, b, fn) { const tick = () => { if (!chans[id]) return; fn(); chans[id].t = setTimeout(tick, a + Math.random() * (b - a)); }; chans[id].t = setTimeout(tick, Math.random() * b); }
function burst(c, dest, { f = 3000, type = 'highpass', len = 0.015, peak = 0.5, kind = 'white' } = {}) {
  const s = c.createBufferSource(); s.buffer = noise(c, kind); const g = c.createGain(); const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(filt(c, type, f)).connect(g).connect(dest); s.start(t, Math.random() * 3); s.stop(t + len + 0.05);
}

const BUILD = {
  chuva: (c, g) => { const n = []; const f = filt(c, 'bandpass', 2500, 0.4); n.push(loop(c, 'pink', f)); f.connect(g); return n; },
  mar: (c, g) => { const amp = c.createGain(); const f = filt(c, 'lowpass', 700); const n = [loop(c, 'brown', f)]; f.connect(amp).connect(g); n.push(lfo(c, 0.09, 0.45, amp.gain, 0.55), lfo(c, 0.05, 250, f.frequency, 700)); return n; },
  lareira: (c, g, id) => { const f = filt(c, 'lowpass', 350); const n = [loop(c, 'brown', f)]; const low = c.createGain(); low.gain.value = 0.5; f.connect(low).connect(g); every(id, 40, 420, () => burst(c, g, { f: 1800 + Math.random() * 3000, len: 0.006 + Math.random() * 0.02, peak: 0.15 + Math.random() * 0.6 })); return n; },
  vento: (c, g) => { const f = filt(c, 'bandpass', 600, 1.2); const amp = c.createGain(); const n = [loop(c, 'white', f)]; f.connect(amp).connect(g); n.push(lfo(c, 0.07, 400, f.frequency, 700), lfo(c, 0.11, 0.35, amp.gain, 0.6)); return n; },
  trovao: (c, g, id) => { every(id, 14000, 40000, () => { const s = c.createBufferSource(); s.buffer = noise(c, 'brown'); const lp = filt(c, 'lowpass', 160); const e = c.createGain(); const t = c.currentTime; const d = 3 + Math.random() * 4;
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(1.6, t + 0.15 + Math.random() * 0.5); e.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(lp).connect(e).connect(g); s.start(t, Math.random() * 3); s.stop(t + d + 0.1); }); return []; },
  passaros: (c, g, id) => { every(id, 700, 4500, () => { const t = c.currentTime; const k = 1 + Math.floor(Math.random() * 4); const base = 2200 + Math.random() * 2200;
    for (let i = 0; i < k; i++) { const o = c.createOscillator(); const e = c.createGain(); const t0 = t + i * (0.09 + Math.random() * 0.05); o.type = 'sine';
      o.frequency.setValueAtTime(base, t0); o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.5), t0 + 0.05); o.frequency.exponentialRampToValueAtTime(base * 0.9, t0 + 0.08);
      e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09); o.connect(e).connect(g); o.start(t0); o.stop(t0 + 0.12); } }); return []; },
  vinil: (c, g, id) => { const f = filt(c, 'highpass', 3500); const h = c.createGain(); h.gain.value = 0.08; const n = [loop(c, 'pink', f)]; f.connect(h).connect(g); every(id, 120, 1600, () => burst(c, g, { f: 1000 + Math.random() * 4000, len: 0.004, peak: 0.1 + Math.random() * 0.35 })); return n; },
  branco: (c, g) => [loop(c, 'white', g)],
  rosa: (c, g) => [loop(c, 'pink', g)],
  marrom: (c, g) => [loop(c, 'brown', g)],
};

function ensureOut(c) {
  if (out) return out;
  out = c.createGain(); out.gain.value = 0.0001; out.connect(c.destination);
  return out;
}
function setChan(c, id, v) {
  if (v > 0 && !chans[id]) { const g = c.createGain(); g.gain.value = 0.0001; g.connect(out); chans[id] = { g, nodes: [] }; chans[id].nodes = BUILD[id](c, g, id) || []; }
  if (!chans[id]) return;
  if (v > 0) chans[id].g.gain.setTargetAtTime(v * v * 0.9, c.currentTime, 0.15);
  else { const ch = chans[id]; delete chans[id]; clearTimeout(ch.t); ch.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.15); setTimeout(() => { ch.nodes.forEach((n) => { try { n.stop(); } catch { /* já parou */ } }); ch.g.disconnect(); }, 900); }
}

/** Toca (ou ajusta) a mistura. Começa com fade de ~2 s. */
export function play(next) {
  const c = audio(); ensureOut(c); mix = clean(next);
  for (const id of Object.keys(BUILD)) setChan(c, id, mix[id] || 0);
  if (!playing) { out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), c.currentTime); out.gain.exponentialRampToValueAtTime(1, c.currentTime + 2); }
  playing = Object.keys(mix).length > 0; emit();
}
export function setLevel(id, v) { const next = { ...mix, [id]: v }; if (playing) play(next); else { mix = clean(next); emit(); } }
/** Para com fade (padrão 2 s; o timer de dormir usa 20 s). */
export function stop(fade = 2) {
  if (!out) { playing = false; emit(); return; }
  const c = audio(); clearTimeout(sleepTimer); sleepAt = 0;
  out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), c.currentTime); out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + fade);
  playing = false; emit();
  setTimeout(() => { if (!playing) for (const id of Object.keys(chans)) setChan(c, id, 0); }, fade * 1000 + 100);
}
export function setSleep(min) {
  clearTimeout(sleepTimer); sleepAt = min ? Date.now() + min * 60000 : 0;
  // confere pelo relógio (o iPhone pode atrasar timers em segundo plano)
  const check = () => { if (!sleepAt) return; if (sleepLeft(sleepAt) <= 20000) { sleepAt = 0; stop(20); return; } sleepTimer = setTimeout(check, 5000); };
  if (sleepAt) check(); emit();
}

/* ---------- dock: mini-player que fica fora da tela que troca ---------- */
// O iframe do YouTube é colocado UMA vez no dock e nunca mais movido (mover um iframe faz ele recarregar e parar).
let dock = null, ytBox = null, ytTitle = null, ytMin = null, ytOpen = null, pill = null;
function el(tag, attrs = {}, ...kids) { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } e.append(...kids.filter(Boolean)); return e; }
function ensureDock() {
  if (dock) return;
  ytTitle = el('span', {});
  ytMin = el('button', { type: 'button', class: 'amb-x', onclick: () => { if (yt) { yt.min = !yt.min; drawDock(); } } });
  ytOpen = el('a', { class: 'amb-x amb-open', target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Abrir no app do YouTube (com Premium, sem anúncios)', title: 'abrir no app do YouTube' }, '↗');
  ytBox = el('div', { class: 'amb-yt' }, el('div', { class: 'amb-yt-bar' }, ytTitle, ytOpen, ytMin, el('button', { type: 'button', class: 'amb-x', 'aria-label': 'Fechar vídeo', onclick: () => closeYT() }, '×')));
  pill = el('div', { class: 'amb-pill' });
  dock = el('div', { class: 'amb-dock', role: 'region', 'aria-label': 'Player de ambiente' }, ytBox, pill);
  document.body.append(dock);
}
function drawDock() {
  if (!dock && !yt && !playing) return;
  ensureDock();
  ytBox.hidden = !yt;
  if (yt) { ytOpen.href = /^https?:/.test(yt.url || '') ? yt.url : `https://${yt.url || 'www.youtube.com'}`; ytTitle.textContent = yt.title || 'YouTube'; ytBox.classList.toggle('min', !!yt.min); ytMin.textContent = yt.min ? '▢' : '–'; ytMin.setAttribute('aria-label', yt.min ? 'Mostrar vídeo' : 'Esconder vídeo'); }
  pill.hidden = !playing;
  if (playing) pill.replaceChildren(el('a', { href: '#/ambiente', 'aria-label': 'Abrir estúdio de ambiente' }, '♪ ambiente', sleepAt ? el('small', {}, ` · dorme em ${Math.ceil(sleepLeft(sleepAt) / 60000)} min`) : null),
    el('button', { type: 'button', class: 'amb-x', 'aria-label': 'Parar ambiente', onclick: () => stop() }, '■'));
  dock.hidden = !yt && !playing;
}
subscribe(drawDock);

export function playYT(url, title) {
  const src = ytEmbed(url); if (!src) return false;
  ensureDock();
  const old = ytBox.querySelector('iframe'); if (old) old.remove();
  const frame = el('iframe', { src, title: title || 'YouTube', allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', referrerpolicy: 'strict-origin-when-cross-origin' });
  ytBox.append(frame); yt = { url, title, min: false }; emit(); return true;
}
export function closeYT() { if (ytBox) { const f = ytBox.querySelector('iframe'); if (f) f.remove(); } yt = null; emit(); }
