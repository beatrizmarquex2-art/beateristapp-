// Peças comuns das telas da aba Tocar: as 4 abas de instrumento (bateria, violão, piano, xilofone) e a batida de fundo.
import { h } from '../util.js';
import { audio, click } from '../audio.js';
import { backing, wake } from '../instruments.js';
import { UTIL_DOODLE } from './tocar-art.js';

export const INSTRUMENTOS = [['toque', 'bateria', '#/toque'], ['violao', 'cordas', '#/violao'], ['piano', 'teclas', '#/piano'], ['xilofone', 'percussão', '#/xilofone']];
/** Útil (pra todo mundo): metrônomo, afinador e timer. */
export const UTEIS = [['metronomo', 'metrônomo', '#/metronomo'], ['ouvido', 'afinador', '#/ouvido'], ['foco', 'cronômetro', '#/foco']];
const FOTO = (n) => `<img src="assets/tocar/${n}.webp" alt="" draggable="false" decoding="async">`;
const UART = { metronomo: UTIL_DOODLE.metronomo, ouvido: UTIL_DOODLE.afinador, foco: FOTO('cronometro') }; // metrônomo e diapasão: giz de cera; cronômetro: figurinha da Beaterista
/** Três quadradinhos com desenho: metrônomo, afinador e cronômetro (o nome da seção vai por cima). `big` = versão grande da tela Tocar. */
export function utilTiles(big = false) {
  return h('nav', { class: `ti-util${big ? ' big' : ''}`, 'aria-label': 'Útil' }, h('span', { class: 'ti-util-l' }, 'útil'),
    h('div', { class: 'ti-util-g' }, ...UTEIS.map(([id, label, href]) => { const art = h('span', { class: 'ti-ut-art' }); art.innerHTML = UART[id]; return h('a', { href, class: `ti-ut ti-ut-${id}` }, art, h('b', {}, label)); })));
}

/** Linha de abas logo abaixo da faixa: troca de instrumento sem voltar ao menu (a batida de fundo continua). */
export const tocarTabs = (atual) => h('div', { class: 'ti-wrap' },
  h('nav', { class: 'ti-tabs', 'aria-label': 'Instrumento' },
    ...INSTRUMENTOS.map(([id, label, href]) => h('a', { href, class: `ti-tab${id === atual ? ' on' : ''}`, 'aria-current': id === atual ? 'page' : null, onpointerdown: wake }, label))),
  utilTiles());

/** Contagem (em vez do metrônomo): um botão que conta 4 tempos no andamento escolhido e aí você começa a tocar. Vale pra bateria, cordas, teclas e percussão. */
export function contagemBar() {
  const bpm = h('output', { class: 'bl-bpm' }, String(backing.bpm));
  const num = h('output', { class: 'ct-num', role: 'status', 'aria-live': 'polite' }, '');
  const go = h('button', { class: 'btn primary ti-go ct-go', type: 'button' }, '🥁 contagem');
  let timers = []; let rodando = false;
  const parar = () => { timers.forEach(clearTimeout); timers = []; rodando = false; go.textContent = '🥁 contagem'; };
  const contar = () => {
    if (rodando) { parar(); num.textContent = ''; return; }
    const ac = audio(); const q = 60 / backing.bpm; const t0 = ac.currentTime + 0.15; rodando = true; go.textContent = '■ parar a contagem';
    for (let i = 0; i < 4; i++) { click(t0 + i * q, i === 0 ? 2 : 1, 0.8); timers.push(setTimeout(() => { if (go.isConnected) num.textContent = String(i + 1); }, (0.15 + i * q) * 1000)); }
    timers.push(setTimeout(() => { if (go.isConnected) num.textContent = 'vai!'; }, (0.15 + 4 * q) * 1000));
    timers.push(setTimeout(() => { parar(); if (go.isConnected) setTimeout(() => { if (!rodando) num.textContent = ''; }, 900); }, (0.15 + 4 * q + 0.1) * 1000));
  };
  go.addEventListener('click', contar);
  const step = (d) => { backing.bpm = Math.max(60, Math.min(160, backing.bpm + d)); backing.save(); bpm.textContent = String(backing.bpm); };
  return h('section', { class: 'card pad ti-backing ti-conta' },
    h('div', { class: 'row tk-line' }, go, num),
    h('div', { class: 'bl-tempo' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => step(-5) }, '−'), bpm,
      h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => step(5) }, '+'), h('span', { class: 'tp-lab' }, 'BPM')),
    h('p', { class: 'muted ti-hint' }, 'toca em “contagem”: ela conta 4 tempos e aí você começa a tocar, sem metrônomo ligado.'));
}
