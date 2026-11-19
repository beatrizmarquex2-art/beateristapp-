// Entrada nova da área dos alunos (modelo A "palco", desenhada com a Bea em nov/2026). Só monta a tela; quem confere nome e código é o aluno.js (callbacks).
// Seções: Paul + frase · atalhos (Lojinha clicável) · "por que Paul?" · experimentar grátis · já sou aluno · acesso completo (em breve)
// · veja por dentro (celulares que arrastam) · Beatriz Marques · produtos do Paul · direitos autorais · botão fixo "testar grátis agora".
import { h } from './util.js';
import { icon } from './util.js';
import { TERMO_DE_USO } from './termo-de-uso.js';
import { precoPasse } from './passe-preco.js';

const A = 'assets/entrada/';
// Passe anual: ainda não existe link de pagamento (Hotmart); até lá o botão chama a equipe no WhatsApp com a mensagem pronta. Quando tiver o link, é só trocar aqui.
const PASSE_LINK = (preco) => 'https://wa.me/5518991804150?text=' + encodeURIComponent(`Oi! Quero o passe anual do Robôterista Paul (12 meses de acesso), ${preco} no pix.`);
const PAULS = [[`${A}paul-meditando.webp`, 'Paul meditando', 170], [`${A}paul-professor.webp`, 'Paul ensinando no quadro', 215], [`${A}paul-guitarra.webp`, 'Paul tocando guitarra', 215]];
const KEY = 'beaterista-entrada-paul';
const sorteia = () => { let ult = -1; try { ult = Number(sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY) ?? -1); } catch { /* sem storage */ } let i = Math.floor(Math.random() * PAULS.length); if (i === ult) i = (i + 1) % PAULS.length; try { localStorage.setItem(KEY, String(i)); sessionStorage.setItem(KEY, String(i)); } catch { /* ok */ } return PAULS[i]; };

const JOGOS = [
  ['s-beathero', 'Beat Hero', 'toque no tempo certo e ganhe XP, com músicas de vários estilos.'],
  ['s-uno', 'Uno Musical', 'jogue a carta da mesma cor ou da mesma figura. reconhecer as figuras é o segredo!'],
  ['s-paulbox', 'PaulBox', 'toque num Paul pra ele entrar, monte a banda e troque o ritmo. dá até pra gravar 20 segundos.'],
  ['s-velha', 'Jogo da Velha Musical', 'marque o quadrado respondendo curiosidades sobre música, teoria, artistas e mais.'],
  ['s-memoria', 'Memória musical', 'ache os pares: palco e estúdio, equipamentos, instrumentos, figuras e pausas.'],
  ['s-aventura', 'Modo aventura', 'avance pelo mapa, região por região, e treine semínima e pausa tocando no ritmo.'],
  ['s-estudos', 'Estudos', 'dicionário, aulas do Paul, acordes e ritmos e jogos que ensinam, tudo num lugar só.'],
  ['s-pecas', 'Aulas do Paul', 'leia a pauta e descubra qual peça da bateria toca. cada aula tem quiz.'],
  ['s-aulas', '90 aulinhas', 'bateria, teclado e violão, em 6 fases cada, com estrelas pra ganhar.'],
  ['s-ensinam', 'Jogos ensinam', 'descubra pra que serve cada jogo e o que ele desenvolve em você.'],
  ['s-acordes', 'Acordes no teclado', 'veja as teclas de cada acorde, maior e menor, e ouça no piano ou no elétrico.'],
  ['s-violao', 'Acordes no violão', 'veja o desenho de cada acorde e monte no braço do violão.'],
  ['s-vinil', 'Palco', 'escolha bateria, cordas, teclas ou percussão e toque. tem metrônomo, afinador e cronômetro.'],
  ['s-palco', 'Bateria eletrônica', 'toque nos pads e nos pedais e ouça cada peça da bateria.'],
  ['s-figurinha', 'Minha figurinha', 'ponha a sua foto numa figurinha com moldura e mostre pra galera.'],
];
const APOSTILAS = [['assets/loja/ritmo.webp', 'Ritmo e Figuras', '100 páginas · PDF', 'R$ 29,90'], ['assets/loja/harmonia.webp', 'Harmonia e Melodia', '102 páginas · PDF', 'R$ 29,90'], ['assets/loja/pratica.webp', 'Na Prática', '48 atividades · PDF', 'R$ 19,90'], ['assets/loja/memoria.webp', 'Jogo da Memória Musical', '61 pares de cartas · PDF', 'R$ 19,90']];
const PASSOS = [['imprima', 'PDF em A4, pronto pra sua impressora. Em preto e branco gasta pouca tinta.'], ['recorte', 'Nos cards, as linhas tracejadas mostram onde cortar. Cada carta tem 63 × 88 mm.'], ['aprenda brincando', 'Embaralhe, vire as cartas e fale em voz alta: o Paul explica e a criança (ou o adulto) aprende.']];
const REDES = [['Instagram', '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>'], ['TikTok', '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2 4.3 5 4.5"/>'], ['YouTube', '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l5-2.8z" fill="currentColor" stroke="none"/>']];

const svg = (inner, n = 22) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', n); s.setAttribute('height', n); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.9'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; };

/** Monta a entrada. `p`: { links: [[nome, href]], onExperimentar(nome), onEntrar(nome, codigo), onLojinha(), pedido: elemento (código que a professora ainda vai liberar) }. Devolve { el, foco() }. */
export function entradaNova(p) {
  const PP = precoPasse();
  const [pSrc, pAlt, pH] = sorteia();
  const nome1 = h('input', { class: 'en-f', type: 'text', maxlength: 20, autocomplete: 'username', autocapitalize: 'words', 'aria-label': 'Seu nome', placeholder: 'seu nome' });
  const nome2 = h('input', { class: 'en-f', type: 'text', maxlength: 20, autocomplete: 'username', autocapitalize: 'words', 'aria-label': 'Seu nome', placeholder: 'seu nome' });
  const cod = h('input', { class: 'en-f en-cod', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Código de aluno', placeholder: 'código de aluno' });
  const err1 = h('p', { class: 'en-err', role: 'alert' }); const err2 = h('p', { class: 'en-err', role: 'alert' });
  const exp = h('button', { type: 'button', class: 'en-btn y', onclick: () => p.onExperimentar(nome1.value, err1) }, 'experimentar');
  const ent = h('button', { type: 'button', class: 'en-btn r', onclick: () => p.onEntrar(nome2.value, cod.value, err2) }, 'entrar');
  for (const [c, f] of [[nome1, () => exp.click()], [nome2, () => cod.focus()], [cod, () => ent.click()]]) c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); f(); } });
  const boxExp = h('section', { class: 'en-box', id: 'en-experimentar' }, h('h2', {}, 'experimentar ', h('span', {}, 'grátis')), nome1, err1, exp);
  const boxAluno = h('section', { class: 'en-box' }, h('h2', {}, 'já sou ', h('span', {}, 'aluno')), nome2, cod, p.pedido || null, err2, ent);
  const modal = h('div', { class: 'en-modal', hidden: true, onclick: () => { modal.hidden = true; } }, h('img', { src: `${A}por-que-paul.jpg`, alt: 'Por que Paul? Meu nome é uma homenagem ao Paul McCartney, um dos músicos favoritos da Bea.' }), h('i', { 'aria-hidden': 'true' }, '×'));
  const irLoja = (e) => { e.preventDefault(); p.onLojinha(); };
  const rol = (cls, ...kids) => h('div', { class: `en-rol ${cls || ''}`.trim() }, ...kids);
  const tile = (ic, txt, extra = {}) => h(extra.href ? 'a' : 'div', { class: `en-tile${extra.amarelo ? ' am' : ''}`, ...(extra.href ? { href: extra.href, onclick: irLoja } : {}) }, h('b', {}, icon(ic, 28)), txt, extra.sub ? h('small', {}, extra.sub) : null);
  const bea = h('section', { class: 'en-sec en-bea' }, h('h3', {}, 'quem ', h('span', {}, 'ensina')),
    h('img', { class: 'en-col', src: `${A}bea-colagem.jpg`, alt: 'Beatriz Marques, a prof. Bea: tocando bateria, em eventos e no estúdio', loading: 'lazy' }),
    h('b', { class: 'en-nome' }, 'Beatriz Marques'),
    h('p', { class: 'en-t2' }, 'Fundadora da Escola de Música Beaterista e professora de bateria há mais de 10 anos. Mais de 300 mil seguidores somados em suas redes sociais, alcançou com seus vídeos didáticos mais de 25 milhões de visualizações e continua impactando através dos cursos on-line, e-books e novas ferramentas como jogos, cards e plataformas interativas para alcançar evolução e resultados com uma linguagem que faz diferença no aprendizado.'),
    h('p', { class: 'en-par-t' }, 'parceiros da Bea'), h('img', { class: 'en-par', src: `${A}parceiros-branco.png`, alt: 'Pad Gorilla, Spark Cajons e Nagano Drums', loading: 'lazy' }));
  const prod = h('section', { class: 'en-sec' }, h('h3', {}, 'produtos ', h('span', {}, 'do Paul')),
    h('p', { class: 'en-pq' }, 'materiais em PDF pra imprimir em casa, em preto e branco: gasta pouca tinta.'),
    rol('', ...APOSTILAS.map(([src, t, s, pr]) => h('div', { class: 'en-prod' }, h('span', { class: 'en-tag' }, 'apostilas'), h('img', { src, alt: t, loading: 'lazy' }), h('b', {}, t), h('small', {}, s), h('em', {}, pr)))),
    h('div', { class: 'en-cv' }, h('img', { src: `${A}cards-venda.jpg`, alt: 'Cards do Robôterista Paul: Teoria 150 cartas, Instrumentos 90 cartas e Dicionário musical 120 palavras, R$ 19,90 cada. Combo dos 3 baralhos R$ 49,90.', loading: 'lazy' })),
    h('h4', { class: 'en-ibr' }, 'imprima, recorte e ', h('span', {}, 'aprenda brincando')),
    h('div', { class: 'en-passos' }, ...PASSOS.map(([t, d], i) => h('div', { class: 'en-c3' }, h('i', {}, String(i + 1)), h('b', {}, t), h('p', {}, d)))),
    h('img', { class: 'en-nalojinha', src: `${A}paul-na-lojinha.webp`, alt: 'Paul segurando os 3 baralhos: Teoria, Instrumentos e Dicionário. Na Lojinha.', width: 318, height: 350, loading: 'lazy' }),
    h('a', { class: 'en-adq', href: '#/lojinha', onclick: irLoja }, 'adquira já na lojinha'));
  const el = h('div', { class: 'en' },
    h('div', { class: 'en-top' }, h('img', { class: 's', src: 'assets/logo-512.png', alt: '', width: 42, height: 42 }), h('img', { class: 'n', src: 'assets/logo-nome.png', alt: 'Beaterista, escola de música', width: 88, height: 30 }), h('span', { class: 'sp' }),
      ...REDES.map(([n, d], i) => { const l = (p.links || []).find((x) => x[0] === n); return h('a', { class: 'en-red', href: l ? l[1] : '#', target: '_blank', rel: 'noopener noreferrer', 'aria-label': n }, svg(d)); })),
    h('header', { class: 'en-hero' }, h('img', { class: 'en-logo', src: `${A}logo-paul-branco.png`, alt: 'Robôterista Paul', width: 215, height: 91 }),
      h('p', { class: 'en-mao' }, 'te ajuda a tocar e aprender música através de ', h('b', {}, 'Aulas'), ', ', h('b', {}, 'Jogos'), ' e mais'),
      h('img', { class: 'en-paul', src: pSrc, alt: pAlt, style: `height:${pH}px` })),
    h('div', { class: 'en-tiles' }, tile('bulb', 'Jogos'), tile('study', 'Estudos'), tile('nota', 'Palco'), tile('bag', 'Lojinha', { href: '#/lojinha', amarelo: true, sub: 'toque aqui' })),
    h('button', { type: 'button', class: 'en-pqp', onclick: () => { modal.hidden = false; } }, h('img', { src: `${A}por-que-paul.jpg`, alt: '' }), h('span', {}, h('b', {}, 'por que Paul?'), h('small', {}, 'o nome tem uma homenagem. toque pra ler.')), h('i', { 'aria-hidden': 'true' }, '›')),
    boxExp, boxAluno,
    h('section', { class: 'en-box passe', id: 'en-passe' }, h('img', { class: 'en-passe-paul', src: 'assets/paul/animacoes/web/paul-presente.webp', alt: '', width: 104, height: 104, draggable: 'false', decoding: 'async' }), h('h2', {}, 'um ano inteiro de ', h('span', {}, 'música, jogos e descobertas!')),
      h('p', { class: 'p1' }, 'aprenda brincando com o Robôterista Paul! explore jogos educativos, desafios musicais, colecione figurinhas e aprenda no seu ritmo.'),
      h('p', { class: 'p2' }, 'um único pagamento. 12 meses de acesso.'),
      h('div', { class: 'pr solo' }, h('div', {}, PP.oferta ? h('span', { class: 'bf' }, 'oferta black friday · até ', PP.ate) : null, PP.oferta ? h('s', {}, `de ${PP.de}`) : null, h('b', { class: 'pix' }, PP.atual), h('small', {}, 'à vista no pix'))),
      h('a', { class: 'en-btn y en-passe-btn', href: PASSE_LINK(PP.atual), target: '_blank', rel: 'noopener noreferrer' }, '🎮 quero meu passe anual'),
      h('p', { class: 'p3' }, 'já é aluno da escola Beaterista? seu acesso anual está incluso! ', h('a', { href: '#en-experimentar', onclick: (e) => { e.preventDefault(); boxAluno.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => cod.focus({ preventScroll: true }), 450); } }, 'entre com seu código.'))),
    h('section', { class: 'en-sec' }, h('h3', {}, 'veja ', h('span', {}, 'por dentro')), h('p', { class: 'en-pq' }, 'telas reais do app. cada jogo diz o que desenvolve.'),
      rol('', ...JOGOS.map(([f, n, d]) => h('div', { class: 'en-jg' }, h('div', { class: 'ph' }, h('img', { src: `${A}${f}.jpg`, alt: `Tela: ${n}`, loading: 'lazy' })), h('b', {}, n), h('p', {}, d))))),
    bea, prod,
    h('p', { class: 'en-dir' }, '© Beaterista escola de música. Todos os direitos reservados.', h('br'), TERMO_DE_USO),
    h('div', { class: 'en-fixo' }, h('button', { type: 'button', onclick: () => { boxExp.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => nome1.focus({ preventScroll: true }), 450); } }, 'testar grátis agora')),
    modal);
  return { el, foco: () => {} };
}
