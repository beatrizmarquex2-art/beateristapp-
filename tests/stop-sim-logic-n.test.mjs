// STOP "ao mesmo tempo" com 3 e 4 jogadores (cada um no seu celular): estado, pontuação, vencedor, revanche. A sala de 2 continua igual (sem `n`).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/jogos/stop-logic.js';
import * as Q from '../js/jogos/stop-sim-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const CATS = ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'];
const mk = (o = {}) => Q.novoEstado({ cats: CATS, seconds: 60, rnd: seeded(3), ...o });
const V6 = ['', '', '', '', '', ''];
const ans = (e, p, arr) => { e.res[p] = { answers: arr, usado: 10, motivo: 'stop' }; };

test('sala de 2 não muda: sem `n`, 2 lugares, jogadoresDe = 2', () => {
  const e = mk(); assert.equal(e.n, undefined); assert.equal(Q.jogadoresDe(e), 2); assert.equal(e.ready.length, 2); assert.ok(Q.estadoValido(e));
});
test('sala de 4: n, nomes, 4 lugares em tudo e estado válido (JSON puro)', () => {
  const e = mk({ n: 4, nomes: ['Ana', 'Bia', 'Cris', 'Duda'] }); assert.equal(e.n, 4); assert.deepEqual(e.nomes, ['Ana', 'Bia', 'Cris', 'Duda']);
  for (const k of ['ready', 'res', 'pausa', 'wins']) assert.equal(e[k].length, 4, k);
  assert.equal(e.rev.over.length, 4); assert.equal(e.rev.canon.length, 4); assert.ok(Q.estadoValido(e)); assert.deepEqual(JSON.parse(JSON.stringify(e)), e);
  assert.ok(!Q.todosProntos(e)); e.ready = [true, true, true, false]; assert.ok(!Q.todosProntos(e)); e.ready[3] = true; assert.ok(Q.todosProntos(e));
});
test('estado com lugares a mais ou a menos não vale', () => {
  const e = mk({ n: 3 }); assert.ok(Q.estadoValido(e)); const r = JSON.parse(JSON.stringify(e)); r.res.push(null); assert.ok(!Q.estadoValido(r));
  const q = mk({ n: 4 }); q.ready = [false, false]; assert.ok(!Q.estadoValido(q));
});
test('o 1º STOP vale e os 4 gravam as respostas; "faltam" lista quem ainda não mandou', () => {
  const e = mk({ n: 4 }); assert.ok(Q.finalizar(e, 3, V6, 5, 'stop')); assert.deepEqual(e.stop, { por: 3, round: 1 });
  assert.ok(Q.stopDoOutro(e, 0)); assert.ok(!Q.stopDoOutro(e, 3)); assert.equal(Q.quemParou(e), 3);
  assert.deepEqual(Q.faltam(e), [0, 1, 2]);
  Q.finalizar(e, 1, V6, 5, 'forcado'); assert.equal(e.res[1].motivo, 'stop-outro'); assert.deepEqual(Q.faltam(e), [0, 2]);
  assert.ok(!Q.finalizar(e, 2, V6, 5, 'stop') || e.stop.por === 3, 'o STOP de outro celular não sobrescreve o primeiro');
});
test('rodada virtual: nomes e 4 jogadores na pontuação (respostas iguais valem 5, só uma vale 10)', () => {
  const e = mk({ n: 4, nomes: ['Ana', 'Bia', 'Cris', 'Duda'] }); const L = e.letter;
  const g = Q.rodadaG(e); assert.deepEqual(g.players, ['Ana', 'Bia', 'Cris', 'Duda']); assert.equal(g.cur.answers.length, 4); assert.equal(g.totals.length, 4);
  for (let p = 0; p < 4; p++) ans(e, p, V6); const r = Q.resultado(e); assert.ok(r.completo); assert.equal(r.vencedor, -1, 'todos zerados: empate'); assert.equal(r.sc.sums.length, 4);
  assert.equal(L.length, 1);
});
test('vencedor com 3 e 4: maior placar; empate no topo = -1; sem todos, só com semOutro', () => {
  const e = mk({ n: 3 }); ans(e, 0, V6); ans(e, 1, V6);
  assert.equal(Q.resultado(e).vencedor, null, 'falta o terceiro'); assert.ok(!Q.resultado(e).completo);
  assert.equal(Q.resultado(e, { semOutro: true }).vencedor, -1, 'sem o terceiro e todos zerados: empate');
  ans(e, 2, V6); assert.ok(Q.resultado(e).completo);
});
test('decidir: quem criou aprova a resposta de qualquer jogador e vale pra todos (pontos mudam)', () => {
  const e = mk({ n: 4 }); const mkAns = (t) => [t, '', '', '', '', '']; ans(e, 0, V6); ans(e, 1, mkAns('zzbia')); ans(e, 2, V6); ans(e, 3, V6);
  const antes = Q.resultado(e).sc.sums[1];
  assert.ok(Q.decidir(e, 1, 0, 'valida', { why: 'aprovada', by: 'quem criou a sala' }));
  const dep = Q.resultado(e); assert.equal(dep.sc.sums[1], antes + 10); assert.equal(dep.vencedor, 1);
  assert.equal(e.rev.over.length, 4);
});
test('revanche com 4: nova letra, 4 lugares zerados, vitória só do vencedor e quem pediu já fica pronto', () => {
  const e = mk({ n: 4, nomes: ['A', 'B', 'C', 'D'] }); for (let p = 0; p < 4; p++) ans(e, p, V6); ans(e, 2, ['zzc', '', '', '', '', '']); Q.decidir(e, 2, 0, 'valida');
  assert.equal(Q.resultado(e).vencedor, 2); const r0 = e.round;
  assert.ok(Q.proximaRodada(e, 1, seeded(9))); assert.equal(e.round, r0 + 1); assert.deepEqual(e.wins, [0, 0, 1, 0]);
  assert.deepEqual(e.ready, [false, true, false, false]); assert.deepEqual(e.res, [null, null, null, null]); assert.equal(e.stop, null); assert.equal(e.rev.over.length, 4); assert.ok(Q.estadoValido(e));
  assert.deepEqual(e.nomes, ['A', 'B', 'C', 'D']);
});
test('revanche de sala de 2 continua com 2 lugares e conta empate', () => {
  const e = mk(); ans(e, 0, V6); ans(e, 1, V6); Q.proximaRodada(e, 0, seeded(1)); assert.equal(e.ready.length, 2); assert.equal(e.empates, 1); assert.ok(Q.estadoValido(e));
});
test('pausa por lugar com 4', () => { const e = mk({ n: 4 }); assert.ok(Q.pausar(e, 2, true)); assert.deepEqual(e.pausa, [false, false, true, false]); assert.ok(!Q.pausar(e, 2, true)); });
test('stop-logic ainda reconhece 4 jogadores (dupla 2 a 4) na pontuação', () => {
  const g = S.newMatch({ mode: 'dupla', cats: CATS, players: ['a', 'b', 'c', 'd'], seconds: 60, rounds: 3 }); assert.equal(g.players.length, 4);
});
