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
export function lobby({ jogo, makeState, onStart }) {
  const box = h('div', { class: 'jg-lobby' });
  let conn = null; let live = false;
  const msg = h('p', { class: 'jg-msg', 'aria-live': 'polite' });
  const err = (t) => { msg.textContent = t; };
  function home() {
    if (conn) { conn.close(); conn = null; }
    const inp = h('input', { type: 'text', class: 'jg-code-in', maxlength: 5, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO', 'aria-label': 'código da sala',
      oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }, onkeydown: (e) => { if (e.key === 'Enter') join(); } });
    const join = async () => {
      const c = inp.value.trim(); if (c.length !== 5) return err('o código tem 5 letras ou números');
      err('entrando…');
      try {
        const rows = await rpc('sala_entrar', { p_code: c, p_jogo: jogo });
        if (!rows || !rows[0]) return err('não achei essa sala. confira o código com quem criou');
        conn = connection(c, 1, rows[0].ver); live = true; onStart(conn, rows[0].estado);
      } catch { err('sem internet ou o serviço não respondeu. tente de novo'); }
    };
    box.replaceChildren(
      h('p', { class: 'jg-p' }, 'jogue em dois celulares ao mesmo tempo. um cria a sala e passa o código; o outro entra com ele.'),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: create }, 'criar sala')),
      h('p', { class: 'jg-lab' }, 'ou entre numa sala'),
      h('div', { class: 'jg-actions row' }, inp, h('button', { class: 'btn', type: 'button', onclick: join }, 'entrar')),
      msg);
    msg.textContent = '';
  }
  async function create() {
    err('criando a sala…');
    try {
      const state = makeState(); const code = await rpc('sala_criar', { p_jogo: jogo, p_estado: state });
      const c = connection(code, 0, 1, () => { if (conn === c) { live = true; onStart(c, state); } });
      conn = c;
      box.replaceChildren(
        h('p', { class: 'jg-lab' }, 'código da sala'), h('div', { class: 'jg-code', role: 'status', 'aria-label': `código ${code.split('').join(' ')}` }, code),
        h('p', { class: 'jg-p' }, 'no outro celular: abra este mesmo jogo, escolha “2 celulares” e entre com o código.'),
        h('p', { class: 'jg-p muted' }, 'esperando o outro celular entrar…'),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'cancelar')));
    } catch { err('não consegui criar a sala. confira a internet e tente de novo'); }
  }
  home();
  return { el: box, close() { if (conn && !live) { conn.close(); conn = null; } } };
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
