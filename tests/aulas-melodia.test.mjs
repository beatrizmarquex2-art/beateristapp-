// Aulas de melodia (teclas e percussão): as músicas, a ordem das notas e a nota.
import test from 'node:test'; import assert from 'node:assert/strict';
import * as A from '../js/jogos/aulas-melodia.js';

test('6 músicas, só teclas brancas de dó maior, frases com 3 a 7 notas', () => {
  assert.equal(A.MUSICAS.length, 6); assert.equal(new Set(A.MUSICAS.map((m) => m.id)).size, 6);
  for (const m of A.MUSICAS) { assert.ok(m.frases.length >= 2, m.id); for (const f of m.frases) { assert.ok(f.length >= 3 && f.length <= 7, `${m.id} ${f.length}`); for (const [n, d] of f) { assert.ok([0, 2, 4, 5, 7, 9, 11].includes(n % 12), `${m.id} ${n}`); assert.ok(n >= 60 && n <= 76, `${m.id} ${n}`); assert.ok(d > 0 && d <= 4); } } }
});
test('as melodias que a Bea ainda vai conferir estão marcadas', () => { assert.deepEqual(A.MUSICAS.filter((m) => m.confere).map((m) => m.id), ['balao', 'pau']); });
test('Parabéns: começa em sol sol lá sol dó si (a 1ª frase)', () => { const p = A.MUSICAS.find((m) => m.id === 'parabens'); assert.deepEqual(p.frases[0].map((n) => A.nomeNota(n[0])), ['sol', 'sol', 'lá', 'sol', 'dó', 'si']); assert.deepEqual(p.frases[1].map((n) => A.nomeNota(n[0])), ['sol', 'sol', 'lá', 'sol', 'ré', 'dó']); });
test('faixa da música e teclas brancas', () => { const j = A.MUSICAS.find((m) => m.id === 'jingle'); assert.deepEqual(A.faixaDe(j), [60, 67]); assert.deepEqual(A.brancasEntre(60, 67), [60, 62, 64, 65, 67]); });
test('posição na pauta de sol: mi = 1ª linha (0), sol = 2ª linha (2), si = 3ª linha (4), dó agudo = 3º espaço (5), dó central = linha suplementar (-2)', () => { assert.deepEqual([64, 67, 71, 72, 60].map(A.posPauta), [0, 2, 4, 5, -2]); });
test('sessão: tocar tudo certo = 100% e termina', () => {
  const m = A.MUSICAS.find((x) => x.id === 'escada'); const s = A.novaSessao(m); const out = [];
  for (const [n] of A.notasDe(m)) out.push(s.toca(n).tipo);
  assert.deepEqual(out, ['ok', 'ok', 'ok', 'ok', 'frase', 'ok', 'ok', 'ok', 'ok', 'fim']); assert.equal(s.pct(), 100); assert.equal(A.estrelas(s.pct()), 3);
  assert.equal(s.toca(60).tipo, 'parado');
});
test('sessão: nota errada não avança e derruba a nota', () => {
  const m = A.MUSICAS.find((x) => x.id === 'jingle'); const s = A.novaSessao(m);
  assert.equal(s.toca(62).tipo, 'erro'); assert.equal(s.esperado(), 64); assert.equal(s.toca(64).tipo, 'ok');
  for (const [n] of A.notasDe(m).slice(1)) s.toca(n); assert.equal(s.acertos, 11); assert.equal(s.erros, 1); assert.equal(s.pct(), 92); assert.equal(A.estrelas(92), 2);
});
test('microfone: a nota vale em qualquer oitava', () => {
  const m = A.MUSICAS.find((x) => x.id === 'escada'); const s = A.novaSessao(m, A.mesmaNota);
  assert.equal(s.toca(48).tipo, 'ok'); assert.equal(s.toca(74).tipo, 'ok'); assert.equal(s.toca(61).tipo, 'erro');
});
test('duração em segundos', () => { assert.equal(A.seg(2, 120), 1); assert.equal(Math.round(A.seg(.5, 100) * 1000), 300); });
