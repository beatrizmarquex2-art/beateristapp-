// Menu ☰: todas as atividades num lugar só (abre da esquerda). Mesmo catálogo dos atalhos + o Meu Kit.
import { recents } from '../recent.js';
import { h, icon, reducedMotion } from '../util.js';
import * as store from '../store.js';
import { TABS } from './kit.js';
import { HUBS } from './hub.js';
import { getSpace } from '../space.js';
import { dragSort } from '../dragsort.js';
import { toast } from '../ui.js';

// Dois menus: o da Bea (pouca coisa, o dela) e o do Beaterista (a área das aulas e dos alunos, com fundo de outra cor).
// Cada aba com grupinhos curtos. Ferramentas parecidas ficam juntas numa página só (Criar ritmos, Tempo, Anotar).
const MENU_BEA = [
  ['treinar', 'treinar', [
    ['', [['#/treinos/montar', 'staff', 'Figuras rítmicas'], ['#/ouvido', 'mic', 'Estúdio de Ouvido']]],
  ]],
  ['jogos', 'jogos', [
    ['', [['#/jogos', 'star', 'Todos os jogos']]],
  ]],
  ['ritmo', 'ritmo', [
    ['', [['#/ritmo', 'kit', 'Jogos de ritmo']]],
  ]],
  ['estudar', 'estudos', [
    ['conceitos', [['#/estudos', 'study', 'Conceitos'], ['#/estudos/cat/ritmo', 'study', 'Ritmo & groove'], ['#/estudos/cat/pratica', 'study', 'Estudo & prática'], ['#/estudos/cat/escuta', 'study', 'Ouvido & teoria da escuta'], ['#/estudos/cat/prazer', 'study', 'Prazer & emoção'], ['#/estudos/cat/palco', 'study', 'Palco & ensino']]],
    ['álbuns', [['#/estudos/club', 'note', 'Arsenal discos']]],
    ['artistas', [['#/estudos/artistas', 'drummer', 'Artistas'], ['#/mural', 'photo', 'Mural de Artistas']]],
    ['', [['#/anotacoes', 'note', 'Minhas anotações']]],
    ['foco', [['#/foco', 'timer', 'Cronômetro de Foco'], ['#/ambiente', 'mic', 'Estúdio de Ambiente']]],
  ]],
  ['tocar', 'tocar', [
    ['', [['#/hub/ritmo', 'kit', 'Criar ritmos'], ['#/piano', 'note', 'Piano'], ['#/hub/tempo', 'timer', 'Tempo'], ['#/repertorio', 'note', 'Repertório']]],
    ['ferramentas', [['#/ferramentas/loop', 'note', 'Play-along em loop'], ['#/ferramentas/mapa', 'staff', 'Mapa da música']]],
  ]],
  ['aulas', 'aulas', [
    ['', [['#/beaterista', 'drummer', 'Alunos'], ['#/acessos', 'drummer', 'Acessos dos alunos'], ['#/ferramentas/leitura', 'staff', 'Folhas de leitura']]],
  ]],
  ['organizar', 'organizar', [
    ['', [['#/inicio', 'home', 'Início'], ['#/hub/anotar', 'note', 'Anotar'], ['#/arquivos', 'folder', 'Meus Arquivos']]],
    ['conteúdo', [['#/feed', 'mural', 'Feed Beaterista'], ['#/feed/colagens', 'photo', 'Colagens']]],
  ]],
  ['kit', 'meu kit', [
    ['', [...TABS.map(([k, t, ic]) => [`#/kit/${k}`, ic, k === 'fotos' ? 'Fotos profissionais' : t]), ['#/ajustes', 'gear', 'Ajustes e backup']]],
  ]],
];
const MENU_B = [
  ['treinar', 'treinar', [
    ['', [['#/plano', 'study', 'Plano de Estudo'], ['#/rudimentos', 'drummer', 'Rudimentos'], ['#/acentuacao', 'staff', 'Acentuação 4×4'], ['#/ferramentas/desafio', 'star', 'Desafio da semana'], ['#/treinos', 'study', 'Leitura e Escuta']]],
  ]],
  ['jogos', 'jogos', [
    ['', [['#/jogos', 'star', 'Todos os jogos']]],
    ['leitura musical', [['#/kids/figuras', 'staff', 'Figuras rítmicas'], ['#/kids/pauta', 'staff', 'Onde mora na pauta?']]],
    ['cartas e tabuleiro', [['#/kids/memoria', 'star', 'Jogo da memória'], ['#/jogos/domino', 'star', 'Dominó'], ['#/jogos/cartas', 'star', 'Última nota'], ['#/jogos/bingo', 'star', 'Bingo'], ['#/jogos/velha', 'star', 'Jogo da velha'], ['#/jogos/quebra', 'star', 'Quebra-cabeça'], ['#/jogos/cara', 'star', 'Cara a cara'], ['#/jogos/stop', 'star', 'Stop']]],
    ['dicas', [['#/dicas/quiz', 'bulb', 'Quiz das dicas'], ['#/dicas/caca', 'bulb', 'Caça-palavras'], ['#/dicas/cruzadinha', 'bulb', 'Cruzadinha']]],
    ['fases e relatório', [['#/kids', 'star', 'Fases e estrelas'], ['#/jogos/relatorio', 'note', 'Relatório dos jogos']]],
  ]],
  ['ritmo', 'ritmo', [
    ['', [['#/ritmo', 'kit', 'Jogos de ritmo'], ['#/kids/ritmo', 'kit', 'Monte seu ritmo'], ['#/kids/explorar', 'drummer', 'Explorar a bateria'], ['#/kids/eco', 'mic', 'Eco rítmico'], ['#/ferramentas/um', 'timer', 'Achar o 1']]],
  ]],
  ['estudar', 'estudos', [
    ['', [['#/dicionario', 'book', 'Dicionário da bateria']]],
  ]],
  ['tocar', 'tocar', [
    ['', [['#/ferramentas', 'metro', 'Todas as ferramentas'], ['#/hub/ritmo', 'kit', 'Criar ritmos'], ['#/hub/tempo', 'timer', 'Tempo']]],
  ]],
  ['aulas', 'aulas', [
    ['', [['#/beaterista', 'drummer', 'Alunos'], ['#/planos', 'study', 'Planos dos Alunos'], ['#/ata', 'note', 'Ata de reunião'], ['#/ferramentas/roleta', 'star', 'Roleta da aula'], ['#/setlist', 'note', 'Setlist']]],
  ]],
];
// ícones pequenos nas abas e nas pastinhas, pra reconhecer de relance
const TAB_ICON = { fav: 'star', ritmo: 'kit', tocar: 'kit', treinar: 'timer', jogos: 'star', estudar: 'book', aulas: 'drummer', organizar: 'check', kit: 'id' };
const GROUP_ICON = { ferramentas: 'metro', 'técnica': 'staff', 'leitura e ouvido': 'mic', jogos: 'play', 'ritmo e bateria': 'kit', 'leitura musical': 'staff', 'cartas e tabuleiro': 'star', dicas: 'bulb', 'fases e relatório': 'star', conceitos: 'book', 'álbuns': 'note', artistas: 'drummer', foco: 'timer', 'conteúdo': 'mural' };
// tocar de novo na aba que já está aberta abre a página principal dela (o primeiro toque só mostra os itens, pra não sair da tela sem querer)
const TAB_HOME = { jogos: '#/jogos', ritmo: '#/ritmo', estudar: '#/estudos' };
const TAB_HOME_B = { jogos: '#/jogos', ritmo: '#/ritmo', tocar: '#/ferramentas' };
const prefKey = (sp) => (sp === 'beaterista' ? 'setting-menu-beaterista' : 'setting-menu'); // { hidden: [href], moved: { href: abaId }, order: [href] }
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** O menu como a Bea deixou: itens movidos de aba, reordenados; os escondidos só aparecem ao personalizar. */
function effective(p, TABS_MENU) {
  const all = new Map();
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
  for (const t of tabs) for (const g of t.groups) for (const it of g.items) if (!all.has(it[0])) all.set(it[0], it);
  const favItems = (p.fav || []).map((h2) => all.get(h2)).filter(Boolean);
  tabs.unshift({ id: 'fav', label: 'favoritos', groups: [{ title: '', items: favItems }] });
  return tabs;
}
/** Tudo o que dá pra achar na busca, inclusive as ferramentas dentro das páginas juntas. */
const searchable = (tabs) => [
  ...tabs.flatMap((t) => t.groups.flatMap((g) => g.items.map((it) => ({ tab: t.id, href: it[0], ic: it[1], label: it[2], group: g.title })))),
  ...Object.values(HUBS).flatMap((hub) => hub.items.map(([href, ic, label, desc]) => ({ tab: '', href, ic, label, group: hub.title, desc }))),
];

export function openMenu() {
  if (document.querySelector('.drawer')) return;
  const SP = getSpace(); const TABS_MENU = SP === 'beaterista' ? MENU_B : MENU_BEA;
  const PREF = prefKey(SP); const LAST = `bt-menu-tab-${SP}`;
  const prefs = () => ({ hidden: [], moved: {}, order: [], fav: [], ...(store.get(PREF) ? store.get(PREF).data : {}) });
  const savePrefs = (p) => store.upsert('setting', PREF, p);
  const here = location.hash || '#/inicio';
  const back = h('div', { class: 'drawer-back' });
  let editing = false;
  let offStore = () => {};
  const close = () => {
    document.removeEventListener('keydown', onKey); offStore(); dragOffs.splice(0).forEach((f) => f());
    back.classList.add('out'); setTimeout(() => back.remove(), reducedMotion() ? 0 : 200);
    btn && btn.focus && btn.focus();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const btn = document.activeElement;
  const first = effective(prefs(), TABS_MENU);
  // aba inicial: a da tela atual; senão a última aberta
  const flat = first.filter((t) => t.id !== 'fav').flatMap((t) => t.groups.flatMap((g) => g.items.map((it) => [t.id, ...it])));
  const mine = flat.filter((x) => x[1] === here).map((x) => x[0])[0] || flat.filter((x) => x[1] !== '#/inicio' && here.startsWith(x[1])).map((x) => x[0])[0];
  let tab = mine || (() => { try { return localStorage.getItem(LAST); } catch { return null; } })() || TABS_MENU[0][0];
  if (tab !== 'fav' && !TABS_MENU.some((t) => t[0] === tab)) tab = TABS_MENU[0][0];
  let q = '';
  // toda mudança de ordem/esconder/favorito mostra "desfazer" por uns segundos
  const change = (next, msg) => { const prev = prefs(); savePrefs(next); toast(msg, { action: 'desfazer', onAction: () => savePrefs(prev), ms: 5000 }); };
  const toggleFav = (href) => { const p = prefs(); const on = p.fav.includes(href); const next = { ...p, fav: on ? p.fav.filter((x) => x !== href) : [...p.fav, href] }; if (on) change(next, 'tirado dos favoritos'); else savePrefs(next); };
  const item = ([href, ic, label]) => { const fav = prefs().fav.includes(href); return h('div', { class: 'drawer-row' },
    h('a', { href, class: `drawer-item${here === href ? ' on' : ''}`, 'aria-current': here === href ? 'page' : null, onclick: close }, icon(ic, 22), h('span', {}, label)),
    h('button', { type: 'button', class: `drawer-star${fav ? ' on' : ''}`, 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Tirar dos' : 'Pôr nos'} favoritos: ${label}`, onclick: () => toggleFav(href) }, fav ? '★' : '☆')); };
  const tabs = h('div', { class: 'drawer-tabs chips lib-tabs', role: 'tablist', 'aria-label': 'Seções do menu' });
  const list = h('div', { class: 'drawer-list' });
  const search = h('input', { type: 'search', placeholder: 'buscar no menu', 'aria-label': 'Buscar no menu' });
  search.addEventListener('input', () => { q = search.value; draw(); });
  const editBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Personalizar o menu', 'aria-pressed': 'false', onclick: () => { editing = !editing; editBtn.setAttribute('aria-pressed', String(editing)); editBtn.classList.toggle('on', editing); draw(); } }, icon('edit', 20));

  /** Linha do modo personalizar: subir, descer, esconder e mudar de aba. */
  const editRow = (t, g, it, i, p) => {
    const off = p.hidden.includes(it[0]);
    const sel = h('select', { 'aria-label': `Aba de ${it[2]}` }, ...TABS_MENU.map(([id, label]) => h('option', { value: id, selected: id === t.id }, label)));
    sel.addEventListener('change', () => { const moved = { ...p.moved, [it[0]]: sel.value }; const orig = TABS_MENU.find((x) => x[2].some(([, items]) => items.some((y) => y[0] === it[0]))); if (orig && orig[0] === sel.value) delete moved[it[0]]; savePrefs({ moved }); });
    return h('div', { class: `drawer-edit${off ? ' off' : ''}`, 'data-key': it[0] },
      h('button', { type: 'button', class: 'de-grip', 'aria-label': `Arrastar ${it[2]} pra mudar de lugar` }, '⠿'),
      h('span', { class: 'de-name' }, icon(it[1], 20), h('span', {}, it[2])),
      h('div', { class: 'de-act' },
        h('button', { type: 'button', class: `btn small${off ? '' : ' ghost'}`, 'aria-pressed': String(off), onclick: () => (off ? savePrefs({ ...p, hidden: p.hidden.filter((x) => x !== it[0]) }) : change({ ...p, hidden: [...p.hidden, it[0]] }, `${it[2]} escondido`)) }, off ? 'mostrar' : 'esconder'),
        sel));
  };

  const dragOffs = [];
  const draw = () => {
    dragOffs.splice(0).forEach((f) => f());
    const p = prefs(); const eff = effective(p, TABS_MENU);
    if (!eff.some((t) => t.id === tab)) tab = TABS_MENU[0][0];
    tabs.hidden = !!q.trim();
    tabs.replaceChildren(...eff.map((t) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === t.id), class: `lib-tab drawer-tab${tab === t.id ? ' on' : ''}`, onclick: () => { const again = tab === t.id; tab = t.id; try { localStorage.setItem(LAST, t.id); } catch { /* sem armazenamento */ } const go = (SP === 'beaterista' ? TAB_HOME_B : TAB_HOME)[t.id]; if (again && go && (location.hash || '') !== go) { close(); location.hash = go; return; } draw(); } }, icon(TAB_ICON[t.id] || 'folder', 16), t.label)));
    if (q.trim()) {
      const t = norm(q.trim()); const seen = new Set();
      const hits = searchable(eff).filter((x) => (norm(x.label).includes(t) || norm(x.group || '').includes(t) || norm(x.desc || '').includes(t)) && !seen.has(x.href) && seen.add(x.href));
      list.replaceChildren(h('section', { class: 'drawer-sec' }, ...(hits.length ? hits.map((x) => item([x.href, x.ic, x.label])) : [h('p', { class: 'muted drawer-sub' }, 'nada com esse nome')])));
      return;
    }
    const cur = eff.find((x) => x.id === tab);
    const favEmpty = cur.id === 'fav' && !cur.groups[0].items.length;
    const note = cur.id === 'fav' ? (favEmpty ? h('p', { class: 'muted drawer-sub' }, 'toque na ☆ de qualquer item do menu pra ele ficar aqui.') : null) : editing ? h('div', { class: 'drawer-editnote' }, h('p', { class: 'muted' }, 'esconda o que não usa, mude de aba ou suba e desça. nada é apagado: dá pra mostrar de novo.'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { const prev = prefs(); savePrefs({ hidden: [], moved: {}, order: [], fav: prev.fav }).then(() => toast('menu voltou ao padrão', { action: 'desfazer', onAction: () => savePrefs(prev), ms: 5000 })); } }, 'voltar ao padrão')) : null;
    const rec = recents().slice(0, 2);
    const recSec = !editing && !search.value.trim() && rec.length ? h('div', { class: 'drawer-recent', 'aria-label': 'Recentes' }, h('small', {}, 'recentes'), ...rec.map((x) => h('a', { href: x.h, onclick: close }, x.t))) : null;
    list.replaceChildren(...[recSec, note, ...cur.groups.map((g) => {
      const items = editing && cur.id !== 'fav' ? g.items : g.items.filter((it) => !p.hidden.includes(it[0]));
      if (!items.length) return null;
      const secEl = h('section', { class: 'drawer-sec' }, g.title ? h('h2', { class: 'drawer-sub' }, icon(GROUP_ICON[g.title] || 'folder', 15), g.title) : null,
        ...(editing && cur.id !== 'fav' ? g.items.map((it, i) => editRow(cur, g, it, i, p)) : items.map(item)));
      if (editing && cur.id !== 'fav') dragOffs.push(dragSort(secEl, { itemSel: '.drawer-edit', handleSel: '.de-grip', axis: 'y', onDone: (keys) => change({ ...p, order: [...keys, ...p.order.filter((x) => !keys.includes(x))] }, 'ordem mudou') }));
      return secEl;
    })].filter(Boolean));
  };
  offStore = store.subscribe((i) => { if (!i.kind || i.id === PREF) draw(); });
  const panel = h('nav', { class: `drawer${SP === 'beaterista' ? ' drawer-b' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
    h('div', { class: 'drawer-head' }, h('img', { src: 'assets/icons/tambor-menu.png', alt: '', width: 36, height: 36 }), h('strong', { class: 'drawer-brand' }, SP === 'beaterista' ? h('img', { src: 'assets/logo-menu-beaterista.webp', alt: 'Beaterista', height: 52 }) : h('img', { src: 'assets/logo-512.png', alt: 'Escola de Música Beaterista', height: 56 })), editBtn,
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar menu', onclick: close }, icon('x', 22))),
    h('div', { class: 'drawer-search' }, search),
    h('div', { class: 'drawer-pins' }, ...[['#/hub/ritmo', 'kit', 'Criar ritmos'], ['#/hub/tempo', 'timer', 'Tempo']].map(([href, ic, label]) => h('a', { href, class: 'drawer-pin', onclick: close }, icon(ic, 18), label))),
    tabs, list);
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
