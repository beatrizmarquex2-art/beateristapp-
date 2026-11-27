import test from 'node:test'; import assert from 'node:assert/strict';
import * as M from '../js/pro/transcricao-motor.js';
const SR = 11025; const bpm = 100; const passo = 60 / bpm / 4;
const vazio = (s) => new Float32Array(Math.round(s * SR));
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
function somBd(x, t) { const i0 = Math.round(t * SR); for (let i = 0; i < 0.18 * SR && i0 + i < x.length; i++) { const tt = i / SR; x[i0 + i] += 0.9 * Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-tt * 40)) * tt) * Math.exp(-tt * 22); } }
function somSn(x, t) { const i0 = Math.round(t * SR); for (let i = 0; i < 0.14 * SR && i0 + i < x.length; i++) { const tt = i / SR; x[i0 + i] += (0.5 * rnd() * 0.8 + 0.5 * Math.sin(2 * Math.PI * 220 * tt)) * Math.exp(-tt * 30); } }
function somHh(x, t) { const i0 = Math.round(t * SR); let ant = 0; for (let i = 0; i < 0.04 * SR && i0 + i < x.length; i++) { const r = rnd(); const hp = r - ant; ant = r; x[i0 + i] += 0.35 * hp * Math.exp(-i / SR * 120); } }
const nota = (x, midi, t, d) => { const f = 440 * 2 ** ((midi - 69) / 12); const i0 = Math.round(t * SR); for (let i = 0; i < d * SR && i0 + i < x.length; i++) { const tt = i / SR; x[i0 + i] += 0.5 * (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(4 * Math.PI * f * tt)) * Math.min(1, tt * 80, (d - tt) * 80); } };

test('bateria: acha andamento e coloca bumbo/caixa/chimbal na grade', async () => {
  const x = vazio(4 * 16 * passo + 0.3);
  for (let b = 0; b < 4; b++) { const o = b * 16; for (const s of [0, 8]) somBd(x, (o + s) * passo); for (const s of [4, 12]) somSn(x, (o + s) * passo); for (let s = 0; s < 16; s += 2) somHh(x, (o + s) * passo); }
  const r = await M.bateria(x, SR);
  assert.ok(Math.abs(r.bpm - bpm) <= 3, `bpm ${r.bpm}`);
  const em = (p) => new Set(r.evs.filter((e) => e.p === p).map((e) => e.ini % 16));
  const bd = em('bd'), sn = em('sn'), hh = em('hh');
  assert.ok(bd.has(0) && bd.has(8), `bd ${[...bd]}`); assert.ok(sn.has(4) && sn.has(12), `sn ${[...sn]}`);
  assert.ok([0, 2, 4, 6, 8, 10, 12, 14].filter((s) => hh.has(s)).length >= 6, `hh ${[...hh]}`);
  assert.ok(![...bd].some((s) => s % 2), 'bumbo fora da grade');
});
test('bateria com bpm dado e silêncio não quebra', async () => {
  const r = await M.bateria(vazio(2), SR, { bpm: 90 }); assert.equal(r.evs.length, 0); assert.ok(r.avisos.length);
});
test('melodia: dó ré mi fá em semínimas', async () => {
  const x = vazio(4 * 4 * passo + 0.2); [60, 62, 64, 65].forEach((m, i) => nota(x, m, i * 4 * passo, 4 * passo * 0.92));
  const r = await M.melodia(x, SR, { bpm });
  assert.deepEqual(r.evs.map((e) => e.m), [60, 62, 64, 65], JSON.stringify(r.evs));
  assert.deepEqual(r.evs.map((e) => e.ini), [0, 4, 8, 12]); assert.ok(r.evs.every((e) => e.d === 4), JSON.stringify(r.evs));
});
test('melodia → violão põe cada nota numa corda e casa', () => {
  const cordas = [['mi', 64], ['si', 59], ['sol', 55], ['ré', 50], ['lá', 45], ['mi', 40]];
  const { evs, fora } = M.melodiaEmCordas([{ m: 60, ini: 0, d: 4 }, { m: 64, ini: 4, d: 4 }], cordas); assert.equal(fora, 0);
  assert.deepEqual(evs.map((e) => [e.c, e.f]), [[1, 1], [0, 0]]);
});
test('acordes: dó, sol, lá menor, fá — um por compasso', async () => {
  const x = vazio(4 * 16 * passo); const tri = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  tri.forEach((t, i) => t.forEach((m) => nota(x, m, i * 16 * passo, 16 * passo)));
  const r = await M.acordes(x, SR, { bpm }); assert.deepEqual(r.acordes, ['Dó', 'Sol', 'Láem', 'Fá'].map((s) => (s === 'Láem' ? 'Lám' : s)));
  assert.ok(r.evs.length >= 4 * 4);
});
