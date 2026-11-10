// Jogo da memória em 2 celulares: regras puras (vez, conferir par, acerta joga de novo, fim, revanche). Sem DOM.
import test from 'node:test'; import assert from 'node:assert/strict';
import * as M from '../js/kids/memoria-online-logic.js';

const THEME = { id: 'rock', items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id })) };
const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
const fixo = (pairs = 4, extra = {}) => ({ ...M.newMatch({ theme: THEME, pairs, rnd: () => 0.5, ...extra }) });
const posicoes = (s, id) => s.deck.reduce((a, x, i) => (x === id ? [...a, i] : a), []);

test('partida nova: cada carta aparece em par, estado válido, ninguém virou nada', () => {
  const s = M.newMatch({ theme: THEME, pairs: 6 });
  assert.equal(s.deck.length, 12); assert.ok(M.validMatch(s));
  const cont = {}; s.deck.forEach((id) => { cont[id] = (cont[id] || 0) + 1; }); assert.ok(Object.values(cont).every((n) => n === 2));
  assert.equal(Object.keys(cont).length, 6); assert.deepEqual(s.up, []); assert.deepEqual(s.score, [0, 0]); assert.equal(s.turn, 0);
});
test('pares limitados às cartas do tema; sobrevive a JSON (vai pelo Supabase)', () => {
  const s = M.newMatch({ theme: { id: 'x', items: THEME.items.slice(0, 3) }, pairs: 12 });
  assert.equal(s.pairs, 3); assert.equal(s.deck.length, 6);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});
test('só vira carta na sua vez, no máximo duas, e não repete a mesma', () => {
  let s = fixo(); assert.ok(M.canFlip(s, 0, 0)); assert.ok(!M.canFlip(s, 0, 1));
  s = M.flip(s, 0, 0); assert.ok(!M.canFlip(s, 0, 0)); assert.equal(M.flip(s, 0, 0), s);
  s = M.flip(s, 1, 0); assert.equal(s.up.length, 2); assert.ok(!M.canFlip(s, 2, 0)); assert.ok(M.aguardaConferir(s));
  assert.ok(!M.canFlip(s, 99, 0) && !M.canFlip(s, -1, 0) && !M.canFlip(s, 1.5, 0));
});
test('errou: desvira, conta tentativa e passa a vez', () => {
  let s = fixo(); const a = 0; const b = s.deck.findIndex((x, i) => i !== a && x !== s.deck[a]);
  s = M.resolve(M.flip(M.flip(s, a, 0), b, 0));
  assert.deepEqual(s.up, []); assert.equal(s.turn, 1); assert.equal(s.tries, 1); assert.deepEqual(s.score, [0, 0]); assert.deepEqual(s.ok, []);
});
test('acertou: ponto, cartas ficam, e joga de novo (ou passa a vez se a opção estiver desligada)', () => {
  const s0 = fixo(); const [a, b] = posicoes(s0, s0.deck[0]);
  let s = M.resolve(M.flip(M.flip(s0, a, 0), b, 0));
  assert.deepEqual(s.score, [1, 0]); assert.deepEqual(s.ok.sort(), [a, b].sort()); assert.equal(s.turn, 0); assert.ok(!M.canFlip(s, a, 0));
  const n = fixo(4, { again: false }); const [c, d] = posicoes(n, n.deck[0]);
  s = M.resolve(M.flip(M.flip(n, c, 0), d, 0)); assert.equal(s.turn, 1); assert.deepEqual(s.score, [1, 0]);
});
test('resolver sem duas cartas viradas não muda nada', () => { const s = fixo(); assert.equal(M.resolve(s), s); assert.equal(M.resolve(M.flip(s, 0, 0)).up.length, 1); });
test('partida inteira: acaba quando acha todos, vencedor e empate', () => {
  let s = fixo(2); const ids = [...new Set(s.deck)];
  const par = (st, id, me) => { const [a, b] = posicoes(st, id); return M.resolve(M.flip(M.flip(st, a, me), b, me)); };
  s = par(s, ids[0], 0); assert.ok(!s.fin); assert.equal(M.winner(s), null);
  s = par(s, ids[1], 0); assert.ok(s.fin); assert.equal(M.winner(s), 0); assert.ok(!M.canFlip(s, 0, 0));
  let t = fixo(2); t = par(t, ids[0], 0);
  const errA = t.deck.findIndex((x) => x === ids[1]); const errB = t.deck.findLastIndex((x) => x === ids[1]);
  assert.notEqual(errA, errB);
  // jogador 1 acerta o último par: 1 x 1 vira empate se o primeiro ponto foi do outro e a vez foi trocada
  let u = fixo(2, { again: false }); u = par(u, ids[0], 0); assert.equal(u.turn, 1); u = par(u, ids[1], 1);
  assert.deepEqual(u.score, [1, 1]); assert.ok(u.fin); assert.equal(M.winner(u), -1);
});
test('revanche: cartas novas, rodada seguinte e quem começa alterna', () => {
  const s = fixo(4); const r = M.rematch(s, THEME); assert.equal(r.rev, 1); assert.equal(r.turn, 1); assert.deepEqual(r.score, [0, 0]); assert.ok(!r.fin);
  assert.equal(M.rematch(r, THEME).turn, 0); assert.notEqual(M.deckKey(s), M.deckKey(r));
});
test('estado inválido é rejeitado', () => {
  assert.ok(!M.validMatch(null)); assert.ok(!M.validMatch({ v: 2 })); assert.ok(!M.validMatch({ ...fixo(), deck: ['a', 'a', 'b'] })); assert.ok(!M.validMatch({ ...fixo(), turn: 2 }));
});
