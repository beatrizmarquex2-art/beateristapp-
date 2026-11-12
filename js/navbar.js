// Barra de baixo personalizável: 5 atalhos à sua escolha (segurar um deles abre o editor).
import { h } from './util.js';
import * as store from './store.js';
import { MODULES } from './modules.js';
import { sheet, toast } from './ui.js';

export const NAV_KEY = 'setting-nav';
export const NAV_DEFAULT = [
  ['#/inicio', 'home', 'Início'],
  ['#/hub/ritmo', 'kit', 'Criar ritmos'],
  ['#/estudos', 'study', 'Estudos'],
  ['#/jogos', 'star', 'Jogos'],
  ['#/jogos-alunos', 'bulb', 'Alunos'], // o site dos alunos, igualzinho ao que eles veem
];
export function navChoices() {
  const m = new Map(NAV_DEFAULT.map((n) => [n[0], n]));
  for (const x of MODULES) if (x.route && !m.has(x.route)) m.set(x.route, [x.route, x.icon, x.label]);
  return m;
}
/** Preenche `nav` (lista que o app usa) com o que a Bea escolheu, ou o padrão. */
export function loadNav(nav) {
  const d = store.get(NAV_KEY); const ch = navChoices();
  let items = NAV_DEFAULT;
  if (d && Array.isArray(d.data.items) && (d.data.items.length === 4 || d.data.items.length === 5)) { const list = d.data.items.length === 4 && !d.data.items.includes('#/jogos-alunos') ? [...d.data.items, '#/jogos-alunos'] : d.data.items; const m = list.map((x) => ch.get(x)); if (m.every(Boolean)) items = m; }
  nav.splice(0, nav.length, ...items);
}
export function openNavEditor() {
  sheet('Barra de baixo', (close) => {
    const cur = [...(store.get(NAV_KEY)?.data.items || NAV_DEFAULT.map((n) => n[0]))]; if (cur.length === 4 && !cur.includes('#/jogos-alunos')) cur.push('#/jogos-alunos');
    const ch = [...navChoices().values()];
    const sels = [0, 1, 2, 3, 4].map((i) => h('select', { 'aria-label': `Atalho ${i + 1}` }, ch.map((c) => h('option', { value: c[0], selected: c[0] === cur[i] }, c[2]))));
    return h('div', { class: 'sheet-body' },
      h('p', { class: 'muted' }, 'escolha os 5 atalhos que ficam sempre na barra de baixo. dica: segure um deles pra abrir isto.'),
      ...sels.map((s, i) => h('label', { class: 'field' }, h('span', {}, `atalho ${i + 1}`), s)),
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await store.upsert('setting', NAV_KEY, { items: NAV_DEFAULT.map((n) => n[0]) }); toast('Barra voltou ao padrão'); close(); } }, 'padrão'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          const items = sels.map((s) => s.value);
          if (new Set(items).size < 5) { toast('Escolha 5 atalhos diferentes.'); return; }
          await store.upsert('setting', NAV_KEY, { items }); toast('Barra atualizada ✓'); close();
        } }, 'salvar')));
  });
}
