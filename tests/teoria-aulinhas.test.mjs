// Teoria e aulas de instrumento (bateria, teclado, violão): cada tema tem 30 aulinhas em 6 fases de 5, e cada fase tem quiz que dá pra sortear 3 perguntas com 1 resposta certa.
import test from 'node:test'; import assert from 'node:assert/strict';
const F = await import('../js/kids/teoria-figuras.js'); const T = await import('../js/kids/teoria-temas.js'); const I = await import('../js/kids/teoria-instrumentos.js');
const TEMAS = { figuras: F.FASES_FIGURAS, pausas: T.FASES_PAUSAS, claves: T.FASES_CLAVES, tempo: T.FASES_TEMPO, leitura: T.FASES_LEITURA, bateria: I.FASES_BATERIA, teclado: I.FASES_TECLADO, violao: I.FASES_VIOLAO };
for (const [nome, fases] of Object.entries(TEMAS)) {
  test(`${nome}: 6 fases de 5 aulinhas = 30`, () => {
    assert.equal(fases.length, 6); for (const f of fases) { assert.equal(f.cards.length, 5, f.nome); assert.ok(f.nome && f.paul, f.nome); }
    assert.equal(fases.reduce((n, f) => n + f.cards.length, 0), 30);
    for (const f of fases) for (const c of f.cards) { assert.ok(c.t && c.txt && typeof c.ic === 'function', `${nome}/${f.nome}/${c.t}`); assert.ok(c.txt.length <= 190, `texto curto: ${c.t} (${c.txt.length})`); assert.ok(!/[A-ZÀ-Ú]{2,}/.test(c.txt.slice(0, 1)), c.t); }
  });
  test(`${nome}: cada fase tem quiz com 3+ perguntas, 3 opções diferentes e a certa marcada`, () => {
    for (const f of fases) { assert.ok(f.quiz.length >= 3, f.nome); for (const q of f.quiz) { assert.equal(q.ops.length, 3, q.q); assert.equal(new Set(q.ops).size, 3, q.q); assert.ok(q.ok >= 0 && q.ok < 3, q.q); } assert.equal(new Set(f.quiz.map((q) => q.q)).size, f.quiz.length, `${f.nome}: pergunta repetida`); }
  });
}
test('as posições da pauta dão a nota certa nas duas claves', () => {
  const n = (c, p) => T.notaDe(c, p);
  assert.deepEqual([0, 2, 4, 6, 8].map((p) => n('sol', p).nome), ['mi', 'sol', 'si', 'ré', 'fá']); assert.deepEqual([1, 3, 5, 7].map((p) => n('sol', p).nome), ['fá', 'lá', 'dó', 'mi']);
  assert.deepEqual([0, 2, 4, 6, 8].map((p) => n('fa', p).nome), ['sol', 'si', 'ré', 'fá', 'lá']); assert.deepEqual([1, 3, 5, 7].map((p) => n('fa', p).nome), ['lá', 'dó', 'mi', 'sol']);
  assert.equal(n('sol', -2).midi, 60); assert.equal(n('fa', 10).midi, 60); assert.equal(n('sol', 2).midi, 67); assert.equal(n('fa', 6).midi, 53);
});
