// STOP musical "ao mesmo tempo" (2 a 4 celulares): regras PURAS do estado da sala. A tela fica em stop-simultaneo.js.
// Cada celular só escreve no SEU lugar (ready[me], res[me], pausa[me]); o STOP é o único campo disputado: o primeiro que chega na sala vale (versão otimista de sala_enviar).
// A pontuação reaproveita stop-logic.js (respostas iguais valem 5, pendente, decisão da revisão): aqui só se monta uma "rodada virtual" com as respostas dos dois.
import * as S from './stop-logic.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const grade = (np, nc, v) => Array.from({ length: np }, () => Array(nc).fill(v));
export const revVazio = (nc, n = 2) => ({ over: grade(n, nc, null), canon: grade(n, nc, null), equiv: Array(nc).fill(false), log: [] });
/** Quantos jogadores tem a sala (2 a 4; sem `n` no estado = 2, como era antes). */
export const jogadoresDe = (e) => (e && Number.isInteger(e.n) && e.n >= 2 && e.n <= 4 ? e.n : 2);
export const SEM_RESPOSTA_MS = 25000; // depois disso o placar pode sair sem as respostas do outro (app fechado)

/** Estado novo da sala: categorias, tempo e a letra da rodada 1 (a mesma nos dois celulares). */
export function novoEstado({ cats, seconds = 60, usadas = [], rnd = Math.random, n: nj = 2, nomes = null } = {}) {
  const n = Math.max(2, Math.min(4, nj | 0 || 2));
  if (!S.catsOk(cats)) throw new Error('escolha de 5 a 8 categorias');
  if (!(Number.isInteger(seconds) && seconds >= 10 && seconds <= 600)) throw new Error('tempo inválido');
  const el = S.lettersFor(cats); if (!el.length) throw new Error('sem-letra');
  const { letters, cycle } = S.drawLetters(1, usadas, rnd, el);
  return { sim: true, sv: 1, cats: cats.slice(), seconds, letter: letters[0], usadas: cycle, round: 1, ready: Array(n).fill(false), stop: null, res: Array(n).fill(null), rev: revVazio(cats.length, n), pausa: Array(n).fill(false), wins: Array(n).fill(0), empates: 0, ...(n > 2 ? { n } : {}), ...(nomes ? { nomes: nomes.slice(0, n).map((x) => String(x || '').slice(0, 20)) } : {}) };
}
/** Confere o formato do que veio da sala (nunca confie no que chega pela rede). */
export function estadoValido(e) {
  try {
    return !!e && e.sim === true && S.catsOk(e.cats) && S.LETTERS.includes(e.letter) && Number.isInteger(e.seconds) && e.seconds >= 10 && e.seconds <= 600 && Number.isInteger(e.round) && e.round >= 1
      && Array.isArray(e.ready) && e.ready.length === jogadoresDe(e) && Array.isArray(e.res) && e.res.length === jogadoresDe(e) && Array.isArray(e.wins) && e.wins.length === jogadoresDe(e)
      && !!e.rev && e.rev.over.length === jogadoresDe(e) && e.rev.equiv.length === e.cats.length
      && e.res.every((r) => r === null || (Array.isArray(r.answers) && r.answers.length === e.cats.length));
  } catch { return false; }
}

/* ---------- escritas (cada uma muda só o seu lugar; devolvem false quando não há nada a gravar) ---------- */
export function pronto(e, me) { if (e.ready[me]) return false; e.ready[me] = true; return true; }
export const limparTexto = (v, nc) => Array.from({ length: nc }, (_, i) => String((v && v[i]) || '').slice(0, 80));
/**
 * Fim da rodada de um celular. `como`: 'stop' (apertou STOP), 'tempo' (acabou o tempo aqui) ou 'forcado' (o outro apertou STOP primeiro).
 * Só quem chega PRIMEIRO grava `stop` (se já tem, o dele vale e este celular só manda as respostas). Nunca sobrescreve respostas já gravadas.
 */
export function finalizar(e, me, answers, usado, como) {
  let mudou = false;
  if (como === 'stop' && !e.stop) { e.stop = { por: me, round: e.round }; mudou = true; }
  if (!e.res[me]) {
    const por = e.stop && e.stop.round === e.round ? e.stop.por : null;
    e.res[me] = { answers: limparTexto(answers, e.cats.length), usado: Math.max(0, Math.min(e.seconds, Math.round(usado || 0))), motivo: como === 'tempo' ? 'tempo' : por === me ? 'stop' : por === null ? 'tempo' : 'stop-outro' };
    mudou = true;
  }
  return mudou;
}
export const stopDoOutro = (e, me) => !!(e.stop && e.stop.round === e.round && e.stop.por !== me);
export const quemParou = (e) => (e.stop && e.stop.round === e.round ? e.stop.por : null);
export const todosProntos = (e) => e.ready.every(Boolean);
export const faltam = (e) => e.res.map((r, i) => (r ? -1 : i)).filter((i) => i >= 0);
export function pausar(e, me, on) { if (!!e.pausa[me] === !!on) return false; e.pausa[me] = !!on; return true; }

/* ---------- pontuação (reaproveita stop-logic) ---------- */
/** Rodada virtual de 2 jogadores (0 = quem criou, 1 = quem entrou) já no ponto da revisão. Resposta que faltou conta como vazia. */
export function rodadaG(e) {
  const nc = e.cats.length; const vazia = Array(nc).fill(''); const n = jogadoresDe(e); const idx = Array.from({ length: n }, (_, i) => i);
  return { v: 2, mode: 'dupla', cats: e.cats.slice(), seconds: e.seconds, rounds: 1, players: idx.map((i) => (e.nomes && e.nomes[i]) || `jogador ${i + 1}`), letters: [e.letter], cycle: [], round: 0, totals: Array(n).fill(0), history: [], stage: 'review', turn: 0,
    cur: { answers: idx.map((p) => limparTexto(e.res[p] ? e.res[p].answers : vazia, nc)), used: idx.map((p) => (e.res[p] ? e.res[p].usado : 0)), over: clone(e.rev.over), canon: clone(e.rev.canon), equiv: e.rev.equiv.slice(), log: clone(e.rev.log), stoppedBy: quemParou(e) } };
}
/** { g, sc, completo, vencedor (índice de quem ganhou | -1 empate no topo | null se falta alguém), pend } */
export function resultado(e, { semOutro = false } = {}) {
  const g = rodadaG(e); const sc = S.scoreRound(g); const completo = e.res.every(Boolean);
  const pronto2 = completo || semOutro; const top = Math.max(...sc.sums); const lideres = sc.sums.map((x, i) => (x === top ? i : -1)).filter((i) => i >= 0);
  return { g, sc, completo, vencedor: pronto2 ? (lideres.length > 1 ? -1 : lideres[0]) : null, pend: sc.pending.reduce((t, x) => t + x, 0) };
}
/** Decisão da revisão (quem criou a sala): vale pros dois celulares. */
export function decidir(e, p, c, d, opts = {}) {
  const g = S.decide(rodadaG(e), p, c, d, opts); e.rev.over = g.cur.over; e.rev.canon = g.cur.canon; e.rev.log = g.cur.log; return true;
}
export function equivalente(e, c, on) { if (!!e.rev.equiv[c] === !!on) return false; e.rev.equiv[c] = !!on; return true; }

/** Revanche: nova letra, tudo zerado, placar de vitórias acumulado. Quem pediu já fica pronto. Só vale pra rodada atual (quem chega depois não repete). */
export function proximaRodada(e, me, rnd = Math.random) {
  const r = resultado(e); const el = S.lettersFor(e.cats);
  if (r.completo && r.vencedor >= 0) e.wins[r.vencedor]++; else if (r.completo) e.empates = (e.empates || 0) + 1;
  const { letters, cycle } = S.drawLetters(1, e.usadas || [], rnd, el);
  e.letter = letters[0]; e.usadas = cycle; const n = jogadoresDe(e); e.round++; e.ready = Array(n).fill(false); e.ready[me] = true; e.res = Array(n).fill(null); e.stop = null; e.rev = revVazio(e.cats.length, n); e.pausa = Array(n).fill(false);
  return true;
}

/* ---------- guarda local (privado de cada celular: respostas digitadas e tempo) ---------- */
export const chaveLocal = (code, round) => `stop-sim-${String(code).toUpperCase()}-${round}`;
/** Quanto falta (ms) a partir do que foi guardado: em pausa vale o que sobrou; correndo vale o fim marcado. */
export const restanteMs = (sv, agora = Date.now()) => (!sv ? null : typeof sv.pausadoRest === 'number' ? Math.max(0, sv.pausadoRest) : typeof sv.deadline === 'number' ? Math.max(0, sv.deadline - agora) : null);
