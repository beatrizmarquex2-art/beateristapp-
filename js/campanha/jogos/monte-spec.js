// Spec do Modo Aventura do Monte Seu Ritmo (PURO). Cada missão é um DESAFIO DE COMPOSIÇÃO: o jogador monta compassos de 4 tempos com as cartas que já existem
// (pão, bolo, chocolate, shhh…) e a validação confere a ESTRUTURA rítmica (monte-logic.js#check), não uma resposta fixa. Só "Sequência pedida" tem uma única forma.
// Estrelas: ★ cumprir os requisitos · ★★ cumprir também o desafio extra · ★★★ o extra sem errar nenhuma conferência (result.wrong === 0).
import { P, B, C, R, FOOD_OF_CELL, check, mergeReq, CELL_SHORT } from './monte-logic.js';

const ALL3 = [P, B, R];
// [id, título, tag, objetivo, req, extra]
const DEF = [
  ['monte-00', 'Complete o compasso', 'completar', 'complete o compasso: faltam só o último tempo', { fixed: { 0: P, 1: P, 2: P }, cells: ALL3 }, { minRests: 1 }, 'termine com um shhh (pausa)'],
  ['monte-01', 'Pão e bolo', '2 figuras', 'monte 4 tempos usando pão e bolo', { cells: ALL3, use: [P, B] }, { minRests: 1 }, 'use também um shhh'],
  ['monte-02', 'Silêncio também é música', 'pausa', 'monte 4 tempos com pelo menos um shhh, começando com som', { cells: ALL3, minRests: 1, startSound: true }, { minDistinct: 2 }, 'use pão e bolo no mesmo compasso'],
  ['monte-03', 'Compasso incompleto', 'completar', 'complete os tempos livres: o compasso precisa de uma pausa', { fixed: { 0: B, 2: P }, cells: ALL3, minRests: 1 }, { endRest: true }, 'termine com shhh'],
  ['monte-04', 'Combinando durações', 'durações', 'misture pelo menos duas durações diferentes e uma pausa', { minDistinct: 2, minRests: 1 }, { minDistinct: 3 }, 'use as três durações (pão, bolo e chocolate)'],
  ['monte-05', 'Chocolate!', 'semicolcheias', 'monte um compasso que tenha chocolate (4 semicolcheias)', { use: [C] }, { use: [B], minRests: 1 }, 'use também bolo e um shhh'],
  ['monte-06', 'Sequência pedida', 'sequência', 'monte exatamente: bolo, pão, chocolate, shhh', { sequence: [B, P, C, R] }, { listened: true }, 'ouça o ritmo (▶ tocar) antes de conferir'],
  ['monte-07', 'Dois compassos', '2 compassos', 'monte 2 compassos: cada um começa com som e tem uma pausa', { bars: 2, startSound: true, barRest: true }, { minDistinct: 3 }, 'use as três durações no total'],
  ['monte-08', 'Compasso espelho', 'repetir', 'monte 2 compassos iguais, com chocolate, pausa e duas durações', { bars: 2, repeatBar: true, use: [C], minRests: 1, minDistinct: 2 }, { allDistinct: true }, 'use pão, bolo, chocolate e shhh'],
  ['monte-09', 'Pergunta e resposta', 'resposta', 'o 1º compasso já está pronto: responda com outro compasso, que começa com som e termina com shhh', { bars: 2, fixed: { 0: B, 1: P, 2: C, 3: R }, startSound: true, endRest: true, differentBars: true }, { barMinDistinct: 3 }, 'use 3 durações diferentes na sua resposta'],
  ['monte-10', 'Desafio final', 'final', 'componha 2 compassos usando pão, bolo, chocolate e shhh; cada um começa com som e tem pausa, e o final é silêncio', { bars: 2, allDistinct: true, startSound: true, barRest: true, endRest: true, minCount: { [C]: 2 }, minDistinct: 3 }, { barMinDistinct: 3, differentBars: true }, 'use 3 durações diferentes em cada compasso e deixe os dois compassos diferentes'],
];

function build([id, title, tag, goal, req, extra, extraTxt]) {
  const full = mergeReq(req, extra); const reqLabels = (r) => check([], r).checks.filter((c) => !c.hidden && c.key !== 'complete').map((c) => c.label);
  const fixed = Object.fromEntries(Object.entries(req.fixed || {}).map(([i, c]) => [i, FOOD_OF_CELL[c]]));
  return {
    id, title, tag, goal: `${goal}.`,
    rules: [
      `${req.bars > 1 ? `${req.bars} compassos de 4 tempos` : 'Um compasso tem 4 tempos'}: cada carta é um tempo, e todos os tempos precisam ser preenchidos.`,
      ...reqLabels(req).map((l) => `Requisito: ${l}.`),
      ...(req.fixed ? ['Os tempos com 🔒 já vêm prontos e não saem do lugar.'] : []),
      'Há várias respostas certas: pão, céu, mão e cão valem igual (e o mesmo vale para bolo, bola, braço, pato e para as palavras de chocolate).',
    ],
    stars: ['cumprir todos os requisitos', `além disso, o desafio extra: ${extraTxt}`, 'o desafio extra e nenhum erro ao conferir'],
    params: { req, extra: full, fixed, bars: req.bars || 1, cells: req.cells || [P, B, C, R], extraTxt },
    evaluate(r) {
      if (!r || !Array.isArray(r.slots)) return { done: false, stars: 0, summary: ['nenhum ritmo foi conferido'] };
      const ctx = { plays: Number(r.plays) || 0 }; const base = check(r.slots, req, ctx);
      if (!base.ok) return { done: false, stars: 0, summary: ['o ritmo ainda não cumpre: ' + base.checks.filter((c) => !c.ok && !c.hidden).map((c) => c.label).join('; ')] };
      const ex = check(r.slots, full, ctx).ok; const wrong = Math.max(0, Math.floor(Number(r.wrong) || 0));
      const stars = ex ? (wrong === 0 ? 3 : 2) : 1;
      const rhythm = base.facts.cells.map((c) => CELL_SHORT[c]).join(' · ');
      const summary = [`seu ritmo: ${rhythm}`, wrong ? `${wrong} conferência${wrong === 1 ? '' : 's'} sem acertar antes` : 'acertou de primeira'];
      summary.push(ex ? `desafio extra cumprido (${extraTxt})` : `desafio extra: ${extraTxt}`);
      return { done: true, stars, summary, label: ['★', '★★', '★★★'][stars - 1] };
    },
  };
}

export const spec = {
  id: 'monte', title: 'Monte Seu Ritmo', theme: 'monte',
  missions: DEF.map(build),
  medals: [
    { id: 'monte-pausa', title: 'Dono do silêncio', desc: 'conclua as missões de pausa (2 e 3)', icon: '🤫', test: (g) => ['monte-02', 'monte-03'].every((id) => ((g.m[id] || {}).s || 0) >= 1) },
    { id: 'monte-compositor', title: 'Compositor', desc: 'conclua o desafio final', icon: '🎼', test: (g) => ((g.m['monte-10'] || {}).s || 0) >= 1 },
    { id: 'monte-extras', title: 'Desafio extra em dia', desc: '2 estrelas ou mais em 5 missões', icon: '⭐', test: (g) => Object.values(g.m).filter((x) => x.s >= 2).length >= 5 },
  ],
};
export default spec;
