import { h, icon } from '../util.js';
import { bySlug, phaseText } from '../modules.js';
import { banner } from '../ui.js';

/** Módulo que ainda não existe: aviso honesto, sem tela fake. */
export function mountSoon(host, slug) {
  const m = bySlug[slug];
  if (!m) { host.append(banner('Ops'), h('p', { class: 'pad-x' }, 'Essa página não existe.'), h('a', { class: 'btn primary wide', href: '#/inicio' }, 'Voltar ao início')); return; }
  host.append(
    banner(m.label, 'ainda em construção', 'vinyl'),
    h('div', { class: 'card pad soon-card' },
      h('div', { class: 'sc-ico big' }, icon(m.icon, 44)),
      h('p', { class: 'hand big' }, `${phaseText(m)}.`),
      h('p', {}, 'Este módulo ainda não foi construído — nada aqui funciona de verdade por enquanto, pra você nunca salvar algo que não fica guardado.'),
      h('a', { class: 'btn primary', href: '#/inicio' }, 'Voltar ao início')));
}
