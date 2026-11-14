// Regras dos jogos "de verdade": Copia Aí, pauLta ao Vivo, Eco de Groove e Clique Fantasma.
import test from 'node:test'; import assert from 'node:assert/strict';
import * as V from '../js/jogos/vivo-logic.js';

test('nomes das notas e mesma nota em outra oitava', () => {
  assert.equal(V.nomeNota(60), 'dó'); assert.equal(V.nomeNota(64), 'mi'); assert.equal(V.nomeNota(72), 'dó');
  assert.ok(V.mesmaNota(60, 48)); assert.ok(V.mesmaNota(64, 76)); assert.ok(!V.mesmaNota(60, 62));
});
test('estrelas 60/80/100', () => { assert.deepEqual([0, 59, 60, 79, 80, 99, 100].map(V.estrelasPct), [0, 0, 1, 1, 2, 2, 3]); });
test('sorteio: só notas do nível e nunca 3 iguais seguidas', () => {
  for (let k = 0; k < 50; k++) { const s = V.sorteio([60, 62, 64], 10); assert.equal(s.length, 10); assert.ok(s.every((m) => [60, 62, 64].includes(m))); for (let i = 2; i < s.length; i++) assert.ok(!(s[i] === s[i - 1] && s[i] === s[i - 2])); }
});
test('a melodia cresce: sorteio 2, 3, 4…; música 3, 5, 7… até o fim', () => {
  assert.deepEqual([1, 2, 3, 9, 20].map((r) => V.tamanhoRodada('sorteio', r, 10)), [2, 3, 4, 10, 10]);
  assert.deepEqual([1, 2, 3, 7].map((r) => V.tamanhoRodada('melodia', r, 14)), [3, 5, 7, 14]);
});
test('melodias só com teclas brancas de dó a dó', () => { for (const m of V.MELODIAS) { assert.ok(m.notas.length >= 8, m.id); assert.ok(m.notas.every((x) => V.NIVEIS_COPIA[2].notas.includes(x)), m.id); } });
test('estrelas do Copia Aí', () => {
  assert.deepEqual([3, 4, 6, 8, 10].map((n) => V.estrelasCopia('sorteio', n, 10, 0)), [0, 1, 2, 3, 3]);
  assert.equal(V.estrelasCopia('melodia', 14, 14, 0), 3); assert.equal(V.estrelasCopia('melodia', 14, 14, 1), 2); assert.equal(V.estrelasCopia('melodia', 7, 14, 2), 1); assert.equal(V.estrelasCopia('melodia', 5, 14, 3), 0);
});
test('rastreador: uma nota por ataque; repetir a mesma nota precisa de silêncio ou novo ataque', () => {
  const t = V.rastreador(); const out = []; const p = (m, n = 0.1) => { const r = t.push(m, n); if (r != null) out.push(r); };
  p(60); p(60); assert.deepEqual(out, []); p(60); assert.deepEqual(out, [60]);
  for (let i = 0; i < 10; i++) p(60, 0.1 - i * 0.005); assert.deepEqual(out, [60]); // nota segurada não repete
  p(null); p(null); p(60); p(60); p(60); assert.deepEqual(out, [60, 60]); // silêncio e de novo
  p(60, 0.03); p(60, 0.03); p(60, 0.2); assert.deepEqual(out, [60, 60, 60]); // novo ataque sem silêncio
  p(64); p(62); p(62); p(62); assert.deepEqual(out, [60, 60, 60, 62]); // leitura solta (64) não vale
});
test('pauLta ao Vivo: rodada sem repetir seguida e posição na pauta', () => {
  const r = V.rodadaPauta([60, 62, 64], 10); assert.equal(r.length, 10); for (let i = 1; i < r.length; i++) assert.notEqual(r[i], r[i - 1]);
  assert.equal(V.diatonica(60), 28); assert.equal(V.diatonica(64), 30); assert.equal(V.diatonica(72), 35); // dó4 = 4×7+0
});
test('fases do groove: 10 fases, 3 compassos de 4 tempos, só h/c/b', () => {
  assert.equal(V.FASES_GROOVE.length, 10);
  for (const f of V.FASES_GROOVE) { assert.equal(f.bars.length, 3); for (const b of f.bars) { assert.equal(b.length, 4); assert.ok(b.every((s) => /^[hcb]{0,2}$/.test(s))); assert.ok(b.some((s) => s)); } }
});
test('groove na tela: peça e tempo certos = 100; peça trocada e toque na pausa contam erro', () => {
  const q = 0.75; const win = V.folgaGroove(80); const bar = ['hb', 'c', '', 'hb'];
  const certo = [{ t: 0.01, p: 'h' }, { t: -0.02, p: 'b' }, { t: 0.78, p: 'c' }, { t: 2.2, p: 'h' }, { t: 2.3, p: 'b' }];
  const a = V.julgaGroove(bar, certo, q, win); assert.deepEqual([a.hits, a.esperado, a.extras], [5, 5, 0]); assert.deepEqual(a.tempos, [true, true, true, true]); assert.equal(V.notaGroove([a]), 100);
  const b = V.julgaGroove(bar, [{ t: 0, p: 'c' }, { t: 0.75, p: 'c' }, { t: 1.5, p: 'b' }], q, win); assert.deepEqual([b.hits, b.extras], [1, 2]); assert.deepEqual(b.tempos, [false, true, false, false]);
  assert.ok(V.notaGroove([b]) < 20);
});
test('groove no microfone: só o tempo; batida na pausa é erro; duas peças juntas = uma batida', () => {
  const q = 0.75; const win = V.folgaGroove(80); const bar = ['hb', 'c', '', 'hb'];
  const a = V.julgaGrooveMic(bar, [0.0, 0.02, 0.76, 2.27], q, win); assert.deepEqual([a.hits, a.esperado, a.extras], [3, 3, 0]); assert.deepEqual(a.tempos, [true, true, true, true]);
  const b = V.julgaGrooveMic(bar, [0, 0.75, 1.5, 2.25, 1.1], q, win); assert.equal(b.hits, 3); assert.equal(b.extras, 2); assert.equal(b.tempos[2], false);
});
test('groove: a fase abre com 60% na anterior', () => { assert.ok(V.grooveLiberada({}, 1)); assert.ok(!V.grooveLiberada({}, 2)); assert.ok(!V.grooveLiberada({ 1: 59 }, 2)); assert.ok(V.grooveLiberada({ 1: 60 }, 2)); });
test('clique fantasma: cravou, correu, atrasou e parou', () => {
  const bpm = 80; const q = 60 / bpm; const win = V.folgaFantasma(bpm); const mudo = 8;
  const toca = (passo, ate = 8 + mudo) => { const o = []; let t = 0; for (let k = 0; k < ate; k++) { o.push(t); t += k < 7 ? q : passo; } return o; };
  const a = V.julgaFantasma(toca(q), { q, mudo, win }); assert.equal(a.pct, 100); assert.equal(a.veredito, 'cravou');
  const b = V.julgaFantasma(toca(q * 0.94), { q, mudo, win }); assert.equal(b.veredito, 'correu'); assert.ok(b.media < 0); assert.ok(b.pct < 100);
  const c = V.julgaFantasma(toca(q * 1.06), { q, mudo, win }); assert.equal(c.veredito, 'atrasou'); assert.ok(c.media > 0);
  const d = V.julgaFantasma(toca(q, 9), { q, mudo, win }); assert.equal(d.veredito, 'parou'); assert.ok(d.pct <= 13);
});
test('clique fantasma: atraso constante (microfone) é descontado pela referência', () => {
  const q = 0.75; const win = V.folgaFantasma(80); const o = Array.from({ length: 12 }, (_, k) => k * q + 0.12);
  const r = V.julgaFantasma(o, { q, mudo: 4, win }); assert.equal(r.pct, 100); assert.equal(r.base, 120); assert.equal(r.veredito, 'cravou');
});
