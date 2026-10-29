// Área Kids: visual arcade/neon. Jogadores com idade, fases de 0 a 10 (normal, com tempo, "sem errar"), % de acerto, estrelas,
// figurinhas e o robô Robôterista. Livres: explorar a bateria e "monte seu ritmo" (pão, bo-lo, cho-co-la-te).
import { h, icon, reducedMotion } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, click } from '../audio.js';
import { stars as sparkle, sheet, toast, confirmSheet } from '../ui.js';
import { VOICE } from './beatlab.js';
import { layoutRhythm } from '../reading.js';
import { PIECES, nameOf } from '../kids-logic.js';
import { mountRitmo } from '../kids/ritmo.js';
import { mountMemoria } from '../kids/memoria.js';
import { kitMarkup, svgEl, play } from '../kids/art.js';
import { robo, tierOf } from '../kids/robo.js';
import { AGES, MAX_LEVEL, levelSpec, levelTag } from '../kids/levels.js';
import * as P from '../kids/progress.js';
import { runLevel } from '../kids/engine.js';
import { GAMES, ORDER } from '../kids/games.js';
import * as Album from '../kids/album.js';
import { CARDS, ROLES, byId } from '../kids/album-data.js';
import { openPack } from '../kids/pack.js';
import { credit } from './artist-photo.js';
import { relatorioScreen } from './kids-relatorio.js';
import { gameIcon } from '../kids/icons.js';

/** Área do aluno (aluno.html): só o que não depende da conta da Bea. */
const ALUNO = () => document.documentElement.classList.contains('aluno-on');
const FREE = [
  ['explorar', 'Explorar a bateria', 'toca livre e descobre os nomes', 'explorar'],
  ['memoria', 'Jogo da memória', '4, 8 ou 12 pares · 4 temas', 'memoria'],
  ['ritmo', 'Monte seu ritmo', 'pão, bolo, chocolate, céu, bola, pato…', 'ritmo'],
];

/** Explorar a bateria: aba "tocar" (toca cada peça do jeito que quiser, vários dedos) e aba "nomes" (toca e aparece o nome da peça). */
function explorar(box) {
  let tab = 'tocar'; let timer = 0;
  const draw = () => {
    const name = h('p', { class: `kd-big kd-name${tab === 'tocar' ? ' off' : ''}`, 'aria-live': 'polite' }, tab === 'nomes' ? 'toca numa peça!' : '');
    const kit = svgEl(kitMarkup(), 'kd-kit kd-kit-free');
    kit.addEventListener('pointerdown', (e) => { // cada dedo vale um toque, então dá pra tocar com os dois ao mesmo tempo
      const g = e.target.closest('[data-p]'); if (!g) return; e.preventDefault(); const id = g.dataset.p; play(id);
      g.classList.remove('hit'); void g.getBoundingClientRect(); g.classList.add('hit'); setTimeout(() => g.classList.remove('hit'), 260);
      if (tab === 'nomes') { name.textContent = nameOf(id); name.classList.remove('pop'); void name.offsetWidth; name.classList.add('pop'); kit.querySelectorAll('.kp').forEach((x) => x.classList.toggle('hl', x.dataset.p === id)); clearTimeout(timer); timer = setTimeout(() => kit.querySelectorAll('.kp.hl').forEach((x) => x.classList.remove('hl')), 1400); }
    });
    box.replaceChildren(
      h('div', { class: 'row kd-modes' }, ...[['tocar', '🥁 tocar livre'], ['nomes', '🔤 nomes das peças']].map(([k, t]) => h('button', { type: 'button', class: `kd-chip${tab === k ? ' on' : ''}`, onclick: () => { tab = k; draw(); } }, t))),
      h('p', { class: 'kd-q' }, tab === 'tocar' ? 'toca em qualquer peça, do jeito que quiser!' : 'toca numa peça pra ver o nome dela'),
      kit, name);
  };
  draw();
  return () => clearTimeout(timer);
}

const put = (el, ...kids) => el.replaceChildren(...kids.filter(Boolean)); // replaceChildren(null) escreveria "null"
function ritmo(box) { return mountRitmo(box); }

const RUN = { explorar, ritmo, memoria: mountMemoria };

const ageLabel = (a) => (ALUNO() ? 'jogador' : (AGES.find((x) => x[0] === a) || AGES[1])[1]);
const wait$ = (txt) => h('span', { class: 'kx-wait' }, txt);

/** Fundo rabiscado do cartão: moldura tracejada, rabiscos nos 4 cantos e tracinhos em volta do ícone (cores vêm do cartão). */
const BG = '<svg class="kx-bgd" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">'
  + '<rect x="4" y="4" width="92" height="112" rx="9" style="stroke:var(--s1)" stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>'
  + '<path d="M9 22l7-13 2 9 7-12 2 9 6-9" style="stroke:var(--s2)" stroke-width="3.6"/><path d="M91 10l-8 11 9-1-7 11" style="stroke:var(--s1)" stroke-width="3.6"/>'
  + '<path d="M9 104l10-5-7-1 9-6" style="stroke:var(--s3)" stroke-width="3.6"/><path d="M80 112l5-9 3 6 5-11" style="stroke:var(--s4)" stroke-width="3.6"/>'
  + '<g style="stroke:var(--s3)" stroke-width="2.6"><path d="M50 14v-6M33 20l-3-5M67 20l3-5M22 38l-5-2M78 38l5-2"/></g></svg>';
const cardBg = () => { const t = document.createElement('template'); t.innerHTML = BG; return t.content.firstChild; };
/** Cartão de jogo: cartaz de cor chapada com ícone grande, nome em marker, descrição e andamento. */
function gameCard(href, id, title, blurb, meta, { on = false, pct = null } = {}) {
  const ico = h('span', { class: 'kx-gi' }); ico.insertAdjacentHTML('beforeend', gameIcon(id));
  const a = h('a', { class: `kx-g${on ? ' on' : ''}`, href }, cardBg(), ico, h('b', { class: 'kx-gt' }, title), h('span', { class: 'kx-gd' }, blurb));
  if (pct != null) a.append(h('span', { class: 'kx-bar', 'aria-hidden': 'true' }, h('i', { style: `width:${pct}%` })));
  if (meta) a.append(h('span', { class: 'kx-gm' }, meta));
  return a;
}
const wideCard = (id, title, sub, onclick, href) => {
  const ico = h('span', { class: 'kx-gi' }); ico.insertAdjacentHTML('beforeend', gameIcon(id));
  const kids = [cardBg(), ico, h('b', { class: 'kx-gt' }, title), h('span', { class: 'kx-gm' }, sub)];
  return href ? h('a', { class: 'kx-g wide', href }, ...kids) : h('button', { class: 'kx-g wide', type: 'button', onclick }, ...kids);
};
const topBar = (backHref, right) => h('div', { class: 'kx-top' }, backHref ? h('a', { class: 'kx-back', href: backHref }, '‹ voltar') : h('span', { class: 'kx-title' }, h('span', { class: 't1' }, 'beaterista'), h('span', { class: 't2' }, 'JOGOS'), h('img', { class: 'fx-doodle bolt kx-fx-a', src: 'assets/paul/d-bolt2.webp', alt: '', 'aria-hidden': 'true' }), h('img', { class: 'fx-doodle phones kx-fx-b', src: 'assets/paul/d-phones.webp', alt: '', 'aria-hidden': 'true' })), right || null);

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

/* ---------- telas ---------- */
function homeScreen(host, rerender) {
  const me = P.active();
  if (!me) {
    const r = robo({ mood: 'peace', size: 110, say: 'oi! eu sou o Robôterista. qual é o seu nome?' });
    host.append(topBar('#/jogos'), h('div', { class: 'kx-hello' }, r.el), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => newPlayer(rerender) }, 'começar'));
    return;
  }
  const total = P.totalStars(me.id); const tier = tierOf(total);
  const r = robo({ mood: 'happy', tier, size: 96, say: total ? `oi, ${me.name}! já temos ${total} estrelas!` : `oi, ${me.name}! vamos jogar?` });
  host.append(topBar('#/jogos'),
    h('div', { class: 'kx-me' }, h('span', { class: 'kx-av', 'aria-hidden': 'true' }, me.name.trim()[0].toUpperCase()), h('span', {}, h('b', {}, me.name), h('br'), h('small', {}, ageLabel(me.age))),
      h('span', { class: 'kd-stars' }, `★ ${total}`), h('button', { class: 'btn small ghost', type: 'button', onclick: () => switchPlayer(rerender) }, 'trocar')),
    h('div', { class: 'kx-hello' }, r.el),
    h('h2', { class: 'kx-h' }, 'fases'),
    h('div', { class: 'kx-cards' }, ...ORDER.map((k) => { const g = GAMES[k]; const s = P.summary(me.id, k);
      return gameCard(`#/kids/${k}`, g.icon || k, g.title, g.blurb, s.answered ? `fase ${s.top} · ${s.pct}%` : 'novo', { on: s.stars > 0, pct: Math.round((s.stars / s.maxStars) * 100), led: s.answered > 0 }); })),
    h('h2', { class: 'kx-h' }, 'coleção'),
    h('div', { class: 'kx-cards' }, wideCard('album', 'Álbum', `${Album.owned(me.id).length} de ${Album.total()} figurinhas`, null, '#/kids/album'),
      ...(ALUNO() ? [] : [wideCard('relatorio', 'Relatório', 'monte, edite e gere o pdf', null, '#/kids/relatorio')])),
    h('p', { class: 'lib-note' }, 'cada fase vale até 3 estrelas pela % de acerto: 60% = 1, 80% = 2, 100% = 3. ⏱ = com tempo · 💥 = errou, recomeça. o som sai daqui do aparelho, sem internet.'));
}

function albumScreen(host, role) {
  const me = P.active(); if (!me) { location.hash = '#/kids'; return; }
  const rerender = () => { host.replaceChildren(); albumScreen(host, role); };
  const pasted = new Set(Album.pasted(me.id)); const trayIds = Album.tray(me.id); const tier = tierOf(P.totalStars(me.id));
  const r = robo({ mood: pasted.size ? 'cheer' : 'selfie', tier, size: 84, say: trayIds.length ? `${trayIds.length} pra colar!` : pasted.size ? `${pasted.size} de ${Album.total()} coladas!` : 'ganha figurinhas passando de fase!' });
  const filter = ROLES[role] ? role : '';
  const slots = new Map(CARDS.map((c, i) => [c.id, i + 1]));
  const list = CARDS.filter((c) => !filter || c.role === filter);
  const open = (c) => sheet(c.name, () => h('div', { class: 'sheet-body kx-big' }, Album.cardEl(c), h('p', { class: 'kx-fact' }, c.fact), credit(`album-${c.id}`, c.wiki)));
  const grid = h('div', { class: 'kx-album' }, ...list.map((c) => (pasted.has(c.id) ? Album.cardEl(c, { onclick: () => open(c), slot: slots.get(c.id) }) : Album.cardEl(c, { locked: true, slot: slots.get(c.id) }))));
  let busy = false;
  const stick = async (id, btn) => {
    if (busy) return; busy = true; const c = byId[id];
    if (filter && c.role !== filter) { location.hash = '#/kids/album'; busy = false; return; } // a carta é de outra categoria: mostra todas
    const slot = grid.querySelector(`[data-id="${id}"]`); if (!slot) { busy = false; return; }
    slot.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }); await new Promise((ok) => setTimeout(ok, reducedMotion() ? 0 : 380));
    const from = btn.getBoundingClientRect(); const to = slot.getBoundingClientRect();
    const fly = Album.cardEl(c, { fresh: false }); fly.classList.add('kx-fly'); Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px` });
    document.body.append(fly); btn.classList.add('gone');
    const dx = to.left - from.left; const dy = to.top - from.top; const k = to.width / from.width;
    const anim = fly.animate(reducedMotion() ? [{ opacity: 1 }, { opacity: 1 }] : [
      { transform: 'translate(0,0) scale(1) rotate(-6deg)', offset: 0 }, { transform: `translate(${dx * .5}px,${dy * .5 - 60}px) scale(${(1 + k) / 2 + .25}) rotate(8deg)`, offset: .55 },
      { transform: `translate(${dx}px,${dy}px) scale(${k * 1.12}) rotate(0)`, offset: .85 }, { transform: `translate(${dx}px,${dy}px) scale(${k})`, offset: 1 }], { duration: reducedMotion() ? 50 : 750, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
    await anim.finished.catch(() => {}); fly.remove();
    await Album.paste(me.id, id); const done = Album.cardEl(c, { onclick: () => open(c), slot: slots.get(id) }); done.classList.add('kx-stuck'); slot.replaceWith(done);
    setTimeout(() => { busy = false; if (!Album.tray(me.id).length) rerender(); }, reducedMotion() ? 0 : 700);
  };
  const trayEl = trayIds.length ? h('div', { class: 'kx-tray' }, h('p', { class: 'kx-tray-t' }, `✂ folha de colar · ${trayIds.length}`),
    h('div', { class: 'kx-tray-row' }, ...trayIds.map((id) => { const b = Album.cardEl(byId[id], { onclick: () => stick(id, b) }); b.classList.add('kx-peel'); return b; })), h('small', { class: 'kx-tray-h' }, 'toque na figurinha para colar no lugar dela')) : null;
  // PACOTINHO DE TESTE: enquanto as regras do jogo não estão definidas, dá pra abrir um pacote aqui. Tirar quando as regras entrarem.
  const test = h('button', { class: 'kd-chip', type: 'button', onclick: async () => { const won = Album.grant(me.id, Album.PACK_SIZE); if (!won.length) { toast('álbum completo!'); return; } await openPack(won, { onPaste: () => { location.hash = '#/kids/album'; } }); rerender(); } }, `🎁 pacotinho de teste (${Album.PACK_SIZE})`);
  host.append(topBar('#/kids'), h('h1', { class: 'kx-pix kx-pagetitle' }, 'Álbum'), h('div', { class: 'kx-hello' }, r.el),
    h('div', { class: 'row kd-modes' }, h('a', { class: `kd-chip${filter ? '' : ' on'}`, href: '#/kids/album' }, 'todas'), ...Object.entries(ROLES).map(([k, [t, e]]) => h('a', { class: `kd-chip${filter === k ? ' on' : ''}`, href: `#/kids/album/${k}` }, `${e} ${t}`))),
    h('div', { class: 'row' }, test), ...(trayEl ? [trayEl] : []), grid,
    h('p', { class: 'lib-note' }, 'cada vez que você melhora as estrelas de uma fase, ganha um pacotinho de figurinhas. as artes são desenhos feitos para o app; quando existe foto livre no Wikimedia Commons (com crédito), ela aparece por cima.'));
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
  host.append(topBar('#/jogos', h('span', { class: 'kd-stars kx-stars-top' }, `★ ${s.stars}/${s.maxStars}`)),
    h('div', { class: 'kx-gtitle' }, h('span', { class: 'kx-gico' }), h('div', {}, h('h1', { class: 'kx-pix kx-pagetitle' }, g.title), h('p', { class: 'kx-gd' }, g.blurb))),
    h('div', { class: 'kx-hello' }, r.el),
    g.modes ? h('div', { class: 'row kd-modes' }, ...g.modes.map(([k, t]) => h('a', { class: `kd-chip${m === k ? ' on' : ''}`, href: `#/kids/${gameId}/-/${k}` }, t))) : null,
    h('div', { class: 'kx-levels' }, ...Array.from({ length: MAX_LEVEL + 1 }, (_, l) => lv(l))),
    h('p', { class: 'lib-note' }, `${g.ages}. ⏱ = com tempo · 💥 = errou, recomeça. ${ALUNO() ? '' : `a idade de ${me.name} (${ageLabel(me.age)}) ajusta o tempo e o tamanho das fases.`}`));
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
      host.append(topBar('#/jogos'), h('h1', { class: 'kx-pix kx-pagetitle' }, g[1]), h('p', { class: 'kx-gd' }, g[2]), box); off = RUN[free](box) || off; return;
    }
    if (first === 'album') { albumScreen(host, lv); return; }
    if (first === 'relatorio') { off = relatorioScreen(host, topBar) || off; return; }
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
