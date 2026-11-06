// Vitrine da Lojinha Beaterista (desenho da Bea): 4 materiais em cartões + Passe Beaterista. Textos e links em js/loja-config.js.
import { h } from '../util.js';
import { toast } from '../ui.js';
import { PASSE, PRODUTOS } from '../loja-config.js';

const comprar = (item) => () => {
  if (item.link) { window.open(item.link, '_blank', 'noopener'); return; }
  toast('a compra abre em breve! por enquanto, chame a professora Bea', { ms: 3200 });
};
const botao = (txt, item, cls) => h('button', { type: 'button', class: `lj-btn ${cls || ''}`.trim(), onclick: comprar(item), 'data-id': item.id || 'passe' }, txt, h('b', { 'aria-hidden': 'true' }, '›'));

export function vitrine() {
  return h('div', { class: 'lj' },
    h('img', { class: 'lj-topo', src: 'assets/loja/topo.webp', alt: 'Lojinha Beaterista', width: 610, height: 230 }),
    h('h2', { class: 'lj-esc' }, h('span', {}, 'Escolha seu material')),
    h('div', { class: 'lj-grid' }, ...PRODUTOS.map((p) => h('article', { class: 'lj-card' },
      h('img', { src: p.img, alt: p.nome, loading: 'lazy', width: 370, height: 330 }), h('h3', {}, p.nome), h('p', {}, p.desc), botao('Adquirir', p)))),
    h('article', { class: 'lj-passe' }, h('img', { src: PASSE.img, alt: '', loading: 'lazy' }),
      h('div', { class: 'lj-pm' }, h('h3', {}, PASSE.nome), h('ul', {}, ...PASSE.info.map((x) => h('li', {}, x)))),
      h('div', { class: 'lj-pp' }, h('span', { class: 'lj-preco' }, PASSE.preco), botao('Adquirir passe', PASSE, 'amarelo'))));
}
