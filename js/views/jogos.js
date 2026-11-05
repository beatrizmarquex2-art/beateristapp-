// Jogos musicais: catálogo (3 por fileira) e cada jogo dentro da mesma moldura (voltar, som, nova partida).
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import * as store from '../store.js';
import { dragSort } from '../dragsort.js';
import { attachFesta } from '../jogos/festa.js';
import { soundOn, setSound } from '../jogos/base.js';
import * as cartas from '../jogos/cartas.js';
import * as velha from '../jogos/velha.js';
import * as bingo from '../jogos/bingo.js';
import * as cara from '../jogos/cara.js';
import * as quebra from '../jogos/quebra.js';
import * as stop from '../jogos/stop.js';
import * as toca from '../jogos/toca.js';
import { relatorio } from './jogos-relatorio.js';
import { hasAdventure, loadAdventure } from '../campanha/registry.js';
import { modeChooser, mountAdventure } from '../campanha/run.js';
import * as AC from '../acesso.js';

const IMG = 'assets/jogos/icones/';
const ALUNO = () => document.documentElement.classList.contains('aluno-on');
const GAMES = [
  ['toca', 'Toca Aqui', 'toca.svg', toca, 'ler, ouvir, repetir · microfone'],
  ['cartas', 'Uno Musical', 'cartas.webp', cartas, 'figuras rítmicas · contra o computador ou 2 celulares'],
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
    inner('toca'),
    link('#/kids/explorar', 'explorar a bateria', 'explorar.svg', 'toca e descobre os nomes'),
  ]],
  ['leitura musical', [
    link('#/kids/figuras', 'figuras rítmicas', 'figuras.svg', 'semibreve, mínima…'),
    link('#/paulta', 'pauLta', 'pauta.svg', 'leitura musical: bateria, clave de sol e de fá'),
  ]],
  ['cartas e tabuleiro', [
    link('#/kids/memoria', 'jogo da memória', 'memoria.svg', '4, 8 ou 12 pares · 1 ou 2 jogadores'),
    ...['cartas', 'bingo', 'velha', 'quebra', 'cara', 'stop'].map(inner),
  ]],
  ['quiz e letras (com código)', [
    link('#/dicas/quiz', 'Quiz e Letras', 'quiz.svg', 'quiz, caça-palavras e cruzadinha das 30 dicas'),
  ]],
  ['fases e relatório', [
    link('#/kids', 'fases e estrelas', 'fases.svg', 'jogadores, álbum e coleção'),
    link('#/jogos/relatorio', 'Jogos Ensinam', 'relatorio.svg', 'pra que serve cada jogo'),
  ]],
  ['estudos (com código)', [
    link('#/dicionario', 'dicionário da bateria', 'pauta.svg', 'termos e exemplos tocando'),
    link('#/kids/figuras/aula', 'aulas do Paul', 'figuras.svg', 'aprenda as figuras rítmicas'),
  ]],
];

// ordem, jogos escondidos e favoritos: da Bea (e de cada aparelho). Só a Bea edita a ordem; os alunos só favoritam.
const PK = 'setting-jogos';
const prefs = () => ({ order: [], hidden: [], fav: [], ...(store.get(PK) ? store.get(PK).data : {}) });
const savePrefs = (p) => store.upsert('setting', PK, p);
/** salva e mostra "desfazer" por uns segundos */
const change = (next, msg) => { const prev = prefs(); savePrefs(next); toast(msg, { action: 'desfazer', onAction: () => savePrefs(prev), ms: 5000 }); };
const keyOf = (x) => x[5] || `#/jogos/${x[0]}`;
// fundo escuro: alguns jogos (de palco/noite) e, na Bea, todos
const DARK = new Set(['bingo', 'cara', 'quebra']);
const darkOn = (id) => document.documentElement.dataset.space === 'bea' || (id && DARK.has(id));

function catalog(host) {
  const aluno = ALUNO();
  let editing = false; let onlyFav = false;
  const card = (x, edit) => {
    const [id, title, img, , , href] = x; const lk = aluno && AC.trancado(href || `#/jogos/${id}`);
    return h('a', { class: `jg-card${lk ? ' locked' : ''}`, href: href || `#/jogos/${id}`, 'aria-label': lk ? `${title} (só com código)` : null, onclick: edit ? (e) => e.preventDefault() : null }, h('span', { class: 'jg-ico' }, h('img', { src: `${IMG}${img}`, alt: '', decoding: 'async', draggable: 'false' }), lk ? h('i', { class: 'jg-lock', 'aria-hidden': 'true' }, '🔒') : null), h('b', {}, title));
  };
  let catWrap;
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
    grid.classList.toggle('jgx-editing', editing);
    grid.replaceChildren(...(shown.length ? shown.map((x) => {
      const k = keyOf(x); const fav = p.fav.includes(k); const off = p.hidden.includes(k);
      return h('div', { class: `jgx-cell${off ? ' off' : ''}`, 'data-key': k }, card(x, editing),
        h('button', { type: 'button', class: `jgx-star${fav ? ' on' : ''}`, 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Tirar dos' : 'Pôr nos'} favoritos: ${x[1]}`, onclick: () => { const next = { ...p, fav: fav ? p.fav.filter((y) => y !== k) : [...p.fav, k] }; if (fav) change(next, 'tirado dos favoritos'); else savePrefs(next); } }, fav ? '★' : '☆'),
        editing ? h('div', { class: 'jgx-ctl' },
          h('button', { type: 'button', 'aria-label': `${off ? 'Mostrar' : 'Esconder'} ${x[1]}`, onclick: () => (off ? savePrefs({ ...p, hidden: p.hidden.filter((y) => y !== k) }) : change({ ...p, hidden: [...p.hidden, k] }, `${x[1]} escondido`)) }, off ? '↺' : '✕')) : null);
    }) : [h('p', { class: 'jg-p', style: { gridColumn: '1 / -1' } }, 'nenhum favorito ainda. toque na ☆ de um jogo.')]));
  };
  host.replaceChildren(banner('Jogos', 'todos os jogos num lugar só'), catWrap = h('div', { class: `jg jg-wrap jg-cat${darkOn('') ? ' jg-dark' : ''}` }, bar, grid));
  draw();
  // arrastar o próprio jogo (no modo editar; no dedo, segurando um instante): a nova ordem dos que estão na tela entra no lugar deles na ordem completa
  const offDrag = dragSort(grid, { itemSel: '.jgx-cell', onDone: (newKeys) => {
    const p = prefs(); const all = SECTIONS.flatMap(([, l]) => l).filter((x) => !(aluno && x[6] === 'bea')).map(keyOf);
    const rank = (k) => { const i = p.order.indexOf(k); return i < 0 ? 1e6 : i; };
    const full = all.map((k, i) => [k, i]).sort((a, c) => rank(a[0]) - rank(c[0]) || a[1] - c[1]).map((x) => x[0]);
    const set = new Set(newKeys); let n = 0;
    change({ ...p, order: full.map((k) => (set.has(k) ? newKeys[n++] : k)) }, 'ordem mudou');
  } });
  const offStore = store.subscribe((i) => { if (!i.kind || i.id === PK) draw(); });
  const onAc = () => draw(); document.addEventListener('aluno-acesso', onAc);
  const offFesta = attachFesta(catWrap, { paul: false }); // a faixa de título já tem o Paul
  return () => { offStore(); offDrag(); offFesta(); document.removeEventListener('aluno-acesso', onAc); };
}

function game(host, entry) {
  const [, title, , mod] = entry;
  const body = h('div', { class: 'jg-body' });
  const snd = h('button', { class: 'icon-btn jg-snd', type: 'button', 'aria-pressed': String(soundOn()), 'aria-label': soundOn() ? 'desligar som' : 'ligar som', onclick: () => {
    setSound(!soundOn()); snd.setAttribute('aria-pressed', String(soundOn())); snd.setAttribute('aria-label', soundOn() ? 'desligar som' : 'ligar som'); snd.textContent = soundOn() ? '🔊' : '🔇';
  } }, soundOn() ? '🔊' : '🔇');
  const ctl = mod.mount(body);
  const wrap = h('div', { class: `jg jg-wrap jg-game${darkOn(entry[0]) ? ' jg-dark' : ''}` },
    h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos', onclick: async (e) => { if (ctl.inProgress && ctl.inProgress()) { e.preventDefault(); if (await confirmSheet('sair da partida?', 'a partida atual será perdida.', 'sair')) location.hash = '#/jogos'; } } }, '‹ jogos'), h('b', { class: 'hand jg-title' }, title),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => ctl.restart() }, 'nova partida'), snd),
    body);
  host.replaceChildren(wrap);
  const offFesta = attachFesta(wrap);
  return () => { offFesta(); ctl.destroy(); };
}

/** Jogo com Modo Aventura: #/jogos/<id> escolhe o modo, /livre = como sempre, /aventura = mapa, /aventura/<n> = missão. Sem módulo de aventura (ou se falhar), cai direto no Modo Livre. */
function withModes(host, entry, [id, mode, mission]) {
  if (mode === 'livre') return game(host, entry);
  let off = () => {}; let gone = false; const wrap = h('div', { class: 'av-root' }); host.replaceChildren(wrap);
  wrap.append(h('p', { class: 'jg-p' }, 'carregando…'));
  loadAdventure(id).then((adv) => {
    if (gone) return; const base = `#/jogos/${id}/aventura`; const spec = adv.spec;
    if (mode === 'aventura') {
      const n = mission !== undefined && /^\d+$/.test(mission) ? Number(mission) : null;
      off = mountAdventure(wrap, { gameId: id, spec, adv, base, mission: n, playClass: `jg jg-wrap jg-game${darkOn(id) ? ' jg-dark' : ''}`, backHref: `#/jogos/${id}`, nav: (hash) => { location.hash = hash; } }); return;
    }
    off = modeChooser(wrap, { gameId: id, spec, title: entry[1], hrefLivre: `#/jogos/${id}/livre`, hrefAventura: base });
    wrap.prepend(h('a', { class: 'av-back', href: '#/jogos', style: 'margin-bottom:8px' }, '‹ jogos'));
  }).catch((e) => { console.warn('aventura indisponível, abrindo o modo livre', e); if (!gone) off = game(host, entry); });
  return () => { gone = true; off(); };
}

export function mount(host, parts = []) {
  if (parts[0] === 'relatorio') return relatorio(host);
  const entry = GAMES.find((g) => g[0] === parts[0] && g[3]);
  if (!entry) return catalog(host);
  return hasAdventure(entry[0]) ? withModes(host, entry, parts) : game(host, entry);
}
