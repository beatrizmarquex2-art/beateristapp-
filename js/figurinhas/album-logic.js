// Lógica do álbum de figurinhas (sem tela): pacotes, sorteio, colar, contagem. Tudo determinístico e idempotente:
// o mesmo pacote (mesmo id) sempre dá as mesmas figurinhas e nunca é entregue nem aberto duas vezes.
import { rng, hashSeed } from './ornaments.js';

export const PACK_SIZE = 5;
export const WEIGHTS = { Comum: 80, Rara: 17, Exclusiva: 3 }; // chance de cada figurinha do pacote ser dessa raridade
export const COLECOES = ['Geral', 'Beatles', 'Beaterista', 'Especial'];
export const emptyState = () => ({ v: 1, inv: {}, pasted: {}, granted: [], opened: {}, reduzir: false });

const clone = (s) => ({ ...emptyState(), ...s, inv: { ...(s.inv || {}) }, pasted: { ...(s.pasted || {}) }, granted: [...(s.granted || [])], opened: { ...(s.opened || {}) } });

export const dailyPackId = (dateKey) => `daily:${dateKey}`;
export const WELCOME_PACK = 'welcome:1';

/** Entrega um pacote (uma vez só por id). */
export function grantPack(state, id) {
  if (state.granted?.includes(id) || state.opened?.[id]) return state;
  const s = clone(state); s.granted.push(id); return s;
}
export const pendingPacks = (state) => (state.granted || []).filter((id) => !state.opened?.[id]);

/** Sorteio do pacote: raridade pelo peso, depois uma figurinha daquela raridade. Mesma seed = mesmo resultado. */
export function drawPack(catalog, packId, size = PACK_SIZE) {
  const r = rng(hashSeed(`pack|${packId}`)); const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); const out = [];
  const by = {}; for (const c of catalog) (by[c.raridade] ||= []).push(c.codigo);
  while (out.length < size) {
    let x = r() * total, rar = 'Comum';
    for (const [k, w] of Object.entries(WEIGHTS)) { if (x < w) { rar = k; break; } x -= w; }
    const pool = by[rar]; if (!pool?.length) continue;
    out.push(pool[Math.floor(r() * pool.length)]);
  }
  return out;
}
/** Abre o pacote: as figurinhas vão pra "mão" (ainda não coladas). Abrir de novo o mesmo id não faz nada. */
export function openPack(state, catalog, packId) {
  if (!state.granted?.includes(packId) || state.opened?.[packId]) return { state, codes: state.opened?.[packId] || null, fresh: false };
  const s = clone(state); const codes = drawPack(catalog, packId);
  s.opened[packId] = codes; for (const c of codes) s.inv[c] = (s.inv[c] || 0) + 1;
  return { state: s, codes, fresh: true };
}
export const canPaste = (state, code) => (state.inv?.[code] || 0) > 0 && !state.pasted?.[code];
/** Cola uma figurinha no álbum. Se já está colada, a outra fica como repetida na mão. */
export function paste(state, code) {
  if (!canPaste(state, code)) return state;
  const s = clone(state); s.inv[code] -= 1; if (s.inv[code] <= 0) delete s.inv[code]; s.pasted[code] = true; return s;
}
export const pasteAll = (state) => Object.keys(state.inv || {}).reduce((s, c) => paste(s, c), state);
export const repeated = (state) => Object.entries(state.inv || {}).reduce((n, [c, k]) => n + (state.pasted?.[c] ? k : Math.max(0, k - 1)), 0);
export const inHand = (state) => Object.values(state.inv || {}).reduce((a, b) => a + b, 0);

/** Contagem de uma coleção (ou de todas): coladas, total, faltantes. */
export function stats(state, catalog, colecao = null) {
  const list = colecao ? catalog.filter((c) => c.colecao === colecao) : catalog;
  const got = list.filter((c) => state.pasted?.[c.codigo]).length;
  return { total: list.length, got, missing: list.length - got };
}
/** Número do espaço no álbum (1..N dentro da coleção, na ordem do catálogo). */
export const slotNumber = (catalog, entry) => catalog.filter((c) => c.colecao === entry.colecao).findIndex((c) => c.codigo === entry.codigo) + 1;
export const artistsOf = (catalog, colecao) => [...new Set(catalog.filter((c) => c.colecao === colecao).map((c) => c.artista_banda))].sort((a, b) => a.localeCompare(b, 'pt'));

/** Cópias que sobram na mão = (vezes que a figurinha saiu nos pacotes abertos) - (1 se já está colada). Sempre dá pra recalcular, então juntar dois aparelhos nunca erra. */
export function deriveInv(opened, pasted) {
  const inv = {};
  for (const codes of Object.values(opened || {})) for (const c of codes || []) inv[c] = (inv[c] || 0) + 1;
  for (const c of Object.keys(pasted || {})) if (inv[c]) { inv[c] -= 1; if (inv[c] <= 0) delete inv[c]; }
  return inv;
}
/** Junta o progresso de dois aparelhos: pacotes abertos, pacotes recebidos e figurinhas coladas são a união (nunca apaga nada). */
export function mergeStates(a, b) {
  const A = { ...emptyState(), ...(a || {}) }, B = { ...emptyState(), ...(b || {}) };
  const opened = { ...A.opened, ...B.opened }, pasted = { ...A.pasted, ...B.pasted };
  return { ...emptyState(), opened, pasted, granted: [...new Set([...(A.granted || []), ...(B.granted || [])])].sort(), reduzir: !!(A.reduzir || B.reduzir), inv: deriveInv(opened, pasted) };
}
export const sameProgress = (a, b) => JSON.stringify([Object.keys(a.pasted || {}).sort(), Object.keys(a.opened || {}).sort(), [...(a.granted || [])].sort()]) === JSON.stringify([Object.keys(b.pasted || {}).sort(), Object.keys(b.opened || {}).sort(), [...(b.granted || [])].sort()]);
