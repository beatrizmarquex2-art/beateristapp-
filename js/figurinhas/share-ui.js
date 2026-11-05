// Caixinha "baixar pra postar": escolhe o modelo e o formato, vê a prévia e baixa (ou abre a folha de compartilhar no celular).
import { h } from '../util.js';
import * as P from './postar.js';

const FORM = [['post', 'post (feed)'], ['story', 'story'], ['carta', 'só a cartinha']];
export function shareUI(entry0, { titulo = 'baixar pra postar' } = {}) {
  let entry = entry0;
  let modelo = 'colagem', formato = 'post', seq = 0, alive = true;
  const prev = h('img', { class: 'fig-prev', alt: 'Prévia da imagem', width: 240, height: 300 });
  const msg = h('p', { class: 'fig-note', 'aria-live': 'polite' });
  const chips = (lista, atual, set) => h('div', { class: 'fig-chips', role: 'radiogroup' }, lista.map(([k, nome]) => h('button', { type: 'button', role: 'radio', class: `chip-btn${atual() === k ? ' on' : ''}`, 'aria-checked': String(atual() === k), 'data-k': k, onclick: (ev) => { set(k); ev.currentTarget.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); desenhar(); } }, nome)));
  const modelos = chips(P.MODELOS_POST, () => modelo, (k) => { modelo = k; });
  const formatos = chips(FORM, () => formato, (k) => { formato = k; modelos.hidden = k === 'carta'; });
  let t = null;
  function desenhar() {
    clearTimeout(t); const n = ++seq; prev.classList.add('carregando');
    t = setTimeout(async () => {
      try {
        const c = await P.desenhar(entry, formato, modelo); if (!alive || n !== seq) return;
        const k = 300 / c.height, s = document.createElement('canvas'); s.width = Math.round(c.width * k); s.height = 300; const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, s.width, s.height);
        prev.src = s.toDataURL('image/jpeg', 0.82); prev.width = s.width; prev.classList.remove('carregando');
      } catch { if (alive && n === seq) { msg.textContent = 'não consegui montar a prévia.'; prev.classList.remove('carregando'); } }
    }, 120);
  }
  const bt = h('button', { type: 'button', class: 'btn primary wide', onclick: async () => {
    bt.disabled = true; msg.textContent = 'gerando a imagem…';
    try { const r = await P.compartilhar(entry, formato, modelo); msg.textContent = r === 'baixado' ? 'imagem baixada! é só postar 🎉' : r === 'compartilhado' ? 'pronto!' : ''; } catch { msg.textContent = 'não consegui gerar agora. tente de novo.'; }
    bt.disabled = false; } }, 'baixar / compartilhar');
  const el = h('div', { class: 'fig-share' }, h('b', {}, titulo), formatos, modelos, h('div', { class: 'fig-prev-box' }, prev), bt, msg);
  el.cleanup = () => { alive = false; clearTimeout(t); };
  el.refresh = (novo) => { if (novo) entry = novo; desenhar(); }; // a figurinha mudou (nome, foto, modelo): refaz a prévia
  desenhar();
  return el;
}
