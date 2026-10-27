// Área Kids: visual arcade/neon. Jogadores com idade, fases de 0 a 10 (normal, com tempo, "sem errar"), % de acerto, estrelas,
// figurinhas e o robô Robôterista. Livres: explorar a bateria e "monte seu ritmo" (pão, bo-lo, cho-co-la-te).
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, click } from '../audio.js';
import { stars as sparkle, sheet, toast, confirmSheet } from '../ui.js';
import { VOICE } from './beatlab.js';
import { layoutRhythm } from '../reading.js';
import { PIECES, FOODS, nameOf, randomFoods, sameRhythm, cellOf } from '../kids-logic.js';
import { kitMarkup, svgEl, play } from '../kids/art.js';
import { robo, tierOf } from '../kids/robo.js';
import { AGES, MAX_LEVEL, levelSpec, levelTag } from '../kids/levels.js';
import * as P from '../kids/progress.js';
import { runLevel } from '../kids/engine.js';
import { GAMES, ORDER } from '../kids/games.js';
import * as Album from '../kids/album.js';
import { CARDS, ROLES } from '../kids/album-data.js';
import { credit } from './artist-photo.js';
import { downloadReport } from '../kids/report.js';
import { gameIcon } from '../kids/icons.js';

const FREE = [
  ['explorar', 'Explorar a bateria', 'toca e descobre o nome', 'explorar'],
  ['ritmo', 'Monte seu ritmo', 'pão, bo-lo, cho-co-la-te', 'ritmo'],
];
const EMOJI = { pao: '🍞', bolo: '🎂', chocolate: '🍫', shh: '🤫' };
function feedback(el, ok, text) { el.className = `kd-fb ${ok ? 'ok' : 'no'}`; el.textContent = text; }

function explorar(box) {
  const name = h('p', { class: 'kd-big' }, 'toca numa peça!');
  const kit = svgEl(kitMarkup(), 'kd-kit');
  kit.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-p]'); if (!g) return; const id = g.dataset.p; play(id); name.textContent = nameOf(id);
    kit.querySelectorAll('.kp').forEach((x) => x.classList.toggle('hl', x.dataset.p === id)); });
  box.replaceChildren(kit, name);
}

const put = (el, ...kids) => el.replaceChildren(...kids.filter(Boolean)); // replaceChildren(null) escreveria "null"
function ritmo(box) {
  let mode = 'criar'; let slots = []; let secret = null; let cur = -1;
  const fb = h('p', { class: 'kd-fb' });
  const playBar = (ids, mark) => {
    const c = audio(); const q = 60 / 80; const t0 = c.currentTime + 0.15 + q * 4;
    for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
    ids.forEach((id, b) => { [...cellOf(id)].forEach((x, k) => { if (x === '1') VOICE.sn(t0 + b * q + (k * q) / 4, 0.85); }); click(t0 + b * q, b === 0 ? 2 : 1, 0.35);
      if (mark) setTimeout(() => { cur = b; mark(); }, (t0 + b * q - c.currentTime) * 1000); });
    if (mark) setTimeout(() => { cur = -1; mark(); }, (t0 + 4 * q - c.currentTime) * 1000);
  };
  const draw = () => {
    const full = slots.length === 4;
    const score = full ? svgEl(N.toSVG(layoutRhythm(slots.map(cellOf), { width: 360 })), 'kd-score') : null;
    const slotEls = Array.from({ length: 4 }, (_, i) => { const id = slots[i]; const f = FOODS.find((x) => x.id === id);
      return h('button', { type: 'button', class: `kd-slot${cur === i ? ' now' : ''}${id ? ' full' : ''}`, 'aria-label': id ? `Tirar ${f.word}` : `Tempo ${i + 1} vazio`, onclick: () => { if (id) { slots = slots.slice(0, i); draw(); } } },
        id ? [h('span', { class: 'kd-emoji' }, EMOJI[id]), h('small', {}, f.syl.join('-'))] : h('small', {}, String(i + 1))); });
    put(box,
      h('div', { class: 'row kd-modes' }, ...[['criar', '🎨 criar'], ['adivinha', '🕵️ adivinha']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${mode === k ? ' on' : ''}`, onclick: () => { mode = k; slots = []; secret = k === 'adivinha' ? randomFoods() : null; fb.textContent = ''; draw(); } }, t))),
      mode === 'adivinha' ? h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playBar(secret) }, '▶ ouvir o ritmo secreto') : h('p', { class: 'kd-q' }, 'monta 4 tempos e toca!'),
      h('div', { class: 'kd-slots' }, ...slotEls),
      h('div', { class: 'kd-foods' }, ...FOODS.map((f) => h('button', { type: 'button', class: 'kd-food', disabled: full, onclick: () => { if (slots.length < 4) { slots = [...slots, f.id]; draw(); } } }, h('span', { class: 'kd-emoji' }, EMOJI[f.id]), h('b', {}, f.syl.join('-')), h('small', {}, f.fig)))),
      score,
      h('div', { class: 'row kd-modes' },
        full ? h('button', { class: 'kd-btn', type: 'button', onclick: () => playBar(slots, () => box.querySelectorAll('.kd-slot').forEach((s, i) => s.classList.toggle('now', i === cur))) }, '▶ tocar') : null,
        mode === 'adivinha' && full ? h('button', { class: 'kd-btn', type: 'button', onclick: (e) => { if (sameRhythm(slots, secret)) { feedback(fb, true, 'acertou o ritmo secreto! ⭐'); sparkle(e.currentTarget); secret = randomFoods(Math.random, 2); slots = []; setTimeout(draw, 1500); } else feedback(fb, false, 'quase! ouve de novo e troca uma carta'); } }, 'conferir') : null,
        slots.length ? h('button', { class: 'kd-chip', type: 'button', onclick: () => { slots = []; draw(); } }, 'limpar') : null),
      fb);
  };
  draw();
}

const RUN = { explorar, ritmo };

/** Mais jogos: os do app e os do site jogosdemusica.com.br (esses abrem em outra aba). */
const EXTERNAL = [['#/ritmo', 'Jogos de ritmo', 'toca no tempo e ganha XP', 'explorar'], ['#/treinos/montar', 'Monte o ditado', 'ouvir e montar com as células', 'pauta'], ['https://jogosdemusica.com.br/JOGOS/Ditado_ritmico/jogo/', 'Ditado rítmico', 'ouvir e escrever o ritmo', 'eco']];

const ageLabel = (a) => (AGES.find((x) => x[0] === a) || AGES[1])[1];
const wait$ = (txt) => h('span', { class: 'kx-wait' }, txt);

/** Cartão de jogo: "telinha" de fliperama com ícone neon, nome em pixel, descrição e andamento. */
function gameCard(href, id, title, blurb, meta, { on = false, pct = null, led = true } = {}) {
  const screen = h('span', { class: 'kx-screen' }, h('i', { class: `kx-led${led ? '' : ' off'}` }), h('span', { class: `kx-medal${on ? ' on' : ''}`, 'aria-hidden': 'true' }, '★'));
  screen.insertAdjacentHTML('beforeend', gameIcon(id));
  const a = h('a', { class: 'kx-gcard', href }, screen, h('b', { class: 'kx-gt' }, title), h('span', { class: 'kx-gd' }, blurb));
  if (pct != null) a.append(h('span', { class: 'kx-bar', 'aria-hidden': 'true' }, h('i', { style: `width:${pct}%` })));
  if (meta) a.append(h('span', { class: 'kx-gm' }, meta));
  return a;
}
const wideCard = (id, title, sub, onclick, href) => {
  const screen = h('span', { class: 'kx-screen' }, h('i', { class: 'kx-led' })); screen.insertAdjacentHTML('beforeend', gameIcon(id));
  const kids = [screen, h('span', {}, h('b', { class: 'kx-gt' }, title), h('br'), h('span', { class: 'kx-gd' }, sub))];
  return href ? h('a', { class: 'kx-wide', href }, ...kids) : h('button', { class: 'kx-wide', type: 'button', onclick }, ...kids);
};
const topBar = (backHref, right) => h('div', { class: 'kx-top' }, backHref ? h('a', { class: 'kx-back', href: backHref }, '‹ voltar') : h('span', { class: 'kx-title' }, h('span', { class: 't1' }, 'beaterista'), h('span', { class: 't2' }, 'KIDS')), right || null);

/* ---------- jogador ---------- */
function newPlayer(onDone) {
  sheet('Quem vai jogar?', (close) => {
    let age = 'b';
    const name = h('input', { type: 'text', maxlength: 24, placeholder: 'nome ou apelido', 'aria-label': 'Nome do jogador' });
    const ages = h('div', { class: 'row kx-ages', role: 'radiogroup', 'aria-label': 'Idade' });
    const drawAges = () => ages.replaceChildren(...AGES.map(([k, t]) => h('button', { type: 'button', class: `kd-chip${age === k ? ' on' : ''}`, role: 'radio', 'aria-checked': String(age === k), onclick: () => { age = k; drawAges(); } }, t)));
    drawAges();
    const go = async () => { const n = name.value.trim(); if (!n) { name.focus(); return; } await P.addProfile(n, age); close(); toast(`oi, ${n}! ⭐`, { ms: 1800 }); onDone && onDone(); };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name), h('p', { class: 'muted' }, 'idade (muda o tamanho e a velocidade das fases):'), ages,
      h('button', { class: 'btn primary', type: 'button', onclick: go }, 'começar'));
  });
}
function switchPlayer(onDone) {
  sheet('Jogadores', (close) => {
    const list = h('div', { style: 'display:grid;gap:8px' });
    const draw = () => {
      const cur = P.active();
      list.replaceChildren(...P.profiles().map((p) => h('div', { class: 'row kx-pl' },
        h('button', { class: `btn${cur && cur.id === p.id ? '' : ' ghost'}`, type: 'button', onclick: async () => { await P.setActive(p.id); close(); onDone && onDone(); } }, `${p.name} · ${ageLabel(p.age)}`),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${p.name}`, onclick: async () => { if (await confirmSheet('Apagar jogador?', `${p.name} perde estrelas e figurinhas.`, 'Apagar')) { await P.removeProfile(p.id); close(); onDone && onDone(); } } }, icon('trash', 18))))); };
    draw();
    return h('div', { class: 'sheet-body' }, list, h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); newPlayer(onDone); } }, '+ novo jogador'));
  });
}
async function reportFor(me, btn) {
  btn.disabled = true; toast('montando o PDF…', { id: 'kx-pdf', ms: 30000 });
  try { const r = await downloadReport(me); toast(r.shared ? 'PDF pronto ✓' : `baixado: ${r.name}`, { id: 'kx-pdf', ms: 2800 }); } catch (e) { toast(`não consegui gerar: ${e.message || 'erro'}`, { id: 'kx-pdf', ms: 4000 }); }
  btn.disabled = false;
}

/* ---------- telas ---------- */
function homeScreen(host, rerender) {
  const me = P.active();
  if (!me) {
    const r = robo({ mood: 'happy', size: 110, say: 'oi! eu sou o Robôterista. qual é o seu nome?' });
    host.append(topBar(), h('div', { class: 'kx-hello' }, r.el), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => newPlayer(rerender) }, 'começar'),
      h('h2', { class: 'kx-h' }, 'jogos livres'), h('div', { class: 'kx-cards' }, ...FREE.map(([k, t, s, ic]) => gameCard(`#/kids/${k}`, ic, t, s, 'sem fases'))));
    return;
  }
  const total = P.totalStars(me.id); const tier = tierOf(total);
  const r = robo({ mood: 'happy', tier, size: 96, say: total ? `oi, ${me.name}! já temos ${total} estrelas!` : `oi, ${me.name}! vamos jogar?` });
  host.append(topBar(),
    h('div', { class: 'kx-me' }, h('span', { class: 'kx-av', 'aria-hidden': 'true' }, me.name.trim()[0].toUpperCase()), h('span', {}, h('b', {}, me.name), h('br'), h('small', {}, ageLabel(me.age))),
      h('span', { class: 'kd-stars' }, `★ ${total}`), h('button', { class: 'btn small ghost', type: 'button', onclick: () => switchPlayer(rerender) }, 'trocar')),
    h('div', { class: 'kx-hello' }, r.el),
    h('h2', { class: 'kx-h' }, 'jogos'),
    h('div', { class: 'kx-cards' }, ...ORDER.map((k) => { const g = GAMES[k]; const s = P.summary(me.id, k);
      return gameCard(`#/kids/${k}`, g.icon || k, g.title, g.blurb, s.answered ? `fase ${s.top}/10 · ★ ${s.stars} · ${s.pct}%` : 'novo · ainda não jogou', { on: s.stars > 0, pct: Math.round((s.stars / s.maxStars) * 100), led: s.answered > 0 }); })),
    h('h2', { class: 'kx-h' }, 'coleção'),
    wideCard('album', 'Álbum de figurinhas', `${Album.owned(me.id).length} de ${Album.total()} · bateristas, guitarristas e vocalistas`, null, '#/kids/album'),
    wideCard('relatorio', 'Relatório em PDF', 'acertos, erros e uma tabelinha pra decorar', (e) => reportFor(me, e.currentTarget)),
    h('h2', { class: 'kx-h' }, 'livres'),
    h('div', { class: 'kx-cards kx-mini' }, ...FREE.map(([k, t, s, ic]) => gameCard(`#/kids/${k}`, ic, t, s, null))),
    h('h2', { class: 'kx-h' }, 'mais jogos'),
    h('div', { class: 'kx-cards kx-mini' }, ...EXTERNAL.map(([url, t, s, ic]) => { const c = gameCard(url, ic, t, s, null); if (/^https?:/.test(url)) { c.target = '_blank'; c.rel = 'noopener noreferrer'; } return c; })),
    h('p', { class: 'lib-note' }, 'cada fase vale até 3 estrelas pela % de acerto: 60% = 1, 80% = 2, 100% = 3. ⏱ = com tempo · 💥 = errou, recomeça. o som sai daqui do aparelho, sem internet.'));
}

function albumScreen(host, role) {
  const me = P.active(); if (!me) { location.hash = '#/kids'; return; }
  const have = new Set(Album.owned(me.id)); const tier = tierOf(P.totalStars(me.id));
  const r = robo({ mood: have.size ? 'cheer' : 'happy', tier, size: 84, say: have.size ? `${have.size} de ${Album.total()} figurinhas!` : 'ganha figurinhas passando de fase!' });
  const filter = ROLES[role] ? role : '';
  const list = CARDS.filter((c) => !filter || c.role === filter).sort((x, y) => (have.has(y.id) ? 1 : 0) - (have.has(x.id) ? 1 : 0)); // as que já tem vêm primeiro
  const open = (c) => sheet(c.name, () => h('div', { class: 'sheet-body kx-big' }, Album.cardEl(c), h('p', { class: 'kx-fact' }, c.fact), credit(`album-${c.id}`, c.wiki)));
  host.append(topBar('#/kids'), h('h1', { class: 'kx-pix kx-pagetitle' }, 'Álbum'), h('div', { class: 'kx-hello' }, r.el),
    h('div', { class: 'row kd-modes' }, h('a', { class: `kd-chip${filter ? '' : ' on'}`, href: '#/kids/album' }, 'todas'), ...Object.entries(ROLES).map(([k, [t, e]]) => h('a', { class: `kd-chip${filter === k ? ' on' : ''}`, href: `#/kids/album/${k}` }, `${e} ${t}`))),
    h('div', { class: 'kx-album' }, ...list.map((c) => (have.has(c.id) ? Album.cardEl(c, { onclick: () => open(c) }) : Album.cardEl(c, { locked: true })))),
    h('p', { class: 'lib-note' }, 'cada vez que você melhora as estrelas de uma fase, ganha uma figurinha nova. as fotos vêm do Wikimedia Commons (licenças livres, com crédito); sem foto livre, aparece a inicial.'));
}

function levelsScreen(host, gameId, mode) {
  const g = GAMES[gameId]; const me = P.active();
  if (!me) { location.hash = '#/kids'; return; }
  const m = g.modes ? (g.modes.some((x) => x[0] === mode) ? mode : g.mode) : '';
  const s = P.summary(me.id, gameId); const tier = tierOf(P.totalStars(me.id));
  const r = robo({ mood: 'happy', tier, size: 84, say: s.pct != null ? `${s.pct}% de acerto até agora!` : 'escolhe uma fase!' });
  const lv = (l) => { const spec = levelSpec(l, me.age); const st = P.starsAt(me.id, gameId, l); const open = P.unlocked(me.id, gameId, l); const best = (P.progOf(me.id).lv[`${gameId}:${l}`] || {}).p;
    const body = [h('b', { class: 'kx-n' }, String(l)), h('small', {}, levelTag(spec)), h('span', { class: 'kx-st' }, ...[1, 2, 3].map((n) => h('i', { class: n <= st ? 'on' : '' }, '★'))), best != null ? h('small', { class: 'kx-best' }, `${best}%`) : null];
    return open ? h('a', { class: `kx-lv${st ? ' done' : ''}${spec.sudden ? ' boss' : ''}`, href: `#/kids/${gameId}/${l}${m ? `/${m}` : ''}` }, ...body)
      : h('button', { type: 'button', class: 'kx-lv locked', 'aria-label': `Fase ${l} trancada`, onclick: () => toast('ganha 1 estrela na fase anterior pra abrir', { ms: 2200 }) }, h('b', { class: 'kx-n' }, '🔒'), h('small', {}, `fase ${l}`)); };
  host.append(topBar('#/kids', h('span', { class: 'kd-stars kx-stars-top' }, `★ ${s.stars}/${s.maxStars}`)),
    h('div', { class: 'kx-gtitle' }, h('span', { class: 'kx-gico' }), h('div', {}, h('h1', { class: 'kx-pix kx-pagetitle' }, g.title), h('p', { class: 'kx-gd' }, g.blurb))),
    h('div', { class: 'kx-hello' }, r.el),
    g.modes ? h('div', { class: 'row kd-modes' }, ...g.modes.map(([k, t]) => h('a', { class: `kd-chip${m === k ? ' on' : ''}`, href: `#/kids/${gameId}/-/${k}` }, t))) : null,
    h('div', { class: 'kx-levels' }, ...Array.from({ length: MAX_LEVEL + 1 }, (_, l) => lv(l))),
    h('p', { class: 'lib-note' }, `${g.ages}. ⏱ = com tempo · 💥 = errou, recomeça. a idade de ${me.name} (${ageLabel(me.age)}) ajusta o tempo e o tamanho das fases.`));
  host.querySelector('.kx-gico').innerHTML = gameIcon(g.icon || gameId);
}

export function mount(host, parts = []) {
  const [first, lv, mode] = parts; let off = () => {};
  host.classList.add('kx-arc'); document.documentElement.classList.add('kx-on');
  const rerender = () => { off(); off = () => {}; host.replaceChildren(); mount2(); };
  const mount2 = () => {
    const free = first && RUN[first] ? first : null;
    if (free) {
      const g = FREE.find((x) => x[0] === free); const box = h('div', { class: 'kd-game' });
      host.append(topBar('#/kids'), h('h1', { class: 'kx-pix kx-pagetitle' }, g[1]), h('p', { class: 'kx-gd' }, g[2]), box); RUN[free](box); return;
    }
    if (first === 'album') { albumScreen(host, lv); return; }
    if (first && GAMES[first]) {
      const me = P.active(); if (!me) { location.hash = '#/kids'; return; }
      const level = lv !== undefined && lv !== '-' && !Number.isNaN(Number(lv)) ? Math.max(0, Math.min(MAX_LEVEL, Number(lv))) : null;
      if (level === null) { levelsScreen(host, first, mode); return; }
      if (!P.unlocked(me.id, first, level)) { location.hash = `#/kids/${first}`; return; }
      const box = h('div'); host.append(box);
      off = (GAMES[first].run || runLevel)(GAMES[first], { host: box, level, profile: me, mode: mode || GAMES[first].mode || '', onBack: () => { location.hash = `#/kids/${first}${mode ? `/-/${mode}` : ''}`; }, onLevel: (n) => { location.hash = `#/kids/${first}/${n}${mode ? `/${mode}` : ''}`; if (n === level) rerender(); } });
      return;
    }
    homeScreen(host, rerender);
  };
  mount2();
  const unsub = store.subscribe((i) => { if (i.remote && !first) rerender(); });
  return () => { off(); unsub(); host.classList.remove('kx-arc'); document.documentElement.classList.remove('kx-on'); };
}
