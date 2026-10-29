// Fases 0 a 10 da área Kids: o mesmo molde pra todo jogo. Puro (sem tela), testado em tests/kids-levels.test.mjs.
// Tipos de fase: normal, relâmpago (tempo por pergunta) e "sem errar" (errou, recomeça). A idade ajusta tempo, tamanho e dificuldade.
export const AGES = [['a', '4 a 6 anos'], ['b', '7 a 10 anos'], ['c', '11 a 14 anos']];
export const MAX_LEVEL = 10;
const OFFSET = { a: -1, b: 0, c: 1 };
const KIND = ['tutorial', 'normal', 'normal', 'timed', 'normal', 'sudden', 'timed', 'normal', 'sudden', 'timed', 'boss'];
const ROUNDS = [3, 5, 5, 6, 6, 6, 7, 8, 8, 10, 10];
const SECS = [null, null, null, 9, null, null, 7, null, null, 5, 4]; // segundos por pergunta nas fases com tempo
export const diffOf = (level, age = 'b') => Math.max(0, Math.min(10, level + (OFFSET[age] ?? 0)));

export function levelSpec(level, age = 'b') {
  const kind = KIND[level] || 'normal';
  let rounds = ROUNDS[level] || 5; let secs = SECS[level] || null; let sudden = kind === 'sudden' || kind === 'boss';
  if (age === 'a') { rounds = Math.max(3, Math.round(rounds * 0.7)); if (secs) secs = Math.round(secs * 1.8); if (sudden && level < 8) sudden = false; }
  if (age === 'c' && secs) secs = Math.max(3, Math.round(secs * 0.8));
  return { level, kind: sudden && !secs ? 'sudden' : kind, rounds, secs, sudden, d: diffOf(level, age) };
}
/** Texto curtinho da fase pra mostrar no botão e na abertura. */
export function levelTag(spec) {
  if (spec.level === 0) return 'aquecimento';
  if (spec.secs && spec.sudden) return `⏱ ${spec.secs}s · 💥 sem errar`;
  if (spec.secs) return `⏱ ${spec.secs}s por pergunta`;
  if (spec.sudden) return '💥 sem errar';
  return `${spec.rounds} perguntas`;
}
export const starsFor = (right, total) => { const p = total ? right / total : 0; return p >= 1 ? 3 : p >= 0.8 ? 2 : p >= 0.6 ? 1 : 0; };
export const pctOf = (right, total) => (total ? Math.round((right / total) * 100) : 0);
