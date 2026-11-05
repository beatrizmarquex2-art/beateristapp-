import test from 'node:test'; import assert from 'node:assert/strict';
import { checkSpec, applyResult, blankGame, isUnlocked, statusOf, totalStars, doneIdx, allMedals } from '../js/campanha/engine.js';
import { THEMES, themeOf } from '../js/campanha/themes.js';
const mk = (n) => ({ id: 't', title: 'T', theme: 'cartas', missions: Array.from({ length: n }, (_, i) => ({ id: `t-${i}`, title: `m${i}`, goal: 'g', evaluate: (r) => ({ done: !!r.win, stars: r.stars || 1, summary: ['ok'], label: r.label }) })), medals: [{ id: 'x', title: 'X', desc: 'x', test: (g) => (g.m['t-1'] || {}).s === 3 }] });
test('checkSpec acha id repetido, falta de evaluate e sem missões', () => {
  assert.ok(checkSpec(mk(3)).ok); const bad = mk(2); bad.missions[1].id = 't-0'; assert.equal(checkSpec(bad).ok, false);
  const b2 = mk(2); delete b2.missions[0].evaluate; assert.equal(checkSpec(b2).ok, false); assert.equal(checkSpec({ id: 'x', missions: [] }).ok, false);
});
test('só a primeira missão começa aberta; a seguinte abre com ≥1 estrela', () => {
  const spec = mk(3); let g = blankGame(); assert.deepEqual(statusOf(spec, g).map((x) => x.unlocked), [true, false, false]);
  g = applyResult(g, spec, 't-0', { win: true, stars: 2 }).g; assert.deepEqual(statusOf(spec, g).map((x) => x.unlocked), [true, true, false]);
});
test('derrota não conclui, não dá estrela e não desbloqueia, mas conta a tentativa', () => {
  const spec = mk(3); const r = applyResult(blankGame(), spec, 't-0', { win: false, stars: 3 });
  assert.equal(r.done, false); assert.equal(r.stars, 0); assert.equal(isUnlocked(spec, r.g, 1), false); assert.equal(r.g.m['t-0'].n, 1); assert.equal(r.g.m['t-0'].s, 0);
});
test('melhor resultado nunca piora e gain só conta estrelas novas', () => {
  const spec = mk(2); let r = applyResult(blankGame(), spec, 't-0', { win: true, stars: 3 }); assert.equal(r.gain, 3); assert.equal(r.firstTime, true);
  r = applyResult(r.g, spec, 't-0', { win: true, stars: 1 }); assert.equal(r.g.m['t-0'].s, 3); assert.equal(r.gain, 0); assert.equal(r.firstTime, false);
  r = applyResult(r.g, spec, 't-0', { win: false }); assert.equal(r.g.m['t-0'].s, 3);
});
test('estrelas limitadas a 0..3 e concluída vale ao menos 1', () => {
  const spec = mk(1); assert.equal(applyResult(blankGame(), spec, 't-0', { win: true, stars: 99 }).stars, 3); assert.equal(applyResult(blankGame(), spec, 't-0', { win: true, stars: 0 }).stars, 1);
});
test('medalhas: gerais e do jogo, uma vez só, só quando o critério é real', () => {
  const spec = mk(2); let r = applyResult(blankGame(), spec, 't-0', { win: true, stars: 1 }); assert.deepEqual(r.newMedals.map((m) => m.id), ['first', 'half']); // com 2 missões, "meio caminho" = 1 missão
  r = applyResult(r.g, spec, 't-1', { win: true, stars: 3 }); assert.deepEqual(r.newMedals.map((m) => m.id).sort(), ['all', 'x'].sort());
  r = applyResult(r.g, spec, 't-1', { win: true, stars: 3 }); assert.deepEqual(r.newMedals, []); assert.equal(allMedals(spec).length, 5);
  assert.equal(totalStars(spec, r.g), 4); assert.equal(doneIdx(spec, r.g), 2);
});
test('missão desconhecida dá erro (nada de progresso fantasma)', () => { assert.throws(() => applyResult(blankGame(), mk(1), 'nada', {})); });
test('cada jogo tem o seu cenário, todos diferentes', () => {
  const ids = ['cartas', 'bingo', 'stop', 'velha', 'quebra', 'cara', 'memoria', 'monte', 'noritmo']; assert.equal(new Set(ids.map((i) => THEMES[i].name)).size, 9);
  for (const t of Object.values(THEMES)) { assert.ok(t.regions.length >= 3); assert.equal(new Set(t.regions.map((r) => r.id)).size, t.regions.length); }
  assert.equal(themeOf('???').id, 'cartas');
});
