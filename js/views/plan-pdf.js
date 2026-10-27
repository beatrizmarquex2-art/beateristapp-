// "Baixar PDF" do plano do aluno: desenha cada página A4 num canvas (papel timbrado ou branco, textos e partituras)
// e junta tudo num PDF de verdade, com o nome do aluno no nome do arquivo. Nada sai do aparelho.
import * as B from '../beats.js';
import * as N from '../notation.js';
import { jpegPdf, fileName } from '../pdf.js';
import { TYPES, fullBar, metaLine } from '../studentplan.js';

const W = 1240, H = 1754, MM = W / 210; // 150 dpi
const ROW_IDS = B.ROWS.map((r) => r.id);
const SIDE = Math.round(16 * MM), TOP = Math.round(16 * MM);
const dateBR = (k) => (k ? k.split('-').reverse().join('/') : '');
const FONT = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif', TYPE = '"Special Elite", "Courier New", monospace';

function lines(g, text, maxW) {
  const out = []; let cur = '';
  for (const w of String(text).split(/\s+/)) { const t = cur ? `${cur} ${w}` : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

/** Desenha o plano e devolve os canvases (um por página). */
export async function renderPages(p) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const paper = (p.paper || 'timbrado') === 'timbrado' ? await loadImg('assets/papel-timbrado.png') : null;
  const BOTTOM = H - Math.round((paper ? 32 : 14) * MM); const CW = W - SIDE * 2;
  const pages = []; let g, y;
  const newPage = () => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); if (paper) g.drawImage(paper, 0, 0, W, H);
    g.textBaseline = 'alphabetic'; pages.push(c); y = TOP;
  };
  const text = (s, { size = 24, weight = 400, font = FONT, color = '#111', maxW = CW, lh = 1.35 } = {}) => {
    g.font = `${weight} ${size}px ${font}`; g.fillStyle = color;
    for (const l of lines(g, s, maxW)) { y += size * lh; g.fillText(l, SIDE, y); }
  };
  const measure = (s, size, weight = 400, font = FONT) => { g.font = `${weight} ${size}px ${font}`; return lines(g, s, CW).length * size * 1.35; };

  newPage();
  text(p.title || 'Plano de estudo', { size: 52, weight: 700 });
  y += 6; text(`${p.studentName || ''} · ${(TYPES.find((t) => t[0] === p.type) || TYPES[0])[1]}${p.start ? ` · a partir de ${dateBR(p.start)}` : ''}`, { size: 26, weight: 600 });
  if (p.goal) text(`objetivo: ${p.goal}`, { size: 24 });
  y += 10;

  p.items.forEach((it, i) => {
    // altura do item: título, meta, partituras (2 por linha), observação, fonte e linha de "consegui"
    const bars = it.bars || []; const one = bars.length === 1;
    const scale = one ? Math.min(1.6, CW / 340) : (CW - 30) / 2 / 340;
    const hasFeet = bars.some((b) => (b.rows.bd || []).some(Boolean) || (b.rows.hf || []).some(Boolean));
    const lays = bars.map((b) => N.layout(fullBar(b, ROW_IDS), { width: 340, full: it.kind !== 'rud' || hasFeet }));
    const rowH = lays.length ? Math.max(...lays.map((l) => l.h)) * scale + (bars.some((b) => b.stick) ? 30 : 0) : 0;
    const scoreH = lays.length ? Math.ceil(lays.length / (one ? 1 : 2)) * (rowH + 8) : 0;
    const need = 24 + 36 + (metaLine(it) ? 30 : 0) + scoreH + (it.note ? measure(it.note, 24) : 0) + (it.src ? 28 : 0) + 40;
    if (y + need > BOTTOM && y > TOP + 10) newPage();
    y += 18; g.strokeStyle = '#999'; g.lineWidth = 2; g.beginPath(); g.moveTo(SIDE, y); g.lineTo(W - SIDE, y); g.stroke();
    text(`${i + 1}. ${it.title}`, { size: 32, weight: 700 });
    if (metaLine(it)) text(metaLine(it), { size: 22, font: TYPE, color: '#333' });
    y += 8;
    lays.forEach((l, k) => {
      const col = one ? 0 : k % 2; const x0 = SIDE + col * ((CW - 30) / 2 + 30);
      if (col === 0 && k > 0) y += rowH + 8;
      g.save(); g.translate(x0, y); N.draw(g, l, { scale, ink: '#111' });
      const b = bars[k];
      if (b.stick) { const sw = (340 - 52 - 10) / b.steps; g.font = `700 ${Math.round(9 * scale)}px ${FONT}`; g.textAlign = 'center';
        b.stick.forEach((s, j) => { g.fillStyle = /^[A-Z]$/.test(s) ? '#b5162b' : s.startsWith('(') ? '#888' : '#111'; g.fillText(s.toUpperCase(), (52 + j * sw + sw / 2) * scale, l.h * scale + 22); });
        g.textAlign = 'left'; }
      g.restore();
    });
    if (lays.length) y += rowH + 4;
    if (it.note) text(it.note, { size: 24 });
    if (it.src) text(it.src, { size: 18, font: TYPE, color: '#8a1a26' });
    text('☐ consegui     BPM: ______     data: ___/___', { size: 22, font: TYPE, color: '#333' });
  });
  if (p.notes) { if (y + measure(p.notes, 24) + 40 > BOTTOM) newPage(); y += 20; text(p.notes, { size: 24 }); }
  return pages;
}

export const toJpeg = (c) => new Promise((ok) => c.toBlob((b) => b.arrayBuffer().then((a) => ok(new Uint8Array(a))), 'image/jpeg', 0.86));

/** Gera o PDF e entrega: no iPhone abre o compartilhar (salvar em Arquivos, WhatsApp…); no computador baixa. */
export async function downloadPdf(p) {
  const pages = await renderPages(p);
  const jpegs = await Promise.all(pages.map(toJpeg));
  const pdf = jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title: `${p.title} - ${p.studentName || ''}` });
  const name = fileName(p.title || 'Plano', p.studentName, dateBR(p.start).replace(/\//g, '-'));
  return { ...(await savePdf(pdf, name)), pages: pages.length };
}

/** Entrega um PDF pronto: no iPhone abre o compartilhar; no computador baixa. */
export async function savePdf(pdf, name) {
  const file = new File([pdf], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], title: name }); return { name, shared: true }; } catch { /* cancelou: cai no download */ }
  }
  const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return { name };
}
