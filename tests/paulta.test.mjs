import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, phaseSpec, WORLDS, MODES, teachOf, reinforceQuestion, notePool } from '../js/paulta/worlds.js';
import { noteName, posOf, placeText, sameSpotOther, mk, seeded, CLEFS } from '../js/paulta/music.js';
import * as S from '../js/paulta/score.js';

const ALL = [['drum', 18], ['sol', 15], ['fa', 15], ['duel', 6]];

test('todas as fases (54) geram perguntas válidas nos dois formatos', () => {
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

test('quantidade de fases e rodadas conforme o pedido', () => {
  assert.equal(WORLDS.drum.count, 18); assert.equal(WORLDS.sol.count, 15); assert.equal(WORLDS.fa.count, 15); assert.equal(WORLDS.duel.count, 6);
  const r = Array.from({ length: 18 }, (_, i) => phaseSpec('drum', i + 1).rounds);
  assert.deepEqual(r, [3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6, 5, 5, 6, 6, 7, 8]);
  assert.equal(phaseSpec('drum', 12).secs, 12); assert.equal(phaseSpec('drum', 11).sudden, true); assert.equal(phaseSpec('drum', 3).optSecs, 12);
  assert.equal(phaseSpec('drum', 1).secs, null); assert.equal(phaseSpec('duel', 6).rounds, 8); assert.equal(phaseSpec('duel', 6).secs, 10); assert.equal(phaseSpec('duel', 6).sudden, true);
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
  assert.deepEqual(teachOf('drum', 1), ['bd', 'sn', 'hh']); assert.deepEqual(teachOf('drum', 2), ['rd', 'cr']); assert.deepEqual(teachOf('drum', 3), ['tt', 'ft']);
  assert.ok(teachOf('sol', 2).length === 3);
});

test('desbloqueio: mundos independentes; duelo só com sol e fá (sem exigir bateria)', () => {
  let p = S.norm();
  assert.equal(S.unlocked(p, 'drum', 1), true); assert.equal(S.unlocked(p, 'sol', 1), true); assert.equal(S.unlocked(p, 'fa', 1), true);
  assert.equal(S.unlocked(p, 'drum', 2), false); assert.equal(S.unlocked(p, 'duel', 1), false);
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
  for (let n = 1; n <= 4; n++) p = run(p, 'drum', n); assert.equal(S.titleName(p), 'Aprendiz da pauLta');
  p = run(p, 'drum', 5); assert.equal(S.titleName(p), 'Explorador da pauLta');
  for (let n = 6; n <= 18; n++) p = run(p, 'drum', n); assert.equal(S.titleName(p), 'Leitor Musical');
  for (let n = 1; n <= 15; n++) p = run(p, 'sol', n); assert.equal(S.titleName(p), 'Especialista da pauLta');
  for (let n = 1; n <= 15; n++) p = run(p, 'fa', n); assert.equal(S.titleName(p), 'Especialista da pauLta', 'três mundos sem o duelo final ainda não é mestre');
  for (let n = 1; n <= 5; n++) p = run(p, 'duel', n); assert.equal(S.titleName(p), 'Especialista da pauLta');
  p = run(p, 'duel', 6); assert.equal(S.titleName(p), 'Mestre da pauLta');
  assert.ok(p.titles.mestre && p.titles.leitor && p.titles.aprendiz);
});

test('pontos: sem acumular repetindo fases', () => {
  let p = S.norm(); const r = { world: 'drum', n: 1, mode: 'nomes', right: 3, total: 3 };
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
  let r = S.applyRun(S.norm(), { world: 'drum', n: 11, mode: 'nomes', right: 5, total: 6, sudden: true, need: 1 }); assert.equal(r.passed, false); assert.equal(r.p.done['drum:11'], undefined);
  r = S.applyRun(S.norm(), { world: 'drum', n: 18, mode: 'nomes', right: 6, total: 8, need: 0.8 }); assert.equal(r.passed, false);
  r = S.applyRun(S.norm(), { world: 'drum', n: 18, mode: 'nomes', right: 7, total: 8, need: 0.8 }); assert.equal(r.passed, true);
});

test('migração do jogo antigo só abre fases (sem estrelas, pontos ou títulos)', () => {
  const p = S.migrate(S.norm(), 5); assert.equal(S.points(p), 0); assert.equal(S.titleName(p), ''); assert.equal(S.unlocked(p, 'drum', 4), true); assert.equal(S.unlocked(p, 'drum', 5), false);
  assert.equal(S.unlocked(S.migrate(S.norm(), 0), 'drum', 2), false);
});

test('dificuldades e reforço', () => {
  let p = S.applyRun(S.norm(), { world: 'drum', n: 2, mode: 'nomes', right: 1, total: 3, misses: ['peca:rd', 'peca:rd', 'nota:mi4', 'oitava'] }).p;
  const d = S.difficulties(p); assert.equal(d.pecas[0].tag, 'peca:rd'); assert.equal(d.pecas[0].c, 2);
  for (const tag of ['peca:rd', 'combo:hh+bd', 'fig:colcheia', 'nota:mi4', 'nota:sol2', 'oitava', 'clave', 'sequencia', 'art:sg']) { const q = reinforceQuestion(tag, 'nomes', seeded(4)); assert.ok(q && q.options.some((o) => o.id === q.ans), tag); }
  p = S.relief(p, ['peca:rd']); assert.equal(p.miss['peca:rd'], 1);
});

test('ranking: código curto cabe na coluna (2 caracteres) e decodifica', () => {
  let p = S.start(S.norm()); assert.equal(S.rankCode(p).length, 2); assert.equal(S.decodeRank(S.rankCode(p)).title, 'Aprendiz da pauLta');
});
