// Jogo da memória, só com imagens: escolhe o tema e quantos pares (4, 8 ou 12) e joga. Sem fases: o que vale é achar tudo com poucas tentativas.
import { h } from '../util.js';
import * as store from '../store.js';
import { shuffle } from '../kids-logic.js';
import { robo } from './robo.js';
import { THEMES, SIZES, themeById } from './memory-themes.js';
import * as FB from '../feedback.js';
import { seeded } from '../campanha/jogos/memoria-logic.js';
import * as AC from '../acesso.js';
import { bq } from '../jogos/bonequinhos.js';
import { loadPhotoThemes } from './memory-photos.js';
import { lobby, linkBadge } from '../jogos/online.js';
import * as ML from './memoria-online-logic.js';

const KEY = 'setting-memoria';
const conf = () => ({ theme: 'beatles', pairs: 8, players: 1, again: true, best: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const save = (p) => store.upsert('setting', KEY, p);
const cols = (n) => (n <= 8 ? 4 : n <= 12 ? 4 : 4);

/** O verso da carta é o botão do tema; "tudo misturado" não tem verso próprio, então mostra um leque de três. */
const MIX = ['rock', 'percussao', 'figuras'].map((k) => `assets/memoria/${k}/verso.webp`);
const verso = (t) => (t.cover
  ? h('span', { class: `mem-vt cat cat-${t.id}` }, h('span', { class: 'mc-t' }, t.title), h('span', { class: 'mc-fan' }, ...t.cover.map((src, i) => h('img', { class: `m${i}`, src, alt: '', draggable: 'false', decoding: 'async' }))),
    h('img', { class: 'mc-paul', src: 'assets/paul/paul-memoria.webp', alt: '', draggable: 'false' }), h('small', { class: 'mc-b' }, 'beaterista'))
  : t.verso
    ? h('span', { class: 'mem-vt' }, h('img', { src: t.verso, alt: '', draggable: 'false', decoding: 'async' }))
    : h('span', { class: 'mem-vt mix' }, ...MIX.map((src, i) => h('img', { class: `m${i}`, src, alt: '', draggable: 'false', decoding: 'async' }))));
/** A carta: desenho da Bea (a imagem já traz nome e borda) ou foto de artista (recortada no rosto, com o nome embaixo quando tem). */
const face = (it) => (it.photo
  ? h('span', { class: 'mem-pf' }, h('img', { class: 'mem-card-img', src: it.img, alt: it.name, style: `object-position:${it.pos || '50% 30%'}`, draggable: 'false', decoding: 'async' }), it.cap ? h('span', { class: 'mem-cap' }, it.cap) : null)
  : h('img', { class: 'mem-card-img', src: it.img, alt: it.name, draggable: 'false', decoding: 'async' }));
const PICK = [6, 8, 12]; // quantos pares o jogador escolhe (a aventura usa SIZES)
const alunoSemCodigo = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();

/** `opts.mission` (Modo Aventura): monta a partida com `opts.mission.params`, sem menus, sem retomar nem gravar nada do modo livre (preferências e recordes
 *  ficam intactos) e avisa `opts.onResult({ won, pairs, theme, tries, ms })` UMA vez, quando acha o último par. Sem `opts.mission` é o jogo de sempre. */
export function mountMemoria(host, opts) {
  const MS = opts && opts.mission ? opts.mission : null; const MP = MS ? MS.params || {} : null;
  let gone = false; let started = false; let reported = false; const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const bot = robo({ mood: 'happy', size: 84, say: 'escolhe o tema e quantos pares!' });
  const stage = h('div', { class: 'mem-stage' });
  host.replaceChildren(h('div', { class: 'kx-botrow' }, bot.el), stage);
  const preload = (th) => th.items.forEach((x) => { const i = new Image(); i.src = x.img; }); // as cartas do tema já ficam prontas
  // temas da tela de escolha: as 3 categorias de artistas (fotos do catálogo) + os temas desenhados. Sem o catálogo, cai nos desenhados (só profissões aberta).
  let photo = null; let lockNote = false; let live = false;
  let conn = null; let lob = null; let roomTimer = 0; // sala de 2 celulares (código)
  const closeRoom = () => { clearTimeout(roomTimer); roomTimer = 0; if (conn) { conn.close(); conn = null; } if (lob) { lob.close(); lob = null; } };
  const themes = () => {
    // abertos pra todo mundo: The Beatles, Rock (as cartas desenhadas de bandas) e Profissões. O resto só com código.
    const drawn = THEMES.map((t) => (t.id === 'bandas' ? { ...t, id: 'rock', title: 'Rock', open: true } : { ...t, open: t.id === 'profissoes' }));
    const all = photo ? [photo[0], drawn[0], ...drawn.filter((t) => t.id === 'profissoes'), ...photo.slice(1), ...drawn.filter((t) => t.id !== 'rock' && t.id !== 'profissoes')] : drawn;
    return [...all.filter((t) => t.open), ...all.filter((t) => !t.open)];
  };
  const locked = (t) => !MS && alunoSemCodigo() && !t.open;

  // os 3 temas de artistas ficam em destaque (3 capas grandes); os outros temas vêm logo abaixo, menores
  const tile = (t, th) => { const lk = locked(t); return h('button', { type: 'button', role: 'radio', class: `mem-theme${t.id === th.id ? ' on' : ''}${lk ? ' locked' : ''}`, 'aria-checked': String(t.id === th.id), 'aria-label': `${t.title}${lk ? ', só pra alunos com código' : `: ${t.blurb}`}`, onclick: () => { if (lk) { lockNote = true; setup(); return; } lockNote = false; save({ theme: t.id }).then(setup); } },
    verso(t), lk ? h('i', { class: 'mem-lk', 'aria-hidden': 'true' }, '🔒') : null, h('b', {}, t.title)); };
  const grupos = (list, th) => {
    const art = list.filter((t) => t.open); const rest = list.filter((t) => !t.open); // os livres em destaque (capas grandes), os outros logo abaixo
    return [art.length ? h('div', { class: 'mem-themes hero', role: 'radiogroup', 'aria-label': 'Temas livres' }, ...art.map((t) => tile(t, th))) : null,
      art.length && rest.length ? h('p', { class: 'mem-more' }, 'mais temas') : null,
      rest.length ? h('div', { class: 'mem-themes', role: 'radiogroup', 'aria-label': 'Outros temas' }, ...rest.map((t) => tile(t, th))) : null].filter(Boolean);
  };

  const setup = () => {
    closeRoom(); live = false; const c = conf(); const list = themes();
    let th = list.find((t) => t.id === c.theme) || list[0]; if (locked(th)) th = list.find((t) => !locked(t)) || list[0];
    const maxPairs = th.items.length; preload(th);
    const saved = PICK.includes(c.pairs) ? c.pairs : 8; const pairs = Math.min(saved, [...PICK].reverse().find((n) => n <= maxPairs) || PICK[0]); const players = c.players === 2 ? 2 : c.players === 'bot' ? 'bot' : c.players === 'sala' && !MS ? 'sala' : 1;
    stage.replaceChildren(
      h('img', { class: 'mem-paul', src: 'assets/paul/paul-memoria.webp', alt: '', draggable: 'false' }),
      h('h2', { class: 'kx-h' }, 'tema'),
      ...grupos(list, th),
      lockNote && alunoSemCodigo() ? h('p', { class: 'mem-lockmsg', role: 'status' }, 'esse tema é pra alunos da Beaterista. pegue o seu código na ', h('a', { href: '#/lojinha' }, 'lojinha'), '.') : h('p', { class: 'muted mem-blurb', 'aria-live': 'polite' }, th.blurb),
      // opções discretas numa linha só: ícones pra quantos jogam, setinhas pros pares (e um ↻ quando são 2 jogadores)
      h('div', { class: 'mem-opts', role: 'group', 'aria-label': 'Opções do jogo' },
        ...[[1, 'um', '1 jogador'], [2, 'dois', '2 jogadores, um de cada vez'], ['bot', 'paul', 'jogar contra o Paul'], ['sala', 'celular', '2 celulares (código)']].map(([n, ic, l]) => h('button', { type: 'button', class: `mem-ic${players === n ? ' on' : ''}`, 'aria-pressed': String(players === n), 'aria-label': l, title: l, onclick: () => save({ players: n }).then(setup) }, bq(ic))),
        h('span', { class: 'mem-step' },
          h('button', { type: 'button', 'aria-label': 'menos pares', disabled: pairs <= PICK[0] || null, onclick: () => save({ pairs: PICK[PICK.indexOf(pairs) - 1] }).then(setup) }, '‹'),
          h('span', { 'aria-live': 'polite' }, `${pairs} pares`),
          h('button', { type: 'button', 'aria-label': 'mais pares', disabled: PICK.indexOf(pairs) >= PICK.length - 1 || PICK[PICK.indexOf(pairs) + 1] > maxPairs || null, onclick: () => save({ pairs: PICK[PICK.indexOf(pairs) + 1] }).then(setup) }, '›')),
        players !== 1 ? h('button', { type: 'button', class: `mem-ic${c.again !== false ? ' on' : ''}`, 'aria-pressed': String(c.again !== false), 'aria-label': 'quem acerta joga de novo', title: 'quem acerta joga de novo', onclick: () => save({ again: c.again === false }).then(setup) }, '↻') : null),
      ...(() => { const b = players === 1 && c.best[`${th.id}:${pairs}`]; return b ? [h('p', { class: 'muted mem-best' }, `seu recorde: ${b} tentativas`)] : []; })(),
      players === 'sala'
        ? (lob = lobby({ jogo: ML.JOGO, makeState: () => ML.newMatch({ theme: th, pairs: Math.min(pairs, maxPairs), again: c.again !== false }), onStart: (cn, st) => startOnline(cn, st) })).el
        : h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => play(th, Math.min(pairs, maxPairs), players, c.again !== false) }, 'jogar'));
    bot.set('happy', 'escolhe o tema e quantos pares!');
  };

  const play = (th, pairs, players = 1, again = true, rnd = Math.random) => {
    const picks = shuffle(th.items, rnd).slice(0, pairs);
    const deck = shuffle(picks.flatMap((it) => [{ it, side: 'a' }, { it, side: 'b' }]), rnd).map((c, i) => ({ ...c, key: i }));
    const verso = th.verso ? `url(../${th.verso})` : th.back ? `url(../${th.back})` : null;
    const two = players !== 1; const vsPaul = players === 'bot'; const known = new Map(); // known: cartas que o Paul viu e lembrou (key -> id do par)
    let open = []; let lock = false; let matched = 0; let tries = 0; let streak = 0; let turn = 0; const score = [0, 0]; let t0 = 0;
    const status = h('p', { class: 'kx-memstat', 'aria-live': 'polite' });
    const paint = () => {
      if (MS) { status.textContent = `${matched}/${pairs} pares · ${tries} tentativa${tries === 1 ? '' : 's'}${MP.goalTries ? ` · meta ${MP.goalTries}` : ''}${MP.secs ? ` · ⏱ ${t0 ? Math.min(Math.floor((Date.now() - t0) / 1000), 9999) : 0}/${MP.secs} s (opcional)` : ''}`; return; }
      status.textContent = two ? `${vsPaul ? (turn === 0 ? 'sua vez' : 'vez do Paul') : `vez do jogador ${turn + 1}`} · ${score[0]} × ${score[1]}` : `${matched}/${pairs} pares · ${tries} tentativa${tries === 1 ? '' : 's'}`;
      status.classList.toggle('mem-p2', two && turn === 1);
    };
    const board = h('div', { class: `kx-board mem-board n${pairs}`, style: `--cols:${cols(deck.length)}` }, ...deck.map((c, i) => {
      const bi = verso || `url(../assets/cards/b${String((i * 7 + (i >> 1)) % 10 + 1).padStart(2, '0')}.webp)`;
      const b = h('button', { type: 'button', class: 'kx-mem mem-photo', 'aria-label': 'carta virada para baixo', onclick: () => flip(b) },
        h('span', { class: 'kx-mem-in' }, h('span', { class: 'kx-mem-back', 'aria-hidden': 'true', style: `--bi:${bi}` }),
          h('span', { class: 'kx-mem-front', 'aria-hidden': 'true' }, face(c.it))));
      b._c = c; return b;
    }));
    const flip = (btn, byPaul = false) => {
      if (lock || gone || btn.classList.contains('up') || btn.classList.contains('ok')) return;
      if (vsPaul && turn === 1 && !byPaul) return; // a vez é do Paul
      if (vsPaul && Math.random() < 0.7) known.set(btn._c.key, btn._c.it.id); // o Paul vê toda carta virada, mas nem sempre lembra
      if (MS && !t0) { t0 = Date.now(); started = true; if (MP.secs) tick(); }
      if (!MS) live = true;
      btn.classList.add('up'); btn.setAttribute('aria-label', btn._c.it.name); open.push(btn); if (open.length < 2) return;
      lock = true; tries++; const [a, b] = open; const same = a._c.it.id === b._c.it.id;
      later(() => {
        if (gone) return;
        if (same) {
          a.classList.add('ok'); b.classList.add('ok'); matched++; streak++; score[turn]++; open = []; lock = false; if (!again && matched < pairs) turn = 1 - turn; paint();
          const done = matched === pairs; if (!done) paulNext();
          bot.set('cheer', FB.line('win'));
          if (done) { finish(); } else FB.win(b, { paul: false });
        } else {
          streak = 0; if (two) turn = 1 - turn; a.classList.add('no'); b.classList.add('no'); bot.set('oops', FB.line('lose')); FB.lose(a, { paul: false });
          later(() => { a.classList.remove('up', 'no'); b.classList.remove('up', 'no'); open = []; lock = false; paint(); paulNext(); }, 700);
        }
      }, 650);
    };
    const paulPlay = () => {
      if (gone || lock || turn !== 1) return;
      const free = [...board.children].filter((b) => !b.classList.contains('ok') && !b.classList.contains('up')); if (free.length < 2) return;
      const ids = new Map(); for (const b of free) if (known.has(b._c.key)) { const id = known.get(b._c.key); ids.set(id, [...(ids.get(id) || []), b]); }
      const pair = [...ids.values()].find((l) => l.length >= 2);
      const pickRnd = (l) => l[Math.floor(Math.random() * l.length)];
      const first = pair ? pair[0] : pickRnd(free.filter((b) => !known.has(b._c.key))) || pickRnd(free);
      flip(first, true);
      later(() => {
        const rest = free.filter((b) => b !== first && !b.classList.contains('up'));
        const second = pair ? pair[1] : rest.find((b) => known.get(b._c.key) === first._c.it.id) || pickRnd(rest.filter((b) => !known.has(b._c.key))) || pickRnd(rest);
        if (second) flip(second, true);
      }, 800);
    };
    const paulNext = () => { if (vsPaul && !gone && turn === 1 && matched < pairs) later(paulPlay, 700); };
    const tick = () => { later(() => { if (reported) return; paint(); tick(); }, 1000); }; // relógio do desafio opcional de tempo (só na aventura)
    const finish = () => {
      if (MS) { // Modo Aventura: nada do modo livre é gravado e a tela de resultado é a da aventura
        if (reported) return; reported = true; const ms = Date.now() - t0; paint(); FB.great(board, { msg: FB.line('great') }); bot.set('cheer', 'achou todos!');
        if (opts.onResult) opts.onResult({ won: true, pairs, theme: th.id, tries, ms }); return;
      }
      live = false; const c = conf(); const k = `${th.id}:${pairs}`; const prev = c.best[k]; const record = players === 1 && (!prev || tries < prev);
      if (record) save({ best: { ...c.best, [k]: tries } });
      const win = score[0] === score[1] ? 'empate!' : vsPaul ? (score[0] > score[1] ? 'você venceu!' : 'o Paul venceu!') : `jogador ${score[0] > score[1] ? 1 : 2} venceu!`;
      FB.great(board, { msg: two ? win : record ? 'novo recorde! 🏆' : FB.line('great') }); bot.set('cheer', two ? win : record ? 'novo recorde!' : 'achou todos!');
      later(() => {
        if (gone) return;
        stage.replaceChildren(h('div', { class: 'kx-result' }, h('h2', {}, two ? win : 'Achou todos!'),
          two ? h('b', { class: 'kx-pct' }, h('span', { class: 'n' }, `${score[0]} × ${score[1]}`), h('small', {}, ' pares')) : h('b', { class: 'kx-pct' }, h('span', { class: 'n' }, String(tries)), h('small', {}, ' tentativas')),
          h('p', { class: 'muted' }, `${pairs} pares de ${th.title.toLowerCase()}${two ? (vsPaul ? ` · você: ${score[0]} · Paul: ${score[1]}` : ` · jogador 1: ${score[0]} · jogador 2: ${score[1]}`) : record ? ' · recorde novo!' : prev ? ` · seu recorde: ${prev}` : ''}`),
          h('div', { class: 'row kx-act' }, h('button', { class: 'kd-btn', type: 'button', onclick: () => play(th, pairs, players, again) }, 'jogar de novo'), h('button', { class: 'kd-chip', type: 'button', onclick: setup }, 'trocar tema ou tamanho'))));
      }, 1800);
    };
    paint(); bot.set('think', 'onde será?');
    stage.replaceChildren(h('div', { class: 'row kd-modes mem-top' }, h('b', {}, th.title), MS ? null : h('button', { class: 'kd-chip', type: 'button', onclick: setup }, 'trocar')), status, board);
  };

  /** Partida em 2 celulares: só quem está na vez vira carta e confere o par; o outro celular só desenha o que recebe. As cartas são as do jogo normal. */
  function startOnline(cn, state) {
    lob = null; conn = cn; live = true; const me = cn.me; let st = state; let key = ''; let btns = []; let th = null; let byId = new Map(); let prevOk = 0;
    const badge = linkBadge(); cn.on.link = (v) => badge.set(v);
    const status = h('p', { class: 'kx-memstat', 'aria-live': 'polite' }); const boardHost = h('div'); const resultHost = h('div');
    const sair = () => { closeRoom(); setup(); };
    const send = () => { if (conn) conn.push(st); }; // se o outro mexeu antes, o celular adota o estado dele sozinho (on.state)
    const build = () => {
      th = themes().find((x) => x.id === st.th); resultHost.replaceChildren();
      if (!th || !ML.validMatch(st) || st.deck.some((id) => !th.items.some((it) => it.id === id))) {
        boardHost.replaceChildren(h('p', { class: 'muted', style: 'text-align:center' }, 'esse tema não carregou neste celular. confira a internet e entre de novo.'), h('button', { class: 'kd-chip', type: 'button', onclick: sair }, 'voltar')); btns = []; return false;
      }
      byId = new Map(th.items.map((it) => [it.id, it])); preload(th); prevOk = -1;
      const vs = th.verso ? `url(../${th.verso})` : th.back ? `url(../${th.back})` : null;
      const board = h('div', { class: `kx-board mem-board n${st.pairs}`, style: `--cols:${cols(st.deck.length)}` }, ...st.deck.map((id, i) => {
        const bi = vs || `url(../assets/cards/b${String((i * 7 + (i >> 1)) % 10 + 1).padStart(2, '0')}.webp)`;
        return h('button', { type: 'button', class: 'kx-mem mem-photo', 'aria-label': 'carta virada para baixo', onclick: () => tap(i) },
          h('span', { class: 'kx-mem-in' }, h('span', { class: 'kx-mem-back', 'aria-hidden': 'true', style: `--bi:${bi}` }), h('span', { class: 'kx-mem-front', 'aria-hidden': 'true' }, face(byId.get(id)))));
      }));
      btns = [...board.children]; boardHost.replaceChildren(board); return true;
    };
    const resultado = () => {
      if (resultHost.childElementCount) return; const w = ML.winner(st); const txt = w === -1 ? 'empate!' : w === me ? 'você venceu!' : 'seu amigo venceu!';
      bot.set('cheer', txt); FB.great(boardHost, { msg: txt });
      resultHost.replaceChildren(h('div', { class: 'kx-result' }, h('h2', {}, txt), h('b', { class: 'kx-pct' }, h('span', { class: 'n' }, `${st.score[me]} × ${st.score[1 - me]}`), h('small', {}, ' pares')),
        h('p', { class: 'muted' }, `${st.pairs} pares de ${th.title.toLowerCase()} · você ${st.score[me]} · amigo ${st.score[1 - me]}`),
        h('div', { class: 'row kx-act' }, h('button', { class: 'kd-btn', type: 'button', onclick: revanche }, 'revanche'), h('button', { class: 'kd-chip', type: 'button', onclick: sair }, 'sair'))));
    };
    const paint = () => {
      if (!btns.length) return;
      btns.forEach((b, i) => { const ok = st.ok.includes(i); const up = ok || st.up.includes(i); b.classList.toggle('up', up); b.classList.toggle('ok', ok); b.setAttribute('aria-label', up ? byId.get(st.deck[i]).name : 'carta virada para baixo'); });
      const eu = st.turn === me; status.textContent = st.fin ? `fim · você ${st.score[me]} × ${st.score[1 - me]} amigo` : `${eu ? 'sua vez' : 'vez do amigo'} · você ${st.score[me]} × ${st.score[1 - me]} amigo`; status.classList.toggle('mem-p2', !eu && !st.fin);
      if (prevOk >= 0 && st.ok.length > prevOk) bot.set('cheer', FB.line('win')); prevOk = st.ok.length;
      if (!st.fin) bot.set(eu ? 'think' : 'happy', eu ? 'sua vez! onde será?' : 'vez do seu amigo…');
      if (st.fin) resultado();
    };
    const schedule = () => { // quem está na vez confere as duas cartas viradas (mesmo se o celular voltou da internet com elas abertas)
      clearTimeout(roomTimer); roomTimer = 0; if (!ML.aguardaConferir(st) || st.turn !== me) return;
      const igual = st.deck[st.up[0]] === st.deck[st.up[1]]; // o amigo só enxerga a cada ~1,2 s: erro fica 2 s à vista, acerto 1,4 s
      roomTimer = setTimeout(() => { if (gone || !conn || !ML.aguardaConferir(st) || st.turn !== me) return; const antes = st; st = ML.resolve(st); if (st === antes) return; paint(); send(); schedule(); }, igual ? 1400 : 2000);
    };
    function tap(i) { if (!ML.canFlip(st, i, me)) return; st = ML.flip(st, i, me); paint(); send(); schedule(); }
    function revanche() { if (!th) return; st = ML.rematch(st, th); key = ML.deckKey(st); if (build()) { paint(); send(); schedule(); } }
    cn.on.state = (s) => {
      if (gone || !ML.validMatch(s)) return; clearTimeout(roomTimer); roomTimer = 0; st = s; const k = ML.deckKey(s);
      if (k !== key) { key = k; if (!build()) return; } paint(); schedule();
    };
    stage.replaceChildren(h('div', { class: 'row kd-modes mem-top' }, h('b', {}, '2 celulares'), h('button', { class: 'kd-chip', type: 'button', onclick: sair }, 'sair')), badge.el, status, boardHost, resultHost);
    key = ML.deckKey(st); if (build()) { paint(); schedule(); }
  }

  if (MS) {
    const th = themeById[MP.theme] || THEMES[0]; preload(th); const seed = Number(MP.seed);
    play(th, Math.min(SIZES.includes(MP.pairs) ? MP.pairs : 8, th.items.length), 1, true, Number.isFinite(seed) && MP.seed != null ? seeded(seed) : Math.random);
  } else {
    stage.replaceChildren(h('p', { class: 'muted', style: 'text-align:center' }, 'carregando os temas…'));
    loadPhotoThemes().then((l) => { photo = l; }).finally(() => { if (!gone) setup(); });
  }
  const onAc = () => { if (!MS && !gone && !live) setup(); }; // o código do aluno foi conferido (ou tirado): refaz a escolha de temas
  document.addEventListener('aluno-acesso', onAc);
  const stop = () => { gone = true; closeRoom(); timers.forEach(clearTimeout); document.removeEventListener('aluno-acesso', onAc); };
  stop.inProgress = () => (MS ? started && !reported : live);
  stop.restart = () => { if (!MS && !gone) { lockNote = false; setup(); } };
  return stop;
}
