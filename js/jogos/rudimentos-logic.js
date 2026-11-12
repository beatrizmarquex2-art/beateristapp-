// Rudimentos (jogo novo da área dos alunos, regras puras): o aluno toca padrões de mãos, D (direita) e E (esquerda),
// com as notas descendo em duas colunas (esquerda = E, direita = D), igual ao taiko. Cada padrão tem 16 toques (um compasso de semicolcheias);
// o do paradiddle duplo "dos dois lados" tem 32 (dois compassos). Os padrões são os que a Bea mandou, na ordem dela.
// Jogo feito do zero: não depende do taiko (que continua guardado à parte).

export const LADO_E = 'E'; export const LADO_D = 'D';
/** Os 3 andamentos de cada fase (BPM do pulso; cada toque é uma semicolcheia). */
export const TEMPOS = [['devagar', 50], ['normal', 70], ['rápido', 90]];
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

/** Segundos entre dois toques (semicolcheia) no andamento `bpm`. */
export const passo = (bpm) => 60 / bpm / 4;
/** Folga pra acertar: generosa, mas nunca maior que 60% do passo (senão um toque cairia na nota vizinha nos andamentos rápidos). */
export const janela = (bpm) => Math.min(0.16, passo(bpm) * 0.6);

/** Notas (t em s a partir do 1º tempo) do padrão `sq` repetido até ~`notas` toques. `i` = posição dentro do padrão. */
export function buildChart(sq, bpm, notas = NOTAS_RODADA) {
  const rodadas = Math.max(1, Math.round(notas / sq.length)); const p = passo(bpm); const out = [];
  for (let r = 0; r < rodadas; r++) for (let i = 0; i < sq.length; i++) out.push({ t: (r * sq.length + i) * p, side: sq[i], i, res: null });
  return out;
}

/** Melhores acertos (%) por andamento, de uma fase: [devagar, normal, rápido]. */
export const melhoresDe = (est, n) => { const b = est && est[n]; return Array.isArray(b) && b.length === TEMPOS.length ? b.map((x) => Math.max(0, Math.min(100, Math.round(Number(x) || 0)))) : TEMPOS.map(() => 0); };
/** Guarda um resultado (só se melhorar). Devolve o novo `est` (puro). */
export function guardar(est, n, tempoIdx, acc) { const b = melhoresDe(est, n); if (acc > b[tempoIdx]) b[tempoIdx] = acc; return { ...(est || {}), [n]: b }; }
/** Estrelas da fase: quantos andamentos passaram de MIN_ACERTO (0 a 3). */
export const estrelas = (est, n) => melhoresDe(est, n).filter((a) => a >= MIN_ACERTO).length;
/** A fase 1 é livre; as outras abrem quando a anterior tem pelo menos 1 estrela. */
export const liberada = (est, n) => n <= 1 || estrelas(est, n - 1) >= 1;
export const totalEstrelas = (est) => FASES.reduce((t, f) => t + estrelas(est, f.n), 0);

/* ---------- conferir os toques ---------- */
export const PERFEITO = 0.07; // s: toque dentro disso da nota vale "perfeito"
/** Confere um toque no lado `side` no instante `t` (s). Marca a nota mais próxima, dentro da janela `win`, como 'perfeito', 'bom' ou 'lado' (mão trocada). */
export function judgeTap(chart, t, side, win = 0.16) {
  let best = -1; let bd = Infinity;
  chart.forEach((n, i) => { if (n.res) return; const d = Math.abs(t - n.t); if (d < bd) { bd = d; best = i; } });
  if (best < 0 || bd > win) return { kind: 'extra' };
  const n = chart[best]; const ms = Math.round((t - n.t) * 1000);
  n.res = n.side !== side ? 'lado' : bd <= PERFEITO ? 'perfeito' : 'bom';
  return { kind: n.res, i: best, ms };
}
/** Notas que já passaram da janela sem toque viram 'faltou'. Devolve quantas mudaram. */
export function sweep(chart, now, win = 0.16) { let c = 0; for (const n of chart) if (!n.res && now > n.t + win) { n.res = 'faltou'; c++; } return c; }
export function summary(chart) {
  const total = chart.length || 1; const c = (k) => chart.filter((n) => n.res === k).length;
  const hits = c('perfeito') + c('bom'); const pts = c('perfeito') + c('bom') * 0.75;
  return { total: chart.length, perfeito: c('perfeito'), bom: c('bom'), lado: c('lado'), faltou: c('faltou'), hits, acc: Math.round((pts / total) * 100) };
}
