import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../js/jogos/velha-logic.js';
import { QUESTIONS } from '../js/jogos/velha-data.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };

test('as 8 linhas dão vitória, para os dois marcadores', () => {
  assert.equal(V.LINES.length, 8);
  for (const line of V.LINES) for (const who of [0, 1]) { const b = Array(9).fill(null); line.forEach((i) => { b[i] = who; }); assert.deepEqual(V.winnerOf(b), { who, line }); }
  assert.equal(V.winnerOf(Array(9).fill(null)), null);
});
test('empate só com nove marcas e sem linha', () => {
  const b = [0, 1, 0, 0, 1, 1, 1, 0, 0]; assert.equal(V.winnerOf(b), null); assert.ok(V.isFull(b));
  let g = V.newMatch({ mode: 'local' }); for (const c of [0, 1, 2, 4, 3, 5, 7, 6, 8]) g = V.applyMark(g, c);
  assert.ok(g.over && g.result.winner === null && g.draws === 1);
});
test('não joga em casa ocupada nem depois do fim', () => {
  let g = V.applyMark(V.newMatch(), 4); assert.throws(() => V.applyMark(g, 4));
  for (const c of [0, 8, 1, 7]) g = V.applyMark(g, c); // 0 vence? turno: 4(a) 0(b) 8(a) 1(b) 7... a: 4,8 ; b: 0,1
  g = V.applyMark(V.newMatch(), 0); g = V.applyMark(g, 3); g = V.applyMark(g, 1); g = V.applyMark(g, 4); g = V.applyMark(g, 2);
  assert.ok(g.over); assert.throws(() => V.applyMark(g, 5)); assert.equal(g.scores[0], 1);
});
test('minimax: nunca perde, jogando contra todas as respostas possíveis (como 1º e como 2º)', () => {
  const explore = (board, turn, me) => {
    const w = V.winnerOf(board); if (w) { assert.notEqual(w.who, 1 - me, 'minimax perdeu'); return; }
    if (V.isFull(board)) return;
    if (turn === me) { const c = V.bestMove(board, me, () => 0); assert.equal(board[c], null); const b = board.slice(); b[c] = me; explore(b, 1 - me, me); }
    else for (const c of V.emptyCells(board)) { const b = board.slice(); b[c] = turn; explore(b, me, me); }
  };
  explore(Array(9).fill(null), 0, 0); explore(Array(9).fill(null), 1, 1);
});
test('minimax completa vitória e bloqueio imediatos; fácil sempre joga em casa livre', () => {
  assert.equal(V.bestMove([1, 1, null, 0, 0, null, null, null, null], 1), 2);
  assert.equal(V.bestMove([0, 0, null, 1, null, null, null, null, null], 1), 2);
  for (let s = 1; s < 50; s++) { const b = [0, 1, null, null, 0, null, 1, null, null]; assert.equal(b[V.easyMove(b, seeded(s))], null); }
});
test('banco: 68 aprovadas (7 infantil, 45 fácil, 16 intermediário), alternativas válidas e sem piano+teclado juntos', () => {
  assert.equal(QUESTIONS.length, 68); assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 68);
  const n = (l) => QUESTIONS.filter((q) => q.level === l).length; assert.deepEqual([n('infantil'), n('facil'), n('intermediario')], [7, 45, 16]);
  for (const q of QUESTIONS) {
    const want = q.level === 'intermediario' ? 4 : 3;
    assert.equal(q.options.length, want, `${q.id} opções`); assert.equal(new Set(q.options.map((o) => o.toLowerCase())).size, want, `${q.id} repetidas`);
    assert.equal(q.answer, 0); assert.ok(q.explain.length > 5);
  }
  const q5 = QUESTIONS.find((q) => q.num === 5); assert.ok(!q5.options.some((o) => /^(piano|teclado)$/i.test(o)));
  assert.equal(V.poolFor('infantil').length, 7); assert.equal(V.poolFor('facil').length, 52); assert.equal(V.poolFor('intermediario').length, 16);
  assert.ok(QUESTIONS.filter((x) => x.show && x.show.artist).length === 17);
});
test('perguntas não repetem; esgotadas encerram a rodada sem perder o placar', () => {
  let asked = []; const seen = new Set(); for (let i = 0; i < 7; i++) { const n = V.nextQuestion(asked, 'infantil', seeded(i + 1)); assert.ok(!seen.has(n.q.id)); seen.add(n.q.id); asked = n.asked; }
  assert.equal(V.nextQuestion(asked, 'infantil'), null);
  let g = { ...V.newMatch({ variant: 'desafio', level: 'infantil' }), asked: [...asked], scores: [2, 1] }; g = V.openQuestion(g, 0);
  assert.ok(g.over && g.result.exhausted && g.pending === null && g.scores[0] === 2);
  const r = V.nextRound(g); assert.deepEqual(r.asked, []); assert.equal(r.scores[0], 2);
});
test('intermediário usa 4 opções embaralhadas', () => {
  const g = V.openQuestion(V.newMatch({ variant: 'desafio', level: 'intermediario' }), 0, seeded(5)); assert.equal(g.pending.order.length, 4); assert.equal(V.questionById(g.pending.qid).level, 'intermediario');
});
test('desafio: acerto marca; erro deixa a casa vazia, passa a vez e mostra explicação; clique duplo bloqueado', () => {
  let g = V.newMatch({ variant: 'desafio' }); g = V.openQuestion(g, 4, seeded(1));
  assert.throws(() => V.openQuestion(g, 5)); assert.throws(() => V.applyMark(g, 5));
  const q = V.questionById(g.pending.qid); const right = g.pending.order.indexOf(q.answer); const wrong = [0, 1, 2].find((p) => p !== right);
  const e = V.answerQuestion(g, wrong); assert.equal(e.board[4], null); assert.equal(e.turn, 1); assert.equal(e.errors, 1); assert.equal(e.last.ok, false);
  const o = V.answerQuestion(g, right); assert.equal(o.board[4], 0); assert.equal(o.turn, 1);
});
test('cancelar não troca o turno e a mesma pergunta volta (sem rerrolar)', () => {
  let g = V.openQuestion(V.newMatch({ variant: 'desafio' }), 0, seeded(7)); const qid = g.pending.qid; const t = g.turn;
  g = V.cancelQuestion(g); assert.equal(g.turn, t); assert.equal(g.pending, null);
  const g2 = V.openQuestion(g, 8, seeded(123)); assert.equal(g2.pending.qid, qid);
});
test('após 12 erros oferece encerrar em empate; continuar não encerra e só pergunta de novo 12 erros depois', () => {
  let g = V.newMatch({ variant: 'desafio' });
  for (let i = 0; i < 12; i++) { g = V.openQuestion(g, 0, seeded(i + 3)); const q = V.questionById(g.pending.qid); const wrong = [0, 1, 2].find((p) => g.pending.order[p] !== q.answer); g = V.answerQuestion(g, wrong); }
  assert.ok(g.offer); assert.throws(() => V.openQuestion(g, 0));
  const c = V.resolveOffer(g, false); assert.ok(!c.offer && !c.over && c.nextOffer === 24);
  const e = V.resolveOffer(g, true); assert.ok(e.over && e.result.winner === null);
});
test('rodadas alternam quem começa; placar acumula', () => {
  let g = V.newMatch(); assert.equal(g.starter, 0); g = V.nextRound(g); assert.equal(g.starter, 1); assert.equal(g.turn, 1); g = V.nextRound(g); assert.equal(g.starter, 0); assert.equal(g.round, 3);
});
test('validMatch recusa lixo', () => { assert.ok(V.validMatch(V.newMatch())); for (const b of [null, {}, { ...V.newMatch(), board: [1] }, { ...V.newMatch(), mode: 'x' }]) assert.ok(!V.validMatch(b)); });


test('troca de lugar: 1 vez por jogador em cada rodada', () => {
  let g = V.newMatch({ variant: 'classico' });
  g = V.applyMark(g, 0); g = V.applyMark(g, 4);
  assert.ok(V.canMove(g));
  g = V.moveMark(g, 0, 8); // jogador 0 muda a marca da casa 0 para a 8
  assert.equal(g.board[0], null); assert.equal(g.board[8], 0); assert.equal(g.turn, 1); assert.equal(g.moved[0], true);
  g = V.applyMark(g, 1); // jogador 1 joga normal
  assert.equal(V.canMove(g), false); // jogador 0 já usou
  assert.throws(() => V.moveMark(g, 8, 2));
  assert.deepEqual(V.nextRound(g).moved, [false, false]);
});
