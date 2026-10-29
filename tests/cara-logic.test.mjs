import test from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../js/jogos/cara-logic.js';
import { INSTRUMENTS, QUESTIONS, answerFor, BY_ID } from '../js/jogos/cara-data.js';

const fixed = (id) => { const i = INSTRUMENTS.findIndex((x) => x.id === id); return () => (i + 0.5) / INSTRUMENTS.length; };

test('12 instrumentos únicos e perguntas únicas', () => { assert.equal(INSTRUMENTS.length, 12); assert.equal(new Set(INSTRUMENTS.map((i) => i.id)).size, 12); assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length); });
test('tabela segue a especificação (casos que costumam dar confusão)', () => {
  const a = (id, q) => answerFor(BY_ID[id], q);
  assert.equal(a('saxofone', 'madeiras'), true); assert.equal(a('saxofone', 'metais'), false); assert.equal(a('trompete', 'metais'), true); assert.equal(a('flauta', 'palheta'), false); assert.equal(a('saxofone', 'palheta'), true);
  assert.equal(a('teclado', 'cordas'), false); assert.equal(a('teclado', 'teclas'), true); assert.equal(a('acordeao', 'teclas'), true); assert.equal(a('acordeao', 'eletrico'), false); assert.equal(a('acordeao', 'fole'), true);
  assert.equal(a('violino', 'arco'), true); assert.equal(a('violao', 'arco'), false); assert.equal(a('violao', 'eletrico'), false); assert.equal(a('baixo', 'eletrico'), true);
  assert.equal(a('pandeiro', 'pele'), true); assert.equal(a('triangulo', 'pele'), false); assert.equal(a('bateria', 'conjunto'), true); assert.equal(a('bateria', 'baqueta'), true); assert.equal(a('triangulo', 'baqueta'), true); assert.equal(a('pandeiro', 'baqueta'), false);
  assert.equal(a('violao', 'sopro'), false); assert.equal(a('flauta', 'sopro'), true);
});
test('todos os 12 segredos permanecem entre os candidatos, em qualquer ordem de perguntas (automático)', () => {
  for (const inst of INSTRUMENTS) for (let rot = 0; rot < QUESTIONS.length; rot++) {
    let g = K.newGame({ rnd: fixed(inst.id) }); assert.equal(g.secret, inst.id);
    for (let k = 0; k < QUESTIONS.length; k++) { const q = QUESTIONS[(k + rot) % QUESTIONS.length]; g = K.ask(g, q.id); assert.ok(K.candidates(g).includes(inst.id)); assert.equal(g.asked.at(-1).yes, answerFor(inst, q.id)); }
  }
});
test('com todas as perguntas sobram só os instrumentos de respostas idênticas (guitarra e baixo são indistinguíveis por atributo: aí vale o chute)', () => {
  const vec = (i) => QUESTIONS.map((q) => answerFor(i, q.id)).join();
  for (const inst of INSTRUMENTS) {
    let g = K.newGame({ rnd: fixed(inst.id) }); for (const q of QUESTIONS) g = K.ask(g, q.id);
    assert.deepEqual(K.candidates(g).sort(), INSTRUMENTS.filter((o) => vec(o) === vec(inst)).map((o) => o.id).sort());
    assert.ok(K.candidates(g).length <= 2);
  }
});
test('pergunta repetida e inexistente recusadas; segredo não muda', () => {
  let g = K.newGame({ rnd: fixed('flauta') }); g = K.ask(g, 'cordas'); assert.throws(() => K.ask(g, 'cordas')); assert.throws(() => K.ask(g, 'xyz')); assert.equal(g.secret, 'flauta');
});
test('chute errado elimina só o chutado e gasta uma tentativa; 3 erros revelam; acerto vence; nada após o fim', () => {
  let g = K.newGame({ rnd: fixed('violino') }); const before = K.candidates(g).length;
  g = K.guess(g, 'violao'); assert.equal(g.lives, 2); assert.equal(K.candidates(g).length, before - 1); assert.equal(g.out.length, 0); assert.throws(() => K.guess(g, 'violao'));
  g = K.guess(g, 'baixo'); g = K.guess(g, 'guitarra'); assert.ok(g.over && !g.result.win); assert.throws(() => K.ask(g, 'cordas')); assert.throws(() => K.guess(g, 'violino'));
  const w = K.guess(K.newGame({ rnd: fixed('violino') }), 'violino'); assert.ok(w.over && w.result.win);
});
test('manual: não elimina sozinho; virar/desvirar e desfazer a última', () => {
  let g = K.newGame({ manual: true, rnd: fixed('pandeiro') }); g = K.ask(g, 'cordas'); assert.equal(g.out.length, 0); assert.equal(K.candidates(g).length, 12);
  g = K.flip(g, 'violao'); g = K.flip(g, 'baixo'); assert.equal(K.candidates(g).length, 10); g = K.undoFlip(g); assert.deepEqual(g.flips, ['violao']); g = K.flip(g, 'violao'); assert.equal(g.flips.length, 0);
  assert.throws(() => K.flip(K.newGame({ rnd: fixed('flauta') }), 'violao'));
});
