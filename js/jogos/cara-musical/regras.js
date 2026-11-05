// Regras PURAS do Cara a Cara Musical (sem tela, testáveis no node).
// Princípios: (1) atributo null = não verificado: nunca vira sim/não e a pergunta some da mesa inteira; (2) uma entidade aparece UMA vez por mesa;
// (3) toda mesa tem solução: qualquer par de cartas se separa por alguma pergunta disponível; (4) o bot só usa respostas recebidas, nunca o segredo.
import { ENTIDADES, BY_ID, FOTOS } from './elenco.js';
import { PERGUNTAS, BY_Q } from './perguntas.js';

export const TAMANHOS = { kids: [6, 12], classico: [12, 20] };
const clone = (x) => JSON.parse(JSON.stringify(x));
export const shuffle = (list, rnd = Math.random) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** true / false / null da pergunta para uma carta da mesa ({ id, foto }). */
export function respostaDe(q, carta) {
  const v = q.de === 'foto' ? (FOTOS[carta.foto] || {})[q.attr] : (BY_ID[carta.id] || { attrs: {} }).attrs[q.attr];
  return v === true ? true : v === false ? false : null;
}
const cartasOf = (mesa) => mesa.cartas;
/** Perguntas que servem pra essa mesa: o modo permite (kids usa as simples) e TODAS as cartas têm resposta verificada. */
export function perguntasDaMesa(cartas, modo) {
  return PERGUNTAS.filter((q) => (modo !== 'kids' || q.kidsOk) && cartas.every((c) => respostaDe(q, c) !== null));
}
/** Todo par de cartas se separa por alguma pergunta? (então a mesa tem solução) */
export function mesaTemSolucao(cartas, modo) {
  const qs = perguntasDaMesa(cartas, modo); if (!qs.length) return cartas.length <= 1;
  for (let i = 0; i < cartas.length; i++) for (let j = i + 1; j < cartas.length; j++) if (!qs.some((q) => respostaDe(q, cartas[i]) !== respostaDe(q, cartas[j]))) return false;
  return true;
}
function fotoDe(ent, rnd) { // prefere uma foto com preto_e_branco verificado (assim a pergunta da cor não some à toa)
  const ok = ent.fotos.filter((f) => (FOTOS[f] || {}).preto_e_branco !== null); const pool = ok.length ? ok : ent.fotos; return pool[Math.floor(rnd() * pool.length)];
}
/** Mesa nova: `tamanho` entidades DIFERENTES, uma foto por entidade, com solução garantida. `evitar` = ids que não podem entrar. */
export function novaMesa({ modo = 'classico', tamanho = 12, rnd = Math.random, evitar = [] } = {}) {
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const cartas = [];
    for (const e of shuffle(ENTIDADES.filter((x) => !evitar.includes(x.id)), rnd)) {
      const c = { id: e.id, foto: fotoDe(e, rnd) }; if (mesaTemSolucao([...cartas, c], modo)) cartas.push(c); if (cartas.length >= tamanho) break;
    }
    if (cartas.length >= tamanho) return { modo, cartas };
  }
  throw new Error('não consegui montar a mesa');
}

/* ---------- um lado da partida (quem investiga um segredo) ---------- */
export function novoLado({ mesa, segredo, palpites }) {
  return { segredo, fora: [], perguntas: [], palpites: palpites ?? 1, erros: [], terminou: false, acertou: false, dicaDada: false };
}
export const candidatosDo = (mesa, lado) => mesa.cartas.map((c) => c.id).filter((id) => !lado.fora.includes(id) && !lado.erros.includes(id));
/** Perguntas ainda não feitas por esse lado. */
export const disponiveis = (mesa, lado) => perguntasDaMesa(mesa.cartas, mesa.modo).filter((q) => !lado.perguntas.some((x) => x.id === q.id));
/** Quantos candidatos respondem sim/não a uma pergunta (pra sugerir perguntas que separam). */
export function divisao(mesa, lado, q) {
  const cand = candidatosDo(mesa, lado).map((id) => mesa.cartas.find((c) => c.id === id)); let sim = 0;
  for (const c of cand) if (respostaDe(q, c) === true) sim++; return { sim, nao: cand.length - sim };
}
export const informativas = (mesa, lado) => disponiveis(mesa, lado).filter((q) => { const d = divisao(mesa, lado, q); return d.sim > 0 && d.nao > 0; });
/** As melhores perguntas pra mostrar (as que dividem os candidatos mais perto da metade). */
export function sugestoes(mesa, lado, n = 3, rnd = Math.random) {
  const lista = informativas(mesa, lado).map((q) => { const d = divisao(mesa, lado, q); return { q, nota: Math.min(d.sim, d.nao) + rnd() * 0.5 }; }).sort((a, b) => b.nota - a.nota);
  return lista.slice(0, n).map((x) => x.q);
}
/** Faz a pergunta ao segredo de `lado`. `automatico`: já tira as cartas que não combinam. Devolve novo lado + a resposta. */
export function perguntar(mesa, lado0, qid, { automatico = true } = {}) {
  const q = BY_Q[qid]; if (!q) throw new Error('pergunta inexistente');
  if (lado0.terminou) throw new Error('lado já terminou');
  if (lado0.perguntas.some((x) => x.id === qid)) throw new Error('pergunta repetida');
  if (!perguntasDaMesa(mesa.cartas, mesa.modo).some((x) => x.id === qid)) throw new Error('pergunta indisponível nesta mesa');
  const lado = clone(lado0); const secreta = mesa.cartas.find((c) => c.id === lado.segredo); const sim = respostaDe(q, secreta);
  if (sim === null) throw new Error('atributo não verificado');
  const tirar = automatico ? candidatosDo(mesa, lado).filter((id) => respostaDe(q, mesa.cartas.find((c) => c.id === id)) !== sim) : [];
  lado.fora.push(...tirar); lado.perguntas.push({ id: qid, sim, tirou: tirar });
  return { lado, sim, tirou: tirar };
}
/** Vira ou desvira uma carta (modo manual). */
export function virar(lado0, id) { const lado = clone(lado0); lado.fora = lado.fora.includes(id) ? lado.fora.filter((x) => x !== id) : [...lado.fora, id]; return lado; }
export function desfazerUltimaVirada(lado0) { if (!lado0.fora.length) throw new Error('nada a desfazer'); const lado = clone(lado0); lado.fora.pop(); return lado; }
/** Palpite: acertou termina com vitória; errou gasta palpite (a carta sai) e, sem palpites, termina. */
export function palpitar(lado0, id) {
  if (lado0.terminou) throw new Error('lado já terminou'); if (lado0.erros.includes(id)) throw new Error('já palpitado');
  const lado = clone(lado0);
  if (id === lado.segredo) { lado.terminou = true; lado.acertou = true; return { lado, acertou: true }; }
  lado.erros.push(id); lado.palpites--; if (lado.palpites <= 0) lado.terminou = true;
  return { lado, acertou: false };
}
/** Dica validada depois do 1º erro (Kids): fala de UM atributo verificado do segredo que separa o segredo de quem foi chutado. */
export function dicaPara(mesa, lado, chutouId) {
  const alvo = mesa.cartas.find((c) => c.id === lado.segredo); const chute = mesa.cartas.find((c) => c.id === chutouId);
  for (const q of perguntasDaMesa(mesa.cartas, mesa.modo)) if (respostaDe(q, alvo) !== respostaDe(q, chute)) return { id: q.id, sim: respostaDe(q, alvo) };
  return null;
}

/* ---------- Paul (oponente local de regras) ---------- */
/** O Paul escolhe a próxima pergunta usando SÓ o que já sabe: as cartas da mesa, o que eliminou e o que já perguntou. Nunca recebe o segredo.
 *  nivel 'iniciante': escolhe ao acaso entre perguntas que separam (às vezes desperdiça uma). 'desafio': escolhe a que mais divide ao meio. */
export function paulEscolhe(mesa, lado, nivel = 'desafio', rnd = Math.random) {
  const inf = informativas(mesa, lado); const pool = inf.length ? inf : disponiveis(mesa, lado); if (!pool.length) return null;
  if (nivel === 'iniciante') { const q = rnd() < 0.3 ? shuffle(disponiveis(mesa, lado), rnd)[0] : shuffle(pool, rnd)[0]; return q ? q.id : null; }
  let best = null; let bestNota = -1;
  for (const q of shuffle(pool, rnd)) { const d = divisao(mesa, lado, q); const nota = Math.min(d.sim, d.nao); if (nota > bestNota) { best = q; bestNota = nota; } }
  return best.id;
}
/** Quando o Paul palpita: só com 1 candidato (desafio) ou 1 candidato / 2 candidatos na dúvida (iniciante é mais calmo: espera ter 1). */
export const paulPalpita = (mesa, lado) => (candidatosDo(mesa, lado).length === 1 ? candidatosDo(mesa, lado)[0] : null);

/* ---------- placar: melhor de 3 ---------- */
export function novaSerie(tamanhoVitoria = 2) { return { vitorias: [0, 0], empates: 0, rodadas: [], alvo: tamanhoVitoria, fim: false, vencedor: null }; }
/** Resultado da rodada: compara os dois lados que terminaram. Acertou vence quem errou; os dois acertaram: menos perguntas; igual: empate. */
export function resultadoRodada(ladoA, ladoB) {
  const a = ladoA.acertou; const b = ladoB.acertou; const qa = ladoA.perguntas.length; const qb = ladoB.perguntas.length;
  if (a && !b) return { vencedor: 0, motivo: 'acertou e o outro não', perguntas: [qa, qb] };
  if (b && !a) return { vencedor: 1, motivo: 'acertou e o outro não', perguntas: [qa, qb] };
  if (!a && !b) return { vencedor: null, motivo: 'ninguém acertou', perguntas: [qa, qb] };
  if (qa < qb) return { vencedor: 0, motivo: 'menos perguntas', perguntas: [qa, qb] };
  if (qb < qa) return { vencedor: 1, motivo: 'menos perguntas', perguntas: [qa, qb] };
  return { vencedor: null, motivo: 'empate em perguntas', perguntas: [qa, qb] };
}
export function fecharRodada(serie0, res) {
  const s = clone(serie0); s.rodadas.push(res);
  if (res.vencedor === null) s.empates++; else s.vitorias[res.vencedor]++;
  if (s.vitorias[0] >= s.alvo) { s.fim = true; s.vencedor = 0; } else if (s.vitorias[1] >= s.alvo) { s.fim = true; s.vencedor = 1; }
  return s;
}
