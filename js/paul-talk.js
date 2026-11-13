// O Paul fala: clicar nele faz um barulhinho de robô e, de vez em quando, um pensamento dele aparece numa nuvem.
// Os pensamentos com link abrem a rede/site da Bea. Não aparecem no meio de uma música (jogo em tela cheia).
import { h } from './util.js';
import { audio } from './audio.js';

const IG = 'https://www.instagram.com/beaterista_/', YT = 'https://www.youtube.com/@beateristadrummer';
// Link da avaliação no Google: quando a Bea mandar o endereço, é só colocar aqui (vazio = a nuvem aparece sem link).
export const GOOGLE_REVIEW = 'https://g.page/r/CS34GVfs3jjqEAE/review';
export const THOUGHTS = [
  ['já estudou hoje?'],
  ['siga a Bea nas redes!', IG],
  ['vídeo novo no canal! corre pra assistir 🎬', 'https://www.youtube.com/watch?v=UvdaoUHo3XU'],
  ['veja os vídeos do canal!', YT],
  ['seja aluno online da Bea!', 'https://beaterista.com.br'],
  ['já tem o seu uniforme?'],
  ['paradiddle: D E D D E D E E'],
  ['semínima vale 1 tempo'],
  ['qual música tá na sua cabeça?'],
  ['avalie a escola no Google ⭐', GOOGLE_REVIEW],
  // dicas de estudo (didática e hábito)
  ['10 minutos todo dia vencem 1 hora no sábado'],
  ['devagar e certo: o metrônomo é seu amigo'],
  ['errou? ótimo, o cérebro aprende com o erro'],
  ['dorme bem: é dormindo que a mão decora o ritmo'],
  ['toca com as mãos e conta com a boca!'],
  ['primeiro devagar, depois rápido, nunca ao contrário'],
  ['gravou seu treino hoje? se ouvir, você evolui'],
  ['estuda um pedacinho de cada vez'],
  ['a pausa também é música'],
  ['respira fundo antes de começar a tocar'],
  ['ombros soltos, baqueta leve!'],
  ['qual rudimento você treinou hoje?'],
  // curiosidades
  ['o bumbo marca o chão, a caixa marca o meio'],
  ['a mínima vale 2 tempos'],
  ['a semibreve vale 4 tempos'],
  ['4 por 4: quatro tempos em cada compasso'],
  ['o hi-hat é o relógio do groove'],
  ['bpm é quantas batidas cabem em um minuto'],
  ['tem música nova pra aprender hoje?'],
  // incentivo e brincadeira
  ['você está indo muito bem! 🤘'],
  ['bora tocar um pouquinho?'],
  ['hoje é dia de groove!'],
  ['cada estrela conta, continua!'],
  ['será que eu tenho ritmo? tenho sim!'],
  ['psiu… já passou na aba jogos?'],
  // Lojinha e jogos (só na área dos alunos: o link abre dentro do app)
  ['tem ebook novo na Lojinha! 📄 dá pra estudar e imprimir', '#/lojinha', 'aluno'],
  ['PROMOÇÃO BLACK FRIDAY: ebook Bateria Start pela metade do preço! 🖤', '#/lojinha', 'aluno'],
  ['Bateria Kids: aprenda bateria colorindo! olha na Lojinha', '#/lojinha', 'aluno'],
  ['Jogo da Memória Musical pra imprimir e recortar, na Lojinha!', '#/lojinha', 'aluno'],
  ['Robôterista Ensina: figuras rítmicas pra imprimir. vai na Lojinha!', '#/lojinha', 'aluno'],
  ['bora jogar bingo musical? 🎲', '#/jogos/bingo', 'aluno'],
  ['me desafia no jogo da velha musical!', '#/jogos/velha', 'aluno'],
  ['quantas palavras musicais você sabe? joga STOP!', '#/jogos/stop', 'aluno'],
  ['quebra-cabeça do Paul tocando: monta aí!', '#/jogos/quebra', 'aluno'],
  ['já jogou o Uno Musical? tem cartas de figuras rítmicas!', '#/jogos/cartas', 'aluno'],
  ['bora tocar no Toca Aqui? leia e toque no tempo', '#/jogos/toca', 'aluno'],
  ['aula do Paul de bateria, teclado e violão: vem estudar!', '#/estudos/aulas', 'aluno'],
  ['tum tá tum tum tá!'],
  ['bateristas nunca chegam atrasados, chegam no tempo'],
  ['eu sou só um robozinho, mas sei contar até 4'],
  ['tem jogo novo na aba Jogos, vai lá!', '#/jogos', 'aluno'],
  ['beba água, baterista também se hidrata'],
  ['que tal ensinar um ritmo pra um amigo?'],
  ['música boa é a que você toca com vontade'],
];

/** Novidades da aba Jogos: o Paul fala numa nuvem quando o aluno abre a aba (alterna entre "jogo novo" e "mais chances de ganhar estrelas"). [texto, link, 'aluno']. */
export const NOVIDADES_JOGOS = [
  [
    ['jogo novo! o Taiko: toque E e D no tempo', '#/jogos/rudimentos', 'aluno'],
    ['jogo novo! Radar Musical: ache as palavras na grade', '#/dicas/caca', 'aluno'],
    ['jogo novo! Cruzadinha musical, vem preencher', '#/dicas/cruzadinha', 'aluno'],
    ['jogo novo! Quiz do Paul: será que você acerta?', '#/dicas/quiz', 'aluno'],
  ],
  [
    ['quer mais chances de ganhar estrelas? joga o Uno Musical!', '#/jogos/cartas', 'aluno'],
    ['mais estrelas: Cara a cara e Stop dão até 3 ★ por vitória!', '#/jogos/cara', 'aluno'],
    ['o Taiko dá estrela em cada fase: bora?', '#/jogos/rudimentos', 'aluno'],
    ['Radar Musical, Cruzadinha e Quiz do Paul valem até 3 ★ por partida', '#/dicas/caca', 'aluno'],
  ],
];

/** Barulhinho de robô: dois a quatro "blips" rápidos, cada vez um diferente. Só toca depois de um toque. */
export function chirp() {
  try {
    const c = audio(); const t0 = c.currentTime + 0.01;
    const base = 520 + Math.random() * 380;
    const pats = [[1, 1.5], [1, 1.25, 1.5], [1.5, 1, 1.5, 2], [1, 2], [1.2, 0.9, 1.6]];
    const seq = pats[Math.floor(Math.random() * pats.length)];
    seq.forEach((m, i) => {
      const t = t0 + i * 0.085; const o = c.createOscillator(); const g = c.createGain();
      o.type = i % 2 ? 'triangle' : 'square'; o.frequency.setValueAtTime(base * m, t); o.frequency.exponentialRampToValueAtTime(base * m * 1.18, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      if (localStorage.getItem('bt-mute') !== '1') o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.1);
    });
  } catch { /* sem áudio */ }
}

let box = null, hideT = 0, last = -1, bag = [];
/** Sorteia sem repetir: embaralha todas as falas e só recomeça quando todas já apareceram (a primeira nova nunca é a última antiga). */
const noAluno = () => document.documentElement.classList.contains('aluno-on');
const vale = (it) => it[2] !== 'aluno' || noAluno(); // pensamentos "aluno" levam pra telas que só existem na área dos alunos
function pick() {
  if (!bag.length) {
    bag = THOUGHTS.map((_, i) => i).filter((i) => vale(THOUGHTS[i]));
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
  }
  last = bag.pop(); return THOUGHTS[last];
}
function busy() { return document.hidden || document.querySelector('.al-entry, main.login') || document.querySelector('.av-play') || /* durante uma missão a nuvem não cobre o jogo */ document.body.classList.contains('rz-lock') || document.querySelector('#overlay .sheet, #overlay .drawer'); }

/** Mostra uma nuvem de pensamento (some sozinha). */
export function think(item, ms = 6500) {
  if (busy()) return;
  const [text, href] = item || pick();
  if (!box) { box = h('div', { class: 'pt-think', role: 'status' }); document.body.append(box); }
  const bubble = href
    ? h('a', { class: 'pt-cloud', href, ...(String(href).startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' }) }, text)
    : h('span', { class: 'pt-cloud' }, text);
  box.replaceChildren(h('img', { class: 'pt-face', src: 'assets/paul/e02.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' }), h('i', { class: 'pt-dot d1' }), h('i', { class: 'pt-dot d2' }), bubble);
  // cada vez aparece num lugar: esquerda, meio ou direita, mais embaixo ou um pouco acima
  const lado = ['flex-start', 'center', 'flex-end'][Math.floor(Math.random() * 3)];
  box.style.justifyContent = lado;
  box.style.bottom = `${(document.querySelector('.bottom-nav') ? 96 : 22) + (Math.random() < 0.4 ? 90 + Math.round(Math.random() * 70) : 0)}px`;
  box.classList.remove('out'); void box.offsetWidth; box.classList.add('on');
  // o balão acaba onde a frase acaba: mede a linha mais larga e encolhe até ela
  try {
    const cs = getComputedStyle(bubble), pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    const r = document.createRange(); r.selectNodeContents(bubble);
    const w = Math.max(...[...r.getClientRects()].map((q) => q.width));
    if (w > 0 && isFinite(w)) bubble.style.width = `${Math.ceil(w + pad + 1)}px`;
  } catch { /* sem medida, fica como estava */ }
  clearTimeout(hideT); hideT = setTimeout(() => { box.classList.remove('on'); box.classList.add('out'); }, ms);
}

/** Liga o clique no Paul e os pensamentos soltos. `allowed()` diz se, na tela atual, pode aparecer. */
let started = false;
export function startPaul({ allowed = () => true, first = 9000, every = [26000, 48000] } = {}) {
  if (started) return; started = true;
  document.addEventListener('click', (e) => {
    const p = e.target.closest && e.target.closest('.al-paul-img, .rb-img, .bn-paul, .login-paul');
    if (!p) return;
    chirp(); p.classList.remove('pt-tap'); void p.offsetWidth; p.classList.add('pt-tap');
    if (allowed()) think();
  });
  const loop = (ms) => setTimeout(() => { if (allowed()) think(); loop(every[0] + Math.random() * (every[1] - every[0])); }, ms);
  loop(first);
}
