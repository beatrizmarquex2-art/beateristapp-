import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITE_IGUAIS, contaIguais } from '../js/figurinhas/minhas-regras.js';
test('no máximo 2 cartinhas da mesma foto no mesmo modelo de card', () => {
  assert.equal(LIMITE_IGUAIS, 2);
  const l = [{ fotoSig: 'a', modelo: 'M1' }, { fotoSig: 'a', modelo: 'M1' }, { fotoSig: 'a', modelo: 'M2' }, { fotoSig: 'b', modelo: 'M1' }];
  assert.equal(contaIguais(l, 'a', 'M1'), 2); // já chegou no limite: a terceira não entra
  assert.equal(contaIguais(l, 'a', 'M2'), 1); // outro modelo com a mesma foto: ainda cabe
  assert.equal(contaIguais(l, 'b', 'M1'), 1); // outra foto: ainda cabe
  assert.equal(contaIguais(l, '', 'M1'), 0); // sem como medir a foto: não bloqueia
  assert.equal(contaIguais([{ sig: 'x' }], 'a', 'M1'), 0); // cartinhas antigas (sem assinatura da foto) não contam
});
