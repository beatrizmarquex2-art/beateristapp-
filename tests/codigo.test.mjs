import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/codigo.js';

test('código novo: 6 caracteres sem letras que se confundem', () => { for (let i = 0; i < 200; i++) assert.match(C.gerar(), /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/); });
test('normaliza: maiúscula, sem espaço nem símbolo, até 12', () => { assert.equal(C.norm(' abc-123 '), 'ABC123'); assert.equal(C.norm('a'.repeat(20)).length, 12); });
test('importar lista: nome;código, tab, vírgula e só nome (gera código)', () => {
  const r = C.entender('Maria Souza ; K7M2QX\nJoão Pedro\tabc123\nAna Lima, hq9zt4\nCarlos\n\n  \nnome, código\n');
  assert.equal(r.rows.length, 4);
  assert.deepEqual(r.rows.slice(0, 3).map((x) => [x.nome, x.code, x.dado]), [['Maria Souza', 'K7M2QX', true], ['João Pedro', 'ABC123', true], ['Ana Lima', 'HQ9ZT4', true]]);
  assert.equal(r.rows[3].nome, 'Carlos'); assert.equal(r.rows[3].dado, false); assert.match(r.rows[3].code, /^[A-Z0-9]{6}$/);
});
test('código gerado nunca repete um que já existe nem outro da mesma lista', () => {
  const r = C.entender(Array.from({ length: 300 }, (_, i) => `aluno ${i}`).join('\n'), new Set(['AAAAAA']));
  assert.equal(new Set(r.rows.map((x) => x.code)).size, 300); assert.ok(!r.rows.some((x) => x.code === 'AAAAAA'));
});
test('linha só com nome parecido com código ("Maria") vira nome', () => { const r = C.entender('Maria'); assert.equal(r.rows[0].nome, 'Maria'); assert.equal(r.rows[0].dado, false); });
test('linha enorme é recusada', () => { const r = C.entender('x'.repeat(100)); assert.equal(r.rows.length, 0); assert.equal(r.bad.length, 1); });
