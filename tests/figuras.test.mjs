import test from 'node:test';
import assert from 'node:assert/strict';
import { FIGS, GROUPS, figBySpec, specId, specOf, wrongSpecs, beatsLabel } from '../js/kids/figs.js';
import { figureQ, figKinds, figCount } from '../js/kids/quiz.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };

test('7 figuras, cada uma vale a metade da anterior; semínima = 1 tempo', () => {
  assert.deepEqual(FIGS.map((f) => f.id), ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia', 'fusa', 'semifusa']);
  for (let i = 1; i < FIGS.length; i++) assert.equal(FIGS[i].beats, FIGS[i - 1].beats / 2);
  assert.equal(FIGS.find((f) => f.id === 'seminima').beats, 1);
  assert.equal(beatsLabel(0.0625), '1/16 de tempo'); assert.equal(beatsLabel(0.5), 'meio tempo');
});
test('cada figura tem desenho único (cabeça, haste, bandeirinhas) e o código volta pra mesma figura', () => {
  assert.equal(new Set(FIGS.map(specId)).size, 7);
  for (const f of FIGS) { assert.equal(figBySpec(specOf(specId(f))).id, f.id); }
  assert.equal(figBySpec({ open: true, stem: false, flags: 2 }), undefined);
});
test('tercina = 3 notas no tempo de 2; sextina = 6 no tempo de 4', () => {
  assert.deepEqual(GROUPS.map((g) => [g.id, g.n, g.normal]), [['tercina', 3, 2], ['sextina', 6, 4]]);
});
test('desenhos errados nunca incluem o certo e não repetem', () => {
  for (const f of FIGS) for (let s = 1; s < 20; s++) { const w = wrongSpecs(f, seeded(s), 3); assert.ok(!w.includes(specId(f))); assert.equal(new Set(w).size, w.length); assert.ok(w.length >= 2, f.id); }
});
test('perguntas de figuras: resposta entre as opções, sem opção repetida, tipos liberados por fase', () => {
  for (let d = 0; d <= 10; d++) {
    const kinds = new Set();
    for (let s = 1; s <= 200; s++) {
      const q = figureQ(s % 2 ? Math.random : seeded(d * 1000 + s * 7919), d); kinds.add(q.kind);
      const ids = q.options.map((o) => o.id); assert.equal(new Set(ids).size, ids.length, `${d}/${q.kind} repetida`); assert.ok(ids.includes(q.ans), `${d}/${q.kind} sem resposta`);
      assert.ok(figKinds(d).includes(q.kind));
      if (q.fig) assert.ok(FIGS.findIndex((f) => f.id === q.fig) < figCount(d), `${d}/${q.kind} figura fora da fase`);
    }
    assert.ok(kinds.size >= Math.min(figKinds(d).length, 3), `fase ${d} pouco variada`);
  }
  assert.ok(!figKinds(0).includes('pausa') && figKinds(5).includes('pausa') && figKinds(8).includes('grupo'));
  assert.equal(figCount(0), 3); assert.equal(figCount(10), 7);
});
import { toquePattern, ecoTimes } from '../js/kids/groove.js';
test('toque as figuras: padrões válidos em todas as fases (4 ou 8 tempos, começa tocando, 3+ batidas)', () => {
  for (let d = 0; d <= 10; d++) for (let s = 1; s < 40; s++) {
    const p = toquePattern(d, seeded(d * 100 + s * 31)); assert.equal(p.cells.length, p.beats); assert.ok(p.beats === (d >= 9 ? 8 : 4));
    assert.notEqual(p.cells[0], '0000'); assert.ok(ecoTimes(p, 0).length >= 3);
    if (d <= 1) assert.ok(p.cells.every((c) => ['1000', '0000'].includes(c)));
  }
});
