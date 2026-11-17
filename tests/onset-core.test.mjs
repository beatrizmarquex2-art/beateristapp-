// Detector de ataques do microfone: pega golpe seco (palma/pad), nota de teclado (ataque suave, repetida por cima da anterior) e não dispara com ruído de fundo.
import test from 'node:test'; import assert from 'node:assert/strict';
import { OnsetCore } from '../js/onset-core.js';
const SR = 48000; let sem = 11; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647) - 0.5;
const rodar = (sinal) => { const core = new OnsetCore(SR); const out = []; for (let i = 0; i < sinal.length; i += 128) out.push(...core.push(sinal.subarray(i, i + 128), i / SR)); return out; };
const sinal = (dur, fn) => { const b = new Float32Array(Math.round(dur * SR)); for (let i = 0; i < b.length; i++) b[i] = fn(i / SR); return b; };
test('ruído de fundo baixinho não gera ataque', () => { assert.equal(rodar(sinal(3, () => rnd() * 0.002)).length, 0); });
test('golpe seco (palma/pad) a cada 0,5 s: pega os 6', () => {
  const s = sinal(3.2, (t) => { const k = t % 0.5; return Math.exp(-k * 30) * rnd() * 0.8 + rnd() * 0.0005; }); const e = rodar(s); assert.ok(e.length >= 6 && e.length <= 7, `achou ${e.length}`);
});
test('teclado com som baixo e ataque suave, mesma nota repetida a cada 0,5 s: pega pelo menos 6 de 7', () => {
  const s = sinal(3.6, (t) => { const k = t % 0.5; const att = Math.min(1, k / 0.02); return 0.03 * att * Math.exp(-k * 2.2) * Math.sin(2 * Math.PI * 440 * t) + 0.04 * Math.exp(-(t) * 0.3) * 0 + rnd() * 0.0004; }); const e = rodar(s); assert.ok(e.length >= 6 && e.length <= 8, `achou ${e.length}`);
});
test('teclado MUITO baixinho (pico 0,008) também é ouvido', () => {
  const s = sinal(3.6, (t) => { const k = t % 0.5; return 0.008 * Math.min(1, k / 0.015) * Math.exp(-k * 2) * Math.sin(2 * Math.PI * 330 * t) + rnd() * 0.0003; }); assert.ok(rodar(s).length >= 6);
});
