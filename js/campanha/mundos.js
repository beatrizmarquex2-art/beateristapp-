// Mundos coloridos (aprovados pela Bea): qual cor de mapa cada jogo usa. Puro (sem DOM). Cores em css/aventura-tema.css (html[data-mundo]).
// A pauLta e os outros mapas ficam como sempre. Escolhido pelo endereço, então vale pro mapa, o seletor de modo e as missões.
export const MUNDOS = [
  [/^#\/kids\/(figuras|memoria)(\/|$|\?)/, 'clarinho'], // teoria: figuras rítmicas e instrumentos
  [/^#\/(kids\/ritmo|jogos\/toca)(\/|$|\?)/, 'amarelo'], // tocar: monte seu ritmo e Toca Aqui
];
export const mundoDe = (hash) => { const m = MUNDOS.find(([re]) => re.test(String(hash || ''))); return m ? m[1] : ''; };
