import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSOS, estado, travado, progresso } from '../js/campanha/trilha.js';

test('trilha: ordem certinha e só o primeiro passo aberto no começo', () => {
  assert.deepEqual(PASSOS.map((p) => p.id), ['memoria', 'figuras', 'paulta-bateria', 'monte', 'toca', 'paulta-claves', 'paulta-duelo']);
  const e = estado({}); assert.deepEqual(e.map((x) => x.aberto), [true, false, false, false, false, false, false]);
  assert.equal(e[0].atual, true); assert.equal(e.filter((x) => x.atual).length, 1);
});
test('trilha: terminar um passo abre o próximo e passa o "atual" adiante', () => {
  const e = estado({ memoria: true, figuras: true });
  assert.deepEqual(e.filter((x) => x.aberto).map((x) => x.id), ['memoria', 'figuras', 'paulta-bateria']);
  assert.equal(e.find((x) => x.atual).id, 'paulta-bateria');
  assert.equal(travado({ memoria: true }, 'figuras'), false); assert.equal(travado({ memoria: true }, 'monte'), true);
});
test('trilha: pular um passo não destranca os de depois; progresso conta os feitos', () => {
  assert.equal(travado({ memoria: true, monte: true }, 'toca'), false); // o monte foi feito, então o toca abre
  assert.equal(travado({ memoria: true, monte: true }, 'figuras'), false);
  assert.equal(travado({ memoria: true }, 'toca'), true);
  assert.deepEqual(progresso({ memoria: true, figuras: true }), { feitos: 2, total: 7 });
});
