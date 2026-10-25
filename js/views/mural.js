import { h, icon, debounce, reducedMotion } from '../util.js';
import * as store from '../store.js';
import { db } from '../db.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';

// A parede tem 1000 x 1480 "unidades"; tudo é guardado nelas e escala sozinho para qualquer tela.
const W = 1000, H = 1480;
export const FRAMES = [['rasgado', 'Papel rasgado'], ['xerox', 'Xerox'], ['papelpreto', 'Papel preto'], ['fitax', 'Fita nos cantos'], ['recorte', 'Recorte'], ['filme', 'Filme'], ['fita', 'Fita'], ['preta', 'Preta'], ['madeira', 'Madeira'], ['dourada', 'Dourada'], ['passe', 'Passe-partout'], ['polaroid', 'Polaroid'], ['neon', 'Neon']];
export const STICKERS = [['tape', 'Fita crepe'], ['tape-wide', 'Fita larga'], ['shard-black', 'Papel preto'], ['shard-black-2', 'Papel preto 2'], ['shard-red', 'Retalho vermelho'], ['brush-red', 'Pincelada'], ['underline', 'Sublinhado'], ['star-ink', 'Estrela'], ['star-red', 'Estrela vermelha'], ['star-spray', 'Estrela spray'], ['star-red-solid', 'Estrela cheia'], ['bolt-ink', 'Raio'], ['bolt-red', 'Raio vermelho'], ['smile', 'Smile'], ['drum', 'Tambor'], ['sticks', 'Baquetas'], ['clip', 'Clipe'], ['cassette', 'Fita cassete'], ['vinyl', 'Vinil'], ['note', 'Nota musical']];
export const WALLS = [['concreto', 'Concreto'], ['tijolo', 'Tijolo'], ['rasgado', 'Papel rasgado'], ['preta', 'Preta pichada'], ['tema', 'Cor do tema']];
const WALL_KEY = 'setting-mural';
const RATIOS = [['Retrato', 1.4], ['Alto', 1.6], ['Quadrado', 1], ['Paisagem', 0.72]];
const HAS_CAPTION = new Set(['passe', 'polaroid', 'xerox', 'papelpreto', 'filme']);
const MAX_SIDE = 1400;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- imagens: ficam só neste aparelho (IndexedDB), reduzidas para ~1400px ---------- */
const urls = new Map();
export async function imageUrl(imgId) {
  if (urls.has(imgId)) return urls.get(imgId);
  const blob = await db.metaGet(`img:${imgId}`);
  if (!blob) return null;
  const u = URL.createObjectURL(blob); urls.set(imgId, u); return u;
}
async function shrink(file) {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = src; });
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('blob'))), 'image/jpeg', 0.86));
  } finally { URL.revokeObjectURL(src); }
}
/** Abre o seletor de fotos. Com `multiple`, devolve uma lista (até 12). */
export function pickImages(multiple = false) {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Escolher fotos' });
    if (multiple) input.multiple = true;
    input.style.display = 'none'; document.body.append(input);
    input.addEventListener('change', async () => {
      const files = [...input.files].slice(0, 12); input.remove();
      const out = [];
      for (const f of files) { try { out.push(await shrink(f)); } catch { toast('Não consegui abrir uma das imagens.'); } }
      resolve(out);
    });
    input.addEventListener('cancel', () => { input.remove(); resolve([]); });
    input.click();
  });
}
const pickImage = async () => (await pickImages(false))[0] || null;
const stickerRatio = (name) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i.naturalHeight / i.naturalWidth || 1); i.onerror = () => ok(1); i.src = `assets/mural/${name}.svg`; });
export async function saveImage(blob) {
  const imgId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await db.metaSet(`img:${imgId}`, blob);
  return imgId;
}

const cropCss = (d) => `translate(${d.ox || 0}%, ${d.oy || 0}%) scale(${d.zoom || 1})`;
const maxPan = (z) => ((z || 1) - 1) / 2 * 100;
const posters = () => store.list('poster');

export function mount(host) {
  let sel = null;
  const els = new Map();
  const wall = h('div', { class: 'wall', role: 'group', 'aria-label': 'Parede de pôsteres. Toque num pôster para editar.' });
  const empty = h('div', { class: 'wall-empty' }, h('div', { class: 'we-card' }, h('p', {}, 'sua parede está vazia'), h('span', {}, 'adicione os pôsteres dos artistas que você ama')));
  const count = h('p', { class: 'muted pad-x', 'aria-live': 'polite' });
  const spacer = h('div', { 'aria-hidden': 'true' });
  const tray = h('div', { class: 'tray', role: 'region', 'aria-label': 'Editar pôster' });
  tray.hidden = true;
  const scale = () => wall.clientWidth / W;

  /* ---------- desenho incremental (mantém o elemento sob o dedo durante o gesto) ---------- */
  function place(el, d) {
    el.style.left = `${(d.x / W) * 100}%`; el.style.top = `${(d.y / H) * 100}%`; el.style.width = `${(d.w / W) * 100}%`;
    el.style.aspectRatio = `1 / ${d.ratio}`; el.style.transform = `rotate(${d.rot || 0}deg)`; el.style.zIndex = String(1000 + (d.z || 0));
  }
  function build(rec) {
    const el = h('div', { class: 'poster', 'data-id': rec.id, role: 'button', tabindex: '0', 'aria-label': 'Pôster' });
    if (rec.data.sticker) {
      el.classList.add('st'); el.append(h('img', { class: 'sti', src: `assets/mural/${rec.data.sticker}.svg`, alt: '', draggable: 'false' }));
    } else {
      const pf = h('div', { class: 'pf' }); const box = h('div', { class: 'pimg' });
      pf.append(box); el.append(pf);
    }
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(rec.id); } });
    bindDrag(el, rec.id);
    return el;
  }
  async function fill(el, d) {
    const box = el.querySelector('.pimg');
    if (el.dataset.img !== d.imgId) {
      el.dataset.img = d.imgId; box.replaceChildren();
      const u = await imageUrl(d.imgId);
      if (el.dataset.img !== d.imgId) return;
      box.append(u ? h('img', { src: u, alt: d.caption ? `Pôster: ${d.caption}` : 'Pôster', draggable: 'false' }) : h('span', { class: 'miss' }, 'foto só está no outro aparelho'));
    }
    const img = box.querySelector('img'); if (img) img.style.transform = cropCss(d);
  }
  function sync() {
    const list = posters(); const ids = new Set(list.map((r) => r.id));
    for (const [id, el] of els) if (!ids.has(id)) { el.remove(); els.delete(id); if (sel === id) sel = null; }
    for (const rec of list) {
      const d = rec.data; let el = els.get(rec.id);
      if (!el) { el = build(rec); els.set(rec.id, el); wall.append(el); }
      place(el, d);
      if (d.sticker) {
        el.setAttribute('aria-label', `Adesivo: ${(STICKERS.find((x) => x[0] === d.sticker) || [])[1] || d.sticker}. Toque para editar.`);
        el.classList.toggle('sel', sel === rec.id); syncHandles(el, rec.id); continue;
      }
      el.querySelector('.pf').className = `pf f-${d.frame || 'rasgado'}`; el.dataset.frame = d.frame || 'rasgado';
      let cap = el.querySelector('.pcap');
      if (HAS_CAPTION.has(d.frame)) { if (!cap) { cap = h('div', { class: 'pcap' }); el.querySelector('.pf').append(cap); } cap.textContent = d.caption || ''; }
      else if (cap) cap.remove();
      el.setAttribute('aria-label', `Pôster${d.caption ? `: ${d.caption}` : ''}. Toque para editar.`);
      fill(el, d);
      el.classList.toggle('sel', sel === rec.id);
      syncHandles(el, rec.id);
    }
    empty.hidden = list.length > 0;
    count.textContent = list.length ? `${list.length} pôster${list.length > 1 ? 'es' : ''} na parede · as fotos ficam só neste aparelho` : '';
    drawTray();
  }
  function syncHandles(el, id) {
    const hs = el.querySelectorAll('.handle');
    if (sel === id && !hs.length) { const rs = handle('rs', 'resize', 'Aumentar ou diminuir'); const ro = handle('ro', 'rotate', 'Girar'); el.append(rs, ro); bindResize(rs, el, id); bindRotate(ro, el, id); }
    if (sel !== id && hs.length) hs.forEach((x) => x.remove());
  }
  const handle = (cls, ic, label) => h('span', { class: `handle ${cls}`, role: 'slider', 'aria-label': label }, icon(ic, 18));

  function select(id) { sel = id; sync(); }
  /** A bandeja ocupa a parte de baixo: leva o pôster escolhido para a parte visível de cima. */
  function ensureVisible(id) {
    const el = els.get(id); if (!el) return;
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.bottom > innerHeight * 0.5 || r.top < 130) window.scrollBy({ top: r.top - 150, behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
  }
  const rec = () => (sel ? store.get(sel) : null);

  /* ---------- gestos ---------- */
  function bindDrag(el, id) {
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.handle')) return;
      e.preventDefault();
      const r0 = store.get(id); if (!r0) return;
      if (sel !== id) select(id);
      el.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ox = r0.data.x, oy = r0.data.y, k = scale(); let moved = false, nx = ox, ny = oy;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        const w = r0.data.w, hh = w * r0.data.ratio;
        nx = clamp(ox + dx / k, -w * 0.25, W - w * 0.75); ny = clamp(oy + dy / k, -hh * 0.2, H * 0.92 - hh * 0.3);
        el.style.left = `${(nx / W) * 100}%`; el.style.top = `${(ny / H) * 100}%`;
      };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); if (moved) store.upsert('poster', id, { x: Math.round(nx), y: Math.round(ny) }); else ensureVisible(id); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  function bindResize(hd, el, id) {
    hd.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); hd.setPointerCapture(e.pointerId);
      const d0 = store.get(id).data, sx = e.clientX, sy = e.clientY, k = scale(), a = (d0.rot || 0) * Math.PI / 180;
      const cx = d0.x + d0.w / 2, cy = d0.y + (d0.w * d0.ratio) / 2; let nw = d0.w;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        const lx = dx * Math.cos(a) + dy * Math.sin(a), ly = -dx * Math.sin(a) + dy * Math.cos(a);
        nw = clamp(d0.w + (lx + ly / d0.ratio) / 2 / k * 2, 130, 900);
        place(el, { ...d0, w: nw, x: cx - nw / 2, y: cy - (nw * d0.ratio) / 2 });
      };
      const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); store.upsert('poster', id, { w: Math.round(nw), x: Math.round(cx - nw / 2), y: Math.round(cy - (nw * d0.ratio) / 2) }); };
      hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    });
  }
  function bindRotate(hd, el, id) {
    hd.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); hd.setPointerCapture(e.pointerId);
      const d0 = store.get(id).data; const b = el.getBoundingClientRect(); const cx = b.left + b.width / 2, cy = b.top + b.height / 2; let rot = d0.rot || 0;
      const move = (ev) => {
        rot = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90;
        rot = ((rot + 180) % 360 + 360) % 360 - 180;
        if (Math.abs(rot) < 4) rot = 0;
        el.style.transform = `rotate(${rot}deg)`;
      };
      const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); store.upsert('poster', id, { rot: Math.round(rot * 10) / 10 }); };
      hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    });
  }
  wall.addEventListener('pointerdown', (e) => { if (e.target === wall || e.target === empty || e.target.classList.contains('we-card')) { sel = null; sync(); } });

  /* ---------- bandeja de edição ---------- */
  let capInput = null;
  function drawTray() {
    const r = rec();
    tray.hidden = !r; spacer.style.height = r ? (r.data.sticker ? '150px' : '300px') : '0';
    if (!r) { capInput = null; tray.replaceChildren(); return; }
    const d = r.data, id = r.id;
    const patch = (p) => store.upsert('poster', id, p);
    const z = (dir) => { const all = posters().map((x) => x.data.z || 0); patch({ z: dir > 0 ? Math.max(...all) + 1 : Math.min(...all) - 1 }); };
    if (document.activeElement === capInput && capInput) return; // não derruba o teclado enquanto digita
    const common = [
      h('button', { class: 'chip-btn', type: 'button', onclick: () => z(1) }, icon('front', 18), 'Para frente'),
      h('button', { class: 'chip-btn', type: 'button', onclick: () => z(-1) }, icon('backw', 18), 'Para trás'),
      h('button', { class: 'chip-btn', type: 'button', onclick: () => patch({ rot: 0 }) }, icon('rotate', 18), 'Endireitar'),
      h('button', { class: 'chip-btn', type: 'button', onclick: async () => {
        const c = await store.upsert('poster', null, { ...d, x: Math.min(d.x + 50, W - 120), y: Math.min(d.y + 50, H * 0.8), z: posters().reduce((m, x) => Math.max(m, x.data.z || 0), 0) + 1 });
        select(c.id); ensureVisible(c.id);
      } }, icon('plus', 18), 'Duplicar'),
      h('button', { class: 'chip-btn danger', type: 'button', onclick: async () => {
        if (!(await confirmSheet('Tirar da parede?', 'O item sai do mural. Você pode desfazer logo em seguida.', 'Tirar'))) return;
        const snap = await store.remove(id); sel = null; sync();
        toast('Item removido', { action: 'desfazer', onAction: () => store.restore(id, snap) });
      } }, icon('trash', 18), 'Tirar'),
      h('button', { class: 'chip-btn', type: 'button', onclick: () => { sel = null; sync(); } }, icon('tick', 18), 'Concluir')];
    if (d.sticker) { capInput = null; tray.replaceChildren(h('h3', {}, (STICKERS.find((x) => x[0] === d.sticker) || [])[1] || 'Adesivo'), h('div', { class: 'tray-row' }, ...common)); return; }
    capInput = HAS_CAPTION.has(d.frame) ? h('input', { type: 'text', maxlength: 40, value: d.caption || '', placeholder: 'nome do artista', 'aria-label': 'Legenda do pôster' }) : null;
    if (capInput) capInput.addEventListener('input', debounce(() => patch({ caption: capInput.value }), 350));
    tray.replaceChildren(
      h('h3', {}, 'Moldura'),
      h('div', { class: 'tray-row' }, ...FRAMES.map(([k, nome]) => h('button', { class: 'frame-opt', type: 'button', 'aria-pressed': String((d.frame || 'rasgado') === k), onclick: () => patch({ frame: k }) }, h('span', { class: `fs f-${k}` }), nome))),
      h('h3', {}, 'Formato'),
      h('div', { class: 'tray-row' }, ...RATIOS.map(([nome, v]) => h('button', { class: 'chip-btn', type: 'button', 'aria-pressed': String(Math.abs(d.ratio - v) < 0.01), onclick: () => patch({ ratio: v }) }, nome))),
      capInput ? h('label', { class: 'field' }, h('span', {}, 'Legenda'), capInput) : null,
      h('div', { class: 'tray-row' },
        h('button', { class: 'chip-btn', type: 'button', onclick: () => openCrop(id) }, icon('crop', 18), 'Recortar'),
        h('button', { class: 'chip-btn', type: 'button', onclick: async () => { const b = await pickImage(); if (b) { patch({ imgId: await saveImage(b), zoom: 1, ox: 0, oy: 0 }); toast('Foto trocada.'); } } }, icon('photo', 18), 'Trocar foto'),
        ...common));
  }

  /* ---------- recorte: arrastar a foto dentro da moldura + zoom (slider ou pinça) ---------- */
  function openCrop(id) {
    const r0 = store.get(id); if (!r0) return;
    sheet('Recortar foto', (close) => {
      const d = { zoom: r0.data.zoom || 1, ox: r0.data.ox || 0, oy: r0.data.oy || 0 };
      const ratio = r0.data.ratio;
      const boxW = Math.min(300, Math.round(innerWidth * 0.72));
      const box = h('div', { class: 'crop-box', style: { width: `${boxW}px`, height: `${Math.round(boxW * ratio)}px` }, 'aria-label': 'Arraste a foto para enquadrar' });
      const img = h('img', { alt: '' }); box.append(img);
      imageUrl(r0.data.imgId).then((u) => { if (u) img.src = u; });
      const slider = h('input', { type: 'range', min: 1, max: 4, step: 0.01, value: d.zoom, 'aria-label': 'Zoom da foto' });
      const commit = debounce(() => store.upsert('poster', id, { zoom: d.zoom, ox: d.ox, oy: d.oy }), 150);
      const paint = () => {
        const m = maxPan(d.zoom); d.ox = clamp(d.ox, -m, m); d.oy = clamp(d.oy, -m, m);
        img.style.transform = cropCss(d); slider.value = d.zoom; commit();
      };
      paint();
      slider.addEventListener('input', () => { d.zoom = Number(slider.value); paint(); });
      const pts = new Map(); let pinch = 0, z0 = 1;
      box.addEventListener('pointerdown', (e) => { e.preventDefault(); box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = d.zoom; } });
      box.addEventListener('pointermove', (e) => {
        if (!pts.has(e.pointerId)) return;
        const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pts.size === 2) { const [a, b] = [...pts.values()]; d.zoom = clamp(z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pinch || 1), 1, 4); }
        else { d.ox += (e.clientX - prev[0]) / box.clientWidth * 100; d.oy += (e.clientY - prev[1]) / box.clientHeight * 100; }
        paint();
      });
      const end = (e) => pts.delete(e.pointerId);
      box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
      return h('div', { class: 'sheet-body' },
        h('p', { class: 'muted' }, 'Arraste a foto para enquadrar. Use o controle abaixo (ou a pinça com dois dedos) para aproximar.'),
        box,
        h('label', { class: 'field' }, h('span', {}, 'Zoom'), slider),
        h('div', { class: 'row end' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { d.zoom = 1; d.ox = 0; d.oy = 0; paint(); } }, 'Centralizar'),
          h('button', { class: 'btn primary', type: 'button', onclick: () => { commit.flush(); close(); } }, 'Pronto')));
    });
  }

  /* ---------- adicionar ---------- */
  const topZ = () => posters().reduce((m, r) => Math.max(m, r.data.z || 0), 0) + 1;
  async function add() {
    const blobs = await pickImages(true); if (!blobs.length) return;
    let last = null;
    for (const blob of blobs) {
      const imgId = await saveImage(blob); const n = posters().length;
      last = await store.upsert('poster', null, {
        x: Math.round((W - 380) / 2 + ((n % 3) - 1) * 90), y: 130 + (n * 150) % 820, w: 380, ratio: 1.4, rot: [-4, 2.5, -1.5, 3.5, -2.5][n % 5],
        z: topZ(), frame: ['rasgado', 'xerox', 'papelpreto', 'fitax', 'recorte'][n % 5], imgId, zoom: 1, ox: 0, oy: 0, caption: '',
      });
    }
    select(last.id); ensureVisible(last.id);
    toast(blobs.length > 1 ? `${blobs.length} pôsteres na parede.` : 'Pôster na parede. Arraste, gire ou mude a moldura.');
  }
  async function addSticker(name) {
    const ratio = await stickerRatio(name); const n = posters().length;
    const wide = ratio < 0.5;
    const c = await store.upsert('poster', null, { sticker: name, x: Math.round(220 + (n % 4) * 60), y: 200 + (n * 110) % 700, w: wide ? 380 : 260, ratio, rot: [-6, 4, -3, 7][n % 4], z: topZ() });
    select(c.id); ensureVisible(c.id);
  }
  function openStickers() {
    sheet('Adicionar elemento', (close) => h('div', { class: 'sheet-body' },
      h('p', { class: 'muted' }, 'Fitas, papéis rasgados, estrelas e rabiscos para montar a colagem.'),
      h('div', { class: 'stk-grid' }, ...STICKERS.map(([k, nome]) => h('button', { class: 'stk-opt', type: 'button', onclick: () => { close(); addSticker(k); } }, h('span', { class: 'stk-prev' }, h('img', { src: `assets/mural/${k}.svg`, alt: '' })), nome)))));
  }
  const wallPrefs = () => (store.get(WALL_KEY) ? store.get(WALL_KEY).data : {});
  const wallKind = () => (WALLS.some((w) => w[0] === wallPrefs().wall) ? wallPrefs().wall : 'concreto');
  const wallRow = h('div', { class: 'tray-row', style: { padding: '2px 20px 10px' }, role: 'group', 'aria-label': 'Tipo de parede' });
  function drawWallRow() {
    const k = wallKind(); wall.className = `wall w-${k}`;
    wallRow.replaceChildren(...WALLS.map(([id, nome]) => h('button', { class: 'chip-btn', type: 'button', 'aria-pressed': String(id === k), onclick: () => store.upsert('setting', WALL_KEY, { wall: id }) }, nome)));
  }

  wall.append(empty);
  host.append(
    banner('Mural de Artistas', 'a parede dos artistas que você ama'),
    h('p', { class: 'muted pad-x' }, 'Toque num pôster para editar. Arraste para mover, puxe a bolinha de baixo para aumentar e a de cima para girar.'),
    h('div', { class: 'row pad-x', style: { margin: '6px 0 8px' } },
      h('button', { class: 'btn primary', type: 'button', onclick: add }, icon('plus', 20), 'Adicionar pôster'),
      h('button', { class: 'btn', type: 'button', onclick: openStickers }, icon('star', 20), 'Adicionar elemento')),
    wallRow, wall, count, spacer, tray);
  drawWallRow(); sync();
  const off = store.subscribe((i) => { if (!i.kind || i.kind === 'poster') sync(); if (!i.kind || (i.kind === 'setting' && i.id === WALL_KEY)) drawWallRow(); });
  const ro = new ResizeObserver(() => {}); ro.observe(wall);
  return () => { off(); ro.disconnect(); for (const u of urls.values()) URL.revokeObjectURL(u); urls.clear(); };
}
