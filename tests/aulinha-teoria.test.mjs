import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../marketing/aulinha-ouvido/teoria.js';
const nomes = (l) => l.map(T.cifra).join(' ');

test('escalas maiores com a grafia certa e armadura', () => {
  assert.equal(nomes(T.escala('C', 'maior')), 'C D E F G A B'); assert.equal(nomes(T.escala('D', 'maior')), 'D E F♯ G A B C♯');
  assert.equal(nomes(T.escala('F', 'maior')), 'F G A B♭ C D E'); assert.equal(nomes(T.escala('Bb', 'maior')), 'B♭ C D E♭ F G A');
  assert.equal(nomes(T.escala('F#', 'maior')), 'F♯ G♯ A♯ B C♯ D♯ E♯'); assert.equal(nomes(T.escala('Gb', 'maior')), 'G♭ A♭ B♭ C♭ D♭ E♭ F');
  const exp = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 };
  for (const [k, n] of Object.entries(exp)) { const a = T.armadura(k); assert.equal(a.n, n, k); assert.equal(a.tipo, n === 0 ? '' : ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'].includes(k) ? '♯' : '♭', k); }
  assert.deepEqual(T.armadura('A', 'maior').notas, ['F', 'C', 'G']); assert.deepEqual(T.armadura('Eb', 'maior').notas, ['B', 'E', 'A']);
});
test('menores: relativa, natural, harmônica e melódica', () => {
  assert.equal(T.cifra(T.relativaMenor('C')), 'A'); assert.equal(T.cifra(T.relativaMenor('G')), 'E'); assert.equal(T.cifra(T.relativaMenor('Bb')), 'G'); assert.equal(T.cifra(T.relativaMenor('D')), 'B'); assert.equal(T.cifra(T.relativaMaior('F#')), 'A');
  assert.equal(nomes(T.escala('A', 'menor')), 'A B C D E F G'); assert.equal(nomes(T.escala('A', 'menorHarm')), 'A B C D E F G♯'); assert.equal(nomes(T.escala('A', 'menorMel')), 'A B C D E F♯ G♯');
  assert.equal(nomes(T.escala('E', 'menor')), 'E F♯ G A B C D'); assert.equal(nomes(T.escala('C', 'menor')), 'C D E♭ F G A♭ B♭');
  assert.equal(T.armadura('A', 'menor').n, 0); assert.equal(T.armadura('E', 'menor').n, 1); assert.equal(T.armadura('C', 'menor').n, 3);
});
test('modos de dó e de ré (mesmas notas da escala de dó maior)', () => {
  const dm = { dorico: 'D E F G A B C', frigio: 'E F G A B C D', lidio: 'F G A B C D E', mixolidio: 'G A B C D E F', eolio: 'A B C D E F G', locrio: 'B C D E F G A' };
  const roots = { dorico: 'D', frigio: 'E', lidio: 'F', mixolidio: 'G', eolio: 'A', locrio: 'B' }; for (const [m, e] of Object.entries(dm)) assert.equal(nomes(T.escala(roots[m], m)), e, m);
  assert.equal(nomes(T.escala('C', 'dorico')), 'C D E♭ F G A B♭'); assert.equal(nomes(T.escala('C', 'lidio')), 'C D E F♯ G A B'); assert.equal(nomes(T.escala('C', 'mixolidio')), 'C D E F G A B♭'); assert.equal(nomes(T.escala('C', 'frigio')), 'C D♭ E♭ F G A♭ B♭'); assert.equal(nomes(T.escala('C', 'locrio')), 'C D♭ E♭ F G♭ A♭ B♭');
});
test('pentatônicas e blues', () => {
  assert.equal(nomes(T.escala('C', 'penta')), 'C D E G A'); assert.equal(nomes(T.escala('A', 'pentaMenor')), 'A C D E G'); assert.equal(nomes(T.escala('A', 'blues')), 'A C D E♭ E G');
});
test('intervalos', () => {
  const i = (a, b) => T.intervalo(T.N(a), T.N(b)).txt;
  assert.equal(i('C', 'E'), '3ª maior'); assert.equal(i('C', 'Eb'), '3ª menor'); assert.equal(i('C', 'G'), '5ª justa'); assert.equal(i('C', 'F#'), '4ª aumentada'); assert.equal(i('C', 'Gb'), '5ª diminuta');
  assert.equal(i('D', 'C'), '7ª menor'); assert.equal(i('C', 'B'), '7ª maior'); assert.equal(i('E', 'C'), '6ª menor'); assert.equal(i('A', 'F#'), '6ª maior'); assert.equal(i('C', 'D'), '2ª maior'); assert.equal(i('E', 'F'), '2ª menor'); assert.equal(i('F', 'B'), '4ª aumentada');
});
test('acordes: tríades e tétrades com a grafia certa', () => {
  const a = (r, t) => nomes(T.acorde(r, t));
  assert.equal(a('C', 'maj'), 'C E G'); assert.equal(a('D', 'maj'), 'D F♯ A'); assert.equal(a('Eb', 'maj'), 'E♭ G B♭'); assert.equal(a('A', 'min'), 'A C E'); assert.equal(a('F#', 'min'), 'F♯ A C♯'); assert.equal(a('B', 'dim'), 'B D F'); assert.equal(a('C', 'aug'), 'C E G♯');
  assert.equal(a('G', 7), 'G B D F'); assert.equal(a('C', 'maj7'), 'C E G B'); assert.equal(a('D', 'm7'), 'D F A C'); assert.equal(a('B', 'm7b5'), 'B D F A'); assert.equal(a('C', 'dim7'), 'C E♭ G♭ B𝄫'.replace('𝄫', '♭♭')); assert.equal(a('C', 'sus4'), 'C F G'); assert.equal(a('C', 'add9'), 'C E G D');
  assert.equal(T.nomeAcorde('C', 'm7b5'), 'Cm7(♭5)'); assert.equal(T.nomeAcorde('F#', 'min'), 'F♯m');
});
test('campo harmônico', () => {
  const c = T.campo('C'); assert.equal(c.map((x) => x.nomeTri).join(' '), 'C Dm Em F G Am B°'); assert.equal(c.map((x) => x.nomeTet).join(' '), 'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7(♭5)'); assert.equal(c.map((x) => x.romano).join(' '), 'I ii iii IV V vi vii°');
  assert.equal(T.campo('G').map((x) => x.nomeTri).join(' '), 'G Am Bm C D Em F♯°'); assert.equal(T.campo('Bb').map((x) => x.nomeTri).join(' '), 'B♭ Cm Dm E♭ F Gm A°');
  assert.equal(T.campo('A', 'menor').map((x) => x.nomeTri).join(' '), 'Am B° C Dm Em F G'); assert.equal(T.campo('A', 'menorHarm').map((x) => x.nomeTri).join(' '), 'Am B° C+ Dm E F G♯°');
  assert.equal(T.progressao('C', [1, 5, 6, 4]).join(' '), 'C G Am F'); assert.equal(T.progressao('G', [2, 5, 1], 'maior', true).join(' '), 'Am7 D7 Gmaj7'); assert.equal(T.cifra(T.dominanteDe(T.N('D'))), 'A');
  assert.equal(nomes(T.inversao(T.acorde('C', 'maj'), 1)), 'E G C');
});
