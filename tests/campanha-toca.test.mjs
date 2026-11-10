import test from 'node:test';
import assert from 'node:assert/strict';
import { spec, starsFor, STAR_AT } from '../js/campanha/jogos/toca-spec.js';
import { checkSpec, applyResult, blankGame, isUnlocked } from '../js/campanha/engine.js';
import { PATH } from '../js/reading.js';

test('spec do Toca Aqui é válido: 20 missões (8 + 6 + 6), ids estáveis e únicos', () => {
  const c = checkSpec(spec); assert.deepEqual(c.errors, []); assert.ok(c.ok);
  assert.equal(spec.missions.length, 20);
  assert.deepEqual(['ini', 'int', 'ava'].map((t) => spec.missions.filter((m) => m.params.tier === t).length), [8, 6, 6]);
  assert.equal(spec.missions[0].id, 'toca-00'); assert.equal(spec.missions[19].id, 'toca-19');
});
test('cada missão usa a partitura do caminho do modo livre, andamento sobe dentro do modo', () => {
  spec.missions.forEach((m, i) => { assert.deepEqual(m.params.bar, PATH[i].bar); assert.ok(m.params.bpm >= 80 && m.params.bpm <= 120); });
  for (const t of ['ini', 'int', 'ava']) { const b = spec.missions.filter((m) => m.params.tier === t).map((m) => m.params.bpm); assert.deepEqual(b, [...b].sort((x, y) => x - y), t); }
});
test('estrelas: 70% = 1, 85% = 2, 95% = 3; abaixo de 70% não conclui', () => {
  assert.deepEqual(STAR_AT, [70, 85, 95]);
  assert.deepEqual([0, 69, 70, 84, 85, 94, 95, 100].map(starsFor), [0, 0, 1, 1, 2, 2, 3, 3]);
  assert.equal(starsFor(NaN), 0);
});
const res = (m, score, extra = {}) => ({ ok: true, score, hits: 4, total: 4, extra: 0, avgMs: 3, bpm: m.params.bpm, cells: m.params.bar.slice(), mic: false, ...extra });
test('evaluate: só conta resultado real da MESMA partitura e andamento', () => {
  const m = spec.missions[0];
  assert.equal(m.evaluate(res(m, 90)).done, true); assert.equal(m.evaluate(res(m, 90)).stars, 2); assert.equal(m.evaluate(res(m, 50)).done, false);
  assert.equal(m.evaluate(null).done, false); assert.equal(m.evaluate({ ...res(m, 99), ok: false }).done, false);
  assert.equal(m.evaluate({ ...res(m, 99), cells: spec.missions[1].params.bar }).done, false); assert.equal(m.evaluate({ ...res(m, 99), bpm: 999 }).done, false);
  assert.equal(m.evaluate(res(m, 80, { extra: 2, avgMs: -30 })).summary.length >= 2, true);
});
test('motor: concluir abre a próxima; missão trancada não abre sozinha; medalha do iniciante só com 3★ nos 8', () => {
  let g = blankGame(); assert.ok(isUnlocked(spec, g, 0)); assert.ok(!isUnlocked(spec, g, 1));
  g = applyResult(g, spec, 'toca-00', res(spec.missions[0], 75)).g; assert.ok(isUnlocked(spec, g, 1)); assert.ok(!isUnlocked(spec, g, 2));
  for (let i = 0; i < 8; i++) g = applyResult(g, spec, spec.missions[i].id, res(spec.missions[i], 97)).g;
  assert.ok(g.medals.includes('toca-ini')); assert.ok(!g.medals.includes('toca-int'));
  assert.ok(isUnlocked(spec, g, 8));
});
