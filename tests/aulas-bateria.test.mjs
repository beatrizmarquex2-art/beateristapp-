// Regras das aulas da bateria de toque: ritmos, tempos, acertos e estrelas.
import test from 'node:test'; import assert from 'node:assert/strict';
import * as A from '../js/jogos/aulas-bateria.js';

test('16 aulas, passos dentro do compasso e só peças que existem', () => {
  assert.equal(A.AULAS.length, 16);
  for (const a of A.AULAS) { assert.ok([8, 16].includes(a.n), a.id); assert.ok(a.bpm >= 50 && a.bpm <= 180, a.id); for (const p of A.ORDEM) assert.ok(a.p[p].every((i) => Number.isInteger(i) && i >= 0 && i < a.n), `${a.id}/${p}`); assert.ok(A.batidas(a).length > 0, a.id); }
  assert.equal(new Set(A.AULAS.map((a) => a.id)).size, 16);
});
const r5 = A.AULAS.find((a) => a.id === 'r05');
test('o We Will Rock You usa os dois toms e a caixa, e a Wake Me Up toca a 50 bpm', () => { const w = A.AULAS.find((a) => a.id === 'r10'); assert.deepEqual([...new Set(A.batidas(w).map((b) => b.p))].sort(), ['cx', 't1', 't2']); assert.equal(A.AULAS.find((a) => a.id === 'r15').bpm, 50); });
test('toque no tom conta certo quando a aula pede tom', () => { const w = A.AULAS.find((a) => a.id === 'r10'); const r = A.julga(w, A.batidas(w).map((b) => ({ t: b.t, p: b.p }))); assert.equal(r.hits, r.esperado); assert.equal(r.extras, 0); const errado = A.julga(w, A.batidas(w).map((b) => ({ t: b.t, p: b.p === 't1' ? 'bu' : b.p }))); assert.ok(errado.hits < errado.esperado); }); // chimbal 1 2 3 4 · caixa 2 4 · bumbo 1 3, 100 bpm
const bate = (a, bpm = a.bpm) => A.batidas(a, bpm).map((b) => ({ t: b.t, p: b.p }));
test('batidas em ordem, com o tempo certo (colcheia a 100 bpm = 0,3 s)', () => {
  assert.equal(A.passoSeg(r5), 0.3);
  const bs = A.batidas(r5); assert.equal(bs.length, 8); assert.ok(bs.every((b, i) => i === 0 || b.t >= bs[i - 1].t));
  assert.deepEqual(bs.filter((b) => b.p === 'cx').map((b) => Math.round(b.t * 1000) / 1000), [0.6, 1.8]);
});
test('tocar tudo certo = 100% e 3 estrelas', () => { const r = A.julga(r5, bate(r5)); assert.equal(r.hits, 8); assert.equal(r.extras, 0); assert.equal(A.nota([r, r, r]), 100); assert.equal(A.estrelas(100), 3); });
test('peça errada ou fora de hora não vale; toque sobrando derruba a nota', () => {
  const tap = bate(r5).map((x) => (x.p === 'cx' ? { ...x, p: 'bu' } : x)); // caixa tocada no bumbo
  const r = A.julga(r5, tap); assert.equal(r.hits, 6); assert.equal(r.extras, 2); assert.ok(A.nota([r]) < 80);
  const fora = A.julga(r5, bate(r5).map((x) => ({ ...x, t: x.t + 0.2 }))); assert.equal(fora.hits, 0); // 200 ms atrasado, a folga é menor
  const perto = A.julga(r5, bate(r5).map((x) => ({ ...x, t: x.t + 0.05 }))); assert.equal(perto.hits, 8);
});
test('a mesma batida não conta duas vezes', () => { const r = A.julga(r5, [...bate(r5), { t: 0, p: 'bu' }]); assert.equal(r.hits, 8); assert.equal(r.extras, 1); });
test('peça do kit vira peça da aula (chimbal aberto = chimbal; tom 1, tom 2 e surdo valem)', () => {
  assert.equal(A.AULA_DO_KIT.hh, 'ch'); assert.equal(A.AULA_DO_KIT.ho, 'ch'); assert.equal(A.AULA_DO_KIT.sn, 'cx'); assert.equal(A.AULA_DO_KIT.bd, 'bu'); assert.equal(A.AULA_DO_KIT.cr, 'cr'); assert.equal(A.AULA_DO_KIT.rd, 'rd'); assert.equal(A.AULA_DO_KIT.tt, 't1'); assert.equal(A.AULA_DO_KIT.mt, 't2'); assert.equal(A.AULA_DO_KIT.ft, 'su'); assert.equal(A.AULA_DO_KIT.xx, undefined);
});
test('estrelas 60/80/100', () => { assert.deepEqual([0, 59, 60, 79, 80, 99, 100].map(A.estrelas), [0, 0, 1, 1, 2, 2, 3]); });
test('folga entre 70 e 150 ms em qualquer andamento', () => { for (const a of A.AULAS) for (const b of [50, 100, 180]) { const f = A.folga(a, b); assert.ok(f >= 0.07 && f <= 0.15, `${a.id} ${b}`); } });

test('a aula vira ritmo do Beat Lab (partitura do app): peças nas linhas certas', () => {
  const w = A.AULAS.find((a) => a.id === 'r10'); const b = A.paraBeat(w);
  assert.equal(b.steps, 8); assert.equal(b.name, 'We Will Rock You'); assert.deepEqual(b.rows.tt, [1, 1, 0, 0, 1, 1, 0, 0]); assert.deepEqual(b.rows.mt, [1, 1, 0, 0, 1, 1, 0, 0]); assert.deepEqual(b.rows.sn, [0, 0, 1, 0, 0, 0, 1, 0]); assert.ok(b.rows.hh.every((x) => x === 0));
  for (const a of A.AULAS) { const bb = A.paraBeat(a); assert.ok([8, 16].includes(bb.steps), a.id); assert.equal(Object.values(bb.rows).reduce((s, r) => s + r.reduce((x, y) => x + y, 0), 0), A.batidas(a).length, a.id); }
});
test('cursor da partitura: do 1º ao último passo, da esquerda pra direita, dentro da pauta', () => {
  for (const a of A.AULAS) { let ant = 0; for (let i = 0; i < a.n; i++) { const x = A.xDoPasso(a, i); assert.ok(x > ant && x < 1, `${a.id} ${i}`); ant = x; } }
});
