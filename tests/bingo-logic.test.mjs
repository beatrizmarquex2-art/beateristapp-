import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/jogos/bingo-logic.js';
import { THEMES, CARDS24, ARTISTS } from '../js/jogos/bingo-data.js';

const R = B.seeded;
const drawAll = (g) => { while (B.canDraw(g)) g = B.drawNext(g); return g; };
const drawUntil = (g, id) => { while (!B.isDrawn(g, id)) g = B.drawNext(g); return g; };
/** Sorteia até a linha (3 casas) da cartela ci estar toda sorteada, parando no sorteio exato que a completa. */
const drawLine = (g, ci, line) => { for (const c of line) g = drawUntil(g, g.cards[ci][c]); return g; };
const markCells = (g, ci, cells) => { for (const c of cells) { const r = B.toggleMark(g, ci, c); assert.ok(r.ok, `marcar ${c}: ${r.reason}`); g = r.g; } return g; };

test('catálogo: 4 temas de 16 itens + 86 alvos de artistas, ids únicos e nomes únicos', () => {
  for (const [t, v] of Object.entries(THEMES)) { assert.equal(v.itens.length, 16, t); assert.equal(new Set(v.itens.map((i) => i.id)).size, 16); assert.equal(new Set(v.itens.map((i) => i.nome)).size, 16); }
  assert.equal(ARTISTS.length, 86); assert.equal(new Set(ARTISTS.map((a) => a.id)).size, 86); assert.equal(ARTISTS.reduce((s, a) => s + a.fotos.length, 0), 125);
  assert.equal(new Set(ARTISTS.flatMap((a) => a.fotos)).size, 125, 'as 125 fotos aparecem uma vez cada');
});

test('as 24 cartelas oficiais de cada tema: 3×3, 9 ids distintos do pool, nenhuma repetida, todos os itens saem em alguma', () => {
  for (const t of ['instrumentos', 'pecas', 'figuras', 'simbolos']) {
    const pool = new Set(B.themeIds(t)); const { cards } = B.printCards(t);
    assert.equal(cards.length, 24); const sigs = new Set(); const grids = new Set(); const used = new Set();
    for (const c of cards) { assert.equal(c.grid.length, 9); assert.equal(new Set(c.grid).size, 9); assert.ok(c.grid.every((x) => pool.has(x)), `${c.id} fora do tema`); sigs.add(c.grid.slice().sort().join('|')); grids.add(c.grid.join('|')); c.grid.forEach((x) => used.add(x)); }
    assert.equal(sigs.size, 24, `${t}: conjuntos repetidos`); assert.equal(grids.size, 24); assert.equal(used.size, 16, `${t}: item que nunca sai`);
    assert.equal(CARDS24[t].length, 24);
  }
});

test('pool: 16 itens nos temas normais e 18 alvos de artistas; todos no tema', () => {
  for (const t of ['instrumentos', 'pecas', 'figuras', 'simbolos']) assert.equal(B.makePool(t, R(1)).length, 16);
  const p = B.makePool('artistas', R(2)); assert.equal(p.length, 18); assert.equal(new Set(p).size, 18); assert.ok(p.every((i) => B.themeIds('artistas').includes(i)));
});

test('artistas: o recorte gira e, com o uso, os 86 alvos aparecem; nunca repete alvo na rodada', () => {
  let recent = []; const seen = new Set();
  for (let r = 0; r < 12; r++) { const p = B.makePool('artistas', R(r + 10), recent); assert.equal(new Set(p).size, 18); p.forEach((i) => seen.add(i)); recent = [...recent.filter((x) => !p.includes(x)), ...p]; }
  assert.equal(seen.size, 86);
  const a = B.makePool('artistas', R(5), []); const b = B.makePool('artistas', R(5), a); assert.equal(a.filter((x) => b.includes(x)).length, 0, 'rodada seguinte evita os recém usados');
});

test('cartelas geradas: 9 ids distintos do pool e distintas entre si (24 de uma vez)', () => {
  for (const t of ['instrumentos', 'artistas']) { const pool = B.makePool(t, R(3)); const cards = B.makeCards(pool, 24, R(4)); assert.equal(cards.length, 24); assert.equal(new Set(cards.map((c) => c.slice().sort().join('|'))).size, 24); for (const c of cards) { assert.equal(new Set(c).size, 9); assert.ok(c.every((x) => pool.includes(x))); } }
});

test('sorteio: percorre o pool inteiro sem repetir, nunca fora do tema, e toda cartela pode fechar linha', () => {
  for (let s = 1; s < 40; s++) {
    const t = ['instrumentos', 'pecas', 'figuras', 'simbolos', 'artistas'][s % 5]; let g = B.newGame({ tema: t, rnd: R(s) });
    g = drawAll(g); assert.equal(g.idx, g.seq.length); assert.equal(new Set(B.drawn(g)).size, g.pool.length); assert.ok(B.drawn(g).every((i) => B.themeIds(t).includes(i)));
    assert.ok(g.cards[0].every((i) => B.drawn(g).includes(i))); assert.throws(() => B.drawNext(g));
    assert.ok(B.completedAt(g, 0) && B.completedAt(g, 0) <= g.seq.length, 'a cartela completa uma linha antes do fim');
  }
});

test('vitória: horizontal, vertical e diagonal funcionam na condição "qualquer linha"', () => {
  for (const [kind, lines] of Object.entries(B.LINE_SETS)) for (const line of lines) {
    let g = B.newGame({ tema: 'pecas', perfil: 'classico', rnd: R(7) }); g = drawLine(g, 0, line); g = markCells(g, 0, line.slice(0, 2));
    assert.equal(B.declare(g, 0).ok, false, `${kind} com 2 marcas não vale`); g = markCells(g, 0, line.slice(2));
    const r = B.declare(g, 0); assert.ok(r.ok && r.g.over && r.g.result.tipo === 'vitoria', `${kind} ${line}`); assert.deepEqual(r.g.result.linhas[0], line);
  }
});

test('condição escolhida antes: "somente diagonal" não aceita horizontal (e vice-versa)', () => {
  const hline = B.LINE_SETS.horizontal[0]; const dline = B.LINE_SETS.diagonal[0];
  let g = B.newGame({ tema: 'figuras', perfil: 'classico', vitoria: 'diagonal', rnd: R(9) }); g = markCells(drawLine(g, 0, hline), 0, hline); const a = B.declare(g, 0);
  // a horizontal pode ter completado uma diagonal por acaso; se não, deve recusar
  if (!B.validLine(g, 0)) assert.equal(a.ok, false);
  let h = B.newGame({ tema: 'figuras', perfil: 'classico', vitoria: 'diagonal', rnd: R(11) }); h = markCells(drawLine(h, 0, dline), 0, dline); assert.ok(B.declare(h, 0).ok);
  let v = B.newGame({ tema: 'figuras', perfil: 'classico', vitoria: 'horizontal', rnd: R(12) }); v = markCells(drawLine(v, 0, dline), 0, dline); if (!B.validLine(v, 0)) assert.equal(B.declare(v, 0).ok, false);
  assert.equal(B.linesFor('diagonal').length, 2); assert.equal(B.linesFor('horizontal').length, 3); assert.equal(B.linesFor('vertical').length, 3); assert.equal(B.linesFor('qualquer').length, 8);
});

test('nenhum falso bingo: casas não sorteadas não marcam; sorteado mas sem marcar pede para marcar; sem último item travado', () => {
  let g = B.newGame({ tema: 'simbolos', perfil: 'classico', rnd: R(21) }); assert.equal(g.autoMarcar, false);
  const r = B.toggleMark(g, 0, 0); assert.equal(r.ok, false); assert.equal(r.reason, 'nao-sorteado'); assert.equal(B.declare(g, 0).ok, false);
  const line = B.LINE_SETS.vertical[1]; g = drawLine(g, 0, line); const d = B.declare(g, 0); assert.equal(d.ok, false); assert.equal(d.reason, 'falta-marcar');
  g = drawAll(g); assert.equal(B.canDraw(g), false); g = markCells(g, 0, line); assert.ok(B.declare(g, 0).ok, 'depois do último sorteio ainda dá pra gritar bingo');
  let x = drawAll(B.newGame({ tema: 'simbolos', rnd: R(22) })); assert.equal(x.over, false);
});

test('Kids: marcação automática só marca o que saiu', () => {
  let g = B.newGame({ tema: 'instrumentos', perfil: 'kids', rnd: R(31) }); assert.equal(g.autoMarcar, true);
  g = B.drawNext(g); const id = B.current(g); g.cards[0].forEach((x, cell) => assert.equal(g.marks[0][cell], x === id));
  g = drawAll(g); assert.ok(g.marks[0].every(Boolean), 'no fim, todas as 9 casas (todas saíram) estão marcadas');
  const m = B.newGame({ tema: 'instrumentos', perfil: 'kids', autoMarcar: false, rnd: R(31) }); assert.equal(B.drawNext(m).marks[0].some(Boolean), false, '"Eu quero marcar" não marca sozinho');
});

test('mesmo aparelho: 2 cartelas diferentes, uma por vez, e o próximo sorteio só depois dos dois', () => {
  let g = B.newGame({ tema: 'instrumentos', mode: 'mesmo', rnd: R(41) }); assert.equal(g.cards.length, 2);
  assert.notEqual(g.cards[0].slice().sort().join(), g.cards[1].slice().sort().join());
  g = B.drawNext(g); assert.equal(g.round.active, 0); assert.equal(B.canDraw(g), false, 'ainda falta o jogador 1 e o 2');
  assert.throws(() => B.drawNext(g)); assert.equal(B.toggleMark({ ...g, autoMarcar: false }, 1, 0).reason, 'vez');
  g = B.passTurn(g); assert.equal(g.round.active, 1); assert.equal(B.canDraw(g), false); g = B.passTurn(g); assert.equal(B.canDraw(g), true);
  const before = B.drawn(g).length; g = B.drawNext(g); assert.equal(B.drawn(g).length, before + 1);
});

test('mesmo aparelho: sorteio compartilhado; vitória resolvida só depois dos dois terem a vez; empate no mesmo sorteio', () => {
  // 2 cartelas que fecham a MESMA linha no mesmo sorteio: usa a mesma sequência e cartelas montadas
  let g = B.newGame({ tema: 'pecas', mode: 'mesmo', rnd: R(51) });
  const pool = g.pool; g.cards = [pool.slice(0, 9), [...pool.slice(0, 3), ...pool.slice(9, 15)]]; g.seq = [...pool.slice(0, 3), ...pool.slice(3, 16)]; g.marks = [Array(9).fill(false), Array(9).fill(false)];
  for (let i = 0; i < 3; i++) { g = B.drawNext(g); g = B.passTurn(B.passTurn(g)); }
  // as duas cartelas têm a linha 0 (casas 0,1,2) toda sorteada neste 3º sorteio
  assert.equal(B.completedAt(g, 0), 3); assert.equal(B.completedAt(g, 1), 3);
  g = B.drawNext(g); // 4º sorteio: abre nova rodada; os dois pedem bingo (por marcação manual das 3 casas)
  g = { ...g, marks: [[true, true, true, ...Array(6).fill(false)], [true, true, true, ...Array(6).fill(false)]] };
  const a = B.declare(g, 0); assert.ok(a.ok && a.pending && !a.g.over, 'primeiro pedido não encerra: o outro ainda tem a vez'); g = B.passTurn(a.g);
  const b = B.declare(g, 1); assert.ok(b.ok && b.pending); g = B.passTurn(b.g);
  assert.ok(g.over); assert.equal(g.result.tipo, 'empate'); assert.deepEqual(g.result.vencedores, [0, 1]);
});

test('mesmo aparelho: só um completou → ele vence; quem completou antes leva a vitória', () => {
  let g = B.newGame({ tema: 'pecas', mode: 'mesmo', rnd: R(61) });
  const pool = g.pool; g.cards = [pool.slice(0, 9), pool.slice(7, 16)]; g.seq = pool.slice(); g.marks = [Array(9).fill(false), Array(9).fill(false)];
  for (let i = 0; i < 3; i++) { g = B.drawNext(g); g = B.passTurn(B.passTurn(g)); }
  g = B.drawNext(g); g = { ...g, marks: [[true, true, true, ...Array(6).fill(false)], Array(9).fill(false)] };
  const a = B.declare(g, 0); g = B.passTurn(a.g); g = B.passTurn(g); assert.ok(g.over); assert.equal(g.result.tipo, 'vitoria'); assert.deepEqual(g.result.vencedores, [0]);
});

test('sala de aula: só o sorteador (sem cartelas), mesma sequência para todos', () => {
  let g = B.newGame({ tema: 'figuras', mode: 'sala', rnd: R(71) }); assert.equal(g.cards.length, 0); g = drawAll(g); assert.equal(g.idx, 16);
});

test('retomar partida: validGame aceita a partida salva e recusa lixo', () => {
  let g = B.newGame({ tema: 'artistas', rnd: R(81) }); g = B.drawNext(g); const back = JSON.parse(JSON.stringify(g)); assert.ok(B.validGame(back));
  assert.equal(B.validGame({ ...back, idx: 99 }), false); assert.equal(B.validGame({ ...back, seq: back.seq.slice(1) }), false); assert.equal(B.validGame(null), false);
  assert.equal(B.validGame({ ...back, cards: [back.cards[0].slice(0, 8)] }), false);
});

test('artistas: foto fixa por rodada e nunca duas fotos do mesmo alvo na mesma rodada', () => {
  const g = B.newGame({ tema: 'artistas', rnd: R(91) });
  for (const id of g.pool) { const a = B.photoFor(id, g.salt); assert.equal(a, B.photoFor(id, g.salt)); assert.ok(B.artistOf(id).fotos.includes(a)); }
  const beatles = ARTISTS.find((x) => x.nome === 'The Beatles'); assert.equal(g.pool.filter((i) => i === beatles.id).length <= 1, true);
});
