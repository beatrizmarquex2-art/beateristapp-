// Saída de jogador na sala (2 a 4 celulares): sinal de vida, aviso pra TODOS quando alguém some ou demora, e votação "continuar sem".
// O banco (supabase/021_salas_saida.sql) guarda o sinal de vida de cada lugar e decide a votação pela maioria dos que ficaram.
// Cada jogo só precisa: pôr `conn.aviso` na tela, chamar `conn.esperaDe(lugar)` (jogos por turno) e tratar `conn.on.saiu(lista)`.
import { h } from '../util.js';

const SINAL_MS = 5000;
const limiteS = () => (typeof globalThis !== 'undefined' && Number(globalThis.BT_SAIDA_S)) || 30; // 30 s sem sinal (ou sem jogar na sua vez); os testes encurtam

export function ligarSaida(conn, rpc) {
  const aviso = h('div', { class: 'jg-saiu', role: 'status', 'aria-live': 'polite', hidden: true });
  let info = { ha: {}, saiu: [], votos: {}, n: 2 }; let parado = false; const inicio = Date.now(); const soneca = {}; const euVotei = new Set();
  let falhas = 0; let vezAlvo = null; let vezDesde = Date.now(); let saiuAntes = '[]'; let t1 = 0; let t2 = 0;
  const nome = (i) => (conn.nomeDe ? conn.nomeDe(i, `jogador ${i + 1}`) : `jogador ${i + 1}`);
  const precisaDe = () => Math.floor((info.n - info.saiu.length - 1) / 2) + 1;

  function absorve(r) {
    if (!r || typeof r !== 'object') return;
    const ha = {}; Object.entries(r.ha || {}).forEach(([k, v]) => { ha[Number(k)] = Number(v); });
    if (r.ha) info.ha = ha;
    if (Array.isArray(r.saiu)) info.saiu = r.saiu.map(Number);
    if (r.votos) info.votos = Object.fromEntries(Object.entries(r.votos).map(([k, v]) => [Number(k), (v || []).map(Number)]));
    if (r.n) info.n = Number(r.n);
    const chave = JSON.stringify(info.saiu);
    if (chave !== saiuAntes) { saiuAntes = chave; if (conn.on && conn.on.saiu) conn.on.saiu(info.saiu.slice()); }
  }
  function suspeitos() {
    if (falhas > 0 && !Object.keys(info.ha).length) return []; // banco sem as funções de presença (ou sem internet): não acusa ninguém à toa
    const agora = Date.now(); const L = limiteS(); const out = [];
    for (let s = 0; s < info.n; s++) {
      if (s === conn.me || info.saiu.includes(s)) continue;
      const ha = info.ha[s];
      const semSinal = ha === undefined ? (agora - inicio) / 1000 > L + 5 : ha > L; // quem nunca deu sinal só vira suspeito depois de uma folga
      const demora = vezAlvo === s && (agora - vezDesde) / 1000 > L && !(conn.pausa && conn.pausa()); // é a vez dela e nada acontece há 30 s (pausa geral não conta)
      if (soneca[s] && soneca[s] > agora) continue;
      if (semSinal) out.push({ s, motivo: 'sinal' }); else if (demora) out.push({ s, motivo: 'vez' });
    }
    return out;
  }
  function pinta() {
    if (parado) return;
    if (info.saiu.includes(conn.me)) {
      aviso.hidden = false;
      aviso.replaceChildren(h('b', {}, 'a partida seguiu sem você 😬'), h('small', {}, 'você ficou um tempo sem responder e os outros jogadores decidiram continuar. as ★ que você ganhou ficam com você 🌟'));
      return;
    }
    const sus = suspeitos();
    if (!sus.length) { aviso.hidden = true; aviso.replaceChildren(); return; }
    aviso.hidden = false;
    aviso.replaceChildren(...sus.map(({ s, motivo }) => {
      const votos = info.votos[s] || []; const votei = votos.includes(conn.me) || euVotei.has(s);
      return h('div', { class: 'jg-saiu-l' },
        h('b', {}, motivo === 'sinal' ? `😬 ${nome(s)} parece ter saído` : `⏳ ${nome(s)} está demorando`),
        h('small', {}, `sem resposta há mais de ${limiteS()} segundos · votos pra continuar sem: ${votos.length}/${precisaDe()}`),
        h('div', { class: 'row jg-saiu-bt' },
          votei ? h('span', { class: 'muted' }, 'seu voto foi enviado, esperando os outros…') : h('button', { class: 'btn small primary', type: 'button', onclick: () => votar(s) }, `continuar sem ${nome(s)}`),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { soneca[s] = Date.now() + limiteS() * 1000; pinta(); } }, 'esperar mais')));
    }));
  }
  async function votar(s) {
    euVotei.add(s); pinta();
    try { absorve(await rpc('sala_votar', { p_code: conn.code, p_lugar: conn.me, p_alvo: s })); } catch { euVotei.delete(s); }
    pinta();
  }
  async function sinal() {
    if (parado || document.hidden || falhas >= 4) return; // banco sem as funções novas (ou sem internet por muito tempo): para de insistir
    try { absorve(await rpc('sala_presenca', { p_code: conn.code, p_lugar: info.saiu.includes(conn.me) ? -1 : conn.me })); falhas = 0; } catch { falhas++; }
    pinta();
  }
  sinal(); t1 = setInterval(sinal, SINAL_MS); t2 = setInterval(pinta, 2000);
  return {
    el: aviso,
    /** jogos por turno: de quem é a vez agora (null = ninguém). Se a vez muda, o relógio de "demorando" recomeça. */
    esperaDe(seat) { if (seat !== vezAlvo) { vezAlvo = seat; vezDesde = Date.now(); } },
    /** qualquer jogada que chega ou sai zera o relógio de "demorando" */
    progresso() { vezDesde = Date.now(); },
    saiu: () => info.saiu.slice(),
    /** quem aplica a saída no estado do jogo: o menor lugar que continua na partida (um só celular faz, os outros recebem o estado novo) */
    souSindico() { for (let s = 0; s < info.n; s++) if (!info.saiu.includes(s)) return s === conn.me; return false; },
    parar() { parado = true; clearInterval(t1); clearInterval(t2); aviso.hidden = true; },
  };
}
