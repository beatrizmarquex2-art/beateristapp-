// STOP "ao mesmo tempo": quem sai da partida (a maioria votou "continuar sem"): fora, resposta vazia (vale 0), não segura nada, não ganha rodada.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Q from '../js/jogos/stop-sim-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const CATS = ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'];
const mk = (o = {}) => Q.novoEstado({ cats: CATS, seconds: 60, rnd: seeded(3), n: 3, nomes: ['Ana', 'Bia', 'Cris'], ...o });
const resp = (e, p, arr) => { e.res[p] = { answers: arr, usado: 10, motivo: 'stop' }; };

test('tirar: marca fora, fica pronto e com resposta vazia (0 pontos), e não repete', () => {
  const e = mk(); assert.deepEqual(Q.foraDe(e), []);
  assert.equal(Q.tirar(e, [2]), true); assert.deepEqual(Q.foraDe(e), [2]); assert.equal(e.ready[2], true); assert.equal(e.res[2].motivo, 'saiu'); assert.deepEqual(e.res[2].answers, ['', '', '', '', '', '']);
  assert.equal(Q.tirar(e, [2]), false, 'já estava fora'); assert.equal(Q.tirar(e, [9, -1]), false, 'lugar inválido');
  assert.ok(Q.estadoValido(e)); assert.deepEqual(JSON.parse(JSON.stringify(e)), e);
});
test('quem saiu não segura a contagem: com os 2 que ficaram prontos, todos prontos', () => {
  const e = mk(); e.ready = [true, true, false]; assert.ok(!Q.todosProntos(e)); Q.tirar(e, [2]); assert.ok(Q.todosProntos(e));
});
test('a rodada fecha sem esperar quem saiu: faltam só os ativos e o resultado fica completo', () => {
  const e = mk(); resp(e, 0, ['violão', 'pandeiro', 'samba', 'beatles', 'asa branca', 'yamaha']); Q.tirar(e, [2]);
  assert.deepEqual(Q.faltam(e), [1]); resp(e, 1, ['', '', '', '', '', '']);
  const r = Q.resultado(e); assert.equal(r.completo, true); assert.equal(r.sc.sums[2], 0, 'quem saiu vale 0 nessa rodada');
});
test('quem saiu não ganha a rodada: o empate de topo é só entre quem ficou', () => {
  const e = mk(); Q.tirar(e, [2]);
  resp(e, 0, ['', '', '', '', '', '']); resp(e, 1, ['', '', '', '', '', '']);
  const r = Q.resultado(e); assert.equal(r.vencedor, -1, 'empate 0 × 0 entre Ana e Bia'); assert.notEqual(r.vencedor, 2);
});
test('revanche mantém quem saiu fora e a nova rodada já vem completa pra ele', () => {
  const e = mk(); Q.tirar(e, [1]); resp(e, 0, ['violão', '', '', '', '', '']); resp(e, 2, ['', '', '', '', '', '']);
  Q.proximaRodada(e, 0); assert.deepEqual(Q.foraDe(e), [1]); assert.equal(e.round, 2); assert.equal(e.ready[1], true); assert.equal(e.res[1].motivo, 'saiu'); assert.equal(e.res[0], null);
  assert.equal(e.wins[1], 0);
});
test('sobrou uma pessoa só: fim da sala (sem revanche)', () => {
  const e = mk(); Q.tirar(e, [1]); assert.ok(!e.fim); Q.tirar(e, [2]); assert.equal(e.fim, true); assert.equal(Q.proximaRodada(e, 0), false);
  const d = mk({ n: 2, nomes: ['A', 'B'] }); Q.tirar(d, [1]); assert.equal(d.fim, true, 'sala de 2: se o outro sai, acabou');
});
test('revisão: o menor lugar que ficou decide (se quem criou saiu, passa pro próximo)', () => {
  const e = mk(); assert.equal(Q.revisorDe(e), 0); Q.tirar(e, [0]); assert.equal(Q.revisorDe(e), 1);
});
test('estado com `fora` inválido é recusado', () => {
  const e = mk(); e.fora = [7]; assert.ok(!Q.estadoValido(e)); e.fora = 'x'; assert.ok(!Q.estadoValido(e));
});
