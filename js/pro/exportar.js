// Exportar uma partitura guardada (PDF ou imagem) sem abrir o editor: monta a escrita certa pelo instrumento e pelos dados salvos.
import * as E from './escrita.js';
import * as R from './ritmo.js';
import { icones } from './icones-kit.js';
import { baixarPdf, baixarImagem } from '../partitura-pdf.js';
import * as P from '../partitura-melodica.js';

/** Função de desenho (largura → { svg, w, h, sistema, topo, n }) de uma partitura guardada { instrumento, dados }. */
export function desenhoDe(row) {
  const d = row.dados || {}; const inst = row.instrumento;
  if (inst === 'teclas') { const evs = P.normalizar(Array.isArray(d.evs) ? d.evs : []); return (largura) => E.tecladoEscrita(evs, { escrita: d.escrita || 'pauta', clave: d.clave || 'auto', largura, cor: !!d.cor }); }
  const evs = R.normaliza(d.evs);
  if (inst === 'bateria') return (largura) => E.bateriaEscrita(evs, { escrita: d.escrita || 'pauta', largura, cor: !!d.cor, icones: icones(d.modelo || 'acustica'), pecas: R.pecasDoKit(d.kit || 'medio') });
  const ncord = R.INSTRUMENTOS[inst] && R.INSTRUMENTOS[inst].opcoes[d.ncord] ? d.ncord : Object.keys((R.INSTRUMENTOS[inst] || R.INSTRUMENTOS.violao).opcoes).map(Number)[0];
  return (largura) => E.cordas(evs, { cordas: R.cordasDe(inst, ncord), inst, escrita: d.escrita || 'tab', largura, cor: !!d.cor });
}
const cfg = (row, perfil, aluno = '') => ({ render: desenhoDe(row), evs: [], titulo: row.nome, aluno, bpm: (row.dados || {}).bpm || 100, data: new Date().toLocaleDateString('pt-BR'), rodape: `Beaterista PRO${perfil && perfil.escola ? ` · ${perfil.escola}` : ''}`, semPapel: true, perfil });
export const exportarPdf = (row, perfil) => baixarPdf(cfg(row, perfil));
export const exportarImagem = (row, perfil) => baixarImagem(cfg(row, perfil));
/** Mesma coisa a partir do que está na tela do editor (sem guardar). `desenho` = largura → desenho. */
export const pdfDoEditor = (desenho, base) => baixarPdf({ ...base, render: desenho, semPapel: true });
export const imagemDoEditor = (desenho, base) => baixarImagem({ ...base, render: desenho, semPapel: true });
