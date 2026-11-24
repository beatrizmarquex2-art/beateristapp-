// Código do aluno. O aluno digita uma vez; o código fica no aparelho dele e é conferido toda vez que abre (a Bea pode desativar).
// Sem código: todos os jogos de ritmo (Beat Hero, Piano Hero, músicas prontas e Músicas MIDI) ficam trancados.
import { CONFIG } from './config.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const anon = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
const KEY = 'beaterista-aluno-codigo';
const OK_KEY = 'beaterista-aluno-codigo-ok'; // última vez que o código foi confirmado (vale offline)
const OFFLINE_DAYS = 365; // passe pago
const TURMA_OFFLINE_DAYS = 1; // matrícula gratuita: revalidar em até 24h
const TIPO_KEY = 'beaterista-aluno-tipo';

export const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
/** O código escondido pra mostrar na tela (pedido da Bea, 15/nov/2026: o código não fica inteiro à vista, nem num print): só o 1º e o último caractere. Desde 19/nov/2026 o topo tem um olhinho que mostra o código inteiro por 8 segundos (escolha da Bea). */
export const mascarar = (c) => { const v = norm(c); return v.length <= 2 ? '••' : `${v[0]}${'•'.repeat(v.length - 2)}${v[v.length - 1]}`; };
export const saved = () => { try { return localStorage.getItem(KEY) || ''; } catch { return window.__alunoCodigo || ''; } };
const ESC_KEY = 'beaterista-aluno-escopo'; // telas que o passe libera (null = tudo)
function guardarEscopo(j) { try { if (Array.isArray(j) && j.length) localStorage.setItem(ESC_KEY, JSON.stringify(j)); else localStorage.removeItem(ESC_KEY); } catch { /* ok */ } }
function remember(c) { try { if (c) { localStorage.setItem(KEY, c); localStorage.setItem(OK_KEY, String(Date.now())); } else { localStorage.removeItem(KEY); localStorage.removeItem(OK_KEY); localStorage.removeItem(ESC_KEY); } } catch { window.__alunoCodigo = c || ''; } }
const recentlyOk = () => { try { const dias = localStorage.getItem(TIPO_KEY) === 'turma' ? TURMA_OFFLINE_DAYS : OFFLINE_DAYS; return Date.now() - Number(localStorage.getItem(OK_KEY) || 0) < dias * 864e5; } catch { return false; } };

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
export const msgFalha = () => (motivo === 'matricula' ? 'sua matrícula terminou. para continuar jogando por R$ 49,90 (1 ano), fale com a Beaterista. suas conquistas estão guardadas.' : motivo === 'aparelhos' ? 'esse código já está em 2 aparelhos. saia num deles (trocar aluno) ou fale com a sua professora.' : motivo === 'vencido' ? 'esse código venceu. fale com a sua professora.' : 'não achei esse código. confira com a sua professora.');
/** Confere um código no servidor (e registra este aparelho). true/false; lança erro se não deu pra falar com o servidor. */
export async function verificar(code) {
  motivo = ''; const c = norm(code); if (c.length < 4) return false;
  const r = await fetch(`${base}/rpc/aluno_acesso`, { method: 'POST', headers: anon, body: JSON.stringify({ p_code: c, p_aparelho: aparelhoProf() ? null : aparelhoId(), p_ua: String(navigator.userAgent || '').slice(0, 160) }) });
  let j = null; if (r.ok) { try { j = await r.json(); } catch { j = null; } }
  if (j && typeof j === 'object' && typeof j.ok === 'boolean') { if (j.ok) { guardarEscopo(j.jogos); try { if (j.tipo) localStorage.setItem(TIPO_KEY, j.tipo); } catch { /* ok */ } if (j.tipo === 'prof') { try { localStorage.setItem(PROF_KEY, '1'); } catch { /* ok */ } } return true; } motivo = j.motivo || 'codigo'; return false; }
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
  try { const ok = await verificar(c); if (!ok && motivo !== 'matricula') remember(''); else if (ok) remember(c); return ok; } catch { return recentlyOk(); }
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
/** Cursos ofertados pela escola — usados exclusivamente no cadastro de matrículas. */
export const CURSOS_ESCOLA = ['Bateria', 'Violão', 'Guitarra e Baixo', 'Musicalização', 'Teclado'];
/** Cria um código individual de matrícula, ativo enquanto o aluno estudar; não converte ou substitui códigos existentes. */
export async function cadastrarMatriculado({ nome, curso, ativo = true, code = '' }) {
  const aluno = String(nome || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (aluno.length < 2) throw new Error('informe o nome do aluno');
  if (!CURSOS_ESCOLA.includes(curso)) throw new Error('selecione um curso válido');
  const importado = String(code || '').trim();
  const codigoImportado = norm(importado);
  if (importado && (codigoImportado.length < 4 || codigoImportado.length > 12 || codigoImportado !== importado.toUpperCase())) throw new Error('código inválido: use 4 a 12 letras ou números');
  for (let tentativa = 0; tentativa < (importado ? 1 : 8); tentativa++) {
    const codigo = importado ? codigoImportado : gerar();
    const body = { code: codigo, nome: aluno, curso, ativo: !!ativo, tipo: 'turma', categoria: 'aluno', max_aparelhos: 2, expira_em: null, iniciado_em: null };
    const r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify(body) });
    if (r.ok) return codigo;
    if (r.status === 409) { if (importado) throw new Error('esse código já está cadastrado: nenhum acesso foi alterado'); continue; }
    throw new Error(`não foi possível cadastrar (${r.status})`);
  }
  throw new Error('não foi possível gerar um código livre');
}

export async function listar() {
  const q = (cols) => fetch(`${base}/alunos_codigos?select=${cols}&order=criado_em.desc`, { headers: head0 });
  const head0 = await head();
  // `select=*` traz as colunas que existirem: se o servidor ainda não tem `jogos` ou `categoria`, a lista aparece do mesmo jeito (antes a lista ficava vazia)
  let r = await q('*');
  if (r.status === 400) r = await q('code,nome,ativo,usos,criado_em,ultimo_uso,expira_em,tipo');
  if (!r.ok) throw new Error(String(r.status)); return r.json();
}
/** Categorias e tempos de acesso da aba Códigos. */
export const CATEGORIAS = [['aluno', 'Alunos'], ['amigo', 'Amigos'], ['marca', 'Marcas'], ['outro', 'Outros']];
export const TEMPOS = [[1, '1 dia'], [3, '3 dias'], [7, '7 dias'], [30, '1 mês'], [90, '3 meses'], [180, '6 meses'], [365, '1 ano']];
export const nomeTempo = (d) => (TEMPOS.find((t) => t[0] === d) || [d, `${d} dia${d === 1 ? '' : 's'}`])[1];
/** Cria um código (passe do site todo): a contagem do tempo começa no 1º uso, vale em até 2 aparelhos. `ativo` false = nasce desativado (a Bea ativa depois). */
export async function criarCodigo({ code, categoria = 'aluno', dias = 365, nome = '', ativo = true, jogos = null }) {
  const c = norm(code) || gerar();
  const body = { code: c, nome: String(nome).slice(0, 60), tipo: 'passe', dias, max_aparelhos: 2, ativo, categoria }; if (jogos && jogos.length) body.jogos = jogos; // sem abas escolhidas = o site todo: não manda a coluna
  let r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify(body) });
  if (r.status === 400) { delete body.categoria; r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify(body) }); }
  if (r.status === 409) throw new Error('409');
  if (!r.ok) throw new Error(String(r.status)); return c;
}
/** Muda o tempo de acesso de um código: se já começou a contar, vence daqui a `dias` a partir de hoje; se ainda não foi usado, só troca os dias. */
export const mudarTempo = (x, dias) => alterar(x.code, x.expira_em || x.iniciado_em ? { dias, expira_em: new Date(Date.now() + dias * 864e5).toISOString() } : { dias });
export async function criar(nome) {
  const code = gerar(); const r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify({ code, nome: String(nome || '').slice(0, 60) }) });
  if (!r.ok) throw new Error(String(r.status)); return code;
}
/** Encerra matrícula gratuita sem apagar dados vinculados ao código. */
async function encerrarMatriculaLegado(code) {
  const c = norm(code); if (!c) throw new Error('código inválido');
  const r = await fetch(`${base}/alunos_codigos?code=eq.${encodeURIComponent(c)}&tipo=eq.turma&ativo=is.true`,
    { method: 'PATCH', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify({ ativo: false }) });
  if (!r.ok) throw new Error(String(r.status));
  if (!(await r.json()).length) throw new Error('matrícula ativa não encontrada');
}
/** Após pagamento de R$ 49,90 confirmado, libera 12 meses no mesmo código. */
async function converterEmPasseAnualLegado(code) {
  const c = norm(code); if (!c) throw new Error('código inválido');
  const { daquiA12Meses } = await import('./passe-anual.js');
  const agora = new Date(), expira = daquiA12Meses(agora);
  const patch = { tipo: 'passe', ativo: true, dias: 365, iniciado_em: agora.toISOString(), expira_em: expira.toISOString(), max_aparelhos: 2 };
  const r = await fetch(`${base}/alunos_codigos?code=eq.${encodeURIComponent(c)}&tipo=eq.turma&ativo=is.false`,
    { method: 'PATCH', headers: await head({ Prefer: 'return=representation' }), body: JSON.stringify(patch) });
  if (!r.ok) throw new Error(String(r.status));
  if (!(await r.json()).length) throw new Error('matrícula encerrada não encontrada ou passe já convertido');
  return expira;
}

/* ---------- Painel de matrículas (supabase/022_matriculas_passes.sql). Tudo pelo SERVIDOR; se a 022 ainda não está no banco, o jeito antigo continua valendo ---------- */
async function rpcBea(fn, body = {}) {
  const r = await fetch(`${base}/rpc/${fn}`, { method: 'POST', headers: await head(), body: JSON.stringify(body) });
  if (r.status === 404) { const e = new Error('a nova função ainda não está no banco'); e.semBanco = true; throw e; }
  if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch { /* sem corpo */ } throw new Error(m || String(r.status)); }
  return r.json();
}
/** Encerra a matrícula: suspende SÓ o acesso gratuito (código, progresso, figurinhas e conquistas ficam). */
export async function encerrarMatricula(code, obs = '') {
  const c = norm(code); if (!c) throw new Error('código inválido');
  try { return await rpcBea('matricula_encerrar', { p_code: c, p_obs: obs || null }); } catch (e) { if (e.semBanco) return encerrarMatriculaLegado(c); throw e; }
}
/** Reativa a matrícula (acesso gratuito de volta). Um passe pago que ainda valha fica guardado. */
export async function reativarMatricula(code, obs = '') {
  const c = norm(code); if (!c) throw new Error('código inválido');
  try { return await rpcBea('matricula_reativar', { p_code: c, p_obs: obs || null }); } catch (e) { if (e.semBanco) return alterar(c, { ativo: true, expira_em: null }); throw e; }
}
/** Ex-aluno pagou R$ 49,90 (confirmado à mão): 12 meses no MESMO código. `ref` = de onde veio o pagamento (obrigatório). */
export async function converterEmPasseAnual(code, ref = '') {
  const c = norm(code); if (!c) throw new Error('código inválido');
  try { const r = await rpcBea('passe_pago_ativar', { p_code: c, p_confirmado: true, p_ref: ref, p_obs: null }); return r && r.passe_pago_ate ? new Date(r.passe_pago_ate) : null; }
  catch (e) { if (e.semBanco) return converterEmPasseAnualLegado(c); throw e; }
}
/** Aluno que a professora cadastrou à mão (passe de aluno) passa a constar como matriculado. */
export const marcarMatriculado = (code, obs = '') => rpcBea('matricula_marcar', { p_code: norm(code), p_obs: obs || null });
/** Aparelhos registrados de um código. */
export const aparelhosDoCodigo = (code) => rpcBea('codigo_aparelhos', { p_code: norm(code) });
export const liberarAparelhoDoCodigo = (code, aparelho) => rpcBea('codigo_aparelho_liberar', { p_code: norm(code), p_aparelho: aparelho });
export const limiteAparelhos = (code, max) => rpcBea('codigo_max_aparelhos', { p_code: norm(code), p_max: max });
/** Quantos aparelhos cada código tem (pra lista). Sem a 022, devolve vazio. */
export async function resumoAparelhos() { try { return await rpcBea('codigos_resumo'); } catch (e) { if (e.semBanco) return []; throw e; } }
/** Progresso de um aluno (SÓ LEITURA): nuvem, figurinhas e histórico de ações. */
export const progressoDoCodigo = (code) => rpcBea('codigo_progresso', { p_code: norm(code) });

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
export async function criarPasse({ prefixo = 'BEA', nome = '', dias = 3, jogos = null, tam = 4 } = {}) {
  const A4 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) {
    const r4 = new Uint32Array(tam); crypto.getRandomValues(r4); const code = norm(prefixo) + [...r4].map((x) => A4[x % A4.length]).join('');
    const r = await fetch(`${base}/alunos_codigos`, { method: 'POST', headers: await head({ Prefer: 'return=minimal' }), body: JSON.stringify({ code, nome: String(nome).slice(0, 60), tipo: 'passe', dias, ...(jogos && jogos.length ? { jogos } : {}), max_aparelhos: 2, ativo: true }) });
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
