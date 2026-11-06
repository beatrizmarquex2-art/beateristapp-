// Opções discretas das telas de começo dos jogos: uma linha por escolha (rótulo pequeno + chips), ícones, setinhas e um "?" que esconde a explicação.
import { h } from '../util.js';
import { bq } from './bonequinhos.js';

/** Uma linha: rótulo miúdo à esquerda e as opções à direita. */
export const linha = (rotulo, ...itens) => h('div', { class: 'jo-linha' }, h('span', { class: 'jo-rot' }, rotulo), h('div', { class: 'jo-opc' }, ...itens.flat().filter(Boolean)));

/** Chips pequenos. lista: [valor, rótulo, ícone?]. Com ícone aparece só o ícone (o rótulo vira dica). */
export const chips = (lista, atual, aoEscolher, aria = '') => h('div', { class: 'jg-seg jo-chips', role: 'radiogroup', 'aria-label': aria || null },
  ...lista.map(([v, rot, ic]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(atual === v), 'aria-label': ic ? rot : null, title: ic ? rot : null, class: `${atual === v ? 'on' : ''}${ic ? ' jg-ic' : ''}`, onclick: () => aoEscolher(v) }, ic ? bq(ic) : rot)));

/** Setinhas: ‹ rótulo ›. lista: [valor, rótulo]. */
export function passo(lista, atual, aoEscolher, aria = '') {
  const i = Math.max(0, lista.findIndex(([v]) => v === atual));
  return h('span', { class: 'jo-passo', role: 'group', 'aria-label': aria || null },
    h('button', { type: 'button', 'aria-label': `${aria} anterior`.trim(), disabled: i <= 0 || null, onclick: () => aoEscolher(lista[i - 1][0]) }, '‹'),
    h('span', { 'aria-live': 'polite' }, lista[i] ? lista[i][1] : ''),
    h('button', { type: 'button', 'aria-label': `${aria} próximo`.trim(), disabled: i >= lista.length - 1 || null, onclick: () => aoEscolher(lista[i + 1][0]) }, '›'));
}

/** "?" pequeno: toca e aparece a explicação (regras, dicas). */
export const ajuda = (titulo, ...conteudo) => h('details', { class: 'jo-ajuda' }, h('summary', { 'aria-label': titulo, title: titulo }, '?'), h('div', { class: 'jo-nota' }, ...conteudo));
