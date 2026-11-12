// Rudimentos (jogo novo da área dos alunos, regras puras): o aluno toca padrões de mãos, D (direita) e E (esquerda),
// com as notas descendo em duas colunas (esquerda = E, direita = D), igual ao taiko. Cada padrão tem 16 toques (um compasso de semicolcheias, ou dois de colcheias);
// o do paradiddle duplo "dos dois lados" tem 32. Os padrões são os que a Bea mandou, na ordem dela.
// Jogo feito do zero: não depende do taiko (que continua guardado à parte).

export const LADO_E = 'E'; export const LADO_D = 'D';
/** Os 4 andamentos (BPM do pulso), os mesmos discos do Toca Aqui. */
export const TEMPOS = [['devagar', 80], ['normal', 100], ['rápido', 120], ['turbo', 140]];
/** A figura do toque: colcheia = 2 por tempo, semicolcheia = 4 por tempo. */
export const FIGURAS = [['colcheia', 2], ['semicolcheia', 4]];
/** Acerto mínimo (%) pra "passar" um andamento. */
export const MIN_ACERTO = 80;
/** Quantas notas tem uma rodada (o padrão se repete até chegar perto disso). */
export const NOTAS_RODADA = 64;
const seq = (s) => s.replace(/\s+/g, '').toUpperCase();

export const BLOCOS = [
  { n: 1, nome: 'mãos alternadas, dobras e paradiddles' },
  { n: 2, nome: 'paradiddle duplo dos dois lados' },
  { n: 3, nome: 'combinações' },
];
// nomes das linhas 10 e 11 do bloco 3 ainda não foram dados pela Bea: ficam "padrão" até ela nomear
export const FASES = [
  { n: 1, bloco: 1, nome: 'toque simples', seq: seq('d e d e d e d e d e d e d e d e') },
  { n: 2, bloco: 1, nome: 'toque duplo', seq: seq('d d e e d d e e d d e e d d e e') },
  { n: 3, bloco: 1, nome: 'paradiddle', seq: seq('d e d d e d e e d e d d e d e e') },
  { n: 4, bloco: 1, nome: 'paradiddle duplo', seq: seq('d e d e d d e d e d e e d e d e') },
  { n: 5, bloco: 1, nome: 'paradiddle duplo e toque duplo', seq: seq('d e d e d d e d e d e e d d e e') },
  { n: 6, bloco: 2, nome: 'paradiddle duplo, começando pela direita e pela esquerda', seq: seq('d e d e d d e d e d e e d e d d') + seq('e d e d e e d e d e d d e d e e') },
  { n: 7, bloco: 3, nome: 'paradiddle triplo', seq: seq('d e d e d e d d e d e d e d e e') },
  { n: 8, bloco: 3, nome: 'oito de cada mão', seq: seq('d d d d d d d d e e e e e e e e') },
  { n: 9, bloco: 3, nome: 'quatro de cada mão', seq: seq('d d d d e e e e d d d d e e e e') },
  { n: 10, bloco: 3, nome: 'padrão 10', seq: seq('d e e d e d d e d e e d e d d e') },
  { n: 11, bloco: 3, nome: 'padrão 11', seq: seq('d d e d e e d e d d e d e e d e') },
];
export const FASE_BY = Object.fromEntries(FASES.map((f) => [f.n, f]));

/** Segundos entre dois toques no andamento `bpm`, com `por` toques por tempo (2 = colcheia, 4 = semicolcheia). */
export const passo = (bpm, por = 4) => 60 / bpm / por;
/** Folga pra acertar: generosa, até 60% do passo (senão um toque cairia na nota vizinha), mas nunca menos de 70 ms (limite de quem toca na tela). */
export const janela = (bpm, por = 4) => Math.max(0.07, Math.min(0.16, passo(bpm, por) * 0.6));

/** Notas (t em s a partir do 1º tempo) do padrão `sq` repetido até ~`notas` toques. `i` = posição dentro do padrão. */
export function buildChart(sq, bpm, por = 4, notas = NOTAS_RODADA) {
  const rodadas = Math.max(1, Math.round(notas / sq.length)); const p = passo(bpm, por); const out = [];
  for (let r = 0; r < rodadas; r++) for (let i = 0; i < sq.length; i++) out.push({ t: (r * sq.length + i) * p, side: sq[i], i, res: null });
  return out;
}

/** Melhores acertos (%) de uma fase: { c: [colcheia nos 4 andamentos], s: [semicolcheia nos 4 andamentos] }. */
export const melhoresDe = (est, n) => {
  const v = (x) => (Array.isArray(x) && x.length === TEMPOS.length ? x.map((a) => Math.max(0, Math.min(100, Math.round(Number(a) || 0)))) : TEMPOS.map(() => 0));
  const e = est && est[n] && typeof est[n] === 'object' ? est[n] : {}; return { c: v(e.c), s: v(e.s) };
};
/** Guarda um resultado (só se melhorar). `figIdx` 0 = colcheia, 1 = semicolcheia. Devolve o novo `est` (puro). */
export function guardar(est, n, figIdx, tempoIdx, acc) { const m = melhoresDe(est, n); const k = figIdx ? 's' : 'c'; if (acc > m[k][tempoIdx]) m[k][tempoIdx] = acc; return { ...(est || {}), [n]: m }; }
/** Estrelas da fase (0 a 3): 1 = passou a colcheia (em qualquer andamento); 2 = passou também a semicolcheia; 3 = passou a semicolcheia a 120 BPM ou mais. */
export const estrelas = (est, n) => { const m = melhoresDe(est, n); const ok = (a) => a >= MIN_ACERTO; return (m.c.some(ok) ? 1 : 0) + (m.s.some(ok) ? 1 : 0) + (m.s.some((a, i) => ok(a) && TEMPOS[i][1] >= 120) ? 1 : 0); };
/** A fase 1 é livre; as outras abrem quando a anterior tem pelo menos 1 estrela. */
export const liberada = (est, n) => n <= 1 || estrelas(est, n - 1) >= 1;
export const totalEstrelas = (est) => FASES.reduce((t, f) => t + estrelas(est, f.n), 0);

/* ---------- conferir os toques ---------- */
export const PERFEITO = 0.07; // s: toque dentro disso da nota vale "perfeito"
/** Confere um toque no lado `side` no instante `t` (s). Marca a nota mais próxima como 'perfeito', 'bom' ou 'lado' (mão trocada).
 *  `win` = folga pra antes da nota; `late` = folga pra depois (pode ser maior: tocar um pouquinho atrasado é mais comum que adiantado). */
export function judgeTap(chart, t, side, win = 0.16, late = win) {
  let best = -1; let bd = Infinity;
  chart.forEach((n, i) => { if (n.res) return; const d = t - n.t; if (d < -win || d > late) return; const a = Math.abs(d); if (a < bd) { bd = a; best = i; } });
  if (best < 0) return { kind: 'extra' };
  const n = chart[best]; const ms = Math.round((t - n.t) * 1000);
  n.res = n.side !== side ? 'lado' : bd <= PERFEITO ? 'perfeito' : 'bom';
  return { kind: n.res, i: best, ms };
}
/** Notas que já passaram da folga (a de depois, `late`) sem toque viram 'faltou'. Devolve quantas mudaram. */
export function sweep(chart, now, win = 0.16, late = win) { let c = 0; for (const n of chart) if (!n.res && now > n.t + late) { n.res = 'faltou'; c++; } return c; }
export function summary(chart) {
  const total = chart.length || 1; const c = (k) => chart.filter((n) => n.res === k).length;
  const hits = c('perfeito') + c('bom'); const pts = c('perfeito') + c('bom') * 0.75;
  return { total: chart.length, perfeito: c('perfeito'), bom: c('bom'), lado: c('lado'), faltou: c('faltou'), hits, acc: Math.round((pts / total) * 100) };
}

/** Folguinha pra quem está sofrendo: depois de cada tentativa que não passou na mesma fase, figura e andamento (até 3), a folga de acerto cresce
 *  um pouco, mais pra atrasado que pra adiantado. Quando passa, volta ao normal. `falhas` = tentativas seguidas sem passar. */
export const AJUDA_MAX = 3;
export const folgas = (bpm, por, falhas = 0) => { const k = Math.max(0, Math.min(AJUDA_MAX, falhas | 0)); const w = janela(bpm, por); return { win: Math.min(0.2, w * (1 + 0.2 * k)), late: Math.min(0.26, w * (1 + 0.55 * k)), nivel: k }; };
export const chaveFalhas = (n, figIdx, tempoIdx) => `${n}:${figIdx ? 1 : 0}:${tempoIdx}`;
/** Novo contador de falhas depois de uma tentativa (puro). */
export const contaFalhas = (falhas, chave, passou) => { const f = { ...(falhas || {}) }; f[chave] = passou ? 0 : Math.min(AJUDA_MAX, (f[chave] | 0) + 1); return f; };

/** Microfone: o app só ouve QUANDO o aluno bateu (não sabe qual mão). Cada ataque (`onsets`, s desde o 1º tempo) marca a nota mais próxima,
 *  dentro da folga, como 'perfeito' ou 'bom' (qualquer mão). O que sobra vira 'faltou'; ataques a mais vão em `extras`. */
export function judgeOnsets(chart, onsets, win = 0.16, late = win) {
  let extras = 0;
  for (const t of [...onsets].sort((a, b) => a - b)) {
    let best = -1; let bd = Infinity; chart.forEach((n, i) => { if (n.res) return; const d = t - n.t; if (d < -win || d > late) return; const a = Math.abs(d); if (a < bd) { bd = a; best = i; } });
    if (best < 0) { extras++; continue; } chart[best].res = bd <= PERFEITO ? 'perfeito' : 'bom';
  }
  sweep(chart, Infinity, win, late); return { extras };
}
