import { h, icon, debounce } from '../util.js';
import * as store from '../store.js';
import { sheet, confirmSheet, toast, banner } from '../ui.js';

export const HOME_NOTE_KEY = 'setting-home-note';
export const homeNoteId = () => { const s = store.get(HOME_NOTE_KEY); return s ? s.data.noteId : null; };
export const setHomeNote = (noteId) => store.upsert('setting', HOME_NOTE_KEY, { noteId });

/** Editor com autosave. Cria a nota só quando há texto. */
export function noteEditor(rec, close) {
  let id = rec ? rec.id : null;
  const d = rec ? rec.data : { title: '', body: '' };
  const title = h('input', { type: 'text', value: d.title || '', placeholder: 'título (opcional)', maxlength: 120, 'aria-label': 'Título da nota' });
  const body = h('textarea', { rows: 9, placeholder: 'escreve aí, sem pressão…', 'aria-label': 'Texto da nota' }, d.body || '');
  const status = h('small', { class: 'saved', 'aria-live': 'polite' }, id ? 'salvo automaticamente' : '');
  const save = debounce(async () => {
    if (!id && !title.value.trim() && !body.value.trim()) return;
    const rec2 = await store.upsert('note', id, { title: title.value, body: body.value, ...(id ? {} : { pinned: false, archived: false }) });
    id = rec2.id;
    status.textContent = 'salvo ✓';
  }, 500);
  [title, body].forEach((el) => el.addEventListener('input', () => { status.textContent = 'salvando…'; save(); }));
  const onHide = () => save.flush();
  addEventListener('pagehide', onHide);
  return h('div', { class: 'sheet-body' },
    h('label', { class: 'field' }, h('span', {}, 'título'), title),
    h('label', { class: 'field' }, h('span', {}, 'nota'), body),
    status,
    h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { save.flush(); removeEventListener('pagehide', onHide); close(); } }, 'Pronto')));
}

const titleOf = (d) => (d.title && d.title.trim()) || (d.body || '').trim().split('\n')[0].slice(0, 60) || 'sem título';

export function mount(host) {
  let showArchived = false, q = '';
  const list = h('div', { class: 'notes' });
  const search = h('input', { type: 'search', placeholder: 'buscar nota…', 'aria-label': 'Buscar notas', enterkeyhint: 'search' });
  search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); draw(); });
  const tabs = h('div', { class: 'seg', role: 'tablist' });

  function draw() {
    tabs.replaceChildren(
      ...[['ativas', false], ['arquivadas', true]].map(([t, v]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(showArchived === v), class: showArchived === v ? 'on' : '', onclick: () => { showArchived = v; draw(); } }, t)));
    const hn = homeNoteId();
    const items = store.list('note')
      .filter((r) => !!r.data.archived === showArchived)
      .filter((r) => !q || `${r.data.title} ${r.data.body}`.toLowerCase().includes(q))
      .sort((a, b) => (b.data.pinned ? 1 : 0) - (a.data.pinned ? 1 : 0) || b.updated_at - a.updated_at);
    list.replaceChildren(...(items.length ? items.map((r, i) => {
      const d = r.data;
      return h('article', { class: `note-card tilt${i % 3}` },
        h('span', { class: 'tape', 'aria-hidden': 'true' }),
        h('button', { class: 'note-open', type: 'button', onclick: () => sheet('Nota', (close) => noteEditor(r, close)) },
          h('strong', {}, titleOf(d)),
          h('span', { class: 'note-prev' }, ((d.title && d.title.trim()) ? (d.body || '') : (d.body || '').split('\n').slice(1).join('\n')).slice(0, 140))),
        h('div', { class: 'note-actions' },
          h('button', { class: `icon-btn${d.pinned ? ' on' : ''}`, type: 'button', 'aria-pressed': String(!!d.pinned), 'aria-label': d.pinned ? 'Desafixar do topo' : 'Fixar no topo', onclick: () => store.upsert('note', r.id, { pinned: !d.pinned }) }, icon('pin', 20)),
          h('button', { class: `icon-btn${hn === r.id ? ' on' : ''}`, type: 'button', 'aria-label': hn === r.id ? 'Esta é a nota da home' : 'Mostrar na home', onclick: async () => { await setHomeNote(r.id); toast('Agora está fixada na home.'); } }, icon('home', 20)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': d.archived ? 'Desarquivar' : 'Arquivar', onclick: () => store.upsert('note', r.id, { archived: !d.archived }) }, icon('archive', 20)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Apagar nota', onclick: async () => {
            if (!(await confirmSheet('Apagar nota?', `“${titleOf(d)}” será apagada.`, 'Apagar'))) return;
            const snap = await store.remove(r.id);
            toast('Nota apagada', { action: 'desfazer', onAction: () => store.restore(r.id, snap) });
          } }, icon('trash', 20))));
    }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, showArchived ? 'nenhuma nota arquivada.' : q ? 'nada achado.' : 'sem notas ainda. o que não pode escapar?'))]));
  }

  host.append(
    banner('Não Esquecer', 'ideias soltas, lembretes, rabiscos', 'note'),
    h('div', { class: 'card pad' }, h('label', { class: 'field tight' }, search), tabs),
    list,
    h('button', { class: 'btn primary wide', type: 'button', onclick: () => sheet('Nova nota', (close) => noteEditor(null, close)) }, '+ nova nota'));
  draw();
  return store.subscribe((i) => { if (!i.kind || ['note', 'setting'].includes(i.kind)) draw(); });
}
