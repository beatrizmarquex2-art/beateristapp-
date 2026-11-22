import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/jogos/ouvido-logic.js';
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

test('3ª e 5ª: alvo = tônica + 4 (3ª maior) ou 3 (menor) ou 7 (5ª), sem 4 iguais seguidos', () => {
  for (const modo of ['maior', 'menor']) for (let s = 1; s < 80; s++) {
    const r = L.rodadaGrau({ modo, rnd: seeded(s) }); assert.equal(r.length, L.RODADAS);
    r.forEach((x, i) => { assert.equal(x.alvo - x.raiz, x.grau === 3 ? (modo === 'maior' ? 4 : 3) : 7); assert.ok(x.raiz >= 54 && x.raiz <= 66); if (i >= 3) assert.ok(!(r[i - 1].grau === x.grau && r[i - 2].grau === x.grau && r[i - 3].grau === x.grau)); });
  }
});
test('acordes: 3 opções distintas, a certa está nelas, midis batem com o tipo', () => {
  for (const nivel of ['f', 'm', 'd']) for (let s = 1; s < 60; s++) {
    const r = L.rodadaAcorde({ nivel, rnd: seeded(s) });
    r.forEach((x, i) => { assert.equal(new Set(x.opcoes).size, 3); assert.ok(x.opcoes.includes(x.alvo)); assert.equal(x.midis.length, 3); const menor = x.alvo.endsWith('m'); assert.equal(x.midis[1] - x.midis[0], menor ? 3 : 4); if (i) assert.notEqual(x.alvo, r[i - 1].alvo); });
  }
  assert.ok(L.rodadaAcorde({ nivel: 'f', rnd: seeded(3) }).every((x) => x.opcoes.every((o) => o.endsWith('M'))));
  const d = L.rodadaAcorde({ nivel: 'd', rnd: seeded(5) }); assert.ok(d.every((x) => { const pcs = x.opcoes.map((o) => parseInt(o, 10)); return new Set(pcs).size === 2; }));
});
test('maior ou menor: terça certa e nunca 4 iguais seguidos', () => {
  for (let s = 1; s < 60; s++) { const r = L.rodadaMaiorMenor({ rnd: seeded(s) }); r.forEach((x, i) => { assert.equal(x.midis[1] - x.midis[0], x.tipo === 'maior' ? 4 : 3); assert.equal(x.midis[2] - x.midis[0], 7); if (i >= 3) assert.ok(!r.slice(i - 3, i + 1).every((y) => y.tipo === x.tipo)); }); }
});
test('escalas: dó maior sobe e desce; teclas brancas só onde dá', () => {
  assert.deepEqual(L.escalaNotas(0, 'maior'), [60, 62, 64, 65, 67, 69, 71, 72]);
  assert.deepEqual(L.escalaNotas(0, 'maior', true), [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60]);
  assert.deepEqual(L.escalaNotas(9, 'menor').slice(0, 3), [57, 59, 60]); // lá menor
  assert.ok(L.tonicasBrancas('maior').join() === '0'); assert.ok(L.tonicasBrancas('menor').includes(9));
  assert.ok(L.tonicasBrancas('penta').includes(0) && L.tonicasBrancas('penta').includes(5));
  for (let pc = 0; pc < 12; pc++) for (const e of L.ESCALAS) { const n = L.escalaNotas(pc, e.id); assert.equal(n.at(-1) - n[0], 12); assert.ok(n[0] >= 48 && n.at(-1) <= 78); }
});
test('conferir nota e estrelas', () => {
  assert.ok(L.confere(60, 60, false) && !L.confere(48, 60, false) && L.confere(48, 60, true) && !L.confere(61, 60, true));
  assert.equal(L.estrelasAcertos(8, 8), 3); assert.equal(L.estrelasAcertos(7, 8), 2); assert.equal(L.estrelasAcertos(5, 8), 1); assert.equal(L.estrelasAcertos(4, 8), 0);
  assert.equal(L.estrelasEscala(0, true), 3); assert.equal(L.estrelasEscala(2, true), 2); assert.equal(L.estrelasEscala(5, true), 1); assert.equal(L.estrelasEscala(0, false), 0);
});
