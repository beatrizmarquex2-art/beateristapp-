// Mapa da música: monta a estrutura (intro 4, verso 8, refrão 8…) e toca o metrônomo mostrando onde você está,
// com prato na troca de parte e aviso no último compasso. E "contar compassos": o app toca uma forma e você
// descobre quantos compassos tem a parte pedida.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as T from '../tools-logic.js';
import { audio, click, cymbal, scheduler } from '../audio.js';
import { VOICE } from './beatlab.js';
import { banner, sheet, toast, confirmSheet, stars } from '../ui.js';
import { back } from './tools-common.js';
import * as FB from '../feedback.js';

const METERS = ['4/4', '3/4', '6/8', '2/4'];
const maps = () => store.list('songmap').sort((a, b) => (a.data.name || '').localeCompare(b.data.name || '', 'pt-BR'));
const EXAMPLE = { name: 'Exemplo pop', bpm: 100, meter: '4/4', sections: [['intro', 4], ['verso', 8], ['pré-refrão', 4], ['refrão', 8], ['verso', 8], ['pré-refrão', 4], ['refrão', 8], ['ponte', 4], ['refrão', 8], ['final', 2]].map(([name, bars]) => ({ name, bars })) };

function editor(rec, onDone) {
  const d = rec ? JSON.parse(JSON.stringify(rec.data)) : JSON.parse(JSON.stringify({ ...EXAMPLE, name: '' }));
  sheet(rec ? 'Editar mapa' : 'Novo mapa', (close) => {
    const name = h('input', { type: 'text', maxlength: 80, value: d.name || '', placeholder: 'nome da música', 'aria-label': 'Nome do mapa' });
    const bpm = h('input', { type: 'number', inputmode: 'numeric', min: 30, max: 260, value: String(d.bpm || 100), 'aria-label': 'BPM' });
    const meter = h('select', { 'aria-label': 'Compasso' }, ...METERS.map((m) => h('option', { value: m, selected: m === d.meter }, m)));
    const list = h('ol', { class: 'mp-edit' });
    const drawList = () => {
      const tl = T.timeline(d.sections);
      list.replaceChildren(...d.sections.map((s, i) => {
        const n = h('input', { type: 'text', maxlength: 24, value: s.name, 'aria-label': `Parte ${i + 1}`, list: 'mp-names' }); n.addEventListener('input', () => { s.name = n.value; });
        const b = h('input', { type: 'number', inputmode: 'numeric', min: 1, max: 64, value: String(s.bars), 'aria-label': `Compassos da parte ${i + 1}` }); b.addEventListener('change', () => { s.bars = Math.max(1, Number(b.value) || 1); drawList(); });
        return h('li', {}, n, b, h('small', { class: 'muted' }, `c. ${tl.parts[i].start + 1}`),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Subir parte ${i + 1}`, disabled: i === 0, onclick: () => { [d.sections[i - 1], d.sections[i]] = [d.sections[i], d.sections[i - 1]]; drawList(); } }, '↑'),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Tirar parte ${i + 1}`, onclick: () => { d.sections.splice(i, 1); drawList(); } }, '×'));
      }));
    };
    drawList();
    const save = async () => {
      if (!d.sections.length) { toast('põe pelo menos uma parte'); return; }
      const data = { name: name.value.trim() || 'Sem nome', bpm: Math.max(30, Math.min(260, Number(bpm.value) || 100)), meter: meter.value, sections: d.sections.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), bars: Math.max(1, Number(s.bars) || 1) })) };
      const r = await store.upsert('songmap', rec ? rec.id : null, data); close(); onDone && onDone(r ? r.id : null);
    };
    return h('div', { class: 'sheet-body' },
      h('datalist', { id: 'mp-names' }, ...T.SECTION_NAMES.map((s) => h('option', { value: s }))),
      h('label', { class: 'field' }, h('span', {}, 'música'), name),
      h('div', { class: 'sl-2' }, h('label', { class: 'field' }, h('span', {}, 'BPM'), bpm), h('label', { class: 'field' }, h('span', {}, 'compasso'), meter)),
      h('div', { class: 'field' }, h('span', {}, 'partes (nome e compassos)'), list),
      h('div', { class: 'chips lib-tabs' }, ...T.SECTION_NAMES.map((s) => h('button', { type: 'button', class: 'lib-tab', onclick: () => { d.sections.push({ name: s, bars: s === 'intro' || s === 'final' || s === 'virada' ? 4 : 8 }); drawList(); } }, `+ ${s}`))),
      h('div', { class: 'row between' },
        rec ? h('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (await confirmSheet('Apagar mapa?', d.name, 'Apagar')) { await store.remove(rec.id); close(); onDone && onDone(null); } } }, 'apagar') : h('span'),
        h('button', { class: 'btn primary', type: 'button', onclick: save }, 'salvar')));
  });
}

export function mountMapa(host) {
  let cur = null; let run = null; let pos = -1;
  const body = h('div');
  const stop = () => { if (run) run.stop(); run = null; pos = -1; draw(); };
  const play = () => {
    const rec = cur && store.get(cur); if (!rec) return;
    const d = rec.data; const tl = T.timeline(d.sections); const bpb = T.beatsPerBar(d.meter);
    const beat = 60 / d.bpm * (d.meter === '6/8' ? 0.5 : 1); const countIn = bpb;
    run = scheduler((i) => {
      const bar = Math.floor((i - countIn) / bpb); const b = (i - countIn) % bpb;
      if (i >= countIn && bar >= tl.total) return null;
      return {
        at: i * beat,
        play: (t) => {
          if (i < countIn) { click(t, i === 0 ? 2 : 1, 0.8); return; }
          const w = T.whereAt(tl, bar);
          if (b === 0 && w.barIn === 1) cymbal(t, false, 0.8);
          click(t, b === 0 ? 2 : 1, w.left === 1 ? 1 : 0.6);
        },
        ui: () => { pos = i < countIn ? -(countIn - i) : (i - countIn); paint(); },
      };
    }, { onEnd: () => { run = null; pos = -1; draw(); } });
    draw();
  };
  const live = h('div', { class: 'mp-live' });
  const paint = () => {
    const rec = cur && store.get(cur); if (!rec) return; const d = rec.data; const tl = T.timeline(d.sections); const bpb = T.beatsPerBar(d.meter);
    if (pos < 0 && run) { live.replaceChildren(h('p', { class: 'mp-now' }, 'contando…'), h('p', { class: 'mp-big' }, String(-pos))); return; }
    if (pos < 0) { live.replaceChildren(h('p', { class: 'muted' }, `${tl.total} compassos · ${T.fmtSec(T.mapSeconds(tl, d.bpm, d.meter))} a ${d.bpm} BPM`)); markBlocks(-1); return; }
    const bar = Math.floor(pos / bpb); const b = pos % bpb; const w = T.whereAt(tl, bar); if (!w) return;
    live.replaceChildren(
      h('p', { class: `mp-now${w.left === 1 ? ' warn' : ''}` }, w.part.name),
      h('p', { class: 'mp-big' }, `${w.barIn}`, h('small', {}, ` de ${w.part.bars}`)),
      h('div', { class: 'mp-dots' }, ...Array.from({ length: bpb }, (_, k) => h('i', { class: k === b ? 'on' : '' }))),
      h('p', { class: 'mp-next' }, w.next ? (w.left === 1 ? `→ ${w.next.name} já!` : `próxima: ${w.next.name} em ${w.left}`) : (w.left === 1 ? 'último compasso' : `fim em ${w.left}`)));
    markBlocks(w.index);
  };
  const blocks = h('div', { class: 'mp-blocks' });
  const markBlocks = (k) => [...blocks.children].forEach((el, i) => el.classList.toggle('on', i === k));
  const draw = () => {
    const all = maps(); if (!cur && all.length) cur = all[0].id;
    const rec = cur && store.get(cur);
    if (rec) { const tl = T.timeline(rec.data.sections); blocks.replaceChildren(...tl.parts.map((p) => h('span', { style: { flexGrow: String(p.bars) }, title: `${p.name} · ${p.bars}` }, h('b', {}, p.name), h('small', {}, String(p.bars))))); }
    body.replaceChildren(...[
      h('div', { class: 'row pad-x ft-row' },
        all.length ? h('select', { 'aria-label': 'Mapa', onchange: (e) => { stop(); cur = e.target.value; draw(); } }, ...all.map((r) => h('option', { value: r.id, selected: r.id === cur }, `${r.data.name} · ${r.data.bpm}`))) : null,
        h('button', { class: 'btn', type: 'button', onclick: () => editor(null, (id) => { if (id) cur = id; draw(); }) }, '+ novo mapa'),
        rec ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); editor(rec, (id) => { cur = id; draw(); }); } }, 'editar') : null),
      rec ? h('section', { class: 'card pad mp-card' }, h('h2', { class: 'tag' }, rec.data.name, h('small', { class: 'muted' }, ` · ${rec.data.bpm} BPM · ${rec.data.meter}`)), blocks, live,
        h('div', { class: 'row ft-row' }, h('button', { class: `bl-play${run ? ' on' : ''}`, type: 'button', 'aria-label': run ? 'Parar' : 'Tocar o mapa', onclick: () => (run ? stop() : play()) }, icon(run ? 'stop' : 'play', 28))))
        : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum mapa ainda.'), h('p', { class: 'muted' }, 'cria um com a estrutura da música que você vai tocar: o app conta os compassos por você.'),
          h('button', { class: 'btn primary', type: 'button', onclick: async () => { const r = await store.upsert('songmap', null, EXAMPLE); cur = r ? r.id : null; draw(); } }, 'começar com um exemplo')),
      h('p', { class: 'pad-x lib-note' }, 'prato no começo de cada parte e o clique fica mais forte no último compasso antes da troca. 1 compasso de contagem antes.')].filter(Boolean));
    paint();
  };
  host.append(banner('Mapa da música', 'você toca, o app conta os compassos'), back(), body);
  draw();
  const off = store.subscribe((i) => { if ((!i.kind || i.kind === 'songmap') && !run) draw(); });
  return () => { off(); if (run) run.stop(); };
}

/* ---------- contar compassos (forma) ---------- */
const on8 = (s) => Array.from({ length: 8 }, (_, i) => (s.includes(i) ? 1 : 0));
const PATTERN = {
  intro: { bd: on8([0, 4]), sn: on8([2, 6]) },
  verso: { hh: on8([0, 1, 2, 3, 4, 5, 6, 7]), bd: on8([0, 4, 5]), sn: on8([2, 6]) },
  'pré-refrão': { hh: on8([0, 2, 4, 6]), bd: on8([0, 2, 4, 6]), sn: on8([2, 6]) },
  refrão: { rd: on8([0, 1, 2, 3, 4, 5, 6, 7]), bd: on8([0, 3, 4]), sn: on8([2, 6]) },
  ponte: { ft: on8([0, 1, 2, 3, 4, 5, 6, 7]), bd: on8([0, 4]), sn: on8([6]) },
  solo: { rd: on8([0, 2, 4, 6]), bd: on8([0, 3, 4, 7]), sn: on8([2, 6]) },
  final: { cr: on8([0]), bd: on8([0]) },
};
const KEYF = 'setting-forma';
export function mountForma(host) {
  let q = null, run = null, at = -1, picked = null; const bpm = 132;
  const body = h('div');
  const stop = () => { if (run) run.stop(); run = null; at = -1; draw(); };
  const play = () => {
    stop(); const tl = T.timeline(q.sections); const step = 60 / bpm / 2; const total = tl.total * 8 + 8;
    run = scheduler((i) => {
      if (i >= total) return null;
      return { at: i * step, play: (t) => {
        if (i < 8) { if (i % 2 === 0) click(t, i === 0 ? 2 : 1, 0.8); return; }
        const k = i - 8; const bar = Math.floor(k / 8); const s = k % 8; const w = T.whereAt(tl, bar); const p = PATTERN[w.part.name] || PATTERN.verso;
        if (s === 0 && w.barIn === 1 && bar > 0) VOICE.cr(t, 0.9);
        for (const [row, arr] of Object.entries(p)) if (arr[s]) VOICE[row](t, 0.9);
      }, ui: () => { const k = i - 8; const nb = k < 0 ? -1 : T.whereAt(tl, Math.floor(k / 8)).index; if (nb !== at) { at = nb; paintSecs(); } } };
    }, { onEnd: () => { run = null; at = -1; draw(); } });
    draw();
  };
  const secs = h('ol', { class: 'mp-secs' });
  const paintSecs = () => { [...secs.children].forEach((li, i) => li.classList.toggle('on', i === at)); };
  const score = () => (store.get(KEYF) ? store.get(KEYF).data : { ok: 0, n: 0 });
  const answer = async (v) => {
    if (picked != null) return; picked = v; const s = score(); const ok = v === q.right;
    await store.upsert('setting', KEYF, { ok: s.ok + (ok ? 1 : 0), n: s.n + 1 });
    draw(); FB.result(ok, body.querySelector('.mp-opts') || body);
  };
  const draw = () => {
    const s = score();
    secs.replaceChildren(...q.sections.map((p, i) => h('li', { class: `${i === q.ask ? 'ask' : ''}${i === at ? ' on' : ''}` }, p.name, i === q.ask ? h('b', {}, picked != null ? ` · ${q.right} compassos` : ' · ?') : null)));
    body.replaceChildren(
      h('section', { class: 'card pad' },
        h('p', { class: 'muted' }, `o app toca a música inteira a ${bpm} BPM, com 1 compasso de contagem. cada parte tem uma levada diferente e um prato na entrada. conte quantos compassos tem a parte marcada.`),
        secs,
        h('div', { class: 'row ft-row' }, h('button', { class: `bl-play${run ? ' on' : ''}`, type: 'button', 'aria-label': run ? 'Parar' : 'Tocar a música', onclick: () => (run ? stop() : play()) }, icon(run ? 'stop' : 'play', 28)),
          h('span', { class: 'tr-count' }, `acertos ${s.ok}/${s.n}`)),
        h('p', { class: 'tp-lab' }, `quantos compassos tem o ${q.sections[q.ask].name} marcado?`),
        h('div', { class: 'mp-opts' }, ...q.opts.map((v) => h('button', { type: 'button', class: `tr-pal${picked != null ? (v === q.right ? ' ok' : v === picked ? ' no' : '') : ''}`, onclick: () => answer(v) }, String(v)))),
        picked != null ? h('p', { class: `tr-status ${picked === q.right ? 'good' : 'bad'}` }, picked === q.right ? 'isso! ✓' : `eram ${q.right}. ouve de novo contando 1, 2, 3, 4 a cada prato.`) : null,
        picked != null ? h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); q = T.formQuiz(); picked = null; draw(); } }, 'próxima música') : null));
  };
  q = T.formQuiz();
  host.append(banner('Contar compassos', 'treina o ouvido pra forma da música'), back(), body);
  draw();
  return () => { if (run) run.stop(); };
}
