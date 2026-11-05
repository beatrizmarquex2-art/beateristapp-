import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/jogos/stop-logic.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const CATS = ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'];
const fill = (g, p, arr) => { arr.forEach((t, c) => { g = S.setAnswer(g, p, c, t); }); return g; };
const mk = (o = {}) => S.newMatch({ cats: CATS, rnd: seeded(5), ...o });

test('de 5 a 8 categorias entre as 12; fora disso é recusado', () => {
  assert.ok(S.catsOk(CATS)); assert.ok(!S.catsOk(CATS.slice(0, 4))); assert.ok(!S.catsOk([...CATS, 'cantor', 'album', 'tecnica']));
  assert.ok(!S.catsOk(['instrumento', 'instrumento', 'banda', 'musica', 'estilo'])); assert.ok(!S.catsOk([...CATS.slice(0, 5), 'inventada']));
  assert.throws(() => S.newMatch({ cats: CATS.slice(0, 4) }));
  for (let n = 5; n <= 8; n++) { const r = S.randomCats(n, seeded(n)); assert.equal(r.length, n); assert.ok(S.catsOk(r)); }
});
test('sorteio aleatório de categorias varia entre instrumentos, teoria e cultura', () => {
  const r = S.randomCats(6, seeded(2)); const grupos = new Set(r.map((c) => S.CAT[c].grupo)); assert.equal(grupos.size, 3);
});
test('letras: só as 16, sem repetir até acabar o ciclo e recomeça', () => {
  const el = S.lettersFor(CATS); assert.ok(el.length >= 8);
  let used = []; const seen = [];
  for (let i = 0; i < el.length * 2; i++) { const d = S.drawLetters(1, used, seeded(i + 1), el); seen.push(...d.letters); used = d.cycle; }
  for (let k = 0; k < el.length * 2; k += el.length) assert.equal(new Set(seen.slice(k, k + el.length)).size, el.length);
  assert.ok(seen.every((l) => S.LETTERS.includes(l)));
  const m = mk({ rounds: 10 }); assert.equal(new Set(m.letters).size, 10); assert.ok(m.letters.every((l) => el.includes(l)));
  assert.throws(() => S.drawLetters(1, [], Math.random, []), /sem-letra/);
});
test('opções: tempo 30/60/90/120, rodadas 3/5/10; livres só na sala de aula', () => {
  assert.throws(() => mk({ seconds: 45 })); assert.throws(() => mk({ rounds: 4 }));
  const s = mk({ mode: 'sala', seconds: 45, rounds: 4, players: ['a', 'b', 'c'] }); assert.equal(s.seconds, 45); assert.equal(s.players.length, 3);
  assert.throws(() => mk({ mode: 'sala', players: ['a'] })); assert.throws(() => mk({ mode: 'dupla', players: ['a'] }));
});
test('individual: 10 por válida; inválida e vazia 0; pendente fica sem pontuação definitiva', () => {
  let g = mk(); const L = S.letterOf(g).toLowerCase(); void L;
  g = fill(g, 0, ['', '', '', '', '', '']); g = S.finishTurn(g); assert.equal(g.stage, 'review'); assert.ok(S.scoreRound(g).sums[0] === 0);
  const sc = S.scoreRound(g); assert.ok(sc.points[0].every((x) => x === 0));
  let h = mk(); const l = S.letterOf(h); h = fill(h, 0, [`${l}xqzw`, '', '', '', '', '']); h = S.finishTurn(h);
  assert.equal(S.scoreRound(h).points[0][0], null); assert.equal(S.pendingCount(h), 1); assert.throws(() => S.confirmRound(h));
  const done = S.confirmRound(h, { allowPending: true }); assert.equal(done.totals[0], 0);
});
test('revisão: aprovar vale 10, rejeitar 0, volta ao automático; histórico das decisões', () => {
  let g = mk(); const l = S.letterOf(g); g = fill(g, 0, [`${l}xqzw`, '', '', '', '', '']); g = S.finishTurn(g);
  g = S.decide(g, 0, 0, 'valida', { why: 'conheço', by: 'prof' }); assert.equal(S.scoreRound(g).points[0][0], 10); assert.equal(S.pendingCount(g), 0);
  g = S.decide(g, 0, 0, 'invalida', { why: 'não existe' }); assert.equal(S.scoreRound(g).points[0][0], 0);
  g = S.decide(g, 0, 0, null); assert.equal(S.pendingCount(g), 1); assert.equal(g.cur.log.length, 3); assert.equal(g.cur.answers[0][0], `${l}xqzw`); // texto original intacto
  assert.throws(() => S.decide(g, 0, 0, 'talvez'));
});
test('dupla: 10 única, 5 repetida (mesma identidade), 0 inválida; resposta do outro é intocável', () => {
  let g = S.newMatch({ mode: 'dupla', cats: CATS, rnd: seeded(5), players: ['Ana', 'Beto'] }); const l = S.letterOf(g);
  assert.equal(g.turn, 0); g = S.setAnswer(g, 0, 0, 'x'); assert.throws(() => S.setAnswer(g, 1, 0, 'mexer'));
  // usa identidades manuais: duas pendentes iguais (mesmo texto normalizado) viram repetidas ao serem aprovadas
  g = fill(g, 0, [`${l}zzzq`, `${l}yyyq`, '', '', '', '']); g = S.finishTurn(g, 20); assert.equal(g.turn, 1); assert.equal(g.stage, 'play');
  g = fill(g, 1, [`${l.toLowerCase()}ZZZQ`, `${l}wwwq`, '', '', '', '']); g = S.finishTurn(g, 25); assert.equal(g.stage, 'review');
  for (const [p, c] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g = S.decide(g, p, c, 'valida');
  const sc = S.scoreRound(g); assert.equal(sc.points[0][0], 5); assert.equal(sc.points[1][0], 5); // mesma resposta
  assert.equal(sc.points[0][1], 10); assert.equal(sc.points[1][1], 10); // respostas diferentes
  g = S.setEquiv(g, 1, true); assert.equal(S.scoreRound(g).points[0][1], 5);
});
test('rodadas: só avança depois de confirmar; acumula; vencedor e empate', () => {
  let g = S.newMatch({ mode: 'dupla', cats: CATS, rounds: 3, rnd: seeded(6), players: ['A', 'B'] });
  for (let r = 0; r < 3; r++) { const l = S.letterOf(g); g = S.finishTurn(S.setAnswer(g, 0, 0, `${l}zzz${r}`)); g = S.finishTurn(S.setAnswer(g, 1, 0, `${l}qqq${r}`)); assert.equal(g.stage, 'review'); g = S.decide(S.decide(g, 0, 0, 'valida'), 1, 0, 'valida'); g = S.confirmRound(g); }
  assert.equal(g.stage, 'done'); assert.deepEqual(g.totals, [30, 30]); assert.ok(S.winner(g).tie); assert.equal(g.history.length, 3); assert.throws(() => S.confirmRound(g));
  g.totals = [40, 30]; assert.deepEqual(S.winner(g).winners, [0]);
});
test('rodada perfeita: todas válidas e nenhuma pendente (sem ponto extra)', () => {
  let g = mk(); const l = S.letterOf(g); g = fill(g, 0, CATS.map((_, i) => `${l}zz${i}x`)); g = S.finishTurn(g);
  assert.ok(!S.scoreRound(g).perfect[0]); // pendentes
  CATS.forEach((_, c) => { g = S.decide(g, 0, c, 'valida'); }); const sc = S.scoreRound(g); assert.ok(sc.perfect[0]); assert.equal(sc.sums[0], 60);
});
test('validMatch recusa lixo', () => { assert.ok(S.validMatch(mk())); for (const b of [null, {}, { ...mk(), v: 1 }, { ...mk(), cats: ['x'] }]) assert.ok(!S.validMatch(b)); });
