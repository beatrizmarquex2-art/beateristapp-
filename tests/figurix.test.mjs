import test from 'node:test';
import assert from 'node:assert/strict';
import { PHASES, FASES, rapidaLenta, MONTES, peçasDe, confereMonte, paresLigar, paresPausa, mesmoPar, quizQ, ARVORE, opcoesArvore, itensTetris, estrelasFigurix, ids } from '../js/jogos/figurix-logic.js';
import { FIG_BY } from '../js/kids/figs.js';

test('12 fases na ordem das ideias da Bea', () => {
  assert.equal(PHASES.length, FASES); assert.deepEqual(PHASES.map((p) => p.tipo), ['rapida', 'lenta', 'monte', 'ligar', 'ligar', 'memoria', 'quiz', 'caca', 'notas', 'tetris', 'quiz', 'tetris']);
  assert.deepEqual(PHASES.filter((p) => p.tipo === 'ligar').map((p) => p.k), [3, 5]);
});
test('rápida/lenta: a 1ª é a da Bea e a resposta é a que dura menos/mais', () => {
  const r = rapidaLenta('rapida', 0); assert.deepEqual(r.figs.slice().sort(), ['colcheia', 'semicolcheia', 'seminima']); assert.equal(r.ok, 'semicolcheia');
  const l = rapidaLenta('lenta', 0); assert.deepEqual(l.figs.slice().sort(), ['minima', 'semibreve', 'seminima']); assert.equal(l.ok, 'semibreve');
  for (let i = 1; i < 40; i++) for (const t of ['rapida', 'lenta']) { const q = rapidaLenta(t, i); assert.equal(new Set(q.figs).size, 3); const b = q.figs.map((f) => FIG_BY[f].beats); assert.equal(FIG_BY[q.ok].beats, t === 'rapida' ? Math.min(...b) : Math.max(...b)); }
});
test('monte a figura: a colcheia é a 1ª e tem cabeça cheia, haste e 1 colchete', () => {
  assert.equal(MONTES[0], 'colcheia'); assert.deepEqual(peçasDe('colcheia'), { cabeca: 'cheia', haste: true, colchetes: 1 }); assert.deepEqual(peçasDe('minima'), { cabeca: 'vazia', haste: true, colchetes: 0 });
  assert.deepEqual(confereMonte('colcheia', { cabeca: 'cheia', haste: true, colchetes: 2 }), { cabeca: true, haste: true, colchetes: false });
});
test('ligar: k figuras e os mesmos k nomes embaralhados', () => { for (const k of [3, 5]) { const p = paresLigar(k); assert.equal(p.figs.length, k); assert.deepEqual(p.nomes.slice().sort(), p.figs.slice().sort()); } });
test('memória das pausas: 4 pares figura↔pausa', () => {
  const c = paresPausa(4); assert.equal(c.length, 8); assert.equal(c.filter((x) => x.tipo === 'pausa').length, 4);
  const a = c.find((x) => x.tipo === 'fig'); const b = c.find((x) => x.tipo === 'pausa' && x.par === a.par); assert.ok(mesmoPar(a, b)); assert.ok(!mesmoPar(a, c.find((x) => x.tipo === 'fig' && x.par !== a.par)));
});
test('quiz: a resposta certa está entre as opções, sem repetir', () => { for (const n of [1, 2]) for (let i = 0; i < 80; i++) { const q = quizQ(n); assert.ok(q.opcoes.includes(q.ok)); assert.equal(new Set(q.opcoes).size, q.opcoes.length); if (n === 1) assert.notEqual(q.tipo, 'pausa'); } });
test('árvore: semibreve e mínima prontas; quantas cabem numa semibreve', () => {
  assert.deepEqual(ARVORE.map((a) => a.cabem), [1, 2, 4, 8, 16]); assert.deepEqual(ARVORE.map((a) => a.pronto), [true, true, false, false, false]); for (const a of ARVORE) assert.ok(opcoesArvore(a.cabem).includes(a.cabem));
});
test('tetris: o lado certo tem o nome da figura que cai', () => { for (const n of [1, 2]) for (const it of itensTetris(n, 30)) { assert.notEqual(it.esq, it.dir); assert.equal(it[it.ok], it.fig); assert.ok(ids.includes(it.fig)); } });
test('estrelas: sem erro 3, até 2 erros 2, mais que isso 1', () => { assert.deepEqual([0, 1, 2, 3, 9].map(estrelasFigurix), [3, 2, 2, 1, 1]); });
