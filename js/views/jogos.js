// Jogos musicais: catálogo (3 por fileira) e cada jogo dentro da mesma moldura (voltar, som, nova partida).
import { h } from '../util.js';
import { banner } from '../ui.js';
import { soundOn, setSound } from '../jogos/base.js';
import * as domino from '../jogos/domino.js';
import * as cartas from '../jogos/cartas.js';
import * as velha from '../jogos/velha.js';
import * as bingo from '../jogos/bingo.js';
import * as cara from '../jogos/cara.js';
import * as quebra from '../jogos/quebra.js';
import * as stop from '../jogos/stop.js';

const IMG = 'assets/jogos/icones/';
const GAMES = [
  ['domino', 'dominó', 'domino', domino],
  ['cartas', 'última nota', 'cartas', cartas, 'números e figuras'],
  ['bingo', 'bingo', 'bingo', bingo],
  ['velha', 'jogo da velha', 'velha', velha],
  ['quebra', 'quebra-cabeça', 'quebra-cabeca', quebra],
  ['cara', 'cara a cara', 'cara-a-cara', cara],
  ['stop', 'stop', 'stop', stop],
];

function catalog(host) {
  host.replaceChildren(banner('jogos musicais', 'escolha um jogo'), h('div', { class: 'jg jg-wrap jg-cat' },
    h('div', { class: 'jg-grid' }, ...GAMES.map(([id, title, img, mod, sub]) => {
      const kids = [h('span', { class: 'jg-ico' }, h('img', { src: `${IMG}${img}.webp`, alt: '', decoding: 'async', draggable: 'false' })), h('b', {}, title), sub ? h('small', {}, sub) : null];
      return mod ? h('a', { class: 'jg-card', href: `#/jogos/${id}` }, ...kids)
        : h('span', { class: 'jg-card wait', role: 'link', 'aria-disabled': 'true', tabindex: '0', 'aria-label': `${title}: em breve` }, ...kids, h('i', { class: 'jg-soon' }, 'em breve'));
    }))));
}

function game(host, entry) {
  const [, title, , mod] = entry;
  const body = h('div', { class: 'jg-body' });
  const snd = h('button', { class: 'icon-btn jg-snd', type: 'button', 'aria-pressed': String(soundOn()), 'aria-label': soundOn() ? 'desligar som' : 'ligar som', onclick: () => {
    setSound(!soundOn()); snd.setAttribute('aria-pressed', String(soundOn())); snd.setAttribute('aria-label', soundOn() ? 'desligar som' : 'ligar som'); snd.textContent = soundOn() ? '🔊' : '🔇';
  } }, soundOn() ? '🔊' : '🔇');
  const ctl = mod.mount(body);
  host.replaceChildren(h('div', { class: 'jg jg-wrap' },
    h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), h('b', { class: 'hand jg-title' }, title),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => ctl.restart() }, 'nova partida'), snd),
    body));
  return () => ctl.destroy();
}

export function mount(host, parts = []) {
  const entry = GAMES.find((g) => g[0] === parts[0] && g[3]);
  if (!entry) { catalog(host); return null; }
  return game(host, entry);
}
