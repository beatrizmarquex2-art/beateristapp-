import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrar, plano } from '../js/prof-logic.js';

const turma = [{ nome: 'Marina S.', code: 'AAAAAA' }, { nome: 'José Pedro', code: 'BBBBBB' }, { nome: 'Marcos', code: 'CCCCCC' }, { nome: 'Ana Júlia', code: 'DDDDDD' }];
test('plano: sem acento e minúsculo', () => assert.equal(plano('  José Á '), 'jose a'));
test('"mar" acha Marcos e Marina, em ordem de nome', () => assert.deepEqual(filtrar(turma, 'mar').map((x) => x.nome), ['Marcos', 'Marina S.']));
test('sem acento acha com acento', () => assert.deepEqual(filtrar(turma, 'jose').map((x) => x.code), ['BBBBBB']));
test('várias palavras valem em qualquer ordem', () => assert.deepEqual(filtrar(turma, 'pedro jo').map((x) => x.code), ['BBBBBB']));
test('vazio devolve a turma toda; sem turma devolve vazio', () => { assert.equal(filtrar(turma, '').length, 4); assert.deepEqual(filtrar(null, 'a'), []); });
test('ninguém com esse nome', () => assert.deepEqual(filtrar(turma, 'zzz'), []));
