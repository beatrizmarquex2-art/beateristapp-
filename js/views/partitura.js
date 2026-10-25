// Montar Partitura: vários compassos de bateria, cada um editado na mesma grade do Beat Lab (com linha de acentos).
// Toca tudo (com loop e compasso aceso), exporta imagem, WAV e impressão/PDF. Os exercícios do método Beaterista
// moram aqui como partituras privadas (só na conta da Bea), com o selo "a revisar" até ela conferir.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, click, scheduler } from '../audio.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { gridEl, VOICE, velOf, stopBeat } from './beatlab.js';
import { renderWav } from '../wav.js';

const KIND = 'partitura';
const docs = () => store.list(KIND).sort((a, b) => (b.data.metodo ? 0 : 1) - (a.data.metodo ? 0 : 1) || b.updated_at - a.updated_at);
const emptyBar = (steps = 16) => ({ steps, rows: Object.fromEntries(B.ROWS.map((r) => [r.id, Array(steps).fill(0)])), acc: Array(steps).fill(0) });

/* ---------- tocar a partitura inteira ---------- */
let run = null;
export function stopAll() { if (run) { run.stop(); run = null; } }
export function playDoc(doc, { loop, withClick, onBar, onEnd }) {
  stopAll(); stopBeat(); audio();
  const evs = []; let t = 0;
  doc.bars.forEach((bar, bi) => {
    const dt = B.stepSec(doc.bpm, bar.steps); const per = B.GRIDS[bar.steps].perBeat;
    for (let i = 0; i < bar.steps; i++) evs.push({ at: t + i * dt, bar: bi, beat: bar, i, beatStart: i % per === 0, first: i === 0 });
    t += bar.steps * dt;
  });
  const total = t;
  run = scheduler((k) => {
    if (!loop && k >= evs.length) return null;
    const e = evs[k % evs.length]; const lap = Math.floor(k / evs.length);
    return { at: lap * total + e.at, play: (tt) => { B.hitsAt(e.beat, e.i).forEach((r) => VOICE[r](tt, velOf(e.beat, e.i))); if (withClick && e.beatStart) click(tt, e.first ? 2 : 1, 0.55); }, ui: () => onBar && onBar(e.bar) };
  }, { onEnd: () => { run = null; onEnd && onEnd(); } });
  return run;
}

/* ---------- desenho ---------- */
function barSvg(bar, n, width = 340) {
  const f = h('figure', { class: 'pt-bar-svg' }); f.innerHTML = N.toSVG(N.layout(bar, { width, full: true })); // números nossos, sem texto de usuário
  return f;
}
function shareBlob(blob, name, title) {
  const file = new File([blob], name, { type: blob.type });
  (async () => {
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return; } } catch { return; }
    const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
  })();
}
function exportPng(doc) {
  const W = 1240, cols = 2, cw = (W - 120) / cols; const L = N.layout(doc.bars[0], { width: cw / 2, full: true }); const ch = L.h * 2 + 40;
  const rows = Math.ceil(doc.bars.length / cols); const c = document.createElement('canvas'); c.width = W; c.height = 190 + rows * ch + 60;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#b5162b'; g.font = '700 46px "Permanent Marker", "Hanken Grotesk", sans-serif'; g.fillText(doc.title.toUpperCase(), 60, 90);
  g.fillStyle = '#1b1b1b'; g.font = '600 24px "Hanken Grotesk", sans-serif'; g.fillText(`♩ = ${doc.bpm} · ${doc.bars.length} compassos${doc.metodo ? ' · método Beaterista' : ''}`, 60, 132);
  doc.bars.forEach((bar, i) => {
    const x = 60 + (i % cols) * cw, y = 170 + Math.floor(i / cols) * ch;
    g.fillStyle = '#7a6f66'; g.font = '600 18px "Hanken Grotesk", sans-serif'; g.fillText(String(i + 1), x, y + 16);
    g.save(); g.translate(x + 10, y + 10); N.draw(g, N.layout(bar, { width: cw / 2 - 10, full: true }), { scale: 2 }); g.restore();
  });
  g.fillStyle = '#7a6f66'; g.font = '600 18px "Hanken Grotesk", sans-serif'; g.fillText('Beaterista', W - 170, c.height - 24);
  c.toBlob((b) => shareBlob(b, `${doc.title.replace(/[^\wÀ-ú -]/g, '').trim() || 'partitura'}.png`, doc.title), 'image/png');
}
function printDoc(doc) {
  const area = h('div', { class: 'pt-print' }, h('h1', {}, doc.title), h('p', {}, `♩ = ${doc.bpm} · ${doc.bars.length} compassos${doc.metodo ? ` · baseado no método Beaterista (${doc.source || ''})` : ''}`),
    h('div', { class: 'pt-print-grid' }, ...doc.bars.map((b, i) => h('div', {}, h('small', {}, String(i + 1)), barSvg(b, i, 360)))));
  document.body.append(area); document.documentElement.classList.add('printing-pt');
  const done = () => { area.remove(); document.documentElement.classList.remove('printing-pt'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  try { window.print(); } catch { toast('este aparelho não abriu a impressão. use “imagem” e imprima a foto.'); }
  setTimeout(() => { if (area.isConnected && !matchMedia('print').matches) done(); }, 60000);
}

/* ---------- editor ---------- */
function mountEdit(host, id) {
  if (!store.get(id)) { host.append(banner('Partitura'), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'partitura não encontrada.'), h('a', { class: 'btn primary', href: '#/partitura' }, 'voltar'))); return null; }
  let sel = null; let playingBar = -1; let playing = false; let loop = true; let withClick = false;
  const doc = () => store.get(id).data;
  const save = (patch) => store.upsert(KIND, id, patch);
  const setBars = (bars) => save({ bars });
  const head = h('div'); const barsBox = h('div', { class: 'pt-bars' }); const editor = h('div');
  const playBtn = h('button', { class: 'bl-play', type: 'button' });
  const paintPlay = () => { playBtn.replaceChildren(icon(playing ? 'stop' : 'play', 26)); playBtn.setAttribute('aria-label', playing ? 'Parar' : 'Tocar a partitura'); playBtn.classList.toggle('on', playing); };
  playBtn.addEventListener('click', () => {
    if (playing) { stopAll(); playing = false; playingBar = -1; paintPlay(); markBar(); return; }
    playing = true; paintPlay();
    playDoc(doc(), { loop, withClick, onBar: (b) => { if (b !== playingBar) { playingBar = b; markBar(); } }, onEnd: () => { playing = false; playingBar = -1; paintPlay(); markBar(); } });
  });
  const markBar = () => barsBox.querySelectorAll('.pt-bar').forEach((el, i) => el.classList.toggle('now', i === playingBar));
  function drawHead() {
    const d = doc();
    head.replaceChildren(h('section', { class: 'card pad pt-head' },
      d.metodo ? h('p', { class: 'pt-badge' }, `baseado no método Beaterista · ${d.source || ''}`, d.review ? h('b', {}, ' · a revisar') : h('b', { class: 'ok' }, ' · conferido ✓')) : null,
      h('input', { class: 'sl-name', type: 'text', maxlength: 80, value: d.title, 'aria-label': 'Título da partitura', onchange: (e) => save({ title: e.target.value.trim() || 'partitura' }) }),
      h('div', { class: 'pt-ctrl' },
        h('div', { class: 'bl-tempo tp-bpm' },
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => save({ bpm: Math.max(40, d.bpm - 5) }) }, '−'),
          h('output', { class: 'bl-bpm' }, String(d.bpm)),
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => save({ bpm: Math.min(220, d.bpm + 5) }) }, '+'), h('span', { class: 'tp-unit' }, 'BPM')),
        playBtn),
      h('div', { class: 'toggles pt-tg' },
        h('button', { class: `btn small${loop ? ' primary' : ''}`, type: 'button', 'aria-pressed': String(loop), onclick: () => { loop = !loop; drawHead(); } }, loop ? '↻ loop ✓' : '↻ loop'),
        h('button', { class: `btn small${withClick ? ' primary' : ''}`, type: 'button', 'aria-pressed': String(withClick), onclick: () => { withClick = !withClick; drawHead(); } }, withClick ? 'clique ✓' : 'clique'),
        d.metodo && d.review ? h('button', { class: 'btn small', type: 'button', onclick: () => save({ review: false }) }, 'marcar como conferido') : null)));
    paintPlay();
  }
  function drawBars() {
    const d = doc();
    barsBox.replaceChildren(...d.bars.map((bar, i) => h('button', { class: `pt-bar${sel === i ? ' sel' : ''}${playingBar === i ? ' now' : ''}`, type: 'button', 'aria-label': `Compasso ${i + 1}${sel === i ? ' (editando)' : ''}`, onclick: () => { sel = sel === i ? null : i; drawBars(); drawEditor(); } },
      h('span', { class: 'pt-n' }, String(i + 1)), barSvg(bar, i))),
      h('div', { class: 'pt-add' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { setBars([...d.bars, emptyBar(16)]); sel = d.bars.length; } }, '+ compasso vazio'),
        h('button', { class: 'btn small', type: 'button', onclick: pickRhythm }, '+ de um ritmo')));
  }
  function drawEditor() {
    const d = doc();
    if (sel == null || !d.bars[sel]) { editor.replaceChildren(h('p', { class: 'pad-x lib-note' }, 'toque num compasso pra editar. toque de novo pra fechar.')); return; }
    const bar = d.bars[sel];
    const upd = (nb) => { const bars = d.bars.slice(); bars[sel] = nb; setBars(bars); };
    editor.replaceChildren(h('section', { class: 'card pad pt-edit' },
      h('div', { class: 'row between' }, h('strong', {}, `compasso ${sel + 1}`),
        h('div', { class: 'chips lib-tabs tp-chips' }, ...[[8, 'colch.'], [12, 'terc.'], [16, 'semic.']].map(([n, t]) => h('button', { type: 'button', class: `lib-tab${bar.steps === n ? ' on' : ''}`, onclick: () => upd(B.resize(bar, n)) }, t)))),
      gridEl(bar, (r, i) => upd(B.toggle(bar, r, i)), { full: true, accent: true, onAccent: (i) => upd(B.toggleAcc(bar, i)) }),
      h('div', { class: 'bl-actions' },
        h('button', { class: 'btn small', type: 'button', disabled: sel === 0, onclick: () => { const b = d.bars.slice(); [b[sel - 1], b[sel]] = [b[sel], b[sel - 1]]; sel--; setBars(b); } }, '← mover'),
        h('button', { class: 'btn small', type: 'button', disabled: sel === d.bars.length - 1, onclick: () => { const b = d.bars.slice(); [b[sel + 1], b[sel]] = [b[sel], b[sel + 1]]; sel++; setBars(b); } }, 'mover →'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { const b = d.bars.slice(); b.splice(sel + 1, 0, B.clone(bar)); sel++; setBars(b); } }, 'duplicar'),
        h('button', { class: 'btn small ghost danger', type: 'button', disabled: d.bars.length < 2, onclick: () => { const b = d.bars.slice(); b.splice(sel, 1); sel = Math.min(sel, b.length - 1); setBars(b); } }, 'apagar'))));
  }
  function pickRhythm() {
    const mine = store.list('beat').map((r) => ({ ...r.data.beat, label: r.data.beat.name }));
    const all = [...mine, ...B.PRESETS.map((p) => ({ ...p, label: p.name }))];
    sheet('Trazer um ritmo', (close) => h('div', { class: 'sheet-body' }, h('ul', { class: 'pt-pick' }, ...all.map((b) => h('li', {}, h('button', { type: 'button', onclick: () => {
      const d = doc(); const nb = { steps: b.steps, rows: B.clone(b.rows), acc: b.acc ? b.acc.slice() : Array(b.steps).fill(0) };
      setBars([...d.bars, nb]); sel = d.bars.length; close();
    } }, b.label, h('small', {}, ` · ${B.GRIDS[b.steps].name}`)))))));
  }
  const foot = h('div', { class: 'bl-actions pad-x' },
    h('button', { class: 'btn', type: 'button', onclick: () => exportPng(doc()) }, icon('photo', 16), ' imagem'),
    h('button', { class: 'btn', type: 'button', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = 'gerando…'; try { const d = doc(); shareBlob(await renderWav(d), `${d.title.replace(/[^\wÀ-ú -]/g, '').trim() || 'partitura'}.wav`, d.title); } catch { toast('não consegui gerar o áudio neste aparelho.'); } b.disabled = false; b.textContent = 'áudio (WAV)'; } }, 'áudio (WAV)'),
    h('button', { class: 'btn', type: 'button', onclick: () => printDoc(doc()) }, 'imprimir / PDF'),
    h('button', { class: 'btn', type: 'button', onclick: async () => { const r = await store.upsert(KIND, null, { ...B.clone(doc()), title: `${doc().title} (cópia)`, metodo: false, review: false }); location.hash = `#/partitura/${r.id}`; } }, 'fazer uma cópia'),
    h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Apagar partitura?', doc().title, 'Apagar')) { stopAll(); await store.remove(id); location.hash = '#/partitura'; } } }, 'apagar'));
  host.append(banner('Montar Partitura', 'compasso por compasso'), head, barsBox, editor, foot);
  drawHead(); drawBars(); drawEditor();
  const off = store.subscribe((i) => { if (!i.kind || (i.kind === KIND && store.get(id))) { drawHead(); drawBars(); drawEditor(); } });
  return () => { off(); stopAll(); };
}

function mountList(host) {
  const box = h('div');
  const draw = () => {
    const all = docs();
    box.replaceChildren(all.length ? h('section', { class: 'card sl-index' }, ...all.map((r) => h('a', { class: 'sl-item', href: `#/partitura/${r.id}` },
      h('strong', {}, r.data.title), h('small', {}, `${r.data.bars.length} compassos · ♩ ${r.data.bpm}${r.data.metodo ? ` · método Beaterista${r.data.review ? ' · a revisar' : ' · conferido ✓'}` : ''}`))))
      : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma partitura ainda.'), h('p', { class: 'muted' }, 'monta um exercício compasso por compasso: grade, acentos, tocar, imprimir.')));
  };
  host.append(banner('Montar Partitura', 'compasso por compasso'), h('div', { class: 'bl-actions pad-x' },
    h('button', { class: 'btn primary', type: 'button', onclick: async () => { const r = await store.upsert(KIND, null, { title: `exercício ${todayKey().split('-').reverse().slice(0, 2).join('/')}`, bpm: 80, bars: [emptyBar(16)] }); location.hash = `#/partitura/${r.id}`; } }, '+ nova partitura')), box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === KIND) draw(); });
}

export function mount(host, parts) { const off = parts && parts[0] ? mountEdit(host, parts[0]) : mountList(host); return () => { off && off(); stopAll(); }; }
