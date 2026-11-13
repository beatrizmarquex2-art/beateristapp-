// Modo Aventura do Jogo da Velha Musical ("Arena de Duelos"): sequência de duelos contra o Paul, cada missão = uma série de rodadas.
// O jogo real é js/jogos/velha.js (mount com opts.mission). Aqui ficam o spec, a avaliação pura e as medalhas.
//
// Adversários (o computador do jogo: "fácil" e "estratégico" já existiam; "bloqueia" é uma variação nova sobre as mesmas regras):
//   aleatoria   = joga numa casa vazia qualquer;
//   bloqueia    = fecha a própria linha se puder, senão tapa a linha do jogador, senão joga em qualquer casa;
//   estrategica = minimax completo: NUNCA perde (empatar com ele já é o melhor resultado possível; vencer é impossível).
// A partida começa com o jogador e a vez de começar alterna a cada rodada (regra do jogo).
// Perguntas: só as já aprovadas, do nível pedido (infantil / fácil / intermediário), sem repetir na rodada.
import { QUESTIONS } from '../../jogos/velha-data.js';
import * as mod from '../../jogos/velha.js';

const ID = 'velha';
const N = (n) => String(n).padStart(2, '0');
const plural = (n, a, b) => (n === 1 ? a : b);

/** Um nível de estrela é um conjunto de condições sobre o resumo da série: w = vitórias (mín.), l = derrotas (máx.), s = maior sequência de vitórias (mín.). */
export const meets = (tier, r) => (tier.w == null || r.wins >= tier.w) && (tier.l == null || r.losses <= tier.l) && (tier.s == null || r.bestStreak >= tier.s);
export function starsFor(tiers, r) { let s = 0; tiers.forEach((t, i) => { if (meets(t, r)) s = i + 1; }); return s; } // tiers em ordem crescente (cada um implica o anterior: ver testes)
const tierText = (t) => [t.w != null ? `${t.w} ${plural(t.w, 'vitória', 'vitórias')}` : null, t.s != null ? `${t.s} vitórias seguidas` : null, t.l != null ? (t.l === 0 ? 'nenhuma derrota' : `no máximo ${t.l} ${plural(t.l, 'derrota', 'derrotas')}`) : null].filter(Boolean).join(' e ');

const AI_NAME = { aleatoria: 'joga em qualquer casa', bloqueia: 'bloqueia suas linhas', estrategica: 'estratégico: não perde' };
const LV = { infantil: 'infantil', facil: 'fácil', intermediario: 'intermediário' };

// def: [título, tag, ai, variant, level, rodadas, tiers, dica]
const DEFS = [
  ['Aquecimento', 'clássico', 'aleatoria', 'classico', null, 3, [{ w: 1 }, { w: 2 }, { w: 3 }], 'o Paul joga em casas ao acaso: monte duas ameaças ao mesmo tempo.'],
  ['Primeira pergunta', 'infantil', 'aleatoria', 'desafio', 'infantil', 3, [{ w: 1 }, { w: 2 }, { w: 3 }], 'toque numa casa: responda certo para marcar. Errou? a casa continua vazia.'],
  ['Sequência', 'seguidas', 'aleatoria', 'desafio', 'infantil', 5, [{ s: 2 }, { s: 3 }, { s: 4 }], 'conta a maior sequência de vitórias seguidas dentro das 5 rodadas.'],
  ['Paul bloqueia', 'bloqueio', 'bloqueia', 'classico', null, 3, [{ w: 1 }, { w: 2 }, { w: 2, l: 0 }], 'ele tapa sua linha: crie duas ameaças de uma vez (um garfo).'],
  ['Bloqueio e perguntas', 'fácil', 'bloqueia', 'desafio', 'facil', 3, [{ w: 1 }, { w: 2 }, { w: 2, l: 0 }], 'agora vêm as perguntas de música (sem repetir na rodada).'],
  ['Placar alto', '5 rodadas', 'aleatoria', 'desafio', 'facil', 5, [{ w: 3 }, { w: 4 }, { w: 5 }], 'cinco rodadas seguidas valendo vitórias.'],
  ['Muralha', 'não perde', 'estrategica', 'classico', null, 4, [{ l: 2 }, { l: 1 }, { l: 0 }], 'o Paul estratégico nunca perde, então empatar já é ótimo. Foque em não deixá-lo fazer linha.'],
  ['Muralha com perguntas', 'fácil', 'estrategica', 'desafio', 'facil', 3, [{ l: 2 }, { l: 1 }, { l: 0 }], 'errar uma pergunta custa a vez: acerte pra segurar o empate.'],
  ['Intermediário', 'nível 3', 'bloqueia', 'desafio', 'intermediario', 3, [{ w: 1 }, { w: 2 }, { w: 2, l: 0 }], 'perguntas de música valendo a casa, sem pegar leve.'],
  ['Duelo final', 'chefão', 'estrategica', 'desafio', 'intermediario', 5, [{ l: 2 }, { l: 1 }, { l: 0 }], 'cinco rodadas contra o Paul estratégico com perguntas de música.'],
];

const starLine = (tiers) => tiers.map((t, k) => `${'★'.repeat(k + 1)}: ${tierText(t)}`);
function build([title, tag, ai, variant, level, rounds, tiers, tip], i) {
  const lose = tiers[0].w == null && tiers[0].s == null;
  const goal = lose ? `aguente ${rounds} rodadas sem perder mais que ${tiers[0].l} ${plural(tiers[0].l, 'vez', 'vezes')}` : tiers[0].s != null ? `faça ${tiers[0].s} vitórias seguidas em ${rounds} rodadas` : `vença ${tiers[0].w} ${plural(tiers[0].w, 'rodada', 'rodadas')} de ${rounds}`;
  return {
    id: `velha-${N(i)}`, title, goal: `${goal} contra o Paul`, tag, params: { ai, variant, level: level || undefined, rounds, vs: AI_NAME[ai] },
    rules: [
      `o Paul (${AI_NAME[ai]}), ${variant === 'desafio' ? 'perguntas de música: acertar marca a casa, errar passa a vez' : 'modo clássico: tocou, marcou'}.`,
      `são ${rounds} rodadas; quem começa alterna a cada rodada.`, tip,
      ...(ai === 'estrategica' ? ['vencer o Paul estratégico não é possível (ele joga perfeito): a meta é não perder.'] : []),
    ],
    stars: starLine(tiers), tiers,
    evaluate(r) {
      const x = normalize(r, rounds); const stars = starsFor(tiers, x); const done = stars >= 1;
      const summary = [`${x.wins} ${plural(x.wins, 'vitória', 'vitórias')}, ${x.draws} ${plural(x.draws, 'empate', 'empates')}, ${x.losses} ${plural(x.losses, 'derrota', 'derrotas')} em ${x.rounds} rodadas`];
      if (x.bestStreak >= 2) summary.push(`maior sequência de vitórias: ${x.bestStreak}`);
      if (x.answered) summary.push(`${x.correct} de ${x.answered} perguntas certas`);
      if (!done) summary.push(`pra concluir: ${tierText(tiers[0])}`);
      return { done, stars, summary, label: `${x.wins}V ${x.draws}E ${x.losses}D` };
    },
  };
}
/** Confere/recalcula o resumo a partir da lista de rodadas (W/D/L), para o evaluate nunca confiar em contas soltas. */
export function normalize(r, rounds) {
  const o = Array.isArray(r && r.outcomes) ? r.outcomes.filter((x) => x === 'W' || x === 'D' || x === 'L') : [];
  const wins = o.filter((x) => x === 'W').length; const losses = o.filter((x) => x === 'L').length; let best = 0; let run = 0;
  for (const x of o) { run = x === 'W' ? run + 1 : 0; best = Math.max(best, run); }
  return { rounds: o.length || rounds, wins, losses, draws: o.length - wins - losses, bestStreak: best, answered: Number(r && r.answered) || 0, correct: Number(r && r.correct) || 0, complete: o.length >= rounds };
}
const missions = DEFS.map(build);
// uma série incompleta nunca conclui (evaluate recebe só séries inteiras do jogo, mas protegemos)
missions.forEach((m) => { const ev = m.evaluate; m.evaluate = (r) => (normalize(r, m.params.rounds).complete ? ev(r) : { done: false, stars: 0, summary: ['a série não foi até o fim'] }); });

/** Maior sequência de tentativas concluídas seguidas, do histórico real (sem falha no meio). */
export const maxRun = (g) => { let best = 0; let run = 0; for (const e of g.log || []) { run = e.ok ? run + 1 : 0; best = Math.max(best, run); } return best; };
const st = (g, i) => (g.m[`velha-${N(i)}`] || {}).s || 0;
const threeRun = (g, n) => { let run = 0; for (let i = 0; i < missions.length; i++) { run = st(g, i) >= 3 ? run + 1 : 0; if (run >= n) return true; } return false; };

export const spec = {
  id: ID, title: 'Jogo da Velha Musical', theme: 'velha', missions,
  medals: [
    { id: 'velha-serie3', title: 'Três duelos seguidos', desc: 'conclua 3 missões em sequência, sem uma tentativa falha no meio', icon: '🔥', test: (g) => maxRun(g) >= 3 },
    { id: 'velha-serie6', title: 'Invicto', desc: 'conclua 6 missões em sequência, sem uma tentativa falha no meio', icon: '⚡', test: (g) => maxRun(g) >= 6 },
    { id: 'velha-ouro3', title: 'Trio de ouro', desc: 'consiga 3 estrelas em 3 missões seguidas', icon: '🏆', test: (g) => threeRun(g, 3) },
    { id: 'velha-muralha', title: 'Muralha', desc: 'não perca nenhuma rodada contra o Paul estratégico (3 estrelas na missão 6)', icon: '🛡️', test: (g) => st(g, 6) >= 3 },
    { id: 'velha-perguntas', title: 'Cabeça musical', desc: 'conclua todas as missões com perguntas (1, 2, 4, 5, 7, 8 e 9)', icon: '🎵', test: (g) => [1, 2, 4, 5, 7, 8, 9].every((i) => st(g, i) >= 1) },
  ],
};

export function mount(body, opts) { return mod.mount(body, opts); }
export const questionCounts = () => QUESTIONS.reduce((a, q) => { a[q.level] = (a[q.level] || 0) + 1; return a; }, {});
export default { spec, mount };
