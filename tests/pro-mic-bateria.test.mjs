import test from 'node:test'; import assert from 'node:assert/strict';
import { classifica, quantiza } from '../js/pro/mic-bateria.js';
const SR = 44100; const N = 2048;
// sinais sintéticos de cada peça (decaindo logo depois do ataque)
const seno = (f, k = 1) => Float32Array.from({ length: N }, (_, i) => k * Math.sin((2 * Math.PI * f * i) / SR) * Math.exp(-i / 700));
let seed = 1; const ruido = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * 2 - 1; };
const soma = (...a) => Float32Array.from({ length: N }, (_, i) => a.reduce((s, x) => s + x[i], 0));
const passaAlta = (x, fc) => { const a = Math.exp(-2 * Math.PI * fc / SR); let yp = 0; let xp = 0; return Float32Array.from(x, (v) => { const y = a * (yp + v - xp); yp = y; xp = v; return y; }); };
const ruidoBr = (g, tau) => Float32Array.from({ length: N }, (_, i) => g * ruido() * Math.exp(-i / tau));
test('bumbo (seno grave) é bd', () => assert.equal(classifica(seno(60), SR), 'bd'));
test('chimbal (ruído agudo curto) é hh', () => assert.equal(classifica(passaAlta(ruidoBr(1, 250), 6000), SR), 'hh'));
test('caixa (tom médio + ruído) é sn', () => assert.equal(classifica(soma(seno(190, 0.6), passaAlta(ruidoBr(0.5, 500), 900)), SR), 'sn'));
test('silêncio não é peça nenhuma', () => assert.equal(classifica(new Float32Array(N), SR), null));
test('quantiza: batida em 0,6 s a 100 bpm cai na semínima 1 (4) com grade 4', () => assert.equal(quantiza(0.6, 0, 100, 4), 4));
test('quantiza: grade de colcheia e nunca negativo', () => { assert.equal(quantiza(0.3, 0, 100, 2), 2); assert.equal(quantiza(-0.5, 0, 100, 2), 0); });
