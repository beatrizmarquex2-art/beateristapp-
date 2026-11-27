import test from 'node:test'; import assert from 'node:assert/strict';
import * as F from '../js/pro/ferr-logic.js';
test('tapBpm: 500 ms entre toques = 120 bpm', () => assert.equal(F.tapBpm([0, 500, 1000, 1500]), 120));
test('tapBpm: precisa de 2 toques', () => assert.equal(F.tapBpm([100]), null));
test('tapBpm: pausa longa recomeça a conta', () => assert.equal(F.tapBpm([0, 300, 5000, 5600, 6200]), 100));
test('limitaBpm respeita os limites', () => { assert.equal(F.limitaBpm(5), 30); assert.equal(F.limitaBpm(999), 260); assert.equal(F.limitaBpm('abc'), 100); });
test('alvo: 110 Hz no violão é o Lá, afinado', () => { const a = F.alvo(110, F.AFINACOES.violao.cordas); assert.equal(a.nome, 'A'); assert.ok(F.afinado(a.cents)); });
test('alvo: Lá um pouco alto mostra cents positivos', () => { const a = F.alvo(113, F.AFINACOES.violao.cordas); assert.equal(a.nome, 'A'); assert.ok(a.cents > 30); });
test('alvo cromático acha a nota', () => { const a = F.alvo(440, null); assert.equal(a.midi, 69); assert.equal(F.nomeNota(a.midi), 'lá'); assert.equal(a.cents, 0); });
