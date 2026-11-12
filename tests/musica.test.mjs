import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, melodia, nota } from '../js/jogos/musica.js';

test('cada jogo tem a sua música: temas e melodias diferentes, sempre a mesma pra mesma semente', () => {
  const ids = Object.keys(TEMAS); assert.ok(ids.length >= 11);
  const sig = (id) => JSON.stringify(melodia(TEMAS[id]).passos);
  assert.equal(new Set(ids.map(sig)).size, ids.length, 'melodias repetidas entre jogos');
  assert.equal(sig('toca'), sig('toca'));
  assert.equal(new Set(ids.map((id) => `${TEMAS[id].root}-${TEMAS[id].bpm}-${TEMAS[id].wave}`)).size >= 8, true);
});
test('melodia: 16 passos, começa em tempo forte, notas dentro de uma faixa agradável e baixo nos tempos fortes', () => {
  for (const [id, t] of Object.entries(TEMAS)) {
    const { passos, baixo } = melodia(t); assert.equal(passos.length, 16); assert.equal(baixo.length, 16);
    for (const i of [0, 4, 8, 12]) assert.ok(passos[i], `${id} sem nota no tempo ${i}`);
    for (const p of passos.filter(Boolean)) { const m = nota(t, p); assert.ok(m >= t.root - 1 && m <= t.root + 12 * 2 + 12, `${id} ${m}`); }
    assert.ok(baixo[0] && baixo[8]);
  }
});
