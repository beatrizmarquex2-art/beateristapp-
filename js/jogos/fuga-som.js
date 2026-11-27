// Sons da Fuga do Estúdio (só os dados, sem tela nem áudio: dá pra testar em Node).
/** Plano de cada efeito: [onda, freq inicial, freq final, início (s), duração (s), volume, filtro?]. ACERTO sobe e é alegre; ERRO (alarme) é o único que desce e é áspero (testado em tests/fuga-som.test.mjs). */
export const PLANO_SFX = {
  laser: [['triangle', 420, 1250, 0, 0.18, 0.09, 4500], ['sine', 840, 2500, 0.03, 0.14, 0.04]], // começar a porta: "ativando" (sobe)
  alarme: [0, 1, 2, 3].map((k) => ['square', k % 2 ? 520 : 780, k % 2 ? 500 : 760, k * 0.16, 0.15, 0.1, 2500]), // errou: sirene
  porta: [['sine', 130, 100, 0, 0.14, 0.12], ...[523, 659, 784, 1047].flatMap((f, k) => [['triangle', f, f, 0.1 + k * 0.09, 0.32, 0.13], ['sine', f * 2, f * 2, 0.1 + k * 0.09, 0.22, 0.04]])], // acertou: tum suave da trava + arpejo de dó maior subindo
  vitoria: [523, 659, 784, 1047, 1319].flatMap((f, k) => [['triangle', f, f, k * 0.11, 0.45, 0.14], ['sine', f * 2, f * 2, k * 0.11, 0.3, 0.04]]),
};
