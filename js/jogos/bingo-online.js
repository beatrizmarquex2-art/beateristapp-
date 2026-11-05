// Bingo Musical online (2 jogadores). Fala com o Supabase só por funções RPC (supabase/009_bingo_salas.sql), chave anon, sem login.
// O servidor decide tudo (sorteio, vitória, empate); este módulo só envia pedidos e entrega o estado para a tela.
import { CONFIG } from '../config.js';

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0 O 1 I L
const CHAVE = 'beaterista-bingo-sala';

/** Erro amigável. `.codigo`: 'rede' | 'sala' | 'cheia' | 'encerrada' | 'token' | 'dados' | 'nome' | 'anfitriao' | 'jogadores' | 'estado' | 'item' | 'servidor' */
export class ErroSala extends Error {
  constructor(codigo, mensagem) { super(mensagem); this.name = 'ErroSala'; this.codigo = codigo; }
}

const MAPA = [
  [/n[ãa]o encontrada/i, 'sala', 'Não achei essa sala. Confira o código com quem criou.'],
  [/cheia/i, 'cheia', 'Essa sala já tem dois jogadores.'],
  [/encerrada/i, 'encerrada', 'Essa partida já acabou.'],
  [/token/i, 'token', 'Você saiu dessa sala ou ela não existe mais.'],
  [/nome inv/i, 'nome', 'Escolha um nome de 1 a 20 letras.'],
  [/anfitri/i, 'anfitriao', 'Só quem criou a sala pode fazer isso.'],
  [/2 jogadores/i, 'jogadores', 'Espere o outro jogador entrar para começar.'],
  [/j[áa] come[çc]ou|ainda n[ãa]o come[çc]ou/i, 'estado', 'O jogo não está nesse momento. Atualize a tela.'],
  [/ainda n[ãa]o saiu/i, 'item', 'Esse item ainda não foi sorteado.'],
  [/cheio|n[ãa]o consegui/i, 'servidor', 'O serviço está cheio agora. Tente de novo daqui a pouco.'],
  [/inv[áa]lid/i, 'dados', 'Algo nas opções não está certo. Confira e tente de novo.'],
];

function traduzir(status, corpo) {
  const msg = (corpo && (corpo.message || corpo.hint || corpo.error)) || '';
  for (const [re, codigo, texto] of MAPA) if (re.test(msg)) return new ErroSala(codigo, texto);
  if (status === 404) return new ErroSala('rede', 'O serviço do jogo online não está disponível.');
  return new ErroSala('rede', 'Sem internet ou o serviço não respondeu. Tente de novo.');
}

const head = () => ({ apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' });

async function rpc(fn, body) {
  let r;
  try { r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: head(), body: JSON.stringify(body) }); }
  catch { throw new ErroSala('rede', 'Sem internet. Confira a conexão e tente de novo.'); }
  if (!r.ok) {
    let corpo = null; try { corpo = await r.json(); } catch { /* sem corpo */ }
    throw traduzir(r.status, corpo);
  }
  if (r.status === 204) return null;
  try { return await r.json(); } catch { return null; }
}

/** Maiúsculas e só os caracteres do alfabeto de códigos (máx. 6). */
export function normalizarCodigo(c) {
  return String(c ?? '').toUpperCase().split('').filter((ch) => ALFABETO.includes(ch)).join('').slice(0, 6);
}

const nomeOk = (n) => { const t = String(n ?? '').trim(); if (!t || t.length > 20) throw new ErroSala('nome', 'Escolha um nome de 1 a 20 letras.'); return t; };

export async function salaCriar({ nome, tema, perfil, vitoria, modo, intervalo, autoMarcar }) {
  const rows = await rpc('bingo_criar', {
    p_nome: nomeOk(nome), p_tema: tema, p_perfil: perfil, p_vitoria: vitoria, p_modo: modo,
    p_intervalo: Math.round(Number(intervalo) || 10), p_auto_marcar: !!autoMarcar,
  });
  const r = Array.isArray(rows) ? rows[0] : rows;
  if (!r || !r.code || !r.token) throw new ErroSala('rede', 'O serviço não respondeu direito. Tente de novo.');
  return { code: r.code, token: r.token, slot: r.slot };
}

export async function salaEntrar({ code, nome }) {
  const c = normalizarCodigo(code);
  if (c.length !== 6) throw new ErroSala('sala', 'O código tem 6 letras ou números.');
  const rows = await rpc('bingo_entrar', { p_code: c, p_nome: nomeOk(nome) });
  const r = Array.isArray(rows) ? rows[0] : rows;
  if (!r || !r.token) throw new ErroSala('rede', 'O serviço não respondeu direito. Tente de novo.');
  return { code: c, token: r.token, slot: r.slot };
}

// ---------- sessão (para reconectar depois de recarregar) ----------
export function salvarSessao(s) {
  try { localStorage.setItem(CHAVE, JSON.stringify({ code: s.code, token: s.token, slot: s.slot })); } catch { /* sem storage */ }
}
export function lerSessao() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    return s && typeof s.code === 'string' && typeof s.token === 'string' ? { code: s.code, token: s.token, slot: s.slot } : null;
  } catch { return null; }
}
export function limparSessao() { try { localStorage.removeItem(CHAVE); } catch { /* sem storage */ } }

// ---------- link de convite ----------
export function linkConvite(code) {
  const base = String(globalThis.location?.href || '').split('#')[0].split('?')[0];
  return `${base}#/jogos/bingo?sala=${normalizarCodigo(code)}`;
}
export function codigoDoLink(url) {
  const m = /[?&]sala=([^&#\s]+)/i.exec(String(url ?? ''));
  const c = m ? normalizarCodigo(decodeURIComponent(m[1])) : '';
  return c.length === 6 ? c : '';
}

// ---------- conexão ----------
/** Sondagem + ações. onEstado(estado) quando muda; onLink(true|false) quando a conexão cai/volta; onErro(ErroSala) se a sala sumiu (token inválido). */
export function conectar({ code, token, onEstado, onLink, onErro, intervaloMs = 1200 }) {
  const c = normalizarCodigo(code);
  let ver = null; let atual = null; let fechado = false; let ocupado = false; let ok = true; let timer = 0; let cadeia = Promise.resolve();

  const link = (v) => { if (v !== ok) { ok = v; if (onLink) onLink(v); } };
  const aplicar = (e) => { if (e && !fechado) { ver = e.ver; atual = e; if (onEstado) onEstado(e); } };
  const fatal = (e) => { if (e instanceof ErroSala && (e.codigo === 'token' || e.codigo === 'sala')) { fechar(); if (onErro) onErro(e); return true; } return false; };

  async function puxar() {
    if (fechado || ocupado) return;
    ocupado = true;
    try {
      const e = await rpc('bingo_estado', { p_code: c, p_token: token, p_ver: ver });
      link(true);
      if (e) aplicar(e);
    } catch (e) { if (!fatal(e)) link(false); } finally { ocupado = false; }
  }
  const sondar = () => { if (!document.hidden) puxar(); };
  const aoVoltar = () => { if (!document.hidden) puxar(); };
  function fechar() { fechado = true; clearInterval(timer); document.removeEventListener('visibilitychange', aoVoltar); }
  timer = setInterval(sondar, intervaloMs);
  document.addEventListener('visibilitychange', aoVoltar);
  puxar();

  // escritas em fila (uma por vez); depois pedem o estado na hora
  function escrever(fn, corpo, devolveEstado) {
    const p = cadeia.then(async () => {
      if (fechado) throw new ErroSala('token', 'Você saiu dessa sala.');
      try {
        const r = await rpc(fn, { p_code: c, p_token: token, ...corpo });
        link(true);
        if (devolveEstado && r) aplicar(r);
        else if (!fechado) { ocupado = false; await puxar(); }
        return r;
      } catch (e) { if (!fatal(e) && e instanceof ErroSala && e.codigo === 'rede') link(false); throw e; }
    });
    cadeia = p.catch(() => {});
    return p;
  }

  return {
    get estado() { return atual; },
    sortear: (auto = false) => escrever('bingo_sortear', { p_idx: atual ? atual.idx : 0, p_auto: !!auto }, true),
    marcar: (cel, valor) => escrever('bingo_marcar', { p_cel: cel, p_valor: !!valor }, false),
    pausar: (pausa) => escrever('bingo_pausar', { p_pausa: !!pausa }, false),
    bingo: () => escrever('bingo_bingo', {}, true),
    iniciar: () => escrever('bingo_iniciar', {}, false),
    async sair() { try { await escrever('bingo_sair', {}, false); } finally { fechar(); limparSessao(); } },
    fechar,
  };
}
