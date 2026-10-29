// Montar Partitura: vários compassos de bateria, cada um editado na mesma grade do Beat Lab (com linha de acentos).
// Toca tudo (com loop e compasso aceso), exporta imagem, WAV e impressão/PDF. Os exercícios do método Beaterista
// moram aqui como partituras privadas (só na conta da Bea), com o selo "a revisar" até ela conferir.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, click, scheduler, perfToCtx } from '../audio.js';
import { quantize } from '../touchkit.js';
import { banner, sheet, toast, confirmSheet, stars } from '../ui.js';
import { gridEl, VOICE, velOf, stopBeat } from './beatlab.js';
import { renderWav } from '../wav.js';
import { sendCanvases } from '../send-folder.js';
import { tipBox } from '../tipbox.js';

const KIND = 'partitura';
const docs = () => store.list(KIND).sort((a, b) => (b.data.metodo ? 0 : 1) - (a.data.metodo ? 0 : 1) || b.updated_at - a.updated_at);
const emptyBar = (steps = 16) => ({ steps, rows: Object.fromEntries(B.ROWS.map((r) => [r.id, Array(steps).fill(0)])), acc: Array(steps).fill(0), hands: Array(steps).fill(''), note: '' });
const HANDS = ['', 'D', 'E', 'B']; // mão direita, esquerda, bumbo
const NOTE_CHIPS = ['intro', 'verso', 'refrão', 'ponte', 'virada', 'pausa', 'prato', 'ghost', 'só pé', 'mais forte', 'mais fraco'];
const safeName = (t) => String(t || '').replace(/[^\wÀ-ú -]/g, '').trim() || 'partitura';

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
function barSvg(bar, n, width = 340, color = false) {
  const f = h('figure', { class: 'pt-bar-svg' }); f.innerHTML = N.toSVG(N.layout(bar, { width, full: true, color })); // números nossos, sem texto de usuário
  return f;
}
function shareBlob(blob, name, title) {
  const file = new File([blob], name, { type: blob.type });
  (async () => {
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return; } } catch { return; }
    const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
  })();
}
function partituraCanvas(doc) {
  const W = 1240, cols = 2, cw = (W - 120) / cols; const L = N.layout(doc.bars.reduce((m, b) => (N.layout(b, { width: cw / 2, full: true }).h > N.layout(m, { width: cw / 2, full: true }).h ? b : m), doc.bars[0]), { width: cw / 2, full: true }); const ch = L.h * 2 + 52;
  const rows = Math.ceil(doc.bars.length / cols); const c = document.createElement('canvas'); c.width = W; c.height = 190 + rows * ch + 60;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#b5162b'; g.font = '700 46px "Permanent Marker", "Hanken Grotesk", sans-serif'; g.fillText(doc.title.toUpperCase(), 60, 90);
  g.fillStyle = '#1b1b1b'; g.font = '600 24px "Hanken Grotesk", sans-serif'; g.fillText(`♩ = ${doc.bpm} · ${doc.bars.length} compassos${doc.metodo ? ' · método Beaterista' : ''}`, 60, 132);
  doc.bars.forEach((bar, i) => {
    const x = 60 + (i % cols) * cw, y = 170 + Math.floor(i / cols) * ch;
    g.fillStyle = '#7a6f66'; g.font = '600 18px "Hanken Grotesk", sans-serif'; g.fillText(String(i + 1), x, y + 16);
    g.save(); g.translate(x + 10, y + 10); N.draw(g, N.layout(bar, { width: cw / 2 - 10, full: true, color: !!doc.color }), { scale: 2 }); g.restore();
    if (bar.note) { g.fillStyle = '#a31d30'; g.font = '700 20px "Hanken Grotesk", sans-serif'; g.fillText(String(bar.note).slice(0, 48), x + 10, y + 10 + L.h * 2 + 22); }
  });
  g.fillStyle = '#7a6f66'; g.font = '600 18px "Hanken Grotesk", sans-serif'; g.fillText('Beaterista', W - 170, c.height - 24);
  return c;
}
function exportPng(doc) {
  const c = partituraCanvas(doc);
  c.toBlob((b) => shareBlob(b, `${safeName(doc.title)}.png`, doc.title), 'image/png');
}
function printDoc(doc) {
  const area = h('div', { class: 'pt-print' }, h('h1', {}, doc.title), h('p', {}, `♩ = ${doc.bpm} · ${doc.bars.length} compassos${doc.metodo ? ` · baseado no método Beaterista (${doc.source || ''})` : ''}`),
    h('div', { class: 'pt-print-grid' }, ...doc.bars.map((b, i) => h('div', {}, h('small', {}, String(i + 1)), barSvg(b, i, 360, !!doc.color), b.note ? h('small', { class: 'pt-note' }, b.note) : null))));
  document.body.append(area); document.documentElement.classList.add('printing-pt');
  const done = () => { area.remove(); document.documentElement.classList.remove('printing-pt'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  try { window.print(); } catch { toast('este aparelho não abriu a impressão. use “imagem” e imprima a foto.'); }
  setTimeout(() => { if (area.isConnected && !matchMedia('print').matches) done(); }, 60000);
}

/* ---------- escrever tocando (chimbal, caixa e bumbo) ---------- */
const QKEY = 'setting-partitura';
const quick = () => (store.get(QKEY) ? store.get(QKEY).data.quick !== false : true);
const REC_PADS = [['hh', 'chimbal', 'j'], ['sn', 'caixa', 'f'], ['bd', 'bumbo', ' ']];
/** Folha com 3 pads grandes: conta 4, você toca 1 compasso e o app escreve (arredonda pra semicolcheia). */
function recordSheet(bpm0, onUse, label) {
  let pct = 1; let rec = null; let take = null; let metro = [];
  sheet('Tocar e escrever', (close) => {
    const body = h('div', { class: 'sheet-body pt-rec' });
    const status = h('p', { class: 'tr-status', 'aria-live': 'polite' }, 'aperte gravar: conta 4 e você toca 1 compasso.');
    const hit = (id, perfMs) => {
      const c = audio(); VOICE[id](c.currentTime, 1);
      const el = body.querySelector(`[data-pad="${id}"]`); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      if (rec) rec.hits.push({ t: perfToCtx(perfMs) - rec.t0, id });
    };
    const onKey = (e) => { const p = REC_PADS.find((x) => x[2] === e.key.toLowerCase()); if (!p || e.repeat) return; e.preventDefault(); hit(p[0], e.timeStamp); };
    document.addEventListener('keydown', onKey);
    const pads = h('div', { class: 'pt-rec-pads' }, ...REC_PADS.map(([id, name]) => { const b = h('button', { type: 'button', class: `tk-pad p-${id}`, 'data-pad': id, 'aria-label': name }, h('span', {}, name)); b.style.setProperty('--c', B.COLORS[id]); b.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(id, e.timeStamp || performance.now()); }); return b; }));
    const go = () => {
      metro.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); metro = [];
      const bpm = Math.round(bpm0 * pct); const c = audio(); const q = 60 / bpm; const t0 = c.currentTime + 0.3 + 4 * q;
      for (let i = 0; i < 4; i++) metro.push(click(t0 - (4 - i) * q, i === 0 ? 2 : 1));
      for (let b = 0; b < 4; b++) metro.push(click(t0 + b * q, b === 0 ? 2 : 1, 0.6));
      rec = { t0, hits: [], bpm }; take = null; body.clock = () => perfToCtx(performance.now()) - t0;
      status.textContent = 'conta 4… e toca!'; draw();
      rec.timer = setTimeout(() => { const r = rec; rec = null; take = quantize(r.hits, { bpm: r.bpm, bars: 1 }); status.textContent = take.dropped ? `${take.dropped} toque(s) longe da grade ficaram de fora.` : 'pronto! confere aí embaixo.'; draw(); }, (t0 - c.currentTime + 4 * q + 0.35) * 1000);
    };
    const draw = () => {
      const prev = take ? h('figure', { class: 'cb-bar' }) : null; if (prev) prev.innerHTML = N.toSVG(N.layout(take.bars[0], { width: 340, full: false }));
      body.replaceChildren(
        h('div', { class: 'tr-line' }, h('span', { class: 'tp-lab' }, 'andamento'), h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Andamento da gravação' },
          ...[[1, `${bpm0} (o da partitura)`], [0.75, `${Math.round(bpm0 * 0.75)}`], [0.5, `${Math.round(bpm0 * 0.5)}`]].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(pct === v), class: `lib-tab${pct === v ? ' on' : ''}`, onclick: () => { pct = v; draw(); } }, t)))),
        pads, status,
        h('div', { class: 'row ft-row' }, rec ? h('button', { class: 'bl-play on', type: 'button', 'aria-label': 'Gravando', disabled: true }, icon('stop', 24)) : h('button', { class: 'bl-play tk-rec', type: 'button', 'aria-label': 'Gravar', onclick: go }, h('i', { class: 'tk-dot' }))),
        prev, take ? h('div', { class: 'row ft-row' }, h('button', { class: 'btn primary', type: 'button', onclick: (e) => { stars(e.currentTarget); onUse(take.bars[0]); close(); } }, label), h('button', { class: 'btn', type: 'button', onclick: go }, 'gravar de novo')) : null,
        h('p', { class: 'muted' }, 'o app arredonda pra semicolcheia mais perto: é um rascunho, ajusta na grade se precisar. no computador: J chimbal, F caixa, espaço bumbo.'));
    };
    draw();
    body.cleanup = () => { document.removeEventListener('keydown', onKey); if (rec) clearTimeout(rec.timer); metro.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); };
    return body;
  }, { onClose: () => { const b = document.querySelector('.pt-rec'); if (b && b.cleanup) b.cleanup(); } });
}

/** Letras sugeridas: bumbo = B, o resto alterna D e E (começando na direita). Dá pra trocar uma a uma. */
function autoHands(bar) {
  let right = true; const out = Array(bar.steps).fill('');
  for (let i = 0; i < bar.steps; i++) {
    const on = B.hitsAt(bar, i); if (!on.length) continue;
    if (on.includes('bd') && on.length === 1) { out[i] = 'B'; continue; }
    out[i] = right ? 'D' : 'E'; right = !right;
  }
  return out;
}
/** Detalhe do compasso (intro, virada, dica…): texto curto que aparece embaixo dele na tela, na imagem e na impressão. */
function noteField(bar, onSave) {
  const input = h('input', { type: 'text', maxlength: 60, value: bar.note || '', placeholder: 'detalhe deste compasso (ex.: virada nos toms)', 'aria-label': 'Detalhe do compasso' });
  input.addEventListener('change', () => onSave(input.value.trim()));
  return h('div', { class: 'pt-notefield' }, h('span', { class: 'tp-lab' }, 'detalhe'), input,
    h('div', { class: 'chips lib-tabs' }, ...NOTE_CHIPS.map((t) => h('button', { type: 'button', class: 'lib-tab', onclick: () => onSave(bar.note === t ? '' : t) }, t))));
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
      d.songId && store.get(d.songId) ? h('p', { class: 'pt-badge' }, '♪ partitura da música ', h('a', { class: 'link', href: '#/repertorio' }, store.get(d.songId).data.title)) : null,
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
        h('div', { class: 'chips lib-tabs pt-look', role: 'radiogroup', 'aria-label': 'Aparência da partitura' }, ...[[false, 'normal'], [true, 'colorido']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(!!d.color === v), class: `lib-tab${!!d.color === v ? ' on' : ''}`, onclick: () => save({ color: v }) }, t))),
        d.metodo && d.review ? h('button', { class: 'btn small', type: 'button', onclick: () => save({ review: false }) }, 'marcar como conferido') : null)));
    paintPlay();
  }
  function drawBars() {
    const d = doc();
    barsBox.replaceChildren(...d.bars.map((bar, i) => h('button', { class: `pt-bar${sel === i ? ' sel' : ''}${playingBar === i ? ' now' : ''}`, type: 'button', 'aria-label': `Compasso ${i + 1}${sel === i ? ' (editando)' : ''}`, onclick: () => { sel = sel === i ? null : i; drawBars(); drawEditor(); } },
      h('span', { class: 'pt-n' }, String(i + 1)), barSvg(bar, i, 340, !!d.color), bar.note ? h('small', { class: 'pt-note' }, bar.note) : null)),
      h('div', { class: 'pt-add' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { setBars([...d.bars, emptyBar(16)]); sel = d.bars.length; } }, '+ compasso vazio'),
        h('button', { class: 'btn small', type: 'button', onclick: pickRhythm }, '+ de um ritmo'),
        h('button', { class: 'btn small', type: 'button', onclick: () => recordSheet(d.bpm, (nb) => { const dd = doc(); setBars([...dd.bars, nb]); sel = dd.bars.length; }, 'adicionar compasso') }, '+ tocando')));
  }
  function drawEditor() {
    const d = doc();
    if (sel == null || !d.bars[sel]) { editor.replaceChildren(h('p', { class: 'pad-x lib-note' }, 'toque num compasso pra editar. toque de novo pra fechar.')); return; }
    const bar = d.bars[sel];
    const upd = (nb) => { const bars = d.bars.slice(); bars[sel] = nb; setBars(bars); };
    editor.replaceChildren(h('section', { class: 'card pad pt-edit' },
      h('div', { class: 'row between' }, h('strong', {}, `compasso ${sel + 1}`),
        h('div', { class: 'chips lib-tabs tp-chips' }, ...[[8, 'colch.'], [12, 'terc.'], [16, 'semic.']].map(([n, t]) => h('button', { type: 'button', class: `lib-tab${bar.steps === n ? ' on' : ''}`, onclick: () => upd(B.resize(bar, n)) }, t)))),
      h('div', { class: 'chips lib-tabs pt-mode', role: 'radiogroup', 'aria-label': 'Peças na grade' },
        ...[[true, 'chimbal, caixa e bumbo'], [false, 'pauta completa']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(quick() === v), class: `lib-tab${quick() === v ? ' on' : ''}`, onclick: () => store.upsert('setting', QKEY, { quick: v }).then(drawEditor) }, t))),
      gridEl(bar, (r, i) => upd(B.toggle(bar, r, i)), { ...(quick() ? { full: false } : { full: true, accent: true, onAccent: (i) => upd(B.toggleAcc(bar, i)) }), color: !!d.color, hands: true, onHand: (i) => { const hs = (bar.hands || Array(bar.steps).fill('')).slice(); hs[i] = HANDS[(HANDS.indexOf(hs[i] || '') + 1) % HANDS.length]; upd({ ...bar, hands: hs }); } }),
      h('div', { class: 'row pt-hands' }, h('small', { class: 'muted' }, 'letras em cima das notas: toque na linha “Mão” (D direita · E esquerda · B bumbo)'),
        h('button', { class: 'btn small', type: 'button', onclick: () => upd({ ...bar, hands: autoHands(bar) }) }, 'preencher sozinho'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => upd({ ...bar, hands: Array(bar.steps).fill('') }) }, 'limpar letras')),
      noteField(bar, (note) => upd({ ...bar, note })),
      h('button', { class: 'btn small', type: 'button', onclick: () => recordSheet(d.bpm, (nb) => upd(nb), `usar no compasso ${sel + 1}`) }, '✋ tocar e escrever neste compasso'),
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
    h('button', { class: 'btn', type: 'button', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = 'gerando…'; try { const d = doc(); shareBlob(await renderWav(d), `${safeName(d.title)}.wav`, d.title); } catch { toast('não consegui gerar o áudio neste aparelho.'); } b.disabled = false; b.textContent = 'áudio (WAV)'; } }, 'áudio (WAV)'),
    h('button', { class: 'btn', type: 'button', onclick: () => printDoc(doc()) }, 'imprimir / PDF'),
    h('button', { class: 'btn', type: 'button', onclick: () => sendCanvases([partituraCanvas(doc())], safeName(doc().title)) }, '📁 enviar pra pasta'),
    h('button', { class: 'btn', type: 'button', onclick: async () => { const r = await store.upsert(KIND, null, { ...B.clone(doc()), title: `${doc().title} (cópia)`, metodo: false, review: false }); location.hash = `#/partitura/${r.id}`; } }, 'fazer uma cópia'),
    h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Apagar partitura?', doc().title, 'Apagar')) { stopAll(); await store.remove(id); location.hash = '#/partitura'; } } }, 'apagar'));
  host.append(banner('Montar Partitura', 'compasso por compasso'), head, barsBox, editor, foot);
  drawHead(); drawBars(); drawEditor();
  const off = store.subscribe((i) => { if (!i.kind || (i.kind === KIND && store.get(id))) { drawHead(); drawBars(); drawEditor(); } });
  return () => { off(); stopAll(); };
}

/** Nova partitura na hora: nome, andamento, quantos compassos e a figura (colcheias, tercinas ou semicolcheias). */
export function newScoreSheet({ title = '', songId = null, onCreated } = {}) {
  sheet('Nova partitura', (close) => {
    let steps = 16; let n = 4; let color = false;
    const name = h('input', { type: 'text', maxlength: 80, value: title || `exercício ${todayKey().split('-').reverse().slice(0, 2).join('/')}`, 'aria-label': 'Nome da partitura' });
    const bpm = h('input', { type: 'number', inputmode: 'numeric', min: 40, max: 220, value: '80', 'aria-label': 'BPM' });
    const chips = (key, list, get, set) => h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': key }, ...list.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(get() === v), class: `lib-tab${get() === v ? ' on' : ''}`, onclick: (e) => { set(v); [...e.currentTarget.parentElement.children].forEach((b) => { const on = b === e.currentTarget; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); } }, t)));
    return h('div', { class: 'sheet-body' },
      h('label', { class: 'field' }, h('span', {}, 'nome'), name),
      h('div', { class: 'sl-2' }, h('label', { class: 'field' }, h('span', {}, 'BPM'), bpm)),
      h('div', { class: 'field' }, h('span', {}, 'quantos compassos'), chips('Compassos', [1, 2, 4, 8].map((x) => [x, String(x)]), () => n, (v) => { n = v; })),
      h('div', { class: 'field' }, h('span', {}, 'figura'), chips('Figura', [[8, 'colcheias'], [12, 'tercinas'], [16, 'semicolcheias']], () => steps, (v) => { steps = v; })),
      h('div', { class: 'field' }, h('span', {}, 'aparência'), chips('Aparência', [[false, 'normal'], [true, 'colorido']], () => color, (v) => { color = v; })),
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        const doc = { title: name.value.trim() || 'partitura', bpm: Math.max(40, Math.min(220, Number(bpm.value) || 80)), bars: Array.from({ length: n }, () => emptyBar(steps)), color, created: Date.now() };
        if (songId) doc.songId = songId;
        const r = await store.upsert(KIND, null, doc); close();
        if (onCreated) onCreated(r); else location.hash = `#/partitura/${r.id}`;
      } }, 'criar'));
  });
}

function mountList(host) {
  const box = h('div');
  const draw = () => {
    const all = docs();
    box.replaceChildren(all.length ? h('section', { class: 'card sl-index pt-index' }, ...all.map((r) => h('div', { class: 'pt-row' }, h('a', { class: 'sl-item', href: `#/partitura/${r.id}` },
      h('strong', {}, r.data.title), h('small', {}, `${r.data.bars.length} compassos · ♩ ${r.data.bpm}${r.data.color ? ' · colorido' : ''}${r.data.metodo ? ` · método Beaterista${r.data.review ? ' · a revisar' : ' · conferido ✓'}` : ''}`)),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${r.data.title}`, onclick: async () => { if (await confirmSheet('Apagar partitura?', r.data.title, 'Apagar')) { await store.remove(r.id); toast('partitura apagada', { ms: 1500 }); } } }, icon('trash', 18)))))
      : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma partitura ainda.'), h('p', { class: 'muted' }, 'cria uma na hora: escolhe os compassos, a figura e escreve na grade.')));
  };
  host.append(banner('Montar Partitura', 'compasso por compasso'), h('div', { class: 'bl-actions pad-x' },
    h('button', { class: 'btn primary', type: 'button', onclick: () => newScoreSheet() }, '+ nova partitura')), box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === KIND) draw(); });
}

export function mount(host, parts) { const off = parts && parts[0] ? mountEdit(host, parts[0]) : mountList(host); tipBox(host, 'partitura'); return () => { off && off(); stopAll(); }; }
