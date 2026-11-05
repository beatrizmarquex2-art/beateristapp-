import test from 'node:test';
import assert from 'node:assert/strict';
import { owedByStars, starsToNext, STARS_PER_CARD, CARDS } from '../js/kids/album-data.js';

test('a cada 5 estrelas de ritmo, 1 figurinha', () => {
  assert.equal(STARS_PER_CARD, 5);
  assert.equal(owedByStars(4, 0), 0);
  assert.equal(owedByStars(5, 0), 1);
  assert.equal(owedByStars(12, 0), 2);
  assert.equal(owedByStars(12, 2), 0); // já entregues não repetem
  assert.equal(owedByStars(undefined, undefined), 0);
});
test('faltam quantas estrelas pra próxima', () => {
  assert.equal(starsToNext(0), 5);
  assert.equal(starsToNext(3), 2);
  assert.equal(starsToNext(5), 5);
});
test('álbum tem cartas', () => assert.ok(CARDS.length > 20));
