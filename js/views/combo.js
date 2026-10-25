// Groove + Virada: N compassos de groove + 1 de virada, tocando em loop (o compasso que toca acende).
// "abrir na partitura" vira uma partitura editável (lá tem PNG, WAV e PDF).
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { clampBpm } from '../music.js';
import { toast } from '../ui.js';
import { playDoc, stopAll } from './partitura.js';

const KEY = 'setting-beatlab';
const REPS = [[1, '1 + 1'], [3, '3 + 1'], [7, '7 + 1']];
const conf = () => { const d = store.get(KEY) ? store.get(KEY).data : {}; return { reps: 3, click: true, ...(d.combo || {}), draftG: d.beat, draftF: d.fill }; };
const setConf = (patch) => store.upsert('setting', KEY, { combo: { ...(store.get(KEY) && store.get(KEY).data.combo), ...patch } });

/** Grooves e viradas que dá pra escolher: rascunho do editor, prontos e os seus (inclusive os do método). */
function options(kind) {
  const c = conf(); const out = [];
  const draft = kind === 'virada' ? c.draftF : c.draftG;
  if (draft && draft.mine) out.push({ key: 'draft', label: `${draft.name} (rascunho do editor)`, beat: draft });
  for (const r of store.list('beat')) { const b = r.data.beat; if (b && (b.kind === 'virada') === (kind === 'virada')) out.push({ key: `rec:${r.id}`, label: `${b.name}${r.data.metodo ? ' · método' : ' · meu'}`, beat: b }); }
  for (const p of B.PRESETS.filter((x) => x.kind === kind)) out.push({ key: `preset:${p.id}`, label: p.name, beat: p });
  return out;
}
const bar = (b) => ({ steps: b.steps, rows: B.clone(b.rows), acc: b.acc ? b.acc.slice() : Array(b.steps).fill(0) });

export function mountCombo(host) {
  let playing = false;
  const body = h('div');
  const pick = (kind, key) => { const list = options(kind); return list.find((o) => o.key === key) || list.find((o) => o.key.startsWith('preset:')) || list[0]; };
  const docOf = () => {
    const c = conf(); const g = pick('groove', c.g), f = pick('virada', c.f);
    const bpm = clampBpm(c.bpm || g.beat.bpm);
    return { g, f, c, bpm, doc: { title: `${g.beat.name} + ${f.beat.name}`, bpm, bars: [...Array(c.reps).fill(0).map(() => bar(g.beat)), bar(f.beat)] } };
  };
  const stop = () => { stopAll(); playing = false; };
  const draw = () => {
    const { g, f, c, bpm, doc } = docOf();
    const sel = (kind, cur, label) => h('label', { class: 'field cb-field' }, h('span', {}, label),
      h('select', { 'aria-label': label, onchange: (e) => { const was = playing; stop(); setConf({ [kind === 'virada' ? 'f' : 'g']: e.target.value }).then(() => { draw(); if (was) start(); }); } },
        ...options(kind).map((o) => h('option', { value: o.key, selected: o.key === cur.key }, o.label))));
    const svg = (b, cls) => { const fig = h('figure', { class: `cb-bar ${cls}` }); fig.innerHTML = N.toSVG(N.layout(b, { width: 340, full: true })); return fig; };
    const playBtn = h('button', { class: `bl-play${playing ? ' on' : ''}`, type: 'button', 'aria-label': playing ? 'Parar' : 'Tocar groove + virada', onclick: () => (playing ? (stop(), draw()) : start()) }, icon(playing ? 'stop' : 'play', 28));
    const setBpm = (v) => { const was = playing; stop(); setConf({ bpm: clampBpm(v) }).then(() => { draw(); if (was) start(); }); };
    body.replaceChildren(
      h('section', { class: 'card pad cb-card' },
        sel('groove', g, 'groove'), sel('virada', f, 'virada'),
        h('div', { class: 'row cb-row' }, h('span', { class: 'tp-lab' }, 'compassos'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Compassos de groove + virada' }, ...REPS.map(([n, t]) => h('button', { type: 'button', class: `lib-tab${c.reps === n ? ' on' : ''}`, role: 'radio', 'aria-checked': String(c.reps === n), onclick: () => { const was = playing; stop(); setConf({ reps: n }).then(() => { draw(); if (was) start(); }); } }, t)))),
        h('div', { class: 'bl-tempo' },
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => setBpm(bpm - 5) }, '−'), h('output', { class: 'bl-bpm' }, String(bpm)),
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => setBpm(bpm + 5) }, '+'), playBtn),
        h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!!c.click), onclick: () => { const was = playing; stop(); setConf({ click: !c.click }).then(() => { draw(); if (was) start(); }); } }, c.click ? 'com clique ✓' : 'sem clique')),
      h('div', { class: 'cb-score' },
        h('div', { class: 'cb-lane', 'data-part': 'g' }, h('small', { class: 'cb-tag' }, `groove ×${c.reps}`), svg(g.beat, 'g'),
          h('div', { class: 'cb-dots', 'aria-hidden': 'true' }, ...Array.from({ length: c.reps }, (_, i) => h('i', { 'data-bar': String(i) })))),
        h('div', { class: 'cb-lane', 'data-part': 'f' }, h('small', { class: 'cb-tag' }, 'virada ×1'), svg(f.beat, 'f'), h('div', { class: 'cb-dots', 'aria-hidden': 'true' }, h('i', { 'data-bar': String(c.reps) })))),
      h('div', { class: 'pad-x row cb-actions' },
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          stop(); const rec = await store.upsert('partitura', null, { ...doc, created: Date.now() });
          toast('virou partitura ✓ (dá pra editar e exportar)', { ms: 1800 }); location.hash = `#/partitura/${rec.id}`;
        } }, 'abrir na partitura (PNG, WAV, PDF)')),
      h('p', { class: 'pad-x lib-note' }, 'clássico de aula: 3 compassos de groove e a virada no 4º, voltando pro groove com prato no 1. escolha um groove ou virada seus (salvos em Meus ritmos) ou os prontos.'));
  };
  const light = (bi) => body.querySelectorAll('.cb-dots i').forEach((d) => d.classList.toggle('on', Number(d.dataset.bar) === bi));
  const start = () => {
    const { doc, c } = docOf();
    // depois da virada, o groove volta com prato no 1 (como se toca de verdade)
    const withCrash = { ...doc, bars: doc.bars.map((b, i) => (i === 0 ? { ...b, rows: { ...b.rows, cr: b.rows.cr ? b.rows.cr.map((v, k) => (k === 0 ? 1 : v)) : Array(b.steps).fill(0).map((_, k) => (k === 0 ? 1 : 0)) } } : b)) };
    playDoc(withCrash, { loop: true, withClick: c.click, onBar: light });
    playing = true; draw();
  };
  host.append(body); draw();
  return stop;
}
