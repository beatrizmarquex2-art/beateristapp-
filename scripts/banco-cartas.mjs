// Lê os PDFs de cartas da Bea (dicionário e instrumentos) com `pdftotext -bbox-layout` e devolve um card por célula da grade 3×3 de cada página.
// Só usado na geração do banco (scripts/gera-banco.mjs); os PDFs não vão pro repositório.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'");
/** [{ pagina, linhas: [{ x, y, t }] }] de um PDF. */
export function paginas(pdf) {
  const xml = execFileSync('pdftotext', ['-bbox-layout', pdf, '-'], { maxBuffer: 1 << 28 }).toString('utf8');
  const out = [];
  for (const pg of xml.split('<page ').slice(1)) {
    const linhas = [];
    for (const m of pg.matchAll(/<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/line>/g)) {
      const t = [...m[5].matchAll(/>([^<]*)<\/word>/g)].map((w) => dec(w[1])).join(' ').replace(/\s+/g, ' ').trim();
      if (t) linhas.push({ x: +m[1], y: +m[2], x2: +m[3], t });
    }
    out.push({ pagina: out.length + 1, linhas });
  }
  return out;
}
/** Agrupa as linhas de uma página nas 9 células (3 colunas × 3 linhas). */
export function celulas(linhas, W = 595.9) {
  const col = (x) => (x < 222 ? 0 : x < 401 ? 1 : 2); const lin = (y) => (y < 306 ? 0 : y < 556 ? 1 : 2);
  const c = Array.from({ length: 9 }, () => []);
  for (const l of linhas) if (l.y < 800) c[lin(l.y) * 3 + col(l.x)].push(l);
  return c.map((a) => a.sort((p, q) => p.y - q.y || p.x - q.x));
}
const EH_TITULO = (t) => /^[A-ZÀ-Ú0-9][A-ZÀ-Ú0-9 ,.'\-/·+()&ºª:]{1,}$/.test(t) && /[A-ZÀ-Ú]{2}/.test(t);
const RODAPE = /^(jogos\.beaterista|prof\. Bea|Cards do Rob)/i;
/** Carta do dicionário: título (maiúsculas), nome em inglês, explicação e dica. */
export function cartaDicionario(linhas) {
  const cab = linhas.find((l) => /^\d+\/\d+$/.test(l.t)); const grupo = (linhas.find((l) => /^[A-ZÀ-Ú ]{5,}$/.test(l.t) && l.y < linhas[0].y + 8) || {}).t;
  const iT = linhas.findIndex((l) => l.y > (cab ? cab.y : 0) + 40 && EH_TITULO(l.t) && !/^[\d/ ]+$/.test(l.t));
  if (iT < 0) return null;
  let j = iT; const titulo = []; while (j < linhas.length && EH_TITULO(linhas[j].t) && (j === iT || linhas[j].y - linhas[j - 1].y < 24)) { titulo.push(linhas[j].t); j++; }
  const resto = linhas.slice(j).filter((l) => !RODAPE.test(l.t)); if (!resto.length) return null;
  const ingles = resto[0].t; const iD = resto.findIndex((l) => /^dica:/i.test(l.t));
  const expl = (iD < 0 ? resto.slice(1) : resto.slice(1, iD)).map((l) => l.t).join(' ').replace(/\s+/g, ' ').trim();
  const dica = iD < 0 ? '' : resto.slice(iD).map((l) => l.t).join(' ').replace(/^dica:\s*/i, '').replace(/\s+/g, ' ').trim();
  return { num: cab ? cab.t : '', grupo: (grupo || '').replace(/\s+/g, ' '), titulo: titulo.join(' '), ingles, expl, dica };
}
/** Carta de instrumentos: instrumento, fase, número, título (maiúsculas) e explicação. */
export function cartaInstrumento(linhas) {
  if (!linhas.length) return null;
  const inst = (linhas.find((l) => /^(BATERIA|TECLADO|VIOLÃO)$/.test(l.t)) || {}).t; const fase = (linhas.find((l) => /^FASE /.test(l.t)) || {}).t; const num = (linhas.find((l) => /^\d+\/\d+$/.test(l.t)) || {}).t;
  const topo = Math.min(...linhas.map((l) => l.y));
  const corpo = linhas.filter((l) => !RODAPE.test(l.t) && !/^(BATERIA|TECLADO|VIOLÃO)$/.test(l.t) && !/^FASE /.test(l.t) && !/^\d+\/\d+$/.test(l.t));
  const iT = corpo.findIndex((l) => EH_TITULO(l.t) && l.y > topo + 25 && !/^[\d ]+$/.test(l.t)); if (iT < 0) return null;
  const antes = corpo.slice(0, iT).map((l) => l.t).join(' ').replace(/\s+/g, ' ').trim(); const titulo = corpo[iT].t; const depois = corpo.slice(iT + 1).map((l) => l.t).join(' ').replace(/\s+/g, ' ').trim();
  return { instrumento: inst, fase, num, titulo, texto: depois || antes, antes, depois };
}
export const existe = (p) => fs.existsSync(p);
