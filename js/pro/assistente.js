// Assistente pedagógico. A IA precisa de um serviço no servidor (chave + função segura); enquanto ele não está ligado, a tela diz isso com clareza e não finge responder.
import { h } from './ui.js';
export function mount(host) {
  host.append(h('div', { class: 'pt' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Assistente pedagógico'), h('h1', {}, 'Em preparação'))),
    h('div', { class: 'pas' }, h('img', { class: 'pas-paul', src: 'assets/robo-logo.png', alt: '', width: 96, height: 96 }), h('div', {},
      h('p', {}, 'O assistente com IA ainda não está ligado. Ele precisa de uma conexão segura no servidor, e eu prefiro entregar isso certo a deixar uma caixa de texto que não responde.'),
      h('p', { class: 'pt-mudo' }, 'Quando ligar, ele vai sugerir atividades, explicar conceitos, adaptar exercícios por idade e nível e ajudar a montar o roteiro das aulas que você cria aqui.'),
      h('p', {}, h('a', { class: 'pb', href: '#/aulas/nova' }, 'Enquanto isso, use a estrutura sugerida do Criador de aulas')))))); return () => {};
}
