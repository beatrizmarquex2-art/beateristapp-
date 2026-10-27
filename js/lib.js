// Biblioteca de estudos: artigos ficam numa tabela PRIVADA do Supabase (RLS); aqui só lemos, guardamos cópia local para ler offline
// e guardamos o progresso/respostas da Bea como registros normais do app (sincronizam como o resto).
import { CONFIG } from './config.js';
import * as auth from './auth.js';
import * as store from './store.js';
import { db } from './db.js';
import { parseFrontmatter, slugify } from './md.js';
import { readZip } from './zip.js';
import { withPt } from './catalog.js';

export const COLLECTIONS = {
  'mente-musical': { label: 'Mente Musical', short: 'Mente musical', blurb: 'como o cérebro percebe, prevê e aprende música' },
  'laboratorio-de-artistas': { label: 'Laboratório de Artistas', short: 'Artistas', blurb: 'processo, decisões e exercícios de quem criou linguagem própria' },
};
export const DIFF = { basic: 'iniciante', intermediate: 'intermediário', advanced: 'avançado' };
export const status = { source: 'none', error: '' };

async function api(path, opts = {}, retry = true) {
  const token = await auth.accessToken();
  if (!token) throw Object.assign(new Error('auth'), { code: 'auth' });
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (r.status === 401 && retry) { await auth.refresh(); return api(path, opts, false); }
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('auth'), { code: 'auth' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

let index = null; const bodies = new Map();
export const resetIndex = () => { index = null; bodies.clear(); };
export const items = () => index || [];
export async function loadIndex() {
  if (index) return index;
  try {
    const rows = await (await api('articles?select=slug,collection,title,meta,updated_at&order=title.asc')).json();
    index = rows.map(withPt); status.source = 'net'; status.error = '';
    await db.metaSet('lib:index', rows);
  } catch (e) {
    const cached = await db.metaGet('lib:index');
    if (cached) { index = cached.map(withPt); status.source = 'cache'; } else { index = []; status.source = 'none'; status.error = e.code === 'auth' ? 'auth' : 'offline'; }
  }
  return index;
}
export async function loadBody(slug) {
  if (bodies.has(slug)) return bodies.get(slug);
  let row = null;
  try {
    const rows = await (await api(`articles?slug=eq.${encodeURIComponent(slug)}&select=slug,collection,title,meta,body`)).json();
    row = rows[0] || null; if (row) await db.metaSet(`lib:a:${slug}`, row);
  } catch { row = (await db.metaGet(`lib:a:${slug}`)) || null; }
  if (row) { row = withPt(row); bodies.set(slug, row); }
  return row;
}
/** Baixa em segundo plano todos os textos para leitura offline e busca no conteúdo. */
export async function prefetch() { const idx = await loadIndex(); for (const a of idx) { if (!bodies.has(a.slug)) await loadBody(a.slug); } }

const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function search(q) {
  const terms = norm(q).split(/\s+/).filter(Boolean); if (!terms.length) return [];
  const out = [];
  for (const a of index || []) {
    const head = norm(`${a.title} ${a.titleEn || ''} ${a.meta.summary || ''} ${(a.meta.tags || []).join(' ')}`);
    const body = bodies.has(a.slug) ? norm(bodies.get(a.slug).body) : '';
    if (!terms.every((t) => head.includes(t) || body.includes(t))) continue;
    let snippet = '';
    if (bodies.has(a.slug)) { const raw = bodies.get(a.slug).body; const at = norm(raw).indexOf(terms[0]); if (at >= 0 && !norm(a.title).includes(terms[0])) snippet = raw.slice(Math.max(0, at - 50), at + 110).replace(/[#*>`|_-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
    out.push({ a, snippet, score: terms.reduce((n, t) => n + (norm(a.title).includes(t) ? 3 : 0) + (head.includes(t) ? 1 : 0), 0) });
  }
  return out.sort((x, y) => y.score - x.score);
}

/* ---------- estado de estudo (sincroniza como o resto do app) ---------- */
const sid = (slug) => `study-${slug}`;
export const getState = (slug) => (store.get(sid(slug)) ? store.get(sid(slug)).data : {});
export const patchState = (slug, patch) => store.upsert('study', sid(slug), { slug, ...patch });
export const allStates = () => store.list('study').map((r) => ({ slug: r.data.slug || r.id.replace(/^study-/, ''), ...r.data }));
export const bySlug = (slug) => (index || []).find((a) => a.slug === slug);
export const relatedOf = (a) => (a.meta.related_articles || []).map((t) => ({ title: t, hit: (index || []).find((x) => x.slug === slugify(t) || norm(x.title) === norm(t) || norm(x.titleEn || '') === norm(t)) || null }));

/* ---------- importação (.md soltos ou .zip) ---------- */
export async function importFiles(files, onProgress = () => {}) {
  const found = [];
  for (const f of files) {
    const n = f.name.toLowerCase();
    if (n.endsWith('.zip')) { for (const e of await readZip(await f.arrayBuffer())) if (/\.md$/i.test(e.name)) found.push({ path: e.name, text: new TextDecoder().decode(await e.read()) }); }
    else if (n.endsWith('.md')) found.push({ path: f.name, text: await f.text() });
  }
  const rows = []; let skipped = 0;
  for (const it of found) {
    const base = it.path.split('/').pop().toLowerCase();
    if (['index.md', 'readme.md', 'prompt-para-claude.md'].includes(base)) { skipped++; continue; }
    const { meta, body } = parseFrontmatter(it.text);
    const folder = it.path.split('/').slice(-2, -1)[0] || '';
    const collection = meta.collection || folder;
    if (!meta.title || !collection || !COLLECTIONS[collection]) { skipped++; continue; }
    const { title, slug, collection: _c, ...rest } = meta;
    rows.push({ slug: slug || slugify(title), collection, title, meta: rest, body: body.trim() ? body.replace(/^\s+/, '') : '' });
  }
  let done = 0;
  for (let i = 0; i < rows.length; i += 8) {
    const chunk = rows.slice(i, i + 8);
    await api('articles?on_conflict=slug', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(chunk) });
    done += chunk.length; onProgress(done, rows.length);
  }
  resetIndex();
  return { imported: done, skipped };
}
