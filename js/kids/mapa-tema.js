// Arte dos mapas (pacote "beaterista-mapas" da Bea): fundo de cada mundo + moldura circular colorida.
// Só pinta o corredor que o mapa já montou (assets/mapas/mundos.js · css/mundos.css): fases, posições, nomes de regiões, cliques e progresso ficam do jeito que estão.
import { aplicarTema, mundos } from '../../assets/mapas/mundos.js';

/** gameId do mapa → id do tema no pacote. (Detetive: 3 mundos, m1 m2 m3. Camarim e Palco da Fuga pegam estúdio e pôr do sol.) */
export const TEMA_BEAT = {
  'toca-ini': 'toca-1-geleira', 'toca-int': 'toca-2-estudio', 'toca-ava': 'toca-3-por-do-sol',
  'detetive-m1': 'detetive-1-espaco', 'detetive-m2': 'detetive-2-floresta', 'detetive-m3': 'detetive-3-vulcao',
  'figurix-floresta': 'figurix-1-floresta', 'figurix-deserto': 'figurix-2-deserto', 'figurix-mar': 'figurix-3-mar', 'figurix-espaco': 'figurix-4-espaco',
  'paulta-drumF': 'paulta-1-selva', 'paulta-drumI': 'paulta-2-deserto', 'paulta-drumD': 'paulta-3-vulcao', 'paulta-sol': 'paulta-4-clave-de-sol', 'paulta-fa': 'paulta-5-clave-de-fa', 'paulta-duel': 'paulta-6-duelo',
  'fuga-estudio': 'fuga-1-estudio', 'fuga-vulcao': 'toca-2-estudio', 'fuga-espaco': 'toca-3-por-do-sol',
  groove: 'groove-eco-de-groove', rudimentos: 'rudimentix',
};

/** Pinta o corredor `world` do mapa (e as regiões dele). Devolve a função que desfaz a moldura do topo. */
export function temaDoMapa(world, gameId) {
  const id = TEMA_BEAT[gameId]; if (!id || !mundos[id]) return () => {};
  try {
    world.querySelectorAll('.mp-band').forEach((b) => b.setAttribute('data-beat-regiao', ''));
    const moldTopo = document.querySelector('.top-av-wrap .top-mold'); const aro = { ...mundos[id] }; let volta = () => {};
    if (moldTopo && moldTopo.hidden) { // o avatar do topo já existe: só ganha o aro do mundo se o aluno não escolheu uma moldura do perfil
      const antes = moldTopo.getAttribute('src');
      const fake = document.createElement('span'); aplicarTema(world, id, fake); // define --beat-cenario/--beat-cor; o aro é lido do `fake`
      const url = fake.style.getPropertyValue('--beat-aro'); const mat = fake.style.getPropertyValue('--beat-matiz');
      const src = (/url\("(.*)"\)/.exec(url) || [])[1];
      if (src) { moldTopo.src = src; moldTopo.hidden = false; moldTopo.dataset.aro = aro.aro; moldTopo.style.filter = `hue-rotate(${mat})`; if (aro.aro === 'dourado') moldTopo.style.mixBlendMode = 'multiply'; moldTopo.classList.add('mapa-aro');
        volta = () => { moldTopo.classList.remove('mapa-aro'); moldTopo.hidden = true; moldTopo.style.filter = ''; moldTopo.style.mixBlendMode = ''; delete moldTopo.dataset.aro; if (antes != null) moldTopo.setAttribute('src', antes); else moldTopo.removeAttribute('src'); }; }
    } else aplicarTema(world, id);
    return volta;
  } catch { return () => {}; }
}
