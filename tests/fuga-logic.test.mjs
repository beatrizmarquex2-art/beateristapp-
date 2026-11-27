import test from 'node:test'; import assert from 'node:assert/strict';
import { minQuiz, MUNDOS, FASES, tipoDa, faseCfg, qtdPortas, portasDaFase, estrelasFase, PORTAS_FASE, DESAFIOS, BONUS, estrelasDesafio, bonusAberto, estrelasPorta, estOf, estMundo, faseAberta, mundoLiberado, idFase } from '../js/jogos/fuga-logic.js';
test('3 mundos de 12 fases, 36 ★ cada; as fases giram quiz → caça → cruzadinha', () => {
  assert.deepEqual(MUNDOS.map((m) => m.id), ['estudio', 'vulcao', 'espaco']); assert.equal(FASES * 3, 36);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(tipoDa), ['quiz', 'caca', 'cruz', 'quiz', 'caca', 'cruz']);
});
test('dificuldade sobe com a fase e o mundo, com teto', () => {
  assert.equal(faseCfg(0, 1).palavras, 4); assert.equal(faseCfg(0, 12).palavras, 8); assert.equal(faseCfg(1, 1).palavras, 6); assert.equal(faseCfg(2, 12).cruz, 6); assert.equal(faseCfg(0, 1).perguntas, 3);
});
test('estrelas: quiz de 3 perguntas (3 certas = 3 ★, 2 = 2 ★, cada pulada tira 1 ★, a dica limita em 2); caça = 3 - dicas; cruzadinha 3', () => {
  assert.deepEqual([3, 2].map((f) => estrelasPorta('quiz', { found: f, total: 3 })), [3, 2]); assert.equal(estrelasPorta('quiz', { found: 3, total: 3, ajuda: true }), 2); assert.equal(estrelasPorta('quiz', { found: 2, total: 3, puladas: 1 }), 1); assert.equal(estrelasPorta('quiz', { found: 2, total: 3, puladas: 1, ajuda: true }), 1); assert.equal(estrelasPorta('quiz', { found: 2, total: 3, ajuda: true }), 2);
  assert.equal(minQuiz(3), 2); assert.equal(minQuiz(7), 3); assert.equal(faseCfg(0, 1).perguntas, 3);
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
  assert.deepEqual(portasDaFase(0, 1).map((p) => p.tipo), ['genius', 'memoria']); assert.deepEqual(portasDaFase(0, 5).map((p) => p.tipo), ['caca', 'intruso', 'quiz']); assert.deepEqual(portasDaFase(0, 11).map((p) => p.tipo), ['intruso', 'queda', 'caca', 'cruz']);
  const f6 = portasDaFase(0, 6); assert.equal(f6.length, 1); assert.equal(f6[0].maxErros, 1); assert.ok(f6[0].desafio && f6[0].limite === 120); assert.equal(portasDaFase(0, 7)[0].tipo, 'caca');
  assert.deepEqual([30, 55, 56, 85, 86, 200].map((t) => estrelasDesafio(t, DESAFIOS[6])), [3, 3, 2, 2, 1, 1]);
  assert.equal(BONUS.maxErros, 1); assert.equal(BONUS.perguntas, 7); assert.equal(bonusAberto({}, 'estudio'), false); assert.equal(bonusAberto({ 'estudio:12': 1 }, 'estudio'), true);
  assert.equal(MUNDOS[0].nome, 'Estúdio do Paul');
});
test('estrelas da fase = média das portas (1 a 3)', () => { assert.equal(estrelasFase([3, 3, 3]), 3); assert.equal(estrelasFase([3, 2]), 3); assert.equal(estrelasFase([2, 1, 1]), 1); assert.equal(estrelasFase([]), 0); });

test('quiz da fuga: definição do banco pergunta "qual termo" e o nível filtra o banco', async () => {
  const { question, temTexto } = await import('../js/tips.js'); const { filtraNivelBanco } = await import('../js/jogos/fuga-logic.js');
  const it = { n: 900001, text: 'os equipamentos que ficam no palco pra banda usar: amplificadores, bateria e teclado.', w: 'BACKLINE', shown: 'backline', banco: true, nivel: 'm', o: ['dueto', 'intro', 'coro'] };
  const q = question([it], 'blank'); assert.ok(temTexto(q.prompt)); assert.match(q.ask, /termo/); assert.equal(q.options.length, 4);
  assert.equal(temTexto('_____ .'), false);
  const lista = Array.from({ length: 20 }, (_, i) => ({ n: i, banco: true, nivel: i < 10 ? 'f' : 'd', text: 'x' }));
  assert.ok(filtraNivelBanco(lista, 'facil').every((x) => x.nivel === 'f')); assert.equal(filtraNivelBanco(lista, 'dificil').length, 20);
});

test('início da Fuga refeito: as fases 1 a 4 não têm quiz (jogos de tocar e ver primeiro) e o 1º quiz vem por último, fácil e sem "em inglês"', async () => {
  for (let n = 1; n <= 4; n++) assert.ok(!portasDaFase(0, n).some((p) => p.tipo === 'quiz'), `fase ${n} sem quiz`);
  const q5 = portasDaFase(0, 5).map((p) => p.tipo); assert.equal(q5[q5.length - 1], 'quiz');
  const lista = [...Array.from({ length: 12 }, (_, i) => ({ n: i, banco: true, nivel: 'f', text: 'como se diz “síncope” em inglês?' })), ...Array.from({ length: 12 }, (_, i) => ({ n: 100 + i, banco: true, nivel: 'f', text: 'a semínima dura 1 tempo' })), { n: 999, text: 'curiosidade solta' }];
  const { filtraNivelBanco } = await import('../js/jogos/fuga-logic.js'); const f = filtraNivelBanco(lista, 'facil'); assert.ok(f.every((x) => x.banco && !/inglês/.test(x.text)) && f.length === 12);
});
