// Ebooks e PDFs: o arquivo fica no aparelho (IndexedDB, "file:<id>") e numa pasta PRIVADA da nuvem
// (bucket "arquivos", caminho <user_id>/<id>). Abrir usa um link assinado que vale 1 hora; sem internet, abre a cópia do aparelho.
import { CONFIG } from './config.js';
import * as auth from './auth.js';
import { db } from './db.js';

const BUCKET = 'arquivos';
export const MAX_MB = 50; // limite do plano gratuito do Supabase por arquivo
const UP = (id) => `file-up:${id}`;
const uid = () => { const s = auth.getSession(); return s && s.user && s.user.id; };
const path = (id) => `${BUCKET}/${uid()}/${encodeURIComponent(id)}`;

async function headers(extra = {}) {
  const tok = await auth.accessToken();
  if (!tok || !uid()) throw Object.assign(new Error('auth'), { code: 'auth' });
  return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${tok}`, ...extra };
}

export async function upload(id, blob) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/${path(id)}`, { method: 'POST', headers: await headers({ 'Content-Type': blob.type || 'application/pdf', 'x-upsert': 'true' }), body: blob });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  await db.metaSet(UP(id), 1);
}

/** Guarda no aparelho e sobe. Devolve o id; se a nuvem falhar, fica pendente para `pushPending`. */
export async function saveFile(blob) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await db.metaSet(`file:${id}`, blob);
  await upload(id, blob).catch(() => {}); // sem internet: fica pendente e sobe depois
  return id;
}
export const isUp = async (id) => !!(await db.metaGet(UP(id)));

export async function pushPending() {
  if (!navigator.onLine || !uid()) return;
  for (const k of await db.metaKeys('file:')) {
    const id = k.slice(5);
    if (await db.metaGet(UP(id))) continue;
    const blob = await db.metaGet(k);
    if (blob) await upload(id, blob).catch(() => {});
  }
}

export async function remove(id) {
  await db.metaDel(`file:${id}`); await db.metaDel(UP(id));
  try { await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/${path(id)}`, { method: 'DELETE', headers: await headers() }); } catch { /* fica na nuvem até a próxima vez */ }
}

/** Endereço para abrir o arquivo: link assinado (online) ou a cópia do aparelho. */
export async function openUrl(id) {
  if (navigator.onLine) {
    try {
      const r = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/sign/${path(id)}`, { method: 'POST', headers: await headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ expiresIn: 3600 }) });
      if (r.ok) { const j = await r.json(); const u = j.signedURL || j.signedUrl; if (u) return `${CONFIG.SUPABASE_URL}/storage/v1${u.startsWith('/') ? '' : '/'}${u}`; }
    } catch { /* cai para a cópia local */ }
  }
  const blob = await db.metaGet(`file:${id}`);
  return blob ? URL.createObjectURL(blob) : null;
}
