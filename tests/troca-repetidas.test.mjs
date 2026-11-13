// Quem já tinha figurinha repetida: cada cópia a mais vira uma carta nova que falta (pedido da Bea).
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import * as L from '../js/figurinhas/album-logic.js';
const cat = [...JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8')), ...JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo-paul.json', import.meta.url), 'utf8'))];
const sec = (c) => cat.find((x) => x.codigo === c).secao;

test('repetidas viram cartas novas: nada some, nada colado muda, e não sobra repetida', () => {
  const [a, b, c, d] = cat.slice(0, 4).map((x) => x.codigo);
  // pacotes antigos com repetição: a saiu 3 vezes, b 2 vezes; a já está colada
  const opened = { 'roleta:x:1': [a, b], 'roleta:x:2': [a, c], 'roleta:x:3': [a, b, d] };
  const state = { ...L.emptyState(), seed: 's1', granted: Object.keys(opened), opened, pasted: { [a]: true }, inv: L.deriveInv(opened, { [a]: true }) };
  assert.equal(L.repeated(state), 3); const naMao = L.inHand(state);
  const r = L.trocarRepetidas(state, cat); assert.equal(r.trocadas, 3);
  assert.equal(L.repeated(r.state), 0); assert.equal(L.inHand(r.state), naMao, 'a quantidade de cartas na mão é a mesma');
  assert.ok(r.state.pasted[a] && Object.keys(r.state.pasted).length === 1, 'o que estava colado continua colado');
  const todas = Object.values(r.state.opened).flat(); assert.equal(new Set(todas).size, todas.length, 'cada carta agora é única');
  for (const k of [a, b, c, d]) assert.ok(todas.includes(k), 'as originais continuam');
  assert.deepEqual(r.state.inv, L.deriveInv(r.state.opened, r.state.pasted), 'mão e pacotes continuam batendo (junta bem com outro aparelho)');
  assert.deepEqual(L.trocarRepetidas(state, cat).state.opened, r.state.opened, 'mesmo resultado se rodar de novo no mesmo estado');
  const de = L.trocarRepetidas(r.state, cat); assert.equal(de.trocadas, 0); assert.equal(de.state, r.state, 'sem repetida: não faz nada');
});
test('a carta nova vem do mesmo tipo quando ainda falta alguma dele', () => {
  const a = cat[0].codigo; const opened = { p1: [a], p2: [a] }; const state = { ...L.emptyState(), seed: 's2', granted: ['p1', 'p2'], opened, pasted: {}, inv: L.deriveInv(opened, {}) };
  const r = L.trocarRepetidas(state, cat); const nova = r.state.opened.p2[0]; assert.notEqual(nova, a); assert.equal(sec(nova), sec(a));
});
test('presente da Bea (dado:) não muda; álbum completo fica como está', () => {
  const a = cat[0].codigo; const opened = { 'dado:x': [a], 'roleta:y:1': [a] }; const state = { ...L.emptyState(), seed: 's3', granted: Object.keys(opened), opened, pasted: {}, inv: L.deriveInv(opened, {}) };
  const r = L.trocarRepetidas(state, cat); assert.deepEqual(r.state.opened['dado:x'], [a]); assert.notEqual(r.state.opened['roleta:y:1'][0], a);
  const tudo = { p: cat.map((x) => x.codigo), q: [a] }; const cheio = { ...L.emptyState(), seed: 's4', granted: ['p', 'q'], opened: tudo, pasted: {}, inv: L.deriveInv(tudo, {}) };
  const f = L.trocarRepetidas(cheio, cat); assert.equal(f.trocadas, 0); assert.equal(f.state, cheio);
});
