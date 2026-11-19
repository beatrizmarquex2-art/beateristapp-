// Ícones do Robôterista Paul (assets/icones-paul/*.webp, 192 px com fundo transparente): usados nos botões (20–36 px) e cards (48–64 px).
import { h } from './util.js';
export const ICONES_PAUL = ['roleta-paul', 'album-figurinhas', 'estrela-recompensa', 'perfil-camera', 'passe-beaterista', 'contagem-quatro-tempos', 'loop-reproducao'];
/** `<img>` decorativo do ícone `nome` com `tam` px. */
export const iconePaul = (nome, tam = 24) => h('img', { class: 'ic-paul', src: `assets/icones-paul/${nome}.webp`, alt: '', width: tam, height: tam, draggable: 'false', 'aria-hidden': 'true' });
