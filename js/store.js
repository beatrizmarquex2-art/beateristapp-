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

/* ---------- desfazer / refazer (global) ---------- */
// cada entrada = lista de [id, kind, estado antes (null = não existia)]. Mudanças em até 700 ms viram um passo só.
const NO_UNDO = new Set(['setting']);
const undoSt = []; const redoSt = []; let lastAt = 0; let replaying = false;
const snap = (r) => (r && !r.deleted ? { kind: r.kind, data: r.data } : null);
function track(id, kind, before) {
  if (replaying || NO_UNDO.has(kind)) return;
  const now = Date.now();
  if (undoSt.length && now - lastAt < 700) { const g = undoSt[undoSt.length - 1]; if (!g.some((x) => x[0] === id)) g.push([id, kind, before]); }
  else { undoSt.push([[id, kind, before]]); if (undoSt.length > 60) undoSt.shift(); }
  lastAt = now; redoSt.length = 0; emit({ history: true });
}
export const canUndo = () => undoSt.length > 0;
export const canRedo = () => redoSt.length > 0;
async function step(from, to) {
  const g = from.pop(); if (!g) return false;
  replaying = true; const inv = [];
  try {
    for (const [id, kind, before] of g.slice().reverse()) {
      inv.push([id, kind, snap(cache.get(id))]);
      if (before) await upsertRaw(kind, id, before.data); else await removeRaw(id);
    }
  } finally { replaying = false; }
  to.push(inv); emit({ history: true }); return true;
}
export const undo = () => step(undoSt, redoSt);
export const redo = () => step(redoSt, undoSt);

/* Área dos alunos: o progresso dos jogos é de cada aluno (nome), não do aparelho. Quem troca de aluno começa do zero e, ao voltar, o que era dele está lá.
 * Sem nome (app da Bea) nada muda. Os dados que já existiam sem dono passam pra quem está com o nome agora (uma vez só: `beaterista-escopo-migrado`). */
const POR_ALUNO = new Set(['setting-xp', 'setting-treinos', 'setting-jogos', 'setting-roleta', 'setting-aventura', 'setting-paulta', 'setting-memoria', 'setting-ouvido', 'setting-desafio', 'setting-toque', 'setting-ritmo-hall', 'setting-piano']);
const MIGRADO = 'beaterista-escopo-migrado';
const donoAluno = () => { try { return (localStorage.getItem('beaterista-aluno-nome') || window.__alunoNome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30); } catch { return ''; } };
const chaveAluno = (id) => { if (!POR_ALUNO.has(id)) return id; const d = donoAluno(); return d ? `${id}:${d}` : id; };
/** Se o aluno ainda não tem o registro e há um antigo sem dono, o antigo passa pra ele (só pra quem chegar primeiro). */
function herdar(id, k) {
  if (k === id || cache.has(k)) return;
  const velho = cache.get(id); if (!velho || velho.deleted) return;
  let m = ''; try { m = localStorage.getItem(MIGRADO) || ''; } catch { /* ok */ }
  const d = donoAluno(); if (m && m !== d) return;
  try { localStorage.setItem(MIGRADO, d); } catch { /* ok */ }
  const novo = { ...velho, id: k, dirty: 0 }; cache.set(k, novo); db.putRecord(novo).catch(() => {});
}
export const get = (id) => { const k = chaveAluno(id); herdar(id, k); const r = cache.get(k); return r && !r.deleted ? r : null; };
export const pendingCount = () => { let n = 0; for (const r of cache.values()) if (r.dirty) n++; return n; };
export const allRaw = () => [...cache.values()];

const nextStamp = (prev) => Math.max(Date.now(), (prev || 0) + 1);

/** Cria ou atualiza (merge raso de `patch` em data). */
export async function upsert(kind, id, patch) {
  if (id) { const k = chaveAluno(id); herdar(id, k); id = k; }
  const prev0 = id ? cache.get(id) : null;
  const rec = await upsertRaw(kind, id, patch);
  track(rec.id, kind, snap(prev0));
  return rec;
}
async function upsertRaw(kind, id, patch) {
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

/** Exclusão lógica: vai pra lixeira (o conteúdo fica 30 dias); devolve snapshot para "desfazer". */
export async function remove(id) {
  const prev0 = cache.get(id);
  const sn = await removeRaw(id);
  if (sn) track(id, prev0.kind, snap(prev0));
  return sn;
}
async function removeRaw(id) {
  const prev = cache.get(id);
  if (!prev || prev.deleted) return null;
  const snapshot = { kind: prev.kind, data: prev.data };
  const rec = { id, kind: prev.kind, data: prev.data, updated_at: nextStamp(prev.updated_at), deleted: true, dirty: 1 }; // o conteúdo fica guardado na lixeira (30 dias)
  cache.set(id, rec);
  await db.putRecord(rec);
  emit({ kind: rec.kind, id });
  syncHook();
  return snapshot;
}
export const restore = (id, snapshot) => upsert(snapshot.kind, id, snapshot.data);

/* ---------- lixeira: tudo que foi apagado fica 30 dias e pode voltar ---------- */
export const TRASH_DAYS = 30;
export function trashList() {
  const out = [];
  for (const r of cache.values()) if (r.deleted && r.kind !== 'setting' && r.data && Object.keys(r.data).length) out.push(r);
  return out.sort((a, b) => b.updated_at - a.updated_at);
}
export const restoreFromTrash = (id) => { const r = cache.get(id); return r && r.deleted ? upsert(r.kind, id, r.data) : null; };
/** Apaga de vez o conteúdo (id) ou tudo da lixeira (sem id). Os mais velhos que 30 dias vão sozinhos. */
export async function purgeTrash(id, olderThanDays) {
  const cut = olderThanDays ? Date.now() - olderThanDays * 864e5 : Infinity;
  const hit = [];
  for (const r of cache.values()) {
    if (!r.deleted || !r.data || !Object.keys(r.data).length || r.kind === 'setting') continue;
    if ((id && r.id !== id) || (olderThanDays && r.updated_at > cut)) continue;
    const rec = { id: r.id, kind: r.kind, data: {}, updated_at: nextStamp(r.updated_at), deleted: true, dirty: 1 };
    cache.set(r.id, rec); hit.push(rec);
  }
  if (hit.length) { await db.putRecords(hit); emit({ trash: true }); syncHook(); }
  return hit.length;
}

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
  undoSt.length = 0; redoSt.length = 0;
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
