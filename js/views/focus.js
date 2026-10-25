// Cronômetro de foco: presets 15/25/40/60 ou livre; conta por carimbo de tempo (sobrevive a tela bloqueada e troca de app).
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, toast, stars } from '../ui.js';
import * as S from '../students-logic.js';
import { audio, click } from '../audio.js';

const KEY = 'setting-focus';
const get = () => (store.get(KEY) ? store.get(KEY).data : { duration: 25 * 60000, accumulated: 0, startedAt: null, label: '' });
const put = (t) => store.upsert('setting', KEY, t);

export function mount(host) {
  const face = h('output', { class: 'met-bpm focus-face', 'aria-live': 'off' });
  const ring = h('div', { class: 'focus-bar' }, h('i'));
  const label = h('input', { type: 'text', placeholder: 'o que você vai estudar? (opcional)', maxlength: 80, value: get().label || '', 'aria-label': 'O que vai estudar' });
  label.addEventListener('change', () => put({ ...get(), label: label.value }));
  const main = h('button', { class: 'met-play', type: 'button' });
  const reset = h('button', { class: 'btn small ghost', type: 'button', onclick: () => put({ ...get(), accumulated: 0, startedAt: null, finished: false }) }, 'zerar');
  let raf = 0, rang = false;

  const presets = h('div', { class: 'seg' }, [15, 25, 40, 60].map((m) => h('button', { type: 'button', onclick: () => { put({ duration: m * 60000, accumulated: 0, startedAt: null, label: label.value, finished: false }); } }, `${m}`)));
  const custom = h('input', { type: 'number', inputmode: 'numeric', min: 1, max: 240, placeholder: 'min', 'aria-label': 'minutos personalizados', onchange: (e) => { const m = Math.max(1, Math.min(240, Number(e.target.value) || 0)); if (m) put({ duration: m * 60000, accumulated: 0, startedAt: null, label: label.value, finished: false }); } });

  async function finish(t) {
    if (t.finished) return;
    await put({ ...S.timerPause(t, Date.now()), finished: true });
    await store.upsert('practice', null, { kind: 'foco', minutes: Math.round(t.duration / 60000), label: label.value, at: Date.now() });
    if (!rang) { rang = true; try { audio(); const c = audio(); [0, 0.25, 0.5].forEach((d) => click(c.currentTime + 0.05 + d, 2)); } catch { /* sem áudio */ } }
    stars(main); toast('tempo de foco concluído ✓');
  }
  function frame() {
    const t = get(); const s = S.timerState(t, Date.now());
    face.textContent = S.fmtClock(s.remaining);
    ring.firstChild.style.width = `${(s.elapsed / t.duration) * 100}%`;
    main.textContent = s.running ? '❚❚' : '▶'; main.setAttribute('aria-label', s.running ? 'Pausar' : s.elapsed ? 'Continuar' : 'Começar'); main.classList.toggle('on', s.running);
    [...presets.children].forEach((b) => b.classList.toggle('on', Number(b.textContent) * 60000 === t.duration));
    if (s.done && s.running) finish(t);
    raf = requestAnimationFrame(frame);
  }
  main.addEventListener('click', () => { const t = get(); const s = S.timerState(t, Date.now()); if (s.done) { rang = false; put({ ...t, accumulated: 0, startedAt: Date.now(), finished: false }); return; } audio(); put(s.running ? S.timerPause(t, Date.now()) : S.timerStart(t, Date.now())); });

  const logs = store.list('practice').filter((r) => r.data.kind === 'foco').sort((a, b) => b.data.at - a.data.at).slice(0, 5);
  host.append(...[
    banner('Cronômetro de Foco', 'um bloco de cada vez'),
    h('section', { class: 'card pad met-main' }, h('div', { class: 'met-read' }, face, h('small', {}, 'restando')), ring, h('div', { class: 'row met-row' }, reset, main)),
    h('section', { class: 'card pad' }, h('div', { class: 'field' }, h('span', {}, 'minutos'), presets), h('label', { class: 'field' }, h('span', {}, 'outro tempo'), custom), h('label', { class: 'field' }, h('span', {}, 'foco'), label)),
    logs.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'últimos blocos'), h('ul', { class: 'lab-list' }, logs.map((r) => h('li', {}, `${r.data.minutes} min${r.data.label ? ` · ${r.data.label}` : ''}`)))) : null,
    h('p', { class: 'pad-x lib-note' }, 'o tempo conta mesmo com a tela bloqueada. o som do fim só toca se o app estiver aberto.')].filter(Boolean));
  frame();
  return () => cancelAnimationFrame(raf);
}
