// "O Paul conta": cartão com uma pose do Paul + frase musical, curiosidade, recado das marcas parceiras ou convite pras redes.
// Usado nas abas Jogos e Perfil. Cada toque em "outra" mostra a próxima (sorteia sem repetir até passar por todas).
import { h } from './util.js';
import { chirp } from './paul-talk.js';

const IG = 'https://www.instagram.com/beaterista_/', YT = 'https://www.youtube.com/@beateristadrummer', SITE = 'https://beaterista.com.br';
// vídeo novo do canal: aparece SEMPRE como primeira carta e volta no sorteio. Pra trocar, mude só id e título.
export const VIDEO_NOVO = { id: 'UvdaoUHo3XU', titulo: 'vlog na sede do TikTok Brasil' };
export const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_NOVO.id}`;
const POSES = ['n-amp', 'n-walk', 'n-break', 'n-stick', 'n-squat', 'n-skate'];
// [assunto, texto, pose (opcional), link (opcional), rótulo do link]
export const DICAS = [
  ['vídeo novo no canal', `saiu vídeo novo no canal da Bea: ${VIDEO_NOVO.titulo}! corre lá pra assistir e deixa o like 🎬`, 'n-walk', VIDEO_URL, 'assistir no youtube'],
  // convites pras telas do app (só na área dos alunos; a aba Jogos mostra uma diferente a cada volta)
  ['combo Beaterista', 'o COMBO ROBÔTERISTA chegou na Lojinha: 4 apostilas pra imprimir por R$ 79,90. dá uma olhada!', 'p-wave', '#/lojinha', 'ver o combo', 'aluno'],
  ['avaliação no Google', 'curte a Beaterista? avalia a escola no Google e manda o print: vale ★ pra roleta!', 'p-selfie', 'https://g.page/r/CS34GVfs3jjqEAE/review', 'avaliar no Google', 'aluno'],
  ['atividades extra', 'seguir a Bea, chamar um amigo e avaliar no Google são atividades extra que dão ★ pra girar a roleta.', 'p-point', '#/album', 'ver no álbum', 'aluno'],
  ['cartinhas', 'jogou, ganhou ★. juntou 15 ★? gira a roleta e pega cartinha nova pro seu álbum!', 'p-cool', '#/album', 'abrir o álbum', 'aluno'],
  ['jogos novos', 'tem jogo novo no app: Radar Musical, Taiko, Toca Aqui e mais. bora testar um?', 'p-run', '#/jogos', 'ver os jogos', 'aluno'],
  ['instrumentos', 'sabia que dá pra tocar bateria, violão, teclado e percussão aqui no app? vem tocar!', 'p-guitar', '#/tocar', 'ir tocar', 'aluno'],
  ['curiosidades', 'quer saber a história de quem tocou antes de você? tem curiosidade de músicos na aba Estudos.', 'p-book', '#/estudos/curiosidades', 'ler curiosidades', 'aluno'],
  ['aulinha do Paul', 'tem aulinha do Paul no app: bateria, teclado e violão, passo a passo. começa por uma!', 'p-drum2', '#/estudos/aulas', 'ver as aulinhas', 'aluno'],
  ['dicionário musical', 'esqueceu o que quer dizer uma palavra de música? procura no dicionário musical!', 'p-laptop', '#/dicionario', 'abrir o dicionário', 'aluno'],
  // frases musicais e curiosidades
  ['curiosidade', 'a pausa também é música: o silêncio entre as notas dá o balanço do groove.', 'n-amp'],
  ['curiosidade', 'o bumbo marca o chão, a caixa marca o meio e o chimbal é o relógio do groove.', 'n-stick'],
  ['curiosidade', 'bpm é quantas batidas cabem em 1 minuto. 60 bpm = 1 batida por segundo.', 'n-skate'],
  ['curiosidade', '4 por 4 quer dizer: 4 tempos em cada compasso, e a semínima vale 1 tempo.', 'n-squat'],
  ['frase musical', 'devagar e certo: quem toca devagar hoje toca rápido amanhã.', 'n-walk'],
  ['frase musical', 'errou? ótimo! é o erro que mostra o que o cérebro ainda precisa aprender.', 'n-break'],
  ['frase musical', 'tum tá tum tum tá! canta o ritmo antes de tocar, a mão aprende mais rápido.', 'n-stick'],
  // estudar em casa
  ['estudar em casa', '10 minutinhos todo dia valem mais que 1 hora só no sábado. bora treinar hoje?', 'n-walk'],
  ['estudar em casa', 'sem bateria em casa? bate na perna, na almofada ou num pad de estudo: o que vale é o movimento.', 'n-squat'],
  ['estudar em casa', 'liga o metrônomo e comece bem devagar. primeiro certo, depois rápido, nunca ao contrário.', 'n-amp'],
  ['estudar em casa', 'grava um vídeo do seu treino e assiste: dá pra ver o que melhorou e o que dá pra ajustar.', 'n-skate'],
  // toque simples
  ['toque simples', 'toque simples é uma mão de cada vez: D E D E D E D E (direita, esquerda). comece devagar e igual.', 'n-stick'],
  ['toque simples', 'no toque simples, o som das duas mãos precisa ficar igual. ouve com atenção: a esquerda soa tão bonita quanto a direita?', 'n-break'],
  ['toque simples', 'ensina um amigo o toque simples! quem ensina aprende duas vezes.', 'n-walk'],
  // outros instrumentos
  ['outros instrumentos', 'piano: a escala de dó maior só usa as teclas brancas: dó ré mi fá sol lá si.', 'n-amp'],
  ['outros instrumentos', 'violão: as 6 cordas soltas são mi lá ré sol si mi, da mais grossa pra mais fina.', 'n-walk'],
  ['outros instrumentos', 'cajón: grave no meio, agudo perto da borda. é uma caixa que vira banda inteira!', 'n-squat'],
  ['outros instrumentos', 'ukulele: sol dó mi lá. só 4 cordas e dá pra tocar muita música fácil.', 'n-skate'],
  ['outros instrumentos', 'xilofone: cada lâmina é uma nota. as maiores são mais graves e as menores mais agudas.', 'n-break'],
  // marcas e parceiros
  ['parceiros da Bea', 'a Bea tem parceria com a Pad Gorilla: pad de estudo pra treinar em casa. conhece?', 'n-stick'],
  ['parceiros da Bea', 'Spark Cajons: instrumento de percussão que cabe em qualquer rodinha de música.', 'n-squat'],
  ['parceiros da Bea', 'Nagano Drums é outra parceira da Bea. dá uma olhada nos perfis das marcas lá embaixo!', 'n-amp'],
  // Lojinha e jogos (só na área dos alunos)
  ['lojinha', 'tem ebook novo na Lojinha! são materiais digitais: dá pra estudar na tela e imprimir pra treinar no papel.', 'n-walk', '#/lojinha', 'ver a lojinha', 'aluno'],
  ['promoção black friday', 'PROMOÇÃO BLACK FRIDAY: o ebook Bateria Start está pela metade do preço! 44 páginas pra começar do zero.', 'n-amp', '#/lojinha', 'aproveitar', 'aluno'],
  ['jogos', 'bora jogar? tem bingo, velha, STOP, quebra-cabeça e mais. escolhe um e me desafia!', 'n-skate', '#/jogos', 'ver os jogos', 'aluno'],
  // beaterista, redes
  ['siga a Bea', 'segue a Bea no instagram pra ver os treinos e as novidades da Beaterista!', 'n-walk', IG, 'seguir no instagram'],
  ['canal', 'curtiu? deixa o like e se inscreve no canal do YouTube da Bea!', 'n-skate', YT, 'ver o canal'],
  ['beaterista', 'quer aula com a Bea? conhece a Beaterista Escola de Música!', 'n-break', SITE, 'abrir o site'],
];

/** Cartão compacto com uma arte do Paul: toque abre a arte inteira numa janela (sem ocupar a tela toda). */
export function arteDoPaul(arquivo, titulo, sub, alt) {
  const estrelaDaArte = async () => { // abrir a arte inteira vale 1 ★, só na 1ª vez de cada arte (por aluno)
    try {
      const D = await import('./figurinhas/dono.js'); const k = `beaterista-arte-estrela:${arquivo}`; if (D.lsLer(k) === '1') return;
      const M = await import('./figurinhas/mesa.js'); const n = await M.vitoria('arte', 1); if (n > 0) D.lsGravar(k, '1');
    } catch { /* sem perfil ou sem código: não ganha */ }
  };
  const abrir = () => {
    estrelaDaArte();
    const dlg = h('dialog', { class: 'pd-dlg', 'aria-label': titulo },
      h('button', { type: 'button', class: 'pd-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕'),
      h('img', { src: `assets/paul/${arquivo}.webp`, alt: alt || titulo }));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  };
  return h('button', { type: 'button', class: 'pd pd-arte', 'aria-label': `${titulo}: ver a arte`, onclick: abrir },
    h('img', { class: 'pd-thumb', src: `assets/paul/${arquivo}.webp`, alt: '', loading: 'lazy', draggable: 'false' }),
    h('span', {}, h('b', { class: 'pd-tag' }, 'Robôterista Paul'), h('span', { class: 'pd-text' }, titulo), h('small', { class: 'pd-sub' }, `${sub || 'toque pra ver a arte'} · toque pra abrir inteira (1 ★ na 1ª vez)`)));
}

let bag = [], last = -1;
function sortear() {
  if (!bag.length) {
    bag = DICAS.map((_, i) => i).filter((i) => DICAS[i][5] !== 'aluno' || document.documentElement.classList.contains('aluno-on'));
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
  }
  last = bag.pop(); return DICAS[last];
}

const ROD = 'beaterista-paul-rodizio';
/** Carta da vez: anda 1 a cada vez que a aba é aberta (guarda o ponto no aparelho), então nunca repete a de antes. O vídeo novo entra na fila como as outras. */
function cartaDaVez() {
  const ok = DICAS.filter((d) => d[5] !== 'aluno' || document.documentElement.classList.contains('aluno-on'));
  const app = ok.filter((d) => d[5] === 'aluno' || d[3] === VIDEO_URL), gerais = ok.filter((d) => !(d[5] === 'aluno' || d[3] === VIDEO_URL));
  const lista = []; for (let i = 0; i < Math.max(app.length, gerais.length); i++) { if (app[i]) lista.push(app[i]); if (gerais[i]) lista.push(gerais[i]); } // intercala: convite do app, frase, convite, frase…
  let n = 0; try { n = Number(localStorage.getItem(ROD)) || 0; localStorage.setItem(ROD, String(n + 1)); } catch { n = Math.floor(Math.random() * lista.length); }
  return lista[n % lista.length];
}

/** Cartão do Paul. `soBeaterista` não é usado: serve igual pro aluno e pra Bea. */
export function paulDica() {
  const img = h('img', { class: 'pd-img', alt: '', 'aria-hidden': 'true', draggable: 'false', decoding: 'async' });
  const tag = h('small', { class: 'pd-tag' }), text = h('p', { class: 'pd-text' }), row = h('div', { class: 'pd-row' });
  let sec = null;
  const mostrar = (it) => {
    const [t, tx, pose, href, rot] = it;
    if (sec) sec.classList.toggle('pd-novo', href === VIDEO_URL);
    const interno = href && String(href).startsWith('#');
    img.src = `assets/paul/${pose || POSES[Math.floor(Math.random() * POSES.length)]}.webp`;
    tag.textContent = t; text.textContent = tx;
    row.replaceChildren(h('button', { class: 'pd-btn', type: 'button', onclick: () => { chirp(); mostrar(sortear()); } }, 'outra ▸'),
      href ? h('a', { class: 'pd-btn go', href, ...(interno ? {} : { target: '_blank', rel: 'noopener noreferrer' }) }, rot || 'abrir') : null);
  };
  img.addEventListener('click', () => { chirp(); img.classList.add('pd-pop'); setTimeout(() => img.classList.remove('pd-pop'), 260); mostrar(sortear()); });
  const inicial = cartaDaVez(); mostrar(inicial); // uma carta diferente a cada vez que a aba é aberta
  // modelo "quadrinho": Paul grande saindo da borda, etiqueta do assunto e balão de fala
  sec = h('section', { class: `pd pd-q${inicial[3] === VIDEO_URL ? ' pd-novo' : ''}`, 'aria-label': 'o Paul conta' }, h('span', { class: 'pd-sticker', 'aria-hidden': 'true' }, '▶ NOVO'), h('i', { class: 'pd-luz', 'aria-hidden': 'true' }), tag, img, h('div', { class: 'pd-bal' }, text, row));
  return sec;
}
