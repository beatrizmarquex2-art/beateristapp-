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
  // beaterista, redes
  ['siga a Bea', 'segue a Bea no instagram pra ver os treinos e as novidades da Beaterista!', 'n-walk', IG, 'seguir no instagram'],
  ['canal', 'curtiu? deixa o like e se inscreve no canal do YouTube da Bea!', 'n-skate', YT, 'ver o canal'],
  ['beaterista', 'quer aula com a Bea? conhece a Beaterista Escola de Música!', 'n-break', SITE, 'abrir o site'],
];

/** Cartão compacto com uma arte do Paul: toque abre a arte inteira numa janela (sem ocupar a tela toda). */
export function arteDoPaul(arquivo, titulo, sub, alt) {
  const abrir = () => {
    const dlg = h('dialog', { class: 'pd-dlg', 'aria-label': titulo },
      h('button', { type: 'button', class: 'pd-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕'),
      h('img', { src: `assets/paul/${arquivo}.webp`, alt: alt || titulo }));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  };
  return h('button', { type: 'button', class: 'pd pd-arte', 'aria-label': `${titulo}: ver a arte`, onclick: abrir },
    h('img', { class: 'pd-thumb', src: `assets/paul/${arquivo}.webp`, alt: '', loading: 'lazy', draggable: 'false' }),
    h('span', {}, h('b', { class: 'pd-tag' }, 'Robôterista Paul'), h('span', { class: 'pd-text' }, titulo), h('small', { class: 'pd-sub' }, sub || 'toque pra ver a arte')));
}

let bag = [], last = -1;
function sortear() {
  if (!bag.length) {
    bag = DICAS.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
  }
  last = bag.pop(); return DICAS[last];
}

/** Cartão do Paul. `soBeaterista` não é usado: serve igual pro aluno e pra Bea. */
export function paulDica() {
  const img = h('img', { class: 'pd-img', alt: '', 'aria-hidden': 'true', draggable: 'false', decoding: 'async' });
  const tag = h('small', { class: 'pd-tag' }), text = h('p', { class: 'pd-text' }), row = h('div', { class: 'pd-row' });
  const mostrar = (it) => {
    const [t, tx, pose, href, rot] = it;
    img.src = `assets/paul/${pose || POSES[Math.floor(Math.random() * POSES.length)]}.webp`;
    tag.textContent = t; text.textContent = tx;
    row.replaceChildren(h('button', { class: 'pd-btn', type: 'button', onclick: () => { chirp(); mostrar(sortear()); } }, 'outra ▸'),
      href ? h('a', { class: 'pd-btn go', href, target: '_blank', rel: 'noopener noreferrer' }, rot || 'abrir') : null);
  };
  img.addEventListener('click', () => { chirp(); img.classList.add('pd-pop'); setTimeout(() => img.classList.remove('pd-pop'), 260); mostrar(sortear()); });
  mostrar(DICAS[0]); // a primeira carta é sempre o vídeo novo
  // modelo "quadrinho": Paul grande saindo da borda, etiqueta do assunto e balão de fala
  return h('section', { class: 'pd pd-q', 'aria-label': 'o Paul conta' }, tag, img, h('div', { class: 'pd-bal' }, text, row));
}
