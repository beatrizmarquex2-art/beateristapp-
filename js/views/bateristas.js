// Bateristas & Links: cards de referência (foto, por que admiro, notas de técnica, links e clipes) e uma estante de links soltos.
// Links públicos ficam só como referência (abrem no site de origem ou no player do YouTube); nada é copiado.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import { banner, toast, confirmSheet, sheet } from '../ui.js';
import { artPhoto, credit, changePhoto } from './artist-photo.js';
import { normUrl, linkType, TYPE_LABEL, youtube, embedUrl, ytSearch, slugOf, match, LINK_TAGS, SUGGESTIONS } from '../drummers-logic.js';

const DR = 'drummer', LK = 'reflink';
const field = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);
const put = (el, ...kids) => el.replaceChildren(...kids.filter(Boolean)); // replaceChildren(null) escreveria "null"
const rid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function toStudy(what, href) {
  await store.upsert('task', null, { title: `estudar: ${what}`.slice(0, 140), label: 'Pessoal', recur: 'none', time: '', day: todayKey(), done: false, doneDates: [], order: Date.now(), link: href || '' });
  toast('foi pro checklist de hoje ✓', { action: 'abrir', onAction: () => { location.hash = '#/checklist'; } });
}

/** Um link: abre fora; se for vídeo do YouTube, toca aqui mesmo (só carrega o player quando você pede). */
function linkRow(l, { onStudy, onDel }) {
  const t = linkType(l.url); const v = youtube(l.url);
  const slot = h('div', { class: 'bt-player' });
  const play = v ? h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (slot.firstChild) { slot.replaceChildren(); return; }
    slot.replaceChildren(h('iframe', { src: embedUrl(v), title: l.label || 'vídeo', allow: 'encrypted-media; picture-in-picture; fullscreen', referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy' }));
  } }, icon('play', 14), ' ver aqui') : null;
  return h('li', { class: `bt-link t-${t}` },
    h('div', { class: 'bt-link-main' },
      h('span', { class: 'bt-type' }, TYPE_LABEL[t]),
      h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label || l.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)),
      l.note ? h('small', { class: 'muted' }, l.note) : null),
    h('div', { class: 'bt-link-act' }, play,
      h('button', { class: 'btn small ghost', type: 'button', onclick: onStudy }, '→ estudar'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar link ${l.label || ''}`.trim(), onclick: onDel }, icon('trash', 16))),
    slot);
}

function linkForm(onSave, { tags = false } = {}) {
  let tag = 'groove';
  const url = h('input', { type: 'url', inputmode: 'url', placeholder: 'cole o link (YouTube, Instagram, site…)', 'aria-label': 'Link' });
  const label = h('input', { type: 'text', maxlength: 90, placeholder: tags ? 'título' : 'o que é (ex.: solo em 2:10, entrevista)', 'aria-label': 'Título do link' });
  const note = h('input', { type: 'text', maxlength: 200, placeholder: 'nota (opcional)', 'aria-label': 'Nota do link' });
  const chips = h('div', { class: 'chips lib-tabs id-tags' });
  const drawTags = () => chips.replaceChildren(...LINK_TAGS.map(([k, t]) => h('button', { type: 'button', class: `lib-tab${tag === k ? ' on' : ''}`, 'aria-pressed': String(tag === k), onclick: () => { tag = k; drawTags(); } }, t)));
  if (tags) drawTags();
  const save = async () => {
    const u = normUrl(url.value); if (!u) { toast('esse link não parece um endereço válido'); return; }
    await onSave({ url: u, label: label.value.trim(), note: note.value.trim(), tag });
    url.value = ''; label.value = ''; note.value = '';
  };
  return h('div', { class: 'bt-form' }, url, label, note, tags ? chips : null, h('button', { class: 'btn primary', type: 'button', onclick: save }, '+ guardar link'));
}

function drummerSheet(r, prefill = {}) {
  const d = r ? r.data : prefill;
  sheet(r ? 'Editar baterista' : 'Novo baterista', (close) => {
    const name = h('input', { type: 'text', maxlength: 60, value: d.name || '', placeholder: 'nome', 'aria-label': 'Nome' });
    const style = h('input', { type: 'text', maxlength: 60, value: d.style || '', placeholder: 'ex.: funk, gospel, jazz', 'aria-label': 'Estilo' });
    const why = h('textarea', { rows: 2, maxlength: 400, placeholder: 'o que você admira?', 'aria-label': 'Por que admiro' }); why.value = d.why || '';
    const wiki = h('input', { type: 'text', maxlength: 120, value: d.wiki || '', placeholder: 'ex.: Sheila_E. (opcional, pra foto livre)', 'aria-label': 'Página na Wikipedia' });
    const save = async () => {
      if (!name.value.trim()) { toast('falta o nome'); return; }
      const rec = await store.upsert(DR, r ? r.id : null, { name: name.value.trim(), style: style.value.trim(), why: why.value.trim(), wiki: wiki.value.trim().replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//, ''), ...(r ? {} : { notes: '', links: [], created: Date.now() }) });
      close(); if (!r) location.hash = `#/bateristas/${rec.id}`;
    };
    return h('div', { class: 'sheet-body' }, field('nome', name), field('estilo', style), field('por que eu admiro', why), field('página na Wikipedia (inglês)', wiki),
      h('button', { class: 'btn primary', type: 'button', onclick: save }, r ? 'salvar' : 'criar card'));
  });
}

/* ---------- um baterista ---------- */
function detail(host, id) {
  const r = store.get(id);
  if (!r || r.kind !== DR) { host.append(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'esse card não existe mais.'), h('a', { class: 'btn', href: '#/bateristas' }, 'ver bateristas'))); return () => {}; }
  const d = r.data; const slug = slugOf(r.id);
  const notes = h('textarea', { rows: 5, maxlength: 4000, placeholder: 'notas de técnica: pegada, setup, padrões que ele/ela usa, o que tirar de ouvido…', 'aria-label': 'Notas de técnica' });
  notes.value = d.notes || ''; let t = 0;
    notes.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => store.upsert(DR, r.id, { notes: notes.value }), 600); });
  const links = d.links || [];
  const del = async () => { if (await confirmSheet('Apagar card?', d.name, 'Apagar')) { await store.remove(r.id); location.hash = '#/bateristas'; } };
  host.append(
    h('div', { class: 'row between pad-x ar-top' }, h('a', { class: 'btn small ghost', href: '#/bateristas' }, '‹ bateristas'),
      h('button', { class: `icon-btn${d.fav ? ' on' : ''}`, type: 'button', 'aria-pressed': String(!!d.fav), 'aria-label': d.fav ? 'Tirar dos favoritos' : 'Favoritar', onclick: () => store.upsert(DR, r.id, { fav: !d.fav }) }, icon('star', 20))),
    h('section', { class: 'bt-hero pad-x' }, artPhoto(slug, d.name, 'art-ph bt-ph', d.wiki),
      h('div', { class: 'bt-hero-txt' }, h('h2', {}, d.name), d.style ? h('p', { class: 'bt-style' }, d.style) : null, d.why ? h('p', { class: 'bt-why' }, d.why) : null,
        h('div', { class: 'row bt-hero-act' }, h('button', { class: 'btn small', type: 'button', onclick: () => drummerSheet(r) }, icon('edit', 14), ' editar'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await changePhoto(slug)) store.upsert(DR, r.id, {}); } }, icon('photo', 14), ' trocar foto')))),
    h('div', { class: 'pad-x' }, credit(slug, d.wiki)),
    h('section', { class: 'card pad' }, h('h3', {}, 'notas de técnica'), notes),
    h('section', { class: 'card pad' }, h('h3', {}, 'links e clipes'),
      links.length ? h('ul', { class: 'bt-links' }, ...links.map((l) => linkRow(l, {
        onStudy: () => toStudy(`${l.label || TYPE_LABEL[linkType(l.url)]} (${d.name})`, l.url),
        onDel: async () => { if (await confirmSheet('Apagar link?', l.label || l.url, 'Apagar')) store.upsert(DR, r.id, { links: (store.get(r.id).data.links || []).filter((x) => x.id !== l.id) }); },
      }))) : h('p', { class: 'muted' }, 'nenhum link ainda. dica: no YouTube, “compartilhar → começar em” guarda o minuto exato.'),
      linkForm((l) => store.upsert(DR, r.id, { links: [...(store.get(r.id).data.links || []), { id: rid(), url: l.url, label: l.label, note: l.note }] })),
      h('a', { class: 'btn small ghost bt-search', href: ytSearch(`${d.name} drums`), target: '_blank', rel: 'noopener noreferrer' }, 'procurar no YouTube ↗')),
    h('div', { class: 'pad-x' }, h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: del }, icon('trash', 16), ' apagar card')));
  return () => clearTimeout(t);
}

/* ---------- lista ---------- */
function drummersTab(el, q) {
  const all = store.list(DR).filter((r) => match([r.data.name, r.data.style, r.data.why], q))
    .sort((a, b) => (b.data.fav ? 1 : 0) - (a.data.fav ? 1 : 0) || a.data.name.localeCompare(b.data.name, 'pt-BR'));
  const have = new Set(store.list(DR).map((r) => r.data.name.toLowerCase()));
  const sugg = SUGGESTIONS.filter((s) => !have.has(s.name.toLowerCase()) && match([s.name, s.style], q));
  put(el,
    h('div', { class: 'pad-x' }, h('button', { class: 'btn primary ar-add', type: 'button', onclick: () => drummerSheet(null) }, icon('plus', 18), ' novo baterista')),
    all.length ? h('div', { class: 'bt-grid' }, ...all.map((r) => h('a', { class: `bt-card${r.data.fav ? ' fav' : ''}`, href: `#/bateristas/${r.id}` },
      artPhoto(slugOf(r.id), r.data.name, 'art-ph bt-ph-s', r.data.wiki), h('b', {}, r.data.name), h('small', { class: 'muted' }, r.data.style || ' '),
      h('small', { class: 'muted' }, `${(r.data.links || []).length} link(s)`)))) : (q ? h('p', { class: 'pad-x muted' }, 'ninguém com esse nome.') : null),
    sugg.length ? h('details', { class: 'pad-x bt-sugg', open: !store.list(DR).length },
      h('summary', {}, `sugestões pra começar (${sugg.length})`),
      h('ul', {}, ...sugg.map((s) => h('li', {}, h('div', {}, h('b', {}, s.name), h('small', { class: 'muted' }, ` · ${s.style}`), h('p', { class: 'muted' }, s.why)),
        h('button', { class: 'btn small', type: 'button', 'aria-label': `Adicionar ${s.name}`, onclick: async () => { await store.upsert(DR, null, { ...s, notes: '', links: [], created: Date.now() }); toast(`${s.name} entrou ✓`, { ms: 1500 }); } }, '+'))))) : null);
}

function linksTab(el, q, tagF, setTag) {
  const all = store.list(LK).filter((r) => (!tagF || r.data.tag === tagF) && match([r.data.title, r.data.note, r.data.url], q)).sort((a, b) => (b.data.created || 0) - (a.data.created || 0));
  put(el,
    h('section', { class: 'card pad' }, linkForm((l) => store.upsert(LK, null, { title: l.label, url: l.url, note: l.note, tag: l.tag, created: Date.now() }), { tags: true })),
    h('div', { class: 'chips lib-tabs id-filter' }, ...[['', 'todos'], ...LINK_TAGS].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${tagF === k ? ' on' : ''}`, 'aria-pressed': String(tagF === k), onclick: () => setTag(k) }, t))),
    all.length ? h('ul', { class: 'bt-links pad-x' }, ...all.map((r) => linkRow({ url: r.data.url, label: r.data.title, note: r.data.note }, {
      onStudy: () => toStudy(r.data.title || TYPE_LABEL[linkType(r.data.url)], r.data.url),
      onDel: async () => { if (await confirmSheet('Apagar link?', r.data.title || r.data.url, 'Apagar')) store.remove(r.id); },
    }))) : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum link aqui ainda.')));
}

export function mount(host, parts = []) {
  const sub = parts[0] || '';
  host.append(banner('Bateristas & Links', 'referências que te movem'));
  if (sub && sub !== 'links') {
    // só redesenha se mudou algo além das notas (senão o teclado fecha no meio da frase e o vídeo para)
    const sig = () => { const r = store.get(sub); return r ? JSON.stringify({ ...r.data, notes: 0 }) : ''; };
    let off = detail(host, sub); let last = sig();
    const unsub = store.subscribe((i) => { if ((i.id === sub || !i.kind) && sig() !== last) { last = sig(); off(); host.querySelectorAll(':scope > :not(.banner-wrap)').forEach((n) => n.remove()); off = detail(host, sub); } });
    return () => { off(); unsub(); };
  }
  let q = ''; let tagF = '';
  const tabs = h('div', { class: 'chips lib-tabs bt-tabs' },
    h('a', { class: `lib-tab${sub ? '' : ' on'}`, href: '#/bateristas' }, 'bateristas'), h('a', { class: `lib-tab${sub ? ' on' : ''}`, href: '#/bateristas/links' }, 'links'));
  const searchEl = h('input', { type: 'search', placeholder: sub ? 'buscar link…' : 'buscar baterista ou estilo…', 'aria-label': 'Buscar' });
  const body = h('div');
  const draw = () => (sub ? linksTab(body, q, tagF, (k) => { tagF = k; draw(); }) : drummersTab(body, q));
  searchEl.addEventListener('input', () => { q = searchEl.value; draw(); });
  host.append(tabs, h('div', { class: 'pad-x' }, searchEl), body,
    h('p', { class: 'pad-x lib-note' }, 'links públicos ficam só como referência: abrem no site de origem. fotos livres vêm do Wikimedia Commons com crédito; a sua fica só no aparelho.'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === DR || i.kind === LK) draw(); });
}
