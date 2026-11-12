// Cara a Cara Musical: perguntas novas (cantor, ativo, grande, anos 80/90, foto: pessoas e instrumento) e contestar resposta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENTIDADES, FOTOS } from '../js/jogos/cara-musical/elenco.js';
import { PERGUNTAS, BY_Q } from '../js/jogos/cara-musical/perguntas.js';
import * as R from '../js/jogos/cara-musical/regras.js';
import * as C from '../js/jogos/cara-musical/contestar.js';

const tri = (v) => v === true || v === false || v === null;
test('atributos novos são true/false/null em todas as entidades e fotos', () => {
  for (const e of ENTIDADES) for (const k of ['cantor', 'ativo', 'grande', 'anos80_90']) assert.ok(tri(e.attrs[k]), `${e.id}.${k}`);
  for (const c of Object.keys(FOTOS)) for (const k of ['varias', 'instrumento']) assert.ok(tri(FOTOS[c][k]), `${c}.${k}`);
  assert.equal(Object.keys(FOTOS).length, 125);
});
test('cada pergunta nova separa: existe sim e existe não', () => {
  for (const id of ['cantor', 'ativo', 'grande', 'anos80_90', 'varias', 'instrumento']) {
    const q = BY_Q[id]; const vs = q.de === 'foto' ? Object.values(FOTOS).map((f) => f[q.attr]) : ENTIDADES.map((e) => e.attrs[q.attr]);
    assert.ok(vs.includes(true) && vs.includes(false), id);
  }
});
test('coerência: banda não é cantor nem solo; solo/dupla não é grande; Beatles são grandes e fora de atividade', () => {
  for (const e of ENTIDADES) { if (e.attrs.banda) assert.equal(e.attrs.cantor, false, e.id); if (!e.attrs.banda) assert.equal(e.attrs.grande, false, e.id); }
  const b = ENTIDADES.find((e) => e.id === 'the-beatles'); assert.equal(b.attrs.grande, true); assert.equal(b.attrs.ativo, false);
  const q = ENTIDADES.find((e) => e.id === 'queen'); assert.equal(q.attrs.ativo, true);
});
test('a pergunta anos80_90 só tem resposta quando as duas de data têm', () => {
  for (const e of ENTIDADES) { const a = e.attrs; if (a.antes1980 === null || a.depois2000 === null) assert.equal(a.anos80_90, null, e.id); else assert.equal(a.anos80_90, !a.antes1980 && !a.depois2000, e.id); }
});
test('mesas continuam com solução e as perguntas novas aparecem em mesas reais', () => {
  let viuNova = 0; let viuFoto = 0;
  for (let i = 0; i < 120; i++) for (const modo of ['kids', 'classico']) {
    const mesa = R.novaMesa({ modo, tamanho: modo === 'kids' ? 6 : 12 }); assert.ok(R.mesaTemSolucao(mesa.cartas, modo));
    const ids = R.perguntasDaMesa(mesa.cartas, modo).map((q) => q.id);
    if (ids.some((x) => ['cantor', 'ativo', 'grande', 'anos80_90'].includes(x))) viuNova++; if (ids.some((x) => ['varias', 'instrumento'].includes(x))) viuFoto++;
  }
  assert.ok(viuNova > 72, `perguntas novas de artista em poucas mesas (${viuNova}/240)`); assert.ok(viuFoto > 72, `perguntas de foto em poucas mesas (${viuFoto}/240)`);
});
test('contestar: anota, tira a pergunta daquela carta e dá pra copiar e limpar', () => {
  C.limpar();
  const carta = { id: 'queen', foto: ENTIDADES.find((e) => e.id === 'queen').fotos[0] }; const q = BY_Q.baterista;
  const antes = R.respostaDe(q, carta); assert.notEqual(antes, null);
  C.registrar({ q, carta, nomeCarta: 'Queen', texto: q.classico, resposta: antes, parecer: 'errado', nota: 'acho que o Roger toca bateria' });
  assert.equal(R.respostaDe(q, carta), null, 'em dúvida não vira resposta');
  assert.equal(C.listar().length, 1); assert.match(C.textoParaCopiar(), /Queen.*acho que está errado.*Roger/);
  assert.ok(!R.perguntasDaMesa([carta], 'classico').some((x) => x.id === 'baterista'));
  C.limpar(); assert.equal(R.respostaDe(q, carta), antes); assert.equal(C.listar().length, 0);
});
test('contestar a foto só tira a pergunta daquela foto', () => {
  C.limpar(); const e = ENTIDADES.find((x) => x.id === 'the-beatles'); const [f1, f2] = e.fotos.filter((f) => FOTOS[f].instrumento !== null);
  const q = BY_Q.instrumento; const a = { id: e.id, foto: f1 }; const b = { id: e.id, foto: f2 };
  C.registrar({ q, carta: a, nomeCarta: 'The Beatles', texto: q.classico, resposta: FOTOS[f1].instrumento, parecer: 'duvida' });
  assert.equal(R.respostaDe(q, a), null); assert.equal(R.respostaDe(q, b), FOTOS[f2].instrumento); C.limpar();
});
