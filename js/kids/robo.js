// Paul: o robô baterista que acompanha a criança. Humor muda com o jogo (feliz, comemora, pensa, ops, dorme).
// Com mais estrelas ganha adesivos (estrela, estrelas, coroa).
import { h } from '../util.js';

export const MOODS = ['happy', 'cheer', 'think', 'oops', 'sleep', 'love', 'wave', 'wow', 'idea', 'laptop', 'coffee', 'music', 'crown', 'read', 'cool', 'sad', 'tired', 'point', 'peace', 'run', 'kit', 'drum', 'skate', 'walk', 'guitar', 'selfie', 'peek', 'cat', 'sit', 'drink', 'book', 'rest'];
/** Enfeite pela quantidade de estrelas: 0 nada, 1 estrela (10), 2 duas (40), 3 coroa (100). */
export const tierOf = (stars) => (stars >= 100 ? 3 : stars >= 40 ? 2 : stars >= 10 ? 1 : 0);

// Paul: desenhos da Bea (rabisco de caneta), recortados da folha de expressões em assets/paul/eNN.webp
const IMG = { happy: 'e02', cheer: 'e20', think: 'e05', oops: 'e25', sleep: 'e08', love: 'e26', wave: 'e20', wow: 'e09', idea: 'e13', laptop: 'e13', coffee: 'e10', music: 'e03', crown: 'e20', read: 'e06', cool: 'e27', sad: 'e17', tired: 'e28', hero: 'e20', point: 'p-point', peace: 'p-peace', run: 'p-run', kit: 'p-kit', drum: 'p-drum2', skate: 'p-skate', walk: 'p-walk', guitar: 'p-guitar', selfie: 'p-selfie', peek: 'p-peek', cat: 'p-cat', sit: 'p-sit', drink: 'p-drink', book: 'p-book', rest: 'p-rest' };
const STICKER = [
  '',
  '<path d="M16 3l3.8 8 8.7 1.1-6.4 6 1.7 8.7L16 22.5 8.2 26.8l1.7-8.7-6.4-6 8.7-1.1z" fill="#e3a82f" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M12 2l3.2 6.7 7.3.9-5.4 5 1.4 7.3L12 18.2l-6.5 3.7 1.4-7.3-5.4-5 7.3-.9z" fill="#e3a82f" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/><path d="M30 12l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7z" fill="#a31d30" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M4 26L2 8l9 8 7-12 7 12 9-8-2 18z" fill="#e3a82f" stroke="#1b1818" stroke-width="2.5" stroke-linejoin="round"/><circle cx="18" cy="5" r="2.5" fill="#a31d30" stroke="#1b1818" stroke-width="1.5"/>',
];

/** Caminho da imagem do Paul pelo humor. */
export const roboSrc = (mood = 'happy') => `assets/paul/${IMG[mood] || IMG.happy}.webp`;
/** Marcação do Paul (imagem do humor + adesivo do nível). */
export function roboMarkup(mood = 'happy', tier = 0) {
  const m = IMG[mood] ? mood : 'happy';
  const st = STICKER[tier] ? `<svg class="rb-sticker t${tier}" viewBox="0 0 40 30" aria-hidden="true">${STICKER[tier]}</svg>` : '';
  return `<span class="rb mood-${m}"><img class="rb-img" src="${roboSrc(m)}" alt="Paul" draggable="false">${st}</span>`;
}
/** Elemento do Paul. `say` (opcional) vira um balão de fala ao lado. */
export function robo({ mood = 'happy', tier = 0, size = 96, say = '' } = {}) {
  const box = h('div', { class: 'rb-wrap', style: `--rb:${Math.round(size * 1.5)}px` }); const fig = h('div', { class: 'rb-fig' });
  const bubble = h('p', { class: 'rb-say', hidden: !say, 'aria-live': 'polite' }, say);
  box.append(fig, bubble);
  const api = { el: box, set(m, text) { fig.innerHTML = roboMarkup(m, tier); if (text != null) { bubble.textContent = text; bubble.hidden = !text; } } };
  api.set(mood, say);
  fig.addEventListener('click', () => { bubble.textContent = 'meu nome é Paul! 🤘'; bubble.hidden = false; }); // o nome de verdade, só pra quem perguntar
  return api;
}
