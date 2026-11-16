import test from 'node:test';
import assert from 'node:assert/strict';
import { ofertas, sorteiaRodada, umsDaRodada, julgaRodada, estrelasAchar1, nivelDe, RODADAS, COMPASSOS } from '../js/jogos/achar1-logic.js';

const G16 = { id: 'a', name: 'A', steps: 16, bpm: 100 }; const G8 = { id: 'b', name: 'B', steps: 8, bpm: 170 };

test('pontos de entrada: fácil só em tempo inteiro, médio no "&", difícil em qualquer um', () => {
  assert.deepEqual(ofertas(16, 'tempo'), [4, 8, 12]);
  assert.deepEqual(ofertas(16, 'meio'), [2, 4, 6, 8, 10, 12, 14]);
  assert.equal(ofertas(16, 'qualquer').length, 15);
  assert.deepEqual(ofertas(8, 'tempo'), [2, 4, 6]);
  assert.ok(!ofertas(16, 'qualquer').includes(0), 'entrar no 1 não vale');
});

test('sorteio: andamento preso à faixa do nível e groove não repete o anterior', () => {
  const r = sorteiaRodada('f', [G8, G16], { rnd: () => 0 }); assert.equal(r.g.id, 'b'); assert.equal(r.bpm, 100);
  const r2 = sorteiaRodada('f', [G8, G16], { rnd: () => 0, ultimo: 'b' }); assert.equal(r2.g.id, 'a');
  for (let i = 0; i < 40; i++) { const x = sorteiaRodada('m', [G16, G8]); assert.ok(x.bpm >= 80 && x.bpm <= 115); assert.ok(x.offset > 0 && x.offset < x.g.steps); }
  assert.equal(nivelDe('xx').id, 'f');
});

test('onde estão os 1: 4 compassos, o primeiro depende do ponto de entrada', () => {
  const { uns, total, bar } = umsDaRodada({ bpm: 120, steps: 16, offset: 4 }); // semínima = 0,5 s, compasso = 2 s, entra no tempo 2
  assert.equal(bar, 2); assert.equal(total, 8); assert.equal(uns.length, COMPASSOS);
  assert.ok(Math.abs(uns[0] - 3 * 0.5) < 1e-9, 'faltam 3 tempos pro primeiro 1');
  assert.ok(Math.abs(uns[1] - uns[0] - 2) < 1e-9);
});

test('rodada: tocar nos 1 pontua; tocar solto ou calado não', () => {
  const rod = { g: G16, offset: 4, bpm: 120 }; const { uns } = umsDaRodada({ bpm: 120, steps: 16, offset: 4 });
  const bom = julgaRodada(uns.map((t) => t + 0.02), rod); assert.ok(bom.acertou); assert.equal(bom.hits, 4); assert.equal(bom.fora, 0);
  assert.ok(julgaRodada([uns[1], uns[2]], rod).acertou, 'achar em 2 compassos já vale');
  assert.ok(!julgaRodada([uns[1]], rod).acertou, 'só 1 acerto não vale');
  assert.ok(!julgaRodada([uns[0] + 0.25, uns[1] + 0.25, uns[2] + 0.25, uns[3] + 0.25], rod).acertou, 'tudo meio tempo fora');
  assert.ok(!julgaRodada([], rod).acertou);
  const ruim = julgaRodada([...uns, 0.2, 1.1, 3.9], rod); assert.ok(!ruim.acertou, 'acertou mas tocou em lugares demais'); assert.equal(ruim.toques.filter((x) => !x.ok).length, 3);
});

test('estrelas: 3 de 5 = 1, 4 de 5 = 2, 5 de 5 = 3', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(estrelasAchar1), [0, 0, 0, 1, 2, 3]); assert.equal(RODADAS, 5);
});
