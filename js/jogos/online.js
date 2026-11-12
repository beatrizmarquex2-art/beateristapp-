// Sala de 2 celulares: um cria e ganha um código, o outro entra com ele. O estado inteiro da partida vai e volta pelo Supabase
// (funções sala_criar / sala_entrar / sala_ler / sala_enviar, veja supabase/006_salas.sql). Sem login; quem tem o código joga.
import { h } from '../util.js';
import { CONFIG } from '../config.js';

const head = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
async function rpc(fn, body) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: head, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
const POLL_MS = 1200;

/* ---- lembrar a última sala de cada jogo (pra voltar se sair sem querer) e entrada automática por código ---- */
const ULT = (jogo) => `beaterista-sala-ultima-${jogo}`; const AUTO = 'beaterista-sala-auto'; const VALE_MS = 12 * 3600 * 1000;
const lerJ = (k, st = localStorage) => { try { return JSON.parse(st.getItem(k)); } catch { return null; } };
const gravaJ = (k, v, st = localStorage) => { try { v === null ? st.removeItem(k) : st.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
/** A última sala deste jogo em que este celular entrou (ou null se não tem, ou se já passou de 12 h). */
export function salaLembrada(jogo) { const u = lerJ(ULT(jogo)); if (!u || !u.code || Date.now() - (u.at || 0) > VALE_MS) return null; return u; }
export const lembrarSala = (jogo, code, me) => gravaJ(ULT(jogo), { code, me, at: Date.now() });
export const esquecerSala = (jogo) => gravaJ(ULT(jogo), null);
/** Entrada automática: o atalho "tenho um código de sala" da tela de Jogos deixa o código aqui e abre o jogo certo. */
export const definirSalaAuto = (jogo, code, voltar = false) => gravaJ(AUTO, { jogo, code: String(code).toUpperCase(), voltar: !!voltar, at: Date.now() }, sessionStorage);
/** Há uma entrada automática esperando por este jogo? (só olha, não consome) */
export function salaAutoPara(jogo) { const a = lerJ(AUTO, sessionStorage); return a && a.jogo === jogo && Date.now() - (a.at || 0) < 120000 ? a.code : null; }
const consumirSalaAuto = (jogo) => { const c = salaAutoPara(jogo); if (!c) return null; const a = lerJ(AUTO, sessionStorage); gravaJ(AUTO, null, sessionStorage); return a; };
/** Jogos de sala que o atalho da tela de Jogos sabe procurar: [id da sala, rota pra abrir]. */
export const JOGOS_SALA = [['velha', '#/jogos/velha'], ['cartas', '#/jogos/cartas'], ['stop', '#/jogos/stop'], ['cara-musical', '#/jogos/cara'], ['memoria', '#/jogos/memart'], ['letras', '#/dicas/duelo'], ['quebra', '#/jogos/quebra']];
/** Descobre de que jogo é uma sala de 5 letras (tenta cada jogo; sala_entrar só acha se o jogo bate). Devolve [id, rota] ou null. */
export async function acharJogoDaSala(code) {
  const c = String(code || '').trim().toUpperCase();
  for (const [id, rota] of JOGOS_SALA) { try { const rows = await rpc('sala_entrar', { p_code: c, p_jogo: id }); if (rows && rows[0]) return [id, rota]; } catch { /* sem internet: tenta o próximo e o chamador avisa */ } }
  return null;
}

/** Conexão com uma sala já criada/entrada. `me` = 0 (quem criou) ou 1 (quem entrou). */
function connection(code, me, ver, onPeer) {
  let stopped = false; let timer = 0; let busy = false; let peer = me === 1; let ok = true;
  const on = {}; // o jogo pendura aqui: on.state(estado) e on.link(true|false)
  const link = (v) => { if (v !== ok) { ok = v; if (on.link) on.link(v); } };
  async function poll() {
    if (stopped || busy || document.hidden) return;
    busy = true;
    try {
      const rows = await rpc('sala_ler', { p_code: code, p_ver: ver });
      link(true);
      const row = rows && rows[0];
      if (row && !stopped) {
        if (row.convidado && !peer) { peer = true; if (onPeer) onPeer(); }
        if (row.ver !== ver && row.estado) { ver = row.ver; if (on.state) on.state(row.estado); }
      }
    } catch { link(false); } finally { busy = false; }
  }
  timer = setInterval(poll, POLL_MS);
  const onVis = () => { if (!document.hidden) poll(); };
  document.addEventListener('visibilitychange', onVis);
  return {
    code, me, on,
    /** manda o estado novo. Se o outro mexeu antes, adota o dele (devolve false). */
    async push(state) {
      busy = true;
      try {
        const n = await rpc('sala_enviar', { p_code: code, p_ver: ver, p_estado: state });
        link(true);
        if (n > 0) { ver = n; return true; }
      } catch { link(false); return false; } finally { busy = false; }
      poll(); return false;
    },
    close() { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVis); },
  };
}

/** Tela de entrada da sala. `makeState()` gera a partida nova de quem cria. `onStart(conn, state)` roda nos dois celulares. */
export function lobby({ jogo, makeState, onStart: aoComecar }) {
  const box = h('div', { class: 'jg-lobby' });
  let conn = null; let live = false;
  const onStart = (c, st) => { lembrarSala(jogo, c.code, c.me); aoComecar(c, st); }; // cada jogo continua recebendo (conn, estado); aqui só guardamos a sala pra dar pra voltar
  const msg = h('p', { class: 'jg-msg', 'aria-live': 'polite' });
  const err = (t) => { msg.textContent = t; };
  let entrando = false;
  async function entrarCom(c) {
    c = String(c || '').trim().toUpperCase(); if (c.length !== 5) return err('o código tem 5 letras ou números');
    if (entrando || live) return; entrando = true; err('entrando…');
    try {
      const rows = await rpc('sala_entrar', { p_code: c, p_jogo: jogo });
      if (!rows || !rows[0]) { entrando = false; return err('não achei essa sala. confira o código com quem criou'); }
      conn = connection(c, 1, rows[0].ver); live = true; onStart(conn, rows[0].estado);
    } catch { entrando = false; err('sem internet ou o serviço não respondeu. tente de novo'); }
  }
  async function voltar(ult) {
    err('voltando pra sala…');
    try {
      const r = await reenter(ult.code, ult.me);
      if (!r) { esquecerSala(jogo); err('essa sala não existe mais. crie uma nova ou entre com outro código'); return home(); }
      conn = r.conn; live = true; onStart(conn, r.estado);
    } catch { err('sem internet agora. tente de novo'); }
  }
  function home() {
    if (conn) { conn.close(); conn = null; }
    const ult = salaLembrada(jogo);
    const inp = h('input', { type: 'text', class: 'jg-code-in jg-code-big', maxlength: 5, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'código da sala', 'aria-label': 'código da sala', inputmode: 'text',
      oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }, onkeydown: (e) => { if (e.key === 'Enter') entrarCom(inp.value); } });
    box.replaceChildren(
      ult ? h('div', { class: 'jg-volta' }, h('button', { class: 'btn primary wide', type: 'button', onclick: () => voltar(ult) }, `voltar pra sala ${ult.code}`), h('small', { class: 'muted' }, 'você saiu de uma partida? volte por aqui.')) : null,
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary wide', type: 'button', onclick: create }, 'criar sala')), // criar sala vem primeiro, lá em cima
      h('p', { class: 'jg-lab jg-lab-peq' }, 'ou entre com o código da sala'),
      h('div', { class: 'jg-actions row jg-entrar' }, inp, h('button', { class: 'btn', type: 'button', onclick: () => entrarCom(inp.value) }, 'entrar')),
      msg);
    msg.textContent = '';
  }
  async function create() {
    err('criando a sala…');
    try {
      const state = makeState(); const code = await rpc('sala_criar', { p_jogo: jogo, p_estado: state });
      const c = connection(code, 0, 1, () => { if (conn === c) { live = true; onStart(c, state); } });
      conn = c; lembrarSala(jogo, code, 0);
      box.replaceChildren(
        h('p', { class: 'jg-lab' }, 'código da sala'), h('div', { class: 'jg-code', role: 'status', 'aria-label': `código ${code.split('').join(' ')}` }, code),
        h('p', { class: 'jg-p' }, 'no outro celular: abra a tela Jogos e digite este código em “tenho um código de sala”.'),
        h('p', { class: 'jg-p muted' }, 'esperando o outro celular entrar…'),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'cancelar')));
    } catch { err('não consegui criar a sala. confira a internet e tente de novo'); }
  }
  home();
  const auto = consumirSalaAuto(jogo); if (auto) setTimeout(() => { const u = salaLembrada(jogo); if (auto.voltar && u) voltar(u); else entrarCom(auto.code); }, 0); // veio do atalho "tenho um código de sala"
  return { el: box, close() { if (conn && !live) { conn.close(); conn = null; } } };
}

/** Cria uma sala por código sem a tela de entrada (usada pela aula ao vivo). Devolve { code, conn } (quem cria é o celular 0). */
export async function criarSala(jogo, estado) { const code = await rpc('sala_criar', { p_jogo: jogo, p_estado: estado }); return { code, conn: connection(code, 0, 1, null) }; }
/** Entra numa sala por código (vários celulares podem entrar; quem só lê não escreve). Devolve { conn, estado } ou null se a sala não existe. */
export async function entrarSala(code, jogo) {
  const c = String(code || '').trim().toUpperCase(); const rows = await rpc('sala_entrar', { p_code: c, p_jogo: jogo });
  if (!rows || !rows[0]) return null; return { conn: connection(c, 1, rows[0].ver, null), estado: rows[0].estado };
}

/** Volta pra uma sala em que este celular já estava (queda de internet, app fechado). Devolve { conn, estado } ou null se a sala não existe mais. */
export async function reenter(code, me) {
  const rows = await rpc('sala_ler', { p_code: code, p_ver: 0 });
  const row = rows && rows[0]; if (!row || !row.estado) return null;
  return { conn: connection(code, me, row.ver, null), estado: row.estado };
}

/** Faixa de status da conexão ("online" / "sem conexão…") para pôr no topo do jogo. */
export function linkBadge() {
  const el = h('p', { class: 'jg-link-badge', role: 'status' }, '● 2 celulares');
  return { el, set(okay) { el.textContent = okay ? '● 2 celulares' : '○ sem conexão, tentando de novo…'; el.classList.toggle('off', !okay); } };
}
