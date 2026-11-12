// Aba Tocar em forma de toca-discos: o vinil gira, o braço da agulha balança e os 4 instrumentos são botões redondos na base. Útil logo abaixo.
// A cor da "caixa" do toca-discos vem de --deck-a / --deck-b (css/lote3.css).
import { h } from '../util.js';
import { INSTR_ART } from './tocar-art.js';
import { utilTiles } from './tocar-nav.js';
import { wake } from '../instruments.js';

const GRUPOS = [['toque', 'bateria', '#/toque'], ['violao', 'cordas', '#/violao'], ['piano', 'teclas', '#/piano'], ['xilofone', 'percussão', '#/xilofone']];
const BRACO = `<svg class="dk-braco" viewBox="0 0 100 190" aria-hidden="true" focusable="false"><circle cx="84" cy="22" r="12" fill="#cfc7b6" stroke="#1b1818" stroke-width="3"/><path d="M84 22 L82 120 L62 170" fill="none" stroke="#1b1818" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M84 22 L82 120 L62 170" fill="none" stroke="#e9e3d4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="52" y="164" width="18" height="12" rx="3" fill="#d92031" stroke="#1b1818" stroke-width="3"/></svg>`;

export function deckView() {
  const botoes = GRUPOS.map(([id, nome, href]) => {
    const art = h('span', { class: 'dk-art' }); art.innerHTML = INSTR_ART[id];
    return h('a', { href, class: 'dk-btn', 'aria-label': nome, onpointerdown: wake }, h('span', { class: 'dk-bola' }, art), h('b', { class: 'dk-nome' }, nome));
  });
  const caixa = h('div', { class: 'dk-caixa' }, h('div', { class: 'dk-disco', 'aria-hidden': 'true' }, h('i', { class: 'dk-rotulo' }, h('em', {}))), h('span', { class: 'dk-braco-box', 'aria-hidden': 'true' }), h('div', { class: 'dk-botoes' }, ...botoes), h('p', { class: 'dk-dica' }, 'toque num instrumento pra tocar'));
  caixa.querySelector('.dk-braco-box').innerHTML = BRACO;
  return h('section', { class: 'dk', 'aria-label': 'Escolha o instrumento' }, caixa, utilTiles(true));
}
