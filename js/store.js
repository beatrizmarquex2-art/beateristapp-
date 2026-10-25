// Camada de dados em memória + IndexedDB. Toda mutação: id, updated_at, dirty (fila de envio).
import { db } from './db.js';
import { uid } from './util.js';

const cache = new Map(); // id -> registro {id, kind, data, updated_at, deleted, dirty}
const subs = new Set();
let syncHook = () => {};

export const setSyncHook = (fn) => { syncHook = fn; };
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
const emit = (info) => subs.forEach((f) => { try { f(info); } catch (e) { console.error(e); } });

export async function init() {
  cache.clear();
  (await db.allRecords()).forEach((r) => cache.set(r.id, r));
}

export function list(kind) {
  const out = [];
  for (const r of cache.values()) if (r.kind === kind && !r.deleted) out.push(r);
  return out;
}
export const get = (id) => { const r = cache.get(id); return r && !r.deleted ? r : null; };
export const pendingCount = () => { let n = 0; for (const r of cache.values()) if (r.dirty) n++; return n; };
export const allRaw = () => [...cache.values()];

const nextStamp = (prev) => Math.max(Date.now(), (prev || 0) + 1);

/** Cria ou atualiza (merge raso de `patch` em data). */
export async function upsert(kind, id, patch) {
  const prev = id ? cache.get(id) : null;
  const rec = {
    id: id || uid(),
    kind,
    data: { ...(prev && !prev.deleted ? prev.data : {}), ...patch },
    updated_at: nextStamp(prev && prev.updated_at),
    deleted: false,
    dirty: 1,
  };
  cache.set(rec.id, rec);
  await db.putRecord(rec);
  emit({ kind, id: rec.id });
  syncHook();
  return rec;
}

/** Exclusão lógica (tombstone) — o conteúdo é apagado do registro; devolve snapshot para "desfazer". */
export async function remove(id) {
  const prev = cache.get(id);
  if (!prev || prev.deleted) return null;
  const snapshot = { kind: prev.kind, data: prev.data };
  const rec = { id, kind: prev.kind, data: {}, updated_at: nextStamp(prev.updated_at), deleted: true, dirty: 1 };
  cache.set(id, rec);
  await db.putRecord(rec);
  emit({ kind: rec.kind, id });
  syncHook();
  return snapshot;
}
export const restore = (id, snapshot) => upsert(snapshot.kind, id, snapshot.data);

/** Aplica registros vindos do servidor. Last-writer-wins por updated_at; local mais novo permanece pendente. */
export async function applyRemote(rows) {
  const changed = [];
  const toSave = [];
  for (const row of rows) {
    const local = cache.get(row.id);
    const remote = { id: row.id, kind: row.kind, data: row.data || {}, updated_at: Number(row.client_updated_at), deleted: !!row.deleted, dirty: 0 };
    if (local && local.updated_at >= remote.updated_at) continue;
    cache.set(remote.id, remote);
    toSave.push(remote);
    changed.push(remote.kind);
  }
  if (toSave.length) {
    await db.putRecords(toSave);
    emit({ remote: true, kinds: [...new Set(changed)] });
  }
  return toSave.length;
}

/** Marca como enviado somente se não houve edição mais nova durante o envio. */
export async function markSynced(sent) {
  const upd = [];
  for (const s of sent) {
    const cur = cache.get(s.id);
    if (cur && cur.updated_at === s.updated_at && cur.dirty) { cur.dirty = 0; upd.push(cur); }
  }
  if (upd.length) { await db.putRecords(upd); emit({ sync: true }); }
}

export async function wipe() {
  cache.clear();
  await db.clearRecords();
  await db.metaDel('cursor'); // sem isso, o próximo login não rebaixaria os dados
  emit({ wiped: true });
}

/** Restaura de um backup: mescla por updated_at (nunca apaga registros mais novos). */
export async function importBackup(rows) {
  let n = 0; const save = [];
  for (const r of rows) {
    if (!r || !r.id || !r.kind || typeof r.updated_at !== 'number') continue;
    const local = cache.get(r.id);
    if (local && local.updated_at >= r.updated_at) continue;
    const rec = { id: String(r.id), kind: String(r.kind), data: r.data || {}, updated_at: r.updated_at, deleted: !!r.deleted, dirty: 1 };
    cache.set(rec.id, rec); save.push(rec); n++;
  }
  if (save.length) { await db.putRecords(save); emit({ imported: true }); syncHook(); }
  return n;
}
