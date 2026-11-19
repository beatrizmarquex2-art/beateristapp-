// Cara a cara musical em 3 e 4 celulares: saída de jogador (a maioria votou "continuar sem").
import { test } from 'node:test'; import assert from 'node:assert/strict';
import * as C from '../js/jogos/cara-musical/corrida.js';

const mesa = { modo: 'kids', cartas: [{ id: 'a', foto: 1 }, { id: 'b', foto: 1 }, { id: 'c', foto: 1 }] };
const base = (num = 4) => C.novoEstadoCorrida({ modo: 'kids', mesa, segredo: 'b', palpites: 2, num, nomes: ['Ana', 'Bia', 'Cris', 'Duda'] });
const lado = (p, ok, fim = true, e = 0) => ({ perguntas: Array.from({ length: p }, () => ({})), erros: Array.from({ length: e }, () => 'x'), terminou: fim, acertou: ok });

test('tirar: quem saiu vira "terminou sem acertar", não é esperado e fica no fim da classificação', () => {
  let e = base(3); e = C.aplicar(e, 0, lado(3, true)); e = C.aplicar(e, 1, lado(2, true));
  assert.equal(C.todosTerminaram(e), false);
  const t = C.tirar(e, [2]); assert.deepEqual(t.fora, [2]); assert.equal(t.prog[2].fim, true); assert.equal(t.prog[2].saiu, true); assert.equal(t.prog[2].ok, false);
  assert.equal(C.todosTerminaram(t), true, 'ninguém espera por quem saiu'); assert.equal(C.nAtivos(t), 2); assert.equal(C.terminaram(t), 2);
  assert.equal(C.vencedor(t), 1); assert.deepEqual(C.classificacao(t).map((x) => x.i), [1, 0, 2]); assert.equal(C.classificacao(t)[2].saiu, true);
  assert.equal(C.tirar(t, [2]), t, 'tirar de novo não muda nada');
});
test('quem saiu depois de acertar guarda o resultado mas não vence nem entra na disputa', () => {
  let e = base(3); e = C.aplicar(e, 0, lado(1, true)); e = C.aplicar(e, 1, lado(5, true)); e = C.aplicar(e, 2, lado(7, true));
  const t = C.tirar(e, [0]); assert.equal(t.prog[0].ok, true); assert.equal(t.prog[0].saiu, true);
  assert.equal(C.vencedor(t), 1, 'a Bia vence: a Ana saiu, mesmo com 1 pergunta');
  assert.deepEqual(C.classificacao(t).map((x) => x.i), [1, 2, 0]);
});
test('quem saiu não muda mais o próprio andamento; sobrar 1 só termina sozinho', () => {
  let e = base(3); e = C.tirar(e, [1, 2]); assert.equal(C.nAtivos(e), 1); assert.equal(C.todosTerminaram(e), false);
  assert.equal(C.aplicar(e, 1, lado(3, true)), e, 'o lugar 1 saiu: ignora');
  e = C.aplicar(e, 0, lado(4, true)); assert.equal(C.todosTerminaram(e), true); assert.equal(C.vencedor(e), 0);
});
test('primeiro ativo (quem manda na próxima rodada) pula quem saiu; a próxima rodada mantém quem saiu fora', () => {
  const e = C.tirar(base(4), [0]); assert.equal(C.primeiroAtivo(e), 1); assert.equal(C.primeiroAtivo(C.tirar(base(4), [0, 1])), 2);
  const r = C.proximaRodada(e, mesa, 'c'); assert.deepEqual(r.fora, [0]); assert.equal(r.prog[0].saiu, true); assert.equal(C.todosTerminaram(r), false); assert.equal(C.nAtivos(r), 3);
});
