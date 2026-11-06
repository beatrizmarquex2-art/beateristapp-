// "Amostra grátis" da área dos alunos: quem ainda não tem código vê um pedacinho (3 termos do dicionário, 2 passos da aulinha, 2 partidas
// de caça-palavras); o resto pede o código. É trava de tela (o conteúdo continua no aplicativo), como o resto do acesso.
import { h } from './util.js';
import * as AC from './acesso.js';

/** Estamos na área dos alunos e ainda sem código? (no app da Bea nada é limitado) */
export const alunoSemCodigo = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();

export const GRATIS = { termos: 3, aulinha: 2, caca: 2 };

/** Onde se pega o código de acesso: a lojinha (ainda em construção). */
export const LOJINHA = '#/lojinha';

/** Cartãozinho "isso é pra alunos": cadeado, o que falta e o caminho pra gerar o código (vai direto pra lojinha). */
export const avisoCodigo = (texto, rotulo = 'gerar meu código') => h('section', { class: 'card pad am-lock', role: 'status' }, h('span', { class: 'am-i', 'aria-hidden': 'true' }, '🔒'),
  h('p', {}, texto), h('a', { class: 'btn small', href: LOJINHA }, rotulo));

const KEY = 'beaterista-caca-gratis';
/** Quantas partidas grátis de caça-palavras já foram começadas neste aparelho. */
export const cacaUsadas = () => { try { return Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; } };
export const cacaUsar = () => { try { localStorage.setItem(KEY, String(cacaUsadas() + 1)); } catch { /* sem armazenamento: não conta */ } };
