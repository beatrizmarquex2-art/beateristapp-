// Toca Aqui: avaliação dos toques em andamento rápido (turbo 170 BPM) e lento. Sem DOM.
import test from 'node:test'; import assert from 'node:assert/strict';
const R = await import('../js/reading.js');
const bar = ['1000', '1000', '1000', '1000']; // 4 semínimas (1 por tempo)
const tocar = (bpm, offsetMs, b = bar) => { const exp = R.onsets(b, bpm); return R.evaluate(exp.map((e) => e.t + offsetMs / 1000), exp, bpm); };
test('turbo (170 BPM): tocar certinho com 60 ms de atraso de tela NÃO vira "faltou"', () => {
  for (const off of [0, 30, 60, 70, -60]) { const r = tocar(170, off); assert.equal(r.hits, r.total, `offset ${off}`); assert.equal(r.extra, 0); assert.ok(r.score >= 60, `score ${r.score} com ${off} ms`); }
});
test('turbo: tocar no tempo exato dá 100%; 25 ms de erro ainda é "no tempo"', () => {
  assert.equal(tocar(170, 0).score, 100); assert.equal(tocar(170, 25).score, 100);
});
test('semicolcheias rápidas (turbo): cada toque cai na nota mais próxima, sem confundir', () => {
  const b = ['1111', '1111', '1111', '1111']; const r = tocar(170, 40, b); assert.equal(r.hits, 16); assert.equal(r.extra, 0);
});
test('lento continua exigente: 100 ms de atraso em 60 BPM não é "no tempo", e toque sem nota é extra', () => {
  const r = tocar(60, 100); assert.ok(r.score < 100); const exp = R.onsets(bar, 60); const e = R.evaluate([...exp.map((x) => x.t), exp[0].t + 0.5], exp, 60); assert.ok(e.extra >= 1);
});
test('turbo: atraso constante do aparelho (70 ms) é descontado e dá 100%, mas toque bagunçado não ganha de graça', () => {
  const r = tocar(170, 70); assert.equal(r.score, 100); assert.equal(r.ajuste, 70);
  const exp = R.onsets(bar, 170); const ruim = R.evaluate(exp.map((e, i) => e.t + (i % 2 ? 0.07 : -0.07)), exp, 170); assert.ok(!ruim.ajuste, 'desvios opostos: não é atraso do aparelho'); assert.ok(ruim.score < 100);
  assert.equal(tocar(90, 70).ajuste, undefined, 'abaixo de 130 BPM não ajusta');
});
