import test from 'node:test'; import assert from 'node:assert/strict';
import { estrelasPorErros, estrelasGenius, estrelasMemoria, padsDe, sequenciaGenius, confere, caminho3x3, saoVizinhas, PARES, paresMemoria, cartasMemoria, formaPar, AREAS } from '../js/jogos/fuga-mini-logic.js';
import { NIVEIS, nivelDaFase, NIVEL_CFG, TIPOS, TIPOS_FASE, PORTAS_FASE, portasDaFase, faseCfg, estrelasPorta, NOME_TIPO, BONUS, FASES } from '../js/jogos/fuga-logic.js';
const rnd = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
test('estrelas pelos erros: 3 / 2 / 1, nunca menos de 1', () => {
  assert.deepEqual([0, 1, 2, 3, 99].map(estrelasGenius), [3, 2, 2, 1, 1]); assert.equal(estrelasPorErros(5, 0, 2), 1);
  assert.deepEqual([0, 2, 3, 8, 9, 40].map((e) => estrelasMemoria(e, 4)), [3, 3, 2, 2, 1, 1]);
});
test('genius: botões por área (sem verde), sequência da rodada e conferência', () => {
  assert.equal(padsDe('notas', 4).length, 4); assert.equal(padsDe('bateria', 6).length, 6); assert.ok(padsDe('bateria', 4).every((p) => p.som)); assert.ok(padsDe('notas', 6).every((p) => p.midi));
  for (const a of ['notas', 'bateria']) for (const p of padsDe(a, 6)) assert.ok(!/^#(3c|2e|4c|00)ff/i.test(p.cor) && !/^#[0-9a-f]{2}[c-f][0-9a-f]4[0-9a-f]$/i.test(p.cor), p.cor);
  const s = sequenciaGenius(8, 4, rnd()); assert.equal(s.length, 8); assert.ok(s.every((v) => v >= 0 && v < 4)); for (let i = 2; i < s.length; i++) assert.ok(!(s[i] === s[i - 1] && s[i] === s[i - 2]));
  assert.equal(confere([1, 2, 3], 0, 1), 'ok'); assert.equal(confere([1, 2, 3], 1, 0), 'erro'); assert.equal(confere([1, 2, 3], 2, 3), 'fim');
});
test('caminho 3×3: só anda pra casa do lado, sem repetir, no tamanho pedido', () => {
  for (const len of [2, 4, 5, 7, 9]) for (let t = 0; t < 30; t++) {
    const c = caminho3x3(len, rnd(t + 1)); assert.equal(c.length, len); assert.equal(new Set(c).size, len); assert.ok(c.every((x) => x >= 0 && x < 9));
    for (let i = 1; i < c.length; i++) assert.ok(saoVizinhas(c[i - 1], c[i]), `${c[i - 1]}->${c[i]}`);
  }
  assert.ok(saoVizinhas(0, 1) && saoVizinhas(0, 3) && !saoVizinhas(0, 4) && !saoVizinhas(2, 3));
});
test('memória: pares de 3 áreas, textos únicos, cartas embaralhadas e conferência', () => {
  const todos = AREAS.flatMap((a) => PARES[a]); assert.deepEqual(AREAS, ['ritmo', 'teoria', 'cordas']);
  const textos = todos.flatMap((p) => [p.sym ? `sym:${p.sym}` : p.a, p.b]); assert.equal(new Set(textos).size, textos.length, 'textos repetidos');
  for (const n of [4, 6, 8]) { const p = paresMemoria(n, rnd(3)); assert.equal(p.length, n); assert.deepEqual([...new Set(p.map((x) => x.area))].sort(), [...AREAS].sort()); }
  const p = paresMemoria(4, rnd(5)); const c = cartasMemoria(p, rnd(9)); assert.equal(c.length, 8); assert.equal(new Set(c.map((x) => x.id)).size, 8);
  const a = c.find((x) => x.par === 0 && x.lado === 'A'); const b = c.find((x) => x.par === 0 && x.lado === 'B'); const o = c.find((x) => x.par === 1 && x.lado === 'B');
  assert.equal(formaPar(a, b), true); assert.equal(formaPar(a, o), false); assert.equal(formaPar(a, a), false); assert.equal(formaPar(a, null), false);
});
test('níveis: fases 1-4 fácil, 5-8 médio, 9-12 difícil; mundos 2 e 3 sobem 1; desafios no mínimo médio; porta B difícil', () => {
  assert.deepEqual(NIVEIS, ['facil', 'medio', 'dificil']);
  assert.deepEqual([1, 4, 5, 8, 9, 12].map((n) => nivelDaFase(n, 0)), ['facil', 'facil', 'medio', 'medio', 'dificil', 'dificil']);
  assert.deepEqual([1, 5, 9].map((n) => nivelDaFase(n, 1)), ['medio', 'dificil', 'dificil']); assert.equal(nivelDaFase(6, 0), 'medio'); assert.equal(nivelDaFase(7, 0), 'medio'); assert.equal(BONUS.nivel, 'dificil');
  assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].palavras), [4, 6, 8]); assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].cruz), [4, 5, 6]);
  assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].genius.rodadas), [4, 6, 8]); assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].memoria.pares), [4, 6, 8]);
  assert.equal(faseCfg(0, 1).nivel, 'facil'); assert.equal(faseCfg(0, 12).palavras, 8); assert.equal(faseCfg(2, 1).palavras, 6);
});
test('desenho das portas: tipos por fase batem com PORTAS_FASE, tipos conhecidos, nada de quiz repetido nas fases de 4 portas', () => {
  assert.equal(TIPOS_FASE.length, FASES); TIPOS_FASE.forEach((t, i) => { assert.equal(t.length, PORTAS_FASE[i]); t.forEach((x) => assert.ok(TIPOS.includes(x) && NOME_TIPO[x], x)); });
  assert.deepEqual([11, 12].map((n) => new Set(TIPOS_FASE[n - 1]).size), [4, 4]);
  const todos = TIPOS_FASE.flat(); assert.equal(todos.length, 32); for (const t of TIPOS) assert.ok(todos.includes(t), `falta ${t}`);
  const por = (t) => todos.filter((x) => x === t).length; assert.ok(por('quiz') >= 6 && por('caca') >= 6 && por('cruz') >= 5, 'quiz, caça e cruzadinha continuam sendo os principais');
  assert.deepEqual(portasDaFase(0, 1).map((p) => p.tipo), ['quiz', 'memoria']); assert.deepEqual(portasDaFase(0, 8).map((p) => p.tipo), ['caminho', 'quiz', 'caca']);
  assert.ok(portasDaFase(0, 3).every((p) => p.nivel === 'facil') && portasDaFase(0, 10).every((p) => p.nivel === 'dificil'));
  assert.ok(portasDaFase(0, 3).filter((p) => p.tipo === 'genius').every((p) => ['notas', 'bateria'].includes(p.area)));
});
test('estrelas da porta: jogos de toque usam as estrelas calculadas pelos erros', () => {
  assert.deepEqual([3, 2, 1].map((e) => estrelasPorta('genius', { estrelas: e })), [3, 2, 1]); assert.equal(estrelasPorta('memoria', { estrelas: 0 }), 3); assert.equal(estrelasPorta('caminho', { estrelas: 9 }), 3);
});
