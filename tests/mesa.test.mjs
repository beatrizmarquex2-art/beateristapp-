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

test('estrelas por desempenho nos jogos que ensinam: até 3 por partida (sem limite por dia: o limite de 30 é só dos jogos de mesa)', () => {
  let m = null; let tot = 0;
  for (let i = 0; i < 20; i++) { const r = contar(m, 'quiz', '2026-11-06', 3); m = r.mesa; tot += r.ganhou; }
  assert.equal(tot, 60, '20 partidas de 3 estrelas = 60, sem limite por dia nos jogos de aprender');
  assert.equal(starsPct(10, 10), 3); assert.equal(starsPct(7, 10), 2); assert.equal(starsPct(4, 10), 1); assert.equal(starsPct(2, 10), 0);
  assert.equal(starsErros(0), 3); assert.equal(starsErros(2), 2); assert.equal(starsErros(5), 1);
  assert.ok(ENSINAM.includes('cartas') && ENSINAM.includes('quiz') && ENSINAM.includes('caca') && ENSINAM.includes('cruzadinha'));
});

test('quebra-cabeça: 3 ★ na 1ª volta, 2 na 2ª, 1 da 3ª em diante; cada imagem 1 vez por volta', async () => {
  const { premioQuebra } = await import('../js/figurinhas/mesa-logic.js');
  let q = null; const got = []; const ids = ['a', 'b', 'c'];
  for (let volta = 0; volta < 4; volta++) for (const id of ids) { const r = premioQuebra(q, id, 3); q = r.q; got.push(r.estrelas); }
  assert.deepEqual(got, [3, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1]);
  const r1 = premioQuebra(null, 'a', 3); assert.equal(premioQuebra(r1.q, 'a', 3).estrelas, 0); // repetir a mesma imagem na mesma volta não dá nada
  assert.equal(premioQuebra(r1.q, 'b', 3).estrelas, 3);
});
test('tabela de estrelas: velha, memória, Uno e quiz Uno 1; cara, stop e bingo 3', async () => {
  const { ESTRELAS_JOGO } = await import('../js/figurinhas/mesa-logic.js');
  for (const j of ['velha', 'memoria', 'cartas', 'quizuno']) assert.equal(ESTRELAS_JOGO[j], 1); for (const j of ['cara', 'stop', 'bingo']) assert.equal(ESTRELAS_JOGO[j], 3);
});

import { pagarChave } from '../js/figurinhas/mesa-logic.js';
test('anti-farm: cada chave (música/nível) paga até 3 ★ na vida, só a diferença', () => {
  let r = pagarChave({}, 'toca|a|90', 3); assert.equal(r.novas, 3);
  r = pagarChave(r.pago, 'toca|a|90', 3); assert.equal(r.novas, 0, 'repetir a mesma música não rende');
  r = pagarChave(r.pago, 'toca|b|90', 3); assert.equal(r.novas, 3, 'outra música rende');
  let q = pagarChave({}, 'teoria|x', 1); assert.equal(q.novas, 1); q = pagarChave(q.pago, 'teoria|x', 2); assert.equal(q.novas, 1, 'melhorou: paga só a diferença'); assert.equal(pagarChave(q.pago, 'teoria|x', 2).novas, 0);
  assert.equal(pagarChave({}, 'k', 9).novas, 3, 'nunca passa de 3');
});
test('jogos de aprender não têm o limite de 30 por dia; os de mesa têm', async () => {
  const { contar: c, APRENDER } = await import('../js/figurinhas/mesa-logic.js');
  let m; let ganhas = 0; for (let i = 0; i < 50; i++) { const r = c(m, 'quiz', '2026-11-13', 1); m = r.mesa; ganhas += r.ganhou; } assert.equal(ganhas, 50, 'quiz: 50 estrelas no mesmo dia');
  let v; let g2 = 0; for (let i = 0; i < 50; i++) { const r = c(v, 'velha', '2026-11-13', 1); v = r.mesa; g2 += r.ganhou; } assert.equal(g2, 30, 'jogo da velha: trava em 30');
  assert.ok(APRENDER.includes('rudimentos') && APRENDER.includes('toca') && !APRENDER.includes('velha') && !APRENDER.includes('memoria') && !APRENDER.includes('quebra'));
  assert.equal(c(undefined, 'rudimentos', '2026-11-13', 10).ganhou, 10);
});
