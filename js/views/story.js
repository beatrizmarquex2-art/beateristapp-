// Arte pros stories: abre uma folha com um quadro 9:16 onde cada coisa (texto, fita, rabisco…) é um elemento solto que se
// arrasta, gira e dá zoom. O rodapé "beaterista app" é fixo. "Salvar imagem" desenha tudo num canvas 1080×1920.
import { h, icon } from '../util.js';
import { sheet, toast } from '../ui.js';

const W = 230, H = 409, K = 1080 / W; // tamanho do quadro na tela e fator para a imagem final
const A = 'assets/';
const STICKERS = [
  ['tape', 'mural/tape.svg', 3.0], ['tapewide', 'mural/tape-wide.svg', 4.25], ['star', 'mural/star-red.svg', 1], ['bolt', 'mural/bolt-red.svg', 0.705],
  ['clip', 'mural/clip.svg', 0.467], ['sticks', 'mural/sticks.svg', 1], ['note', 'mural/note.svg', 0.733], ['vinyl', 'mural/vinyl.svg', 1],
  ['cass', 'mural/cassette.svg', 1.375], ['brush', 'mural/brush-red.svg', 4.375], ['shard', 'mural/shard-red.svg', 1.3, 1.4], ['fita2', 'zine/fita-2.webp', 0.933],
  ['fita1', 'zine/fita-1.webp', 1.242], ['circ', 'zine/circulo-terracota.webp', 1.205], ['seta', 'zine/seta-tinta.webp', 1.158], ['expl', 'rabiscos/explosao-terracota.png', 2.059],
  ['baq', 'rabiscos/baquetas-terracota.png', 0.939], ['notas', 'zine/notas-terracota.webp', 0.7], ['pfaixa', 'zine/papel-preto-faixa.webp', 4.167, 2.2], ['pvermelho', 'zine/papel-vermelho-3.webp', 1.706, 2.2],
].map(([k, p, r, s]) => ({ k, src: A + p, r, s: s || 1 }));
const FONTS = [['Bodoni Moda', 'italic 600', 'Bodoni'], ['Anton', '400', 'Cartaz'], ['Special Elite', '400', 'Máquina'], ['Permanent Marker', '400', 'Marca-texto'], ['Hanken Grotesk', '800', 'Limpa']];
const COLS = [['#f1ebe1', 'creme'], ['#ffffff', 'branco'], ['#cfc3b0', 'areia'], ['#e3a82f', 'dourado'], ['#b5162b', 'vermelho'], ['#6e1219', 'vinho'], ['#1d2b4a', 'marinho'], ['#1b1818', 'tinta']];
const TEXS = [['tx1', 'liso'], ['tx2', 'meio-tom'], ['tx3', 'kraft'], ['tx4', 'rasgado'], ['tx5', 'caderno'], ['tx6', 'pauta']];
const TEXT_COLORS = ['#1b1818', '#f1ebe1', '#b5162b'];
const PREF = 'story-pref';

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const isRed = (hex) => { const n = parseInt(hex.slice(1), 16); return (n >> 16) > 130 && ((n >> 8) & 255) < 90 && (n & 255) < 100; };
/** Cores do rodapé e do texto automático conforme o fundo escolhido. */
function look(color) {
  const dark = lum(color) < 0.5; const red = isRed(color);
  if (red) return { dark: true, fb: '#1b1818', ff: '#f1ebe1', white: true };
  if (dark) return { dark: true, fb: '#f1ebe1', ff: '#1b1818', white: false };
  return { dark: false, fb: '#b5162b', ff: '#fff7f3', white: true };
}
const loadPref = () => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch { return {}; } };
const savePref = (p) => { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch { /* sem armazenamento: tudo bem */ } };

export function openStory({ text = '', src = '' } = {}) {
  const pref = loadPref();
  let bgc = /^#[0-9a-f]{6}$/i.test(pref.bgc || '') ? pref.bgc : '#f1ebe1';
  let tex = TEXS.some((t) => t[0] === pref.tex) ? pref.tex : 'tx1';
  let els = []; let sel = null; let nid = 1; const nodes = new Map();
  const find = (id) => els.find((e) => e.id === id);
  const cur = () => find(sel);

  const stage = h('div', { class: 'story-stage st-tx1' }, h('div', { class: 'story-foot' }, h('i'), 'beaterista app'));
  const panel = h('div', { class: 'st-panel', hidden: true });

  /* ---------- elementos ---------- */
  function paint(e) {
    let n = nodes.get(e.id);
    if (!n) { n = h('div', { 'data-id': String(e.id) }, h('i', { class: 'st-hd' })); stage.insertBefore(n, stage.querySelector('.story-foot')); nodes.set(e.id, n); }
    const inv = e.auto && e.type === 'img' && look(bgc).dark;
    n.className = `st-el st-${e.type}${sel === e.id ? ' sel' : ''}${inv ? ' inv' : ''}`;
    n.style.transform = `translate(${e.x}px,${e.y}px) translate(-50%,-50%) rotate(${e.rot}deg) scale(${e.s})`;
    n.style.zIndex = String(els.indexOf(e) + 1);
    if (e.type === 'txt') {
      const hd = n.querySelector('.st-hd'); n.textContent = e.text; n.append(hd);
      Object.assign(n.style, { fontFamily: `'${e.font}',serif`, fontStyle: e.fs.includes('italic') ? 'italic' : 'normal', fontWeight: e.fs.replace('italic', '').trim() || '400', fontSize: `${e.size}px`, color: e.color, textAlign: e.al, background: e.bg ? (e.color === '#1b1818' ? '#f1ebe1' : '#1b1818') : 'transparent', padding: e.bg ? '3px 7px' : '0' });
    } else { n.style.backgroundImage = `url(${e.src})`; n.style.aspectRatio = String(e.r); }
    if (sel === e.id) syncPanel(e);
  }
  function select(id) { sel = id; els.forEach(paint); if (id == null) panel.hidden = true; }
  function addEl(o) { const e = { id: nid++, x: W / 2, y: 150, s: 1, rot: 0, ...o }; els.push(e); paint(e); select(e.id); return e; }
  const addText = (t, o = {}) => addEl({ type: 'txt', text: t, font: 'Bodoni Moda', fs: 'italic 600', size: 22, color: '#1b1818', al: 'left', bg: false, ...o });
  const addImg = (k, o = {}) => { const a = STICKERS.find((x) => x.k === k); return addEl({ type: 'img', k, src: a.src, r: a.r, x: 60 + Math.random() * 110, y: 80 + Math.random() * 180, s: a.s, ...o }); };

  /* ---------- fundo ---------- */
  function setBg() {
    const lk = look(bgc);
    stage.className = `story-stage st-${tex}`;
    stage.dataset.dark = lk.dark ? '1' : '0';
    stage.style.setProperty('--bgc', bgc);
    stage.style.setProperty('--lc', lk.dark ? 'rgb(241 235 225 / .22)' : 'rgb(27 24 24 / .12)');
    stage.style.setProperty('--fb', lk.fb); stage.style.setProperty('--ff', lk.ff);
    stage.style.setProperty('--fi', lk.white ? 'brightness(0) invert(1)' : 'none');
    colRow.querySelectorAll('button[data-c]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === bgc)));
    texRow.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.x === tex)));
    els.forEach((e) => { if (e.type === 'txt' && e.auto) e.color = lk.dark ? '#f1ebe1' : (e.auto === 2 ? '#b5162b' : '#1b1818'); if (e.auto) paint(e); });
    savePref({ bgc, tex });
  }
  const colInput = h('input', { type: 'color', value: bgc, 'aria-label': 'Outra cor', title: 'outra cor', class: 'st-any', oninput: (ev) => { bgc = ev.target.value; setBg(); } });
  const colRow = h('div', { class: 'st-picker', role: 'group', 'aria-label': 'Cor do fundo' }, COLS.map(([c, n]) => h('button', { type: 'button', class: 'col', 'data-c': c, style: { background: c }, 'aria-label': `Cor ${n}`, title: n, onclick: () => { bgc = c; colInput.value = c; setBg(); } })), colInput);
  const texRow = h('div', { class: 'st-picker', role: 'group', 'aria-label': 'Textura do fundo' }, TEXS.map(([t, n]) => h('button', { type: 'button', class: `st-${t} chip-tex`, 'data-x': t, 'aria-label': `Textura ${n}`, title: n, onclick: () => { tex = t; if (t === 'tx2' && bgc === '#f1ebe1') bgc = '#cfc3b0'; setBg(); } })));

  /* ---------- gestos: arrastar, pinça (zoom + girar) e bolinha ---------- */
  const ptrs = new Map(); let g = null;
  const base = () => {
    const e = cur(); if (!e) { g = null; return; }
    const p = [...ptrs.values()];
    if (g && g.mode === 'handle') return;
    if (p.length >= 2) g = { mode: 'pinch', d: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), a: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x), s: e.s, rot: e.rot };
    else if (p.length === 1) g = { mode: 'drag', px: p[0].x, py: p[0].y, x: e.x, y: e.y };
    else g = null;
  };
  stage.addEventListener('pointerdown', (ev) => {
    const n = ev.target.closest('.st-el');
    if (!n) { select(null); return; }
    const id = +n.dataset.id; if (sel !== id) select(id);
    stage.setPointerCapture(ev.pointerId); ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ev.target.classList.contains('st-hd')) {
      const e = find(id); const r = stage.getBoundingClientRect(); const cx = r.left + e.x * (r.width / W), cy = r.top + e.y * (r.height / H);
      g = { mode: 'handle', cx, cy, d: Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1, a: Math.atan2(ev.clientY - cy, ev.clientX - cx), s: e.s, rot: e.rot };
    } else base();
    ev.preventDefault();
  });
  stage.addEventListener('pointermove', (ev) => {
    if (!ptrs.has(ev.pointerId) || !g) return;
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const e = cur(); if (!e) return;
    const clamp = (v) => Math.min(4, Math.max(0.2, v));
    if (g.mode === 'handle') { const d = Math.hypot(ev.clientX - g.cx, ev.clientY - g.cy), a = Math.atan2(ev.clientY - g.cy, ev.clientX - g.cx); e.s = clamp(g.s * d / g.d); e.rot = Math.round(g.rot + (a - g.a) * 180 / Math.PI); }
    else if (g.mode === 'pinch') { const p = [...ptrs.values()]; if (p.length < 2) return; const d = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), a = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x); e.s = clamp(g.s * d / g.d); e.rot = Math.round(g.rot + (a - g.a) * 180 / Math.PI); }
    else { e.x = g.x + ev.clientX - g.px; e.y = g.y + ev.clientY - g.py; }
    paint(e);
  });
  const up = (ev) => { ptrs.delete(ev.pointerId); if (g && g.mode === 'handle') g = null; else base(); };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', (ev) => { const e = cur(); if (!e) return; ev.preventDefault(); e.s = Math.min(4, Math.max(0.2, e.s * (ev.deltaY < 0 ? 1.06 : 0.94))); paint(e); }, { passive: false });

  /* ---------- painel do elemento escolhido ---------- */
  const range = (label, min, max, step, on) => { const i = h('input', { type: 'range', min, max, step, 'aria-label': label, oninput: (ev) => { const e = cur(); if (e) { on(e, +ev.target.value); paint(e); } } }); return { i, row: h('div', { class: 'st-r' }, h('span', { class: 'st-lab' }, label), i) }; };
  const rScale = range('tamanho', 0.2, 4, 0.01, (e, v) => { e.s = v; });
  const rRot = range('girar', -180, 180, 1, (e, v) => { e.rot = v; });
  const rFont = range('letra', 12, 56, 1, (e, v) => { e.size = v; });
  const ta = h('textarea', { 'aria-label': 'Texto da arte', rows: 3, oninput: (ev) => { const e = cur(); if (e && e.type === 'txt') { e.text = ev.target.value; paint(e); } } });
  const fontBtns = FONTS.map(([f, st, label]) => h('button', { type: 'button', style: { fontFamily: `'${f}',serif`, fontStyle: st.includes('italic') ? 'italic' : 'normal' }, onclick: () => { const e = cur(); if (e) { e.font = f; e.fs = st; paint(e); } }, 'data-f': f }, label));
  const alBtns = [['left', 'esq'], ['center', 'centro'], ['right', 'dir']].map(([a, l]) => h('button', { type: 'button', 'data-al': a, onclick: () => { const e = cur(); if (e) { e.al = a; paint(e); } } }, l));
  const bgBtn = h('button', { type: 'button', onclick: () => { const e = cur(); if (e) { e.bg = !e.bg; paint(e); } } }, 'marca-texto');
  const swBtns = TEXT_COLORS.map((c) => h('button', { type: 'button', class: 'sw', 'data-c': c, style: { background: c }, 'aria-label': `Cor do texto ${c}`, onclick: () => { const e = cur(); if (e) { e.color = c; e.auto = 0; paint(e); } } }));
  const txBox = h('div', { class: 'st-tx' }, ta, h('div', { class: 'st-chips' }, fontBtns), rFont.row, h('div', { class: 'st-chips' }, alBtns, bgBtn), h('div', { class: 'st-chips' }, h('span', { class: 'st-lab' }, 'cor'), swBtns));
  function syncPanel(e) {
    panel.hidden = false; txBox.hidden = e.type !== 'txt';
    rScale.i.value = String(e.s); rRot.i.value = String(e.rot);
    if (e.type === 'txt') {
      if (document.activeElement !== ta) ta.value = e.text;
      rFont.i.value = String(e.size);
      fontBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === e.font)));
      alBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.al === e.al)));
      bgBtn.setAttribute('aria-pressed', String(e.bg));
      swBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === e.color)));
    }
  }
  const order = (fn) => () => { const e = cur(); if (e) { els = fn(e); els.forEach(paint); } };
  const remove = () => { const e = cur(); if (!e) return; els = els.filter((y) => y !== e); nodes.get(e.id).remove(); nodes.delete(e.id); select(null); };
  panel.append(txBox, rScale.row, rRot.row, h('div', { class: 'st-chips' },
    h('button', { type: 'button', onclick: order((e) => els.filter((y) => y !== e).concat(e)) }, 'pra frente'),
    h('button', { type: 'button', onclick: order((e) => [e].concat(els.filter((y) => y !== e))) }, 'pra trás'),
    h('button', { type: 'button', onclick: () => { const e = cur(); if (e) { const c = { ...e, id: nid++, x: e.x + 14, y: e.y + 14, auto: 0 }; els.push(c); paint(c); select(c.id); } } }, 'duplicar'),
    h('button', { type: 'button', onclick: remove }, 'apagar')));

  const tray = h('div', { class: 'st-tray', 'aria-label': 'Elementos' },
    h('button', { type: 'button', class: 'add', onclick: () => addText('seu texto') }, '+ texto'),
    STICKERS.map((a) => h('button', { type: 'button', 'aria-label': `Adicionar ${a.k}`, style: { backgroundImage: `url(${a.src})` }, onclick: () => addImg(a.k) })));

  /* ---------- salvar imagem ---------- */
  const saveBtn = h('button', { class: 'btn primary', type: 'button', onclick: async () => {
    saveBtn.disabled = true; saveBtn.textContent = 'montando…';
    try { await exportImage(); } catch (err) { console.error(err); toast('não consegui montar a imagem agora.'); }
    saveBtn.disabled = false; saveBtn.textContent = 'salvar imagem';
  } }, 'salvar imagem');

  /* ---------- exportação em canvas ---------- */
  const imgCache = new Map();
  const loadImg = (src) => { if (!imgCache.has(src)) imgCache.set(src, new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; })); return imgCache.get(src); };
  const tint = (img, color, w, hh) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, hh); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, w, hh); return c; };
  function cover(ctx, img, cw, ch, fx = 0.5, fy = 0.5) { const s = Math.max(cw / img.width, ch / img.height); const w = img.width * s, hh = img.height * s; ctx.drawImage(img, (cw - w) * fx, (ch - hh) * fy, w, hh); }
  async function drawBg(ctx, cw, ch) {
    const lk = look(bgc);
    ctx.fillStyle = bgc; ctx.fillRect(0, 0, cw, ch);
    if (tex === 'tx1') { // grão leve
      const t = document.createElement('canvas'); t.width = t.height = 180; const x = t.getContext('2d'); const d = x.createImageData(180, 180);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() < 0.5 ? 20 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.random() * 26; }
      x.putImageData(d, 0, 0); ctx.fillStyle = ctx.createPattern(t, 'repeat'); ctx.fillRect(0, 0, cw, ch);
    } else if (tex === 'tx2') {
      const im = await loadImg(`${A}story/meio-tom-branco.webp`); const w = cw * 1.9; ctx.drawImage(im, (cw - w) * 0.2, ch * 0.45 - w / 2, w, w);
    } else if (tex === 'tx3') {
      const im = await loadImg(`${A}zine/kraft-4.webp`); cover(ctx, im, cw, ch);
      ctx.globalAlpha = 0.74; ctx.fillStyle = bgc; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1;
    } else if (tex === 'tx4') {
      cover(ctx, await loadImg(`${A}story/rasgado-cinza.webp`), cw, ch);
    } else if (tex === 'tx5') {
      ctx.fillStyle = lk.dark ? 'rgb(241 235 225 / .22)' : 'rgb(27 24 24 / .12)';
      for (let y = 23 * K; y < ch; y += 24 * K) ctx.fillRect(0, y, cw, 1.5);
      ctx.fillStyle = 'rgb(181 22 43 / .35)'; ctx.fillRect(29 * K, 0, 1.5, ch);
    } else if (tex === 'tx6') {
      ctx.fillStyle = lk.dark ? 'rgb(241 235 225 / .22)' : 'rgb(27 24 24 / .12)';
      for (let y0 = 0; y0 < H + 118; y0 += 118) for (let i = 0; i < 5; i++) ctx.fillRect(0, (y0 + 40 + i * 10) * K, cw, 1.5);
    }
  }
  /** Quebra o texto nas mesmas larguras do quadro (196px) e devolve as linhas e o bloco. */
  function layout(ctx, e) {
    ctx.font = `${e.fs} ${e.size}px '${e.font}'`;
    const max = 196 - (e.bg ? 14 : 0); const lines = [];
    for (const para of e.text.split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/).filter(Boolean)) { const t = line ? `${line} ${w}` : w; if (line && ctx.measureText(t).width > max) { lines.push(line); line = w; } else line = t; }
      lines.push(line);
    }
    const lh = e.size * 1.15; const w = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
    return { lines, lh, w, h: lines.length * lh };
  }
  async function exportImage() {
    await Promise.all(FONTS.map(([f, st]) => document.fonts.load(`${st} 20px '${f}'`).catch(() => {})));
    const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; const ctx = cv.getContext('2d');
    await drawBg(ctx, 1080, 1920);
    const lk = look(bgc);
    for (const e of els) {
      ctx.save(); ctx.translate(e.x * K, e.y * K); ctx.rotate(e.rot * Math.PI / 180); ctx.scale(e.s * K, e.s * K);
      if (e.type === 'img') {
        const im = await loadImg(e.src); const w = 80, hh = 80 / e.r;
        if (e.auto && lk.dark) { const sc = 4; ctx.drawImage(tint(im, '#f1ebe1', Math.round(w * sc * K), Math.round(hh * sc * K)), -w / 2, -hh / 2, w, hh); } else ctx.drawImage(im, -w / 2, -hh / 2, w, hh);
      } else {
        const L = layout(ctx, e); const pad = e.bg ? [3, 7] : [0, 0]; const bw = L.w + pad[1] * 2, bh = L.h + pad[0] * 2;
        if (e.bg) { ctx.fillStyle = e.color === '#1b1818' ? '#f1ebe1' : '#1b1818'; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); }
        ctx.fillStyle = e.color; ctx.textBaseline = 'top'; ctx.font = `${e.fs} ${e.size}px '${e.font}'`;
        L.lines.forEach((l, i) => { const lw = ctx.measureText(l).width; const x = e.al === 'center' ? -lw / 2 : e.al === 'right' ? L.w / 2 - lw : -L.w / 2; ctx.fillText(l, x, -bh / 2 + pad[0] + i * L.lh + (L.lh - e.size) / 2); });
      }
      ctx.restore();
    }
    // rodapé fixo
    const fh = 50 * K; ctx.fillStyle = lk.fb; ctx.fillRect(0, 1920 - fh, 1080, fh);
    const bolt = await loadImg(`${A}mural/bolt-red.svg`); const bs = 22 * K;
    const bi = tint(bolt, lk.ff, Math.round(bs * 0.705), Math.round(bs)); ctx.drawImage(bi, 16 * K, 1920 - fh / 2 - bs / 2, bs * 0.705, bs);
    ctx.fillStyle = lk.ff; ctx.font = `700 ${13 * K}px 'Hanken Grotesk'`; ctx.textBaseline = 'middle'; ctx.fillText('beaterista app', 16 * K + bs * 0.705 + 8 * K, 1920 - fh / 2 + 1);
    const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
    if (!blob) throw new Error('canvas vazio');
    const file = new File([blob], 'beaterista-story.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); toast('arte pronta ✓'); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
    const a = h('a', { href: URL.createObjectURL(blob), download: 'beaterista-story.png' }); document.body.append(a); a.click(); a.remove();
    toast('imagem salva ✓');
  }

  /* ---------- montagem ---------- */
  const keyHandler = (e) => { if ((e.key === 'Delete' || e.key === 'Backspace') && sel != null && !/TEXTAREA|INPUT/.test(document.activeElement.tagName)) remove(); };
  const body = h('div', { class: 'sheet-body story-body' },
    h('div', { class: 'story-wrap' }, stage,
      h('p', { class: 'story-hint' }, 'arraste · dois dedos pra zoom e girar · ou use a bolinha vermelha')),
    h('div', { class: 'st-group' }, h('span', { class: 'st-lab' }, 'cor do fundo'), colRow),
    h('div', { class: 'st-group' }, h('span', { class: 'st-lab' }, 'textura'), texRow),
    h('div', { class: 'st-group' }, h('span', { class: 'st-lab' }, 'adicionar'), tray),
    panel, saveBtn,
    h('p', { class: 'story-hint' }, 'o rodapé "beaterista app" entra em toda arte. a imagem sai em 1080×1920.'));
  body.cleanup = () => document.removeEventListener('keydown', keyHandler);
  document.addEventListener('keydown', keyHandler);

  setBg();
  const lk = look(bgc);
  addText(text || 'escreva sua frase', { x: W / 2, y: 150, size: text.length > 140 ? 17 : 23, auto: 1, color: lk.dark ? '#f1ebe1' : '#1b1818' });
  if (src) addText(`— ${src}`, { x: W / 2, y: 305, font: 'Special Elite', fs: '400', size: 12, auto: 2, color: lk.dark ? '#f1ebe1' : '#b5162b' });
  const tp = addImg('tape', { x: 100, y: 16, rot: -3, s: 1.2 });
  const st = addImg('star', { x: 190, y: 340, s: 0.8, rot: 10 }); st.auto = 1; paint(tp); paint(st);
  select(null);
  return sheet('Arte pros stories', () => body);
}
