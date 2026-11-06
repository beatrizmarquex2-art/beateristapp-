import test from 'node:test';
import assert from 'node:assert/strict';
import { contar, LIMITE_DIA, starsPct, starsErros, ENSINAM } from '../js/figurinhas/mesa-logic.js';
test('estrelas dos jogos de mesa: 1 por vitória contra o Paul, limite de 30 por jogo por dia', () => {
  let m = null; let ganhas = 0;
  for (let i = 0; i < 40; i++) { const r = contar(m, 'velha', '2026-11-06'); m = r.mesa; ganhas += r.ganhou; }
  assert.equal(ganhas, LIMITE_DIA); assert.equal(m.total, 30);
  const o = contar(m, 'cartas', '2026-11-06'); assert.equal(o.ganhou, 1, 'cada jogo tem o seu limite');
  const amanha = contar(o.mesa, 'velha', '2026-11-07'); assert.equal(amanha.ganhou, 1, 'no dia seguinte volta a contar');
});

test('estrelas por desempenho nos jogos que ensinam: até 3 por partida, sempre dentro do limite do dia', () => {
  let m = null; let tot = 0;
  for (let i = 0; i < 20; i++) { const r = contar(m, 'quiz', '2026-11-06', 3); m = r.mesa; tot += r.ganhou; }
  assert.equal(tot, 30, '20 partidas de 3 estrelas = 60, mas o limite é 30 por dia');
  assert.equal(starsPct(10, 10), 3); assert.equal(starsPct(7, 10), 2); assert.equal(starsPct(4, 10), 1); assert.equal(starsPct(2, 10), 0);
  assert.equal(starsErros(0), 3); assert.equal(starsErros(2), 2); assert.equal(starsErros(5), 1);
  assert.ok(ENSINAM.includes('cartas') && ENSINAM.includes('quiz') && ENSINAM.includes('caca') && ENSINAM.includes('cruzadinha'));
});
