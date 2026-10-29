// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../js/jogos/domino-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const T = (a, b) => ({ id: D.tileId(a, b), a, b });

test('28 peças únicas, cada par não ordenado uma vez', () => {
  const t = D.makeTiles(); assert.equal(t.length, 28); assert.equal(new Set(t.map((x) => x.id)).size, 28);
  for (const x of t) assert.ok(x.a <= x.b && x.a >= 0 && x.b <= 6);
});
test('figuras de cada valor somam o próprio valor', () => {
  for (let v = 0; v <= 6; v++) assert.equal(D.beatsOf(D.FIGS[v]), v);
});
test('distribuição: 7 + 7 + 14, sem duplicar, para várias sementes', () => {
  for (let s = 1; s <= 50; s++) {
    const g = D.newGame({ rnd: seeded(s) }); assert.deepEqual([g.hands[0].length, g.hands[1].length, g.stock.length], [7, 7, 14]);
    const all = [...g.hands[0], ...g.hands[1], ...g.stock].map((t) => t.id); assert.equal(new Set(all).size, 28);
  }
});
test('quem começa: maior duplo; sem duplo, maior soma e depois maior lado', () => {
  assert.equal(D.starter([[T(1, 1), T(6, 5)], [T(2, 2), T(0, 1)]]), 1);
  assert.equal(D.starter([[T(0, 1), T(6, 5)], [T(4, 6), T(0, 2)]]), 0);
  assert.equal(D.starter([[T(5, 4)], [T(6, 3)]]), 1); // 9 = 9, maior lado 6 vence
});
test('encaixe inverte a peça nas duas pontas e mantém as pontas coerentes', () => {
  let c = D.place([], T(2, 5), 'R'); assert.deepEqual(D.ends(c), { L: 2, R: 5 });
  c = D.place(c, T(5, 3), 'R'); assert.deepEqual(D.ends(c), { L: 2, R: 3 });
  c = D.place(c, T(2, 6), 'L'); assert.deepEqual(D.ends(c), { L: 6, R: 3 });
  c = D.place(c, T(1, 6), 'L'); assert.deepEqual(D.ends(c), { L: 1, R: 3 });
  for (let i = 1; i < c.length; i++) assert.equal(c[i - 1].r, c[i].l);
});
test('duplo encaixa; peça que não serve é recusada; serve nos dois lados oferece as duas pontas', () => {
  const c = D.place([], T(3, 3), 'R'); assert.deepEqual(D.sidesFor(T(3, 3), c), ['L', 'R']);
  const c2 = D.place(c, T(3, 3), 'R'); assert.equal(c2.length, 2);
  assert.throws(() => D.place(c, T(1, 2), 'R'));
});
test('invariante: partidas aleatórias terminam com cadeia válida e 28 peças conservadas', () => {
  for (let s = 1; s <= 200; s++) {
    const rnd = seeded(s); let g = D.newGame({ rnd }); let guard = 0;
    while (!g.over && guard++ < 500) {
      const mv = D.paulMove({ hand: g.hands[g.turn], chain: g.chain, stockCount: g.stock.length }, rnd);
      g = mv.type === 'play' ? D.applyPlay(g, g.turn, mv.id, mv.side) : mv.type === 'draw' ? D.applyDraw(g, g.turn) : D.applyPass(g, g.turn);
      for (let i = 1; i < g.chain.length; i++) assert.equal(g.chain[i - 1].r, g.chain[i].l);
      assert.equal(g.chain.length + g.hands[0].length + g.hands[1].length + g.stock.length, 28);
    }
    assert.ok(g.over, `semente ${s} não terminou`);
    if (g.result.reason === 'mao-vazia') assert.equal(g.hands[g.result.winner].length, 0);
  }
});
test('comprar só sem jogada e com monte; passar só com monte vazio', () => {
  const g = { ...D.newGame({ rnd: seeded(3) }) };
  const playable = { ...g, chain: [{ id: '0-0', l: g.hands[g.turn][0].a, r: g.hands[g.turn][0].a }], over: false };
  assert.equal(D.canDraw(playable), false); assert.equal(D.canPass(playable), false);
  assert.throws(() => D.applyDraw(playable, playable.turn));
  const stuck = { ...g, hands: [[T(0, 1)], [T(2, 3)]], chain: [{ id: '5-5', l: 5, r: 5 }], turn: 0, stock: [T(4, 4)], passes: 0 };
  assert.equal(D.canDraw(stuck), true); assert.equal(D.canPass(stuck), false);
  const empty = { ...stuck, stock: [] }; assert.equal(D.canPass(empty), true); assert.equal(D.canDraw(empty), false);
});
test('bloqueio: duas passagens seguidas; menor soma vence; igualdade empata; jogada zera a contagem', () => {
  const base = { v: 1, mode: 'local', stock: [], chain: [{ id: '5-5', l: 5, r: 5 }], over: false, result: null, log: [] };
  let g = { ...base, hands: [[T(0, 1)], [T(2, 3)]], turn: 0, passes: 0 };
  g = D.applyPass(g, 0); assert.equal(g.over, false); g = D.applyPass(g, 1);
  assert.deepEqual([g.over, g.result.reason, g.result.winner, g.result.totals], [true, 'bloqueio', 0, [1, 5]]);
  let e = { ...base, hands: [[T(0, 3)], [T(1, 2)]], turn: 0, passes: 0 }; e = D.applyPass(D.applyPass(e, 0), 1);
  assert.equal(e.result.winner, null);
  let z = { ...base, hands: [[T(0, 1), T(5, 2)], [T(2, 3)]], turn: 0, passes: 1 }; z = D.applyPlay(z, 0, '2-5', 'R'); assert.equal(z.passes, 0);
});
test('fim por mão vazia', () => {
  const g = { v: 1, mode: 'paul', stock: [], chain: [{ id: '5-5', l: 5, r: 5 }], hands: [[T(5, 1)], [T(2, 3)]], turn: 0, passes: 0, over: false, result: null, log: [] };
  const r = D.applyPlay(g, 0, '1-5', 'R'); assert.deepEqual([r.over, r.result.winner, r.result.reason], [true, 0, 'mao-vazia']);
});
test('não joga fora da vez nem peça que não está na mão', () => {
  const g = D.newGame({ rnd: seeded(9) });
  assert.throws(() => D.applyPlay(g, 1 - g.turn, g.hands[1 - g.turn][0].id, 'R'));
  assert.throws(() => D.applyPlay(g, g.turn, '9-9', 'R'));
});
test('validGame aceita partida boa e recusa lixo ou peça duplicada', () => {
  const g = D.newGame({ rnd: seeded(5) });
  assert.equal(D.validGame(g), true); assert.equal(D.validGame(JSON.parse(JSON.stringify(g))), true);
  for (const bad of [null, {}, { ...g, v: 2 }, { ...g, stock: g.stock.slice(1) }, { ...g, hands: [[...g.hands[0], g.hands[1][0]], g.hands[1]] }]) assert.equal(D.validGame(bad), false);
});
