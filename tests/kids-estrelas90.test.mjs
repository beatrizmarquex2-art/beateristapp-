// 3 ★ = 90% (não 100%) nos jogos de aprender; o "+1 giro a cada 4 fases" saiu (regra da Bea, nov/2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { starsFor } from '../js/kids/levels.js';
import * as E from '../js/figurinhas/estrelas.js';
import { merecidos } from '../js/paulta/recompensas.js';

test('3 ★ com 90% (9 de 10); 80% = 2 ★; 60% = 1 ★; abaixo = 0', () => {
  assert.deepEqual([[10, 10], [9, 10], [8, 10], [6, 10], [5, 10]].map(([a, b]) => starsFor(a, b)), [3, 3, 2, 1, 0]);
  assert.equal(starsFor(7, 8), 2); // 87,5%: ainda não
  assert.equal(starsFor(8, 8), 3);
});
test('não existe mais giro extra a cada 4 fases concluídas', () => {
  assert.equal(E.girosExtras, undefined); assert.equal(E.faltamFases3, undefined); assert.equal(E.fasesConcluidas, undefined);
});
test('pauLta: cartas do meio só contam fases com 3 ★ (fácil: 1 a cada 3 fases)', async () => {
  const S = await import('../js/paulta/score.js');
  const fase = (k, s) => [`drumF:${k}`, { done: true, s }];
  const mk = (estrelas) => { const done = {}; const ph = {}; estrelas.forEach((s, i) => { const k = i + 1; done[`drumF:${k}`] = true; ph[S.phKey('drumF', k, 'nomes')] = { s }; }); return { done, ph }; };
  const meioF = (p) => merecidos(p, 'x').filter((m) => /:m:/.test(m.id)).length;
  assert.equal(meioF(mk([3, 3, 2, 3, 3, 3])), 0 + 1 + 0, '5 fases com 3★ de 6 concluídas = só o marco 3');
  assert.equal(meioF(mk([2, 2, 2, 2, 2, 2])), 0, 'concluir com 2★ não rende carta do meio');
  void fase;
});
