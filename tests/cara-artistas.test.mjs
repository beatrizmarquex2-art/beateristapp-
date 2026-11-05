import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as K from '../js/jogos/cara-artistas-logic.js';
import { ARTISTS, QUESTIONS, answerFor, BY_ID, DECK_SIZE, falador, FALAS } from '../js/jogos/cara-artistas-data.js';

const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8'));
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };

test('todas as 125 figurinhas pertencem a um artista da tabela (86 nomes), e a foto existe', () => {
  assert.equal(cat.length, 125); assert.equal(ARTISTS.length, 86); assert.equal(new Set(ARTISTS.map((a) => a.id)).size, 86);
  const byName = new Map(ARTISTS.map((a) => [a.name, a]));
  for (const c of cat) { const a = byName.get(c.artista_banda); assert.ok(a, c.artista_banda); assert.ok(a.fotos.includes(c.codigo), c.codigo); }
  assert.equal(ARTISTS.reduce((n, a) => n + a.fotos.length, 0), 125);
  for (const c of cat) { assert.ok(fs.existsSync(new URL(`../assets/figurinhas/mini/${c.codigo}.webp`, import.meta.url)), `mini ${c.codigo}`); assert.ok(fs.existsSync(new URL(`../assets/figurinhas/fotos/${c.codigo}.jpeg`, import.meta.url)), `foto ${c.codigo}`); }
});
test('toda pergunta tem texto, motivo, e usa só atributos que existem na tabela', () => {
  const attrs = new Set(ARTISTS.flatMap((a) => a.attrs)); assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  for (const q of QUESTIONS) { assert.ok(q.text.endsWith('?') && q.why.length > 5, q.id); assert.ok(attrs.has(q.id), `ninguém tem ${q.id}`); }
  for (const a of ARTISTS) for (const t of a.attrs) assert.ok(QUESTIONS.some((q) => q.id === t), `${a.name}: atributo sem pergunta ${t}`);
});
test('baralho: 16 artistas diferentes, todos distinguíveis por alguma pergunta, e o segredo sempre fica nos candidatos', () => {
  for (let s = 1; s <= 120; s++) {
    let g = K.newGame({ rnd: seeded(s * 7919) }); assert.equal(g.deck.length, DECK_SIZE); assert.equal(new Set(g.deck).size, DECK_SIZE);
    assert.equal(new Set(g.deck.map((id) => K.signature(BY_ID[id]))).size, DECK_SIZE); assert.ok(g.deck.includes(g.secret));
    for (const id of g.deck) assert.ok(BY_ID[id].fotos.includes(g.photos[id]));
    const order = QUESTIONS.slice().sort(() => seeded(s)() - 0.5);
    for (const q of order) { g = K.ask(g, q.id); assert.ok(K.candidates(g).includes(g.secret)); assert.equal(g.asked.at(-1).yes, answerFor(BY_ID[g.secret], q.id)); }
    assert.deepEqual(K.candidates(g), [g.secret], 'perguntando tudo, só sobra o segredo');
  }
});
test('chutes: acerto vence, 3 erros perdem, carta fora do baralho e repetida dão erro', () => {
  let g = K.newGame({ rnd: seeded(5) }); const outros = g.deck.filter((id) => id !== g.secret);
  assert.throws(() => K.guess(g, 'nao-existe')); g = K.guess(g, outros[0]); assert.equal(g.lives, 2); assert.throws(() => K.guess(g, outros[0]));
  g = K.guess(g, outros[1]); g = K.guess(g, outros[2]); assert.ok(g.over && g.result.win === false);
  const w = K.guess(K.newGame({ rnd: seeded(5) }), K.newGame({ rnd: seeded(5) }).secret); assert.ok(w.over && w.result.win);
  assert.ok(K.validGame(K.newGame()));
});
test('falas: sem repetir até passar todas, com nome no lugar certo', () => {
  const f = falador(seeded(3)); const got = new Set(); for (let i = 0; i < FALAS.sim.length; i++) got.add(f('sim')); assert.equal(got.size, FALAS.sim.length);
  assert.ok(f('acerto', { n: 'Queen' }).includes('Queen')); assert.ok(!f('chuteErrado', { n: 'X' }).includes('{'));
});
