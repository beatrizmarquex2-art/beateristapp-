// Lógica do álbum de figurinhas (sem tela): pacotes, sorteio, colar, contagem. Tudo determinístico e idempotente:
// o mesmo pacote (mesmo id) sempre dá as mesmas figurinhas e nunca é entregue nem aberto duas vezes.
import { rng, hashSeed } from './ornaments.js';

export const PACK_SIZE = 5;
export const TOTAL_FIGURINHAS = 131; // 125 do catálogo original + 6 do Paul (catalogo-paul.json)
export const ESTRELAS_POR_ROLETA = 30; // a cada 30 estrelas (somando todos os jogos) libera uma roleta
/** Roleta: 1 a 3 figurinhas; raramente (4%) uma exclusiva da Beaterista; às vezes Beatlemania e rara. */
export const ROLETA_PESOS = [['Comum', 62], ['Raras', 16], ['Beatlemania', 18], ['Beaterista', 4]];
export const ROLETA_QTD = [[1, 45], [2, 35], [3, 20]]; // a roleta dá de 1 a 3 figurinhas (peso de cada quantidade)
/** Prêmio de terminar um jogo inteiro: 3 figurinhas tops (exclusivas da Beaterista e raras). */
/** Pacotes da pauLta: id `pl:<cartas>:<chance de Beaterista %>:...`. Qualquer outro pacote comum tem PACK_SIZE cartas. */
export const plPack = (id) => { const m = /^pl:(\d+):(\d+):/.exec(String(id)); return m ? { n: Number(m[1]), bea: Number(m[2]) } : null; };
export const packSize = (id) => (plPack(id) ? plPack(id).n : PACK_SIZE);
export const packKind = (id) => (String(id).startsWith('roleta:') ? 'roleta' : String(id).startsWith('jogo:') ? 'jogo' : 'pacote');
export const WEIGHTS = { Comum: 80, Rara: 17, Exclusiva: 3 }; // chance de cada figurinha do pacote ser dessa raridade
// Seções do álbum (cada figurinha está em UMA): Beatlemania = coleção Beatles; Beaterista = as da Bea; Raras = raridade Rara (fora Beatles/Beaterista); Comum = o resto.
export const SECOES = ['Beatlemania', 'Beaterista', 'Comum', 'Raras'];
export const SECAO_ANTIGA = { Beatles: 'Beatlemania', Geral: 'Comum', Especial: 'Raras' }; // links e abas de antes
export const COLECOES = SECOES;
export const emptyState = () => ({ v: 1, inv: {}, pasted: {}, granted: [], opened: {}, reduzir: false });

const clone = (s) => ({ ...emptyState(), ...s, inv: { ...(s.inv || {}) }, pasted: { ...(s.pasted || {}) }, granted: [...(s.granted || [])], opened: { ...(s.opened || {}) } });

/** Check-in: 1 giro grátis da roleta por dia (id fixo por dia: abrir o álbum de novo não entrega outro). */
export const checkinId = (dateKey) => `roleta:dia:${dateKey}`;

/** Entrega um pacote (uma vez só por id). */
export function grantPack(state, id) {
  if (state.granted?.includes(id) || state.opened?.[id]) return state;
  const s = clone(state); s.granted.push(id); return s;
}
export const pendingPacks = (state) => (state.granted || []).filter((id) => !state.opened?.[id]);

const pickWeighted = (r, pesos) => { const t = pesos.reduce((a, [, w]) => a + w, 0); let x = r() * t; for (const [k, w] of pesos) { if (x < w) return k; x -= w; } return pesos[0][0]; };
/** Sorteia `n` códigos distintos, cada um de uma seção escolhida pelos pesos (mesma seed = mesmo resultado). */
function drawBySection(catalog, r, n, pesos) {
  const by = {}; for (const c of catalog) (by[c.secao] ||= []).push(c.codigo);
  const out = []; let guard = 0;
  while (out.length < n && guard++ < 500) { const pool = by[pickWeighted(r, pesos)] || []; const c = pool[Math.floor(r() * pool.length)]; if (c && !out.includes(c)) out.push(c); }
  return out;
}
/** Sorteio do pacote. `roleta:*` = 1 a 3 figurinhas; `jogo:*` = pacote de 5 com 1 rara garantida; o resto = pacote de 5 por raridade. Mesma seed = mesmas figurinhas. */
export function drawPack(catalog, packId, size = PACK_SIZE, salt = '') {
  const r = rng(hashSeed(`pack|${packId}${salt ? `|${salt}` : ''}`)); const kind = packKind(packId);
  if (String(packId).startsWith('dado:')) { const c = String(packId).split(':')[1].split(','); return c.filter((x) => catalog.some((y) => y.codigo === x)); } // presente da Bea: cartas escolhidas
  const pl = plPack(packId);
  if (pl) return drawBySection(catalog, r, pl.n, [['Comum', 62], ['Raras', 16], ['Beatlemania', 18], ['Beaterista', pl.bea]].filter(([, w]) => w > 0));
  if (kind === 'roleta') return drawBySection(catalog, r, pickWeighted(r, ROLETA_QTD), ROLETA_PESOS);
  if (kind === 'jogo') { // prêmio de jogo completo: 1 pacote de 5 com uma RARA garantida
    const raras = catalog.filter((c) => c.raridade === 'Rara').map((c) => c.codigo); const garantida = raras[Math.floor(r() * raras.length)];
    const out = garantida ? [garantida] : []; let guard = 0; const by = {}; for (const c of catalog) (by[c.raridade] ||= []).push(c.codigo); const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    while (out.length < size && guard++ < 800) { let x = r() * total, rar = 'Comum'; for (const [k, w] of Object.entries(WEIGHTS)) { if (x < w) { rar = k; break; } x -= w; } const pool = by[rar]; if (!pool?.length) continue; const c = pool[Math.floor(r() * pool.length)]; if (!out.includes(c)) out.push(c); }
    return out;
  }
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); const out = [];
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
  const s = clone(state); if (!s.seed) s.seed = Math.random().toString(36).slice(2, 12); const codes = drawPack(catalog, packId, PACK_SIZE, s.seed); // sorteio diferente pra cada aluno
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
export function stats(state, catalog, secao = null) {
  const list = secao ? catalog.filter((c) => c.secao === secao) : catalog;
  const got = list.filter((c) => state.pasted?.[c.codigo]).length;
  return { total: list.length, got, missing: list.length - got };
}
/** Número do espaço no álbum (1..N dentro da coleção, na ordem do catálogo). */
export const slotNumber = (catalog, entry) => catalog.filter((c) => c.secao === entry.secao).findIndex((c) => c.codigo === entry.codigo) + 1;
export const artistsOf = (catalog, secao) => [...new Set(catalog.filter((c) => c.secao === secao).map((c) => c.artista_banda))].sort((a, b) => a.localeCompare(b, 'pt'));

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
