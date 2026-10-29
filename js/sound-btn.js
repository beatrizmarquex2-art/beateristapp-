// Alto-falante no topo: liga/desliga o som do app inteiro (fica salvo no aparelho).
import { h, icon } from './util.js';
import { isMuted, setMuted } from './audio.js';

export function soundButton() {
  const b = h('button', { type: 'button', class: 'icon-btn top-snd', onclick: () => setMuted(!isMuted()) });
  const paint = () => {
    const m = isMuted(); b.replaceChildren(icon(m ? 'mute' : 'volume', 22));
    b.setAttribute('aria-label', m ? 'Som desligado: toque para ligar' : 'Som ligado: toque para desligar'); b.setAttribute('aria-pressed', String(!m));
  };
  paint(); window.addEventListener('bt-mute', paint);
  return b;
}
