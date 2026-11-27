// Beaterista PRO: camada de dados. Tudo vai pro Supabase (tabelas pro_*, supabase/023_pro.sql) com o login do próprio professor;
// o servidor (RLS) garante que cada um só enxerga o que é dele. Nada é guardado "de enfeite": se o servidor não responde, a tela avisa.
import { CONFIG } from '../config.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const token = async () => { if (globalThis.__proToken) return globalThis.__proToken; const a = await import('../auth.js'); return a.accessToken(); }; // __proToken: só pros testes
async function head(extra = {}) { const t = await token(); if (!t) throw new Error('entre'); return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra }; }
const falha = (r) => new Error(r.status === 404 ? 'tabela' : r.status === 401 || r.status === 403 ? 'entre' : String(r.status));
export const textoErro = (e) => (e && e.message === 'entre' ? 'sua sessão expirou: entre de novo' : e && e.message === 'tabela' ? 'o banco do PRO ainda não foi ligado no servidor' : 'não consegui falar com o servidor agora. tente de novo');

export const TABELAS = ['pro_perfil', 'pro_alunos', 'pro_aulas', 'pro_eventos'];
/** Lista as linhas de uma tabela. `ordem` ex.: 'inicio.asc'. `filtros` ex.: { aluno_id: 'eq.123' }. */
export async function listar(tabela, { ordem = 'criado_em.desc', limite = 500, filtros = {} } = {}) {
  const q = [`select=*`, `order=${ordem}`, `limit=${limite}`, ...Object.entries(filtros).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)];
  const r = await fetch(`${base}/${tabela}?${q.join('&')}`, { headers: await head() }); if (!r.ok) throw falha(r); return r.json();
}
/** Cria (sem id) ou atualiza (com id). Devolve a linha gravada. */
export async function gravar(tabela, corpo, id = '') {
  const r = id
    ? await fetch(`${base}/${tabela}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify(corpo) })
    : await fetch(`${base}/${tabela}`, { method: 'POST', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify(corpo) });
  if (!r.ok) throw falha(r); const l = await r.json(); if (!l.length) throw new Error('entre'); return l[0];
}
export async function apagar(tabela, id) {
  const r = await fetch(`${base}/${tabela}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: await head({ Prefer: 'return=minimal' }) }); if (!r.ok) throw falha(r);
}
/** O perfil do professor (1 linha, chave = o próprio usuário). Cria vazio se ainda não existe. */
export async function perfil() {
  const l = await listar('pro_perfil', { limite: 1 }); if (l[0]) return l[0];
  const r = await fetch(`${base}/pro_perfil`, { method: 'POST', headers: await head({ Prefer: 'return=representation' }), body: '{}' }); if (!r.ok) throw falha(r); return (await r.json())[0];
}
export async function gravarPerfil(corpo) {
  const p = await perfil(); const r = await fetch(`${base}/pro_perfil?dono=eq.${encodeURIComponent(p.dono)}`, { method: 'PATCH', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify(corpo) });
  if (!r.ok) throw falha(r); return (await r.json())[0];
}

/* ---------- helpers puros (testados em tests/pro-dados.test.mjs) ---------- */
export const NIVEIS = [['iniciante', 'iniciante'], ['basico', 'básico'], ['intermediario', 'intermediário'], ['avancado', 'avançado']];
export const nomeNivel = (n) => (NIVEIS.find((x) => x[0] === n) || [, n])[1];
export const ETAPAS = [['aquecimento', 'aquecimento'], ['teoria', 'conceito'], ['pratica', 'prática'], ['repertorio', 'repertório'], ['jogo', 'atividade lúdica'], ['fechamento', 'fechamento']];
export const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const filtrar = (lista, busca, campos = ['nome']) => { const q = norm(busca).trim(); return q ? lista.filter((x) => campos.some((c) => norm(x[c]).includes(q))) : lista; };
/** Soma os minutos das etapas de uma aula. */
export const minutos = (etapas) => (etapas || []).reduce((s, e) => s + (Math.max(0, parseInt(e.min, 10)) || 0), 0);
/** Segunda-feira (00:00 local) da semana de `d`. */
export function inicioSemana(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
export const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const mesmoDia = (a, b) => { const x = new Date(a); const y = new Date(b); return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate(); };
/** Eventos que caem no dia `d`, em ordem de horário. */
export const doDia = (eventos, d) => eventos.filter((e) => mesmoDia(e.inicio, d)).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
/** "2026-11-30" + "14:30" (hora local) → ISO. */
export const juntaDataHora = (data, hora) => { const [y, m, d] = data.split('-').map(Number); const [hh, mm] = (hora || '00:00').split(':').map(Number); return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString(); };
export const dataInput = (d) => { const x = new Date(d); const p = (n) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`; };
export const horaInput = (d) => { const x = new Date(d); const p = (n) => String(n).padStart(2, '0'); return `${p(x.getHours())}:${p(x.getMinutes())}`; };
/** Aulas já dadas de um aluno (histórico), da mais recente. */
export const historico = (eventos, alunoId) => eventos.filter((e) => e.aluno_id === alunoId && e.status === 'dada').sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
/** Quanto das metas está feito (0 a 1). */
export const progressoMetas = (metas) => { const l = Array.isArray(metas) ? metas : []; return l.length ? l.filter((m) => m.feita).length / l.length : 0; };
/** Pastas (categorias) que existem nas aulas, em ordem alfabética. */
export const pastasDeAulas = (aulas) => [...new Set(aulas.map((a) => a.pasta).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
/** Roteiro base de uma aula pela duração (estrutura sugerida, não é IA): aquecimento, conceito, prática, repertório, fechamento. */
export function esqueleto(duracao) {
  const total = Math.max(15, parseInt(duracao, 10) || 50); const pesos = [['aquecimento', 0.12], ['teoria', 0.18], ['pratica', 0.3], ['repertorio', 0.28], ['fechamento', 0.12]];
  let usado = 0; const etapas = pesos.map(([tipo, p], i) => { const min = i === pesos.length - 1 ? total - usado : Math.max(2, Math.round(total * p)); usado += min; return { tipo, titulo: '', min, texto: '' }; });
  return etapas;
}
