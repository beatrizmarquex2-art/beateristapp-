// Jogo da velha: regras puras. Marcadores: 0 = baquetas, 1 = palheta. board = 9 casas (null | 0 | 1).
import { QUESTIONS, LEVELS } from './velha-data.js';
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

/** Casas que o adversário "que bloqueia" considera: fecha a própria linha se puder; senão tapa a linha do oponente; senão qualquer casa vazia. */
export function blockCells(board, me) {
  const cells = emptyCells(board);
  const closing = (who) => cells.filter((c) => { const b = board.slice(); b[c] = who; return !!winnerOf(b); });
  const win = closing(me); if (win.length) return win;
  const stop = closing(1 - me); return stop.length ? stop : cells;
}
export const blockMove = (board, me, rnd = Math.random) => { const c = blockCells(board, me); return c[Math.floor(rnd() * c.length)]; };
/** Estratégias do computador (usadas pelo Modo Aventura): aleatória, bloqueia, estratégica (minimax). */
export const AI_KINDS = ['aleatoria', 'bloqueia', 'estrategica'];
export const aiMove = (kind, board, me, rnd = Math.random) => (kind === 'estrategica' ? bestMove(board, me, rnd) : kind === 'bloqueia' ? blockMove(board, me, rnd) : easyMove(board, rnd));

export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const questionById = (id) => QUESTIONS.find((q) => q.id === id);

/** Perguntas de cada nível: infantil = só as infantis; fácil = infantis + fáceis; intermediário = só as intermediárias. */
export const LEVEL_IDS = LEVELS.map((l) => l[0]);
export const poolFor = (level) => QUESTIONS.filter((q) => (level === 'infantil' ? q.level === 'infantil' : level === 'intermediario' ? q.level === 'intermediario' : q.level !== 'intermediario'));

/** Pergunta nova sem repetir na rodada. Devolve null quando as perguntas do nível acabaram. */
export function nextQuestion(asked, level = 'facil', rnd = Math.random) {
  const pool = poolFor(level).filter((q) => !asked.includes(q.id));
  if (!pool.length) return null;
  const q = pool[Math.floor(rnd() * pool.length)];
  return { q, asked: [...asked, q.id] };
}

/* ---------- partida ---------- */
export function newMatch({ mode = 'local', variant = 'classico', level = 'facil' } = {}) {
  return { v: 1, mode, variant, level: LEVEL_IDS.includes(level) ? level : 'facil', round: 1, scores: [0, 0], draws: 0, starter: 0, errors: 0, nextOffer: ERROR_OFFER, offer: false, asked: [], ...freshBoard(0) };
}
function freshBoard(starter) { return { board: Array(9).fill(null), turn: starter, over: false, result: null, pending: null, held: null, last: null, moved: [false, false] }; }
/** Perguntas já feitas passam pra próxima rodada (não repete de rodada em rodada); só zera quando sobram poucas no nível. */
export const nextRound = (g) => { const starter = 1 - g.starter; const sobram = poolFor(g.level).filter((q) => !(g.asked || []).includes(q.id)).length; return { ...g, round: g.round + 1, starter, asked: sobram >= 5 ? g.asked || [] : [], ...freshBoard(starter) }; };
const clone = (g) => JSON.parse(JSON.stringify(g));
export const isPaulTurn = (g) => (g.mode === 'paul' || g.mode === 'facil' || g.mode === 'estrategico') && g.turn === 1; // 'paul' = às vezes fácil, às vezes difícil (sorteia a cada jogada)
/** A jogada do Paul no modo livre: 'paul' sorteia a cada jogada entre a fácil (aleatória) e a difícil (a melhor); 'estrategico' sempre a melhor; 'facil' sempre aleatória. */
export const paulMove = (mode, board, rnd = Math.random) => (mode === 'estrategico' || (mode === 'paul' && rnd() < 0.5) ? bestMove(board, 1, rnd) : easyMove(board, rnd));

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
/** Troca de lugar: 1 vez por jogador em cada rodada, pode mover UMA marca sua para uma casa vazia (sem pergunta). Conta como a jogada da vez. */
export const canMove = (g) => !!g && !g.over && !g.pending && !g.offer && !(g.moved || [])[g.turn] && g.board.includes(g.turn) && g.board.includes(null);
export function moveMark(g0, from, to) {
  if (!canMove(g0)) throw new Error('troca indisponível');
  if (!Number.isInteger(from) || !Number.isInteger(to) || g0.board[from] !== g0.turn || g0.board[to] != null) throw new Error('troca inválida');
  const g = clone(g0); g.board[from] = null; g.board[to] = g.turn; g.moved = [...(g.moved || [false, false])]; g.moved[g.turn] = true; g.last = { cell: to, from, by: g.turn, ok: true, moved: true };
  finishIfOver(g); if (!g.over) g.turn = 1 - g.turn; return g;
}
/** Desafio: tocar casa vazia abre a pergunta (a mesma, se já foi aberta e cancelada nesta jogada). */
export function openQuestion(g0, cell, rnd = Math.random) {
  if (g0.over || g0.pending || g0.offer) throw new Error('já há pergunta aberta');
  if (g0.board[cell] != null) throw new Error('casa ocupada');
  const g = clone(g0); let qid = g.held;
  if (!qid) {
    const n = nextQuestion(g.asked, g.level, rnd);
    if (!n) { g.over = true; g.result = { winner: null, line: null, exhausted: true }; return g; } // perguntas esgotadas: placar fica
    qid = n.q.id; g.asked = n.asked; g.held = qid;
  }
  const q = questionById(qid); g.pending = { cell, qid, order: shuffle(q.options.map((_, i) => i), rnd) }; return g;
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
    if (g.turn !== 0 && g.turn !== 1) return false; if (!['local', 'paul', 'facil', 'estrategico', 'online'].includes(g.mode) || !['classico', 'desafio'].includes(g.variant)) return false;
    if (g.level != null && !LEVEL_IDS.includes(g.level)) return false;
    if (g.pending && (g.board[g.pending.cell] != null || !questionById(g.pending.qid))) return false;
    return Array.isArray(g.scores) && g.scores.length === 2 && Array.isArray(g.asked) && (g.moved == null || (Array.isArray(g.moved) && g.moved.length === 2));
  } catch { return false; }
}
