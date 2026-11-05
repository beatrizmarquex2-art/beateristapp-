import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { agrupar, elegiveis, contagens, sortearUm, sortearPares, montarCartas, NIVEIS, FILTROS } from '../js/jogos/artistas-logic.js';
import { ENTIDADES } from '../js/jogos/cara-musical/elenco.js';
const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8'));
const { artistas, faltando } = agrupar(ENTIDADES, cat);
const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
const lcg = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

test('1 artista = 1 entrada: ids únicos, sem foto fantasma, fotos todas do catálogo', () => {
  assert.equal(new Set(artistas.map((a) => a.id)).size, artistas.length);
  assert.deepEqual(faltando, []);
  const codes = new Set(cat.map((c) => c.codigo));
  for (const a of artistas) { assert.ok(a.fotos.every((f) => codes.has(f))); assert.equal(a.fotoPrincipal, a.fotos[0]); }
  const beatles = artistas.find((a) => a.id === 'the-beatles'); assert.ok(beatles.fotos.length > 5);
  assert.equal(artistas.filter((a) => a.id === 'the-beatles').length, 1);
});
test('filtros usam só dados verificados e contam certo', () => {
  const c = contagens(artistas); assert.equal(c.tudo, artistas.length);
  assert.ok(c.beatles >= 1 && c.beaterista >= 1);
  assert.ok(elegiveis(artistas, 'solo').every((a) => a.tipo === 'solo'));
  assert.ok(elegiveis(artistas, 'banda').every((a) => a.tipo === 'banda'));
  assert.equal(FILTROS.length, 9);
});
test('roleta: a chance é por artista, não por foto (Beatles tem muitas fotos e sai ~1/N)', () => {
  const rng = lcg(7); const N = 20000; let b = 0;
  for (let i = 0; i < N; i++) if (sortearUm(artistas, { evitar: false, rng }).artista.id === 'the-beatles') b++;
  const esperado = N / artistas.length; assert.ok(Math.abs(b - esperado) < esperado * 0.5, `${b} vs ${esperado}`);
});
test('roleta: evita os recentes e reduz a janela quando o filtro é pequeno', () => {
  const rec = artistas.slice(0, 5).map((a) => a.id); const rng = lcg(3);
  for (let i = 0; i < 200; i++) assert.ok(!rec.includes(sortearUm(artistas, { recentes: rec, rng }).artista.id));
  const dois = artistas.slice(0, 2); const r = sortearUm(dois, { recentes: [dois[0].id, dois[1].id], rng });
  assert.ok(r.artista && r.artista.id === dois[1].id && r.janela === 1 && r.esgotou);
  assert.equal(sortearUm([], {}).artista, null);
});
test('memória: n artistas distintos, nunca repete entidade, null se faltar', () => {
  for (const [, , n] of NIVEIS) { const p = sortearPares(artistas, n, { rng: lcg(n) }); assert.equal(p.length, n); assert.equal(new Set(p.map((a) => a.id)).size, n); }
  assert.equal(sortearPares(artistas.slice(0, 3), 4), null);
});
test('memória: partidas seguidas evitam o mesmo subconjunto', () => {
  const a = sortearPares(artistas, 6, { rng: lcg(1) }); const b = sortearPares(artistas, 6, { evitar: a.map((x) => x.id), rng: lcg(2) });
  assert.ok(b.every((x) => !a.some((y) => y.id === x.id)));
});
test('cartas: 2 por artista, par certo, "fotos diferentes" só com 2+ fotos', () => {
  const p = ['the-beatles', 'nirvana', 'linkin-park'].map((id) => artistas.find((a) => a.id === id));
  const padrao = montarCartas(p, { rng: lcg(5) }); assert.equal(padrao.length, 6);
  for (const c of padrao) assert.equal(c.foto, c.artista.fotoPrincipal);
  const dif = montarCartas(p, { diferentes: true, rng: lcg(5) });
  for (let i = 0; i < 3; i++) { const par = dif.filter((c) => c.par === i); assert.equal(par.length, 2); assert.equal(par[0].artista.id, par[1].artista.id); }
  const nir = dif.filter((c) => c.artista.id === 'nirvana'); assert.equal(nir[0].foto, nir[1].foto);
  const lk = dif.filter((c) => c.artista.id === 'linkin-park'); assert.notEqual(lk[0].foto, lk[1].foto);
  assert.equal(new Set(dif.map((c) => c.uid)).size, 6);
});
