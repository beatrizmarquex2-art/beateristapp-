// Página da parceria Beaterista × Nagano (abre quando alguém toca no logo da Nagano na bateria): a Bea no evento TDT.
import { h } from '../util.js';
import { banner } from '../ui.js';
import { TDT_LINK } from '../marcas-links.js';

export function mount(host) {
  host.append(banner('Nagano', 'uma parceria com a Beaterista'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:14px' },
      h('a', { class: 'jg-link', href: '#/toque' }, '‹ voltar pra bateria'),
      h('section', { class: 'card pad par-nagano' },
        h('div', { class: 'par-logos', 'aria-hidden': 'true' }, h('img', { src: 'assets/marcas/beaterista.png', alt: '', width: 72, height: 72 }), h('b', {}, '×'), h('img', { src: 'assets/marcas/nagano.png', alt: '', width: 72, height: 72 })),
        h('h2', { class: 'tag' }, 'Beaterista × Nagano'),
        h('p', {}, 'a Bea tem parceria com a Nagano, marca de baterias. aqui você vê a Bea no evento TDT.'),
        TDT_LINK ? h('a', { class: 'btn primary wide', href: TDT_LINK, target: '_blank', rel: 'noopener noreferrer' }, 'ver a Bea no TDT') : h('p', { class: 'muted' }, 'em breve: fotos e vídeo do evento.'))));
  return () => {};
}
