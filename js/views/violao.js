// Violão na tela: escolhe o acorde e passa o dedo nas cordas (pra baixo e pra cima). Corda de verdade (ver instruments.js).
import { h } from '../util.js';
import { audio, isMuted, setMuted } from '../audio.js';
import { banner } from '../ui.js';
import { kitTheme, themeRow } from '../kids/kit-theme.js';
import { CHORDS, CHORDS_ALL, GUITAR_OPEN, pluck, warmGuitar, warmNotes, backing } from '../instruments.js';
import { tocarTabs, backingBar } from './tocar-nav.js';
import { rolar } from './rolar-opcoes.js';

const nome = (m) => ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'][((m % 12) + 12) % 12];
const SOUNDS = [['acoustic', '🎸', 'violão'], ['clean', '⚡', 'guitarra limpa'], ['rock', '🤘', 'guitarra rock']]; // o padrão é o violão 🎸
const GROSS = [4, 3.6, 3, 2.3, 1.7, 1.2]; // espessura das 6 cordas (mi grave em cima)
const COR = { 0: '#b5162b', 2: '#1d3566', 4: '#4a79b4', 5: '#2a7f86', 7: '#e8a92c', 9: '#6e1423', 11: '#f5ead2' }; // as cores das notas (as mesmas do xilofone)
const ESCALAS = { maior: [0, 2, 4, 5, 7, 9, 11], penta: [0, 2, 4, 7, 9], todas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
const NOMES_CORDA = ['Mi', 'Lá', 'Ré', 'Sol', 'Si', 'Mi'];
const CASAS = 6; // corda solta + 5 casas
const lerLS = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const gravarLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

export function mount(host) {
  let chord = 0; let sound = 'acoustic'; let mute = false; const st = new Map();
  const achar = (n) => CHORDS_ALL.find(([x]) => x === n);
  let slots = (() => { try { const a = JSON.parse(lerLS('bt-violao-acordes', 'null')); if (Array.isArray(a) && a.length === 8 && a.every(achar)) return a.map(achar); } catch { /* usa o padrão */ } return CHORDS.slice(); })();
  let modo = lerLS('bt-violao-modo', 'acordes') === 'notas' ? 'notas' : 'acordes'; let escala = ESCALAS[lerLS('bt-violao-escala', 'maior')] ? lerLS('bt-violao-escala', 'maior') : 'maior';
  let editando = false; let selSlot = 0;
  const stage = h('div', { class: 'ti-stage ti-gt', 'data-kit-theme': kitTheme() });
  const chordsEl = h('div', { class: 'ti-chords', role: 'group', 'aria-label': 'Acordes' });
  const notes = h('div', { class: 'ti-gnotes' });
  const strs = h('div', { class: 'ti-gstr', 'aria-label': 'Cordas: passe o dedo' });
  const strEls = GROSS.map((w, i) => { const e = h('div', { class: `ti-str${i < 3 ? ' wound' : ''}` }, h('i', {})); e.firstChild.style.setProperty('--w', `${w}px`); strs.append(e); return e; });
  const soundRow = h('div', { class: 'row kd-modes', role: 'radiogroup', 'aria-label': 'Som' });
  const muteBtn = h('button', { class: 'kd-chip ti-sym', type: 'button', 'aria-pressed': 'false', 'aria-label': 'abafar (segure)', title: 'abafar (segure)' }, '🔉'); // só o símbolo, pequeno
  const themeBox = h('div');

  const drawChords = () => {
    chordsEl.replaceChildren(...slots.map(([n], i) => h('button', { class: `ti-chord${editando ? ' ed' : ''}`, type: 'button', 'aria-pressed': String(editando ? i === selSlot : i === chord), onclick: () => { audio(); if (editando) { selSlot = i; } else { chord = i; } drawChords(); } }, n)));
    notes.replaceChildren(...slots[chord][1].map((m, i) => { strEls[i].classList.toggle('off', m == null); return h('div', { class: 'ti-gnote' }, m == null ? '×' : nome(m)); }));
  };
  const drawSound = () => soundRow.replaceChildren(...SOUNDS.map(([v, l, nm]) => h('button', { type: 'button', class: `kd-chip${sound === v ? ' on' : ''}`, role: 'radio', 'aria-label': nm, title: nm, 'aria-checked': String(sound === v), onclick: () => { sound = v; audio(); warmGuitar(); drawSound(); } }, `${l} ${nm}`)));
  const drawTheme = () => { stage.dataset.kitTheme = kitTheme(); themeBox.replaceChildren(themeRow(drawTheme)); };

  const ripple = (x, y, big) => {
    const r = stage.getBoundingClientRect(); const d = h('i', { class: 'ti-rip' }); d.style.left = `${x - r.left}px`; d.style.top = `${y - r.top}px`; d.style.borderColor = '#f5ead2'; stage.append(d);
    const a = d.animate([{ transform: 'scale(.6)', opacity: 0.8 }, { transform: `scale(${big ? 3.4 : 1.8})`, opacity: 0 }], { duration: 440, easing: 'ease-out' }); a.onfinish = () => d.remove();
  };
  const pluckString = (i, vel, delay = 0) => {
    const m = slots[chord][1][i]; const el = strEls[i].firstChild;
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

  /* ---------- modo notas (melodia): o braço do violão com corda solta + 5 casas; cada quadradinho toca UMA nota ---------- */
  const modoBar = h('div', { class: 'row kd-modes ti-modo', role: 'radiogroup', 'aria-label': 'Modo do violão' });
  const escalaRow = h('div', { class: 'row kd-modes', role: 'radiogroup', 'aria-label': 'Notas que aparecem' });
  const frets = h('div', { class: 'ti-fret', role: 'group', 'aria-label': 'Braço do violão: toque nas notas pra tocar a melodia', hidden: true });
  const bandeja = h('div', { class: 'ti-bandeja', role: 'group', 'aria-label': 'Escolha o acorde novo', hidden: true });
  const edBar = h('div', { class: 'ti-edbar', hidden: true });
  const pcOk = (m) => ESCALAS[escala].includes(((m % 12) + 12) % 12);
  const drawFrets = () => {
    const cab = [h('i', {}), ...['solta', '1', '2', '3', '4', '5'].map((t) => h('i', { class: 'ti-fh' }, t))];
    const linhas = GUITAR_OPEN.flatMap((base, r) => [h('i', { class: 'ti-fl' }, NOMES_CORDA[r]), ...Array.from({ length: CASAS }, (_, c) => {
      const m = base + c; const pc = ((m % 12) + 12) % 12; const on = pcOk(m);
      const e = h('div', { class: `ti-fc${on ? '' : ' fora'}`, 'data-m': String(m), role: 'button', 'aria-label': `${nome(m)}, corda ${NOMES_CORDA[r]}, ${c === 0 ? 'solta' : `casa ${c}`}` }, nome(m));
      e.style.setProperty('--nc', COR[pc] || '#8a7f6b'); if (pc === 11) e.classList.add('light'); return e;
    })]);
    frets.replaceChildren(...cab, ...linhas);
  };
  const toca = (m, vel) => { const c = audio(); pluck(m, vel, c.currentTime + 0.005, sound, mute); };
  const brilha = (el) => { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 200); };
  const celula = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); const el = t && t.closest && t.closest('.ti-fc'); return el && frets.contains(el) ? el : null; };
  const vivo = new Map();
  frets.addEventListener('pointerdown', (e) => { audio(); e.preventDefault(); try { frets.setPointerCapture(e.pointerId); } catch { /* sem captura */ } const el = celula(e); vivo.set(e.pointerId, el); if (el) { toca(+el.dataset.m, 0.85); brilha(el); ripple(e.clientX, e.clientY, false); } });
  frets.addEventListener('pointermove', (e) => { if (!vivo.has(e.pointerId)) return; const el = celula(e); if (el !== vivo.get(e.pointerId)) { vivo.set(e.pointerId, el); if (el) { toca(+el.dataset.m, 0.7); brilha(el); } } });
  for (const ev of ['pointerup', 'pointercancel']) frets.addEventListener(ev, (e) => vivo.delete(e.pointerId));
  const drawEscala = () => escalaRow.replaceChildren(h('small', {}, 'notas'), ...[['maior', 'dó maior'], ['penta', 'pentatônica'], ['todas', 'todas']].map(([v, l]) => h('button', { type: 'button', class: `kd-chip${escala === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(escala === v), onclick: () => { escala = v; gravarLS('bt-violao-escala', v); drawEscala(); drawFrets(); } }, l)));

  /* ---------- trocar os acordes de cima ---------- */
  const strum = (ch) => { const c = audio(); ch[1].forEach((m, i) => { if (m != null) pluck(m, 0.8, c.currentTime + 0.005 + i * 0.012, sound, false); }); };
  const salvaSlots = () => gravarLS('bt-violao-acordes', JSON.stringify(slots.map(([n]) => n)));
  const drawBandeja = () => {
    bandeja.replaceChildren(...CHORDS_ALL.map((ch) => h('button', { class: `ti-chord peq${slots[selSlot][0] === ch[0] ? ' atual' : ''}`, type: 'button', onclick: () => { slots[selSlot] = ch; salvaSlots(); warmNotes(ch[1]); strum(ch); selSlot = (selSlot + 1) % 8; drawChords(); drawBandeja(); } }, ch[0])));
    edBar.replaceChildren(h('small', {}, `trocando o ${selSlot + 1}º acorde: escolha o novo (ou toque num acorde de cima pra escolher outro lugar)`),
      h('div', { class: 'ti-edb' }, h('button', { type: 'button', class: 'kd-chip on', onclick: () => { editando = false; drawModo(); } }, 'pronto'),
        h('button', { type: 'button', class: 'kd-chip', onclick: () => { slots = CHORDS.slice(); salvaSlots(); drawChords(); drawBandeja(); } }, 'voltar aos acordes de sempre')));
  };
  const drawModo = () => {
    const notas = modo === 'notas';
    modoBar.replaceChildren(
      h('button', { type: 'button', class: `kd-chip${!notas ? ' on' : ''}`, role: 'radio', 'aria-checked': String(!notas), onclick: () => { modo = 'acordes'; gravarLS('bt-violao-modo', modo); drawModo(); } }, '🎸 acordes'),
      h('button', { type: 'button', class: `kd-chip${notas ? ' on' : ''}`, role: 'radio', 'aria-checked': String(notas), onclick: () => { modo = 'notas'; editando = false; gravarLS('bt-violao-modo', modo); warmNotes(GUITAR_OPEN.flatMap((b) => Array.from({ length: CASAS }, (_, c) => b + c))); drawModo(); } }, '🎵 notas (melodia)'),
      notas ? null : h('button', { type: 'button', class: `kd-chip${editando ? ' on' : ''}`, 'aria-pressed': String(editando), onclick: () => { editando = !editando; selSlot = chord; drawModo(); } }, '✎ trocar acordes'));
    chordsEl.hidden = notas; neck.hidden = notas || editando; frets.hidden = !notas; bandeja.hidden = notas || !editando; edBar.hidden = notas || !editando; escalaRow.parentElement && (escalaRow.parentElement.hidden = !notas);
    drawChords(); if (editando) drawBandeja(); if (notas) { drawEscala(); drawFrets(); }
  };
  const setMute = (v) => { mute = v; muteBtn.setAttribute('aria-pressed', String(v)); muteBtn.classList.toggle('on', v); };
  muteBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); setMute(true); try { muteBtn.setPointerCapture(e.pointerId); } catch { /* sem captura */ } });
  for (const ev of ['pointerup', 'pointercancel']) muteBtn.addEventListener(ev, () => setMute(false));
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (modo === 'acordes' && !editando && /^[1-8]$/.test(k)) { chord = +k - 1; drawChords(); } else if (modo === 'acordes' && (k === ' ' || k === 'b')) { e.preventDefault(); audio(); for (let i = 0; i < 6; i++) pluckString(k === ' ' ? i : 5 - i, 0.8, i * 0.01); }
  };
  document.addEventListener('keydown', onKey);

  // aviso quando o som do app está desligado (o alto-falante do topo): sem isso parece que o violão não toca
  const offMsg = h('section', { class: 'card pad', role: 'status', hidden: true }, h('p', {}, 'o som do app está desligado, por isso o violão não toca. no iPhone, confira também o botão lateral de silencioso.'), h('button', { class: 'btn primary', type: 'button', onclick: () => setMuted(false) }, 'ligar o som'));
  const syncOff = () => { offMsg.hidden = !isMuted(); }; window.addEventListener('bt-mute', syncOff); syncOff();
  const neck = h('div', { class: 'ti-neck' }, notes, strs);
  stage.append(chordsEl, edBar, bandeja, neck, frets);
  host.append(banner('Cordas', 'violão e guitarra: acordes ou melodia'), tocarTabs('violao'), offMsg, modoBar, stage,
    h('section', { class: 'card pad ti-panel' }, rolar(escalaRow), rolar(soundRow), h('div', { class: 'row tk-line' }, muteBtn, h('img', { class: 'ti-paul', src: 'assets/paul/p-guitar.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' })), rolar(themeBox)),
    backingBar(),
    h('p', { class: 'pad-x lib-note' }, 'escolha o acorde e passe o dedo nas cordas, pra baixo e pra cima: quanto mais rápido, mais forte. toque numa corda só pra tirar uma nota. 🔉 (segurando) deixa o som seco, o palm mute. no computador: 1 a 8 trocam o acorde, espaço toca pra baixo e B pra cima. o som é gerado no aparelho; no iPhone pode ter um pequeno atraso e some se o botão lateral estiver no silencioso.'));
  drawChords(); drawSound(); drawTheme(); drawModo();
  return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('bt-mute', syncOff); backing.leave(); };
}
