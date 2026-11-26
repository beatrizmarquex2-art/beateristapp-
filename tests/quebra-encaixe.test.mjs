import test from 'node:test';
import assert from 'node:assert/strict';
import { jigsawEdges, piecePath, DIFFS } from '../js/jogos/quebra-logic.js';

test('encaixes: bordas do quadro retas e fronteiras sempre com sinal; mesma grade = mesmos encaixes', () => {
  for (const d of Object.values(DIFFS)) {
    const E = jigsawEdges(d.cols, d.rows); const E2 = jigsawEdges(d.cols, d.rows);
    assert.deepEqual(E, E2);
    for (let c = 0; c < d.cols; c++) assert.equal(E.h[0][c], 0);
    for (let r = 0; r < d.rows; r++) assert.equal(E.v[r][0], 0);
    for (let r = 1; r < d.rows; r++) for (let c = 0; c < d.cols; c++) assert.ok(Math.abs(E.h[r][c]) === 1);
    for (let r = 0; r < d.rows; r++) for (let c = 1; c < d.cols; c++) assert.ok(Math.abs(E.v[r][c]) === 1);
  }
});
test('contorno: peça de canto tem 2 lados retos (sem curva neles); peça do meio tem 4 encaixes', () => {
  const { cols, rows } = DIFFS[12]; const E = jigsawEdges(cols, rows); const curvas = (i) => (piecePath(i, cols, rows, 100, 100, E).match(/C/g) || []).length;
  assert.equal(curvas(0), 8); // canto: só 2 lados com dente/encaixe (4 curvas cada)
  assert.equal(curvas(5), 16); // meio: os 4 lados
  assert.match(piecePath(5, cols, rows, 100, 100, E), /^M.*Z$/);
});
