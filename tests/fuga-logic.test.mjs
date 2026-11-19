import test from 'node:test'; import assert from 'node:assert/strict';
import { MUNDOS, FASES, tipoDa, faseCfg, qtdPortas, portasDaFase, estrelasFase, estrelasPorta, estOf, estMundo, faseAberta, mundoLiberado, idFase } from '../js/jogos/fuga-logic.js';
test('3 mundos de 12 fases, 36 ★ cada; as fases giram quiz → caça → cruzadinha', () => {
  assert.deepEqual(MUNDOS.map((m) => m.id), ['estudio', 'vulcao', 'espaco']); assert.equal(FASES * 3, 36);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(tipoDa), ['quiz', 'caca', 'cruz', 'quiz', 'caca', 'cruz']);
});
test('dificuldade sobe com a fase e o mundo, com teto', () => {
  assert.equal(faseCfg(0, 1).palavras, 4); assert.equal(faseCfg(0, 12).palavras, 7); assert.equal(faseCfg(2, 12).palavras, 8); assert.equal(faseCfg(2, 12).cruz, 6); assert.equal(faseCfg(0, 1).perguntas, 5);
});
test('estrelas: quiz 5/4/3 certas = 3/2/1 (dica do desistir limita em 2); caça = 3 - dicas; cruzadinha 3', () => {
  assert.deepEqual([5, 4, 3].map((f) => estrelasPorta('quiz', { found: f })), [3, 2, 1]); assert.equal(estrelasPorta('quiz', { found: 5, ajuda: true }), 2); assert.equal(estrelasPorta('quiz', { found: 3, ajuda: true }), 1);
  assert.deepEqual([3, 2, 1].map((e) => estrelasPorta('caca', { estrelas: e })), [3, 2, 1]); assert.equal(estrelasPorta('cruz', {}), 3);
});
test('progresso: 1ª fase aberta, as outras só depois de 1 ★; mundo 2 só com o 1 completo', () => {
  const est = {}; assert.equal(faseAberta(est, 'estudio', 1), true); assert.equal(faseAberta(est, 'estudio', 2), false);
  est[idFase('estudio', 1)] = 1; assert.equal(faseAberta(est, 'estudio', 2), true); assert.equal(estMundo(est, 'estudio'), 1);
  assert.equal(mundoLiberado(est, 'vulcao'), false); for (let n = 1; n <= FASES; n++) est[idFase('estudio', n)] = 1;
  assert.equal(mundoLiberado(est, 'vulcao'), true); assert.equal(mundoLiberado(est, 'espaco'), false); assert.equal(estOf({ 'estudio:1': 9 }, 'estudio', 1), 3);
});
test('fase com várias portas: a 1ª tem 2, depois 3 e 4; as portas giram quiz → caça → cruzadinha → quiz; ★ da fase = média das portas (1 a 3)', () => {
  assert.deepEqual([1, 2, 4, 5, 12].map(qtdPortas), [2, 3, 3, 4, 4]);
  assert.deepEqual(portasDaFase(0, 1).map((p) => p.tipo), ['quiz', 'caca']); assert.deepEqual(portasDaFase(0, 5).map((p) => p.tipo), ['quiz', 'caca', 'cruz', 'quiz']);
  assert.equal(estrelasFase([3, 3, 3]), 3); assert.equal(estrelasFase([3, 2]), 3); assert.equal(estrelasFase([2, 1, 1]), 1); assert.equal(estrelasFase([1, 1]), 1); assert.equal(estrelasFase([]), 0);
});
