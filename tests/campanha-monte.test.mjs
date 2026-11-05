import test from 'node:test'; import assert from 'node:assert/strict';
import { checkSpec, applyResult, blankGame, isUnlocked, totalStars } from '../js/campanha/engine.js';
import { spec } from '../js/campanha/jogos/monte-spec.js';
import { P, B, C, R, FOOD_OF_CELL, check, solutions, cellFor, mergeReq } from '../js/campanha/jogos/monte-logic.js';
import { FOODS, cellOf, sameRhythm, foodOf } from '../js/kids-logic.js';

const ms = spec.missions; const W = FOOD_OF_CELL; // uma palavra por célula
const bySlots = (cells) => cells.map((c) => W[c]);
test('spec válido, 11 missões, ids estáveis, tema do mapa', () => {
  assert.ok(checkSpec(spec).ok, checkSpec(spec).errors.join()); assert.equal(spec.theme, 'monte'); assert.equal(ms.length, 11);
  assert.deepEqual(ms.map((m) => m.id), Array.from({ length: 11 }, (_, i) => `monte-${String(i).padStart(2, '0')}`));
  ms.forEach((m) => { assert.ok(m.goal && m.tag && m.stars.length === 3 && m.rules.length, m.id); });
});
test('só palavras e células que já existem em FOODS (pão, bolo, chocolate, shhh)', () => {
  assert.deepEqual([P, B, C, R].map((c) => FOODS.some((f) => f.cell === c)), [true, true, true, true]);
  ms.forEach((m) => Object.values(m.params.fixed).forEach((id) => assert.ok(FOODS.some((f) => f.id === id)))); assert.deepEqual([W[P], W[B], W[C], W[R]], ['pao', 'bolo', 'chocolate', 'shh']);
});
test('POSSÍVEL: cada missão (e o desafio extra) tem solução, por enumeração de todas as combinações', () => {
  for (const m of ms) { const a = solutions(m.params.req); const b = solutions(m.params.extra); assert.ok(a.length > 0, `${m.id} sem solução`); assert.ok(b.length > 0, `${m.id} extra sem solução`); assert.ok(b.length <= a.length, 'o extra só restringe'); }
  ms.filter((m) => m.id !== 'monte-06').forEach((m) => assert.ok(solutions(m.params.req).length > 1, `${m.id}: várias respostas válidas`));
  assert.equal(solutions(ms[6].params.req).length, 1, 'só "sequência pedida" tem resposta única (a missão pede essa sequência)');
});
test('progressão: nº de compassos não diminui e as cartas permitidas só crescem depois do começo', () => {
  const bars = ms.map((m) => m.params.bars); assert.deepEqual(bars, [...bars].sort()); assert.equal(bars[0], 1); assert.equal(bars.at(-1), 2);
  assert.ok(ms[0].params.cells.length < 4 && ms[4].params.cells.length === 4);
});
test('validação: estrutura do compasso (4 tempos totalmente preenchidos, pausa, 2 durações, figura pedida)', () => {
  const r = { minRests: 1, minDistinct: 2, use: [C] };
  assert.equal(check(bySlots([P, B, C, R]), r).ok, true);
  assert.equal(check([W[P], W[B], W[C], null], r).complete, false, 'tempo vazio'); assert.equal(check([W[P], W[B], W[C], null], r).ok, false);
  assert.equal(check(bySlots([P, B, C, B]), r).ok, false, 'sem pausa'); assert.equal(check(bySlots([P, P, C, R]), r).ok, true);
  assert.equal(check(bySlots([P, P, P, R]), r).ok, false, 'uma duração só e sem chocolate'); assert.equal(check(bySlots([B, B, B, R]), { minDistinct: 2 }).ok, false);
  assert.equal(check(bySlots([P, B, B, B]), { use: [C] }).ok, false, 'falta a figura pedida');
  assert.equal(check(['pao', 'bolo'], { minRests: 0 }).ok, false, 'compasso curto');
});
test('validação por ESTRUTURA: palavras diferentes do mesmo grupo valem igual; nada de sequência fixa', () => {
  const m = ms[4]; // durações: ≥2 diferentes + pausa
  const a = ['pao', 'bolo', 'cao', 'shh']; const b = ['pato', 'ceu', 'bicicleta', 'shh']; const c = ['shh', 'mao', 'borboleta', 'braco'];
  [a, b, c].forEach((s) => assert.deepEqual([m.evaluate({ slots: s, wrong: 0 }).done], [true]));
  assert.equal(m.evaluate({ slots: ['pao', 'ceu', 'mao', 'shh'], wrong: 0 }).done, false, 'só uma duração');
  assert.equal(m.evaluate({ slots: ['pao', 'bolo', 'chocolate', 'bola'], wrong: 0 }).done, false, 'sem pausa');
  const s = ms[6]; assert.equal(s.evaluate({ slots: ['bola', 'cao', 'esqueleto', 'shh'], wrong: 0, plays: 1 }).done, true, 'sequência pedida com outras palavras');
  assert.equal(s.evaluate({ slots: ['pao', 'bolo', 'chocolate', 'shh'], wrong: 0 }).done, false);
  assert.ok(sameRhythm(['bola', 'cao', 'esqueleto', 'shh'], ['bolo', 'pao', 'chocolate', 'shh']));
});
test('regras específicas: tempos fixos, começar com som, pausa por compasso, espelho, resposta diferente, final', () => {
  const t = ms[0].params.req; assert.equal(check(['pao', 'pao', 'pao', 'bolo'], t).ok, true); assert.equal(check(['bolo', 'pao', 'pao', 'bolo'], t).ok, false, 'tempo fixo trocado');
  const st = ms[2].params.req; assert.equal(check(bySlots([R, P, B, P]), st).ok, false, 'começa com shhh'); assert.equal(check(bySlots([P, R, B, P]), st).ok, true);
  const two = ms[7].params.req; assert.equal(check(bySlots([P, R, B, B, B, P, P, R]), two).ok, true); assert.equal(check(bySlots([P, R, B, B, B, P, P, P]), two).ok, false, '2º compasso sem pausa');
  const mir = ms[8].params.req; assert.equal(check(bySlots([P, B, C, R, P, B, C, R]), mir).ok, true); assert.equal(check(bySlots([P, B, C, R, P, B, C, B]), mir).ok, false, 'não repete');
  const qa = ms[9].params.req; const q = [B, P, C, R]; assert.equal(check(bySlots([...q, P, C, B, R]), qa).ok, true); assert.equal(check(bySlots([...q, ...q]), qa).ok, false, 'igual ao 1º'); assert.equal(check(bySlots([...q, P, C, B, B]), qa).ok, false, 'não termina com shhh');
  const fin = ms[10].params.req; assert.equal(check(bySlots([P, B, C, R, B, C, C, R]), fin).ok, true); assert.equal(check(bySlots([P, B, C, R, B, C, C, B]), fin).ok, false);
  assert.equal(check(bySlots([P, B, B, R, B, B, B, R]), fin).ok, false, 'falta chocolate');
});
test('estrelas: ★ cumprir · ★★ + extra · ★★★ + nenhum erro; inválido não conclui', () => {
  const m = ms[1]; const ok = ['pao', 'bolo', 'cao', 'pato']; const ex = ['pao', 'bolo', 'cao', 'shh'];
  const bad = m.evaluate({ slots: ['pao', 'pao', 'cao', 'ceu'], wrong: 0 }); assert.deepEqual([bad.done, bad.stars], [false, 0]);
  assert.equal(m.evaluate({ slots: ok, wrong: 0 }).stars, 1); assert.equal(m.evaluate({ slots: ex, wrong: 2 }).stars, 2); assert.equal(m.evaluate({ slots: ex, wrong: 0 }).stars, 3);
  assert.equal(m.evaluate({ slots: ok, wrong: 3 }).stars, 1); assert.equal(m.evaluate(undefined).done, false); assert.equal(m.evaluate({ slots: 'x' }).done, false);
  const seq = ms[6]; const good = ['bolo', 'pao', 'chocolate', 'shh']; assert.equal(seq.evaluate({ slots: good, wrong: 0, plays: 0 }).stars, 1, 'sem ouvir não ganha o extra'); assert.equal(seq.evaluate({ slots: good, wrong: 0, plays: 2 }).stars, 3);
  ms.forEach((x) => { const best = solutions(x.params.extra)[0]; assert.equal(x.evaluate({ slots: bySlots(best), wrong: 0, plays: 1 }).stars, 3, x.id); const base = solutions(x.params.req).find((s) => !check(bySlots(s), x.params.extra, { plays: 1 }).ok); if (base) assert.equal(x.evaluate({ slots: bySlots(base), wrong: 0, plays: 1 }).stars, 1, x.id); });
});
test('desbloqueio via engine: abrir não conclui; só cumprir libera a próxima', () => {
  let g = blankGame(); assert.equal(isUnlocked(spec, g, 1), false);
  let r = applyResult(g, spec, 'monte-00', { slots: ['pao', 'pao', 'pao', null], wrong: 0 }); assert.equal(r.done, false); assert.equal(isUnlocked(spec, r.g, 1), false);
  r = applyResult(g, spec, 'monte-00', { slots: ['pao', 'pao', 'pao', 'shh'], wrong: 0 }); assert.equal(r.stars, 3); assert.equal(isUnlocked(spec, r.g, 1), true); assert.equal(isUnlocked(spec, r.g, 2), false);
  for (const m of ms) r = applyResult(r.g, spec, m.id, { slots: bySlots(solutions(m.params.extra)[0]), wrong: 0, plays: 1 });
  assert.equal(totalStars(spec, r.g), 33); ['monte-pausa', 'monte-compositor', 'monte-extras', 'all', 'perfect'].forEach((id) => assert.ok(r.g.medals.includes(id), id));
});
test('criador livre intacto nas funções puras (FOODS, cellOf, sameRhythm)', () => {
  assert.equal(FOODS.length, 13); assert.equal(cellOf('pao'), '1000'); assert.equal(cellOf('bolo'), '1010'); assert.equal(cellOf('chocolate'), '1111'); assert.equal(cellOf('shh'), '0000');
  assert.equal(sameRhythm(['pao', 'bolo'], ['cao', 'pato']), true); assert.equal(sameRhythm(['pao'], ['bolo']), false); assert.equal(foodOf('x').id, 'shh'); assert.equal(cellFor('x'), null);
  assert.deepEqual(mergeReq({ use: [C] }, { use: [B], minRests: 1 }).use, [C, B]);
});
