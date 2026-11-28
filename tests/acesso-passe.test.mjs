import test from 'node:test';
import assert from 'node:assert/strict';
const mem = new Map(); globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const AC = await import('../js/acesso.js');
test('sem código: Toca Aqui trancado e Uno aberto (plano grátis); código completo: tudo aberto', () => {
  AC.definir(false); assert.equal(AC.trancado('#/jogos/toca'), true); assert.equal(AC.trancado('#/jogos/cartas'), false, 'Uno abre com 2 partidas grátis');
  AC.definir(true); assert.equal(AC.trancado('#/jogos/toca'), false); assert.equal(AC.trancado('#/album'), false); assert.equal(AC.liberado(), true);
});
test('passe de um jogo: libera só o que foi escolhido, o resto continua como visitante, e não conta como código completo', () => {
  localStorage.setItem('beaterista-aluno-escopo', JSON.stringify(['#/jogos/detetive'])); AC.definir(true);
  assert.equal(AC.trancado('#/jogos/detetive'), false); assert.equal(AC.trancado('#/jogos/detetive/qualquer'), false); assert.equal(AC.trancado('#/jogos/detetive?sala=ABCDE'), false);
  assert.equal(AC.trancado('#/jogos/toca'), true, 'outro jogo trancado'); assert.equal(AC.trancado('#/album'), true); assert.equal(AC.trancado('#/ritmo'), false, 'o ritmo abre com 2 fases grátis e trava o resto por dentro');
  assert.equal(AC.liberado(), false, 'passe não libera estrelas/álbum'); assert.equal(AC.comCodigo(), true);
});
test('passe do Modo Aventura vale em qualquer jogo; test drive (sem escopo) libera tudo', () => {
  localStorage.setItem('beaterista-aluno-escopo', JSON.stringify(['/aventura'])); AC.definir(true);
  assert.equal(AC.trancado('#/jogos/bingo/aventura'), false); assert.equal(AC.trancado('#/jogos/toca'), true);
  localStorage.removeItem('beaterista-aluno-escopo'); assert.equal(AC.trancado('#/album'), false); assert.equal(AC.liberado(), true);
});
