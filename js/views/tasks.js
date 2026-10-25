import { h, icon, todayKey, longDate } from '../util.js';
import * as store from '../store.js';
import { visibleOn, togglePatch, RECUR } from '../tasks-logic.js';
import { BRANDS } from '../modules.js';
import { sheet, confirmSheet, toast, stamp, stars, banner } from '../ui.js';

const nextOrder = () => store.list('task').reduce((m, r) => Math.max(m, r.data.order ?? 0), 0) + 1;

export async function toggleTask(rec, el) {
  const key = todayKey();
  const wasDone = visibleOn([rec], key)[0]?.done;
  await store.upsert('task', rec.id, togglePatch(rec.data, key));
  if (!wasDone && el) {
    stamp(el);
    const left = visibleOn(store.list('task'), key).filter((x) => !x.done).length;
    if (left === 0) stars(el);
  }
}

export function taskForm(rec, close) {
  const d = rec ? rec.data : { title: '', label: 'Pessoal', recur: 'none', time: '' };
  const title = h('input', { type: 'text', value: d.title || '', placeholder: 'o que precisa rolar hoje?', maxlength: 200, 'aria-label': 'Tarefa', enterkeyhint: 'done' });
  const label = h('select', { 'aria-label': 'Marca ou campanha' }, BRANDS.map((b) => h('option', { value: b, selected: (d.label || 'Pessoal') === b }, b)));
  const recur = h('select', { 'aria-label': 'Repetição' }, Object.entries(RECUR).map(([k, v]) => h('option', { value: k, selected: (d.recur || 'none') === k }, v)));
  const time = h('input', { type: 'time', value: d.time || '', 'aria-label': 'Horário' });
  const save = async () => {
    const t = title.value.trim();
    if (!t) { title.focus(); toast('Escreva a tarefa antes de salvar.'); return; }
    const patch = { title: t, label: label.value, recur: recur.value, time: time.value };
    if (rec) await store.upsert('task', rec.id, patch);
    else await store.upsert('task', null, { ...patch, day: todayKey(), done: false, doneDates: [], order: nextOrder() });
    toast('Tarefa salva ✓');
    close();
  };
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
  return h('form', { class: 'sheet-body', onsubmit: (e) => e.preventDefault() },
    h('label', { class: 'field' }, h('span', {}, 'tarefa'), title),
    h('div', { class: 'grid2' },
      h('label', { class: 'field' }, h('span', {}, 'marca / campanha'), label),
      h('label', { class: 'field' }, h('span', {}, 'repetir'), recur)),
    h('label', { class: 'field' }, h('span', {}, 'horário (opcional)'), time,
      h('small', {}, 'por enquanto é só uma anotação: o app ainda não envia notificações.')),
    h('div', { class: 'row end' },
      rec ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => {
        if (!(await confirmSheet('Apagar tarefa?', `“${d.title}” será removida${d.recur !== 'none' ? ' de todos os dias' : ''}.`, 'Apagar'))) return;
        const snap = await store.remove(rec.id);
        close();
        toast('Tarefa apagada', { action: 'desfazer', onAction: () => store.restore(rec.id, snap) });
      } }, 'Apagar') : null,
      h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Salvar')));
}

export function mount(host) {
  let organizing = false;
  const list = h('div', { class: 'tasks' });
  const head = h('div', { class: 'count-line' });
  const quick = h('input', { type: 'text', placeholder: 'nova tarefa… (enter pra adicionar)', maxlength: 200, 'aria-label': 'Nova tarefa', enterkeyhint: 'done' });
  quick.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' || !quick.value.trim()) return;
    await store.upsert('task', null, { title: quick.value.trim(), label: 'Pessoal', recur: 'none', time: '', day: todayKey(), done: false, doneDates: [], order: nextOrder() });
    quick.value = '';
  });

  const orgBtn = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { organizing = !organizing; draw(); } });

  async function move(items, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const seq = items.map((x) => x.rec);
    [seq[i], seq[j]] = [seq[j], seq[i]];
    for (let n = 0; n < seq.length; n++) if ((seq[n].data.order ?? -1) !== n + 1) await store.upsert('task', seq[n].id, { order: n + 1 });
  }

  function draw() {
    const items = visibleOn(store.list('task'), todayKey());
    const done = items.filter((x) => x.done).length;
    head.replaceChildren(h('strong', {}, `${done}/${items.length}`), ' feitas hoje');
    orgBtn.textContent = organizing ? 'concluir ordem' : 'organizar';
    orgBtn.setAttribute('aria-pressed', String(organizing));
    list.replaceChildren(...(items.length ? items.map((it, i) => {
      const d = it.rec.data;
      const check = h('button', { class: `check${it.done ? ' on' : ''}`, type: 'button', role: 'checkbox', 'aria-checked': String(it.done), 'aria-label': `${it.done ? 'Desmarcar' : 'Concluir'}: ${d.title}`, onclick: (e) => toggleTask(it.rec, e.currentTarget) }, it.done ? icon('tick', 20) : null);
      return h('div', { class: `task${it.done ? ' done' : ''}` },
        check,
        h('button', { class: 'task-main', type: 'button', onclick: () => sheet('Editar tarefa', (close) => taskForm(it.rec, close)) },
          h('span', { class: 'task-title' }, d.title),
          h('span', { class: 'task-meta' },
            d.label && d.label !== 'Pessoal' ? h('em', { class: 'chip' }, d.label) : null,
            d.recur && d.recur !== 'none' ? h('em', { class: 'chip ghost' }, RECUR[d.recur]) : null,
            d.time ? h('em', { class: 'chip ghost' }, d.time) : null,
            it.overdue ? h('em', { class: 'chip warn' }, 'atrasada') : null)),
        organizing ? h('div', { class: 'reorder' },
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Subir', disabled: i === 0, onclick: () => move(items, i, -1) }, icon('up', 20)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Descer', disabled: i === items.length - 1, onclick: () => move(items, i, 1) }, icon('down', 20))) : null);
    }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nada por aqui. menos burocracia, mais música.'), h('p', {}, 'adicione a primeira tarefa do dia ali em cima.'))]));
  }

  host.append(
    banner('Checklist', longDate().toLowerCase(), 'sticks'),
    h('div', { class: 'card pad' }, h('div', { class: 'row between' }, head, orgBtn), h('label', { class: 'field tight' }, quick)),
    list);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'task') draw(); });
}
