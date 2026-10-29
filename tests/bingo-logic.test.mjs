import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/jogos/bingo-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const drawAll = (g, n) => { for (let i = 0; i < n; i++) g = B.drawNext(g); return g; };
const markAll = (g, card, cells) => { for (const c of cells) { const r = B.toggleMark(g, card, c); assert.ok(r.ok, `casa ${c}`); g = r.g; } return g; };

test('24 itens únicos, 12 com imagem do pacote, os outros só vetor', () => {
  assert.equal(B.ITEMS.length, 24); assert.equal(new Set(B.ITEMS.map((i) => i.id)).size, 24); assert.equal(new Set(B.ITEMS.map((i) => i.name)).size, 24);
  assert.equal(B.ITEMS.filter((i) => i.img).length, 12); for (const i of B.ITEMS) assert.ok(i.desc.length > 5);
});
test('cartela: 16 itens únicos de 24, para várias sementes', () => {
  for (let s = 1; s < 100; s++) { const c = B.makeCard(seeded(s)); assert.equal(c.length, 16); assert.equal(new Set(c).size, 16); assert.ok(c.every((i) => B.ITEM[i])); }
});
test('24 sorteios sem repetição e o 25º é recusado', () => {
  let g = B.newGame({ rnd: seeded(3) }); g = drawAll(g, 24); assert.equal(new Set(B.calledIds(g)).size, 24); assert.equal(B.remaining(g), 0); assert.throws(() => B.drawNext(g));
});
test('as 10 combinações (4 linhas, 4 colunas, 2 diagonais) vencem; 3 de 4 não', () => {
  assert.equal(B.LINES.length, 10);
  for (const line of B.LINES) {
    let g = B.newGame({ rnd: seeded(5) }); g = drawAll(g, 24);
    g = markAll(g, 0, line.slice(0, 3)); assert.equal(B.winning(g, 0), null); assert.equal(B.declare(g, 0).ok, false);
    g = markAll(g, 0, line.slice(3)); assert.deepEqual(B.winning(g, 0), line); const r = B.declare(g, 0); assert.ok(r.ok && r.g.over);
  }
});
test('marcar item não sorteado é recusado; desmarcar funciona; falsa declaração não vence', () => {
  let g = B.newGame({ rnd: seeded(8) }); const r = B.toggleMark(g, 0, 0); assert.equal(r.ok, false); assert.equal(r.reason, 'nao-sorteado'); assert.equal(r.g.marks[0][0], false);
  g = drawAll(g, 24); g = markAll(g, 0, [0]); assert.equal(g.marks[0][0], true); g = B.toggleMark(g, 0, 0).g; assert.equal(g.marks[0][0], false);
  assert.equal(B.declare(g, 0).ok, false);
});
test('só vale casa marcada E sorteada (marca sem sorteio é impossível, mesmo com dados forjados)', () => {
  let g = B.newGame({ rnd: seeded(9) }); g.marks[0] = Array(16).fill(true); assert.equal(B.winning(g, 0), null); assert.equal(B.declare(g, 0).ok, false);
});
test('cartela cheia exige as 16; uma linha não basta', () => {
  let g = B.newGame({ goal: 'cheia', rnd: seeded(4) }); g = drawAll(g, 24); g = markAll(g, 0, B.LINES[0]); assert.equal(B.declare(g, 0).ok, false);
  g = markAll(g, 0, Array.from({ length: 16 }, (_, i) => i).filter((i) => !B.LINES[0].includes(i))); assert.ok(B.declare(g, 0).ok);
});
test('dupla: cartelas diferentes, mesmo sorteio; empate se as duas valem; vence só uma quando só uma vale', () => {
  let g = B.newGame({ mode: 'dupla', rnd: seeded(11) }); assert.equal(g.cards.length, 2); g = drawAll(g, 24);
  g = markAll(g, 0, B.LINES[0]); let r = B.declare(g, 0); assert.deepEqual(r.g.result.winners, [0]); assert.equal(r.g.result.tie, false);
  g = markAll(g, 1, B.LINES[5]); r = B.declare(g, 1); assert.equal(r.g.result.tie, true); assert.deepEqual(r.g.result.winners, [0, 1]);
  assert.equal(B.declare(r.g, 0).ok, false); assert.throws(() => B.drawNext(r.g));
});
test('validGame', () => { assert.ok(B.validGame(B.newGame({ rnd: seeded(2) }))); assert.ok(B.validGame(B.newGame({ mode: 'prof' }))); for (const b of [null, {}, { ...B.newGame(), order: ['x'] }]) assert.ok(!B.validGame(b)); });
