// Beat Lab: grade de bateria para criar e tocar grooves e viradas, biblioteca de ritmos prontos e "meus ritmos".
// O som sai dos mesmos dados da grade (sintetizado, funciona offline).
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import { clampBpm } from '../music.js';
import { audio, click, snare, kick, hihat, tom, scheduler } from '../audio.js';
import { banner, sheet, toast, confirmSheet, stars } from '../ui.js';

const KEY = 'setting-beatlab';
const FAV = 'setting-beatfav';
const FILL0 = B.PRESETS.find((p) => p.kind === 'virada');
const cfg = () => ({ beat: B.clone(B.PRESETS[0]), fill: B.clone(FILL0), click: false, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (patch) => store.upsert('setting', KEY, patch);
const favs = () => (store.get(FAV) ? store.get(FAV).data.ids || [] : []);
const mine = () => store.list('beat').sort((a, b) => b.updated_at - a.updated_at);
const VOICE = { hh: (t) => hihat(t, 0.9), sn: (t) => snare(t, 0.9), tt: (t) => tom(t, 210), ft: (t) => tom(t, 110), bd: (t) => kick(t) };

/* ---------- tocador único (só um ritmo toca por vez) ---------- */
let player = null;
export function stopBeat() { if (player) { player.run.stop(); const p = player; player = null; p.onStop && p.onStop(); } }
export function playBeat(beat, { withClick = false, onStep, onStop } = {}) {
  stopBeat(); audio();
  const dur = B.stepSec(clampBpm(beat.bpm), beat.steps); const per = B.GRIDS[beat.steps].perBeat;
  const run = scheduler((i) => ({
    at: i * dur,
    play: (t) => { B.hitsAt(beat, i).forEach((r) => VOICE[r](t)); if (withClick && i % per === 0) click(t, i % beat.steps === 0 ? 2 : 1, 0.6); },
    ui: () => onStep && onStep(i % beat.steps),
  }));
  player = { run, onStop, beat };
  return player;
}
export const playingId = () => (player ? player.beat.id : null);

/* ---------- grade ---------- */
function gridEl(beat, onToggle) {
  const labels = B.countLabels(beat.steps); const per = B.GRIDS[beat.steps].perBeat;
  const wrap = h('div', { class: 'bl-grid', role: 'grid', 'aria-label': `Grade de ${beat.steps} passos` });
  wrap.style.setProperty('--steps', beat.steps);
  for (const r of B.usedRows(beat)) {
    wrap.append(h('span', { class: 'bl-row-label', role: 'rowheader' }, r.label));
    beat.rows[r.id].forEach((v, i) => wrap.append(h('button', { type: 'button', class: `bl-cell${v ? ' on' : ''}${i % per === 0 ? ' beat' : ''}`, 'data-step': i, role: 'gridcell', 'aria-pressed': String(!!v), 'aria-label': `${r.label}, ${labels[i]} (passo ${i + 1})`, onclick: () => onToggle(r.id, i) })));
  }
  wrap.append(h('span', { 'aria-hidden': 'true' }), ...labels.map((l, i) => h('span', { class: `bl-count${i % per === 0 ? ' beat' : ''}`, 'aria-hidden': 'true' }, l)));
  return wrap;
}

/** Imagem PNG da grade (para mandar pro aluno ou postar). */
function exportImage(beat) {
  const rows = B.usedRows(beat); const cell = 46, lab = 130, pad = 40, top = 130;
  const c = document.createElement('canvas'); c.width = pad * 2 + lab + cell * beat.steps; c.height = top + rows.length * cell + 90;
  const g = c.getContext('2d');
  g.fillStyle = '#f4eee4'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#b5162b'; g.font = '700 44px "Permanent Marker", "Hanken Grotesk", sans-serif'; g.fillText(beat.name.toUpperCase(), pad, 70);
  g.fillStyle = '#1b1b1b'; g.font = '600 22px "Hanken Grotesk", sans-serif'; g.fillText(`4/4 · ${beat.bpm} BPM · ${B.GRIDS[beat.steps].name} · Beat Lab Beaterista`, pad, 104);
  const per = B.GRIDS[beat.steps].perBeat; const labels = B.countLabels(beat.steps);
  rows.forEach((r, y) => {
    g.fillStyle = '#1b1b1b'; g.font = '600 24px "Hanken Grotesk", sans-serif'; g.fillText(r.label, pad, top + y * cell + 31);
    beat.rows[r.id].forEach((v, x) => {
      const X = pad + lab + x * cell, Y = top + y * cell;
      g.fillStyle = v ? '#b5162b' : '#ffffff'; g.fillRect(X + 3, Y + 3, cell - 6, cell - 6);
      g.strokeStyle = x % per === 0 ? '#1b1b1b' : '#9a948a'; g.lineWidth = 2; g.strokeRect(X + 3, Y + 3, cell - 6, cell - 6);
    });
  });
  g.fillStyle = '#1b1b1b'; g.font = '600 20px "Hanken Grotesk", sans-serif';
  labels.forEach((l, x) => g.fillText(l, pad + lab + x * cell + cell / 2 - 6, top + rows.length * cell + 32));
  c.toBlob(async (blob) => {
    const name = `${beat.name.replace(/[^\wÀ-ú -]/g, '').trim() || 'ritmo'}.png`;
    const file = new File([blob], name, { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: beat.name }); return; } } catch { return; }
    const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
  }, 'image/png');
}

function tabsEl(on) {
  return h('nav', { class: 'chips lib-tabs bl-tabs', 'aria-label': 'Beat Lab' },
    [['groove', 'Groove', '#/beatlab'], ['viradas', 'Viradas', '#/beatlab/viradas'], ['meus', 'Meus ritmos', '#/beatlab/meus'], ['biblioteca', 'Biblioteca', '#/beatlab/biblioteca']]
      .map(([k, t, href]) => h('a', { class: `lib-tab${on === k ? ' on' : ''}`, href, 'aria-current': on === k ? 'page' : null }, t)));
}

/* ---------- editor (groove e viradas) ---------- */
function mountEditor(host, kind) {
  const pool = () => B.PRESETS.filter((p) => p.kind === (kind === 'viradas' ? 'virada' : 'groove'));
  // groove e viradas guardam cada um o seu rascunho
  const slot = kind === 'viradas' ? 'fill' : 'beat';
  let beat = cfg()[slot];
  let cur = -1;
  const nameEl = h('strong', { class: 'bl-name' });
  const bpmEl = h('output', { class: 'bl-bpm', 'aria-live': 'polite' });
  const playBtn = h('button', { class: 'bl-play', type: 'button' });
  const gridBox = h('div', { class: 'bl-grid-wrap' });
  const resBox = h('div', { class: 'chips bl-res', role: 'radiogroup', 'aria-label': 'Resolução' });
  const clickBtn = h('button', { class: 'btn small', type: 'button' });
  const persist = () => save({ [slot]: beat });
  const isPlaying = () => player && player.owner === 'editor';
  const paintPlay = () => { const on = isPlaying(); playBtn.replaceChildren(icon(on ? 'stop' : 'play', 28)); playBtn.setAttribute('aria-label', on ? 'Parar' : 'Tocar'); playBtn.classList.toggle('on', on); };
  const drum = h('span', { class: 'bl-drum', 'aria-hidden': 'true' }, h('img', { class: 'bl-sticks', src: 'assets/mural/sticks.svg', alt: '' }), h('img', { class: 'bl-drum-img', src: 'assets/mural/drum.svg', alt: '' }));
  const hit = (i) => { if (i < 0 || !B.hitsAt(beat, i).some((r) => r !== 'hh')) return; drum.classList.remove('hit'); void drum.offsetWidth; drum.classList.add('hit'); };
  const mark = (i) => { hit(i); cur = i; gridBox.querySelectorAll('.bl-cell').forEach((c) => c.classList.toggle('now', Number(c.dataset.step) === i)); };
  const start = () => { const p = playBeat(beat, { withClick: cfg().click, onStep: mark, onStop: () => { mark(-1); paintPlay(); } }); p.owner = 'editor'; paintPlay(); };
  const restartIfPlaying = () => { if (isPlaying()) start(); };
  function draw() {
    nameEl.textContent = beat.name;
    bpmEl.textContent = String(beat.bpm);
    gridBox.replaceChildren(gridEl(beat, (r, i) => { beat = { ...B.toggle(beat, r, i), mine: true }; persist(); draw(); restartIfPlaying(); }));
    resBox.replaceChildren(...Object.entries(B.GRIDS).map(([n, g]) => h('button', { type: 'button', class: `lib-tab${beat.steps === Number(n) ? ' on' : ''}`, role: 'radio', 'aria-checked': String(beat.steps === Number(n)), onclick: () => { beat = { ...B.resize(beat, Number(n)), mine: true }; persist(); draw(); restartIfPlaying(); } }, g.name)));
    clickBtn.textContent = cfg().click ? 'tocar junto: com clique ✓' : 'tocar junto: sem clique';
    clickBtn.setAttribute('aria-pressed', String(!!cfg().click));
    paintPlay(); if (cur >= 0) mark(cur);
  }
  const cycle = (d) => { const list = pool(); const i = list.findIndex((p) => p.id === beat.id); beat = B.clone(list[(i + d + list.length) % list.length]); persist(); draw(); restartIfPlaying(); };
  const setBpm = (v) => { beat = { ...beat, bpm: clampBpm(v) }; persist(); draw(); restartIfPlaying(); };
  playBtn.addEventListener('click', () => (isPlaying() ? stopBeat() : start()));
  clickBtn.addEventListener('click', async () => { await save({ click: !cfg().click }); draw(); restartIfPlaying(); });

  const saveMine = () => sheet('Salvar em meus ritmos', (close) => {
    const name = h('input', { type: 'text', maxlength: 60, value: beat.mine && beat.name !== 'Meu ritmo' ? beat.name : '', placeholder: 'ex.: groove da aula do Pedro', 'aria-label': 'Nome do ritmo' });
    return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name),
      h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'button', onclick: async (e) => {
        const btn = e.currentTarget;
        const n = name.value.trim() || `${beat.name} (meu)`;
        const rec = await store.upsert('beat', beat.recId || null, { beat: { ...beat, name: n, mine: true } });
        beat = { ...beat, name: n, mine: true, recId: rec.id, id: rec.id }; persist(); stars(btn); close(); toast('salvo em meus ritmos ✓'); draw();
      } }, 'salvar')));
  });

  const head = banner('Beat Lab', 'crie, toque, estude.'); head.append(drum); // o tambor do título pula junto com caixa e bumbo
  host.append(head, tabsEl(kind === 'viradas' ? 'viradas' : 'groove'),
    h('section', { class: 'card pad bl-card' },
      h('div', { class: 'bl-head' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Ritmo anterior', onclick: () => cycle(-1) }, icon('back', 22)), nameEl,
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Próximo ritmo', onclick: () => cycle(1) }, h('span', { style: { display: 'inline-flex', transform: 'scaleX(-1)' } }, icon('back', 22)))),
      h('div', { class: 'bl-tempo' },
        h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => setBpm(beat.bpm - 5) }, '−'), bpmEl,
        h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => setBpm(beat.bpm + 5) }, '+'), playBtn),
      gridBox, resBox,
      h('div', { class: 'bl-actions' }, clickBtn,
        h('button', { class: 'btn small', type: 'button', onclick: () => { beat = { ...B.clear(beat), name: 'Meu ritmo', mine: true, recId: null, id: 'novo' }; persist(); draw(); } }, 'limpar'),
        h('button', { class: 'btn small primary', type: 'button', onclick: saveMine }, 'salvar'),
        h('button', { class: 'btn small', type: 'button', onclick: () => exportImage(beat) }, 'exportar imagem'))),
    h('p', { class: 'pad-x lib-note' }, 'toque nos quadradinhos para ligar e desligar as notas. dá pra mudar enquanto toca.'));
  draw();
  return () => { if (isPlaying()) stopBeat(); };
}

/* ---------- lista (biblioteca e meus ritmos) ---------- */
function beatRow(b, { fav, onFav, onOpen, onDelete }, repaint) {
  const playing = playingId() === b.id;
  return h('div', { class: `bl-item${playing ? ' playing' : ''}` },
    playing ? h('span', { class: 'eq', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')) : null,
    h('button', { class: `bl-play small${playing ? ' on' : ''}`, type: 'button', 'aria-label': `${playing ? 'Parar' : 'Tocar'} ${b.name}`, onclick: () => { if (playing) stopBeat(); else playBeat(b, { onStop: repaint }); repaint(); } }, icon(playing ? 'stop' : 'play', 20)),
    h('button', { class: 'bl-item-main', type: 'button', onclick: onOpen }, h('strong', {}, b.name), h('small', {}, b.kind === 'virada' ? `1 compasso · ${b.bpm} BPM` : `4/4 · ${b.bpm} BPM · ${B.GRIDS[b.steps].name}`)),
    onFav ? h('button', { class: `bl-fav${fav ? ' on' : ''}`, type: 'button', 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Tirar dos' : 'Pôr nos'} favoritos: ${b.name}`, onclick: onFav }, fav ? '♥' : '♡') : null,
    onDelete ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${b.name}`, onclick: onDelete }, icon('x', 18)) : null,
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Abrir ${b.name} no editor`, onclick: onOpen }, h('span', { style: { display: 'inline-flex', transform: 'scaleX(-1)' } }, icon('back', 18))));
}
const openInEditor = async (b) => { stopBeat(); const fill = b.kind === 'virada'; await save({ [fill ? 'fill' : 'beat']: B.clone(b) }); location.hash = fill ? '#/beatlab/viradas' : '#/beatlab'; };

function mountLibrary(host) {
  let style = '', q = '';
  const search = h('input', { type: 'search', placeholder: 'buscar ritmo…', 'aria-label': 'Buscar ritmo', enterkeyhint: 'search' });
  const chips = h('div', { class: 'chips lib-tabs' });
  const list = h('div', { class: 'card bl-list' });
  const draw = () => {
    chips.replaceChildren(...[['', 'Todos'], ['fav', '♥ favoritos'], ...B.STYLES.map((s) => [s, s])].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${style === k ? ' on' : ''}`, 'aria-pressed': String(style === k), onclick: () => { style = k; draw(); } }, t)));
    const f = favs();
    const shown = B.PRESETS.filter((b) => (!style || (style === 'fav' ? f.includes(b.id) : b.style === style)) && (!q || b.name.toLowerCase().includes(q)));
    list.replaceChildren(...(shown.length ? shown.map((b) => beatRow(b, {
      fav: f.includes(b.id),
      onFav: () => store.upsert('setting', FAV, { ids: f.includes(b.id) ? f.filter((x) => x !== b.id) : [...f, b.id] }),
      onOpen: () => openInEditor(b),
    }, draw)) : [h('p', { class: 'muted pad' }, 'nenhum ritmo com esse filtro.')]));
  };
  search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); draw(); });
  host.append(banner('Biblioteca de Ritmos', 'toque, favorite e abra no editor'), tabsEl('biblioteca'),
    h('div', { class: 'card pad' }, search), chips, list,
    h('p', { class: 'pad-x lib-note' }, 'grooves de referência para começar. os 22 ritmos do método Beaterista entram aqui depois que você revisar as transcrições.'));
  draw();
  const off = store.subscribe((i) => { if (!i.kind || i.id === FAV) draw(); });
  return () => { off(); stopBeat(); };
}

function mountMine(host) {
  const list = h('div', { class: 'card bl-list' });
  const draw = () => {
    const recs = mine();
    list.replaceChildren(...(recs.length ? recs.map((r) => { const b = { ...r.data.beat, id: r.id, recId: r.id }; return beatRow(b, {
      onOpen: () => openInEditor(b),
      onDelete: async () => { if (await confirmSheet('Apagar ritmo?', b.name, 'Apagar')) { if (playingId() === b.id) stopBeat(); await store.remove(r.id); } },
    }, draw); }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum ritmo salvo ainda.'), h('p', { class: 'muted' }, 'crie no Groove ou nas Viradas e toque em “salvar”.'))]));
  };
  host.append(banner('Meus Ritmos', 'o que você criou no Beat Lab'), tabsEl('meus'), list,
    h('a', { class: 'btn primary wide', href: '#/beatlab' }, '+ criar ritmo'));
  draw();
  const off = store.subscribe((i) => { if (!i.kind || i.kind === 'beat') draw(); });
  return () => { off(); stopBeat(); };
}

export function mount(host, parts) {
  const [k] = parts || [];
  if (k === 'biblioteca') return mountLibrary(host);
  if (k === 'meus') return mountMine(host);
  return mountEditor(host, k === 'viradas' ? 'viradas' : 'groove');
}
