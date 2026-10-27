// Juntar vários itens de uma pasta num PDF só (A4, uma imagem por página). PDFs já enviados ainda não entram: só imagens e exercícios.
import * as files from './files-sync.js';
import { jpegPdf } from './pdf.js';
import { toJpeg, savePdf } from './views/plan-pdf.js';

const W = 1240, H = 1754, MM = W / 210;

async function pageFrom(blob) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const a4 = Math.abs(bmp.width / bmp.height - W / H) < 0.02; const m = a4 ? 0 : Math.round(10 * MM); // exercício A4 vai de ponta a ponta; foto ganha margem
  const s = Math.min((W - 2 * m) / bmp.width, (H - 2 * m) / bmp.height);
  g.drawImage(bmp, (W - bmp.width * s) / 2, (H - bmp.height * s) / 2, bmp.width * s, bmp.height * s);
  return c;
}

/** records: registros "file" na ordem escolhida. Devolve { pdf, pages, skipped }. */
export async function buildPdf(records, title) {
  const jpegs = []; let skipped = 0;
  for (const r of records) {
    if ((r.data.kind || '') !== 'imagem') { skipped++; continue; }
    try { const blob = await files.getBlob(r.data.fileId); if (!blob) { skipped++; continue; } jpegs.push(await toJpeg(await pageFrom(blob))); } catch { skipped++; }
  }
  if (!jpegs.length) return { pdf: null, pages: 0, skipped };
  return { pdf: jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title }), pages: jpegs.length, skipped };
}
export { savePdf };
