// Prévia dos jogos que ensinam de verdade (trancados sem código): a aluna vê como é por dentro (telas reais, o que faz, o que desenvolve)
// e depois o caminho pra liberar. Imagens em assets/previa/ (telas do próprio jogo, 300 px). Textos tirados do que o jogo mostra e do relatório "Jogos Ensinam".
import { h } from './util.js';

const IMG = 'assets/previa/';
const PREVIAS = {
  ritmo: { titulo: 'Beat Hero', frase: 'toque no tempo certo em músicas de verdade',
    sobre: 'Toque no tempo certo em músicas e fases (Ritmo/Melodia, Piano Tiles, Setinhas e Figuras), com pontos, combo, XP e ranking.',
    faz: ['escolha a música e o andamento', 'toque nas peças quando as notas chegarem na linha', 'veja seus pontos, combo e precisão na hora'],
    desenvolve: ['coordenação motora e precisão de tempo', 'atenção e tempo de reação', 'percepção de pulso e andamento'],
    imgs: [['ritmo-1', 'escolha a música'], ['ritmo-3', 'as notas descem: toque no tempo']] },
  paulta: { titulo: 'pauLta', frase: 'leitura musical por mundos e fases',
    sobre: 'Leitura musical: escolha um mundo (Bateria, Clave de Sol, Clave de Fá e o Duelo das Claves), cumpra as fases e ganhe pontos com o Paul.',
    faz: ['escolha um mundo e siga o caminho das fases', 'leia a nota ou a peça na pauta e responda', 'junte pontos e destrave as próximas fases'],
    desenvolve: ['leitura de partitura da bateria', 'notas nas claves de sol e de fá', 'persistência: uma fase de cada vez'],
    imgs: [['paulta-1', 'os mundos'], ['paulta-2', 'o caminho das fases']] },
  toca: { titulo: 'Toca Aqui', frase: 'leia, ouça e toque no tempo',
    sobre: 'Leia a figura na pauta e toque no tempo. Ouça antes ou vá direto pra sua vez, escolha o andamento (BPM), o som e toque na tela ou no microfone.',
    faz: ['veja o ritmo escrito na pauta', 'ouça o Paul tocar e depois repita', 'toque na tela ou no microfone, em 8 exercícios por nível'],
    desenvolve: ['leitura de figuras rítmicas', 'memória rítmica (ouvir e repetir)', 'tocar no tempo, devagar ou rápido'],
    imgs: [['toca-1', 'escolha o jeito e o andamento'], ['toca-2', 'o ritmo na pauta e a sua vez']] },
  cartas: { titulo: 'Uno Musical', frase: 'jogo de cartas com as figuras rítmicas',
    sobre: 'Jogue a carta da mesma cor ou da mesma figura. Reconhecer as figuras é o segredo! Contra o computador, no mesmo aparelho ou em 2 celulares.',
    faz: ['aprenda as 10 figuras e pausas', 'jogue a carta da mesma cor ou figura', 'esqueceu de avisar o UNO? compra 2'],
    desenvolve: ['soma e comparação de durações', 'planejamento e tomada de decisão', 'atenção às regras'],
    imgs: [['cartas-1', 'as figuras do jogo'], ['cartas-2', 'a mesa de jogo']] },
};

/** Qual prévia vale pra esta rota (ou null). */
export function previaDaRota(r) {
  if (r.name === 'ritmo') return 'ritmo';
  if (r.name === 'paulta') return 'paulta';
  if (r.name === 'jogos' && r.parts[0] === 'toca') return 'toca';
  if (r.name === 'jogos' && r.parts[0] === 'cartas') return 'cartas';
  return null;
}
export const tituloDaPrevia = (k) => (PREVIAS[k] ? PREVIAS[k].titulo : '');

/** A prévia em si: galeria das telas, o que é, o que você faz e o que desenvolve. */
export function previa(k) {
  const p = PREVIAS[k]; if (!p) return null;
  return h('section', { class: 'pv', 'aria-label': `Prévia: ${p.titulo}` },
    h('p', { class: 'pv-tag' }, 'dá uma olhada por dentro'),
    h('div', { class: 'pv-gal', role: 'group', 'aria-label': 'Telas do jogo' }, ...p.imgs.map(([f, leg]) => h('figure', { class: 'pv-fig' }, h('img', { src: `${IMG}${f}.webp`, alt: `${p.titulo}: ${leg}`, loading: 'lazy', draggable: 'false' }), h('figcaption', {}, leg)))),
    h('div', { class: 'card pad pv-txt' }, h('h2', { class: 'tag' }, p.titulo), h('p', {}, p.sobre),
      h('b', {}, 'o que você faz'), h('ul', {}, ...p.faz.map((x) => h('li', {}, x))),
      h('b', {}, 'o que desenvolve'), h('ul', {}, ...p.desenvolve.map((x) => h('li', {}, x)))));
}
