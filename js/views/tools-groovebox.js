// Groovebox: 16 pads (bateria + baixo, piano, guitarra e voz), sequenciador de 16 passos e uma sequência de acordes
// (um acorde por compasso, 4 compassos em loop). Toque no pad pra ouvir e escolher; toque nos passos pra ligar.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as T from '../tools-logic.js';
import { PADS } from '../synth.js';
import { scheduler, audio } from '../audio.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { back } from './tools-common.js';

const KEY = 'setting-groovebox';
const empty = () => Object.fromEntries(PADS.map(([id]) => [id, Array(16).fill(0)]));
const on = (s) => Array.from({ length: 16 }, (_, i) => (s.includes(i) ? 1 : 0));
const DEMO = { bd: on([0, 6, 8, 11]), sn: on([4, 12]), hh: on([0, 2, 4, 6, 8, 10, 12, 14]), ho: on([14]), bs: on([0, 6, 8, 11]), ep: on([2, 10]) };
const conf = () => {
  const d = store.get(KEY) ? store.get(KEY).data : {};
  return { bpm: 92, prog: 0, sel: 'bd', steps: { ...empty(), ...DEMO }, ...d, steps: { ...empty(), ...(d.steps || DEMO) } };
};
const save = (p) => store.upsert('setting', KEY, p);

export function mountGroovebox(host) {
  let run = null, step = -1, bar = 0;
  let st = conf(); // estado local (salva com folga, sem redesenhar tudo)
  let saveT = 0; const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => save({ bpm: st.bpm, prog: st.prog, sel: st.sel, steps: st.steps }), 400); };
  const chordOf = (b) => T.chord(T.PROGRESSIONS[st.prog][b % 4]);
  const bpmOut = h('output', { class: 'gb-bpm' });
  const chOut = h('output', { class: 'gb-chord' });
  const padsEl = h('div', { class: 'gb-pads' });
  const stepsEl = h('div', { class: 'gb-steps', role: 'group', 'aria-label': 'Passos' });
  const selName = h('b', {});
  const playBtn = h('button', { class: 'bl-play', type: 'button', 'aria-label': 'Tocar', onclick: () => (run ? stop() : start()) }, icon('play', 28));
  const paintHead = () => {
    bpmOut.replaceChildren(String(st.bpm), h('small', {}, ' bpm'));
    chOut.replaceChildren(h('small', {}, run ? 'tocando' : 'parado'), h('b', {}, chordOf(run ? bar : 0).name));
    playBtn.classList.toggle('on', !!run); playBtn.replaceChildren(icon(run ? 'stop' : 'play', 28)); playBtn.setAttribute('aria-label', run ? 'Parar' : 'Tocar');
  };
  const paintPads = () => padsEl.replaceChildren(...PADS.map(([id, name, fam, fn]) => h('button', {
    type: 'button', class: `gb-pad f-${fam}${st.sel === id ? ' sel' : ''}${st.steps[id].some(Boolean) ? ' has' : ''}`, 'data-id': id, 'aria-label': `${name}${st.sel === id ? ' (escolhido)' : ''}`,
    onpointerdown: (e) => { e.preventDefault(); fn(audio().currentTime + 0.005, chordOf(run ? bar : 0)); const el = e.currentTarget; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); if (st.sel !== id) { st.sel = id; persist(); paintPads(); paintSteps(); } },
  }, h('span', {}, name))));
  const paintSteps = () => {
    selName.textContent = (PADS.find((p) => p[0] === st.sel) || PADS[0])[1];
    stepsEl.replaceChildren(...st.steps[st.sel].map((v, i) => h('button', { type: 'button', class: `gb-step${v ? ' on' : ''}${i % 4 === 0 ? ' beat' : ''}${i === step ? ' now' : ''}`, 'aria-label': `Passo ${i + 1}${v ? ' ligado' : ''}`, 'aria-pressed': String(!!v),
      onclick: () => { st.steps[st.sel][i] = v ? 0 : 1; persist(); paintSteps(); paintPads(); } })));
  };
  const moveHead = () => { [...stepsEl.children].forEach((el, i) => el.classList.toggle('now', i === step)); };
  function start() {
    const dur = () => 60 / st.bpm / 4; let at = 0;
    run = scheduler((i) => {
      const t0 = at; at += dur(); const s = i % 16; const b = Math.floor(i / 16);
      return { at: t0, play: (t) => { const ch = chordOf(b); for (const [id, , , fn] of PADS) if (st.steps[id][s]) fn(t, ch); }, ui: () => { step = s; if (bar !== b) { bar = b; paintHead(); } moveHead(); } };
    });
    paintHead();
  }
  function stop() { if (run) run.stop(); run = null; step = -1; bar = 0; moveHead(); paintHead(); }
  const progSel = h('select', { 'aria-label': 'Acordes', onchange: (e) => { st.prog = Number(e.target.value); persist(); paintHead(); } }, ...T.PROGRESSIONS.map((p, i) => h('option', { value: String(i), selected: i === st.prog }, p.join(' – '))));
  const patterns = () => store.list('gbpattern').sort((a, b) => (a.data.name || '').localeCompare(b.data.name || '', 'pt-BR'));
  const savePat = () => sheet('Salvar batida', (close) => {
    const name = h('input', { type: 'text', maxlength: 40, placeholder: 'ex.: neo soul 92', 'aria-label': 'Nome da batida' });
    return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name), h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      await store.upsert('gbpattern', null, { name: name.value.trim() || 'minha batida', bpm: st.bpm, prog: st.prog, steps: JSON.parse(JSON.stringify(st.steps)) }); close(); toast('batida salva ✓', { ms: 1400 });
    } }, 'salvar'));
  });
  const openPats = () => sheet('Minhas batidas', (close) => {
    const l = patterns();
    return h('div', { class: 'sheet-body' }, l.length ? h('ul', { class: 'rp-list' }, ...l.map((r) => h('li', { class: 'rm-item' }, h('span', { class: 'rm-time' }, String(r.data.bpm)),
      h('button', { type: 'button', class: 'rp-t', onclick: () => { st = { ...st, bpm: r.data.bpm, prog: r.data.prog || 0, steps: { ...empty(), ...r.data.steps } }; progSel.value = String(st.prog); persist(); paintHead(); paintPads(); paintSteps(); close(); } }, h('strong', {}, r.data.name), h('small', {}, T.PROGRESSIONS[r.data.prog || 0].join(' – '))),
      h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar ${r.data.name}`, onclick: async () => { if (await confirmSheet('Apagar batida?', r.data.name, 'Apagar')) { await store.remove(r.id); close(); } } }, 'apagar')))) : h('p', { class: 'muted' }, 'nenhuma ainda.'));
  });
  host.append(banner('Groovebox', 'monta a batida com baixo e acordes'), back(),
    h('section', { class: 'card pad gb' },
      h('div', { class: 'gb-head' },
        h('div', { class: 'gb-box' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 2 BPM', onclick: () => { st.bpm = Math.max(50, st.bpm - 2); persist(); paintHead(); } }, '−'), bpmOut, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 2 BPM', onclick: () => { st.bpm = Math.min(180, st.bpm + 2); persist(); paintHead(); } }, '+')),
        h('div', { class: 'gb-box' }, chOut), playBtn),
      padsEl,
      h('div', { class: 'row between gb-sel' }, h('p', {}, selName, h('small', { class: 'muted' }, ' · toque nos passos pra ligar e desligar · toque no pad pra ouvir e escolher')),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { st.steps[st.sel] = Array(16).fill(0); persist(); paintSteps(); paintPads(); } }, 'limpar')),
      stepsEl,
      h('div', { class: 'tr-line' }, h('span', { class: 'tp-lab' }, 'acordes'), progSel),
      h('div', { class: 'row ft-row' }, h('button', { class: 'btn', type: 'button', onclick: savePat }, 'salvar batida'), h('button', { class: 'btn ghost', type: 'button', onclick: openPats }, 'minhas batidas'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.steps = empty(); persist(); paintPads(); paintSteps(); } }, 'zerar tudo'))),
    h('p', { class: 'pad-x lib-note' }, 'todos os sons são gerados aqui no aparelho. o baixo segue a nota do acorde; piano, guitarra e voz tocam o acorde do compasso.'));
  paintHead(); paintPads(); paintSteps();
  return () => { stop(); clearTimeout(saveT); save({ bpm: st.bpm, prog: st.prog, sel: st.sel, steps: st.steps }); };
}
