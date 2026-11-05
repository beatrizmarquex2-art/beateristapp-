// Quais jogos têm Modo Aventura. Cada um carrega só quando é aberto: { spec, mount(body, opts) → { destroy, inProgress? } }.
export const LOADERS = {
  cartas: () => import('./jogos/cartas.js'),
  bingo: () => import('./jogos/bingo.js'),
  stop: () => import('./jogos/stop.js'),
  velha: () => import('./jogos/velha.js'),
  quebra: () => import('./jogos/quebra.js'),
  cara: () => import('./jogos/cara.js'),
  memoria: () => import('./jogos/memoria.js'),
  monte: () => import('./jogos/monte.js'),
  noritmo: () => import('./jogos/noritmo.js'),
  toca: () => import('./jogos/toca.js'),
};
export const hasAdventure = (id) => !!LOADERS[id];
export const loadAdventure = async (id) => { const m = await LOADERS[id](); return m.default || m; };
