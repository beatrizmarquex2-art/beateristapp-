// Vitrine nova da Lojinha: só ARRUMA o que já existe em js/loja-config.js (produtos, preços e links não mudam aqui).
// Nada de produto, preço ou promoção novos: cada item aponta pro `id` de um produto existente ou pra uma arte oficial que já está em assets/.
import { PASSE, ANUAL, COMBOS as COMBOS_LOJA, BANNER_COMBOS } from './loja-config.js';

/** Banners da vitrine principal. `tipo: 'compra'` abre o pagamento (com a confirmação de adulto); `tipo: 'produto'` abre o material.
 *  Cada banner mostra a arte INTEIRA (sem corte): o tamanho (w × h) é o da arte original. `so` = só aparece enquanto vale. */
export const BANNERS = [
  // arte do acesso anual (muda por data em loja-config.js); toque abre "Pix ou cartão". Arte quase quadrada vira faixa fina.
  { id: 'anual', arte: ANUAL.w / ANUAL.h >= 2, img: ANUAL.img, w: ANUAL.w, h: ANUAL.h, alt: ANUAL.desc, tipo: 'passe', titulo: 'Passe Anual', rotulo: 'acesso de 12 meses' },
  { id: 'combos', arte: false, img: BANNER_COMBOS.img, w: BANNER_COMBOS.w, h: BANNER_COMBOS.h, alt: BANNER_COMBOS.alt, tipo: 'ir', alvo: 'combos', titulo: 'Combos especiais', rotulo: 'levando junto fica mais em conta' },
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

// Combos (config nova da Bea em loja-config.js): aqui só dizemos quais produtos soltos cada um reúne, pra mostrar o que vem dentro e calcular a economia real.
export const COMBO_ITENS = { 'combo-ensina': ['ritmo', 'harmonia', 'pratica'], 'combo-brincando': ['memoria', 'colorir'], 'combo-cards': ['cards-teoria', 'cards-instrumentos', 'cards-dicionario'] };
export const COMBOS = COMBOS_LOJA.slice().sort((a, b) => Number(!!(b.link || (b.provisorio && b.provisorio.link))) - Number(!!(a.link || (a.provisorio && a.provisorio.link))));

// Experimente grátis: só o que o app já deixa ver sem código (limites em js/amostra.js).
export const GRATIS_ITENS = [
  { id: 'jogos', titulo: 'Jogos', frase: 'prévia das telas e como se joga', href: '#/jogos', img: 'assets/entrada/s-beathero.jpg' },
  { id: 'aulinha', titulo: 'Aulinha do Paul', frase: 'os primeiros passos da aula', href: '#/estudos', img: 'assets/entrada/s-aulas.jpg' },
  { id: 'dicionario', titulo: 'Dicionário musical', frase: 'alguns termos pra conhecer', href: '#/dicionario', img: 'assets/entrada/s-estudos.jpg' },
  { id: 'paginas', titulo: 'Folhear as apostilas', frase: 'páginas de dentro, sem comprar', href: '#lj-universo', img: 'assets/loja/ritmo.webp' },
];
