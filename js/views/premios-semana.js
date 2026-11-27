// "Prêmios das semanas": o check-in de 7 dias seguidos libera 1 wallpaper e 2 folhas de colorir (além de 30 ★ e do giro épico).
// Mostra os das semanas já fechadas (`ciclo` = semanas completas), com download.
import { h } from '../util.js';
import { premioDaSemana } from '../premios-config.js';
const ic = (n) => h('img', { class: 'ic-loja', src: `assets/icones-loja/${n}.png`, alt: '', width: 18, height: 18, draggable: 'false' });

const baixar = (item, cls) => h('a', { class: `pm-w ${cls}`, href: item.arquivo, download: '', target: '_blank', rel: 'noopener', 'aria-label': `baixar ${item.nome}` }, h('img', { src: item.mini, alt: item.nome, loading: 'lazy', draggable: 'false' }));

export function premiosDasSemanas(ciclo) {
  const n = Math.max(0, ciclo | 0);
  if (!n) return h('p', { class: 'fig-note pm-sem-vazio' }, 'fechou 7 dias seguidos? você ganha 1 wallpaper e 2 folhas de colorir.');
  const semanas = Array.from({ length: n }, (_, k) => n - k).map((s) => { const p = premioDaSemana(s);
    return h('div', { class: 'pm-sem-linha' }, h('b', {}, `semana ${s}`, h('small', {}, ' · ', ic('tipo-wallpaper'), ` ${p.wallpaper.nome} · `, ic('tipo-colorir'), ' 2 folhas')), h('div', { class: 'pm-sem-itens' }, baixar(p.wallpaper, 'pm-sem-wp'), ...p.colorir.map((c) => baixar(c, 'pm-sem-cl')))); });
  return h('details', { class: 'pm-sem', open: n <= 2 ? '' : null }, h('summary', {}, `meus prêmios das semanas (${n})`), ...semanas);
}
