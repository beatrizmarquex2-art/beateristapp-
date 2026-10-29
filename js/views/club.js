// The Listening Club: o clube de escuta da Bea, dentro de Meus Estudos,
// no visual normal do app (tema rabisco).
// Textos = registros "clubpost"; discos da estante = registros "album" (dados do MusicBrainz, capa do Cover Art Archive).
import { h } from '../util.js';
import * as store from '../store.js';
import * as lib from '../lib.js';
import { renderMarkdown, slugify } from '../md.js';
import { banner, sheet, toast, confirmSheet, stars } from '../ui.js';
import { pickImages, saveImage, imageUrl } from './mural.js';
import { artPhoto } from './artist-photo.js';
import { WIKI } from '../catalog.js';
import { STATUS, mbSearchUrl, coverUrl, parseMB, albumLine, shelfSort } from '../albums-logic.js';
import { releasesUrl, releaseUrl, pickRelease, parseRelease, mbPage, wikiSearchUrl, wikiSummaryUrl, pickWikiTitle } from '../musicdata.js';
import { parseTextFile, docxToMarkdown, isText, isDocx } from '../textimport.js';
import { readZip } from '../zip.js';
import { attach as attachGrifos } from '../highlights.js';
import { mountArsenal } from './arsenal.js';
import { isCollection, collectionName, parseArsenal, skipSheet, sortRefs, searchRefs, KIND_LABEL } from '../collection.js';

export const SECTIONS = [
  { id: 'album', label: 'Álbum por Dentro', pt: 'um disco aberto faixa por faixa: história, créditos e gravação' },
  { id: 'anatomia', label: 'Anatomia Musical', pt: 'como a música foi montada: bateria, baixo, harmonia e produção' },
  { id: 'historias', label: 'Histórias Escondidas', pt: 'bastidores de gravação e acasos que mudaram tudo' },
  { id: 'dna', label: 'DNA Musical', pt: 'as manias criativas que fazem um artista soar como ele mesmo' },
  { id: 'versoes', label: 'Versões e Gravações', pt: 'demo, estúdio, ao vivo, cover: o que muda de uma pra outra' },
  { id: 'caderno', label: 'Caderno de Escuta', pt: 'o que eu ouvi hoje, o que senti e o que quero pesquisar' },
];
const sec = (id) => SECTIONS.find((s) => s.id === id) || SECTIONS[5];
const posts = () => store.list('clubpost');
const albums = () => store.list('album').sort(shelfSort);
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts)).replace('.', '');
/** Slug do Laboratório de Artistas que bate com o nome escrito no texto (se houver). */
export const labSlug = (name) => { const s = slugify(name || ''); return s && WIKI[s] ? s : null; };

/** Imagem do texto: a capa escolhida, a capa do disco (MusicBrainz) ou a foto livre do artista; senão, um vinil. */
function cover(d, cls) {
  const box = h('span', { class: `club-cover ${cls || ''}` }, h('b', { class: 'club-glyph' }, '♪'));
  const img = (u) => { const i = h('img', { src: u, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }); i.addEventListener('error', () => i.remove()); box.replaceChildren(i); };
  if (d.cover) imageUrl(d.cover).then((u) => { if (u) img(u); });
  else if (d.mbid) img(coverUrl(d.mbid, 500));
  else if (labSlug(d.artist)) box.replaceChildren(artPhoto(labSlug(d.artist), d.artist, 'art-ph fill'));
  return box;
}

function editor(rec, close, pre = {}) {
  const d = { section: 'caderno', status: 'rascunho', ...pre, ...(rec ? rec.data : {}) };
  let section = d.section, coverId = d.cover || null;
  const title = h('input', { type: 'text', maxlength: 120, value: d.title || '', placeholder: 'ex.: o bumbo de “When the Levee Breaks”', 'aria-label': 'Título' });
  const artist = h('input', { type: 'text', maxlength: 80, value: d.artist || '', placeholder: 'artista ou banda', 'aria-label': 'Artista' });
  const album = h('input', { type: 'text', maxlength: 80, value: d.album || '', placeholder: 'álbum ou música', 'aria-label': 'Álbum ou música' });
  const body = h('textarea', { rows: 10, placeholder: 'escreva livre. ## vira subtítulo, **negrito**, > citação, - lista.', 'aria-label': 'Texto' }, d.body || '');
  const sources = h('textarea', { rows: 3, placeholder: 'um link ou livro por linha', 'aria-label': 'Fontes' }, d.sources || '');
  const secRow = h('div', { class: 'chips wrap' });
  const drawSec = () => secRow.replaceChildren(...SECTIONS.map((s) => h('button', { type: 'button', class: `lib-tab${section === s.id ? ' on' : ''}`, 'aria-pressed': String(section === s.id), onclick: () => { section = s.id; drawSec(); } }, s.label)));
  drawSec();
  const coverBtn = h('button', { class: 'btn small', type: 'button', onclick: async () => { const [b] = await pickImages(false); if (b) { coverId = await saveImage(b); coverBtn.textContent = 'capa escolhida ✓'; } } }, coverId ? 'trocar capa' : 'escolher capa');
  const save = async (status) => {
    if (!title.value.trim()) { toast('dá um título, nem que seja provisório.'); title.focus(); return; }
    const v = { title: title.value.trim(), artist: artist.value.trim(), album: album.value.trim(), body: body.value, sources: sources.value.trim(), section, cover: coverId, mbid: d.mbid || null, status, date: d.date || Date.now() };
    const r = await store.upsert('clubpost', rec ? rec.id : null, v);
    close(); toast(status === 'publicado' ? 'publicado no seu clube ✓' : 'rascunho guardado');
    location.hash = `#/estudos/club/${r.id}`;
  };
  return h('div', { class: 'sheet-body' },
    h('label', { class: 'field' }, h('span', {}, 'título'), title),
    h('div', { class: 'field' }, h('span', {}, 'seção'), secRow),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', {}, 'artista'), artist), h('label', { class: 'field' }, h('span', {}, 'álbum / música'), album)),
    h('label', { class: 'field' }, h('span', {}, 'texto'), body),
    h('label', { class: 'field' }, h('span', {}, 'fontes'), sources, h('small', {}, 'fato com fonte, opinião marcada como opinião.')),
    h('div', { class: 'row' }, coverBtn, h('small', { class: 'muted' }, d.mbid ? 'sem capa sua, uso a capa do disco.' : 'sem capa, uso a foto do artista se ele estiver no Laboratório.')),
    h('div', { class: 'row end' },
      rec ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar texto?', d.title, 'Apagar')) { await store.remove(rec.id); close(); location.hash = '#/estudos/club'; } } }, 'apagar') : null,
      h('button', { class: 'btn ghost', type: 'button', onclick: () => save('rascunho') }, 'guardar rascunho'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => save('publicado') }, 'publicar')));
}
export const newPost = (pre) => sheet('Novo texto do clube', (close) => editor(null, close, pre));

function surprise() {
  const pub = posts().filter((p) => p.data.status === 'publicado');
  const idx = lib.items();
  const pool = [...pub.map((p) => `#/estudos/club/${p.id}`), ...idx.map((a) => `#/estudos/a/${a.slug}`)];
  if (!pool.length) { toast('ainda não tem nada pra sortear: escreva o primeiro texto!'); return; }
  location.hash = pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- ficha técnica (MusicBrainz) e resumo (Wikipedia) ---------- */
const getJson = async (u) => { const r = await fetch(u, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
async function fetchSheet(rgid) {
  const rid = pickRelease(await getJson(releasesUrl(rgid))); if (!rid) return null;
  await new Promise((ok) => setTimeout(ok, 1100)); // o MusicBrainz pede no máximo 1 pedido por segundo
  return { ...parseRelease(await getJson(releaseUrl(rid))), at: Date.now() };
}
async function fetchWiki(album, artist) {
  for (const lang of ['pt', 'en']) {
    try {
      const t = pickWikiTitle(await getJson(wikiSearchUrl(lang, `${album} ${artist} álbum`)), album); if (!t) continue;
      const sm = await getJson(wikiSummaryUrl(lang, t));
      if (sm && sm.extract) return { lang, title: sm.title || t, extract: sm.extract, url: (sm.content_urls && sm.content_urls.desktop && sm.content_urls.desktop.page) || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(t)}` };
    } catch { /* tenta a próxima língua */ }
  }
  return null;
}
/** Bloco da ficha técnica. `save(patch)` guarda no registro (disco ou matéria) pra não buscar de novo. */
function fichaEl(d, save) {
  const box = h('section', { class: 'card pad cl-ficha' });
  const draw = (busy, err) => {
    const f = d.sheet; const w = d.wiki;
    box.replaceChildren(...[
      h('div', { class: 'row between' }, h('h2', { class: 'tag' }, 'ficha técnica'), d.mbid ? h('button', { class: 'btn small', type: 'button', disabled: busy, onclick: load }, busy ? 'buscando…' : f ? 'atualizar' : 'trazer ficha técnica') : null),
      !d.mbid ? h('p', { class: 'muted' }, 'esse texto não está ligado a um disco. escreva a partir de “meus álbuns” pra ter a ficha automática.') : null,
      err ? h('p', { class: 'muted' }, 'não consegui buscar agora (sem internet?). tenta de novo depois.') : null,
      f ? h('div', { class: 'cl-ficha-grid' },
        h('div', {}, h('h3', {}, 'faixas'), f.tracks.length ? h('ol', { class: 'cl-tracks' }, ...f.tracks.map((t) => h('li', {}, h('span', {}, t.title), h('small', {}, t.len)))) : h('p', { class: 'muted' }, 'sem faixas na fonte.')),
        h('div', {}, h('h3', {}, 'quem tocou e quem fez'), f.people.length ? h('ul', { class: 'cl-people' }, ...f.people.map((x) => h('li', {}, h('b', {}, x.name), ` · ${x.roles.join(', ')}`))) : h('p', { class: 'muted' }, 'a fonte ainda não tem os créditos dos músicos desse disco.'),
          f.writers.length ? [h('h3', {}, 'composição'), h('ul', { class: 'cl-people' }, ...f.writers.map((x) => h('li', {}, h('b', {}, x.name), ` · ${x.roles.join(', ')}`)))] : null,
          f.studios.length || f.label || f.date ? h('p', { class: 'muted cl-meta' }, [f.studios.length ? `gravado em ${f.studios.join(', ')}` : '', f.label ? `selo ${f.label}` : '', f.date ? `lançado em ${f.date.split('-').reverse().join('/')}` : ''].filter(Boolean).join(' · ')) : null)) : null,
      w ? h('div', { class: 'cl-wiki' }, h('h3', {}, 'resumo'), h('p', {}, w.extract), h('small', { class: 'muted' }, 'fonte: ', h('a', { href: w.url, target: '_blank', rel: 'noopener noreferrer' }, `Wikipedia (${w.lang === 'pt' ? 'português' : 'inglês'}) · ${w.title}`))) : null,
      f ? h('small', { class: 'muted cl-meta' }, 'dados: ', h('a', { href: mbPage(d.mbid), target: '_blank', rel: 'noopener noreferrer' }, 'MusicBrainz'), ' (enciclopédia aberta feita por fãs; pode estar incompleta).') : null,
    ].filter(Boolean));
  };
  async function load() {
    draw(true);
    try { const sheet = await fetchSheet(d.mbid); const wiki = await fetchWiki(d.album || d.title, d.artist || ''); Object.assign(d, { sheet, wiki }); await save({ sheet, wiki }); draw(false); }
    catch { draw(false, true); }
  }
  draw(false);
  return box;
}

/* ---------- importar textos (.zip, .md, .txt, .docx) ---------- */
async function importTexts(files) {
  const found = [];
  const docx = async (bytes) => { const e = (await readZip(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))).find((x) => x.name === 'word/document.xml'); return e ? docxToMarkdown(new TextDecoder().decode(await e.read())) : ''; };
  for (const f of files) {
    const n = f.name;
    if (/\.zip$/i.test(n)) {
      const entries = await readZip(await f.arrayBuffer());
      if (isCollection(entries.map((e) => e.name))) { found.col = (found.col || 0) + (await importCollection(entries)); continue; }
      for (const e of entries) {
        if (isText(e.name)) found.push(parseTextFile(e.name, new TextDecoder().decode(await e.read())));
        else if (isDocx(e.name)) found.push(parseTextFile(e.name, await docx(await e.read())));
      }
    } else if (isText(n)) found.push(parseTextFile(n, await f.text()));
    else if (isDocx(n)) found.push(parseTextFile(n, await docx(new Uint8Array(await f.arrayBuffer()))));
  }
  const albs = albums();
  for (const t of found) {
    // se o disco já está na estante, liga o texto a ele (capa e ficha técnica automáticas)
    const a = albs.find((r) => r.data.mbid && t.album && r.data.title.toLowerCase() === t.album.toLowerCase());
    await store.upsert('clubpost', null, { ...t, cover: null, mbid: a ? a.data.mbid : null, status: 'rascunho', date: Date.now() });
  }
  return { n: found.length, col: found.col || 0 };
}
/** Pacote de pesquisa (álbuns + fichas de faixa + guias) → registros "clubref" com id fixo. Não vira rascunho. */
async function importCollection(entries) {
  const txt = entries.filter((e) => /\.txt$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name));
  const readme = txt.find((e) => /(^|\/)00_LEIA/i.test(e.name));
  const col = collectionName(readme ? new TextDecoder().decode(await readme.read()) : '', entries[0].name.split('/')[0]);
  const rows = []; const todo = txt.filter((e) => e !== readme && !skipSheet(e.name)); const when = Date.now();
  for (const e of todo) {
    const r = parseArsenal(e.name, new TextDecoder().decode(await e.read()), col);
    rows.push({ id: r.id, kind: 'clubref', data: r.data, updated_at: when + rows.length });
    if (rows.length % 200 === 0) toast(`lendo ${col}… ${rows.length}/${todo.length}`, { id: 'lc-imp', ms: 30000 });
  }
  toast(`guardando ${rows.length} fichas…`, { id: 'lc-imp', ms: 60000 });
  const n = await store.importBackup(rows); // um lote só: grava local de uma vez e a sincronização cuida do resto
  return n;
}
const refs = () => store.list('clubref');
const colSlug = (c) => slugify(c);
function collections() {
  const m = new Map();
  for (const r of refs()) { const k = r.data.col; if (!m.has(k)) m.set(k, { name: k, n: { album: 0, faixa: 0, lancamento: 0, guia: 0 } }); m.get(k).n[r.data.kind]++; }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
function pickTexts() {
  const input = h('input', { type: 'file', multiple: true, accept: '.zip,.md,.markdown,.txt,.docx', style: { display: 'none' } });
  document.body.append(input);
  input.addEventListener('change', async () => {
    const list = [...input.files]; input.remove(); if (!list.length) return;
    toast('lendo os textos…', { id: 'lc-imp', ms: 30000 });
    try {
      const { n: t, col: c } = await importTexts(list);
      toast(c ? `coleção importada ✓ ${c} fichas${t ? ` + ${t} texto(s) nos rascunhos` : ''}` : t ? `${t} texto(s) nos rascunhos ✓ revisa e publica` : 'não achei textos (.md, .txt ou .docx) aí dentro', { id: 'lc-imp', ms: 3000 });
    }
    catch (e) { toast(`não consegui ler: ${e.message || 'arquivo estranho'}`, { id: 'lc-imp', ms: 4000 }); }
  });
  input.click();
}

/* ---------- topo: título do app + ações ---------- */
function clubTop(host, tabs, sub) {
  host.append(banner(sub ? 'Meus discos' : 'Álbuns', sub ? 'o que já está na estante' : 'o que já tem aqui'), tabs);
  if (!sub) host.append(h('div', { class: 'row pad-x club-actions' }, h('button', { class: 'btn', type: 'button', onclick: pickTexts }, 'importar textos')));
}

export function mountClub(host, tabs) {
  const box = h('div');
  const draw = () => {
    const cols = collections();
    box.replaceChildren(h('a', { class: 'card pad cl-col', href: '#/estudos/club/arsenal' }, h('span', { class: 'lib-kicker' }, 'novo'), h('strong', {}, 'Arsenal discos'), h('small', { class: 'muted' }, 'todos os álbuns de A a Z, com busca')), ...(cols.length ? cols.map((c) => h('a', { class: 'card pad cl-col', href: `#/estudos/club/c:${colSlug(c.name)}` },
      h('span', { class: 'lib-kicker' }, 'coleção'), h('strong', {}, c.name),
      h('small', { class: 'muted' }, [c.n.album && `${c.n.album} álbuns`, c.n.faixa && `${c.n.faixa} faixas`, c.n.lancamento && `${c.n.lancamento} lançamentos`, c.n.guia && `${c.n.guia} guias`].filter(Boolean).join(' · '))))
      : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma coleção ainda.'), h('p', { class: 'muted' }, 'importa um pacote de textos (.zip) pra ele aparecer aqui.'))]));
  };
  clubTop(host, tabs); host.append(box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'clubref') draw(); });
}

export function mountPost(host, id, tabs) {
  if (id === 'discos') return mountShelf(host, tabs);
  if (id === 'arsenal') return mountArsenal(host, tabs);
  if (id.startsWith('c:')) return mountCollection(host, id.slice(2), tabs);
  if (id.startsWith('r:')) return mountRef(host, id.slice(2), tabs);
  const box = h('article', { class: 'reader' });
  const draw = () => {
    const rec = store.get(id);
    if (!rec || rec.deleted) { box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'esse texto não existe mais.'), h('a', { class: 'btn primary', href: '#/estudos/club' }, 'voltar ao clube'))); return; }
    const d = rec.data; const s = sec(d.section); const ls = labSlug(d.artist);
    const srcs = (d.sources || '').split('\n').map((x) => x.trim()).filter(Boolean);
    box.replaceChildren(...[
      h('header', { class: 'reader-head' },
        h('a', { class: 'link', href: '#/estudos/club' }, '← Álbuns'),
        cover(d, 'big'),
        h('p', { class: 'lib-kicker' }, s.label, ' · ', d.status === 'publicado' ? when(d.date || rec.updated_at) : 'rascunho'),
        h('h1', { class: 'reader-title' }, d.title),
        d.artist || d.album ? h('p', { class: 'reader-sum' }, [d.artist, d.album].filter(Boolean).join(' · ')) : null,
        h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => sheet('Editar texto', (close) => editor(rec, close)) }, 'editar'),
          ls ? h('a', { class: 'btn small ghost', href: `#/estudos/a/${ls}` }, `${d.artist} no Laboratório`) : null)),
      h('div', { class: 'reader-body' }, d.body ? renderMarkdown(d.body).nodes : h('p', { class: 'muted' }, 'texto vazio. toque em editar.')),
      d.mbid || d.section === 'album' ? fichaEl({ ...d }, (patch) => store.upsert('clubpost', rec.id, patch)) : null,
      srcs.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'fontes'), h('ul', { class: 'lab-list' }, ...srcs.map((x) => h('li', {}, /^https?:\/\//.test(x) ? h('a', { href: x, target: '_blank', rel: 'noopener noreferrer' }, x) : x)))) : null,
    ].filter(Boolean));
  };
  host.append(tabs, box);
  draw();
  const hl = attachGrifos(box, () => { const r = store.get(id); const d = r ? r.data : {}; return { id: `post:${id}`, title: [d.artist, d.title].filter(Boolean).join(' — ') || 'texto', href: `#/estudos/club/${id}` }; }); hl.apply();
  const off = store.subscribe((i) => { if (!i.kind || i.id === id) { draw(); hl.apply(); } });
  return () => { off(); hl.off(); };
}

/* ---------- coleções (pacotes de pesquisa importados) ---------- */
const refLink = (r, extra) => h('li', {}, h('a', { href: `#/estudos/club/r:${r.id}` }, r.data.title), extra || (r.data.date ? h('small', {}, ` · ${r.data.date.slice(0, 4)}`) : null));
function mountCollection(host, cs, tabs) {
  let q = '';
  const box = h('article', { class: 'reader' }); const results = h('div');
  const search = h('input', { type: 'search', placeholder: 'buscar música, álbum, pessoa, técnica…', 'aria-label': 'Buscar na coleção' });
  const mine = () => refs().filter((r) => colSlug(r.data.col) === cs);
  const drawResults = () => {
    const hits = searchRefs(mine(), q).slice(0, 40);
    results.replaceChildren(...(q.trim() ? [h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, `achei ${hits.length}${hits.length === 40 ? '+' : ''}`),
      hits.length ? h('ul', { class: 'lab-list' }, ...hits.map((r) => refLink(r, h('small', {}, ` · ${KIND_LABEL[r.data.kind]}${r.data.artist && r.data.kind !== 'album' ? ` · ${r.data.artist}` : ''}${r.data.kind === 'album' && r.data.artist ? ` · ${r.data.artist}` : ''}`)))) : h('p', { class: 'muted' }, 'nada com isso.'))] : []));
  };
  search.addEventListener('input', () => { q = search.value; drawResults(); });
  const draw = () => {
    const list = mine().sort(sortRefs); const name = list[0] ? list[0].data.col : 'Coleção';
    const of = (k) => list.filter((r) => r.data.kind === k);
    const albs = of('album');
    const byArtist = new Map(); for (const r of albs) { const k = r.data.artist || '—'; if (!byArtist.has(k)) byArtist.set(k, []); byArtist.get(k).push(r); }
    const multi = byArtist.size > 1; // pacote com vários artistas: agrupa por artista
    box.replaceChildren(...[
      h('header', { class: 'reader-head' }, h('a', { class: 'link', href: '#/estudos/club' }, '← Álbuns'),
        h('p', { class: 'lib-kicker' }, 'coleção'), h('h1', { class: 'reader-title' }, name),
        list.length ? h('label', { class: 'field' }, search) : null),
      !list.length ? h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'essa coleção ainda não foi importada.'), h('p', { class: 'muted' }, 'toque em “importar textos” no clube e escolha o .zip.')) : null,
      results,
      multi ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, `artistas (${byArtist.size})`),
        ...[...byArtist.entries()].sort((x, y) => x[0].localeCompare(y[0], 'pt-BR')).map(([name, list]) => h('details', { class: 'cl-artist' },
          h('summary', {}, h('strong', {}, name), h('small', { class: 'muted' }, ` · ${list.length} ${list.length === 1 ? 'álbum' : 'álbuns'}`)),
          h('ol', { class: 'cl-col-albs' }, ...list.sort(sortRefs).map((r) => h('li', {}, h('a', { href: `#/estudos/club/r:${r.id}` }, h('strong', {}, r.data.title), h('small', {}, [r.data.date.slice(0, 4), r.data.tracks.length && `${r.data.tracks.length} faixas`].filter(Boolean).join(' · '))))))))) : null,
      !multi && albs.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'álbuns'),
        h('ol', { class: 'cl-col-albs' }, ...albs.map((r) => h('li', {}, h('a', { href: `#/estudos/club/r:${r.id}` }, h('strong', {}, r.data.title), h('small', {}, [r.data.date.slice(0, 4), r.data.tracks.length && `${r.data.tracks.length} faixas`].filter(Boolean).join(' · '))))))) : null,
      of('lancamento').length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'outros lançamentos'), h('ul', { class: 'lab-list' }, ...of('lancamento').map((r) => refLink(r)))) : null,
      of('guia').length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'guias'), h('ul', { class: 'lab-list' }, ...of('guia').map((r) => refLink(r, h('span')))) ) : null,
      of('faixa').length && of('faixa').length <= 400 ? h('details', { class: 'card pad' }, h('summary', {}, `todas as faixas (${of('faixa').length})`), h('ul', { class: 'lab-list' }, ...of('faixa').map((r) => refLink(r)))) : null,
    ].filter(Boolean));
  };
  host.append(tabs, box); draw();
  let sig = ''; const re = () => { const k = String(mine().length); if (k !== sig) { sig = k; draw(); drawResults(); } };
  sig = String(mine().length);
  return store.subscribe((i) => { if (!i.kind || i.kind === 'clubref') re(); });
}
function mountRef(host, rid, tabs) {
  const box = h('article', { class: 'reader' });
  const draw = () => {
    const rec = store.get(rid);
    if (!rec || rec.deleted) { box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'essa ficha não está aqui.'), h('a', { class: 'btn primary', href: '#/estudos/club' }, 'voltar ao clube'))); return; }
    const d = rec.data; const all = refs().filter((r) => r.data.col === d.col);
    const inAlbums = d.kind === 'faixa' ? all.filter((r) => r.data.kind === 'album' && (r.data.tracks || []).some((t) => t.ref === rec.id)).sort(sortRefs) : [];
    const srcs = (d.sources || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const meta = Object.entries(d.meta || {}).filter(([k]) => !/^(id|id de registro|idioma do texto)$/i.test(k));
    box.replaceChildren(...[
      h('header', { class: 'reader-head' },
        h('a', { class: 'link', href: `#/estudos/club/c:${colSlug(d.col)}` }, `← ${d.col}`),
        h('p', { class: 'lib-kicker' }, KIND_LABEL[d.kind], d.date ? ` · ${d.date.split('-').reverse().join('/')}` : ''),
        h('h1', { class: 'reader-title' }, d.title),
        inAlbums.length ? h('p', { class: 'reader-sum' }, 'aparece em ', ...inAlbums.flatMap((a, i) => [i ? ', ' : '', h('a', { class: 'link', href: `#/estudos/club/r:${a.id}` }, a.data.title)])) : null,
        h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => newPost({ section: d.kind === 'album' ? 'album' : 'anatomia', artist: d.artist || d.col, album: d.kind === 'album' ? d.title : (inAlbums[0] ? inAlbums[0].data.title : ''), title: d.title }) }, 'escrever minha análise'))),
      meta.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'ficha'), h('dl', { class: 'cl-meta' }, ...meta.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]))) : null,
      d.tracks && d.tracks.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'faixas'),
        h('ol', { class: 'cl-tracks' }, ...d.tracks.map((t) => h('li', { value: String(t.n) }, store.get(t.ref) ? h('a', { href: `#/estudos/club/r:${t.ref}` }, t.title) : t.title)))) : null,
      d.body ? h('div', { class: 'reader-body' }, renderMarkdown(d.body).nodes) : null,
      srcs.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'fontes'), h('ul', { class: 'lab-list' }, ...srcs.map((x) => { const u = /https?:\/\/\S+/.exec(x); return h('li', {}, u ? h('a', { href: u[0], target: '_blank', rel: 'noopener noreferrer' }, x) : x); }))) : null,
    ].filter(Boolean));
  };
  host.append(tabs, box); draw();
  const hl = attachGrifos(box, () => { const r = store.get(rid); const d = r ? r.data : {}; return { id: `ref:${rid}`, title: [d.artist, d.title].filter(Boolean).join(' — ') || 'ficha', href: `#/estudos/club/r:${rid}` }; }); hl.apply();
  const off = store.subscribe((i) => { if (!i.kind || i.id === rid) { draw(); hl.apply(); } });
  return () => { off(); hl.off(); };
}

/* ---------- Meus Álbuns ---------- */
function sleeve(r, onOpen) {
  const a = r.data;
  const el = h(onOpen ? 'button' : 'a', { class: `cl-sleeve${a.fav ? ' fav' : ''}`, ...(onOpen ? { type: 'button', onclick: onOpen } : { href: '#/estudos/club/discos' }), 'aria-label': `${a.title}${a.artist ? ` de ${a.artist}` : ''}` },
    h('span', { class: 'cl-sl-txt' }, h('b', {}, a.title), h('small', {}, a.artist || '')));
  if (a.mbid) { const i = h('img', { src: coverUrl(a.mbid), alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }); i.addEventListener('error', () => i.remove()); el.prepend(i); }
  if (onOpen && a.status) el.append(h('span', { class: `cl-st st-${a.status}` }, (STATUS.find((s) => s[0] === a.status) || STATUS[0])[1]));
  return el;
}

function albumSheet(r) {
  sheet(r.data.title, (close) => {
    const a = r.data; let status = a.status || 'quero', rating = a.rating || 0, fav = !!a.fav;
    const notes = h('textarea', { rows: 3, maxlength: 1000, placeholder: 'o que eu senti, faixa favorita, o que reparar na bateria…', 'aria-label': 'Notas do disco' }); notes.value = a.notes || '';
    const box = h('div', { class: 'sheet-body cl-alb' });
    const draw = () => box.replaceChildren(
      h('div', { class: 'cl-alb-top' }, sleeve(r), h('div', {}, h('b', {}, a.title), h('p', { class: 'muted' }, albumLine(a)),
        h('div', { class: 'cl-rate', role: 'radiogroup', 'aria-label': 'Nota' }, ...[1, 2, 3, 4, 5].map((n) => h('button', { type: 'button', class: n <= rating ? 'on' : '', role: 'radio', 'aria-checked': String(n === rating), 'aria-label': `${n} estrela${n > 1 ? 's' : ''}`, onclick: () => { rating = rating === n ? 0 : n; draw(); } }, '★'))),
        h('button', { type: 'button', class: `btn small${fav ? ' st-paid' : ''}`, 'aria-pressed': String(fav), onclick: () => { fav = !fav; draw(); } }, fav ? '♥ favorito' : '♡ favoritar'))),
      h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Status' }, ...STATUS.map(([k, t]) => h('button', { type: 'button', class: `lib-tab${status === k ? ' on' : ''}`, role: 'radio', 'aria-checked': String(status === k), onclick: () => { status = k; draw(); } }, t))),
      h('label', { class: 'field' }, h('span', {}, 'notas'), notes),
      a.mbid ? fichaEl({ ...a }, (patch) => store.upsert('album', r.id, patch)) : null,
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Tirar da estante?', a.title, 'Tirar')) { await store.remove(r.id); close(); } } }, 'tirar'),
        h('button', { class: 'btn', type: 'button', onclick: async () => { await store.upsert('album', r.id, { status, rating, fav, notes: notes.value.trim() }); close(); newPost({ section: 'album', artist: a.artist, album: a.title, mbid: a.mbid || null, title: `${a.title}, por dentro` }); } }, 'escrever sobre ele'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => { await store.upsert('album', r.id, { status, rating, fav, notes: notes.value.trim() }); close(); toast('guardado ✓', { ms: 1200 }); } }, 'salvar')));
    draw();
    return box;
  });
}

function mountShelf(host, tabs) {
  let filter = '';
  const box = h('div');
  const draw = () => {
    const all = albums(); const shown = all.filter((r) => !filter || r.data.status === filter);
    box.replaceChildren(...(all.length ? [
      h('section', { class: 'card pad' },
        h('h2', { class: 'tag' }, `minha estante · ${all.length}`),
        h('div', { class: 'chips lib-tabs cl-filter' }, ...[['', 'todos'], ...STATUS].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${filter === k ? ' on' : ''}`, 'aria-pressed': String(filter === k), onclick: () => { filter = k; draw(); } }, t))),
        shown.length ? h('div', { class: 'cl-sleeves cl-wall' }, ...shown.map((r) => sleeve(r, () => albumSheet(r)))) : h('p', { class: 'hand' }, 'nada por aqui.'))]
      : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum disco guardado.'))]));
  };
  clubTop(host, tabs, true); host.append(box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'album') draw(); });
}
