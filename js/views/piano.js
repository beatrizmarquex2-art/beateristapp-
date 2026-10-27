// Piano de referência: um teclado na tela pra tirar melodia de ouvido e conferir nota. Sons sintetizados aqui (sem amostras),
// vários dedos ao mesmo tempo, teclado do computador, nome das notas e um gravador de frase curta.
import { h } from '../util.js';
import * as store from '../store.js';
import { audio, out } from '../audio.js';
import { banner, toast } from '../ui.js';
import { layout, isBlack, nameOf, hzOf, keyToMidi, clampOct } from '../piano-logic.js';

const KEY = 'setting-piano';
const SOUNDS = [['piano', 'piano'], ['epiano', 'elétrico'], ['organ', 'órgão'], ['pad', 'cordas']];
const conf = () => ({ sound: 'piano', labels: 'pt', octaves: innerWidth < 520 ? 1 : 2, oct: innerWidth < 520 ? 4 : 3, pedal: false, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const setConf = (p) => store.upsert('setting', KEY, p);

/** Toca uma nota. Devolve { off(sustain) }. */
function voice(midi, kind, t = audio().currentTime, vel = 0.85) {
  const c = audio(); const f = hzOf(midi); const g = c.createGain(); const nodes = []; const hi = Math.max(0, (midi - 60) / 36);
  const add = (type, freq, gain, detune = 0) => { const o = c.createOscillator(); const og = c.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = detune; og.gain.value = gain; o.connect(og).connect(g); o.start(t); nodes.push(o); return o; };
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; g.connect(lp).connect(out());
  g.gain.setValueAtTime(0.0001, t);
  if (kind === 'piano') {
    [[1, 1], [2, 0.5], [3, 0.28], [4, 0.14], [5, 0.07]].forEach(([k, a], i) => add('sine', f * k, a * 0.34, i ? (i % 2 ? 2 : -2) : 0));
    lp.frequency.setValueAtTime(Math.min(9000, f * 14), t); lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 3), t + 1.2);
    g.gain.exponentialRampToValueAtTime(vel * 0.55, t + 0.004); g.gain.setTargetAtTime(vel * 0.14, t + 0.01, 0.9 - hi * 0.6); // queda natural: nota aguda some mais rápido
  } else if (kind === 'epiano') {
    const mod = c.createOscillator(); const mg = c.createGain(); mod.frequency.value = f * 2; mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.5);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; mod.connect(mg).connect(o.frequency); o.connect(g); o.start(t); mod.start(t); nodes.push(o, mod);
    lp.frequency.value = 5000; g.gain.exponentialRampToValueAtTime(vel * 0.5, t + 0.004); g.gain.setTargetAtTime(vel * 0.2, t + 0.01, 1.1);
  } else if (kind === 'organ') {
    [[1, 1], [2, 0.6], [3, 0.4], [4, 0.25]].forEach(([k, a]) => add('sine', f * k, a * 0.22)); lp.frequency.value = 6000;
    g.gain.exponentialRampToValueAtTime(vel * 0.5, t + 0.012);
  } else {
    add('sawtooth', f, 0.12, -7); add('sawtooth', f, 0.12, 7); lp.frequency.value = Math.min(4500, f * 5);
    g.gain.exponentialRampToValueAtTime(vel * 0.5, t + 0.18);
  }
  return {
    off(sustain) {
      const now = c.currentTime; const rel = kind === 'organ' ? 0.06 : sustain ? 1.6 : kind === 'pad' ? 0.35 : 0.28;
      g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now); g.gain.setTargetAtTime(0.0001, now, rel / 3);
      nodes.forEach((o) => { try { o.stop(now + rel + 0.3); } catch { /* já parou */ } });
    },
  };
}

export function mount(host) {
  const live = new Map(); // id (ponteiro/tecla) -> { midi, v, t0 }
  let take = []; let recording = false; let rt0 = 0; let timers = [];
  const kb = h('div', { class: 'pn-kb', role: 'group', 'aria-label': 'Teclado do piano' });
  const shown = h('output', { class: 'pn-now', 'aria-live': 'polite' }, '— toque uma tecla —');
  const panel = h('div');
  const takeBox = h('p', { class: 'pn-take muted' });
  const keyEl = (m) => kb.querySelector(`[data-m="${m}"]`);

  const down = (id, midi) => {
    if (live.has(id)) return; const c = conf();
    const v = voice(midi, c.sound); live.set(id, { midi, v, t0: performance.now() });
    const el = keyEl(midi); if (el) el.classList.add('on');
    shown.textContent = `${nameOf(midi, 'pt')} · ${nameOf(midi, 'cifra')} · ${Math.round(hzOf(midi))} Hz`;
    if (recording && take.length < 200) take.push({ midi, at: (performance.now() - rt0) / 1000, len: 0.4 });
  };
  const up = (id) => {
    const n = live.get(id); if (!n) return; live.delete(id);
    n.v.off(conf().pedal); const el = keyEl(n.midi); if (el && ![...live.values()].some((x) => x.midi === n.midi)) el.classList.remove('on');
    if (recording) { const last = [...take].reverse().find((x) => x.midi === n.midi); if (last) last.len = Math.max(0.12, (performance.now() - rt0) / 1000 - last.at); }
  };

  const drawKb = () => {
    const c = conf(); const L = layout(c.oct, c.octaves); const w = 100 / L.whites.length;
    kb.style.setProperty('--n', L.whites.length);
    kb.replaceChildren(
      ...L.whites.map((m) => h('button', { type: 'button', class: `pn-w${m % 12 === 0 ? ' c' : ''}`, 'data-m': m, 'aria-label': nameOf(m, 'pt') }, c.labels === 'off' ? null : h('span', {}, m % 12 === 0 ? nameOf(m, c.labels) : nameOf(m, c.labels).replace(/\d+$/, '')))),
      ...L.blacks.map((b) => { const el = h('button', { type: 'button', class: 'pn-b', 'data-m': b.midi, 'aria-label': nameOf(b.midi, 'pt') }); el.style.left = `${(b.at) * w - w * 0.3}%`; el.style.width = `${w * 0.6}%`; return el; }),
    );
    for (const el of kb.querySelectorAll('[data-m]')) {
      const m = +el.dataset.m;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch { /* sem captura */ } down(`p${e.pointerId}`, m); });
      for (const ev of ['pointerup', 'pointercancel']) el.addEventListener(ev, (e) => up(`p${e.pointerId}`));
    }
    // deslizar o dedo de uma tecla pra outra (glissando): a captura do ponteiro fica na 1ª tecla, então trocamos pelo ponto atual
    kb.addEventListener('pointermove', (e) => {
      const n = live.get(`p${e.pointerId}`); if (!n || e.buttons === 0) return;
      const t = document.elementFromPoint(e.clientX, e.clientY); const el = t && t.closest && t.closest('[data-m]'); if (!el || !kb.contains(el)) return;
      const m = +el.dataset.m; if (m !== n.midi) { up(`p${e.pointerId}`); down(`p${e.pointerId}`, m); }
    });
  };

  let base = null;
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'x') { base = Math.max(1, Math.min(6, (base ?? conf().oct + 1) + (k === 'x' ? 1 : -1))); toast(`teclado do computador: a partir do dó ${base}`, { id: 'pn-oct', ms: 1200 }); return; }
    const m = keyToMidi(k, base ?? Math.min(5, conf().oct + (conf().octaves > 1 ? 1 : 0))); if (m === null) return;
    e.preventDefault(); down(`k${k}`, m);
  };
  const onKeyUp = (e) => up(`k${e.key.toLowerCase()}`);
  document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp);

  const stopPlay = () => { timers.forEach(clearTimeout); timers = []; };
  const play = () => {
    stopPlay(); if (!take.length) return; const c = conf();
    take.forEach((n) => timers.push(setTimeout(() => {
      const v = voice(n.midi, c.sound); const el = keyEl(n.midi); if (el) el.classList.add('on');
      timers.push(setTimeout(() => { v.off(c.pedal); if (el) el.classList.remove('on'); }, n.len * 1000));
      shown.textContent = nameOf(n.midi, 'pt');
    }, n.at * 1000)));
  };
  const drawTake = () => {
    takeBox.textContent = take.length ? take.map((n) => nameOf(n.midi, 'pt').replace(/\d+$/, '')).join(' · ') : recording ? 'gravando… toque a melodia' : 'grave uma frase curta pra ouvir de novo e conferir os nomes das notas.';
  };
  const drawPanel = () => {
    const c = conf();
    const seg = (label, opts, cur, on) => h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, label),
      h('div', { class: 'pn-chips', role: 'radiogroup', 'aria-label': label }, ...opts.map(([v, l]) => h('button', { type: 'button', class: `pn-chip${String(cur) === String(v) ? ' on' : ''}`, role: 'radio', 'aria-checked': String(String(cur) === String(v)), onclick: () => on(v) }, l))));
    const chg = (p) => () => setConf(p).then(() => { drawKb(); drawPanel(); });
    panel.replaceChildren(h('section', { class: 'card pad tk-panel' },
      seg('som', SOUNDS, c.sound, (v) => setConf({ sound: v }).then(drawPanel)),
      seg('nomes das notas', [['pt', 'dó ré mi'], ['cifra', 'C D E'], ['off', 'sem']], c.labels, (v) => setConf({ labels: v }).then(() => { drawKb(); drawPanel(); })),
      seg('oitavas na tela', [[1, '1'], [2, '2'], [3, '3']], c.octaves, (v) => setConf({ octaves: v, oct: clampOct(c.oct, v) }).then(() => { drawKb(); drawPanel(); })),
      h('div', { class: 'row tk-line pn-octs' }, h('span', { class: 'tp-lab' }, 'mais grave / mais agudo'),
        h('button', { class: 'btn small', type: 'button', 'aria-label': 'oitava mais grave', disabled: c.oct <= 1, onclick: chg({ oct: clampOct(c.oct - 1, c.octaves) }) }, '◀'),
        h('output', { class: 'pn-oct' }, `${nameOf((c.oct + 1) * 12)} – ${nameOf((c.oct + 1 + c.octaves) * 12)}`),
        h('button', { class: 'btn small', type: 'button', 'aria-label': 'oitava mais aguda', disabled: c.oct >= 7 - c.octaves, onclick: chg({ oct: clampOct(c.oct + 1, c.octaves) }) }, '▶'),
        h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.pedal), onclick: () => setConf({ pedal: !c.pedal }).then(drawPanel) }, c.pedal ? 'pedal ✓' : 'pedal')),
      h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'gravar frase'),
        recording ? h('button', { class: 'btn primary', type: 'button', onclick: () => { recording = false; drawTake(); drawPanel(); } }, '■ parar')
          : h('button', { class: 'btn', type: 'button', onclick: () => { stopPlay(); take = []; recording = true; rt0 = performance.now(); drawTake(); drawPanel(); } }, '● gravar'),
        h('button', { class: 'btn', type: 'button', disabled: !take.length || recording, onclick: play }, '▶ ouvir'),
        h('button', { class: 'btn ghost', type: 'button', disabled: !take.length, onclick: () => { stopPlay(); take = []; recording = false; drawTake(); drawPanel(); } }, 'limpar'))));
  };

  host.append(banner('Piano', 'pra tirar melodia e conferir a nota'), shown, kb, takeBox, panel,
    h('p', { class: 'pad-x lib-note' }, 'toca com vários dedos ao mesmo tempo e dá pra deslizar o dedo pelas teclas. no computador: fileira A S D F G H J K L = teclas brancas, W E T Y U O P = pretas; Z e X mudam a oitava. o som é gerado no aparelho; no iPhone pode ter um pequeno atraso. vire o aparelho de lado pra ter mais teclas.'));
  drawKb(); drawPanel(); drawTake();
  const onResize = () => {}; window.addEventListener('resize', onResize);
  return () => { stopPlay(); for (const id of [...live.keys()]) up(id); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', onResize); };
}
