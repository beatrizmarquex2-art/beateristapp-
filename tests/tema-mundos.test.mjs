import test from 'node:test';
import assert from 'node:assert/strict';
import { mundoDe } from '../js/campanha/mundos.js';

test('mundos coloridos: clarinho pra figuras e memória, amarelo pra monte e Toca Aqui, o resto fica como sempre', () => {
  for (const h of ['#/kids/figuras', '#/kids/figuras/3', '#/kids/memoria/aventura', '#/kids/memoria']) assert.equal(mundoDe(h), 'clarinho', h);
  for (const h of ['#/kids/ritmo/aventura', '#/jogos/toca', '#/jogos/toca/aventura/2']) assert.equal(mundoDe(h), 'amarelo', h);
  for (const h of ['#/paulta/drum', '#/paulta/sol', '#/jogos/stop', '#/kids', '#/kids/pecas', '#/jogos/tocar', '']) assert.equal(mundoDe(h), '', h);
});
