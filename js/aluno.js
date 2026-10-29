// Área do aluno (aluno.html): sem login. O aluno escolhe um nome, joga os Jogos de ritmo e o Kids e aparece no ranking que todos veem.
// Tudo que ele faz fica só no aparelho dele (armazenamento separado do app da Bea); só o nome e as pontuações vão pro ranking.
import { h, icon } from './util.js';
import * as store from './store.js';
import * as P from './kids/progress.js';
import * as RK from './ranking.js';
import * as kids from './views/kids.js';
import * as ritmo from './views/jogos-ritmo.js';
import * as beatlab from './views/beatlab.js';
import * as toque from './views/toque.js';
import * as piano from './views/piano.js';
import * as jogos from './views/jogos.js';
import { banner } from './ui.js';
import { silence } from './audio.js';
import { startScroller } from './scroller.js';

const app = document.getElementById('app');
const NAME_KEY = 'beaterista-aluno-nome';
const NAV = [['#/ritmo', 'play', 'Ritmo'], ['#/beatlab', 'kit', 'Beat Lab'], ['#/tocar', 'drummer', 'Tocar'], ['#/kids', 'study', 'Jogos'], ['#/ranking', 'star', 'Ranking']];
const TAB_OF = { toque: 'tocar', piano: 'tocar', jogos: 'kids' }; // telas que acendem outra aba
let cleanup = null;
document.documentElement.classList.add('aluno-on');

const ID_KEY = 'beaterista-aluno-id';
const visitorId = () => { try { let v = localStorage.getItem(ID_KEY); if (!v) { v = crypto.randomUUID(); localStorage.setItem(ID_KEY, v); } return v; } catch { return crypto.randomUUID(); } };
/** Conta 1 visita por sessão; atualiza o nome quando ele muda. */
function logVisit(name) {
  let novo = true; try { novo = !sessionStorage.getItem('bt-aluno-visita'); sessionStorage.setItem('bt-aluno-visita', '1'); } catch { /* ok */ }
  RK.visit(visitorId(), name, novo);
}
const getName = () => { try { return localStorage.getItem(NAME_KEY) || window.__alunoNome || ''; } catch { return window.__alunoNome || ''; } };
const cleanName = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 20);
const route = () => { const [, a, ...rest] = (location.hash || '#/ritmo').split('/'); return { name: a || 'ritmo', parts: rest.filter(Boolean).map(decodeURIComponent) }; };

/** O Kids guarda o progresso por "jogador": cria/seleciona um com o nome do aluno. */
async function ensureKidsPlayer(name) {
  const mine = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (mine) { if (P.active() && P.active().id !== mine.id) await P.setActive(mine.id); return; }
  await P.addProfile(name, 'b');
}

/** Manda as estrelas dos jogos e o XP dos jogos pro ranking (só sobe se for maior que o anterior). */
let sendT = 0;
function sendScores() {
  clearTimeout(sendT);
  sendT = setTimeout(() => {
    const name = getName(); if (!name) return;
    const me = P.profiles().find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (me) RK.add('kids|estrelas', name, P.totalStars(me.id));
    const xp = store.get('setting-xp'); if (xp && xp.data.total) RK.add('xp', name, xp.data.total);
  }, 3000);
}

function rankingView(view) {
  const me = getName().toLowerCase();
  const box = (title, sub, board, unit) => {
    const list = h('ol', { class: 'al-rank' }, h('li', { class: 'muted' }, 'carregando…'));
    RK.top(board, { fresh: true }).then((rows) => {
      list.replaceChildren(...(rows.length ? rows.map((r, i) => h('li', { class: r.name.toLowerCase() === me ? 'me' : '' }, h('span', { class: 'al-pos' }, `${i + 1}º`), h('span', { class: 'al-nm' }, r.name), h('b', {}, `${Number(r.score).toLocaleString('pt-BR')} ${unit}`)))
        : [h('li', { class: 'muted' }, 'ninguém ainda. seja o primeiro!')]));
    });
    return h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, title), h('p', { class: 'muted' }, sub), list);
  };
  view.append(banner('Ranking', 'os melhores da escola'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
      box('estrelas nos jogos', 'quem juntou mais estrelas nas fases', 'kids|estrelas', '★'),
      box('XP dos jogos', 'quem mais jogou e treinou o ritmo', 'xp', 'XP'),
      h('p', { class: 'lib-note' }, 'o ranking de cada música aparece no fim do jogo de ritmo. só vale a sua melhor pontuação.')));
}

function tocarView(view) {
  const card = (href, title, sub) => h('a', { class: 'card pad al-card', href }, h('h2', { class: 'tag' }, title), h('p', { class: 'muted' }, sub));
  view.append(banner('Tocar', 'bateria, pad e piano na tela'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
    card('#/toque', 'Bateria e pad', 'toque nas peças com vários dedos, grave um ritmo e salve no Beat Lab'),
    card('#/piano', 'Piano', 'teclado na tela, com notas e acordes')));
}

function shell(name) {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', style: 'grid-template-columns: repeat(5, 1fr)', 'aria-label': 'Navegação' });
  const head = h('header', { class: 'top' },
    h('img', { src: 'assets/icons/tambor-96.png', alt: '', width: 40, height: 40 }),
    h('div', { class: 'ws', style: 'flex:1' }, h('span', { class: 'on', style: 'padding:6px 12px' }, `oi, ${name}!`)),
    h('button', { type: 'button', class: 'btn small ghost', onclick: () => { try { localStorage.removeItem(NAME_KEY); } catch { /* ok */ } location.reload(); } }, 'trocar nome'));
  app.replaceChildren(h('div', { class: 'topwrap' }, head), view, nav);

  function go() {
    cleanup && cleanup(); cleanup = null; silence(); view.replaceChildren();
    const r = route(); view.dataset.page = r.name;
    nav.replaceChildren(...NAV.map(([href, ic, label]) => h('a', { href, class: `nav-item${('#/' + (TAB_OF[r.name] || r.name)) === href ? ' on' : ''}`, 'aria-current': ('#/' + (TAB_OF[r.name] || r.name)) === href ? 'page' : null }, icon(ic, 24), h('span', {}, label))));
    let c;
    if (r.name === 'kids') c = kids.mount(view, r.parts);
    else if (r.name === 'ranking') c = rankingView(view);
    else if (r.name === 'jogos') c = jogos.mount(view, r.parts);
    else if (r.name === 'beatlab') c = beatlab.mount(view, r.parts);
    else if (r.name === 'toque') c = toque.mount(view);
    else if (r.name === 'piano') c = piano.mount(view);
    else if (r.name === 'tocar') tocarView(view);
    else if (r.name === 'ritmo') c = ritmo.mount(view, { student: true, name: getName });
    else { location.hash = '#/ritmo'; return; }
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', go);
  go();
}

function askName() {
  const input = h('input', { class: 'field', type: 'text', maxlength: 20, autocomplete: 'given-name', autocapitalize: 'words', required: true, 'aria-label': 'Seu nome', placeholder: 'seu nome ou apelido' });
  const err = h('p', { class: 'form-err', role: 'alert' });
  const form = h('form', { class: 'login-card', onsubmit: async (e) => {
    e.preventDefault(); const n = cleanName(input.value);
    if (n.length < 2) { err.textContent = 'escreva pelo menos 2 letras.'; return; }
    logVisit(n);
    try { localStorage.setItem(NAME_KEY, n); } catch { /* sem armazenamento: vale só nesta sessão */ window.__alunoNome = n; }
    start();
  } },
    h('img', { class: 'login-logo', src: 'assets/logo-512.png', alt: 'Escola de Música Beaterista', width: 132, height: 132 }),
    h('h1', { class: 'login-title login-wordmark' }, h('img', { src: 'assets/logo-nome.png', alt: 'Beaterista', width: 220, height: 74 })),
    h('p', { class: 'center' }, 'qual é o seu nome?'),
    h('label', { class: 'field' }, h('span', {}, 'nome'), input), err,
    h('button', { class: 'btn primary wide', type: 'submit' }, 'entrar'),
    h('p', { class: 'muted center' }, 'seu nome aparece no ranking que todo mundo vê. use só o primeiro nome ou um apelido, sem sobrenome. a escola registra o nome e quando você entra.'));
  app.replaceChildren(h('main', { class: 'login' }, form));
  setTimeout(() => input.focus(), 100);
}

async function start() {
  const name = getName() || window.__alunoNome || '';
  if (!name) { askName(); return; }
  await ensureKidsPlayer(name);
  logVisit(name);
  shell(name);
  sendScores();
  store.subscribe((i) => { if (!i.kind || i.kind === 'setting') sendScores(); });
}

(async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  try { await store.init(); } catch {
    app.replaceChildren(h('main', { class: 'login' }, h('div', { class: 'login-card' }, h('h1', {}, 'Armazenamento indisponível'), h('p', {}, 'Este navegador bloqueou o armazenamento local (modo privado?). Abra no Safari normal.')))); return;
  }
  startScroller();
  start();
})();
