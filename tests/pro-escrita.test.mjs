import test from 'node:test'; import assert from 'node:assert/strict';
import * as R from '../js/pro/ritmo.js'; import * as E from '../js/pro/escrita.js';
const V = R.cordasDe('violao', 6); const B4 = R.cordasDe('baixo', 4);
const acorde = [{ c: 0, f: 3, ini: 0, d: 4 }, { c: 1, f: 0, ini: 0, d: 4 }, { c: 2, f: 0, ini: 0, d: 4 }, { c: 3, f: 0, ini: 0, d: 4 }, { c: 4, f: 2, ini: 0, d: 4 }, { c: 5, f: 3, ini: 0, d: 4 }]; // G aberto
test('escrito: uma oitava acima do que soa; clave: sol (violão/guitarra) e fá (baixo)', () => { assert.equal(E.escrito(40), 52); assert.equal(E.claveDe('violao'), 'sol'); assert.equal(E.claveDe('guitarra'), 'sol'); assert.equal(E.claveDe('baixo'), 'fa'); });
test('contagem: 1 e & a 2 …', () => assert.deepEqual([0, 1, 2, 3, 4, 6].map(E.contagem), ['1', 'e', '&', 'a', '2', '&']));
test('pauta comum: acorde de 6 notas vira 6 cabeças selecionáveis e uma haste só', () => {
  const r = E.cordas(acorde, { cordas: V, inst: 'violao', escrita: 'pauta', largura: 420 });
  assert.equal((r.svg.match(/data-ev=/g) || []).length, 6); assert.ok(!/>T</.test(r.svg)); assert.ok(r.n >= 1 && r.h > 80);
});
test('pauta + tablatura: as duas aparecem (T A B e a clave) e a altura é maior que só a pauta', () => {
  const a = E.cordas(acorde, { cordas: V, inst: 'violao', escrita: 'ambas', largura: 420 }); const p = E.cordas(acorde, { cordas: V, inst: 'violao', escrita: 'pauta', largura: 420 });
  assert.match(a.svg, />T</); assert.match(a.svg, />A</); assert.match(a.svg, />B</); assert.ok(a.h > p.h); assert.equal((a.svg.match(/data-ev=/g) || []).length, 12);
});
test('escrita "tab" é a tablatura de sempre', () => assert.equal(E.cordas(acorde, { cordas: V, escrita: 'tab', largura: 420 }).svg, R.tablatura(acorde, { cordas: V, largura: 420 }).svg));
test('baixo na clave de fá desenha e marca as notas', () => { const r = E.cordas([{ c: 3, f: 0, ini: 0, d: 4 }, { c: 2, f: 2, ini: 4, d: 4 }], { cordas: B4, inst: 'baixo', escrita: 'pauta', largura: 380 }); assert.equal((r.svg.match(/data-ev=/g) || []).length, 2); });
test('sustenido aparece quando a nota é preta (casa 1 da corda Si = Dó, sem; casa 2 = Dó♯)', () => {
  const sem = E.cordas([{ c: 1, f: 1, ini: 0, d: 4 }], { cordas: V, escrita: 'pauta', largura: 380 }); const com = E.cordas([{ c: 1, f: 2, ini: 0, d: 4 }], { cordas: V, escrita: 'pauta', largura: 380 });
  assert.ok(com.svg.includes('M-2 -7V7') && !sem.svg.includes('M-2 -7V7'));
});
test('segunda no acorde desloca a cabeça (notas vizinhas não se sobrepõem)', () => {
  const r = E.cordas([{ c: 0, f: 0, ini: 0, d: 4 }, { c: 0, f: 1, ini: 0, d: 4, }].map((e, i) => (i ? { ...e, c: 1, f: 6 } : e)), { cordas: V, escrita: 'pauta', largura: 380 }); // e solta (Mi4) e Si com casa 6 (Fá4): vizinhas
  const xs = [...r.svg.matchAll(/<ellipse cx="([\d.]+)"/g)].map((m) => +m[1]); assert.equal(xs.length, 2); assert.ok(Math.abs(xs[0] - xs[1]) > 9);
});
test('ritmo sem pauta: uma linha, contagem "&", acento e fantasma, e a coluna vira um item', () => {
  const evs = [{ p: 'hh', ini: 0, d: 2, mao: 'D' }, { p: 'bd', ini: 0, d: 2 }, { p: 'sn', ini: 2, d: 2, acc: true, mao: 'E' }, { p: 'sn', ini: 4, d: 2, fan: true }];
  const r = E.ritmo(evs, { largura: 420 }); assert.match(r.svg, />&</); assert.match(r.svg, />DB</); assert.match(r.svg, /\(</); assert.equal((r.svg.match(/data-ev=/g) || []).length, 3);
  assert.ok(!E.ritmo(evs, { largura: 420, mostrarContagem: false }).svg.includes('>&<'));
});
test('ritmo: clicar de novo na mesma coluna passa pro próximo evento dela', () => { const evs = [{ p: 'hh', ini: 0, d: 2 }, { p: 'bd', ini: 0, d: 2 }]; assert.match(E.ritmo(evs, { largura: 380, sel: 0 }).svg, /data-ev="1"/); });
test('ritmo vazio desenha a linha e a fórmula de compasso', () => { const r = E.ritmo([], { largura: 380 }); assert.equal(r.n, 1); assert.ok(r.svg.includes('<line')); });
test('cifra do acorde aparece em cima da tablatura e da pauta', () => {
  const ev = [{ c: 0, f: 0, ini: 0, d: 4, cif: 'Mim' }, { c: 1, f: 0, ini: 0, d: 4 }];
  assert.match(R.tablatura(ev, { cordas: V, largura: 380 }).svg, />Mim</); assert.match(E.cordas(ev, { cordas: V, escrita: 'pauta', largura: 380 }).svg, />Mim</);
});
