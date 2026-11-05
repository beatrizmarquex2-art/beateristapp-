// Aba "Perfil" (área do aluno): nome e foto do aluno + "minha figurinha": a criança põe a foto dela dentro de um dos 8 modelos,
// escreve o nome, arrasta/dá zoom pra enquadrar e baixa pra postar. A foto fica SÓ neste aparelho (nada sobe pra servidor).
import { h, icon } from '../util.js';
import { db } from '../db.js';
import { banner, toast } from '../ui.js';
import { MODELOS2 } from '../figurinhas/modelos2-data.js';
import { janelaLocal } from '../figurinhas/card2.js';
import { cartaCanvas } from '../figurinhas/postar.js';
import { shareUI } from '../figurinhas/share-ui.js';

const NOME_ALUNO = 'beaterista-aluno-nome', CFG = 'beaterista-perfil-cfg', FOTO = 'perfil-foto';
const IDS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];
const ls = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ok */ } };
const loadCfg = () => { try { return { modelo: 'M1', zoom: 1, ox: 0, oy: 0, nome: '', ...JSON.parse(ls(CFG) || '{}') }; } catch { return { modelo: 'M1', zoom: 1, ox: 0, oy: 0, nome: '' }; } };

/** Foto escolhida -> JPEG de no máximo 1400 px (o navegador já corrige a rotação do celular). */
async function reduzir(file) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = url; });
    const k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
    return await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('blob'))), 'image/jpeg', 0.9));
  } finally { URL.revokeObjectURL(url); }
}
const blobImg = (b) => new Promise((ok, no) => { const u = URL.createObjectURL(b), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => no(new Error('imagem')); i.src = u; });

export function mount(host) {
  const cfg = loadCfg(); let fotoImg = null, fotoBlob = null, alive = true, share = null;
  const salvarCfg = () => lsSet(CFG, JSON.stringify(cfg));
  const nomeAtual = () => (cfg.nome || ls(NOME_ALUNO) || '').trim();
  const entry = () => ({ modelo2: cfg.modelo, artista_banda: nomeAtual() || 'SEU NOME', fotoImg, ajuste: { zoom: cfg.zoom, ox: cfg.ox, oy: cfg.oy }, raridade: MODELOS2[cfg.modelo].raridade, secao: 'Comum', codigo: '' });
  const body = h('div', { class: 'pad-x', style: 'display:grid;gap:14px' });
  host.append(banner('Perfil', 'seu nome e a sua figurinha'), body);

  const avatar = h('div', { class: 'pf-avatar', 'aria-label': 'Sua foto' });
  const nome = h('input', { class: 'field', type: 'text', maxlength: 20, autocomplete: 'off', 'aria-label': 'Seu nome na figurinha', placeholder: 'seu nome', value: nomeAtual(), oninput: (ev) => { cfg.nome = ev.target.value; salvarCfg(); pintar(); } });
  const fotoInput = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (ev) => escolher(ev.target.files[0], ev.target) });
  const selfie = h('input', { type: 'file', accept: 'image/*', capture: 'user', hidden: true, onchange: (ev) => escolher(ev.target.files[0], ev.target) });
  async function escolher(file, input) {
    if (!file) return; try { fotoBlob = await reduzir(file); fotoImg = await blobImg(fotoBlob); await db.metaSet(FOTO, fotoBlob); cfg.zoom = 1; cfg.ox = 0; cfg.oy = 0; salvarCfg(); desenhaAvatar(); montaCriador(); toast('foto salva neste aparelho'); } catch { toast('não consegui abrir essa foto, tente outra'); }
    input.value = '';
  }
  async function remover() { fotoImg = null; fotoBlob = null; try { await db.metaDel(FOTO); } catch { /* ok */ } desenhaAvatar(); montaCriador(); }
  function desenhaAvatar() {
    avatar.replaceChildren();
    if (fotoBlob) { const u = URL.createObjectURL(fotoBlob); avatar.append(h('img', { src: u, alt: '', onload: () => URL.revokeObjectURL(u) })); } else avatar.append(icon('id', 44));
  }
  const topo = h('section', { class: 'card pad pf-top' }, avatar,
    h('div', { class: 'pf-info' }, h('label', { class: 'muted', for: 'pf-nome' }, 'nome na figurinha'), nome,
      h('div', { class: 'pf-btns' }, h('button', { type: 'button', class: 'btn small', onclick: () => fotoInput.click() }, 'escolher foto'), h('button', { type: 'button', class: 'btn small', onclick: () => selfie.click() }, 'tirar selfie'), h('button', { type: 'button', class: 'btn small ghost', onclick: remover }, 'tirar foto')),
      h('p', { class: 'muted pf-priv' }, 'sua foto fica só neste aparelho. ninguém mais vê.')), fotoInput, selfie);
  nome.id = 'pf-nome';

  /* ---- a minha figurinha ---- */
  const cv = h('canvas', { class: 'pf-canvas', width: 720, height: 950, role: 'img', 'aria-label': 'Prévia da sua figurinha. Arraste para mover a foto.' });
  const zoom = h('input', { type: 'range', min: 1, max: 3, step: 0.02, value: cfg.zoom, 'aria-label': 'Zoom da foto', oninput: (ev) => { cfg.zoom = Number(ev.target.value); limita(); salvarCfg(); pintar(); } });
  const vazio = h('p', { class: 'pf-vazio' }, 'escolha uma foto sua pra ver a figurinha ✨');
  const quadros = h('div', { class: 'pf-quadros', role: 'radiogroup', 'aria-label': 'Escolha o modelo' }, IDS.map((id) => h('button', { type: 'button', role: 'radio', 'aria-label': `Modelo ${id.slice(1)} (${MODELOS2[id].raridade})`, 'aria-checked': String(cfg.modelo === id), class: `pf-q${cfg.modelo === id ? ' on' : ''}`, 'data-id': id, onclick: () => { cfg.modelo = id; cfg.ox = 0; cfg.oy = 0; salvarCfg(); quadros.querySelectorAll('button').forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); pintar(); } },
    h('img', { src: `assets/figurinhas/modelos2/${id}.webp`, alt: '', width: 72, height: 95, loading: 'lazy' }))));
  const area = h('section', { class: 'card pad pf-cria' }, h('h2', { class: 'tag' }, 'minha figurinha'), quadros, h('div', { class: 'pf-cv-box' }, cv, vazio), h('label', { class: 'pf-zoom' }, h('span', {}, 'zoom'), zoom), h('p', { class: 'muted' }, 'arraste a foto pra enquadrar.'), h('div', { class: 'pf-share' }));
  function limita() { // a foto não deixa buraco dentro da janela
    if (!fotoImg) return; const L = janelaLocal(cfg.modelo), bw = L.bb.x1 - L.bb.x0, bh = L.bb.y1 - L.bb.y0, pw = fotoImg.naturalWidth, ph = fotoImg.naturalHeight, sc = Math.max(bw / pw, bh / ph) * cfg.zoom;
    const ex = Math.max(0, (pw * sc - bw) / 2), ey = Math.max(0, (ph * sc - bh) / 2); cfg.ox = Math.max(-ex, Math.min(ex, cfg.ox)); cfg.oy = Math.max(-ey, Math.min(ey, cfg.oy));
  }
  let raf = 0;
  function pintar() {
    cancelAnimationFrame(raf); raf = requestAnimationFrame(async () => {
      if (!alive) return; vazio.hidden = !!fotoImg; cv.classList.toggle('sem', !fotoImg);
      if (!fotoImg) { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); const tpl = new Image(); tpl.onload = () => { g.drawImage(tpl, 0, 0, cv.width, cv.height); }; tpl.src = `assets/figurinhas/modelos2/${cfg.modelo}.webp`; share && share.refresh && share.refresh(); return; }
      try { const c = await cartaCanvas(entry(), { escala: 2 }); if (!alive) return; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(c, 0, 0, cv.width, cv.height); } catch { /* ok */ }
      share && share.refresh && share.refresh();
    });
  }
  // arrastar a foto dentro da janela
  let drag = null;
  cv.addEventListener('pointerdown', (ev) => { if (!fotoImg) return; drag = { x: ev.clientX, y: ev.clientY, ox: cfg.ox, oy: cfg.oy }; cv.setPointerCapture(ev.pointerId); });
  cv.addEventListener('pointermove', (ev) => { if (!drag) return; const k = 360 / cv.clientWidth; cfg.ox = drag.ox + (ev.clientX - drag.x) * k; cfg.oy = drag.oy + (ev.clientY - drag.y) * k; limita(); pintar(); });
  const fim = () => { if (drag) { drag = null; salvarCfg(); } };
  cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  function montaCriador() {
    zoom.value = cfg.zoom; if (share) { share.cleanup(); share = null; }
    const slot = area.querySelector('.pf-share');
    if (fotoImg) { share = shareUI(entry(), { titulo: 'baixar minha figurinha' }); slot.replaceChildren(share); } else slot.replaceChildren(h('p', { class: 'muted' }, 'depois de escolher a foto, aparece aqui o botão de baixar e postar.'));
    pintar();
  }
  body.append(topo, area);
  (async () => { try { const b = await db.metaGet(FOTO); if (b && alive) { fotoBlob = b; fotoImg = await blobImg(b); } } catch { /* ok */ } if (!alive) return; desenhaAvatar(); montaCriador(); })();
  return () => { alive = false; cancelAnimationFrame(raf); if (share) share.cleanup(); };
}
