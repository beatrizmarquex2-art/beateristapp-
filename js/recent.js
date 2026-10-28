// Recentes: as últimas telas que você abriu (guardado só neste aparelho), pra voltar sem procurar de novo.
const KEY = 'beaterista-recent'; const MAX = 3;
export function recents() { try { const l = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(l) ? l.filter((x) => x && x.h && x.t) : []; } catch { return []; } }
/** Guarda a tela atual. O título vem do cabeçalho da tela (espera ela desenhar). */
export function remember(hash) {
  if (!hash || hash === '#/inicio' || hash === '#/ajustes' || hash === '#/em-breve' || /^#\/em-breve/.test(hash)) return;
  setTimeout(() => {
    if ((location.hash || '') !== hash) return;
    const el = document.querySelector('#view .banner, #view h1, #view .kx-pagetitle, #view .kx-title .t2');
    const t = el && el.textContent.trim(); if (!t || /^ops$/i.test(t)) return;
    try { const l = recents().filter((x) => x.h !== hash); l.unshift({ h: hash, t: t.slice(0, 40), at: Date.now() }); localStorage.setItem(KEY, JSON.stringify(l.slice(0, MAX))); } catch { /* sem armazenamento */ }
    document.dispatchEvent(new CustomEvent('recents-changed'));
  }, 700);
}
