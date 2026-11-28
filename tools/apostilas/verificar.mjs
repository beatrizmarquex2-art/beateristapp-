// Mede quanto de cada página está preenchida (0–1) olhando os pixels. Páginas escuras (divisor) e a capa ficam null.
import { execFileSync } from 'node:child_process'; import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import path from 'node:path';
export function usoPaginas(pdf) {
  const d = mkdtempSync(path.join(tmpdir(), 'vf-')); execFileSync('pdftoppm', ['-r', '30', '-gray', pdf, path.join(d, 'p')]);
  return readdirSync(d).filter((f) => f.endsWith('.pgm')).sort().map((f, i) => {
    const b = readFileSync(path.join(d, f)); let pos = 0; const tok = []; while (tok.length < 4) { while (b[pos] <= 32) pos++; const s = pos; while (b[pos] > 32) pos++; tok.push(b.slice(s, pos).toString()); } pos++;
    const W = +tok[1], H = +tok[2]; const px = b.slice(pos); let soma = 0; for (let k = 0; k < px.length; k += 7) soma += px[k]; if (soma / Math.ceil(px.length / 7) < 150 || i === 0) return null;
    const y0 = Math.round(H * 27 / 297), y1 = Math.round(H * 273 / 297); let ultimo = y0;
    for (let y = y0; y < y1; y++) { let escuro = 0; for (let x = Math.round(W * 16 / 210); x < Math.round(W * 194 / 210); x++) if (px[y * W + x] < 170) escuro++; if (escuro > 1) ultimo = y; }
    return (ultimo - y0) / (y1 - y0);
  });
}
if (import.meta.url === `file://${process.argv[1]}`) { const uso = usoPaginas(process.argv[2]); const lim = +process.argv[3] || 0.38; const r = uso.map((u, i) => (u !== null && u < lim ? `pág ${i + 1}: só ${Math.round(u * 100)}% preenchida` : null)).filter(Boolean); console.log(r.length ? r.join('\n') : 'nenhuma página quase vazia'); }
