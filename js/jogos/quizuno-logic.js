// Quiz Uno Musical (regra pura, sem tela): rodada de 5 perguntas, cada uma mostra uma figura (nota ou pausa) e pede o nome entre 3 opções.
// Acertou as 5 seguidas = 1 giro da roleta (até 3 por dia).
import { SYMS, SYM_NAME } from './cartas-simbolos.js';
export const PERGUNTAS = 5; export const OPCOES = 3; export const GIROS_POR_DIA = 3;
const emb = (a, rnd) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/** Nome que o aluno vê (acento e fantasma só pelo nome curto). */
export const nomeDe = (sym) => ({ acento: 'acento', fantasma: 'nota fantasma' }[sym] || SYM_NAME[sym]);
/** Monta a rodada: 5 figuras diferentes, cada uma com 3 opções (a certa + 2 erradas, de preferência da mesma família: nota com nota, pausa com pausa). */
export function novaRodada(rnd = Math.random) {
  const sorteadas = emb(SYMS, rnd).slice(0, PERGUNTAS);
  const qs = sorteadas.map((sym) => {
    const familia = (s) => (s.startsWith('p_') ? 'pausa' : s === 'acento' || s === 'fantasma' ? 'sinal' : 'nota');
    const perto = emb(SYMS.filter((s) => s !== sym && familia(s) === familia(sym)), rnd); const longe = emb(SYMS.filter((s) => s !== sym && familia(s) !== familia(sym)), rnd);
    const erradas = [...perto, ...longe].slice(0, OPCOES - 1);
    const opcoes = emb([sym, ...erradas], rnd);
    return { sym, opcoes, certa: opcoes.indexOf(sym) };
  });
  return { qs, i: 0, acertos: 0, erros: 0, fim: false };
}
/** Responde a pergunta atual com o índice da opção. Devolve o novo estado e se acertou (puro). */
export function responder(r, escolha) {
  if (r.fim) return { r, acertou: false };
  const q = r.qs[r.i]; const acertou = escolha === q.certa;
  const n = { ...r, acertos: r.acertos + (acertou ? 1 : 0), erros: r.erros + (acertou ? 0 : 1), i: r.i + 1 };
  n.fim = n.i >= r.qs.length; return { r: n, acertou };
}
/** Ganhou o giro? Só se acertou as 5 sem errar nenhuma. */
export const perfeita = (r) => !!r && r.fim && r.erros === 0 && r.acertos === PERGUNTAS;
/** Conta os giros do dia (por perfil). `q` = { n, dia, hoje } → devolve o novo estado e se ganhou o giro. O id do giro é fixo (nada em dobro). */
export function contarGiro(q, dia) {
  const s = { n: 0, dia, hoje: 0, ...(q || {}) }; if (s.dia !== dia) { s.dia = dia; s.hoje = 0; }
  if (s.hoje >= GIROS_POR_DIA) return { q: s, ganhou: false, id: null, resta: 0 };
  const n = s.n + 1; return { q: { n, dia, hoje: s.hoje + 1 }, ganhou: true, id: n, resta: GIROS_POR_DIA - (s.hoje + 1) };
}
