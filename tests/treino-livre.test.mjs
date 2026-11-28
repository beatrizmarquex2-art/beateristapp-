import test from 'node:test';
import assert from 'node:assert/strict';
import { JOGOS, NIVEIS, OUTROS, nivelValido, jogoPorId, resumo } from '../js/jogos/treino-livre-logic.js';
import { TIPOS, NIVEL_CFG } from '../js/jogos/fuga-logic.js';

test('o treino livre tem TODOS os jogos da Fuga, uma vez cada', () => {
  assert.deepEqual([...JOGOS.map((j) => j.id)].sort(), [...TIPOS].sort());
  for (const j of JOGOS) { assert.ok(j.nome && j.desc && j.emoji && j.cor); assert.ok(j.mini !== !!j.duelo); }
});
test('níveis existem na configuração da Fuga', () => { for (const [k] of NIVEIS) assert.ok(NIVEL_CFG[k], k); assert.equal(nivelValido('xx'), 'medio'); assert.equal(nivelValido('dificil'), 'dificil'); });
test('atalhos pros outros treinos e busca por id', () => { assert.equal(OUTROS.length, 4); assert.ok(OUTROS.every((o) => o.href.startsWith('#/jogos/'))); assert.equal(jogoPorId('caca').duelo, true); assert.equal(jogoPorId('x'), null); });
test('resumo da rodada', () => { assert.equal(resumo({ erros: 0 }).bom, true); assert.match(resumo({ erros: 1 }).texto, /1 erro:/); assert.match(resumo({ erros: 3 }).texto, /3 erros/); assert.equal(resumo(null).erros, 0); });
