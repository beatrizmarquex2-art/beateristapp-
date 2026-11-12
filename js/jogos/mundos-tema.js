// Temas dos mundos dos jogos de caminhozinho (os mesmos desenhos e cores do Figurix, que a Bea adorou): floresta, deserto, mar, espaço, gelo e vulcão.
// Puro (sem tela): só dados. Os sprites estão em js/kids/mapa-art.js e as cores em css/aventura-tema.css (`.mp[data-theme="mundo-<tema>"]`).
const L = (...a) => a.map(([s, lado, f]) => [s, lado, f]);
/** Dois conjuntos de enfeites por tema (um por região). */
export const DECOR_TEMA = {
  floresta: [L(['tree', 'l', 0.05], ['pine', 'r', 0.1], ['tree', 'r', 0.2], ['bush', 'l', 0.27], ['pine', 'l', 0.36], ['tree', 'r', 0.45], ['flower', 'l', 0.52], ['pine', 'r', 0.6], ['tree', 'l', 0.7], ['bush', 'r', 0.78], ['tree', 'r', 0.86], ['pine', 'l', 0.94]),
    L(['pine', 'l', 0.05], ['tree', 'r', 0.12], ['tree', 'l', 0.2], ['pine', 'r', 0.3], ['bush', 'l', 0.38], ['tree', 'r', 0.47], ['pine', 'l', 0.55], ['flower', 'r', 0.62], ['tree', 'l', 0.7], ['pine', 'r', 0.78], ['tree', 'r', 0.87], ['bush', 'l', 0.94])],
  deserto: [L(['cactus', 'l', 0.06], ['vaso', 'r', 0.14], ['cactus', 'r', 0.25], ['bush', 'l', 0.34], ['cactus', 'l', 0.46], ['vaso', 'r', 0.56], ['cactus', 'r', 0.67], ['bush', 'l', 0.76], ['cactus', 'l', 0.86], ['vaso', 'r', 0.94]),
    L(['vaso', 'l', 0.06], ['cactus', 'r', 0.15], ['cactus', 'l', 0.26], ['bush', 'r', 0.36], ['vaso', 'l', 0.47], ['cactus', 'r', 0.57], ['cactus', 'l', 0.68], ['bush', 'r', 0.77], ['vaso', 'l', 0.87], ['cactus', 'r', 0.95])],
  mar: [L(['wave', 'l', 0.05], ['fish', 'r', 0.12], ['wave', 'l', 0.2], ['fish2', 'l', 0.3], ['wave', 'r', 0.4], ['wave', 'r', 0.48], ['fish', 'l', 0.58], ['wave', 'l', 0.68], ['fish2', 'r', 0.76], ['wave', 'l', 0.84], ['wave', 'r', 0.93]),
    L(['fish2', 'l', 0.05], ['wave', 'r', 0.13], ['fish', 'r', 0.22], ['wave', 'l', 0.3], ['wave', 'l', 0.4], ['fish', 'l', 0.5], ['fish2', 'r', 0.6], ['wave', 'r', 0.68], ['wave', 'r', 0.77], ['fish', 'r', 0.86], ['wave', 'l', 0.94])],
  espaco: [L(['star', 'l', 0.08], ['planet', 'r', 0.2], ['star', 'r', 0.32], ['moon', 'l', 0.45], ['star', 'l', 0.58], ['rocket', 'r', 0.7], ['star', 'r', 0.82], ['planet', 'l', 0.93]),
    L(['moon', 'r', 0.08], ['star', 'l', 0.2], ['rocket', 'l', 0.33], ['star', 'r', 0.45], ['planet', 'r', 0.58], ['star', 'l', 0.7], ['moon', 'l', 0.83], ['star', 'r', 0.94])],
  gelo: [L(['pineS', 'l', 0.05], ['flake', 'r', 0.12], ['igloo', 'r', 0.22], ['pineS', 'l', 0.3], ['flake', 'l', 0.4], ['pineS', 'r', 0.5], ['igloo', 'l', 0.6], ['flake', 'r', 0.7], ['pineS', 'l', 0.8], ['flake', 'r', 0.9]),
    L(['flake', 'l', 0.06], ['pineS', 'r', 0.14], ['pineS', 'l', 0.25], ['igloo', 'r', 0.36], ['flake', 'l', 0.46], ['pineS', 'r', 0.56], ['flake', 'r', 0.66], ['pineS', 'l', 0.76], ['igloo', 'l', 0.86], ['flake', 'r', 0.94])],
  vulcao: [L(['volcano', 'l', 0.06], ['flame', 'r', 0.14], ['rock', 'r', 0.25], ['flame', 'l', 0.34], ['volcano', 'r', 0.45], ['rock', 'l', 0.55], ['flame', 'r', 0.66], ['volcano', 'l', 0.76], ['flame', 'l', 0.86], ['rock', 'r', 0.94]),
    L(['flame', 'l', 0.06], ['rock', 'r', 0.15], ['volcano', 'r', 0.26], ['flame', 'l', 0.37], ['rock', 'l', 0.47], ['flame', 'r', 0.57], ['volcano', 'l', 0.68], ['rock', 'r', 0.78], ['flame', 'l', 0.88], ['volcano', 'r', 0.95])],
};
export const TEMAS = Object.keys(DECOR_TEMA);
/** Regiões de um mundo: `lista` = [[id, nome, subtítulo], ...] (1 a 2 regiões); os enfeites vêm do tema. */
export const regioesDoTema = (tema, lista) => lista.map(([id, name, sub], i) => ({ id, name, sub, decor: DECOR_TEMA[tema][i % 2] }));
/** Tema do mapa pronto pro `mountProgressionMap` (o id vira `data-theme="mundo-<tema>"`, de onde vêm as cores). */
export const temaDoMundo = (tema, nome, lista) => ({ id: `mundo-${tema}`, name: nome, regions: regioesDoTema(tema, lista) });
