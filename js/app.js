import { h, icon, clock, longDate, shortDate } from './util.js';
import { db, requestPersistence } from './db.js';
import * as store from './store.js';
import * as auth from './auth.js';
import * as sync from './sync.js';
import { banner } from './ui.js';
import { mountLogin } from './views/login.js';
import * as home from './views/home.js';
import * as tasks from './views/tasks.js';
import * as notes from './views/notes.js';
import * as favs from './views/favs.js';
import * as settings from './views/settings.js';
import { mountSoon } from './views/misc.js';
import { openCapture } from './views/capture.js';
import * as photos from './photos-sync.js';
import { initTheme } from './theme.js';
import { openPersonalize } from './views/personalize.js';
import * as mural from './views/mural.js';
import * as library from './views/library.js';
import * as metronome from './views/metronome.js';
import * as accent from './views/accent.js';
import * as studentsView from './views/students.js';
import * as focus from './views/focus.js';
import * as feed from './views/feed.js';
import * as collages from './views/collages.js';
import * as beatlab from './views/beatlab.js';
import * as ouvido from './views/ouvido.js';
import * as kit from './views/kit.js';
import * as tempo from './views/tempo.js';
import { openMenu } from './views/menu.js';
import { startScroller } from './scroller.js';

const app = document.getElementById('app');
let cleanup = null;
let ticker = null;
let started = false;

const NAV = [
  ['#/inicio', 'home', 'Início'],
  ['#/beaterista', 'drummer', 'Alunos'],
  ['#/beatlab', 'kit', 'Beat Lab'],
  ['#/estudos', 'study', 'Estudos'],
];

function route() {
  const hash = location.hash || '#/inicio';
  const [, a, b, ...rest] = hash.split('/');
  return { name: a || 'inicio', arg: b, parts: [b, ...rest].filter(Boolean).map(decodeURIComponent) };
}

function statusBar() {
  const time = h('span', { class: 'sb-time' });
  const net = h('span', { class: 'sb-net' });
  const syn = h('a', { class: 'sb-sync', href: '#/ajustes' });
  const tick = () => { time.textContent = `${shortDate()} · ${clock()}`; };
  const draw = () => {
    const on = navigator.onLine;
    net.textContent = on ? '● online' : '○ offline';
    net.className = `sb-net ${on ? 'on' : 'off'}`;
    const pend = store.pendingCount();
    const s = sync.state.status;
    const map = { ok: '✓ sincronizado', syncing: '↻ sincronizando…', offline: '⌂ só neste aparelho', error: '⚠ erro ao sincronizar', auth: '⚠ entrar de novo', idle: on ? '… aguardando' : '⌂ só neste aparelho' };
    let t = map[s] || '';
    if (pend && s !== 'syncing') t += ` · ${pend} pendente${pend > 1 ? 's' : ''}`;
    syn.textContent = t;
    syn.className = `sb-sync ${s}`;
  };
  tick(); draw();
  clearInterval(ticker); ticker = setInterval(tick, 1000);
  sync.onSync(draw); store.subscribe(draw);
  addEventListener('online', draw); addEventListener('offline', draw);
  return h('div', { class: 'statusbar', role: 'status', 'aria-label': 'Data, hora e estado de conexão' }, time, h('span', { class: 'sb-right' }, net, syn));
}

/* ---------- voltar: botão no topo + arrastar da borda esquerda ---------- */
const trail = []; // telas visitadas nesta sessão (para saber se dá pra voltar pelo histórico)
function parentOf(r) { return r.parts.length ? `#/${r.name}` : '#/inicio'; }
function goBack() {
  if (trail.length > 1) history.back();
  else location.hash = parentOf(route());
}
function swipeBack() {
  const tip = h('div', { class: 'swipe-back', 'aria-hidden': 'true' }, icon('back', 22));
  document.body.append(tip);
  let x0 = 0, y0 = 0, dx = 0, on = false;
  const blocked = () => route().name === 'inicio' || document.querySelector('#overlay .sheet');
  addEventListener('touchstart', (e) => { const t = e.touches[0]; on = t.clientX < 26 && !blocked(); x0 = t.clientX; y0 = t.clientY; dx = 0; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (!on) return; const t = e.touches[0]; dx = t.clientX - x0; const dy = Math.abs(t.clientY - y0);
    if (dy > Math.abs(dx) && dy > 12) { on = false; tip.style.transform = ''; return; }
    tip.style.transition = 'none'; tip.style.transform = `translate(${Math.min(Math.max(dx, 0), 110) - 56}px, -50%)`; tip.classList.toggle('ready', dx > 80);
  }, { passive: true });
  const end = () => { if (on && dx > 80) goBack(); on = false; tip.style.transition = ''; tip.style.transform = ''; tip.classList.remove('ready'); };
  addEventListener('touchend', end, { passive: true }); addEventListener('touchcancel', () => { on = false; tip.style.transform = ''; }, { passive: true });
}

function shell() {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', 'aria-label': 'Navegação principal' });
  const head = h('header', { class: 'top' },
    h('button', { type: 'button', class: 'icon-btn top-menu', 'aria-label': 'Menu: todas as atividades', 'aria-haspopup': 'dialog', onclick: openMenu }, icon('menu', 26)),
    h('button', { type: 'button', class: 'icon-btn top-back', 'aria-label': 'Voltar', onclick: goBack }, icon('back', 26)),
    h('a', { href: '#/inicio', class: 'brand', 'aria-label': 'Beaterista — início' }, h('img', { src: 'assets/icons/tambor-96.png', alt: '', width: 40, height: 40 })),
    h('div', { class: 'ws', role: 'tablist', 'aria-label': 'Espaço de trabalho' }),
    h('button', { type: 'button', class: 'icon-btn top-add', 'aria-label': 'Captura rápida: nota, tarefa ou link', onclick: openCapture }, icon('plus', 24)),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Personalizar: tema e organização do início', onclick: openPersonalize }, icon('palette', 22)),
    h('a', { href: '#/ajustes', class: 'icon-btn gear', 'aria-label': 'Ajustes' }, icon('gear', 22)));
  app.replaceChildren(h('div', { class: 'topwrap' }, head, statusBar()), view, nav);

  function drawChrome(r) {
    const ws = head.querySelector('.ws');
    const inB = r.name === 'beaterista';
    const home = r.name === 'inicio';
    head.querySelector('.top-back').hidden = home; head.querySelector('.brand').hidden = !home; // fora do início, o logo vira "voltar"
    ws.replaceChildren(
      h('a', { href: '#/inicio', role: 'tab', 'aria-selected': String(!inB), class: !inB ? 'on' : '' }, 'Bea'),
      h('a', { href: '#/beaterista', role: 'tab', 'aria-selected': String(inB), class: inB ? 'on' : '' }, 'Beaterista'));
    nav.replaceChildren(...NAV.map((n) => n
      ? h('a', { href: n[0], class: `nav-item${('#/' + r.name) === n[0] ? ' on' : ''}`, 'aria-current': ('#/' + r.name) === n[0] ? 'page' : null }, icon(n[1], 24), h('span', {}, n[2]))
      : h('button', { class: 'fab', type: 'button', 'aria-label': 'Captura rápida: nota, tarefa ou link', onclick: openCapture }, icon('plus', 30))));
  }

  function go() {
    cleanup && cleanup(); cleanup = null;
    view.replaceChildren();
    const r0 = route(); view.dataset.page = r0.name; view.dataset.sub = r0.arg || ''; // cada tela ganha o seu desenho
    const r = route();
    const here = location.hash || '#/inicio';
    if (trail.length > 1 && trail[trail.length - 2] === here) trail.pop(); else if (trail[trail.length - 1] !== here) trail.push(here);
    drawChrome(r);
    let c;
    switch (r.name) {
      case 'inicio': c = home.mount(view); break;
      case 'checklist': c = tasks.mount(view); break;
      case 'notas': c = notes.mount(view); break;
      case 'favoritos': c = favs.mount(view); break;
      case 'mural': c = mural.mount(view); break;
      case 'estudos': c = library.mount(view, r.parts); break;
      case 'metronomo': c = metronome.mount(view); break;
      case 'acentuacao': c = accent.mount(view); break;
      case 'ajustes': c = settings.mount(view, { onSignedOut: showLogin }); break;
      case 'beaterista': c = studentsView.mount(view, r.parts); break;
      case 'foco': c = focus.mount(view); break;
      case 'ouvido': c = ouvido.mount(view); break;
      case 'beatlab': c = beatlab.mount(view, r.parts); break;
      case 'kit': c = kit.mount(view, r.parts); break;
      case 'tempo': c = tempo.mount(view, r.parts); break;
      case 'feed': c = r.arg === 'colagens' ? collages.mount(view) : feed.mount(view); break;
      case 'em-breve': mountSoon(view, r.arg); break;
      default: view.append(banner('Ops'), h('p', { class: 'pad-x' }, 'Essa página não existe.'), h('a', { class: 'btn primary wide', href: '#/inicio' }, 'Voltar ao início'));
    }
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
  }
  removeEventListener('hashchange', shell.go);
  shell.go = go;
  addEventListener('hashchange', go);
  if (!shell.swipe) { shell.swipe = true; swipeBack(); }
  go();
}

function showLogin() {
  clearInterval(ticker);
  app.replaceChildren();
  mountLogin(app, () => { startApp(); });
}

function startApp() {
  shell();
  if (!started) { started = true; sync.start(); photos.start(); startScroller(); } else { sync.schedule(100); photos.schedule(300); }
}

async function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  try {
    await store.init();
    initTheme();
    await auth.loadSession();
  } catch (e) {
    app.replaceChildren(h('main', { class: 'login' }, h('div', { class: 'login-card' }, h('h1', {}, 'Armazenamento indisponível'),
      h('p', {}, 'Este navegador bloqueou o armazenamento local (modo privado?). Abra o app no Safari normal ou instalado na Tela de Início.'))));
    return;
  }
  requestPersistence();
  auth.onAuth((s) => { if (!s && started) { started = false; showLogin(); } });
  if (auth.getSession()) startApp(); else showLogin();
}

boot();
