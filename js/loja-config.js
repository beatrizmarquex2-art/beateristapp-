// Lojinha Beaterista: produtos e links de compra. Quando um `link` fica vazio, o botão "Adquirir" avisa que já já abre
// (e manda chamar a professora Bea). Preencher o `link` (pagamento ou WhatsApp) é tudo que falta pra vender.
// `img` = capa do cartão; `fotos` = imagens maiores que abrem ao tocar no cartão (o que tem dentro).
// A lojinha só aparece pra turma quando LOJA_ABERTA for true. Enquanto estiver false, a tela mostra só "a lojinha vem em breve" (e as artes nem vão pro site dos alunos).
export const LOJA_ABERTA = true;
// O Passe fica escondido da vitrine enquanto não tiver `link` (hoje a loja vende só os ebooks).
export const AVISO_DIGITAL = 'todos os materiais são digitais (PDF): dá pra estudar na tela do celular ou do computador e imprimir pra treinar no papel.';
export const PASSE = { nome: 'Passe Beaterista', preco: 'R$ 49,90', info: ['12 meses de acesso', 'Pagamento único'], img: 'assets/loja/passe.webp', link: '' };
export const PRODUTOS = [
  // novos (capas quadradas): o preço e o link da Hotmart entram quando a Bea mandar; sem link o botão avisa que já já abre
  { id: 'pratica', nome: 'Na Prática', desc: 'jogos, cruzadinhas e labirintos pra imprimir', tag: '48 atividades', img: 'assets/loja/pratica.webp', w: 800, h: 800, fotos: ['assets/loja/d-pratica.webp'], link: '' },
  { id: 'harmonia', nome: 'Harmonia e Melodia', desc: 'notas e acordes no teclado e no violão', tag: '102 páginas', img: 'assets/loja/harmonia.webp', w: 800, h: 800, fotos: ['assets/loja/d-harmonia.webp'], link: '' },
  { id: 'ritmo', nome: 'Ritmo e Figuras', desc: 'figuras, pausas e levadas de rock', tag: '100 páginas', img: 'assets/loja/ritmo.webp', w: 800, h: 800, fotos: ['assets/loja/d-ritmo.webp'], link: '' },
  { id: 'memoria', nome: 'Jogo da Memória Musical', desc: 'imprima, recorte, embaralhe', tag: '61 pares', preco: 'R$ 19,90', img: 'assets/loja/memoria.webp', fotos: ['assets/loja/d-memoria.webp', 'assets/loja/d-memoria-kids.webp'], link: 'https://pay.hotmart.com/T108261878K' },
  { id: 'bateria-kids', nome: 'Bateria Kids', desc: 'aprenda bateria brincando e colorindo', tag: '36 páginas', preco: 'R$ 19,90', img: 'assets/loja/bateria-kids.webp', fotos: ['assets/loja/d-bateria-kids.webp'], link: 'https://pay.hotmart.com/J103900759O' },
  { id: 'violao', nome: 'Violão do Zero', desc: 'da primeira corda à primeira música', tag: '47 páginas', preco: 'R$ 29,90', img: 'assets/loja/violao.webp', fotos: ['assets/loja/d-violao.webp'], link: 'https://pay.hotmart.com/D108261763C' },
  { id: 'mood', nome: 'Beaterista Mood', desc: 'exercícios que eu estudo, ensino e levo pro palco', tag: '55 páginas', preco: 'R$ 29,90', img: 'assets/loja/mood.webp', fotos: ['assets/loja/d-mood.webp'], link: 'https://pay.hotmart.com/G103615712R' },
  { id: 'start', nome: 'Bateria Start', desc: 'ebook para iniciantes: peças, figuras rítmicas, partitura e rudimentos', preco: 'R$ 14,90', precoDe: 'R$ 29,90', selo: 'PROMOÇÃO BLACK FRIDAY · metade do preço', tag: '44 páginas', img: 'assets/loja/bateria-start.webp', fotos: ['assets/loja/d-bateria-start.webp'], link: 'https://pay.hotmart.com/K66533032H' },
];
