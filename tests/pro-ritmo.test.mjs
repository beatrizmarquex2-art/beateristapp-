import test from 'node:test'; import assert from 'node:assert/strict';
import * as R from '../js/pro/ritmo.js';
const V = R.cordasDe('violao', 6);
test('cordas: violão 6, guitarra 7 e 8, baixo 4/5/6', () => { assert.equal(R.cordasDe('violao', 6).length, 6); assert.equal(R.cordasDe('guitarra', 8).length, 8); assert.equal(R.cordasDe('baixo', 5).length, 5); assert.equal(R.cordasDe('baixo', 6).length, 6); assert.equal(R.cordasDe('baixo', 9).length, 4); });
test('midiDe: casa 3 da corda Lá do violão é Dó (48)', () => assert.equal(R.midiDe(V, 4, 3), 48));
test('posicaoDe: Mi 64 é a corda e solta; Lá 45 é a corda A solta', () => { assert.deepEqual(R.posicaoDe(V, 64), { c: 0, f: 0 }); assert.deepEqual(R.posicaoDe(V, 45), { c: 4, f: 0 }); assert.equal(R.posicaoDe(V, 20), null); });
test('poe: duas cordas no mesmo instante formam acorde; a mesma corda substitui', () => {
  let l = R.poe([], { c: 0, f: 0, ini: 0, d: 4 }).evs; l = R.poe(l, { c: 1, f: 1, ini: 0, d: 4 }).evs; assert.equal(l.length, 2);
  l = R.poe(l, { c: 0, f: 5, ini: 0, d: 4 }).evs; assert.equal(l.length, 2); assert.equal(l.find((e) => e.c === 0).f, 5);
});
test('muda: não deixa duas notas da mesma corda no mesmo instante', () => {
  const l = [{ c: 0, f: 0, ini: 0, d: 4 }, { c: 0, f: 2, ini: 4, d: 4 }]; assert.equal(R.muda(l, 1, { ini: 0 }), l); assert.equal(R.muda(l, 1, { ini: 8 })[1].ini, 8);
});
test('muda: casa e duração ficam nos limites', () => { const l = [{ c: 0, f: 3, ini: 0, d: 4 }]; assert.equal(R.muda(l, 0, { f: 99 })[0].f, R.MAX_CASA); assert.equal(R.muda(l, 0, { d: 99 })[0].d, 16); assert.equal(R.muda(l, 0, { d: 0 })[0].d, 1); });
test('grupos: junta por instante e usa a menor duração', () => { const g = R.grupos([{ ini: 0, d: 4 }, { ini: 0, d: 2 }, { ini: 4, d: 4 }]); assert.equal(g.length, 2); assert.equal(g[0].d, 2); assert.equal(g[0].idx.length, 2); });
test('layout: 17 semicolcheias viram 2 compassos', () => { const L = R.layout([{ c: 0, f: 0, ini: 0, d: 1 }, { c: 0, f: 0, ini: 16, d: 1 }], { largura: 700 }); assert.equal(L.sistemas.flat().length, 2); });
test('layout: lacunas viram pausas', () => { const L = R.layout([{ c: 0, f: 0, ini: 4, d: 4 }], { largura: 700 }); assert.ok(L.sistemas.flat().flatMap((b) => b.itens).some((i) => i.rest)); });
test('tablatura desenha as casas e marca cada nota para seleção', () => {
  const evs = [{ c: 0, f: 3, ini: 0, d: 4 }, { c: 1, f: 12, ini: 0, d: 4 }]; const r = R.tablatura(evs, { cordas: V, largura: 380 });
  assert.match(r.svg, />3</); assert.match(r.svg, />12</); assert.equal((r.svg.match(/data-ev=/g) || []).length, 2); assert.ok(r.n >= 1);
  assert.equal((R.tablatura([], { cordas: V }).svg.match(/<line/g) || []).length > 5, true);
});
test('tablatura de baixo de 5 cordas tem 5 linhas por sistema', () => { const r = R.tablatura([], { cordas: R.cordasDe('baixo', 5), largura: 380 }); assert.equal((r.svg.match(/stroke-width="1.1"/g) || []).length, 5); });
test('tablatura de 8 cordas é mais alta que a de 6', () => assert.ok(R.tablatura([], { cordas: R.cordasDe('guitarra', 8) }).h > R.tablatura([], { cordas: V }).h));
test('bateria: acento, fantasma e mãos aparecem no desenho', () => {
  const evs = [{ p: 'hh', ini: 0, d: 2, mao: 'D' }, { p: 'sn', ini: 4, d: 2, mao: 'E', acc: true }, { p: 'sn', ini: 6, d: 2, fan: true }, { p: 'bd', ini: 0, d: 2 }];
  const r = R.bateria(evs, { largura: 420 }); assert.match(r.svg, />DB</); assert.match(r.svg, />E</); assert.match(r.svg, /\(</); assert.equal((r.svg.match(/data-ev=/g) || []).length, 4);
});
test('bateria: kits têm 3, 6 e 9 peças e todas existem', () => { assert.deepEqual(R.KITS.map((k) => k[2].length), [3, 6, 9]); for (const k of R.KITS) for (const p of k[2]) assert.ok(R.PECAS[p]); });
test('normaliza descarta lixo', () => assert.equal(R.normaliza([null, { ini: 'x', d: 1 }, { ini: 0, d: 1 }]).length, 1));

test('remapeia: baixo 5 → 6 cordas (entra o Dó em cima) mantém cada nota na mesma corda', () => {
  const b5 = R.cordasDe('baixo', 5); const b6 = R.cordasDe('baixo', 6); const evs = [{ c: 0, f: 2, ini: 0, d: 4 }, { c: 4, f: 0, ini: 4, d: 4 }]; // sol (G) e si (B)
  const r = R.remapeia(evs, b5, b6); assert.equal(b6[r[0].c][0], 'G'); assert.equal(b6[r[1].c][0], 'B'); assert.equal(r.length, 2);
});
test('remapeia: sem corda equivalente a nota sai', () => assert.equal(R.remapeia([{ c: 4, f: 0, ini: 0, d: 4 }], R.cordasDe('baixo', 5), R.cordasDe('baixo', 4)).length, 0));
