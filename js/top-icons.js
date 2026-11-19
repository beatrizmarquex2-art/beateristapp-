// Ícones de linha do topo da área dos alunos (opção A da Bea, 19/nov/2026): alto-falante, música, atualizar e engrenagem.
// Mesmo traço e mesma cor dos ícones das salas (bonequinhos.js). `cortado` = desligado (risco por cima).
import { h } from './util.js';

const LINHA = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const RISCO = '<path class="ac" d="M4 4l16 16"/>';
const SVG = {
  som: LINHA('<path d="M4 9.500v5h3.500L12.500 19V5L7.500 9.500z"/><path class="ac" d="M16 9a4.500 4.500 0 0 1 0 6M18.800 6.500a8.500 8.500 0 0 1 0 11"/>'),
  somOff: LINHA(`<path d="M4 9.500v5h3.500L12.500 19V5L7.500 9.500z"/>${RISCO}`),
  musica: LINHA('<path d="M9 18V6l10-2v12"/><circle cx="6.500" cy="18" r="2.500"/><circle class="ac" cx="16.500" cy="16" r="2.500"/>'),
  musicaOff: LINHA(`<path d="M9 18V6l10-2v12"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="16.500" cy="16" r="2.500"/>${RISCO}`),
  atualizar: LINHA('<path d="M20 11a8 8 0 1 0-2.300 5.700"/><path class="ac" d="M20 4v7h-7"/>'),
  engrenagem: LINHA('<circle class="ac" cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/>'),
  chave: LINHA('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/><circle class="ac" cx="8" cy="15" r="1.200"/>'),
  olho: LINHA('<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle class="ac" cx="12" cy="12" r="3"/>'),
  olhoOff: LINHA('<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="ac" d="M4 4l16 16"/>'),
  pausa: LINHA('<rect x="6" y="5" width="4" height="14" rx="1.500"/><rect class="ac" x="14" y="5" width="4" height="14" rx="1.500"/>'),
  sair: LINHA('<path d="M10 4H6.500A1.500 1.500 0 0 0 5 5.500v13A1.500 1.500 0 0 0 6.500 20H10"/><path class="ac" d="M14 8l4 4-4 4M18 12H9"/>'),
};
/** Um <span class="ic-top"> com o ícone (SVG interno, nunca dado do usuário). */
export function iconeTopo(nome) { const s = h('span', { class: 'ic-top', 'aria-hidden': 'true' }); s.innerHTML = SVG[nome] || ''; return s; }
