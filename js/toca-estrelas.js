// Estrelas de uma fase do Toca Aqui (regra pura). Na tela (mão) vale sempre 1 ★; no microfone (tocando de verdade) vale mais:
//   iniciante ..... 2 ★ em qualquer velocidade
//   intermediário . 2 ★ a 80 e 100 BPM, 3 ★ de 120 pra cima
//   avançado ...... 2 ★ a 80 BPM, 3 ★ de 100 pra cima ("difícil")
export const PASSA = 50; // % de precisão pra passar a fase
export function estrelasFase({ score, mic, tier, bpm }) {
  if (!(score >= PASSA)) return 0;
  if (!mic) return 1;
  if (tier === 'ini') return 2;
  if (tier === 'int') return bpm >= 120 ? 3 : 2;
  return bpm >= 100 ? 3 : 2;
}
/** Só ganha a diferença sobre o melhor já feito na fase (repetir não rende de novo). */
export const ganhoEstrelas = (novas, melhor) => Math.max(0, (novas || 0) - (melhor || 0));
