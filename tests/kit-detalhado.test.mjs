import test from 'node:test'; import assert from 'node:assert/strict';
import * as B from '../js/beats.js';
import * as N from '../js/notation.js';
test('kit detalhado: 6 peças na ordem pedida', () => { assert.deepEqual(B.KIT_DETALHE.map((x) => x[0]), ['cr', 'rd', 'hh', 'sn', 'bd', 'hf']); });
test('setDet: põe nota com detalhe, tira se repetir o mesmo, ignora detalhe que não vale na peça', () => {
  let b = B.emptyBeat(16);
  b = B.setDet(b, 'sn', 3, 'f'); assert.equal(B.cell(b, 'sn', 3), 1); assert.equal(B.detOf(b, 'sn', 3), 'f');
  b = B.setDet(b, 'sn', 3, 'r'); assert.equal(B.detOf(b, 'sn', 3), 'r', 'troca de detalhe sem apagar');
  b = B.setDet(b, 'sn', 3, 'r'); assert.equal(B.cell(b, 'sn', 3), 0); assert.equal(B.detOf(b, 'sn', 3), '');
  b = B.setDet(b, 'bd', 0, 'c'); assert.equal(B.detOf(b, 'bd', 0), '', 'cúpula não vale no bumbo: vira nota normal'); assert.equal(B.cell(b, 'bd', 0), 1);
  b = B.setDet(b, 'rd', 2, 'c'); assert.equal(B.detOf(b, 'rd', 2), 'c'); b = B.setDet(b, 'hh', 4, 'o'); b = B.setDet(b, 'hh', 6, 'a');
  assert.equal(B.detOf(b, 'hh', 4), 'o'); assert.equal(B.detOf(b, 'hh', 6), 'a');
});
test('apagar a nota (toggle) leva o detalhe junto; limpar tudo zera os detalhes', () => {
  let b = B.setDet(B.emptyBeat(16), 'hh', 4, 'o'); b = B.toggle(b, 'hh', 4); assert.equal(B.detOf(b, 'hh', 4), ''); assert.equal(B.cell(b, 'hh', 4), 0);
  b = B.setDet(b, 'sn', 8, 'f'); assert.deepEqual(B.clear(b).det, {});
});
test('trocar 16 -> 8 mantém o detalhe das notas que caem no mesmo lugar', () => {
  let b = B.setDet(B.emptyBeat(16), 'sn', 4, 'f'); b = B.setDet(b, 'sn', 5, 'f'); const r = B.resize(b, 8);
  assert.equal(B.detOf(r, 'sn', 2), 'f'); assert.equal(B.cell(r, 'sn', 2), 1); assert.equal(r.det.sn[5], undefined);
});
test('pauta: cúpula vira losango, aro vira x com "aro", chimbal aberto ganha o círculo, fantasma ganha parênteses e acento só na nota', () => {
  let b = B.emptyBeat(16); b = B.setDet(b, 'rd', 0, 'c'); b = B.setDet(b, 'sn', 4, 'r'); b = B.setDet(b, 'hh', 8, 'o'); b = B.setDet(b, 'sn', 12, 'f'); b = B.setDet(b, 'cr', 2, 'a');
  const ops = N.layout(b, { full: true }).ops;
  assert.ok(ops.some((o) => o.t === 'head' && o.kind === 'diamond')); assert.ok(ops.some((o) => o.t === 'text' && o.s === 'aro'));
  assert.ok(ops.some((o) => o.t === 'circle' && !o.ring)); assert.ok(ops.some((o) => o.t === 'text' && o.s === '(')); assert.ok(ops.some((o) => o.t === 'acc'));
  assert.match(N.toSVG({ w: 100, h: 50, ops: [{ t: 'head', x: 10, y: 10, kind: 'diamond' }] }), /<path/);
});
