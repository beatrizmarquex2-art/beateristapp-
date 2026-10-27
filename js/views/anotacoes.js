// Minhas anotações: tudo o que foi grifado nos textos de estudo, em pastas.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as G from '../highlights.js';
import { banner, toast } from '../ui.js';

const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts)).replace('.', '');
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Junta os pedaços do mesmo grifo (quando pegou mais de um parágrafo). */
function cards(list) {
  const seen = new Set(); const out = [];
  for (const r of [...list].sort((a, b) => (b.data.created || 0) - (a.data.created || 0))) {
    if (r.data.gid) { if (seen.has(r.data.gid)) continue; seen.add(r.data.gid); const parts = list.filter((x) => x.data.gid === r.data.gid).sort((a, b) => (a.data.created || 0) - (b.data.created || 0)); out.push({ rec: r, parts }); } else out.push({ rec: r, parts: [r] });
  }
  return out;
}

export function mount(host) {
  let folder = ''; let q = '';
  const box = h('div'); const search = h('input', { type: 'search', placeholder: 'buscar nas anotações…', 'aria-label': 'Buscar nas anotações' });
  search.addEventListener('input', () => { q = search.value; draw(); });
  const draw = () => {
    const everything = G.all(); const fs = G.folders();
    if (folder && !fs.includes(folder)) folder = '';
    const mine = everything.filter((r) => (!folder || (r.data.folder || G.GERAL) === folder) && (!q.trim() || norm(`${r.data.text} ${r.data.srcTitle}`).includes(norm(q.trim()))));
    const list = cards(mine);
    const chip = (label, val, n) => h('button', { type: 'button', class: `pn-chip${folder === val ? ' on' : ''}`, 'aria-pressed': String(folder === val), onclick: () => { folder = val; draw(); } }, label, ' ', h('small', {}, String(n)));
    const count = (f) => everything.filter((r) => (r.data.folder || G.GERAL) === f).length;
    const copy = async () => {
      const txt = list.map(({ parts }) => `> ${parts.map((p) => p.data.text).join('\n> ')}\n— ${parts[0].data.srcTitle || ''}`).join('\n\n');
      try { await navigator.clipboard.writeText(txt); toast(`${list.length} anotação(ões) copiada(s) ✓`, { ms: 2000 }); } catch { toast('não deu pra copiar aqui', { ms: 2000 }); }
    };
    box.replaceChildren(...[
      h('div', { class: 'pad-x' }, h('label', { class: 'field' }, search)),
      h('div', { class: 'pn-chips pad-x an-folders', role: 'group', 'aria-label': 'Pastas' }, chip('todas', '', everything.length), ...fs.map((f) => chip(`📁 ${f}`, f, count(f))),
        h('button', { type: 'button', class: 'pn-chip', onclick: async () => { const n = await G.addFolder(); if (n) { folder = n; draw(); } } }, '+ pasta')),
      folder && folder !== G.GERAL ? h('div', { class: 'row pad-x' },
        h('button', { class: 'btn small', type: 'button', onclick: async () => { const n = await G.renameFolder(folder); if (n) { folder = n; draw(); } } }, 'renomear pasta'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await G.deleteFolder(folder)) { folder = ''; draw(); } } }, 'apagar pasta')) : null,
      list.length ? h('div', { class: 'row pad-x' }, h('small', { class: 'muted' }, `${list.length} anotação(ões)`), h('button', { class: 'btn small ghost', type: 'button', onclick: copy }, 'copiar tudo')) : null,
      list.length ? h('ul', { class: 'an-list' }, ...list.map(({ rec, parts }) => {
        const d = rec.data;
        return h('li', { class: `an-card hl-${d.color || 'y'}` },
          h('blockquote', {}, ...parts.map((p) => h('p', {}, p.data.text))),
          h('div', { class: 'an-meta' }, d.href ? h('a', { class: 'link', href: d.href }, d.srcTitle || 'abrir texto') : h('span', {}, d.srcTitle || ''), h('small', { class: 'muted' }, ` · ${when(d.created)}${folder ? '' : ` · ${d.folder || G.GERAL}`}`)),
          h('div', { class: 'row an-act' },
            h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { const f = await G.pickFolder('Mover anotação pra…', d.folder || G.GERAL); if (f) { await G.moveTo(parts.map((p) => p.id), f); } } }, '📁 mover'),
            h('button', { class: 'btn small ghost danger-txt', type: 'button', onclick: async () => { await G.removeGrifo(rec); toast('anotação removida', { ms: 1500 }); } }, 'tirar')));
      })) : h('div', { class: 'empty' }, h('p', { class: 'hand' }, everything.length ? 'nada nessa pasta ou busca.' : 'nada grifado ainda.'),
        h('p', { class: 'muted' }, 'abre qualquer texto de estudo (fichas do Listening Club, artigos da biblioteca), seleciona um trecho com o dedo e escolhe uma cor. ele vem pra cá, na pasta que você escolher.')),
    ].filter(Boolean));
  };
  host.append(banner('Minhas anotações', 'o que eu grifei pra estudar'), box); draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === G.KIND || i.id === G.CFG) draw(); });
}
