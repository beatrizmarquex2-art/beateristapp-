// Vitrine da Lojinha Beaterista (desenho da Bea): materiais em cartões + Passe Beaterista. Textos, imagens e links em js/loja-config.js.
// Tocar na capa abre as fotos grandes do material (o que tem dentro), com o botão Adquirir.
import { h } from '../util.js';
import { toast } from '../ui.js';
import { PASSE, PRODUTOS, AVISO_DIGITAL } from '../loja-config.js';

const comprar = (item) => () => {
  if (item.link) { window.open(item.link, '_blank', 'noopener'); return; }
  toast('a compra abre em breve! por enquanto, chame a professora Bea', { ms: 3200 });
};
// sem link de compra ainda: o botão diz "em breve" (e não faz nada); com link, vira "Adquirir"
const botao = (txt, item, cls) => (item.link
  ? h('button', { type: 'button', class: `lj-btn ${cls || ''}`.trim(), onclick: comprar(item), 'data-id': item.id || 'passe' }, txt, h('b', { 'aria-hidden': 'true' }, '›'))
  : h('button', { type: 'button', class: `lj-btn breve ${cls || ''}`.trim(), disabled: true, 'data-id': item.id || 'passe' }, 'em breve'));

/** Janela com as fotos grandes do material. */
function detalhe(p) {
  const dlg = h('dialog', { class: 'lj-dlg', 'aria-label': p.nome },
    h('div', { class: 'lj-dtop' }, h('b', {}, p.nome), h('button', { type: 'button', class: 'lj-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕')),
    h('div', { class: 'lj-fotos' }, ...p.fotos.map((f, i) => h('img', { src: f, alt: `${p.nome}, imagem ${i + 1}`, loading: 'lazy' }))),
    h('div', { class: 'lj-dbot' }, botao('Adquirir', p)));
  dlg.addEventListener('close', () => dlg.remove()); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}

export function vitrine() {
  return h('div', { class: 'lj' },
    h('img', { class: 'lj-topo', src: 'assets/loja/topo.webp', alt: 'Lojinha Beaterista', width: 610, height: 230 }),
    h('h2', { class: 'lj-esc' }, h('span', {}, 'Escolha seu material')),
    h('p', { class: 'lj-digital' }, h('b', {}, '📄 materiais digitais. '), AVISO_DIGITAL),
    h('div', { class: 'lj-grid' }, ...PRODUTOS.map((p) => h('article', { class: 'lj-card', 'data-id': p.id },
      h('button', { type: 'button', class: 'lj-capa', 'aria-label': `ver ${p.nome}`, onclick: () => detalhe(p) }, h('img', { src: p.img, alt: p.nome, loading: 'lazy', width: 640, height: 800 })),
      h('h3', {}, p.nome), h('p', {}, p.desc), p.selo ? h('span', { class: 'lj-selo' }, p.selo) : null, p.preco ? h('b', { class: 'lj-preco lj-preco-card' }, p.precoDe ? [h('s', { class: 'lj-de', 'aria-label': `de ${p.precoDe}` }, p.precoDe), ' por '] : null, p.preco) : null, botao('Adquirir', p)))),
    PASSE.link ? h('article', { class: 'lj-passe' }, h('img', { src: PASSE.img, alt: '', loading: 'lazy' }),
      h('div', { class: 'lj-pm' }, h('h3', {}, PASSE.nome), h('ul', {}, ...PASSE.info.map((x) => h('li', {}, x)))),
      h('div', { class: 'lj-pp' }, h('span', { class: 'lj-preco' }, PASSE.preco), botao('Adquirir passe', PASSE, 'amarelo'))) : null);
}
