// Partitura de melodia (teclas e cordas): gravação → grade → compassos → pauta, e as correções.
import test from 'node:test'; import assert from 'node:assert/strict';
import * as P from '../js/partitura-melodica.js';

test('posição na pauta: mi4 = 1ª linha, sol4 = 2ª linha, dó central = linha suplementar (clave de sol); sol2 = 1ª linha (fá)', () => {
  assert.equal(P.posNaPauta(64, 'sol'), 0); assert.equal(P.posNaPauta(67, 'sol'), 2); assert.equal(P.posNaPauta(60, 'sol'), -2);
  assert.equal(P.posNaPauta(43, 'fa'), 0); assert.equal(P.posNaPauta(60, 'fa'), 10);
});
test('tecla preta usa a mesma linha da branca de baixo (sustenido) e nomeCurto marca ♯', () => {
  assert.equal(P.posNaPauta(61, 'sol'), P.posNaPauta(60, 'sol')); assert.equal(P.nomeCurto(61), 'dó♯'); assert.equal(P.nomeCurto(62), 'ré');
});
test('clave automática: graves = fá, médias e agudas = sol, vazio = sol', () => {
  assert.equal(P.claveAuto([{ m: 45 }, { m: 48 }, { m: 50 }]), 'fa'); assert.equal(P.claveAuto([{ m: 64 }, { m: 67 }]), 'sol'); assert.equal(P.claveAuto([]), 'sol');
});
test('quantizar: 120 bpm, grade de colcheia → semínimas certinhas e duração arredondada', () => {
  const take = [{ midi: 60, at: 0.01, len: 0.46 }, { midi: 62, at: 0.52, len: 0.44 }, { midi: 64, at: 0.98, len: 0.5 }];
  const e = P.quantizar(take, { bpm: 120, grade: 2 });
  assert.deepEqual(e.map((x) => [x.m, x.ini, x.d]), [[60, 0, 4], [62, 4, 4], [64, 8, 4]]);
});
test('quantizar: tocar adiantado ou atrasado cai na grade; mais fino com grade de semicolcheia', () => {
  const take = [{ midi: 60, at: 0.0, len: 0.12 }, { midi: 62, at: 0.13, len: 0.12 }];
  const e = P.quantizar(take, { bpm: 120, grade: 1 }); assert.deepEqual(e.map((x) => x.ini), [0, 1]);
  const g = P.quantizar(take, { bpm: 120, grade: 4 }); assert.equal(g.length, 1); assert.ok(g.every((x) => x.ini % 4 === 0)); // duas notas no mesmo tempo: fica uma (voz única)
});
test('voz única: nota por cima da outra é cortada e duas no mesmo instante ficam com a primeira', () => {
  const e = P.normalizar([{ m: 60, ini: 0, d: 8 }, { m: 62, ini: 4, d: 4 }, { m: 64, ini: 4, d: 4 }]);
  assert.deepEqual(e.map((x) => [x.m, x.ini, x.d]), [[60, 0, 4], [62, 4, 4]]);
});
test('dividir: só figuras legais e a soma bate', () => {
  for (let pos = 0; pos < 16; pos++) for (let d = 1; d <= 16 - pos; d++) { const p = P.dividir(pos, d); assert.equal(p.reduce((a, b) => a + b, 0), d, `${pos}+${d}`); for (const v of p) assert.ok([16, 12, 8, 6, 4, 3, 2, 1].includes(v)); }
  assert.deepEqual(P.dividir(0, 5), [4, 1]); assert.deepEqual(P.dividir(0, 16), [16]); assert.deepEqual(P.dividir(0, 8), [8]);
});
test('compassos: nota que passa da barra é dividida e ligada; o buraco vira pausa; o compasso completa', () => {
  const b = P.compassos([{ m: 60, ini: 12, d: 8 }]);
  assert.equal(b.length, 2);
  assert.equal(b[0][0].m, null); assert.equal(b[0][0].d, 12 === b[0][0].d ? 12 : b[0][0].d);
  const n0 = b[0].filter((i) => i.m !== null); const n1 = b[1].filter((i) => i.m !== null);
  assert.ok(n0.length && n0.every((i) => i.lig)); assert.ok(n1.length);
  for (const bar of b) assert.equal(bar.reduce((s, i) => s + i.d, 0), 16);
});
test('pauta: uma nota por evento, SVG válido e clave certa', () => {
  const e = P.normalizar([{ m: 60, ini: 0, d: 4 }, { m: 62, ini: 4, d: 2 }, { m: 63, ini: 6, d: 2 }, { m: 65, ini: 8, d: 8 }]);
  const r = P.pauta(e, { largura: 360 });
  assert.equal(new Set(r.notas.map((n) => n.ev)).size, 4); assert.equal(r.clave, 'sol'); assert.ok(r.svg.startsWith('<svg') && r.svg.endsWith('</svg>'));
  assert.equal((P.pauta(e, { clave: 'fa' }).clave), 'fa');
  assert.ok(P.pauta(e, { cor: true }).svg.includes('dó'));
});
test('pauta quebra em mais de uma linha quando tem muitos compassos', () => {
  const e = Array.from({ length: 12 }, (_, i) => ({ m: 60 + (i % 5), ini: i * 4, d: 4 }));
  const r = P.pauta(e, { largura: 360 }); assert.equal(r.compassos, 3); const a = P.pauta(Array.from({ length: 40 }, (_, i) => ({ m: 60, ini: i * 4, d: 4 })), { largura: 360 }); assert.ok(a.h > r.h);
});
test('correção: mover, alongar, apagar e trocar a nota', () => {
  let e = P.normalizar([{ m: 60, ini: 0, d: 4 }, { m: 62, ini: 4, d: 4 }]);
  e = P.mover(e, 1, 2); assert.equal(e[1].ini, 6); e = P.mover(e, 1, -6); assert.equal(e.length, 2); assert.equal(e[1].ini, 6); // cair em cima de outra nota: não faz nada
  e = P.normalizar([{ m: 60, ini: 0, d: 4 }, { m: 62, ini: 4, d: 4 }]); e = P.alongar(e, 0, 4); assert.equal(e[0].d, 4); // não passa por cima do vizinho
  e = P.alongar(e, 1, 4); assert.equal(e[1].d, 8); e = P.remover(e, 0); assert.equal(e.length, 1); e = P.subir(e, 0, 1); assert.equal(e[0].m, 63);
});
test('anexar: entrada por clique põe a nota logo depois da última', () => {
  let e = []; e = P.anexar(e, 60, 4); e = P.anexar(e, 62, 2); assert.deepEqual(e.map((x) => [x.m, x.ini, x.d]), [[60, 0, 4], [62, 4, 2]]);
});

test('anexarEm: nota depois de uma pausa (cursor à frente da última nota)', () => {
  let e = P.anexar([], 60, 4); e = P.anexarEm(e, 62, 8, 4); assert.deepEqual(e.map((x) => [x.m, x.ini, x.d]), [[60, 0, 4], [62, 8, 4]]);
  const b = P.compassos(e)[0]; assert.deepEqual(b.map((i) => [i.m, i.d]), [[60, 4], [null, 4], [62, 4], [null, 4]]);
});
