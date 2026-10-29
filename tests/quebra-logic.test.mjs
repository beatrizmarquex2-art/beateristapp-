import test from 'node:test';
import assert from 'node:assert/strict';
import * as Q from '../js/jogos/quebra-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };

test('divisões 3×2, 4×3 e 6×4 ladrilham a imagem inteira (1536×1024 e tamanhos estranhos), sem sobra nem sobreposição', () => {
  for (const [W, H] of [[1536, 1024], [1000, 667], [1537, 1023]]) for (const [n, d] of Object.entries(Q.DIFFS)) {
    const rects = Q.pieceRects(W, H, d.cols, d.rows); assert.equal(rects.length, Number(n));
    assert.equal(rects.reduce((s, r) => s + r.w * r.h, 0), W * H);
    for (const r of rects) { assert.ok(r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H); if (r.i % d.cols) assert.equal(rects[r.i - 1].x + rects[r.i - 1].w, r.x); if (r.i >= d.cols) assert.equal(rects[r.i - d.cols].y + rects[r.i - d.cols].h, r.y); }
  }
});
test('bandeja: todas as peças, sem duplicar, nunca começa montada', () => {
  for (const n of [6, 12, 24]) for (let s = 1; s < 60; s++) { const g = Q.newGame({ diff: n, rnd: seeded(s) }); assert.deepEqual([...g.tray].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i)); assert.ok(!g.tray.every((p, i) => p === i)); assert.ok(Q.validGame(g)); }
  assert.throws(() => Q.newGame({ diff: 7 }));
});
test('peça só encaixa na posição certa; erro mantém tudo na bandeja e conta', () => {
  let g = Q.newGame({ diff: 6, rnd: seeded(4) }); const p = g.tray[0]; const wrong = (p + 1) % 6;
  const e = Q.place(g, p, wrong); assert.equal(e.ok, false); assert.deepEqual(e.g.tray, g.tray); assert.equal(e.g.errors, 1); assert.ok(e.g.placed.every((x) => !x));
  const o = Q.place(g, p, p); assert.ok(o.ok); assert.equal(o.g.placed[p], true); assert.ok(!o.g.tray.includes(p)); assert.throws(() => Q.place(o.g, p, p));
});
test('montar tudo termina; invariante peças = bandeja + fixas durante toda a partida', () => {
  for (const n of [6, 12, 24]) { let g = Q.newGame({ diff: n, rnd: seeded(n) }); while (!g.over) { assert.ok(Q.validGame(g)); assert.equal(g.tray.length + Q.placedCount(g), n); g = Q.place(g, g.tray[0], g.tray[0]).g; } assert.equal(Q.placedCount(g), n); assert.equal(g.tray.length, 0); assert.throws(() => Q.place(g, 0, 0)); }
});
test('melhor tempo: sem dicas e com dicas separados; modo livre não conta; só melhora', () => {
  const win = (o) => ({ ...Q.newGame({ diff: 6 }), over: true, ...o });
  let r = Q.recordBest({}, win({ elapsed: 50000, hints: 0 })); assert.ok(r.record); assert.deepEqual(r.best, { '6:sem': 50000 });
  r = Q.recordBest(r.best, win({ elapsed: 30000, hints: 2 })); assert.deepEqual(r.best, { '6:sem': 50000, '6:com': 30000 });
  r = Q.recordBest(r.best, win({ elapsed: 60000, hints: 0 })); assert.equal(r.record, false);
  r = Q.recordBest(r.best, win({ elapsed: 1, hints: 0, free: true })); assert.equal(r.record, false);
});
test('dicas contam à parte e não colocam a peça', () => { const g = Q.useHint(Q.newGame({ diff: 6, rnd: seeded(2) })); assert.equal(g.hints, 1); assert.ok(g.placed.every((x) => !x)); });
test('validGame recusa peça duplicada ou sumida', () => {
  const g = Q.newGame({ diff: 6, rnd: seeded(1) }); for (const bad of [null, { ...g, tray: g.tray.slice(1) }, { ...g, tray: [...g.tray, g.tray[0]] }, { ...g, diff: 5 }]) assert.ok(!Q.validGame(bad));
});
