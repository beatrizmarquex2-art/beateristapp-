// Estúdio de criação: o que já funciona abre; o que ainda está sendo construído aparece como "em construção", sem botão de enfeite.
import { h } from './ui.js';
const PRONTO = [
  ['#/editor', 'Partitura de teclado', 'Pauta com clave, notas coloridas, microfone, correção, PDF e pasta online.', 'teclado'],
  ['#/editor/violao', 'Tablatura de violão', 'Braço desenhado, acordes, microfone que escreve a casa que você toca.', 'violão'],
  ['#/editor/guitarra', 'Tablatura de guitarra', '6, 7 ou 8 cordas.', 'guitarra'],
  ['#/editor/baixo', 'Tablatura de baixo', '4, 5 ou 6 cordas.', 'baixo'],
  ['#/transcrever', 'Áudio → partitura', 'Suba um áudio ou vídeo: o app sugere a bateria, a melodia ou os acordes e abre no editor pra você corrigir.', 'novo'],
  ['#/editor/bateria', 'Pauta de bateria', 'Três kits, mão D/E, acento, nota fantasma e peças ao mesmo tempo.', 'bateria'],
];
const DEPOIS = [['Figuras rítmicas sem pauta', 'próximo'], ['Pauta comum e cifras para violão', 'próximo'], ['Gerador de apostilas', 'em construção'], ['Jogos musicais personalizados', 'em construção'], ['Flashcards e avaliações', 'em construção'], ['Atividades para colorir', 'em construção']];
export function mount(host) {
  host.append(h('div', { class: 'pt' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Estúdio de criação'), h('h1', {}, 'Crie o material da sua aula'))),
    h('section', {}, h('h2', { class: 'pt-s' }, 'Disponível agora'), h('ul', { class: 'pt-lista' }, ...PRONTO.map(([href, t, x, tag]) => h('li', {}, h('a', { href }, h('b', {}, t), h('span', {}, x), h('em', {}, tag)))))),
    h('section', {}, h('h2', { class: 'pt-s' }, 'A caminho'), h('ul', { class: 'pe-rota' }, ...DEPOIS.map(([t, s]) => h('li', {}, h('span', {}, t), h('em', {}, s)))))));
  return () => {};
}
