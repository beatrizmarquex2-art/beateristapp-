// Estrelas dos jogos de mesa (regra pura, sem tela): 1 por vitória contra o Paul, limite de 30 por jogo por dia.
export const LIMITE_DIA = 30;
export const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const livre = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();
/** Conta o dia: devolve o novo estado e se ganhou a estrela (puro, testado em tests/mesa.test.mjs). */
export function contar(mesa, jogo, dia = hoje(), n = 1) {
  const m = { total: 0, dias: {}, ...(mesa || {}) }; const d = { ...(m.dias[jogo] || { d: dia, n: 0 }) };
  if (d.d !== dia) { d.d = dia; d.n = 0; }
  const g = Math.max(0, Math.min(Math.round(n) || 0, LIMITE_DIA - d.n)); d.n += g;
  return { mesa: { ...m, total: m.total + g, dias: { ...m.dias, [jogo]: d } }, ganhou: g, resta: LIMITE_DIA - d.n };
}
/** Jogos que ENSINAM valem até 3 estrelas por partida; os outros, 1. As estrelas de um quiz/caça/cruzadinha vêm do desempenho. */
export const ENSINAM = ['cartas', 'quiz', 'caca', 'cruzadinha'];
export const starsPct = (certas, total) => { const p = total ? certas / total : 0; return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.4 ? 1 : 0; };
export const starsErros = (erros) => (erros === 0 ? 3 : erros <= 2 ? 2 : 1);
