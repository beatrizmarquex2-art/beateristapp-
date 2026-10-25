// Importar textos pro Listening Club: .md, .txt e .docx (Word), soltos ou dentro de um .zip.
// Cada arquivo vira um rascunho (a Bea revisa e publica). Puro, testado em tests/textimport.test.mjs.
import { parseFrontmatter } from './md.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Seção pela pasta, nome do arquivo ou campo "secao:" (padrão: Álbum por Dentro). */
export function guessSection(...hints) {
  const t = norm(hints.filter(Boolean).join(' '));
  if (/anatomia/.test(t)) return 'anatomia';
  if (/historia|bastidor/.test(t)) return 'historias';
  if (/\bdna\b/.test(t)) return 'dna';
  if (/versao|versoes|cover|ao vivo/.test(t)) return 'versoes';
  if (/caderno|diario|escuta/.test(t)) return 'caderno';
  return 'album';
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unxml = (s) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENT[e]).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
/** word/document.xml → markdown simples (títulos viram ##, negrito vira **, parágrafos separados). */
export function docxToMarkdown(xml) {
  const out = [];
  for (const p of String(xml).match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []) {
    const style = (/<w:pStyle w:val="([^"]+)"/.exec(p) || [])[1] || '';
    let line = '';
    for (const r of p.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || []) {
      const bold = /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(r);
      const txt = (r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g) || []).map((x) => (x === '<w:tab/>' ? ' ' : x === '<w:br/>' ? '\n' : unxml(x.replace(/<[^>]+>/g, '')))).join('');
      line += bold && txt.trim() ? `**${txt}**` : txt;
    }
    line = line.replace(/\*\*\*\*/g, '');
    if (!line.trim()) { out.push(''); continue; }
    if (/^(title|titulo|ttulo)$/i.test(style)) out.push(`# ${line.replace(/\*\*/g, '')}`);
    else if (/heading1|ttulo1|titulo1/i.test(style)) out.push(`# ${line.replace(/\*\*/g, '')}`);
    else if (/heading\d|ttulo\d|titulo\d/i.test(style)) out.push(`## ${line.replace(/\*\*/g, '')}`);
    else out.push(line);
  }
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Um arquivo de texto → dados do rascunho. "Artista - Álbum.md" vira artista e álbum. */
export function parseTextFile(path, text) {
  const file = path.split('/').pop().replace(/\.(md|markdown|txt|docx)$/i, '');
  const folder = path.split('/').slice(0, -1).join(' ');
  const { meta, body } = parseFrontmatter(String(text).replace(/^﻿/, ''));
  let md = body.trim(); let title = meta.title || meta.titulo || meta['título'] || '';
  const h1 = /^#\s+(.+)$/m.exec(md);
  if (!title && h1) title = h1[1].trim();
  if (h1 && title === h1[1].trim()) md = md.replace(h1[0], '').trim();
  const dash = /^(.+?)\s+[-–—]\s+(.+)$/.exec(file);
  const artist = meta.artista || meta.artist || (dash ? dash[1].trim() : '');
  const album = meta['álbum'] || meta.album || meta.disco || (dash ? dash[2].trim() : '');
  if (!title) title = dash ? `${album}, por dentro` : file;
  return { title: title.slice(0, 120), artist, album, body: md, section: guessSection(meta.secao || meta['seção'] || meta.section, folder, file), sources: meta.fontes || meta.sources || '' };
}
export const isText = (name) => /\.(md|markdown|txt)$/i.test(name);
export const isDocx = (name) => /\.docx$/i.test(name) && !/(^|\/)~\$/.test(name);
