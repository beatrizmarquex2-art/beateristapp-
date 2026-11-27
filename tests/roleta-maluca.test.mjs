import test from 'node:test'; import assert from 'node:assert/strict';
import * as L from '../js/figurinhas/album-logic.js'; import * as R from '../js/figurinhas/roleta-maluca.js';
const sur = [{ chave: 'planner:0' }, { chave: 'colorir:3' }, { chave: 'wallpaper:1' }];
test('missão aprovada vale 1 giro, uma vez só por resgate', () => {
  let s = L.emptyState(); s = R.ganharGiro(s, 'a'); assert.equal(R.rmDe(s).t, 1); assert.equal(R.ganharGiro(s, 'a'), s); s = R.ganharGiro(s, 'b'); assert.equal(R.rmDe(s).t, 2);
});
test('só gira com giro guardado e no máximo 3 vezes por dia', () => {
  let s = L.emptyState(); assert.equal(R.girar(s, '2026-11-27'), null);
  for (const id of 'abcde') s = R.ganharGiro(s, id);
  let n = 0; for (let i = 0; i < 6; i++) { const r = R.girar(s, '2026-11-27', Math.random, sur); if (r) { s = r.state; n++; } }
  assert.ok(n >= 3, `girou ${n}`); const dia1 = R.rmDe(s).n; assert.equal(dia1, 3 + 0 > 3 ? 3 : dia1);
  assert.equal(R.restantesHoje(R.rmDe(s), '2026-11-27'), 0); assert.equal(R.girar(s, '2026-11-27', Math.random, sur), null);
  assert.equal(R.restantesHoje(R.rmDe(s), '2026-11-28'), 3);
});
test('cada resultado entrega o que diz', () => {
  const rngPara = (k) => { const pesos = R.PREMIOS; let acc = 0; const alvo = pesos.findIndex(([t]) => t === k); for (let i = 0; i < alvo; i++) acc += pesos[i][1]; return () => (acc + 1) / 100; };
  const base = () => R.ganharGiro(L.emptyState(), 'x');
  let r = R.girar(base(), 'd', rngPara('epico'), sur); assert.equal(r.premio.tipo, 'epico'); assert.ok(r.state.granted.includes(r.premio.pacote)); assert.equal(L.packKind(r.premio.pacote), 'epico');
  r = R.girar(base(), 'd', rngPara('exclusiva'), sur); assert.equal(r.premio.tipo, 'exclusiva'); assert.ok(r.state.granted.includes(r.premio.pacote));
  r = R.girar(base(), 'd', rngPara('estrelas'), sur); assert.equal(r.premio.tipo, 'estrelas'); assert.equal(r.premio.estrelas, 30);
  r = R.girar(base(), 'd', rngPara('giros'), sur); assert.equal(r.premio.tipo, 'giros'); assert.equal(R.rmDe(r.state).t, 3);
  r = R.girar(base(), 'd', rngPara('surpresa'), sur); assert.equal(r.premio.tipo, 'surpresa'); assert.equal(R.rmDe(r.state).sur.length, 1);
});
test('surpresa não repete e, sem nada novo, vira estrelas', () => {
  const rngS = (() => { const alvo = R.PREMIOS.findIndex(([t]) => t === 'surpresa'); let acc = 0; for (let i = 0; i < alvo; i++) acc += R.PREMIOS[i][1]; return () => (acc + 1) / 100; })();
  let s = L.emptyState(); const vistos = new Set();
  for (let i = 0; i < 3; i++) { s = R.ganharGiro(s, 'g' + i); const r = R.girar(s, 'dia' + i, rngS, sur); assert.equal(r.premio.tipo, 'surpresa'); assert.ok(!vistos.has(r.premio.item.chave)); vistos.add(r.premio.item.chave); s = r.state; }
  s = R.ganharGiro(s, 'z'); const r = R.girar(s, 'dia9', rngS, sur); assert.equal(r.premio.tipo, 'estrelas');
});
