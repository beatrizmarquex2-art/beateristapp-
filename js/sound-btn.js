// Alto-falante no topo: liga/desliga o som do app inteiro (fica salvo no aparelho).
import { h, icon } from './util.js';
import { isMuted, setMuted } from './audio.js';
import { musicaLigada, setMusica, fixarMusica } from './jogos/musica.js';

export function soundButton() {
  const b = h('button', { type: 'button', class: 'icon-btn top-snd', onclick: () => { fixarMusica(); setMuted(!isMuted()); } }); // os efeitos (e o som das telas) mudam; a música tem o botão dela
  const paint = () => {
    const m = isMuted(); b.replaceChildren(icon(m ? 'mute' : 'volume', 22));
    b.setAttribute('aria-label', m ? 'Sons e efeitos desligados: toque para ligar' : 'Sons e efeitos ligados: toque para desligar'); b.title = m ? 'efeitos desligados' : 'efeitos ligados'; b.setAttribute('aria-pressed', String(!m));
  };
  paint(); window.addEventListener('bt-mute', paint);
  return b;
}

/** Botão da MÚSICA de fundo dos jogos (♪), ao lado do alto-falante: vale em todos os jogos e fica salvo no aparelho. */
export function musicButton(cls = 'icon-btn top-snd top-mus') {
  const b = h('button', { type: 'button', class: cls, onclick: () => setMusica(!musicaLigada()) });
  const paint = () => { const on = musicaLigada(); b.replaceChildren(h('span', { class: `mus-ico${on ? '' : ' off'}`, 'aria-hidden': 'true' }, '♪')); b.setAttribute('aria-label', on ? 'Música ligada: toque para desligar' : 'Música desligada: toque para ligar'); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'música ligada' : 'música desligada'; };
  paint(); window.addEventListener('bt-musica', paint); window.addEventListener('bt-mute', paint);
  return b;
}
