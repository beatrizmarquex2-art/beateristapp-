import test from 'node:test'; import assert from 'node:assert/strict';
import { brilho, separa, ladosDosToques } from '../js/kids/mic-timbre.js';
import { aprendeVazamento, ehVazamento } from '../js/kids/mic-vazamento.js';
const SR = 48000; let sem = 7; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647) - 0.5;
const golpe = (f, ruido = 0) => { const b = new Float32Array(2048); for (let i = 0; i < b.length; i++) b[i] = Math.exp(-i / 500) * (Math.sin(2 * Math.PI * f * i / SR) + ruido * rnd()); return b; };
const graves = () => Array.from({ length: 6 }, (_, i) => ({ buf: golpe(70 + i * 6) })); const agudos = () => Array.from({ length: 6 }, (_, i) => ({ buf: golpe(2200 + i * 150, 0.6) }));
test('brilho: agudo > grave', () => { assert.ok(brilho(golpe(3000)) > brilho(golpe(80)) + 1); assert.equal(brilho(new Float32Array(10)), null); });
test('separa lados: grave na direita e agudo na esquerda (padrão) e dá pra trocar', () => {
  const ev = []; for (let i = 0; i < 6; i++) ev.push(graves()[i], agudos()[i]);
  const l = ladosDosToques(ev); assert.deepEqual(l, ['D', 'E', 'D', 'E', 'D', 'E', 'D', 'E', 'D', 'E', 'D', 'E']);
  assert.equal(ladosDosToques(ev, { graveEm: 'E' })[0], 'E');
});
test('mesma batida nas duas mãos: não separa (aceita qualquer mão)', () => { const ev = [...graves(), ...graves()]; assert.equal(ladosDosToques(ev), null); assert.equal(separa([1, 1.1, 0.9, 1, 1.05]).ok, false); });
test('vazamento do clique: aprende na contagem e descarta só o que é clique', () => {
  const cl = [10, 10.5, 11, 11.5]; const ev = cl.map((c) => ({ raw: c + 0.08, level: 0.02 })); const v = aprendeVazamento(ev, cl); assert.ok(v && Math.abs(v.atraso - 0.08) < 1e-9);
  assert.equal(ehVazamento({ raw: 12.08, level: 0.02 }, [12], v), true);
  assert.equal(ehVazamento({ raw: 12.08, level: 0.2 }, [12], v), false, 'batida forte junto do clique passa');
  assert.equal(ehVazamento({ raw: 12.3, level: 0.02 }, [12], v), false, 'fora do horário do clique passa');
  assert.equal(aprendeVazamento([], cl), null); assert.equal(ehVazamento({ raw: 12.08, level: 0.02 }, [12], null), false);
});
import { buildChart, judgeOnsets, PERFEITO_MIC } from '../js/jogos/rudimentos-logic.js';
test('Rudimentix com microfone: lado trocado vira "mão trocada" e sem separação vale qualquer mão', () => {
  const mk = () => [{ t: 0, side: 'D' }, { t: 0.5, side: 'E' }, { t: 1, side: 'D' }, { t: 1.5, side: 'E' }];
  const a = mk(); judgeOnsets(a, [0, 0.5, 1, 1.5], 0.16, 0.2, { lados: ['D', 'E', 'D', 'E'], perfeito: PERFEITO_MIC }); assert.deepEqual(a.map((n) => n.res), ['perfeito', 'perfeito', 'perfeito', 'perfeito']);
  const b = mk(); judgeOnsets(b, [0, 0.5, 1, 1.5], 0.16, 0.2, { lados: ['E', 'E', 'D', 'D'] }); assert.deepEqual(b.map((n) => n.res), ['lado', 'perfeito', 'perfeito', 'lado']);
  const c = mk(); judgeOnsets(c, [0.08, 0.5, 1, 1.5], 0.16, 0.2, { lados: null, perfeito: PERFEITO_MIC }); assert.equal(c[0].res, 'perfeito', '80 ms de atraso ainda é perfeito no microfone');
  const d = mk(); judgeOnsets(d, [0, 0.5], 0.16, 0.2); assert.deepEqual(d.map((n) => n.res), ['perfeito', 'perfeito', 'faltou', 'faltou']);
});
