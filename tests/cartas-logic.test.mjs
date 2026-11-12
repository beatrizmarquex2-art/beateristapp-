import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/jogos/cartas-logic.js';
import { SYMS, SYM_SVG, SYM_NAME } from '../js/jogos/cartas-simbolos.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
let uid = 1000;
const card = (color, kind, sym = null) => ({ id: `t${uid++}`, color, kind, sym });
const fig = (color, sym) => card(color, 'fig', sym);
const base = (o = {}) => ({ v: 2, mode: 'local', n: 2, dir: 1, hands: [[], []], draw: [], discard: [fig('vermelho', 'seminima')], color: 'vermelho', turn: 0, drawn: null, passes: 0, over: false, result: null, unoPending: null, unoSaid: null, shuf: 0, seq: 0, ev: null, ...o });
const padHand = (n) => Array.from({ length: n }, () => fig('azul', 'fusa'));

test('as 10 figuras existem, têm nome e desenho vetorial', () => {
  assert.equal(SYMS.length, 10);
  assert.deepEqual(SYMS, ['seminima', 'colcheia', 'semicolcheia', 'fusa', 'p_seminima', 'p_colcheia', 'p_semicolcheia', 'p_fusa', 'acento', 'fantasma']);
  for (const s of SYMS) { assert.ok(SYM_NAME[s]); assert.match(SYM_SVG[s], /<(path|ellipse|circle)/); }
});
test('baralho: 112 cartas, ids únicos, 26 por cor (10 figuras × 2 + 3 ações × 2), 4 curingas e 4 +4', () => {
  const d = C.makeDeck(); assert.equal(d.length, 112); assert.equal(new Set(d.map((c) => c.id)).size, 112);
  assert.deepEqual(C.COLORS, ['vermelho', 'amarelo', 'azul', 'verde']);
  for (const k of C.COLORS) {
    const cs = d.filter((c) => c.color === k); assert.equal(cs.length, 26);
    for (const s of SYMS) assert.equal(cs.filter((c) => c.kind === 'fig' && c.sym === s).length, 2);
    for (const a of C.ACTIONS) assert.equal(cs.filter((c) => c.kind === a).length, 2);
  }
  assert.equal(d.filter((c) => c.kind === 'curinga').length, 4); assert.equal(d.filter((c) => c.kind === 'mais4').length, 4);
});
test('distribuição: 7 por jogador (2 a 4), descarte começa com figura, 112 conservadas', () => {
  for (const players of [2, 3, 4]) for (let s = 1; s <= 40; s++) {
    const g = C.newGame({ mode: 'paul', players, rnd: seeded(s) }); assert.equal(g.n, players); assert.equal(g.hands.length, players);
    g.hands.forEach((h) => assert.equal(h.length, 7)); assert.ok(C.isFig(g.discard[0])); assert.equal(g.color, g.discard[0].color); assert.ok(C.validGame(g));
  }
  assert.equal(C.newGame({ mode: 'local', players: 4 }).n, 4); assert.equal(C.newGame({ mode: 'local' }).n, 2); assert.equal(C.newGame({ mode: 'online', players: 4 }).n, 2);
});
test('jogabilidade: mesma cor ou mesma figura; ação só com mesma ação; topo curinga só pela cor', () => {
  const top = fig('vermelho', 'colcheia');
  assert.ok(C.playable(fig('vermelho', 'fusa'), top, 'vermelho')); assert.ok(C.playable(fig('azul', 'colcheia'), top, 'vermelho'));
  assert.ok(!C.playable(fig('azul', 'fusa'), top, 'vermelho')); assert.ok(!C.playable(fig('azul', 'p_colcheia'), top, 'vermelho'));
  assert.ok(C.playable(card(null, 'curinga'), top, 'vermelho'));
  const sk = card('azul', 'pular'); assert.ok(C.playable(card('amarelo', 'pular'), sk, 'azul')); assert.ok(!C.playable(fig('amarelo', 'colcheia'), sk, 'azul')); assert.ok(C.playable(fig('azul', 'fusa'), sk, 'azul'));
  const w = card(null, 'curinga'); assert.ok(!C.playable(fig('amarelo', 'acento'), w, 'azul')); assert.ok(C.playable(fig('azul', 'acento'), w, 'azul'));
  // acento e nota fantasma são categorias normais: casam entre si, não com as outras
  assert.ok(C.playable(fig('verde', 'acento'), fig('azul', 'acento'), 'azul')); assert.ok(!C.playable(fig('verde', 'fantasma'), fig('azul', 'acento'), 'azul'));
});
test('+4 só vale sem carta da cor ativa na mão', () => {
  const w4 = card(null, 'mais4'); const top = fig('vermelho', 'colcheia');
  assert.ok(!C.playable(w4, top, 'vermelho', [w4, fig('vermelho', 'fusa')])); assert.ok(C.playable(w4, top, 'vermelho', [w4, fig('azul', 'fusa')]));
  const g = base({ hands: [[w4, fig('vermelho', 'fusa')], padHand(3)] });
  assert.throws(() => C.applyPlay(g, 0, w4.id, 'azul'), /serve/); assert.equal(C.legalCards(g, 0).length, 1);
});
test('curinga exige cor e muda a cor sem pular a vez', () => {
  const w = card(null, 'curinga'); const g = base({ hands: [[w, fig('azul', 'fusa')], [fig('azul', 'fusa')]] });
  assert.throws(() => C.applyPlay(g, 0, w.id)); const r = C.applyPlay(g, 0, w.id, 'azul');
  assert.equal(r.color, 'azul'); assert.equal(r.turn, 1); assert.equal(r.ev.t, 'play');
});
test('pular, +2 e +4 fazem o próximo perder a vez; +2/+4 compram', () => {
  const sk = card('vermelho', 'pular'); const m2 = card('vermelho', 'mais2'); const w4 = card(null, 'mais4');
  const mk = (c) => base({ n: 3, hands: [[c, fig('azul', 'fusa')], padHand(2), padHand(2)], draw: padHand(8) });
  let r = C.applyPlay(mk(sk), 0, sk.id); assert.equal(r.turn, 2); assert.equal(r.ev.victim, 1);
  r = C.applyPlay(mk(m2), 0, m2.id); assert.equal(r.hands[1].length, 4); assert.equal(r.turn, 2); assert.equal(r.ev.n, 2);
  r = C.applyPlay(mk(w4), 0, w4.id, 'verde'); assert.equal(r.hands[1].length, 6); assert.equal(r.turn, 2); assert.equal(r.color, 'verde');
});
test('inverter: com 3+ jogadores muda o sentido; com 2 vale como pular', () => {
  const inv = card('vermelho', 'inverter');
  let r = C.applyPlay(base({ n: 3, hands: [[inv, fig('azul', 'fusa')], padHand(2), padHand(2)] }), 0, inv.id); assert.equal(r.dir, -1); assert.equal(r.turn, 2);
  r = C.applyPlay(r.hands && base({ n: 3, dir: -1, turn: 2, hands: [padHand(2), padHand(2), [inv, fig('azul', 'fusa')]] }), 2, inv.id); assert.equal(r.dir, 1); assert.equal(r.turn, 0);
  r = C.applyPlay(base({ hands: [[inv, fig('azul', 'fusa')], padHand(2)] }), 0, inv.id); assert.equal(r.turn, 0);
});
test('ordem de jogo respeita o sentido', () => {
  const g = base({ n: 4, hands: [[], [], [], []], dir: -1 }); assert.equal(C.adv(g, 0), 3); assert.equal(C.adv(g, 0, 2), 2); assert.equal(C.adv({ ...g, dir: 1 }, 3), 0);
});
test('com carta válida não compra; compra uma só; serve → joga ou passa; não serve → passa sozinho', () => {
  const ok = base({ hands: [[fig('vermelho', 'fusa')], padHand(2)], draw: [fig('azul', 'acento')] });
  assert.ok(!C.canDraw(ok)); assert.throws(() => C.applyDraw(ok, 0));
  const nok = base({ hands: [[fig('azul', 'acento')], padHand(2)], draw: [fig('amarelo', 'fantasma')] });
  assert.ok(C.canDraw(nok)); let r = C.applyDraw(nok, 0); assert.equal(r.hands[0].length, 2); assert.equal(r.turn, 1); assert.equal(r.drawn, null); assert.equal(r.ev.fits, false);
  const fits = base({ hands: [[fig('azul', 'acento')], padHand(2)], draw: [fig('vermelho', 'fusa')] });
  r = C.applyDraw(fits, 0); assert.equal(r.turn, 0); assert.ok(r.drawn); assert.ok(!C.canDraw(r)); assert.ok(C.canPass(r));
  assert.throws(() => C.applyPlay(r, 0, r.hands[0][0].id), /comprada/);
  r = C.applyPass(r, 0); assert.equal(r.turn, 1); assert.equal(r.drawn, null);
});
test('monte vazio recicla o descarte (sem o topo) e conta o embaralhamento', () => {
  const g = base({ hands: [[fig('azul', 'acento')], padHand(2)], draw: [], discard: [fig('verde', 'fusa'), fig('verde', 'colcheia'), fig('vermelho', 'seminima')] });
  assert.equal(C.available(g), 2); const r = C.applyDraw(g, 0); assert.equal(r.discard.length, 1); assert.equal(r.shuf, 1);
});
test('não é possível jogar fora da vez nem carta que não está na mão', () => {
  const g = base({ hands: [[fig('vermelho', 'fusa')], [fig('vermelho', 'fusa'), fig('azul', 'fusa')]] });
  assert.throws(() => C.applyPlay(g, 1, g.hands[1][0].id), /vez/); assert.throws(() => C.applyPlay(g, 0, 'nada'), /mão/);
  assert.throws(() => C.applyPlay({ ...g, hands: [[fig('azul', 'acento'), fig('azul', 'fusa')], g.hands[1]] }, 0, 'x'));
});
test('vitória: esvaziar a mão termina a partida', () => {
  const c = fig('vermelho', 'fusa'); const r = C.applyPlay(base({ hands: [[c], padHand(3)] }), 0, c.id);
  assert.ok(r.over); assert.equal(r.result.winner, 0); assert.equal(r.result.reason, 'mao-vazia'); assert.ok(!C.canDraw(r));
});
test('UNO: sobrou uma carta → precisa avisar; avisar limpa; esquecer e ser pego compra 2', () => {
  const a = fig('vermelho', 'fusa'); const b = fig('azul', 'fusa');
  let g = C.applyPlay(base({ hands: [[a, b], padHand(3)], draw: padHand(6) }), 0, a.id);
  assert.equal(g.unoPending, 0); assert.ok(C.mustUno(g, 0)); assert.ok(!C.mustUno(g, 1));
  const said = C.callUno(g, 0); assert.equal(said.unoPending, null); assert.equal(said.unoSaid, 0); assert.ok(!C.mustUno(said, 0)); assert.throws(() => C.callUno(said, 0));
  const caught = C.catchUno(g, 0); assert.equal(caught.hands[0].length, 3); assert.equal(caught.unoPending, null); assert.equal(caught.ev.t, 'catch');
  assert.throws(() => C.catchUno(caught, 0));
});
test('bloqueio: ninguém joga nem compra → todos passam; menos cartas vence; igualdade empata', () => {
  let g = base({ n: 3, hands: [[fig('azul', 'acento')], [fig('azul', 'acento'), fig('azul', 'fusa')], [fig('azul', 'acento'), fig('azul', 'fusa')]], draw: [] });
  g = C.applyPass(g, 0); g = C.applyPass(g, 1); assert.ok(!g.over); g = C.applyPass(g, 2); assert.ok(g.over); assert.equal(g.result.reason, 'bloqueio'); assert.equal(g.result.winner, 0);
  let t = base({ hands: [[fig('azul', 'acento')], [fig('azul', 'acento')]], draw: [] }); t = C.applyPass(C.applyPass(t, 0), 1); assert.equal(t.result.winner, null);
});
test('o computador só joga cartas legais e escolhe cor válida', () => {
  for (let s = 1; s <= 200; s++) {
    const rnd = seeded(s); const g = C.newGame({ mode: 'paul', players: 3, rnd }); g.turn = 1;
    const mv = C.paulMove(g, 1, rnd);
    if (mv.type === 'play') { assert.ok(C.legalCards(g, 1).some((c) => c.id === mv.id)); const c = g.hands[1].find((x) => x.id === mv.id); if (C.isWild(c)) assert.ok(C.COLORS.includes(mv.color)); }
    else if (mv.type === 'draw') assert.ok(C.canDraw(g)); else assert.ok(C.canPass(g));
  }
});
test('invariantes: 300 partidas de 2, 3 e 4 jogadores (computador × computador) terminam e conservam 112 cartas', () => {
  for (const players of [2, 3, 4]) for (let s = 1; s <= 100; s++) {
    const rnd = seeded(s * 7 + players); let g = C.newGame({ mode: 'paul', players, rnd }); let steps = 0;
    while (!g.over && steps++ < 3000) {
      const p = g.turn; const mv = C.paulMove(g, p, rnd);
      g = mv.type === 'play' ? C.applyPlay(g, p, mv.id, mv.color, rnd) : mv.type === 'draw' ? C.applyDraw(g, p, rnd) : C.applyPass(g, p);
      if (g.unoPending != null && C.mustUno(g, g.unoPending)) g = C.callUno(g, g.unoPending);
      assert.equal([...g.hands.flat(), ...g.draw, ...g.discard].length, 112); assert.equal(new Set([...g.hands.flat(), ...g.draw, ...g.discard].map((c) => c.id)).size, 112);
    }
    assert.ok(g.over, `partida ${players}p/${s} não terminou`); assert.ok(C.validGame(g));
  }
});
test('validGame rejeita estados quebrados e partidas do formato antigo', () => {
  const g = C.newGame({ mode: 'paul' }); assert.ok(C.validGame(JSON.parse(JSON.stringify(g))));
  assert.ok(!C.validGame({ ...g, v: 1 })); assert.ok(!C.validGame({ ...g, hands: [g.hands[0]] })); assert.ok(!C.validGame({ ...g, color: 'mostarda' }));
  assert.ok(!C.validGame({ ...g, draw: g.draw.slice(1) })); assert.ok(!C.validGame(null));
});
