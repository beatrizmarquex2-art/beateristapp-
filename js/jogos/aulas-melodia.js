// Aulas de melodia (aba Palco > teclas e percussão/xilofone): o Paul toca uma frase de uma música fácil acendendo as teclas, o aluno repete.
// Regra pura (sem tela): as músicas, a ordem das notas, a nota de 0 a 100 e as estrelas. Tudo em dó maior, só teclas brancas.
// `frases`: cada frase é uma lista de [nota MIDI, duração em tempos]. `confere: true` = melodia que o Claude não tinha certeza (a Bea ainda vai conferir de ouvido).
import { estrelas } from './aulas-bateria.js';
import { nomeNota, mesmaNota, diatonica } from './vivo-logic.js';
export { estrelas, nomeNota, mesmaNota, diatonica };

const F = (txt) => txt.trim().split(/\s+/).map((s) => { const [n, d] = s.split(':'); return [Number(n), Number(d || 1)]; });
// dó = 60, ré = 62, mi = 64, fá = 65, sol = 67, lá = 69, si = 71, dó agudo = 72, ré agudo = 74
export const MUSICAS = [
  { id: 'escada', nome: 'Dó ré mi fá', bpm: 100, frases: [F('60 62 64 65 67'), F('67 65 64 62 60:2')] },
  { id: 'parabens', nome: 'Parabéns pra você', bpm: 100, frases: [F('67:.75 67:.25 69 67 72 71:2'), F('67:.75 67:.25 69 67 74 72:2')] },
  { id: 'jingle', nome: 'Jingle Bells (Bate o sino)', bpm: 110, frases: [F('64 64 64:2'), F('64 64 64:2'), F('64 67 60:1.5 62:.5 64:4')] },
  { id: 'noite', nome: 'Noite Feliz', bpm: 72, frases: [F('67:1.5 69:.5 67 64:3'), F('67:1.5 69:.5 67 64:3'), F('74:2 74 71:3'), F('72:2 72 67:3')] },
  { id: 'balao', nome: 'Cai cai balão', bpm: 100, confere: true, frases: [F('67 67 64 64'), F('67 67 64:2'), F('65 65 62 62'), F('64 64 60:2')] },
  { id: 'pau', nome: 'Atirei o pau no gato', bpm: 110, confere: true, frases: [F('67 67 67 69 67 65 64'), F('64 64 64 65 64 62 60')] },
];
/** A música inteira numa lista só (as notas na ordem). */
export const notasDe = (m) => m.frases.flat();
/** Menor e maior nota da música (pra mostrar só as teclas que ela usa). */
export const faixaDe = (m) => { const ms = notasDe(m).map((n) => n[0]); return [Math.min(...ms), Math.max(...ms)]; };
/** As teclas brancas de `lo` até `hi`, inclusive. */
export const brancasEntre = (lo, hi) => { const o = []; for (let m = lo; m <= hi; m++) if (![1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12)) o.push(m); return o; };
/** Posição da nota na pauta de sol: 0 = 1ª linha (mi), 1 = 1º espaço (fá)… negativo = abaixo da pauta. */
export const posPauta = (midi) => diatonica(midi) - 30;
/** Segundos de uma duração em tempos, a esse andamento. */
export const seg = (tempos, bpm) => tempos * (60 / bpm);

/**
 * Conferência na ORDEM: cada nota que o aluno toca é comparada com a próxima da frase (sem se importar com o tempo).
 * `igual(tocada, esperada)`: na tela é igualdade; no microfone vale em qualquer oitava (violão e teclado de verdade).
 * toca() devolve { tipo: 'ok' | 'frase' | 'fim' | 'erro' | 'parado', certa? }.
 */
export function novaSessao(musica, igual = (a, b) => a === b) {
  let f = 0; let p = 0; let acertos = 0; let erros = 0;
  const esperado = () => (f < musica.frases.length ? musica.frases[f][p][0] : null);
  return {
    get frase() { return f; }, get pos() { return p; }, get acertos() { return acertos; }, get erros() { return erros; }, esperado,
    toca(midi) {
      const e = esperado(); if (e == null) return { tipo: 'parado' };
      if (igual(midi, e)) { acertos++; p++; if (p >= musica.frases[f].length) { f++; p = 0; return { tipo: f >= musica.frases.length ? 'fim' : 'frase' }; } return { tipo: 'ok' }; }
      erros++; return { tipo: 'erro', certa: e };
    },
    /** Nota de 0 a 100: notas certas sobre (certas + tentativas erradas). */
    pct() { const t = acertos + erros; return t ? Math.round((acertos / t) * 100) : 0; },
    /** Recomeça a mesma frase (o aluno errou muito ou o Paul tocou de novo). */
    refaz() { p = 0; },
  };
}
