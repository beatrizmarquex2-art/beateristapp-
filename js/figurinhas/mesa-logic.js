// Estrelas dos jogos de mesa (regra pura, sem tela): 1 por vitória contra o Paul, limite de 30 por jogo por dia.
export const LIMITE_DIA = 30;
export const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const livre = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();
/** Conta o dia: devolve o novo estado e se ganhou a estrela (puro, testado em tests/mesa.test.mjs). */
export function contar(mesa, jogo, dia = hoje()) {
  const m = { total: 0, dias: {}, ...(mesa || {}) }; const d = { ...(m.dias[jogo] || { d: dia, n: 0 }) };
  if (d.d !== dia) { d.d = dia; d.n = 0; }
  if (d.n >= LIMITE_DIA) return { mesa: { ...m, dias: { ...m.dias, [jogo]: d } }, ganhou: 0, resta: 0 };
  d.n += 1;
  return { mesa: { ...m, total: m.total + 1, dias: { ...m.dias, [jogo]: d } }, ganhou: 1, resta: LIMITE_DIA - d.n };
}
