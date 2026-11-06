// Duelo do Beat Hero: catálogo de músicas, andamento efetivo e quem venceu. Sem DOM.
import test from 'node:test'; import assert from 'node:assert/strict';
globalThis.document = { createElement: () => ({ setAttribute() {}, append() {}, style: {} }), addEventListener() {}, documentElement: { classList: { contains: () => false } } };
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem() {} };
const D = await import('../js/jogos/duelo-ritmo.js');
test('catálogo: 18 músicas prontas + as MIDI publicadas, com chaves iguais nos dois celulares', () => {
  const c = D.catalogo([{ id: 'pub-7', name: 'Sweet Child', bpm: 125 }]);
  assert.equal(c.prontas.length, 18); assert.equal(c.midis.length, 1); assert.equal(c.todas.length, 19);
  assert.equal(c.midis[0].key, 'midi:pub-7'); assert.equal(c.prontas[0].key, 'pre:rock:0'); assert.equal(c.prontas[0].bpm, 100);
  assert.equal(new Set(c.todas.map((x) => x.key)).size, 19);
});
test('andamento: % da música, mínimo 30 bpm', () => {
  assert.equal(D.bpmEfetivo({ bpm: 120 }, 100), 120); assert.equal(D.bpmEfetivo({ bpm: 120 }, 75), 90); assert.equal(D.bpmEfetivo({ bpm: 120 }, 150), 180); assert.equal(D.bpmEfetivo({ bpm: 40 }, 50), 30);
});
test('vencedor: maior pontuação; empate; sem resultado do outro não decide', () => {
  assert.equal(D.vencedor([{ score: 10 }, { score: 5 }]), 0); assert.equal(D.vencedor([{ score: 1 }, { score: 5 }]), 1);
  assert.equal(D.vencedor([{ score: 3 }, { score: 3 }]), -1); assert.equal(D.vencedor([{ score: 3 }, null]), null); assert.equal(D.vencedor(null), null);
});
test('estado inicial: ninguém pronto, sem resultados, rodada 1', () => {
  const s = D.estadoInicial({ pct: 100 }); assert.deepEqual(s.ready, [false, false]); assert.deepEqual(s.res, [null, null]); assert.equal(s.round, 1);
});
