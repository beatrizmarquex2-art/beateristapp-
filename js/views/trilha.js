// Tela da Trilha: a sequência de aprender e tocar, com o que já foi, o próximo e o que ainda está trancado.
import { h } from '../util.js';
import { banner } from '../ui.js';
import { estado, vale } from '../campanha/trilha-estado.js';
import { progresso } from '../campanha/trilha.js';

export function mount(host) {
  const e = estado(); const p = progresso(Object.fromEntries(e.map((x) => [x.id, x.feito]))); const trava = vale();
  const item = (x) => {
    const livre = !trava; const aberto = x.aberto || livre; const tag = x.feito ? '✓ feito' : x.atual ? 'próximo' : aberto ? 'aberto' : '🔒 termine o passo anterior';
    const corpo = [h('span', { class: 'tr-n' }, String(x.n)), h('span', { class: 'tr-t' }, h('b', {}, x.nome), h('small', {}, x.texto)), h('span', { class: 'tr-tag' }, tag)];
    return aberto ? h('a', { class: `tr-i${x.feito ? ' ok' : ''}${x.atual ? ' now' : ''}`, href: x.href }, ...corpo) : h('div', { class: 'tr-i lock', 'aria-disabled': 'true' }, ...corpo);
  };
  host.replaceChildren(banner('Trilha', 'aprender e tocar, passo a passo'), h('div', { class: 'tr pad-x' },
    h('p', { class: 'tr-sub' }, `${p.feitos} de ${p.total} passos · cada passo abre quando você termina o anterior. Os outros jogos ficam no Modo Livre, sem ordem.`),
    h('div', { class: 'tr-list' }, ...e.map(item)),
    h('a', { class: 'btn ghost small', href: '#/jogos' }, '‹ voltar aos jogos')));
  return () => {};
}
