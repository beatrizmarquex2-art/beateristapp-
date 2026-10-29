// Meus Estudos: biblioteca privada (Mente Musical + Laboratório de Artistas). Os textos vêm do Supabase (lib.js);
// progresso, favoritos, experimentos e respostas da Bea são registros normais do app e sincronizam como o resto.
import { h, icon, debounce } from '../util.js';
import * as store from '../store.js';
import * as lib from '../lib.js';
import { renderMarkdown, slugify } from '../md.js';
import { banner, sheet, toast, stamp, stars } from '../ui.js';
import { CATEGORIES, categoryOf, category, PT, QUESTION } from '../catalog.js';
import { artPhoto, credit, changePhoto, resetPhoto, ART_KEY } from './artist-photo.js';
import { mountClub, mountPost } from './club.js';
import { attach as attachGrifos } from '../highlights.js';
import * as G from '../highlights.js';
import { openStory } from './story.js';

const go = (hash) => { location.hash = hash; };
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' }).format(new Date(ts));
const pct = (p) => `${Math.round((p || 0) * 100)}%`;

function tabs(on) {
  // três seções, nomes simples: conceitos, álbuns, artistas / bateristas
  const items = [['#/estudos', 'conceitos', 'study'], ['#/estudos/club', 'álbuns', 'note'], ['#/estudos/artistas', 'artistas / bateristas', 'drummer']];
  const art = ['#/estudos/artistas', '#/estudos/cat/bateristas', '#/estudos/conexoes', '#/estudos/lab'].includes(on);
  const cur = (href) => (href === '#/estudos/artistas' ? art : href === '#/estudos' ? !art && on !== '#/estudos/club' : on === href);
  return h('nav', { class: 'lib-tabs chips', 'aria-label': 'Seções de Estudos' },
    items.map(([href, t, ic]) => h('a', { href, class: `lib-tab drawer-tab${cur(href) ? ' on' : ''}`, 'aria-current': cur(href) ? 'page' : null }, icon(ic, 16), t)));
}

const isArtist = (a) => a.collection === 'laboratorio-de-artistas';
function card(a, { snippet } = {}) {
  const st = lib.getState(a.slug); const cat = category(categoryOf(a));
  const line = snippet ? `…${snippet}…` : (isArtist(a) ? QUESTION[a.slug] : PT[a.slug]) || a.meta.summary || '';
  return h('a', { class: `lib-card${isArtist(a) ? ' with-ph' : ''}`, href: `#/estudos/a/${a.slug}` },
    isArtist(a) ? artPhoto(a.slug, a.title) : null,
    h('span', { class: 'lib-kicker' }, cat ? cat.label : a.collection, a.meta.difficulty ? ` · ${lib.DIFF[a.meta.difficulty] || a.meta.difficulty}` : '', a.meta.estimated_read_time ? ` · ${a.meta.estimated_read_time}` : ''),
    h('strong', { class: 'lib-title' }, a.title, st.fav ? h('span', { class: 'lib-fav', 'aria-label': 'favorito' }, ' ★') : null),
    a.titleEn ? h('small', { class: 'lib-en', lang: 'en' }, a.titleEn) : null,
    h('span', { class: 'lib-sum' }, line),
    st.progress ? h('span', { class: 'lib-bar', role: 'progressbar', 'aria-valuenow': Math.round(st.progress * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'progresso de leitura' }, h('i', { style: { width: pct(st.progress) } })) : null);
}

function statusNote() {
  if (lib.status.source === 'cache') return h('p', { class: 'pad-x lib-note' }, 'sem internet: mostrando a cópia guardada neste aparelho.');
  if (lib.status.source === 'none') return h('div', { class: 'empty' }, h('p', { class: 'hand' }, lib.status.error === 'auth' ? 'entre de novo para abrir a biblioteca.' : 'a biblioteca ainda não abriu.'), h('p', { class: 'muted' }, lib.status.error === 'offline' ? 'precisa de internet na primeira vez; depois fica guardada para ler offline.' : 'se estiver vazia, importe os textos (.zip ou .md) aqui embaixo.'));
  return null;
}

function importer(onDone) {
  const input = h('input', { type: 'file', accept: '.zip,.md', multiple: true });
  const out = h('small', { 'aria-live': 'polite' });
  input.addEventListener('change', async () => {
    if (!input.files.length) return;
    out.textContent = 'importando…';
    try {
      const r = await lib.importFiles([...input.files], (d, t) => { out.textContent = `importando ${d}/${t}…`; });
      out.textContent = `${r.imported} textos importados${r.skipped ? ` · ${r.skipped} ignorados` : ''}.`;
      onDone && onDone();
    } catch (e) { out.textContent = e.code === 'auth' ? 'precisa estar logada e com internet.' : 'não deu para importar agora (sem internet?).'; }
    input.value = '';
  });
  return h('div', { class: 'card pad' },
    h('h2', { class: 'tag' }, 'importar textos'),
    h('p', { class: 'muted' }, 'arquivos .md ou o .zip da biblioteca. ficam só no seu banco privado.'),
    h('label', { class: 'btn small' }, input, 'escolher arquivos'), out);
}

/* ---------- início da biblioteca ("Hoje") ---------- */
const GROUPS = [
  { title: 'Ritmo & corpo', blurb: 'pulso, groove, microtempo e como o corpo aprende e fixa o que você treina.', cats: ['ritmo', 'pratica'], deco: 'sticks' },
  { title: 'Ouvido & emoção', blurb: 'o que o cérebro prevê, separa e sente: por que a música arrepia.', cats: ['escuta', 'prazer'], deco: 'note' },
  { title: 'Palco & ensino', blurb: 'pressão, fluxo e a arte de explicar o óbvio.', cats: ['palco'], deco: 'bolt-red' },
];
const MURAL = (n) => `url(assets/mural/${n}.svg)`;
const dayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const dayLabel = () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'short' }).format(new Date()).replace('.', '');
const TODO = ['ler 1', 'anotar 1 ideia', 'postar 1 arte'];
const readTodo = () => { try { return JSON.parse(localStorage.getItem(`estudos-hoje-${dayKey()}`)) || []; } catch { return []; } };
const saveTodo = (v) => { try { localStorage.setItem(`estudos-hoje-${dayKey()}`, JSON.stringify(v)); } catch { /* sem armazenamento: segue sem lembrar */ } };
const searchIcon = () => { const n = 'http://www.w3.org/2000/svg'; const s = document.createElementNS(n, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', 18); s.setAttribute('height', 18); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', 2); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>'; return s; };

function mountHome(host) {
  const found = h('div', { class: 'h-found', hidden: true });
  const q = h('input', { type: 'search', placeholder: 'buscar conceito, artista ou tag', 'aria-label': 'Buscar na biblioteca', enterkeyhint: 'search' });
  const body = h('div', { class: 'hoje-body' });
  const tile = (href, ic, big, label, sub) => h('a', { class: 'h-tile', href }, h('i', { style: { backgroundImage: MURAL(ic) } }), h('b', {}, big), h('span', {}, label), h('small', {}, sub));
  const starBtn = (a) => { const b = h('button', { class: 'h-star', type: 'button', 'aria-label': 'Favoritar', 'aria-pressed': String(!!lib.getState(a.slug).fav) }, '★'); b.addEventListener('click', async (e) => { e.preventDefault(); e.stopPropagation(); const f = !lib.getState(a.slug).fav; await lib.patchState(a.slug, { fav: f }); toast(f ? 'nos favoritos ★' : 'removido dos favoritos'); }); return b; };
  const row = (a) => { const st = lib.getState(a.slug); return h('a', { class: 'h-item', href: `#/estudos/a/${a.slug}` }, h('b', {}, a.title), starBtn(a), h('span', { class: 'h-bar', role: 'progressbar', 'aria-valuenow': Math.round((st.progress || 0) * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'progresso de leitura' }, h('i', { style: { width: pct(st.progress) } })), h('small', {}, `${pct(st.progress)} lido · ${(category(categoryOf(a)) || {}).label || ''}`)); };
  const draw = () => {
    const idx = lib.items(); const states = lib.allStates();
    const doneSet = new Set(states.filter((s) => s.done).map((s) => s.slug));
    const reading = states.filter((s) => s.lastRead && !s.done).sort((a, b) => b.lastRead - a.lastRead).map((s) => lib.bySlug(s.slug)).filter(Boolean).slice(0, 3);
    const pool = idx.filter((a) => !doneSet.has(a.slug)); const daySeed = Number(dayKey().replace(/-/g, ''));
    const today = (pool.length ? pool : idx)[daySeed % (pool.length || idx.length || 1)] || null;
    const favN = states.filter((s) => s.fav && lib.bySlug(s.slug)).length;
    const todo = readTodo();
    const kids = [statusNote()];
    if (today) {
      const st = lib.getState(today.slug);
      kids.push(h('div', { class: 'h-hero' }, h('i', { class: 'h-tape a' }), h('i', { class: 'h-tape b' }), h('i', { class: 'h-star' }),
        h('div', { class: 'h-paper' },
          h('span', { class: 'h-kick' }, `estudo do dia${today.meta.estimated_read_time ? ` · ${today.meta.estimated_read_time}` : ''}`),
          h('h3', {}, today.title),
          h('p', {}, (isArtist(today) ? QUESTION[today.slug] : PT[today.slug]) || today.meta.summary || ''),
          st.progress ? h('div', { class: 'h-pbar', role: 'progressbar', 'aria-valuenow': Math.round(st.progress * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'progresso de leitura' }, h('i', { style: { width: pct(st.progress) } })) : null,
          h('div', { class: 'h-row' }, h('a', { class: 'h-btn', href: `#/estudos/a/${today.slug}` }, st.progress ? 'continuar' : 'ler agora'),
            h('button', { class: 'h-link', type: 'button', onclick: () => { const p = pool.length ? pool : idx; go(`#/estudos/a/${p[Math.floor(Math.random() * p.length)].slug}`); } }, 'sortear outro')))));
    }
    kids.push(h('div', { class: 'h-trio' },
      tile('#/anotacoes', 'clip', String(G.all().length), 'caderno', 'notas e grifos'),
      tile('#/dicionario', 'sticks', 'A–Z', 'dicionário da bateria', 'palavras e termos'),
      tile('#/estudos/favoritos', 'star-red', String(favN), 'favoritos', 'conceitos')));
    if (reading.length) kids.push(h('section', { class: 'h-sec' }, h('h3', {}, 'continuar'), reading.map(row)));
    kids.push(h('section', { class: 'h-sec' }, h('h3', {}, 'de hoje'), h('div', { class: 'h-chips' }, TODO.map((t, i) => { const cb = h('input', { type: 'checkbox', checked: !!todo[i] }); cb.addEventListener('change', () => { const v = readTodo(); v[i] = cb.checked; saveTodo(v); }); return h('label', {}, cb, t); }))));
    if (idx.length) {
      kids.push(h('section', { class: 'h-sec' }, h('h3', {}, 'temas'), GROUPS.map((g) => {
        const items = idx.filter((a) => g.cats.includes(categoryOf(a))); const n = items.filter((a) => doneSet.has(a.slug)).length;
        return h('div', { class: 'h-group' }, h('i', { style: { backgroundImage: MURAL(g.deco) } }), h('h4', {}, g.title), h('p', {}, g.blurb),
          h('div', { class: 'h-sub' }, g.cats.map((c) => h('a', { href: `#/estudos/cat/${c}` }, `${category(c).label} · ${idx.filter((a) => categoryOf(a) === c).length}`))),
          h('span', { class: 'h-bar', role: 'progressbar', 'aria-valuenow': items.length ? Math.round(n / items.length * 100) : 0, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': `progresso em ${g.title}` }, h('i', { style: { width: items.length ? `${Math.round(n / items.length * 100)}%` : '0%' } })),
          h('span', { class: 'h-n' }, `${n} de ${items.length} lidos`));
      })));
      kids.push(h('div', { class: 'h-more' }, h('a', { href: '#/estudos/club' }, 'álbuns'), h('a', { href: '#/estudos/artistas' }, 'artistas e bateristas'), h('a', { href: '#/mural' }, 'mural de artistas')));
    }
    body.replaceChildren(...kids.filter(Boolean));
  };
  q.addEventListener('input', debounce(() => {
    const v = q.value.trim();
    body.hidden = !!v; found.hidden = !v;
    if (!v) return;
    const r = lib.search(v).slice(0, 8);
    found.replaceChildren(...(r.length ? r.map(({ a }) => h('a', { href: `#/estudos/a/${a.slug}` }, a.title, h('small', {}, (category(categoryOf(a)) || {}).label || ''))) : [h('p', { class: 'h-note' }, 'nada achado. tente outra palavra.')]));
  }, 150));
  const hoje = h('div', { class: 'hoje' },
    h('div', { class: 'h-head' }, h('h2', {}, 'Hoje'), h('div', { class: 'h-date' }, dayLabel())),
    h('div', { class: 'h-search' }, searchIcon(), q, found), body);
  host.append(banner('Conceitos', 'o que a ciência diz sobre música, ritmo e estudo'), tabs('#/estudos'), hoje,
    importer(async () => { lib.resetIndex(); await lib.loadIndex(); draw(); }));
  lib.loadIndex().then(() => { draw(); lib.prefetch().catch(() => {}); });
  return store.subscribe((i) => { if (!i.kind || i.kind === 'study' || i.kind === G.KIND) draw(); });
}

function catCard(c, idx) {
  const items = idx.filter((a) => categoryOf(a) === c.id);
  if (c.kind === 'artist') {
    return h('a', { class: 'cat-card', href: `#/estudos/cat/${c.id}` },
      h('span', { class: 'cat-faces' }, items.slice(0, 3).map((a) => artPhoto(a.slug, a.title))),
      h('strong', {}, c.label), h('small', {}, `${items.length} perfis · ${c.blurb}`));
  }
  return h('a', { class: 'lib-card col', href: `#/estudos/cat/${c.id}` }, h('strong', { class: 'lib-title' }, c.label), h('span', { class: 'lib-sum' }, c.blurb), h('span', { class: 'lib-kicker' }, `${items.length} textos`));
}

/* ---------- categoria (bateristas, músicos, produtores, ritmo, prática…) ---------- */
function mountCategory(host, id) {
  const c = category(id);
  if (!c) { go('#/estudos'); return null; }
  let diff = '';
  const chips = h('nav', { class: 'chips lib-tabs cat-chips', 'aria-label': 'Categorias' }, CATEGORIES.map((x) => h('a', { class: `lib-tab${x.id === id ? ' on' : ''}`, href: `#/estudos/cat/${x.id}`, 'aria-current': x.id === id ? 'page' : null }, x.label)));
  const filters = h('div', { class: 'card pad' });
  const list = h('div');
  const draw = () => {
    const items = lib.items().filter((a) => categoryOf(a) === id);
    filters.replaceChildren(h('select', { 'aria-label': 'nível', onchange: (e) => { diff = e.target.value; draw(); } }, h('option', { value: '' }, 'qualquer nível'), Object.entries(lib.DIFF).map(([v, t]) => h('option', { value: v, selected: v === diff }, t))));
    const shown = items.filter((a) => !diff || a.meta.difficulty === diff);
    list.replaceChildren(!shown.length ? (statusNote() || h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum texto aqui ainda.')))
      : c.kind === 'artist' ? h('div', { class: 'art-grid' }, shown.map((a, i) => h('a', { class: `art-card tilt${i % 3}`, href: `#/estudos/a/${a.slug}` }, artPhoto(a.slug, a.title, 'art-ph big'), h('strong', {}, a.title), h('small', {}, QUESTION[a.slug] || ''))))
        : h('div', { class: 'lib-list' }, shown.map((a) => card(a))));
  };
  host.append(banner(c.label, c.blurb), tabs(c.kind === 'artist' ? '#/estudos/artistas' : '#/estudos'), chips, filters, list);
  lib.loadIndex().then(draw);
  return store.subscribe((i) => { if (!i.kind || i.kind === 'study' || i.id === ART_KEY) draw(); });
}

/* ---------- coleção com filtros ---------- */
function mountCollection(host, col) {
  const c = lib.COLLECTIONS[col];
  if (!c) { go('#/estudos'); return null; }
  let tag = '', diff = '';
  const filters = h('div', { class: 'card pad' });
  const list = h('div', { class: 'lib-list' });
  const draw = () => {
    const items = lib.items().filter((a) => a.collection === col);
    const tags = [...new Set(items.flatMap((a) => a.meta.tags || []))].sort();
    const sel = (opts, val, set, label) => { const s = h('select', { 'aria-label': label, onchange: (e) => { set(e.target.value); draw(); } }, h('option', { value: '' }, label), opts.map(([v, t]) => h('option', { value: v, selected: v === val }, t))); return s; };
    filters.replaceChildren(h('div', { class: 'grid2' },
      sel(tags.map((t) => [t, t]), tag, (v) => { tag = v; }, 'todas as tags'),
      sel(Object.entries(lib.DIFF), diff, (v) => { diff = v; }, 'qualquer nível')));
    const shown = items.filter((a) => (!tag || (a.meta.tags || []).includes(tag)) && (!diff || a.meta.difficulty === diff));
    list.replaceChildren(...(shown.length ? shown.map((a) => card(a)) : [statusNote() || h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum texto com esse filtro.'))]));
  };
  host.append(banner(c.label, c.blurb), tabs(`#/estudos/c/${col}`), filters, list);
  lib.loadIndex().then(draw);
  return store.subscribe((i) => { if (!i.kind || i.kind === 'study') draw(); });
}

/** Foto grande do artista no leitor, com crédito e troca. */
function artHero(slug, name) {
  const fig = h('figure', { class: 'art-hero' });
  const paint = () => fig.replaceChildren(artPhoto(slug, name, 'art-ph big'), h('figcaption', {}, credit(slug),
    h('span', { class: 'row' },
      h('button', { class: 'link', type: 'button', onclick: async () => { if (await changePhoto(slug)) { toast('foto trocada.'); paint(); } } }, 'trocar foto'),
      h('button', { class: 'link', type: 'button', onclick: async () => { await resetPhoto(slug); paint(); } }, 'voltar à original'))));
  paint();
  return fig;
}

/* ---------- leitor ---------- */
function mountArticle(host, slug) {
  const wrap = h('article', { class: 'reader' }, h('p', { class: 'lib-note pad-x' }, 'abrindo…'));
  host.append(wrap);
  let offScroll = () => {}; let offHl = () => {}; let offSel = () => {}; let lastSel = '';
  (async () => {
    await lib.loadIndex();
    const row = await lib.loadBody(slug);
    if (!row) { wrap.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'não achei esse texto.'), h('a', { class: 'btn primary', href: '#/estudos' }, 'voltar à biblioteca'))); return; }
    const a = { ...row, meta: row.meta || {} };
    const st0 = lib.getState(slug);
    lib.patchState(slug, { lastRead: Date.now() });
    const { nodes, headings } = renderMarkdown(a.body);
    const content = h('div', { class: 'reader-body' }, nodes);

    // experimentos: "marcar experimento feito"
    content.querySelectorAll('h3[data-exp]').forEach((el) => {
      const n = el.dataset.exp; const label = el.textContent.trim();
      const btn = h('button', { class: 'btn small exp-btn', type: 'button' });
      const paint = () => { const d = (lib.getState(slug).exps || {})[n]; btn.textContent = d ? `feito em ${when(d)} ✓` : 'marcar experimento feito'; btn.classList.toggle('on', !!d); };
      btn.addEventListener('click', async () => {
        const exps = { ...(lib.getState(slug).exps || {}) };
        if (exps[n]) delete exps[n]; else { exps[n] = Date.now(); stars(btn); }
        await lib.patchState(slug, { exps, expLabels: { ...(lib.getState(slug).expLabels || {}), [n]: label } }); paint();
      });
      paint(); el.after(btn);
    });

    // meu laboratório: cada pergunta em negrito vira um campo salvo
    content.querySelectorAll('ul.fields li').forEach((li) => {
      const key = li.dataset.field;
      const ta = h('textarea', { rows: 2, 'aria-label': key, placeholder: 'sua resposta…' }, (lib.getState(slug).answers || {})[key] || '');
      const save = debounce(() => lib.patchState(slug, { answers: { ...(lib.getState(slug).answers || {}), [key]: ta.value } }), 500);
      ta.addEventListener('input', save); ta.addEventListener('blur', () => save.flush());
      li.append(ta);
    });

    // links de "conexões"/relacionados que apontam para textos da biblioteca abrem dentro do app
    const related = lib.relatedOf(a);
    const favBtn = h('button', { class: `icon-btn${st0.fav ? ' on' : ''}`, type: 'button', 'aria-pressed': String(!!st0.fav), 'aria-label': 'Favoritar texto', onclick: async () => { const f = !lib.getState(slug).fav; await lib.patchState(slug, { fav: f }); favBtn.classList.toggle('on', f); favBtn.setAttribute('aria-pressed', String(f)); toast(f ? 'nos favoritos ★' : 'removido dos favoritos'); } }, icon('star', 22));
    const tocBtn = headings.length > 3 ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => sheet('Índice', (close) => h('div', { class: 'sheet-body toc' }, headings.filter((x) => x.level === 2).map((x) => h('a', { href: `#s-${x.id}`, onclick: (e) => { e.preventDefault(); close(); document.getElementById(x.id).scrollIntoView({ behavior: 'smooth' }); } }, x.text)))) }, 'índice') : null;
    const storyBtn = h('button', { class: 'btn small', type: 'button', onclick: () => { const picked = (String(getSelection()).replace(/\s+/g, ' ').trim()) || lastSel; openStory({ text: picked.length > 8 ? picked : (PT[slug] || a.meta.summary || a.title), src: a.title }); } }, '↗ stories');
    const onSel = () => { const t = String(getSelection()).replace(/\s+/g, ' ').trim(); const n = getSelection().anchorNode; if (t && n && content.contains(n.nodeType === 1 ? n : n.parentNode)) lastSel = t; };
    document.addEventListener('selectionchange', onSel); offSel = () => document.removeEventListener('selectionchange', onSel);
    const readBtn = h('button', { class: 'btn small', type: 'button' });
    const paintRead = () => { const d = lib.getState(slug).done; readBtn.textContent = d ? 'lido ✓' : 'marcar como lido'; readBtn.classList.toggle('on', !!d); };
    readBtn.addEventListener('click', async () => { const d = !lib.getState(slug).done; await lib.patchState(slug, { done: d, progress: d ? 1 : lib.getState(slug).progress }); if (d) { stamp(readBtn); stars(readBtn); } paintRead(); });
    paintRead();
    const col = lib.COLLECTIONS[a.collection];
    wrap.replaceChildren(...[
      h('header', { class: 'reader-head' },
        h('a', { class: 'link', href: col ? `#/estudos/c/${a.collection}` : '#/estudos' }, '← ', col ? col.label : 'biblioteca'),
        isArtist(a) ? artHero(slug, a.title) : null,
        h('p', { class: 'lib-kicker' }, (category(categoryOf(a)) || {}).label || ''),
        h('h1', { class: 'reader-title' }, a.title),
        a.titleEn ? h('p', { class: 'lib-en', lang: 'en' }, a.titleEn) : null,
        PT[slug] ? h('p', { class: 'reader-pt' }, PT[slug]) : null,
        isArtist(a) && QUESTION[slug] ? h('p', { class: 'reader-pt' }, QUESTION[slug]) : (a.meta.summary ? h('p', { class: 'reader-sum' }, a.meta.summary) : null),
        h('p', { class: 'lib-kicker' }, [a.meta.difficulty && (lib.DIFF[a.meta.difficulty] || a.meta.difficulty), a.meta.estimated_read_time, a.meta.source_count && `${a.meta.source_count} fontes`, a.meta.last_researched && `pesquisa ${a.meta.last_researched}`].filter(Boolean).join(' · ')),
        h('div', { class: 'row' }, favBtn, tocBtn, readBtn, storyBtn)),
      content,
      related.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'relacionados'), h('div', { class: 'lib-rel' }, related.map((r) => r.hit ? h('a', { class: 'chip-link', href: `#/estudos/a/${r.hit.slug}` }, r.title) : h('span', { class: 'chip-link off', title: 'ainda não está na biblioteca' }, r.title)))) : null,
      h('div', { class: 'row pad-x reader-foot' }, h('a', { class: 'btn small ghost', href: '#/estudos' }, 'voltar à biblioteca'))].filter(Boolean));

    const hl = attachGrifos(wrap, () => ({ id: `art:${slug}`, title: a.title, href: `#/estudos/a/${slug}` })); hl.apply(); offHl = hl.off;

    // progresso de leitura pelo scroll (guarda o máximo)
    let best = st0.progress || 0;
    // volta de onde parou (se já leu parte e não terminou)
    if (best > 0.05 && best < 0.97 && !st0.done) setTimeout(() => { const r = content.getBoundingClientRect(); const total = r.height - innerHeight * 0.6; if (total > 0) { scrollTo(0, scrollY + r.top + best * total); toast('voltei de onde você parou', { ms: 1600 }); } }, 300);
    const saveProg = debounce(() => lib.patchState(slug, { progress: best }), 800);
    const onScroll = () => {
      const r = content.getBoundingClientRect(); const total = r.height - innerHeight * 0.6;
      const p = Math.max(0, Math.min(1, total > 0 ? -r.top / total : 1));
      if (p > best + 0.02) { best = p; saveProg(); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    offScroll = () => { removeEventListener('scroll', onScroll); saveProg.flush(); };
  })();
  return () => { offScroll(); offHl(); offSel(); };
}

/* ---------- favoritos ---------- */
function mountFavs(host) {
  const list = h('div', { class: 'lib-list' });
  const draw = () => { const f = lib.allStates().filter((s) => s.fav).map((s) => lib.bySlug(s.slug)).filter(Boolean); list.replaceChildren(...(f.length ? f.map((a) => card(a)) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum favorito ainda.'), h('p', { class: 'muted' }, 'toque na estrela dentro de um texto.'))])); };
  host.append(banner('Favoritos', 'os textos que você quer ter à mão'), tabs('#/estudos/favoritos'), list);
  lib.loadIndex().then(draw);
  return store.subscribe((i) => { if (!i.kind || i.kind === 'study') draw(); });
}

/* ---------- conexões artista ↔ conceito ---------- */
function mountConnections(host) {
  const box = h('div');
  const draw = () => {
    const idx = lib.items(); const byTitle = new Map(idx.map((a) => [slugify(a.title), a]));
    const artists = idx.filter((a) => a.collection === 'laboratorio-de-artistas');
    const concepts = new Map();
    const rows = artists.map((a) => {
      const links = (a.meta.related_articles || []).map((t) => ({ t, hit: byTitle.get(slugify(t)) || idx.find((x) => x.slug === slugify(t)) }));
      links.forEach((l) => { if (!concepts.has(l.t)) concepts.set(l.t, { hit: l.hit, artists: [] }); concepts.get(l.t).artists.push(a); });
      return h('div', { class: 'conn-row' }, h('a', { class: 'conn-artist', href: `#/estudos/a/${a.slug}` }, a.title),
        h('div', { class: 'lib-rel' }, links.map((l) => l.hit ? h('a', { class: 'chip-link', href: `#/estudos/a/${l.hit.slug}` }, l.t) : h('span', { class: 'chip-link off' }, l.t))));
    });
    const byConcept = [...concepts.entries()].filter(([, v]) => v.artists.length > 1).sort((x, y) => y[1].artists.length - x[1].artists.length);
    box.replaceChildren(...[
      statusNote(),
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'artista → conceitos'), rows.length ? rows : h('p', { class: 'muted' }, 'importe os perfis de artistas para ver o mapa.')),
      byConcept.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'conceitos que aparecem em vários artistas'),
        byConcept.map(([t, v]) => h('div', { class: 'conn-row' }, v.hit ? h('a', { class: 'conn-artist', href: `#/estudos/a/${v.hit.slug}` }, t) : h('strong', { class: 'conn-artist' }, t),
          h('div', { class: 'lib-rel' }, v.artists.map((a) => h('a', { class: 'chip-link', href: `#/estudos/a/${a.slug}` }, a.title)))))) : null].filter(Boolean));
  };
  host.append(banner('Conexões', 'quem usa qual ideia'), tabs('#/estudos/conexoes'), box);
  lib.loadIndex().then(draw);
  return null;
}

/* ---------- meu laboratório: experimentos, respostas e cartões de recordação ---------- */
function mountLab(host) {
  const box = h('div');
  const draw = () => {
    const states = lib.allStates();
    const exps = states.flatMap((s) => Object.entries(s.exps || {}).map(([n, t]) => ({ slug: s.slug, n, t, label: (s.expLabels || {})[n] || `experimento ${n}` }))).sort((a, b) => b.t - a.t);
    const notes = states.filter((s) => Object.values(s.answers || {}).some((v) => v && v.trim()));
    box.replaceChildren(
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'desafio rápido'),
        h('p', { class: 'muted' }, 'opcional, tipo jogo: uma pergunta dos textos que você já abriu. tente responder antes de virar.'),
        h('button', { class: 'btn primary', type: 'button', onclick: flashcard }, 'puxar uma carta')),
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'histórico de experimentos'),
        exps.length ? h('ul', { class: 'lab-list' }, exps.map((e) => { const a = lib.bySlug(e.slug); return h('li', {}, h('a', { href: `#/estudos/a/${e.slug}` }, e.label), h('small', {}, ` · ${a ? a.title : e.slug} · ${when(e.t)}`)); }))
          : h('p', { class: 'muted' }, 'nenhum experimento marcado ainda. dentro de cada texto tem o botão “marcar experimento feito”.')),
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'minhas anotações'),
        notes.length ? notes.map((s) => { const a = lib.bySlug(s.slug); return h('div', { class: 'lab-note' }, h('a', { class: 'link', href: `#/estudos/a/${s.slug}` }, a ? a.title : s.slug), h('dl', {}, Object.entries(s.answers).filter(([, v]) => v && v.trim()).map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]))); })
          : h('p', { class: 'muted' }, 'suas respostas do “meu laboratório” aparecem aqui.')));
  };
  host.append(banner('Meu Laboratório', 'experimentos, hipóteses e resultados'), tabs('#/estudos/lab'), box);
  lib.loadIndex().then(draw);
  return store.subscribe((i) => { if (!i.kind || i.kind === 'study') draw(); });
}

/** Cartões de recordação ativa a partir dos blocos <details> dos textos já baixados. */
async function flashcard() {
  const opened = lib.allStates().filter((s) => s.lastRead).map((s) => s.slug);
  const pool = [];
  for (const slug of opened) {
    const row = await lib.loadBody(slug); if (!row) continue;
    // a pergunta é o título ### mais próximo acima de cada bloco <details>
    const re = /<details>\s*<summary>[^<]*<\/summary>([\s\S]*?)<\/details>/g; let m;
    while ((m = re.exec(row.body))) {
      const at = row.body.lastIndexOf('\n### ', m.index); if (at < 0) continue;
      const q = row.body.slice(at + 5, row.body.indexOf('\n', at + 5)).replace(/—.*$/, '').trim();
      pool.push({ slug, title: row.title, q, a: m[1].trim() });
    }
  }
  if (!pool.length) { toast('abra um texto primeiro: as cartas saem dos textos que você já leu.'); return; }
  const c = pool[Math.floor(Math.random() * pool.length)];
  sheet('Desafio rápido', (close) => {
    const ans = h('div', { class: 'reader-body flash-a', hidden: true }, renderMarkdown(c.a).nodes);
    const flip = h('button', { class: 'btn primary', type: 'button', onclick: () => { ans.hidden = false; flip.hidden = true; } }, 'virar a carta');
    return h('div', { class: 'sheet-body' }, h('p', { class: 'lib-kicker' }, c.title), h('p', { class: 'flash-q' }, `${c.q} sobre ${c.title.toLowerCase()}.`), flip, ans,
      h('div', { class: 'row end' }, h('a', { class: 'btn small ghost', href: `#/estudos/a/${c.slug}`, onclick: close }, 'abrir texto'), h('button', { class: 'btn small', type: 'button', onclick: () => { close(); setTimeout(flashcard, 250); } }, 'outra carta')));
  });
}

/* ---------- artistas / bateristas ---------- */
function mountArtistas(host) {
  const body = h('div');
  const draw = () => {
    const idx = lib.items();
    body.replaceChildren(
      h('section', {}, h('h2', { class: 'tag pad-x' }, 'perfis'), h('div', { class: 'cat-grid' }, CATEGORIES.filter((c) => c.kind === 'artist').map((c) => catCard(c, idx)))),
      h('section', {}, h('h2', { class: 'tag pad-x' }, 'mais sobre artistas'), h('div', { class: 'hub-grid' },
        ...[['#/estudos/conexoes', 'link', 'Artista e conceito', 'qual conceito aparece em qual artista'], ['#/estudos/lab', 'study', 'Laboratório', 'experimentos pra testar na bateria'], ['#/mural', 'photo', 'Mural de Artistas', 'sua parede de fotos']]
          .map(([href, ic, t, d]) => h('a', { class: 'hub-card', href }, h('span', { class: 'hub-ic' }, icon(ic, 26)), h('b', {}, t), h('small', {}, d))))));
  };
  host.append(banner('Artistas / bateristas', 'quem pensa a música, e o que aprender com eles'), tabs('#/estudos/artistas'), body);
  lib.loadIndex().then(draw); draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'study') draw(); });
}

export function mount(host, parts) {
  const [kind, arg] = parts;
  if (kind === 'artistas') return mountArtistas(host);
  if (kind === 'c') return mountCollection(host, arg);
  if (kind === 'cat' && arg) return mountCategory(host, arg);
  if (kind === 'club') return arg ? mountPost(host, arg, tabs('#/estudos/club')) : mountClub(host, tabs('#/estudos/club'));
  if (kind === 'a' && arg) return mountArticle(host, arg);
  if (kind === 'favoritos') return mountFavs(host);
  if (kind === 'conexoes') return mountConnections(host);
  if (kind === 'lab') return mountLab(host);
  return mountHome(host);
}
