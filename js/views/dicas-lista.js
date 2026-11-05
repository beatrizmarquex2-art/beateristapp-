// As 30 dicas do método (área dos alunos): lista simples. Vêm do servidor só pra código liberado (js/acesso.js guarda no aparelho).
import { h } from '../util.js';
import * as store from '../store.js';
import { banner } from '../ui.js';
import { tipList } from '../tipbox.js';
import * as Acesso from '../acesso.js';

export function mount(host) {
  const list = h('div', { class: 'pad-x', style: 'display:grid;gap:10px' });
  const draw = () => {
    const tips = tipList();
    list.replaceChildren(...(tips.length ? tips.map((t) => h('article', { class: 'card pad dc-explain' }, h('p', { class: 'dc-n' }, `dica ${t.n} de ${Math.max(30, tips.length)}`), h('p', { class: 'dc-text' }, t.text)))
      : [h('p', { class: 'muted' }, 'buscando as dicas…')]));
  };
  host.append(banner('As 30 dicas', 'pequenas ideias pra estudar melhor'), h('div', { class: 'pad-x' }, h('a', { class: 'jg-link', href: '#/estudos' }, '‹ estudos')), list);
  draw(); Acesso.carregarDicas();
  const off = store.subscribe((i) => { if (!i.kind || i.kind === 'tip') draw(); });
  return off;
}
