// Modo Aventura do Jogo da Velha: avaliação das missões, viabilidade (provada por enumeração/expectimax), desbloqueio e medalhas.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../js/jogos/velha-logic.js';
import { QUESTIONS } from '../js/jogos/velha-data.js';
import * as E from '../js/campanha/engine.js';
import adv, { spec, normalize, maxRun, starsFor } from '../js/campanha/jogos/velha.js';

const M = spec.missions;
const res = (o, extra = {}) => ({ outcomes: o.split(''), ...extra });
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };

test('spec válido, ids estáveis e no formato do engine', () => {
  assert.ok(E.checkSpec(spec).ok, E.checkSpec(spec).errors.join(';'));
  assert.equal(M.length, 10); assert.deepEqual(M.map((m) => m.id), Array.from({ length: 10 }, (_, i) => `velha-0${i}`));
  assert.equal(spec.theme, 'velha'); assert.equal(adv.spec, spec); assert.equal(typeof adv.mount, 'function');
  for (const m of M) { assert.ok(m.goal && m.tag && m.rules.length && m.stars.length === 3, m.id); assert.ok(['aleatoria', 'bloqueia', 'estrategica'].includes(m.params.ai)); assert.ok(['classico', 'desafio'].includes(m.params.variant)); }
});

test('os níveis das missões usam só perguntas aprovadas já existentes (bancos suficientes)', () => {
  const by = (l) => QUESTIONS.filter((q) => V.poolFor(l).includes(q));
  for (const m of M.filter((x) => x.params.variant === 'desafio')) {
    const pool = V.poolFor(m.params.level); assert.ok(pool.length >= 7, `${m.id}: ${pool.length}`);
    // o jogador (1º a jogar) precisa de no máximo 5 marcas por rodada; sobram perguntas pra errar algumas sem esgotar
    assert.ok(pool.length - 5 >= 2);
  }
  assert.equal(by('infantil').length, 7);
});

test('evaluate: concluir exige o critério real; abrir/zero rodadas nunca conclui', () => {
  for (const m of M) {
    assert.equal(m.evaluate({}).done, false, m.id); assert.equal(m.evaluate({ outcomes: [] }).done, false);
    assert.equal(m.evaluate(null).stars, 0);
    const r = m.params.rounds; assert.equal(m.evaluate({ outcomes: Array(r - 1).fill('W') }).done, false, 'série incompleta não conclui');
  }
});
test('evaluate: estrelas por vitórias, sequência e derrotas (exatamente como descrito)', () => {
  const ev = (i, o, x) => M[i].evaluate(res(o, x));
  assert.deepEqual([ev(0, 'LLL').stars, ev(0, 'WLL').stars, ev(0, 'WWL').stars, ev(0, 'WWW').stars], [0, 1, 2, 3]);
  assert.equal(ev(0, 'LLL').done, false); assert.equal(ev(0, 'DDD').done, false, 'só empates não vence');
  assert.deepEqual([ev(2, 'WLWLW').stars, ev(2, 'WWLLW').stars, ev(2, 'WWWLW').stars, ev(2, 'WWWWL').stars, ev(2, 'LWWWW').stars], [0, 1, 2, 3, 3]);
  assert.equal(ev(3, 'WWL').stars, 2); assert.equal(ev(3, 'WWD').stars, 3); assert.equal(ev(3, 'WDD').stars, 1);
  assert.deepEqual([ev(5, 'WWDDD').stars, ev(5, 'WWWDD').stars, ev(5, 'WWWWD').stars, ev(5, 'WWWWW').stars], [0, 1, 2, 3]);
  assert.deepEqual([ev(6, 'LLLL').stars, ev(6, 'LLWD').stars, ev(6, 'LDDD').stars, ev(6, 'DDDD').stars], [0, 1, 2, 3]);
  assert.equal(ev(6, 'LLLL').done, false); assert.equal(ev(9, 'LLLDD').done, false); assert.equal(ev(9, 'LLDDD').stars, 1); assert.equal(ev(9, 'DDDDD').stars, 3);
  const r = ev(1, 'WWD', { answered: 6, correct: 5 }); assert.ok(r.summary.some((s) => s.includes('5 de 6')) && r.label === '2V 1E 0D');
});
test('evaluate é puro e determinístico', () => { const a = M[4].evaluate(res('WLW')); const b = M[4].evaluate(res('WLW')); assert.deepEqual(a, b); });

test('cada nível de estrela implica o anterior (enumeração de todas as séries possíveis)', () => {
  for (const m of M) {
    const n = m.params.rounds;
    for (let code = 0; code < 3 ** n; code++) {
      const o = []; let c = code; for (let k = 0; k < n; k++) { o.push('WDL'[c % 3]); c = Math.floor(c / 3); }
      const x = normalize({ outcomes: o }, n); const hits = m.tiers.map((t) => starsFor([t], x) === 1);
      for (let k = 1; k < 3; k++) if (hits[k]) assert.ok(hits[k - 1], `${m.id} ${o.join('')}`);
    }
  }
});

/* ---------- viabilidade ---------- */
const empty = () => Array(9).fill(null);
const key = (b) => b.map((x) => (x == null ? '-' : x)).join('');
// cardinalidade das jogadas do adversário (as mesmas regras do jogo)
// conjunto de jogadas do estratégico (minimax com menor profundidade = mesmas pontuações do jogo), calculado aqui com memória
const mmMemo = new Map();
const mm = (b, me, turn, depth) => { const k = key(b) + me + turn + depth; if (mmMemo.has(k)) return mmMemo.get(k); const w = V.winnerOf(b); let r;
  if (w) r = w.who === me ? 10 - depth : depth - 10; else if (V.isFull(b)) r = 0;
  else { const vals = V.emptyCells(b).map((c) => { const x = b.slice(); x[c] = turn; return mm(x, me, 1 - turn, depth + 1); }); r = turn === me ? Math.max(...vals) : Math.min(...vals); }
  mmMemo.set(k, r); return r; };
const strategicSet = (b) => { const cells = V.emptyCells(b); const sc = cells.map((c) => { const x = b.slice(); x[c] = 1; return mm(x, 1, 0, 1); }); const best = Math.max(...sc); return cells.filter((c, i) => sc[i] === best); };
test('o conjunto de jogadas do estratégico usado nas provas é o mesmo do bestMove do jogo', () => {
  const rnd = seeded(11);
  for (let t = 0; t < 14; t++) { const b = empty(); for (let k = 0; k < 1 + t % 5; k++) b[V.easyMove(b, rnd)] = k % 2; if (V.winnerOf(b) || V.isFull(b)) continue;
    const got = new Set(); for (let i = 0; i < 20; i++) got.add(V.bestMove(b, 1, () => i / 20)); assert.deepEqual([...got].sort(), strategicSet(b).sort()); }
});
const aiSet = (ai, b) => (ai === 'aleatoria' ? V.emptyCells(b) : ai === 'bloqueia' ? V.blockCells(b, 1) : strategicSet(b));
/** Política do jogador (marcador 0): primeiro minimiza a chance de derrota, depois maximiza a de vitória. Devolve {W,D,L} da rodada. */
const rdMemo = new Map();
function roundDist(ai, playerFirst) {
  const mk = ai + playerFirst; if (rdMemo.has(mk)) return rdMemo.get(mk);
  const memo = new Map();
  const val = (b, turn) => {
    const k = key(b) + turn; if (memo.has(k)) return memo.get(k);
    const w = V.winnerOf(b); let r;
    if (w) r = w.who === 0 ? { W: 1, D: 0, L: 0 } : { W: 0, D: 0, L: 1 };
    else if (V.isFull(b)) r = { W: 0, D: 1, L: 0 };
    else if (turn === 0) {
      let best = null; for (const c of V.emptyCells(b)) { const x = b.slice(); x[c] = 0; const v = val(x, 1); if (!best || v.L < best.L - 1e-12 || (Math.abs(v.L - best.L) < 1e-12 && v.W > best.W)) best = v; } r = best;
    } else { const m = aiSet(ai, b); r = { W: 0, D: 0, L: 0 }; for (const c of m) { const x = b.slice(); x[c] = 1; const v = val(x, 0); r.W += v.W / m.length; r.D += v.D / m.length; r.L += v.L / m.length; } }
    memo.set(k, r); return r;
  };
  const out = playerFirst ? val(empty(), 0) : val(empty(), 1); rdMemo.set(mk, out); return out;
}
/** Probabilidade de cada nível de estrela numa missão, jogando bem (política acima). */
function starProbs(m) {
  const first = roundDist(m.params.ai, true); const second = roundDist(m.params.ai, false); let st = new Map([['', 1]]);
  for (let r = 0; r < m.params.rounds; r++) { const d = r % 2 === 0 ? first : second; const nx = new Map(); for (const [k, p] of st) for (const o of 'WDL') if (d[o] > 0) nx.set(k + o, (nx.get(k + o) || 0) + p * d[o]); st = nx; }
  const out = [0, 0, 0, 0]; for (const [k, p] of st) out[m.evaluate({ outcomes: k.split('') }).stars] += p;
  return [1, 2, 3].map((s) => out.slice(s).reduce((a, b) => a + b, 0));
}
test('toda missão é possível: jogando bem, 1 estrela é praticamente certa e 3 estrelas é alcançável (números exatos)', () => {
  const table = M.map((m) => ({ id: m.id, ai: m.params.ai, p: starProbs(m) }));
  console.log(table.map((t) => `${t.id} ${t.ai}: ${t.p.map((x) => x.toFixed(3)).join(' / ')}`).join('\n'));
  for (const t of table) { assert.ok(t.p[0] >= 0.99, `${t.id} 1★ ${t.p[0]}`); assert.ok(t.p[1] >= 0.89, `${t.id} 2★ ${t.p[1]}`); assert.ok(t.p[2] >= 0.8, `${t.id} 3★ ${t.p[2]}`); }
});

test('contra o estratégico: o jogador nunca precisa perder (empate forçado) e é impossível vencer', () => {
  const memo = new Map();
  // v = melhor resultado que o jogador garante (1 vitória, 0 empate, -1 derrota) contra QUALQUER jogada do estratégico
  const v = (b, turn) => {
    const k = key(b) + turn; if (memo.has(k)) return memo.get(k);
    const w = V.winnerOf(b); let r;
    if (w) r = w.who === 0 ? 1 : -1; else if (V.isFull(b)) r = 0;
    else if (turn === 0) r = Math.max(...V.emptyCells(b).map((c) => { const x = b.slice(); x[c] = 0; return v(x, 1); }));
    else r = Math.min(...strategicSet(b).map((c) => { const x = b.slice(); x[c] = 1; return v(x, 0); }));
    memo.set(k, r); return r;
  };
  assert.equal(v(empty(), 0), 0, 'jogador começa: o melhor garantido é empatar');
  const secondWorst = Math.min(...strategicSet(empty()).map((c) => { const b = empty(); b[c] = 1; return v(b, 0); }));
  assert.equal(secondWorst, 0, 'estratégico começa: ainda dá pra empatar sempre');
});

test('quem tem 3 estrelas em Muralha: jogando o minimax contra o estratégico dá 0 derrotas (simulação)', () => {
  const rnd = seeded(7); let losses = 0;
  for (let r = 0; r < 10; r++) { let b = empty(); let turn = r % 2 === 0 ? 0 : 1; while (!V.winnerOf(b) && !V.isFull(b)) { b[turn === 0 ? V.bestMove(b, 0, rnd) : V.aiMove('estrategica', b, 1, rnd)] = turn; turn = 1 - turn; } const w = V.winnerOf(b); if (w && w.who === 1) losses++; assert.ok(!(w && w.who === 0)); }
  assert.equal(losses, 0);
});

test('as três estratégias do computador respeitam as regras (só casas vazias; bloqueia/ganha quando deve)', () => {
  assert.deepEqual(V.AI_KINDS, ['aleatoria', 'bloqueia', 'estrategica']);
  const b = [1, 1, null, 0, 0, null, null, null, null];
  assert.deepEqual(V.blockCells(b, 1), [2], 'fecha a própria linha antes de bloquear');
  assert.deepEqual(V.blockCells([0, 0, null, null, 1, null, null, null, null], 1), [2], 'bloqueia a linha do jogador');
  assert.equal(V.blockCells(empty(), 1).length, 9);
  const rnd = seeded(3); for (const ai of V.AI_KINDS) for (let i = 0; i < 100; i++) { const bd = empty(); for (let k = 0; k < i % 6; k++) bd[V.easyMove(bd, rnd)] = k % 2; if (V.winnerOf(bd)) continue; const c = V.aiMove(ai, bd, 1, rnd); assert.equal(bd[c], null); }
});

test('desbloqueio e estrelas via engine: missão 1 só abre depois da 0; falhar não conclui; abrir não conclui', () => {
  let g = E.blankGame(); assert.equal(E.isUnlocked(spec, g, 0), true); assert.equal(E.isUnlocked(spec, g, 1), false);
  let o = E.applyResult(g, spec, 'velha-00', res('LLL')); assert.equal(o.done, false); assert.equal(E.isUnlocked(spec, o.g, 1), false);
  o = E.applyResult(o.g, spec, 'velha-00', res('WLL')); assert.ok(o.done && o.stars === 1 && o.firstTime); assert.equal(E.isUnlocked(spec, o.g, 1), true); assert.equal(E.isUnlocked(spec, o.g, 2), false);
  assert.ok(o.newMedals.some((m) => m.id === 'first'));
});

test('medalhas de sequência são calculadas do progresso real', () => {
  const medal = (id) => spec.medals.find((m) => m.id === id);
  let g = E.blankGame(); const ok = { WWW: 'velha-00' };
  const play = (id, outcomes) => { const o = E.applyResult(g, spec, id, res(outcomes)); g = o.g; return o; };
  play('velha-00', 'WLL'); play('velha-01', 'WLL'); assert.equal(g.medals.includes('velha-serie3'), false);
  play('velha-02', 'WWLLL'); assert.ok(g.medals.includes('velha-serie3'), 'três concluídas em sequência'); assert.equal(g.medals.includes('velha-serie6'), false);
  play('velha-03', 'LLL'); // tentativa falha quebra a sequência
  play('velha-03', 'WLL'); play('velha-04', 'WLL'); play('velha-05', 'WWWLL'); assert.equal(g.medals.includes('velha-serie6'), false, 'a falha no meio zerou a contagem');
  assert.equal(maxRun(g), 3);
  play('velha-06', 'LLWD'); play('velha-07', 'LDDD'); play('velha-08', 'WLL'); assert.equal(maxRun(g), 6); assert.ok(g.medals.includes('velha-serie6'));
  assert.equal(medal('velha-ouro3').test(g), false);
  let h = E.blankGame(); for (const [i, o] of [['00', 'WWW'], ['01', 'WWW'], ['02', 'WWWWL']]) h = E.applyResult(h, spec, `velha-${i}`, res(o)).g;
  assert.ok(h.medals.includes('velha-ouro3'));
  let m = E.blankGame(); m = E.applyResult(m, spec, 'velha-06', res('DDDD')).g; assert.ok(m.medals.includes('velha-muralha'));
  void ok;
});

test('Modo Livre: funções puras existentes continuam iguais', () => {
  const g = V.newMatch({ mode: 'facil', variant: 'desafio', level: 'infantil' });
  assert.deepEqual(Object.keys(g).sort(), ['asked', 'board', 'draws', 'errors', 'held', 'last', 'level', 'mode', 'nextOffer', 'offer', 'over', 'pending', 'result', 'round', 'scores', 'starter', 'turn', 'v', 'variant']);
  assert.ok(V.validMatch(g)); assert.equal(V.isPaulTurn({ ...g, turn: 1 }), true); assert.equal(V.isPaulTurn({ ...g, mode: 'local', turn: 1 }), false);
  assert.equal(V.easyMove(empty(), () => 0), 0); assert.equal(V.bestMove([0, null, null, null, 1, null, null, null, 0], 1, () => 0) != null, true);
  assert.equal(V.ERROR_OFFER, 12); assert.deepEqual(V.poolFor('infantil').map((q) => q.level), Array(7).fill('infantil'));
});
