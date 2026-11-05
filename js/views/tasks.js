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
  let selecting = false;
  const picked = new Set();
  let openId = null; // linha com o lixinho aberto
  const list = h('div', { class: 'tasks' });
  const head = h('div', { class: 'count-line' });
  const quick = h('input', { type: 'text', placeholder: 'nova tarefa… (enter pra adicionar)', maxlength: 200, 'aria-label': 'Nova tarefa', enterkeyhint: 'done' });
  quick.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' || !quick.value.trim()) return;
    await store.upsert('task', null, { title: quick.value.trim(), label: 'Pessoal', recur: 'none', time: '', day: todayKey(), done: false, doneDates: [], order: nextOrder() });
    quick.value = '';
  });

  const orgBtn = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { organizing = !organizing; if (organizing) { selecting = false; picked.clear(); } draw(); } });
  const selBtn = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { selecting = !selecting; picked.clear(); openId = null; if (selecting) organizing = false; draw(); } });
  const bar = h('div', { class: 'sel-bar' });

  async function removeMany(recs) {
    if (!recs.length) return;
    const msg = recs.length === 1 ? `“${recs[0].data.title}” será removida.` : `${recs.length} tarefas serão removidas.`;
    if (!(await confirmSheet(recs.length === 1 ? 'Apagar tarefa?' : 'Apagar tarefas?', msg, 'Apagar'))) return;
    const snaps = [];
    for (const r of recs) snaps.push([r.id, await store.remove(r.id)]);
    picked.clear(); selecting = false; openId = null; draw();
    toast(recs.length === 1 ? 'Tarefa apagada' : `${recs.length} tarefas apagadas`, { action: 'desfazer', onAction: () => snaps.forEach(([id, sn]) => store.restore(id, sn)) });
  }

  // arrastar da direita pra esquerda mostra o lixinho
  function swipe(wrap, row, rec) {
    const W = 76; let x0 = 0, y0 = 0, dx = 0, on = false, locked = false;
    const set = (v, anim) => { row.style.transition = anim ? 'transform .2s' : 'none'; row.style.transform = `translateX(${v}px)`; };
    row.addEventListener('pointerdown', (e) => { if (selecting || organizing || e.target.closest('.check')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; on = true; locked = false; });
    row.addEventListener('pointermove', (e) => {
      if (!on) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if (!locked) { if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { on = false; return; } if (Math.abs(mx) < 8) return; locked = true; try { row.setPointerCapture(e.pointerId); } catch {} }
      dx = Math.max(-W, Math.min(0, (openId === rec.id ? -W : 0) + mx));
      set(dx);
    });
    const end = () => {
      if (!on) return; on = false;
      if (!locked) return;
      const open = dx < -W / 2;
      openId = open ? rec.id : null;
      set(open ? -W : 0, true);
      if (open) wrap.dataset.swiped = '1';
      draw();
    };
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    // clique logo depois de arrastar não abre a edição
    row.addEventListener('click', (e) => { if (locked) { e.stopPropagation(); e.preventDefault(); locked = false; } else if (openId === rec.id) { e.stopPropagation(); e.preventDefault(); openId = null; draw(); } }, true);
  }

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
    selBtn.textContent = selecting ? 'cancelar' : 'selecionar';
    selBtn.setAttribute('aria-pressed', String(selecting));
    for (const id of [...picked]) if (!items.some((x) => x.rec.id === id)) picked.delete(id);
    bar.hidden = !selecting;
    bar.replaceChildren(
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { if (picked.size === items.length) picked.clear(); else items.forEach((x) => picked.add(x.rec.id)); draw(); } }, picked.size === items.length && items.length ? 'desmarcar todas' : 'marcar todas'),
      h('button', { class: 'btn small danger', type: 'button', disabled: !picked.size, onclick: () => removeMany(items.filter((x) => picked.has(x.rec.id)).map((x) => x.rec)) }, icon('trash', 18), ` apagar${picked.size ? ` (${picked.size})` : ''}`));
    list.replaceChildren(...(items.length ? items.map((it, i) => {
      const d = it.rec.data;
      const check = h('button', { class: `check${it.done ? ' on' : ''}`, type: 'button', role: 'checkbox', 'aria-checked': String(it.done), 'aria-label': `${it.done ? 'Desmarcar' : 'Concluir'}: ${d.title}`, onclick: (e) => toggleTask(it.rec, e.currentTarget) }, it.done ? icon('tick', 20) : null);
      const sel = picked.has(it.rec.id);
      const pick = h('button', { class: `check pick${sel ? ' on' : ''}`, type: 'button', role: 'checkbox', 'aria-checked': String(sel), 'aria-label': `Selecionar: ${d.title}`, onclick: () => { if (sel) picked.delete(it.rec.id); else picked.add(it.rec.id); draw(); } }, sel ? icon('tick', 20) : null);
      const row = h('div', { class: `task${it.done ? ' done' : ''}${sel ? ' picked' : ''}`, style: openId === it.rec.id ? 'transform:translateX(-76px)' : null },
        selecting ? pick : check,
        h('button', { class: 'task-main', type: 'button', onclick: () => selecting ? pick.click() : sheet('Editar tarefa', (close) => taskForm(it.rec, close)) },
          h('span', { class: 'task-title' }, d.title),
          h('span', { class: 'task-meta' },
            d.label && d.label !== 'Pessoal' ? h('em', { class: 'chip' }, d.label) : null,
            d.recur && d.recur !== 'none' ? h('em', { class: 'chip ghost' }, RECUR[d.recur]) : null,
            d.time ? h('em', { class: 'chip ghost' }, d.time) : null,
            it.overdue ? h('em', { class: 'chip warn' }, 'atrasada') : null)),
        organizing ? h('div', { class: 'reorder' },
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Subir', disabled: i === 0, onclick: () => move(items, i, -1) }, icon('up', 20)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Descer', disabled: i === items.length - 1, onclick: () => move(items, i, 1) }, icon('down', 20))) : null);
      const wrap = h('div', { class: 'task-wrap' },
        h('button', { class: 'task-trash', type: 'button', 'aria-label': `Apagar: ${d.title}`, tabindex: openId === it.rec.id ? null : -1, onclick: () => removeMany([it.rec]) }, icon('trash', 24)),
        row);
      swipe(wrap, row, it.rec);
      return wrap;
    }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nada por aqui. menos burocracia, mais música.'), h('p', {}, 'adicione a primeira tarefa do dia ali em cima.'))]));
  }

  host.append(
    banner('Checklist', longDate().toLowerCase(), 'sticks'),
    h('div', { class: 'card pad' }, h('div', { class: 'row between' }, head, h('div', { class: 'row' }, selBtn, orgBtn)), bar, h('label', { class: 'field tight' }, quick)),
    list);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'task') draw(); });
}
