// "Amostra grátis" da área dos alunos: quem ainda não tem código vê um pedacinho (3 termos do dicionário, 2 passos da aulinha, 2 partidas
// de caça-palavras, 2 cruzadinhas); o resto pede o código. É trava de tela (o conteúdo continua no aplicativo), como o resto do acesso.
import { h } from './util.js';
import * as AC from './acesso.js';

/** Estamos na área dos alunos e ainda sem código? (no app da Bea nada é limitado) */
export const alunoSemCodigo = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();

export const GRATIS = { termos: 3, aulinha: 2, caca: 2, cruzadinha: 2 };

/** Onde se pega o código de acesso: a lojinha (ainda em construção). */
export const LOJINHA = '#/lojinha';

/** Cartãozinho "isso é pra alunos": cadeado, o que falta e o caminho pra gerar o código (vai direto pra lojinha). */
export const avisoCodigo = (texto, rotulo = 'gerar meu código') => h('section', { class: 'card pad am-lock', role: 'status' }, h('span', { class: 'am-i', 'aria-hidden': 'true' }, '🔒'),
  h('p', {}, texto), h('a', { class: 'btn small', href: LOJINHA }, rotulo));

const KEY = 'beaterista-caca-gratis';
/** Quantas partidas grátis de caça-palavras já foram começadas neste aparelho. */
export const cacaUsadas = () => { try { return Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; } };
export const cacaUsar = () => { try { localStorage.setItem(KEY, String(cacaUsadas() + 1)); } catch { /* sem armazenamento: não conta */ } };

const KEYC = 'beaterista-cruzadinha-gratis';
/** Quantas cruzadinhas grátis já foram começadas neste aparelho (a criança vê como é, com as palavras do dicionário; o resto pede o código). */
export const cruzUsadas = () => { try { return Math.max(0, Number(localStorage.getItem(KEYC)) || 0); } catch { return 0; } };
export const cruzUsar = () => { try { localStorage.setItem(KEYC, String(cruzUsadas() + 1)); } catch { /* sem armazenamento: não conta */ } };

/* ---------- Plano grátis dos jogos de mesa (pedido da Bea, 28/nov/2026) ----------
   Sem código de aluno: Velha, Stop e Uno Musical só contra o robô e só 2 partidas cada; nada de sala (2 celulares, dupla, sala de aula).
   Cara a cara só com o tema "instrumentos". Eco do Paul só o xilofone. Memória só 2 temas (kids/memoria.js). Com código tudo abre. É trava de tela, como o resto. */
export const PARTIDAS_GRATIS = { velha: 2, stop: 2, cartas: 2 };
const kPartidas = (id) => `beaterista-gratis-partidas-${id}`;
/** Partidas grátis já usadas neste aparelho. */
export const partidasUsadas = (id) => { try { return Math.max(0, Number(localStorage.getItem(kPartidas(id))) || 0); } catch { return 0; } };
/** Quantas ainda dá pra jogar (Infinity = sem limite: app da Bea ou aluno com código). */
export const partidasRestam = (id) => (alunoSemCodigo() && PARTIDAS_GRATIS[id] ? Math.max(0, PARTIDAS_GRATIS[id] - partidasUsadas(id)) : Infinity);
/** Conta uma partida grátis (chamar ao COMEÇAR). Devolve false se não tem mais (não conta nada). */
export function partidaUsar(id) {
  if (!alunoSemCodigo() || !PARTIDAS_GRATIS[id]) return true;
  if (partidasUsadas(id) >= PARTIDAS_GRATIS[id]) return false;
  try { localStorage.setItem(kPartidas(id), String(partidasUsadas(id) + 1)); } catch { /* sem armazenamento: não conta */ } return true;
}
/** Sem código só joga contra o robô: sala, 2 celulares, dupla e sala de aula ficam trancados. */
export const soRobo = () => alunoSemCodigo();
/** Cartãozinho "acabaram as partidas grátis". */
export const avisoFimPartidas = (nome, id) => avisoCodigo(`as ${PARTIDAS_GRATIS[id] || 2} partidas grátis de ${nome} acabaram. com o código de aluno você joga sem limite e também com amigos, em sala.`);
