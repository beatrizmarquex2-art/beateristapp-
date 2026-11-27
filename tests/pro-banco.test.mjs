import test from 'node:test'; import assert from 'node:assert/strict';
import { exerciciosIniciais } from '../js/pro/banco-seed.js'; import * as R from '../js/pro/ritmo.js'; import * as E from '../js/pro/escrita.js'; import * as P from '../js/partitura-melodica.js'; import * as D from '../js/pro/dados.js';
const L = exerciciosIniciais();
test('16 exercícios iniciais, títulos únicos, cobrindo todos os instrumentos', () => { assert.equal(L.length, 16); assert.equal(new Set(L.map((e) => e.titulo)).size, 16); for (const i of ['bateria', 'violao', 'baixo', 'teclas', 'geral']) assert.ok(L.some((e) => e.instrumento === i), i); });
test('campos válidos pro banco (instrumento, nível, tamanhos, bpm)', () => { for (const e of L) { assert.ok(D.INSTRUMENTOS_BANCO.some((x) => x[0] === e.instrumento)); assert.ok(D.NIVEIS.some((x) => x[0] === e.nivel)); assert.ok(e.titulo.length <= 100 && e.descricao.length <= 4000 && e.categoria.length <= 60); if (e.bpm != null) assert.ok(e.bpm >= 30 && e.bpm <= 260); assert.ok(JSON.stringify(e.dados).length < 200000); } });
test('bateria: peças existem, sem duas batidas iguais no mesmo instante, desenha em todas as escritas', () => {
  for (const e of L.filter((x) => x.instrumento === 'bateria')) { const evs = e.dados.evs; assert.ok(evs.length > 0); const ch = new Set(); for (const v of evs) { assert.ok(R.PECAS[v.p], v.p); assert.ok(v.ini >= 0 && v.d >= 1); const k = `${v.p}${v.ini}`; assert.ok(!ch.has(k), `repetido ${e.titulo} ${k}`); ch.add(k); }
    for (const esc of ['pauta', 'ritmo']) assert.ok(E.bateriaEscrita(R.normaliza(evs), { escrita: esc, largura: 420 }).svg.length > 200); }
});
test('cordas: cordas e casas dentro do instrumento, uma nota por corda e instante, desenha em todas as escritas', () => {
  for (const e of L.filter((x) => ['violao', 'guitarra', 'baixo'].includes(x.instrumento))) { const cs = R.cordasDe(e.instrumento, e.dados.ncord); const ch = new Set(); for (const v of e.dados.evs) { assert.ok(v.c >= 0 && v.c < cs.length, `${e.titulo} corda ${v.c}`); assert.ok(v.f >= 0 && v.f <= R.MAX_CASA); const k = `${v.c}:${v.ini}`; assert.ok(!ch.has(k), `repetido ${e.titulo} ${k}`); ch.add(k); }
    for (const esc of ['tab', 'pauta', 'ambas', 'faixa', 'mapa', 'ritmo']) assert.ok(E.cordas(R.normaliza(e.dados.evs), { cordas: cs, inst: e.instrumento, escrita: esc, largura: 420 }).svg.length > 200, `${e.titulo} ${esc}`); }
});
test('teclado: notas no piano e em sequência sem sobreposição; desenha as 3 escritas', () => {
  for (const e of L.filter((x) => x.instrumento === 'teclas')) { const evs = P.normalizar(e.dados.evs); assert.equal(evs.length, e.dados.evs.length, `${e.titulo}: normalizar descartou notas`); for (const v of evs) assert.ok(v.m >= 21 && v.m <= 108);
    for (const esc of ['pauta', 'faixa', 'quadros']) assert.ok(E.tecladoEscrita(evs, { escrita: esc, clave: 'sol', largura: 420 }).svg.length > 200); }
});
test('batida pop do exercício de violão tem as setas ↓ ↑ e a cifra', () => { const e = L.find((x) => /batida pop/.test(x.titulo)); assert.ok(e.dados.evs.some((v) => v.dir === 'c')); assert.ok(e.dados.evs.some((v) => v.cif === 'Dó')); });
test('exercícios "gerais" não têm partitura (só texto)', () => { for (const e of L.filter((x) => x.instrumento === 'geral')) assert.deepEqual(e.dados, {}); });
test('porCategoria agrupa na ordem e NOME_INSTRUMENTO cobre tudo', () => { const g = D.porCategoria(L); assert.ok(g.length >= 6); assert.equal(g.reduce((n, x) => n + x.itens.length, 0), 16); for (const [v] of D.INSTRUMENTOS_BANCO) assert.ok(D.NOME_INSTRUMENTO[v]); });
