// Coleções do Listening Club: pacotes de pesquisa em .txt (ex.: "BEATLES_ARSENAL_TEXTUAL") com álbuns, fichas de faixa,
// lançamentos extras e guias. Vira registros "clubref" (um por arquivo, id fixo: importar de novo não duplica).
// Puro, testado em tests/collection.test.mjs.

export const PARTS = { '01_albuns_principais': 'album', '02_faixas': 'faixa', '03_discografia_ampliada': 'lancamento', '04_guias_e_indices': 'guia' };
export const KIND_LABEL = { album: 'álbum', faixa: 'faixa', lancamento: 'lançamento', guia: 'guia' };
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** O zip é uma coleção quando tem as pastas de álbuns/faixas (ou o "00_LEIA_PRIMEIRO"). */
export const isCollection = (paths) => paths.some((p) => /(^|\/)(01_albuns_principais|02_faixas|01_artistas)\//.test(p));
/** Nome da coleção: primeira linha do LEIA ("BEATLES — ARSENAL…" → "The Beatles") ou a pasta raiz. */
export function collectionName(readme, root = '') {
  const first = String(readme || '').split('\n').find((l) => l.trim()) || root.replace(/_/g, ' ');
  const base = first.split(/\s+[—–-]\s+/)[0].trim().toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return /^beatles$/i.test(base) ? 'The Beatles' : /^arsenal musical da bea$/i.test(base) ? 'Arsenal Musical da Bea' : base || 'Coleção';
}

/** Lê o texto de uma ficha: título (linha com =====), cabeçalho "chave: valor", seções, faixas e fontes. `trackRef(arquivo)` dá o id da ficha da faixa. */
function readSheet(text, file, kind, trackRef) {
  const lines = String(text).replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n');
  // título: linha sublinhada com ===== (ou a primeira linha)
  let i = 0; while (i < lines.length && !lines[i].trim()) i++;
  const title = (lines[i] || file).trim(); i++;
  if (/^=+$/.test((lines[i] || '').trim())) i++;
  const meta = {}; const out = []; const sources = []; const tracks = [];
  // cabeçalho "chave: valor" até a primeira linha vazia
  for (; i < lines.length && lines[i].trim(); i++) { const kv = /^([^:]{2,70}):\s+(.+)$/.exec(lines[i]); if (kv) meta[kv[1].trim()] = kv[2].trim(); else out.push(lines[i]); }
  for (; i < lines.length; i++) {
    const l = lines[i]; const t = l.trim();
    if (/https?:\/\/\S+/.test(t)) { sources.push(t); continue; }
    const tr = /^(\d{1,3})\.\s+(.+?)\s+—\s+(?:ficha:\s+)?(\S+\.txt)$/.exec(t);
    if (tr) { tracks.push({ n: Number(tr[1]), title: tr[2], ref: trackRef(tr[3].split('/').pop().replace(/\.txt$/i, '')) }); continue; }
    if (/^[^\s].{1,70}:$/.test(t) && !/^\d/.test(t)) { out.push('', `## ${t.slice(0, -1)}`, ''); continue; }
    if (kind === 'guia' && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 /&,.-]{4,60}$/.test(t) && t === t.toUpperCase() && /[A-Z]/.test(t)) { out.push('', `## ${t.charAt(0) + t.slice(1).toLowerCase()}`, ''); continue; }
    out.push(l);
  }
  return { title, meta, body: out.join('\n').replace(/\n{3,}/g, '\n\n').trim(), sources: sources.join('\n'), tracks };
}
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Um .txt do pacote → registro. path ex.: "X/02_faixas/1966-08-05_taxman.txt". */
export function parseArsenal(path, text, col) {
  if (isArtistLayout(path)) return parseArtistSheet(path, text, col);
  const parts = path.split('/'); const folder = parts.find((p) => PARTS[p]); const kind = PARTS[folder] || 'guia';
  const file = parts[parts.length - 1].replace(/\.txt$/i, '');
  const m = /^(?:(\d{2})_)?(?:(\d{4}-\d{2}-\d{2})_)?(.+)$/.exec(file);
  const order = m && m[1] ? Number(m[1]) : null; const date = m && m[2] ? m[2] : '';
  const r = readSheet(text, file, kind, (f) => refId(col, 'faixa', f));
  return { id: refId(col, kind, file), data: { col, kind, title: r.title, date, order, meta: r.meta, body: r.body, tracks: r.tracks, sources: r.sources, file: `${folder || ''}/${file}`, search: `${r.title} ${Object.values(r.meta).join(' ')} ${r.body}`.toLowerCase().slice(0, 4000) } };
}

/* ---- pacote "Arsenal Musical": vários artistas. 01_artistas/<artista>/<data_álbum>/(00_album_e_referencias | NNN_faixa).txt + 00_indices_e_guias ---- */
const HUGE = /(^|\/)00_indices_e_guias\/0[234]_/; // índices gigantes (todas as faixas, compositores, referências): o próprio app busca nas fichas, então não importa
export const isArtistLayout = (path) => /(^|\/)(01_artistas|00_indices_e_guias)\//.test(path);
export const skipSheet = (path) => HUGE.test(path);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
/** id estável; nomes longos ganham um sufixo (hash) pra nunca colidirem ao cortar em 120 caracteres. */
const refIdLong = (col, kind, key) => { const full = `cr-${slug(col)}-${kind}-${slug(key)}`; return full.length <= 120 ? full : `${full.slice(0, 106)}-${hash(full)}`; };
function parseArtistSheet(path, text, col) {
  const parts = path.split('/'); const at = parts.indexOf('01_artistas');
  const file = parts[parts.length - 1].replace(/\.txt$/i, '');
  const artistSlug = at >= 0 ? parts[at + 1] : ''; const albumDir = at >= 0 && parts.length > at + 3 ? parts[at + 2] : '';
  const kind = at < 0 ? 'guia' : !albumDir ? 'guia' : /^00_album/.test(file) ? 'album' : 'faixa';
  const date = ((/^(\d{4}-\d{2}-\d{2})_/.exec(albumDir) || [])[1]) || '';
  const keyOf = (f) => `${artistSlug}/${albumDir}/${f}`;
  const r = readSheet(text, file, kind, (f) => refIdLong(col, 'faixa', keyOf(f)));
  const artist = r.meta['artista de referência'] || r.meta.artista || '';
  const album = r.meta['álbum/projeto'] || (kind === 'album' ? r.title : '');
  const key = kind === 'guia' ? (artistSlug ? `${artistSlug}/${file}` : file) : keyOf(file);
  const order = (/^(\d{3})_/.exec(file) || [])[1];
  const search = norm(`${r.title} ${artist} ${album} ${Object.values(r.meta).join(' ')} ${r.body}`).slice(0, 4000);
  return { id: refIdLong(col, kind, key), data: { col, kind, title: r.title, artist, album, date, order: order ? Number(order) : null, meta: r.meta, body: r.body, tracks: r.tracks, sources: r.sources, file: path.split('/').slice(at >= 0 ? at : 0).join('/'), search, sn: 1 } };
}
export function refId(col, kind, file) { return `cr-${slug(col)}-${kind}-${slug(String(file).replace(/^(\d{2}_)?(\d{4}-\d{2}-\d{2}_)?/, ''))}`.slice(0, 120); }

/** Ordem de exibição: álbuns pela posição, lançamentos/faixas pela data, guias pelo nome. */
export function sortRefs(a, b) {
  const x = a.data, y = b.data;
  if (x.kind === 'album' && y.kind === 'album') return (x.order || 99) - (y.order || 99);
  return (x.date || '9999').localeCompare(y.date || '9999') || x.title.localeCompare(y.title);
}
/** Busca simples (sem acento) no título e no texto. */
export function searchRefs(list, q) {
  const n = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); const t = n(q.trim());
  if (!t) return [];
  return list.filter((r) => (r.data.sn ? r.data.search : n(r.data.search || r.data.title)).includes(t)).sort((a, b) => (n(b.data.title).includes(t) ? 1 : 0) - (n(a.data.title).includes(t) ? 1 : 0));
}
