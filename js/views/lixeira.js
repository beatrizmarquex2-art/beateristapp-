// Lixeira: o que você apagou fica 30 dias e pode voltar.
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, toast, confirmSheet } from '../ui.js';
import { KINDS, titleOf, ago } from '../kinds.js';

export function mount(host) {
  const list = h('div', { class: 'trash-list' });
  const head = h('div', { class: 'card pad row between' });
  function draw() {
    const items = store.trashList();
    head.replaceChildren(h('span', {}, items.length ? `${items.length} item${items.length > 1 ? 's' : ''} · somem sozinhos em ${store.TRASH_DAYS} dias` : 'lixeira vazia'),
      items.length ? h('button', { class: 'btn small danger', type: 'button', onclick: async () => {
        if (!(await confirmSheet('Esvaziar a lixeira?', 'Isso apaga de vez, não dá pra desfazer.', 'Esvaziar'))) return;
        await store.purgeTrash(); toast('Lixeira esvaziada');
      } }, 'esvaziar') : null);
    list.replaceChildren(...(items.length ? items.map((r) => h('div', { class: 'card pad trash-item' },
      h('div', { class: 'trash-info' }, h('em', { class: 'chip ghost' }, (KINDS[r.kind] || [r.kind])[0]), h('strong', {}, titleOf(r.data)), h('small', { class: 'muted' }, `apagado ${ago(r.updated_at)}`)),
      h('div', { class: 'row' },
        h('button', { class: 'btn small primary', type: 'button', onclick: async () => { await store.restoreFromTrash(r.id); toast('Voltou ✓'); } }, 'restaurar'),
        h('button', { class: 'btn small ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar de vez?', `“${titleOf(r.data)}” não poderá voltar.`, 'Apagar')) await store.purgeTrash(r.id); } }, 'apagar de vez')))) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nada por aqui.'), h('p', {}, 'o que você apagar aparece aqui por 30 dias.'))]));
  }
  host.append(banner('Lixeira', 'tudo que você apagou, por 30 dias'), h('div', { class: 'pad-x' }, head), list);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.trash || i.kind) draw(); });
}
