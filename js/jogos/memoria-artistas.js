// Jogo da memória (entrada única do catálogo de jogos): abre direto na escolha do tema. Temas abertos pra todo mundo: só Percussão e Profissões da música
// (pedido da Bea); The Beatles, Rock, Solo e os outros temas só com código de aluno. Sem modo aventura. Não concede figurinhas nem prêmios.
// O jogo em si é o mesmo dos Kids (js/kids/memoria.js); aqui só entra na moldura da tela de Jogos.
import { h } from '../util.js';
import { mountMemoria } from '../kids/memoria.js';

export function mount(host) {
  const arc = h('div', { class: 'kx-arc kx-embed kd-game' }); host.replaceChildren(arc);
  const stop = mountMemoria(arc, {});
  return { inProgress: () => stop.inProgress(), restart: () => stop.restart(), pause: () => stop.pause(), resume: () => stop.resume(), destroy: () => stop() };
}
