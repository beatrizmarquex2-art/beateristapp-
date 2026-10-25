// Foto da capa do início: a Bea troca quando quiser. A imagem fica só neste aparelho (como as do mural).
import { h, debounce } from '../util.js';
import * as store from '../store.js';
import { sheet, toast } from '../ui.js';
import { pickImages, saveImage, imageUrl } from './mural.js';

export const COVER_KEY = 'setting-cover';
const DEFAULT = { src: 'assets/zine/bea-rock.webp', caption: 'bora tocar' };
const cover = () => (store.get(COVER_KEY) ? store.get(COVER_KEY).data : {});

/** Preenche a <figure> da capa com a foto e a legenda escolhidas. */
export async function paintCover(fig) {
  const c = cover();
  const img = fig.querySelector('img'), cap = fig.querySelector('figcaption');
  const src = c.imgId ? await imageUrl(c.imgId) : null;
  img.src = src || DEFAULT.src;
  fig.classList.toggle('custom', !!src);
  cap.textContent = c.caption != null ? c.caption : DEFAULT.caption;
}

export function openCover() {
  sheet('Foto da capa', () => {
    const fig = h('figure', { class: 'cover-preview' }, h('img', { src: DEFAULT.src, alt: 'Foto da capa atual' }), h('figcaption', {}));
    const cap = h('input', { type: 'text', maxlength: 28, value: cover().caption != null ? cover().caption : DEFAULT.caption, 'aria-label': 'Legenda da foto' });
    const saveCap = debounce(() => store.upsert('setting', COVER_KEY, { caption: cap.value.trim() }), 400);
    cap.addEventListener('input', saveCap);
    const redraw = () => paintCover(fig);
    const off = store.subscribe((i) => { if (i.id === COVER_KEY) redraw(); });
    redraw();
    const obs = new MutationObserver(() => { if (!document.body.contains(fig)) { off(); obs.disconnect(); } });
    obs.observe(document.getElementById('overlay'), { childList: true, subtree: true });
    return h('div', { class: 'sheet-body' },
      fig,
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        const [blob] = await pickImages(false);
        if (!blob) return;
        await store.upsert('setting', COVER_KEY, { imgId: await saveImage(blob) });
        toast('Capa trocada.');
      } }, 'Escolher outra foto'),
      h('label', { class: 'field' }, h('span', {}, 'Legenda da polaroid'), cap),
      h('button', { class: 'btn ghost small', type: 'button', onclick: async () => { await store.upsert('setting', COVER_KEY, { imgId: null, caption: DEFAULT.caption }); cap.value = DEFAULT.caption; toast('Voltou para a foto original.'); } }, 'Voltar para a foto original'),
      h('p', { class: 'muted' }, 'A foto fica guardada só neste aparelho. No tema Backstage ela aparece em preto e branco no topo.'));
  });
}
