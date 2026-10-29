// Figuras rítmicas, aba "aprender": o que é cada figura, a pausa dela e quanto vale em tempos (didático, com som).
import { h } from '../util.js';
import { audio, click } from '../audio.js';
import { VOICE } from './beatlab.js';
import { figureMarkup, restMarkup, svgEl } from '../kids/art.js';

const FIGS = [
  { id: 'semibreve', name: 'semibreve', beats: 4, value: '4 tempos', frac: 'o maior valor: dura o compasso inteiro', count: '1 · 2 · 3 · 4 (uma nota só, segura)', per: 1, para: 'segura a nota durante os 4 tempos do compasso.' },
  { id: 'minima', name: 'mínima', beats: 2, value: '2 tempos', frac: 'metade da semibreve', count: '1 · 2 (e depois 3 · 4)', per: 2, para: 'toca no 1 e deixa soar até o 3.' },
  { id: 'seminima', name: 'semínima', beats: 1, value: '1 tempo', frac: 'é o pulso: a figura que a gente bate o pé', count: '1 · 2 · 3 · 4', per: 4, para: 'uma nota em cada número da contagem.' },
  { id: 'colcheia', name: 'colcheia', beats: 0.5, value: 'meio tempo', frac: 'duas colcheias cabem em 1 tempo', count: '1 e 2 e 3 e 4 e', per: 8, para: 'uma nota em cada número e outra em cada “e”.' },
  { id: 'semicolcheia', name: 'semicolcheia', beats: 0.25, value: 'um quarto de tempo', frac: 'quatro semicolcheias cabem em 1 tempo', count: '1 e & a 2 e & a…', per: 16, para: 'quatro notas rápidas dentro de cada tempo.' },
  { id: 'fusa', name: 'fusa', beats: 0.125, value: 'um oitavo de tempo', frac: 'oito fusas cabem em 1 tempo', count: '1 e & a (cada uma divide em 2)', per: 32, para: 'muito rápida: aparece em passagens e rulos.' },
];

/** 60 BPM (1 tempo = 1 segundo). Figura: toca, e a próxima toca depois da duração dela. Pausa: toca, silêncio da duração da figura, toca de novo. */
function hear(f, kind) {
  const c = audio(); const t0 = c.currentTime + 0.1; const d = f.beats; const total = Math.ceil(d * 2 + 1);
  for (let i = 0; i < total; i++) click(t0 + i, i === 0 ? 2 : 1, 0.3);
  VOICE.sn(t0, 0.9); if (kind === 'nota') VOICE.sn(t0 + d, 0.9); VOICE.sn(t0 + d * 2, 0.9);
}

export function aprender(host) {
  const rows = FIGS.map((f) => {
    const note = svgEl(figureMarkup(f.id), 'fa-fig'); const rest = svgEl(restMarkup(f.id), 'fa-fig');
    const bar = h('div', { class: 'fa-bar', 'aria-label': `${f.per} ${f.name}${f.per > 1 ? 's' : ''} cabem em um compasso 4/4` }, ...Array.from({ length: Math.min(f.per, 32) }, () => h('i')));
    return h('article', { class: 'card pad fa-card' },
      h('div', { class: 'fa-head' }, h('div', { class: 'fa-pair' }, h('figure', {}, note, h('figcaption', {}, 'figura')), h('figure', {}, rest, h('figcaption', {}, 'pausa'))),
        h('div', { class: 'fa-info' }, h('h3', {}, f.name), h('p', { class: 'fa-val' }, `vale ${f.value}`), h('p', { class: 'muted' }, f.frac))),
      h('p', {}, h('b', {}, 'pausa de ' + f.name + ': '), `silêncio com a mesma duração (${f.value}). o tempo continua andando, só que sem tocar.`),
      h('p', {}, h('b', {}, 'como contar: '), f.count, ' — ', f.para),
      h('p', { class: 'muted' }, `em um compasso de 4/4 cabem ${f.per} ${f.name}${f.per > 1 ? 's' : ''}:`), bar,
      h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => hear(f, 'nota') }, '▶ ouvir a figura'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => hear(f, 'pausa') }, '🤫 ouvir a pausa')));
  });
  const tree = h('section', { class: 'card pad fa-tree' }, h('h3', {}, 'a árvore das figuras'), h('p', { class: 'muted' }, 'cada linha divide a de cima ao meio: 1 semibreve = 2 mínimas = 4 semínimas = 8 colcheias = 16 semicolcheias.'),
    ...FIGS.slice(0, 5).map((f) => h('div', { class: 'fa-row' }, h('span', {}, f.name), h('div', { class: 'fa-line' }, ...Array.from({ length: f.per }, () => h('i'))))));
  host.append(h('section', { class: 'card pad' }, h('p', {}, 'toda figura tem um valor (quanto tempo dura) e uma pausa (o silêncio do mesmo tamanho). o pulso é a semínima: vale 1 tempo. as outras são frações dele.')), tree, ...rows);
  return () => {};
}
