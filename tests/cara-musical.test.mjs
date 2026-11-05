import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ENTIDADES, BY_ID, FOTOS } from '../js/jogos/cara-musical/elenco.js';
import { PERGUNTAS } from '../js/jogos/cara-musical/perguntas.js';
import * as R from '../js/jogos/cara-musical/regras.js';

const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8'));
const elenco = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/cara-a-cara-elenco.json', import.meta.url), 'utf8'));

test('elenco: 86 entidades, 125 fotos do catálogo (cada foto em exatamente 1 entidade), atributos só true/false/null', () => {
  assert.equal(ENTIDADES.length, 86); assert.equal(new Set(ENTIDADES.map((e) => e.id)).size, 86);
  const todas = ENTIDADES.flatMap((e) => e.fotos); assert.equal(todas.length, 125); assert.deepEqual([...todas].sort(), cat.map((c) => c.codigo).sort());
  for (const e of ENTIDADES) for (const [k, v] of Object.entries(e.attrs)) assert.ok(v === true || v === false || v === null, `${e.id}.${k}`);
  for (const c of cat) assert.ok(c.codigo in FOTOS && [true, false, null].includes(FOTOS[c.codigo].preto_e_branco));
  const origem = new Set(elenco.entidades.map((x) => x.entidade_id)); for (const e of ENTIDADES) assert.ok(origem.has(e.origem), e.id);
});
test('o álbum não foi alterado: catálogo com 125 fotos, 101 comuns, 14 raras, 10 exclusivas e todas as imagens existem', () => {
  const n = (r) => cat.filter((c) => c.raridade === r).length; assert.deepEqual([n('Comum'), n('Rara'), n('Exclusiva')], [101, 14, 10]);
  for (const c of cat) assert.ok(fs.existsSync(new URL(`../assets/figurinhas/fotos/${c.codigo}.jpeg`, import.meta.url)), c.codigo);
});
test('entidades próprias: Beatles (banda) e integrantes são alvos diferentes; duplas são entidades próprias; sem gênero nem raridade nas perguntas', () => {
  assert.ok(BY_ID['the-beatles'].attrs.banda && BY_ID['john-lennon-the-beatles'].attrs.solo && BY_ID['john-lennon-e-paul-mccartney-the-beatles'].attrs.dupla);
  assert.ok(BY_ID['the-beatles'].fotos.length > 10);
  assert.ok(!PERGUNTAS.some((q) => /mulher|homem|gênero|rar|exclusiv/i.test(`${q.kids} ${q.classico} ${q.attr}`)));
});
test('mesas: tamanhos 6/12 (kids) e 12/20 (clássico), sem entidade repetida, com solução, só perguntas verificadas e todas coerentes com cada carta', () => {
  for (const [modo, tam] of [['kids', 6], ['kids', 12], ['classico', 12], ['classico', 20]]) for (let s = 1; s <= 40; s++) {
    const mesa = R.novaMesa({ modo, tamanho: tam, rnd: seeded(s * 97 + tam) }); assert.equal(mesa.cartas.length, tam); assert.equal(new Set(mesa.cartas.map((c) => c.id)).size, tam);
    assert.ok(R.mesaTemSolucao(mesa.cartas, modo)); const qs = R.perguntasDaMesa(mesa.cartas, modo); assert.ok(qs.length >= 3);
    for (const c of mesa.cartas) { assert.ok(BY_ID[c.id].fotos.includes(c.foto)); for (const q of qs) assert.notEqual(R.respostaDe(q, c), null); }
    if (modo === 'kids') assert.ok(qs.every((q) => q.kidsOk));
  }
});
test('banda com várias fotos (Beatles) nunca aparece duas vezes na mesma rodada', () => {
  for (let s = 1; s <= 300; s++) { const mesa = R.novaMesa({ modo: 'classico', tamanho: 20, rnd: seeded(s) }); const beatles = mesa.cartas.filter((c) => BY_ID[c.id].fotos.length > 5); assert.ok(beatles.length <= 1); }
});
test('pergunta com atributo null nunca é oferecida nem respondida', () => {
  const nulo = ENTIDADES.find((e) => e.attrs.punk === null); const outras = ENTIDADES.filter((e) => e.id !== nulo.id && e.attrs.punk !== null).slice(0, 5);
  const cartas = [nulo, ...outras].map((e) => ({ id: e.id, foto: e.fotos[0] })); assert.ok(!R.perguntasDaMesa(cartas, 'classico').some((q) => q.id === 'punk'));
  const mesa = { modo: 'classico', cartas }; const lado = R.novoLado({ mesa, segredo: nulo.id }); assert.throws(() => R.perguntar(mesa, lado, 'punk'), /indispon/);
});
test('perguntar: resposta coerente com o segredo, elimina só o que não combina, não repete, desfazer só a última virada', () => {
  for (let s = 1; s <= 60; s++) {
    const mesa = R.novaMesa({ modo: 'classico', tamanho: 12, rnd: seeded(s) }); const segredo = mesa.cartas[s % 12].id; let lado = R.novoLado({ mesa, segredo });
    for (const q of R.disponiveis(mesa, lado)) { const r = R.perguntar(mesa, lado, q.id); lado = r.lado; assert.ok(R.candidatosDo(mesa, lado).includes(segredo)); assert.equal(r.sim, R.respostaDe(q, mesa.cartas.find((c) => c.id === segredo))); assert.throws(() => R.perguntar(mesa, lado, q.id), /repetida/); }
    assert.deepEqual(R.candidatosDo(mesa, lado), [segredo]);
  }
  const mesa = R.novaMesa({ modo: 'kids', tamanho: 6, rnd: seeded(3) }); let l = R.novoLado({ mesa, segredo: mesa.cartas[0].id }); l = R.virar(l, mesa.cartas[1].id); l = R.virar(l, mesa.cartas[2].id);
  assert.deepEqual(R.desfazerUltimaVirada(l).fora, [mesa.cartas[1].id]);
});
test('palpites: Kids 2 (dica validada depois do 1º erro), Clássico 1; acertar termina; carta errada sai', () => {
  const mesa = R.novaMesa({ modo: 'kids', tamanho: 6, rnd: seeded(11) }); const seg = mesa.cartas[0].id; const err = mesa.cartas[1].id; let lado = R.novoLado({ mesa, segredo: seg, palpites: 2 });
  let r = R.palpitar(lado, err); assert.ok(!r.acertou && !r.lado.terminou && r.lado.palpites === 1 && !R.candidatosDo(mesa, r.lado).includes(err));
  const dica = R.dicaPara(mesa, lado, err); assert.ok(dica && R.respostaDe(PERGUNTAS.find((q) => q.id === dica.id), mesa.cartas[0]) === dica.sim);
  r = R.palpitar(r.lado, mesa.cartas[2].id); assert.ok(r.lado.terminou && !r.lado.acertou); assert.ok(R.palpitar(lado, seg).lado.acertou);
  assert.equal(R.novoLado({ mesa, segredo: seg }).palpites, 1);
});
test('Paul: escolhe sem receber o segredo (mesma escolha com segredos diferentes), nunca repete, só usa perguntas verificadas e termina em poucas perguntas', () => {
  for (const nivel of ['iniciante', 'desafio']) for (let s = 1; s <= 40; s++) {
    const mesa = R.novaMesa({ modo: 'classico', tamanho: 12, rnd: seeded(s) }); const A = R.novoLado({ mesa, segredo: mesa.cartas[0].id }); const B = R.novoLado({ mesa, segredo: mesa.cartas[5].id });
    assert.equal(R.paulEscolhe(mesa, A, nivel, seeded(9)), R.paulEscolhe(mesa, B, nivel, seeded(9)), 'não pode depender do segredo');
    let lado = A; let n = 0; const seen = new Set();
    while (!lado.terminou && n < 30) { const palpite = R.paulPalpita(mesa, lado); if (palpite) { lado = R.palpitar(lado, palpite).lado; break; } const qid = R.paulEscolhe(mesa, lado, nivel, seeded(s + n)); assert.ok(qid && !seen.has(qid)); seen.add(qid); lado = R.perguntar(mesa, lado, qid).lado; n++; }
    assert.ok(lado.acertou, `${nivel} ${s}`); assert.equal(lado.perguntas.length, n);
  }
  const med = (nivel) => { let t = 0; for (let s = 1; s <= 40; s++) { const mesa = R.novaMesa({ modo: 'classico', tamanho: 12, rnd: seeded(s) }); let lado = R.novoLado({ mesa, segredo: mesa.cartas[3].id }); while (!lado.terminou) { const p = R.paulPalpita(mesa, lado); if (p) { lado = R.palpitar(lado, p).lado; break; } lado = R.perguntar(mesa, lado, R.paulEscolhe(mesa, lado, nivel, seeded(s + t))).lado; } t += lado.perguntas.length; } return t / 40; };
  assert.ok(med('desafio') <= med('iniciante'), 'o desafio pergunta menos que o iniciante');
});
test('melhor de 3: menos perguntas vence, acertar vence quem errou, empate não pontua, primeiro a 2 vence, desempate segue', () => {
  const L = (acertou, q) => ({ acertou, perguntas: Array.from({ length: q }, (_, i) => ({ id: 'x' + i })) });
  assert.equal(R.resultadoRodada(L(true, 3), L(true, 5)).vencedor, 0); assert.equal(R.resultadoRodada(L(true, 6), L(true, 5)).vencedor, 1);
  assert.equal(R.resultadoRodada(L(true, 4), L(true, 4)).vencedor, null); assert.equal(R.resultadoRodada(L(false, 1), L(true, 9)).vencedor, 1); assert.equal(R.resultadoRodada(L(false, 1), L(false, 2)).vencedor, null);
  let s = R.novaSerie(); s = R.fecharRodada(s, { vencedor: 0 }); s = R.fecharRodada(s, { vencedor: null }); assert.ok(!s.fim && s.empates === 1); s = R.fecharRodada(s, { vencedor: 1 }); assert.ok(!s.fim); s = R.fecharRodada(s, { vencedor: 0 }); assert.ok(s.fim && s.vencedor === 0);
});
test('o Cara a Cara Musical não dá figurinha, pacote nem recompensa (nenhum módulo importa o álbum, o ranking ou o progresso)', () => {
  for (const f of fs.readdirSync(new URL('../js/jogos/cara-musical/', import.meta.url))) { const src = fs.readFileSync(new URL(`../js/jogos/cara-musical/${f}`, import.meta.url), 'utf8'); assert.ok(!/figurinhas\.js|album|pacote|ranking|kids\/progress|kids\/album/i.test(src.replace(/\/\/.*$/gm, '')), f); }
});
