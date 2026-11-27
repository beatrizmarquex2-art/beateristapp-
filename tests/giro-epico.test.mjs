// Regra nova do giro épico (nov/2026): UM giro de 1 a 5 figurinhas com uma exclusiva (Beaterista e Paul) sempre garantida.
import test from 'node:test'; import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
import * as L from '../js/figurinhas/album-logic.js';
import { DA_GIRO_EPICO } from '../js/resgate.js';
const cat = [...JSON.parse(readFileSync('assets/figurinhas/catalogo.json', 'utf8')), ...JSON.parse(readFileSync('assets/figurinhas/catalogo-paul.json', 'utf8')), ...JSON.parse(readFileSync('assets/figurinhas/catalogo-bea.json', 'utf8'))];
test('epico único: reconhece o id novo e continua aceitando o antigo', () => {
  assert.equal(L.packKind('epico:abc'), 'epico'); assert.equal(L.epicoPack('epico:abc').unico, true); assert.equal(L.epicoPack('epico:sem3').unico, true);
  assert.equal(L.epicoPack('epico:abc:2').n, 2); assert.equal(L.epicoPack('roleta:x'), null);
});
test('epico único: de 1 a 5 figurinhas, sem repetir, e sempre uma exclusiva', () => {
  const vistos = new Set();
  for (let i = 0; i < 200; i++) {
    const d = L.drawPack(cat, `epico:t${i}`, 3, 's'); vistos.add(d.length);
    assert.ok(d.length >= 1 && d.length <= 5, String(d.length)); assert.equal(new Set(d).size, d.length);
    assert.ok(d.some((c) => L.grupo(cat.find((x) => x.codigo === c)) === 'Beaterista'), `sem exclusiva em ${d}`);
  }
  assert.ok(vistos.has(1) && vistos.has(5), [...vistos].join());
});
test('check-in da semana: UM giro épico (que já traz a exclusiva); wallpaper e 2 folhas de colorir por semana, na ordem', async () => {
  assert.deepEqual(L.semanaPacks(4), ['epico:sem4']);
  const { premioDaSemana, WALLPAPERS, COLORIR_PAGINAS } = await import('../js/premios-config.js');
  assert.equal(COLORIR_PAGINAS.length, 34); const a = premioDaSemana(1), b = premioDaSemana(2);
  assert.equal(a.wallpaper, WALLPAPERS[0]); assert.deepEqual(a.colorir.map((c) => c.arquivo.slice(-20)), [COLORIR_PAGINAS[0], COLORIR_PAGINAS[1]].map((c) => c.arquivo.slice(-20)));
  assert.notEqual(a.wallpaper, b.wallpaper); assert.notEqual(a.colorir[0], b.colorir[0]); assert.equal(premioDaSemana(13).wallpaper, WALLPAPERS[0]);
});
test('abrir o giro épico guarda as figurinhas e não abre de novo', () => {
  let s = L.grantPack(L.emptyState(), 'epico:x1'); const r = L.openPack(s, cat, 'epico:x1'); assert.ok(r.fresh && r.codes.length >= 1); assert.equal(L.openPack(r.state, cat, 'epico:x1').fresh, false);
});
test('quais prints valem giro épico: postar, seguir nas redes e avaliar a escola (amigo continua em estrelas)', () => {
  for (const t of ['google', 'youtube', 'post:desafio', 'post:paulbox']) assert.equal(DA_GIRO_EPICO(t), true, t);
  assert.equal(DA_GIRO_EPICO('amigo'), false); assert.equal(DA_GIRO_EPICO('lendaria'), false);
});
