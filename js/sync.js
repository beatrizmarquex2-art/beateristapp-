// Sincronização: fila local (registros "dirty") -> upsert idempotente por id; depois pull incremental.
// Conflitos: last-writer-wins por client_updated_at (o servidor também recusa escrita mais antiga).
import { CONFIG } from './config.js';
import * as auth from './auth.js';
import * as store from './store.js';
import { db } from './db.js';

export const state = { status: 'idle', error: '', lastSync: null };
const subs = new Set();
export const onSync = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const set = (patch) => { Object.assign(state, patch); subs.forEach((f) => f(state)); };

let running = false, again = false, timer = null, backoff = 0;
const BACKOFF = [5000, 15000, 60000, 300000];

async function api(path, opts = {}, retry = true) {
  const token = await auth.accessToken();
  if (!token) throw Object.assign(new Error('auth'), { code: 'auth' });
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (r.status === 401 && retry) { await auth.refresh(); return api(path, opts, false); }
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('auth'), { code: 'auth' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

async function push() {
  const dirty = (await db.dirtyRecords());
  if (!dirty.length) return 0;
  for (let i = 0; i < dirty.length; i += 200) {
    const chunk = dirty.slice(i, i + 200);
    const rows = chunk.map((r) => ({ id: r.id, kind: r.kind, data: r.data, client_updated_at: r.updated_at, deleted: !!r.deleted }));
    await api('records?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
    await store.markSynced(chunk);
  }
  return dirty.length;
}

async function pull() {
  let cursor = (await db.metaGet('cursor')) || '1970-01-01T00:00:00Z';
  for (let guard = 0; guard < 50; guard++) {
    const r = await api(`records?select=id,kind,data,client_updated_at,deleted,server_updated_at&server_updated_at=gte.${encodeURIComponent(cursor)}&order=server_updated_at.asc&limit=500`);
    const rows = await r.json();
    if (!rows.length) break;
    await store.applyRemote(rows);
    const last = rows[rows.length - 1].server_updated_at;
    const advanced = last !== cursor;
    cursor = last;
    await db.metaSet('cursor', cursor);
    if (rows.length < 500 || !advanced) break;
  }
}

export async function run() {
  if (!auth.configured() || !auth.getSession()) return set({ status: 'idle' });
  if (!navigator.onLine) return set({ status: 'offline' });
  if (running) { again = true; return; }
  running = true;
  set({ status: 'syncing', error: '' });
  try {
    await push();
    await pull();
    backoff = 0;
    set({ status: 'ok', lastSync: Date.now(), error: '' });
  } catch (e) {
    if (e.code === 'auth') set({ status: 'auth', error: 'Sessão expirada. Entre de novo para sincronizar.' });
    else if (!navigator.onLine) set({ status: 'offline' });
    else {
      set({ status: 'error', error: 'Falha ao sincronizar. Tentando de novo…' });
      clearTimeout(timer);
      timer = setTimeout(run, BACKOFF[Math.min(backoff++, BACKOFF.length - 1)]);
    }
  } finally {
    running = false;
    if (again) { again = false; schedule(300); }
  }
}

let deb;
export function schedule(ms = 800) { clearTimeout(deb); deb = setTimeout(run, ms); }

export function start() {
  store.setSyncHook(() => { if (navigator.onLine) schedule(); else set({ status: 'offline' }); });
  addEventListener('online', () => { set({ status: 'idle' }); schedule(200); });
  addEventListener('offline', () => set({ status: 'offline' }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(300); });
  setInterval(() => { if (document.visibilityState === 'visible') schedule(0); }, 60000);
  if (!navigator.onLine) set({ status: 'offline' }); else schedule(300);
}
