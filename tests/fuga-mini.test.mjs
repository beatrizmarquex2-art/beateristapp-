import test from 'node:test'; import assert from 'node:assert/strict';
import { bancoQA, rodadasQA, acertaMira, alvoX, montarCfg, estrelasPesca, estrelasMira, estrelasMontar, estrelasPorErros, estrelasGenius, estrelasMemoria, padsDe, sequenciaGenius, confere, caminho3x3, saoVizinhas, PARES, paresMemoria, cartasMemoria, formaPar, AREAS } from '../js/jogos/fuga-mini-logic.js';
import { PECAS_COMPASSO, COMPASSO_Q, rodadaCompasso, descompor, somaQ, confereCompasso, textoQ, estrelasCompasso, rodadaIntruso, REGRAS_INTRUSO, FIGS_INTRUSO } from '../js/jogos/fuga-mini-logic.js';
import { cfgMini } from '../js/jogos/fuga-logic.js';
import { NIVEIS, nivelDaFase, NIVEL_CFG, TIPOS, TIPOS_FASE, PORTAS_FASE, portasDaFase, faseCfg, estrelasPorta, NOME_TIPO, BONUS, FASES } from '../js/jogos/fuga-logic.js';
const rnd = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
test('estrelas pelos erros: 3 / 2 / 1, nunca menos de 1', () => {
  assert.deepEqual([0, 1, 2, 3, 99].map(estrelasGenius), [3, 2, 2, 1, 1]); assert.equal(estrelasPorErros(5, 0, 2), 1);
  assert.deepEqual([0, 2, 3, 8, 9, 40].map((e) => estrelasMemoria(e, 4)), [3, 3, 2, 2, 1, 1]);
});
test('genius: botões por área (sem verde), sequência da rodada e conferência', () => {
  assert.equal(padsDe('notas', 4).length, 4); assert.equal(padsDe('bateria', 6).length, 6); assert.ok(padsDe('bateria', 4).every((p) => p.som)); assert.ok(padsDe('notas', 6).every((p) => p.midi));
  for (const a of ['notas', 'bateria']) for (const p of padsDe(a, 6)) assert.ok(!/^#(3c|2e|4c|00)ff/i.test(p.cor) && !/^#[0-9a-f]{2}[c-f][0-9a-f]4[0-9a-f]$/i.test(p.cor), p.cor);
  const s = sequenciaGenius(8, 4, rnd()); assert.equal(s.length, 8); assert.ok(s.every((v) => v >= 0 && v < 4)); for (let i = 2; i < s.length; i++) assert.ok(!(s[i] === s[i - 1] && s[i] === s[i - 2]));
  assert.equal(confere([1, 2, 3], 0, 1), 'ok'); assert.equal(confere([1, 2, 3], 1, 0), 'erro'); assert.equal(confere([1, 2, 3], 2, 3), 'fim');
});
test('caminho 3×3: só anda pra casa do lado, sem repetir, no tamanho pedido', () => {
  for (const len of [2, 4, 5, 7, 9]) for (let t = 0; t < 30; t++) {
    const c = caminho3x3(len, rnd(t + 1)); assert.equal(c.length, len); assert.equal(new Set(c).size, len); assert.ok(c.every((x) => x >= 0 && x < 9));
    for (let i = 1; i < c.length; i++) assert.ok(saoVizinhas(c[i - 1], c[i]), `${c[i - 1]}->${c[i]}`);
  }
  assert.ok(saoVizinhas(0, 1) && saoVizinhas(0, 3) && !saoVizinhas(0, 4) && !saoVizinhas(2, 3));
});
test('memória: pares de 3 áreas, textos únicos, cartas embaralhadas e conferência', () => {
  const todos = AREAS.flatMap((a) => PARES[a]); assert.deepEqual(AREAS, ['ritmo', 'teoria', 'cordas']);
  const textos = todos.flatMap((p) => [p.sym ? `sym:${p.sym}` : p.a, p.b]); assert.equal(new Set(textos).size, textos.length, 'textos repetidos');
  for (const n of [4, 6, 8]) { const p = paresMemoria(n, rnd(3)); assert.equal(p.length, n); assert.deepEqual([...new Set(p.map((x) => x.area))].sort(), [...AREAS].sort()); }
  const p = paresMemoria(4, rnd(5)); const c = cartasMemoria(p, rnd(9)); assert.equal(c.length, 8); assert.equal(new Set(c.map((x) => x.id)).size, 8);
  const a = c.find((x) => x.par === 0 && x.lado === 'A'); const b = c.find((x) => x.par === 0 && x.lado === 'B'); const o = c.find((x) => x.par === 1 && x.lado === 'B');
  assert.equal(formaPar(a, b), true); assert.equal(formaPar(a, o), false); assert.equal(formaPar(a, a), false); assert.equal(formaPar(a, null), false);
});
test('níveis: fases 1-4 fácil, 5-8 médio, 9-12 difícil; mundos 2 e 3 sobem 1; desafios no mínimo médio; porta B difícil', () => {
  assert.deepEqual(NIVEIS, ['facil', 'medio', 'dificil']);
  assert.deepEqual([1, 4, 5, 8, 9, 12].map((n) => nivelDaFase(n, 0)), ['facil', 'facil', 'medio', 'medio', 'dificil', 'dificil']);
  assert.deepEqual([1, 5, 9].map((n) => nivelDaFase(n, 1)), ['medio', 'dificil', 'dificil']); assert.equal(nivelDaFase(6, 0), 'medio'); assert.equal(nivelDaFase(7, 0), 'medio'); assert.equal(BONUS.nivel, 'dificil');
  assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].palavras), [4, 6, 8]); assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].cruz), [4, 5, 6]);
  assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].genius.rodadas), [4, 6, 8]); assert.deepEqual(NIVEIS.map((n) => NIVEL_CFG[n].memoria.pares), [4, 6, 8]);
  assert.equal(faseCfg(0, 1).nivel, 'facil'); assert.equal(faseCfg(0, 12).palavras, 8); assert.equal(faseCfg(2, 1).palavras, 6);
});
test('desenho das portas: tipos por fase batem com PORTAS_FASE, tipos conhecidos, nada de quiz repetido nas fases de 4 portas', () => {
  assert.equal(TIPOS_FASE.length, FASES); TIPOS_FASE.forEach((t, i) => { assert.equal(t.length, PORTAS_FASE[i]); t.forEach((x) => assert.ok(TIPOS.includes(x) && NOME_TIPO[x], x)); });
  assert.deepEqual([11, 12].map((n) => new Set(TIPOS_FASE[n - 1]).size), [4, 4]);
  const todos = TIPOS_FASE.flat(); assert.equal(todos.length, 32); for (const t of TIPOS.filter((x) => !['pesca', 'mira'].includes(x))) assert.ok(todos.includes(t), `falta ${t}`); // pesca e mira só aparecem nas trilhas de teoria e cordas (SUBST)
  const por = (t) => todos.filter((x) => x === t).length; assert.ok(por('quiz') >= 6 && por('caca') >= 6 && por('cruz') >= 5, 'quiz, caça e cruzadinha continuam sendo os principais');
  assert.deepEqual(portasDaFase(0, 1).map((p) => p.tipo), ['quiz', 'memoria']); assert.deepEqual(portasDaFase(0, 8).map((p) => p.tipo), ['intruso', 'quiz', 'caca']);
  assert.ok(portasDaFase(0, 3).every((p) => p.nivel === 'facil') && portasDaFase(0, 10).every((p) => p.nivel === 'dificil'));
  assert.ok(portasDaFase(0, 3).filter((p) => p.tipo === 'genius').every((p) => ['notas', 'bateria'].includes(p.area)));
});
test('estrelas da porta: jogos de toque usam as estrelas calculadas pelos erros', () => {
  assert.deepEqual([3, 2, 1].map((e) => estrelasPorta('genius', { estrelas: e })), [3, 2, 1]); assert.equal(estrelasPorta('memoria', { estrelas: 0 }), 3); assert.equal(estrelasPorta('caminho', { estrelas: 9 }), 3);
});

test('lote 2: estrelas da pesca, da mira e do montar (0-1 erro = 3 ★, até 3 = 2 ★, mais = 1 ★)', () => {
  for (const f of [estrelasPesca, estrelasMira, estrelasMontar]) assert.deepEqual([0, 1, 2, 3, 4, 40].map(f), [3, 3, 2, 2, 1, 1]);
});
test('pesca/mira: perguntas sem repetir, resposta certa entre as opções, erradas da mesma área, mistura as 3 áreas', () => {
  const banco = bancoQA(); assert.ok(banco.length >= 25); assert.equal(new Set(banco.map((x) => x.certo)).size, banco.length, 'respostas repetidas no banco');
  for (const [n, k] of [[5, 3], [6, 4], [8, 5]]) {
    const r = rodadasQA(n, k, rnd(n)); assert.equal(r.length, n); assert.equal(new Set(r.map((x) => x.q)).size, n);
    for (const x of r) { assert.equal(x.opcoes.length, k); assert.equal(new Set(x.opcoes).size, k); assert.equal(x.opcoes[x.ok], x.certo); const area = banco.filter((b) => x.opcoes.includes(b.certo)); assert.ok(area.every((b) => b.area === x.area), 'opções de áreas diferentes'); }
    if (n >= 3) assert.deepEqual([...new Set(r.map((x) => x.area))].sort(), [...AREAS].sort());
  }
});
test('mira: a bolinha acerta o alvo na linha (o mais perto), tolera um pouco e erra quando passa longe', () => {
  const O = { x: 150, y: 300 }; const alvos = [{ x: 60, y: 80, r: 20 }, { x: 150, y: 80, r: 20 }, { x: 240, y: 80, r: 20 }];
  assert.equal(acertaMira(O, { x: 150, y: 10 }, alvos), 1); assert.equal(acertaMira(O, { x: 60, y: 80 }, alvos), 0); assert.equal(acertaMira(O, { x: 240, y: 80 }, alvos), 2);
  assert.equal(acertaMira(O, { x: 160, y: 10 }, alvos), 1, 'tolerante: quase no centro'); assert.equal(acertaMira(O, { x: 105, y: 10 }, alvos), -1, 'entre dois alvos');
  assert.equal(acertaMira(O, { x: 150, y: 400 }, alvos), -1, 'pra baixo não acerta'); assert.equal(acertaMira(O, O, alvos), -1);
  const na_frente = [{ x: 150, y: 200, r: 20 }, { x: 150, y: 80, r: 20 }]; assert.equal(acertaMira(O, { x: 150, y: 0 }, na_frente), 0, 'o alvo mais perto leva');
  assert.equal(alvoX(100, 0, 3, 0), 100); assert.ok(alvoX(100, 1, 2.2, 1) !== 100); assert.ok(Math.abs(alvoX(100, 2, 5, 1) - 100) <= 9.01);
});
test('montar: nível pede figuras do Figurix (3, 4 e 4 figuras) e até 4 colchetes quando precisa', () => {
  assert.deepEqual(['facil', 'medio', 'dificil'].map((n) => montarCfg(n).figuras.length), [3, 4, 4]);
  assert.equal(montarCfg('facil').maxC, 2); assert.equal(montarCfg('medio').maxC, 4); assert.equal(montarCfg('dificil').maxC, 4);
  assert.ok(montarCfg('dificil').figuras.includes('semifusa'));
});
test('montar, compasso e intruso nas fases certas; pesca e mira saíram da Fuga e fases 11/12 sem repetir jogo', () => {
  const quais = (t) => TIPOS_FASE.flatMap((f, i) => (f.includes(t) ? [i + 1] : []));
  assert.deepEqual(quais('montar'), [3, 4]); assert.ok(!TIPOS.includes('pesca') && !TIPOS.includes('mira') && !NIVEL_CFG.facil.pesca && !NIVEL_CFG.facil.mira); assert.deepEqual(quais('compasso'), [9, 10]); assert.ok([5, 8, 9, 11].every((n) => quais('intruso').includes(n)));
  for (const t of ['montar', 'compasso', 'intruso']) for (const nv of ['facil', 'medio', 'dificil']) assert.ok(NIVEL_CFG[nv][t], `${t}/${nv}`);
});
test('portas curtas: compasso e intruso têm 3 rodadas no fácil e no médio, 4 no difícil (nunca mais que 5)', () => {
  for (const j of ['compasso', 'intruso']) { assert.deepEqual(['facil', 'medio', 'dificil'].map((n) => NIVEL_CFG[n][j].rodadas), [3, 3, 4]); for (const nv of ['facil', 'medio', 'dificil']) for (const ex of [0, 1, 2, 3]) assert.ok(cfgMini(nv, j, ex).rodadas <= 5, `${j} ${nv} +${ex}`); }
});
test('feche o compasso: sempre dá pra fechar 4 tempos exatos com até 4 peças da bandeja, e passar do compasso é erro', () => {
  for (const nv of ['facil', 'medio', 'dificil']) for (let i = 0; i < 200; i++) {
    const r = rodadaCompasso(nv); assert.equal(somaQ(r.pre) + r.faltamQ, COMPASSO_Q); assert.ok(r.pre.length >= 1 && r.pre.length <= 4); assert.ok(r.pre.every((id) => r.bandeja.includes(id)));
    const s = descompor(r.faltamQ, r.bandeja); assert.ok(s && s.length <= 4 && somaQ(s) === r.faltamQ); assert.equal(confereCompasso(r.faltamQ, s), 'ok');
    assert.equal(confereCompasso(r.faltamQ, [...s, 'seminima']), 'passou'); if (s.length > 1) assert.equal(confereCompasso(r.faltamQ, s.slice(0, -1)), 'cabe');
  }
  assert.ok(Array.from({ length: 80 }, () => rodadaCompasso('facil')).every((r) => [4, 8, 12].includes(r.faltamQ))); assert.ok(Array.from({ length: 200 }, () => rodadaCompasso('dificil')).some((r) => r.faltamQ % 4 !== 0));
  assert.deepEqual([4, 6, 8, 3, 5, 12].map(textoQ), ['1 tempo', '1 tempo e meio', '2 tempos', '¾ de tempo', '1 tempo e ¼', '3 tempos']);
  assert.deepEqual([0, 1, 2, 3].map(estrelasCompasso), [3, 2, 2, 1]);
});
test('o intruso: 3 combinam e 1 não, sempre; a explicação bate; níveis sobem; não repete a regra seguida', () => {
  for (const nv of ['facil', 'medio', 'dificil']) for (let i = 0; i < 200; i++) {
    const r = rodadaIntruso(nv); assert.equal(r.cartas.length, 4); assert.equal(new Set(r.cartas.map((c) => c.id)).size, 4);
    const g = REGRAS_INTRUSO.find((x) => x.id === r.regra.id); const bate = r.cartas.map(g.test); assert.equal(bate.filter(Boolean).length, 3); assert.equal(bate[r.intruso], false); assert.ok(g.niveis.includes(nv));
    if (g.pool === 'notas') assert.ok(r.cartas.every((c) => !c.rest));
    const prox = rodadaIntruso(nv, Math.random, r.regra); assert.notEqual(prox.regra.id, r.regra.id);
  }
  assert.ok(Array.from({ length: 100 }, () => rodadaIntruso('facil')).every((r) => ['pausas', 'figuras'].includes(r.regra.id))); assert.ok(Array.from({ length: 200 }, () => rodadaIntruso('dificil')).some((r) => r.regra.id === 'sem-colchete'));
  assert.ok(Array.from({ length: 100 }, () => rodadaIntruso('facil')).every((r) => r.cartas.every((c) => FIGS_INTRUSO.facil.includes(c.fig))));
});
