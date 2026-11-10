// Beaterista Jogos (ver como os alunos veem): mostra o site dos alunos dentro do app da Bea.
// O site fica em outro endereço, então tem armazenamento próprio: nada do app da Bea vaza pra lá e o que você fizer aqui não mexe nos dados dela.
import { h } from '../util.js';
import { banner } from '../ui.js';

export const SITE_ALUNOS = 'https://jogos.beaterista.com.br/';

export function mount(host) {
  const frame = h('iframe', {
    class: 'ja-frame', src: SITE_ALUNOS, title: 'Beaterista Jogos (como os alunos veem)', loading: 'eager',
    allow: 'microphone; fullscreen', referrerpolicy: 'no-referrer',
    style: 'width:100%;height:calc(100dvh - 190px);min-height:480px;border:2px solid currentColor;border-radius:14px;background:#fff',
  });
  host.append(banner('Beaterista Jogos', 'é assim que os alunos veem'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:10px' },
      h('div', { class: 'row' },
        h('a', { class: 'btn small', href: SITE_ALUNOS, target: '_blank', rel: 'noopener noreferrer' }, 'abrir em outra aba'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { frame.src = SITE_ALUNOS; } }, 'recarregar')),
      frame,
      h('p', { class: 'muted' }, 'se ficar em branco, toque em "abrir em outra aba". aqui você entra como aluno (sem código, ou com o seu: BEA-0404).')));
  return () => {};
}
