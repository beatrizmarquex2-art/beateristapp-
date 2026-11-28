import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIAS, nomePublico, quadro, mesDe, progressoDeJogos, contaEstudos, baseDoMes, podio, anda, textoUnidade, categoriaPorId } from '../js/ranking-dados.js';

test('nome público: primeiro nome + inicial; nunca o nome inteiro', () => {
  assert.equal(nomePublico('maria clara SOUZA'), 'Maria S.'); assert.equal(nomePublico('Ana'), 'Ana'); assert.equal(nomePublico('  joão  pedro  '), 'João P.'); assert.equal(nomePublico(''), ''); assert.equal(nomePublico('Ana <b>x</b> Lima'), 'Ana L.');
  assert.ok(nomePublico('Bartolomeu de Albuquerque Cavalcanti').length <= 17);
});
test('quadros: do mês muda sozinho, de sempre não', () => {
  assert.equal(quadro('figurinhas', 'mes', new Date(2026, 10, 28)), 'rk|figurinhas|2026-11'); assert.equal(quadro('figurinhas', 'mes', new Date(2026, 11, 1)), 'rk|figurinhas|2026-12'); assert.equal(quadro('mundos', 'geral'), 'rk|mundos|geral'); assert.equal(mesDe(new Date(2027, 0, 5)), '2027-01');
});
test('mundos terminados e fases vencidas', () => {
  const est = {}; for (let i = 1; i <= 12; i++) est[`estudio:${i}`] = 1; est['estudio:B'] = 3; est['garagem:1'] = 2; est['garagem:2'] = 0; est['garagem:13'] = 3;
  assert.deepEqual(progressoDeJogos({ fuga: { est }, figurix: { est: { 'm1:1': 3, 'm1:2': 1 } }, quebra: { est } }), { fases: 12 + 1 + 2, mundos: 1 });
  assert.deepEqual(progressoDeJogos({}), { fases: 0, mundos: 0 }); assert.deepEqual(progressoDeJogos(null), { fases: 0, mundos: 0 });
});
test('estudos feitos', () => { assert.equal(contaEstudos([['a', 'b'], { x: 1, y: 2, z: 3 }, 4, null, undefined, 'x']), 9); assert.equal(contaEstudos(), 0); });
test('ranking do mês parte da contagem do início do mês', () => {
  let r = baseDoMes(null, '2026-11', { figurinhas: 40, estudos: 10 }); assert.deepEqual(r.mes, { figurinhas: 0, estudos: 0 });
  r = baseDoMes(r.base, '2026-11', { figurinhas: 47, estudos: 12 }); assert.deepEqual(r.mes, { figurinhas: 7, estudos: 2 });
  r = baseDoMes(r.base, '2026-12', { figurinhas: 50, estudos: 12 }); assert.deepEqual(r.mes, { figurinhas: 0, estudos: 0 }); assert.equal(r.base.mes, '2026-12');
  assert.equal(baseDoMes({ mes: '2026-11', figurinhas: 50, estudos: 5 }, '2026-11', { figurinhas: 40, estudos: 5 }).mes.figurinhas, 0);
});
test('pódio com 1º 2º 3º e o resto', () => {
  const p = podio([{ name: 'A', score: 9 }, { name: 'B', score: 7 }, { name: 'C', score: 5 }, { name: 'D', score: 4 }, { name: 'Z', score: 0 }]);
  assert.deepEqual(p.top3.map((x) => [x.pos, x.medalha, x.nome]), [[1, '🥇', 'A'], [2, '🥈', 'B'], [3, '🥉', 'C']]); assert.deepEqual(p.resto.map((x) => x.nome), ['D']); assert.deepEqual(podio([]), { top3: [], resto: [] });
});
test('setinhas dão a volta; categorias e unidades', () => {
  assert.equal(anda(0, -1), CATEGORIAS.length - 1); assert.equal(anda(CATEGORIAS.length - 1, 1), 0); assert.equal(textoUnidade(categoriaPorId('mundos'), 1), '1 mundo'); assert.equal(textoUnidade(categoriaPorId('mundos'), 3), '3 mundos'); assert.equal(categoriaPorId('x').id, 'mundos');
  assert.deepEqual(CATEGORIAS.filter((c) => c.mensal).map((c) => c.id), ['figurinhas', 'estudos']);
});
