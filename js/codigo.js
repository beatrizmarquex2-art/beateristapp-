// Código do aluno. O aluno digita uma vez; o código fica no aparelho dele e é conferido toda vez que abre (a Bea pode desativar).
// Sem código: Piano Hero e as músicas prontas funcionam; o Beat Hero e a aba "Músicas MIDI" ficam trancados.
import { CONFIG } from './config.js';
import * as auth from './auth.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const anon = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
const KEY = 'beaterista-aluno-codigo';
const OK_KEY = 'beaterista-aluno-codigo-ok'; // última vez que o código foi confirmado (vale offline)
const OFFLINE_DAYS = 14;

export const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
export const saved = () => { try { return localStorage.getItem(KEY) || ''; } catch { return window.__alunoCodigo || ''; } };
function remember(c) { try { if (c) { localStorage.setItem(KEY, c); localStorage.setItem(OK_KEY, String(Date.now())); } else { localStorage.removeItem(KEY); localStorage.removeItem(OK_KEY); } } catch { window.__alunoCodigo = c || ''; } }
const recentlyOk = () => { try { return Date.now() - Number(localStorage.getItem(OK_KEY) || 0) < OFFLINE_DAYS * 864e5; } catch { return false; } };

/** Confere um código no servidor. true/false; lança erro se não deu pra falar com o servidor. */
export async function verificar(code) {
  const c = norm(code); if (c.length < 4) return false;
  const r = await fetch(`${base}/rpc/aluno_codigo_ok`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c }) });
  if (!r.ok) throw new Error(String(r.status));
  return (await r.json()) === true;
}
/** Aluno digitou um código novo: confere e guarda se valer. */
export async function entrar(code) { const c = norm(code); const ok = await verificar(c); if (ok) remember(c); return ok; }
/** Ao abrir: o código guardado ainda vale? Sem internet, vale se foi confirmado nos últimos 14 dias. Desativado pela Bea = tranca de novo. */
export async function revalidar() {
  const c = saved(); if (!c) return false;
  try { const ok = await verificar(c); if (!ok) remember(''); else remember(c); return ok; } catch { return recentlyOk(); }
}
export const sair = () => remember('');

/* ---------- Bea: gerenciar os códigos (precisa estar logada) ---------- */
async function head(extra = {}) { const t = await auth.accessToken(); if (!t) throw new Error('entre no app'); return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra }; }
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const gerar = () => { const a = new Uint32Array(6); crypto.getRandomValues(a); return [...a].map((x) => ABC[x % ABC.length]).join(''); };
export async function listar() {
  const r = await fetch(`${base}/alunos_codigos?select=code,nome,ativo,usos,criado_em,ultimo_uso&order=criado_em.desc`, { headers: await head() });
  if (!r.ok) throw new Error(String(r.status)); return r.json();
}
export async function criar(nome) {
  const code = gerar(); const r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify({ code, nome: String(nome || '').slice(0, 60) }) });
  if (!r.ok) throw new Error(String(r.status)); return code;
}
export async function alterar(code, patch) {
  const r = await fetch(`${base}/alunos_codigos?code=eq.${encodeURIComponent(code)}`, { method: 'PATCH', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify(patch) });
  if (!r.ok) throw new Error(String(r.status));
}
export async function apagar(code) {
  const r = await fetch(`${base}/alunos_codigos?code=eq.${encodeURIComponent(code)}`, { method: 'DELETE', headers: await head({ Prefer: 'return=minimal' }) });
  if (!r.ok) throw new Error(String(r.status));
}
