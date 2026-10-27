// Menu ☰: todas as atividades num lugar só (abre da esquerda). Mesmo catálogo dos atalhos + o Meu Kit.
import { h, icon, reducedMotion } from '../util.js';
import { TABS } from './kit.js';

// Abas do menu: cada aba com grupinhos curtos (antes era uma lista só, comprida demais).
const TABS_MENU = [
  ['tocar', 'tocar', [
    ['', [['#/beatlab', 'kit', 'Beat Lab'], ['#/toque', 'kit', 'Bateria de Toque'], ['#/piano', 'note', 'Piano'], ['#/partitura', 'staff', 'Montar Partitura'], ['#/metronomo', 'metro', 'Metrônomo'], ['#/repertorio', 'note', 'Repertório']]],
    ['ferramentas', [['#/ferramentas', 'metro', 'Todas as ferramentas'], ['#/ferramentas/groovebox', 'kit', 'Groovebox'], ['#/ferramentas/loop', 'note', 'Play-along em loop'], ['#/ferramentas/mapa', 'staff', 'Mapa da música'], ['#/ferramentas/tap', 'metro', 'Tap tempo']]],
  ]],
  ['treinar', 'treinar', [
    ['técnica', [['#/plano', 'study', 'Plano de Estudo'], ['#/rudimentos', 'drummer', 'Rudimentos'], ['#/acentuacao', 'staff', 'Acentuação 4×4'], ['#/ferramentas/desafio', 'star', 'Desafio da semana']]],
    ['leitura e ouvido', [['#/treinos', 'study', 'Leitura e Escuta'], ['#/treinos/montar', 'staff', 'Ditado de montar'], ['#/ouvido', 'mic', 'Estúdio de Ouvido'], ['#/ferramentas/um', 'timer', 'Achar o 1'], ['#/ferramentas/forma', 'staff', 'Contar compassos']]],
    ['jogos', [['#/ritmo', 'kit', 'Jogos de ritmo'], ['#/kids', 'kit', 'Beaterista Kids']]],
    ['tempo', [['#/tempo', 'timer', 'Juiz de Tempo'], ['#/tempo/transcritor', 'staff', 'Transcritor de Ritmo'], ['#/tempo/raiox', 'timer', 'Raio-x do Groove']]],
  ]],
  ['estudar', 'estudar', [
    ['conceitos musicais (Mente Musical)', [['#/dicionario', 'book', 'Dicionário da bateria'], ['#/estudos/cat/ritmo', 'study', 'Ritmo & groove'], ['#/estudos/cat/pratica', 'study', 'Estudo & prática'], ['#/estudos/cat/escuta', 'study', 'Ouvido & teoria da escuta'], ['#/estudos/cat/prazer', 'study', 'Prazer & emoção'], ['#/estudos/cat/palco', 'study', 'Palco & ensino']]],
    ['', [['#/estudos', 'study', 'Meus Estudos'], ['#/estudos/club', 'note', 'The Listening Club'], ['#/bateristas', 'drummer', 'Bateristas & Links'], ['#/mural', 'photo', 'Mural de Artistas'], ['cartas/', 'staff', 'Cartas de Groove']]],
    ['foco', [['#/foco', 'timer', 'Cronômetro de Foco'], ['#/ambiente', 'mic', 'Estúdio de Ambiente']]],
  ]],
  ['aulas', 'aulas', [
    ['', [['#/beaterista', 'drummer', 'Alunos'], ['#/planos', 'study', 'Planos dos Alunos'], ['#/kids', 'kit', 'Beaterista Kids'], ['#/ferramentas/leitura', 'staff', 'Folhas de leitura'], ['#/ferramentas/roleta', 'star', 'Roleta da aula'], ['#/setlist', 'note', 'Setlist']]],
  ]],
  ['organizar', 'organizar', [
    ['', [['#/inicio', 'home', 'Início'], ['#/lembretes', 'note', 'Lembretes'], ['#/checklist', 'check', 'Checklist'], ['#/notas', 'note', 'Não Esquecer'], ['#/ideias', 'bulb', 'Caixa de Ideias'], ['#/arquivos', 'folder', 'Meus Arquivos'], ['#/favoritos', 'star', 'Favoritos']]],
    ['conteúdo', [['#/feed', 'mural', 'Feed Beaterista'], ['#/feed/colagens', 'photo', 'Colagens']]],
  ]],
  ['kit', 'meu kit', [
    ['', [...TABS.map(([k, t, ic]) => [`#/kit/${k}`, ic, k === 'fotos' ? 'Fotos profissionais' : t]), ['#/ajustes', 'gear', 'Ajustes e backup']]],
  ]],
];
const ALL = TABS_MENU.flatMap(([id, , groups]) => groups.flatMap(([g, items]) => items.map((it) => [id, ...it, g])));
const LAST = 'bt-menu-tab';
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function openMenu() {
  if (document.querySelector('.drawer')) return;
  const here = location.hash || '#/inicio';
  const back = h('div', { class: 'drawer-back' });
  const close = () => {
    document.removeEventListener('keydown', onKey);
    back.classList.add('out'); setTimeout(() => back.remove(), reducedMotion() ? 0 : 200);
    btn && btn.focus && btn.focus();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const btn = document.activeElement;
  // aba inicial: a da tela atual; senão a última aberta
  const mine = ALL.filter((x) => x[1] === here).map((x) => x[0])[0] || ALL.filter((x) => x[1] !== '#/inicio' && here.startsWith(x[1])).map((x) => x[0])[0];
  let tab = mine || (() => { try { return localStorage.getItem(LAST); } catch { return null; } })() || 'tocar';
  if (!TABS_MENU.some((t) => t[0] === tab)) tab = 'tocar';
  let q = '';
  const item = ([href, ic, label]) => h('a', { href, class: `drawer-item${here === href ? ' on' : ''}`, 'aria-current': here === href ? 'page' : null, onclick: close }, icon(ic, 22), h('span', {}, label));
  const tabs = h('div', { class: 'drawer-tabs chips lib-tabs', role: 'tablist', 'aria-label': 'Seções do menu' });
  const list = h('div', { class: 'drawer-list' });
  const search = h('input', { type: 'search', placeholder: 'buscar no menu', 'aria-label': 'Buscar no menu' });
  search.addEventListener('input', () => { q = search.value; draw(); });
  const draw = () => {
    tabs.hidden = !!q.trim();
    tabs.replaceChildren(...TABS_MENU.map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === id), class: `lib-tab${tab === id ? ' on' : ''}`, onclick: () => { tab = id; try { localStorage.setItem(LAST, id); } catch { /* sem armazenamento */ } draw(); } }, label)));
    if (q.trim()) {
      const t = norm(q.trim()); const seen = new Set();
      const hits = ALL.filter((x) => (norm(x[3]).includes(t) || norm(x[4] || '').includes(t)) && !seen.has(x[1]) && seen.add(x[1]));
      list.replaceChildren(h('section', { class: 'drawer-sec' }, ...(hits.length ? hits.map((x) => item(x.slice(1))) : [h('p', { class: 'muted drawer-sub' }, 'nada com esse nome')])));
      return;
    }
    const groups = TABS_MENU.find((x) => x[0] === tab)[2];
    list.replaceChildren(...groups.map(([title, items]) => h('section', { class: 'drawer-sec' }, title ? h('h2', { class: 'drawer-sub' }, title) : null, ...items.map(item))));
  };
  const panel = h('nav', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
    h('div', { class: 'drawer-head' }, h('img', { src: 'assets/icons/tambor-96.png', alt: '', width: 36, height: 36 }), h('strong', {}, 'Beaterista'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar menu', onclick: close }, icon('x', 22))),
    h('div', { class: 'drawer-search' }, search), tabs, list);
  draw();
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  // arrastar pra esquerda fecha
  let x0 = null;
  panel.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', (e) => { if (x0 != null && x0 - e.changedTouches[0].clientX > 60) close(); x0 = null; }, { passive: true });
  document.addEventListener('keydown', onKey);
  back.append(panel); document.getElementById('overlay').append(back);
  panel.querySelector('.drawer-item.on, .drawer-item').focus({ preventScroll: true });
}
