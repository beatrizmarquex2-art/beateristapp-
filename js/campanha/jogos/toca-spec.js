// Spec do Modo Aventura do Toca Aqui (PURO: sem tela, testável no node). 20 missões ("Escola do Ritmo"): 8 iniciante, 6 intermediário, 6 avançado,
// as MESMAS partituras do caminho do modo livre (PATH em js/reading.js), com o andamento subindo aos poucos.
// Uma missão = ler 1 compasso e tocar no tempo (na tela ou no microfone). A nota é a PRECISÃO (%) calculada por evaluate() de js/reading.js.
// Estrelas: 70% = 1★ (concluir), 85% = 2★, 95% = 3★. Só conta quando o jogo entrega um resultado real (tocou o compasso até o fim).
import { PATH, CELLS, TIERS, PASS_SCORE } from '../../reading.js';

export const STAR_AT = [PASS_SCORE, 85, 95]; // precisão mínima pra 1, 2 e 3 estrelas
const BPM = { ini: [60, 60, 64, 64, 68, 68, 72, 72], int: [66, 70, 74, 78, 82, 86], ava: [72, 76, 80, 84, 88, 92] };
const TIER_NAME = Object.fromEntries(TIERS.map((t) => [t.id, t.name]));
const N = (n) => String(n).padStart(2, '0');
const cellName = (p) => (CELLS.find((c) => c.p === p) || { name: p }).name;
const uniq = (a) => [...new Set(a)];
const TITLES = {
  ini: ['Só semínimas', 'Uma pausa no meio', 'Pausa no fim', 'Entram as colcheias', 'Colcheias no começo', 'Mistura de colcheias', 'Pausa e colcheias', 'Colcheias firmes'],
  int: ['Primeiras semicolcheias', 'Semicolcheias e colcheias', 'Semicolcheias dobradas', 'Colcheia + duas semis', 'Pausa de colcheia', 'Compasso das semicolcheias'],
  ava: ['Colcheia pontuada', 'Semi + colcheia pontuada', 'Semi, colcheia, semi', 'Pausa de semicolcheia', 'Variações juntas', 'Desafio final'],
};

/** Nota (0..3) pela precisão (%). Pura: usada pelo evaluate e pelos testes. */
export const starsFor = (score) => (Number.isFinite(score) ? STAR_AT.reduce((s, min, i) => (score >= min ? i + 1 : s), 0) : 0);

function build(step, i) {
  const idx = PATH.slice(0, i).filter((x) => x.tier === step.tier).length; const bpm = BPM[step.tier][idx];
  const names = uniq(step.bar.map(cellName)); const tier = TIER_NAME[step.tier];
  const title = TITLES[step.tier][idx];
  return {
    id: `toca-${N(i)}`, title, tag: `${tier} ${step.n}/${step.of}`, goal: `leia a partitura e toque o compasso a ${bpm} BPM com pelo menos ${STAR_AT[0]}% de precisão.`,
    rules: [
      `modo ${tier}: ${names.join(', ')}.`, 'toque na tela ou no microfone (pad de estudo ou bateria). Depois da contagem, toque junto com o clique.',
      'dá pra ouvir o ritmo antes (“ouvir e depois tocar”) ou ir direto pra sua vez.', 'a precisão mede o quanto cada toque caiu no tempo certo; toque a mais fora da hora tira pontos.',
    ],
    stars: [`${STAR_AT[0]}% de precisão ou mais`, `${STAR_AT[1]}% ou mais`, `${STAR_AT[2]}% ou mais`],
    params: { tier: step.tier, step: i, bar: step.bar.slice(), bpm, lv: step.lv },
    evaluate(r) {
      const ok = r && r.ok === true && Number.isFinite(r.score) && Array.isArray(r.cells) && r.cells.join() === step.bar.join() && r.bpm === bpm;
      if (!ok) return { done: false, stars: 0, summary: ['o compasso não foi tocado até o fim'] };
      const stars = starsFor(r.score); const sum = [`precisão ${r.score}% · ${r.hits}/${r.total} notas${r.extra ? ` · ${r.extra} a mais` : ''}`];
      if (Number.isFinite(r.avgMs) && r.hits) sum.push(`média ${r.avgMs > 0 ? '+' : ''}${r.avgMs} ms (${Math.abs(r.avgMs) <= 15 ? 'no tempo' : r.avgMs < 0 ? 'adiantado' : 'atrasado'})`);
      if (stars === 0) sum.push(`pra concluir: ${STAR_AT[0]}% de precisão`); else if (stars < 3) sum.push(`pra mais uma estrela: ${STAR_AT[stars]}%`);
      return { done: stars >= 1, stars, summary: sum, label: `${r.score}%` };
    },
  };
}
const missions = PATH.map(build);
const ids = (tier) => missions.filter((m) => m.params.tier === tier).map((m) => m.id);
const all3 = (tier) => (g) => ids(tier).every((id) => ((g.m[id] || {}).s || 0) >= 3);

export const spec = {
  id: 'toca', title: 'Toca Aqui', theme: 'toca', missions,
  medals: [
    { id: 'toca-ini', title: 'Mestre iniciante', desc: '3 estrelas nos 8 exercícios iniciantes', icon: '🥁', test: all3('ini') },
    { id: 'toca-int', title: 'Mestre das semis', desc: '3 estrelas nos 6 exercícios intermediários', icon: '🎶', test: all3('int') },
    { id: 'toca-ava', title: 'Mestre avançado', desc: '3 estrelas nos 6 exercícios avançados', icon: '🎼', test: all3('ava') },
  ],
};
