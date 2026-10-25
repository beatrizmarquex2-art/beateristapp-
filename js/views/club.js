// The Listening Club: o blog privado de escuta da Bea, dentro de Meus Estudos. Cada texto é um registro
// "clubpost" (sincroniza como o resto); a capa fica no aparelho, como as fotos do mural.
import { h } from '../util.js';
import * as store from '../store.js';
import * as lib from '../lib.js';
import { renderMarkdown, slugify } from '../md.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { pickImages, saveImage, imageUrl } from './mural.js';
import { artPhoto } from './artist-photo.js';
import { WIKI } from '../catalog.js';

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
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));
/** Slug do Laboratório de Artistas que bate com o nome escrito no texto (se houver). */
export const labSlug = (name) => { const s = slugify(name || ''); return s && WIKI[s] ? s : null; };

function cover(d, cls) {
  const box = h('span', { class: cls });
  if (d.cover) imageUrl(d.cover).then((u) => { if (u) box.replaceChildren(h('img', { src: u, alt: '' })); });
  else if (labSlug(d.artist)) box.append(artPhoto(labSlug(d.artist), d.artist, 'art-ph fill'));
  else box.append(h('b', { class: 'club-glyph' }, '♪'));
  return box;
}

function editor(rec, close) {
  const d = { section: 'caderno', status: 'rascunho', ...(rec ? rec.data : {}) };
  let section = d.section, coverId = d.cover || null;
  const title = h('input', { type: 'text', maxlength: 120, value: d.title || '', placeholder: 'ex.: o bumbo de “When the Levee Breaks”', 'aria-label': 'Título' });
  const artist = h('input', { type: 'text', maxlength: 80, value: d.artist || '', placeholder: 'artista ou banda', 'aria-label': 'Artista' });
  const album = h('input', { type: 'text', maxlength: 80, value: d.album || '', placeholder: 'álbum ou música', 'aria-label': 'Álbum ou música' });
  const body = h('textarea', { rows: 10, placeholder: 'escreva livre. ## vira subtítulo, **negrito**, - lista.', 'aria-label': 'Texto' }, d.body || '');
  const sources = h('textarea', { rows: 3, placeholder: 'um link ou livro por linha', 'aria-label': 'Fontes' }, d.sources || '');
  const secRow = h('div', { class: 'chips wrap' });
  const drawSec = () => secRow.replaceChildren(...SECTIONS.map((s) => h('button', { type: 'button', class: `lib-tab${section === s.id ? ' on' : ''}`, 'aria-pressed': String(section === s.id), onclick: () => { section = s.id; drawSec(); } }, s.label)));
  drawSec();
  const coverBtn = h('button', { class: 'btn small', type: 'button', onclick: async () => { const [b] = await pickImages(false); if (b) { coverId = await saveImage(b); coverBtn.textContent = 'capa escolhida ✓'; } } }, coverId ? 'trocar capa' : 'escolher capa');
  const save = async (status) => {
    if (!title.value.trim()) { toast('dá um título, nem que seja provisório.'); title.focus(); return; }
    const v = { title: title.value.trim(), artist: artist.value.trim(), album: album.value.trim(), body: body.value, sources: sources.value.trim(), section, cover: coverId, status, date: d.date || Date.now() };
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
    h('div', { class: 'row' }, coverBtn, h('small', { class: 'muted' }, 'sem capa, uso a foto do artista se ele estiver no Laboratório.')),
    h('div', { class: 'row end' },
      rec ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar texto?', d.title, 'Apagar')) { await store.remove(rec.id); close(); location.hash = '#/estudos/club'; } } }, 'apagar') : null,
      h('button', { class: 'btn ghost', type: 'button', onclick: () => save('rascunho') }, 'guardar rascunho'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => save('publicado') }, 'publicar')));
}
export const newPost = () => sheet('Novo texto do clube', (close) => editor(null, close));

function surprise() {
  const pub = posts().filter((p) => p.data.status === 'publicado');
  const idx = lib.items();
  const pool = [...pub.map((p) => `#/estudos/club/${p.id}`), ...idx.map((a) => `#/estudos/a/${a.slug}`)];
  if (!pool.length) { toast('ainda não tem nada pra sortear: escreva o primeiro texto!'); return; }
  location.hash = pool[Math.floor(Math.random() * pool.length)];
}

export function mountClub(host, tabs) {
  let filter = '';
  const box = h('div');
  const draw = () => {
    const all = posts().sort((a, b) => (b.data.date || b.updated_at) - (a.data.date || a.updated_at));
    const pub = all.filter((p) => p.data.status === 'publicado' && (!filter || p.data.section === filter));
    const drafts = all.filter((p) => p.data.status !== 'publicado');
    const [top, ...rest] = pub;
    box.replaceChildren(...[
      h('div', { class: 'row pad-x club-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: newPost }, '+ escrever'), h('button', { class: 'btn', type: 'button', onclick: surprise }, 'me surpreenda')),
      h('section', { class: 'card pad club-secs' }, h('h2', { class: 'tag' }, 'seções'),
        h('ul', { class: 'club-sec-list' }, SECTIONS.map((s) => h('li', {},
          h('button', { type: 'button', class: `club-sec${filter === s.id ? ' on' : ''}`, 'aria-pressed': String(filter === s.id), onclick: () => { filter = filter === s.id ? '' : s.id; draw(); } },
            h('strong', {}, s.label), h('small', {}, s.pt), h('em', {}, String(all.filter((p) => p.data.status === 'publicado' && p.data.section === s.id).length))))))),
      top ? h('a', { class: 'club-feature', href: `#/estudos/club/${top.id}` }, cover(top.data, 'club-cover big'),
        h('span', { class: 'club-meta' }, h('span', { class: 'lib-kicker' }, sec(top.data.section).label, ' · ', when(top.data.date || top.updated_at)), h('strong', {}, top.data.title), top.data.artist ? h('small', {}, [top.data.artist, top.data.album].filter(Boolean).join(' · ')) : null)) : null,
      rest.length ? h('div', { class: 'club-grid' }, rest.map((p, i) => h('a', { class: `club-item tilt${i % 3}`, href: `#/estudos/club/${p.id}` }, cover(p.data, 'club-cover'),
        h('span', { class: 'lib-kicker' }, sec(p.data.section).label), h('strong', {}, p.data.title)))) : null,
      !pub.length ? h('div', { class: 'empty' }, h('p', { class: 'hand' }, filter ? 'nada publicado nessa seção ainda.' : 'o clube está esperando o primeiro texto.'), h('p', { class: 'muted' }, 'escolhe uma música que você ouviu hoje e começa pelo Caderno de Escuta: três frases já valem.')) : null,
      drafts.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'rascunhos'), h('ul', { class: 'lab-list' }, drafts.map((p) => h('li', {}, h('a', { href: `#/estudos/club/${p.id}` }, p.data.title), h('small', {}, ` · ${sec(p.data.section).label}`))))) : null,
      h('p', { class: 'pad-x lib-note' }, 'privado: só você vê. as buscas automáticas (Genius, MusicBrainz) entram quando a gente configurar as chaves no Netlify.')].filter(Boolean));
  };
  host.append(banner('The Listening Club', 'meu blog privado de escuta'), tabs, box);
  lib.loadIndex().catch(() => {});
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'clubpost') draw(); });
}

export function mountPost(host, id, tabs) {
  const box = h('article', { class: 'reader' });
  const draw = () => {
    const rec = store.get(id);
    if (!rec || rec.deleted) { box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'esse texto não existe mais.'), h('a', { class: 'btn primary', href: '#/estudos/club' }, 'voltar ao clube'))); return; }
    const d = rec.data; const s = sec(d.section); const ls = labSlug(d.artist);
    box.replaceChildren(...[
      h('header', { class: 'reader-head' },
        h('a', { class: 'link', href: '#/estudos/club' }, '← The Listening Club'),
        cover(d, 'club-cover big'),
        h('p', { class: 'lib-kicker' }, s.label, ' · ', d.status === 'publicado' ? when(d.date || rec.updated_at) : 'rascunho'),
        h('h1', { class: 'reader-title' }, d.title),
        d.artist || d.album ? h('p', { class: 'reader-sum' }, [d.artist, d.album].filter(Boolean).join(' · ')) : null,
        h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => sheet('Editar texto', (close) => editor(rec, close)) }, 'editar'),
          ls ? h('a', { class: 'btn small ghost', href: `#/estudos/a/${ls}` }, `${d.artist} no Laboratório`) : null)),
      h('div', { class: 'reader-body' }, d.body ? renderMarkdown(d.body).nodes : h('p', { class: 'muted' }, 'texto vazio. toque em editar.')),
      d.sources ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'fontes'), h('ul', { class: 'lab-list' }, d.sources.split('\n').filter((x) => x.trim()).map((x) => h('li', {}, /^https?:\/\//.test(x.trim()) ? h('a', { href: x.trim(), target: '_blank', rel: 'noopener' }, x.trim()) : x.trim())))) : null,
    ].filter(Boolean));
  };
  host.append(tabs, box);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.id === id) draw(); });
}
