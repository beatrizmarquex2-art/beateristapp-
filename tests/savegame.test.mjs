import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, mergeSnap, encode, decode } from '../js/kids/savegame-logic.js';
import { CARDS } from '../js/kids/album-data.js';

const prog = { album: [CARDS[0].id, CARDS[3].id, 'fantasma'], lv: { 'figuras:0': { s: 2, p: 90, n: 3 } }, ritmoStars: 7, ritmoPaid: 1 };
test('ida e volta do código', async () => {
  const code = await encode(snapshot('Ana', prog));
  assert.ok(code.startsWith('BEA1-'));
  const s = await decode(code);
  assert.equal(s.n, 'Ana'); assert.deepEqual(s.a, [CARDS[0].id, CARDS[3].id]); assert.deepEqual(s.r, [7, 1]);
  assert.deepEqual(await decode(code.replace(/(.{20})/g, '$1 \n')), s); // espaços e quebras de linha não atrapalham
});
test('código errado ou mexido é recusado', async () => {
  const code = await encode(snapshot('Ana', prog));
  assert.equal(await decode(''), null); assert.equal(await decode('oi'), null);
  assert.equal(await decode(code.slice(0, -6)), null);
  assert.equal(await decode(code.slice(0, 20) + (code[20] === 'a' ? 'b' : 'a') + code.slice(21)), null);
});
test('restaurar junta e nunca tira', () => {
  const novo = { album: [CARDS[1].id], lv: { 'figuras:0': { s: 3, p: 100, n: 1 } }, ritmoStars: 2, ritmoPaid: 0 };
  const m = mergeSnap(novo, snapshot('Ana', prog));
  assert.deepEqual(new Set(m.album), new Set([CARDS[0].id, CARDS[1].id, CARDS[3].id]));
  assert.equal(m.lv['figuras:0'].s, 3); assert.equal(m.lv['figuras:0'].n, 3);
  assert.equal(m.ritmoStars, 7); assert.equal(m.ritmoPaid, 1);
});
