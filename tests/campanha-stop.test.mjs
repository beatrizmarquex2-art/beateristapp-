import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/jogos/stop-logic.js';
import * as V from '../js/jogos/stop-valid.js';
import { LINES as T } from '../js/jogos/stop-bank-teoria.js';
import { LINES as C } from '../js/jogos/stop-bank-cultura.js';
import * as E from '../js/campanha/engine.js';
import mod, { spec, judge } from '../js/campanha/jogos/stop.js';

const BANK = { ...T, ...C };
const names = (cat, L) => (BANK[cat] || []).map((l) => l.split('|')[0].trim()).filter((n) => V.initialOf(n) === L);
const M = spec.missions;

test('spec valido, 11 missoes, ids estaveis, theme stop, so categorias oficiais', () => {
  assert.deepEqual(E.checkSpec(spec), { ok: true, errors: [] });
  assert.equal(M.length, 11); assert.equal(spec.theme, 'stop'); assert.equal(mod.spec, spec); assert.equal(typeof mod.mount, 'function');
  assert.deepEqual(M.map((m) => m.id), Array.from({ length: 11 }, (_, i) => `stop-${String(i).padStart(2, '0')}`));
  assert.equal(V.CATS.length, 12);
  for (const m of M) { assert.ok(S.catsOk(m.params.cats), m.id); assert.ok(m.goal && m.tag && m.rules.length && m.stars.length === 3, m.id); }
});

test('dificuldade progressiva: categorias, rodadas, tempo por categoria e meta (%) nunca afrouxam', () => {
  for (let i = 1; i < M.length; i++) {
    const a = M[i - 1].params; const b = M[i].params;
    assert.ok(b.cats.length >= a.cats.length, `cats ${i}`); assert.ok(b.rounds >= a.rounds, `rounds ${i}`);
    assert.ok(b.seconds / b.cats.length <= a.seconds / a.cats.length, `s/cat ${i}`); assert.ok(b.seconds <= a.seconds, `seconds ${i}`);
    if (i >= 2) assert.ok(b.goal / (b.rounds * b.cats.length * 10) >= a.goal / (a.rounds * a.cats.length * 10) - 1e-9, `meta% ${i}`);
  }
  assert.equal(M[0].params.cats.length, 5); assert.equal(M[10].params.cats.length, 8);
  assert.ok(M[10].params.seconds < M[0].params.seconds);
});

test('combinacoes variadas: so cultura, sem cultura (teoria + instrumentos) e mistas', () => {
  const grp = { cantor: 'c', banda: 'c', musica: 'c', album: 'c', brasileiro: 'c' };
  const cult = (m) => m.params.cats.filter((c) => grp[c]).length;
  assert.equal(cult(M[1]), 5); // so cultura
  for (const i of [2, 4, 7]) assert.equal(cult(M[i]), 0, `missao ${i} sem cultura`);
  for (const i of [0, 3, 6, 8]) assert.ok(cult(M[i]) > 0 && cult(M[i]) < M[i].params.cats.length, `missao ${i} mista`);
  assert.ok(new Set(M.map((m) => m.params.cats.join())).size >= 10);
});

test('viavel: letras da missao servem pra todas as categorias, com folga no banco, e meta <= maximo', () => {
  for (const m of M) {
    const q = m.params; const max = q.rounds * q.cats.length * 10;
    const elig = S.lettersFor(q.cats);
    assert.ok(q.letters.length >= q.rounds, `${m.id}: letras >= rodadas`);
    for (const L of q.letters) {
      assert.ok(elig.includes(L), `${m.id} ${L} elegivel`);
      for (const c of q.cats) assert.ok(new Set(names(c, L).map(V.keyOf)).size >= (m.id === 'stop-00' ? 8 : 5), `${m.id} ${c} ${L}: respostas no banco`);
    }
    assert.ok(q.goal < q.s2 && q.s2 < q.s3 && q.s3 <= max, m.id); if (m.id !== 'stop-00') assert.ok(q.s3 / max <= 0.92, `${m.id}: 3 estrelas nao exige perfeicao total`); // o tutorial (1 rodada, 5 respostas) pede as 5 pra 3 estrelas
    assert.ok(q.goal / max <= 0.7, m.id); assert.ok(max >= q.goal);
  }
});

/** Joga a partida de verdade pela logica do jogo: `fn(cat, letter, indice)` devolve o texto de cada resposta; confirma cada rodada. */
function play(m, fn, { allowPending = true, rnd = Math.random } = {}) {
  const q = m.params; let g = S.newMatch({ mode: 'solo', cats: q.cats, seconds: q.seconds, rounds: q.rounds, players: ['você'], letters: q.letters, free: true, rnd });
  while (g.stage !== 'done') {
    const L = S.letterOf(g); q.cats.forEach((c, i) => { g = S.setAnswer(g, 0, i, fn(c, L, i)); });
    g = S.finishTurn(g, 10, true); g = S.confirmRound(g, { allowPending });
  }
  return g;
}
test('possivel: dando uma resposta valida do banco em toda categoria, todas as missoes chegam a 3 estrelas', () => {
  for (const m of M) {
    for (let k = 0; k < 20; k++) {
      let s = k + 1; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
      const g = play(m, (c, L) => names(c, L)[0], { rnd }); const r = S.matchSummary(g); const ev = m.evaluate(r);
      assert.equal(r.pontos, r.max, `${m.id}: o banco da o maximo`); assert.equal(r.pendentes, 0); assert.equal(r.perfeitas, m.params.rounds);
      assert.ok(ev.done && ev.stars === 3, m.id);
    }
  }
});
test('so metade das categorias certas: conclui as missoes iniciais, 1 estrela', () => {
  const m = M[0]; const g = play(m, (c, L, i) => (i < 3 ? names(c, L)[0] : '')); const r = S.matchSummary(g);
  assert.equal(r.pontos, 30); const ev = m.evaluate(r); assert.ok(ev.done); assert.equal(ev.stars, 1);
});

test('evaluate: limiares de estrelas e meta exatos em todas as missoes', () => {
  for (const m of M) {
    const q = m.params; const mkR = (p, extra = {}) => ({ pontos: p, rodadas: q.rounds, rounds: q.rounds, cats: q.cats, max: q.rounds * q.cats.length * 10, acertos: p / 10, pendentes: 0, ...extra });
    assert.equal(m.evaluate(mkR(q.goal - 10)).done, false, `${m.id} abaixo da meta`);
    assert.deepEqual([m.evaluate(mkR(q.goal)).stars, m.evaluate(mkR(q.s2 - 10)).stars, m.evaluate(mkR(q.s2)).stars, m.evaluate(mkR(q.s3 - 10)).stars, m.evaluate(mkR(q.s3)).stars, m.evaluate(mkR(q.rounds * q.cats.length * 10)).stars], [1, 1, 2, 2, 3, 3], m.id);
    assert.equal(m.evaluate(mkR(0)).stars, 0);
  }
});
test('evaluate: resultado incompleto, adulterado ou ausente nunca conclui', () => {
  const m = M[0]; const q = m.params; const ok = { pontos: 50, rodadas: 1, rounds: 1, cats: q.cats, max: 50, acertos: 5, pendentes: 0 };
  assert.ok(m.evaluate(ok).done);
  for (const bad of [null, undefined, {}, { ...ok, rodadas: 0 }, { ...ok, pontos: 60 }, { ...ok, max: 100 }, { ...ok, cats: q.cats.slice(1) }, { ...ok, pontos: NaN }, { ...ok, pontos: -10 }]) assert.equal(m.evaluate(bad).done, false);
});
test('pendentes: nao contam como erro nem como acerto', () => {
  const m = M[1]; const q = m.params; const base = { rodadas: 2, rounds: 2, cats: q.cats, max: 100, acertos: 0 };
  // meta batida so com o que esta confirmado: conclui e as pendentes nao entram
  const a = m.evaluate({ ...base, pontos: 50, pendentes: 3 }); assert.ok(a.done); assert.equal(a.stars, 1); assert.ok(a.summary.some((t) => /aguardando revis/.test(t)));
  // as pendentes nao sao somadas: 40 + 2 pendentes = 60, mas so 40 confirmados -> nao conclui, e e inconclusivo (nao e derrota normal)
  const b = m.evaluate({ ...base, pontos: 40, pendentes: 2 }); assert.equal(b.done, false); assert.ok(b.summary.some((t) => /inconclusivo/.test(t)));
  // nem com todas as pendentes valendo daria: derrota normal
  const c = m.evaluate({ ...base, pontos: 20, pendentes: 2 }); assert.equal(c.done, false); assert.ok(!c.summary.some((t) => /inconclusivo/.test(t)));
  // pendente nunca aumenta estrela
  assert.equal(m.evaluate({ ...base, pontos: 50, pendentes: 5 }).stars, m.evaluate({ ...base, pontos: 50, pendentes: 0 }).stars);
});
test('jogo real: resposta desconhecida fica pendente; deixar pendente vale 0 e matchSummary conta como pendente (nem acerto nem erro)', () => {
  const m = M[0]; const g = play(m, (c, L, i) => (i === 0 ? `${L}xqzwkj` : i < 4 ? names(c, L)[0] : ''), { allowPending: true }); const r = S.matchSummary(g);
  assert.equal(r.pendentes, 1); assert.equal(r.pontos, 30); assert.equal(r.acertos, 3);
  const ev = m.evaluate(r); assert.ok(ev.done && ev.stars === 1);
  assert.throws(() => { let h = S.newMatch({ mode: 'solo', cats: m.params.cats, seconds: 90, rounds: 1, free: true, letters: ['B'] }); h = S.setAnswer(h, 0, 0, 'Bxqzwkj'); h = S.finishTurn(h, 1, true); S.confirmRound(h); }, /pendentes/);
});
test('o jogo aceita aprovar a pendente na revisao e isso vira acerto de 10', () => {
  const m = M[0]; const q = m.params; let g = S.newMatch({ mode: 'solo', cats: q.cats, seconds: 90, rounds: 1, free: true, letters: ['B'] });
  g = S.setAnswer(g, 0, 0, 'Bxqzwkj'); g = S.finishTurn(g, 1, true); g = S.decide(g, 0, 0, 'valida', { why: 'aprovada' }); g = S.confirmRound(g);
  assert.equal(S.matchSummary(g).pontos, 10); assert.equal(S.matchSummary(g).pendentes, 0);
});

test('desbloqueio pelo motor: missao seguinte so abre com >=1 estrela; derrota/inconclusivo nao abre', () => {
  let g = E.blankGame(); assert.ok(E.isUnlocked(spec, g, 0)); assert.ok(!E.isUnlocked(spec, g, 1));
  const q = M[0].params; const res = (p, pend = 0) => ({ pontos: p, rodadas: 1, rounds: 1, cats: q.cats, max: 50, acertos: p / 10, pendentes: pend });
  let o = E.applyResult(g, spec, 'stop-00', res(20)); assert.ok(!o.done); assert.ok(!E.isUnlocked(spec, o.g, 1)); assert.equal(o.g.m['stop-00'].n, 1);
  o = E.applyResult(o.g, spec, 'stop-00', res(20, 1)); assert.ok(!o.done); assert.ok(!E.isUnlocked(spec, o.g, 1));
  o = E.applyResult(o.g, spec, 'stop-00', res(30)); assert.ok(o.done && o.firstTime); assert.ok(E.isUnlocked(spec, o.g, 1)); assert.ok(!E.isUnlocked(spec, o.g, 2));
  assert.ok(o.newMedals.some((x) => x.id === 'first'));
});
test('medalhas do jogo so com progresso real', () => {
  let g = E.blankGame(); for (const md of spec.medals) assert.ok(!md.test(g, spec));
  g = { ...g, m: { 'stop-01': { s: 1 }, 'stop-05': { s: 2 }, 'stop-02': { s: 1 }, 'stop-04': { s: 1 }, 'stop-07': { s: 3 } } };
  assert.deepEqual(spec.medals.map((md) => md.test(g, spec)), [true, true, false]);
});

test('modo livre intacto: regras de newMatch sem free/letters continuam as de antes', () => {
  const cats = ['instrumento', 'percussao', 'estilo', 'banda', 'musica', 'marca'];
  assert.throws(() => S.newMatch({ cats, seconds: 45 })); assert.throws(() => S.newMatch({ cats, rounds: 4 })); assert.throws(() => S.newMatch({ cats, rounds: 1 }));
  assert.throws(() => S.newMatch({ cats: cats.slice(0, 4) })); assert.deepEqual(S.SECONDS, [30, 60, 90, 120]); assert.deepEqual(S.ROUNDS, [3, 5, 10]);
  const a = S.newMatch({ cats, rnd: () => 0.3 }); assert.equal(a.letters.length, 3); assert.ok(a.letters.every((l) => S.lettersFor(cats).includes(l)));
  assert.throws(() => S.newMatch({ cats, free: true, seconds: 5 })); assert.throws(() => S.newMatch({ cats, free: true, letters: ['H'] }), /sem-letra/);
  assert.equal(S.newMatch({ cats, free: true, seconds: 45, rounds: 1, letters: ['B', 'C'] }).rounds, 1);
});
