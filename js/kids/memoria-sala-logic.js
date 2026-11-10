// Jogo da memória em 2 celulares: regras puras (sem tela). O estado inteiro vai e volta pela sala (online.js).
// A mesa é a mesma nos dois celulares: o baralho (ids das cartas, já embaralhado pela semente) viaja no estado.
// Jogador 0 = quem criou a sala, jogador 1 = quem entrou.
import { seeded } from '../campanha/jogos/memoria-logic.js';

/** Embaralhamento de Fisher-Yates com semente: mesma semente, mesma ordem, em qualquer aparelho. */
export function embaralhar(lista, seed) {
  const rnd = seeded(Number(seed) >>> 0); const b = lista.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
/** Semente da próxima mesa (revanche): igual nos dois celulares se os dois apertarem. */
export const proximaSemente = (seed) => (Math.imul((Number(seed) >>> 0) ^ 0x9e3779b9, 2654435761) >>> 0) || 1;
export const novaSemente = (rnd = Math.random) => (Math.floor(rnd() * 4294967295) >>> 0) || 1;

/** Mesa nova. `ids` = ids de todas as cartas possíveis do tema; sorteia `pares` deles e embaralha as 2n cartas. */
export function novaMesa({ tema, titulo = '', pares, again = true, seed, ids, mesa = 0 }) {
  const s = Number(seed) >>> 0; const n = Math.min(pares, ids.length);
  const pick = embaralhar(ids, s).slice(0, n);
  const deck = embaralhar(pick.flatMap((id) => [id, id]), s ^ 0x5bd1e995);
  return { v: 1, tema, titulo, pares: n, again: again !== false, seed: s, mesa, deck, vez: mesa % 2, virou: [], achou: [[], []], jogadas: 0, fim: false };
}
export const valido = (e) => !!e && e.v === 1 && Array.isArray(e.deck) && e.deck.length === e.pares * 2 && Array.isArray(e.virou) && Array.isArray(e.achou) && e.achou.length === 2;

export const achada = (e, pos) => e.achou[0].includes(pos) || e.achou[1].includes(pos);
export const placar = (e) => [e.achou[0].length / 2, e.achou[1].length / 2];
/** vencedor: 0, 1 ou -1 (empate); null enquanto a partida não acabou */
export function vencedor(e) { if (!e.fim) return null; const [a, b] = placar(e); return a === b ? -1 : a > b ? 0 : 1; }
/** tem duas cartas viradas esperando o desfecho (par ou erro) */
export const pendente = (e) => e.virou.length === 2 && !e.fim;
/** é par? (só faz sentido com 2 viradas) */
export const ePar = (e) => e.virou.length === 2 && e.deck[e.virou[0]] === e.deck[e.virou[1]];

/** Só quem tem a vez vira, uma carta de cada vez, até 2; nunca uma já virada ou achada. */
export function podeVirar(e, quem, pos) {
  return !e.fim && e.vez === quem && e.virou.length < 2 && Number.isInteger(pos) && pos >= 0 && pos < e.deck.length && !e.virou.includes(pos) && !achada(e, pos);
}
/** Vira a carta `pos`. Devolve o estado novo, ou null se a jogada não vale. */
export function virar(e, quem, pos) {
  if (!podeVirar(e, quem, pos)) return null;
  return { ...e, virou: [...e.virou, pos], jogadas: e.jogadas + 1 };
}
/** Fecha a jogada (duas viradas): par soma o ponto e (se a regra deixa) joga de novo; erro desvira e passa a vez. Sem duas viradas, devolve o mesmo estado. */
export function resolver(e) {
  if (!pendente(e)) return e;
  const [a, b] = e.virou;
  if (ePar(e)) {
    const achou = e.achou.map((l, i) => (i === e.vez ? [...l, a, b] : l.slice()));
    const fim = achou[0].length + achou[1].length === e.deck.length;
    return { ...e, achou, virou: [], fim, vez: e.again || fim ? e.vez : 1 - e.vez, jogadas: e.jogadas + 1 };
  }
  return { ...e, virou: [], vez: 1 - e.vez, jogadas: e.jogadas + 1 };
}
/** Revanche: mesa nova (semente nova, igual nos dois celulares), mesmas escolhas; quem começa alterna. `ids` = todas as cartas do tema. */
export function revanche(e, ids) {
  return novaMesa({ tema: e.tema, titulo: e.titulo, pares: e.pares, again: e.again, seed: proximaSemente(e.seed), ids: ids && ids.length >= e.pares ? ids : [...new Set(e.deck)].sort(), mesa: e.mesa + 1 });
}
