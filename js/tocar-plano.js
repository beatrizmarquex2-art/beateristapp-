// Plano do Tocar: sem código de aluno vale só o básico de cada instrumento; com código abre tudo. O app da Bea (professora) nunca é limitado.
// Cada tela pergunta `pago()` na hora de desenhar e de reagir ao toque, então liberar o código muda tudo sem recarregar (o evento 'aluno-acesso' redesenha).
import * as AC from './acesso.js';
import { h } from './util.js';
import { toast } from './ui.js';

const doAluno = () => document.documentElement.classList.contains('aluno-on');
/** Tem tudo liberado? (professora, ou aluno com código completo) */
export const pago = () => !doAluno() || AC.liberado();
/** O que vale de graça em cada instrumento (um lugar só, pra mudar fácil). */
export const GRATIS = {
  violao: { acordes: 4, texto: 'violão com 4 acordes (dó, sol, lá menor, fá)' },
  teclas: { sons: ['piano'], texto: 'teclado com 1 som (piano)' },
  xilofone: { sons: ['xilofone'], escalas: ['maior'], texto: 'xilofone normal (dó maior)' },
  bateria: { modelos: ['acustica'], texto: 'bateria acústica, sem gravar' },
};
const abrirCodigo = () => { const b = document.querySelector('.al-tenho'); if (b && !b.hidden) b.click(); else location.hash = '#/lojinha'; };
/** Aviso curto quando toca numa coisa trancada. */
export function pedir(oQue) { toast(`🔒 ${oQue} abre com o código de aluno`, { action: 'ver como', onAction: () => { location.hash = '#/lojinha'; }, ms: 4200, id: 'tocar-plano' }); }
/** Faixa no alto da tela dizendo o que é grátis (só aparece sem código). */
export function faixaPlano(resumo) {
  if (pago()) return null;
  return h('section', { class: 'tp-faixa', role: 'note' },
    h('p', {}, h('b', {}, '🔒 plano grátis: '), resumo, '. com o código de aluno abre tudo.'),
    h('div', { class: 'tp-btns' }, h('button', { type: 'button', class: 'kd-chip on', onclick: abrirCodigo }, '🔑 tenho código'), h('a', { class: 'kd-chip', href: '#/lojinha' }, 'ver na lojinha')));
}
/** Ouve a liberação do código (redesenha a tela) e devolve a função que para de ouvir. */
export function aoLiberar(fn) { const f = () => fn(); document.addEventListener('aluno-acesso', f); return () => document.removeEventListener('aluno-acesso', f); }
/** Cadeado pequeno pra pôr dentro de botões e cartas. */
export const cadeado = () => h('i', { class: 'tp-lock', 'aria-hidden': 'true' }, '🔒');
