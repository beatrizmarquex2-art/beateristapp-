// Placar de fim de jogo (desenho aprovado pela Bea em 14/nov/2026): cartão azul com borda amarela, o Paul colorido em cima,
// quadros com os números e um botão amarelo grande. Vale pra todos os jogos de mesa.
// placar({ classe, estado: 'win'|'lose'|'tie', pose, titulo, sub, quadros: [{ n, l, win }], estrelas, extra: [nós], acoes: [nós] })
import { h } from '../util.js';
import { POSES, corSrc } from '../paul-cor.js';

/** Primeira pose da lista que existe no app (as novas entram sozinhas quando chegarem em `POSES`). */
export const poseDisponivel = (...nomes) => nomes.find((n) => POSES.includes(n)) || 'ouvindo';

export function placar({ classe = '', estado = '', pose = 'ouvindo', titulo = '', sub = '', quadros = [], estrelas = '', extra = [], acoes = [] } = {}) {
  const img = h('img', { class: 'pl-paul', src: corSrc(pose), alt: '', 'aria-hidden': 'true', draggable: 'false' });
  img.onerror = () => { img.onerror = null; img.style.visibility = 'hidden'; };
  const qs = quadros.filter(Boolean);
  const btns = acoes.filter(Boolean);
  return h('div', { class: `pl-card ${estado} ${classe}`.trim(), role: 'status' }, ...[img,
    h('h3', { class: 'hand' }, titulo),
    sub ? h('p', { class: 'pl-sub' }, sub) : null,
    qs.length ? h('div', { class: 'pl-q' }, ...qs.map((q) => h('div', { class: q.win ? 'w' : '' }, h('b', { class: String(q.n).length > 3 ? 'm' : '' }, String(q.n)), h('small', {}, q.l)))) : null,
    estrelas ? h('p', { class: 'pl-st' }, estrelas) : null,
    ...extra.filter(Boolean),
    btns.length ? h('div', { class: 'jg-actions pl-act' }, ...btns) : null].filter(Boolean));
}
