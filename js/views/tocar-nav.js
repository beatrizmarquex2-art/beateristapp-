// Peças comuns das telas da aba Tocar: as 4 abas de instrumento (bateria, violão, piano, xilofone) e a batida de fundo.
import { h } from '../util.js';
import { audio } from '../audio.js';
import * as N from '../notation.js';
import { backing, STYLES, grooveBeat, wake } from '../instruments.js';

export const INSTRUMENTOS = [['toque', 'bateria', '#/toque'], ['violao', 'cordas', '#/violao'], ['piano', 'teclas', '#/piano'], ['xilofone', 'percussão', '#/xilofone']];
/** Útil (pra todo mundo): metrônomo, afinador e timer. */
export const UTEIS = [['metronomo', 'metrônomo', '#/metronomo'], ['ouvido', 'afinador', '#/ouvido'], ['foco', 'timer', '#/foco']];

/** Linha de abas logo abaixo da faixa: troca de instrumento sem voltar ao menu (a batida de fundo continua). */
export const tocarTabs = (atual) => h('div', { class: 'ti-wrap' },
  h('nav', { class: 'ti-tabs', 'aria-label': 'Instrumento' },
    ...INSTRUMENTOS.map(([id, label, href]) => h('a', { href, class: `ti-tab${id === atual ? ' on' : ''}`, 'aria-current': id === atual ? 'page' : null, onpointerdown: wake }, label))),
  h('nav', { class: 'ti-util', 'aria-label': 'Útil' }, h('span', { class: 'ti-util-l' }, 'útil'),
    ...UTEIS.map(([id, label, href]) => h('a', { href, class: 'ti-util-a' }, label))));

/** Batida de fundo: liga uma base (rock 1, rock 2, pop, samba) pra tocar por cima, com andamento ajustável. */
export function backingBar() {
  const go = h('button', { class: 'btn ti-go', type: 'button', 'aria-pressed': 'false' });
  const styles = h('div', { class: 'ti-styles', role: 'radiogroup', 'aria-label': 'Estilo da batida' });
  const bpm = h('output', { class: 'bl-bpm' }, String(backing.bpm));
  const staff = h('figure', { class: 'cb-bar ti-staff' }); const names = h('ul', { class: 'ti-names' });
  const draw = () => {
    go.setAttribute('aria-pressed', String(backing.on)); go.textContent = backing.on ? '■ parar a batida' : '▶ ligar a batida';
    styles.replaceChildren(...STYLES.map(([v, l]) => h('button', { type: 'button', class: `kd-chip${backing.style === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(backing.style === v), onclick: () => { backing.style = v; backing.save(); draw(); } }, l)));
    bpm.textContent = String(backing.bpm);
    const b = grooveBeat(backing.style); staff.innerHTML = N.toSVG(N.layout(b, { width: 340, full: true, color: true }));
    names.replaceChildren(...N.legend(b).map(([n, c]) => h('li', {}, h('i', { style: `background:${c}` }), n)));
  };
  const step = (d) => { backing.bpm = Math.max(60, Math.min(160, backing.bpm + d)); backing.save(); draw(); };
  go.addEventListener('click', () => { audio(); if (backing.on) backing.stop(); else backing.start(); draw(); });
  draw();
  return h('section', { class: 'card pad ti-backing' },
    h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'batida de fundo'), go),
    styles,
    h('div', { class: 'bl-tempo' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => step(-5) }, '−'), bpm,
      h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => step(5) }, '+'), h('span', { class: 'tp-lab' }, 'BPM')),
    h('p', { class: 'lab ti-lab' }, 'partitura da batida (cada peça tem a sua cor)'), staff, names,
    h('p', { class: 'muted ti-hint' }, 'liga a batida e toca por cima, em qualquer instrumento. ela continua quando você troca de aba.'));
}
