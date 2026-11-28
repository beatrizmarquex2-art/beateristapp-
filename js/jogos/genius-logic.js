// Genius infinito (pedido da Bea, nov/2026): decore a sequência e repita; a cada rodada ela ganha 1 nota e fica um pouco mais rápida.
// Quatro instrumentos: xilofone, piano, bateria (a bateria acústica de verdade do app, com as peças dela) e violão. Lógica pura (sem tela), testada em tests/genius-logic.test.mjs.
import { confere } from './fuga-mini-logic.js';
export { confere };

// cores sem verde (a Bea não gosta do led verde do Genius)
const COR = ['#e8384f', '#f2762e', '#f7b733', '#4fd8ff', '#2fa8c4', '#3b6fd8', '#f4efe4', '#e8384f'];
const NOTAS = [['dó', 60], ['ré', 62], ['mi', 64], ['fá', 65], ['sol', 67], ['lá', 69], ['si', 71], ['dó', 72]];
export const INSTRUMENTOS = {
  xilofone: { nome: 'xilofone', pads: NOTAS.map(([nome, midi], i) => ({ nome, midi, cor: COR[i] })) },
  piano: { nome: 'piano', pads: NOTAS.map(([nome, midi], i) => ({ nome, midi, cor: COR[i] })) },
  // as 8 peças da bateria acústica do app (kit-modelos.js, data-p): o som vem de kitSom('acustica')[id]
  bateria: { nome: 'bateria', pads: [['cr', 'prato de ataque'], ['hh', 'chimbal'], ['tt', 'tom 1'], ['mt', 'tom 2'], ['sn', 'caixa'], ['ft', 'surdo'], ['rd', 'prato de condução'], ['bd', 'bumbo']].map(([id, nome], i) => ({ id, nome, cor: COR[i] })) },
  violao: { nome: 'violão', pads: [['mi', 40], ['lá', 45], ['ré', 50], ['sol', 55], ['si', 59], ['mi', 64]].map(([nome, midi], i) => ({ nome, midi, cor: COR[i] })) },
};
export const ORDEM = ['xilofone', 'piano', 'bateria', 'violao'];
export const instrumentoValido = (k) => (INSTRUMENTOS[k] ? k : 'xilofone');

/** Acrescenta 1 nota à sequência (nunca 3 iguais seguidas). `n` = quantos pads o instrumento tem. */
export function proximaNota(seq, n, rnd = Math.random) {
  let v = Math.floor(rnd() * n); const t = seq.length;
  while (t >= 2 && seq[t - 1] === v && seq[t - 2] === v) v = (v + 1 + Math.floor(rnd() * (n - 1))) % n;
  return [...seq, v];
}
/** Tempo entre as notas na rodada `r` (1, 2, 3…): começa tranquilo (620 ms) e acelera até um piso de 250 ms. */
export const msPorNota = (r) => Math.max(250, Math.round(620 - (Math.max(1, r) - 1) * 22));
/** Quantas vezes dá pra ouvir a sequência de novo numa partida inteira. */
export const OUVIR_DE_NOVO = 3;
/** Quanto vale a rodada alcançada: "você decorou N notas" (rodadas completas = tamanho da última sequência acertada). */
export const decoradas = (rodadaAtual, errou) => Math.max(0, errou ? rodadaAtual - 1 : rodadaAtual);
/** Recorde por instrumento. Devolve { recs, novo } (novo = bateu o recorde, e só vale quando n > 0). */
export function atualizaRecorde(recs, inst, n) {
  const atual = (recs && Number(recs[inst])) || 0; const novo = n > atual;
  return { recs: { ...(recs || {}), [inst]: novo ? n : atual }, novo };
}
/** Mensagem de fim conforme o tamanho. */
export const elogio = (n) => (n >= 20 ? 'memória de elefante! 🐘' : n >= 14 ? 'que ouvido e que memória!' : n >= 8 ? 'muito bem! já dá pra tocar uma música' : n >= 4 ? 'bom começo! de novo?' : 'tente de novo, você chega lá');
