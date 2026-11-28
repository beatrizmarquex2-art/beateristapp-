// Lojinha Beaterista: produtos e links de compra. Quando um `link` fica vazio, o botão "Adquirir" avisa que já já abre
// (e manda chamar a professora Bea). Preencher o `link` (pagamento ou WhatsApp) é tudo que falta pra vender.
// `img` = capa do cartão; `fotos` = imagens maiores que abrem ao tocar no cartão (o que tem dentro).
// A lojinha só aparece pra turma quando LOJA_ABERTA for true. Enquanto estiver false, a tela mostra só "a lojinha vem em breve" (e as artes nem vão pro site dos alunos).
export const LOJA_ABERTA = true;
// O Passe fica escondido da vitrine enquanto não tiver `link` (hoje a loja vende só os ebooks).
export const AVISO_DIGITAL = 'todos os materiais são digitais (PDF): dá pra estudar na tela do celular ou do computador e imprimir pra treinar no papel.';
// O Passe vai DIRETO pra página de pagamento (Pix com QR Code e código automático por e-mail; lá também tem o link do cartão na Hotmart). Sem WhatsApp no meio.
// O preço segue a data (js/passe-preco.js): promoção de Natal até 31/12/2026, depois o normal.
import { precoPasse } from './passe-preco.js';
export const URL_PASSE = 'https://jogos.beaterista.com.br/pix/';
export const PASSE = { nome: 'Passe Anual Robôterista', preco: precoPasse().atual, info: ['12 meses de acesso', 'Até 2 aparelhos', 'Pix ou cartão · o código chega no seu e-mail'], img: 'assets/loja/passe.webp', link: URL_PASSE };
// Banner do acesso anual (arte da Bea, SEM WhatsApp): até 15/12 a arte "oferta até 31/12" (R$ 49,90); de 16/12 a 31/12 a arte do Paul Noel (mesma oferta, "promoção de lançamento estendida");
// a partir de 01/01/2027 a arte do preço novo (R$ 99,90 no Pix). Mesmo link do passe (página de pagamento).
const _PP = precoPasse();
const _ARTE = !_PP.oferta ? { img: 'assets/loja/anual-2027.webp', w: 1600, h: 600, desc: `Passe Anual Beaterista Play a partir de 01/01/2027: ${_PP.atual} no Pix` }
  : _PP.bf ? { img: 'assets/loja/anual-bf.webp', w: 1600, h: 600, desc: `Passe Anual Beaterista Play: oferta até 31/12/2026 por ${_PP.atual} no Pix` }
    : { img: 'assets/loja/anual-natal.webp', w: 1254, h: 1254, desc: `Paul Noel, presente do Robôterista: promoção de lançamento estendida até 31 de dezembro, ${_PP.atual}` };
export const ANUAL = { id: 'anual-lancamento', nome: 'Acesso anual', ..._ARTE, link: PASSE.link };
// COMBOS (a Bea refez em 27/nov/2026; o combo antigo de 4 apostilas saiu). Cada combo é um produto na Hotmart: o `link` vazio mostra "em breve".
// O combo "Aprende Brincando" NÃO leva o UNO Musical (marca da Mattel; o UNO fica só como jogo dentro do app, nunca à venda).
export const COMBOS = [
  { id: 'combo-ensina', cor: 'azul', nome: 'Combo Robôterista Ensina', desc: '3 apostilas completas pra aprender teoria, praticar e evoluir', itens: ['Melodia e Harmonia · 102 páginas', 'Figuras e Ritmos · 100 páginas', 'Na Prática · 48 atividades'], preco: 'R$ 79,90', img: 'assets/loja/combo-ensina.webp', w: 1199, h: 1312, link: 'https://pay.hotmart.com/K108463375K' },
  // Link do combo na Hotmart recebido da Bea em 28/nov/2026 (H108704370B). PREÇO ainda não informado (sem `preco` o cartão mostra só o botão). O 3º item é um jogo de cartas das figuras rítmicas; a Bea ainda vai dizer o NOME dele (não usar "Uno": marca da Mattel).
  { id: 'combo-brincando', cor: 'vermelho', nome: 'Combo Robôterista Aprende Brincando', desc: 'jogo da memória, colorir e jogo de cartas pra aprender música brincando', itens: ['Jogo da Memória Musical · 61 pares', 'Robôterista Paul para colorir · 50 páginas', 'Jogo de cartas das figuras rítmicas'], preco: '', img: '', w: 0, h: 0, link: 'https://pay.hotmart.com/H108704370B' },
  { id: 'combo-cards', cor: 'amarelo', nome: 'Combo Robôterista Cria e Revisa', desc: 'os 3 baralhos de cards pra imprimir, recortar e revisar', itens: ['Cards: Teoria Musical · 150 cartas', 'Cards: Instrumentos · 90 cartas', 'Cards: Dicionário Musical · 120 termos'], preco: 'R$ 49,90', precoDe: 'R$ 59,70', img: 'assets/loja/cards-combo.webp', w: 800, h: 800, link: 'https://pay.hotmart.com/F108547827R' },
];
// Banner larga "Combos especiais" (arte da Bea): abre a seção de combos da Lojinha.
// Os preferidos da turma (a Bea pediu pra irem no topo: eles amaram): colorir, atividades e jogo da memória; o UNO Musical aparece como jogo do app (nunca à venda).
export const AMADOS = ['colorir', 'pratica', 'memoria'];
export const BANNER_COMBOS = { img: 'assets/loja/combos-banner.webp', w: 1672, h: 941, alt: 'Combos especiais da Lojinha em PDF pra imprimir, jogar e aprender: Combo Robôterista Ensina, Aprende Brincando e Cria e Revisa' };
export const PRODUTOS = [
  { id: 'colorir', secao: 'ensina', nome: 'Robôterista Paul para colorir', desc: 'o Paul em 50 páginas pra imprimir e pintar do seu jeito', tag: '50 páginas', preco: 'R$ 14,90', img: 'assets/loja/colorir.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-colorir.webp', 'assets/loja/previa/d-colorir-2.webp', 'assets/loja/previa/d-colorir-3.webp', 'assets/loja/previa/d-colorir-4.webp', 'assets/loja/previa/d-colorir-5.webp'], link: 'https://pay.hotmart.com/H108493301A' },
  { id: 'pratica', secao: 'ensina', nome: 'Na Prática', desc: 'jogos, cruzadinhas e labirintos pra imprimir', preco: 'R$ 19,90', tag: '48 atividades', img: 'assets/loja/pratica.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-pratica.webp'], link: 'https://pay.hotmart.com/V108460210V' },
  { id: 'memoria', secao: 'ensina', nome: 'Jogo da Memória Musical', desc: 'imprima, recorte, embaralhe', tag: '61 pares', preco: 'R$ 19,90', img: 'assets/loja/memoria.webp', fotos: ['assets/loja/previa/d-memoria.webp', 'assets/loja/previa/d-memoria-2.webp', 'assets/loja/previa/d-memoria-3.webp', 'assets/loja/previa/d-memoria-4.webp', 'assets/loja/previa/d-memoria-5.webp', 'assets/loja/previa/d-memoria-kids.webp'], link: 'https://pay.hotmart.com/T108261878K' },
  { id: 'bateria-kids', secao: 'ensina', nome: 'Bateria Kids', desc: 'aprenda bateria brincando e colorindo', tag: '36 páginas', preco: 'R$ 19,90', img: 'assets/loja/bateria-kids.webp', fotos: ['assets/loja/previa/d-bateria-kids.webp'], link: 'https://pay.hotmart.com/J103900759O' },
  { id: 'ritmo', secao: 'ensina', nome: 'Ritmo e Figuras', desc: 'figuras, pausas e levadas de rock', preco: 'R$ 29,90', tag: '100 páginas', img: 'assets/loja/ritmo.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-ritmo.webp', 'assets/loja/previa/d-ritmo-2.webp', 'assets/loja/previa/d-ritmo-3.webp', 'assets/loja/previa/d-ritmo-4.webp', 'assets/loja/previa/d-ritmo-5.webp'], link: 'https://pay.hotmart.com/Q108426927S' },
  { id: 'harmonia', secao: 'ensina', nome: 'Harmonia e Melodia', desc: 'notas e acordes no teclado e no violão', preco: 'R$ 29,90', tag: '102 páginas', img: 'assets/loja/harmonia.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-harmonia.webp'], link: 'https://pay.hotmart.com/L108460189W' },
  { id: 'start', secao: 'evoluir', nome: 'Bateria Start', desc: 'ebook para iniciantes: peças, figuras rítmicas, partitura e rudimentos', preco: 'R$ 14,90', precoDe: 'R$ 29,90', selo: 'PROMOÇÃO BLACK FRIDAY · metade do preço', tag: '44 páginas', img: 'assets/loja/bateria-start.webp', fotos: ['assets/loja/previa/d-bateria-start.webp'], link: 'https://pay.hotmart.com/K66533032H' },
  { id: 'mood', secao: 'evoluir', nome: 'Beaterista Mood', desc: 'exercícios que eu estudo, ensino e levo pro palco', tag: '55 páginas', preco: 'R$ 29,90', img: 'assets/loja/mood.webp', fotos: ['assets/loja/previa/d-mood.webp', 'assets/loja/previa/d-mood-2.webp', 'assets/loja/previa/d-mood-3.webp', 'assets/loja/previa/d-mood-4.webp', 'assets/loja/previa/d-mood-5.webp'], link: 'https://pay.hotmart.com/G103615712R' },
  // Adolescentes e adultos (novos, 28/nov/2026). PREÇO ainda não informado pela Bea: preencha `preco` quando ela mandar (sem `preco` o cartão mostra só o botão).
  { id: 'toca-bateria', secao: 'adultos', nome: 'Beaterista Toca Bateria', desc: 'para adultos: da primeira baqueta ao primeiro groove, em 15 minutos por dia', tag: '97 páginas', preco: '', img: 'assets/loja/toca-bateria.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-toca-bateria.webp', 'assets/loja/previa/d-toca-bateria-2.webp'], link: 'https://pay.hotmart.com/E108704194G' },
  { id: 'toca-teclado', secao: 'adultos', nome: 'Beaterista Toca Teclado', desc: 'do zero: da primeira tecla à primeira música, em 15 minutos por dia', tag: '67 páginas', preco: '', img: 'assets/loja/toca-teclado.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-toca-teclado.webp', 'assets/loja/previa/d-toca-teclado-2.webp'], link: 'https://pay.hotmart.com/X108704208I' },
  // ATENÇÃO: o link da Hotmart do Toca Violão é o MESMO do Violão Start (D108261763C): provavelmente é o mesmo produto, agora com 124 páginas. A Bea confirma qual fica.
  { id: 'toca-violao', secao: 'adultos', nome: 'Beaterista Toca Violão', desc: 'do zero: da primeira corda à primeira música', tag: '124 páginas', preco: '', img: 'assets/loja/toca-violao.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-toca-violao.webp', 'assets/loja/previa/d-toca-violao-2.webp'], link: 'https://pay.hotmart.com/D108261763C' },
  { id: 'violao', secao: 'evoluir', nome: 'Violão Start', desc: 'da primeira corda à primeira música', tag: '47 páginas', preco: 'R$ 29,90', img: 'assets/loja/violao.webp', fotos: ['assets/loja/previa/d-violao.webp', 'assets/loja/previa/d-violao-2.webp', 'assets/loja/previa/d-violao-3.webp', 'assets/loja/previa/d-violao-4.webp', 'assets/loja/previa/d-violao-5.webp'], link: 'https://pay.hotmart.com/D108261763C' },
  // Cards do Robôterista Paul (baralhos em PDF pra imprimir e recortar): links da Hotmart preenchidos em 18/nov/2026 (conferidos: cada link abre o produto certo; o combo mostra R$ 49,90 de R$ 59,70).
  { id: 'cards-teoria', secao: 'cards', nome: 'Cards: Teoria Musical', desc: 'baralho pra imprimir e recortar: figuras, pausas, pulso e mais', tag: '150 cartas', preco: 'R$ 19,90', img: 'assets/loja/cards-teoria.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-cards-teoria.webp', 'assets/loja/previa/d-cards.webp'], link: 'https://pay.hotmart.com/L108540773V' },
  { id: 'cards-instrumentos', secao: 'cards', nome: 'Cards: Instrumentos', desc: 'baralho: bateria, teclado, violão, acordes e peças', tag: '90 cartas', preco: 'R$ 19,90', img: 'assets/loja/cards-instrumentos.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-cards-instrumentos.webp', 'assets/loja/previa/d-cards.webp'], link: 'https://pay.hotmart.com/G108540829U' },
  { id: 'cards-dicionario', secao: 'cards', nome: 'Cards: Dicionário Musical', desc: 'baralho com 120 termos da música pra imprimir e recortar', tag: '120 termos', preco: 'R$ 19,90', img: 'assets/loja/cards-dicionario.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-cards-dicionario.webp', 'assets/loja/previa/d-cards.webp'], link: 'https://pay.hotmart.com/K108544926Y' },
  { id: 'cards-combo', secao: 'cards', nome: 'Combo dos 3 Baralhos', desc: 'teoria, instrumentos e dicionário: 360 cartas em PDF', tag: '360 cartas', preco: 'R$ 49,90', precoDe: 'R$ 59,70', img: 'assets/loja/cards-combo.webp', w: 800, h: 800, fotos: ['assets/loja/previa/d-cards-combo.webp', 'assets/loja/previa/d-cards.webp'], link: 'https://pay.hotmart.com/F108547827R' },
];

/** Seções da Lojinha (a vitrine abre por elas): cada uma tem o seu visual e o seu público. `#/lojinha/<id>` abre direto na seção. */
export const SECOES = [
  { id: 'ensina', nome: 'Robôterista ensina', titulo: 'Robôterista ensina', sub: 'apostilas, jogos e atividades pra aprender música brincando', chamada: 'aprender música brincando', capas: ['colorir', 'pratica', 'memoria'] },
  { id: 'evoluir', nome: 'Para evoluir', titulo: 'Para evoluir', sub: 'materiais pra jovens e adultos: bateria, violão e os exercícios que a Bea leva pro palco', chamada: 'pra jovens e adultos que querem tocar de verdade', capas: ['start', 'mood', 'violao'] },
  { id: 'cards', nome: 'Cards', titulo: 'Cards do Robôterista Paul', sub: 'baralhos em PDF pra imprimir, recortar e jogar', chamada: 'baralhos pra imprimir e recortar', capas: ['cards-teoria', 'cards-instrumentos', 'cards-dicionario'] },
];

// "O que tem dentro" de cada material (aparece na janela do produto). Só fatos já escritos pela Bea nas descrições, no caderninho de materiais e nas capas; nada inventado.
export const DENTRO = {
  ritmo: ['100 páginas em PDF, pra imprimir em preto e branco (pouca tinta)', 'figuras rítmicas e pausas', 'levadas de rock'],
  harmonia: ['102 páginas em PDF', 'notas e acordes no teclado', 'notas e acordes no violão'],
  pratica: ['48 atividades em PDF pra imprimir', 'jogos', 'cruzadinhas', 'labirintos'],
  memoria: ['61 pares de cartas pra imprimir, recortar e embaralhar', 'jogo da memória musical'],
  'bateria-kids': ['36 páginas pra colorir, aprender e se divertir', 'peças da bateria, baquetas, postura e partitura', 'figuras rítmicas, labirinto e metrônomo', 'caça-palavras, cruzadinha e mais', 'brinde: desenhos pra colorir'],
  colorir: ['50 páginas com o Paul pra imprimir e pintar do seu jeito', 'só desenhos pra colorir (não é aula)'],
  start: ['44 páginas, ebook pra quem está começando', 'peças da bateria', 'figuras rítmicas', 'partitura e rudimentos'],
  mood: ['55 páginas', 'exercícios que a Bea estuda, ensina e leva pro palco', 'estudos, prática e musicalidade'],
  violao: ['47 páginas, da primeira corda à primeira música'],
  'toca-bateria': ['97 páginas em PDF, pra ler e imprimir', 'apostila para adultos: da primeira baqueta ao primeiro groove, em 15 minutos por dia', 'grooves por estilo (rock, meio-tempo e pop dançante) com partitura', 'uma música de 8 compassos, em partitura, pra ver o mapa funcionando'],
  'toca-violao': ['124 páginas em PDF, pra ler e imprimir', 'do zero: da primeira corda à primeira música', 'os acordes maiores abertos, com o desenho do braço e os dedos', 'melodias em partitura e tablatura (ex.: Parabéns pra você)'],
  'toca-teclado': ['67 páginas em PDF, pra ler e imprimir', 'do zero: da primeira tecla à primeira música, em 15 minutos por dia', 'melodias populares com a mão direita na posição de Dó', 'acordes maiores (C, F, G e D) com o desenho do teclado'],
  'cards-teoria': ['150 cartas em PDF: 5 temas de 30 cartas', 'figuras, pausas, claves, tempo e compasso e leitura de notas', '9 cartas por folha A4 (63 × 88 mm), com linhas de corte e verso opcional'],
  'cards-instrumentos': ['90 cartas em PDF: 30 de bateria, 30 de teclado e 30 de violão', '9 cartas por folha A4 (63 × 88 mm), com linhas de corte e verso opcional'],
  'cards-dicionario': ['120 cartas em PDF com palavras de música', 'bateria, teoria, teclado, violão, banda e palco, estúdio e o jeito de falar dos músicos', 'cada carta com desenho, explicação, nome em inglês e uma dica ou exemplo', 'feito com pouca tinta'],
  'cards-combo': ['os 3 baralhos: Teoria (150), Instrumentos (90) e Dicionário (120)', '360 cartas em PDF, cada baralho com capa, "como usar" e verso opcional', 'R$ 49,90 em vez de R$ 59,70 separados'],
};
