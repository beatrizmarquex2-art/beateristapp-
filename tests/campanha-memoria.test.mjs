import test from 'node:test'; import assert from 'node:assert/strict';
import { checkSpec, applyResult, blankGame, isUnlocked, statusOf, totalStars } from '../js/campanha/engine.js';
import { spec, starsFor } from '../js/campanha/jogos/memoria-spec.js';
import { deckIds, buildDeck, seeded, perfectTries, worstPerfect, minForcedSecs } from '../js/campanha/jogos/memoria-logic.js';
import { THEMES, SIZES, themeById } from '../js/kids/memory-themes.js';
import { shuffle } from '../js/kids-logic.js';

const ms = spec.missions;
test('spec válido, 11 missões, ids estáveis e tema do mapa', () => {
  assert.ok(checkSpec(spec).ok, checkSpec(spec).errors.join()); assert.equal(spec.theme, 'memoria'); assert.equal(ms.length, 11);
  assert.deepEqual(ms.map((m) => m.id), Array.from({ length: 11 }, (_, i) => `memoria-${String(i).padStart(2, '0')}`));
  ms.forEach((m) => { assert.ok(m.goal && m.tag && m.stars.length === 3 && m.rules.length); });
});
test('só tamanhos e temas que o jogo já tem; poucos pares no começo e mais depois', () => {
  ms.forEach((m) => { const p = m.params; assert.ok(SIZES.includes(p.pairs)); assert.ok(themeById[p.theme]); assert.ok(themeById[p.theme].items.length >= p.pairs, `${p.theme} tem cartas pra ${p.pairs} pares`); });
  const pairs = ms.map((m) => m.params.pairs); assert.deepEqual(pairs, [...pairs].sort((a, b) => a - b)); assert.equal(pairs[0], 4); assert.equal(pairs.at(-1), 12);
  assert.ok(new Set(ms.map((m) => m.params.theme)).size >= 6, 'vários conjuntos de cartas');
});
test('metas de tentativas: coerentes (mínimo teórico = nº de pares)', () => {
  ms.forEach((m) => { const [A, B, C] = m.def.goals; const n = m.params.pairs; assert.ok(C >= n && C < B && B < A, m.id); assert.equal(m.params.goalTries, C); assert.equal(m.params.maxTries, A); });
  ms.forEach((m) => { const n = m.params.pairs; assert.equal(starsFor(m.def, n, 1e9), 3, 'acertar todos de primeira sempre vale 3 estrelas'); assert.equal(starsFor(m.def, n - 1, 0), 0, 'menos que o nº de pares é impossível'); });
});
test('POSSÍVEL: um jogador de memória perfeita cumpre a meta de 3 estrelas no baralho de cada missão', () => {
  ms.forEach((m) => { const { theme, pairs, seed } = m.params; const t = perfectTries(deckIds(theme, pairs, seed)); assert.ok(t >= pairs && t <= m.def.goals[2], `${m.id}: memória perfeita faz ${t}, meta ${m.def.goals[2]}`); });
});
test('limite provado: memória perfeita nunca passa de 2n-1 (n=4 exaustivo; n=8/12 sorteando 3000 baralhos)', () => {
  // n=4: todas as 2520 disposições distintas das 8 cartas
  const perms = new Set(); const rec = (arr, cur) => { if (!arr.length) { perms.add(cur.join()); return; } new Set(arr).forEach((x) => { const i = arr.indexOf(x); rec([...arr.slice(0, i), ...arr.slice(i + 1)], [...cur, x]); }); };
  rec([0, 0, 1, 1, 2, 2, 3, 3], []); assert.equal(perms.size, 2520);
  let worst = 0; for (const p of perms) worst = Math.max(worst, perfectTries(p.split(',').map(Number))); assert.equal(worst, worstPerfect(4));
  for (const n of [8, 12]) { let w = 0; for (let s = 1; s <= 3000; s++) w = Math.max(w, perfectTries(deckIds(n === 8 ? 'instrumentos' : 'misturado', n, s))); assert.ok(w <= worstPerfect(n), `n=${n} pior ${w}`); }
});
test('a meta de 1 estrela (A) e a de 2 (B) estão acima do mínimo; ordem das estrelas', () => {
  ms.forEach((m) => { const [A, B, C] = m.def.goals; const n = m.params.pairs; assert.equal(starsFor(m.def, A, 1e9), 1); assert.equal(starsFor(m.def, B, 1e9) >= 2, true); assert.equal(starsFor(m.def, C, 1e9), 3); assert.equal(starsFor(m.def, A + 1, 0), 0); assert.ok(n < A); });
});
test('desafio de tempo é opcional e alcançável (meta ≥ 2× o tempo mínimo imposto pelo jogo no limite B)', () => {
  const timed = ms.filter((m) => m.params.secs); assert.ok(timed.length >= 4);
  timed.forEach((m) => { const [, B] = m.def.goals; assert.ok(minForcedSecs(B, m.params.pairs) * 2 <= m.params.secs, m.id); });
  const m = timed[0]; const [, B, C] = m.def.goals; const n = m.params.pairs;
  assert.equal(m.evaluate({ won: true, pairs: n, tries: B, ms: m.params.secs * 1000 }).stars, 3, 'B tentativas dentro do tempo = 3 estrelas');
  assert.equal(m.evaluate({ won: true, pairs: n, tries: B, ms: m.params.secs * 1000 + 1 }).stars, 2, 'sem o tempo continua 2 estrelas (tempo nunca é obrigatório)');
  assert.equal(m.evaluate({ won: true, pairs: n, tries: C, ms: 9e9 }).stars, 3, 'meta de tentativas dá 3 estrelas sem tempo');
  const notimed = ms.find((x) => !x.params.secs); assert.equal(notimed.evaluate({ won: true, pairs: notimed.params.pairs, tries: notimed.def.goals[1], ms: 1 }).stars, 2, 'sem desafio de tempo, tempo não conta');
});
test('evaluate: conclusão só com partida terminada de verdade', () => {
  const m = ms[1];
  assert.equal(m.evaluate(undefined).done, false); assert.equal(m.evaluate({ won: false, pairs: 4, tries: 5 }).done, false);
  assert.equal(m.evaluate({ won: true, pairs: 8, tries: 5, ms: 1 }).done, false, 'tamanho errado');
  assert.equal(m.evaluate({ won: true, pairs: 4, tries: 3, ms: 1 }).done, false, 'menos tentativas que pares é impossível');
  assert.equal(m.evaluate({ won: true, pairs: 4, tries: 13, ms: 1 }).done, false, 'passou do limite');
  const r = m.evaluate({ won: true, pairs: 4, tries: 12, ms: 5000 }); assert.deepEqual([r.done, r.stars], [true, 1]); assert.ok(r.summary.length && r.label);
  assert.equal(ms[0].evaluate({ won: true, pairs: 4, tries: 40, ms: 1 }).stars, 1, 'tutorial: acabar o tabuleiro já conclui');
  assert.deepEqual(ms.map((x) => x.evaluate({ won: true, pairs: x.params.pairs, tries: x.params.pairs, ms: 1 }).stars), ms.map(() => 3));
});
test('baralho com semente: reproduzível, completo e igual à montagem do modo livre', () => {
  ms.forEach((m) => { const { theme, pairs, seed } = m.params; const a = deckIds(theme, pairs, seed); assert.deepEqual(a, deckIds(theme, pairs, seed)); assert.equal(a.length, pairs * 2);
    const cnt = {}; a.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; }); assert.ok(Object.values(cnt).every((v) => v === 2) && Object.keys(cnt).length === pairs); });
  const r = seeded(7); const d = buildDeck('bandas', 4, r); const r2 = seeded(7); const th = themeById.bandas; // mesma conta que js/kids/memoria.js#play
  const picks = shuffle(th.items, r2).slice(0, 4); const deck = shuffle(picks.flatMap((it) => [{ it, side: 'a' }, { it, side: 'b' }]), r2).map((c, i) => ({ ...c, key: i }));
  assert.deepEqual(d.deck.map((c) => c.it.id), deck.map((c) => c.it.id));
});
test('desbloqueio via engine: só abre a próxima ao concluir; derrota não conclui', () => {
  let g = blankGame(); assert.equal(isUnlocked(spec, g, 1), false);
  let r = applyResult(g, spec, 'memoria-00', { won: false, pairs: 4, tries: 5 }); assert.equal(r.done, false); assert.equal(isUnlocked(spec, r.g, 1), false);
  r = applyResult(g, spec, 'memoria-00', { won: true, pairs: 4, tries: 6, ms: 9000 }); assert.equal(r.stars, 3); assert.equal(isUnlocked(spec, r.g, 1), true); assert.equal(isUnlocked(spec, r.g, 2), false);
  assert.ok(r.newMedals.some((x) => x.id === 'first'));
  for (const m of ms) r = applyResult(r.g, spec, m.id, { won: true, pairs: m.params.pairs, tries: m.params.pairs, ms: 1 });
  assert.equal(totalStars(spec, r.g), 33); assert.ok(r.g.medals.includes('memoria-mestre') && r.g.medals.includes('memoria-elefante') && r.g.medals.includes('memoria-doze') && r.g.medals.includes('perfect'));
});
test('modo livre intacto nas funções puras: tamanhos, temas e embaralhador', () => {
  assert.deepEqual(SIZES, [4, 8, 12]); assert.deepEqual(THEMES.map((t) => t.id), ['bandas', 'instrumentos', 'figuras', 'partitura', 'profissoes', 'palco', 'misturado']);
  const a = shuffle([1, 2, 3, 4, 5], seeded(3)); assert.equal(a.length, 5); assert.deepEqual([...a].sort(), [1, 2, 3, 4, 5]);
  assert.equal(shuffle([1, 2, 3]).length, 3);
});
