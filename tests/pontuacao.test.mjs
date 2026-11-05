import test from 'node:test'; import assert from 'node:assert/strict';
import { PONTOS } from '../js/campanha/pontuacao.js';
const CAMP = ['cartas', 'bingo', 'stop', 'velha', 'quebra', 'cara', 'memoria', 'monte', 'noritmo'];
test('todo jogo com Aventura explica Modo Livre e Aventura (estrela, XP e figurinha)', () => {
  for (const id of CAMP) for (const m of ['livre', 'aventura']) { const g = PONTOS[id][m]; assert.ok(g, `${id}/${m}`); for (const k of ['estrelas', 'xp', 'figurinha']) { assert.equal(typeof g[k].sim, 'boolean', `${id}/${m}/${k}`); assert.ok(g[k].txt.length > 5); } }
});
test('os jogos de fases do Kids explicam estrelas (60/80/100%) e figurinha', () => {
  for (const id of ['pauta', 'figuras', 'eco']) { const g = PONTOS[id].fases; assert.ok(g.estrelas.sim && /60%/.test(g.estrelas.txt) && /80%/.test(g.estrelas.txt) && /100%/.test(g.estrelas.txt)); assert.ok(g.figurinha.sim); assert.equal(g.xp.sim, false); }
});
test('só o No Ritmo dá XP; nenhum jogo dá figurinha na Aventura (ainda)', () => {
  for (const id of CAMP) { assert.equal(PONTOS[id].aventura.xp.sim, id === 'noritmo', id); assert.equal(PONTOS[id].aventura.figurinha.sim, false, id); }
});
