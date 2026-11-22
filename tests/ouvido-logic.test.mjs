import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/jogos/ouvido-logic.js';
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const JOGOS = ['terca', 'acorde-ouvido', 'maior-menor', 'escala'];

test('todo jogo tem 12 fases por nível (fácil e difícil), numeradas de 1 a 12', () => {
  for (const j of JOGOS) for (const n of ['facil', 'dificil']) { const f = L.fasesDe(j, n); assert.equal(f.length, 12, `${j} ${n}`); assert.deepEqual(f.map((x) => x.num), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]); }
});
test('3ª e 5ª: o alvo respeita o grau e o modo; fácil só 3ª e 5ª, difícil usa mais graus', () => {
  for (const nivel of ['facil', 'dificil']) for (const f of L.fasesDe('terca', nivel)) for (let s = 1; s < 15; s++) {
    const r = L.rodadaGrau({ ...f, rnd: seeded(s) }); assert.equal(r.length, f.n);
    r.forEach((x) => { assert.equal(x.alvo - x.raiz, L.semitons(x.modo, x.grau)); assert.ok(f.graus.includes(x.grau)); assert.ok(f.tonicas.includes(x.pc)); });
  }
  assert.ok(L.fasesDe('terca', 'facil').every((f) => f.graus.join() === '3,5'));
  assert.ok(L.fasesDe('terca', 'dificil').some((f) => f.graus.length === 6));
  assert.equal(L.semitons('maior', 3), 4); assert.equal(L.semitons('menor', 3), 3); assert.equal(L.semitons('maior', 5), 7); assert.equal(L.semitons('maior', 8), 12);
});
test('acordes: opções distintas, a certa está nelas, midis batem com o tipo (também invertidos)', () => {
  for (const nivel of ['facil', 'dificil']) for (const f of L.fasesDe('acorde-ouvido', nivel)) for (let s = 1; s < 12; s++) {
    const r = L.rodadaAcorde({ ...f, rnd: seeded(s) }); assert.equal(r.length, f.n);
    r.forEach((x, i) => {
      assert.equal(x.opcoes.length, f.opcoesN); assert.equal(new Set(x.opcoes).size, f.opcoesN); assert.ok(x.opcoes.includes(x.alvo)); if (i) assert.notEqual(x.alvo, r[i - 1].alvo);
      const sorted = x.midis.map((m) => m % 12).sort((a, b) => a - b); const pc = parseInt(x.alvo, 10); const menor = x.alvo.endsWith('m');
      assert.deepEqual(sorted, [pc, (pc + (menor ? 3 : 4)) % 12, (pc + 7) % 12].sort((a, b) => a - b));
      if (f.pareado) assert.ok(x.opcoes.includes(`${pc}${menor ? 'M' : 'm'}`));
    });
  }
  assert.ok(L.rodadaAcorde({ ...L.fasesDe('acorde-ouvido', 'facil')[0], rnd: seeded(2) }).every((x) => x.opcoes.every((o) => o.endsWith('M'))));
});
test('maior ou menor: terça certa em bloco/arpejo/inversão; escala de 5 notas confere', () => {
  for (const nivel of ['facil', 'dificil']) for (const f of L.fasesDe('maior-menor', nivel)) for (let s = 1; s < 12; s++) {
    const r = L.rodadaMaiorMenor({ ...f, rnd: seeded(s) }); assert.equal(r.length, f.n);
    r.forEach((x, i) => {
      if (f.forma.startsWith('escala5')) { const up = f.forma === 'escala5-desce' ? x.midis.slice().reverse() : x.midis; assert.equal(up.length, 5); assert.equal(up[2] - up[0], x.tipo === 'maior' ? 4 : 3); assert.equal(up[4] - up[0], 7); }
      else { const m = x.midis.map((v) => v % 12).sort((a, b) => a - b); const pc = x.pc; assert.deepEqual(m, [pc, (pc + (x.tipo === 'maior' ? 4 : 3)) % 12, (pc + 7) % 12].sort((a, b) => a - b)); }
      if (i >= 3) assert.ok(!r.slice(i - 3, i + 1).every((y) => y.tipo === x.tipo));
    });
  }
});
test('escalas: dó maior sobe e desce; fácil só teclas brancas, difícil com pretas', () => {
  assert.deepEqual(L.escalaNotas(0, 'maior'), [60, 62, 64, 65, 67, 69, 71, 72]);
  assert.deepEqual(L.escalaNotas(0, 'maior', true), [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60]);
  for (const f of L.fasesDe('escala', 'facil')) assert.ok(!L.temPreta(L.escalaNotas(f.pc, f.tipo)), `fácil fase ${f.num} só brancas`);
  assert.ok(L.fasesDe('escala', 'dificil').every((f) => L.temPreta(L.escalaNotas(f.pc, f.tipo))));
  for (let pc = 0; pc < 12; pc++) for (const e of L.ESCALAS) { const n = L.escalaNotas(pc, e.id); assert.equal(n.at(-1) - n[0], 12); assert.ok(n[0] >= 48 && n.at(-1) <= 78); }
  assert.ok(L.tonicasBrancas('maior').join() === '0');
});
test('nomes com bemol, cores e estrelas', () => {
  assert.equal(L.nomeEm(70, 5, 'maior'), 'si♭'); assert.equal(L.nomeEm(70, 7, 'maior'), 'lá#'); assert.equal(L.nomeEm(66, 7, 'maior'), 'fá#');
  assert.equal(new Set(Array.from({ length: 12 }, (_, i) => L.corNota(60 + i))).size, 12);
  assert.ok(L.confere(60, 60, false) && !L.confere(48, 60, false) && L.confere(48, 60, true) && !L.confere(61, 60, true));
  assert.equal(L.estrelasAcertos(8, 8), 3); assert.equal(L.estrelasAcertos(7, 8), 2); assert.equal(L.estrelasAcertos(5, 8), 1); assert.equal(L.estrelasAcertos(4, 8), 0);
  assert.equal(L.estrelasEscala(0, true), 3); assert.equal(L.estrelasEscala(2, true), 2); assert.equal(L.estrelasEscala(5, true), 1); assert.equal(L.estrelasEscala(0, false), 0);
});
