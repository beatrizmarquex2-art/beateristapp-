// Markdown -> DOM, sem dependências e sem innerHTML: todo texto vira nó de texto (seguro contra XSS).
// Cobre o que a biblioteca usa: frontmatter, títulos, listas, tabelas, citações, <details>, links, negrito/itálico/código.
import { h } from './util.js';

export function parseFrontmatter(text) {
  const m = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/); if (!k) continue;
    let v = k[2].trim();
    if (v.startsWith('[')) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean); } }
    else if (/^".*"$/.test(v)) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } }
    else if (/^\d+$/.test(v)) v = Number(v);
    meta[k[1]] = v;
  }
  return { meta, body: m[2] };
}

export const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Só http(s). Bloqueia javascript:, data: etc. */
export function safeHref(raw) {
  try { const u = new URL(String(raw).trim()); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; }
}
const extLink = (href, kids, cls) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', class: cls || null }, kids);
const shortUrl = (u) => { const s = u.replace(/^https?:\/\/(www\.)?/, ''); return s.length > 48 ? `${s.slice(0, 46)}…` : s; };

const INLINE = /(\*\*[^*]+?\*\*)|(\*[^*\s][^*]*?\*)|(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s)<]+[^\s).,;:<])/g;
export function inline(src) {
  // regex local: inline() é recursiva (negrito dentro de link etc.) e um lastIndex compartilhado voltaria para trás, travando o laço
  const re = new RegExp(INLINE.source, 'g'); const out = []; let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const t = m[0];
    if (m[1]) out.push(h('strong', {}, inline(t.slice(2, -2))));
    else if (m[2]) out.push(h('em', {}, inline(t.slice(1, -1))));
    else if (m[3]) out.push(h('code', {}, t.slice(1, -1)));
    else if (m[4]) { const mm = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/); const href = safeHref(mm[2]); out.push(href ? extLink(href, inline(mm[1])) : mm[1]); }
    else { const href = safeHref(t); out.push(href ? extLink(href, shortUrl(t), 'bare') : t); }
    last = m.index + t.length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l || '');
const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const startsBlock = (l, next) => /^(#{1,4})\s/.test(l) || /^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l) || /^>\s?/.test(l) || /^\s*<details/.test(l) || /^(-{3,}|\*{3,})\s*$/.test(l) || /^```/.test(l) || (/^\|/.test(l) && isTableSep(next));

export function renderMarkdown(src, { skipH1 = true } = {}) {
  const used = new Set(); const headings = [];
  const uniq = (base) => { let id = base || 'secao', n = 2; while (used.has(id)) id = `${base}-${n++}`; used.add(id); return id; };

  function blocks(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n'); const out = []; let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if (/^\s*<details/.test(l)) {
        const buf = []; i++;
        while (i < lines.length && !/<\/details>/.test(lines[i])) buf.push(lines[i++]); i++;
        const inner = buf.join('\n'); const sm = inner.match(/<summary>([\s\S]*?)<\/summary>/);
        out.push(h('details', { class: 'recall' }, h('summary', {}, sm ? sm[1].trim() : 'abrir'), h('div', { class: 'recall-body' }, ...blocks(inner.replace(/<summary>[\s\S]*?<\/summary>/, '')))));
        continue;
      }
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
        const level = m[1].length, text = m[2].trim();
        if (level === 1 && skipH1) { i++; continue; }
        const id = uniq(slugify(text)); headings.push({ id, text, level });
        const el = h(`h${level}`, { id }, inline(text));
        const ex = level === 3 && text.match(/^experimento\s+(\d+)/i); if (ex) el.dataset.exp = ex[1];
        out.push(el); i++; continue;
      }
      if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push(h('hr')); i++; continue; }
      if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(h('pre', {}, h('code', {}, buf.join('\n')))); continue; }
      if (/^\|/.test(l) && isTableSep(lines[i + 1])) {
        const head = cells(l); i += 2; const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
        out.push(h('div', { class: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Tabela, role para os lados' },
          h('table', {}, h('thead', {}, h('tr', {}, head.map((c) => h('th', {}, inline(c))))), h('tbody', {}, rows.map((r) => h('tr', {}, head.map((_, k) => h('td', {}, inline(r[k] || ''))))))))); continue;
      }
      if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(h('blockquote', {}, ...blocks(buf.join('\n')))); continue; }
      if (/^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
        const ordered = /^\s*\d+\./.test(l); const items = [];
        while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
          const raw = lines[i++].replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, '');
          items.push(raw);
        }
        const onlyBold = !ordered && items.every((t) => /^\*\*[^*]+\*\*\s*$/.test(t));
        const list = h(ordered ? 'ol' : 'ul', { class: onlyBold ? 'fields' : null }, items.map((t) => { const li = h('li', {}, inline(t.trim())); if (onlyBold) li.dataset.field = t.replace(/\*\*/g, '').trim(); return li; }));
        out.push(list); continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !(buf.length && startsBlock(lines[i], lines[i + 1]))) buf.push(lines[i++]);
      const raw = buf.join('\n');
      const sm = raw.match(/^\*\*tipo:\*\*\s*([\wÀ-ú-]+)\s*·\s*\*\*força[^*]*\*\*\s*([A-Za-z])/);
      const rest = sm ? buf.slice(1) : buf; const kids = [];
      rest.forEach((ln, k) => { kids.push(...inline(ln.replace(/\s+$/, ''))); if (k < rest.length - 1) { if (/ {2,}$/.test(ln)) kids.push(h('br')); else kids.push(' '); } });
      if (sm) {
        out.push(h('div', { class: 'src-meta' }, h('span', { class: 'badges' }, h('span', { class: `badge kind-${sm[1]}` }, sm[1] === 'primary' ? 'estudo primário' : sm[1] === 'review' ? 'revisão' : sm[1]), h('span', { class: `badge grade-${sm[2]}`, title: 'força da fonte para este artigo' }, `força ${sm[2]}`)), h('p', {}, kids)));
        continue;
      }
      const p = h('p', {}, kids);
      out.push(p);
    }
    return out;
  }

  const flat = blocks(src);
  // agrupa em seções por <h2>
  const nodes = []; let cur = null;
  for (const n of flat) {
    if (n.tagName === 'H2') { cur = h('section', { class: 'sec', id: `s-${n.id}`, 'data-sec': n.id }); cur.append(n); nodes.push(cur); }
    else if (cur) cur.append(n); else nodes.push(n);
  }
  return { nodes, headings };
}
