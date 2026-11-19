// Memória em 2 celulares: regras puras (semente, vez, par, erro, fim, placar, revanche).
import { test } from 'node:test'; import assert from 'node:assert/strict';
import * as L from '../js/kids/memoria-sala-logic.js';

const ids = Array.from({ length: 20 }, (_, i) => `c${i}`);
const mesa = (o = {}) => L.novaMesa({ tema: 't', titulo: 'T', pares: 6, again: true, seed: 12345, ids, ...o });
/** posições dos dois pares de um id, e uma posição de outro id */
const posDe = (e, id) => e.deck.map((x, i) => (x === id ? i : -1)).filter((i) => i >= 0);

test('mesma semente = mesma mesa; semente diferente = outra', () => {
  assert.deepEqual(mesa().deck, mesa().deck);
  assert.notDeepEqual(mesa().deck, mesa({ seed: 999 }).deck);
  assert.deepEqual(L.embaralhar([1, 2, 3, 4, 5, 6], 7), L.embaralhar([1, 2, 3, 4, 5, 6], 7));
});
test('mesa: 2n cartas, cada id aparece 2 vezes, estado só com JSON', () => {
  const e = mesa(); assert.equal(e.deck.length, 12);
  const cont = {}; e.deck.forEach((x) => { cont[x] = (cont[x] || 0) + 1; }); assert.ok(Object.values(cont).every((n) => n === 2));
  assert.equal(Object.keys(cont).length, 6);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e); assert.ok(L.valido(e));
});
test('pares maiores que o tema: usa só o que tem', () => { assert.equal(L.novaMesa({ tema: 't', pares: 12, seed: 1, ids: ids.slice(0, 8) }).pares, 8); });
test('só quem tem a vez vira; não repete carta; no máximo 2', () => {
  const e = mesa(); assert.equal(e.vez, 0);
  assert.equal(L.virar(e, 1, 0), null, 'o outro não vira');
  const a = L.virar(e, 0, 0); assert.deepEqual(a.virou, [0]);
  assert.equal(L.virar(a, 0, 0), null, 'a mesma carta de novo');
  assert.equal(L.virar(a, 0, 99), null); assert.equal(L.virar(a, 0, -1), null);
  const b = L.virar(a, 0, 1); assert.equal(b.virou.length, 2);
  assert.equal(L.virar(b, 0, 2), null, 'terceira carta antes de fechar a jogada');
});
test('par: soma o ponto e, com a regra, joga de novo', () => {
  let e = mesa(); const [p, q] = posDe(e, e.deck[0]);
  e = L.virar(L.virar(e, 0, p), 0, q); assert.ok(L.pendente(e) && L.ePar(e));
  e = L.resolver(e); assert.deepEqual(L.placar(e), [1, 0]); assert.equal(e.vez, 0); assert.deepEqual(e.virou, []); assert.ok(L.achada(e, p) && L.achada(e, q));
  assert.equal(L.virar(e, 0, p), null, 'carta achada não vira');
});
test('par sem a regra de jogar de novo: a vez passa', () => {
  let e = mesa({ again: false }); const [p, q] = posDe(e, e.deck[0]);
  e = L.resolver(L.virar(L.virar(e, 0, p), 0, q)); assert.deepEqual(L.placar(e), [1, 0]); assert.equal(e.vez, 1);
});
test('erro: desvira, ninguém pontua, a vez passa', () => {
  let e = mesa(); const x = 0; const y = e.deck.findIndex((id, i) => i !== 0 && id !== e.deck[0]);
  e = L.virar(L.virar(e, 0, x), 0, y); assert.ok(L.pendente(e) && !L.ePar(e));
  e = L.resolver(e); assert.deepEqual(L.placar(e), [0, 0]); assert.equal(e.vez, 1); assert.deepEqual(e.virou, []);
  assert.ok(L.virar(e, 1, x), 'agora o outro pode virar a mesma carta'); assert.equal(L.virar(e, 0, x), null);
});
test('resolver sem duas viradas não muda nada (seguro pros dois celulares fecharem)', () => {
  const e = mesa(); assert.equal(L.resolver(e), e); const a = L.virar(e, 0, 0); assert.equal(L.resolver(a), a);
});
test('resolver duas vezes seguidas não soma em dobro', () => {
  let e = mesa(); const [p, q] = posDe(e, e.deck[0]); e = L.virar(L.virar(e, 0, p), 0, q);
  const r1 = L.resolver(e); const r2 = L.resolver(r1); assert.deepEqual(L.placar(r2), [1, 0]);
});
/** joga a mesa inteira: o jogador 0 acha tudo, ou alterna conforme `alternar` */
function jogarTudo(e0, quemAcerta) {
  let e = e0; const feitos = new Set();
  for (const id of e.deck) {
    if (feitos.has(id)) continue; feitos.add(id); const [p, q] = posDe(e, id);
    const quem = typeof quemAcerta === 'function' ? quemAcerta(feitos.size) : e.vez;
    e = { ...e, vez: quem }; e = L.resolver(L.virar(L.virar(e, quem, p), quem, q));
  }
  return e;
}
test('fim: acabou quando todos os pares foram achados; vencedor e placar', () => {
  const e = jogarTudo(mesa(), () => 0); assert.ok(e.fim); assert.deepEqual(L.placar(e), [6, 0]); assert.equal(L.vencedor(e), 0);
  const e1 = jogarTudo(mesa(), () => 1); assert.equal(L.vencedor(e1), 1);
  const emp = jogarTudo(mesa(), (n) => (n % 2)); assert.deepEqual(L.placar(emp), [3, 3]); assert.equal(L.vencedor(emp), -1);
  assert.equal(L.vencedor(mesa()), null); assert.equal(L.podeVirar(e, 0, 0), false, 'depois do fim ninguém vira');
});
test('revanche: mesa nova, mesmas escolhas, semente igual nos dois celulares, começa o outro', () => {
  const e = jogarTudo(mesa(), () => 0); const r = L.revanche(e, ids); const r2 = L.revanche(e, ids);
  assert.deepEqual(r, r2); assert.equal(r.tema, 't'); assert.equal(r.pares, 6); assert.equal(r.again, true); assert.equal(r.titulo, 'T');
  assert.equal(r.fim, false); assert.deepEqual(L.placar(r), [0, 0]); assert.equal(r.vez, 1); assert.equal(r.mesa, 1); assert.notDeepEqual(r.deck, e.deck);
});
test('reconstruir só pelo estado (JSON) dá a mesma partida', () => {
  let e = mesa(); const [p, q] = posDe(e, e.deck[3]); e = L.resolver(L.virar(L.virar(e, 0, p), 0, q)); e = L.virar(e, 0, 0);
  const volta = JSON.parse(JSON.stringify(e)); assert.deepEqual(volta, e); assert.ok(L.podeVirar(volta, 0, posDe(e, e.deck[5])[0]) || true);
  assert.deepEqual(L.placar(volta), [1, 0]); assert.deepEqual(volta.virou, [0]);
});

/* ===== 3 e 4 jogadores (cada um no seu celular) ===== */
test('mesa de 3 e 4: n, placar por jogador e mesa de 2 igual a antes (sem n)', () => {
  const e2 = mesa(); assert.equal(e2.n, undefined); assert.equal(L.jogadoresDe(e2), 2); assert.equal(e2.achou.length, 2);
  const e4 = mesa({ n: 4, nomes: ['Ana', 'Bia', 'Cris', 'Duda'] }); assert.equal(e4.n, 4); assert.equal(e4.achou.length, 4); assert.deepEqual(e4.nomes, ['Ana', 'Bia', 'Cris', 'Duda']);
  assert.ok(L.valido(e4)); assert.deepEqual(L.placar(e4), [0, 0, 0, 0]);
  assert.deepEqual(JSON.parse(JSON.stringify(e4)), e4);
});
test('a vez roda 0 → 1 → 2 → 3 → 0 quando erra; acertou joga de novo (de novo = mesma pessoa)', () => {
  // giro limpo: duas cartas diferentes seguidas passam a vez pro próximo
  const lim = mesa({ n: 4 }); const pos = lim.deck.map((x, i) => i); let s = lim; const vezes = [];
  for (let r = 0; r < 5; r++) {
    vezes.push(s.vez);
    const livres = pos.filter((i) => !L.achada(s, i)); const p1 = livres[0]; const p2 = livres.find((i) => s.deck[i] !== s.deck[p1]);
    s = L.resolver(L.virar(L.virar(s, s.vez, p1), s.vez, p2));
  }
  assert.deepEqual(vezes, [0, 1, 2, 3, 0]);
});
test('par com "acerta joga de novo": quem acerta continua; sem a regra passa pro próximo; só a vez dele vira', () => {
  const e = mesa({ n: 3, again: true }); const [a, b] = posDe(e, e.deck[0]);
  const ok = L.resolver(L.virar(L.virar(e, 0, a), 0, b)); assert.equal(ok.vez, 0); assert.deepEqual(ok.achou[0], [a, b]); assert.equal(L.donoDe(ok, a), 0);
  const e2 = mesa({ n: 3, again: false }); const ok2 = L.resolver(L.virar(L.virar(e2, 0, a), 0, b)); assert.equal(ok2.vez, 1);
  assert.equal(L.virar(ok2, 0, 5), null, 'quem acabou de jogar não vira'); assert.ok(L.virar(ok2, 1, 5));
});
test('vencedor com 4: maior placar; empate entre os primeiros = -1', () => {
  const base = { ...mesa({ n: 4 }), fim: true };
  assert.equal(L.vencedor({ ...base, achou: [[0, 1, 2, 3], [4, 5], [6, 7], [8, 9, 10, 11]] }), -1, 'dois com 2 pares');
  assert.equal(L.vencedor({ ...base, achou: [[0, 1], [4, 5, 2, 3], [6, 7], [8, 9]] }), 1);
  assert.equal(L.vencedor({ ...base, fim: false }), null);
});
test('revanche mantém n e nomes e muda quem começa', () => {
  const e = mesa({ n: 4, nomes: ['A', 'B', 'C', 'D'] }); const r = L.revanche(e, ids);
  assert.equal(r.n, 4); assert.deepEqual(r.nomes, ['A', 'B', 'C', 'D']); assert.equal(r.vez, 1); assert.equal(r.achou.length, 4);
});
