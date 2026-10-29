// Tema visual da bateria (colagem, vinil, pôster): o mesmo dos Jogos de ritmo, guardado neste aparelho (bt-rz-theme).
// Serve ao "Explorar a bateria" e à "Bateria de toque". O logo do Beaterista entra no bumbo, sem pegar toque.
import { h } from '../util.js';

export const KIT_THEMES = [['colagem', 'colagem'], ['vinil', 'vinil'], ['poster', 'pôster']];
export const kitTheme = () => { try { const t = localStorage.getItem('bt-rz-theme'); return KIT_THEMES.some((x) => x[0] === t) ? t : 'colagem'; } catch { return 'colagem'; } };

/** Troca a palavra do bumbo pelo logo do Beaterista (a imagem não recebe toque: tocar nela toca o bumbo). */
export function putLogo(root) {
  const bd = root.querySelector('[data-p="bd"]'); if (!bd || bd.querySelector('image')) return;
  const tx = bd.querySelector('text'); if (tx) tx.remove();
  const im = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  for (const [k, v] of Object.entries({ href: 'assets/logo-menu-beaterista.webp', x: 160, y: 192, width: 100, height: 51, 'pointer-events': 'none', preserveAspectRatio: 'xMidYMid meet' })) im.setAttribute(k, String(v));
  bd.append(im);
}
/** Faz a peça "brilhar" sem forçar o navegador a recalcular a tela a cada toque (era o que deixava o iPhone pesado). */
export function flash(el) {
  if (!el) return; el.classList.remove('hit');
  requestAnimationFrame(() => { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 170); });
}
/** Linha "tema" com os três botões; `onPick` roda depois de guardar a escolha. */
export const themeRow = (onPick) => h('div', { class: 'row kd-modes kd-themes', role: 'group', 'aria-label': 'Tema da bateria' }, h('small', {}, 'tema'),
  ...KIT_THEMES.map(([k, t]) => h('button', { type: 'button', class: `kd-chip${kitTheme() === k ? ' on' : ''}`, 'aria-pressed': String(kitTheme() === k), onclick: () => { try { localStorage.setItem('bt-rz-theme', k); } catch { /* sem armazenamento */ } onPick(); } }, t)));
/** A peça tocada: a que está sob o dedo ou, se o dedo caiu no espacinho entre as peças, a mais perto (até ~40 px). Assim não "falha" ao tocar quase em cima. */
export function pieceAt(root, e) {
  const g = e.target.closest && e.target.closest('[data-p]'); if (g) return g;
  let best = null; let bd = 40;
  for (const k of root.querySelectorAll('.kp')) {
    const r = k.getBoundingClientRect(); const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right); const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = k; }
  }
  return best;
}
