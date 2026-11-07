// Código do aluno. O aluno digita uma vez; o código fica no aparelho dele e é conferido toda vez que abre (a Bea pode desativar).
// Sem código: todos os jogos de ritmo (Beat Hero, Piano Hero, músicas prontas e Músicas MIDI) ficam trancados.
import { CONFIG } from './config.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const anon = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
const KEY = 'beaterista-aluno-codigo';
const OK_KEY = 'beaterista-aluno-codigo-ok'; // última vez que o código foi confirmado (vale offline)
const OFFLINE_DAYS = 365; // o código fica salvo 1 ano neste aparelho (a Bea desativa quando quiser; vale na próxima vez que ele abrir com internet)

export const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
export const saved = () => { try { return localStorage.getItem(KEY) || ''; } catch { return window.__alunoCodigo || ''; } };
function remember(c) { try { if (c) { localStorage.setItem(KEY, c); localStorage.setItem(OK_KEY, String(Date.now())); } else { localStorage.removeItem(KEY); localStorage.removeItem(OK_KEY); } } catch { window.__alunoCodigo = c || ''; } }
const recentlyOk = () => { try { return Date.now() - Number(localStorage.getItem(OK_KEY) || 0) < OFFLINE_DAYS * 864e5; } catch { return false; } };

const ID_KEY = 'beaterista-aluno-id'; // o mesmo id de aparelho do registro de acessos
const PROF = 'beaterista-prof-codigo'; // código secreto da professora (só neste aparelho)
const aparelhoId = () => { try { let v = localStorage.getItem(ID_KEY); if (!v) { v = crypto.randomUUID(); localStorage.setItem(ID_KEY, v); } return v; } catch { return window.__alunoAparelho || (window.__alunoAparelho = crypto.randomUUID()); } };
let ultimoMotivo = '';
/** Por que o último código foi recusado: 'codigo' | 'vencido' | 'aparelhos' | 'aparelho' | ''. */
export const motivo = () => ultimoMotivo;
/** Texto pro aluno de acordo com o motivo da recusa. */
export const erroTexto = () => ({
  vencido: 'esse código venceu. fale com a professora Bea.',
  aparelhos: 'esse código já está em 2 aparelhos. fale com a professora Bea pra liberar uma troca.',
  aparelho: 'não deu pra identificar este aparelho. tente de novo.',
}[ultimoMotivo] || 'não achei esse código. confira com a sua professora.');

/** Pergunta ao servidor sobre um código. Devolve { ok, tipo, motivo... }; lança erro se não deu pra falar com o servidor. */
async function acesso(c) {
  const ua = String(navigator.userAgent || '').slice(0, 160);
  const r = await fetch(`${base}/rpc/aluno_acesso`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c, p_aparelho: aparelhoId(), p_ua: ua }) });
  if (r.status === 404) { // servidor ainda sem a função nova: usa a antiga (só vale/não vale)
    const o = await fetch(`${base}/rpc/aluno_codigo_ok`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c }) });
    if (!o.ok) throw new Error(String(o.status)); const ok = (await o.json()) === true; return ok ? { ok: true, tipo: 'turma' } : { ok: false, motivo: 'codigo' };
  }
  if (!r.ok) throw new Error(String(r.status));
  const j = await r.json(); return typeof j === 'boolean' ? { ok: j, tipo: 'turma', motivo: j ? '' : 'codigo' } : j; // true/false = resposta da função antiga
}
/** Confere um código no servidor. true/false; lança erro se não deu pra falar com o servidor. */
export async function verificar(code) {
  const c = norm(code); ultimoMotivo = ''; if (c.length < 4) { ultimoMotivo = 'codigo'; return false; }
  const i = await acesso(c); ultimoMotivo = i.ok ? '' : (i.motivo || 'codigo'); return i.ok === true;
}
/** Aluno digitou um código novo: confere e guarda se valer. O código da professora também entra por aqui. */
export async function entrar(code) {
  const c = norm(code); ultimoMotivo = ''; if (c.length < 4) { ultimoMotivo = 'codigo'; return false; }
  const i = await acesso(c); ultimoMotivo = i.ok ? '' : (i.motivo || 'codigo');
  if (i.ok) { remember(c); if (i.tipo === 'prof') { try { localStorage.setItem(PROF, c); } catch { window.__profCodigo = c; } } }
  return i.ok === true;
}
/** Ao abrir: o código guardado ainda vale? Sem internet, vale se foi confirmado no último ano. Desativado pela Bea = tranca de novo. */
export async function revalidar() {
  const c = saved(); if (!c) return false;
  try { const ok = await verificar(c); if (!ok) remember(''); else remember(c); return ok; } catch { return recentlyOk(); }
}
export const sair = () => remember('');
/** Guarda um código já conferido (troca de aluno no mesmo aparelho). */
export const guardar = (c) => remember(norm(c));

/* ---------- professora: fica logada com o código secreto e troca de aluno pela busca ---------- */
export const profCodigo = () => { try { return localStorage.getItem(PROF) || ''; } catch { return window.__profCodigo || ''; } };
export const ehProf = () => !!profCodigo();
/** Sai do modo professora neste aparelho (o próximo a abrir precisa de código). */
export function profSair() { try { localStorage.removeItem(PROF); } catch { /* ok */ } window.__profCodigo = ''; remember(''); }
/** A turma que a professora cadastrou: [{ nome, code }]. Só o código secreto dela abre isso no servidor. */
export async function profTurma() {
  const r = await fetch(`${base}/rpc/prof_turma`, { method: 'POST', headers: anon, body: JSON.stringify({ p_prof: profCodigo() }) });
  if (!r.ok) throw new Error(String(r.status)); const l = await r.json(); return Array.isArray(l) ? l : [];
}

/* ---------- pedido de código: a criança gera o código dela, conta pra professora, a professora cadastra, e o app libera sozinho ---------- */
const PEND = 'beaterista-aluno-codigo-pendente';
export const pendente = () => { try { return localStorage.getItem(PEND) || ''; } catch { return window.__alunoCodigoPend || ''; } };
/** Gera (uma vez só) o código desta criança. Fica guardado até a professora liberar. */
export function pedir() {
  let c = pendente(); if (c) return c;
  const a = new Uint32Array(6); crypto.getRandomValues(a); const ABCD = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c = [...a].map((x) => ABCD[x % ABCD.length]).join('');
  try { localStorage.setItem(PEND, c); } catch { window.__alunoCodigoPend = c; } return c;
}
/** A professora já cadastrou o código pedido? Se sim, libera e guarda por 1 ano. true/false; lança erro sem internet. */
export async function conferirPedido() {
  const c = pendente(); if (!c) return false;
  const ok = await verificar(c);
  if (ok) { remember(c); try { localStorage.removeItem(PEND); } catch { window.__alunoCodigoPend = ''; } }
  return ok;
}

/* ---------- Bea: gerenciar os códigos (precisa estar logada) ---------- */
async function head(extra = {}) { const auth = await import('./auth.js'); const t = await auth.accessToken(); if (!t) throw new Error('entre no app'); return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra }; }
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const gerar = () => { const a = new Uint32Array(6); crypto.getRandomValues(a); return [...a].map((x) => ABC[x % ABC.length]).join(''); };
export async function listar() {
  let r = await fetch(`${base}/alunos_codigos?select=code,nome,ativo,usos,criado_em,ultimo_uso,expira_em,tipo,max_aparelhos&order=criado_em.desc`, { headers: await head() });
  if (r.status === 400) r = await fetch(`${base}/alunos_codigos?select=code,nome,ativo,usos,criado_em,ultimo_uso,expira_em&order=criado_em.desc`, { headers: await head() }); // SQL 013 ainda não aplicado
  if (!r.ok) throw new Error(String(r.status)); return r.json();
}
/** Quantos aparelhos cada código de passe já usou: { CODIGO: n }. Vazio se o SQL 013 ainda não foi aplicado. */
export async function aparelhos() {
  const r = await fetch(`${base}/codigos_aparelhos?select=code`, { headers: await head() }); if (!r.ok) return {};
  const o = {}; for (const x of await r.json()) o[x.code] = (o[x.code] || 0) + 1; return o;
}
/** Libera as vagas de aparelho de um código (o aluno trocou de celular). */
export async function liberarAparelhos(code) {
  const r = await fetch(`${base}/codigos_aparelhos?code=eq.${encodeURIComponent(code)}`, { method: 'DELETE', headers: await head({ Prefer: 'return=minimal' }) });
  if (!r.ok) throw new Error(String(r.status));
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

/** Importa uma lista [{ code, nome }] (cria ou atualiza o nome; reativa o código). */
export async function importar(rows) {
  const body = rows.map((x) => ({ code: norm(x.code), nome: String(x.nome || '').slice(0, 60), ativo: true }));
  const r = await fetch(`${base}/alunos_codigos?on_conflict=code`, { method: 'POST', headers: await head({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status));
}
/** Entende o que a Bea colou. Linha com 2+ partes (separadas por tab, ; , | ou " - "): a última é o código se for válida.
 *  Linha só com nome (ou sem código válido): vira nome e o código é gerado. Cabeçalho "nome, código" é ignorado. */
export function entender(texto, jaExistem = new Set(), nomes = new Map()) {
  const out = []; const usados = new Set(jaExistem); const bad = [];
  const novo = () => { let c; do c = gerar(); while (usados.has(c)); usados.add(c); return c; };
  for (const raw of String(texto || '').split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const parts = line.split(/\t|;|\||,| - /).map((x) => x.trim()).filter(Boolean); if (!parts.length) continue;
    if (parts.length >= 2 && /^c[oó]digo$/i.test(parts[parts.length - 1])) continue; // cabeçalho
    const last = norm(parts[parts.length - 1]);
    if (parts.length >= 2 && /^[A-Z0-9]{4,12}$/.test(last) && last === parts[parts.length - 1].toUpperCase().replace(/[^A-Z0-9]/g, '')) {
      const nome = parts.slice(0, -1).join(' '); const antigo = nomes.get(last);
      if (antigo && antigo.trim().toLowerCase() !== nome.trim().toLowerCase()) out.push({ code: novo(), nome, dado: false, trocou: { de: antigo, codigoAntigo: last } }); // nome diferente = pessoa diferente: código novo (o antigo não é mexido)
      else { out.push({ code: last, nome, dado: true }); usados.add(last); }
    }
    else if (line.length <= 60) out.push({ code: novo(), nome: parts.join(' '), dado: false });
    else bad.push(line.slice(0, 40));
  }
  return { rows: out, bad };
}
