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

import { ESPACOS, ESPACOS_PAGINA, PAGINAS, proximoEspaco, colar, descolar, praColar, coladas, paginaDe } from '../js/figurinhas/minhas-regras.js';
test('meu álbum: cola no primeiro espaço vazio ou no espaço escolhido, sem ocupar espaço cheio', () => {
  assert.equal(ESPACOS, ESPACOS_PAGINA * PAGINAS);
  let l = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.equal(proximoEspaco(l), 1); l = colar(l, 'a'); assert.equal(l[0].slot, 1); assert.equal(proximoEspaco(l), 2);
  l = colar(l, 'b', 9); assert.equal(l[1].slot, 9); assert.equal(paginaDe(9), 2);
  const igual = colar(l, 'c', 9); assert.equal(igual, l, 'espaço ocupado: nada muda');
  assert.equal(colar(l, 'a', 3), l, 'já colada: nada muda'); assert.equal(colar(l, 'x'), l, 'cartinha que não existe');
  assert.deepEqual(praColar(l).map((x) => x.id), ['c']); assert.deepEqual(coladas(l).map((x) => x.id), ['a', 'b']);
  l = descolar(l, 'a'); assert.equal(l[0].slot, undefined); assert.equal(proximoEspaco(l), 1);
  const cheio = Array.from({ length: ESPACOS }, (_, i) => ({ id: `k${i}`, slot: i + 1 })); assert.equal(proximoEspaco(cheio), 0); assert.equal(colar([...cheio, { id: 'z' }], 'z').find((x) => x.id === 'z').slot, undefined);
});
