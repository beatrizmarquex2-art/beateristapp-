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
import { relatorio } from './jogos-relatorio.js';

const IMG = 'assets/jogos/icones/';
const ALUNO = () => document.documentElement.classList.contains('aluno-on');
const GAMES = [
  ['domino', 'dominó', 'domino.webp', domino],
  ['cartas', 'última nota', 'cartas.webp', cartas, 'números e figuras'],
  ['bingo', 'bingo', 'bingo.webp', bingo],
  ['velha', 'jogo da velha', 'velha.webp', velha],
  ['quebra', 'quebra-cabeça', 'quebra-cabeca.webp', quebra],
  ['cara', 'cara a cara', 'cara-a-cara.webp', cara],
  ['stop', 'stop', 'stop.webp', stop],
];
const BY = Object.fromEntries(GAMES.map((g) => [g[0], g]));
const inner = (id) => [id, BY[id][1], BY[id][2], BY[id][3], BY[id][4]];
// Tudo que é jogo mora aqui. Quem tem módulo próprio abre dentro desta tela (#/jogos/<id>); o resto leva à sua tela e volta pra cá.
const link = (href, title, img, sub, only) => [href, title, img, null, sub, href, only];
const SECTIONS = [
  ['ritmo e bateria', [
    link('#/ritmo', 'jogos de ritmo', 'ritmo.svg', 'toca no tempo e ganha XP'),
    link('#/kids/ritmo', 'monte seu ritmo', 'monte.svg', 'pão, bolo, chocolate…'),
    link('#/kids/explorar', 'explorar a bateria', 'explorar.svg', 'toca e descobre os nomes'),
    link('#/kids/eco', 'eco rítmico', 'eco.svg', 'ouve e repete'),
  ]],
  ['leitura musical', [
    link('#/kids/figuras', 'figuras rítmicas', 'figuras.svg', 'semibreve, mínima…'),
    link('#/kids/pauta', 'onde mora na pauta?', 'pauta.svg', 'cada peça tem a sua casinha'),
  ]],
  ['cartas e tabuleiro', [
    link('#/kids/memoria', 'jogo da memória', 'memoria.svg', '4, 8 ou 12 pares'),
    ...['domino', 'cartas', 'bingo', 'velha', 'quebra', 'cara', 'stop'].map(inner),
  ]],
  ['jogos das dicas', [
    link('#/dicas/quiz', 'quiz', 'quiz.svg', 'as 30 dicas', 'bea'),
    link('#/dicas/caca', 'caça-palavras', 'caca.svg', null, 'bea'),
    link('#/dicas/cruzadinha', 'cruzadinha', 'cruza.svg', null, 'bea'),
  ]],
  ['fases e relatório', [
    link('#/kids', 'fases e estrelas', 'fases.svg', 'jogadores, álbum e coleção'),
    link('#/jogos/relatorio', 'relatório', 'relatorio.svg', 'pra que serve cada jogo', 'bea'),
  ]],
];

function catalog(host) {
  const aluno = ALUNO();
  const card = ([id, title, img, mod, sub, href]) => {
    const kids = [h('span', { class: 'jg-ico' }, h('img', { src: `${IMG}${img}`, alt: '', decoding: 'async', draggable: 'false' })), h('b', {}, title), null];
    return h('a', { class: 'jg-card', href: href || `#/jogos/${id}` }, ...kids);
  };
  host.replaceChildren(banner('Jogos', 'todos os jogos num lugar só'), h('div', { class: 'jg jg-wrap jg-cat' },
    h('div', { class: 'jg-grid jg-flat' }, ...SECTIONS.flatMap(([, list]) => list).filter((x) => !(aluno && x[6] === 'bea')).map(card))));
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
  if (parts[0] === 'relatorio' && !ALUNO()) return relatorio(host);
  const entry = GAMES.find((g) => g[0] === parts[0] && g[3]);
  if (!entry) { catalog(host); return null; }
  return game(host, entry);
}
