// Vitrine dos jogos que ensinam de verdade (#/premium, aberta pra todo mundo): a criança vê por dentro de cada um (telas, o que faz, o que desenvolve e, quando a Bea
// grava, o vídeo funcionando) SEM jogar. O jogo em si abre com o código de aluno. Textos e imagens em js/previas.js e assets/previa/.
import { h } from '../util.js';
import { banner } from '../ui.js';
import { PREMIUM, previa, dadosDaPrevia, tituloDaPrevia } from '../previas.js';

const cta = () => h('section', { class: 'card pad pm-cta', role: 'note' }, h('b', {}, 'quer jogar de verdade?'), h('p', {}, 'esses jogos abrem com o código de aluno. com ele você também joga com amigos, em sala, e usa todos os instrumentos do Palco.'), h('a', { class: 'btn primary wide', href: '#/lojinha' }, 'gerar meu código'));

export function mount(view, parts = []) {
  const k = parts[0] && PREMIUM.includes(parts[0]) ? parts[0] : null;
  if (k) {
    view.append(banner(tituloDaPrevia(k), 'veja como funciona por dentro'), previa(k), h('div', { class: 'pad-x pm-vol' }, cta(), h('a', { class: 'btn small ghost', href: '#/premium' }, '‹ todos os jogos que ensinam')));
    return () => {};
  }
  const cards = PREMIUM.map((id) => { const d = dadosDaPrevia(id); if (!d) return null; const img = d.imgs[0][0];
    return h('a', { class: 'pm-card', href: `#/premium/${id}`, 'aria-label': `${d.titulo}: ver por dentro` },
      h('img', { src: `assets/previa/${img}.webp`, alt: '', loading: 'lazy', width: 300, height: 520, draggable: 'false' }),
      h('span', { class: 'pm-tx' }, h('b', {}, d.titulo), h('small', {}, d.frase), h('em', {}, 'ver por dentro ▶'))); }).filter(Boolean);
  view.append(banner('Jogos que ensinam', 'veja por dentro antes de ter o código'),
    h('div', { class: 'pad-x pm-vol' },
      h('section', { class: 'card pad pm-intro' }, h('p', {}, 'estes jogos são de estudar de verdade: o Toca Aqui escuta você tocar pelo microfone, o pauLta ensina a ler partitura e os outros treinam ouvido, ritmo e figuras. por isso abrem só com o código de aluno.'), h('p', { class: 'muted' }, 'toque em um pra ver as telas e o que ele ensina. aqui ninguém joga: é só pra conhecer.')),
      h('div', { class: 'pm-grade' }, ...cards), cta()));
  return () => {};
}
