// Tema da Aventura e dos mapas: escuro (padrão) ou claro, nas cores da escola. As cores ficam em css/aventura-tema.css (html[data-av]).
import { h } from '../util.js';
import { mundoDe } from './mundos.js';
const KEY = 'beaterista-av-tema';
export const getTema = () => { try { return localStorage.getItem(KEY) === 'claro' ? 'claro' : 'escuro'; } catch { return 'escuro'; } };
export const applyTema = (t = getTema()) => { document.documentElement.dataset.av = t; };
const setTema = (t) => { try { localStorage.setItem(KEY, t); } catch { /* sem armazenamento: vale só nesta sessão */ } applyTema(t); };
/** Botão ☀/🌙 pro cabeçalho. Troca na hora (os dois modos usam as mesmas telas). */
export function temaButton() {
  const b = h('button', { type: 'button', class: 'av-tema' });
  const paint = () => { const t = getTema(); b.textContent = t === 'claro' ? '🌙' : '☀'; b.setAttribute('aria-label', t === 'claro' ? 'Trocar para o modo escuro' : 'Trocar para o modo claro'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { setTema(getTema() === 'claro' ? 'escuro' : 'claro'); paint(); });
  paint(); return b;
}
applyTema();

/** Visual do mapa: "divertido" (padrão, com adesivos e o Paul) ou "serio" (pra adultos: sem adesivos, sem Paul, discos lisos e traço fino). Lembrado no aparelho. */
const KEY_EST = 'beaterista-av-estilo';
export const getEstilo = () => { try { return localStorage.getItem(KEY_EST) === 'serio' ? 'serio' : 'divertido'; } catch { return 'divertido'; } };
export const applyEstilo = (e = getEstilo()) => { if (e === 'serio') document.documentElement.dataset.estilo = 'serio'; else delete document.documentElement.dataset.estilo; };
export function estiloButton() {
  const b = h('button', { type: 'button', class: 'av-tema av-estilo' });
  const paint = () => { const s = getEstilo() === 'serio'; b.textContent = '◐'; b.setAttribute('aria-pressed', String(s)); b.setAttribute('aria-label', s ? 'Trocar para o visual divertido' : 'Trocar para o visual minimalista'); b.title = b.getAttribute('aria-label'); };
  b.addEventListener('click', () => { const n = getEstilo() === 'serio' ? 'divertido' : 'serio'; try { localStorage.setItem(KEY_EST, n); } catch { /* vale só nesta sessão */ } applyEstilo(n); paint(); try { window.dispatchEvent(new Event('estilo-mudou')); } catch { /* ok */ } });
  paint(); return b;
}
applyEstilo();

/** Mundos coloridos (aprovados pela Bea): fundo clarinho ou amarelo, tudo em azul-marinho. A pauLta e os outros mapas ficam como sempre.
 *  Escolhido pelo endereço, então vale pro mapa, o seletor de modo e as missões. As cores ficam em css/aventura-tema.css (html[data-mundo]). */
const aplicarMundo = () => { const m = mundoDe(location.hash); if (m) document.documentElement.dataset.mundo = m; else delete document.documentElement.dataset.mundo; };
if (typeof window !== 'undefined' && window.addEventListener) { window.addEventListener('hashchange', aplicarMundo); aplicarMundo(); }
