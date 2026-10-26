// Menu ☰: todas as atividades num lugar só (abre da esquerda). Mesmo catálogo dos atalhos + o Meu Kit.
import { h, icon, reducedMotion } from '../util.js';
import { TABS } from './kit.js';

const SECTIONS = [
  ['tocar e estudar', [['#/plano', 'study', 'Plano de Estudo'], ['#/repertorio', 'note', 'Repertório'], ['#/beatlab', 'kit', 'Beat Lab'], ['#/partitura', 'staff', 'Montar Partitura'], ['#/toque', 'kit', 'Bateria de Toque'], ['#/kids', 'kit', 'Beaterista Kids'], ['#/ouvido', 'mic', 'Estúdio de Ouvido'], ['#/tempo', 'timer', 'Juiz de Tempo'], ['#/tempo/transcritor', 'staff', 'Transcritor de Ritmo'], ['#/tempo/raiox', 'timer', 'Raio-x do Groove'], ['#/metronomo', 'metro', 'Metrônomo'], ['#/acentuacao', 'staff', 'Acentuação 4×4'], ['#/rudimentos', 'drummer', 'Rudimentos'], ['#/treinos', 'study', 'Treinos de Leitura e Escuta'], ['#/foco', 'timer', 'Cronômetro de Foco'], ['#/ambiente', 'mic', 'Estúdio de Ambiente'], ['#/bateristas', 'drummer', 'Bateristas & Links'], ['#/estudos', 'study', 'Meus Estudos'], ['cartas/', 'staff', 'Cartas de Groove']]],
  ['organizar', [['#/inicio', 'home', 'Início'], ['#/beaterista', 'drummer', 'Alunos'], ['#/planos', 'study', 'Planos dos Alunos'], ['#/setlist', 'note', 'Setlist'], ['#/ideias', 'bulb', 'Caixa de Ideias'], ['#/arquivos', 'folder', 'Meus Arquivos'], ['#/checklist', 'check', 'Checklist'], ['#/notas', 'note', 'Não Esquecer'], ['#/favoritos', 'star', 'Favoritos'], ['#/mural', 'photo', 'Mural de Artistas']]],
  ['conteúdo', [['#/feed', 'mural', 'Feed Beaterista'], ['#/feed/colagens', 'photo', 'Colagens']]],
  ['meu kit', TABS.map(([k, t, ic]) => [`#/kit/${k}`, ic, k === 'fotos' ? 'Fotos profissionais' : t])],
  ['', [['#/ajustes', 'gear', 'Ajustes e backup']]],
];

export function openMenu() {
  if (document.querySelector('.drawer')) return;
  const here = location.hash || '#/inicio';
  const back = h('div', { class: 'drawer-back' });
  const close = () => {
    document.removeEventListener('keydown', onKey);
    back.classList.add('out'); setTimeout(() => back.remove(), reducedMotion() ? 0 : 200);
    btn && btn.focus && btn.focus();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const btn = document.activeElement;
  const panel = h('nav', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
    h('div', { class: 'drawer-head' }, h('img', { src: 'assets/icons/tambor-96.png', alt: '', width: 36, height: 36 }), h('strong', {}, 'Beaterista'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar menu', onclick: close }, icon('x', 22))),
    ...SECTIONS.map(([title, items]) => h('section', { class: 'drawer-sec' }, title ? h('h2', {}, title) : null,
      ...items.map(([href, ic, label]) => h('a', { href, class: `drawer-item${here === href ? ' on' : ''}`, 'aria-current': here === href ? 'page' : null, onclick: close }, icon(ic, 22), h('span', {}, label))))));
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  // arrastar pra esquerda fecha
  let x0 = null;
  panel.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', (e) => { if (x0 != null && x0 - e.changedTouches[0].clientX > 60) close(); x0 = null; }, { passive: true });
  document.addEventListener('keydown', onKey);
  back.append(panel); document.getElementById('overlay').append(back);
  panel.querySelector('.drawer-item.on, .drawer-item').focus({ preventScroll: true });
}
