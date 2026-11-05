// Criador de cartinha: escolhe um dos 8 modelos, a foto entra na janela (arrasta e dá zoom) e o nome vai no rótulo.
// Usado na aba Perfil dos alunos e no "Criar cartinha" do app da Bea. A foto fica só no aparelho.
import { h } from '../util.js';
import { MODELOS2 } from './modelos2-data.js';
import { janelaLocal } from './card2.js';
import { cartaCanvas } from './postar.js';
import { shareUI } from './share-ui.js';

export const IDS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];
/** opts: { cfg (objeto salvo pelo chamador), salvar(), nome() -> texto do rótulo, titulo, extra() -> campos do post (ex.: tituloPost) } */
export function criador({ cfg, salvar, nome, titulo = 'minha figurinha', tituloShare = 'baixar minha figurinha', extra = () => ({}) }) {
  let fotoImg = null, share = null, alive = true, raf = 0;
  const entry = () => ({ modelo2: cfg.modelo, artista_banda: (nome() || '').trim() || 'SEU NOME', fotoImg, ajuste: { zoom: cfg.zoom, ox: cfg.ox, oy: cfg.oy }, raridade: MODELOS2[cfg.modelo].raridade, secao: 'Comum', codigo: '', ...extra() });
  const cv = h('canvas', { class: 'pf-canvas', width: 720, height: 950, role: 'img', 'aria-label': 'Prévia da cartinha. Arraste para mover a foto.' });
  const zoom = h('input', { type: 'range', min: 1, max: 3, step: 0.02, value: cfg.zoom, 'aria-label': 'Zoom da foto', oninput: (ev) => { cfg.zoom = Number(ev.target.value); limita(); salvar(); pintar(); } });
  const vazio = h('p', { class: 'pf-vazio' }, 'escolha uma foto pra ver a cartinha ✨');
  const quadros = h('div', { class: 'pf-quadros', role: 'radiogroup', 'aria-label': 'Escolha o modelo' }, IDS.map((id) => h('button', { type: 'button', role: 'radio', 'aria-label': `Modelo ${id.slice(1)} (${MODELOS2[id].raridade})`, 'aria-checked': String(cfg.modelo === id), class: `pf-q${cfg.modelo === id ? ' on' : ''}`, 'data-id': id, onclick: () => { cfg.modelo = id; cfg.ox = 0; cfg.oy = 0; salvar(); quadros.querySelectorAll('button').forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); pintar(); } },
    h('img', { src: `assets/figurinhas/modelos2/${id}.webp`, alt: '', width: 72, height: 95, loading: 'lazy' }))));
  const slot = h('div', { class: 'pf-share' });
  const el = h('section', { class: 'card pad pf-cria' }, h('h2', { class: 'tag' }, titulo), quadros, h('div', { class: 'pf-cv-box' }, cv, vazio), h('label', { class: 'pf-zoom' }, h('span', {}, 'zoom'), zoom), h('p', { class: 'muted' }, 'arraste a foto pra enquadrar.'), slot);
  function limita() {
    if (!fotoImg) return; const L = janelaLocal(cfg.modelo), bw = L.bb.x1 - L.bb.x0, bh = L.bb.y1 - L.bb.y0, pw = fotoImg.naturalWidth, ph = fotoImg.naturalHeight, sc = Math.max(bw / pw, bh / ph) * cfg.zoom;
    const ex = Math.max(0, (pw * sc - bw) / 2), ey = Math.max(0, (ph * sc - bh) / 2); cfg.ox = Math.max(-ex, Math.min(ex, cfg.ox)); cfg.oy = Math.max(-ey, Math.min(ey, cfg.oy));
  }
  function pintar() {
    cancelAnimationFrame(raf); raf = requestAnimationFrame(async () => {
      if (!alive) return; vazio.hidden = !!fotoImg; cv.classList.toggle('sem', !fotoImg);
      if (!fotoImg) { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); const tpl = new Image(); tpl.onload = () => g.drawImage(tpl, 0, 0, cv.width, cv.height); tpl.src = `assets/figurinhas/modelos2/${cfg.modelo}.webp`; return; }
      try { const c = await cartaCanvas(entry(), { escala: 2 }); if (!alive) return; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(c, 0, 0, cv.width, cv.height); } catch { /* ok */ }
      share && share.refresh && share.refresh(entry());
    });
  }
  let drag = null;
  cv.addEventListener('pointerdown', (ev) => { if (!fotoImg) return; drag = { x: ev.clientX, y: ev.clientY, ox: cfg.ox, oy: cfg.oy }; cv.setPointerCapture(ev.pointerId); });
  cv.addEventListener('pointermove', (ev) => { if (!drag) return; const k = 360 / cv.clientWidth; cfg.ox = drag.ox + (ev.clientX - drag.x) * k; cfg.oy = drag.oy + (ev.clientY - drag.y) * k; limita(); pintar(); });
  const fim = () => { if (drag) { drag = null; salvar(); } };
  cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  return {
    el,
    /** Foto nova (ou null). Refaz o botão de baixar e a prévia. */
    setFoto(img, { resetar = true } = {}) {
      fotoImg = img; if (resetar && img) { cfg.zoom = 1; cfg.ox = 0; cfg.oy = 0; salvar(); }
      zoom.value = cfg.zoom; if (share) { share.cleanup(); share = null; }
      if (fotoImg) { share = shareUI(entry(), { titulo: tituloShare }); slot.replaceChildren(share); } else slot.replaceChildren(h('p', { class: 'muted' }, 'depois de escolher a foto, aparece aqui o botão de baixar e postar.'));
      limita(); pintar();
    },
    refresh: pintar,
    cleanup() { alive = false; cancelAnimationFrame(raf); if (share) share.cleanup(); },
  };
}
