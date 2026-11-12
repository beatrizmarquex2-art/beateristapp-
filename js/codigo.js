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
const ESC_KEY = 'beaterista-aluno-escopo'; // telas que o passe libera (null = tudo)
function guardarEscopo(j) { try { if (Array.isArray(j) && j.length) localStorage.setItem(ESC_KEY, JSON.stringify(j)); else localStorage.removeItem(ESC_KEY); } catch { /* ok */ } }
function remember(c) { try { if (c) { localStorage.setItem(KEY, c); localStorage.setItem(OK_KEY, String(Date.now())); } else { localStorage.removeItem(KEY); localStorage.removeItem(OK_KEY); localStorage.removeItem(ESC_KEY); } } catch { window.__alunoCodigo = c || ''; } }
const recentlyOk = () => { try { return Date.now() - Number(localStorage.getItem(OK_KEY) || 0) < OFFLINE_DAYS * 864e5; } catch { return false; } };

/** Id deste aparelho (aleatório, fica no navegador). O servidor conta no máximo 2 aparelhos por código de aluno. */
const AP_KEY = 'beaterista-aparelho-id';
export function aparelhoId() {
  try { let a = localStorage.getItem(AP_KEY); if (!a || a.length < 8) { const b = new Uint8Array(16); crypto.getRandomValues(b); a = [...b].map((x) => x.toString(16).padStart(2, '0')).join(''); localStorage.setItem(AP_KEY, a); } return a; } catch { return window.__aparelhoId || (window.__aparelhoId = Math.random().toString(16).slice(2) + Date.now().toString(16)); }
}
const PROF_KEY = 'beaterista-aparelho-prof'; // aparelho da professora (já entrou com código de professora): não ocupa vaga dos alunos
const aparelhoProf = () => { try { return localStorage.getItem(PROF_KEY) === '1'; } catch { return false; } };
let motivo = '';
/** Por que o último `verificar` disse não: 'codigo' (não existe/desativado), 'vencido' ou 'aparelhos' (já está em 2 aparelhos). */
export const motivoFalha = () => motivo;
/** Texto pra mostrar quando o código não entrou. */
export const msgFalha = () => (motivo === 'aparelhos' ? 'esse código já está em 2 aparelhos. saia num deles (trocar aluno) ou fale com a sua professora.' : motivo === 'vencido' ? 'esse código venceu. fale com a sua professora.' : 'não achei esse código. confira com a sua professora.');
/** Confere um código no servidor (e registra este aparelho). true/false; lança erro se não deu pra falar com o servidor. */
export async function verificar(code) {
  motivo = ''; const c = norm(code); if (c.length < 4) return false;
  const r = await fetch(`${base}/rpc/aluno_acesso`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c, p_aparelho: aparelhoProf() ? null : aparelhoId(), p_ua: String(navigator.userAgent || '').slice(0, 160) }) });
  let j = null; if (r.ok) { try { j = await r.json(); } catch { j = null; } }
  if (j && typeof j === 'object' && typeof j.ok === 'boolean') { if (j.ok) { guardarEscopo(j.jogos); if (j.tipo === 'prof') { try { localStorage.setItem(PROF_KEY, '1'); } catch { /* ok */ } } return true; } motivo = j.motivo || 'codigo'; return false; }
  if (r.ok || r.status === 404) { // servidor sem a função nova (ou resposta que não entendi): confere do jeito antigo
    const r2 = await fetch(`${base}/rpc/aluno_codigo_ok`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c }) });
    if (!r2.ok) throw new Error(String(r2.status)); const ok = (await r2.json()) === true; if (!ok) motivo = 'codigo'; return ok;
  }
  throw new Error(String(r.status));
}
/** Libera a vaga deste aparelho no servidor (saiu do código / tirou da lista). Sem esperar resposta. */
export function liberarAparelho(code) { const c = norm(code); if (c.length < 4 || aparelhoProf()) return; try { fetch(`${base}/rpc/aluno_sair`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c, p_aparelho: aparelhoId() }), keepalive: true }).catch(() => {}); } catch { /* sem rede */ } }
/** Aluno digitou um código novo: confere e guarda se valer. */
export async function entrar(code) { const c = norm(code); const ok = await verificar(c); if (ok) remember(c); return ok; }
/** Ao abrir: o código guardado ainda vale? Sem internet, vale se foi confirmado no último ano. Desativado pela Bea = tranca de novo. */
export async function revalidar() {
  const c = saved(); if (!c) return false;
  try { const ok = await verificar(c); if (!ok) remember(''); else remember(c); return ok; } catch { return recentlyOk(); }
}
export const sair = () => remember('');
/** Guarda um código já conferido (troca de aluno no mesmo aparelho). */
export const guardar = (c) => remember(norm(c));

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
  const r = await fetch(`${base}/alunos_codigos?select=code,nome,ativo,usos,criado_em,ultimo_uso,expira_em&order=criado_em.desc`, { headers: await head() });
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

/** Passe: código de um jogo/aba só (ou test drive do site todo). Código = prefixo + 4 letras/números; vale `dias` dias a partir do primeiro uso; 2 aparelhos.
 *  `jogos` = telas liberadas (prefixos de endereço, ex.: ['#/jogos/cartas']) ou null = o site todo. Devolve o código. */
export async function criarPasse({ prefixo = 'BEA', nome = '', dias = 3, jogos = null } = {}) {
  const A4 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) {
    const r4 = new Uint32Array(4); crypto.getRandomValues(r4); const code = norm(prefixo) + [...r4].map((x) => A4[x % A4.length]).join('');
    const r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify({ code, nome: String(nome).slice(0, 60), tipo: 'passe', dias, jogos: jogos && jogos.length ? jogos : null, max_aparelhos: 2, ativo: true }) });
    if (r.ok) return code; if (r.status !== 409) throw new Error(String(r.status));
  }
  throw new Error('não consegui gerar um código livre');
}
/** Passe anual (PIX/WhatsApp): cria o código do comprador, vence 12 meses depois de hoje, 2 aparelhos, o site todo. Devolve { code, expira }. */
export async function criarPasseAnual({ nome = '' } = {}) {
  const P = await import('./passe-anual.js'); const expira = P.daquiA12Meses();
  for (let i = 0; i < 6; i++) {
    const code = P.gerarCodigoPasse();
    const r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify(P.linhaPasse(nome, code, expira)) });
    if (r.ok) return { code, expira }; if (r.status !== 409) throw new Error(String(r.status));
  }
  throw new Error('não consegui gerar um código livre');
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
