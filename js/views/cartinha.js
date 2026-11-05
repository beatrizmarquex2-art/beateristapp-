// "Criar cartinha" (app da Bea): sobe uma foto, escolhe o modelo (os 8 designs), escreve o nome e baixa pronta pra postar
// (cartinha, post, story, nos 5 modelos de post, inclusive o Épico). A foto fica só neste aparelho.
import { h } from '../util.js';
import { db } from '../db.js';
import { banner, toast } from '../ui.js';
import { criador } from '../figurinhas/criador.js';

const CFG = 'beaterista-cartinha-cfg', FOTO = 'cartinha-foto';
const ls = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ok */ } };
const load = () => { try { return { modelo: 'M7', zoom: 1, ox: 0, oy: 0, nome: '', frase: '', ...JSON.parse(ls(CFG) || '{}') }; } catch { return { modelo: 'M7', zoom: 1, ox: 0, oy: 0, nome: '', frase: '' }; } };
async function reduzir(file) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = url; });
    const k = Math.min(1, 2000 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
    return await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('blob'))), 'image/jpeg', 0.92));
  } finally { URL.revokeObjectURL(url); }
}
const blobImg = (b) => new Promise((ok, no) => { const u = URL.createObjectURL(b), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => no(new Error('imagem')); i.src = u; });

export function mount(host) {
  const cfg = load(); let alive = true, fotoBlob = null, thumb = null;
  const salvar = () => lsSet(CFG, JSON.stringify(cfg));
  host.append(banner('Criar cartinha', 'suba uma foto e escolha o design'));
  const cri = criador({ cfg, salvar, nome: () => cfg.nome, titulo: 'a cartinha', tituloShare: 'baixar pra postar', extra: () => ({ tituloPost: cfg.frase || '' }) });
  const input = (k, label, ph, max) => h('label', { class: 'cr-campo' }, h('span', { class: 'muted' }, label), h('input', { class: 'field', type: 'text', maxlength: max, placeholder: ph, value: cfg[k] || '', autocomplete: 'off', oninput: (ev) => { cfg[k] = ev.target.value; salvar(); cri.refresh(); } }));
  const arq = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (!f) return; try { fotoBlob = await reduzir(f); const img = await blobImg(fotoBlob); await db.metaSet(FOTO, fotoBlob); cri.setFoto(img); desenhaThumb(); toast('foto carregada'); } catch { toast('não consegui abrir essa foto, tente outra'); } } });
  const bot = h('div', { class: 'pf-btns' }, h('button', { type: 'button', class: 'btn primary', onclick: () => arq.click() }, 'subir foto'), h('button', { type: 'button', class: 'btn small ghost', onclick: async () => { fotoBlob = null; try { await db.metaDel(FOTO); } catch { /* ok */ } cri.setFoto(null); desenhaThumb(); } }, 'tirar foto'));
  const tn = h('div', { class: 'cr-thumb', 'aria-hidden': 'true' });
  function desenhaThumb() { tn.replaceChildren(); if (thumb) { URL.revokeObjectURL(thumb); thumb = null; } if (fotoBlob) { thumb = URL.createObjectURL(fotoBlob); tn.append(h('img', { src: thumb, alt: '' })); } }
  const topo = h('section', { class: 'card pad cr-topo' }, tn, h('div', { class: 'cr-campos' }, input('nome', 'nome na cartinha', 'ex.: BeLê', 24), input('frase', 'frase do post (opcional)', 'ex.: CARTA ÉPICA', 24), bot, h('p', { class: 'muted pf-priv' }, 'a foto fica só neste aparelho. no post, escolha o modelo "Épico" pro visual dourado.')), arq);
  host.append(topo, cri.el);
  (async () => { try { const b = await db.metaGet(FOTO); if (b && alive) { fotoBlob = b; const img = await blobImg(b); cri.setFoto(img, { resetar: false }); desenhaThumb(); return; } } catch { /* ok */ } if (alive) cri.setFoto(null); })();
  return () => { alive = false; cri.cleanup(); if (thumb) URL.revokeObjectURL(thumb); };
}
