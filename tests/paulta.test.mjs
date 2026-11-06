import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, phaseSpec, WORLDS, MODES, teachOf, reinforceQuestion, notePool, partsOf, figOf, DRUM_LEVELS } from '../js/paulta/worlds.js';
import * as RW from '../js/paulta/recompensas.js';
const { ordemRevisao } = RW;
import { noteName, posOf, placeText, sameSpotOther, mk, seeded, CLEFS } from '../js/paulta/music.js';
import * as S from '../js/paulta/score.js';

const ALL = [['drumF', 12], ['drumI', 12], ['drumD', 12], ['sol', 15], ['fa', 15], ['duel', 6]];

test('todas as fases (72) geram perguntas válidas nos dois formatos', () => {
  let total = 0;
  for (const [w, c] of ALL) for (let n = 1; n <= c; n++) for (const mode of ['nomes', 'imagens']) {
    const sp = phaseSpec(w, n); assert.ok(sp, `${w} ${n}`); assert.equal(sp.rounds >= 3, true);
    for (let i = 0; i < sp.rounds * 3; i++) {
      const q = makeQuestion(w, n, mode, seeded(i * 97 + n), i); total++;
      const ids = q.options.map((o) => o.id);
      assert.equal(new Set(ids).size, ids.length, `${w}${n} ids únicos`); assert.ok(ids.includes(q.ans), `${w}${n} resposta nas opções`);
      const labels = q.options.map((o) => o.label); assert.equal(new Set(labels).size, labels.length, `${w}${n} rótulos únicos: ${labels}`);
      assert.ok(q.options.length >= 2 && q.options.length <= 6);
      assert.ok(q.promptSvg.startsWith('<svg'), 'prompt é svg');
      for (const o of q.options) { assert.ok(o.img && o.img.includes('<svg'), `${w}${n} imagem`); assert.ok(!/>\s*(bumbo|caixa|chimbal|tom|surdo|prato|dó|ré|mi|fá|sol|lá|si)/i.test(o.img.replace(/<text[^>]*>\d<\/text>/g, '')), `${w}${n} imagem sem nome`); }
      const wrong = ids.find((x) => x !== q.ans); assert.ok(q.explain(wrong).length > 20, 'explicação específica');
      assert.equal(q.explain(q.ans) !== undefined, true);
    }
  }
  assert.ok(total > 500);
});

test('3 modos da bateria: 12 fases cada, cronômetro e "sem errar" nos lugares certos', () => {
  for (const w of ['drumF', 'drumI', 'drumD']) assert.equal(DRUM_LEVELS[w].length, 12);
  assert.equal(WORLDS.drum.count, 12);
  const sudden = (w) => DRUM_LEVELS[w].filter((x) => x.sudden).length;
  assert.equal(sudden('drumF'), 2, 'fácil: "sem errar" só em 2 fases mais fáceis');
  assert.ok(DRUM_LEVELS.drumI.some((x) => x.sudden) && DRUM_LEVELS.drumD.some((x) => x.sudden));
  assert.ok(DRUM_LEVELS.drumF.some((x) => x.secs === 10), 'fácil tem tempo de 10 s');
  assert.deepEqual([...new Set(DRUM_LEVELS.drumI.map((x) => x.secs).filter(Boolean))].sort((a, b) => a - b), [7, 10], 'intermediário: 10 e 7 s');
  // fases de colcheia/semicolcheia nunca têm cronômetro
  for (const w of ['drumF', 'drumI', 'drumD']) for (const x of DRUM_LEVELS[w]) if (x.q === 'fig' || x.q === 'artfig' || /olcheia/i.test(x.title)) { assert.equal(x.secs, null, `${w} ${x.title}`); assert.equal(x.optSecs, null); }
  assert.equal(phaseSpec('drumF', 8).secs, 10); assert.equal(phaseSpec('drumF', 1).secs, null);
});

test('conteúdo por modo: fácil sem semicolcheia/acento/fantasma/aro/chimbal aberto; intermediário sem semicolcheia', () => {
  const BAN_F = ['sa', 'sg', 'sr', 'ho']; let vistos = 0;
  for (const w of ['drumF', 'drumI', 'drumD']) for (let n = 1; n <= 12; n++) {
    const sp = phaseSpec(w, n);
    for (let i = 0; i < sp.rounds * 12; i++) {
      const q = makeQuestion(w, n, 'nomes', seeded(i * 13 + n * 7), i); vistos++;
      const todos = [q.ans, ...q.options.map((o) => o.id)];
      for (const id of todos) {
        if (w === 'drumF') { assert.ok(!partsOf(id).some((x) => BAN_F.includes(x)), `fácil ${n}: ${id}`); assert.notEqual(figOf(id) || id, 'semicolcheia'); assert.notEqual(id, 'semicolcheia'); }
        if (w !== 'drumD') { assert.notEqual(figOf(id), 'semicolcheia', `${w} ${n}`); assert.notEqual(id, 'semicolcheia'); }
      }
      if (sp.secs) assert.ok(q.kind !== 'fig' && !/^art:/.test(q.key), 'pergunta com tempo não tem figura');
    }
  }
  assert.ok(vistos > 800);
});

test('perguntas: não repetem seguidas e combos de 2 peças têm várias opções com 2 peças', () => {
  for (const w of ['drumF', 'drumI', 'drumD']) for (let n = 1; n <= 12; n++) {
    const sp = phaseSpec(w, n); const hist = []; let rep = 0;
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(w, n, 'nomes', seeded(i + n * 100), i % sp.rounds, hist.slice(-2)); const sig = q.sig || q.key;
      if (hist.length && hist[hist.length - 1] === sig) rep++;
      hist.push(sig);
      if (q.kind === 'drum' && partsOf(q.ans).length > 1) { const dois = q.options.filter((o) => partsOf(o.id).length === 2).length; assert.ok(dois >= 3, `${w}${n}: só ${dois} opções com duas peças`); assert.ok(q.options.length >= 4); }
    }
    assert.equal(rep, 0, `${w}${n} repetiu seguida ${rep}×`);
  }
});

test('pacotinhos: fácil, intermediário e difícil seguem a tabela', () => {
  const run = (p, w, n, stars3 = false) => S.applyRun(p, { world: w, n, mode: 'nomes', right: 5, total: 5 }).p;
  const cartas = (p, w) => RW.merecidos(p, 'x').filter((x) => x.id.includes(`:x:${w.slice(-1)}:`)).reduce((a, x) => a + x.n, 0);
  let p = S.norm();
  for (let n = 1; n <= 2; n++) p = run(p, 'drumF', n); assert.equal(cartas(p, 'drumF'), 0);
  p = run(p, 'drumF', 3); assert.equal(cartas(p, 'drumF'), 1, 'a cada 3 fases certas, 1 carta');
  for (let n = 4; n <= 12; n++) p = run(p, 'drumF', n);
  const f = RW.merecidos(p, 'x').filter((x) => x.id.includes(':x:F:'));
  assert.deepEqual(f.filter((x) => x.id.includes(':fim:')).map((x) => x.n).sort(), [2, 3], 'fim do fácil: pacotes de 3 e de 2');
  assert.ok(f.find((x) => x.n === 3 && x.id.includes(':fim:')).bea > 0, 'o de 3 pode vir Beaterista');
  assert.equal(f.length, 4 + 2);
  let q = S.norm(); for (let n = 1; n <= 12; n++) q = run(q, 'drumI', n);
  const i = RW.merecidos(q, 'x').filter((x) => x.id.includes(':x:I:'));
  assert.deepEqual(i.filter((x) => x.id.includes(':fim:')).map((x) => x.n), [3, 2, 2], 'fim do intermediário: 3 pacotes, 7 cartas');
  assert.deepEqual(i.filter((x) => x.id.includes(':m:')).map((x) => x.n), [2, 2], 'a cada 5 fases, 2 cartas');
  assert.ok(i.filter((x) => x.id.includes(':m:')).every((x) => x.bea > 0), 'exclusivas também no meio');
  // difícil: só conta fase com 3 estrelas
  let d = S.norm(); for (let n = 1; n <= 5; n++) d = S.applyRun(d, { world: 'drumD', n, mode: 'nomes', right: 4, total: 5 }).p;
  assert.equal(RW.merecidos(d, 'x').length, 0, '2 estrelas não vale');
  d = S.norm(); for (let n = 1; n <= 5; n++) d = run(d, 'drumD', n);
  assert.deepEqual(RW.merecidos(d, 'x').map((x) => x.n), [3], '5 fases com 3 estrelas = 1 pacote de 3');
  // mesmo marco = mesmo id (nunca entrega duas vezes)
  assert.deepEqual(RW.merecidos(run(d, 'drumD', 1), 'x').map((x) => x.id), RW.merecidos(d, 'x').map((x) => x.id));
});

test('revisão: 10 perguntas sem repetir seguidas', () => {
  for (const tags of [['peca:rd'], ['peca:rd', 'combo:hh+bd'], ['peca:rd', 'peca:sn', 'fig:colcheia', 'nota:mi4', 'oitava', 'clave']]) {
    const o = ordemRevisao(tags, 10); assert.equal(o.length, 10);
    for (let i = 1; i < 10; i++) assert.notEqual(o[i], o[i - 1]);
    assert.ok(tags.slice(0, 5).every((t) => o.includes(t)));
  }
});

test('posições nas claves: sol e fá usam mapas próprios', () => {
  assert.equal(noteName(mk('E', 4)), 'mi4'); assert.equal(posOf('sol', mk('E', 4)), 0); assert.equal(posOf('sol', mk('F', 5)), 8);
  assert.equal(posOf('fa', mk('G', 2)), 0); assert.equal(posOf('fa', mk('A', 3)), 8);
  assert.equal(noteName(sameSpotOther('sol', mk('E', 4))), 'sol2'); assert.equal(noteName(sameSpotOther('fa', mk('G', 2))), 'mi4');
  assert.equal(posOf('sol', mk('C', 4)), -2); assert.equal(posOf('fa', mk('C', 4)), 10);
  assert.equal(placeText('sol', mk('C', 4)), '1ª linha suplementar abaixo da pauta');
  assert.deepEqual(notePool('sol', 1).map(noteName), ['mi4', 'fá4', 'sol4']); assert.deepEqual(notePool('fa', 1).map(noteName), ['sol2', 'lá2', 'si2']);
  assert.ok(notePool('fa', 10).map(noteName).includes('dó4'));
});

test('clave certa nas perguntas de fá: nunca reaproveita o mapa de sol', () => {
  for (let n = 1; n <= 15; n++) for (let i = 0; i < 20; i++) {
    const q = makeQuestion('fa', n, 'nomes', seeded(i + n * 31), i); assert.equal(q.clef, 'fa');
    for (const x of q.notes) assert.ok(posOf('fa', x) >= -4 && posOf('fa', x) <= 12);
  }
  const q = makeQuestion('sol', 5, 'nomes', seeded(3), 0); const wrong = String(sameSpotOther('sol', q.notes[0]));
  assert.match(makeQuestion('sol', 5, 'nomes', seeded(3), 0).explain(wrong), /clave errada/);
});

test('oitavas: opções com mesmo nome em oitavas diferentes aparecem com o número da oitava', () => {
  const q = makeQuestion('sol', 11, 'nomes', seeded(5), 0); assert.ok(q.options.every((o) => /\d$/.test(o.label)));
  const d = makeQuestion('duel', 4, 'nomes', seeded(9), 0); const letters = d.options.map((o) => o.label.replace(/\d+$/, '')); assert.ok(new Set(letters).size < d.options.length, 'mesma letra em oitavas diferentes');
});

test('duelo alterna sol e fá', () => { for (let n = 1; n <= 6; n++) { const cl = Array.from({ length: 6 }, (_, i) => makeQuestion('duel', n, 'nomes', seeded(n * 7 + i), i).clef); assert.deepEqual(cl, ['sol', 'fa', 'sol', 'fa', 'sol', 'fa']); } });

test('Paul apresenta o que é novo em cada fase', () => {
  assert.deepEqual(teachOf('drumF', 1), ['bd', 'sn', 'hh']); assert.deepEqual(teachOf('drumF', 2), ['rd', 'cr']); assert.deepEqual(teachOf('drumF', 3), ['tt', 'ft']);
  assert.ok(teachOf('sol', 2).length === 3);
});

test('desbloqueio: mundos independentes; duelo só com sol e fá (sem exigir bateria)', () => {
  let p = S.norm();
  assert.equal(S.unlocked(p, 'drumF', 1), true); assert.equal(S.unlocked(p, 'sol', 1), true); assert.equal(S.unlocked(p, 'fa', 1), true);
  assert.equal(S.unlocked(p, 'drumF', 2), false); assert.equal(S.unlocked(p, 'duel', 1), false);
  const run = (p, w, n, mode = 'nomes') => S.applyRun(p, { world: w, n, mode, right: 5, total: 5 }).p;
  for (let n = 1; n <= 15; n++) p = run(p, 'sol', n);
  assert.equal(S.duelUnlocked(p), false); assert.equal(S.unlocked(p, 'duel', 1), false);
  for (let n = 1; n <= 15; n++) p = run(p, 'fa', n, 'imagens'); // outro formato também conta
  assert.equal(S.duelUnlocked(p), true); assert.equal(S.unlocked(p, 'duel', 1), true); assert.equal(S.unlocked(p, 'duel', 2), false);
  assert.equal(S.worldDone(p, 'drum'), false);
});

test('títulos: critérios e ordem', () => {
  let p = S.norm(); assert.equal(S.titleName(p), '');
  p = S.start(p); assert.equal(S.titleName(p), 'Aprendiz da pauLta');
  const run = (p, w, n) => S.applyRun(p, { world: w, n, mode: 'nomes', right: 3, total: 3 }).p;
  for (let n = 1; n <= 4; n++) p = run(p, 'drumF', n); assert.equal(S.titleName(p), 'Aprendiz da pauLta');
  p = run(p, 'drumF', 5); assert.equal(S.titleName(p), 'Explorador da pauLta');
  for (let n = 6; n <= 12; n++) p = run(p, 'drumF', n); assert.equal(S.titleName(p), 'Leitor Musical');
  for (let n = 1; n <= 15; n++) p = run(p, 'sol', n); assert.equal(S.titleName(p), 'Especialista da pauLta');
  for (let n = 1; n <= 15; n++) p = run(p, 'fa', n); assert.equal(S.titleName(p), 'Especialista da pauLta', 'três mundos sem o duelo final ainda não é mestre');
  for (let n = 1; n <= 5; n++) p = run(p, 'duel', n); assert.equal(S.titleName(p), 'Especialista da pauLta');
  p = run(p, 'duel', 6); assert.equal(S.titleName(p), 'Mestre da pauLta');
  assert.ok(p.titles.mestre && p.titles.leitor && p.titles.aprendiz);
});

test('pontos: sem acumular repetindo fases', () => {
  let p = S.norm(); const r = { world: 'drumF', n: 1, mode: 'nomes', right: 3, total: 3 };
  let res = S.applyRun(p, r); p = res.p; const first = res.pts;
  assert.equal(first, 3 * 10 + 30 + 50); // acertos + perfeita + fase
  for (let i = 0; i < 50; i++) p = S.applyRun(p, r).p; assert.equal(S.points(p), first);
  p = S.applyRun(p, { ...r, right: 1 }).p; assert.equal(S.points(p), first, 'pior desempenho não tira nem soma');
  p = S.applyRun(p, { ...r, mode: 'imagens' }).p; assert.equal(S.points(p), first + 30 + 30, 'outro formato soma acertos e perfeita, mas a fase só conta 1×');
});

test('mundo concluído e duelo valem bônus uma vez só', () => {
  let p = S.norm(); for (let n = 1; n <= 6; n++) p = S.applyRun(p, { world: 'duel', n, mode: 'nomes', right: 8, total: 8, sudden: n >= 5 }).p;
  assert.equal(p.wdone.duel > 0, true);
  const pts = S.points(p); assert.equal(pts, 6 * (80 + 30 + 50) + 200);
  for (let i = 0; i < 5; i++) p = S.applyRun(p, { world: 'duel', n: 6, mode: 'nomes', right: 8, total: 8, sudden: true }).p; assert.equal(S.points(p), pts);
});

test('fases "sem errar" exigem 100%; com tempo/need respeitam o mínimo', () => {
  let r = S.applyRun(S.norm(), { world: 'drumF', n: 11, mode: 'nomes', right: 5, total: 6, sudden: true, need: 1 }); assert.equal(r.passed, false); assert.equal(r.p.done['drumF:11'], undefined);
  r = S.applyRun(S.norm(), { world: 'drumF', n: 12, mode: 'nomes', right: 6, total: 8, need: 0.8 }); assert.equal(r.passed, false);
  r = S.applyRun(S.norm(), { world: 'drumF', n: 12, mode: 'nomes', right: 7, total: 8, need: 0.8 }); assert.equal(r.passed, true);
});

test('migração do jogo antigo só abre fases (sem estrelas, pontos ou títulos)', () => {
  const p = S.migrate(S.norm(), 5); assert.equal(S.points(p), 0); assert.equal(S.titleName(p), ''); assert.equal(S.unlocked(p, 'drumF', 4), true); assert.equal(S.unlocked(p, 'drumF', 5), false);
  assert.equal(S.unlocked(S.migrate(S.norm(), 0), 'drumF', 2), false);
});

test('dificuldades e reforço', () => {
  let p = S.applyRun(S.norm(), { world: 'drumF', n: 2, mode: 'nomes', right: 1, total: 3, misses: ['peca:rd', 'peca:rd', 'nota:mi4', 'oitava'] }).p;
  const d = S.difficulties(p); assert.equal(d.pecas[0].tag, 'peca:rd'); assert.equal(d.pecas[0].c, 2);
  for (const tag of ['peca:rd', 'combo:hh+bd', 'fig:colcheia', 'nota:mi4', 'nota:sol2', 'oitava', 'clave', 'sequencia', 'art:sg']) { const q = reinforceQuestion(tag, 'nomes', seeded(4)); assert.ok(q && q.options.some((o) => o.id === q.ans), tag); }
  p = S.relief(p, ['peca:rd']); assert.equal(p.miss['peca:rd'], 1);
});

test('ranking: código curto cabe na coluna (2 caracteres) e decodifica', () => {
  let p = S.start(S.norm()); assert.equal(S.rankCode(p).length, 2); assert.equal(S.decodeRank(S.rankCode(p)).title, 'Aprendiz da pauLta');
});

test('pacotinho da pauLta: tamanho certo, mesmo id = mesmas cartas, e Beaterista só quando a chance existe', async () => {
  const fs = await import('node:fs'); const L = await import('../js/figurinhas/album-logic.js');
  const cat = JSON.parse(fs.readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url), 'utf8')); const lista = cat.figurinhas || cat.items || cat;
  assert.equal(L.packSize('pl:3:20:x:F:fim:a'), 3); assert.equal(L.packSize('pl:1:0:x:F:m:3'), 1); assert.equal(L.packSize('abc'), L.PACK_SIZE);
  for (const [n, id] of [[1, 'pl:1:0:x:F:m:3'], [2, 'pl:2:12:x:I:fim:b'], [3, 'pl:3:20:x:F:fim:a'], [4, 'pl:4:25:x:D:fim:a']]) {
    const a = L.drawPack(lista, id); assert.equal(a.length, n); assert.equal(new Set(a).size, n); assert.deepEqual(L.drawPack(lista, id), a);
  }
  let bea = 0; for (let k = 0; k < 200; k++) bea += L.drawPack(lista, `pl:3:20:x:t:${k}`).filter((c) => lista.find((x) => x.codigo === c).secao === 'Beaterista').length;
  assert.ok(bea > 0, 'com chance, às vezes vem Beaterista');
  for (let k = 0; k < 100; k++) assert.ok(L.drawPack(lista, `pl:3:0:x:t:${k}`).every((c) => lista.find((x) => x.codigo === c).secao !== 'Beaterista'), 'sem chance, nunca vem');
});
