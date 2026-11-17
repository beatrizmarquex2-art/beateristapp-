import test from 'node:test'; import assert from 'node:assert/strict';
import { achaBateria, achaMelodia } from '../js/figurinhas/segredos-palco.js';
test('segredos da bateria', () => {
  assert.equal(achaBateria('acustica', 'FFFFS'), 'believer'); assert.equal(achaBateria('acustica', 'FTFTS'), 'wwry'); assert.equal(achaBateria('eletronica', 'xHHHHS'), 'sunflower'); assert.equal(achaBateria('acustica', 'HHHS'), null);
  assert.equal(achaBateria('cajon', 'FFFFS'), 'believer'); assert.equal(achaBateria('cajon', 'FFS'), 'wwry'); assert.equal(achaBateria('cajon', 'SSSSF'), 'sunflower');
});
test('dó ré mi fá fá fá em qualquer oitava', () => { assert.ok(achaMelodia([60, 62, 64, 65, 65, 65])); assert.ok(achaMelodia([1, 72, 74, 76, 77, 77, 77])); assert.ok(!achaMelodia([60, 62, 64, 65, 65])); assert.ok(!achaMelodia([60, 62, 64, 65, 65, 67])); });
