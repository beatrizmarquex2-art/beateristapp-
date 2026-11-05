// Modo Aventura do Uno Musical: dez partidas contra o computador, com adversários de estilos diferentes (todos com as regras reais do jogo).
// A partida de cada missão usa uma SEMENTE fixa (mesmas cartas toda vez); o que muda é o que o jogador decide. Quem mede: cartas-logic.js (track/matchResult).
import * as G from '../../jogos/cartas.js';

/** Limites de uma meta: vencer E (comprar ≤ maxDraws vezes) E (≤ maxRounds rodadas) E (≥ minSpecials cartas especiais jogadas). */
const lim = (o) => o || {};
export const meets = (r, l) => !!r && !!r.won && (l.maxDraws == null || r.draws <= l.maxDraws) && (l.maxRounds == null || r.rounds <= l.maxRounds) && (l.minSpecials == null || r.specials >= l.minSpecials);
const plural = (n, a, b) => (n === 1 ? a : b);
const extras = (l) => [l.minSpecials != null ? `jogando ${l.minSpecials} ou mais cartas especiais` : null,
  l.maxDraws != null ? (l.maxDraws === 0 ? 'sem comprar nenhuma carta' : `comprando no máximo ${l.maxDraws} ${plural(l.maxDraws, 'vez', 'vezes')}`) : null,
  l.maxRounds != null ? `em até ${l.maxRounds} rodadas` : null].filter(Boolean);
export const limText = (l) => ['vencer', ...extras(l)].join(', ');

export const OPP = {
  distraido: { name: 'Paul distraído', how: 'joga qualquer carta que serve, sem pensar.' },
  paul: { name: 'Paul', how: 'prefere cartas de ação (+2, pular, inverter).' },
  guardiao: { name: 'Paul guardião', how: 'guarda as cartas especiais pro fim e só as usa quando você está quase ganhando.' },
  pintor: { name: 'Paul pintor', how: 'joga primeiro as cores que tem pouco, pra ficar com uma cor só.' },
  esperto: { name: 'Paul estrategista', how: 'usa ações cedo, escolhe bem a cor e guarda o curinga; corta a sua vez se você estiver perto de ganhar.' },
};

// [id, título, tag, estilo, dica, semente, meta (1★), meta 2★, meta 3★, objetivo]
const DEF = [
  ['Aquecimento', 'vs distraído', 'distraido', true, 1, {}, { maxDraws: 3 }, { maxDraws: 1 }],
  ['Combinando cores', 'vs distraído', 'distraido', true, 1, {}, { minSpecials: 2 }, { minSpecials: 3, maxDraws: 2 }],
  ['O Paul de sempre', 'vs Paul', 'paul', true, 1, {}, { maxDraws: 4 }, { maxDraws: 2 }],
  ['Guarda-costas', 'vs guardião', 'guardiao', true, 1, {}, { maxRounds: 12 }, { maxRounds: 9 }],
  ['Cor única', 'vs pintor', 'pintor', true, 1, {}, { maxDraws: 3 }, { maxDraws: 1 }],
  ['Mãos especiais', '3 especiais', 'paul', true, 1, { minSpecials: 3 }, { minSpecials: 4 }, { minSpecials: 5 }],
  ['Relâmpago', 'rápido', 'guardiao', true, 1, { maxRounds: 11 }, { maxRounds: 9 }, { maxRounds: 7 }],
  ['Sem comprar', 'poucas compras', 'pintor', false, 1, { maxDraws: 2 }, { maxDraws: 1 }, { maxDraws: 0 }],
  ['O estrategista', 'sem dica', 'esperto', false, 1, {}, { maxDraws: 4 }, { minSpecials: 2, maxDraws: 2 }],
  ['Final da turnê', 'desafio final', 'esperto', false, 1, { maxDraws: 3, minSpecials: 2 }, { maxDraws: 2, minSpecials: 3 }, { maxDraws: 1, minSpecials: 3, maxRounds: 10 }],
];
export const SEEDS = [232, 237, 103, 296, 212, 275, 59, 90, 5, 169]; // escolhidas por simulação (ver tests/campanha-cartas.test.mjs): partida viável e com as metas de 2★/3★ alcançáveis

const mission = ([title, tag, style, hint, , l1, l2, l3], i) => {
  const o = OPP[style]; const L1 = lim(l1), L2 = { ...L1, ...lim(l2) }, L3 = { ...L2, ...lim(l3) };
  const goal = [`vença o ${o.name}`, ...extras(L1)].join(', ');
  const rules = [`adversário: ${o.name} — ${o.how}`, hint ? 'as cartas que servem ficam destacadas.' : 'sem dica: você precisa achar sozinho as cartas que servem.', 'as regras são as do Uno Musical de sempre: 7 cartas cada, vence quem esvaziar a mão.', 'a partida é a mesma a cada tentativa (mesmas cartas): quem pensa melhor, ganha.'];
  return {
    id: `cartas-${String(i).padStart(2, '0')}`, title, goal, tag, rules,
    stars: [limText(L1), `${limText(L2)}`, `${limText(L3)}`],
    params: { seed: SEEDS[i], style, hint, oppName: o.name, limits: [L1, L2, L3] },
    evaluate(r) {
      const won = !!r && !!r.won; const ok = meets(r, L1); const stars = !ok ? 0 : meets(r, L3) ? 3 : meets(r, L2) ? 2 : 1;
      const summary = [!r ? 'sem resultado' : won ? 'você venceu a partida!' : r.tie ? 'empate (jogo travado)' : `o ${o.name} venceu`];
      if (r) { summary.push(`rodadas: ${r.rounds} · compras: ${r.draws} · cartas especiais jogadas: ${r.specials}`); if (won && !ok) summary.push(`venceu, mas faltou a meta: ${limText(L1)}`); }
      return { done: ok, stars, summary, label: ok ? `${r.rounds} rodadas · ${r.draws} compras` : undefined };
    },
  };
};

export const spec = {
  id: 'cartas', title: 'Uno Musical', theme: 'cartas',
  missions: DEF.map(mission),
  medals: [
    { id: 'cartas-especiais', title: 'Mestre das especiais', desc: 'conclua a missão “Mãos especiais”', icon: '🃏', test: (g) => ((g.m['cartas-05'] || {}).s || 0) >= 1 },
    { id: 'cartas-relampago', title: 'Relâmpago', desc: 'conclua a missão “Relâmpago”', icon: '⚡', test: (g) => ((g.m['cartas-06'] || {}).s || 0) >= 1 },
    { id: 'cartas-sem-comprar', title: 'Mão limpa', desc: 'consiga 3 estrelas em “Sem comprar” (vencer sem comprar)', icon: '🧤', test: (g) => ((g.m['cartas-07'] || {}).s || 0) >= 3 },
    { id: 'cartas-estilos', title: 'Conhece todos os estilos', desc: 'vença o distraído, o Paul, o guardião, o pintor e o estrategista', icon: '🎭', test: (g) => ['cartas-00', 'cartas-02', 'cartas-03', 'cartas-04', 'cartas-08'].every((k) => ((g.m[k] || {}).s || 0) >= 1) },
    { id: 'cartas-final', title: 'Fim da turnê', desc: 'conclua o desafio final', icon: '🏆', test: (g) => ((g.m['cartas-09'] || {}).s || 0) >= 1 },
  ],
};

export function mount(body, opts) { return G.mount(body, opts); }
export default { spec, mount };
