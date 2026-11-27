// "Seus prêmios do passe" (Lojinha): wallpapers, banner, folhas de colorir e 3 figurinhas exclusivas. Só aparece pra quem tem código de acesso válido.
import { h } from '../util.js';
import * as AC from '../acesso.js';
import { toast } from '../ui.js';
import * as R from '../figurinhas/rewards.js';
import { WALLPAPERS, BANNERS, PLANNERS, COLORIR, FIGURINHAS } from '../premios-config.js';

const ic = (n) => h('img', { class: 'ic-loja', src: `assets/icones-loja/${n}.png`, alt: '', width: 22, height: 22, draggable: 'false' });
const baixar = (item, cls = '') => h('a', { class: `pm-item ${cls}`.trim(), href: item.arquivo, download: '', target: '_blank', rel: 'noopener', 'aria-label': `baixar ${item.nome}` },
  h('img', { src: item.mini, alt: '', loading: 'lazy', draggable: 'false' }), h('span', {}, item.nome, h('small', {}, item.dica || 'baixar')));

export function premios() {
  if (!AC.liberado()) return null;
  const figs = h('p', { class: 'pm-fig-st', role: 'status' }, 'conferindo…');
  const painel = h('section', { class: 'ljv-s ljv-s-premios', id: 'lj-premios', 'aria-labelledby': 'lj-premios-t' },
    h('header', { class: 'ljv-s-top' }, h('div', {}, h('h2', { id: 'lj-premios-t' }, 'Seus prêmios do passe'), h('p', {}, 'tudo liberado de uma vez: é só baixar')),
      h('img', { class: 'ljv-host', src: 'assets/paul/animacoes/web/paul-presente.webp', alt: 'Paul com um presente', width: 64, height: 64, loading: 'lazy' })),
    h('h3', { class: 'pm-t' }, ic('tipo-wallpaper'), ` wallpapers (${WALLPAPERS.length})`),
    h('div', { class: 'pm-wp', role: 'list' }, ...WALLPAPERS.map((w) => h('a', { class: 'pm-w', role: 'listitem', href: w.arquivo, download: '', target: '_blank', rel: 'noopener', 'aria-label': `baixar o wallpaper ${w.nome}` },
      h('img', { src: w.mini, alt: w.nome, loading: 'lazy', draggable: 'false', width: 300, height: 533 })))),
    h('h3', { class: 'pm-t' }, ic('tipo-banner'), ` banners (${BANNERS.length})`),
    h('div', { class: 'pm-faixa pm-banners', role: 'list' }, ...BANNERS.map((b) => h('a', { class: 'pm-b', role: 'listitem', href: b.arquivo, download: '', target: '_blank', rel: 'noopener', 'aria-label': `baixar o banner ${b.nome}` }, h('img', { src: b.mini, alt: b.nome, loading: 'lazy', draggable: 'false' })))),
    h('h3', { class: 'pm-t' }, ic('tipo-planner'), ` planners (${PLANNERS.length})`),
    h('div', { class: 'pm-faixa', role: 'list' }, ...PLANNERS.map((x) => h('a', { class: 'pm-w pm-p', role: 'listitem', href: x.arquivo, download: '', target: '_blank', rel: 'noopener', 'aria-label': `baixar o planner ${x.nome}` }, h('img', { src: x.mini, alt: x.nome, loading: 'lazy', draggable: 'false' })))),
    h('h3', { class: 'pm-t' }, ic('tipo-colorir'), ' colorir'),
    h('div', { class: 'pm-dois' }, baixar(COLORIR)),
    h('h3', { class: 'pm-t' }, '3 figurinhas exclusivas'),
    h('div', { class: 'pm-figs' }, ...FIGURINHAS.codigos.map((c) => h('img', { src: `assets/figurinhas/mini/${c}.webp`, alt: `figurinha exclusiva ${c}`, loading: 'lazy', draggable: 'false' }))),
    figs, h('a', { class: 'ljv-link', href: '#/album/Pacotes' }, 'abrir no baú ›'));
  // entrega as 3 exclusivas (uma vez só: o id do pacote é fixo)
  R.grantPacks([FIGURINHAS.id]).then((n) => { figs.textContent = n ? 'chegaram no seu baú agora!' : 'já estão no seu baú ou no seu álbum.'; if (n) toast('3 figurinhas exclusivas chegaram no seu baú!', { ms: 5000 }); })
    .catch(() => { figs.textContent = 'não deu pra entregar agora. tente de novo daqui a pouco.'; });
  return painel;
}
