// Jogo da memória em 2 celulares: regras puras (sem tela). O estado inteiro vai e volta pela sala (online.js).
// A mesa é a mesma nos dois celulares: o baralho (ids das cartas, já embaralhado pela semente) viaja no estado.
// Jogador 0 = quem criou a sala, os outros entram em ordem (1, 2, 3). 2 a 4 jogadores (`n`; sem `n` na mesa = 2, como era antes).
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
export const jogadoresDe = (e) => (e && Number.isInteger(e.n) && e.n >= 2 && e.n <= 4 ? e.n : 2);
export function novaMesa({ tema, titulo = '', pares, again = true, seed, ids, mesa = 0, n: nj = 2, nomes = null }) {
  const s = Number(seed) >>> 0; const n = Math.min(pares, ids.length);
  const pick = embaralhar(ids, s).slice(0, n);
  const deck = embaralhar(pick.flatMap((id) => [id, id]), s ^ 0x5bd1e995);
  const J = Math.max(2, Math.min(4, nj | 0 || 2));
  return { v: 1, tema, titulo, pares: n, again: again !== false, seed: s, mesa, deck, vez: mesa % J, virou: [], achou: Array.from({ length: J }, () => []), jogadas: 0, fim: false, ...(J > 2 ? { n: J } : {}), ...(nomes ? { nomes: nomes.slice(0, J).map((x) => String(x || '').slice(0, 20)) } : {}) };
}
export const valido = (e) => !!e && e.v === 1 && Array.isArray(e.deck) && e.deck.length === e.pares * 2 && Array.isArray(e.virou) && Array.isArray(e.achou) && e.achou.length === jogadoresDe(e);

/** Lugares que saíram da partida (a maioria decidiu continuar sem eles; guardam os pares e as ★ que já tinham). */
export const foraDe = (e) => (Array.isArray(e.fora) ? e.fora : []);
/** Próximo lugar depois de `de` que ainda está na partida. */
export function proximoDe(e, de) { const n = jogadoresDe(e); const fora = foraDe(e); for (let k = 1; k <= n; k++) { const q = (de + k) % n; if (!fora.includes(q)) return q; } return de; }
/** Tira os lugares `lugares` da partida: quem estava com a vez passa pro próximo; sobrou só uma pessoa = fim. */
export function tirar(e, lugares) {
  const fora = [...new Set([...foraDe(e), ...lugares])]; if (fora.length === foraDe(e).length) return e;
  let n = { ...e, fora }; if (fora.includes(e.vez)) { n = { ...n, virou: [], vez: proximoDe(n, e.vez), jogadas: e.jogadas + 1 }; }
  if (jogadoresDe(e) - fora.length <= 1) n = { ...n, virou: [], fim: true };
  return n;
}
export const achada = (e, pos) => e.achou.some((l) => l.includes(pos));
export const donoDe = (e, pos) => e.achou.findIndex((l) => l.includes(pos));
export const placar = (e) => e.achou.map((l) => l.length / 2);
/** vencedor: 0, 1 ou -1 (empate); null enquanto a partida não acabou */
export function vencedor(e) { if (!e.fim) return null; const fora = foraDe(e); const sc = placar(e).map((x, i) => (fora.includes(i) ? -1 : x)); const m = Math.max(...sc); const quem = sc.map((x, i) => (x === m ? i : -1)).filter((i) => i >= 0); return quem.length > 1 ? -1 : quem[0]; } // quem saiu guarda os pares e as ★, mas não ganha a partida
/** tem duas cartas viradas esperando o desfecho (par ou erro) */
export const pendente = (e) => e.virou.length === 2 && !e.fim;
/** é par? (só faz sentido com 2 viradas) */
export const ePar = (e) => e.virou.length === 2 && e.deck[e.virou[0]] === e.deck[e.virou[1]];

/** Só quem tem a vez vira, uma carta de cada vez, até 2; nunca uma já virada ou achada. */
export function podeVirar(e, quem, pos) {
  return !e.fim && e.vez === quem && !foraDe(e).includes(quem) && e.virou.length < 2 && Number.isInteger(pos) && pos >= 0 && pos < e.deck.length && !e.virou.includes(pos) && !achada(e, pos);
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
    const fim = achou.reduce((t, l) => t + l.length, 0) === e.deck.length;
    return { ...e, achou, virou: [], fim, vez: e.again || fim ? e.vez : proximoDe(e, e.vez), jogadas: e.jogadas + 1 };
  }
  return { ...e, virou: [], vez: proximoDe(e, e.vez), jogadas: e.jogadas + 1 };
}
/** Revanche: mesa nova (semente nova, igual nos dois celulares), mesmas escolhas; quem começa alterna. `ids` = todas as cartas do tema. */
export function revanche(e, ids) {
  const nova = novaMesa({ tema: e.tema, titulo: e.titulo, pares: e.pares, again: e.again, seed: proximaSemente(e.seed), ids: ids && ids.length >= e.pares ? ids : [...new Set(e.deck)].sort(), mesa: e.mesa + 1, n: jogadoresDe(e), nomes: e.nomes || null });
  return foraDe(e).length ? tirar(nova, foraDe(e)) : nova; // quem saiu continua fora na revanche
}

