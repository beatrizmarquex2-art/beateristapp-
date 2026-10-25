// The Listening Club: o clube de escuta da Bea, dentro de Meus Estudos, com cara de revista independente
// (papel creme, vermelho-vinho, preto, azul-marinho e ocre; serifa de capa, etiquetas de arquivo, anotações à mão).
// Textos = registros "clubpost"; discos da estante = registros "album" (dados do MusicBrainz, capa do Cover Art Archive).
import { h } from '../util.js';
import * as store from '../store.js';
import * as lib from '../lib.js';
import { renderMarkdown, slugify } from '../md.js';
import { sheet, toast, confirmSheet, stars } from '../ui.js';
import { pickImages, saveImage, imageUrl } from './mural.js';
import { artPhoto } from './artist-photo.js';
import { WIKI } from '../catalog.js';
import { STATUS, mbSearchUrl, coverUrl, parseMB, albumLine, shelfSort } from '../albums-logic.js';
import { releasesUrl, releaseUrl, pickRelease, parseRelease, mbPage, wikiSearchUrl, wikiSummaryUrl, pickWikiTitle } from '../musicdata.js';
import { parseTextFile, docxToMarkdown, isText, isDocx } from '../textimport.js';
import { readZip } from '../zip.js';

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
const monthYear = () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'long', year: 'numeric' }).format(new Date());
/** Slug do Laboratório de Artistas que bate com o nome escrito no texto (se houver). */
export const labSlug = (name) => { const s = slugify(name || ''); return s && WIKI[s] ? s : null; };
const excerpt = (md, n = 140) => String(md || '').replace(/[#>*_`[\]()-]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

/** Imagem do texto: a capa escolhida, a capa do disco (MusicBrainz) ou a foto livre do artista; senão, um vinil. */
function cover(d, cls) {
  const box = h('span', { class: `lc-img ${cls || ''}` }, h('span', { class: 'lc-vinyl', 'aria-hidden': 'true' }));
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
  const box = h('section', { class: 'lc-ficha' });
  const draw = (busy, err) => {
    const f = d.sheet; const w = d.wiki;
    box.replaceChildren(...[
      h('div', { class: 'row between' }, h('h2', { class: 'lc-kick' }, 'ficha técnica'), d.mbid ? h('button', { class: 'lc-btn small2', type: 'button', disabled: busy, onclick: load }, busy ? 'buscando…' : f ? 'atualizar' : 'trazer ficha técnica') : null),
      !d.mbid ? h('p', { class: 'muted' }, 'esse texto não está ligado a um disco. escreva a partir de “meus álbuns” pra ter a ficha automática.') : null,
      err ? h('p', { class: 'muted' }, 'não consegui buscar agora (sem internet?). tenta de novo depois.') : null,
      f ? h('div', { class: 'lc-ficha-grid' },
        h('div', {}, h('h3', {}, 'faixas'), f.tracks.length ? h('ol', { class: 'lc-tracks' }, ...f.tracks.map((t) => h('li', {}, h('span', {}, t.title), h('small', {}, t.len)))) : h('p', { class: 'muted' }, 'sem faixas na fonte.')),
        h('div', {}, h('h3', {}, 'quem tocou e quem fez'), f.people.length ? h('ul', { class: 'lc-people' }, ...f.people.map((x) => h('li', {}, h('b', {}, x.name), ` · ${x.roles.join(', ')}`))) : h('p', { class: 'muted' }, 'a fonte ainda não tem os créditos dos músicos desse disco.'),
          f.writers.length ? [h('h3', {}, 'composição'), h('ul', { class: 'lc-people' }, ...f.writers.map((x) => h('li', {}, h('b', {}, x.name), ` · ${x.roles.join(', ')}`)))] : null,
          f.studios.length || f.label || f.date ? h('p', { class: 'lc-meta' }, [f.studios.length ? `gravado em ${f.studios.join(', ')}` : '', f.label ? `selo ${f.label}` : '', f.date ? `lançado em ${f.date.split('-').reverse().join('/')}` : ''].filter(Boolean).join(' · ')) : null)) : null,
      w ? h('div', { class: 'lc-wiki' }, h('h3', {}, 'resumo'), h('p', {}, w.extract), h('small', {}, 'fonte: ', h('a', { href: w.url, target: '_blank', rel: 'noopener noreferrer' }, `Wikipedia (${w.lang === 'pt' ? 'português' : 'inglês'}) · ${w.title}`))) : null,
      f ? h('small', { class: 'lc-cred' }, 'dados: ', h('a', { href: mbPage(d.mbid), target: '_blank', rel: 'noopener noreferrer' }, 'MusicBrainz'), ' (enciclopédia aberta feita por fãs; pode estar incompleta).') : null,
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
      for (const e of await readZip(await f.arrayBuffer())) {
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
  return found.length;
}
function pickTexts() {
  const input = h('input', { type: 'file', multiple: true, accept: '.zip,.md,.markdown,.txt,.docx', style: { display: 'none' } });
  document.body.append(input);
  input.addEventListener('change', async () => {
    const list = [...input.files]; input.remove(); if (!list.length) return;
    toast('lendo os textos…', { id: 'lc-imp', ms: 30000 });
    try { const n = await importTexts(list); toast(n ? `${n} texto(s) na gaveta ✓ revisa e publica` : 'não achei textos (.md, .txt ou .docx) aí dentro', { id: 'lc-imp', ms: 3000 }); }
    catch (e) { toast(`não consegui ler: ${e.message || 'arquivo estranho'}`, { id: 'lc-imp', ms: 4000 }); }
  });
  input.click();
}

/* ---------- cabeçalho de revista ---------- */
function masthead(small) {
  const n = posts().filter((p) => p.data.status === 'publicado').length;
  return h('header', { class: `lc-mast${small ? ' small' : ''}` },
    h('p', { class: 'lc-issue' }, h('span', {}, `edição nº ${String(Math.max(1, n)).padStart(2, '0')}`), h('span', {}, monthYear()), h('span', {}, 'só pra mim')),
    h('a', { class: 'lc-logo', href: '#/estudos/club' }, h('span', { class: 'lc-the' }, 'The'), h('span', {}, 'Listening Club')),
    h('p', { class: 'lc-tag' }, 'meu clube de escuta, ouvido por dentro'),
    h('nav', { class: 'lc-nav', 'aria-label': 'Listening Club' },
      h('a', { href: '#/estudos/club' }, 'capa'), h('a', { href: '#/estudos/club/discos' }, 'meus álbuns'),
      h('button', { type: 'button', onclick: () => newPost() }, '+ escrever'), h('button', { type: 'button', onclick: pickTexts }, 'importar textos'), h('button', { type: 'button', class: 'lc-surprise', onclick: surprise }, 'me surpreenda ✦')));
}

export function mountClub(host, tabs) {
  let filter = '';
  const box = h('div', { class: 'lc' });
  const draw = () => {
    const all = posts().sort((a, b) => (b.data.date || b.updated_at) - (a.data.date || a.updated_at));
    const pub = all.filter((p) => p.data.status === 'publicado' && (!filter || p.data.section === filter));
    const drafts = all.filter((p) => p.data.status !== 'publicado');
    const [top, ...rest] = pub; const index = rest.slice(0, 4); const more = rest.slice(4);
    const shelf = albums().slice(0, 6);
    box.replaceChildren(...[
      masthead(),
      top ? h('a', { class: 'lc-cover', href: `#/estudos/club/${top.id}` },
        cover(top.data, 'big'),
        h('span', { class: 'lc-stamp' }, sec(top.data.section).label),
        h('span', { class: 'lc-head' }, h('b', {}, top.data.title), top.data.artist || top.data.album ? h('em', {}, [top.data.artist, top.data.album].filter(Boolean).join(' · ')) : null),
        h('span', { class: 'lc-note' }, 'matéria de capa ↘')) : h('div', { class: 'lc-empty' }, h('p', { class: 'lc-hand' }, filter ? 'nada publicado nessa seção ainda.' : 'a revista está esperando a primeira matéria.'), h('p', {}, 'começa pelo Caderno de Escuta: o que você ouviu hoje, em três frases.'), h('button', { class: 'lc-btn', type: 'button', onclick: () => newPost() }, '+ escrever')),
      index.length ? h('section', { class: 'lc-index' }, h('h2', { class: 'lc-kick' }, 'nesta edição'),
        h('ol', {}, ...index.map((p, i) => h('li', {}, h('a', { href: `#/estudos/club/${p.id}` }, h('span', { class: 'lc-n' }, String(i + 2).padStart(2, '0')), h('span', { class: 'lc-t' }, h('b', {}, p.data.title), h('small', {}, sec(p.data.section).label))))))) : null,
      h('section', { class: 'lc-secs', 'aria-label': 'Seções' }, ...SECTIONS.map((s) => h('button', { type: 'button', class: `lc-sec s-${s.id}${filter === s.id ? ' on' : ''}`, 'aria-pressed': String(filter === s.id), onclick: () => { filter = filter === s.id ? '' : s.id; draw(); } },
        h('b', {}, s.label), h('small', {}, s.pt), h('i', {}, String(all.filter((p) => p.data.status === 'publicado' && p.data.section === s.id).length))))),
      more.length ? h('section', { class: 'lc-more' }, ...more.map((p, i) => {
        const d = p.data; const kind = d.section === 'caderno' ? 'tape' : ['polaroid', 'clip'][i % 2];
        return h('a', { class: `lc-card ${kind}`, href: `#/estudos/club/${p.id}` }, kind === 'polaroid' ? cover(d, 'pol') : null,
          h('span', { class: 'lc-kick' }, sec(d.section).label), h('b', {}, d.title), kind !== 'polaroid' && d.body ? h('small', {}, `${excerpt(d.body)}…`) : null);
      })) : null,
      h('section', { class: 'lc-shelf' }, h('div', { class: 'row between' }, h('h2', { class: 'lc-kick' }, 'na minha estante'), h('a', { class: 'lc-link', href: '#/estudos/club/discos' }, 'ver todos →')),
        shelf.length ? h('div', { class: 'lc-sleeves' }, ...shelf.map((a) => sleeve(a))) : h('p', { class: 'lc-hand' }, 'nenhum disco ainda. busca o primeiro em “meus álbuns”.')),
      drafts.length ? h('section', { class: 'lc-drafts' }, h('div', { class: 'row between' }, h('h2', { class: 'lc-kick' }, `na gaveta (${drafts.length} rascunho${drafts.length > 1 ? 's' : ''})`),
          h('button', { class: 'lc-btn small2', type: 'button', onclick: async () => { if (!(await confirmSheet('Publicar tudo da gaveta?', `${drafts.length} texto(s) vão pra revista.`, 'Publicar'))) return; for (const p of drafts) await store.upsert('clubpost', p.id, { status: 'publicado' }); toast('publicados ✓'); } }, 'publicar todos')),
        h('ul', {}, ...drafts.map((p) => h('li', {}, h('a', { href: `#/estudos/club/${p.id}` }, p.data.title), h('small', {}, ` · ${sec(p.data.section).label}${p.data.artist ? ` · ${p.data.artist}` : ''}`))))) : null,
      h('p', { class: 'lc-foot' }, 'privado: só você vê. dados de discos: MusicBrainz e Cover Art Archive (abertos). fato com fonte, opinião marcada.')].filter(Boolean));
  };
  host.append(tabs, box);
  lib.loadIndex().catch(() => {});
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'clubpost' || i.kind === 'album') draw(); });
}

export function mountPost(host, id, tabs) {
  if (id === 'discos') return mountShelf(host, tabs);
  const box = h('article', { class: 'lc lc-article' });
  const draw = () => {
    const rec = store.get(id);
    if (!rec || rec.deleted) { box.replaceChildren(h('div', { class: 'lc-empty' }, h('p', { class: 'lc-hand' }, 'esse texto não existe mais.'), h('a', { class: 'lc-btn', href: '#/estudos/club' }, 'voltar pra capa'))); return; }
    const d = rec.data; const s = sec(d.section); const ls = labSlug(d.artist);
    const srcs = (d.sources || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const bodyEl = h('div', { class: 'lc-body' }, d.body ? renderMarkdown(d.body).nodes : h('p', { class: 'muted' }, 'texto vazio. toque em editar.'));
    box.replaceChildren(...[
      h('a', { class: 'lc-back', href: '#/estudos/club' }, '← The Listening Club'),
      h('p', { class: 'lc-arch' }, h('span', {}, s.label), h('span', {}, d.status === 'publicado' ? when(d.date || rec.updated_at) : 'rascunho'), d.artist ? h('span', {}, d.artist) : null),
      h('h1', { class: 'lc-title' }, d.title),
      d.artist || d.album ? h('p', { class: 'lc-dek' }, [d.artist, d.album].filter(Boolean).join(' · ')) : null,
      h('figure', { class: 'lc-fig' }, cover(d, 'big'), h('figcaption', {}, d.album || d.artist || s.label)),
      bodyEl,
      d.mbid || d.section === 'album' ? fichaEl({ ...d }, (patch) => store.upsert('clubpost', rec.id, patch)) : null,
      srcs.length ? h('section', { class: 'lc-src' }, h('h2', { class: 'lc-kick' }, 'fontes'), h('ol', {}, ...srcs.map((x) => h('li', {}, /^https?:\/\//.test(x) ? h('a', { href: x, target: '_blank', rel: 'noopener noreferrer' }, x.replace(/^https?:\/\/(www\.)?/, '')) : x)))) : null,
      h('div', { class: 'lc-tools' }, h('button', { class: 'lc-btn', type: 'button', onclick: () => sheet('Editar texto', (close) => editor(rec, close)) }, 'editar'),
        ls ? h('a', { class: 'lc-btn ghost', href: `#/estudos/a/${ls}` }, `${d.artist} no Laboratório`) : null),
    ].filter(Boolean));
  };
  host.append(tabs, box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.id === id) draw(); });
}

/* ---------- Meus Álbuns ---------- */
function sleeve(r, onOpen) {
  const a = r.data;
  const el = h(onOpen ? 'button' : 'a', { class: `lc-sleeve${a.fav ? ' fav' : ''}`, ...(onOpen ? { type: 'button', onclick: onOpen } : { href: '#/estudos/club/discos' }), 'aria-label': `${a.title}${a.artist ? ` de ${a.artist}` : ''}` },
    h('span', { class: 'lc-sl-txt' }, h('b', {}, a.title), h('small', {}, a.artist || '')));
  if (a.mbid) { const i = h('img', { src: coverUrl(a.mbid), alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }); i.addEventListener('error', () => i.remove()); el.prepend(i); }
  if (onOpen && a.status) el.append(h('span', { class: `lc-st st-${a.status}` }, (STATUS.find((s) => s[0] === a.status) || STATUS[0])[1]));
  return el;
}

function albumSheet(r) {
  sheet(r.data.title, (close) => {
    const a = r.data; let status = a.status || 'quero', rating = a.rating || 0, fav = !!a.fav;
    const notes = h('textarea', { rows: 3, maxlength: 1000, placeholder: 'o que eu senti, faixa favorita, o que reparar na bateria…', 'aria-label': 'Notas do disco' }); notes.value = a.notes || '';
    const box = h('div', { class: 'sheet-body lc-alb' });
    const draw = () => box.replaceChildren(
      h('div', { class: 'lc-alb-top' }, sleeve(r), h('div', {}, h('b', {}, a.title), h('p', { class: 'muted' }, albumLine(a)),
        h('div', { class: 'lc-rate', role: 'radiogroup', 'aria-label': 'Nota' }, ...[1, 2, 3, 4, 5].map((n) => h('button', { type: 'button', class: n <= rating ? 'on' : '', role: 'radio', 'aria-checked': String(n === rating), 'aria-label': `${n} estrela${n > 1 ? 's' : ''}`, onclick: () => { rating = rating === n ? 0 : n; draw(); } }, '★'))),
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
  let filter = ''; let results = null; let busy = false;
  const box = h('div', { class: 'lc' });
  const q = h('input', { type: 'search', placeholder: 'buscar disco: nome, artista…', 'aria-label': 'Buscar disco', enterkeyhint: 'search' });
  const search = async () => {
    const term = q.value.trim(); if (term.length < 2 || busy) return; busy = true; results = 'loading'; draw();
    try { const r = await fetch(mbSearchUrl(term), { headers: { Accept: 'application/json' } }); results = r.ok ? parseMB(await r.json()) : 'erro'; } catch { results = 'erro'; }
    busy = false; draw();
  };
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  const add = async (a, btn) => {
    if (albums().some((r) => r.data.mbid && r.data.mbid === a.mbid)) { toast('esse já tá na estante'); return; }
    await store.upsert('album', null, { ...a, status: 'quero', rating: 0, fav: false, notes: '', added: Date.now() }); stars(btn); toast(`${a.title} na estante ✓`, { ms: 1400 });
  };
  const draw = () => {
    const all = albums(); const shown = all.filter((r) => !filter || r.data.status === filter);
    box.replaceChildren(...[
      masthead(true),
      h('section', { class: 'lc-find' }, h('h2', { class: 'lc-kick' }, 'adicionar disco'), h('div', { class: 'row lc-search' }, q, h('button', { class: 'lc-btn', type: 'button', onclick: search }, 'buscar')),
        results === 'loading' ? h('p', { class: 'lc-hand' }, 'procurando na discoteca…') : null,
        results === 'erro' ? h('p', { class: 'muted' }, 'a busca não respondeu (sem internet?). dá pra adicionar à mão abaixo.') : null,
        Array.isArray(results) ? (results.length ? h('ul', { class: 'lc-results' }, ...results.map((a) => h('li', {},
          h('span', { class: 'lc-thumb' }, (() => { const i = h('img', { src: coverUrl(a.mbid), alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }); i.addEventListener('error', () => i.remove()); return i; })()),
          h('span', { class: 'lc-r-t' }, h('b', {}, a.title), h('small', {}, [albumLine(a), a.type && a.type !== 'Album' ? a.type.toLowerCase() : ''].filter(Boolean).join(' · '))),
          h('button', { class: 'lc-btn small', type: 'button', 'aria-label': `Pôr ${a.title} na estante`, onclick: (e) => add(a, e.currentTarget) }, '+')))) : h('p', { class: 'muted' }, 'não achei. confere o nome ou adiciona à mão.')) : null,
        h('details', { class: 'lc-manual' }, h('summary', {}, 'adicionar à mão'), (() => {
          const t = h('input', { type: 'text', maxlength: 100, placeholder: 'nome do disco', 'aria-label': 'Nome do disco' }); const ar = h('input', { type: 'text', maxlength: 80, placeholder: 'artista', 'aria-label': 'Artista do disco' }); const y = h('input', { type: 'text', inputmode: 'numeric', maxlength: 4, placeholder: 'ano', 'aria-label': 'Ano' });
          return h('div', { class: 'bt-form' }, t, ar, y, h('button', { class: 'lc-btn', type: 'button', onclick: (e) => { if (!t.value.trim()) return; add({ mbid: null, title: t.value.trim(), artist: ar.value.trim(), year: y.value.trim(), type: 'Album' }, e.currentTarget); t.value = ''; ar.value = ''; y.value = ''; } }, '+ estante'));
        })())),
      h('section', { class: 'lc-shelf full' },
        h('div', { class: 'row between' }, h('h2', { class: 'lc-kick' }, `minha estante · ${all.length}`)),
        h('div', { class: 'chips lib-tabs lc-filter' }, ...[['', 'todos'], ...STATUS].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${filter === k ? ' on' : ''}`, 'aria-pressed': String(filter === k), onclick: () => { filter = k; draw(); } }, t))),
        shown.length ? h('div', { class: 'lc-sleeves lc-wall' }, ...shown.map((r) => sleeve(r, () => albumSheet(r)))) : h('p', { class: 'lc-hand' }, 'estante vazia por aqui.')),
      h('p', { class: 'lc-foot' }, 'dados dos discos: MusicBrainz (aberto, feito por fãs) e capas do Cover Art Archive. se algo estiver errado, edite à mão.')].filter(Boolean));
  };
  host.append(tabs, box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'album') draw(); });
}
