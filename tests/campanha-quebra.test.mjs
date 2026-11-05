import test from 'node:test'; import assert from 'node:assert/strict';
import { spec } from '../js/campanha/jogos/quebra.js';
import * as Q from '../js/jogos/quebra-logic.js';
import { checkSpec, applyResult, blankGame, isUnlocked, statusOf } from '../js/campanha/engine.js';
import { THEMES } from '../js/campanha/themes.js';
import { IMAGES } from '../js/jogos/quebra.js';
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const win = (m, o = {}) => ({ won: true, diff: m.params.diff, img: 'palco', errors: 0, hints: 0, elapsed: 1000, moves: m.params.diff, ...o });

test('spec válido, 11 missões, ids estáveis, tema existente', () => {
  assert.ok(checkSpec(spec).ok); assert.equal(spec.missions.length, 11); assert.ok(THEMES[spec.theme]);
  assert.deepEqual(spec.missions.map((m) => m.id), Array.from({ length: 11 }, (_, i) => `quebra-${String(i).padStart(2, '0')}`));
});
test('só usa grades suportadas, em ordem crescente de peças, com a imagem que existe', () => {
  const d = spec.missions.map((m) => m.params.diff); assert.ok(d.every((x) => Q.DIFFS[x])); assert.deepEqual(d, [...d].sort((a, b) => a - b)); assert.ok(d[0] === 6 && d.at(-1) === 24);
  assert.ok(spec.missions.every((m) => IMAGES.some((x) => x.id === m.params.img))); // só imagens que existem
  assert.ok(new Set(spec.missions.map((m) => m.params.img)).size >= 7); // a imagem varia de missão em missão
});
test('concluir exige todas as peças: resultado incompleto ou de outra grade não conclui', () => {
  const m = spec.missions[0];
  for (const r of [null, {}, { won: false }, win(m, { diff: 12 }), { ...win(m), won: undefined }]) assert.equal(m.evaluate(r, m).done, false);
  assert.equal(applyResult(blankGame(), spec, m.id, null).g.m[m.id].s, 0);
});
test('estrelas: ★1 montar, ★2 erros ≤ maxErr, ★3 sem dicas + precisão + tempo (se declarado)', () => {
  for (const m of spec.missions) {
    const p = m.params; const ev = (o) => m.evaluate(win(m, o), m);
    assert.equal(ev({ errors: p.maxErr + 1, elapsed: 1e9 }).stars, 1);
    assert.equal(ev({ errors: p.maxErr, elapsed: 1e9 }).stars, p.perfect >= p.maxErr && p.timeMs == null ? 3 : 2);
    assert.equal(ev({ errors: p.perfect, hints: 1 }).stars, 2);
    assert.equal(ev({ errors: p.perfect }).stars, 3);
    assert.ok(ev({ errors: 99, hints: 9, elapsed: 1e9 }).done, 'passar do tempo/erros nunca impede concluir');
    if (p.timeMs != null) { assert.equal(ev({ elapsed: p.timeMs }).stars, 3); assert.equal(ev({ elapsed: p.timeMs + 1 }).stars, 2); } else assert.equal(ev({ elapsed: 9e9 }).stars, 3);
  }
});
test('tempo é opcional: estourar o tempo ainda conclui e destrava a próxima', () => {
  const m = spec.missions[1]; const r = applyResult(blankGame(), spec, m.id, win(m, { elapsed: 10 * m.params.timeMs }));
  assert.ok(r.done && r.stars === 2 && isUnlocked(spec, r.g, 2));
});
test('metas alcançáveis: jogada perfeita (n encaixes, 0 erros) dá 3 estrelas; mínimo teórico = nº de peças', () => {
  for (const m of spec.missions) {
    let g = Q.newGame({ diff: m.params.diff, rnd: seeded(m.params.diff + 7) }); let moves = 0;
    while (!g.over) { g = Q.place(g, g.tray[0], g.tray[0]).g; moves++; }
    assert.equal(moves, m.params.diff); assert.equal(g.errors, 0);
    const ev = m.evaluate({ won: true, diff: g.diff, errors: g.errors, hints: g.hints, elapsed: moves * 2000, moves }, m); assert.equal(ev.stars, 3, m.id);
    assert.ok(ev.summary.some((t) => t.includes(`mínimo possível é ${m.params.diff}`)));
  }
});
test('tempos declarados são folgados (≥ 5 s por peça, e nunca mais apertados que 2 s/peça de toque duplo) e erros permitidos coerentes', () => {
  for (const m of spec.missions) { const p = m.params; if (p.timeMs != null) assert.ok(p.timeMs / p.diff >= 5000, m.id); assert.ok(p.perfect <= p.maxErr && p.maxErr < p.diff); }
  const t = spec.missions.filter((m) => m.params.timeMs).map((m) => m.params.timeMs / m.params.diff); assert.ok(Math.min(...t) >= 5000);
  assert.equal(spec.missions[0].params.timeMs, null);
});
test('desbloqueio: só a 0 aberta; ★1 abre a seguinte; derrota/abrir não conclui', () => {
  let g = blankGame(); assert.deepEqual(statusOf(spec, g).map((x) => x.unlocked), [true, ...Array(10).fill(false)]);
  g = applyResult(g, spec, spec.missions[0].id, win(spec.missions[0], { errors: 50 })).g; assert.ok(isUnlocked(spec, g, 1)); assert.ok(!isUnlocked(spec, g, 2));
});
test('medalhas: ganhas só pelo progresso real', () => {
  const mk = (stars) => { let g = blankGame(); for (const [i, s] of Object.entries(stars)) g.m[spec.missions[i].id] = { s, n: 1 }; return g; };
  const by = (id) => spec.medals.find((x) => x.id === id);
  assert.ok(!by('quebra-mao-firme').test(blankGame())); assert.ok(by('quebra-mao-firme').test(mk({ 0: 3, 1: 3, 2: 3 }))); assert.ok(!by('quebra-mao-firme').test(mk({ 0: 3, 1: 3, 2: 2 })));
  assert.ok(by('quebra-relogio').test(mk({ 1: 3, 2: 3, 3: 3 }))); assert.ok(!by('quebra-relogio').test(mk({ 0: 3, 1: 3, 2: 3 })));
  assert.ok(by('quebra-gigante').test(mk({ 7: 1, 8: 1, 9: 1, 10: 1 }))); assert.ok(!by('quebra-gigante').test(mk({ 7: 1 })));
});
test('modo livre intacto nas funções puras (grades, melhor tempo)', () => {
  assert.deepEqual(Object.keys(Q.DIFFS), ['6', '12', '24']); assert.equal(Q.bestKey({ diff: 6, hints: 0 }), '6:sem');
  assert.equal(Q.newGame({ diff: 6 }).free, false);
});
