import './polyfills.js'; // iPhones antigos: primeiro import
import { h, icon, clock, longDate, shortDate } from './util.js';
import { db, requestPersistence } from './db.js';
import * as store from './store.js';
import * as auth from './auth.js';
import * as sync from './sync.js';
import { banner, toast, closeSheets } from './ui.js';
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
import { deckView } from './views/tocar-deck.js';
import * as accent from './views/accent.js';
import * as studentsView from './views/students.js';
import * as focus from './views/focus.js';
import * as feed from './views/feed.js';
import * as collages from './views/collages.js';
import * as beatlab from './views/beatlab.js';
import * as ouvido from './views/ouvido.js';
import * as kit from './views/kit.js';
import * as tempo from './views/tempo.js';
import * as setlist from './views/setlist.js';
import * as partitura from './views/partitura.js';
import * as ideias from './views/ideias.js';
import * as arquivos from './views/arquivos.js';
import * as bateristas from './views/bateristas.js';
import * as treinos from './views/treinos.js';
import * as toque from './views/toque.js';
import * as piano from './views/piano.js';
import * as violao from './views/violao.js';
import * as xilofone from './views/xilofone.js';
import * as roleta from './views/roleta.js';
import './ipad-fit.js';
import * as anotacoes from './views/anotacoes.js';
import * as hub from './views/hub.js';
import * as rudimentos from './views/rudimentos.js';
import * as plano from './views/plano.js';
import * as ambiente from './views/ambiente.js';
import * as planos from './views/planos.js';
import * as kids from './views/kids.js';
import * as ata from './views/ata.js';
import * as acessos from './views/acessos.js';
import * as albumAlunos from './views/album-alunos.js';
import * as cartinha from './views/cartinha.js';
import * as codigos from './views/codigos.js';
import * as jogosAlunos from './views/jogos-alunos.js';
import { remember } from './recent.js';
import * as repertorio from './views/repertorio.js';
import * as lembretes from './views/lembretes.js';
import * as ferramentas from './views/ferramentas.js';
import * as dicionario from './views/dicionario.js';
import * as jogosRitmo from './views/jogos-ritmo.js';
import * as dicas from './views/dicas.js';
import * as jogos from './views/jogos.js';
import * as figurinhas from './views/figurinhas.js';
import * as notify from './notify.js';
import { silence } from './audio.js';
import { soundButton } from './sound-btn.js';
import { openMenu } from './views/menu.js';
import { getSpace, setSpace } from './space.js';
import { startScroller } from './scroller.js';
import { startPaul } from './paul-talk.js';
import * as lixeira from './views/lixeira.js';
import * as paulta from './paulta/view.js';
import { openSearch } from './search.js';
import { NAV_DEFAULT, NAV_KEY, loadNav, openNavEditor } from './navbar.js';
import { handsOn, setHands, initHands, handsBar } from './hands.js';

const app = document.getElementById('app');
let cleanup = null;
let ticker = null;
let started = false;

const NAV = [...NAV_DEFAULT]; // as 4 abas de baixo (a Bea pode trocar: navbar.js)
const RITMO = ['beatlab', 'toque', 'partitura', 'groovebox'];
/** A aba de baixo "acesa" pra tela atual: Criar ritmos vale também pro Beat Lab, Bateria de Toque etc. */
const navOn = (href, r) => {
  if (href === '#/hub/ritmo') return (r.name === 'hub' && r.arg === 'ritmo') || RITMO.includes(r.name);
  const hs = location.hash || '#/inicio';
  return `#/${r.name}` === href || hs === href || hs.startsWith(`${href}/`);
};

function route() {
  const hash = location.hash || '#/inicio';
  const [, a, b, ...rest] = hash.split('/');
  return { name: a || 'inicio', arg: b, parts: [b, ...rest].filter(Boolean).map(decodeURIComponent) };
}

function handsToggle() {
  const b = h('button', { type: 'button', class: 'icon-btn top-hands', onclick: () => { setHands(!handsOn()); toast(handsOn() ? 'Modo mão ocupada ligado ✋' : 'Modo mão ocupada desligado'); } }, icon('hand', 22));
  const paint = () => { b.setAttribute('aria-pressed', String(handsOn())); b.setAttribute('aria-label', handsOn() ? 'Desligar modo mão ocupada' : 'Ligar modo mão ocupada (botões grandes)'); };
  paint(); document.addEventListener('hands-changed', paint);
  return b;
}

function statusBar() {
  const time = h('span', { class: 'sb-time' });
  const net = h('span', { class: 'sb-net' });
  const syn = h('a', { class: 'sb-sync', href: '#/ajustes' });
  const tick = () => { time.textContent = shortDate(); };
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
  clearInterval(ticker); ticker = setInterval(tick, 60000);
  sync.onSync(draw); store.subscribe(draw);
  addEventListener('online', draw); addEventListener('offline', draw);
  const tools = h('span', { class: 'sb-tools' },
    h('button', { type: 'button', class: 'icon-btn top-search', 'aria-label': 'Buscar no app todo', title: 'Buscar', onclick: openSearch }, icon('search', 20)),
    h('button', { type: 'button', class: 'icon-btn top-undo', 'aria-label': 'Desfazer a última mudança', title: 'Desfazer', disabled: true, onclick: doUndo }, icon('undo', 20)),
    h('button', { type: 'button', class: 'icon-btn top-redo', 'aria-label': 'Refazer', title: 'Refazer', hidden: true, onclick: doRedo }, icon('redo', 20)));
  return h('div', { class: 'statusbar', role: 'status', 'aria-label': 'Data, hora e estado de conexão' }, h('div', { class: 'sb-row1' }, time, tools), h('span', { class: 'sb-right' }, net, syn, handsToggle(), soundButton()));
}

/* ---------- voltar: botão no topo + arrastar da borda esquerda ---------- */
const trail = []; // telas visitadas nesta sessão (para saber se dá pra voltar pelo histórico)
try { const t = JSON.parse(sessionStorage.getItem('bt-trail') || '[]'); if (Array.isArray(t)) trail.push(...t.slice(-30)); } catch { /* sem armazenamento: segue só em memória */ }
const saveTrail = () => { try { sessionStorage.setItem('bt-trail', JSON.stringify(trail.slice(-30))); } catch { /* ok */ } };
const scrolls = new Map(); // posição da rolagem de cada tela, pra voltar exatamente onde estava
let cameBack = false;
addEventListener('scroll', () => { scrolls.set(location.hash || '#/inicio', window.scrollY); }, { passive: true });
function parentOf(r) { return r.parts.length ? `#/${r.name}` : '#/inicio'; }
/** Uma aba de baixo "pura" (Início, Alunos, Beat Lab, Estudos), sem tela aberta dentro dela. */
const isTabRoot = (hash) => { const r = hash.replace(/^#\/?/, '').split('/').filter(Boolean); return !r.length || NAV.some((n) => n[0] === `#/${r.join('/')}`); };
function goBack() {
  // numa aba de baixo: voltar leva pro início (e não pra uma tela que você nem estava vendo)
  if (isTabRoot(location.hash || '#/inicio')) { if ((location.hash || '#/inicio') !== '#/inicio') location.hash = '#/inicio'; return; }
  if (trail.length > 1) {
    const before = location.hash; history.back();
    // se o navegador não tinha histórico (app reaberto), vai direto pra tela anterior da trilha
    setTimeout(() => { if (location.hash === before && trail.length > 1) location.hash = trail[trail.length - 2]; }, 350);
  } else location.hash = parentOf(route());
}
/* ---------- início: arrastar pro lado abre o menu ☰ ---------- */
let lastTab = 0; // última aba de baixo visitada (pra saber qual é a próxima quando se está numa tela de fora)
/** Jogando (Palco, Beatstar, Setinhas…): nenhum arrastar pode trocar de tela. */
const playing = (el) => document.body.classList.contains('rz-lock') || !!document.querySelector('#jogos.bmr-playing, .bmr-playing') || !!(el && el.closest && el.closest('[data-noswipe], .bmr-stage canvas, #rz-cv'));
const BOTTOM_ZONE = 96; // faixa de baixo da tela (onde fica a barra de abas): arrastar ali troca de aba
const inBottom = (t) => t.clientY >= innerHeight - BOTTOM_ZONE;
const hScrollAt = (el) => { for (let n = el; n && n.id !== 'view'; n = n.parentElement) { const o = getComputedStyle(n).overflowX; if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth + 4) return true; if (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName)) return true; } return false; };
const noGesture = (e) => document.querySelector('.drawer, #overlay .sheet') || document.documentElement.classList.contains('kb-open') || playing(e.target) || (e.target.closest && e.target.closest('input, textarea, select, audio, video, canvas, [contenteditable="true"]'));
/** Vai pra aba de baixo seguinte (d=1) ou anterior (d=-1). */
function stepTab(d) {
  const at = NAV.findIndex((n) => n && navOn(n[0], route())); const i = at >= 0 ? at : lastTab;
  const j = (i + d + NAV.length) % NAV.length; if (NAV[j]) location.hash = NAV[j][0];
}
const nextTabName = () => { const at = NAV.findIndex((n) => n && navOn(n[0], route())); const i = at >= 0 ? at : lastTab; return (NAV[(i + 1) % NAV.length] || [])[2] || ''; };
/* arrastar na faixa de baixo: troca de aba (direita→esquerda = próxima, esquerda→direita = anterior); no início, fora dessa faixa, abre o menu ☰ */
function swipeMenu() {
  let x0 = 0, y0 = 0, t0 = 0, mode = '';
  addEventListener('touchstart', (e) => {
    mode = ''; if (e.touches.length !== 1 || noGesture(e)) return;
    const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
    if (inBottom(t)) mode = 'tab';
    else if (route().name === 'inicio' && !hScrollAt(e.target)) mode = 'menu';
  }, { passive: true });
  addEventListener('touchend', (e) => {
    if (!mode) return; const m = mode; mode = ''; const t = e.changedTouches[0]; const dx = t.clientX - x0, dy = t.clientY - y0;
    if (!(Math.abs(dx) > 90 && Math.abs(dy) < 60 && Math.abs(dx) > 2 * Math.abs(dy) && Date.now() - t0 < 900)) return;
    if (m === 'menu') { if (dx > 0) openMenu(); return; }
    stepTab(dx < 0 ? 1 : -1);
  }, { passive: true });
  addEventListener('touchcancel', () => { mode = ''; }, { passive: true });
}
/* arrastar da esquerda pra direita no meio da tela = voltar (em aba de baixo, volta pra última atividade) */
function swipeBack() {
  const tip = h('div', { class: 'swipe-back', 'aria-hidden': 'true' }, icon('back', 22));
  document.body.append(tip);
  let x0 = 0, y0 = 0, dx = 0, on = false;
  const blocked = (e) => route().name === 'inicio' || e.touches[0].clientX > 28 || noGesture(e) || inBottom(e.touches[0]) || hScrollAt(e.target);
  addEventListener('touchstart', (e) => { const t = e.touches[0]; on = e.touches.length === 1 && !blocked(e); x0 = t.clientX; y0 = t.clientY; dx = 0; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (!on) return; const t = e.touches[0]; dx = t.clientX - x0; const dy = Math.abs(t.clientY - y0);
    if (dy > Math.abs(dx) && dy > 12) { on = false; tip.style.transform = ''; return; }
    if (dx < 12) return;
    tip.style.transition = 'none'; tip.style.transform = `translate(${Math.min(Math.max(dx, 0), 110) - 56}px, -50%)`; tip.classList.toggle('ready', dx > 90);
  }, { passive: true });
  const end = () => { if (on && dx > 90 && !isTabRoot(location.hash || '#/inicio')) goBack(); on = false; tip.style.transition = ''; tip.style.transform = ''; tip.classList.remove('ready'); };
  addEventListener('touchend', end, { passive: true }); addEventListener('touchcancel', () => { on = false; tip.style.transform = ''; }, { passive: true });
}

/* teclado aberto: esconde a barra de baixo e os botões flutuantes (o iPhone os empurra pra cima do teclado e a tela pula) */
function keyboardGuard() {
  const typing = (el) => el && el.matches && el.matches('textarea, select, [contenteditable="true"], input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]):not([type=file])');
  const root = document.documentElement; let t = 0;
  document.addEventListener('focusin', (e) => { clearTimeout(t); if (typing(e.target)) root.classList.add('kb-open'); });
  document.addEventListener('focusout', () => { clearTimeout(t); t = setTimeout(() => { if (!typing(document.activeElement)) root.classList.remove('kb-open'); }, 450); });
  // o iPhone às vezes não avisa que o teclado fechou e a barra de baixo ficava escondida: destrava ao tocar fora, ao trocar de tela e quando o teclado some
  const unstick = () => { if (!typing(document.activeElement)) root.classList.remove('kb-open'); };
  document.addEventListener('pointerdown', (e) => { if (!typing(e.target)) setTimeout(unstick, 50); }, { passive: true });
  addEventListener('hashchange', unstick); document.addEventListener('visibilitychange', unstick);
  if (window.visualViewport) visualViewport.addEventListener('resize', () => { if (visualViewport.height > innerHeight * 0.85) unstick(); });
}

/* ---------- desfazer / refazer: vale pra tarefas, notas, partituras, ideias, alunos... (tudo que salva no app) ---------- */
async function doUndo() { if (await store.undo()) toast('Desfeito ↶', { action: 'refazer', onAction: doRedo }); else toast('Nada pra desfazer.'); }
async function doRedo() { if (await store.redo()) toast('Refeito ↷'); }
function undoUi() {
  const sync = () => {
    const u = document.querySelector('.top-undo'), r = document.querySelector('.top-redo');
    document.querySelectorAll('.hands-undo').forEach((x) => { x.disabled = !store.canUndo(); });
    if (u) u.disabled = !store.canUndo(); if (r) r.hidden = !store.canRedo();
  };
  store.subscribe((i) => { if (i && i.history) sync(); });
  document.addEventListener('keydown', (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || noGesture({ target: e.target })) return;
    e.preventDefault(); (e.shiftKey ? doRedo : doUndo)();
  });
  addEventListener('hashchange', () => setTimeout(sync, 0)); sync();
}

function shell() {
  const view = h('main', { id: 'view', tabindex: '-1' });
  const nav = h('nav', { class: 'bottom-nav', 'aria-label': 'Navegação principal' });
  const head = h('header', { class: 'top' },
    h('button', { type: 'button', class: 'icon-btn top-menu', 'aria-label': 'Menu: todas as atividades', 'aria-haspopup': 'dialog', onclick: openMenu }, icon('menu', 26)),
    h('button', { type: 'button', class: 'icon-btn top-back', 'aria-label': 'Voltar', onclick: goBack }, icon('back', 26)),
    h('a', { href: '#/inicio', class: 'brand', 'aria-label': 'Beaterista — início' }, h('img', { src: 'assets/icons/tambor-menu.png', alt: '', width: 40, height: 40 })),
    h('div', { class: 'ws', role: 'tablist', 'aria-label': 'Espaço de trabalho' }),
    h('button', { type: 'button', class: 'icon-btn top-add', 'aria-label': 'Captura rápida: nota, tarefa ou link', onclick: openCapture }, icon('plus', 24)),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Personalizar: tema e organização do início', onclick: openPersonalize }, icon('palette', 22)),
    h('a', { href: '#/ajustes', class: 'icon-btn gear', 'aria-label': 'Ajustes' }, icon('gear', 22)));
  const hb = handsBar({ back: goBack, undo: doUndo, next: () => stepTab(1), nextName: nextTabName });
  app.replaceChildren(h('div', { class: 'topwrap' }, head, statusBar()), view, nav, hb);
  // segurar um atalho da barra de baixo abre o editor
  { let t = 0, held = false;
    nav.addEventListener('pointerdown', (e) => { if (!e.target.closest('.nav-item')) return; held = false; clearTimeout(t); t = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(15); openNavEditor(); }, 650); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave', 'pointermove']) nav.addEventListener(ev, (e) => { if (ev === 'pointermove' && Math.abs(e.movementX) + Math.abs(e.movementY) < 3) return; clearTimeout(t); });
    nav.addEventListener('click', (e) => { if (held) { e.preventDefault(); e.stopPropagation(); held = false; } }, true);
    nav.addEventListener('contextmenu', (e) => { if (e.target.closest('.nav-item')) e.preventDefault(); }); }

  function drawChrome(r) {
    hb.paint();
    const ws = head.querySelector('.ws');
    const home = r.name === 'inicio';
    // o espaço só vira "Beaterista" (azul) pela aba do topo; Alunos aberto pelo menu da Bea continua vinho
    if (home) setSpace('bea'); else document.documentElement.dataset.space = getSpace();
    const inB = getSpace() === 'beaterista';
    head.querySelector('.top-back').hidden = home; head.querySelector('.brand').hidden = !home; // fora do início, o logo vira "voltar"
    ws.replaceChildren(
      h('a', { href: '#/inicio', role: 'tab', 'aria-selected': String(!inB), class: !inB ? 'on' : '' }, 'Bea'),
      h('a', { href: '#/beaterista', role: 'tab', 'aria-selected': String(inB), class: inB ? 'on' : '', onclick: () => setSpace('beaterista') }, 'Beaterista'));
    nav.dataset.n = NAV.length; nav.style.gridTemplateColumns = `repeat(${NAV.length}, 1fr)`; // 4 ou 5 abas na mesma linha
    nav.replaceChildren(...NAV.map((n) => n
      ? h('a', { href: n[0], class: `nav-item${navOn(n[0], r) ? ' on' : ''}`, 'aria-current': navOn(n[0], r) ? 'page' : null }, icon(n[1], 24), h('span', {}, n[2]))
      : h('button', { class: 'fab', type: 'button', 'aria-label': 'Captura rápida: nota, tarefa ou link', onclick: openCapture }, icon('plus', 30))));
  }

  function go() {
    cleanup && cleanup(); cleanup = null;
    closeSheets(); // folha de uma tela antiga não fica por cima da nova
    silence(); // trocou de tela: nada da tela anterior continua tocando (o ambiente e o YouTube do mini-player seguem)
    view.replaceChildren();
    const r0 = route(); view.dataset.page = r0.name; view.dataset.sub = r0.arg || ''; // cada tela ganha o seu desenho
    const r = route();
    const here = location.hash || '#/inicio';
    cameBack = false;
    if (trail.length > 1 && trail[trail.length - 2] === here) { trail.pop(); cameBack = true; } else if (trail[trail.length - 1] !== here) trail.push(here);
    saveTrail();
    { const ti = NAV.findIndex((n) => n && navOn(n[0], r)); if (ti >= 0) lastTab = ti; }
    drawChrome(r);
    remember(here);
    let c;
    switch (r.name) {
      case 'inicio': c = home.mount(view); break;
      case 'checklist': c = tasks.mount(view); break;
      case 'notas': c = notes.mount(view); break;
      case 'favoritos': c = favs.mount(view); break;
      case 'mural': c = mural.mount(view); break;
      case 'estudos': c = library.mount(view, r.parts); break;
      case 'metronomo': c = metronome.mount(view); break;
      case 'tocar': view.append(banner('Tocar', 'bateria, cordas, teclas e percussão'), h('div', { class: 'pad-x' }, deckView())); break;
      case 'acentuacao': c = accent.mount(view); break;
      case 'ajustes': c = settings.mount(view, { onSignedOut: showLogin }); break;
      case 'beaterista': c = studentsView.mount(view, r.parts); break;
      case 'foco': c = focus.mount(view); break;
      case 'ouvido': c = ouvido.mount(view); break;
      case 'beatlab': c = beatlab.mount(view, r.parts); break;
      case 'kit': c = kit.mount(view, r.parts); break;
      case 'tempo': c = tempo.mount(view, r.parts); break;
      case 'setlist': c = setlist.mount(view, r.parts); break;
      case 'partitura': c = partitura.mount(view, r.parts); break;
      case 'ideias': c = ideias.mount(view); break;
      case 'arquivos': c = arquivos.mount(view, r.parts); break;
      case 'bateristas': c = bateristas.mount(view, r.parts); break;
      case 'treinos': c = treinos.mount(view, r.parts); break;
      case 'toque': c = toque.mount(view); break;
      case 'piano': c = piano.mount(view); break;
      case 'violao': c = violao.mount(view); break;
      case 'xilofone': c = xilofone.mount(view); break;
      case 'roleta': c = roleta.mount(view); break;
      case 'anotacoes': c = anotacoes.mount(view); break;
      case 'hub': c = hub.mount(view, r.parts); break;
      case 'rudimentos': c = rudimentos.mount(view); break;
      case 'plano': c = plano.mount(view); break;
      case 'ambiente': c = ambiente.mount(view); break;
      case 'planos': c = planos.mount(view, r.parts); break;
      case 'ata': c = ata.mount(view, r.parts); break;
      case 'acessos': c = acessos.mount(view); break;
      case 'album-alunos': c = albumAlunos.mount(view); break;
      case 'cartinha': c = cartinha.mount(view); break;
      case 'codigos': c = codigos.mount(view); break;
      case 'jogos-alunos': c = jogosAlunos.mount(view); break;
      case 'kids': c = kids.mount(view, r.parts); break;
      case 'repertorio': c = repertorio.mount(view); break;
      case 'lembretes': c = lembretes.mount(view); break;
      case 'ferramentas': c = ferramentas.mount(view, r.parts); break;
      case 'dicionario': c = dicionario.mount(view, r.parts); break;
      case 'ritmo': c = jogosRitmo.mount(view, { parts: r.parts }); break;
      case 'dicas': c = dicas.mount(view, r.parts); break;
      case 'jogos': c = jogos.mount(view, r.parts); break;
      case 'figurinhas': c = figurinhas.mount(view, r.parts); break;
      case 'feed': c = r.arg === 'colagens' ? collages.mount(view) : feed.mount(view); break;
      case 'paulta': c = paulta.mount(view, r.parts); break;
      case 'lixeira': c = lixeira.mount(view); break;
      case 'em-breve': mountSoon(view, r.arg); break;
      default: view.append(banner('Ops'), h('p', { class: 'pad-x' }, 'Essa página não existe.'), h('a', { class: 'btn primary wide', href: '#/inicio' }, 'Voltar ao início'));
    }
    cleanup = typeof c === 'function' ? c : null;
    window.scrollTo(0, 0);
    // voltou pra uma tela que já tinha visto: devolve a rolagem de onde parou (o conteúdo pode chegar um pouco depois)
    const y = cameBack ? scrolls.get(here) : 0;
    if (y > 0) [60, 250, 700].forEach((ms) => setTimeout(() => { if ((location.hash || '#/inicio') === here && Math.abs(window.scrollY) < 5) window.scrollTo(0, y); }, ms));
  }
  // jogos e treinos calam quando o app vai pro fundo (metrônomo, Beat Lab e ambiente podem seguir tocando).
  // Só as telas que seguram o MICROFONE são refeitas (o iOS derruba a captura de qualquer jeito); as outras só calam,
  // pra bloquear a tela ou atender uma chamada não zerar a fase em que a pessoa estava.
  if (!shell.hideHooked) {
    shell.hideHooked = true;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return; const r = route(); const n = r.name;
      const mic = n === 'ouvido' || n === 'tempo' || (n === 'ferramentas' && r.arg === 'bpm');
      if (mic) { silence(); shell.go && shell.go(); }
      else if (['treinos', 'kids', 'ferramentas'].includes(n)) silence();
    });
  }
  shell.chrome = () => drawChrome(route());
  removeEventListener('hashchange', shell.go);
  shell.go = go;
  addEventListener('hashchange', go);
  if (!shell.swipe) { shell.swipe = true; swipeBack(); swipeMenu(); keyboardGuard(); }
  go();
}

function showLogin() {
  clearInterval(ticker);
  app.replaceChildren();
  mountLogin(app, () => { startApp(); });
}

let navHooked = false;
function startApp() {
  loadNav(NAV); initHands(); store.purgeTrash(null, store.TRASH_DAYS).catch(() => {});
  if (!navHooked) { navHooked = true; store.subscribe((i) => { if (i && (i.remote || i.imported || i.id === NAV_KEY)) { loadNav(NAV); shell.chrome && shell.chrome(); } }); document.addEventListener('keydown', (e) => { if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') && !document.querySelector('#overlay .sheet')) { e.preventDefault(); openSearch(); } }); }
  shell(); undoUi();
  if (!started) { started = true; sync.start(); photos.start(); startScroller(); notify.start(); startPaul({ allowed: () => /^#\/(ritmo|jogos|kids)/.test(location.hash) }); } else { sync.schedule(100); photos.schedule(300); }
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
