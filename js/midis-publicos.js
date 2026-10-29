// MIDIs que a Bea escolhe mostrar na área dos alunos. A Bea grava/apaga na tabela midis_publicos (só ela tem permissão);
// o aluno lê pela função midis_publicos_lista() do Supabase (sem login). Veja supabase/005_midis_publicos.sql.
import { CONFIG } from './config.js';
import * as auth from './auth.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const anon = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

/** Aluno: as músicas que a Bea publicou ([{ id, name, folder, corte, b64 }]). Lança erro se estiver sem internet. */
export async function lista() {
  const r = await fetch(`${base}/rpc/midis_publicos_lista`, { method: 'POST', headers: anon, body: '{}' });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function beaHead(extra = {}) {
  const t = await auth.accessToken(); if (!t) throw new Error('entre no app pra publicar');
  return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra };
}

/** Bea: manda (ou atualiza) uma música pros alunos. `rec` é o registro "midisong". */
export async function publicar(rec) {
  const d = rec.data;
  const body = { id: rec.id, name: String(d.name || '').slice(0, 80), folder: String(d.folder || '').slice(0, 60), corte: d.trim && d.trim.b > d.trim.a ? d.trim : null, b64: d.b64, updated_at: new Date().toISOString() };
  const r = await fetch(`${base}/midis_publicos?on_conflict=id`, { method: 'POST', headers: await beaHead({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}`);
}

/** Bea: tira uma música da área dos alunos. */
export async function tirar(id) {
  const r = await fetch(`${base}/midis_publicos?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: await beaHead({ Prefer: 'return=minimal' }) });
  if (!r.ok) throw new Error(`${r.status}`);
}

/** O que muda na área dos alunos quando a Bea renomeia, move de pasta ou corta (pra saber se precisa reenviar). */
export const assinatura = (d) => JSON.stringify([d.name || '', d.folder || '', d.trim && d.trim.b > d.trim.a ? [d.trim.a, d.trim.b] : null]);
