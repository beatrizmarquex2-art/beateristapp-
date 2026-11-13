// UN🚫: variante do Uno Musical (cartas iguais juntas, comprar até achar, UNO silencioso, +2 e +4 acumulam, +4 quando quiser).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/jogos/cartas-logic.js';

let uid = 5000;
const card = (color, kind, sym = null) => ({ id: `u${uid++}`, color, kind, sym });
const fig = (color, sym) => card(color, 'fig', sym);
const pad = (n) => Array.from({ length: n }, () => fig('azul', 'fusa'));
const base = (o = {}) => ({ v: 2, un: true, pend: null, mode: 'local', n: 2, dir: 1, hands: [[], []], draw: pad(30), discard: [fig('vermelho', 'seminima')], color: 'vermelho', turn: 0, drawn: null, passes: 0, over: false, result: null, unoPending: null, unoSaid: null, shuf: 0, seq: 0, ev: { t: 'start' }, ...o });

test('newGame com un=true marca a variante; sem un fica o Uno de sempre', () => {
  assert.equal(C.newGame({ un: true }).un, true); assert.equal(C.newGame({ un: true }).pend, null); assert.equal(C.newGame().un, undefined);
});
test('+4 sai quando quiser, mesmo tendo a cor da mesa e mesmo como última carta', () => {
  const w4 = card(null, 'mais4'); const g = base({ hands: [[w4, fig('vermelho', 'fusa')], pad(3)] });
  assert.ok(C.legalCards(g, 0).some((c) => c.id === w4.id));
  const g2 = base({ hands: [[w4], pad(3)] }); assert.ok(C.legalCards(g2, 0).some((c) => c.id === w4.id));
});
test('cartas idênticas: joga 2 figuras iguais juntas; diferentes não', () => {
  const a = fig('vermelho', 'colcheia'); const b = fig('vermelho', 'colcheia'); const c = fig('vermelho', 'fusa'); const d = fig('azul', 'colcheia');
  const g = base({ hands: [[a, b, c, d], pad(3)] });
  assert.deepEqual(C.twins(g, 0, a).map((x) => x.id).sort(), [a.id, b.id].sort());
  const r = C.applyPlayMany(g, 0, [a.id, b.id]); assert.equal(r.hands[0].length, 2); assert.equal(r.discard.length, 3); assert.equal(r.turn, 1); assert.equal(r.ev.many, 2);
  assert.throws(() => C.applyPlayMany(g, 0, [a.id, c.id]), /iguais/); assert.throws(() => C.applyPlayMany(g, 0, [a.id, d.id]), /iguais/);
  assert.throws(() => C.applyPlayMany(base({ hands: [[fig('azul', 'fusa'), fig('azul', 'fusa')], pad(2)] }), 0, g.hands[0].slice(0, 0)), /iguais|junto/);
});
test('duas figuras iguais que não servem na mesa não podem ser jogadas', () => {
  const a = fig('azul', 'fusa'); const b = fig('azul', 'fusa'); const g = base({ hands: [[a, b, fig('verde', 'acento')], pad(3)] });
  assert.throws(() => C.applyPlayMany(g, 0, [a.id, b.id]), /serve/);
});
test('jogar as duas últimas cartas iguais ganha a partida', () => {
  const a = fig('vermelho', 'colcheia'); const b = fig('vermelho', 'colcheia'); const r = C.applyPlayMany(base({ hands: [[a, b], pad(3)] }), 0, [a.id, b.id]);
  assert.ok(r.over); assert.equal(r.result.winner, 0);
});
test('comprar até achar: compra várias até aparecer uma carta que serve', () => {
  const lixo = [fig('azul', 'fusa'), fig('azul', 'fusa'), fig('verde', 'acento')]; const boa = fig('vermelho', 'colcheia');
  const g = base({ hands: [[fig('azul', 'colcheia')], pad(3)], draw: [boa, ...lixo] }); // compra do fim: lixo, lixo, lixo(verde), boa
  assert.ok(C.canDraw(g)); const r = C.applyDraw(g, 0); assert.equal(r.ev.n, 4); assert.equal(r.ev.fits, true); assert.equal(r.drawn, boa.id); assert.equal(r.turn, 0);
  const r2 = C.applyPlay(r, 0, boa.id); assert.equal(r2.turn, 1);
});
test('comprar até achar: se o monte acaba sem achar, passa a vez', () => {
  const g = base({ hands: [[fig('azul', 'colcheia')], pad(3)], draw: [fig('azul', 'fusa'), fig('azul', 'fusa')] });
  const r = C.applyDraw(g, 0); assert.equal(r.ev.fits, false); assert.equal(r.turn, 1); assert.equal(r.hands[0].length, 3);
});
test('+2 em cima de +2 e +4 em cima de +4 acumulam; quem não responde compra tudo e perde a vez', () => {
  const a = card('vermelho', 'mais2'); const b = card('azul', 'mais2'); const c = fig('verde', 'fusa');
  let g = base({ hands: [[a, fig('azul', 'fusa')], [b, c]] });
  g = C.applyPlay(g, 0, a.id); assert.equal(g.pend.n, 2); assert.equal(g.turn, 1); assert.equal(g.hands[1].length, 2); // ainda não comprou
  assert.deepEqual(C.legalCards(g, 1).map((x) => x.id), [b.id]); assert.ok(C.canDraw(g)); assert.ok(!C.canPass(g));
  assert.throws(() => C.applyPlay(g, 1, c.id), /serve/);
  const g2 = C.applyPlay(g, 1, b.id); assert.equal(g2.pend.n, 4); assert.equal(g2.turn, 0);
  const g3 = C.applyDraw(g, 1); assert.equal(g3.hands[1].length, 4); assert.equal(g3.pend, null); assert.equal(g3.turn, 0); assert.equal(g3.ev.pend, true);
});
test('+4 só responde +4; +2 não responde +4', () => {
  const p4 = card(null, 'mais4'); const q4 = card(null, 'mais4'); const m2 = card('vermelho', 'mais2');
  let g = base({ hands: [[p4, fig('azul', 'fusa')], [q4, m2]] });
  g = C.applyPlay(g, 0, p4.id, 'verde'); assert.equal(g.pend.kind, 'mais4'); assert.deepEqual(C.legalCards(g, 1).map((x) => x.id), [q4.id]);
  g = C.applyPlay(g, 1, q4.id, 'azul'); assert.equal(g.pend.n, 8);
});
test('UNO silencioso: quem esquece e é pego antes da próxima jogada compra 2; depois disso não dá mais', () => {
  const a = fig('vermelho', 'colcheia'); let g = base({ hands: [[a, fig('azul', 'fusa')], pad(3)] });
  g = C.applyPlay(g, 0, a.id); assert.equal(g.unoPending, 0); assert.equal(C.catchable(g, 1), 0);
  const c = C.catchUno(g, 0); assert.equal(c.hands[0].length, 3);
  const g2 = C.applyDraw({ ...g, hands: [g.hands[0], [fig('verde', 'acento')]] }, 1); assert.equal(g2.unoPending, null); assert.equal(C.catchable(g2, 1), null);
});
test('acusar sem ninguém ter esquecido o UNO: quem acusou compra 2', () => {
  const g = base({ hands: [pad(3), pad(3)] }); assert.equal(C.catchable(g, 1), null);
  const r = C.wrongCatch(g, 1); assert.equal(r.hands[1].length, 5); assert.equal(r.ev.t, 'wrong'); assert.equal(r.turn, 0);
  assert.throws(() => C.wrongCatch({ ...g, un: undefined }, 1));
});
test('no Uno de sempre nada disso vale (sem un)', () => {
  const a = fig('vermelho', 'colcheia'); const b = fig('vermelho', 'colcheia'); const g = base({ un: undefined, pend: undefined, hands: [[a, b], pad(3)] });
  assert.throws(() => C.applyPlayMany(g, 0, [a.id, b.id])); assert.deepEqual(C.twins(g, 0, a), [a]);
  const m2 = card('vermelho', 'mais2'); const r = C.applyPlay({ ...g, hands: [[m2, a], pad(3)], draw: pad(10) }, 0, m2.id); assert.equal(r.hands[1].length, 5); assert.equal(r.pend, undefined);
});
test('partidas aleatórias do UN🚫 terminam sem erro (computador contra computador)', () => {
  const rnd = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  for (let seed = 1; seed <= 25; seed++) {
    const r = rnd(seed); let g = C.newGame({ mode: 'paul', players: 2 + (seed % 3), rnd: r, un: true }); let steps = 0;
    while (!g.over && steps++ < 4000) {
      const mv = C.paulMove(g, g.turn, r);
      if (C.mustUno(g, g.turn)) g = C.callUno(g, g.turn);
      g = mv.type === 'play' ? C.applyPlay(g, g.turn, mv.id, mv.color, r) : mv.type === 'draw' ? C.applyDraw(g, g.turn, r) : C.applyPass(g, g.turn);
    }
    assert.ok(g.over, `seed ${seed} não terminou`);
  }
});
