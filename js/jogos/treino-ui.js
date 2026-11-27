// Modo TREINO dos jogos de aprender (pedido da Bea, nov/2026): sem trilha, sem estrelas, sem figurinhas, sem mexer no progresso.
// O professor escolhe o nível e joga rodadas novas quantas vezes quiser; as alunas treinam sem gastar nada. Só a parte de tela (botão grande + escolha do nível).
import { h } from '../util.js';

/** Botão grande, sempre logo abaixo do título do mapa (o mais visível da tela). */
export function botaoTreino(onclick, sub = 'sem trilha e sem estrelas · rodadas novas sem parar') {
  return h('button', { type: 'button', class: 'tm-treino', 'data-treino': '1', onclick },
    h('span', { class: 'tm-treino-ico', 'aria-hidden': 'true' }, '🎯'),
    h('span', { class: 'tm-treino-t' }, h('b', {}, 'modo treino'), h('small', {}, sub)),
    h('span', { class: 'tm-treino-go', 'aria-hidden': 'true' }, '▶'));
}

/**
 * Tela de escolha do treino. `grupos` = [{ rotulo, itens: [[valor, texto]], atual, onPick(valor), ajuda? }]; quem chama guarda o valor e chama `redesenhar()`.
 * `onStart` começa a jogar; `onBack` volta pro mapa.
 */
export function telaTreino(root, { titulo, dica, grupos, onStart, onBack }) {
  root.replaceChildren(
    h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: onBack }, '‹ mapa')),
    h('div', { class: 'tm-treino-tela' },
      h('h2', { class: 'jg-h hand' }, `🎯 ${titulo}`),
      h('p', { class: 'jg-p' }, dica || 'rodadas novas sem parar, no nível que você escolher. não vale estrela nem figurinha e não muda o seu progresso.'),
      ...grupos.map((g) => h('div', { class: 'tm-treino-grupo' },
        h('p', { class: 'dn-lab' }, g.rotulo),
        h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': g.rotulo }, ...g.itens.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === g.atual), class: v === g.atual ? 'on' : '', 'data-v': String(v), onclick: () => g.onPick(v) }, t))),
        g.ajuda ? h('p', { class: 'muted tm-treino-ajuda' }, g.ajuda) : null)),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary tm-treino-start', type: 'button', onclick: onStart }, 'começar o treino ▶'))));
}
