// Toca Aqui: o jogo de ler a figura rítmica e tocar no tempo. Duas versões na mesma tela:
//  • versão com imagens: cada tempo é uma palavrinha com imagem (pão, bolo, braço…): monte e toque (BPM ajustável).
//  • versão normal (figuras): a pauta de verdade (níveis 1 a 3): ouvir e/ou tocar direto, cada toque soa e volta pintado.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { mountRitmo } from '../kids/ritmo.js';
import { leitura } from '../views/treinos.js';

const VERSIONS = [['normal', 'versão normal (figuras)'], ['kids', 'versão com imagens']];

export function mount(host) {
  const saved = getGame('toca');
  let ver = VERSIONS.some((v) => v[0] === saved.ver) ? saved.ver : 'normal';
  let off = null; let gone = false;
  const root = h('div', { class: 'jg jg-toca' }); host.replaceChildren(root);
  const stage = h('div', { class: 'jg-toca-stage' });
  const draw = () => {
    if (off) { off(); off = null; }
    root.replaceChildren(
      h('h2', { class: 'jg-h hand' }, 'toca aqui'),
      h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': 'versão' }, ...VERSIONS.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(ver === v), class: ver === v ? 'on' : '', onclick: () => { ver = v; setGame('toca', { ver }); draw(); } }, l))),
      h('p', { class: 'jg-p' }, ver === 'kids' ? 'cada tempo é uma palavrinha com imagem: monte o ritmo, ouça e toque. escolha o BPM.' : 'leia a figura na pauta e toque no tempo. ouça antes ou vá direto pra sua vez. escolha o BPM.'),
      stage);
    stage.replaceChildren();
    if (ver === 'kids') { const box = h('div', { class: 'kx-arc kx-embed kd-game' }); stage.append(box); off = mountRitmo(box); }
    else off = leitura(stage);
  };
  draw();
  return {
    inProgress: () => false,
    restart: () => { if (!gone) draw(); },
    destroy() { gone = true; if (off) off(); off = null; },
  };
}
