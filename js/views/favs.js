import { h, icon } from '../util.js';
import * as store from '../store.js';
import { TOOL_TARGETS } from '../modules.js';
import { sheet, confirmSheet, toast, banner } from '../ui.js';

const nextOrder = () => store.list('fav').reduce((m, r) => Math.max(m, r.data.order ?? 0), 0) + 1;
export const sortedFavs = () => store.list('fav').sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));

/** Só aceita http(s) — bloqueia javascript:, data: etc. */
export function safeUrl(raw) {
  try {
    const s = raw.trim();
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch { return null; }
}

export function favForm(rec, close) {
  const d = rec ? rec.data : { title: '', href: '', external: true };
  const isTool = !!rec && !d.external;
  const kind = h('select', { 'aria-label': 'Tipo de destino' },
    h('option', { value: 'url', selected: !isTool }, 'link externo (site, vídeo, playlist)'),
    h('option', { value: 'tool', selected: isTool }, 'ferramenta do app'));
  const title = h('input', { type: 'text', value: d.title || '', maxlength: 80, placeholder: 'nome do favorito', 'aria-label': 'Nome' });
  const url = h('input', { type: 'url', inputmode: 'url', autocapitalize: 'off', value: !isTool ? d.href || '' : '', placeholder: 'https://…', 'aria-label': 'Endereço' });
  const tool = h('select', { 'aria-label': 'Ferramenta' }, TOOL_TARGETS.map((t) => h('option', { value: t.href, selected: d.href === t.href }, t.label)));
  const urlField = h('label', { class: 'field' }, h('span', {}, 'endereço'), url);
  const toolField = h('label', { class: 'field' }, h('span', {}, 'ferramenta'), tool);
  const sync = () => { urlField.hidden = kind.value !== 'url'; toolField.hidden = kind.value !== 'tool'; };
  kind.addEventListener('change', sync); sync();
  const save = async () => {
    let href, external;
    if (kind.value === 'url') { href = safeUrl(url.value); external = true; if (!href) { url.focus(); toast('Esse endereço não parece válido.'); return; } }
    else { href = tool.value; external = false; }
    const name = title.value.trim() || (kind.value === 'tool' ? tool.selectedOptions[0].text : new URL(href).hostname);
    await store.upsert('fav', rec ? rec.id : null, { title: name, href, external, ...(rec ? {} : { order: nextOrder() }) });
    toast('Favorito salvo ★');
    close();
  };
  return h('form', { class: 'sheet-body', onsubmit: (e) => e.preventDefault() },
    h('label', { class: 'field' }, h('span', {}, 'tipo'), kind), h('label', { class: 'field' }, h('span', {}, 'nome'), title), urlField, toolField,
    h('div', { class: 'row end' },
      rec ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => {
        if (!(await confirmSheet('Remover favorito?', `“${d.title}” sai da lista (o destino não é apagado).`, 'Remover'))) return;
        const snap = await store.remove(rec.id); close();
        toast('Favorito removido', { action: 'desfazer', onAction: () => store.restore(rec.id, snap) });
      } }, 'Remover') : null,
      h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Salvar')));
}

export function favChip(r) {
  const d = r.data;
  return d.external
    ? h('a', { class: 'fav-chip', href: d.href, target: '_blank', rel: 'noopener noreferrer' }, icon('star', 16), d.title)
    : h('a', { class: 'fav-chip', href: d.href }, icon('star', 16), d.title);
}

export function mount(host) {
  let organizing = false;
  const list = h('div', { class: 'favs' });
  const orgBtn = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { organizing = !organizing; draw(); } });
  async function move(items, i, dir) {
    const j = i + dir; if (j < 0 || j >= items.length) return;
    const seq = [...items]; [seq[i], seq[j]] = [seq[j], seq[i]];
    for (let n = 0; n < seq.length; n++) if (seq[n].data.order !== n + 1) await store.upsert('fav', seq[n].id, { order: n + 1 });
  }
  function draw() {
    const items = sortedFavs();
    orgBtn.textContent = organizing ? 'concluir ordem' : 'organizar';
    orgBtn.hidden = items.length < 2;
    list.replaceChildren(...(items.length ? items.map((r, i) => h('div', { class: 'fav-row' },
      h('span', { class: 'fav-star' }, icon('star', 22)),
      h('div', { class: 'fav-main' },
        r.data.external
          ? h('a', { href: r.data.href, target: '_blank', rel: 'noopener noreferrer' }, h('strong', {}, r.data.title), h('small', {}, new URL(r.data.href).hostname + ' · abre fora do app · precisa de internet'))
          : h('a', { href: r.data.href }, h('strong', {}, r.data.title), h('small', {}, 'ferramenta do app'))),
      organizing ? h('div', { class: 'reorder' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Subir', disabled: i === 0, onclick: () => move(items, i, -1) }, icon('up', 20)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Descer', disabled: i === items.length - 1, onclick: () => move(items, i, 1) }, icon('down', 20)))
        : h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Editar ${r.data.title}`, onclick: () => sheet('Editar favorito', (close) => favForm(r, close)) }, icon('edit', 20))))
      : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'sem favoritos ainda.'), h('p', {}, 'fixe aqui o que você usa toda hora: ferramentas, links, playlists.'))]));
  }
  host.append(banner('Favoritos', 'o que você usa toda hora', 'star-red'),
    h('div', { class: 'row between pad-x' }, h('span', {}), orgBtn), list,
    h('button', { class: 'btn primary wide', type: 'button', onclick: () => sheet('Novo favorito', (close) => favForm(null, close)) }, '+ novo favorito'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'fav') draw(); });
}
