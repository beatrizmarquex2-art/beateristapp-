// Jogo da velha: regras puras. Marcadores: 0 = baquetas, 1 = palheta. board = 9 casas (null | 0 | 1).
import { QUESTIONS } from './velha-data.js';
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const MARK_NAME = ['baquetas', 'palheta'];
export const ERROR_OFFER = 12;

export function winnerOf(board) {
  for (const line of LINES) { const [a, b, c] = line; if (board[a] != null && board[a] === board[b] && board[a] === board[c]) return { who: board[a], line }; }
  return null;
}
export const isFull = (board) => board.every((x) => x != null);
export const emptyCells = (board) => board.map((x, i) => (x == null ? i : -1)).filter((i) => i >= 0);

/** Minimax completo (3×3 é pequeno). Só olha o tabuleiro atual: não lê jogadas futuras. */
function score(board, me, turn, depth) {
  const w = winnerOf(board); if (w) return w.who === me ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;
  const vals = emptyCells(board).map((c) => { const b = board.slice(); b[c] = turn; return score(b, me, 1 - turn, depth + 1); });
  return turn === me ? Math.max(...vals) : Math.min(...vals);
}
export function bestMove(board, me, rnd = Math.random) {
  const cells = emptyCells(board); let best = -Infinity; let pool = [];
  for (const c of cells) { const b = board.slice(); b[c] = me; const s = score(b, me, 1 - me, 1); if (s > best) { best = s; pool = [c]; } else if (s === best) pool.push(c); }
  return pool[Math.floor(rnd() * pool.length)];
}
export const easyMove = (board, rnd = Math.random) => { const c = emptyCells(board); return c[Math.floor(rnd() * c.length)]; };

export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const questionById = (id) => QUESTIONS.find((q) => q.id === id);

/** Perguntas sem repetição até esgotar o banco; depois recomeça (sem repetir a última). */
export function nextQuestion(asked, rnd = Math.random) {
  let pool = QUESTIONS.filter((q) => !asked.includes(q.id)); let reset = false;
  if (!pool.length) { pool = QUESTIONS.filter((q) => q.id !== asked[asked.length - 1]); reset = true; }
  const q = pool[Math.floor(rnd() * pool.length)];
  return { q, asked: reset ? [q.id] : [...asked, q.id] };
}

/* ---------- partida ---------- */
export function newMatch({ mode = 'local', variant = 'classico' } = {}) {
  return { v: 1, mode, variant, round: 1, scores: [0, 0], draws: 0, starter: 0, errors: 0, nextOffer: ERROR_OFFER, offer: false, asked: [], ...freshBoard(0) };
}
function freshBoard(starter) { return { board: Array(9).fill(null), turn: starter, over: false, result: null, pending: null, held: null, last: null }; }
export const nextRound = (g) => { const starter = 1 - g.starter; return { ...g, round: g.round + 1, starter, ...freshBoard(starter) }; };
const clone = (g) => JSON.parse(JSON.stringify(g));
export const isPaulTurn = (g) => g.mode !== 'local' && g.turn === 1;

function finishIfOver(g) {
  const w = winnerOf(g.board);
  if (w) { g.over = true; g.result = { winner: w.who, line: w.line }; g.scores[w.who]++; }
  else if (isFull(g.board)) { g.over = true; g.result = { winner: null, line: null }; g.draws++; }
  return g;
}
/** Clássico: marca na hora. Também usado pelo Paul no desafio (sem perguntas). */
export function applyMark(g0, cell) {
  if (g0.over || g0.pending || g0.offer) throw new Error('jogada bloqueada');
  if (!Number.isInteger(cell) || cell < 0 || cell > 8 || g0.board[cell] != null) throw new Error('casa ocupada');
  const g = clone(g0); g.board[cell] = g.turn; g.last = { cell, by: g.turn, ok: true };
  finishIfOver(g); if (!g.over) g.turn = 1 - g.turn; return g;
}
/** Desafio: tocar casa vazia abre a pergunta (a mesma, se já foi aberta e cancelada nesta jogada). */
export function openQuestion(g0, cell, rnd = Math.random) {
  if (g0.over || g0.pending || g0.offer) throw new Error('já há pergunta aberta');
  if (g0.board[cell] != null) throw new Error('casa ocupada');
  const g = clone(g0); let qid = g.held;
  if (!qid) { const n = nextQuestion(g.asked, rnd); qid = n.q.id; g.asked = n.asked; g.held = qid; }
  const q = questionById(qid); g.pending = { cell, qid, order: shuffle([0, 1, 2], rnd) }; void q; return g;
}
export function cancelQuestion(g0) { if (!g0.pending) throw new Error('sem pergunta'); const g = clone(g0); g.pending = null; return g; }
/** pos = posição visual (0..2) escolhida; order[pos] é o índice original da opção. */
export function answerQuestion(g0, pos) {
  if (!g0.pending) throw new Error('sem pergunta');
  const g = clone(g0); const { cell, qid, order } = g.pending; const q = questionById(qid); const ok = order[pos] === q.answer;
  g.pending = null; g.held = null;
  if (ok) { g.board[cell] = g.turn; g.last = { cell, by: g.turn, ok: true, qid }; finishIfOver(g); if (!g.over) g.turn = 1 - g.turn; return g; }
  g.errors++; g.last = { cell, by: g.turn, ok: false, qid }; g.turn = 1 - g.turn;
  if (g.errors >= g.nextOffer) g.offer = true;
  return g;
}
export function resolveOffer(g0, end) {
  const g = clone(g0); g.offer = false; g.nextOffer = g.errors + ERROR_OFFER;
  if (end) { g.over = true; g.result = { winner: null, line: null, early: true }; g.draws++; }
  return g;
}
export function validMatch(g) {
  try {
    if (!g || g.v !== 1 || !Array.isArray(g.board) || g.board.length !== 9 || !g.board.every((x) => x === null || x === 0 || x === 1)) return false;
    if (g.turn !== 0 && g.turn !== 1) return false; if (!['local', 'facil', 'estrategico'].includes(g.mode) || !['classico', 'desafio'].includes(g.variant)) return false;
    if (g.pending && (g.board[g.pending.cell] != null || !questionById(g.pending.qid))) return false;
    return Array.isArray(g.scores) && g.scores.length === 2 && Array.isArray(g.asked);
  } catch { return false; }
}
