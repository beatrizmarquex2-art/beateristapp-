// Foto da capa do início: a Bea troca quando quiser. A imagem fica só neste aparelho (como as do mural).
import { h, debounce } from '../util.js';
import * as store from '../store.js';
import { sheet, toast } from '../ui.js';
import { pickImages, saveImage, imageUrl } from './mural.js';

export const COVER_KEY = 'setting-cover';
const DEFAULT = { src: 'assets/zine/bea-rock.webp', caption: 'bora tocar' };
const cover = () => (store.get(COVER_KEY) ? store.get(COVER_KEY).data : {});

/** zoom, posição e tamanho viram variáveis CSS. No início ficam na <section class="hero"> (o espaço do título também depende do tamanho). */
function applyVars(fig, c) {
  const el = fig.closest('.hero') || fig;
  el.style.setProperty('--cz', String(c.zoom || 1)); el.style.setProperty('--cx', `${c.px != null ? c.px : 50}%`); el.style.setProperty('--cy', `${c.py != null ? c.py : 20}%`);
  el.style.setProperty('--cs', `${c.size || 82}px`); el.style.setProperty('--cf', String((c.size || 82) / 82));
}

/** Preenche a <figure> da capa com a foto e a legenda escolhidas. */
export async function paintCover(fig) {
  const c = cover();
  const img = fig.querySelector('img'), cap = fig.querySelector('figcaption');
  const src = c.imgId ? await imageUrl(c.imgId) : null;
  img.src = src || DEFAULT.src;
  applyVars(fig, c);
  fig.classList.toggle('custom', !!src);
  cap.textContent = c.caption != null ? c.caption : DEFAULT.caption;
}

export function openCover() {
  sheet('Foto da capa', () => {
    const fig = h('figure', { class: 'cover-preview' }, h('span', { class: 'hpi' }, h('img', { src: DEFAULT.src, alt: 'Foto da capa atual' })), h('figcaption', {}));
    const cap = h('input', { type: 'text', maxlength: 28, value: cover().caption != null ? cover().caption : DEFAULT.caption, 'aria-label': 'Legenda da foto' });
    const saveCap = debounce(() => store.upsert('setting', COVER_KEY, { caption: cap.value.trim() }), 400);
    cap.addEventListener('input', saveCap);
    const redraw = () => paintCover(fig);
    // redimensionar: zoom, posição e tamanho. A prévia muda na hora; salva logo depois que o dedo para.
    const save = debounce((p) => store.upsert('setting', COVER_KEY, p), 300);
    const slider = (label, key, min, max, step, def, fmt) => {
      const val = cover()[key] != null ? cover()[key] : def; const out = h('output', {}, fmt(val));
      const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
      inp.addEventListener('input', () => { const v = Number(inp.value); out.textContent = fmt(v); const d = { ...cover(), [key]: v };
        applyVars(fig, d); save({ [key]: v }); });
      return h('label', { class: 'field cv-slide' }, h('span', {}, label, ' ', out), inp);
    };
    const sizes = h('div', { class: 'cv-sliders' },
      slider('zoom da foto', 'zoom', 1, 3, 0.05, 1, (v) => `${Math.round(v * 100)}%`),
      slider('mover pro lado', 'px', 0, 100, 1, 50, (v) => (v < 45 ? '◀ esquerda' : v > 55 ? 'direita ▶' : 'centro')),
      slider('mover pra cima/baixo', 'py', 0, 100, 1, 20, (v) => (v < 15 ? '▲ cima' : v > 35 ? 'baixo ▼' : 'topo')),
      slider('tamanho da foto no início', 'size', 56, 150, 2, 82, (v) => `${Math.round(v / 82 * 100)}%`));
    const off = store.subscribe((i) => { if (i.id === COVER_KEY) redraw(); });
    redraw();
    const obs = new MutationObserver(() => { if (!document.body.contains(fig)) { off(); obs.disconnect(); } });
    obs.observe(document.getElementById('overlay'), { childList: true, subtree: true });
    return h('div', { class: 'sheet-body' },
      fig, sizes,
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        const [blob] = await pickImages(false);
        if (!blob) return;
        await store.upsert('setting', COVER_KEY, { imgId: await saveImage(blob) });
        toast('Capa trocada.');
      } }, 'Escolher outra foto'),
      h('label', { class: 'field' }, h('span', {}, 'Legenda da polaroid'), cap),
      h('button', { class: 'btn ghost small', type: 'button', onclick: async () => { await store.upsert('setting', COVER_KEY, { imgId: null, caption: DEFAULT.caption, zoom: 1, px: 50, py: 20, size: 82 }); cap.value = DEFAULT.caption; toast('Voltou para a foto original.'); } }, 'Voltar para a foto original'),
      h('p', { class: 'muted' }, 'A foto fica guardada só neste aparelho. No tema Backstage ela aparece em preto e branco no topo.'));
  });
}
