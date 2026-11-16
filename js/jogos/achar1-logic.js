// Achar o 1 (jogo): o Paul solta o groove no meio do compasso, sem contagem, e a criança toca no 1 toda vez que sentir.
// Regras puras (sem tela e sem áudio). Testes em tests/achar1-logic.test.mjs.
import { oneScore } from '../tools-logic.js';
import { estrelasPct } from './vivo-logic.js';

export const RODADAS = 5;
export const COMPASSOS = 4;
/** fácil: o groove entra num tempo inteiro; médio: pode entrar no "&"; difícil: em qualquer subdivisão. */
export const NIVEIS_ACHAR1 = [
  { id: 'f', nome: 'fácil', lv: 1, passo: 'tempo', bpm: [75, 100] },
  { id: 'm', nome: 'médio', lv: 2, passo: 'meio', bpm: [80, 115] },
  { id: 'd', nome: 'difícil', lv: 3, passo: 'qualquer', bpm: [80, 120] },
];
export const nivelDe = (id) => NIVEIS_ACHAR1.find((n) => n.id === id) || NIVEIS_ACHAR1[0];

/** Pontos de entrada possíveis (1 a steps-1; o 0 já seria o 1 na cara). */
export function ofertas(steps, passo) {
  const por = passo === 'tempo' ? steps / 4 : passo === 'meio' ? Math.max(1, steps / 8) : 1;
  const out = []; for (let o = por; o < steps; o += por) out.push(o);
  return out;
}

/** Sorteia uma rodada: groove (que não repete o anterior), ponto de entrada e andamento. `grooves` = lista de presets com { id|name, steps, bpm }. */
export function sorteiaRodada(nivelId, grooves, { rnd = Math.random, ultimo = null } = {}) {
  const nv = nivelDe(nivelId); const lista = grooves.length > 1 && ultimo ? grooves.filter((g) => (g.id || g.name) !== ultimo) : grooves;
  const g = lista[Math.floor(rnd() * lista.length)]; const of = ofertas(g.steps, nv.passo);
  const offset = of[Math.floor(rnd() * of.length)]; const bpm = Math.max(nv.bpm[0], Math.min(nv.bpm[1], g.bpm));
  return { g, offset, bpm };
}

/** Segundos (desde o começo da música) de cada 1 de verdade e a duração total das 4 vezes do compasso. */
export function umsDaRodada({ bpm, steps, offset }, compassos = COMPASSOS) {
  const passo = 60 / bpm / (steps / 4); const bar = passo * steps; const primeiro = ((steps - offset) % steps) * passo;
  const total = compassos * bar; const uns = []; for (let t = primeiro; t < total - 1e-6; t += bar) uns.push(t);
  return { uns, total, bar };
}

/** Ponto da rodada: achou o 1 em pelo menos 2 compassos e quase não tocou fora dele (o 1º pode vir rápido demais). */
export function julgaRodada(toques, rodada) {
  const r = oneScore(toques, { bpm: rodada.bpm, steps: rodada.g.steps, offset: rodada.offset });
  const fora = r.total - r.hits; const acertou = r.hits >= 2 && fora <= 1;
  const { uns, total } = umsDaRodada({ bpm: rodada.bpm, steps: rodada.g.steps, offset: rodada.offset });
  return { ...r, fora, acertou, uns, total, toques: r.res.map((x, i) => ({ t: toques[i], ok: x.near })) };
}

/** 3 de 5 = 1 ★, 4 de 5 = 2 ★, 5 de 5 = 3 ★. */
export const estrelasAchar1 = (pontos) => estrelasPct(Math.round((pontos / RODADAS) * 100));

/** Frase do Paul pro fim da rodada. */
export function fraseRodada(r) {
  if (!r.total) return 'você não tocou! ouça o groove e toque quando sentir o 1.';
  if (r.acertou) return r.avg != null && Math.abs(r.avg) < 25 ? 'em cima do 1! o Paul ficou de queixo caído.' : 'achou o 1!';
  if (r.hits === 0) return 'não foi dessa vez. o 1 costuma ter o bumbo e vem depois do 4.';
  return r.fora > 1 ? 'você tocou em lugares demais. escolha só o 1.' : 'quase! só achou o 1 uma vez.';
}
