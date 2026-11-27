// Estúdio de criação: o que já funciona abre; o que ainda está sendo construído aparece como "em construção", sem botão de enfeite.
import { h } from './ui.js';
const PRONTO = [['#/editor', 'Editor de partituras', 'Monte a partitura tocando no teclado ou no microfone, corrija, ouça e exporte em PDF. Guarde na sua pasta online.', 'teclado']];
const DEPOIS = [['Violão, guitarra e baixo (tablatura)', 'próximo'], ['Bateria e figuras rítmicas', 'próximo'], ['Gerador de apostilas', 'em construção'], ['Jogos musicais personalizados', 'em construção'], ['Flashcards e avaliações', 'em construção'], ['Atividades para colorir', 'em construção']];
export function mount(host) {
  host.append(h('div', { class: 'pt' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Estúdio de criação'), h('h1', {}, 'Crie o material da sua aula'))),
    h('section', {}, h('h2', { class: 'pt-s' }, 'Disponível agora'), h('ul', { class: 'pt-lista' }, ...PRONTO.map(([href, t, x, tag]) => h('li', {}, h('a', { href }, h('b', {}, t), h('span', {}, x), h('em', {}, tag)))))),
    h('section', {}, h('h2', { class: 'pt-s' }, 'A caminho'), h('ul', { class: 'pe-rota' }, ...DEPOIS.map(([t, s]) => h('li', {}, h('span', {}, t), h('em', {}, s)))))));
  return () => {};
}
