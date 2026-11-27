import test from 'node:test'; import assert from 'node:assert/strict';
import { MUNDOS, FASES, tipoDa, faseCfg, qtdPortas, portasDaFase, estrelasFase, PORTAS_FASE, DESAFIOS, BONUS, estrelasDesafio, bonusAberto, estrelasPorta, estOf, estMundo, faseAberta, mundoLiberado, idFase } from '../js/jogos/fuga-logic.js';
test('3 mundos de 12 fases, 36 ★ cada; o legado tipoDa gira caça → cruzadinha → mesa de som (sem quiz)', () => {
  assert.deepEqual(MUNDOS.map((m) => m.id), ['estudio', 'vulcao', 'espaco']); assert.equal(FASES * 3, 36);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(tipoDa), ['caca', 'cruz', 'genius', 'caca', 'cruz', 'genius']);
});
test('dificuldade sobe com a fase e o mundo, com teto', () => {
  assert.equal(faseCfg(0, 1).palavras, 4); assert.equal(faseCfg(0, 12).palavras, 8); assert.equal(faseCfg(1, 1).palavras, 6); assert.equal(faseCfg(2, 12).cruz, 6);
});
test('estrelas: caça = 3 - dicas (mínimo 1); cruzadinha 3; jogos de toque pelas estrelas dos erros', () => {
  assert.deepEqual([3, 2, 1].map((e) => estrelasPorta('caca', { estrelas: e })), [3, 2, 1]); assert.equal(estrelasPorta('cruz', {}), 3);
});
test('progresso: 1ª fase aberta, as outras só depois de 1 ★; mundo 2 só com o 1 completo', () => {
  const est = {}; assert.equal(faseAberta(est, 'estudio', 1), true); assert.equal(faseAberta(est, 'estudio', 2), false);
  est[idFase('estudio', 1)] = 1; assert.equal(faseAberta(est, 'estudio', 2), true); assert.equal(estMundo(est, 'estudio'), 1);
  assert.equal(mundoLiberado(est, 'vulcao'), false); for (let n = 1; n <= FASES; n++) est[idFase('estudio', n)] = 1;
  assert.equal(mundoLiberado(est, 'vulcao'), true); assert.equal(mundoLiberado(est, 'espaco'), false); assert.equal(estOf({ 'estudio:1': 9 }, 'estudio', 1), 3);
});
test('desenho da Bea: portas por fase 2·2·3·3·3·1·1·3·3·3·4·4; fases 6 e 7 são desafios de 1 porta; porta B só depois da fase 12', () => {
  assert.deepEqual(PORTAS_FASE, [2, 2, 3, 3, 3, 1, 1, 3, 3, 3, 4, 4]); assert.deepEqual([1, 2, 3, 6, 7, 8, 11, 12].map(qtdPortas), [2, 2, 3, 1, 1, 3, 4, 4]);
  assert.deepEqual(portasDaFase(0, 1).map((p) => p.tipo), ['genius', 'memoria']); assert.deepEqual(portasDaFase(0, 5).map((p) => p.tipo), ['caca', 'intruso', 'caminho']); assert.deepEqual(portasDaFase(0, 11).map((p) => p.tipo), ['intruso', 'queda', 'caca', 'cruz']);
  const f6 = portasDaFase(0, 6); assert.equal(f6.length, 1); assert.equal(f6[0].tipo, 'genius'); assert.equal(f6[0].maxErros, 2); assert.ok(f6[0].desafio && f6[0].limite === 150); assert.equal(portasDaFase(0, 7)[0].tipo, 'caca');
  assert.deepEqual([30, 70, 71, 110, 111, 200].map((t) => estrelasDesafio(t, DESAFIOS[6])), [3, 3, 2, 2, 1, 1]);
  assert.equal(BONUS.maxErros, 1); assert.equal(BONUS.tipo, 'genius'); assert.equal(bonusAberto({}, 'estudio'), false); assert.equal(bonusAberto({ 'estudio:12': 1 }, 'estudio'), true);
  assert.equal(MUNDOS[0].nome, 'Estúdio do Paul');
});
test('estrelas da fase = média das portas (1 a 3)', () => { assert.equal(estrelasFase([3, 3, 3]), 3); assert.equal(estrelasFase([3, 2]), 3); assert.equal(estrelasFase([2, 1, 1]), 1); assert.equal(estrelasFase([]), 0); });


test('Fuga sem quiz: nenhuma porta (nem o desafio nem a porta B) é quiz; os quizzes ficam só na aba Estudos', () => {
  const { TIPOS_FASE } = { TIPOS_FASE: Array.from({ length: 12 }, (_, i) => portasDaFase(0, i + 1).map((p) => p.tipo)) };
  assert.ok(!TIPOS_FASE.flat().includes('quiz')); assert.notEqual(BONUS.tipo, 'quiz');
  for (let m = 0; m < 3; m++) for (let n = 1; n <= 12; n++) assert.ok(!portasDaFase(m, n).some((p) => p.tipo === 'quiz'), `mundo ${m} fase ${n}`);
  assert.deepEqual(portasDaFase(0, 1).map((p) => p.tipo), ['genius', 'memoria']);
});

test('Genius: a cada aparição a sequência tem 1 nota a mais (4, 5, 6, 7), cada mundo começa 2 acima, teto 10, porta B com 10', async () => {
  const { rodadasGenius, GENIUS_TETO } = await import('../js/jogos/fuga-logic.js');
  const seq = (mi, tr) => { const o = []; for (let n = 1; n <= 12; n++) portasDaFase(mi, n, tr).forEach((p) => { if (p.tipo === 'genius') o.push(p.rodadas); }); return o; };
  assert.deepEqual(seq(0, {}), [4, 5, 6, 7]); assert.deepEqual(seq(1, {}), [6, 7, 8, 9]); assert.deepEqual(seq(2, {}), [8, 9, 10, 10]);
  assert.equal(BONUS.rodadas, 10); assert.equal(rodadasGenius(99, 2), GENIUS_TETO);
  for (const mi of [0, 1, 2]) { const v = seq(mi, {}); assert.deepEqual(v, [...v].sort((a, b) => a - b), 'nunca diminui'); }
});
