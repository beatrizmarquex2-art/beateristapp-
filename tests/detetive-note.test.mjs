import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, MODOS, FASES, cartas, poolFase, sortear, conferir, acertou, estrelas, maxPausas, ouvidasMax } from '../js/jogos/detetive-logic.js';
import { FOODS } from '../js/kids-logic.js';

test('figuras vem em primeiro; os 4 temas têm uma palavra por tempo e ela existe no Monte seu ritmo', () => {
  assert.deepEqual(MODOS, ['m1', 'm2', 'm3']);
  for (const t of ['comida', 'parque', 'corpo', 'animal']) for (const cell of ['1000', '1010', '1111']) { const f = FOODS.find((x) => x.id === TEMAS[t][cell]); assert.ok(f, `${t} ${cell}`); assert.equal(f.cell, cell); }
});
test('cada fase muda: 1 semínima/colcheias, 2 + pausa, 3-4 + semicolcheias (sem pausa), 5-6 tudo, 7+ tudo', () => {
  assert.deepEqual(poolFase(1), ['1000', '1010']); assert.deepEqual(poolFase(2), ['1000', '1010', '0000']); assert.deepEqual(poolFase(4), ['1000', '1010', '1111']); assert.equal(poolFase(6).length, 4); assert.equal(poolFase(12).length, 4);
  assert.notDeepEqual(poolFase(1), poolFase(2)); assert.notDeepEqual(poolFase(2), poolFase(3));
  assert.equal(cartas('comida', 1).length, 2); assert.equal(cartas('comida', 2).length, 3); assert.equal(cartas('comida', 12).length, 4); assert.equal(cartas('m1', 12)[3].id, null);
});
test('sortear: 4 tempos só com as células da fase, sem começar com pausa, no máximo 1 pausa, e a fase nova sempre usa a novidade', () => {
  for (let n = 1; n <= FASES; n++) for (let i = 0; i < 80; i++) {
    const s = sortear(n); assert.equal(s.length, 4); assert.ok(s.every((c) => poolFase(n).includes(c))); assert.notEqual(s[0], '0000'); assert.ok(s.filter((c) => c === '0000').length <= maxPausas(n)); assert.ok(new Set(s).size >= (n >= 7 ? 3 : 2));
    if (n >= 7) assert.ok(s.includes('1111')); if (n >= 9) assert.ok(s.includes('0000'));
    if (n === 2) assert.ok(s.includes('0000')); if (n === 3 || n === 4) assert.ok(s.includes('1111') && !s.includes('0000')); if (n === 5 || n === 6) assert.ok(s.includes('1111') && s.includes('0000'));
  }
});
test('conferir: certo, errado e vazio por tempo; acertou só com tudo certo', () => {
  const sec = ['1000', '1010', '1111', '1000'];
  assert.deepEqual(conferir(['1000', '1000', '1111'], sec), [true, false, true, null]);
  assert.ok(acertou(sec.slice(), sec)); assert.ok(!acertou(['1000', '1010', '1111'], sec));
});
test('estrelas da fase igual à pauLta: 3 de 3 = 3 estrelas, 2 de 3 = 1 estrela (67%), menos de 60% = 0', () => { assert.equal(estrelas(0), 0); assert.equal(estrelas(1), 0); assert.equal(estrelas(2), 1); assert.equal(estrelas(3), 3); assert.equal(estrelas(4, 5), 2); });

test('o compasso novo nunca repete o anterior', () => { for (let n = 1; n <= 12; n++) { let ant = null; for (let i = 0; i < 60; i++) { const s = sortear(n, Math.random, ant); if (ant) assert.notEqual(s.join(), ant.join()); ant = s; } } });

test('só de 120 pra cima toca direto, sem a contagem', async () => {
  const { COM_CONTAGEM } = await import('../js/jogos/detetive-logic.js');
  assert.deepEqual([80, 100, 120, 140].map(COM_CONTAGEM), [true, true, false, false]);
});

test('fases 7-12 ficam mais difíceis: ouvidas limitadas e caindo (6, 4, 3, 2), fases 1-6 sem limite', () => {
  for (let n = 1; n <= 6; n++) assert.equal(ouvidasMax(n), Infinity);
  assert.deepEqual([7, 8, 9, 10, 11, 12].map(ouvidasMax), [6, 6, 4, 4, 3, 2]); assert.equal(maxPausas(10), 1); assert.equal(maxPausas(11), 2);
});

test('3 mundos: cada fase tem até 6 cartas válidas, com a novidade da fase, e o compasso sorteado respeita elas', async () => {
  const L = await import('../js/jogos/detetive-logic.js');
  for (const m of L.MUNDOS) for (let n = 1; n <= FASES; n++) {
    const pool = L.poolFase(n, m); assert.ok(pool.length >= 2 && pool.length <= 6, `${m} ${n}`); assert.ok(pool.every((c) => /^[01]{4}f?$/.test(c)));
    const nova = n > 1 ? pool.filter((c) => !L.poolFase(n - 1, m).includes(c)) : [];
    let ant = null;
    for (let i = 0; i < 60; i++) { const s = sortear(n, Math.random, ant, m); assert.equal(s.length, 4); assert.ok(s.every((c) => pool.includes(c))); assert.notEqual(s[0], '0000'); assert.ok(s.filter((c) => c === '0000').length <= maxPausas(n)); if (nova.length) assert.ok(s.some((c) => nova.includes(c))); if (ant) assert.notEqual(s.join(), ant.join()); ant = s; }
    assert.equal(L.cartas(m, n).length, pool.length);
  }
});
test('mundo 1 tem pausa de semínima e de colcheia; mundo 2 tem pausa no 1, 2, 3 e 4; mundo 3 tem pontuadas e flam', async () => {
  const L = await import('../js/jogos/detetive-logic.js'); const all = (m) => new Set(Array.from({ length: FASES }, (_, i) => L.poolFase(i + 1, m)).flat());
  for (const c of ['0000', '0010']) assert.ok(all('m1').has(c)); for (const c of ['0111', '1011', '1101', '1110']) assert.ok(all('m2').has(c)); for (const c of ['1001', '1100', '1000f']) assert.ok(all('m3').has(c));
  assert.ok(![...all('m1')].some((c) => c === '1111' || L.temFlam(c)));
});
test('o andamento só sobe, em todos os modos: m1 70-100, m2 90-120, m3 100-140', async () => {
  const L = await import('../js/jogos/detetive-logic.js');
  for (const m of L.MODOS) for (let n = 2; n <= FASES; n++) assert.ok(L.bpmFase(m, n) >= L.bpmFase(m, n - 1));
  assert.deepEqual([L.bpmFase('m1', 1), L.bpmFase('m1', 12), L.bpmFase('m2', 1), L.bpmFase('m2', 12), L.bpmFase('m3', 1), L.bpmFase('m3', 12), L.bpmFase('comida', 12)], [70, 100, 90, 120, 100, 140, 120]);
});

test('estilo das cartas: só o mundo 1 troca (comida, parque, corpo, animal); mundos 2 e 3 são sempre figuras; pausa de colcheia vira "shh"', async () => {
  const L = await import('../js/jogos/detetive-logic.js');
  assert.deepEqual(L.ESTILOS, ['figuras', 'comida', 'parque', 'corpo', 'animal']);
  assert.equal(L.estiloDe('m1', 'parque'), 'parque'); assert.equal(L.estiloDe('m2', 'parque'), 'figuras'); assert.equal(L.estiloDe('m3', 'animal'), 'figuras'); assert.equal(L.estiloDe('m1', 'xyz'), 'figuras');
  for (const e of ['comida', 'parque', 'corpo', 'animal']) for (let n = 1; n <= FASES; n++) { const cs = L.cartas('m1', n, e); assert.ok(cs.every((c) => c.id), `${e} ${n}`); assert.ok(cs.filter((c) => c.cell === '1000').every((c) => c.id === L.TEMAS[e]['1000'])); }
  assert.ok(L.cartas('m1', 12, 'figuras').every((c) => c.id === null));
});
test('opção 100 bpm (adultos): só o mundo 1 muda e toca 100 desde a fase 1; os outros mundos seguem iguais', async () => {
  const L = await import('../js/jogos/detetive-logic.js');
  for (let n = 1; n <= L.FASES; n++) { assert.equal(L.bpmFase('m1', n, true), 100); assert.equal(L.bpmFase('m2', n, true), L.bpmFase('m2', n)); assert.equal(L.bpmFase('m3', n, true), L.bpmFase('m3', n)); }
  assert.equal(L.bpmFase('m1', 1), 70); assert.equal(L.bpmFase('m1', 12), 100);
});
