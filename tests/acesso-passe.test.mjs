import test from 'node:test';
import assert from 'node:assert/strict';
const mem = new Map(); globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const AC = await import('../js/acesso.js');
test('sem código: Uno trancado; código completo: tudo aberto', () => {
  AC.definir(false); assert.equal(AC.trancado('#/jogos/cartas'), true);
  AC.definir(true); assert.equal(AC.trancado('#/jogos/cartas'), false); assert.equal(AC.trancado('#/album'), false); assert.equal(AC.liberado(), true);
});
test('passe de um jogo: libera só o que foi escolhido, o resto continua como visitante, e não conta como código completo', () => {
  localStorage.setItem('beaterista-aluno-escopo', JSON.stringify(['#/jogos/cartas'])); AC.definir(true);
  assert.equal(AC.trancado('#/jogos/cartas'), false); assert.equal(AC.trancado('#/jogos/cartas/qualquer'), false); assert.equal(AC.trancado('#/jogos/cartas?sala=ABCDE'), false);
  assert.equal(AC.trancado('#/jogos/toca'), true, 'outro jogo trancado'); assert.equal(AC.trancado('#/album'), true); assert.equal(AC.trancado('#/ritmo'), true);
  assert.equal(AC.liberado(), false, 'passe não libera estrelas/álbum'); assert.equal(AC.comCodigo(), true);
});
test('passe do Modo Aventura vale em qualquer jogo; test drive (sem escopo) libera tudo', () => {
  localStorage.setItem('beaterista-aluno-escopo', JSON.stringify(['/aventura'])); AC.definir(true);
  assert.equal(AC.trancado('#/jogos/bingo/aventura'), false); assert.equal(AC.trancado('#/jogos/toca'), true);
  localStorage.removeItem('beaterista-aluno-escopo'); assert.equal(AC.trancado('#/album'), false); assert.equal(AC.liberado(), true);
});
