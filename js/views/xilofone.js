// Xilofone na tela: barras coloridas (cada nota tem a sua cor em qualquer oitava), dá pra deslizar o dedo. Escala pentatônica = nenhuma nota soa errada.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { banner } from '../ui.js';
import { kitTheme, themeRow } from '../kids/kit-theme.js';
import { mallet, backing, MALLETS, percHit } from '../instruments.js';
import { PADS_FOTO, PAD_ANIM, PERC_ANIM } from './tocar-art.js';
import { tocarTabs, backingBar } from './tocar-nav.js';

const nome = (m) => ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'][((m % 12) + 12) % 12];
const SCALES = { penta: [60, 62, 64, 67, 69, 72, 74, 76, 79, 81], maior: [60, 62, 64, 65, 67, 69, 71, 72] };
const COR = { 0: '#b5162b', 2: '#1d3566', 4: '#4a79b4', 5: '#2a7f86', 7: '#e8a92c', 9: '#6e1423', 11: '#f5ead2' }; // vinho, azul-marinho, azul, petróleo, mostarda, bordô, creme (as cores da bateria)
const SOUNDS = MALLETS;
const XK = 'asdfghjklç';

export function mount(host) {
  let scale = 'penta'; let sound = 'xilofone'; let mode = 'barras'; const live = new Map();
  const modeRow = h('div', { class: 'row kd-modes', role: 'radiogroup', 'aria-label': 'Tipo de percussão' });
  const pads = h('div', { class: 'ti-perc', role: 'group', 'aria-label': 'Percussão sem nota', hidden: true },
    ...PADS_FOTO.map(([id, nome, arq]) => h('button', { type: 'button', class: 'ti-pp ti-pp-foto', 'data-p': id, 'aria-label': nome }, h('img', { src: `assets/memoria/${arq}.webp`, alt: '', draggable: 'false', decoding: 'async' }))));
  const NOTAS = ['♪', '♫', '♩', '✦'];
  pads.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.ti-pp'); if (!b) return; e.preventDefault(); audio();
    const def = PADS_FOTO.find((x) => x[0] === b.dataset.p); const r = b.getBoundingClientRect();
    const som = def[3] ? def[3][e.clientX < r.left + r.width / 2 ? 0 : 1] : def[0]; // congas e bongôs: esquerda e direita são dois tambores
    percHit(som, 0.9);
    const img = b.querySelector('img'); const an = PERC_ANIM[PAD_ANIM[def[0]]]; if (img && an && !matchMedia('(prefers-reduced-motion: reduce)').matches) img.animate(an[0], { duration: an[1], easing: 'ease-out' });
    b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
    for (let k = 0; k < 3; k++) { const n = h('i', { class: 'ti-note' }, NOTAS[(Math.random() * NOTAS.length) | 0]); n.style.left = `${r.left + r.width * (0.25 + Math.random() * 0.5)}px`; n.style.top = `${r.top + r.height * 0.3}px`; document.body.append(n); const a = n.animate([{ transform: 'translateY(0) scale(.7)', opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 40}px,-60px) scale(1.2)`, opacity: 0 }], { duration: 700 + k * 120, easing: 'ease-out' }); a.onfinish = () => n.remove(); }
  });
  const stage = h('div', { class: 'ti-stage ti-xy-stage', 'data-kit-theme': kitTheme() });
  const xy = h('div', { class: 'ti-xy', role: 'group', 'aria-label': 'Barras do xilofone' });
  const scaleRow = h('div', { class: 'row kd-modes', role: 'radiogroup', 'aria-label': 'Escala' });
  const soundRow = h('div', { class: 'row kd-modes', role: 'radiogroup', 'aria-label': 'Som' });
  const themeBox = h('div');

  const drawXy = () => {
    const ms = SCALES[scale]; const n = ms.length;
    xy.replaceChildren(...ms.map((m, i) => {
      const pc = ((m % 12) + 12) % 12; const e = h('button', { type: 'button', class: `ti-bar${pc === 11 ? ' light' : ''}`, 'data-m': m, 'aria-label': `${nome(m)}${Math.floor(m / 12) - 1}` }, h('span', {}, nome(m)));
      e.style.setProperty('--bc', COR[pc] || '#2a7f86'); e.style.height = `${96 - (i / (n - 1)) * 46}%`; return e;
    }));
  };
  const drawMode = () => { modeRow.replaceChildren(h('small', {}, 'tipo'), ...[['barras', 'barras afinadas'], ['pads', 'pads (sem nota)']].map(([v, l]) => h('button', { type: 'button', class: `kd-chip${mode === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(mode === v), onclick: () => { mode = v; xy.hidden = mode !== 'barras'; pads.hidden = mode !== 'pads'; scaleRow.hidden = soundRow.hidden = mode !== 'barras'; drawMode(); } }, l))); };
  const drawRows = () => {
    scaleRow.replaceChildren(h('small', {}, 'escala'), ...[['penta', 'pentatônica'], ['maior', 'dó maior']].map(([v, l]) => h('button', { type: 'button', class: `kd-chip${scale === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(scale === v), onclick: () => { scale = v; drawXy(); drawRows(); } }, l)));
    soundRow.replaceChildren(h('small', {}, 'som'), ...SOUNDS.map(([v, l]) => h('button', { type: 'button', class: `kd-chip${sound === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(sound === v), onclick: () => { sound = v; audio(); drawRows(); } }, l)));
  };
  const drawTheme = () => { stage.dataset.kitTheme = kitTheme(); themeBox.replaceChildren(themeRow(drawTheme)); };
  const ripple = (x, y) => {
    const r = stage.getBoundingClientRect(); const d = h('i', { class: 'ti-rip' }); d.style.left = `${x - r.left}px`; d.style.top = `${y - r.top}px`; stage.append(d);
    const a = d.animate([{ transform: 'scale(.6)', opacity: 0.8 }, { transform: 'scale(3.6)', opacity: 0 }], { duration: 460, easing: 'ease-out' }); a.onfinish = () => d.remove();
  };
  const squish = (el) => el.animate([{ transform: 'scale(.94)', filter: 'brightness(1.25)' }, { transform: 'scale(1)', filter: 'none' }], { duration: 170, easing: 'ease-out' });
  const at = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); const el = t && t.closest && t.closest('.ti-bar'); return el && xy.contains(el) ? el : null; };
  const strike = (el, e, glide) => {
    const r = el.getBoundingClientRect(); const cen = 1 - Math.min(1, Math.abs(e.clientY - (r.top + r.height / 2)) / (r.height / 2));
    mallet(+el.dataset.m, (glide ? 0.7 : 0.8) + cen * 0.25, sound); squish(el); ripple(e.clientX, e.clientY);
  };
  xy.addEventListener('pointerdown', (e) => { audio(); e.preventDefault(); try { xy.setPointerCapture(e.pointerId); } catch { /* sem captura */ } const el = at(e); live.set(e.pointerId, el); if (el) strike(el, e, false); });
  xy.addEventListener('pointermove', (e) => { if (!live.has(e.pointerId)) return; const el = at(e); if (el !== live.get(e.pointerId)) { live.set(e.pointerId, el); if (el) strike(el, e, true); } });
  for (const ev of ['pointerup', 'pointercancel']) xy.addEventListener(ev, (e) => live.delete(e.pointerId));
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const i = XK.indexOf(e.key.toLowerCase()); const ms = SCALES[scale]; if (i < 0 || !ms[i]) return;
    audio(); mallet(ms[i], 0.9, sound); const el = xy.querySelector(`[data-m="${ms[i]}"]`); if (el) squish(el);
  };
  document.addEventListener('keydown', onKey);

  stage.append(xy, pads);
  host.append(banner('Percussão', 'xilofone, vibrafone, congas, pandeiro e mais'), tocarTabs('xilofone'), stage,
    h('section', { class: 'card pad ti-panel' }, modeRow, scaleRow, soundRow, themeBox),
    backingBar(),
    h('p', { class: 'pad-x lib-note' }, 'na pentatônica nenhuma nota soa errada: pode deslizar o dedo e inventar melodia. cada nota tem a sua cor em qualquer oitava (dó é vinho, ré azul-marinho, mi azul, sol mostarda…), então dá pra reconhecer a nota pela cor. no computador: A S D F G H J K L Ç tocam as barras. o som é gerado no aparelho; no iPhone pode ter um pequeno atraso.'));
  drawXy(); drawRows(); drawTheme(); drawMode();
  return () => { document.removeEventListener('keydown', onKey); backing.leave(); };
}
