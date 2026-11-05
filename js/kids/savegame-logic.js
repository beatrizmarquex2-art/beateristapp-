// Código de save do álbum: transforma o progresso da criança num texto (copiar/colar) e de volta.
// Sem servidor: o código carrega tudo. Restaurar nunca tira nada (junta figurinhas e fica com a maior estrela).
import { byId } from './album-data.js';

const PREFIX = 'BEA1-';
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hash = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
async function pipe(u8, T) { const s = new Blob([u8]).stream().pipeThrough(new T('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer()); }

/** Só o que importa guardar: nome, figurinhas, estrelas por fase e contadores do ritmo. */
export function snapshot(name, prog) {
  const lv = {}; for (const [k, x] of Object.entries(prog.lv || {})) lv[k] = [x.s || 0, x.p || 0, x.n || 0];
  return { n: String(name || '').slice(0, 24), a: (prog.album || []).filter((id) => byId[id]), l: lv, r: [prog.ritmoStars || 0, prog.ritmoPaid || 0] };
}
/** Junta o save no progresso atual sem perder nada. Devolve só os pedaços que mudam. */
export function mergeSnap(prog, snap) {
  const album = [...new Set([...(prog.album || []).filter((id) => byId[id]), ...(snap.a || []).filter((id) => byId[id])])];
  const lv = { ...(prog.lv || {}) };
  for (const [k, [s, p, n]] of Object.entries(snap.l || {})) { const o = lv[k] || { s: 0, p: 0, n: 0 }; lv[k] = { s: Math.max(o.s, s | 0), p: Math.max(o.p, p | 0), n: Math.max(o.n, n | 0) }; }
  const [rs = 0, rp = 0] = snap.r || [];
  return { album, lv, ritmoStars: Math.max(prog.ritmoStars || 0, rs | 0), ritmoPaid: Math.max(prog.ritmoPaid || 0, rp | 0) };
}
export async function encode(snap) {
  const body = JSON.stringify(snap); const json = JSON.stringify({ ...snap, c: hash(body) });
  const u8 = new TextEncoder().encode(json);
  return PREFIX + b64(typeof CompressionStream === 'function' ? await pipe(u8, CompressionStream) : u8) + (typeof CompressionStream === 'function' ? '' : '~');
}
/** Lê o código; devolve o save ou null se estiver errado/quebrado. */
export async function decode(code) {
  try {
    let t = String(code || '').replace(/\s+/g, ''); if (!t.toUpperCase().startsWith(PREFIX)) return null; t = t.slice(PREFIX.length);
    const raw = t.endsWith('~'); if (raw) t = t.slice(0, -1);
    const u8 = unb64(t); const out = raw ? u8 : await pipe(u8, DecompressionStream);
    const o = JSON.parse(new TextDecoder().decode(out)); const { c, ...snap } = o;
    if (!c || c !== hash(JSON.stringify(snap)) || !Array.isArray(snap.a) || typeof snap.l !== 'object') return null;
    return snap;
  } catch { return null; }
}

/** "bea-0042", "BEA 42", "0042" → "BEA-0042". Devolve '' se não tiver 4 números. */
export function normCode(v) {
  const d = String(v || '').replace(/^\s*bea/i, '').replace(/\D/g, '');
  return d.length === 4 ? `BEA-${d}` : '';
}
/** Resumo pra confirmar "é esse álbum?" */
export const resumo = (snap) => ({ nome: snap.n || 'sem nome', figurinhas: (snap.a || []).length, estrelas: Object.values(snap.l || {}).reduce((t, x) => t + (x[0] || 0), 0) });
