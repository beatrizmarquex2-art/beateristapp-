// Caixinha "baixar pra postar": escolhe o modelo e o formato, vê a prévia e baixa (ou abre a folha de compartilhar no celular).
import { h } from '../util.js';
import * as P from './postar.js';

const FORM = [['post', 'post (feed)'], ['story', 'story'], ['perfil', 'foto de perfil'], ['carta', 'só a cartinha']];
export function shareUI(entry0, { titulo = 'baixar pra postar' } = {}) {
  let entry = entry0;
  let modelo = 'colagem', formato = 'post', fundo = 'prata', seq = 0, seqMini = 0, alive = true, tm = null;
  const prev = h('img', { class: 'fig-prev', alt: 'Prévia da imagem', width: 240, height: 300 });
  const msg = h('p', { class: 'fig-note', 'aria-live': 'polite' });
  const chips = (lista, atual, set) => h('div', { class: 'fig-chips', role: 'radiogroup' }, lista.map(([k, nome]) => h('button', { type: 'button', role: 'radio', class: `chip-btn${atual() === k ? ' on' : ''}`, 'aria-checked': String(atual() === k), 'data-k': k, onclick: (ev) => { set(k); ev.currentTarget.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); desenhar(); } }, nome)));
  // modelos de post: miniaturas de verdade (cada uma já mostra a cartinha no desenho daquele modelo)
  const thumbs = {};
  const modelos = h('div', { class: 'fig-chips fig-thumbs', role: 'radiogroup', 'aria-label': 'Modelo do post' }, P.MODELOS_POST.map(([k, nome]) => {
    const im = h('img', { alt: '', width: 72, height: 128, draggable: 'false' }); thumbs[k] = im;
    return h('button', { type: 'button', role: 'radio', class: `fig-th${modelo === k ? ' on' : ''}`, 'aria-checked': String(modelo === k), 'aria-label': nome, 'data-k': k, onclick: (ev) => { modelo = k; ev.currentTarget.parentNode.querySelectorAll('button').forEach((b) => { const on = b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); desenhar(); } }, im, h('span', {}, nome));
  }));
  async function miniaturas(n) { // as 4 miniaturas, uma de cada vez (cancela se a cartinha mudou no meio)
    if (formato !== 'post' && formato !== 'story') return;
    for (const [k] of P.MODELOS_POST) {
      if (!alive || n !== seqMini) return;
      try { const c = await P.desenhar({ ...entry, fundoPerfil: fundo }, formato, k); if (!alive || n !== seqMini) return; const w = 84, hh = Math.round((w * c.height) / c.width), m = document.createElement('canvas'); m.width = w * 2; m.height = hh * 2; const g = m.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, m.width, m.height); thumbs[k].src = m.toDataURL('image/jpeg', 0.7); thumbs[k].width = w; thumbs[k].height = hh; } catch { /* sem miniatura */ }
    }
  }
  const fundos = chips(P.FUNDOS_PERFIL, () => fundo, (k) => { fundo = k; }); fundos.hidden = true; fundos.setAttribute('aria-label', 'Cor do fundo da foto de perfil');
  const formatos = chips(FORM, () => formato, (k) => { formato = k; seqMini++; modelos.hidden = k === 'carta' || k === 'perfil'; fundos.hidden = k !== 'perfil'; });
  let t = null;
  function desenhar() {
    clearTimeout(t); const n = ++seq; prev.classList.add('carregando');
    t = setTimeout(async () => {
      try {
        let c = await P.desenhar({ ...entry, fundoPerfil: fundo }, formato, modelo); if (!alive || n !== seq) return;
        if (formato === 'perfil') c = P.mockupPerfil(c, entry.artista_banda); // prévia: como fica no perfil da rede social
        const k = 300 / c.height, s = document.createElement('canvas'); s.width = Math.round(c.width * k); s.height = 300; const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, s.width, s.height);
        prev.src = s.toDataURL('image/jpeg', 0.82); prev.width = s.width; prev.classList.remove('carregando');
        clearTimeout(tm); const nm = ++seqMini; tm = setTimeout(() => miniaturas(nm), 250);
      } catch { if (alive && n === seq) { msg.textContent = 'não consegui montar a prévia.'; prev.classList.remove('carregando'); } }
    }, 120);
  }
  const bt = h('button', { type: 'button', class: 'btn primary wide', onclick: async () => {
    bt.disabled = true; msg.textContent = 'gerando a imagem…';
    try { const r = await P.compartilhar({ ...entry, fundoPerfil: fundo }, formato, modelo); msg.textContent = r === 'baixado' ? 'imagem baixada! é só postar 🎉' : r === 'compartilhado' ? 'pronto!' : ''; } catch { msg.textContent = 'não consegui gerar agora. tente de novo.'; }
    bt.disabled = false; } }, 'baixar / compartilhar');
  const el = h('div', { class: 'fig-share' }, h('b', {}, titulo), formatos, modelos, fundos, h('div', { class: 'fig-prev-box' }, prev), bt, msg);
  el.cleanup = () => { alive = false; clearTimeout(t); clearTimeout(tm); };
  el.refresh = (novo) => { if (novo) entry = novo; desenhar(); }; // a figurinha mudou (nome, foto, modelo): refaz a prévia
  desenhar();
  return el;
}
