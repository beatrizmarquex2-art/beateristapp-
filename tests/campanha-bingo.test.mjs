import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/jogos/bingo1-logic.js';
import * as E from '../js/campanha/engine.js';
import adv, { spec } from '../js/campanha/jogos/bingo.js';

const M = spec.missions;
/** Jogador atento usando só o motor real: sorteia, marca TUDO que saiu (e está na cartela) e grita bingo assim que a combinação existe. */
function perfect(m, { extraDraws = 0, errorsBefore = 0 } = {}) {
  let g = B.newMissionGame(m.params); let rb = 0; let rm = 0;
  for (let k = 0; k < errorsBefore; k++) { const r = B.toggleMark(g, 0, 0); if (!r.ok) rm++; else assert.fail('esperava recusa'); }
  let extra = extraDraws;
  for (;;) {
    if (g.drawn) for (let c = 0; c < 16; c++) { if (!g.marks[0][c] && B.calledIds(g).includes(g.cards[0][c])) g = B.toggleMark(g, 0, c).g; }
    const d = B.declare(g, 0);
    if (d.ok && extra-- <= 0) { g = d.g; break; }
    g = B.drawNext(g);
  }
  return { won: true, reason: 'bingo', draws: g.drawn, marks: g.marks[0].slice(), refusedMarks: rm, refusedBingo: rb, goal: g.goal, seed: m.params.seed };
}

test('spec válido: 10 missões, ids estáveis, tema bingo', () => {
  assert.equal(E.checkSpec(spec).ok, true, E.checkSpec(spec).errors.join());
  assert.equal(spec.id, 'bingo'); assert.equal(spec.theme, 'bingo'); assert.equal(M.length, 10);
  assert.deepEqual(M.map((m) => m.id), Array.from({ length: 10 }, (_, i) => `bingo-0${i}`));
  assert.equal(adv.spec, spec); assert.equal(typeof adv.mount, 'function');
  for (const m of M) { assert.equal(m.stars.length, 3); assert.ok(m.tag && m.rules.length >= 3 && m.goal.includes('bingo')); }
});

test('limites exatos por enumeração das 2^16 combinações (qualquer cartela e qualquer ordem)', () => {
  assert.deepEqual(B.drawBounds('linha'), { min: 4, max: 21 });
  assert.deepEqual(B.drawBounds('lincol'), { min: 7, max: 21 });
  assert.deepEqual(B.drawBounds('duas'), { min: 7, max: 21 });
  assert.deepEqual(B.drawBounds('cheia'), { min: 16, max: 24 });
});

test('amostra de 3000 partidas aleatórias respeita os limites provados', () => {
  for (const goal of ['linha', 'lincol', 'duas', 'cheia']) {
    const { min, max } = B.drawBounds(goal);
    for (let s = 1; s <= 750; s++) { const n = B.needDraws(B.newMissionGame({ seed: s * 7919, goal })); assert.ok(n >= min && n <= max, `${goal} seed ${s}: ${n}`); }
  }
});

test('grupos usam só itens existentes e as cartelas temáticas têm a linha do grupo', () => {
  const all = new Set(B.ITEMS.map((i) => i.id));
  assert.equal(B.CATS.instrumentos.ids.length, 12); assert.equal(B.CATS.bateria.ids.length, 7); assert.equal(B.CATS.equipamentos.ids.length, 4);
  const seen = new Set(); for (const c of Object.values(B.CATS)) for (const id of c.ids) { assert.ok(all.has(id), id); assert.ok(!seen.has(id), `repetido ${id}`); seen.add(id); }
  for (const m of M.filter((x) => x.params.cat)) {
    const g = B.newMissionGame(m.params); const ids = B.CATS[m.params.cat].ids;
    assert.equal(new Set(g.cards[0]).size, 16); assert.ok(B.LINES.some((l) => l.every((c) => ids.includes(g.cards[0][c]))), m.id);
    assert.ok(B.needDraws(g) <= 24);
  }
  const eq = B.newMissionGame(M[3].params); assert.equal(B.CATS.equipamentos.ids.every((i) => eq.cards[0].includes(i)), true);
});

test('toda missão é possível: jogo atento conclui em exatamente `need` sorteios com 3 estrelas', () => {
  for (const m of M) {
    const p = m.params; const g0 = B.newMissionGame(p);
    assert.equal(B.needDraws(g0), p.need, m.id); assert.ok(p.need >= B.drawBounds(p.goal).min && p.need <= B.drawBounds(p.goal).max, m.id);
    const r = perfect(m); assert.equal(r.draws, p.need, m.id);
    const ev = m.evaluate(r); assert.equal(ev.done, true, m.id); assert.equal(ev.stars, 3, m.id);
    for (const d of [p.limit, p.s2draws, p.s3draws]) if (d != null) assert.ok(d >= p.need, `${m.id}: limite ${d} < need ${p.need}`);
    assert.ok(p.need <= 24);
  }
});

test('viabilidade do pior caso: tirar todos os 24 sorteios sempre dá pra concluir as missões sem limite (marcas reais)', () => {
  for (const m of M.filter((x) => x.params.limit == null)) {
    let g = B.newMissionGame(m.params); for (let i = 0; i < 24; i++) g = B.drawNext(g);
    for (let c = 0; c < 16; c++) g = B.toggleMark(g, 0, c).g; // com os 24 sorteados, toda casa pode ser marcada
    const d = B.declare(g, 0); assert.ok(d.ok, m.id);
    const ev = m.evaluate({ won: true, reason: 'bingo', draws: 24, marks: g.marks[0], refusedMarks: 0, refusedBingo: 0 });
    assert.equal(ev.done, !m.params.strict || true); assert.ok(ev.stars >= 1, m.id);
  }
});

test('cartela cheia só conclui com todas as casas marcadas (24 sorteios no pior caso)', () => {
  const m = M[9]; const g = B.newMissionGame(m.params); assert.equal(g.goal, 'cheia');
  const r = perfect(m); r.marks[5] = false; assert.equal(m.evaluate(r).done, false);
  assert.equal(m.evaluate({ won: true, draws: 24, marks: Array(16).fill(true), refusedMarks: 0, refusedBingo: 0 }).done, true);
});

test('evaluate recusa resultado falso: sem marcas reais, itens não sorteados, derrota ou lixo', () => {
  for (const m of M) {
    for (const bad of [null, undefined, {}, { won: true }, { won: false, reason: 'erro', draws: 3, marks: Array(16).fill(false) }, { won: true, draws: m.params.need, marks: Array(16).fill(false) }, { won: true, draws: 0, marks: Array(16).fill(true) }]) assert.equal(m.evaluate(bad).done, false, m.id);
    const r = perfect(m); assert.equal(m.evaluate({ ...r, draws: m.params.need - 1 }).done, false, `${m.id}: marcas de itens não sorteados`);
  }
});

test('categoria: uma linha completa de OUTRO grupo não vale na missão temática', () => {
  const m = M[2]; let g = B.newMissionGame(m.params); for (let i = 0; i < 24; i++) g = B.drawNext(g);
  const ids = B.CATS.bateria.ids; const other = B.LINES.find((l) => !l.every((c) => ids.includes(g.cards[0][c])));
  for (const c of other) g = B.toggleMark(g, 0, c).g;
  assert.equal(B.winning(g, 0), null); assert.equal(B.declare(g, 0).ok, false);
});

test('objetivos: linha+coluna exige as duas; duas linhas exige 2; linha sozinha não basta', () => {
  let g = B.newMissionGame({ seed: 5, goal: 'lincol' }); for (let i = 0; i < 24; i++) g = B.drawNext(g);
  const mk = (cells) => { let x = g; for (const c of new Set(cells)) x = B.toggleMark(x, 0, c).g; return x; };
  assert.equal(B.winning(mk(B.LINES[0]), 0), null); assert.equal(B.winning(mk([...B.LINES[0], ...B.LINES[1]]), 0), null);
  assert.ok(B.winning(mk([...B.LINES[0], ...B.LINES[4]]), 0));
  g = { ...g, goal: 'duas' }; assert.equal(B.winning(mk(B.LINES[0]), 0), null);
  assert.ok(B.winning(mk([...B.LINES[0], ...B.LINES[1]]), 0)); assert.ok(B.winning(mk([...B.LINES[0], ...B.LINES[4]]), 0));
});

test('regras de erro e limite no evaluate', () => {
  const strict = M[4]; const r = perfect(strict);
  assert.equal(strict.evaluate({ ...r, refusedMarks: 1 }).done, false); assert.equal(strict.evaluate({ ...r, refusedBingo: 1 }).done, false);
  const rel = M[5]; const lim = rel.params.limit; assert.ok(lim > rel.params.need);
  assert.equal(rel.evaluate(perfect(rel, { extraDraws: lim - rel.params.need })).done, true);
  assert.equal(rel.evaluate(perfect(rel, { extraDraws: lim - rel.params.need + 1 })).done, false);
  assert.equal(rel.evaluate(perfect(rel)).stars, 3);
  assert.equal(rel.evaluate(perfect(rel, { extraDraws: 1 })).stars, 2);
  assert.equal(rel.evaluate({ ...perfect(rel, { extraDraws: 1 }), refusedMarks: 1 }).stars, 1);
  const tut = M[0]; assert.equal(tut.evaluate({ ...perfect(tut), refusedMarks: 2 }).stars, 1);
  assert.equal(tut.evaluate(perfect(tut, { extraDraws: tut.params.s3draws - tut.params.need + 1 })).stars, 2);
  const s4 = M[4]; assert.equal(s4.evaluate(perfect(s4, { extraDraws: 4 })).stars, 2); assert.equal(s4.evaluate(perfect(s4, { extraDraws: 5 })).stars, 1);
  const s8 = M[8]; assert.equal(s8.evaluate(perfect(s8, { extraDraws: 3 })).stars, 1);
});

test('desbloqueio pelo motor: só abre a próxima ao concluir; derrota não conclui; reabrir não conclui', () => {
  let g = E.blankGame(); assert.equal(E.isUnlocked(spec, g, 1), false);
  let out = E.applyResult(g, spec, 'bingo-00', { won: false, reason: 'erro', draws: 2, marks: Array(16).fill(false), refusedMarks: 1, refusedBingo: 0 });
  assert.equal(out.done, false); assert.equal(E.isUnlocked(spec, out.g, 1), false);
  out = E.applyResult(out.g, spec, 'bingo-00', perfect(M[0], { errorsBefore: 1 }));
  assert.equal(out.done, true); assert.equal(out.stars, 1); assert.equal(E.isUnlocked(spec, out.g, 1), true); assert.equal(E.isUnlocked(spec, out.g, 2), false);
  // a campanha toda em ordem
  g = E.blankGame(); for (const m of M) { assert.equal(E.isUnlocked(spec, g, M.indexOf(m)), true); g = E.applyResult(g, spec, m.id, perfect(m)).g; }
  assert.equal(E.totalStars(spec, g), 30); for (const id of ['first', 'half', 'all', 'perfect', 'bingo-temas', 'bingo-sem-erro', 'bingo-cheia']) assert.ok(g.medals.includes(id), id);
});

test('modo livre intacto nas funções puras: linha/cheia idênticas à regra original, sem campos novos', () => {
  const old = (g, card) => { const called = new Set(B.calledIds(g)); const ok = (c) => g.marks[card][c] && called.has(g.cards[card][c]); if (g.goal === 'cheia') return g.cards[card].every((_, c) => ok(c)) ? Array.from({ length: 16 }, (_, i) => i) : null; return B.LINES.find((l) => l.every(ok)) || null; };
  let s = 3; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  for (let t = 0; t < 400; t++) {
    const g = B.newGame({ goal: t % 2 ? 'cheia' : 'linha', rnd }); g.drawn = Math.floor(rnd() * 25); g.marks[0] = g.marks[0].map(() => rnd() < 0.7);
    assert.deepEqual(B.winning(g, 0), old(g, 0));
  }
  const g = B.newGame({ rnd }); assert.equal('cat' in g, false); assert.deepEqual(Object.keys(B.GOALS), ['linha', 'cheia']);
  assert.ok(B.validGame(g)); assert.ok(!B.validGame({ ...g, goal: 'outra' }));
});
