// Fotos na nuvem: cada imagem guardada no aparelho (IndexedDB, "img:<id>") também sobe para o Supabase Storage,
// numa pasta PRIVADA por usuário (bucket "fotos", caminho <user_id>/<id>). Em outro aparelho, a foto que não estiver
// no IndexedDB é baixada na hora em que aparecer na tela. Os registros (capa, alunos, artistas…) já sincronizam e só
// guardam o id da imagem; aqui só viajam os arquivos.
import { CONFIG } from './config.js';
import * as auth from './auth.js';
import { db } from './db.js';

const BUCKET = 'fotos';
const UP = (id) => `img-up:${id}`;
const uid = () => { const s = auth.getSession(); return s && s.user && s.user.id; };
const url = (id, read) => `${CONFIG.SUPABASE_URL}/storage/v1/object/${read ? 'authenticated/' : ''}${BUCKET}/${uid()}/${encodeURIComponent(id)}`;
export const status = { pending: 0, uploaded: 0, failed: 0, running: false };
const listeners = new Set();
export const onStatus = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach((f) => f(status));

async function auth_(extra = {}) {
  const tok = await auth.accessToken();
  if (!tok || !uid()) throw Object.assign(new Error('auth'), { code: 'auth' });
  return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${tok}`, ...extra };
}

/** Sobe uma imagem (substitui se já existir). Marca como enviada; em falha fica pendente para a próxima rodada. */
export async function upload(id, blob) {
  const r = await fetch(url(id), { method: 'POST', headers: await auth_({ 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'true', 'Cache-Control': '31536000' }), body: blob });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  await db.metaSet(UP(id), 1);
}

/** Baixa uma imagem que existe na nuvem mas não neste aparelho. Devolve o blob ou null. */
const missed = new Map(); // não insiste a cada tela numa foto que ainda não chegou na nuvem
export async function download(id) {
  if (!navigator.onLine || (missed.get(id) || 0) > Date.now()) return null;
  try {
    const r = await fetch(url(id, true), { headers: await auth_() });
    if (!r.ok) { missed.set(id, Date.now() + 60000); return null; }
    const blob = await r.blob();
    await db.metaSet(`img:${id}`, blob); await db.metaSet(UP(id), 1);
    return blob;
  } catch { return null; }
}

/** Envia todas as imagens do aparelho que ainda não estão na nuvem (as antigas inclusive). */
export async function pushPending() {
  if (status.running || !navigator.onLine || !uid()) return status;
  status.running = true; status.failed = 0; notify();
  try {
    const keys = (await db.metaKeys('img:')).map((k) => k.slice(4));
    const todo = [];
    for (const id of keys) if (!(await db.metaGet(UP(id)))) todo.push(id);
    status.pending = todo.length; status.uploaded = keys.length - todo.length; notify();
    for (const id of todo) {
      try { const blob = await db.metaGet(`img:${id}`); if (blob) { await upload(id, blob); status.uploaded++; } status.pending--; }
      catch (e) { status.failed++; if (e.code === 'auth') break; }
      notify();
    }
  } finally { status.running = false; notify(); }
  return status;
}

let timer = 0;
/** Agenda uma rodada de envio (junta várias fotos novas num envio só). */
export function schedule(ms = 1500) { clearTimeout(timer); timer = setTimeout(() => { pushPending().catch(() => {}); }, ms); }
export function start() {
  schedule(800);
  addEventListener('online', () => schedule(500));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(1000); });
}
