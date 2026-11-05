// Porta do álbum (área do aluno): o aluno entra com o código BEA-0000 dele; o Supabase confere se foi liberado pela Bea
// (funções fig_entrar / fig_salvar, veja supabase/010_figurinhas_acesso.sql). Sem senha guardada no site.
import { CONFIG } from '../config.js';
const KEY = 'beaterista-album-code', NOME = 'beaterista-aluno-nome', ORIGEM = 'beaterista-aluno-origem';
const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const call = (fn, body) => fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
  method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
}).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
export const norm = (c) => String(c || '').replace(/\s+/g, '').toUpperCase();
export const lembrado = () => get(KEY);
export const esquecer = () => { try { localStorage.removeItem(KEY); } catch { /* ok */ } };
/** { ok, nome, estado } | { ok:false, motivo:'codigo'|'nao_liberado' }. Lança erro se não deu pra conferir (sem internet). */
export async function entrar(codigo) {
  const code = norm(codigo);
  const r = await call('fig_entrar', { p_code: code, p_aluno: get(NOME) || null, p_origem: get(ORIGEM) || null });
  if (r && r.ok) { try { localStorage.setItem(KEY, code); } catch { /* ok */ } }
  return { ...r, code };
}
/** Guarda o progresso no Supabase (falha em silêncio: o aparelho continua com o dele e tenta de novo na próxima). */
export const salvar = (codigo, estado) => call('fig_salvar', { p_code: norm(codigo), p_estado: estado }).catch(() => false);
