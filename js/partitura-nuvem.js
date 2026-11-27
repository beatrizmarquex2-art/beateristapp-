// Pasta online das partituras (tabela `partituras`, supabase/022_partituras.sql). Só entra quem tem login: a Bea vê todas as pastas, cada professor vê a sua.
// Se a tabela ainda não foi criada no Supabase, o app avisa em português e continua guardando só neste aparelho.
import { CONFIG } from './config.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const token = async () => { if (globalThis.__pmToken) return globalThis.__pmToken; const a = await import('./auth.js'); return a.accessToken(); }; // __pmToken: só pros testes
async function head(extra = {}) { const t = await token(); if (!t) throw new Error('entre no app'); return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra }; }
const falha = (r) => new Error(r.status === 404 ? '404' : String(r.status));
const quem = async () => { try { const a = await import('./auth.js'); return (a.userEmail() || '').split('@')[0].slice(0, 60); } catch { return ''; } };

/** Mensagem pra mostrar quando algo não deu. */
export const textoErro = (e) => (e.message === 'entre no app' ? 'entre no app pra usar a pasta online' : e.message === '404' ? 'a pasta online ainda não foi ligada no servidor' : `a pasta online não respondeu (${e.message})`);
export const COLUNAS = 'id,nome,instrumento,pasta,dono,dono_nome,atualizado_em';

/** Lista as partituras (as mais recentes primeiro). A busca por nome o painel faz na tela (sem se importar com acento). */
export async function listar({ dono = '', limite = 300 } = {}) {
  const q = [`select=${COLUNAS}`, 'order=atualizado_em.desc', `limit=${limite}`]; if (dono) q.push(`dono=eq.${encodeURIComponent(dono)}`);
  const r = await fetch(`${base}/partituras?${q.join('&')}`, { headers: await head() }); if (!r.ok) throw falha(r); return r.json();
}
export async function abrir(id) {
  const r = await fetch(`${base}/partituras?select=*&id=eq.${encodeURIComponent(id)}`, { headers: await head() }); if (!r.ok) throw falha(r);
  const l = await r.json(); if (!l.length) throw new Error('404'); return l[0];
}
/** Cria (sem id) ou atualiza (com id). Devolve a linha. */
export async function salvar({ id, nome, instrumento = 'teclas', dados, pasta }) {
  const corpo = { nome: String(nome).trim().slice(0, 60), instrumento, dados, ...(pasta !== undefined ? { pasta: String(pasta).trim().slice(0, 60) } : {}) };
  const r = id
    ? await fetch(`${base}/partituras?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify(corpo) })
    : await fetch(`${base}/partituras`, { method: 'POST', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify({ ...corpo, dono_nome: await quem() }) });
  if (!r.ok) throw falha(r); const l = await r.json(); if (!l.length) throw new Error('403'); return l[0];
}
export async function apagar(id) {
  const r = await fetch(`${base}/partituras?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: await head({ Prefer: 'return=minimal' }) }); if (!r.ok) throw falha(r);
}
/** Tira o acento e põe em minúsculas, pra procurar por nome. */
export const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Filtra a lista pelo que a pessoa digitou (nome da partitura ou do professor). */
export const filtrar = (lista, busca) => { const q = norm(busca).trim(); return q ? lista.filter((x) => norm(x.nome).includes(q) || norm(x.dono_nome).includes(q)) : lista; };
/** Agrupa por professor (pasta de cada um), na ordem do mais recente. */
export function pastas(lista) {
  const m = new Map(); for (const x of lista) { const k = x.dono; if (!m.has(k)) m.set(k, { dono: k, nome: x.dono_nome || 'sem nome', itens: [] }); m.get(k).itens.push(x); }
  return [...m.values()];
}

/** Faz uma cópia da partitura `id` (nome "… (cópia)", mesma pasta). Devolve a linha nova. */
export async function duplicar(id) { const o = await abrir(id); return salvar({ nome: `${o.nome} (cópia)`.slice(0, 60), instrumento: o.instrumento, dados: o.dados, pasta: o.pasta || '' }); }
/** Muda a pasta de uma partitura ('' = sem pasta). */
export async function mover(id, pasta) {
  const r = await fetch(`${base}/partituras?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify({ pasta: String(pasta || '').trim().slice(0, 60) }) });
  if (!r.ok) throw falha(r); const l = await r.json(); if (!l.length) throw new Error('403'); return l[0];
}
/** Pastas que existem numa lista (ordem alfabética, sem repetir). */
export const pastasDe = (lista) => [...new Set(lista.map((x) => x.pasta).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
