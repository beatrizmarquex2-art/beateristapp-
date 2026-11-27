import test from 'node:test'; import assert from 'node:assert/strict';
import * as T from '../js/pro/teoria.js'; import * as R from '../js/pro/ritmo.js';
const V = R.cordasDe('violao', 6);
test('naEscala: dó maior tem dó e não tem dó♯; "todas" tem tudo', () => { assert.ok(T.naEscala(60, 0, 'maior')); assert.ok(!T.naEscala(61, 0, 'maior')); assert.ok(T.naEscala(61, 0, 'todas')); });
test('naEscala respeita a tônica (lá menor pentatônica tem o sol, não tem o fá♯)', () => { assert.ok(T.naEscala(67, 9, 'pentamenor')); assert.ok(!T.naEscala(66, 9, 'pentamenor')); });
test('ehTonica em qualquer oitava', () => { assert.ok(T.ehTonica(48, 0)); assert.ok(T.ehTonica(76, 4)); assert.ok(!T.ehTonica(61, 0)); });
test('transpoeCordas: sobe 2 casas na mesma corda', () => { const r = T.transpoeCordas([{ c: 0, f: 3, ini: 0, d: 4 }], V, 2); assert.equal(r.evs[0].f, 5); assert.equal(r.evs[0].c, 0); });
test('transpoeCordas: passa do braço e muda de corda; sem lugar, a nota sai', () => {
  const r = T.transpoeCordas([{ c: 1, f: 23, ini: 0, d: 4 }], V, 4); assert.equal(r.perdeu, 0); assert.equal(R.midiDe(V, r.evs[0].c, r.evs[0].f), 59 + 23 + 4);
  assert.equal(T.transpoeCordas([{ c: 0, f: 24, ini: 0, d: 4 }], V, 40).perdeu, 1);
});
test('transpoeCordas: descer abaixo da corda solta muda de corda', () => { const r = T.transpoeCordas([{ c: 0, f: 0, ini: 0, d: 4 }], V, -5); assert.equal(R.midiDe(V, r.evs[0].c, r.evs[0].f), 59); });
test('transpoeTeclas respeita os limites do piano', () => { const r = T.transpoeTeclas([{ m: 60, ini: 0, d: 4 }, { m: 107, ini: 4, d: 4 }], 12); assert.equal(r.evs.length, 1); assert.equal(r.perdeu, 1); assert.equal(r.evs[0].m, 72); });
test('acorde de Dó maior vira 5 notas (corda grave não toca) com a cifra na 1ª', () => {
  const ev = T.acordeEmEventos(T.acharAcorde('0M'), 8, 4); assert.equal(ev.length, 5); assert.equal(ev[0].cif, 'Dó'); assert.equal(ev.filter((e) => e.cif).length, 1); assert.ok(ev.every((e) => e.ini === 8 && e.d === 4));
  const midis = ev.map((e) => R.midiDe(V, e.c, e.f)).sort((a, b) => a - b); assert.deepEqual(midis, [48, 52, 55, 60, 64]);
});
test('acorde em guitarra de 8 cordas usa as mesmas cordas de cima', () => { const ev = T.acordeEmEventos(T.acharAcorde('4m'), 0, 4, 8); assert.equal(ev.length, 6); assert.ok(ev.every((e) => e.c <= 5)); });
test('cifra de menor leva "m"', () => assert.equal(T.cifraDe(T.acharAcorde('9m')), 'Lám'));
