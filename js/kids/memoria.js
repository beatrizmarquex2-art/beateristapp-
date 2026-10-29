// Jogo da memória, só com imagens: escolhe o tema e quantos pares (4, 8 ou 12) e joga. Sem fases: o que vale é achar tudo com poucas tentativas.
import { h } from '../util.js';
import * as store from '../store.js';
import { artPhoto } from '../views/artist-photo.js';
import { shuffle } from '../kids-logic.js';
import { robo } from './robo.js';
import { THEMES, SIZES, themeById, loadExtras } from './memory-themes.js';
import * as FB from '../feedback.js';

const KEY = 'setting-memoria';
const conf = () => ({ theme: 'instrumentos', pairs: 8, best: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (p) => store.upsert('setting', KEY, p);
const cols = (n) => (n <= 8 ? 4 : n <= 12 ? 4 : 4);

function face(f, name) {
  const box = h('span', { class: 'kx-mem-art mem-img' });
  if (f.svg) box.innerHTML = f.svg;
  else if (f.img) box.append(h('img', { src: f.img, alt: name, draggable: 'false' }));
  else if (f.photo) box.append(artPhoto(`album-${f.photo.id}`, f.photo.name, 'art-ph', f.photo.wiki));
  return box;
}

export function mountMemoria(host) {
  let gone = false; const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const bot = robo({ mood: 'happy', size: 84, say: 'escolhe o tema e quantos pares!' });
  const stage = h('div', { class: 'mem-stage' });
  host.replaceChildren(h('div', { class: 'kx-botrow' }, bot.el), stage);

  const setup = () => {
    const c = conf(); const th = themeById[c.theme] || THEMES[0];
    const maxPairs = th.items.length;
    const pairs = SIZES.includes(c.pairs) ? c.pairs : 8;
    stage.replaceChildren(
      h('h2', { class: 'kx-h' }, 'tema'),
      h('div', { class: 'mem-themes' }, ...THEMES.map((t) => h('button', { type: 'button', class: `mem-theme${t.id === th.id ? ' on' : ''}`, 'aria-pressed': String(t.id === th.id), onclick: () => save({ theme: t.id }).then(setup) },
        h('span', { class: 'mem-emoji', 'aria-hidden': 'true' }, t.emoji), h('b', {}, t.title), h('small', {}, t.blurb)))),
      h('h2', { class: 'kx-h' }, 'quantos pares?'),
      h('div', { class: 'row kd-modes' }, ...SIZES.map((n) => h('button', { type: 'button', class: `kd-chip${pairs === n ? ' on' : ''}`, disabled: n > maxPairs, onclick: () => save({ pairs: n }).then(setup) }, `${n} pares`))),
      (() => { const b = c.best[`${th.id}:${pairs}`]; return b ? h('p', { class: 'muted mem-best' }, `seu recorde: ${b} tentativas`) : null; })(),
      h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => play(th, Math.min(pairs, maxPairs)) }, 'jogar'));
    bot.set('happy', 'escolhe o tema e quantos pares!');
  };

  const play = (th, pairs) => {
    const picks = shuffle(th.items, Math.random).slice(0, pairs);
    const deck = shuffle(picks.flatMap((it) => [{ it, side: 'a' }, { it, side: 'b' }]), Math.random).map((c, i) => ({ ...c, key: i }));
    let open = []; let lock = false; let matched = 0; let tries = 0; let streak = 0;
    const status = h('p', { class: 'kx-memstat', 'aria-live': 'polite' });
    const paint = () => { status.textContent = `${matched}/${pairs} pares · ${tries} tentativa${tries === 1 ? '' : 's'}`; };
    const board = h('div', { class: `kx-board mem-board n${pairs}`, style: `--cols:${cols(deck.length)}` }, ...deck.map((c, i) => {
      const f = c.side === 'b' && c.it.b ? c.it.b : c.it.a;
      const b = h('button', { type: 'button', class: 'kx-mem', 'aria-label': 'carta virada para baixo', onclick: () => flip(b) },
        h('span', { class: 'kx-mem-in' }, h('span', { class: 'kx-mem-back', 'aria-hidden': 'true', style: `--bi:url(../assets/cards/b${String((i * 7 + (i >> 1)) % 10 + 1).padStart(2, '0')}.webp)` }),
          h('span', { class: 'kx-mem-front', 'aria-hidden': 'true' }, face(f, c.it.name))));
      b._c = c; return b;
    }));
    const flip = (btn) => {
      if (lock || gone || btn.classList.contains('up') || btn.classList.contains('ok')) return;
      btn.classList.add('up'); btn.setAttribute('aria-label', btn._c.it.name); open.push(btn); if (open.length < 2) return;
      lock = true; tries++; const [a, b] = open; const same = a._c.it.id === b._c.it.id;
      later(() => {
        if (gone) return;
        if (same) {
          a.classList.add('ok'); b.classList.add('ok'); matched++; streak++; open = []; lock = false; paint();
          const done = matched === pairs;
          bot.set('cheer', FB.line('win'));
          if (done) { finish(); } else FB.win(b, { paul: false });
        } else {
          streak = 0; a.classList.add('no'); b.classList.add('no'); bot.set('oops', FB.line('lose')); FB.lose(a, { paul: false });
          later(() => { a.classList.remove('up', 'no'); b.classList.remove('up', 'no'); open = []; lock = false; paint(); }, 700);
        }
      }, 650);
    };
    const finish = () => {
      const c = conf(); const k = `${th.id}:${pairs}`; const prev = c.best[k]; const record = !prev || tries < prev;
      if (record) save({ best: { ...c.best, [k]: tries } });
      FB.great(board, { msg: record ? 'novo recorde! 🏆' : FB.line('great') }); bot.set('cheer', record ? 'novo recorde!' : 'achou todos!');
      later(() => {
        if (gone) return;
        stage.replaceChildren(h('div', { class: 'kx-result' }, h('h2', {}, 'Achou todos!'), h('b', { class: 'kx-pct' }, h('span', { class: 'n' }, String(tries)), h('small', {}, ' tentativas')),
          h('p', { class: 'muted' }, `${pairs} pares de ${th.title.toLowerCase()}${record ? ' · recorde novo!' : prev ? ` · seu recorde: ${prev}` : ''}`),
          h('div', { class: 'row kx-act' }, h('button', { class: 'kd-btn', type: 'button', onclick: () => play(th, pairs) }, 'jogar de novo'), h('button', { class: 'kd-chip', type: 'button', onclick: setup }, 'trocar tema ou tamanho'))));
      }, 1800);
    };
    paint(); bot.set('think', 'onde será?');
    stage.replaceChildren(h('div', { class: 'row kd-modes mem-top' }, h('b', {}, th.title), h('button', { class: 'kd-chip', type: 'button', onclick: setup }, 'trocar')), status, board);
  };

  loadExtras().then(() => { if (!gone) setup(); });
  return () => { gone = true; timers.forEach(clearTimeout); };
}
