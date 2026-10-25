// PDF mínimo feito aqui no aparelho: uma imagem JPEG por página (A4). Sem biblioteca de fora.
// Usado pra baixar o plano do aluno direto como arquivo. Testado em tests/pdf.test.mjs.

const A4 = [595.28, 841.89]; // pontos
const enc = new TextEncoder();

/** pages: [{ jpeg: Uint8Array, w: px, h: px }] → Uint8Array do PDF. */
export function jpegPdf(pages, { title = '' } = {}) {
  const parts = []; const offsets = []; let size = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); size += b.length; };
  const obj = (n, body) => { offsets[n] = size; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, 'x'));
  const n = pages.length; const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  const info = 3 + n * 3;
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`));
  pages.forEach((p, i) => {
    const pg = 3 + i * 3, im = pg + 1, ct = pg + 2;
    obj(pg, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`));
    obj(im, () => { push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`); push(p.jpeg); push('\nendstream'); });
    const c = `q ${A4[0]} 0 0 ${A4[1]} 0 0 cm /Im${i} Do Q`;
    obj(ct, () => push(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`));
  });
  const safe = String(title).replace(/[()\\]/g, '').replace(/[^\x20-\x7e]/g, (ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, ''));
  obj(info, () => push(`<< /Title (${safe}) /Producer (Beaterista) >>`));
  const xref = size; const count = info + 1;
  push(`xref\n0 ${count}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(size); let k = 0; for (const b of parts) { out.set(b, k); k += b.length; }
  return out;
}

/** Nome de arquivo sem acento nem símbolo: "Plano - Ana Clara - 26-10-2026.pdf". */
export const fileName = (title, student, date) => `${[title, student, date].filter(Boolean).join(' - ')}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w .-]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90) + '.pdf';
