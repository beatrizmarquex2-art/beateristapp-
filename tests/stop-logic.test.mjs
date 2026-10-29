import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/jogos/stop-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const fill = (g, p, arr) => { arr.forEach((t, c) => { g = S.setAnswer(g, p, c, t); }); return g; };

test('exatamente quatro categorias, na ordem pedida', () => assert.deepEqual(S.CATEGORIES, ['nome', 'banda', 'música', 'instrumento/peça']));
test('normalização: acentos, maiúsculas e espaços duplicados', () => {
  assert.equal(S.normalize('  ÁGUA   de   Côco '), 'agua de coco'); assert.equal(S.initialOf('  Éric Clapton'), 'E'); assert.equal(S.initialOf('"ísis"'), 'I'); assert.equal(S.initialOf('123'), '');
});
test('artigos: “The Beatles” vale T e “Beatles” vale B (cadastro literal)', () => { assert.equal(S.initialOf('The Beatles'), 'T'); assert.equal(S.initialOf('Beatles'), 'B'); assert.equal(S.autoCheck('The Beatles', 'B'), 'inicial-errada'); assert.equal(S.autoCheck('Beatles', 'B'), 'ok'); });
test('campos vazios e letra errada', () => { assert.equal(S.autoCheck('   ', 'A'), 'vazia'); assert.equal(S.autoCheck('', 'A'), 'vazia'); assert.equal(S.autoCheck('Bateria', 'C'), 'inicial-errada'); assert.equal(S.autoCheck('caixa', 'C'), 'ok'); });
test('letras sorteadas sem repetição, só da lista; configuração inválida recusada', () => {
  for (const r of S.ROUNDS) for (let s = 1; s < 40; s++) { const g = S.newMatch({ rounds: r, rnd: seeded(s) }); assert.equal(g.letters.length, r); assert.equal(new Set(g.letters).size, r); assert.ok(g.letters.every((l) => S.LETTERS.includes(l))); }
  assert.throws(() => S.newMatch({ rounds: 4 })); assert.throws(() => S.newMatch({ seconds: 30 }));
});
test('solo: 10 por válida, máximo 40; vazia e inválida valem 0', () => {
  let g = S.newMatch({ rnd: seeded(1) }); const L = S.letterOf(g).toLowerCase();
  g = fill(g, 0, [`${L}a`, `${L}b`, `${L}c`, `${L}d`]); g = S.finishTurn(g); assert.deepEqual(S.scoreRound(g)[0], [10, 10, 10, 10]);
  g = S.setDecision(g, 0, 1, 'invalida'); g = S.setDecision(g, 0, 2, 'repetida'); assert.deepEqual(S.scoreRound(g)[0], [10, 0, 0, 10]);
  let v = S.newMatch({ rnd: seeded(2) }); v = S.finishTurn(fill(v, 0, ['', 'x', '', ''])); assert.ok(S.scoreRound(v)[0].every((x) => x === 0));
});
test('revisão: alerta de inicial diferente; marcar válida mesmo assim é decisão do revisor; vazia nunca pontua', () => {
  let g = S.newMatch({ rnd: seeded(3) }); const L = S.letterOf(g); const other = L === 'Z' ? 'a' : (L.toLowerCase() === 'a' ? 'b' : 'a');
  g = S.finishTurn(fill(g, 0, [`${other}xx`, '', '', ''])); assert.equal(g.cur.decisions[0][0], 'invalida');
  g = S.setDecision(g, 0, 0, 'valida'); assert.deepEqual(S.warnings(g), [[0, 0]]); assert.equal(S.scoreRound(g)[0][0], 10);
  g = S.setDecision(g, 0, 1, 'valida'); assert.equal(S.scoreRound(g)[0][1], 0);
});
test('correção exige justificativa, preserva o original e vale na pontuação', () => {
  let g = S.newMatch({ rnd: seeded(4) }); const L = S.letterOf(g).toLowerCase(); g = S.finishTurn(fill(g, 0, ['zzz', '', '', '']));
  assert.throws(() => S.correct(g, 0, 0, `${L}ok`, '  ')); g = S.correct(g, 0, 0, `${L}ok`, 'erro de digitação');
  assert.equal(g.cur.answers[0][0], 'zzz'); assert.equal(g.cur.corrections[0][0].original, 'zzz'); assert.equal(S.scoreRound(g)[0][0], 10);
});
test('dupla: 10 exclusiva, 5 se iguais ou marcadas equivalentes, 0 se inválida', () => {
  let g = S.newMatch({ mode: 'dupla', rnd: seeded(5) }); const L = S.letterOf(g).toLowerCase();
  g = fill(g, 0, [`${L}ana`, `${L}and`, `${L}o`, '']); g = S.finishTurn(g); assert.equal(g.turn, 1); assert.equal(g.stage, 'play');
  assert.throws(() => S.setAnswer(g, 0, 0, 'mexer')); g = fill(g, 1, [`${L.toUpperCase()}ANA`, `${L}ande`, '', `${L}x`]); g = S.finishTurn(g); assert.equal(g.stage, 'review');
  assert.deepEqual(S.scoreRound(g), [[5, 10, 10, 0], [5, 10, 0, 10]]);
  g = S.setEquiv(g, 1, true); assert.deepEqual(S.scoreRound(g)[0][1], 5); assert.deepEqual(S.scoreRound(g)[1][1], 5);
});
test('rodadas: só avança depois de confirmar a revisão; acumula; final reconhece vencedor e empate', () => {
  let g = S.newMatch({ mode: 'dupla', rounds: 3, rnd: seeded(6) });
  for (let r = 0; r < 3; r++) { const L = S.letterOf(g).toLowerCase(); g = S.finishTurn(S.setAnswer(g, 0, 0, `${L}1`)); g = S.finishTurn(S.setAnswer(g, 1, 0, `${L}2`)); assert.equal(g.stage, 'review'); g = S.confirmRound(g); }
  assert.equal(g.stage, 'done'); assert.deepEqual(g.totals, [30, 30]); assert.equal(S.winner(g), 'empate'); assert.equal(g.history.length, 3);
  assert.throws(() => S.confirmRound(g));
});
test('texto digitado fica guardado como texto cru (sem interpretar HTML) e validMatch recusa lixo', () => {
  let g = S.newMatch({ rnd: seeded(7) }); g = S.setAnswer(g, 0, 0, '<img src=x onerror=alert(1)>'); assert.equal(g.cur.answers[0][0], '<img src=x onerror=alert(1)>'); assert.ok(S.validMatch(g));
  for (const b of [null, {}, { ...g, letters: ['A', 'A', 'B'] }]) assert.ok(!S.validMatch(b));
});
