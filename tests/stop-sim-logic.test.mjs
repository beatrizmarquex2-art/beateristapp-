import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/jogos/stop-logic.js';
import * as Q from '../js/jogos/stop-sim-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const CATS = ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'];
const mk = (o = {}) => Q.novoEstado({ cats: CATS, seconds: 60, rnd: seeded(3), ...o });
const ans = (e, p, arr) => { e.res[p] = { answers: arr, usado: 10, motivo: 'stop' }; };
const V6 = ['', '', '', '', '', ''];

test('estado novo: mesma letra e categorias, ninguém pronto, sem STOP e sem respostas', () => {
  const e = mk(); assert.ok(Q.estadoValido(e)); assert.ok(S.lettersFor(CATS).includes(e.letter));
  assert.deepEqual(e.ready, [false, false]); assert.equal(e.stop, null); assert.deepEqual(e.res, [null, null]); assert.equal(e.round, 1);
  assert.throws(() => Q.novoEstado({ cats: CATS.slice(0, 4) })); assert.throws(() => Q.novoEstado({ cats: CATS, seconds: 5 }));
  assert.ok(!Q.estadoValido(null)); assert.ok(!Q.estadoValido({ ...e, letter: 'Z' })); assert.ok(!Q.estadoValido({ ...e, res: [{ answers: [] }, null] }));
});
test('pronto: cada um só mexe no seu lugar e repetir não muda nada', () => {
  const e = mk(); assert.equal(Q.pronto(e, 1), true); assert.deepEqual(e.ready, [false, true]); assert.equal(Q.pronto(e, 1), false); Q.pronto(e, 0); assert.deepEqual(e.ready, [true, true]);
});
test('STOP: o primeiro grava e o segundo aceita o do outro (só manda as respostas)', () => {
  const e = mk(); assert.equal(Q.finalizar(e, 0, ['a', '', '', '', '', ''], 12, 'stop'), true); assert.deepEqual(e.stop, { por: 0, round: 1 });
  assert.equal(Q.stopDoOutro(e, 1), true); assert.equal(Q.stopDoOutro(e, 0), false);
  assert.equal(Q.finalizar(e, 1, ['b', '', '', '', '', ''], 12, 'stop'), true); assert.equal(e.stop.por, 0);
  assert.equal(e.res[0].motivo, 'stop'); assert.equal(e.res[1].motivo, 'stop-outro'); assert.equal(Q.quemParou(e), 0);
});
test('parada forçada e tempo esgotado', () => {
  const e = mk(); Q.finalizar(e, 1, [], 5, 'stop'); Q.finalizar(e, 0, ['x'], 30, 'forcado'); assert.equal(e.res[0].motivo, 'stop-outro'); assert.equal(e.res[0].answers.length, 6);
  const t = mk(); Q.finalizar(t, 0, [], 99, 'tempo'); assert.equal(t.stop, null); assert.equal(t.res[0].motivo, 'tempo'); assert.equal(t.res[0].usado, 60);
});
test('respostas gravadas nunca são sobrescritas e texto é cortado em 80', () => {
  const e = mk(); Q.finalizar(e, 0, ['a'.repeat(200)], 1, 'tempo'); assert.equal(e.res[0].answers[0].length, 80);
  assert.equal(Q.finalizar(e, 0, ['outra'], 2, 'tempo'), false); assert.equal(e.res[0].answers[0].length, 80);
});
test('STOP velho de outra rodada não vale', () => {
  const e = mk(); e.stop = { por: 1, round: 7 }; assert.equal(Q.stopDoOutro(e, 0), false); assert.equal(Q.quemParou(e), null);
});
test('placar usa as regras do stop-logic: pendente fica fora até a decisão de quem cria, e vale pros dois', () => {
  const e = mk(); const L = e.letter;
  ans(e, 0, V6); ans(e, 1, V6);
  let r = Q.resultado(e); assert.equal(r.completo, true); assert.deepEqual(r.sc.sums, [0, 0]); assert.equal(r.vencedor, -1);
  ans(e, 0, [`${L}xyzabc`, '', '', '', '', '']); r = Q.resultado(e); assert.equal(r.pend, 1); assert.equal(r.sc.points[0][0], null);
  Q.decidir(e, 0, 0, 'valida', { why: 'ok', canon: null }); r = Q.resultado(e); assert.equal(r.sc.sums[0], 10); assert.equal(r.vencedor, 0); assert.equal(r.pend, 0);
  ans(e, 1, [`${L}xyzabc`, '', '', '', '', '']); Q.decidir(e, 1, 0, 'valida', { why: 'ok' }); Q.equivalente(e, 0, true); r = Q.resultado(e); assert.deepEqual(r.sc.sums, [5, 5]); assert.equal(r.vencedor, -1);
  Q.decidir(e, 1, 0, 'invalida'); r = Q.resultado(e); assert.deepEqual(r.sc.sums, [10, 0]);
  Q.decidir(e, 1, 0, null); r = Q.resultado(e); assert.equal(r.pend, 1);
});
test('resposta de banco igual nos dois vale 5 e diferente vale 10 (rodada de verdade)', async () => {
  const V = await import('../js/jogos/stop-valid.js'); const T = await import('../js/jogos/stop-bank-teoria.js'); const C = await import('../js/jogos/stop-bank-cultura.js');
  const lines = { ...T.LINES, ...C.LINES }; let achou = null;
  for (const L of S.lettersFor(CATS)) { const nomes = lines.instrumento.map((x) => x.split('|')[0]).filter((n) => V.initialOf(n) === L); if (nomes.length >= 2) { achou = [L, nomes]; break; } }
  assert.ok(achou); const [L, nomes] = achou; const e = mk(); e.letter = L;
  ans(e, 0, [nomes[0], '', '', '', '', '']); ans(e, 1, [nomes[0], '', '', '', '', '']); let r = Q.resultado(e); assert.deepEqual(r.sc.sums, [5, 5]);
  ans(e, 1, [nomes[1], '', '', '', '', '']); r = Q.resultado(e); assert.deepEqual(r.sc.sums, [10, 10]);
  ans(e, 1, V6); r = Q.resultado(e); assert.deepEqual(r.sc.sums, [10, 0]); assert.equal(r.vencedor, 0);
});
test('sem as respostas do outro: não decide, a menos que se escolha ver assim mesmo', () => {
  const e = mk(); ans(e, 0, V6); assert.equal(Q.resultado(e).vencedor, null); assert.equal(Q.resultado(e, { semOutro: true }).vencedor, -1); assert.equal(Q.resultado(e).completo, false);
});
test('revanche: letra nova, tudo zerado, vitórias acumuladas, quem pediu já fica pronto', () => {
  const e = mk(); const velha = e.letter; ans(e, 0, V6); ans(e, 1, V6); e.stop = { por: 0, round: 1 }; e.pausa = [true, false]; e.rev.equiv[0] = true;
  Q.proximaRodada(e, 1, seeded(9)); assert.equal(e.round, 2); assert.deepEqual(e.ready, [false, true]); assert.deepEqual(e.res, [null, null]); assert.equal(e.stop, null); assert.deepEqual(e.pausa, [false, false]); assert.equal(e.rev.equiv[0], false);
  assert.equal(e.empates, 1); assert.deepEqual(e.wins, [0, 0]); assert.notEqual(e.letter, velha); assert.ok(Q.estadoValido(e));
  const L = e.letter; ans(e, 1, [`${L}zzzqqq`, '', '', '', '', '']); ans(e, 0, V6); Q.decidir(e, 1, 0, 'valida'); Q.proximaRodada(e, 0); assert.deepEqual(e.wins, [0, 1]);
});
test('letras não se repetem na revanche até o ciclo acabar', () => {
  const e = mk(); const vistas = [e.letter]; const n = S.lettersFor(CATS).length;
  for (let i = 1; i < n; i++) { Q.proximaRodada(e, 0, seeded(i + 20)); vistas.push(e.letter); }
  assert.equal(new Set(vistas).size, n);
});
test('pausa só mexe no lugar de quem pausou', () => {
  const e = mk(); assert.equal(Q.pausar(e, 1, true), true); assert.deepEqual(e.pausa, [false, true]); assert.equal(Q.pausar(e, 1, true), false); Q.pausar(e, 1, false); assert.deepEqual(e.pausa, [false, false]);
});
test('guarda local: chave por sala e rodada, restante em pausa e correndo', () => {
  assert.equal(Q.chaveLocal('abcde', 2), 'stop-sim-ABCDE-2');
  assert.equal(Q.restanteMs(null), null); assert.equal(Q.restanteMs({ pausadoRest: 12000 }, 1e12), 12000); assert.equal(Q.restanteMs({ deadline: 1000 + 5000 }, 1000), 5000); assert.equal(Q.restanteMs({ deadline: 10 }, 1000), 0);
});
