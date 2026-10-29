// Jogos musicais: catálogo (3 por fileira) e cada jogo dentro da mesma moldura (voltar, som, nova partida).
import { h } from '../util.js';
import { banner } from '../ui.js';
import * as store from '../store.js';
import { dragSort } from '../dragsort.js';
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

// ordem, jogos escondidos e favoritos: da Bea (e de cada aparelho). Só a Bea edita a ordem; os alunos só favoritam.
const PK = 'setting-jogos';
const prefs = () => ({ order: [], hidden: [], fav: [], ...(store.get(PK) ? store.get(PK).data : {}) });
const savePrefs = (p) => store.upsert('setting', PK, p);
const keyOf = (x) => x[5] || `#/jogos/${x[0]}`;

function catalog(host) {
  const aluno = ALUNO();
  let editing = false; let onlyFav = false;
  const card = (x, edit) => {
    const [id, title, img, , , href] = x;
    return h('a', { class: 'jg-card', href: href || `#/jogos/${id}`, onclick: edit ? (e) => e.preventDefault() : null }, h('span', { class: 'jg-ico' }, h('img', { src: `${IMG}${img}`, alt: '', decoding: 'async', draggable: 'false' })), h('b', {}, title));
  };
  const grid = h('div', { class: 'jg-grid jg-flat' }); const bar = h('div', { class: 'jgx-bar' });
  const draw = () => {
    const p = prefs();
    const all = SECTIONS.flatMap(([, list]) => list).filter((x) => !(aluno && x[6] === 'bea'));
    const rank = (k) => { const i = p.order.indexOf(k); return i < 0 ? 1e6 : i; };
    const list = all.map((x, i) => [x, i]).sort((a, c) => rank(keyOf(a[0])) - rank(keyOf(c[0])) || a[1] - c[1]).map((x) => x[0]);
    const shown = list.filter((x) => (editing || !p.hidden.includes(keyOf(x))) && (!onlyFav || p.fav.includes(keyOf(x))));
    const keys = list.map(keyOf);
    bar.replaceChildren(
      h('button', { type: 'button', class: `jgx-chip${onlyFav ? '' : ' on'}`, onclick: () => { onlyFav = false; draw(); } }, 'todos'),
      h('button', { type: 'button', class: `jgx-chip${onlyFav ? ' on' : ''}`, onclick: () => { onlyFav = true; draw(); } }, `★ favoritos (${p.fav.filter((k) => keys.includes(k)).length})`),
      aluno ? null : h('button', { type: 'button', class: `jgx-chip jgx-edit${editing ? ' on' : ''}`, onclick: () => { editing = !editing; draw(); } }, editing ? 'pronto' : 'editar'));
    grid.replaceChildren(...(shown.length ? shown.map((x) => {
      const k = keyOf(x); const fav = p.fav.includes(k); const off = p.hidden.includes(k);
      return h('div', { class: `jgx-cell${off ? ' off' : ''}`, 'data-key': k }, card(x, editing),
        h('button', { type: 'button', class: `jgx-star${fav ? ' on' : ''}`, 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Tirar dos' : 'Pôr nos'} favoritos: ${x[1]}`, onclick: () => savePrefs({ ...p, fav: fav ? p.fav.filter((y) => y !== k) : [...p.fav, k] }) }, fav ? '★' : '☆'),
        editing ? h('div', { class: 'jgx-ctl' },
          h('button', { type: 'button', class: 'jgx-grip', 'aria-label': `Arrastar ${x[1]} pra mudar de lugar` }, '⠿'),
          h('button', { type: 'button', 'aria-label': `${off ? 'Mostrar' : 'Esconder'} ${x[1]}`, onclick: () => savePrefs({ ...p, hidden: off ? p.hidden.filter((y) => y !== k) : [...p.hidden, k] }) }, off ? '↺' : '✕')) : null);
    }) : [h('p', { class: 'jg-p', style: { gridColumn: '1 / -1' } }, 'nenhum favorito ainda. toque na ☆ de um jogo.')]));
  };
  host.replaceChildren(banner('Jogos', 'todos os jogos num lugar só'), h('div', { class: 'jg jg-wrap jg-cat' }, bar, grid));
  draw();
  // arrastar pela alça ⠿: a nova ordem dos que estão na tela entra no lugar deles na ordem completa
  const offDrag = dragSort(grid, { itemSel: '.jgx-cell', handleSel: '.jgx-grip', onDone: (newKeys) => {
    const p = prefs(); const all = SECTIONS.flatMap(([, l]) => l).filter((x) => !(aluno && x[6] === 'bea')).map(keyOf);
    const rank = (k) => { const i = p.order.indexOf(k); return i < 0 ? 1e6 : i; };
    const full = all.map((k, i) => [k, i]).sort((a, c) => rank(a[0]) - rank(c[0]) || a[1] - c[1]).map((x) => x[0]);
    const set = new Set(newKeys); let n = 0;
    savePrefs({ ...p, order: full.map((k) => (set.has(k) ? newKeys[n++] : k)) });
  } });
  const offStore = store.subscribe((i) => { if (!i.kind || i.id === PK) draw(); });
  return () => { offStore(); offDrag(); };
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
  if (!entry) return catalog(host);
  return game(host, entry);
}
