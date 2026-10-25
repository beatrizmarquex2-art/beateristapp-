// IndexedDB — armazenamento local estruturado (offline-first).
const NAME = 'beaterista';
const VERSION = 1;
let dbp;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const r = indexedDB.open(NAME, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      const rec = db.createObjectStore('records', { keyPath: 'id' });
      rec.createIndex('kind', 'kind');
      rec.createIndex('dirty', 'dirty');
      db.createObjectStore('meta', { keyPath: 'key' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const st = tx.objectStore(store);
    let out;
    Promise.resolve(fn(st)).then((v) => { out = v; }).catch(reject);
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export const db = {
  allRecords: () => run('records', 'readonly', (s) => wrap(s.getAll())),
  getRecord: (id) => run('records', 'readonly', (s) => wrap(s.get(id))),
  putRecord: (rec) => run('records', 'readwrite', (s) => wrap(s.put(rec))),
  putRecords: (recs) => run('records', 'readwrite', (s) => { recs.forEach((r) => s.put(r)); }),
  dirtyRecords: () => run('records', 'readonly', (s) => wrap(s.index('dirty').getAll(1))),
  clearRecords: () => run('records', 'readwrite', (s) => wrap(s.clear())),
  metaGet: (key) => run('meta', 'readonly', (s) => wrap(s.get(key))).then((r) => (r ? r.value : undefined)),
  metaSet: (key, value) => run('meta', 'readwrite', (s) => wrap(s.put({ key, value }))),
  metaDel: (key) => run('meta', 'readwrite', (s) => wrap(s.delete(key))),
  clearMeta: () => run('meta', 'readwrite', (s) => wrap(s.clear())),
};

/** Pede armazenamento persistente (reduz o risco de o iOS limpar dados). Falha silenciosa. */
export async function requestPersistence() {
  try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch { return false; }
}
