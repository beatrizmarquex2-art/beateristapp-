// Alto-falante no topo: liga/desliga o som do app inteiro (fica salvo no aparelho).
import { h, icon } from './util.js';
import { isMuted, setMuted, misturaLigada, setMistura } from './audio.js';
import { musicaLigada, setMusica, fixarMusica } from './jogos/musica.js';
import { iconeTopo } from './top-icons.js';

/** `linha`: ícones de linha do topo dos alunos (opção A). Sem `linha` fica como sempre (app da Bea). */
export function soundButton({ linha = false } = {}) {
  const b = h('button', { type: 'button', class: 'icon-btn top-snd', onclick: () => { fixarMusica(); setMuted(!isMuted()); } }); // os efeitos (e o som das telas) mudam; a música tem o botão dela
  const paint = () => {
    const m = isMuted(); b.replaceChildren(linha ? iconeTopo(m ? 'somOff' : 'som') : icon(m ? 'mute' : 'volume', 22));
    b.setAttribute('aria-label', m ? 'Sons e efeitos desligados: toque para ligar' : 'Sons e efeitos ligados: toque para desligar'); b.title = m ? 'efeitos desligados' : 'efeitos ligados'; b.setAttribute('aria-pressed', String(!m));
  };
  paint(); window.addEventListener('bt-mute', paint);
  return b;
}

/** Botão da MÚSICA de fundo dos jogos (♪), ao lado do alto-falante: vale em todos os jogos e fica salvo no aparelho. */
export function musicButton(cls = 'icon-btn top-snd top-mus', { linha = false } = {}) {
  const b = h('button', { type: 'button', class: cls, onclick: () => setMusica(!musicaLigada()) });
  const paint = () => { const on = musicaLigada(); b.replaceChildren(linha ? iconeTopo(on ? 'musica' : 'musicaOff') : h('span', { class: `mus-ico${on ? '' : ' off'}`, 'aria-hidden': 'true' }, '♪')); b.setAttribute('aria-label', on ? 'Música ligada: toque para desligar' : 'Música desligada: toque para ligar'); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'música ligada' : 'música desligada'; };
  paint(); window.addEventListener('bt-musica', paint); window.addEventListener('bt-mute', paint);
  return b;
}

/** Opção "misturar com meu Spotify" (ajustes): o som do app toca junto com Spotify, YouTube, Apple Music, áudio do WhatsApp… sem pausar. Fica salvo no aparelho. */
export function misturaOption(cls = 'btn wide') {
  const b = h('button', { type: 'button', class: cls, onclick: () => setMistura(!misturaLigada()) });
  const paint = () => { const on = misturaLigada(); b.replaceChildren(on ? '🎧 misturando com o meu Spotify e outros apps (ligado)' : '🎧 misturar com o meu Spotify e outros apps'); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('primary', on); };
  paint(); window.addEventListener('bt-mistura', paint);
  return b;
}
export const MISTURA_AJUDA = 'Com isso ligado o som do app toca JUNTO com o que já está tocando no celular (Spotify, YouTube, Apple Music, áudio do WhatsApp…), sem pausar. Atenção: nesse modo o app fica mudo se o botão de silencioso do iPhone estiver ligado. Ligação e microfone aberto continuam passando na frente.';
