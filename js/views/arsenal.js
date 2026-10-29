// Arsenal discos: todos os álbuns do Arsenal Musical (assets/arsenal/discos.json, já dentro do app)
// + os álbuns dos Beatles que ela já importou, juntos, em ordem alfabética e com busca.
import { h } from '../util.js';
import * as store from '../store.js';
import { renderMarkdown } from '../md.js';
import { banner } from '../ui.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let cache = null;
const load = () => cache || (cache = fetch(new URL('../../assets/arsenal/discos.json', import.meta.url)).then((r) => { if (!r.ok) throw new Error('sem arquivo'); return r.json(); }).catch((e) => { cache = null; throw e; }));

/** Álbuns que a Bea já importou em outras coleções (ex.: Beatles), no mesmo formato do arquivo embutido. */
function imported() {
  return store.list('clubref').filter((r) => r.data.kind === 'album' && !r.deleted).map((r) => {
    const d = r.data; const m = d.meta || {};
    return { a: d.artist || (/beatles/i.test(d.col) ? 'The Beatles' : d.col), t: d.title, d: d.date || '', g: m['gênero(s) indicados'] || '', s: m['selo(s)'] || '', p: m['produção geral do álbum'] || '', r: m['período de gravação'] || '', k: (d.tracks || []).map((x) => x.title), b: d.body || '', ref: r.id };
  });
}
export function merge(bundled, extra) {
  const seen = new Set(bundled.map((x) => norm(`${x.a}|${x.t}`)));
  return [...bundled, ...extra.filter((x) => !seen.has(norm(`${x.a}|${x.t}`)))]
    .sort((x, y) => norm(x.a).localeCompare(norm(y.a), 'pt-BR') || x.d.localeCompare(y.d) || x.t.localeCompare(y.t));
}

function card(x, q) {
  const hit = q ? x.k.filter((k) => norm(k).includes(q)).slice(0, 4) : [];
  const info = [['gênero', x.g], ['selo', x.s], ['produção', x.p], ['gravação', x.r]].filter((i) => i[1]);
  return h('details', { class: 'ar-alb' },
    h('summary', {}, h('strong', {}, x.t), h('small', { class: 'muted' }, ` ${x.a}${x.d ? ` · ${x.d.slice(0, 4)}` : ''}${x.k.length ? ` · ${x.k.length} faixas` : ''}`),
      hit.length ? h('em', { class: 'ar-hit' }, `faixa: ${hit.join(', ')}`) : null),
    h('div', { class: 'ar-body' },
      info.length ? h('dl', { class: 'cl-meta' }, ...info.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])) : null,
      x.k.length ? h('ol', { class: 'cl-tracks' }, ...x.k.map((k) => h('li', {}, k))) : null,
      x.b ? h('div', { class: 'reader-body' }, renderMarkdown(x.b).nodes) : null,
      x.ref ? h('a', { class: 'link', href: `#/estudos/club/r:${x.ref}` }, 'abrir ficha completa →') : null));
}

export function mountArsenal(host, tabs) {
  const list = h('div', { class: 'ar-list pad-x' }); const count = h('p', { class: 'muted' }, 'carregando…');
  const search = h('input', { type: 'search', placeholder: 'buscar artista, álbum ou música…', 'aria-label': 'Buscar nos discos' });
  let all = []; let q = '';
  const draw = () => {
    const t = norm(q.trim());
    const rows = t ? all.filter((x) => norm(`${x.a} ${x.t} ${x.k.join(' ')}`).includes(t)) : all;
    count.textContent = `${rows.length} ${rows.length === 1 ? 'álbum' : 'álbuns'}${t ? '' : ` · ${new Set(rows.map((x) => x.a)).size} artistas`}`;
    const frag = []; let last = '';
    for (const x of rows) { if (x.a !== last) { last = x.a; frag.push(h('h2', { class: 'tag ar-art' }, x.a)); } frag.push(card(x, t)); }
    list.replaceChildren(...(frag.length ? frag : [h('p', { class: 'muted' }, 'nada com isso.')]));
  };
  search.addEventListener('input', () => { q = search.value; draw(); });
  host.append(tabs, banner('Arsenal discos', 'todos os álbuns, de A a Z'), h('div', { class: 'pad-x' }, h('a', { class: 'link', href: '#/estudos/club' }, '← Álbuns'), h('label', { class: 'field' }, search), count), list);
  const refresh = () => { load().then((b) => { all = merge(b, imported()); draw(); }).catch(() => { count.textContent = 'não consegui abrir os discos agora. tenta de novo com internet.'; }); };
  refresh();
  return store.subscribe((i) => { if (all.length && (!i.kind || i.kind === 'clubref')) refresh(); });
}
