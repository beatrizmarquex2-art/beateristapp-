// Imagem de cada item do bingo: foto do pacote (instrumentos), desenho vetorial (peças, figuras, símbolos) ou foto do catálogo (artistas).
// Nenhum item é trocado por outro: se faltar imagem, aparece só o nome (e o relatório da entrega lista o que falta).
import { ART } from './bingo-art.js';
import { ART2 } from './bingo-art2.js';
import { photoFor, photoSrc } from './bingo-logic.js';

const NS = 'http://www.w3.org/2000/svg';
export const INSTR_WEBP = new Set(['bateria', 'violao', 'guitarra', 'baixo', 'teclado', 'pandeiro', 'triangulo', 'saxofone', 'trompete', 'flauta', 'violino']);
const svgOf = (id) => ART2[id] || ART[id] || null;
/** Como o item é desenhado: 'foto' (artista), 'webp' (instrumento do pacote), 'svg' ou null (falta imagem). */
export function imgKind(tema, id) { if (tema === 'artistas') return 'foto'; if (tema === 'instrumentos' && INSTR_WEBP.has(id)) return 'webp'; return svgOf(id) ? 'svg' : null; }
export function svgMarkup(id) { const inner = svgOf(id); return inner ? `<svg xmlns="${NS}" viewBox="0 0 48 48" class="jg-art" aria-hidden="true" focusable="false">${inner}</svg>` : ''; }
/** URL da imagem (webp / foto), ou null para desenho vetorial. */
export function imgSrc(tema, id, salt) { const k = imgKind(tema, id); return k === 'foto' ? photoSrc(photoFor(id, salt)) : k === 'webp' ? `assets/jogos/instrumentos/${id}.webp` : null; }
/** HTML da imagem (para a impressão e miniaturas). */
export function imgHtml(tema, id, salt) {
  const k = imgKind(tema, id); if (!k) return '';
  return k === 'svg' ? svgMarkup(id) : `<img src="${imgSrc(tema, id, salt)}" alt="" draggable="false" decoding="async">`;
}
/** Elemento DOM da imagem. */
export function imgEl(tema, id, salt, cls = '') {
  const span = document.createElement('span'); span.className = `bg-pic ${cls}`.trim(); span.setAttribute('aria-hidden', 'true'); span.innerHTML = imgHtml(tema, id, salt); return span;
}
/** Itens de um tema que ainda não têm imagem (para o relatório). */
export function missing(tema, ids) { return ids.filter((id) => !imgKind(tema, id)); }
