// Arsenal discos: todos os álbuns do Arsenal Musical (assets/arsenal/discos.json, já dentro do app)
// + os álbuns dos Beatles que ela já importou, juntos, em ordem alfabética e com busca.
// Cada álbum guarda o progresso: ★ favorito, ✓ lido, onde parou (registro "arsenal") e aceita grifos.
import { h, icon, debounce } from '../util.js';
import * as store from '../store.js';
import { renderMarkdown, slugify } from '../md.js';
import { banner, toast, stamp, stars } from '../ui.js';
import { attach as attachGrifos } from '../highlights.js';

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
/** chave de ordem do artista: sem acento e sem o "The" do começo (The Beatles fica no B). */
export const artistKey = (a) => norm(a).replace(/^the\s+/, '');
export const albumSlug = (x) => slugify(`${x.a} ${x.t} ${(x.d || '').slice(0, 4)}`);
export function merge(bundled, extra) {
  const seen = new Set(bundled.map((x) => norm(`${x.a}|${x.t}`)));
  return [...bundled, ...extra.filter((x) => !seen.has(norm(`${x.a}|${x.t}`)))]
    .sort((x, y) => artistKey(x.a).localeCompare(artistKey(y.a), 'pt-BR') || x.d.localeCompare(y.d) || x.t.localeCompare(y.t));
}
/** Todos os álbuns (do arquivo + os já importados), em ordem. Usado também pelo bilhete do início. */
export const loadDiscos = () => load().then((b) => merge(b, imported()));
const sid = (slug) => `arsenal-${slug}`;
const state = (slug) => (store.get(sid(slug)) ? store.get(sid(slug)).data : {});
const patch = (slug, p) => store.upsert('arsenal', sid(slug), { slug, ...p });
const allStates = () => store.list('arsenal').map((r) => r.data);
const pct = (n) => `${Math.round(n * 100)}%`;
const FILTERS = [['todos', 'todos'], ['fav', '★ favoritos'], ['nao', 'não lidos'], ['lido', 'lidos ✓']];

function row(x, q) {
  const slug = albumSlug(x); const st = state(slug);
  const hit = q ? x.k.filter((k) => norm(k).includes(q)).slice(0, 3) : [];
  return h('a', { class: `ar-alb${st.done ? ' done' : ''}`, href: `#/estudos/club/arsenal:${slug}` },
    h('span', { class: 'ar-main' },
      h('strong', {}, x.t, st.fav ? h('span', { class: 'lib-fav', 'aria-label': 'favorito' }, ' ★') : null, st.done ? h('span', { class: 'ar-ok', 'aria-label': 'lido' }, ' ✓') : null),
      h('small', { class: 'muted' }, [x.d && x.d.slice(0, 4), x.k.length && `${x.k.length} faixas`].filter(Boolean).join(' · ')),
      hit.length ? h('em', { class: 'ar-hit' }, `faixa: ${hit.join(', ')}`) : null),
    !st.done && st.progress > 0.03 ? h('span', { class: 'lib-bar', role: 'progressbar', 'aria-valuenow': Math.round(st.progress * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'progresso de leitura' }, h('i', { style: { width: pct(st.progress) } })) : null);
}

export function mountArsenal(host, tabs) {
  const list = h('div', { class: 'ar-list pad-x' }); const count = h('p', { class: 'muted' }, 'carregando…');
  const prog = h('div', { class: 'ar-prog' }); const resume = h('div');
  const search = h('input', { type: 'search', placeholder: 'buscar artista, álbum ou música…', 'aria-label': 'Buscar nos discos' });
  const chips = h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Filtro' });
  let all = []; let q = ''; let fil = 'todos';
  try { const pre = sessionStorage.getItem('ar-q'); if (pre) { q = pre; search.value = pre; sessionStorage.removeItem('ar-q'); } } catch { /* sem armazenamento */ }
  const draw = () => {
    const t = norm(q.trim());
    const done = all.filter((x) => state(albumSlug(x)).done).length;
    prog.replaceChildren(h('div', { class: 'row between' }, h('small', {}, `${done} de ${all.length} lidos`), h('small', { class: 'muted' }, all.length ? pct(done / all.length) : '')),
      h('span', { class: 'lib-bar big', role: 'progressbar', 'aria-valuenow': all.length ? Math.round((done / all.length) * 100) : 0, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'álbuns lidos' }, h('i', { style: { width: all.length ? pct(done / all.length) : '0%' } })));
    chips.replaceChildren(...FILTERS.map(([k, l]) => h('button', { type: 'button', role: 'radio', class: `lib-tab${fil === k ? ' on' : ''}`, 'aria-checked': String(fil === k), onclick: () => { fil = k; draw(); } }, l)));
    const last = allStates().filter((s) => s.lastRead && !s.done).sort((a, b) => b.lastRead - a.lastRead)[0];
    const lastAlb = last && all.find((x) => albumSlug(x) === last.slug);
    resume.replaceChildren(...(lastAlb && !t ? [h('section', {}, h('h2', { class: 'tag' }, 'continuar de onde parou'), h('div', { class: 'ar-list' }, row(lastAlb, '')))] : []));
    const ok = (x) => { const st = state(albumSlug(x)); return fil === 'fav' ? st.fav : fil === 'lido' ? st.done : fil === 'nao' ? !st.done : true; };
    const rows = all.filter((x) => ok(x) && (!t || norm(`${x.a} ${x.t} ${x.k.join(' ')}`).includes(t)));
    count.textContent = `${rows.length} ${rows.length === 1 ? 'álbum' : 'álbuns'}${t || fil !== 'todos' ? '' : ` · ${new Set(rows.map((x) => x.a)).size} artistas`}`;
    const frag = []; let lastA = '';
    for (const x of rows) { if (x.a !== lastA) { lastA = x.a; frag.push(h('h2', { class: 'tag ar-art' }, x.a)); } frag.push(row(x, t)); }
    list.replaceChildren(...(frag.length ? frag : [h('p', { class: 'muted' }, 'nada com isso.')]));
  };
  search.addEventListener('input', () => { q = search.value; draw(); });
  host.append(tabs, banner('Arsenal discos', 'todos os álbuns, de A a Z'), h('div', { class: 'pad-x' }, prog, h('label', { class: 'field' }, search), chips, count), resume, list);
  const refresh = () => { load().then((b) => { all = merge(b, imported()); draw(); }).catch(() => { count.textContent = 'não consegui abrir os discos agora. tenta de novo com internet.'; }); };
  refresh();
  return store.subscribe((i) => { if (all.length && (!i.kind || i.kind === 'clubref' || i.kind === 'arsenal')) refresh(); });
}

/** Página de um álbum: ★ favorito, ✓ lido, progresso salvo pela rolagem (volta de onde parou) e grifos. */
export function mountArsenalAlbum(host, slug, tabs) {
  const wrap = h('article', { class: 'reader' }, h('p', { class: 'lib-note pad-x' }, 'abrindo…'));
  host.append(tabs, wrap);
  let offHl = () => {}; let offScroll = () => {};
  load().then((b) => {
    const x = merge(b, imported()).find((a) => albumSlug(a) === slug);
    if (!x) { wrap.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'esse álbum não está aqui.'), h('a', { class: 'btn primary', href: '#/estudos/club/arsenal' }, 'voltar ao Arsenal'))); return; }
    const st0 = state(slug); patch(slug, { lastRead: Date.now() });
    const info = [['gênero', x.g], ['selo', x.s], ['produção', x.p], ['gravação', x.r]].filter((i) => i[1]);
    const favBtn = h('button', { class: `icon-btn${st0.fav ? ' on' : ''}`, type: 'button', 'aria-pressed': String(!!st0.fav), 'aria-label': 'Favoritar álbum', onclick: () => { const f = !state(slug).fav; patch(slug, { fav: f }); favBtn.classList.toggle('on', f); favBtn.setAttribute('aria-pressed', String(f)); toast(f ? 'nos favoritos ★' : 'removido dos favoritos'); } }, icon('star', 22));
    const readBtn = h('button', { class: 'btn small', type: 'button' });
    const paint = () => { const d = state(slug).done; readBtn.textContent = d ? 'lido ✓' : 'marcar como lido'; readBtn.classList.toggle('on', !!d); };
    readBtn.addEventListener('click', () => { const d = !state(slug).done; patch(slug, { done: d, progress: d ? 1 : state(slug).progress }); if (d) { stamp(readBtn); stars(readBtn); } paint(); });
    paint();
    const content = h('div', { class: 'reader-body' },
      info.length ? h('dl', { class: 'cl-meta' }, ...info.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])) : null,
      x.k.length ? h('ol', { class: 'cl-tracks' }, ...x.k.map((k) => h('li', {}, k))) : null,
      x.b ? renderMarkdown(x.b).nodes : null);
    wrap.replaceChildren(
      h('header', { class: 'reader-head' },
        h('a', { class: 'link', href: '#/estudos/club/arsenal' }, '← Arsenal discos'),
        h('p', { class: 'lib-kicker' }, x.a, x.d ? ` · ${x.d.slice(0, 4)}` : ''),
        h('h1', { class: 'reader-title' }, x.t),
        h('div', { class: 'row' }, favBtn, readBtn, x.ref ? h('a', { class: 'btn small ghost', href: `#/estudos/club/r:${x.ref}` }, 'ficha completa') : null)),
      content);
    const hl = attachGrifos(wrap, () => ({ id: `arsenal:${slug}`, title: `${x.a} — ${x.t}`, href: `#/estudos/club/arsenal:${slug}` })); hl.apply(); offHl = hl.off;
    let best = st0.progress || 0;
    const saveProg = debounce(() => patch(slug, { progress: best, lastRead: Date.now() }), 800);
    const spot = (p) => { const r = content.getBoundingClientRect(); const total = r.height - innerHeight * 0.6; return total > 0 ? scrollY + r.top + p * total : 0; };
    if (best > 0.05 && best < 0.97 && !st0.done) setTimeout(() => { scrollTo(0, spot(best)); toast('voltei de onde você parou', { ms: 1600 }); }, 250);
    const onScroll = () => { const r = content.getBoundingClientRect(); const total = r.height - innerHeight * 0.6; const p = Math.max(0, Math.min(1, total > 0 ? -r.top / total : 1)); if (p > best + 0.02) { best = p; saveProg(); } };
    addEventListener('scroll', onScroll, { passive: true });
    offScroll = () => { removeEventListener('scroll', onScroll); saveProg.flush(); };
  }).catch(() => wrap.replaceChildren(h('p', { class: 'muted pad-x' }, 'não consegui abrir agora. tenta de novo com internet.')));
  return () => { offScroll(); offHl(); };
}
