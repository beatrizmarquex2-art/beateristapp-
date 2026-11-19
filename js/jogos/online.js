// Sala de 2 celulares: um cria e ganha um código, o outro entra com ele. O estado inteiro da partida vai e volta pelo Supabase
// (funções sala_criar / sala_entrar / sala_ler / sala_enviar, veja supabase/006_salas.sql). Sem login; quem tem o código joga.
import { h } from '../util.js';
import { CONFIG } from '../config.js';

const head = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
async function rpc(fn, body) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: head, body: JSON.stringify(body) });
  if (!r.ok) { const e = new Error(String(r.status)); try { e.corpo = await r.text(); } catch { e.corpo = ''; } throw e; }
  return r.json();
}
const POLL_MS = 1200;

/* ---- nome de quem joga (campo "adicionar nome" da tela de entrada): viaja junto com o estado da sala, em `estado.nomes = [nome do 0, nome do 1]` ---- */
const NOME_KEY = 'beaterista-nome-sala';
const limpoNome = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 14);
export const meuNomeSala = () => { try { return limpoNome(localStorage.getItem(NOME_KEY)); } catch { return ''; } };
export const guardarNomeSala = (v) => { try { localStorage.setItem(NOME_KEY, limpoNome(v)); } catch { /* sem armazenamento */ } };
const objeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const semNomes = (x) => { const { nomes, pausaSala, ...resto } = x; return JSON.stringify(resto); }; // nomes e pausa geral não são jogada

/* ---- pausa geral (vale pra todos os celulares da sala): viaja em `estado.pausaSala = { by, tipo, resp: { [quem]: resposta } }` ----
   tipo: 'ja-volto' | 'sair' | 'aguarda' (quem pausou escolhe) ou 'saiu' (deixou a sala). Quem recebe responde 'beleza' | 'tchau' | 'nao'. */
export const PAUSA_TIPOS = [['ja-volto', 'já volto rapidão'], ['sair', 'tenho que sair'], ['aguarda', 'pode aguardar um pouco?']];
export const PAUSA_RESP = [['beleza', 'beleza'], ['tchau', 'blz tchau'], ['nao', 'não consigo']];
const limpaPausa = (p) => { if (!objeto(p) || ![0, 1, 2, 3].includes(p.by)) return null; const tipo = p.tipo === 'saiu' || PAUSA_TIPOS.some((t) => t[0] === p.tipo) ? p.tipo : 'ja-volto'; const resp = {}; if (objeto(p.resp)) for (const k of ['0', '1', '2', '3']) if (PAUSA_RESP.some((r) => r[0] === p.resp[k])) resp[k] = p.resp[k]; return { by: p.by, tipo, resp }; };
let ativa = null; // a sala em que este celular está jogando agora: { conn, jogo }
/** A sala em que este celular está agora (ou null). A moldura dos jogos usa pra mostrar a pausa geral. */
export const salaAtual = () => ativa;
const avisaPausa = () => { try { document.dispatchEvent(new CustomEvent('bt-pausa-sala')); } catch { /* fora do navegador */ } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

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
export const JOGOS_SALA = [['velha', '#/jogos/velha'], ['cartas', '#/jogos/cartas'], ['un', '#/jogos/un'], ['stop', '#/jogos/stop'], ['cara-musical', '#/jogos/cara'], ['memoria', '#/jogos/memart'], ['beathero', '#/ritmo/duelo'], ['beathero-setas', '#/ritmo/setas/amigo'], ['letras', '#/dicas/duelo'], ['quebra', '#/jogos/quebra']];
/** Descobre de que jogo é uma sala de 5 letras (tenta cada jogo; sala_entrar só acha se o jogo bate). Devolve [id, rota] ou null. */
export async function acharJogoDaSala(code) {
  const c = String(code || '').trim().toUpperCase();
  for (const [id, rota] of JOGOS_SALA) { try { const rows = await rpc('sala_entrar', { p_code: c, p_jogo: id }); if (rows && rows[0]) return [id, rota]; } catch { /* sem internet: tenta o próximo e o chamador avisa */ } }
  return null;
}

/** Conexão com uma sala já criada/entrada. `me` = 0 (quem criou) ou 1 (quem entrou). */
function connection(code, me, ver, onPeer) {
  let stopped = false; let timer = 0; let busy = false; let peer = me === 1; let ok = true; let ultimo = null; let nomes = ['', '']; let pausa = null;
  const on = {}; // o jogo pendura aqui: on.state(estado), on.link(true|false) e (opcional) on.nomes() quando só os nomes mudaram
  const absorve = (st) => {
    if (!objeto(st)) return; if (Array.isArray(st.nomes)) nomes = Array.from({ length: Math.max(2, Math.min(4, st.nomes.length)) }, (_, i) => limpoNome(st.nomes[i])); // 2 a 4 nomes (salas de 3 e 4 celulares)
    const p = limpaPausa(st.pausaSala); const mudou = JSON.stringify(p) !== JSON.stringify(pausa); pausa = p; if (mudou) avisaPausa();
  };
  /** muda a pausa geral e manda pra sala; se o outro mexeu ao mesmo tempo, pega o estado dele e tenta de novo */
  async function mudaPausa(fn) {
    for (let i = 0; i < 4 && !stopped; i++) {
      if (!objeto(ultimo)) return false;
      const antes = JSON.stringify(pausa); pausa = limpaPausa(fn(pausa)); if (JSON.stringify(pausa) !== antes) avisaPausa();
      if (await api.push(ultimo)) return true;
      await espera(700); while (busy && !stopped) await espera(100);
    }
    return false;
  }
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
        if (row.ver !== ver && row.estado) {
          const soNomes = objeto(row.estado) && objeto(ultimo) && semNomes(row.estado) === semNomes(ultimo); // só o nome de alguém mudou: não mexe na partida
          ver = row.ver; absorve(row.estado); ultimo = row.estado;
          if (soNomes) { if (on.nomes) on.nomes(); } else if (on.state) on.state(row.estado);
        }
      }
    } catch { link(false); } finally { busy = false; }
  }
  timer = setInterval(poll, POLL_MS);
  const onVis = () => { if (!document.hidden) poll(); };
  document.addEventListener('visibilitychange', onVis);
  const api = {
    code, me, on,
    /** os nomes de quem está na sala ([nome do 0, nome do 1], '' = não pôs nome) e o jeito de chamar cada um */
    nomes: () => nomes.slice(),
    nomeDe: (i, padrao = 'o outro') => (i === me ? 'você' : (nomes[i] || padrao)),
    /** "vez de Ana" (ou "vez do outro" se ela não pôs nome) */
    vezDe: (i) => (nomes[i] ? `vez de ${nomes[i]}` : 'vez do outro'),
    /** guarda o estado inicial da sala (pra saber o que já tinha quando o outro mudar só o nome) */
    veja(st) { absorve(st); ultimo = st; },
    /** manda o estado novo. Se o outro mexeu antes, adota o dele (devolve false). */
    async push(state) {
      busy = true;
      try {
        if (objeto(state)) { const mine = meuNomeSala(); const n = nomes.slice(); if (mine) n[me] = mine; const { pausaSala: _velha, ...resto } = state; state = pausa ? { ...resto, nomes: n, pausaSala: pausa } : { ...resto, nomes: n }; } // o meu nome vai junto de toda jogada
        const n = await rpc('sala_enviar', { p_code: code, p_ver: ver, p_estado: state });
        link(true);
        if (n > 0) { ver = n; absorve(state); ultimo = state; return true; }
      } catch { link(false); return false; } finally { busy = false; }
      poll(); return false;
    },
    /** pausa geral: a pausa de agora (ou null), pausar pra todos, responder, voltar e deixar a sala */
    pausa: () => (pausa ? { ...pausa, resp: { ...pausa.resp } } : null),
    pausarTodos: (tipo) => mudaPausa((p) => (p && p.tipo !== 'saiu' ? p : { by: me, tipo, resp: {} })),
    responderPausa: (r) => mudaPausa((p) => (p && p.by !== me ? { ...p, resp: { ...p.resp, [me]: r } } : p)),
    retomarTodos: () => mudaPausa(() => null),
    deixarSala: () => mudaPausa(() => ({ by: me, tipo: 'saiu', resp: {} })),
    close() { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVis); if (ativa && ativa.conn === api) { ativa = null; avisaPausa(); } },
  };
  return api;
}

const QUANTOS = {}; // jogo → quantas pessoas a pessoa que cria escolheu (2, 3 ou 4)
/* Salas de 3 e 4 celulares só aparecem quando o banco já tem as funções novas (supabase/020_salas_n.sql). Sem elas o seletor 2/3/4 nem é mostrado (só sala de 2), em vez de oferecer uma opção que falha. */
let SALA_N = null;
const sondaN = () => (SALA_N !== null ? Promise.resolve(SALA_N) : rpc('sala_ler_n', { p_code: 'AAAAA', p_ver: 0 }).then(() => true).catch(() => false).then((v) => { SALA_N = v; return v; }));
/** Tela de entrada da sala. `makeState()` gera a partida nova de quem cria. `onStart(conn, state)` roda nos dois celulares. */
export function lobby({ jogo, makeState, onStart: aoComecar, n: opN = null }) {
  // opN = { makeState(num, nomes) }: o jogo também aceita 3 e 4 celulares (a pessoa que cria escolhe 2, 3 ou 4 e todos põem o nome)
  const box = h('div', { class: 'jg-lobby' });
  let conn = null; let live = false; let esperaT = 0; let quantos = QUANTOS[jogo] || 2; // lembra a escolha de 2, 3 ou 4 mesmo se o jogo desenhar a tela de novo
  const meuNome = () => meuNomeSala() || 'jogador'; // o nome vem do campo "adicionar nome" (o mesmo das salas de 2)
  const paraEspera = () => { if (esperaT) { clearInterval(esperaT); esperaT = 0; } };
  const onStart = (c, st) => { lembrarSala(jogo, c.code, c.me); ativa = { conn: c, jogo }; aoComecar(c, st); const p = c.pausa(); if (p && p.by === c.me) c.retomarTodos(); else avisaPausa(); }; // voltei pra sala: a minha pausa geral (ou o meu aviso de saída) some sozinha. // cada jogo continua recebendo (conn, estado); aqui só guardamos a sala pra dar pra voltar
  const msg = h('p', { class: 'jg-msg', 'aria-live': 'polite' });
  const err = (t) => { msg.textContent = t; };
  let entrando = false;
  async function entrarCom(c) {
    c = String(c || '').trim().toUpperCase(); if (c.length !== 5) return err('o código tem 5 letras ou números');
    if (entrando || live) return; entrando = true; err('entrando…');
    try {
      if (opN) { // sala de 3 ou 4? entra pelo lugar certo e espera todo mundo
        let sondagem = null; try { sondagem = await rpc('sala_ler_n', { p_code: c, p_ver: 0 }); } catch { /* sem a função nova: segue como sala de 2 */ }
        const lin = sondagem && sondagem[0];
        if (lin && lin.max_jogadores > 2) { await entrarN(c); return; }
      }
      const rows = await rpc('sala_entrar', { p_code: c, p_jogo: jogo });
      if (!rows || !rows[0]) { entrando = false; return err('não achei essa sala. confira o código com quem criou'); }
      conn = connection(c, 1, rows[0].ver); conn.veja(rows[0].estado); live = true;
      if (meuNomeSala()) await conn.push(rows[0].estado); // o criador já vê o meu nome (se alguém jogou antes, vai junto na próxima jogada)
      onStart(conn, rows[0].estado);
    } catch { entrando = false; err('sem internet ou o serviço não respondeu. tente de novo'); }
  }
  /** Lista de quem já entrou (e quantos faltam). */
  const listaNomes = (nomes, max, eu) => h('ul', { class: 'jg-nomes', 'aria-live': 'polite' }, ...Array.from({ length: max }, (_, i) => h('li', { class: nomes[i] ? 'ok' : 'vazio' }, nomes[i] ? `${nomes[i]}${i === eu ? ' (você)' : ''}` : 'esperando…')));
  async function entrarN(c) {
    const nome = meuNome();
    try {
      const rows = await rpc('sala_entrar_n', { p_code: c, p_jogo: jogo, p_nome: nome });
      const r = rows && rows[0]; if (!r) { entrando = false; return err('não achei essa sala. confira o código com quem criou'); }
      lembrarSala(jogo, c, r.lugar);
      const mostra = (nomes) => box.replaceChildren(h('p', { class: 'jg-lab' }, `sala ${c}`), h('p', { class: 'jg-p' }, `${nomes.length} de ${r.max_jogadores} jogadores entraram. a partida começa quando todos estiverem prontos.`), listaNomes(nomes, r.max_jogadores, r.lugar),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { paraEspera(); entrando = false; esquecerSala(jogo); home(); } }, 'sair da sala')));
      mostra(r.nomes);
      paraEspera(); let ocupado = false;
      esperaT = setInterval(async () => {
        if (ocupado || live) return; ocupado = true;
        try {
          const l = await rpc('sala_ler_n', { p_code: c, p_ver: 0 }); const row = l && l[0];
          if (!row) { paraEspera(); entrando = false; esquecerSala(jogo); err('essa sala não existe mais'); return home(); }
          if (row.estado && !row.estado.espera) { paraEspera(); live = true; conn = connection(c, r.lugar, row.ver, null); conn.veja(row.estado); onStart(conn, row.estado); return; }
          mostra(row.nomes);
        } catch { /* sem internet agora: tenta de novo */ } finally { ocupado = false; }
      }, POLL_MS);
    } catch (e) { entrando = false; err(/cheia/.test((e && e.corpo) || '') ? 'essa sala já está cheia' : 'sem internet ou o serviço não respondeu. tente de novo'); }
  }
  async function criarN() {
    const nome = meuNome(); const max = quantos; err('criando a sala…');
    try {
      const code = await rpc('sala_criar_n', { p_jogo: jogo, p_estado: { espera: true, n: max }, p_max: max, p_nome: nome });
      lembrarSala(jogo, code, 0);
      const mostra = (nomes) => box.replaceChildren(h('p', { class: 'jg-lab' }, 'código da sala'), h('div', { class: 'jg-code', role: 'status', 'aria-label': `código ${code.split('').join(' ')}` }, code),
        h('p', { class: 'jg-p' }, `mande este código pros outros ${max - 1}: cada um abre o jogo, digita o código e o nome.`), h('p', { class: 'jg-p muted' }, `${nomes.length} de ${max} entraram. começa sozinho quando todos entrarem.`), listaNomes(nomes, max, 0),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { paraEspera(); home(); } }, 'cancelar')));
      mostra([nome]);
      paraEspera(); let ocupado = false;
      esperaT = setInterval(async () => {
        if (ocupado || live) return; ocupado = true;
        try {
          const l = await rpc('sala_ler_n', { p_code: code, p_ver: 0 }); const row = l && l[0]; if (!row) return;
          if (row.nomes.length >= max) { // todos entraram: quem criou monta a partida com os nomes e manda
            const estado = opN.makeState(max, row.nomes); const v = await rpc('sala_enviar', { p_code: code, p_ver: row.ver, p_estado: estado });
            if (v > 0) { paraEspera(); live = true; conn = connection(code, 0, v, null); conn.veja(estado); onStart(conn, estado); }
          } else mostra(row.nomes);
        } catch { /* sem internet agora: tenta de novo */ } finally { ocupado = false; }
      }, POLL_MS);
    } catch { err('não consegui criar a sala. confira a internet e tente de novo'); }
  }
  async function voltar(ult) {
    err('voltando pra sala…');
    try {
      const r = await reenter(ult.code, ult.me);
      if (!r) { esquecerSala(jogo); err('essa sala não existe mais. crie uma nova ou entre com outro código'); return home(); }
      if (r.estado && r.estado.espera) { r.conn.close(); esquecerSala(jogo); err('essa partida ainda não tinha começado. crie uma sala nova ou entre de novo com o código'); return home(); }
      conn = r.conn; live = true; onStart(conn, r.estado);
    } catch { err('sem internet agora. tente de novo'); }
  }
  const campoNome = () => h('label', { class: 'jg-nome-sala' }, h('span', {}, 'adicionar nome'),
    h('input', { type: 'text', maxlength: 14, value: meuNomeSala(), placeholder: 'seu nome (opcional)', autocomplete: 'off', autocapitalize: 'words', enterkeyhint: 'done', 'aria-label': 'Adicionar nome: o outro jogador vê o seu nome', oninput: (e) => guardarNomeSala(e.target.value) })); // o outro jogador vê esse nome no lugar de "o outro"
  function home() {
    paraEspera(); live = false; entrando = false; if (conn) { conn.close(); conn = null; }
    if (opN && SALA_N === null) sondaN().then((ok) => { if (ok && !live && !conn && !esperaT) home(); }); // descobre se o banco tem as salas de 3 e 4; se tiver, redesenha com o seletor
    const ult = salaLembrada(jogo);
    const inp = h('input', { type: 'text', class: 'jg-code-in jg-code-big', maxlength: 5, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'código da sala', 'aria-label': 'código da sala', inputmode: 'text',
      oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }, onkeydown: (e) => { if (e.key === 'Enter') entrarCom(inp.value); } });
    box.replaceChildren(
      campoNome(),
      ult ? h('div', { class: 'jg-volta' }, h('button', { class: 'btn primary wide', type: 'button', onclick: () => voltar(ult) }, `voltar pra sala ${ult.code}`), h('small', { class: 'muted' }, 'você saiu de uma partida? volte por aqui.')) : null,
      opN && SALA_N ? h('div', { class: 'jg-quantos' }, h('p', { class: 'jg-lab jg-lab-peq' }, 'quantas pessoas jogam?'),
        h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Quantas pessoas jogam' }, ...[2, 3, 4].map((q) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(q === quantos), class: `lib-tab jg-q${q === quantos ? ' on' : ''}`, 'aria-label': `${q} jogadores`, onclick: () => { quantos = q; QUANTOS[jogo] = q; home(); } }, String(q))))) : null,
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary wide', type: 'button', onclick: opN && SALA_N && quantos > 2 ? criarN : create }, 'criar sala')), // criar sala vem primeiro, lá em cima
      h('p', { class: 'jg-lab jg-lab-peq' }, 'ou entre com o código da sala'),
      h('div', { class: 'jg-actions row jg-entrar' }, inp, h('button', { class: 'btn', type: 'button', onclick: () => entrarCom(inp.value) }, 'entrar')),
      msg);
    msg.textContent = '';
  }
  async function create() {
    err('criando a sala…');
    try {
      let state = makeState(); if (objeto(state) && meuNomeSala()) state = { ...state, nomes: [meuNomeSala(), ''] };
      const code = await rpc('sala_criar', { p_jogo: jogo, p_estado: state });
      const c = connection(code, 0, 1, () => { if (conn === c) { live = true; onStart(c, state); } }); c.veja(state);
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
  return { el: box, close() { paraEspera(); if (conn && !live) { conn.close(); conn = null; } } };
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
  const conn = connection(code, me, row.ver, null); conn.veja(row.estado);
  return { conn, estado: row.estado };
}

/** Faixa de status da conexão ("online" / "sem conexão…") para pôr no topo do jogo. */
export function linkBadge(n = 2) {
  const el = h('p', { class: 'jg-link-badge', role: 'status' }, `● ${n} celulares`);
  return { el, set(okay) { el.textContent = okay ? `● ${n} celulares` : '○ sem conexão, tentando de novo…'; el.classList.toggle('off', !okay); } };
}
