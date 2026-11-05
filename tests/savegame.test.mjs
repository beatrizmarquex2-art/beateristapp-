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
import { normCode, resumo, figSnap, mergeFig } from '../js/kids/savegame-logic.js';
test('código BEA-0000 aceita jeitos diferentes de digitar', () => {
  assert.equal(normCode('BEA-0042'), 'BEA-0042'); assert.equal(normCode(' bea 42x '), ''); assert.equal(normCode('bea 0042'), 'BEA-0042');
  assert.equal(normCode('0042'), 'BEA-0042'); assert.equal(normCode('123'), ''); assert.equal(normCode('12345'), '');
});
test('resumo pra confirmar', () => assert.deepEqual(resumo({ n: 'Ana', a: ['x', 'y'], l: { f: [3, 1, 1], g: [2, 1, 1] } }), { nome: 'Ana', figurinhas: 2, estrelas: 5 }));

test('álbum de 125: salva e junta sem perder nada', () => {
  const a = { pasted: { F001: true }, inv: { F002: 1 }, granted: ['welcome:1', 'daily:1'], opened: { 'welcome:1': ['F001'] } };
  const snap = figSnap(a);
  assert.deepEqual(snap, { p: ['F001'], i: { F002: 1 }, g: ['welcome:1', 'daily:1'], o: ['welcome:1'] });
  const novo = { pasted: { F009: true }, inv: { F002: 3 }, granted: ['daily:2'], opened: {} };
  const m = mergeFig(novo, snap);
  assert.deepEqual(Object.keys(m.pasted).sort(), ['F001', 'F009']);
  assert.equal(m.inv.F002, 3);
  assert.deepEqual(new Set(m.granted), new Set(['daily:2', 'welcome:1', 'daily:1']));
  assert.ok(m.opened['welcome:1'] && !m.opened['daily:2']); // pacote já aberto no outro celular não é entregue de novo
  assert.equal(mergeFig(novo, null), novo);
});
test('resumo conta as coladas do álbum de 125', () => assert.equal(resumo({ n: 'Ana', a: [], l: {}, f: { p: ['F1', 'F2', 'F3'] } }).figurinhas, 3));
