// Ranking que todos veem (área do aluno). Fala com duas funções do Supabase (ranking_top / ranking_add):
// a tabela em si é fechada, então só dá pra ver o top 10 e gravar um nome + pontuação (a melhor de cada nome vale).
import { CONFIG } from './config.js';

const cache = new Map(); // quadro -> { at, rows }
const url = (fn) => `${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`;
const head = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

/** Top 10 do quadro (do cache por 20 s). Devolve [] se estiver sem internet. */
export async function top(board, { fresh = false } = {}) {
  const c = cache.get(board);
  if (c && !fresh && Date.now() - c.at < 20000) return c.rows;
  try {
    const r = await fetch(url('ranking_top'), { method: 'POST', headers: head, body: JSON.stringify({ p_board: board }) });
    if (!r.ok) throw new Error(String(r.status));
    const rows = (await r.json()).map((x) => ({ name: x.name, score: x.score, acc: x.acc, grade: x.grade || '' }));
    cache.set(board, { at: Date.now(), rows }); return rows;
  } catch { return c ? c.rows : []; }
}
export const cached = (board) => (cache.get(board) || { rows: [] }).rows;

/** Manda a pontuação (só vale se for maior que a anterior do mesmo nome). Sem internet, não faz nada. */
export async function add(board, name, score, acc = null, grade = null) {
  const n = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 20); score = Math.round(Number(score) || 0);
  if (!n || score <= 0) return false;
  // já mostra na hora pra quem jogou
  const c = cache.get(board) || { at: 0, rows: [] };
  const rows = c.rows.filter((x) => x.name !== n); const prev = c.rows.find((x) => x.name === n);
  rows.push(prev && prev.score >= score ? prev : { name: n, score, acc, grade: grade || '' });
  cache.set(board, { at: c.at, rows: rows.sort((a, b) => b.score - a.score).slice(0, 10) });
  try {
    const r = await fetch(url('ranking_add'), { method: 'POST', headers: head, body: JSON.stringify({ p_board: board, p_name: n, p_score: score, p_acc: acc, p_grade: grade }) });
    const k = cache.get(board); if (k) k.at = 0; return r.ok;
  } catch { return false; }
}
