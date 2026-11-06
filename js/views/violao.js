// Violão na tela: escolhe o acorde e passa o dedo nas cordas (pra baixo e pra cima). Corda de verdade (ver instruments.js).
import { h } from '../util.js';
import { audio, isMuted, setMuted } from '../audio.js';
import { banner } from '../ui.js';
import { kitTheme, themeRow } from '../kids/kit-theme.js';
import { CHORDS, pluck, warmGuitar, backing } from '../instruments.js';
import { tocarTabs, backingBar } from './tocar-nav.js';

const nome = (m) => ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'][((m % 12) + 12) % 12];
const SOUNDS = [['acoustic', 'violão'], ['clean', 'guitarra'], ['rock', 'rock']];
const GROSS = [4, 3.6, 3, 2.3, 1.7, 1.2]; // espessura das 6 cordas (mi grave em cima)

export function mount(host) {
  let chord = 0; let sound = 'acoustic'; let mute = false; const st = new Map();
  const stage = h('div', { class: 'ti-stage ti-gt', 'data-kit-theme': kitTheme() });
  const chordsEl = h('div', { class: 'ti-chords', role: 'group', 'aria-label': 'Acordes' });
  const notes = h('div', { class: 'ti-gnotes' });
  const strs = h('div', { class: 'ti-gstr', 'aria-label': 'Cordas: passe o dedo' });
  const strEls = GROSS.map((w, i) => { const e = h('div', { class: `ti-str${i < 3 ? ' wound' : ''}` }, h('i', {})); e.firstChild.style.setProperty('--w', `${w}px`); strs.append(e); return e; });
  const soundRow = h('div', { class: 'row kd-modes', role: 'radiogroup', 'aria-label': 'Som' });
  const muteBtn = h('button', { class: 'kd-chip', type: 'button', 'aria-pressed': 'false' }, 'abafar (segure)');
  const themeBox = h('div');

  const drawChords = () => {
    chordsEl.replaceChildren(...CHORDS.map(([n], i) => h('button', { class: 'ti-chord', type: 'button', 'aria-pressed': String(i === chord), onclick: () => { audio(); chord = i; drawChords(); } }, n)));
    notes.replaceChildren(...CHORDS[chord][1].map((m, i) => { strEls[i].classList.toggle('off', m == null); return h('div', { class: 'ti-gnote' }, m == null ? '×' : nome(m)); }));
  };
  const drawSound = () => soundRow.replaceChildren(h('small', {}, 'som'), ...SOUNDS.map(([v, l]) => h('button', { type: 'button', class: `kd-chip${sound === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(sound === v), onclick: () => { sound = v; audio(); warmGuitar(); drawSound(); } }, l)));
  const drawTheme = () => { stage.dataset.kitTheme = kitTheme(); themeBox.replaceChildren(themeRow(drawTheme)); };

  const ripple = (x, y, big) => {
    const r = stage.getBoundingClientRect(); const d = h('i', { class: 'ti-rip' }); d.style.left = `${x - r.left}px`; d.style.top = `${y - r.top}px`; d.style.borderColor = '#f5ead2'; stage.append(d);
    const a = d.animate([{ transform: 'scale(.6)', opacity: 0.8 }, { transform: `scale(${big ? 3.4 : 1.8})`, opacity: 0 }], { duration: 440, easing: 'ease-out' }); a.onfinish = () => d.remove();
  };
  const pluckString = (i, vel, delay = 0) => {
    const m = CHORDS[chord][1][i]; const el = strEls[i].firstChild;
    if (m == null) { el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(0)' }], { duration: 80 }); return; }
    const c = audio(); pluck(m, vel, c.currentTime + delay + 0.005, sound, mute);
    const amp = 2 + vel * 7; setTimeout(() => el.animate([{ transform: `translateY(${amp}px)` }, { transform: `translateY(${-amp * 0.7}px)` }, { transform: `translateY(${amp * 0.4}px)` }, { transform: `translateY(${-amp * 0.2}px)` }, { transform: 'translateY(0)' }], { duration: mute ? 120 : 520, easing: 'ease-out' }), delay * 1000);
  };
  const ys = () => strEls.map((e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
  strs.addEventListener('pointerdown', (e) => {
    audio(); e.preventDefault(); try { strs.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
    st.set(e.pointerId, { y: e.clientY, t: e.timeStamp }); const yy = ys(); let bi = 0; let bd = 1e9; yy.forEach((y, i) => { const d = Math.abs(y - e.clientY); if (d < bd) { bd = d; bi = i; } });
    if (bd <= 23) { pluckString(bi, 0.85); ripple(e.clientX, yy[bi]); }
  });
  strs.addEventListener('pointermove', (e) => {
    const p = st.get(e.pointerId); if (!p) return; const y = e.clientY; const dy = y - p.y; if (!dy) return;
    const speed = Math.abs(dy) / Math.max(1, e.timeStamp - p.t); const vel = Math.max(0.45, Math.min(1, 0.45 + speed * 0.5)); const yy = ys(); const hit = [];
    yy.forEach((sy, i) => { if ((p.y < sy && y >= sy) || (p.y > sy && y <= sy)) hit.push(i); }); if (dy < 0) hit.reverse();
    hit.forEach((i, k) => pluckString(i, vel, k * 0.009)); if (hit.length) ripple(e.clientX, y);
    p.y = y; p.t = e.timeStamp;
  });
  for (const ev of ['pointerup', 'pointercancel']) strs.addEventListener(ev, (e) => st.delete(e.pointerId));
  const setMute = (v) => { mute = v; muteBtn.setAttribute('aria-pressed', String(v)); muteBtn.classList.toggle('on', v); };
  muteBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); setMute(true); try { muteBtn.setPointerCapture(e.pointerId); } catch { /* sem captura */ } });
  for (const ev of ['pointerup', 'pointercancel']) muteBtn.addEventListener(ev, () => setMute(false));
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (/^[1-8]$/.test(k)) { chord = +k - 1; drawChords(); } else if (k === ' ' || k === 'b') { e.preventDefault(); audio(); for (let i = 0; i < 6; i++) pluckString(k === ' ' ? i : 5 - i, 0.8, i * 0.01); }
  };
  document.addEventListener('keydown', onKey);

  // aviso quando o som do app está desligado (o alto-falante do topo): sem isso parece que o violão não toca
  const offMsg = h('section', { class: 'card pad', role: 'status', hidden: true }, h('p', {}, 'o som do app está desligado, por isso o violão não toca. no iPhone, confira também o botão lateral de silencioso.'), h('button', { class: 'btn primary', type: 'button', onclick: () => setMuted(false) }, 'ligar o som'));
  const syncOff = () => { offMsg.hidden = !isMuted(); }; window.addEventListener('bt-mute', syncOff); syncOff();
  stage.append(chordsEl, h('div', { class: 'ti-neck' }, notes, strs));
  host.append(banner('Violão', 'passe o dedo nas cordas'), tocarTabs('violao'), offMsg, stage,
    h('section', { class: 'card pad ti-panel' }, soundRow, h('div', { class: 'row tk-line' }, muteBtn, h('img', { class: 'ti-paul', src: 'assets/paul/p-guitar.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' })), themeBox),
    backingBar(),
    h('p', { class: 'pad-x lib-note' }, 'escolha o acorde e passe o dedo nas cordas, pra baixo e pra cima: quanto mais rápido, mais forte. toque numa corda só pra tirar uma nota. “abafar” (segurando) deixa o som seco, o palm mute. no computador: 1 a 8 trocam o acorde, espaço toca pra baixo e B pra cima. o som é gerado no aparelho; no iPhone pode ter um pequeno atraso e some se o botão lateral estiver no silencioso.'));
  drawChords(); drawSound(); drawTheme();
  return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('bt-mute', syncOff); backing.leave(); };
}
