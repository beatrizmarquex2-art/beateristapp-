import test from 'node:test';
import assert from 'node:assert/strict';
import { contar, LIMITE_DIA } from '../js/figurinhas/mesa-logic.js';
test('estrelas dos jogos de mesa: 1 por vitória contra o Paul, limite de 30 por jogo por dia', () => {
  let m = null; let ganhas = 0;
  for (let i = 0; i < 40; i++) { const r = contar(m, 'velha', '2026-11-06'); m = r.mesa; ganhas += r.ganhou; }
  assert.equal(ganhas, LIMITE_DIA); assert.equal(m.total, 30);
  const o = contar(m, 'cartas', '2026-11-06'); assert.equal(o.ganhou, 1, 'cada jogo tem o seu limite');
  const amanha = contar(o.mesa, 'velha', '2026-11-07'); assert.equal(amanha.ganhou, 1, 'no dia seguinte volta a contar');
});
