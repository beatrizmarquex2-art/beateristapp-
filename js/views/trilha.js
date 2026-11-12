// Tela da Trilha: a sequência de aprender e tocar, com o que já foi, o próximo e o que ainda está trancado.
import { h } from '../util.js';
import { estado, vale } from '../campanha/trilha-estado.js';
import { progresso } from '../campanha/trilha.js';

export function mount(host) {
  const e = estado(); const p = progresso(Object.fromEntries(e.map((x) => [x.id, x.feito]))); const trava = vale();
  const item = (x) => {
    const livre = !trava; const aberto = x.aberto || livre; const tag = x.feito ? '✓ feito' : x.atual ? 'próximo' : aberto ? 'aberto' : '🔒 termine o passo anterior';
    const corpo = [h('span', { class: 'tr-n' }, String(x.n)), h('span', { class: 'tr-t' }, h('b', {}, x.nome), h('small', {}, x.texto)), h('span', { class: 'tr-tag' }, tag)];
    return aberto ? h('a', { class: `tr-i${x.feito ? ' ok' : ''}${x.atual ? ' now' : ''}`, href: x.href }, ...corpo) : h('div', { class: 'tr-i lock', 'aria-disabled': 'true' }, ...corpo);
  };
  host.replaceChildren(h('div', { class: 'av tr' },
    h('div', { class: 'av-bar' }, h('a', { class: 'av-back', href: '#/jogos' }, '‹ jogos'), h('b', { class: 'av-bt' }, 'Trilha: aprender e tocar')),
    h('p', { class: 'av-sub' }, `${p.feitos} de ${p.total} passos`),
    h('p', { class: 'av-p' }, 'cada passo abre quando você termina o anterior. Os outros jogos ficam no Modo Livre, sem ordem.'),
    h('div', { class: 'tr-list' }, ...e.map(item))));
  return () => {};
}
