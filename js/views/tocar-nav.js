// Peças comuns das telas da aba Tocar: as 4 abas de instrumento (bateria, piano, violão, xilofone) e a batida de fundo.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { backing, STYLES } from '../instruments.js';

export const INSTRUMENTOS = [['toque', 'bateria', '#/toque'], ['piano', 'piano', '#/piano'], ['violao', 'violão', '#/violao'], ['xilofone', 'xilofone', '#/xilofone']];

/** Linha de abas logo abaixo da faixa: troca de instrumento sem voltar ao menu (a batida de fundo continua). */
export const tocarTabs = (atual) => h('nav', { class: 'ti-tabs', 'aria-label': 'Instrumento' },
  ...INSTRUMENTOS.map(([id, label, href]) => h('a', { href, class: `ti-tab${id === atual ? ' on' : ''}`, 'aria-current': id === atual ? 'page' : null }, label)));

/** Batida de fundo: liga uma base (rock, pop, funk, samba) pra tocar por cima, com andamento ajustável. */
export function backingBar() {
  const go = h('button', { class: 'btn ti-go', type: 'button', 'aria-pressed': 'false' });
  const styles = h('div', { class: 'ti-styles', role: 'radiogroup', 'aria-label': 'Estilo da batida' });
  const bpm = h('output', { class: 'bl-bpm' }, String(backing.bpm));
  const draw = () => {
    go.setAttribute('aria-pressed', String(backing.on)); go.textContent = backing.on ? '■ parar a batida' : '▶ ligar a batida';
    styles.replaceChildren(...STYLES.map(([v, l]) => h('button', { type: 'button', class: `kd-chip${backing.style === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(backing.style === v), onclick: () => { backing.style = v; backing.save(); draw(); } }, l)));
    bpm.textContent = String(backing.bpm);
  };
  const step = (d) => { backing.bpm = Math.max(60, Math.min(160, backing.bpm + d)); backing.save(); draw(); };
  go.addEventListener('click', () => { audio(); if (backing.on) backing.stop(); else backing.start(); draw(); });
  draw();
  return h('section', { class: 'card pad ti-backing' },
    h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'batida de fundo'), go),
    styles,
    h('div', { class: 'bl-tempo' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => step(-5) }, '−'), bpm,
      h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => step(5) }, '+'), h('span', { class: 'tp-lab' }, 'BPM')),
    h('p', { class: 'muted ti-hint' }, 'liga a batida e toca por cima, em qualquer instrumento. ela continua quando você troca de aba.'));
}
