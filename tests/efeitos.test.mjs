import test from 'node:test';
import assert from 'node:assert/strict';
import { EFEITOS } from '../js/jogos/efeitos-dados.js';

test('efeitos: cada jogo tem nome, descrição e pelo menos 4 efeitos com sons válidos', () => {
  assert.deepEqual(Object.keys(EFEITOS).sort(), ['beat', 'bingo', 'cara', 'figuras', 'memoria', 'paulta', 'quebra', 'stop', 'toca', 'uno', 'velha']);
  for (const [id, j] of Object.entries(EFEITOS)) {
    assert.ok(j.nome && j.som, id); const nomes = Object.keys(j.efeitos); assert.ok(nomes.length >= 4, id);
    for (const [n, lista] of Object.entries(j.efeitos)) {
      assert.ok(lista.length >= 1, `${id}/${n}`);
      for (const e of lista) {
        assert.ok(e.t >= 0 && e.d > 0.01 && e.d < 1.5 && e.g > 0 && e.g <= 1, `${id}/${n} tempo, duração ou volume`);
        if (e.n != null) assert.ok(e.n >= 300 && e.n <= 12000, `${id}/${n} ruído`);
        else { assert.ok(['sine', 'triangle', 'square', 'sawtooth'].includes(e.w), `${id}/${n} onda`); assert.ok(e.f > 20 && e.f < 8000, `${id}/${n} frequência`); if (e.to) assert.ok(e.to > 20 && e.to < 8000); }
      }
    }
  }
});
