// Verificação do banco contra os PDFs (usada pelo gerador e pelo teste, quando os PDFs estão na máquina).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const NORM = (s) => String(s || '').toLowerCase().replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
/** Cada janela de 5 palavras do trecho tem que aparecer na página (trechos de até 5 palavras: o trecho inteiro). */
export function achaNaPagina(paginaNorm, trecho) {
  const w = NORM(trecho).split(' ').filter(Boolean); if (!w.length) return false;
  if (w.length <= 5) return paginaNorm.includes(w.join(' '));
  for (let i = 0; i + 5 <= w.length; i++) if (!paginaNorm.includes(w.slice(i, i + 5).join(' '))) return false;
  return true;
}
export const PDFS = {
  dic: ['0cab7b2b-Cards-do-Robo-Paul-DICIONARIO-120-completo.pdf', 'b80dcb02-Cards-Dicionario-Musical-Paul.pdf'],
  ins: ['6e2a0ea2-Cards-do-Robo-Paul-INSTRUMENTOS-90-completo.pdf'],
  ens: ['35dede5a-Roboterista_Ensina_Completo_100pgs.pdf', '203312ae-Roboterista_Ensina_Completo_100pgs_2.pdf'],
  mel: ['419a47bb-Roboterista_Melodia_e_Harmonia_102pgs.pdf'],
  cad: ['573ffd84-paul-caderno-de-atividades.pdf'],
};
export const rawPaginas = (arquivo) => execFileSync('pdftotext', [arquivo, '-'], { maxBuffer: 1 << 28 }).toString('utf8').split('\f').map((p) => NORM(p));
/** Confere todos os itens: a âncora de cada um precisa estar na página indicada do PDF. Devolve a lista dos que falharam. */
export function verificaItens(itens, dir) {
  const cache = {}; const falhas = [];
  for (const it of itens) {
    const [cod, pg] = it.f; const arq = path.join(dir, PDFS[cod][0]); if (!fs.existsSync(arq)) continue;
    const pags = (cache[cod] ||= rawPaginas(arq));
    if (!pags[pg - 1] || !achaNaPagina(pags[pg - 1], it.c)) falhas.push(it.i);
  }
  return falhas;
}
