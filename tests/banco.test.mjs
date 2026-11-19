// Banco de conteúdo verificado (assets/jogos/banco, gerado por scripts/gera-banco.mjs a partir dos PDFs da Bea).
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
import { _poeNoBanco, _limpaBanco, comoDicas, doBanco, paresDoBanco, qaDoBanco, carregaBanco, bancoCarregado, ASSUNTOS_BANCO } from '../js/banco.js';
import { verificaItens, achaNaPagina, NORM } from '../scripts/banco-verifica.mjs';
import { filtraAssunto } from '../js/jogos/fuga-trilhas-logic.js';
import { paresMemoria, rodadasQA } from '../js/jogos/fuga-mini-logic.js';
import { keywords, question, easyPick } from '../js/tips.js';

const DIR = 'assets/jogos/banco';
const LE = (a) => JSON.parse(fs.readFileSync(path.join(DIR, `${a}.json`), 'utf8'));
const TODOS = ASSUNTOS_BANCO.flatMap(LE);
const sem = (s) => NORM(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

test('banco: todo item tem fonte (pdf + página), âncora curta, assunto, nível e tipo válidos', () => {
  assert.ok(TODOS.length >= 300, `poucos itens: ${TODOS.length}`);
  for (const it of TODOS) {
    assert.ok(it.i && it.q && it.c, it.i); assert.ok(['ritmo', 'teoria', 'cordas', 'dicionario'].includes(it.a), it.i);
    assert.ok(['f', 'm', 'd'].includes(it.n), it.i); assert.ok(['definicao', 'lacuna', 'vf'].includes(it.t), it.i);
    assert.ok(Array.isArray(it.f) && ['dic', 'ins', 'ens', 'mel', 'cad'].includes(it.f[0]) && Number.isInteger(it.f[1]) && it.f[1] > 0, it.i);
    assert.ok(it.c.length >= 3 && it.c.length <= 80, `âncora fora do tamanho: ${it.i}`);
    assert.ok(it.q.length <= 200, `enunciado longo: ${it.i}`);
  }
});
test('banco: ids únicos e nenhuma pergunta repetida no mesmo assunto/tipo', () => {
  assert.equal(new Set(TODOS.map((x) => x.i)).size, TODOS.length);
  const ch = TODOS.map((x) => `${x.a}|${x.t}|${NORM(x.q)}`); assert.equal(new Set(ch).size, ch.length);
});
test('banco: distratores — 3 diferentes, nunca iguais à resposta nem escritos no enunciado', () => {
  for (const it of TODOS) {
    if (it.t === 'vf') { assert.ok(it.r === 0 || it.r === 1, it.i); assert.equal(it.o, undefined); continue; }
    assert.equal(it.o.length, 3, it.i); assert.equal(new Set(it.o.map(sem)).size, 3, `distratores repetidos: ${it.i}`);
    for (const d of it.o) { assert.notEqual(sem(d), sem(it.r), `distrator = resposta: ${it.i}`); if (!it.k) assert.ok(!sem(it.q).includes(sem(d)), `distrator aparece no enunciado: ${it.i} · ${d}`); }
    if (it.t === 'lacuna') assert.equal((it.q.match(/_____/g) || []).length, 1, it.i);
  }
});
test('banco: contagem por assunto e níveis (ritmo, teoria, cordas e dicionário têm itens fáceis e médios)', () => {
  for (const a of ASSUNTOS_BANCO) { const l = LE(a); assert.ok(l.length >= 30, `${a}: ${l.length}`); assert.ok(l.some((x) => x.n === 'f') && l.some((x) => x.n === 'm'), a); }
  assert.ok(LE('ritmo').some((x) => x.n === 'd'));
  const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'indice.json'), 'utf8')); assert.equal(idx.total, TODOS.length);
});
test('banco: o trecho de cada item existe no PDF (só roda se os PDFs estiverem na máquina)', (t) => {
  const dir = process.env.BANCO_PDFS || '/root/.claude/uploads/627c7c3f-1f77-565c-9fc7-954418ce0d0d';
  if (!fs.existsSync(path.join(dir, '0cab7b2b-Cards-do-Robo-Paul-DICIONARIO-120-completo.pdf'))) return t.skip('PDFs não estão aqui');
  assert.deepEqual(verificaItens(TODOS, dir), []);
});
test('achaNaPagina: janelas de 5 palavras, tolerante a espaço e aspas', () => {
  const pg = NORM('o tambor grande e grave, tocado com o pé no pedal. ele marca o chão do ritmo.');
  assert.ok(achaNaPagina(pg, 'o tambor grande e grave, tocado com o pé no pedal.')); assert.ok(!achaNaPagina(pg, 'o tambor pequeno e agudo, tocado com a mão no pedal.'));
});
test('comoDicas: vira dica (palavra de 4 a 11 letras, sem vf/inglês), lacuna volta inteira e ids não colidem com as dicas do método', () => {
  _limpaBanco(); for (const a of ASSUNTOS_BANCO) _poeNoBanco(a, LE(a));
  const d = comoDicas(); assert.ok(d.length >= 60, `${d.length}`);
  for (const x of d) { assert.match(x.w, /^[A-Z]{4,11}$/); assert.ok(x.n >= 900000 && x.banco && x.termo && ['ritmo', 'teoria', 'cordas', 'dicionario'].includes(x.assunto)); assert.ok(!x.text.includes('_____')); }
  assert.equal(new Set(d.map((x) => x.n)).size, d.length);
  // o quiz, a caça e a cruzadinha já sabem usar
  const its = keywords([], {}).concat(d); const q = question(its, 'blank'); assert.equal(q.options.length, 4); assert.ok(q.options.some((o) => o.id === q.ans));
  const pick = easyPick(its, 6); assert.ok(pick.length >= 4);
});
test('question: item do banco usa as 3 erradas curadas (nenhuma sorteada de outro item); "continua"/"match" sem dicas viram "blank"', () => {
  _limpaBanco(); for (const a of ASSUNTOS_BANCO) _poeNoBanco(a, LE(a)); const d = comoDicas();
  for (const kind of ['blank', 'continua', 'match']) for (let i = 0; i < 40; i++) {
    const q = question(d, kind, Math.random); assert.equal(q.kind, 'blank'); assert.equal(q.options.length, 4);
    const it = q.item; const esperado = new Set([it.shown, ...it.o]); assert.deepEqual(new Set(q.options.map((o) => o.label)), esperado); assert.equal(q.ans, it.w);
  }
  // com dicas do método suficientes, "continua" continua sendo sobre elas
  const dicas = Array.from({ length: 8 }, (_, i) => ({ n: i + 1, text: `dica ${i}: treine o ${['bumbo', 'caixa', 'prato', 'pedal', 'surdo', 'tambor', 'chimbal', 'baqueta'][i]} com calma todos os dias.`, w: ['BUMBO', 'CAIXA', 'PRATO', 'PEDAL', 'SURDO', 'TAMBOR', 'CHIMBAL', 'BAQUETA'][i], shown: ['bumbo', 'caixa', 'prato', 'pedal', 'surdo', 'tambor', 'chimbal', 'baqueta'][i], cands: [] }));
  for (let i = 0; i < 20; i++) { const q = question([...dicas, ...d], 'continua', Math.random); assert.ok(!q.item.banco, 'continua sorteou item do banco'); }
});
test('filtraAssunto: itens do banco entram pelo assunto que já trazem', () => {
  _limpaBanco(); for (const a of ASSUNTOS_BANCO) _poeNoBanco(a, LE(a)); const d = comoDicas();
  const r = filtraAssunto(d, ['cordas'], 5); assert.equal(r.fallback, false); assert.ok(r.itens.length >= 5 && r.itens.every((x) => x.assunto === 'cordas'));
  const g = filtraAssunto(d, ['ritmo', 'teoria', 'cordas']); assert.equal(g.itens.length, d.length); // geral = tudo (inclui o dicionário)
});
test('memória, pesca e mira usam o banco e voltam pros pares de antes sem ele', () => {
  _limpaBanco(); const antes = paresMemoria(8, () => 0.3, ['teoria']); assert.equal(antes.length, 8);
  for (const a of ASSUNTOS_BANCO) _poeNoBanco(a, LE(a));
  const pr = paresDoBanco('ritmo'); assert.ok(pr.length >= 10, `${pr.length}`); assert.ok(pr.every((p) => p.a.length <= 24 && p.b.length <= 24));
  const m = paresMemoria(8, () => 0.3, ['ritmo']); assert.equal(m.length, 8); assert.ok(m.some((p) => p.banco));
  assert.equal(new Set(m.flatMap((p) => [p.a || p.sym, p.b])).size, 16, 'cartas repetidas na memória');
  const qa = qaDoBanco(); assert.ok(qa.length >= 20); const r = rodadasQA(6, 4, Math.random, ['ritmo']); assert.equal(r.length, 6); for (const x of r) { assert.equal(x.opcoes[x.ok], x.certo); assert.equal(new Set(x.opcoes).size, 4); }
  _limpaBanco(); assert.equal(paresDoBanco('ritmo').length, 0);
});
test('carregaBanco: lê pelos arquivos (leitor trocável), não quebra com falha e guarda em cache', async () => {
  _limpaBanco(); let n = 0; const ler = (a) => { n++; if (a === 'cordas') throw new Error('sem rede'); return LE(a); };
  const l = await carregaBanco(['ritmo', 'cordas'], ler); assert.equal(n, 2); assert.ok(l.length > 0 && l.every((x) => x.a === 'ritmo'));
  await carregaBanco(['ritmo'], ler); assert.equal(n, 2); assert.ok(bancoCarregado(['ritmo']).length > 0); _limpaBanco();
});
