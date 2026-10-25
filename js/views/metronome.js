// Metrônomo: BPM, tap, compasso, subdivisão, acento no 1, contagem, modo progressivo e compassos mudos.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import { banner } from '../ui.js';
import * as M from '../music.js';
import { audio, click, scheduler, canVibrate } from '../audio.js';

const KEY = 'setting-metronome';
const DEF = { bpm: 80, meter: '4/4', subdiv: 1, accent: true, prog: false, start: 60, target: 100, step: 4, every: 4, mute: false, playBars: 2, muteBars: 1 };
const cfg = () => ({ ...DEF, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (patch) => store.upsert('setting', KEY, { ...cfg(), ...patch });

export function mount(host) {
  let run = null; let taps = [];
  const c0 = cfg();
  const bpmOut = h('output', { class: 'met-bpm', 'aria-live': 'polite' }, String(c0.bpm));
  const slider = h('input', { type: 'range', min: M.BPM_MIN, max: M.BPM_MAX, value: c0.bpm, 'aria-label': 'BPM' });
  const dots = h('div', { class: 'met-dots', 'aria-hidden': 'true' });
  const barInfo = h('p', { class: 'met-bar muted', 'aria-live': 'polite' });
  const playBtn = h('button', { class: 'met-play', type: 'button', 'aria-label': 'Tocar' }, '▶');

  const setBpm = (v) => { const b = M.clampBpm(v); slider.value = b; bpmOut.textContent = b; save({ bpm: b }); if (run) restart(); };
  slider.addEventListener('input', () => { bpmOut.textContent = slider.value; });
  slider.addEventListener('change', () => setBpm(slider.value));

  function drawDots() {
    const c = cfg(); const n = M.METERS[c.meter].beats;
    dots.replaceChildren(...Array.from({ length: n }, (_, i) => h('span', { class: `met-dot${i === 0 && c.accent ? ' one' : ''}` })));
  }
  function flash(beat) { [...dots.children].forEach((d, i) => d.classList.toggle('on', i === beat)); }

  function start() {
    audio();
    const c = cfg(); const clicks = M.meterClicks(c.meter, c.subdiv, c.accent); const per = clicks.length;
    let barStart = 0, curBar = -1, curBpm = c.bpm;
    // posição absoluta em segundos de cada clique, acumulando compassos (o BPM pode mudar a cada compasso no modo progressivo)
    run = scheduler((i) => {
      const bar = Math.floor(i / per), k = i % per;
      if (bar !== curBar) {
        if (curBar >= 0) barStart += M.METERS[c.meter].beats * M.pulseSec(curBpm, c.meter);
        curBar = bar; curBpm = c.prog ? M.progressiveBpm(c, bar) : c.bpm;
      }
      const cl = clicks[k]; const at = barStart + cl.frac * M.pulseSec(curBpm, c.meter);
      const silent = c.mute && (bar % (c.playBars + c.muteBars)) >= c.playBars;
      const bpmNow = curBpm, barNow = bar;
      return { at, play: silent ? null : (t) => click(t, cl.level), ui: cl.sub ? null : () => {
        flash(cl.beat);
        if (cl.beat === 0) { bpmOut.textContent = bpmNow; barInfo.textContent = `compasso ${barNow + 1}${silent ? ' · mudo: continue contando' : ''}${c.prog ? ` · ${bpmNow} BPM` : ''}`; }
      } };
    });
    playBtn.textContent = '■'; playBtn.setAttribute('aria-label', 'Parar'); playBtn.classList.add('on');
  }
  function stop() { run && run.stop(); run = null; flash(-1); barInfo.textContent = ''; playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', 'Tocar'); playBtn.classList.remove('on'); bpmOut.textContent = cfg().bpm; }
  function restart() { stop(); start(); }
  playBtn.addEventListener('click', () => (run ? stop() : start()));

  const tap = h('button', { class: 'btn', type: 'button', onclick: () => { taps.push(performance.now()); taps = taps.slice(-6); const b = M.tapBpm(taps); if (b) setBpm(b); } }, 'tap');
  const step = (d) => h('button', { class: 'btn met-step', type: 'button', 'aria-label': `${d > 0 ? 'mais' : 'menos'} ${Math.abs(d)} BPM`, onclick: () => setBpm(cfg().bpm + d) }, d > 0 ? `+${d}` : `${d}`);
  const seg = (label, opts, key) => h('div', { class: 'field' }, h('span', {}, label), h('div', { class: 'seg' }, opts.map(([v, t]) => h('button', { type: 'button', class: cfg()[key] === v ? 'on' : '', 'aria-pressed': String(cfg()[key] === v), onclick: async (e) => { const btn = e.currentTarget; await save({ [key]: v }); btn.parentNode.querySelectorAll('button').forEach((b) => { const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); drawDots(); if (run) restart(); } }, t))));
  const num = (label, key, min, max) => h('label', { class: 'field' }, h('span', {}, label), h('input', { type: 'number', inputmode: 'numeric', min, max, value: cfg()[key], onchange: (e) => { save({ [key]: Math.max(min, Math.min(max, Number(e.target.value) || min)) }); if (run) restart(); } }));
  const sw = (label, key, extra) => { const box = h('div', { class: 'met-extra', hidden: !cfg()[key] }, extra);
    return h('div', {}, h('label', { class: 'row between met-sw' }, h('span', {}, label), h('input', { type: 'checkbox', class: 'switch', checked: cfg()[key], onchange: (e) => { save({ [key]: e.target.checked }); box.hidden = !e.target.checked; if (run) restart(); } })), box); };

  host.append(
    banner('Metrônomo', 'tempo agendado pelo relógio de áudio'),
    h('section', { class: 'card pad met-main' },
      h('div', { class: 'met-top' }, step(-5), step(-1), h('div', { class: 'met-read' }, bpmOut, h('small', {}, 'BPM')), step(1), step(5)),
      slider, dots, barInfo,
      h('div', { class: 'row met-row' }, tap, playBtn)),
    h('section', { class: 'card pad' },
      seg('compasso', Object.keys(M.METERS).map((m) => [m, m]), 'meter'),
      seg('subdivisão (cliques por tempo)', [[1, '1'], [2, '2'], [3, '3'], [4, '4']], 'subdiv'),
      h('label', { class: 'row between met-sw' }, h('span', {}, 'acento no tempo 1'), h('input', { type: 'checkbox', class: 'switch', checked: cfg().accent, onchange: (e) => { save({ accent: e.target.checked }); drawDots(); if (run) restart(); } }))),
    h('section', { class: 'card pad' },
      sw('modo progressivo', 'prog', h('div', { class: 'grid2' }, num('começa em', 'start', 30, 260), num('chega em', 'target', 30, 260), num('sobe (BPM)', 'step', 1, 40), num('a cada (compassos)', 'every', 1, 32))),
      sw('compassos mudos', 'mute', h('div', { class: 'grid2' }, num('toca', 'playBars', 1, 16), num('fica mudo', 'muteBars', 1, 16)))),
    h('p', { class: 'pad-x muted met-note' }, canVibrate() ? 'dica: com a tela bloqueada o navegador pode pausar o som.' : 'no iPhone o navegador não vibra e pode pausar o som com a tela bloqueada: deixe o app aberto enquanto estuda.'));
  drawDots();
  return () => stop();
}
