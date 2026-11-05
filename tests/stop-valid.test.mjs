import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../js/jogos/stop-valid.js';

test('12 categorias oficiais e 16 letras, nada além disso', () => {
  assert.equal(V.CATS.length, 12); assert.equal(new Set(V.CATS.map((c) => c.id)).size, 12);
  assert.deepEqual(V.LETTERS, 'A B C D E F G J L M N P R S T V'.split(' '));
});
test('normalização: acento, maiúscula, espaço e pontuação', () => {
  assert.equal(V.normalize('  ÁGUA   de   Côco! '), 'agua de coco'); assert.equal(V.keyOf('Hi-Hat'), V.keyOf('hi hat')); assert.equal(V.keyOf('BATERIA'), V.keyOf('bateria'));
});
test('artigos iniciais não contam; “A-ha” fica com o A', () => {
  assert.equal(V.initialOf('The Beatles'), 'B'); assert.equal(V.initialOf('Os Paralamas do Sucesso'), 'P'); assert.equal(V.initialOf('A Sky Full of Stars'), 'S');
  assert.equal(V.initialOf('Um violão'), 'V'); assert.equal(V.initialOf('An Awesome Wave'), 'A'); assert.equal(V.initialOf('A-ha'), 'A'); assert.equal(V.initialOf('123'), '');
});
test('classificação: válida, inválida (letra / categoria / vazia) e pendente', () => {
  assert.equal(V.recognize('bateria', 'instrumento', 'B').status, 'valida');
  assert.equal(V.recognize('BATERIA', 'instrumento', 'B').status, 'valida');
  assert.equal(V.recognize('', 'instrumento', 'B').status, 'invalida'); assert.ok(V.recognize('', 'instrumento', 'B').empty);
  assert.equal(V.recognize('guitarra', 'instrumento', 'B').status, 'invalida'); assert.match(V.recognize('guitarra', 'instrumento', 'B').why, /começa com B/);
  const x = V.recognize('Bxzqwerty', 'banda', 'B'); assert.equal(x.status, 'pendente'); assert.match(x.why, /revis/);
  assert.equal(V.recognize('bumbo', 'banda', 'B').status, 'invalida'); // bumbo é peça de bateria, não banda
});
test('sinônimos e equivalentes dão a mesma identidade', () => {
  const a = V.recognize('chimbal', 'percussao', 'C'); const b = V.recognize('hi-hat', 'percussao', 'H');
  assert.equal(a.status, 'valida'); assert.equal(a.canon, V.recognize('Chimbal', 'percussao', 'C').canon);
  assert.equal(V.recognize('the beatles', 'banda', 'B').canon, V.recognize('Beatles', 'banda', 'B').canon);
  assert.equal(V.recognize('The Beatles', 'banda', 'B').status, 'valida'); void b;
});
test('erro de digitação pequeno vira sugestão (pendente), nunca válida sozinha', () => {
  const r = V.recognize('bateira', 'instrumento', 'B'); assert.equal(r.status, 'pendente'); assert.equal(r.suggest.toLowerCase(), 'bateria');
});
test('letras elegíveis dependem das categorias escolhidas', () => {
  const l = V.eligibleLetters(['instrumento', 'banda', 'musica', 'cantor', 'estilo']); assert.ok(l.length >= 8 && l.every((x) => V.LETTERS.includes(x)));
  assert.ok(l.includes('B'));
});
test('banco: toda categoria tem respostas em várias das 16 letras', () => {
  for (const c of V.CATS) assert.ok(V.coverage(c.id).length >= 8, `${c.id}: ${V.coverage(c.id).join('')}`);
});
