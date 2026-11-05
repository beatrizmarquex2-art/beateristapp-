// Busca geral: atividades do menu + tudo que você salvou (tarefas, notas, partituras, alunos, ideias, links...).
import { h, icon } from './util.js';
import * as store from './store.js';
import { MODULES } from './modules.js';
import { menuItems } from './views/menu.js';
import { sheet } from './ui.js';
import { KINDS, titleOf, norm, textOf } from './kinds.js';

function buildIndex() {
  const acts = new Map();
  for (const m of MODULES) if (m.route) acts.set(m.route, m.label);
  for (const [href, label] of menuItems()) acts.set(href, label);
  const out = [...acts].map(([href, label]) => ({ type: 'Atividade', title: label, hay: norm(label), href, tab: 'a' }));
  for (const r of store.allRaw()) {
    if (r.deleted || !KINDS[r.kind]) continue;
    const t = titleOf(r.data);
    out.push({ type: KINDS[r.kind][0], title: t, hay: norm(`${t} ${textOf(r.data)}`), tit: norm(t), href: KINDS[r.kind][1], tab: 'r' });
  }
  return out;
}
function find(index, q) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const res = [];
  for (const it of index) {
    if (!words.every((w) => it.hay.includes(w))) continue;
    const ti = it.tit || it.hay;
    let sc = it.tab === 'a' ? 5 : 0;
    if (ti.startsWith(words[0])) sc += 4; else if (words.every((w) => ti.includes(w))) sc += 2;
    res.push([sc, it]);
  }
  return res.sort((a, b) => b[0] - a[0]).slice(0, 40).map((x) => x[1]);
}

export function openSearch() {
  sheet('Buscar', (close) => {
    const index = buildIndex();
    const input = h('input', { type: 'search', placeholder: 'ex: paradiddle, Lia, setlist…', 'aria-label': 'Buscar no app todo', autocomplete: 'off', enterkeyhint: 'search' });
    const box = h('div', { class: 'srch-list', role: 'list' });
    const draw = () => {
      const q = input.value.trim();
      if (!q) { box.replaceChildren(h('p', { class: 'muted' }, 'procura em atividades, tarefas, notas, partituras, alunos, ideias, links…')); return; }
      const r = find(index, q);
      box.replaceChildren(...(r.length ? r.map((it) => h('a', { class: 'srch-item', href: it.href, role: 'listitem', onclick: close },
        h('span', { class: 'srch-type' }, it.type), h('span', { class: 'srch-title' }, it.title))) : [h('p', { class: 'muted' }, 'nada encontrado. tenta outra palavra.')]));
    };
    input.addEventListener('input', draw);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = box.querySelector('a'); if (a) { a.click(); } } });
    draw();
    return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, input), box);
  });
}
export const searchIcon = (n = 22) => icon('search', n);
