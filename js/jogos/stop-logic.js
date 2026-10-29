// Stop musical: regras puras. A checagem automática vale SÓ para preenchimento e inicial; o resto é revisão manual.
export const CATEGORIES = ['nome', 'banda', 'música', 'instrumento/peça'];
export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'L', 'M', 'P', 'R', 'S', 'T', 'V'];
export const SECONDS = [60, 90, 120, 0]; // 0 = sem limite
export const ROUNDS = [3, 5, 10];
export const DECISIONS = ['valida', 'invalida', 'repetida'];
const clone = (g) => JSON.parse(JSON.stringify(g));

/** Sem acento, minúsculas, espaços únicos. */
export const normalize = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Primeiro caractere alfabético do texto informado (“The Beatles” → T; “Beatles” → B). */
export const initialOf = (s) => { const m = normalize(s).match(/[a-z]/); return m ? m[0].toUpperCase() : ''; };
export function autoCheck(text, letter) {
  if (!normalize(text)) return 'vazia';
  return initialOf(text) === letter ? 'ok' : 'inicial-errada';
}

export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const players = (mode) => (mode === 'dupla' ? 2 : 1);

export function newMatch({ mode = 'solo', seconds = 90, rounds = 3, rnd = Math.random } = {}) {
  if (!ROUNDS.includes(rounds) || !SECONDS.includes(seconds) || !['solo', 'dupla'].includes(mode)) throw new Error('configuração inválida');
  const letters = shuffle(LETTERS, rnd).slice(0, rounds);
  return { v: 1, mode, seconds, rounds, letters, round: 0, totals: Array(players(mode)).fill(0), history: [], stage: 'play', turn: 0, cur: freshRound(mode), remaining: seconds };
}
function freshRound(mode) { const n = players(mode); return { answers: Array.from({ length: n }, () => Array(4).fill('')), decisions: null, equiv: Array(4).fill(false), corrections: Array.from({ length: n }, () => Array(4).fill(null)) }; }
export const letterOf = (g) => g.letters[g.round];
/** Texto que vale na pontuação: a correção justificada, se houver; o original fica no registro. */
export const effective = (g, p, c) => { const k = g.cur.corrections[p][c]; return k ? k.text : g.cur.answers[p][c]; };

export function setAnswer(g0, p, c, text) {
  if (g0.stage !== 'play' || p !== g0.turn) throw new Error('não é a vez deste jogador'); // ninguém mexe nas respostas do outro
  const g = clone(g0); g.cur.answers[p][c] = String(text).slice(0, 80); return g;
}
/** Fim das respostas do jogador atual (stop!, tempo, ou clique em continuar). Solo → revisão; dupla → próximo ou revisão. */
export function finishTurn(g0, remaining = 0) {
  if (g0.stage !== 'play') throw new Error('fora do tempo de resposta');
  const g = clone(g0);
  if (g.mode === 'dupla' && g.turn === 0) { g.turn = 1; g.remaining = g.seconds; return g; }
  g.stage = 'review'; g.remaining = remaining;
  g.cur.decisions = g.cur.answers.map((row, p) => row.map((_, c) => (autoCheck(effective(g, p, c), letterOf(g)) === 'ok' ? 'valida' : 'invalida')));
  return g;
}
export function setDecision(g0, p, c, d) {
  if (g0.stage !== 'review' || !DECISIONS.includes(d)) throw new Error('revisão inválida');
  const g = clone(g0); g.cur.decisions[p][c] = d; return g;
}
export function setEquiv(g0, c, on) { if (g0.stage !== 'review') throw new Error('revisão inválida'); const g = clone(g0); g.cur.equiv[c] = !!on; return g; }
/** Correção só com justificativa; revalida a decisão pela inicial nova. */
export function correct(g0, p, c, text, why) {
  if (g0.stage !== 'review') throw new Error('revisão inválida'); if (!String(why || '').trim()) throw new Error('justifique a correção');
  const g = clone(g0); g.cur.corrections[p][c] = { text: String(text).slice(0, 80), why: String(why).slice(0, 160), original: g.cur.answers[p][c] };
  g.cur.decisions[p][c] = autoCheck(text, letterOf(g)) === 'ok' ? 'valida' : 'invalida'; return g;
}
/** Alerta ao revisor: marcada válida mas com inicial diferente. */
export const warnings = (g) => g.cur.decisions.flatMap((row, p) => row.map((d, c) => (d === 'valida' && autoCheck(effective(g, p, c), letterOf(g)) === 'inicial-errada' ? [p, c] : null)).filter(Boolean));

/** Pontuação da rodada. Solo: 10 por válida. Dupla: 10 exclusiva (inclui diferentes), 5 se equivalentes. */
export function scoreRound(g) {
  const n = players(g.mode); const { decisions, equiv } = g.cur; const rows = Array.from({ length: n }, () => Array(4).fill(0));
  for (let c = 0; c < 4; c++) {
    const ok = Array.from({ length: n }, (_, p) => decisions[p][c] === 'valida' && autoCheck(effective(g, p, c), letterOf(g)) !== 'vazia');
    if (n === 1) { rows[0][c] = ok[0] ? 10 : 0; continue; }
    if (ok[0] && ok[1]) { const same = equiv[c] || normalize(effective(g, 0, c)) === normalize(effective(g, 1, c)); rows[0][c] = rows[1][c] = same ? 5 : 10; } else { rows[0][c] = ok[0] ? 10 : 0; rows[1][c] = ok[1] ? 10 : 0; }
  }
  return rows;
}
/** Confirma a revisão: grava no histórico e avança (ou encerra). */
export function confirmRound(g0) {
  if (g0.stage !== 'review') throw new Error('sem revisão');
  const g = clone(g0); const rows = scoreRound(g); const sums = rows.map((r) => r.reduce((a, b) => a + b, 0));
  g.totals = g.totals.map((t, p) => t + sums[p]);
  g.history.push({ letter: letterOf(g), answers: g.cur.answers, corrections: g.cur.corrections, decisions: g.cur.decisions, equiv: g.cur.equiv, points: rows, sums, totals: g.totals.slice() });
  if (g.round + 1 >= g.rounds) { g.stage = 'done'; return g; }
  g.round++; g.stage = 'play'; g.turn = 0; g.cur = freshRound(g.mode); g.remaining = g.seconds; return g;
}
export const winner = (g) => { if (g.totals.length === 1) return null; const [a, b] = g.totals; return a === b ? 'empate' : a > b ? 0 : 1; };
export function validMatch(g) {
  try { return !!g && g.v === 1 && ['solo', 'dupla'].includes(g.mode) && g.letters.length === g.rounds && new Set(g.letters).size === g.rounds && g.letters.every((l) => LETTERS.includes(l)) && ['play', 'review', 'done'].includes(g.stage) && g.cur.answers.length === players(g.mode) && g.cur.answers.every((r) => r.length === 4) && (g.stage !== 'review' || !!g.cur.decisions); } catch { return false; }
}
