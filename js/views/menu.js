// Menu ☰: todas as atividades num lugar só (abre da esquerda). Mesmo catálogo dos atalhos + o Meu Kit.
import { recents } from '../recent.js';
import { h, icon, reducedMotion } from '../util.js';
import * as store from '../store.js';
import { TABS } from './kit.js';
import { HUBS } from './hub.js';

// Abas do menu: cada aba com grupinhos curtos. Ferramentas parecidas ficam juntas numa página só (Criar ritmos, Tempo, Anotar).
const TABS_MENU = [
  ['tocar', 'tocar', [
    ['', [['#/hub/ritmo', 'kit', 'Criar ritmos'], ['#/piano', 'note', 'Piano'], ['#/hub/tempo', 'timer', 'Tempo'], ['#/repertorio', 'note', 'Repertório']]],
    ['ferramentas', [['#/ferramentas', 'metro', 'Todas as ferramentas'], ['#/ferramentas/loop', 'note', 'Play-along em loop'], ['#/ferramentas/mapa', 'staff', 'Mapa da música']]],
  ]],
  ['treinar', 'treinar', [
    ['técnica', [['#/plano', 'study', 'Plano de Estudo'], ['#/rudimentos', 'drummer', 'Rudimentos'], ['#/acentuacao', 'staff', 'Acentuação 4×4'], ['#/ferramentas/desafio', 'star', 'Desafio da semana']]],
    ['leitura e ouvido', [['#/treinos', 'study', 'Leitura e Escuta'], ['#/treinos/montar', 'staff', 'Ditado de montar'], ['#/ouvido', 'mic', 'Estúdio de Ouvido'], ['#/ferramentas/um', 'timer', 'Achar o 1'], ['#/ferramentas/forma', 'staff', 'Contar compassos']]],
    ['jogos', [['#/ritmo', 'kit', 'Jogos de ritmo'], ['#/kids', 'kit', 'Beaterista Kids']]],
  ]],
  ['estudar', 'estudar', [
    ['conceitos', [['#/estudos', 'study', 'Conceitos'], ['#/dicionario', 'book', 'Dicionário da bateria'], ['#/estudos/cat/ritmo', 'study', 'Ritmo & groove'], ['#/estudos/cat/pratica', 'study', 'Estudo & prática'], ['#/estudos/cat/escuta', 'study', 'Ouvido & teoria da escuta'], ['#/estudos/cat/prazer', 'study', 'Prazer & emoção'], ['#/estudos/cat/palco', 'study', 'Palco & ensino']]],
    ['álbuns', [['#/estudos/club', 'note', 'Álbuns'], ['#/estudos/club/discos', 'note', 'Meus discos']]],
    ['artistas / bateristas', [['#/estudos/artistas', 'drummer', 'Artistas e bateristas'], ['#/bateristas', 'drummer', 'Bateristas & Links'], ['#/mural', 'photo', 'Mural de Artistas']]],
    ['', [['#/anotacoes', 'note', 'Minhas anotações'], ['cartas/', 'staff', 'Cartas de Groove']]],
    ['foco', [['#/foco', 'timer', 'Cronômetro de Foco'], ['#/ambiente', 'mic', 'Estúdio de Ambiente']]],
  ]],
  ['aulas', 'aulas', [
    ['', [['#/beaterista', 'drummer', 'Alunos'], ['#/planos', 'study', 'Planos dos Alunos'], ['#/kids', 'kit', 'Beaterista Kids'], ['#/ferramentas/leitura', 'staff', 'Folhas de leitura'], ['#/ferramentas/roleta', 'star', 'Roleta da aula'], ['#/setlist', 'note', 'Setlist']]],
  ]],
  ['organizar', 'organizar', [
    ['', [['#/inicio', 'home', 'Início'], ['#/hub/anotar', 'note', 'Anotar'], ['#/arquivos', 'folder', 'Meus Arquivos']]],
    ['conteúdo', [['#/feed', 'mural', 'Feed Beaterista'], ['#/feed/colagens', 'photo', 'Colagens']]],
  ]],
  ['kit', 'meu kit', [
    ['', [...TABS.map(([k, t, ic]) => [`#/kit/${k}`, ic, k === 'fotos' ? 'Fotos profissionais' : t]), ['#/ajustes', 'gear', 'Ajustes e backup']]],
  ]],
];
// ícones pequenos nas abas e nas pastinhas, pra reconhecer de relance
const TAB_ICON = { tocar: 'kit', treinar: 'timer', estudar: 'book', aulas: 'drummer', organizar: 'check', kit: 'id' };
const GROUP_ICON = { ferramentas: 'metro', 'técnica': 'staff', 'leitura e ouvido': 'mic', jogos: 'play', conceitos: 'book', 'álbuns': 'note', 'artistas / bateristas': 'drummer', foco: 'timer', 'conteúdo': 'mural' };
const LAST = 'bt-menu-tab';
const PREF = 'setting-menu'; // { hidden: [href], moved: { href: abaId }, order: [href] }
const prefs = () => ({ hidden: [], moved: {}, order: [], ...(store.get(PREF) ? store.get(PREF).data : {}) });
const savePrefs = (p) => store.upsert('setting', PREF, p);
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** O menu como a Bea deixou: itens movidos de aba, reordenados; os escondidos só aparecem ao personalizar. */
function effective(p) {
  const tabs = TABS_MENU.map(([id, label, groups]) => ({ id, label, groups: groups.map(([title, items]) => ({ title, items: [...items] })) }));
  const byId = new Map(tabs.map((t) => [t.id, t]));
  for (const t of tabs) for (const g of t.groups) g.items = g.items.filter((it) => {
    const to = p.moved[it[0]];
    if (!to || to === t.id || !byId.has(to)) return true;
    const dest = byId.get(to); let gg = dest.groups.find((x) => x.title === ''); if (!gg) { gg = { title: '', items: [] }; dest.groups.push(gg); }
    gg.items.push(it); return false;
  });
  const rank = (href) => { const i = p.order.indexOf(href); return i < 0 ? 1e6 : i; };
  for (const t of tabs) for (const g of t.groups) g.items = g.items.map((it, k) => [it, k]).sort((a, b) => rank(a[0][0]) - rank(b[0][0]) || a[1] - b[1]).map((x) => x[0]);
  return tabs;
}
/** Tudo o que dá pra achar na busca, inclusive as ferramentas dentro das páginas juntas. */
const searchable = (tabs) => [
  ...tabs.flatMap((t) => t.groups.flatMap((g) => g.items.map((it) => ({ tab: t.id, href: it[0], ic: it[1], label: it[2], group: g.title })))),
  ...Object.values(HUBS).flatMap((hub) => hub.items.map(([href, ic, label, desc]) => ({ tab: '', href, ic, label, group: hub.title, desc }))),
];

export function openMenu() {
  if (document.querySelector('.drawer')) return;
  const here = location.hash || '#/inicio';
  const back = h('div', { class: 'drawer-back' });
  let editing = false;
  let offStore = () => {};
  const close = () => {
    document.removeEventListener('keydown', onKey); offStore();
    back.classList.add('out'); setTimeout(() => back.remove(), reducedMotion() ? 0 : 200);
    btn && btn.focus && btn.focus();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const btn = document.activeElement;
  const first = effective(prefs());
  // aba inicial: a da tela atual; senão a última aberta
  const flat = first.flatMap((t) => t.groups.flatMap((g) => g.items.map((it) => [t.id, ...it])));
  const mine = flat.filter((x) => x[1] === here).map((x) => x[0])[0] || flat.filter((x) => x[1] !== '#/inicio' && here.startsWith(x[1])).map((x) => x[0])[0];
  let tab = mine || (() => { try { return localStorage.getItem(LAST); } catch { return null; } })() || 'tocar';
  if (!TABS_MENU.some((t) => t[0] === tab)) tab = 'tocar';
  let q = '';
  const item = ([href, ic, label]) => h('a', { href, class: `drawer-item${here === href ? ' on' : ''}`, 'aria-current': here === href ? 'page' : null, onclick: close }, icon(ic, 22), h('span', {}, label));
  const tabs = h('div', { class: 'drawer-tabs chips lib-tabs', role: 'tablist', 'aria-label': 'Seções do menu' });
  const list = h('div', { class: 'drawer-list' });
  const search = h('input', { type: 'search', placeholder: 'buscar no menu', 'aria-label': 'Buscar no menu' });
  search.addEventListener('input', () => { q = search.value; draw(); });
  const editBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Personalizar o menu', 'aria-pressed': 'false', onclick: () => { editing = !editing; editBtn.setAttribute('aria-pressed', String(editing)); editBtn.classList.toggle('on', editing); draw(); } }, icon('edit', 20));

  /** Linha do modo personalizar: subir, descer, esconder e mudar de aba. */
  const editRow = (t, g, it, i, p) => {
    const off = p.hidden.includes(it[0]);
    const swap = (d) => { const cur = g.items.map((x) => x[0]); const j = i + d; if (j < 0 || j >= cur.length) return; [cur[i], cur[j]] = [cur[j], cur[i]]; savePrefs({ order: [...cur, ...p.order.filter((x) => !cur.includes(x))] }); };
    const sel = h('select', { 'aria-label': `Aba de ${it[2]}` }, ...TABS_MENU.map(([id, label]) => h('option', { value: id, selected: id === t.id }, label)));
    sel.addEventListener('change', () => { const moved = { ...p.moved, [it[0]]: sel.value }; const orig = TABS_MENU.find((x) => x[2].some(([, items]) => items.some((y) => y[0] === it[0]))); if (orig && orig[0] === sel.value) delete moved[it[0]]; savePrefs({ moved }); });
    return h('div', { class: `drawer-edit${off ? ' off' : ''}` },
      h('span', { class: 'de-name' }, icon(it[1], 20), h('span', {}, it[2])),
      h('div', { class: 'de-act' },
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': `Subir ${it[2]}`, disabled: i === 0, onclick: () => swap(-1) }, icon('up', 18)),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': `Descer ${it[2]}`, disabled: i === g.items.length - 1, onclick: () => swap(1) }, icon('down', 18)),
        h('button', { type: 'button', class: `btn small${off ? '' : ' ghost'}`, 'aria-pressed': String(off), onclick: () => savePrefs({ hidden: off ? p.hidden.filter((x) => x !== it[0]) : [...p.hidden, it[0]] }) }, off ? 'mostrar' : 'esconder'),
        sel));
  };

  const draw = () => {
    const p = prefs(); const eff = effective(p);
    if (!eff.some((t) => t.id === tab)) tab = 'tocar';
    tabs.hidden = !!q.trim();
    tabs.replaceChildren(...eff.map((t) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === t.id), class: `lib-tab drawer-tab${tab === t.id ? ' on' : ''}`, onclick: () => { tab = t.id; try { localStorage.setItem(LAST, t.id); } catch { /* sem armazenamento */ } draw(); } }, icon(TAB_ICON[t.id] || 'folder', 16), t.label)));
    if (q.trim()) {
      const t = norm(q.trim()); const seen = new Set();
      const hits = searchable(eff).filter((x) => (norm(x.label).includes(t) || norm(x.group || '').includes(t) || norm(x.desc || '').includes(t)) && !seen.has(x.href) && seen.add(x.href));
      list.replaceChildren(h('section', { class: 'drawer-sec' }, ...(hits.length ? hits.map((x) => item([x.href, x.ic, x.label])) : [h('p', { class: 'muted drawer-sub' }, 'nada com esse nome')])));
      return;
    }
    const cur = eff.find((x) => x.id === tab);
    const note = editing ? h('div', { class: 'drawer-editnote' }, h('p', { class: 'muted' }, 'esconda o que não usa, mude de aba ou suba e desça. nada é apagado: dá pra mostrar de novo.'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => savePrefs({ hidden: [], moved: {}, order: [] }).then(() => toast('menu voltou ao padrão ✓', { ms: 1800 })) }, 'voltar ao padrão')) : null;
    const rec = recents().slice(0, 5);
    const recSec = !editing && !search.value.trim() && rec.length ? h('section', { class: 'drawer-sec' }, h('h2', { class: 'drawer-sub' }, icon('timer', 15), 'recentes'), ...rec.map((x) => h('a', { href: x.h, class: 'drawer-item', onclick: close }, icon('timer', 22), h('span', {}, x.t)))) : null;
    list.replaceChildren(...[recSec, note, ...cur.groups.map((g) => {
      const items = editing ? g.items : g.items.filter((it) => !p.hidden.includes(it[0]));
      if (!items.length) return null;
      return h('section', { class: 'drawer-sec' }, g.title ? h('h2', { class: 'drawer-sub' }, icon(GROUP_ICON[g.title] || 'folder', 15), g.title) : null,
        ...(editing ? g.items.map((it, i) => editRow(cur, g, it, i, p)) : items.map(item)));
    })].filter(Boolean));
  };
  offStore = store.subscribe((i) => { if (!i.kind || i.id === PREF) draw(); });
  const panel = h('nav', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
    h('div', { class: 'drawer-head' }, h('img', { src: 'assets/icons/tambor-96.png', alt: '', width: 36, height: 36 }), h('strong', { class: 'drawer-brand' }, h('img', { src: 'assets/logo-nome.png', alt: 'Beaterista', height: 30 })), editBtn,
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar menu', onclick: close }, icon('x', 22))),
    h('div', { class: 'drawer-search' }, search), tabs, list);
  draw();
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  // arrastar pra esquerda fecha
  let x0 = null;
  panel.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', (e) => { if (x0 != null && x0 - e.changedTouches[0].clientX > 60 && !editing) close(); x0 = null; }, { passive: true });
  document.addEventListener('keydown', onKey);
  back.append(panel); document.getElementById('overlay').append(back);
  const firstItem = panel.querySelector('.drawer-item.on, .drawer-item'); if (firstItem) firstItem.focus({ preventScroll: true });
}
