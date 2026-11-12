import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, onsets } from '../js/reading.js';

const bar = ['1000', '1010', '1000', '1000']; const bpm = 100; const exp = onsets(bar, bpm); const taps0 = exp.map((e) => e.t);
test('microfone: atraso constante de 120 ms (normal no iPhone) é descontado e dá 100%', () => {
  const r = evaluate(taps0.map((t) => t + 0.12), exp, bpm, { mic: true });
  assert.equal(r.score, 100); assert.ok(Math.abs(r.ajuste - 120) <= 10, String(r.ajuste));
});
test('na tela (sem microfone) o atraso NÃO é descontado: 120 ms de atraso não dá nota', () => {
  const r = evaluate(taps0.map((t) => t + 0.12), exp, bpm, { mic: false }); assert.ok(r.score < 60 && r.ajuste == null);
});
test('microfone sem atraso continua igual (sem ajuste) e toque bagunçado não ganha de graça', () => {
  assert.equal(evaluate(taps0, exp, bpm, { mic: true }).ajuste, undefined);
  const bag = evaluate([0.02, 0.31, 0.9, 1.4, 1.75, 2.2], exp, bpm, { mic: true }); assert.ok(bag.score < 70, String(bag.score));
});
