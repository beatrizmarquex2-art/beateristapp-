// Toca Aqui: o jogo de ler a figura rítmica e tocar no tempo. Três versões na mesma tela:
//  • versão com imagens: cada tempo é uma palavrinha com imagem (pão, bolo, braço…): monte e toque (BPM ajustável).
//  • versão normal (figuras): a pauta de verdade (níveis 1 a 3): ouvir e/ou tocar direto, cada toque soa e volta pintado.
//  • figuras rítmicas: o jogo de fases (semibreve, mínima, colcheia…) que antes ficava solto na lista de jogos; abre pelo mesmo caminho de sempre (#/kids/figuras).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { mountRitmo } from '../kids/ritmo.js';
import { leitura } from '../views/treinos.js';
import * as AC from '../acesso.js';

const VERSIONS = [['normal', 'normal (figuras)'], ['kids', 'com imagens'], ['fases', 'figuras rítmicas']];

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
      h('p', { class: 'jg-p' }, ver === 'kids' ? 'cada tempo é uma palavrinha com imagem: monte o ritmo, ouça e toque. escolha o andamento (BPM).' : ver === 'fases' ? 'o jogo de fases das figuras rítmicas, agora aqui dentro do Toca Aqui.' : 'leia a figura na pauta e toque no tempo. ouça antes ou vá direto pra sua vez. escolha o BPM.'),
      stage);
    stage.replaceChildren();
    if (ver === 'fases') {
      const lk = AC.trancado('#/kids/figuras');
      stage.append(h('div', { class: 'card pad al-card jg-fases' }, h('h2', { class: 'tag' }, lk ? '🔒 figuras rítmicas' : 'figuras rítmicas'), h('p', { class: 'muted' }, 'o jogo de fases: semibreve, mínima, semínima, colcheia… leia, monte e toque cada figura. cada fase vale até 3 estrelas.'),
        lk ? h('p', { class: 'muted' }, 'as fases e estrelas precisam do código da professora. a aulinha do Paul e o Toca Aqui acima continuam abertos pra treinar.') : null,
        h('a', { class: 'btn primary wide', href: '#/kids/figuras' }, lk ? 'abrir (pede o código)' : 'jogar as fases'), h('a', { class: 'btn wide', href: '#/kids/figuras/aula' }, '📖 aulinha do Paul')));
    } else if (ver === 'kids') { const box = h('div', { class: 'kx-arc kx-embed kd-game' }); stage.append(box); off = mountRitmo(box); }
    else if (ver === 'normal') off = leitura(stage);
  };
  draw();
  return {
    inProgress: () => false,
    restart: () => { if (!gone) draw(); },
    destroy() { gone = true; if (off) off(); off = null; },
  };
}
