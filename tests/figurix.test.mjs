import test from 'node:test';
import assert from 'node:assert/strict';
import { PHASES, FASES, CICLO, rapidaLenta, MONTES, peçasDe, confereMonte, paresLigar, paresPausa, mesmoPar, quizQ, ARVORE, opcoesArvore, itensTetris, estrelasFigurix, ids, rapidaLentaN, totalRL, totalQuiz, montesDe, ligarCfg, paresLigarN, memCfg, paresMem, mesmoParN, quizN, palavrasDe, grandeCaca, arvore, opcoesCabem, tetrisCfg, itensTetrisN } from '../js/jogos/figurix-logic.js';
import { FIG_BY } from '../js/kids/figs.js';

test('as 12 primeiras fases são as da Bea e depois vêm mais 50 (62 no total)', () => {
  assert.equal(PHASES.length, FASES); assert.equal(FASES, 62); assert.deepEqual(PHASES.slice(0, 12).map((p) => p.tipo), ['rapida', 'lenta', 'monte', 'ligar', 'ligar', 'memoria', 'quiz', 'caca', 'notas', 'tetris', 'quiz', 'tetris']);
  assert.deepEqual(PHASES.filter((p) => p.tipo === 'ligar').slice(0, 2).map((p) => p.k), [3, 5]); assert.ok(PHASES.every((p, i) => p.n === i + 1)); assert.ok(PHASES.slice(12).every((p, i) => p.tipo === CICLO[i % 10]));
  const niveis = PHASES.slice(12).map((p) => p.nivel); assert.deepEqual(niveis, niveis.slice().sort((a, b) => a - b), 'a dificuldade nunca desce');
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
test('estrelas igual à pauLta: 100% = 3, 80% = 2, 60% = 1, abaixo = 0 (acertos contra acertos + erros)', () => { assert.deepEqual([[8, 0], [8, 2], [8, 3], [8, 5], [8, 6], [5, 5]].map(([a, e]) => estrelasFigurix(a, e)), [3, 2, 1, 1, 0, 0]); });

test('fases novas: rápida/lenta com mais opções nos níveis altos e resposta certa sempre única', () => {
  for (const nivel of [3, 4, 5, 6, 7]) for (const tipo of ['rapida', 'lenta']) for (let i = 0; i < 40; i++) { const q = rapidaLentaN(tipo, i, nivel); const b = q.figs.map((f) => FIG_BY[f].beats); assert.equal(q.figs.length, nivel >= 6 ? 5 : nivel >= 4 ? 4 : 3); assert.equal(FIG_BY[q.ok].beats, tipo === 'rapida' ? Math.min(...b) : Math.max(...b)); }
  assert.equal(totalRL(3), 5); assert.equal(totalRL(6), 7); assert.equal(totalQuiz(3), 8); assert.equal(totalQuiz(6), 12);
});
test('monte a figura: todas as figuras pedidas existem e crescem nos níveis', () => { for (const n of [1, 2, 3, 4, 5, 6, 7]) for (const f of montesDe(n)) assert.ok(FIG_BY[f]); assert.ok(montesDe(5).includes('semifusa')); });
test('ligar por nível: cada esquerda tem exatamente uma direita igual', () => {
  for (const p of PHASES.filter((x) => x.tipo === 'ligar')) { const c = ligarCfg(p); const r = paresLigarN(c.k, c.tipo); assert.equal(r.esq.length, c.k); assert.deepEqual(r.esq.map((x) => x.id).sort(), r.dir.map((x) => x.id).sort()); assert.equal(new Set(r.dir.map((x) => x.id)).size, c.k); }
});
test('memória por nível: pares válidos, mesmo par só entre os dois lados', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7]) { const c = memCfg(n); const cs = paresMem(c.k, c.modo); assert.equal(cs.length, c.k * 2); const a = cs.find((x) => x.lado === 0); const b = cs.find((x) => x.lado === 1 && x.par === a.par); assert.ok(mesmoParN(a, b)); assert.ok(!mesmoParN(a, cs.find((x) => x.lado === 0 && x.k !== a.k))); }
});
test('quiz por nível: resposta entre as opções, sem repetir, e os tipos novos aparecem', () => {
  const tipos = new Set(); for (const n of [3, 4, 5, 6, 7]) for (let i = 0; i < 120; i++) { const q = quizN(n); tipos.add(q.tipo); assert.ok(q.opcoes.includes(q.ok), `${n} ${q.tipo}`); assert.equal(new Set(q.opcoes).size, q.opcoes.length); }
  assert.ok(tipos.has('metade') && tipos.has('cabem') && tipos.has('pausa'));
});
test('caça-palavras: 6 listas, palavras cabem na grade', () => { for (let n = 1; n <= 7; n++) { const ps = palavrasDe(n); assert.equal(ps.length, 6); assert.ok(ps.every((w) => w.length <= grandeCaca(n) && /^[a-z]+$/.test(w))); } });
test('árvore: cabem = valor da base ÷ valor da figura, e opções incluem a certa', () => { for (let n = 1; n <= 7; n++) { const t = arvore(n); assert.ok(t.linhas[0].pronto); assert.ok(t.linhas.some((l) => !l.pronto)); for (const l of t.linhas) { assert.equal(l.cabem, FIG_BY[t.base].beats / FIG_BY[l.id].beats); assert.ok(opcoesCabem(l.cabem).includes(l.cabem)); } } });
test('tetris por nível: mais rápido e mais itens; lado certo tem o nome certo', () => {
  assert.ok(tetrisCfg(7).queda < tetrisCfg(3).queda); assert.ok(tetrisCfg(6).itens > tetrisCfg(3).itens);
  for (let n = 1; n <= 7; n++) { const T = itensTetrisN(n); assert.equal(T.itens.length, tetrisCfg(n).itens); for (const it of T.itens) { assert.notEqual(it.esq, it.dir); assert.equal(it[it.ok], it.fig); } }
  assert.ok(['nome', 'valor', 'pausa'].includes(tetrisCfg(5).jeito));
});

test('os 4 mundos usam os temas do Figurix e todos os enfeites existem como sprites', async () => {
  const { MUNDOS } = await import('../js/jogos/figurix-logic.js'); const { DECOR_TEMA, TEMAS } = await import('../js/jogos/mundos-tema.js'); const fs = await import('node:fs');
  const art = fs.readFileSync(new URL('../js/kids/mapa-art.js', import.meta.url), 'utf8'); assert.deepEqual(TEMAS.sort(), ['deserto', 'espaco', 'floresta', 'gelo', 'mar', 'vulcao']);
  for (const [t, regs] of Object.entries(DECOR_TEMA)) for (const r of regs) for (const [s] of r) assert.ok(new RegExp(`\\n  ${s}: \\[`).test(art), `sprite ${s} (${t}) não existe`);
  assert.deepEqual(MUNDOS.map((m) => m.tema), ['floresta', 'deserto', 'mar', 'espaco']);
});
