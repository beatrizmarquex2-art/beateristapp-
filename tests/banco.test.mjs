// Banco de conteúdo verificado (assets/jogos/banco, gerado por scripts/gera-banco.mjs a partir dos PDFs da Bea).
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
import { _poeNoBanco, _limpaBanco, comoDicas, doBanco, paresDoBanco, qaDoBanco, carregaBanco, bancoCarregado, respostaCerta, ASSUNTOS_BANCO } from '../js/banco.js';
import { verificaItens, achaNaPagina, NORM } from '../scripts/banco-verifica.mjs';
import { filtraAssunto } from '../js/jogos/fuga-trilhas-logic.js';
import { paresMemoria, rodadasQA, bancoQA, REGRA_TEMPO } from '../js/jogos/fuga-mini-logic.js';
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

/* ---------- revisão da Bea (pontos 1 a 7) ---------- */
test('duração: toda pergunta de valor diz a unidade (semínima = 1 tempo, compasso 4/4) e a regra é conferida em uma 2ª âncora', () => {
  const vale = TODOS.filter((x) => x.k === 'vale'); assert.ok(vale.length >= 10);
  for (const it of vale) {
    assert.match(it.q, /(compasso 4\/4)/, it.i); assert.ok(/semínima valendo 1 tempo|no compasso 4\/4/.test(it.q), it.i);
    assert.ok(it.f2 && it.f2[0] === 'ens' && it.c2, `sem 2ª âncora: ${it.i}`); assert.ok(it.p && it.dur, it.i);
  }
  // alternativas de duração são durações e de figura são figuras (nunca misturado)
  for (const it of vale) { if (/quanto vale/.test(it.q)) for (const o of [it.r, ...it.o]) assert.match(o, /tempo/, it.i); else for (const o of [it.r, ...it.o]) assert.doesNotMatch(o, /tempo/, it.i); }
});
test('memória, pesca e mira: durações levam a regra da unidade', () => {
  _limpaBanco(); for (const a of ASSUNTOS_BANCO) _poeNoBanco(a, LE(a));
  const pr = paresDoBanco('ritmo'); assert.ok(pr.some((p) => p.dur), 'nenhum par de duração'); assert.ok(pr.filter((p) => p.dur).every((p) => /tempo/.test(p.b)));
  assert.match(REGRA_TEMPO, /semínima vale 1 tempo/);
  const qa = bancoQA(); assert.ok(qa.filter((x) => /\btempos?\b/.test(x.q) && !/semínima/i.test(x.q.replace(REGRA_TEMPO, ''))).every((x) => x.q.includes(REGRA_TEMPO)), 'pergunta de duração sem a unidade');
  assert.ok(qa.some((x) => x.q.includes(REGRA_TEMPO)));
  _limpaBanco();
});
test('caça e cruzadinha: tamanho medido sem acento (4 a 11 letras) e pista com resposta única', () => {
  const cand = TODOS.filter((x) => 'cc' in x); assert.ok(cand.length > 80);
  for (const it of cand) { assert.equal(it.w, NORM(it.r).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, ''), it.i); if (it.cc === 1) assert.match(it.w, /^[A-Z]{4,11}$/, it.i); else assert.ok(!/^[A-Z]{4,11}$/.test(it.w) || it.amb, `cc 0 sem motivo: ${it.i}`); }
  assert.ok(TODOS.some((x) => x.amb), 'nenhuma pista ambígua foi barrada (cover/autoral)'); const w = (it) => sem(it.q);
  const ok1 = cand.filter((x) => x.cc === 1); assert.equal(new Set(ok1.map((x) => `${x.w}|${w(x)}`)).size, ok1.length);
  _limpaBanco(); for (const a of ASSUNTOS_BANCO) _poeNoBanco(a, LE(a)); const d = comoDicas(); assert.equal(d.length, ok1.length); assert.ok(d.every((x) => /^[A-Z]{4,11}$/.test(x.w))); _limpaBanco();
});
test('alternativas: nada passa de 60 caracteres, o mesmo tipo da resposta, e variantes aceitas (ac) nunca viram alternativa errada', () => {
  const nw = (s) => String(s).trim().replace(/^(o|a|os|as|um|uma) /i, '').split(/\s+/).filter((t) => /[\p{L}\d]/u.test(t)).length;
  for (const it of TODOS) { if (it.t === 'vf') continue; assert.ok(String(it.r).length <= 60, it.i); for (const o of it.o) { assert.ok(o.length <= 60, it.i); assert.ok(Math.abs(nw(o) - nw(it.r)) <= 1, `forma diferente: ${it.i} · ${it.r} × ${o}`); } }
  const com = TODOS.filter((x) => x.ac); assert.ok(com.length >= 3);
  for (const it of com) { for (const v of it.ac) { assert.ok(respostaCerta(it, v), it.i); for (const o of it.o) assert.ok(!sem(o).includes(sem(v)) && !sem(v).includes(sem(o)), `distrator = variante: ${it.i} · ${o}`); } }
  assert.ok(respostaCerta({ r: 'offbeat / upbeat', ac: ['offbeat', 'upbeat'] }, ' UpBeat ')); assert.ok(!respostaCerta({ r: 'groove' }, 'swing'));
});
test('pesca e mira: variante aceita nunca aparece como peixe/alvo errado', () => {
  _limpaBanco(); _poeNoBanco('ritmo', [{ i: 'a', a: 'ritmo', t: 'definicao', n: 'f', q: 'pergunta a', r: 'offbeat / upbeat', o: ['x', 'y', 'z'], ac: ['upbeat'], f: ['dic', 1], c: 'abc' }, { i: 'b', a: 'ritmo', t: 'definicao', n: 'f', q: 'pergunta b', r: 'upbeat', o: ['x', 'y', 'z'], f: ['dic', 1], c: 'abd' }]);
  for (let k = 0; k < 40; k++) for (const r of rodadasQA(4, 2, Math.random, ['ritmo'])) { const t = r.opcoes.map((x) => String(x).toLowerCase()); assert.ok(!(t.includes('offbeat / upbeat') && t.includes('upbeat')), 'variante aceita virou alternativa errada'); }
  _limpaBanco();
});
test('verdadeiro/falso: afirmação completa, feedback com a correção, 2ª âncora na falsa e nenhuma afirmação que se entrega', () => {
  const vf = TODOS.filter((x) => x.t === 'vf'); assert.ok(vf.length >= 60);
  for (const it of vf) {
    assert.match(it.q, /^(“[^”]+” significa: |sobre “[^”]+”: )/, `afirmação incompleta: ${it.i}`); assert.match(it.q, /[.!?]$/, it.i); assert.ok(it.fb && it.fb.length >= 15 && it.fb.length <= 220, it.i);
    if (it.r === 0) { assert.match(it.fb, /^na verdade, /, it.i); assert.ok(it.f2 && it.c2, `falsa sem a correção conferida: ${it.i}`); } else assert.match(it.fb, /^certo!/, it.i);
    if (/^“/.test(it.q) && it.r === 1) { const termo = /^“([^”]+)”/.exec(it.q)[1]; const pal = (x) => sem(x).split(/[^a-z0-9]+/).filter((w) => w.length >= 4); assert.ok(!pal(termo).some((w) => pal(it.q.replace(/^“[^”]+” significa: /, '')).includes(w)), `verdadeiro que se entrega: ${it.i}`); }
  }
});
test('assunto e nível: dinâmica é teoria (não ritmo) e o nível das definições segue 80/110 caracteres', () => {
  assert.ok(LE('teoria').some((x) => /dinâmica/.test(x.r) || /dinâmica/.test(x.q)), 'dinâmica fora da teoria'); assert.ok(!LE('ritmo').some((x) => x.r === 'dinâmica'));
  for (const it of TODOS.filter((x) => x.f[0] === 'dic' && x.t === 'definicao' && !x.k)) assert.equal(it.n, it.q.length <= 80 ? 'f' : it.q.length <= 110 ? 'm' : 'd', it.i);
  const dif = TODOS.filter((x) => x.n === 'd').length; assert.ok(dif / TODOS.length < 0.2, `muita coisa “difícil”: ${dif}`);
  const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'indice.json'), 'utf8')); assert.equal(idx.total, TODOS.length);
});
test('docs: as duas cópias do dicionário foram comparadas e o resultado está na folha (sem escolher cópia oficial)', () => {
  const md = fs.readFileSync('docs/BANCO-CONTEUDO.md', 'utf8'); assert.match(md, /Dicionário: as duas cópias do PDF/); assert.match(md, /cartas com título diferente \| \d+/); assert.match(md, /Itens pendentes/); assert.match(md, /PENDENTES/);
  assert.match(md, /Eu não escolhi uma cópia como oficial/);
});
