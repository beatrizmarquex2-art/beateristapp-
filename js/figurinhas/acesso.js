// Porta do álbum (área do aluno): o código é conferido no Supabase (o site só guarda o hash lá, nunca o código).
import { CONFIG } from '../config.js';
const KEY = 'beaterista-album-ok';
const call = (fn, body) => fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
  method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
}).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
export const lembrado = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const esquecer = () => { try { localStorage.removeItem(KEY); } catch { /* ok */ } };
/** Versão atual do código (null se sem internet ou se ainda não foi definido). */
export async function versao() { try { return await call('album_codigo_versao'); } catch { return null; } }
/** true se o código está certo. Lembra neste aparelho até a Bea trocar o código. Lança erro se não deu pra conferir (sem internet). */
export async function entrar(codigo) {
  const ok = await call('album_codigo_ok', { p_codigo: codigo });
  if (ok) { const v = await versao(); try { localStorage.setItem(KEY, JSON.stringify({ versao: v })); } catch { /* ok */ } }
  return !!ok;
}
