import test from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTOS, ORDEM, proximaNota, msPorNota, decoradas, atualizaRecorde, instrumentoValido, confere, OUVIR_DE_NOVO } from '../js/jogos/genius-logic.js';

test('instrumentos: pads, bateria com as peças do kit acústico, sem verde', () => {
  assert.deepEqual(ORDEM, ['xilofone', 'piano', 'bateria', 'violao']);
  assert.equal(INSTRUMENTOS.xilofone.pads.length, 8); assert.equal(INSTRUMENTOS.piano.pads.length, 8); assert.equal(INSTRUMENTOS.violao.pads.length, 6);
  assert.deepEqual(INSTRUMENTOS.bateria.pads.map((p) => p.id).sort(), ['bd', 'cr', 'ft', 'hh', 'mt', 'rd', 'sn', 'tt']);
  for (const k of ORDEM) for (const p of INSTRUMENTOS[k].pads) assert.ok(!/^#(3f|2f)?b27f$|#3fb27f/i.test(p.cor));
  assert.equal(instrumentoValido('xx'), 'xilofone'); assert.equal(instrumentoValido('piano'), 'piano');
});
test('a sequência cresce 1 por vez e nunca repete 3 iguais', () => {
  let seq = []; let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000; };
  for (let i = 0; i < 300; i++) { const antes = seq.length; seq = proximaNota(seq, 4, rnd); assert.equal(seq.length, antes + 1); assert.ok(seq[i] >= 0 && seq[i] < 4); }
  for (let i = 2; i < seq.length; i++) assert.ok(!(seq[i] === seq[i - 1] && seq[i] === seq[i - 2]));
  const forca = proximaNota([2, 2], 4, () => 0.5); assert.notEqual(forca[2], 2); // rnd cai em 2: tem que desviar
});
test('velocidade: começa 620, acelera e tem piso', () => {
  assert.equal(msPorNota(1), 620); assert.ok(msPorNota(5) < msPorNota(2)); assert.equal(msPorNota(100), 250); for (let r = 1; r < 60; r++) assert.ok(msPorNota(r + 1) <= msPorNota(r));
});
test('notas decoradas e recorde por instrumento', () => {
  assert.equal(decoradas(5, true), 4); assert.equal(decoradas(1, true), 0); assert.equal(decoradas(6, false), 6);
  let r = atualizaRecorde({}, 'piano', 4); assert.equal(r.novo, true); assert.equal(r.recs.piano, 4);
  r = atualizaRecorde(r.recs, 'piano', 3); assert.equal(r.novo, false); assert.equal(r.recs.piano, 4);
  r = atualizaRecorde(r.recs, 'bateria', 6); assert.deepEqual(r.recs, { piano: 4, bateria: 6 }); assert.equal(atualizaRecorde({}, 'x', 0).novo, false);
});
test('confere a sequência e há ouvir de novo limitado', () => {
  assert.equal(confere([1, 2, 3], 0, 1), 'ok'); assert.equal(confere([1, 2, 3], 2, 3), 'fim'); assert.equal(confere([1, 2, 3], 1, 0), 'erro'); assert.equal(OUVIR_DE_NOVO, 3);
});
