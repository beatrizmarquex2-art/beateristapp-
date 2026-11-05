import test from 'node:test';
import assert from 'node:assert/strict';
import { entender } from '../js/codigo.js';

test('mesmo código com nome diferente gera código novo; nome igual mantém', () => {
  const ja = new Set(['K7M2QX']); const nomes = new Map([['K7M2QX', 'Pedro']]);
  const a = entender('Lucas ; K7M2QX', ja, nomes).rows[0];
  assert.notEqual(a.code, 'K7M2QX'); assert.equal(a.nome, 'Lucas'); assert.equal(a.dado, false); assert.equal(a.trocou.codigoAntigo, 'K7M2QX');
  const b = entender('pedro ; K7M2QX', ja, nomes).rows[0];
  assert.equal(b.code, 'K7M2QX'); assert.equal(b.dado, true);
  const c = entender('Lucas ; K7M2QX', ja).rows[0]; assert.equal(c.code, 'K7M2QX'); // sem nomes conhecidos: igual a antes
});
