// STOP musical Beaterista: regras puras da partida. Banco e validação das respostas ficam em stop-valid.js.
import { LETTERS, CATS, CAT, MIN_CATS, MAX_CATS, eligibleLetters, recognize, keyOf } from './stop-valid.js';
export { LETTERS, CATS, CAT, MIN_CATS, MAX_CATS };
export const SECONDS = [30, 60, 90, 120];
export const ROUNDS = [3, 5, 10];
export const MODES = ['solo', 'dupla', 'sala'];
export const MAX_PLAYERS = 12;
export const POINTS = { unique: 10, repeated: 5 };
const clone = (g) => JSON.parse(JSON.stringify(g));
export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- categorias ---------- */
export const catsOk = (cats) => Array.isArray(cats) && new Set(cats).size === cats.length && cats.length >= MIN_CATS && cats.length <= MAX_CATS && cats.every((c) => CAT[c]);
/** Sorteio de categorias com variedade: pega de cada grupo (instrumentos, teoria, cultura) antes de repetir grupo. */
export function randomCats(n = 6, rnd = Math.random) {
  const groups = ['instrumentos', 'teoria', 'cultura'].map((g) => shuffle(CATS.filter((c) => c.grupo === g).map((c) => c.id), rnd));
  const out = []; let i = 0;
  while (out.length < n) { const g = groups[i % 3]; if (g.length) out.push(g.shift()); i++; if (groups.every((x) => !x.length)) break; }
  return out;
}
/** Letras que servem para todas as categorias escolhidas ([] = combinação impossível). */
export const lettersFor = (cats) => eligibleLetters(cats);

/* ---------- sorteio de letras ---------- */
/** Sorteia `count` letras sem repetir até todas as elegíveis saírem; depois o ciclo recomeça sozinho. `used` = letras já usadas no ciclo. */
export function drawLetters(count, used = [], rnd = Math.random, eligible = LETTERS) {
  if (!eligible.length) throw new Error('sem-letra');
  let cycle = used.filter((l) => eligible.includes(l)); if (cycle.length >= eligible.length) cycle = [];
  const out = [];
  while (out.length < count) {
    let pool = eligible.filter((l) => !cycle.includes(l) && !out.includes(l));
    if (!pool.length) { cycle = []; pool = eligible.filter((l) => !out.includes(l)); if (!pool.length) pool = eligible.slice(); }
    const l = pool[Math.floor(rnd() * pool.length)]; out.push(l); cycle.push(l);
  }
  return { letters: out, cycle: cycle.length >= eligible.length ? [] : cycle };
}

/* ---------- partida ---------- */
const nPlayers = (mode, names) => (mode === 'solo' ? 1 : names.length);
export function newMatch({ mode = 'solo', cats, seconds = 60, rounds = 3, players, used = [], rnd = Math.random } = {}) {
  if (!MODES.includes(mode)) throw new Error('modo inválido');
  if (!catsOk(cats)) throw new Error('escolha de 5 a 8 categorias');
  const custom = mode === 'sala'; // só o professor tem tempo/rodadas livres
  if (!(SECONDS.includes(seconds) || (custom && Number.isInteger(seconds) && seconds >= 10 && seconds <= 600))) throw new Error('tempo inválido');
  if (!(ROUNDS.includes(rounds) || (custom && Number.isInteger(rounds) && rounds >= 1 && rounds <= 20))) throw new Error('rodadas inválidas');
  const names = mode === 'solo' ? [String((players && players[0]) || 'você')] : (players || []).map((n, i) => String(n || `jogador ${i + 1}`).trim().slice(0, 20) || `jogador ${i + 1}`);
  if (mode === 'dupla' && names.length !== 2) throw new Error('a dupla tem 2 jogadores');
  if (mode === 'sala' && (names.length < 2 || names.length > MAX_PLAYERS)) throw new Error('sala: de 2 a 12 participantes');
  const eligible = lettersFor(cats); if (!eligible.length) throw new Error('sem-letra');
  const { letters, cycle } = drawLetters(rounds, used, rnd, eligible);
  return { v: 2, mode, cats: cats.slice(), seconds, rounds, players: names, letters, cycle, round: 0, totals: Array(nPlayers(mode, names)).fill(0), history: [], stage: 'play', turn: 0, cur: freshRound(cats.length, names.length), at: Date.now() };
}
function freshRound(nc, np) {
  const grid = (v) => Array.from({ length: np }, () => Array(nc).fill(v));
  return { answers: grid(''), used: Array(np).fill(0), over: grid(null), canon: grid(null), equiv: Array(nc).fill(false), log: [], stoppedBy: null };
}
export const letterOf = (g) => g.letters[g.round];
export const playerCount = (g) => g.players.length;

export function setAnswer(g0, p, c, text) {
  if (g0.stage !== 'play' || p !== g0.turn) throw new Error('não é a vez deste jogador'); // ninguém mexe nas respostas do outro
  const g = clone(g0); g.cur.answers[p][c] = String(text).slice(0, 80); return g;
}
/** Fim do turno do jogador atual (stop!, tempo ou "continuar"). `usedSec` = quanto tempo ele usou. */
export function finishTurn(g0, usedSec = 0, byStop = false) {
  if (g0.stage !== 'play') throw new Error('fora do tempo de resposta');
  const g = clone(g0); g.cur.used[g.turn] = Math.max(0, Math.round(usedSec)); if (byStop) g.cur.stoppedBy = g.turn;
  if (g.turn < g.players.length - 1) { g.turn++; return g; }
  g.stage = 'review'; return g;
}

/* ---------- avaliação ---------- */
/** Resultado de uma resposta já considerando decisões da revisão: { status, canon, why, name?, suggest?, manual } */
export function eff(g, p, c) {
  const auto = recognize(g.cur.answers[p][c], g.cats[c], letterOf(g));
  const o = g.cur.over[p][c];
  if (!o) return { ...auto, manual: false };
  return { ...auto, status: o, canon: o === 'valida' ? (g.cur.canon[p][c] || auto.canon) : '', why: g.cur.log.filter((x) => x.p === p && x.c === c).map((x) => x.why).pop() || 'decisão da revisão', manual: true };
}
/** Decisão da revisão: 'valida' | 'invalida' | null (volta pra automática). `canon` aceita a sugestão do jogo. */
export function decide(g0, p, c, decision, { why = '', by = 'revisão', canon = null } = {}) {
  if (g0.stage !== 'review') throw new Error('revisão inválida');
  if (![null, 'valida', 'invalida'].includes(decision)) throw new Error('decisão inválida');
  const g = clone(g0); const before = eff(g, p, c).status; g.cur.over[p][c] = decision; g.cur.canon[p][c] = decision === 'valida' ? canon : null;
  g.cur.log.push({ p, c, text: g.cur.answers[p][c], from: before, to: decision || 'automática', why: String(why).slice(0, 160), by, at: Date.now() }); return g;
}
export function setEquiv(g0, c, on) { if (g0.stage !== 'review') throw new Error('revisão inválida'); const g = clone(g0); g.cur.equiv[c] = !!on; return g; }
export const pendingCount = (g) => { let n = 0; g.cur.answers.forEach((row, p) => row.forEach((_, c) => { if (eff(g, p, c).status === 'pendente') n++; })); return n; };

/**
 * Pontos da rodada: 10 para válida e única, 5 para válida repetida por outro jogador (mesma `canon`), 0 para inválida/vazia.
 * Pendente não recebe ponto definitivo (null) até a revisão. Solo: 10 por válida.
 */
export function scoreRound(g) {
  const np = g.players.length; const nc = g.cats.length;
  const res = Array.from({ length: np }, (_, p) => Array.from({ length: nc }, (_, c) => eff(g, p, c)));
  const points = res.map((row) => row.map((r) => (r.status === 'pendente' ? null : 0)));
  for (let c = 0; c < nc; c++) {
    const ok = res.map((row, p) => (row[c].status === 'valida' ? p : -1)).filter((p) => p >= 0);
    for (const p of ok) {
      if (np === 1) { points[p][c] = POINTS.unique; continue; }
      const same = ok.filter((q) => q !== p && (g.cur.equiv[c] || (res[q][c].canon && res[q][c].canon === res[p][c].canon)));
      points[p][c] = same.length ? POINTS.repeated : POINTS.unique;
    }
  }
  const sums = points.map((row) => row.reduce((a, b) => a + (b || 0), 0));
  const pending = points.map((row) => row.filter((x) => x === null).length);
  const perfect = res.map((row, p) => row.every((r) => r.status === 'valida') && pending[p] === 0);
  return { res, points, sums, pending, perfect };
}
/** Confirma a revisão e segue. Com pendentes só passa com `allowPending` (elas valem 0 e ficam marcadas no histórico). */
export function confirmRound(g0, { allowPending = false } = {}) {
  if (g0.stage !== 'review') throw new Error('sem revisão');
  const s = scoreRound(g0); const pend = s.pending.reduce((a, b) => a + b, 0);
  if (pend && !allowPending) throw new Error('há respostas pendentes');
  const g = clone(g0); g.totals = g.totals.map((t, p) => t + s.sums[p]);
  g.history.push({ letter: letterOf(g), answers: g.cur.answers, results: s.res.map((row) => row.map((r) => ({ status: r.status, why: r.why, name: r.name || '', manual: r.manual }))), points: s.points, sums: s.sums, perfect: s.perfect, pending: s.pending, used: g.cur.used, log: g.cur.log, totals: g.totals.slice() });
  if (g.round + 1 >= g.rounds) { g.stage = 'done'; return g; }
  g.round++; g.stage = 'play'; g.turn = 0; g.cur = freshRound(g.cats.length, g.players.length); return g;
}
/** { winners: [índices], tie } — null no solo. */
export function winner(g) {
  if (g.totals.length === 1) return null;
  const max = Math.max(...g.totals); const winners = g.totals.map((t, i) => (t === max ? i : -1)).filter((i) => i >= 0);
  return { winners, tie: winners.length > 1 };
}
export function validMatch(g) {
  try {
    return !!g && g.v === 2 && MODES.includes(g.mode) && catsOk(g.cats) && g.letters.length === g.rounds && g.letters.every((l) => LETTERS.includes(l)) && ['play', 'review', 'done'].includes(g.stage)
      && g.cur.answers.length === g.players.length && g.cur.answers.every((r) => r.length === g.cats.length) && Number.isInteger(g.round) && g.round < g.rounds;
  } catch { return false; }
}
export { keyOf };
