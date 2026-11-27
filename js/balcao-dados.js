// Balcão (códigos de aluno feitos pelas professoras): conversa com as funções balcao_* do Supabase (supabase/026_balcao.sql).
// A professora se identifica com o código de professora que já está neste aparelho; a Bea, com a conta dela.
import { CONFIG } from './config.js';
import * as CODE from './codigo.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1/rpc`;
export const CURSOS = ['Bateria', 'Violão', 'Guitarra e Baixo', 'Musicalização', 'Teclado'];
const NOME_KEY = 'beaterista-balcao-nome';
export const meuNome = () => { try { return localStorage.getItem(NOME_KEY) || ''; } catch { return ''; } };
export const guardaNome = (n) => { try { localStorage.setItem(NOME_KEY, String(n || '').trim().slice(0, 40)); } catch { /* ok */ } };

/** Quem está falando: a Bea logada (token dela) ou a professora (código de professora deste aparelho). */
async function quem() {
  try { const auth = await import('./auth.js'); const t = await auth.accessToken(); if (t) return { bea: true, headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, prof: null, nome: 'Bea' }; } catch { /* sem login */ }
  if (CODE.professor() && CODE.saved()) return { bea: false, headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, prof: CODE.saved(), nome: meuNome() };
  return null;
}
export const podeUsar = async () => !!(await quem());
export const erroTxt = (e) => { const m = String((e && e.message) || e); return /nao autorizado/.test(m) ? 'só a Bea e as professoras mexem aqui. entre com o código de professora.' : /muitas tentativas/.test(m) ? 'muitas tentativas, espere um minuto.' : /curso invalido/.test(m) ? 'escolha um curso da lista.' : /nome obrigatorio/.test(m) ? 'coloque o nome do aluno.' : /codigo invalido/.test(m) ? 'o código tem de 4 a 12 letras e números.' : /nao pode ser importado/.test(m) ? 'esse código não pode ser importado.' : /nao encontrado/.test(m) ? 'não achei esse código.' : 'não consegui falar com o servidor. tente de novo.'; };
async function rpc(nome, corpo) {
  const q = await quem(); if (!q) throw new Error('nao autorizado');
  const r = await fetch(`${base}/${nome}`, { method: 'POST', headers: q.headers, body: JSON.stringify({ p_prof: q.prof, p_quem: q.nome || null, ...corpo }) });
  if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch { /* ok */ } throw new Error(m || String(r.status)); }
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
export const sou = async () => { const q = await quem(); return q ? (q.bea ? 'Bea' : q.nome) : ''; };
export const listar = () => rpc('balcao_listar', {});
export const gerar = ({ nome, curso, ativo }) => rpc('balcao_gerar', { p_nome: nome, p_curso: curso || null, p_ativo: ativo });
export const importar = ({ code, nome, curso, ativo, trocar = false }) => rpc('balcao_importar', { p_code: code, p_nome: nome, p_curso: curso || null, p_ativo: ativo, p_trocar: trocar });
export const ativar = (code, on) => rpc('balcao_ativar', { p_code: code, p_on: on });
/** Filtro da lista: `so` = 'meus' | 'todos'; `eu` = nome de quem está olhando; `q` = busca por nome, código ou curso. */
export function filtra(lista, { so = 'todos', eu = '', q = '' } = {}) {
  const t = q.trim().toLowerCase(); return lista.filter((x) => (so !== 'meus' || (x.criado_por || '').toLowerCase() === eu.toLowerCase()) && (!t || [x.nome, x.code, x.curso, x.criado_por].some((v) => String(v || '').toLowerCase().includes(t))));
}
