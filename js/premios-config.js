// Prêmios do passe (só pra quem comprou: tem código de acesso válido). Aparecem na Lojinha. Pra trocar um arquivo, é só trocar aqui e em assets/premios/.
// Wallpapers: os 12 que a Bea mandou (941 × 1672). Banners e planners: os que a Bea mandou (PNG sem fundo e JPG A4). Colorir: scripts/premios-gerar.py. As 3 figurinhas exclusivas chegam no baú (pacote `dado:`, uma vez só por aluno).
const P = 'assets/premios/';
const wp = (n, slug, nome) => ({ nome, arquivo: `${P}wallpaper-${n}-${slug}.jpg`, mini: `${P}wallpaper-${n}-mini.jpg` });
export const WALLPAPERS = [
  wp('01', 'billie-musica-com-atitude', 'Billie · música com atitude'), wp('02', 'paul-musica-com-atitude', 'Paul · música com atitude'),
  wp('07', 'billie-a-musica-transforma', 'Billie · a música transforma'), wp('10', 'paul-a-musica-transforma', 'Paul · a música transforma'),
  wp('08', 'billie-solte-o-som', 'Billie · solte o som'), wp('11', 'paul-solte-o-som', 'Paul · solte o som'),
  wp('09', 'billie-seu-ritmo-sua-voz', 'Billie · seu ritmo, sua voz'), wp('12', 'paul-seu-ritmo-sua-voz', 'Paul · seu ritmo, sua voz'),
  wp('05', 'paul-e-billie-case-bege', 'Paul e Billie · clara'), wp('06', 'paul-e-billie-case-vermelho', 'Paul e Billie · vermelha'),
  wp('03', 'paul-trio-bege', 'Paul · trio claro'), wp('04', 'paul-trio-escuro', 'Paul · trio escuro'),
];
const bn = (slug, nome, dica = 'PNG sem fundo') => ({ nome, dica, arquivo: `${P}banner-${slug}.png`, mini: `${P}banner-${slug}-mini.png` });
export const BANNERS = [
  bn('seu-talento', 'Seu talento faz a diferença'), bn('acredite-em-voce', 'Acredite em você'), bn('um-acorde-de-cada-vez', 'Um acorde de cada vez'),
  bn('a-pratica-amplifica', 'A prática amplifica o talento'), bn('tres-frases', 'Três frases do Paul'), bn('nunca-desista', 'Nunca desista dos seus sonhos'), bn('transforme-paixao', 'Transforme paixão em música'),
];
const pl = (slug, nome) => ({ nome, dica: 'planner semanal', arquivo: `${P}planner-${slug}.jpg`, mini: `${P}planner-${slug}-mini.jpg` });
export const PLANNERS = [
  pl('bateria-vermelho', 'Bateria · vermelho'), pl('guitarra-vermelho', 'Guitarra · vermelho'), pl('teclado-vermelho', 'Teclado · vermelho'), pl('violao-vermelho', 'Violão · vermelho'),
  pl('bateria-escuro-a', 'Bateria · escuro 1'), pl('bateria-escuro-b', 'Bateria · escuro 2'), pl('teclado-escuro', 'Teclado · escuro'), pl('violao-escuro', 'Violão · escuro'), pl('violao-acustico-escuro', 'Violão acústico · escuro'),
];
export const COLORIR = { nome: 'Folhas de colorir', dica: '3 folhas A4 em PDF', arquivo: `${P}colorir-paul-3-folhas.pdf`, mini: `${P}colorir-paul-mini.jpg` };
// 3 exclusivas (catálogo): P03 Paul no breakdance, P10 Paul professor, F010 retrato da Bea. Mudar os códigos muda o prêmio de quem ainda não pegou.
export const FIGURINHAS = { id: 'dado:P03,P10,F010:passe', codigos: ['P03', 'P10', 'F010'] };

// Páginas de colorir soltas (34 folhas A4 do livro de colorir): o check-in de 7 dias libera 2 por semana, na ordem.
const cl = (n, slug) => ({ nome: slug.replace(/-/g, ' '), arquivo: `${P}colorir/colorir-${String(n).padStart(2, '0')}-${slug}.jpg`, mini: `${P}colorir/colorir-${String(n).padStart(2, '0')}-mini.jpg`, dica: 'folha A4' });
export const COLORIR_PAGINAS = ['acordeon', 'amplificador', 'baixo', 'baqueta', 'bastidores', 'bateria', 'breakdance', 'cajon-dupla', 'cajon-palco', 'cajon', 'case', 'colorindo', 'congas', 'ensinando', 'estudando', 'guitarra', 'meditando', 'metronomo', 'microfone', 'oculos', 'ouvindo-musica', 'pad-metronomo', 'pad-treino', 'pandeiro', 'professor', 'sax', 'selfie', 'sonhando', 'teclado-dupla', 'teclado', 'trompete', 'ukulele', 'violino', 'xilofone'].map((s, i) => cl(i + 1, s));
/** Prêmio fixo da semana de número `n` (1 = a primeira semana fechada): 1 wallpaper e 2 folhas de colorir; passa de 12 / 34 e recomeça. */
export function premioDaSemana(n) {
  const i = Math.max(1, n | 0) - 1;
  return { wallpaper: WALLPAPERS[i % WALLPAPERS.length], colorir: [COLORIR_PAGINAS[(2 * i) % COLORIR_PAGINAS.length], COLORIR_PAGINAS[(2 * i + 1) % COLORIR_PAGINAS.length]] };
}

// 14 folhas novas (nov/2026, com frases do Paul): entram no fim da lista, então as semanas já entregues não mudam.
COLORIR_PAGINAS.push(...['a-musica-acompanha', 'brincar-e-aprender', 'oi-sou-o-paul-balao', 'a-musica-desenvolve', 'crie-sem-medo', 'foco-no-ritmo', 'sobe-o-som', 'aqui-e-beaterista', 'musica-e-atitude', 'vamos-praticar', 'hora-de-pintar', 'paul-de-skate', 'escola-beaterista', 'oi-sou-o-paul'].map((s, i) => cl(35 + i, s)));
