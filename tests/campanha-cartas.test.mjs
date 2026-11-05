import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/jogos/cartas-logic.js';
import { spec, meets, SEEDS, OPP } from '../js/campanha/jogos/cartas.js';
import { checkSpec, applyResult, blankGame, isUnlocked, statusOf, totalStars, allMedals } from '../js/campanha/engine.js';

let uid = 5000;
const card = (color, kind) => ({ id: `a${uid++}`, color, kind, sym: null });
const SY = C.SYMS; const fig = (color, i) => ({ id: `a${uid++}`, color, kind: 'fig', sym: SY[i] });
const base = (o) => ({ v: 2, mode: 'paul', n: 2, dir: 1, hands: [[], []], draw: [], discard: [fig('vermelho', 2)], color: 'vermelho', turn: 1, drawn: null, passes: 0, over: false, result: null, unoPending: null, unoSaid: null, shuf: 0, seq: 0, ev: null, ...o });
// jogador de referência com "mãos trêmulas": segue a política do jogo, mas erra a escolha com prob. eps (sorteio próprio, independente do baralho)
const noisy = (basePolicy, eps, seed) => { const nr = C.seededRnd(seed * 104729 + 7); return (g, rnd) => { const legal = C.legalCards(g, 0); if (legal.length > 1 && nr() < eps) { const c = legal[Math.floor(nr() * legal.length)]; return { type: 'play', id: c.id, color: C.isWild(c) ? C.COLORS[Math.floor(nr() * 4)] : undefined }; } return C.aiMove(g, 0, basePolicy, rnd); }; };
const win = (o = {}) => ({ won: true, tie: false, lost: false, reason: 'mao-vazia', rounds: 10, draws: 2, plays: 8, specials: 2, byKind: {}, mine: 0, theirs: 3, ...o });
const loss = { won: false, tie: false, lost: true, reason: 'mao-vazia', rounds: 10, draws: 0, plays: 8, specials: 5, byKind: {}, mine: 2, theirs: 0 };

test('spec: 10 missões, ids estáveis, checkSpec ok, textos e params completos', () => {
  assert.equal(checkSpec(spec).ok, true); assert.equal(spec.missions.length, 10);
  assert.deepEqual(spec.missions.map((m) => m.id), Array.from({ length: 10 }, (_, i) => `cartas-${String(i).padStart(2, '0')}`));
  assert.equal(spec.id, 'cartas'); assert.equal(spec.theme, 'cartas');
  for (const m of spec.missions) {
    assert.ok(m.title && m.goal && m.tag && m.rules.length && m.stars.length === 3, m.id);
    assert.ok(Number.isInteger(m.params.seed) && C.AI_STYLES.includes(m.params.style) && OPP[m.params.style], m.id);
    assert.ok(!/kids/i.test(JSON.stringify([m.title, m.goal, m.tag, m.rules, m.stars])));
  }
  assert.equal(new Set(SEEDS).size, SEEDS.length);
});
test('estilos de dificuldade crescente: iniciantes contra o distraído, depois outros estilos, final contra o estrategista', () => {
  assert.deepEqual(spec.missions.map((m) => m.params.style), ['distraido', 'distraido', 'paul', 'guardiao', 'pintor', 'paul', 'guardiao', 'pintor', 'esperto', 'esperto']);
  assert.equal(spec.missions[0].params.hint, true); assert.equal(spec.missions[9].params.hint, false);
});
test('evaluate: derrota, empate e resultado vazio nunca concluem', () => {
  for (const m of spec.missions) {
    assert.equal(m.evaluate(loss).done, false, m.id); assert.equal(m.evaluate(loss).stars, 0);
    assert.equal(m.evaluate({ ...win(), won: false, tie: true }).done, false); assert.equal(m.evaluate(null).done, false); assert.equal(m.evaluate(undefined).done, false);
  }
});
test('evaluate: vitória pura (missões 0 a 4, 8) dá 1★ e as metas dão 2★/3★ exatamente como o texto', () => {
  const m0 = spec.missions[0];
  assert.deepEqual([m0.evaluate(win({ draws: 5 })).stars, m0.evaluate(win({ draws: 4 })).stars, m0.evaluate(win({ draws: 2 })).stars, m0.evaluate(win({ draws: 0 })).stars], [1, 2, 3, 3]);
  const m1 = spec.missions[1]; assert.deepEqual([m1.evaluate(win({ specials: 0 })).stars, m1.evaluate(win({ specials: 3, draws: 9 })).stars, m1.evaluate(win({ specials: 4, draws: 3 })).stars, m1.evaluate(win({ specials: 4, draws: 4 })).stars], [1, 2, 3, 2]);
  const m3 = spec.missions[3]; assert.deepEqual([13, 12, 9, 8].map((r) => m3.evaluate(win({ rounds: r })).stars), [1, 2, 3, 3]);
  assert.match(m0.evaluate(win()).summary.join(' '), /rodadas: 10 · compras: 2/);
});
test('evaluate: desafios (especiais, relâmpago, sem comprar, final) exigem a meta para concluir', () => {
  const m5 = spec.missions[5]; assert.equal(m5.evaluate(win({ specials: 3 })).done, false); assert.match(m5.evaluate(win({ specials: 3 })).summary.join(' '), /faltou a meta/);
  assert.deepEqual([4, 5, 6, 8].map((n) => m5.evaluate(win({ specials: n })).stars), [1, 2, 3, 3]);
  const m6 = spec.missions[6]; assert.equal(m6.evaluate(win({ rounds: 12 })).done, false); assert.deepEqual([11, 9, 7, 5].map((n) => m6.evaluate(win({ rounds: n })).stars), [1, 2, 3, 3]);
  const m7 = spec.missions[7]; assert.equal(m7.evaluate(win({ draws: 3 })).done, false); assert.deepEqual([2, 1, 0].map((n) => m7.evaluate(win({ draws: n })).stars), [1, 2, 3]);
  const m9 = spec.missions[9]; assert.equal(m9.evaluate(win({ draws: 3, specials: 2 })).done, false); assert.equal(m9.evaluate(win({ draws: 4, specials: 5 })).done, false);
  assert.deepEqual([win({ draws: 3, specials: 3, rounds: 15 }), win({ draws: 2, specials: 4, rounds: 15 }), win({ draws: 1, specials: 4, rounds: 10 }), win({ draws: 1, specials: 4, rounds: 11 })].map((r) => m9.evaluate(r).stars), [1, 2, 3, 2]);
  assert.ok(m9.evaluate(win({ draws: 0, specials: 4, rounds: 6 })).label);
  assert.match(m9.evaluate(win({ draws: 0, specials: 4, rounds: 6, caught: 2 })).summary.join(' '), /esqueceu o UNO 2 vezes/);
});
test('evaluate é puro e determinístico', () => { for (const m of spec.missions) { const r = win({ draws: 1, specials: 3, rounds: 8 }); assert.deepEqual(m.evaluate(r), m.evaluate({ ...r })); } });

test('medição: rodada, compras e especiais registradas pelas regras reais (inclui +4)', () => {
  const st = C.newStats(); const sk = card('vermelho', 'pular'); const w = card(null, 'curinga'); const n1 = fig('vermelho', 0); const n2 = fig('azul', 4);
  let g = base({ turn: 0, hands: [[sk, w, n1, n2], [fig('azul', 1), fig('azul', 5)]], draw: [fig('verde', 6), fig('azul', 3)] });
  let b = g; g = C.applyPlay(g, 0, sk.id, undefined, () => 0.5); C.track(st, b, g, { type: 'play', id: sk.id }); // pular: continua a vez, mesma rodada
  assert.equal(g.turn, 0); assert.equal(st.rounds, 1); assert.equal(st.specials, 1);
  b = g; g = C.applyPlay(g, 0, w.id, 'azul', () => 0.5); C.track(st, b, g, { type: 'play', id: w.id }); // curinga passa a vez
  assert.equal(g.turn, 1); assert.equal(st.specials, 2); assert.equal(st.byKind.curinga, 1); assert.equal(st.open, false);
  g = { ...g, turn: 0 }; b = g; g = C.applyPlay(g, 0, n2.id, undefined, () => 0.5); C.track(st, b, g, { type: 'play', id: n2.id });
  assert.equal(st.rounds, 2); assert.equal(st.specials, 2); assert.equal(st.draws, 0);
  const d = base({ turn: 0, hands: [[fig('azul', 4)], [fig('azul', 2)]], draw: [fig('verde', 6)] }); const st2 = C.newStats(); const d2 = C.applyDraw(d, 0); C.track(st2, d, d2, { type: 'draw' });
  assert.deepEqual([st2.draws, st2.rounds], [1, 1]);
  const p4 = card(null, 'mais4'); const e = base({ turn: 0, hands: [[p4, fig('azul', 0), fig('azul', 1)], [fig('azul', 2)]], draw: [1, 2, 3, 4].map((k) => fig('verde', k)), color: 'verde', discard: [fig('verde', 9)] });
  const st3 = C.newStats(); const e2 = C.applyPlay(e, 0, p4.id, 'azul'); C.track(st3, e, e2, { type: 'play', id: p4.id }); assert.deepEqual([st3.byKind.mais4, st3.specials, e2.turn, e2.hands[1].length], [1, 1, 0, 5]);
});
test('matchResult: vitória, derrota e empate', () => {
  const st = { ...C.newStats(), rounds: 7, draws: 1, plays: 7, specials: 2 };
  const g = (winner) => ({ result: { winner, reason: 'mao-vazia', counts: [0, 3] } });
  assert.equal(C.matchResult(g(0), st).won, true); assert.equal(C.matchResult(g(1), st).lost, true); assert.equal(C.matchResult(g(null), st).tie, true);
  assert.equal(C.matchResult(g(0), st).rounds, 7);
});

test('estilos de adversário: escolhas diferentes na mesma mesa, todas legais (inclui regra do +4)', () => {
  const d2 = card('vermelho', 'mais2'); const n = fig('vermelho', 5); const w = card(null, 'curinga'); const n2 = fig('azul', 2); const x = fig('azul', 1); const p4 = card(null, 'mais4');
  const g = base({ hands: [[fig('azul', 6), fig('azul', 2), fig('verde', 2), fig('verde', 3)], [d2, n, w, n2, x, p4]], draw: [fig('azul', 2)] }); const r = () => 0.3;
  assert.equal(C.legalCards(g, 1).some((c) => c.id === p4.id), false); // +4 só sem a cor da mesa na mão
  const pick = (s) => C.aiMove(g, 1, s, r);
  assert.equal(pick('paul').id, d2.id); assert.equal(pick('guardiao').type, 'play'); assert.notEqual(pick('guardiao').id, d2.id); assert.notEqual(pick('guardiao').id, w.id);
  for (const s of C.AI_STYLES) { const mv = pick(s); assert.equal(mv.type, 'play'); assert.ok(C.legalCards(g, 1).some((c) => c.id === mv.id), s); if (mv.id === w.id) assert.ok(C.COLORS.includes(mv.color)); }
  const g2 = base({ hands: [[fig('azul', 6)], [d2, n]], draw: [fig('azul', 2)] }); assert.equal(C.aiMove(g2, 1, 'guardiao', r).id, d2.id); // adversário quase ganhando: solta a ação
  const stuck = base({ hands: [[fig('azul', 6)], [fig('azul', 4)]], draw: [fig('azul', 2)] }); for (const s of C.AI_STYLES) assert.deepEqual(C.aiMove(stuck, 1, s, r), { type: 'draw' });
  assert.deepEqual(C.aiMove({ ...stuck, draw: [] }, 1, 'esperto', r), { type: 'pass' });
  assert.deepEqual(C.aiMove(g, 1, 'paul', r), C.paulMove(g, 1, r));
  const only4 = base({ hands: [[fig('azul', 6)], [p4, fig('azul', 4)]], draw: [] }); // com a cor da mesa na mão... mão sem vermelho: +4 vale
  const g3 = base({ hands: [[fig('azul', 6)], [p4, fig('azul', 4)]] }); assert.ok(C.legalCards(g3, 1).some((c) => c.id === p4.id)); assert.ok(only4);
});
test('estilos de adversário: 1500 partidas entre quaisquer estilos terminam, conservam 112 cartas, com UNO, e só jogam lances válidos', () => {
  let n = 0;
  for (const a of C.AI_STYLES) for (const b of C.AI_STYLES) for (let s = 1; s <= 60; s++) {
    const rnd = C.seededRnd(s * 31 + n++); let g = C.newGame({ rnd }); let k = 0;
    while (!g.over && k++ < 3000) {
      const mv = C.aiMove(g, g.turn, g.turn === 0 ? a : b, rnd);
      g = mv.type === 'play' ? C.applyPlay(g, g.turn, mv.id, mv.color, rnd) : mv.type === 'draw' ? C.applyDraw(g, g.turn, rnd) : C.applyPass(g, g.turn);
      if (!g.over && g.unoPending != null && C.mustUno(g, g.unoPending)) g = C.callUno(g, g.unoPending);
      assert.equal(g.hands[0].length + g.hands[1].length + g.draw.length + g.discard.length, 112);
    }
    assert.ok(g.over && C.validGame(g), `${a} x ${b} semente ${s}`);
  }
});

test('modo livre intacto: newGame/paulMove idênticos aos de sempre e semente reproduzível', () => {
  const a = C.newGame({ rnd: C.seededRnd(42) }); const b = C.newGame({ rnd: C.seededRnd(42) }); assert.deepEqual(a, b);
  assert.deepEqual(C.newGame({ rnd: C.seededRnd(1) }), C.newGame({ rnd: C.seededRnd(1) })); assert.notDeepEqual(C.newGame({ rnd: C.seededRnd(1) }).hands, C.newGame({ rnd: C.seededRnd(2) }).hands);
  assert.equal(C.HAND, 7); assert.equal(C.makeDeck().length, 112); assert.deepEqual(C.ACTIONS, ['pular', 'inverter', 'mais2']);
  assert.equal(typeof C.paulMove, 'function'); assert.equal(typeof C.legalCards, 'function');
});
test('partida de cada missão é reproduzível (mesma semente + mesmas jogadas = mesmo resultado)', () => {
  for (const m of spec.missions) { const pol = () => noisy('esperto', 0.2, 3); const r1 = C.simulate(m.params, pol()); const r2 = C.simulate(m.params, pol()); assert.deepEqual(r1.g, r2.g); assert.ok(r1.g.over); assert.equal(r1.g.n, 2); assert.ok(C.validGame(r1.g)); }
});

test('VIABILIDADE: cada missão tem partida em que a meta de 3 estrelas é cumprida (construção por busca) e a de 1 estrela é comum', () => {
  const rates = [];
  for (const m of spec.missions) {
    const [L1, , L3] = m.params.limits; let found3 = -1; let ok1 = 0; const N = 120;
    for (let k = 0; k < N; k++) {
      const r = C.simulate(m.params, noisy(k % 2 ? 'paul' : 'esperto', 0.2, k + 5000)); if (meets(r, L1)) ok1++;
      if (found3 < 0 && meets(r, L3)) { found3 = k; const ev = m.evaluate(r); assert.equal(ev.done, true); assert.equal(ev.stars, 3, m.id); }
    }
    assert.ok(found3 >= 0, `${m.id}: nenhuma partida de 3★ em ${N}`); assert.ok(ok1 / N >= 0.25, `${m.id}: 1★ só em ${ok1}/${N}`); rates.push(ok1 / N);
  }
  assert.ok(rates[0] >= 0.8 && rates[1] >= 0.8, 'duas primeiras são bem fáceis');
});

test('desbloqueio pelo motor: vitória abre a próxima; derrota não; estrelas e medalhas', () => {
  let g = blankGame(); assert.deepEqual(statusOf(spec, g).map((x) => x.unlocked), [true, ...Array(9).fill(false)]);
  let r = applyResult(g, spec, 'cartas-00', loss); assert.equal(r.done, false); assert.equal(isUnlocked(spec, r.g, 1), false);
  r = applyResult(r.g, spec, 'cartas-00', win({ draws: 0 })); assert.equal(r.stars, 3); assert.equal(isUnlocked(spec, r.g, 1), true); assert.equal(isUnlocked(spec, r.g, 2), false);
  assert.deepEqual(r.newMedals.map((x) => x.id).sort(), ['first']);
  g = r.g; const feitos = { 'cartas-05': win({ specials: 4 }), 'cartas-06': win({ rounds: 7 }), 'cartas-07': win({ draws: 0 }), 'cartas-09': win({ draws: 3, specials: 3 }) };
  for (const id of ['cartas-01', 'cartas-02', 'cartas-03', 'cartas-04', 'cartas-08']) g = applyResult(g, spec, id, win({ draws: 0, rounds: 6, specials: 5 })).g;
  for (const [id, res] of Object.entries(feitos)) g = applyResult(g, spec, id, res).g;
  const ids = new Set(g.medals); for (const k of ['cartas-especiais', 'cartas-relampago', 'cartas-sem-comprar', 'cartas-estilos', 'cartas-final', 'half']) assert.ok(ids.has(k), k);
  assert.ok(totalStars(spec, g) > 10); assert.equal(allMedals(spec).length, 4 + 5);
});
