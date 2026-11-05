// Código do álbum (BEA-0000): guarda o álbum no Supabase (funções album_guardar / album_ler, veja supabase/007_album_codigos.sql).
// Sem login. O código fica no progresso da criança (campo "codigo"); depois de criado, salva sozinho (junta, nunca apaga).
import { CONFIG } from '../config.js';
import * as P from './progress.js';
import * as store from '../store.js';
import { snapshot, mergeSnap, mergeFig } from './savegame-logic.js';
import * as FR from '../figurinhas/rewards.js';

const head = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
async function rpc(fn, body) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: head, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
export const codeOf = (pid) => P.progOf(pid).codigo || '';
const snapOf = (me, nome) => snapshot(nome || P.progOf(me.id).nomeAlbum || me.name, P.progOf(me.id), FR.stateOf());

/** Cria o código (ou salva de novo se já tem). Devolve o código. Lança erro sem internet / sem a tabela. */
export async function create(me, nome) {
  const have = codeOf(me.id);
  const rows = await rpc('album_guardar', { p_code: have || null, p_dados: snapOf(me, nome) });
  const code = rows && rows[0] && rows[0].code; if (!code) throw new Error('sem código');
  if (code !== have || (nome && nome !== P.progOf(me.id).nomeAlbum)) await P.patch(me.id, { codigo: code, ...(nome ? { nomeAlbum: nome } : {}) });
  return code;
}
/** Lê o álbum de um código (sem mudar nada). null = código não existe. */
export async function peek(code) { const d = await rpc('album_ler', { p_code: code }); return d && typeof d === 'object' ? d : null; }
/** Traz o álbum do código pra esse jogador (junta com o que já tem) e passa a usar esse código. */
export async function adopt(me, code, snap) {
  await P.patch(me.id, { ...mergeSnap(P.progOf(me.id), snap), codigo: code });
  if (snap.f) await store.upsert('figurinhas', FR.ID, mergeFig(FR.stateOf(), snap.f));
  return create(me);
}

/** Salva sozinho uns segundos depois de ganhar figurinha/estrela (só se a criança já tem código). Falha em silêncio. */
const timers = new Map();
export function soon(pid) {
  if (!codeOf(pid)) return;
  clearTimeout(timers.get(pid));
  timers.set(pid, setTimeout(() => { const me = P.profiles().find((p) => p.id === pid); if (me) create(me).catch(() => {}); }, 4000));
}
