// Cara a Cara Musical em 2 celulares: protocolo PURO sobre o estado compartilhado da sala (js/jogos/online.js).
// O segredo de cada jogador NUNCA vai pra sala: só um selo (SHA-256 de "segredo|sal"). Quem é perguntado responde do próprio aparelho.
// No fim cada um revela segredo+sal; o outro celular confere o selo e se todas as respostas foram honestas.
import { BY_Q } from './perguntas.js';
import * as R from './regras.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const hex = (u8) => [...u8].map((x) => x.toString(16).padStart(2, '0')).join('');
export async function selo(segredo, sal) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${segredo}|${sal}`)))); }
export const novoSal = () => hex(crypto.getRandomValues(new Uint8Array(12)));

/** Estado inicial da sala. Em cada rodada começa quem não começou a anterior. */
export function novoEstado({ modo, mesa, serie = null, rodada = 1 }) {
  return { v: 1, modo, palpites: modo === 'kids' ? 2 : 1, mesa, rodada, serie: serie || R.novaSerie(), selos: [null, null], turno: (rodada - 1) % 2, log: [], reveal: [null, null], fim: null };
}
export const cartaDe = (e, id) => e.mesa.cartas.find((c) => c.id === id);

/** O que o jogador p sabe sobre o segredo do outro: só respostas recebidas (nunca o segredo). */
export function ladoDe(e, p) {
  const lado = { fora: [], perguntas: [], erros: [], palpites: e.palpites, terminou: false, acertou: false, dica: null, aberto: null };
  for (const x of e.log) {
    if (x.p !== p) continue;
    if (x.t === 'q' || x.t === 'g') lado.aberto = x;
    else if (x.t === 'a') {
      const q = BY_Q[x.qid]; lado.aberto = null; lado.perguntas.push({ id: x.qid, sim: x.sim });
      for (const c of e.mesa.cartas) if (!lado.fora.includes(c.id) && R.respostaDe(q, c) !== x.sim) lado.fora.push(c.id);
    } else if (x.t === 'v') {
      lado.aberto = null;
      if (x.ok) { lado.terminou = true; lado.acertou = true; } else { lado.erros.push(x.id); lado.palpites--; lado.dica = x.dica || null; if (lado.palpites <= 0) lado.terminou = true; }
    }
  }
  return lado;
}
export function fase(e) {
  if (!e.selos[0] || !e.selos[1]) return 'escolha';
  return ladoDe(e, 0).terminou && ladoDe(e, 1).terminou ? 'fim' : 'jogo';
}
/** Pergunta/palpite aguardando resposta (do outro celular). */
export function pendente(e) { const u = e.log[e.log.length - 1]; return u && (u.t === 'q' || u.t === 'g') ? u : null; }
export const candidatos = (e, p) => R.candidatosDo(e.mesa, ladoDe(e, p));
export const perguntasLivres = (e, p) => R.disponiveis(e.mesa, ladoDe(e, p));

export function escolher(e, p, selo$) { if (e.selos[p]) throw new Error('já escolheu'); const n = clone(e); n.selos[p] = selo$; return n; }
export function perguntar(e, p, qid) {
  if (fase(e) !== 'jogo' || e.turno !== p || pendente(e)) throw new Error('não é a sua vez');
  const lado = ladoDe(e, p); if (lado.terminou) throw new Error('você já terminou');
  if (!R.disponiveis(e.mesa, lado).some((q) => q.id === qid)) throw new Error('pergunta indisponível');
  const n = clone(e); n.log.push({ p, t: 'q', qid }); return n;
}
export function palpitar(e, p, id) {
  if (fase(e) !== 'jogo' || e.turno !== p || pendente(e)) throw new Error('não é a sua vez');
  const lado = ladoDe(e, p); if (lado.terminou) throw new Error('você já terminou');
  if (!R.candidatosDo(e.mesa, lado).includes(id)) throw new Error('carta fora do jogo');
  const n = clone(e); n.log.push({ p, t: 'g', id }); return n;
}
/** Quem foi perguntado (p) responde com o próprio segredo. Fecha a rodada quando os dois terminaram. */
export function responder(e, p, segredo) {
  const pend = pendente(e); if (!pend || pend.p === p) throw new Error('nada pra responder');
  const n = clone(e); const carta = cartaDe(n, segredo);
  if (pend.t === 'q') { const sim = R.respostaDe(BY_Q[pend.qid], carta); if (sim === null) throw new Error('atributo não verificado'); n.log.push({ p: pend.p, t: 'a', qid: pend.qid, sim }); }
  else {
    const ok = pend.id === segredo; const v = { p: pend.p, t: 'v', id: pend.id, ok };
    if (!ok && n.modo === 'kids' && ladoDe(e, pend.p).palpites - 1 > 0) { const d = R.dicaPara(n.mesa, { segredo }, pend.id); if (d) v.dica = d; }
    n.log.push(v);
  }
  const l = [ladoDe(n, 0), ladoDe(n, 1)];
  if (l[0].terminou && l[1].terminou) { const res = R.resultadoRodada(l[0], l[1]); n.serie = R.fecharRodada(n.serie, res); n.fim = res; n.turno = pend.p; }
  else n.turno = !l[p].terminou ? p : pend.p; // alterna; quem já terminou é pulado
  return n;
}
export function revelar(e, p, segredo, sal) { const n = clone(e); n.reveal[p] = { segredo, sal }; return n; }
/** Confere (no celular de quem NÃO é o dono) se o selo bate e se todas as respostas dadas eram verdadeiras. */
export async function conferir(e, dono) {
  const r = e.reveal[dono]; const problemas = []; if (!r) return { ok: false, problemas: ['ainda não revelou'] };
  if ((await selo(r.segredo, r.sal)) !== e.selos[dono]) problemas.push('a carta revelada não bate com a escolhida no início');
  const carta = cartaDe(e, r.segredo); if (!carta) { problemas.push('carta fora da mesa'); return { ok: false, problemas }; }
  for (const x of e.log) { if (x.p === dono) continue;
    if (x.t === 'a' && R.respostaDe(BY_Q[x.qid], carta) !== x.sim) problemas.push(`resposta errada em "${BY_Q[x.qid].kids}"`);
    if (x.t === 'v' && x.ok !== (x.id === r.segredo)) problemas.push('veredito de palpite errado'); }
  return { ok: !problemas.length, problemas };
}
/** Próxima rodada (mesa nova) ou novo duelo (placar zerado). */
export function proxima(e, mesa) { return novoEstado({ modo: e.modo, mesa, serie: e.serie.fim ? null : e.serie, rodada: e.serie.fim ? 1 : e.rodada + 1 }); }
