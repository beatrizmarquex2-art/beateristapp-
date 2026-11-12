import test from 'node:test';
import assert from 'node:assert/strict';
import { pergunta, variantes } from '../js/jogos/detetive-logic.js';

test('infantil e normal: 4 opções diferentes e o certo está entre elas', () => {
  for (const [modo, lv] of [['infantil', 1], ['normal', 1], ['normal', 2], ['normal', 3]]) for (let i = 0; i < 40; i++) {
    const q = pergunta(modo, lv); assert.equal(q.opts.length, 4); assert.equal(new Set(q.opts.map((o) => o.join())).size, 4);
    assert.equal(q.opts[q.ok].join(), q.bar.join()); assert.ok(q.opts.every((o) => o.length === 4));
  }
});
test('variantes: nunca repete o certo', () => { const v = variantes(['1000', '1010', '1000', '0000'], ['1000', '1010', '0000', '1111']); assert.equal(v.length, 3); assert.ok(v.every((b) => b.join() !== '1000,1010,1000,0000')); });
