// Letras na área do aluno: as 30 dicas vêm do Supabase (função dicas_lista) e só com código de aluno válido.
// Elas entram no armazenamento local do aluno como registros "tip", que é de onde os jogos já leem.
import { CONFIG } from './config.js';
import * as store from './store.js';

const KEY = 'beaterista-aluno-dicas-em';
const HORAS = 12;
export async function carregar(code) {
  if (!code) return false;
  try { if (Date.now() - Number(localStorage.getItem(KEY) || 0) < HORAS * 36e5 && store.list('tip').length >= 6) return true; } catch { /* sem armazenamento */ }
  try {
    const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/dicas_lista`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code }) });
    if (!r.ok) throw new Error(String(r.status));
    const rows = await r.json(); if (!Array.isArray(rows)) return false;
    const have = new Map(store.list('tip').map((t) => [t.data.n, t.data.text]));
    for (const x of rows) { const n = Number(x.n); const text = String(x.texto || ''); if (n && text && have.get(n) !== text) await store.upsert('tip', `metodo-dica-${String(n).padStart(2, '0')}`, { n, text, metodo: 'aluno', source: 'dicas_lista' }); }
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ok */ }
    return rows.length > 0;
  } catch { return store.list('tip').length >= 6; } // sem internet: usa o que já veio antes
}
