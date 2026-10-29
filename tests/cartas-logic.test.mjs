import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/jogos/cartas-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
let uid = 1000;
const card = (color, kind, value = 0) => ({ id: `t${uid++}`, color, kind, value });
const num = (color, v) => card(color, 'num', v);
const base = (o) => ({ v: 1, mode: 'local', hands: [[], []], draw: [], discard: [num('vermelho', 3)], color: 'vermelho', turn: 0, drawn: null, passes: 0, over: false, result: null, note: '', last: null, ...o });

test('baralho: 76 cartas, ids únicos, 18 por cor + 4 curingas, sem +4', () => {
  const d = C.makeDeck(); assert.equal(d.length, 76); assert.equal(new Set(d.map((c) => c.id)).size, 76);
  for (const k of C.COLORS) {
    const cs = d.filter((c) => c.color === k); assert.equal(cs.length, 18);
    for (let v = 1; v <= 6; v++) assert.equal(cs.filter((c) => c.kind === 'num' && c.value === v).length, 2);
    for (const a of C.ACTIONS) assert.equal(cs.filter((c) => c.kind === a).length, 2);
  }
  assert.equal(d.filter(C.isWild).length, 4);
});
test('figuras somam o valor do número', () => { for (let v = 1; v <= 6; v++) assert.equal(C.beatsOf(C.FIGS[v]), v); });
test('distribuição: 7 + 7, descarte começa com número, 76 conservadas', () => {
  for (let s = 1; s <= 80; s++) {
    const g = C.newGame({ rnd: seeded(s) }); assert.equal(g.hands[0].length, 7); assert.equal(g.hands[1].length, 7);
    assert.ok(C.isNum(g.discard[0])); assert.equal(g.color, g.discard[0].color); assert.ok(C.validGame(g));
  }
});
test('jogabilidade: cor, número, ação, curinga; topo curinga só vale pela cor', () => {
  const top = num('vermelho', 3);
  assert.ok(C.playable(num('vermelho', 6), top, 'vermelho')); assert.ok(C.playable(num('azul', 3), top, 'vermelho'));
  assert.ok(!C.playable(num('azul', 4), top, 'vermelho')); assert.ok(C.playable(card(null, 'curinga'), top, 'vermelho'));
  const sk = card('azul', 'pular'); assert.ok(C.playable(card('mostarda', 'pular'), sk, 'azul')); assert.ok(!C.playable(num('mostarda', 3), sk, 'azul'));
  const w = card(null, 'curinga'); assert.ok(!C.playable(num('mostarda', 3), w, 'azul')); assert.ok(C.playable(num('azul', 1), w, 'azul'));
});
test('curinga exige cor e muda a cor sem pular a vez', () => {
  const w = card(null, 'curinga'); const g = base({ hands: [[w, num('azul', 1)], [num('azul', 2)]] });
  assert.throws(() => C.applyPlay(g, 0, w.id)); const r = C.applyPlay(g, 0, w.id, 'azul');
  assert.equal(r.color, 'azul'); assert.equal(r.turn, 1);
});
test('com carta válida não compra; compra uma só; serve → joga ou passa; não serve → passa sozinho', () => {
  const ok = base({ hands: [[num('vermelho', 1)], [num('azul', 2)]], draw: [num('azul', 5)] });
  assert.equal(C.canDraw(ok), false); assert.throws(() => C.applyDraw(ok, 0));
  const stuck = base({ hands: [[num('azul', 4), num('azul', 5)], [num('azul', 2)]], draw: [num('mostarda', 6), num('vermelho', 2)] });
  assert.equal(C.canDraw(stuck), true); let g = C.applyDraw(stuck, 0); // compra vermelho 2: serve
  assert.equal(g.turn, 0); assert.ok(g.drawn); assert.equal(C.canDraw(g), false); assert.throws(() => C.applyDraw(g, 0));
  assert.deepEqual(C.legalCards(g, 0).map((c) => c.id), [g.drawn]); assert.equal(C.canPass(g), true);
  assert.equal(C.applyPass(g, 0).turn, 1);
  const s2 = base({ hands: [[num('azul', 4)], [num('azul', 2)]], draw: [num('mostarda', 6)] });
  g = C.applyDraw(s2, 0); assert.equal(g.turn, 1); assert.equal(g.hands[0].length, 2);
});
test('+2: adversário compra 2 e perde a vez, sem empilhar; pular e inverter também pulam (2 jogadores)', () => {
  const d2 = card('vermelho', 'mais2'); const g = base({ hands: [[d2, num('azul', 1)], [card('vermelho', 'mais2'), num('azul', 2)]], draw: [num('azul', 4), num('azul', 5), num('azul', 6)] });
  const r = C.applyPlay(g, 0, d2.id); assert.equal(r.hands[1].length, 4); assert.equal(r.turn, 0);
  for (const k of ['pular', 'inverter']) { const c = card('vermelho', k); const x = C.applyPlay(base({ hands: [[c, num('azul', 1)], [num('azul', 2)]] }), 0, c.id); assert.equal(x.turn, 0); assert.equal(x.hands[1].length, 1); }
});
test('vitória com ação resolve o +2 antes do resultado', () => {
  const d2 = card('vermelho', 'mais2'); const g = base({ hands: [[d2], [num('azul', 2)]], draw: [num('azul', 4), num('azul', 5)] });
  const r = C.applyPlay(g, 0, d2.id); assert.ok(r.over); assert.equal(r.result.winner, 0); assert.equal(r.hands[1].length, 3);
});
test('reciclagem: monte vazio embaralha o descarte mantendo topo e cor', () => {
  const top = num('vermelho', 3); const g = base({ hands: [[num('azul', 4)], [num('azul', 2)]], draw: [], discard: [num('mostarda', 1), num('mostarda', 2), top] });
  assert.equal(C.canDraw(g), true); const r = C.applyDraw(g, 0, seeded(2));
  assert.equal(C.topOf(r).id, top.id); assert.equal(r.color, 'vermelho'); assert.equal(r.discard.length, 1); assert.equal(r.draw.length + r.hands[0].length, 3);
});
test('última nota! marcada ao ficar com uma carta', () => {
  const a = num('vermelho', 6); const g = base({ hands: [[a, num('azul', 1)], [num('azul', 2)]] }); assert.equal(C.applyPlay(g, 0, a.id).last, 0);
});
test('bloqueio: sem compra possível, duas passagens; menos cartas vence; igualdade empata', () => {
  const g = base({ hands: [[num('azul', 4)], [num('azul', 2), num('azul', 5)]], draw: [], discard: [num('vermelho', 3)] });
  assert.equal(C.canPass(g), true); const a = C.applyPass(g, 0); assert.equal(a.over, false); const b = C.applyPass(a, 1);
  assert.deepEqual([b.over, b.result.reason, b.result.winner], [true, 'bloqueio', 0]);
  const e = base({ hands: [[num('azul', 4)], [num('azul', 2)]] }); assert.equal(C.applyPass(C.applyPass(e, 0), 1).result.winner, null);
});
test('invariantes: 300 partidas Paul × Paul terminam e conservam 76 cartas', () => {
  for (let s = 1; s <= 300; s++) {
    const rnd = seeded(s); let g = C.newGame({ rnd }); let n = 0;
    while (!g.over && n++ < 2000) {
      const mv = C.paulMove(g, g.turn, rnd);
      g = mv.type === 'play' ? C.applyPlay(g, g.turn, mv.id, mv.color, rnd) : mv.type === 'draw' ? C.applyDraw(g, g.turn, rnd) : C.applyPass(g, g.turn);
      assert.equal(g.hands[0].length + g.hands[1].length + g.draw.length + g.discard.length, 76);
    }
    assert.ok(g.over, `semente ${s}`); assert.ok(C.validGame(g));
  }
});
test('validGame recusa dados ruins', () => {
  const g = C.newGame({ rnd: seeded(4) }); for (const bad of [null, {}, { ...g, color: 'rosa' }, { ...g, draw: g.draw.slice(1) }, { ...g, hands: [[...g.hands[0], g.hands[1][0]], g.hands[1]] }]) assert.equal(C.validGame(bad), false);
});
