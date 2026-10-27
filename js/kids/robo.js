// Paul: o robô baterista que acompanha a criança. Humor muda com o jogo (feliz, comemora, pensa, ops, dorme).
// Desenhos da Bea (rabisco de caneta) recortados em assets/paul/. Com mais estrelas ganha adesivos (estrela, estrelas, coroa).
import { h } from '../util.js';

export const MOODS = ['happy', 'cheer', 'think', 'oops', 'sleep', 'love', 'laptop', 'side', 'hero'];
/** Enfeite pela quantidade de estrelas: 0 nada, 1 estrela (10), 2 duas (40), 3 coroa (100). */
export const tierOf = (stars) => (stars >= 100 ? 3 : stars >= 40 ? 2 : stars >= 10 ? 1 : 0);

const IMG = { happy: 'happy', cheer: 'drum', think: 'think', oops: 'dots', sleep: 'sleep', love: 'love', laptop: 'laptop', side: 'side', hero: 'hero' };
const STICKER = [
  '',
  '<path d="M16 3l3.8 8 8.7 1.1-6.4 6 1.7 8.7L16 22.5 8.2 26.8l1.7-8.7-6.4-6 8.7-1.1z" fill="#e3a82f" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M12 2l3.2 6.7 7.3.9-5.4 5 1.4 7.3L12 18.2l-6.5 3.7 1.4-7.3-5.4-5 7.3-.9z" fill="#e3a82f" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/><path d="M30 12l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7z" fill="#d92031" stroke="#1b1818" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M4 26L2 8l9 8 7-12 7 12 9-8-2 18z" fill="#e3a82f" stroke="#1b1818" stroke-width="2.5" stroke-linejoin="round"/><circle cx="18" cy="5" r="2.5" fill="#d92031" stroke="#1b1818" stroke-width="1.5"/>',
];

/** Marcação do Paul (imagem do humor + adesivo do nível). */
export function roboMarkup(mood = 'happy', tier = 0) {
  const f = IMG[mood] || 'happy';
  const st = STICKER[tier] ? `<svg class="rb-sticker t${tier}" viewBox="0 0 40 30" aria-hidden="true">${STICKER[tier]}</svg>` : '';
  return `<span class="rb mood-${mood}"><img class="rb-img" src="assets/paul/${f}.webp" alt="Paul" draggable="false">${st}</span>`;
}
/** Elemento do Paul. `say` (opcional) vira um balão de fala ao lado. */
export function robo({ mood = 'happy', tier = 0, size = 96, say = '' } = {}) {
  const box = h('div', { class: 'rb-wrap', style: `--rb:${Math.round(size * 1.25)}px` }); const fig = h('div', { class: 'rb-fig' });
  const bubble = h('p', { class: 'rb-say', hidden: !say, 'aria-live': 'polite' }, say);
  box.append(fig, bubble);
  const api = { el: box, set(m, text) { fig.innerHTML = roboMarkup(m, tier); if (text != null) { bubble.textContent = text; bubble.hidden = !text; } } };
  api.set(mood, say);
  return api;
}

/** Endereço da imagem do humor (pra desenhar no PDF). */
export const roboSrc = (mood = 'happy') => `assets/paul/${IMG[mood] || 'happy'}.webp`;
