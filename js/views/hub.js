// Páginas "juntas": reúnem ferramentas parecidas num lugar só (Criar ritmos, Tempo, Anotar). As ferramentas continuam as mesmas.
import { h, icon } from '../util.js';
import { banner } from '../ui.js';

export const HUBS = {
  ritmo: { title: 'Criar ritmos', ic: 'kit', blurb: 'montar, tocar e escrever ritmo', items: [
    ['#/beatlab', 'kit', 'Beat Lab', 'monta o ritmo numa grade e escuta'],
    ['#/toque', 'kit', 'Bateria de Toque', 'toca na tela e grava o que você tocou'],
    ['#/ferramentas/groovebox', 'kit', 'Groovebox', 'pads de bateria e percussão'],
    ['#/partitura', 'staff', 'Montar Partitura', 'escreve compasso por compasso'],
  ] },
  tempo: { title: 'Tempo', ic: 'timer', blurb: 'pulso, andamento e precisão', items: [
    ['#/metronomo', 'metro', 'Metrônomo', 'clique, subdivisões e acentos'],
    ['#/tempo', 'timer', 'Juiz de Tempo', 'mede se você toca no tempo'],
    ['#/ferramentas/tap', 'metro', 'Tap tempo', 'descobre o BPM batendo no ritmo'],
    ['#/tempo/raiox', 'timer', 'Raio-x do Groove', 'mostra onde cada batida caiu'],
    ['#/tempo/transcritor', 'staff', 'Transcritor de Ritmo', 'transforma o que você tocou em partitura'],
  ] },
  anotar: { title: 'Anotar', ic: 'note', blurb: 'listas, lembretes e ideias', items: [
    ['#/checklist', 'check', 'Checklist', 'o que fazer hoje'],
    ['#/notas', 'note', 'Não Esquecer', 'recados soltos'],
    ['#/lembretes', 'note', 'Lembretes', 'avisos com data e hora'],
    ['#/ideias', 'bulb', 'Caixa de Ideias', 'ideias de música, aula e negócio'],
    ['#/favoritos', 'star', 'Favoritos', 'o que você marcou com estrela'],
  ] },
};

export function mount(host, parts = []) {
  const hub = HUBS[parts[0]];
  if (!hub) { host.append(banner('Não achei', 'essa página não existe'), h('p', { class: 'pad-x' }, h('a', { class: 'btn', href: '#/inicio' }, 'voltar ao início'))); return () => {}; }
  host.append(banner(hub.title, hub.blurb),
    h('div', { class: 'hub-grid' }, ...hub.items.map(([href, ic, label, desc]) => h('a', { class: 'hub-card', href }, h('span', { class: 'hub-ic' }, icon(ic, 26)), h('b', {}, label), h('small', {}, desc)))));
  return () => {};
}
