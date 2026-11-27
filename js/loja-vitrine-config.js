// Vitrine nova da Lojinha: só ARRUMA o que já existe em js/loja-config.js (produtos, preços e links não mudam aqui).
// Nada de produto, preço ou promoção novos: cada item aponta pro `id` de um produto existente ou pra uma arte oficial que já está em assets/.
import { PASSE, ANUAL, COMBO } from './loja-config.js';

/** Banners da vitrine principal. `tipo: 'compra'` abre o pagamento (com a confirmação de adulto); `tipo: 'produto'` abre o material.
 *  Cada banner mostra a arte INTEIRA (sem corte): o tamanho (w × h) é o da arte original. `so` = só aparece enquanto vale. */
export const BANNERS = [
  { id: 'anual', so: 'oferta-passe', arte: true, img: ANUAL.img, w: ANUAL.w, h: ANUAL.h, alt: ANUAL.desc, tipo: 'compra', item: ANUAL },
  { id: 'combo-robo', img: COMBO.img, w: COMBO.w, h: COMBO.h, titulo: COMBO.nome, preco: COMBO.preco, alt: `${COMBO.nome}: ${COMBO.desc}, por ${COMBO.preco}`, tipo: 'compra', item: COMBO },
  { id: 'cards-combo', img: 'assets/loja/cards-combo.webp', w: 800, h: 800, titulo: 'Combo dos 3 Baralhos', preco: 'R$ 49,90', alt: 'Combo dos 3 baralhos do Robôterista Paul: Teoria, Instrumentos e Dicionário', tipo: 'produto', produto: 'cards-combo' },
];

/** Telas reais do app (as mesmas da entrada). `k` = o que a tela mostra: jogo, instrumento, desafio ou figurinha. */
export const TELAS_PASSE = [
  { img: 'assets/entrada/s-beathero.jpg', legenda: 'Beat Hero', k: 'jogo', w: 300, h: 605 },
  { img: 'assets/entrada/s-palco.jpg', legenda: 'Palco: bateria', k: 'instrumento', w: 300, h: 547 },
  { img: 'assets/entrada/s-aventura.jpg', legenda: 'Aventura: mapa de fases', k: 'desafio', w: 300, h: 589 },
  { img: 'assets/entrada/s-figurinha.jpg', legenda: 'Figurinha da Bea', k: 'figurinha', w: 300, h: 589 },
  { img: 'assets/entrada/s-uno.jpg', legenda: 'Uno Musical', k: 'jogo', w: 300, h: 547 },
  { img: 'assets/entrada/s-violao.jpg', legenda: 'Violão', k: 'instrumento', w: 300, h: 589 },
  { img: 'assets/entrada/s-pecas.jpg', legenda: 'Que peça é essa?', k: 'desafio', w: 300, h: 547 },
  { img: 'assets/entrada/s-vinil.jpg', legenda: 'Tocar: instrumentos', k: 'instrumento', w: 300, h: 589 },
  { img: 'assets/entrada/s-velha.jpg', legenda: 'Jogo da velha', k: 'jogo', w: 300, h: 589 },
  { img: 'assets/entrada/s-memoria.jpg', legenda: 'Memória: cartas do álbum', k: 'figurinha', w: 300, h: 589 },
  { img: 'assets/entrada/s-paulbox.jpg', legenda: 'PaulBox: monte a banda', k: 'instrumento', w: 300, h: 547 },
  { img: 'assets/entrada/s-acordes.jpg', legenda: 'Acordes', k: 'instrumento', w: 300, h: 547 },
];
export const PILARES_PASSE = [['jogo', 'jogos'], ['instrumento', 'instrumentos virtuais'], ['desafio', 'desafios'], ['figurinha', 'figurinhas']];
export { PASSE };

// Seções de produtos (ids de PRODUTOS em js/loja-config.js)
export const UNIVERSO = ['ritmo', 'harmonia', 'pratica']; // as apostilas do Robôterista
// A banca do Paul: prateleiras (categorias) pra crianças e famílias
export const BANCA = [
  { id: 'todos', nome: 'tudo', ids: ['colorir', 'bateria-kids', 'memoria', 'cards-teoria', 'cards-instrumentos', 'cards-dicionario'] },
  { id: 'colorir', nome: 'pra colorir', ids: ['colorir', 'bateria-kids'] },
  { id: 'jogos', nome: 'jogos', ids: ['memoria'] },
  { id: 'cartas', nome: 'cartas', ids: ['cards-teoria', 'cards-instrumentos', 'cards-dicionario'] },
];
export const MUSICOS = ['start', 'mood', 'violao'];

// Combos: o que vem dentro (ids) e o produto/link do combo. A economia é CALCULADA (soma dos preços dos itens − preço do combo).
export const COMBOS = [
  { id: 'combo-bf', nome: COMBO.nome, itens: ['ritmo', 'harmonia', 'pratica', 'memoria'], preco: COMBO.preco, img: COMBO.img, item: COMBO },
  { id: 'cards-combo', nome: 'Combo dos 3 Baralhos', itens: ['cards-teoria', 'cards-instrumentos', 'cards-dicionario'], produto: 'cards-combo' },
];

// Experimente grátis: só o que o app já deixa ver sem código (limites em js/amostra.js).
export const GRATIS_ITENS = [
  { id: 'jogos', titulo: 'Jogos', frase: 'prévia das telas e como se joga', href: '#/jogos', img: 'assets/entrada/s-beathero.jpg' },
  { id: 'aulinha', titulo: 'Aulinha do Paul', frase: 'os primeiros passos da aula', href: '#/estudos', img: 'assets/entrada/s-aulas.jpg' },
  { id: 'dicionario', titulo: 'Dicionário musical', frase: 'alguns termos pra conhecer', href: '#/dicionario', img: 'assets/entrada/s-estudos.jpg' },
  { id: 'paginas', titulo: 'Folhear as apostilas', frase: 'páginas de dentro, sem comprar', href: '#lj-universo', img: 'assets/loja/ritmo.webp' },
];
