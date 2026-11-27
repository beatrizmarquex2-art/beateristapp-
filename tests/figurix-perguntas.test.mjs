import test from 'node:test'; import assert from 'node:assert/strict';
import { qCompare, qSoma, qCompleta, qVf, qPausaValor, qDobro, qTexto, TEXTOS, tiposDoNivel, quizVariado, chaveQuiz } from '../js/jogos/figurix-perguntas.js';
import { quizN, quizClassico } from '../js/jogos/figurix-logic.js';
import { FIG_BY } from '../js/kids/figs.js';
const rep = (f, n = 300) => Array.from({ length: n }, () => f());
test('toda pergunta nova tem a resposta certa entre as opções, sem opção repetida', () => {
  for (const nivel of [1, 2, 3, 4, 6]) for (const f of [qCompare, qSoma, qCompleta, qVf, qPausaValor, qDobro, qTexto]) for (const q of rep(() => f(nivel), 60)) { assert.ok(q.opcoes.includes(q.ok), `${q.tipo} nv${nivel}`); assert.equal(new Set(q.opcoes).size, q.opcoes.length, `${q.tipo} sem repetida`); }
});
test('compare: a certa é de fato a que dura mais (ou menos)', () => { for (const q of rep(() => qCompare(3))) { const b = q.opcoes.map((f) => FIG_BY[f].beats); assert.equal(FIG_BY[q.ok].beats, q.mais ? Math.max(...b) : Math.min(...b)); } });
test('soma: a certa é a soma real; completa: a figura que falta fecha 4 tempos', () => {
  for (const q of rep(() => qSoma(3))) assert.equal(q.ok, q.figs.reduce((t, f) => t + FIG_BY[f].beats, 0));
  for (const q of rep(() => qCompleta(3))) assert.ok(Math.abs(q.figs.reduce((t, f) => t + FIG_BY[f].beats, 0) + FIG_BY[q.ok].beats - 4) < 1e-9, q.figs.join());
});
test('verdade ou mentira confere com os valores; dobro: a certa vale o dobro', () => {
  for (const q of rep(() => qVf(2))) assert.equal(q.ok, q.dito === FIG_BY[q.fig].beats ? 'verdade' : 'mentira');
  for (const q of rep(() => qDobro(3))) assert.equal(FIG_BY[q.ok].beats, FIG_BY[q.fig].beats * 2);
});
test('banco de perguntas escritas: 3 erradas diferentes da certa e nível respeitado', () => {
  for (const it of TEXTOS) { assert.equal(it.e.length, 3); assert.ok(!it.e.includes(it.ok)); assert.equal(new Set([it.ok, ...it.e]).size, 4); }
  assert.ok(rep(() => qTexto(1)).every((q) => q.n === 1)); assert.ok(TEXTOS.length >= 25 && new Set(TEXTOS.map((t) => t.q)).size === TEXTOS.length);
});
test('variedade: no nível 3 aparecem todos os tipos e mais de 60 perguntas diferentes em 400 sorteios; nível 1 não tem soma/dobro/completa', () => {
  const tipos = new Set(rep(() => quizN(3), 400).map((q) => q.tipo)); for (const t of ['compare', 'soma', 'completa', 'vf', 'pausaValor', 'dobro', 'texto', 'valor', 'nome']) assert.ok(tipos.has(t), `falta ${t}`);
  assert.ok(new Set(rep(() => chaveQuiz(quizN(3)), 400)).size > 60);
  const n1 = new Set(rep(() => quizN(1), 300).map((q) => q.tipo)); for (const t of ['soma', 'dobro', 'completa', 'pausaValor', 'metade', 'cabem']) assert.ok(!n1.has(t), `nível 1 sem ${t}`);
  assert.ok(tiposDoNivel(1).includes('classico') && quizVariado(1, quizClassico));
});
