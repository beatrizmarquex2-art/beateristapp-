// Dados centralizados da Lojinha: um lugar só para produtos, ofertas e links da Hotmart (veja CATALOGO_E_LINKS.md).
// Regras: "Adquirir" só abre um checkout CONFIRMADO daquele produto. Sem oferta confirmada = "Em breve".
// Não deduzir checkout pelo ID da página pública, nem usar preço de adicional como preço avulso.
export const HOTMART = {
  site: 'https://beaterista.com.br/',
  club: 'https://hotmart.com/pt-br/club/bateriastartbeatrizmarques',
  video: { id: '8JxMYbuRYqg', watch: 'https://www.youtube.com/watch?v=8JxMYbuRYqg' },
};
const IMG = 'assets/loja/';
/** estado da oferta: 'confirmada' (tem checkout oficial) | 'pendente' (Em breve) */
export const PRODUTOS = [
  { id: 'memoria', slug: 'jogo-da-memoria-musical', ordem: 1, formato: 'Imprimir e recortar', titulo: 'Jogo da Memória Musical', curta: 'imprima, recorte, embaralhe',
    longa: 'Coleção musical para imprimir e recortar: 8 temas e 61 pares de cartas, com instrumentos de percussão, rock e figuras rítmicas. Papel A4, frente e verso, pronto para imprimir, em versão colorida e preto e branco.',
    arte: IMG + 'memoria.webp', alt: 'Capa do Jogo da Memória Musical: 8 temas, 61 pares', ratio: '4/5', galeria: [],
    oferta: { estado: 'pendente', checkout: null, preco: null, referencia: 'https://hotmart.com/pt-br/marketplace/produtos/jogo-da-memoria-musical-beaterista/T108261878K', nota: 'página pública localizada; checkout direto pendente' } },
  { id: 'kids', slug: 'bateria-kids', ordem: 2, formato: 'PDF · 36 páginas', titulo: 'Bateria Kids', curta: 'aprenda bateria brincando e colorindo',
    longa: 'Para colorir, aprender e se divertir: peças da bateria, baquetas, postura e partitura, figuras rítmicas, labirinto e metrônomo, caça-palavras, cruzadinha e muito mais. Com 36 páginas para imprimir e um brinde: desenhos para colorir.',
    arte: IMG + 'kids.webp', alt: 'Capa do Bateria Kids, caderno para colorir', ratio: '4/5', galeria: [],
    oferta: { estado: 'pendente', checkout: null, preco: null, referencia: null, nota: 'checkout pendente: conferir painel' } },
  { id: 'robo', slug: 'roboterista-ensina', ordem: 3, formato: 'PDF · 48 páginas', titulo: 'Robôterista Ensina', curta: 'atividades e músicas para evoluir na bateria',
    longa: 'As figuras rítmicas, as pausas e o tempo: para imprimir, desenhar, recortar e tocar. Atividades e músicas para evoluir na bateria entre as aulas, em 48 páginas, com o Paul como guia. PDF pronto para imprimir.',
    arte: IMG + 'robo1.webp', alt: 'Capa do Robôterista Ensina', ratio: '1/1',
    galeria: [{ src: IMG + 'robo1.webp', alt: 'Robôterista Ensina' }, { src: IMG + 'robo2.webp', alt: 'Treine em casa entre as aulas' }],
    oferta: { estado: 'pendente', checkout: null, preco: null, referencia: null, nota: 'checkout pendente: conferir painel' } },
  { id: 'violao', slug: 'violao-do-zero', ordem: 4, formato: 'E-book', titulo: 'Violão do Zero', curta: 'da primeira corda à primeira música',
    longa: 'E-book para começar no violão: da primeira corda à primeira música, passo a passo.',
    arte: IMG + 'violao.webp', alt: 'Capa do e-book Violão do Zero', ratio: '9/16', galeria: [],
    oferta: { estado: 'pendente', checkout: null, preco: null, referencia: 'https://hotmart.com/pt-br/marketplace/produtos/violaostartbeaterista/D108261763C', nota: 'a Hotmart lista "Violão Start": confirmar se é o PDF de 47 páginas antes de associar' } },
  { id: 'mood', slug: 'beaterista-mood', ordem: 5, formato: 'PDF · 33 páginas', titulo: 'Beaterista Mood', curta: 'o método de estudo pessoal da professora',
    longa: 'O método de estudo pessoal da professora Bea em 33 páginas para estudar: rudimentos, paradiddle e acentuação, figuras rítmicas e partitura, técnica de pedal (pivô de bumbo) e, de bônus, um cronograma semanal de estudo.',
    arte: IMG + 'mood.webp', alt: 'Capa do Beaterista Mood', ratio: '4/5', galeria: [],
    oferta: { estado: 'pendente', checkout: null, preco: null, referencia: null, nota: 'R$ 29,90 só como adicional do curso; oferta avulsa pendente' } },
  { id: 'ebook', slug: 'bateria-start-ebook', ordem: 6, formato: 'E-book · 44 páginas', titulo: 'Bateria Start, e-book', curta: 'comece a tocar do zero',
    longa: 'E-book para iniciantes em 44 páginas: peças da bateria, baqueta e pedal, figuras rítmicas e partitura de bateria, rudimentos, viradas e ritmos, com lista de músicas com bpm. Não é o curso online: o curso tem página e oferta próprias.',
    arte: IMG + 'ebook.webp', alt: 'Capa do e-book Bateria Start', ratio: '4/5', galeria: [],
    oferta: { estado: 'pendente', checkout: null, preco: null, referencia: null, nota: 'oferta avulsa pendente; NÃO usar o checkout do curso' } },
  { id: 'curso', slug: 'bateria-start-curso', ordem: 7, formato: 'Curso online', titulo: 'Bateria Start, curso online', curta: 'a profe Bea te ensina bateria do zero',
    longa: 'Curso online em aulas curtinhas: você conhece a bateria, pratica os primeiros ritmos e aprende viradas, com a professora Bea.',
    arte: IMG + 'banner-lojinha.webp', alt: 'Bateria Start, curso online com a professora Bea', ratio: '3/1', galeria: [], paul: true,
    oferta: { estado: 'confirmada', checkout: 'https://pay.hotmart.com/M76102148V?checkoutMode=10&off=va81350a', preco: 79.9, referencia: 'https://hotmart.com/pt-br/marketplace/produtos/bateria-start-beatriz-marques/M76102148V', nota: 'checkout público conferido a R$ 79,90; reconferir o preço antes de publicar' } },
];
/** Passe Beaterista: oferta própria, ainda sem checkout cadastrado (passo da Bea). */
export const PASSE = {
  id: 'passe', slug: 'passe', titulo: 'Passe Beaterista', preco: 49.9, meses: 12, pagamento: 'pagamento único',
  oferta: { estado: 'pendente', checkout: null, nota: 'cadastrar o checkout da oferta de pagamento único e o webhook' },
  inclui: ['todos os jogos', 'modo online', 'Tocar', 'Estudos com as apostilas', 'álbum de figurinhas', 'envelope bônus com 3 cartas exclusivas'],
  arte: IMG + 'banner-passe.webp',
};
export const brl = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
export const porSlug = (s) => PRODUTOS.find((p) => p.slug === s) || null;
export const ordenados = () => [...PRODUTOS].sort((a, b) => a.ordem - b.ordem);
/** Link de compra seguro: só devolve URL https do próprio checkout da Hotmart quando a oferta está confirmada. */
export function checkoutDe(p) {
  const o = p && p.oferta; if (!o || o.estado !== 'confirmada' || !o.checkout) return null;
  try { const u = new URL(o.checkout); return u.protocol === 'https:' && u.hostname === 'pay.hotmart.com' ? u.href : null; } catch { return null; }
}
export const precoDe = (p) => (p.oferta.estado === 'confirmada' && p.oferta.preco != null ? brl(p.oferta.preco) : null);
export const passeCheckout = () => { const o = PASSE.oferta; try { if (o.estado !== 'confirmada' || !o.checkout) return null; const u = new URL(o.checkout); return u.protocol === 'https:' && u.hostname === 'pay.hotmart.com' ? u.href : null; } catch { return null; } };
