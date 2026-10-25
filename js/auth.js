// Login via Supabase Auth (GoTrue) usando fetch — sem SDK, sem dependências.
import { CONFIG } from './config.js';
import { db } from './db.js';

export const configured = () => !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
let session = null;
const listeners = new Set();
export const onAuth = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach((f) => f(session));

export const getSession = () => session;
export const userEmail = () => (session && session.user && session.user.email) || '';

export async function loadSession() {
  session = (await db.metaGet('session')) || null;
  return session;
}

async function saveSession(s) {
  session = s;
  if (s) await db.metaSet('session', s); else await db.metaDel('session');
  notify();
}

function normalize(j) {
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + (j.expires_in || 3600) * 1000,
    user: { id: j.user && j.user.id, email: j.user && j.user.email },
  };
}

const headers = (extra) => ({ apikey: CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...extra });

export async function signIn(email, password) {
  if (!configured()) throw new Error('O servidor de login ainda não foi configurado neste app.');
  let r;
  try {
    r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
  } catch {
    throw new Error('Sem conexão. O primeiro login precisa de internet.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 400 || r.status === 401) throw new Error('E-mail ou senha incorretos.');
    throw new Error('Não foi possível entrar agora. Tente de novo em instantes.');
  }
  await saveSession(normalize(j));
  return session;
}

let refreshing = null;
/** Renova o token. Retorna 'ok' | 'offline' | 'invalid'. Offline NÃO derruba a sessão local. */
export function refresh() {
  if (!session) return Promise.resolve('invalid');
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refresh_token }) });
      if (r.ok) { await saveSession(normalize(await r.json())); return 'ok'; }
      if (r.status === 400 || r.status === 401 || r.status === 403) { await saveSession(null); return 'invalid'; }
      return 'offline';
    } catch { return 'offline'; } finally { refreshing = null; }
  })();
  return refreshing;
}

/** Token válido para chamadas à API (renova se estiver para vencer). */
export async function accessToken() {
  if (!session) return null;
  if (session.expires_at - Date.now() < 60000) {
    const st = await refresh();
    if (st === 'invalid') return null;
  }
  return session ? session.access_token : null;
}

export async function signOut() {
  const tok = session && session.access_token;
  if (tok && configured()) {
    try { await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers({ Authorization: `Bearer ${tok}` }) }); } catch { /* offline: ok */ }
  }
  await saveSession(null);
}
