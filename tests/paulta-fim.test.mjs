import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { drawPack, packSize, plfPack } from '../js/figurinhas/album-logic.js';
import { merecidos, totalDoModo, TABELA } from '../js/paulta/recompensas.js';
const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../assets/figurinhas/${f}`, import.meta.url)));
const cat = [...rd('catalogo.json'), ...rd('catalogo-paul.json')]; const por = Object.fromEntries(cat.map((c) => [c.codigo, c]));
test('fim de modo da pauLta: 3 pacotinhos de 2 cartas = 2 Beatles + 3 comuns + 1 especial, por dificuldade', () => {
  for (const [modo, esp] of [['drumF', (c) => c.secao === 'Raras'], ['drumI', (c) => c.secao === 'Beaterista' && /^P/.test(c.codigo)], ['drumD', (c) => c.secao === 'Beaterista' && /^F/.test(c.codigo)]]) {
    const cartas = ['a', 'b', 'c'].flatMap((k) => { const id = `plf:${modo}:${k}:p1`; assert.equal(packSize(id), 2); assert.ok(plfPack(id)); const c = drawPack(cat, id, 3, 'seed'); assert.equal(c.length, 2); return c; }).map((x) => por[x]);
    assert.equal(cartas.length, 6); assert.equal(cartas.filter((c) => c.secao === 'Beatlemania').length, 2, `${modo}: 2 Beatles`); assert.equal(cartas.filter((c) => c.secao === 'Comum').length, 3, `${modo}: 3 comuns`); assert.equal(cartas.filter(esp).length, 1, `${modo}: 1 especial`);
  }
});
test('o mesmo pacote com a mesma semente dá as mesmas cartas; a tabela soma 6 cartas no fim', () => {
  assert.deepEqual(drawPack(cat, 'plf:drumD:c:p1', 3, 'x'), drawPack(cat, 'plf:drumD:c:p1', 3, 'x'));
  for (const w of ['drumF', 'drumI', 'drumD']) assert.equal(totalDoModo(w).fim, 6);
});
test('concluir o modo entrega os 3 pacotinhos de fim (ids plf) e só isso no fim', () => {
  const p = { done: {}, ph: {} }; for (let k = 1; k <= 12; k++) p.done[`drumD:${k}`] = true;
  const fim = merecidos(p, 'p1').filter((x) => x.fim); assert.deepEqual(fim.map((x) => x.id), ['plf:drumD:a:p1', 'plf:drumD:b:p1', 'plf:drumD:c:p1']);
});
