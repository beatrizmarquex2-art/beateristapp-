// Cara a cara musical em 3 e 4 celulares (corrida pela mesma carta do Paul): regras puras.
import { test } from 'node:test'; import assert from 'node:assert/strict';
import * as C from '../js/jogos/cara-musical/corrida.js';

const mesa = { modo: 'kids', cartas: [{ id: 'a', foto: 1 }, { id: 'b', foto: 1 }, { id: 'c', foto: 1 }] };
const base = (num = 4) => C.novoEstadoCorrida({ modo: 'kids', mesa, segredo: 'b', palpites: 2, num, nomes: ['Ana', 'Bia', 'Cris', 'Duda'] });
const lado = (p, ok, fim = true, e = 0) => ({ perguntas: Array.from({ length: p }, () => ({})), erros: Array.from({ length: e }, () => 'x'), terminou: fim, acertou: ok });

test('estado novo: n de 3 a 4, nomes, andamento zerado, só JSON', () => {
  const e = base(); assert.equal(e.n, 4); assert.equal(e.prog.length, 4); assert.deepEqual(e.nomes, ['Ana', 'Bia', 'Cris', 'Duda']); assert.ok(C.valida(e));
  assert.equal(base(3).prog.length, 3); assert.equal(base(2).n, 3, 'abaixo de 3 vira 3 (2 é o duelo antigo)'); assert.equal(base(9).n, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e); assert.equal(C.vencedor(e), null);
});
test('aplicar: guarda o andamento só de quem jogou e dá ordem de chegada a quem termina', () => {
  let e = base(); e = C.aplicar(e, 1, lado(3, false, false)); assert.deepEqual(e.prog[1], { p: 3, e: 0, fim: false, ok: false, ordem: 0 }); assert.equal(e.prog[0].p, 0);
  e = C.aplicar(e, 2, lado(4, true)); assert.equal(e.prog[2].ordem, 1); e = C.aplicar(e, 0, lado(4, true)); assert.equal(e.prog[0].ordem, 2);
  e = C.aplicar(e, 2, lado(4, true)); assert.equal(e.prog[2].ordem, 1, 'quem já terminou mantém a ordem');
});
test('vence quem acertou com menos perguntas; empate = quem chegou primeiro', () => {
  let e = base(); e = C.aplicar(e, 0, lado(6, true)); e = C.aplicar(e, 1, lado(4, true)); e = C.aplicar(e, 2, lado(4, true)); assert.equal(C.vencedor(e), null, 'falta a Duda');
  e = C.aplicar(e, 3, lado(2, false, true, 2)); assert.equal(C.vencedor(e), 1, 'Bia e Cris com 4: Bia chegou antes');
  assert.deepEqual(C.classificacao(e).map((x) => x.i), [1, 2, 0, 3]);
});
test('ninguém acertou = -1; quem não acertou fica atrás de quem acertou', () => {
  let e = base(3); for (const q of [0, 1, 2]) e = C.aplicar(e, q, lado(5 + q, false, true, 2)); assert.equal(C.vencedor(e), -1);
  let f = base(3); f = C.aplicar(f, 0, lado(1, false, true, 2)); f = C.aplicar(f, 1, lado(9, true)); f = C.aplicar(f, 2, lado(5, false, true, 2)); assert.equal(C.vencedor(f), 1); assert.equal(C.classificacao(f)[0].i, 1);
});
test('próxima rodada: mesa nova, andamento zerado, mesmos nomes e n', () => {
  const e = C.aplicar(base(), 0, lado(3, true)); const r = C.proximaRodada(e, mesa, 'c');
  assert.equal(r.rodada, 2); assert.equal(r.segredo, 'c'); assert.equal(r.n, 4); assert.deepEqual(r.nomes, e.nomes); assert.ok(r.prog.every((x) => !x.fim && x.p === 0));
});
