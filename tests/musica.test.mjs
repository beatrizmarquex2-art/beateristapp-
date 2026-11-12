import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, trackDe } from '../js/jogos/musica-dados.js';

test('músicas escolhidas: 10 faixas, 16 passos em cada linha, bpm e notas válidos', () => {
  assert.deepEqual(Object.keys(TRACKS).sort(), ['beat', 'bingo', 'cara', 'figuras', 'memoria', 'paulta', 'quebra', 'toca', 'uno', 'velha']);
  for (const [id, p] of Object.entries(TRACKS)) {
    assert.ok(!p.duck || p.duck === true); assert.ok(p.bpm >= 60 && p.bpm <= 160, id); assert.equal(p.lead[2].length, 16, `${id} lead`); assert.equal(p.bass[3].length, 16, `${id} baixo`);
    for (const k of ['k', 's', 'h']) assert.equal(p.dr[k].length, 16, `${id} bateria ${k}`);
    for (const n of [...p.lead[2], ...p.bass[3]]) assert.ok(n === '.' || Number.isFinite(Number(n)), `${id} nota ${n}`);
    assert.ok(['sine', 'triangle', 'square', 'sawtooth'].includes(p.lead[0]) && ['sine', 'triangle', 'square', 'sawtooth'].includes(p.bass[0]), id);
  }
});
test('qual música em qual tela: Uno/UN🚫, Bingo, Velha, Quebra, Cara, Memória, Figuras e pauLta; STOP fica sem', () => {
  const casos = { '#/jogos/cartas': 'uno', '#/jogos/un': 'uno', '#/jogos/bingo/livre': 'bingo', '#/jogos/velha': 'velha', '#/jogos/quebra': 'quebra', '#/jogos/cara': 'cara', '#/jogos/memart': 'memoria', '#/kids/memoria/aventura': 'memoria', '#/kids/figuras/3': 'figuras', '#/paulta/drum': 'paulta', '#/paulta': 'paulta', '#/jogos/toca': 'toca', '#/ritmo': 'beat' };
  for (const [h, id] of Object.entries(casos)) assert.equal(trackDe(h), id, h);
  for (const h of ['#/jogos/stop', '#/ritmo/duelo', '#/jogos', '#/kids', '#/kids/ritmo/aventura', '#/jogos/cartas2', '']) assert.equal(trackDe(h), '', h);
});
