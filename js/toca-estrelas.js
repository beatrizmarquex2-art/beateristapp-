// Estrelas de uma fase do Toca Aqui (regra pura), igual à pauLta: pela % de precisão (média dos 3 compassos).
//   60% = 1 ★, 80% = 2 ★, 100% = 3 ★; abaixo de 60% = 0 (quase lá, tenta de novo).
// Tocando no microfone (de verdade, na bateria ou no pad) vale no mínimo:
//   iniciante ..... 2 ★ em qualquer velocidade
//   intermediário . 2 ★ a 80 e 100 BPM, 3 ★ de 120 pra cima
//   avançado ...... 2 ★ a 80 BPM, 3 ★ de 100 pra cima ("difícil")
export const PASSA = 60; // % de precisão pra passar a fase
export const estrelasPct = (score) => (score >= 100 ? 3 : score >= 80 ? 2 : score >= PASSA ? 1 : 0);
export function estrelasFase({ score, mic, tier, bpm }) {
  if (!(score >= PASSA)) return 0;
  const base = estrelasPct(score);
  if (!mic) return base;
  const piso = tier === 'ini' ? 2 : tier === 'int' ? (bpm >= 120 ? 3 : 2) : (bpm >= 100 ? 3 : 2);
  return Math.max(base, piso);
}
/** Só ganha a diferença sobre o melhor já feito na fase (repetir não rende de novo). */
export const ganhoEstrelas = (novas, melhor) => Math.max(0, (novas || 0) - (melhor || 0));
