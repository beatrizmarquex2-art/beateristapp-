import test from 'node:test';
import assert from 'node:assert/strict';
import { ler, marcar, cumprida, sequencia, METAS } from '../js/estudos-meta.js';
import { DICAS_MUSICAIS, dicaDeHoje } from '../js/estudos-dicas.js';
import { CURIOSIDADES } from '../js/curiosidades.js';
const mem = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };
test('meta: 3 coisas fecham o dia e somam 1 na sequência (uma vez só)', () => {
  const st = mem(); const d = new Date(2026, 10, 10);
  for (const id of ['dica', 'aula', 'curiosidade', 'dica', 'aula']) marcar(id, st, d);
  const s = ler(st, d); assert.ok(cumprida(s)); assert.equal(s.seq, 1);
});
test('meta: id inválido não conta e o dia seguinte zera as metas mas mantém a sequência', () => {
  const st = mem(); const d1 = new Date(2026, 10, 10), d2 = new Date(2026, 10, 11);
  marcar('xis', st, d1); assert.equal(ler(st, d1).feitas.length, 0);
  for (const [k] of METAS) marcar(k, st, d1);
  const s = ler(st, d2); assert.equal(s.feitas.length, 0); assert.equal(sequencia(s, d2), 1);
  for (const [k] of METAS) marcar(k, st, d2); assert.equal(ler(st, d2).seq, 2);
});
test('meta: pular um dia zera a sequência', () => {
  const st = mem(); for (const [k] of METAS) marcar(k, st, new Date(2026, 10, 10));
  const d = new Date(2026, 10, 13); assert.equal(sequencia(ler(st, d), d), 0);
});
test('conteúdo: dicas e curiosidades bem formadas, dica do dia dentro do intervalo', () => {
  for (const [t, x] of DICAS_MUSICAIS) assert.ok(t && x.length > 30);
  for (const [n, i, x] of CURIOSIDADES) assert.ok(n && i && x.length > 40);
  const i = dicaDeHoje(new Date(2026, 10, 10)); assert.ok(i >= 0 && i < DICAS_MUSICAIS.length);
});
