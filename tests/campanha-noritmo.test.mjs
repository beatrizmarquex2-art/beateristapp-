import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';
import mod, { spec, STYLES, ALL_SONGS, FAST_SONGS, bpmOf, MIN_BPM, evaluateWith, matches, pctOf } from '../js/campanha/jogos/noritmo.js';
import { checkSpec, applyResult, blankGame, isUnlocked, statusOf, allMedals } from '../js/campanha/engine.js';
import { THEMES } from '../js/campanha/themes.js';
import { LOADERS } from '../js/campanha/registry.js';

// resultado "como o motor entrega no fim da música" para a missão m
const res = (m, o = {}) => { const p = m.params; const [s, t] = p.songs[0]; return { finished: true, lost: false, game: p.game, keys: p.keys, diff: p.diff, maxLen: p.maxLen, style: s, tier: t, songName: 'Teste', acc: 1, maxCombo: 999, total: 300, ...o }; };

test('spec válido, 11 missões, ids estáveis, tema existente, registrado no registry', () => {
  assert.ok(checkSpec(spec).ok); assert.equal(spec.missions.length, 11); assert.ok(THEMES[spec.theme]); assert.equal(spec.id, 'noritmo'); assert.ok(LOADERS.noritmo);
  assert.deepEqual(spec.missions.map((m) => m.id), Array.from({ length: 11 }, (_, i) => `noritmo-${String(i).padStart(2, '0')}`));
  assert.equal(mod.spec, spec); assert.equal(typeof mod.mount, 'function');
});
test('só usa jogos, teclas, dificuldades, durações e músicas que o motor tem (6 estilos x 3 velocidades)', () => {
  const src = fs.readFileSync(new URL('../assets/rhythm-games/rhythm-games.js', import.meta.url), 'utf8');
  assert.equal(ALL_SONGS.length, 18);
  for (const s of STYLES) assert.ok(new RegExp(`${s}:\\[`).test(src), `estilo ${s} no motor`); // a Aventura não está ligada: ela ainda usa os 6 estilos antigos do gerador (o menu mostra rock, pop, reggaeton, blues e lo-fi)
  for (const m of spec.missions) {
    const p = m.params; assert.ok(['beat', 'tiles'].includes(p.game)); assert.ok(['facil', 'medio', 'dificil'].includes(p.diff));
    if (p.game === 'beat') { assert.ok([3, 4, 5].includes(p.keys)); assert.ok([60, 120].includes(p.maxLen)); }
    for (const [s, t] of p.songs) { assert.ok(STYLES.includes(s)); assert.ok([0, 1, 2].includes(t)); }
    assert.ok(p.min > 0 && p.min < p.s2 && p.s2 < p.s3 && p.s3 <= 100, 'limiares crescentes');
    assert.equal(m.stars.length, 3); assert.ok(m.stars[0].includes(`${p.min}%`) && m.stars[1].includes(`${p.s2}%`) && m.stars[2].includes(`${p.s3}%`), 'texto bate com os números');
  }
});
test('só músicas rápidas: toda missão usa músicas com bpm >= MIN_BPM e a última aceita todas as rápidas', () => {
  assert.equal(spec.missions.at(-1).params.songs.length, FAST_SONGS.length); assert.ok(FAST_SONGS.length >= 3);
  for (const m of spec.missions) for (const [s, t] of m.params.songs) assert.ok(bpmOf(s, t) >= MIN_BPM, `${m.id} ${s}/${t}`);
  assert.ok(spec.missions.every((m) => m.params.songs.length >= 1));
});
test('abrir/iniciar nunca conclui: resultado vazio, nulo, sem fim, perdido ou de outra missão não conclui', () => {
  for (const m of spec.missions) {
    for (const r of [null, undefined, {}, 'x', res(m, { finished: false }), res(m, { lost: true }), res(m, { game: m.params.game === 'beat' ? 'tiles' : 'beat' }), res(m, { diff: m.params.diff === 'facil' ? 'dificil' : 'facil' }), res(m, { style: 'xxx' }), res(m, { acc: 0 }), res(m, { acc: (m.params.min - 1) / 100 })]) {
      const ev = m.evaluate(r, m); assert.equal(ev.done, false, `${m.id} ${JSON.stringify(r)}`); assert.equal(ev.stars, 0);
    }
    assert.equal(applyResult(blankGame(), spec, m.id, null).g.m[m.id].s, 0);
  }
  const b = spec.missions.find((m) => m.params.game === 'beat'); assert.equal(b.evaluate(res(b, { keys: b.params.keys === 5 ? 3 : 5 }), b).done, false);
  assert.equal(b.evaluate(res(b, { maxLen: b.params.maxLen === 60 ? 120 : 60 }), b).done, false);
});
test('estrelas pela precisão do motor: limiares exatos, arredondando pra baixo', () => {
  for (const m of spec.missions) {
    const p = m.params; const ev = (pct, o) => m.evaluate(res(m, { acc: pct / 100, ...o }), m);
    assert.equal(ev(p.min - 0.1).done, false); assert.equal(pctOf((p.min - 0.1) / 100), p.min - 1);
    assert.equal(ev(p.min).stars, 1); assert.equal(ev(p.s2 - 1).stars, 1); assert.equal(ev(p.s2).stars, 2); assert.equal(ev(p.s3 - 1).stars, 2); assert.equal(ev(p.s3).stars, 3); assert.equal(ev(100).stars, 3);
    assert.match(ev(p.s3).label, /precisão/);
  }
});
test('missão de combo exige a sequência além da precisão', () => {
  const m = spec.missions.find((x) => x.params.combo); assert.ok(m);
  assert.equal(m.evaluate(res(m, { acc: 1, maxCombo: m.params.combo - 1 }), m).done, false);
  assert.equal(m.evaluate(res(m, { acc: 1, maxCombo: m.params.combo }), m).stars, 3);
  assert.equal(m.evaluate(res(m, { acc: m.params.min / 100, maxCombo: 500 }), m).stars, 1);
});
test('Piano Hero: perder os corações (lost) não conclui, mesmo com boa precisão parcial', () => {
  for (const m of spec.missions.filter((x) => x.params.game === 'tiles')) assert.equal(m.evaluate(res(m, { lost: true, acc: 0.95 }), m).done, false);
});
test('Grande Palco aceita qualquer das músicas rápidas, mas só no difícil de 2 min', () => {
  const m = spec.missions.at(-1);
  for (const [s, t] of FAST_SONGS) assert.equal(m.evaluate(res(m, { style: s, tier: t, acc: 0.9 }), m).stars, 2);
  assert.equal(m.evaluate(res(m, { diff: 'medio' }), m).done, false);
});
test('desbloqueio pelo motor: só a ordem dos desafios; falhar não destrava; concluir destrava a próxima', () => {
  let g = blankGame(); assert.ok(isUnlocked(spec, g, 0)); assert.ok(!isUnlocked(spec, g, 1));
  const m0 = spec.missions[0]; g = applyResult(g, spec, m0.id, res(m0, { acc: 0.1 })).g; assert.ok(!isUnlocked(spec, g, 1));
  const r = applyResult(g, spec, m0.id, res(m0, { acc: 0.9 })); assert.ok(r.done && r.firstTime); assert.ok(isUnlocked(spec, r.g, 1)); assert.ok(!isUnlocked(spec, r.g, 2));
  assert.equal(statusOf(spec, r.g).filter((x) => x.unlocked).length, 2);
});
test('medalhas: ids únicos, ganhas só com progresso real', () => {
  const ids = allMedals(spec).map((x) => x.id); assert.equal(new Set(ids).size, ids.length);
  let g = blankGame(); for (const m of spec.missions) g = applyResult(g, spec, m.id, res(m, { acc: 1 })).g;
  assert.equal(g.medals.length, ids.length, 'tudo perfeito ganha todas'); assert.deepEqual(applyResult(blankGame(), spec, spec.missions[4].id, res(spec.missions[4], { acc: 1 })).g.medals.sort(), ['first']);
});
test('modo livre intacto: o pacote só muda de comportamento com opts.mission e a aventura não grava preferências/recordes/ranking/figurinhas', () => {
  const src = fs.readFileSync(new URL('../assets/rhythm-games/rhythm-games.js', import.meta.url), 'utf8');
  assert.ok(src.includes('S.record=!MISSION&&'), 'recorde só no livre'); assert.ok(src.includes("if(!MISSION&&!lost&&RZ.game==='beat'&&S.stars>0)"), 'figurinhas só no livre');
  assert.ok(src.includes('if(!MISSION&&!lost&&OPTS.hallTop&&OPTS.autoName'), 'ranking só no livre'); assert.ok(src.includes('function save(){clearTimeout(saveT);if(MISSION) return;'), 'sem gravar o armazenamento na aventura');
  assert.ok(src.includes('function rzSaveOpts(){if(MISSION) return;'), 'sem gravar preferências');
  const j = fs.readFileSync(new URL('../js/views/jogos-ritmo.js', import.meta.url), 'utf8');
  assert.ok(j.includes("opts.parts[0] === 'aventura'") && !j.includes('href: \'#/ritmo/aventura\''), 'o botão do Modo Aventura do Beat Hero foi removido (link antigo só volta pro jogo)');
});
