// Estrelas dos jogos de mesa (regra pura, sem tela): 1 por vitória contra o Paul; limite de 30 por dia só nos jogos de mesa (os de aprender não têm limite).
export const LIMITE_DIA = 30;
export const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const livre = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();
/** Conta o dia: devolve o novo estado e se ganhou a estrela (puro, testado em tests/mesa.test.mjs). */
export function contar(mesa, jogo, dia = hoje(), n = 1) {
  const m = { total: 0, dias: {}, ...(mesa || {}) }; const d = { ...(m.dias[jogo] || { d: dia, n: 0 }) };
  if (d.d !== dia) { d.d = dia; d.n = 0; }
  if (APRENDER.includes(jogo)) { const g = Math.max(0, Math.round(n) || 0); d.n += g; return { mesa: { ...m, total: m.total + g, dias: { ...m.dias, [jogo]: d } }, ganhou: g, resta: Infinity }; } // jogos de APRENDER: sem limite por dia (a Bea)
  const g = Math.max(0, Math.min(Math.round(n) || 0, LIMITE_DIA - d.n)); d.n += g;
  return { mesa: { ...m, total: m.total + g, dias: { ...m.dias, [jogo]: d } }, ganhou: g, resta: LIMITE_DIA - d.n };
}
/** Jogos e estudos de APRENDER: NÃO têm o limite de 30 ★ por dia (pedido da Bea). O limite vale só pros jogos de mesa (velha, memória, cara a cara, stop, bingo, quebra-cabeça), que dão 1 ★ por vez. */
export const APRENDER = ['cartas', 'quizuno', 'quiz', 'caca', 'cruzadinha', 'toca', 'figurix', 'detetive', 'rudimentos', 'estudos', 'beathero', 'arte', 'checkin', 'missao'];
/** Jogos que ENSINAM valem até 3 estrelas por partida; os outros, 1. As estrelas de um quiz/caça/cruzadinha vêm do desempenho. */
export const ENSINAM = ['cartas', 'quiz', 'caca', 'cruzadinha'];
export const starsPct = (certas, total) => { const p = total ? certas / total : 0; return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.4 ? 1 : 0; };
export const starsErros = (erros) => (erros === 0 ? 3 : erros <= 2 ? 2 : 1);

/** Estrelas por vitória em cada jogo (todo jogo dá estrela, pra querer ficar jogando). Os que ensinam variam com o desempenho (starsPct/starsErros). */
export const ESTRELAS_JOGO = { velha: 1, memoria: 1, cara: 3, stop: 3, bingo: 3, cartas: 1, quizuno: 1 };
/** Quebra-cabeça: 3 ★ na 1ª vez que monta cada imagem; quando todas já foram montadas, uma 2ª volta vale 2 ★ por imagem; na 3ª volta (e depois) 1 ★.
 *  `q` = { volta, feitas:[ids] } (a volta atual e as imagens já montadas nela). Puro: devolve o novo estado e as estrelas. */
export function premioQuebra(q, imgId, total) {
  const s = { volta: 1, feitas: [], ...(q || {}) }; const feitas = Array.isArray(s.feitas) ? s.feitas : []; const volta = Math.max(1, s.volta | 0);
  if (feitas.includes(imgId)) return { q: { volta, feitas }, estrelas: 0 };
  const estrelas = Math.max(1, 4 - volta); const novas = [...feitas, imgId];
  return novas.length >= total ? { q: { volta: volta + 1, feitas: [] }, estrelas } : { q: { volta, feitas: novas }, estrelas };
}

/** Anti-farm: cada "chave" (jogo + música/nível/tema) paga no máximo 3 ★ na vida toda, e só a diferença do que já pagou.
 *  Repetir a mesma música/nível não rende de novo. Puro: devolve quantas ★ ainda valem (`novas`) e o livro-caixa novo. */
export const MAX_CHAVE = 3;
export function pagarChave(pago, chave, n) {
  const p0 = (pago && typeof pago === 'object') ? pago : {}; const ja = Math.max(0, p0[chave] | 0);
  const novas = Math.max(0, Math.min(Math.round(n) || 0, MAX_CHAVE) - ja); return { novas, pago: { ...p0, [chave]: ja + novas } };
}
