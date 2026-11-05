// Porta do álbum (área do aluno): o aluno entra com o código dele (o mesmo que a Bea criou pro Beat Hero / BEA-0000); o Supabase
// confere se está ativo (funções fig_entrar / fig_salvar, veja supabase/011_figurinhas_codigos.sql). Nada de senha guardada no site.
import { CONFIG } from '../config.js';
const KEY = 'beaterista-album-code', KEY_AULA = 'beaterista-aluno-codigo', NOME = 'beaterista-aluno-nome', ORIGEM = 'beaterista-aluno-origem';
const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const call = (fn, body) => fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
  method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
}).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
export const norm = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
/** Código já usado neste aparelho (o do álbum ou o que o aluno digitou pro Beat Hero). */
export const lembrado = () => get(KEY) || get(KEY_AULA);
export const esquecer = () => { try { localStorage.removeItem(KEY); } catch { /* ok */ } };
/** { ok, nome, estado } | { ok:false, motivo:'codigo' }. Lança erro se não deu pra conferir (sem internet). */
export async function entrar(codigo) {
  const code = norm(codigo);
  const r = await call('fig_entrar', { p_code: code, p_aluno: get(NOME) || null, p_origem: get(ORIGEM) || null });
  if (r && r.ok) { try { localStorage.setItem(KEY, code); } catch { /* ok */ } }
  return { ...r, code };
}
/** Guarda o progresso no Supabase (falha em silêncio: o aparelho continua com o dele e tenta de novo na próxima). */
export const salvar = (codigo, estado) => call('fig_salvar', { p_code: norm(codigo), p_estado: estado }).catch(() => false);
