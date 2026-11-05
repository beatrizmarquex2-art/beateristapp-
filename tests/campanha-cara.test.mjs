// Modo Aventura do Cara a Cara: avaliação, viabilidade provada (busca minimax do pior caso + simulação com o jogo real), desbloqueio, medalhas.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../js/jogos/cara-logic.js';
import { INSTRUMENTS, QUESTIONS, answerFor, BY_ID } from '../js/jogos/cara-data.js';
import * as E from '../js/campanha/engine.js';
import adv, { spec, starsFor, MAX_Q } from '../js/campanha/jogos/cara.js';

const M = spec.missions;
const R = (win, questions, wrong) => ({ win, questions, wrong });
const inst = (id) => BY_ID[id];
const vec = (id) => QUESTIONS.map((q) => (answerFor(inst(id), q.id) ? 1 : 0)).join('');
const split = (ids, qid) => { const y = ids.filter((id) => answerFor(inst(id), qid)); return [y, ids.filter((id) => !y.includes(id))]; };
const leaf = (ids) => new Set(ids.map(vec)).size <= 1;
const memo = new Map();
/** D = mínimo de perguntas que SEMPRE basta (pior caso, estratégia ótima) até sobrar só cartas com respostas idênticas. */
const D = (ids) => { const k = [...ids].sort().join(); if (memo.has(k)) return memo.get(k); let r; if (leaf(ids)) r = 0; else { r = 99; for (const q of QUESTIONS) { const [y, n] = split(ids, q.id); if (!y.length || !n.length) continue; r = Math.min(r, 1 + Math.max(D(y), D(n))); } } memo.set(k, r); return r; };

test('spec válido, ids estáveis e formato do engine', () => {
  assert.ok(E.checkSpec(spec).ok, E.checkSpec(spec).errors.join(';'));
  assert.equal(M.length, 10); assert.deepEqual(M.map((m) => m.id), Array.from({ length: 10 }, (_, i) => `cara-0${i}`));
  assert.equal(spec.theme, 'cara'); assert.equal(adv.spec, spec); assert.equal(typeof adv.mount, 'function');
  for (const m of M) { assert.ok(m.goal && m.tag && m.rules.length && m.stars.length === 3, m.id); assert.ok(m.params.pool.every((id) => BY_ID[id]), `${m.id}: só instrumentos existentes`); assert.equal(new Set(m.params.pool).size, m.params.pool.length); }
});
test('só dados existentes: os atributos e perguntas vêm de cara-data.js', () => {
  assert.equal(INSTRUMENTS.length, 12); assert.equal(QUESTIONS.length, MAX_Q);
  // a única dupla indistinguível pelas 15 perguntas é guitarra/baixo (limitação dos dados, registrada)
  const groups = {}; INSTRUMENTS.forEach((i) => { (groups[vec(i.id)] ||= []).push(i.id); });
  assert.deepEqual(Object.values(groups).filter((x) => x.length > 1), [['guitarra', 'baixo']]);
});
test('os tamanhos de tabuleiro crescem (fases mais simples primeiro)', () => {
  const sizes = M.map((m) => m.params.pool.length); assert.deepEqual(sizes, [4, 4, 6, 6, 8, 8, 10, 11, 12, 12]);
  for (let i = 1; i < sizes.length; i++) assert.ok(sizes[i] >= sizes[i - 1]);
  assert.deepEqual(M.map((m) => m.params.manual), [false, false, false, false, false, true, false, false, false, true]);
});

test('evaluate: derrota e abrir nunca concluem; estrelas por perguntas e chutes, como descrito', () => {
  for (const m of M) { assert.equal(m.evaluate({}).done, false); assert.equal(m.evaluate(R(false, 1, 3)).done, false); assert.equal(m.evaluate(null).stars, 0); assert.equal(m.evaluate(R(false, 0, 3)).stars, 0); }
  const e0 = (q, w) => M[0].evaluate(R(true, q, w)).stars; // D=2
  assert.deepEqual([e0(9, 2), e0(3, 1), e0(2, 0), e0(2, 1), e0(3, 0), e0(0, 0)], [1, 2, 3, 2, 2, 3]);
  const e3 = (q, w) => M[3].evaluate(R(true, q, w)); // limite de 6 perguntas
  assert.equal(e3(7, 0).done, false, 'passou do limite: não conclui'); assert.equal(e3(6, 0).stars, 1); assert.equal(e3(4, 1).stars, 2); assert.equal(e3(3, 0).stars, 3);
  const e8 = (q, w) => M[8].evaluate(R(true, q, w)).stars; assert.deepEqual([e8(5, 1), e8(5, 2), e8(6, 1), e8(8, 1), e8(9, 0)], [3, 0, 2, 1, 0]);
  const r = M[3].evaluate(R(true, 5, 0)); assert.ok(r.summary.length >= 1 && r.label === '5p 0c');
});
test('evaluate é puro/determinístico', () => { assert.deepEqual(M[4].evaluate(R(true, 5, 1)), M[4].evaluate(R(true, 5, 1))); });
test('cada nível de estrela implica o anterior (enumeração)', () => {
  for (const m of M) for (let q = 0; q <= MAX_Q; q++) for (let w = 0; w <= 2; w++) {
    const h = m.tiers.map((t) => starsFor([t], R(true, q, w)) === 1); for (let k = 1; k < 3; k++) if (h[k]) assert.ok(h[k - 1], `${m.id} ${q}/${w}`);
  }
});

/** Jogador esperto com o jogo real: pergunta o que divide o tabuleiro mais igualmente (greedy minimax) e, quando só sobra uma classe de respostas iguais, chuta. */
function playSmart(m, secret) {
  let g = K.newGame({ manual: m.params.manual, pool: m.params.pool, rnd: () => (INSTRUMENTS.filter((i) => m.params.pool.includes(i.id)).findIndex((i) => i.id === secret) + 0.5) / m.params.pool.length });
  assert.equal(g.secret, secret);
  let cand = m.params.pool.slice();
  while (!g.over) {
    if (leaf(cand)) { const pick = cand.find((id) => !g.wrong.includes(id)); g = K.guess(g, pick); continue; }
    let best = null; for (const q of QUESTIONS) { if (K.alreadyAsked(g, q.id)) continue; const [y, n] = split(cand, q.id); if (!y.length || !n.length) continue; const mx = Math.max(y.length, n.length); if (!best || mx < best.mx) best = { q: q.id, mx }; }
    g = K.ask(g, best.q); const yes = g.asked.at(-1).yes; cand = cand.filter((id) => answerFor(inst(id), best.q) === yes);
    if (!g.manual) assert.deepEqual(K.candidates(g).sort(), cand.filter((id) => !g.wrong.includes(id)).sort(), 'automático: o jogo elimina as mesmas cartas');
  }
  return g.result;
}
test('VIABILIDADE: para cada tabuleiro, D (pior caso) = meta de 3 estrelas, e um jogador esperto a cumpre com TODOS os segredos', () => {
  const rows = [];
  for (const m of M) {
    const pool = m.params.pool; const d = D(pool); const twins = pool.includes('guitarra') && pool.includes('baixo');
    assert.equal(m.tiers[2].q, d, `${m.id}: meta de 3★ = D = ${d}`);
    assert.equal(m.tiers[2].w, twins ? 1 : 0, `${m.id}: chutes aceitos no pior caso`);
    assert.ok(m.tiers[1].q >= d && m.tiers[0].q >= m.tiers[1].q, 'metas menos exigentes nunca abaixo de D');
    let worstQ = 0; let bestQ = 99; let worstW = 0;
    for (const secret of pool) { const res = playSmart(m, secret); assert.ok(res.win, `${m.id}/${secret}`); worstQ = Math.max(worstQ, res.questions); bestQ = Math.min(bestQ, res.questions); worstW = Math.max(worstW, res.wrong);
      assert.equal(m.evaluate(res).stars, 3, `${m.id}/${secret}: ${JSON.stringify(res)}`); }
    assert.ok(worstQ <= d, `${m.id}: pior caso do jogador esperto ${worstQ} <= D ${d}`);
    rows.push(`${m.id} cartas=${pool.length} D(pior caso)=${d} jogador esperto: melhor=${bestQ} pior=${worstQ} chutes errados no pior=${worstW}`);
  }
  console.log(rows.join('\n'));
});
test('D respeita o limite teórico (>= log2 das classes de respostas) e o tabuleiro completo precisa de 5', () => {
  for (const m of M) { const classes = new Set(m.params.pool.map(vec)).size; assert.ok(m.tiers[2].q >= Math.ceil(Math.log2(classes)), m.id); }
  // D(p12)=5: nenhuma sequência de 4 perguntas separa 11 classes (2^4=16 caberia, mas os dados não permitem)
  assert.equal(D(INSTRUMENTS.map((i) => i.id)), 5);
});
test('cada missão é vencível mesmo no pior caso de vidas (3 chutes): classes empatadas de no máximo 2 cartas', () => {
  for (const m of M) { const groups = {}; m.params.pool.forEach((id) => { (groups[vec(id)] ||= []).push(id); }); assert.ok(Object.values(groups).every((x) => x.length <= 2)); }
});

test('desbloqueio e estrelas via engine', () => {
  let o = E.applyResult(E.blankGame(), spec, 'cara-00', R(false, 4, 3)); assert.equal(o.done, false); assert.equal(E.isUnlocked(spec, o.g, 1), false);
  o = E.applyResult(o.g, spec, 'cara-00', R(true, 7, 2)); assert.ok(o.done && o.stars === 1 && o.firstTime); assert.equal(E.isUnlocked(spec, o.g, 1), true); assert.equal(E.isUnlocked(spec, o.g, 2), false);
  o = E.applyResult(o.g, spec, 'cara-00', R(true, 2, 0)); assert.equal(o.stars, 3); assert.equal(o.g.m['cara-00'].s, 3);
  o = E.applyResult(o.g, spec, 'cara-00', R(true, 9, 2)); assert.equal(o.g.m['cara-00'].s, 3, 'o melhor resultado fica');
});
test('medalhas por dedução eficiente vêm do progresso real', () => {
  let g = E.blankGame(); const win = (i, q, w) => { g = E.applyResult(g, spec, `cara-0${i}`, R(true, q, w)).g; };
  win(0, 2, 0); win(1, 3, 0); assert.equal(g.medals.includes('cara-eficiente'), false); win(2, 3, 0);
  assert.ok(g.medals.includes('cara-eficiente') && g.medals.includes('cara-seguidas')); assert.equal(g.medals.includes('cara-mesa'), false);
  win(3, 3, 0); assert.ok(g.medals.includes('cara-mesa'));
  win(5, 7, 2); assert.equal(g.medals.includes('cara-manual'), false); g = { ...g, m: { ...g.m, 'cara-09': { s: 1, n: 1 } } }; win(8, 5, 1); assert.ok(g.medals.includes('cara-gemeos') && g.medals.includes('cara-manual'));
  let h = E.blankGame(); h = E.applyResult(h, spec, 'cara-00', R(true, 9, 2)).g; assert.deepEqual(h.medals.sort(), ['first']);
});

test('Modo Livre: regras puras intactas (sem pool = 12 cartas, mesmo formato)', () => {
  const g = K.newGame({ rnd: () => 0 }); assert.deepEqual(Object.keys(g), ['v', 'manual', 'secret', 'out', 'flips', 'wrong', 'asked', 'lives', 'over', 'result']);
  assert.equal(g.secret, INSTRUMENTS[0].id); assert.equal(K.candidates(g).length, 12); assert.equal(K.boardOf(g).length, 12); assert.ok(K.validGame(g));
  const a = K.ask(g, 'cordas'); assert.equal(a.out.length, 8); assert.deepEqual(K.candidates(a), ['violao', 'guitarra', 'baixo', 'violino'], 'violão é de cordas: ficam as 4 de cordas');
});
test('pool: chute fora do tabuleiro é recusado e cartas fora nunca entram em jogo', () => {
  const g = K.newGame({ pool: ['violao', 'bateria'], rnd: () => 0 }); assert.deepEqual(g.pool, ['violao', 'bateria']); assert.throws(() => K.guess(g, 'flauta')); assert.deepEqual(K.candidates(g), ['violao', 'bateria']);
  assert.deepEqual(K.candidates(K.ask(g, 'cordas')), ['violao']); assert.throws(() => K.newGame({ pool: [] }));
});
