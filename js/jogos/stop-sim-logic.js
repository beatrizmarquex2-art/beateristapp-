// STOP musical "ao mesmo tempo" (2 celulares): regras PURAS do estado da sala. A tela fica em stop-simultaneo.js.
// Cada celular só escreve no SEU lugar (ready[me], res[me], pausa[me]); o STOP é o único campo disputado: o primeiro que chega na sala vale (versão otimista de sala_enviar).
// A pontuação reaproveita stop-logic.js (respostas iguais valem 5, pendente, decisão da revisão): aqui só se monta uma "rodada virtual" com as respostas dos dois.
import * as S from './stop-logic.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const grade = (np, nc, v) => Array.from({ length: np }, () => Array(nc).fill(v));
export const revVazio = (nc) => ({ over: grade(2, nc, null), canon: grade(2, nc, null), equiv: Array(nc).fill(false), log: [] });
export const SEM_RESPOSTA_MS = 25000; // depois disso o placar pode sair sem as respostas do outro (app fechado)

/** Estado novo da sala: categorias, tempo e a letra da rodada 1 (a mesma nos dois celulares). */
export function novoEstado({ cats, seconds = 60, usadas = [], rnd = Math.random } = {}) {
  if (!S.catsOk(cats)) throw new Error('escolha de 5 a 8 categorias');
  if (!(Number.isInteger(seconds) && seconds >= 10 && seconds <= 600)) throw new Error('tempo inválido');
  const el = S.lettersFor(cats); if (!el.length) throw new Error('sem-letra');
  const { letters, cycle } = S.drawLetters(1, usadas, rnd, el);
  return { sim: true, sv: 1, cats: cats.slice(), seconds, letter: letters[0], usadas: cycle, round: 1, ready: [false, false], stop: null, res: [null, null], rev: revVazio(cats.length), pausa: [false, false], wins: [0, 0], empates: 0 };
}
/** Confere o formato do que veio da sala (nunca confie no que chega pela rede). */
export function estadoValido(e) {
  try {
    return !!e && e.sim === true && S.catsOk(e.cats) && S.LETTERS.includes(e.letter) && Number.isInteger(e.seconds) && e.seconds >= 10 && e.seconds <= 600 && Number.isInteger(e.round) && e.round >= 1
      && Array.isArray(e.ready) && e.ready.length === 2 && Array.isArray(e.res) && e.res.length === 2 && Array.isArray(e.wins) && e.wins.length === 2
      && !!e.rev && e.rev.over.length === 2 && e.rev.equiv.length === e.cats.length
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
export function pausar(e, me, on) { if (!!e.pausa[me] === !!on) return false; e.pausa[me] = !!on; return true; }

/* ---------- pontuação (reaproveita stop-logic) ---------- */
/** Rodada virtual de 2 jogadores (0 = quem criou, 1 = quem entrou) já no ponto da revisão. Resposta que faltou conta como vazia. */
export function rodadaG(e) {
  const nc = e.cats.length; const vazia = Array(nc).fill('');
  return { v: 2, mode: 'dupla', cats: e.cats.slice(), seconds: e.seconds, rounds: 1, players: ['jogador 1', 'jogador 2'], letters: [e.letter], cycle: [], round: 0, totals: [0, 0], history: [], stage: 'review', turn: 0,
    cur: { answers: [0, 1].map((p) => limparTexto(e.res[p] ? e.res[p].answers : vazia, nc)), used: [0, 1].map((p) => (e.res[p] ? e.res[p].usado : 0)), over: clone(e.rev.over), canon: clone(e.rev.canon), equiv: e.rev.equiv.slice(), log: clone(e.rev.log), stoppedBy: quemParou(e) } };
}
/** { g, sc, completo, vencedor (0|1|-1 empate|null se falta alguém), pend } */
export function resultado(e, { semOutro = false } = {}) {
  const g = rodadaG(e); const sc = S.scoreRound(g); const completo = !!(e.res[0] && e.res[1]);
  const pronto2 = completo || semOutro; const [a, b] = sc.sums;
  return { g, sc, completo, vencedor: pronto2 ? (a === b ? -1 : a > b ? 0 : 1) : null, pend: sc.pending[0] + sc.pending[1] };
}
/** Decisão da revisão (quem criou a sala): vale pros dois celulares. */
export function decidir(e, p, c, d, opts = {}) {
  const g = S.decide(rodadaG(e), p, c, d, opts); e.rev.over = g.cur.over; e.rev.canon = g.cur.canon; e.rev.log = g.cur.log; return true;
}
export function equivalente(e, c, on) { if (!!e.rev.equiv[c] === !!on) return false; e.rev.equiv[c] = !!on; return true; }

/** Revanche: nova letra, tudo zerado, placar de vitórias acumulado. Quem pediu já fica pronto. Só vale pra rodada atual (quem chega depois não repete). */
export function proximaRodada(e, me, rnd = Math.random) {
  const r = resultado(e); const el = S.lettersFor(e.cats);
  if (r.completo && r.vencedor === 0) e.wins[0]++; else if (r.completo && r.vencedor === 1) e.wins[1]++; else if (r.completo) e.empates = (e.empates || 0) + 1;
  const { letters, cycle } = S.drawLetters(1, e.usadas || [], rnd, el);
  e.letter = letters[0]; e.usadas = cycle; e.round++; e.ready = [false, false]; e.ready[me] = true; e.res = [null, null]; e.stop = null; e.rev = revVazio(e.cats.length); e.pausa = [false, false];
  return true;
}

/* ---------- guarda local (privado de cada celular: respostas digitadas e tempo) ---------- */
export const chaveLocal = (code, round) => `stop-sim-${String(code).toUpperCase()}-${round}`;
/** Quanto falta (ms) a partir do que foi guardado: em pausa vale o que sobrou; correndo vale o fim marcado. */
export const restanteMs = (sv, agora = Date.now()) => (!sv ? null : typeof sv.pausadoRest === 'number' ? Math.max(0, sv.pausadoRest) : typeof sv.deadline === 'number' ? Math.max(0, sv.deadline - agora) : null);
