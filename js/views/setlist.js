// Setlist: shows da Bea (espaço BEA) ou apresentação de turma (BEATERISTA). Música, duração, BPM, tom, observações e
// transição; arrastar pra reordenar; tempo total; modo palco (escuro, letra grande, tela acesa); compartilhar em texto.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import * as L from '../setlist-logic.js';
import { audio, click } from '../audio.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { copy } from './kit.js';

const KIND = 'setlist';
const lists = () => store.list(KIND).sort((a, b) => (b.data.date || '').localeCompare(a.data.date || '') || b.updated_at - a.updated_at);
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const SPACE = { bea: 'show (Bea)', beaterista: 'turma (Beaterista)' };
const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : 'sem data');

function songSheet(rec, song, onSaved) {
  const s = song || {};
  sheet(song ? 'Editar música' : 'Nova música', (close) => {
    const f = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);
    const title = h('input', { type: 'text', maxlength: 80, value: s.title || '', placeholder: 'nome da música', 'aria-label': 'Nome da música' });
    const dur = h('input', { type: 'text', inputmode: 'numeric', maxlength: 6, value: s.dur ? L.fmt(s.dur) : '', placeholder: '3:45', 'aria-label': 'Duração' });
    const bpm = h('input', { type: 'number', inputmode: 'numeric', min: 30, max: 260, value: s.bpm || '', placeholder: '120', 'aria-label': 'BPM' });
    const key = h('input', { type: 'text', maxlength: 8, value: s.key || '', placeholder: 'Em', 'aria-label': 'Tom' });
    const notes = h('input', { type: 'text', maxlength: 140, value: s.notes || '', placeholder: 'ex.: entra só no refrão, vassourinha', 'aria-label': 'Observações' });
    const trans = h('input', { type: 'text', maxlength: 100, value: s.trans || '', placeholder: 'ex.: emenda direto, conta 4 no chimbal', 'aria-label': 'Transição pra próxima' });
    const gap = h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 600, value: s.gap || '', placeholder: '0', 'aria-label': 'Segundos de transição' });
    return h('div', { class: 'sheet-body sl-form' }, f('música', title),
      h('div', { class: 'sl-3' }, f('duração', dur), f('BPM', bpm), f('tom', key)),
      f('observações', notes), h('div', { class: 'sl-2' }, f('transição pra próxima', trans), f('segundos', gap)),
      h('div', { class: 'row between' },
        song ? h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Tirar música?', s.title, 'Tirar')) { await store.upsert(KIND, rec.id, { songs: rec.data.songs.filter((x) => x.id !== s.id) }); close(); } } }, 'tirar') : h('span'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          if (!title.value.trim()) { toast('dá um nome pra música'); return; }
          const item = { id: s.id || uid(), title: title.value.trim(), dur: L.parseDur(dur.value), bpm: +bpm.value || null, key: key.value.trim(), notes: notes.value.trim(), trans: trans.value.trim(), gap: +gap.value || 0 };
          const songs = store.get(rec.id).data.songs || [];
          await store.upsert(KIND, rec.id, { songs: song ? songs.map((x) => (x.id === s.id ? item : x)) : [...songs, item] });
          close(); onSaved && onSaved();
        } }, 'salvar')));
  });
}

/** Modo palco: tela escura, letra grande, música atual e a próxima; a tela não apaga (quando o aparelho deixa). */
function stage(rec) {
  let i = 0, lock = null, pulse = null;
  const songs = rec.data.songs || [];
  const root = h('div', { class: 'sl-stage', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Modo palco' });
  const keepAwake = async () => { try { lock = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch { lock = null; } };
  const stopPulse = () => { if (pulse) { clearInterval(pulse.t); pulse = null; } };
  const close = () => { stopPulse(); try { lock && lock.release(); } catch { /* já solto */ } document.removeEventListener('visibilitychange', onVis); root.remove(); };
  const onVis = () => { if (document.visibilityState === 'visible' && root.isConnected) keepAwake(); };
  const draw = () => {
    const s = songs[i]; const nx = songs[i + 1];
    root.replaceChildren(
      h('div', { class: 'sl-st-top' }, h('span', {}, `${i + 1}/${songs.length}`), h('span', {}, rec.data.name),
        h('button', { class: 'sl-st-x', type: 'button', 'aria-label': 'Sair do modo palco', onclick: close }, icon('x', 28))),
      s ? h('div', { class: 'sl-st-now' },
        h('h2', {}, s.title),
        h('p', { class: 'sl-st-meta' }, [s.bpm ? `${s.bpm} BPM` : '', s.key || '', s.dur ? L.fmt(s.dur) : ''].filter(Boolean).join('  ·  ')),
        s.notes ? h('p', { class: 'sl-st-notes' }, s.notes) : null,
        s.trans && nx ? h('p', { class: 'sl-st-trans' }, `↳ ${s.trans}`) : null,
        s.bpm ? h('button', { class: 'sl-st-pulse', type: 'button', 'aria-pressed': String(!!pulse), onclick: (e) => togglePulse(s.bpm, e.currentTarget) }, pulse ? 'parar o clique' : `clique de ${s.bpm}`) : null)
        : h('div', { class: 'sl-st-now' }, h('h2', {}, 'setlist vazia')),
      h('div', { class: 'sl-st-next' }, nx ? `depois: ${nx.title}${nx.bpm ? ` · ${nx.bpm}` : ''}` : 'última música ✦'),
      h('div', { class: 'sl-st-nav' },
        h('button', { type: 'button', disabled: i === 0, onclick: () => { i--; stopPulse(); draw(); } }, '‹ anterior'),
        h('button', { type: 'button', disabled: i >= songs.length - 1, onclick: () => { i++; stopPulse(); draw(); } }, 'próxima ›')));
  };
  function togglePulse(bpm, btn) {
    if (pulse) { stopPulse(); draw(); return; }
    const c = audio(); const beat = 60 / bpm; let n = 0; const t0 = c.currentTime + 0.1;
    // agenda no relógio do áudio, 1 s à frente por vez (nada de setInterval tocando som direto)
    const fill = () => { while (t0 + n * beat < c.currentTime + 1) { click(t0 + n * beat, n % 4 === 0 ? 2 : 1, 0.8); n++; } };
    fill(); pulse = { t: setInterval(fill, 250) }; btn.textContent = 'parar o clique';
  }
  let x0 = null;
  root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) { i = Math.max(0, Math.min(songs.length - 1, i + (dx < 0 ? 1 : -1))); stopPulse(); draw(); } }, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  root.close = close; document.body.append(root); draw(); keepAwake();
  if (!('wakeLock' in navigator)) toast('dica: este aparelho não deixa o app segurar a tela acesa. aumenta o “bloqueio automático” nos ajustes durante o show.', { ms: 5000 });
}

function mountEdit(host, id) {
  const rec0 = store.get(id);
  if (!rec0) { host.append(banner('Setlist'), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'setlist não encontrada.'), h('a', { class: 'btn primary', href: '#/setlist' }, 'voltar'))); return null; }
  const head = h('div'); const list = h('ol', { class: 'sl-songs' }); const foot = h('div');
  let drag = null;
  const draw = () => {
    const rec = store.get(id); if (!rec) return; const d = rec.data; const songs = d.songs || [];
    head.replaceChildren(h('section', { class: 'card pad sl-head' },
      h('input', { class: 'sl-name', type: 'text', maxlength: 60, value: d.name || '', 'aria-label': 'Nome da setlist', onchange: (e) => store.upsert(KIND, id, { name: e.target.value.trim() || 'setlist' }) }),
      h('div', { class: 'sl-row' },
        h('input', { type: 'date', value: d.date || '', 'aria-label': 'Data', onchange: (e) => store.upsert(KIND, id, { date: e.target.value }) }),
        h('select', { 'aria-label': 'Espaço', onchange: (e) => store.upsert(KIND, id, { space: e.target.value }) }, ...Object.entries(SPACE).map(([k, t]) => h('option', { value: k, selected: (d.space || 'bea') === k }, t)))),
      h('div', { class: 'sl-total' }, h('strong', {}, L.fmt(L.total(songs))), h('span', {}, `${songs.length} música${songs.length === 1 ? '' : 's'}`))));
    list.replaceChildren(...songs.map((s, i) => h('li', { class: 'sl-song', 'data-i': i },
      h('span', { class: 'sl-grip', 'aria-hidden': 'true', title: 'arrasta pra mudar de lugar' }, '⋮⋮'),
      h('button', { class: 'sl-song-main', type: 'button', onclick: () => songSheet(store.get(id), s, null) },
        h('strong', {}, `${i + 1}. ${s.title}`),
        h('small', {}, [s.dur ? L.fmt(s.dur) : '', s.bpm ? `${s.bpm} BPM` : '', s.key || ''].filter(Boolean).join(' · ') || 'toca pra completar'),
        s.notes ? h('small', { class: 'sl-notes' }, s.notes) : null,
        s.trans && i < songs.length - 1 ? h('small', { class: 'sl-trans' }, `↳ ${s.trans}${s.gap ? ` (${s.gap}s)` : ''}`) : null),
      h('span', { class: 'sl-move' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Subir ${s.title}`, disabled: i === 0, onclick: () => store.upsert(KIND, id, { songs: L.move(songs, i, i - 1) }) }, icon('up', 18)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Descer ${s.title}`, disabled: i === songs.length - 1, onclick: () => store.upsert(KIND, id, { songs: L.move(songs, i, i + 1) }) }, icon('down', 18))))));
    foot.replaceChildren(h('div', { class: 'bl-actions pad-x' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => songSheet(store.get(id), null, null) }, '+ música'),
      h('button', { class: 'btn', type: 'button', disabled: !songs.length, onclick: () => stage(store.get(id)) }, '◐ modo palco'),
      h('button', { class: 'btn', type: 'button', disabled: !songs.length, onclick: async () => { const t = L.shareText(d); try { if (navigator.share) { await navigator.share({ title: d.name, text: t }); return; } } catch { return; } copy(t, 'setlist copiada'); } }, 'compartilhar'),
      h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Apagar setlist?', d.name, 'Apagar')) { await store.remove(id); location.hash = '#/setlist'; } } }, 'apagar')));
  };
  // arrastar pelo ⋮⋮ (dedo ou mouse)
  list.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('.sl-grip'); if (!g) return;
    const li = g.closest('.sl-song'); drag = { from: +li.dataset.i, li, y0: e.clientY, h: li.getBoundingClientRect().height + 6 };
    li.classList.add('dragging'); g.setPointerCapture(e.pointerId); e.preventDefault();
  });
  list.addEventListener('pointermove', (e) => { if (!drag) return; drag.dy = e.clientY - drag.y0; drag.li.style.transform = `translateY(${drag.dy}px)`; });
  const end = () => {
    if (!drag) return; const songs = store.get(id).data.songs || [];
    const to = Math.max(0, Math.min(songs.length - 1, drag.from + Math.round((drag.dy || 0) / drag.h)));
    drag.li.classList.remove('dragging'); drag.li.style.transform = ''; const from = drag.from; drag = null;
    if (to !== from) store.upsert(KIND, id, { songs: L.move(songs, from, to) });
  };
  list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
  host.append(banner('Setlist', 'monta, ensaia, sobe no palco'), head, h('section', { class: 'card sl-list' }, list), foot,
    h('p', { class: 'pad-x lib-note' }, 'arrasta pelo ⋮⋮ (ou usa as setas) pra mudar a ordem. o tempo total soma músicas + transições. no modo palco: arrasta pro lado pra trocar de música.'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === KIND) draw(); });
}

function mountList(host) {
  const box = h('div');
  const draw = () => {
    const all = lists();
    box.replaceChildren(all.length ? h('section', { class: 'card sl-index' }, ...all.map((r) => h('a', { class: 'sl-item', href: `#/setlist/${r.id}` },
      h('strong', {}, r.data.name || 'setlist'),
      h('small', {}, `${fmtDate(r.data.date)} · ${SPACE[r.data.space || 'bea']} · ${(r.data.songs || []).length} músicas · ${L.fmt(L.total(r.data.songs || []))}`))))
      : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma setlist ainda.'), h('p', { class: 'muted' }, 'monta a do próximo show ou da apresentação da turma.')));
  };
  host.append(banner('Setlist', 'monta, ensaia, sobe no palco'), h('div', { class: 'bl-actions pad-x' },
    h('button', { class: 'btn primary', type: 'button', onclick: async () => { const r = await store.upsert(KIND, null, { name: 'novo show', date: todayKey(), space: 'bea', songs: [] }); location.hash = `#/setlist/${r.id}`; } }, '+ nova setlist')), box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === KIND) draw(); });
}

export function mount(host, parts) {
  const off = parts && parts[0] ? mountEdit(host, parts[0]) : mountList(host);
  return () => { off && off(); const st = document.querySelector('.sl-stage'); if (st) st.close(); }; // sair da tela também para o clique e solta a tela
}
