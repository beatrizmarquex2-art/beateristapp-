// Coleções do Listening Club: pacotes de pesquisa em .txt (ex.: "BEATLES_ARSENAL_TEXTUAL") com álbuns, fichas de faixa,
// lançamentos extras e guias. Vira registros "clubref" (um por arquivo, id fixo: importar de novo não duplica).
// Puro, testado em tests/collection.test.mjs.

export const PARTS = { '01_albuns_principais': 'album', '02_faixas': 'faixa', '03_discografia_ampliada': 'lancamento', '04_guias_e_indices': 'guia' };
export const KIND_LABEL = { album: 'álbum', faixa: 'faixa', lancamento: 'lançamento', guia: 'guia' };
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** O zip é uma coleção quando tem as pastas de álbuns/faixas (ou o "00_LEIA_PRIMEIRO"). */
export const isCollection = (paths) => paths.some((p) => /(^|\/)(01_albuns_principais|02_faixas)\//.test(p));
/** Nome da coleção: primeira linha do LEIA ("BEATLES — ARSENAL…" → "The Beatles") ou a pasta raiz. */
export function collectionName(readme, root = '') {
  const first = String(readme || '').split('\n').find((l) => l.trim()) || root.replace(/_/g, ' ');
  const base = first.split(/\s+[—–-]\s+/)[0].trim().toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return /^beatles$/i.test(base) ? 'The Beatles' : base || 'Coleção';
}

/** Um .txt do pacote → registro. path ex.: "X/02_faixas/1966-08-05_taxman.txt". */
export function parseArsenal(path, text, col) {
  const parts = path.split('/'); const folder = parts.find((p) => PARTS[p]); const kind = PARTS[folder] || 'guia';
  const file = parts[parts.length - 1].replace(/\.txt$/i, '');
  const m = /^(?:(\d{2})_)?(?:(\d{4}-\d{2}-\d{2})_)?(.+)$/.exec(file);
  const order = m && m[1] ? Number(m[1]) : null; const date = m && m[2] ? m[2] : '';
  const lines = String(text).replace(/^﻿/, '').replace(/\r/g, '').split('\n');
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
    const tr = /^(\d{1,2})\.\s+(.+?)\s+—\s+ficha:\s+(\S+\.txt)$/.exec(t);
    if (tr) { tracks.push({ n: Number(tr[1]), title: tr[2], ref: refId(col, 'faixa', tr[3].split('/').pop().replace(/\.txt$/i, '')) }); continue; }
    if (/^[^\s].{1,70}:$/.test(t) && !/^\d/.test(t)) { out.push('', `## ${t.slice(0, -1)}`, ''); continue; }
    if (kind === 'guia' && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 /&,.-]{4,60}$/.test(t) && t === t.toUpperCase() && /[A-Z]/.test(t)) { out.push('', `## ${t.charAt(0) + t.slice(1).toLowerCase()}`, ''); continue; }
    out.push(l);
  }
  const body = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { id: refId(col, kind, file), data: { col, kind, title, date, order, meta, body, tracks, sources: sources.join('\n'), file: `${folder || ''}/${file}`, search: `${title} ${Object.values(meta).join(' ')} ${body}`.toLowerCase().slice(0, 4000) } };
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
  return list.filter((r) => n(r.data.search || r.data.title).includes(t)).sort((a, b) => (n(b.data.title).includes(t) ? 1 : 0) - (n(a.data.title).includes(t) ? 1 : 0));
}
