// Modo Aventura do Bingo Musical. Só usa o que o jogo já tem: os 24 itens (12 instrumentos, 7 peças da bateria, 4 equipamentos, 1 item solto: baquetas),
// a cartela 4×4 e as marcações/"bingo!" do motor (bingo-logic.js). Cada missão tem cartela e ordem de sorteio FIXAS por semente (determinísticas), então
// o objetivo é sempre alcançável: `need` = menor nº de sorteios em que a combinação já é possível (calculado pelo motor, conferido nos testes).
// Conclusão = o motor confirma a combinação com casas realmente MARCADAS e já SORTEADAS (evaluate refaz a conferência a partir das marcas do resultado).
// Erro = tocar num item que ainda não saiu OU gritar "bingo!" sem a combinação pronta. Limitação: só existem 3 grupos legítimos de itens e a cartela é sempre 4×4.
import { mount as mountGame } from '../../jogos/bingo1.js';
import * as B from '../../jogos/bingo1-logic.js';

const pad = (i) => String(i).padStart(2, '0');
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
// [título, tag, objetivo, semente, grupo, regras]
// regras: strict = qualquer erro encerra (não conclui); limit = folga (acima de `need`) máxima de sorteios pra concluir; s2/s3 = critérios das estrelas 2 e 3
// (err0 = zero erros; extra = folga máxima de sorteios sobre `need`). Folga 0 = declarar o bingo no sorteio exato em que a combinação fica pronta.
const PLAN = [
  ['Primeira linha', 'tutorial', 'linha', 11, null, { guide: true, s2: { err0: true }, s3: { err0: true, extra: 3 } }],
  ['Linha de instrumentos', 'instrumentos', 'linha', 51, 'instrumentos', { s2: { err0: true }, s3: { err0: true, extra: 2 } }],
  ['Linha da bateria', 'bateria', 'linha', 126, 'bateria', { s2: { err0: true }, s3: { err0: true, extra: 2 } }],
  ['Linha de equipamentos', 'equipamentos', 'linha', 10, 'equipamentos', { s2: { err0: true }, s3: { err0: true, extra: 2 } }],
  ['Sem errar', 'sem erros', 'linha', 100, null, { strict: true, s2: { extra: 4 }, s3: { extra: 1 } }],
  ['Linha relâmpago', 'poucos sorteios', 'linha', 108, null, { limit: 2, s2: { err0: true }, s3: { err0: true, extra: 0 } }],
  ['Linha e coluna', 'linha + coluna', 'lincol', 36, null, { s2: { err0: true }, s3: { err0: true, extra: 2 } }],
  ['Duas linhas', 'duas linhas', 'duas', 20, null, { s2: { err0: true }, s3: { err0: true, extra: 2 } }],
  ['Duas linhas, sem errar', 'duas · sem erros', 'duas', 127, null, { strict: true, limit: 3, s2: { extra: 1 }, s3: { extra: 0 } }],
  ['Cartela cheia', 'cartela cheia', 'cheia', 55, null, { s2: { err0: true }, s3: { err0: true, extra: 1 } }],
];

const lim = (n) => (n == null ? '' : ` em até ${plural(n, 'sorteio', 'sorteios')}`);
const build = ([title, tag, goal, seed, cat, r], i) => {
  const base = { seed, goal, cat };
  const need = B.needDraws(B.newMissionGame(base)); // sorteios mínimos nesta partida fixa (sempre ≤ 24)
  const params = { ...base, need, strict: !!r.strict, limit: r.limit != null ? need + r.limit : null, guide: !!r.guide, s2: r.s2, s3: r.s3,
    s2draws: r.s2.extra != null ? need + r.s2.extra : null, s3draws: r.s3.extra != null ? need + r.s3.extra : null };
  const what = `${B.MISSION_GOALS[goal]}${cat ? ` só de ${B.CATS[cat].name}` : ''}`;
  const g1 = `complete ${what}${r.strict ? ', sem nenhum erro' : ''}${params.limit != null ? `, em até ${plural(params.limit, 'sorteio', 'sorteios')}` : ''}`;
  const s2t = [r.s2.err0 && !r.strict ? 'sem nenhum erro' : '', params.s2draws != null ? lim(params.s2draws).trim() : ''].filter(Boolean).join(', ');
  const s3t = [r.s3.err0 && !r.strict ? 'sem nenhum erro' : '', params.s3draws != null ? lim(params.s3draws).trim() : ''].filter(Boolean).join(', ');
  return {
    id: `bingo-${pad(i)}`, title, tag, goal: `${g1}, e grite “bingo!”`,
    rules: [
      i === 0 ? 'o jogo te guia passo a passo: sorteie, marque o que saiu e grite “bingo!”.' : 'sorteie, marque na cartela só o que já saiu e grite “bingo!” quando a combinação estiver pronta.',
      'erro = tocar num item que ainda não saiu ou gritar “bingo!” sem a combinação pronta.',
      cat ? `vale só a linha de ${B.CATS[cat].name} (as casas desse grupo têm borda azul).` : goal === 'lincol' ? 'precisa de uma linha inteira e uma coluna inteira marcadas.' : goal === 'duas' ? 'precisa de duas linhas inteiras (ou colunas, ou uma de cada) marcadas.' : goal === 'cheia' ? 'as 16 casas marcadas; só se completa depois que todos os itens da cartela saírem.' : 'vale linha ou coluna (sem diagonal).',
      r.strict ? 'nesta missão qualquer erro encerra a tentativa: pode recomeçar.' : null,
      params.limit != null ? `se pedir mais um sorteio depois do limite (${params.limit}), a tentativa termina.` : null,
      'a cartela e a ordem do sorteio são sempre as mesmas nesta missão.',
    ].filter(Boolean),
    stars: [r.strict ? 'concluir sem nenhum erro' : 'concluir a missão', s2t || 'concluir a missão', s3t || 'concluir a missão'],
    params,
    evaluate(result) {
      const p = params;
      const bad = (msg) => ({ done: false, stars: 0, summary: [msg] });
      if (!result || !Array.isArray(result.marks) || result.marks.length !== 16) return bad('faltou conferir o bingo.');
      const draws = Math.max(0, result.draws | 0); const errors = Math.max(0, result.refusedMarks | 0) + Math.max(0, result.refusedBingo | 0);
      // confere de verdade com o motor: partida da semente, `draws` itens sorteados e as marcas feitas pelo jogador
      const g = B.newMissionGame(p); g.drawn = Math.min(24, draws); g.marks = [result.marks.map(Boolean)];
      const win = result.won === true && draws >= p.need && draws <= 24 && !!B.winning(g, 0);
      const stat = [`${plural(draws, 'sorteio', 'sorteios')} (o mínimo possível aqui é ${p.need})`, `${plural(errors, 'erro', 'erros')}`];
      if (!win) return { done: false, stars: 0, summary: [result.reason === 'limite' ? `passou do limite de ${p.limit} sorteios.` : result.reason === 'erro' ? 'houve um erro e esta missão não aceita erros.' : 'a combinação ainda não estava completa.', ...stat] };
      if (p.strict && errors > 0) return { done: false, stars: 0, summary: ['esta missão não aceita erros.', ...stat] };
      if (p.limit != null && draws > p.limit) return { done: false, stars: 0, summary: [`passou do limite de ${p.limit} sorteios.`, ...stat] };
      const ok = (c, d) => (!c.err0 || errors === 0) && (d == null || draws <= d);
      const c2 = ok(p.s2, p.s2draws); const c3 = c2 && ok(p.s3, p.s3draws);
      const stars = 1 + (c2 ? 1 : 0) + (c3 ? 1 : 0);
      return { done: true, stars, summary: ['combinação marcada e conferida pelo bingo!', ...stat], label: `${draws} sorteios · ${plural(errors, 'erro', 'erros')}` };
    },
  };
};
const missions = PLAN.map(build);
const has = (g, id) => ((g.m[id] || {}).s || 0) >= 1;

export const spec = {
  id: 'bingo', title: 'Bingo Musical', theme: 'bingo', missions,
  medals: [
    { id: 'bingo-temas', title: 'Bingo temático', desc: 'conclua as linhas de instrumentos, bateria e equipamentos', icon: '🥁', test: (g) => ['bingo-01', 'bingo-02', 'bingo-03'].every((id) => has(g, id)) },
    { id: 'bingo-sem-erro', title: 'Mão certeira', desc: 'conclua as duas missões que não aceitam erros', icon: '🎯', test: (g) => ['bingo-04', 'bingo-08'].every((id) => has(g, id)) },
    { id: 'bingo-cheia', title: 'Cartela de ouro', desc: '3 estrelas na cartela cheia', icon: '🏆', test: (g) => ((g.m['bingo-09'] || {}).s || 0) >= 3 },
  ],
};
export function mount(body, opts) { return mountGame(body, opts); }
export default { spec, mount };
