// Lojinha Beaterista: produtos e links de compra. Quando um `link` fica vazio, o botão "Adquirir" avisa que já já abre
// (e manda chamar a professora Bea). Preencher o `link` (pagamento ou WhatsApp) é tudo que falta pra vender.
// `img` = capa do cartão; `fotos` = imagens maiores que abrem ao tocar no cartão (o que tem dentro).
// A lojinha só aparece pra turma quando LOJA_ABERTA for true. Enquanto estiver false, a tela mostra só "a lojinha vem em breve" (e as artes nem vão pro site dos alunos).
export const LOJA_ABERTA = false;
export const PASSE = { nome: 'Passe Beaterista', preco: 'R$ 49,90', info: ['12 meses de acesso', 'Pagamento único'], img: 'assets/loja/passe.webp', link: '' };
export const PRODUTOS = [
  { id: 'memoria', nome: 'Jogo da Memória Musical', desc: 'imprima, recorte, embaralhe', tag: '61 pares', img: 'assets/loja/memoria.webp', fotos: ['assets/loja/d-memoria.webp', 'assets/loja/d-memoria-kids.webp'], link: '' },
  { id: 'bateria-kids', nome: 'Bateria Kids', desc: 'aprenda bateria brincando e colorindo', tag: '36 páginas', img: 'assets/loja/bateria-kids.webp', fotos: ['assets/loja/d-bateria-kids.webp'], link: '' },
  { id: 'roboterista', nome: 'Robôterista Ensina', desc: 'figuras rítmicas, pausas e tempo: imprimir, desenhar, recortar e tocar', tag: '48 páginas', img: 'assets/loja/roboterista.webp', fotos: ['assets/loja/d-roboterista-1.webp', 'assets/loja/d-roboterista-2.webp', 'assets/loja/d-roboterista-3.webp'], link: '' },
  { id: 'violao', nome: 'Violão do Zero', desc: 'da primeira corda à primeira música', tag: '47 páginas', img: 'assets/loja/violao.webp', fotos: ['assets/loja/d-violao.webp'], link: '' },
  { id: 'mood', nome: 'Beaterista Mood', desc: 'o método de estudo pessoal da professora (com cronograma semanal)', tag: '33 páginas', img: 'assets/loja/mood.webp', fotos: ['assets/loja/d-mood.webp'], link: '' },
  { id: 'start', nome: 'Bateria Start', desc: 'curso em videoaulas + ebook, pra começar do zero', preco: 'R$ 79,90', tag: 'curso + ebook', img: 'assets/loja/curso-start.webp', fotos: ['assets/loja/d-curso-sequencia.webp', 'assets/loja/d-curso-vertical.webp', 'assets/loja/d-bateria-start.webp'], link: '' },
];
