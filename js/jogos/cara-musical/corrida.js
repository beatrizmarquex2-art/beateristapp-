// Cara a Cara Musical em sala de 3 ou 4 celulares ("corrida"): TODOS procuram a MESMA carta secreta do Paul, cada um no seu celular.
// Regras PURAS (sem tela). O estado da sala guarda a mesa, a carta do Paul e o andamento de cada pessoa (quantas perguntas, se terminou, se acertou).
// Quem acertou com MENOS perguntas vence; empate em perguntas: quem terminou primeiro (ordem em que cada celular avisou a sala, sem relógio do aparelho).
// Obs.: a carta secreta viaja no estado da sala (como é a do Paul, o celular responde sozinho); a tela nunca a mostra antes de todos terminarem.
export const MAX_JOGADORES = 4;
const clone = (x) => JSON.parse(JSON.stringify(x));
/** Lugares que saíram (a maioria decidiu continuar sem eles). Ficam na sala com o que já tinham, mas não esperam, não ranqueiam e não ganham ★ novas. */
export const foraDe = (e) => (Array.isArray(e.fora) ? e.fora : []);
/** Quantos ainda estão na partida. */
export const nAtivos = (e) => e.prog.filter((_, i) => !foraDe(e).includes(i)).length;
/** Quem manda na sala agora (próxima rodada): o menor lugar que ficou. */
export const primeiroAtivo = (e) => { const i = e.prog.findIndex((_, k) => !foraDe(e).includes(k)); return i < 0 ? 0 : i; };
export const progVazio = () => ({ p: 0, e: 0, fim: false, ok: false, ordem: 0 });

/** Estado de uma corrida nova. `mesa` = mesa do cara a cara musical; `segredo` = id da carta do Paul; `nomes` = nomes por lugar. */
export function novoEstadoCorrida({ modo, mesa, segredo, palpites, num, nomes = [], rodada = 1 }) {
  const n = Math.max(3, Math.min(MAX_JOGADORES, num | 0));
  return { v: 1, corrida: true, modo, mesa, segredo, palpites, n, rodada, nomes: Array.from({ length: n }, (_, i) => String(nomes[i] || '').slice(0, 20)), prog: Array.from({ length: n }, progVazio) };
}
export const valida = (e) => !!e && e.corrida === true && e.v === 1 && !!e.mesa && Array.isArray(e.mesa.cartas) && typeof e.segredo === 'string' && Array.isArray(e.prog) && e.prog.length === e.n && e.n >= 3 && e.n <= MAX_JOGADORES;

/** O andamento do lado `lado` (de regras.js novoLado/perguntar/palpitar) no formato da sala. */
export const progDe = (lado) => ({ p: lado.perguntas.length, e: lado.erros.length, fim: !!lado.terminou, ok: !!lado.acertou });
/** Põe o andamento de `quem` no estado. Quando ele termina agora, ganha a próxima posição de chegada (`ordem`). Devolve estado novo (o antigo não muda). */
export function aplicar(e, quem, lado) {
  if (foraDe(e).includes(quem)) return e; // quem saiu não mexe mais no próprio andamento
  const n = clone(e); const antes = n.prog[quem]; const novo = { ...progDe(lado), ordem: antes.ordem };
  if (novo.fim && !antes.fim) novo.ordem = n.prog.reduce((m, x) => Math.max(m, x.ordem || 0), 0) + 1;
  n.prog[quem] = novo; return n;
}
/** Tira `lugares` da partida: o andamento vira "terminou sem acertar" (se ainda não tinha terminado) e marcado `saiu`. Devolve o mesmo estado se nada mudou. */
export function tirar(e, lugares) {
  const fora = [...new Set([...foraDe(e), ...lugares.filter((l) => Number.isInteger(l) && l >= 0 && l < e.n)])];
  if (fora.length === foraDe(e).length) return e;
  const n = clone(e); n.fora = fora;
  fora.forEach((l) => { const x = n.prog[l]; n.prog[l] = x.fim ? { ...x, saiu: true } : { ...x, fim: true, ok: false, saiu: true, ordem: n.prog.reduce((m, y) => Math.max(m, y.ordem || 0), 0) + 1 }; });
  return n;
}
export const todosTerminaram = (e) => e.prog.every((x, i) => foraDe(e).includes(i) || x.fim); // quem saiu não é esperado
export const terminaram = (e) => e.prog.filter((x, i) => x.fim && !foraDe(e).includes(i)).length;
/** Classificação: quem acertou (menos perguntas, depois quem chegou antes), depois quem não acertou (quem já terminou na frente de quem ainda joga). */
export function classificacao(e) {
  const fora = foraDe(e); const lista = e.prog.map((x, i) => ({ i, ...x, saiu: fora.includes(i) || !!x.saiu }));
  return lista.sort((a, b) => {
    if (a.saiu !== b.saiu) return a.saiu ? 1 : -1; // quem saiu fica no fim, fora da disputa
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    if (a.ok) return a.p - b.p || a.ordem - b.ordem;
    if (a.fim !== b.fim) return a.fim ? -1 : 1;
    return a.p - b.p || a.i - b.i;
  });
}
/** Lugar (0 a 3) de quem venceu, ou -1 se ninguém acertou, ou null enquanto falta gente terminar. */
export function vencedor(e) { if (!todosTerminaram(e)) return null; const r = classificacao(e)[0]; return r && r.ok && !r.saiu ? r.i : -1; }
/** Rodada seguinte: mesa e carta novas, mesmos nomes e jogadores; o andamento zera. */
export function proximaRodada(e, mesa, segredo) { const novo = novoEstadoCorrida({ modo: e.modo, mesa, segredo, palpites: e.palpites, num: e.n, nomes: e.nomes, rodada: e.rodada + 1 }); return foraDe(e).length ? tirar(novo, foraDe(e)) : novo; } // quem saiu continua fora
