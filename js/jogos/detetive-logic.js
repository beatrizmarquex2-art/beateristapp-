// Detetive Note (regras puras): o secreto é 1 compasso de 4 tempos; a criança ouve e MONTA com cartas de um tema (comida, parque, corpo, animal)
// ou com figuras (modo normal). Sem tela nem áudio, testado em tests/detetive-note.test.mjs.
import { randomFoods, cellOf } from '../kids-logic.js';

export const RODADAS = 6;
export const BPM = 80;
/** Uma palavra por tipo de tempo em cada tema (as mesmas do "Monte seu ritmo"): 1 tempo, 2 colcheias, 4 semicolcheias; a pausa é sempre "shhh". */
export const TEMAS = {
  comida: { nome: 'comida', '1000': 'pao', '1010': 'bolo', '1111': 'chocolate' },
  parque: { nome: 'parque', '1000': 'ceu', '1010': 'bola', '1111': 'bicicleta' },
  corpo: { nome: 'corpo', '1000': 'mao', '1010': 'braco', '1111': 'esqueleto' },
  animal: { nome: 'animal', '1000': 'cao', '1010': 'pato', '1111': 'borboleta' },
};
export const MODOS = [...Object.keys(TEMAS), 'normal'];
/** As 4 cartas de um modo (ordem fixa): id da palavra (ou null no modo normal) e a célula rítmica. */
export const cartas = (modo) => ['1000', '1010', '1111', '0000'].map((cell) => ({ cell, id: modo === 'normal' ? null : cell === '0000' ? 'shh' : TEMAS[modo][cell] }));
/** Sorteia o compasso secreto: 4 células (nunca começa com pausa nem tem mais de uma pausa). */
export const sortear = (rnd = Math.random) => randomFoods(rnd, 2).map(cellOf);
/** Confere o que foi montado: um booleano por tempo (null = tempo ainda vazio). */
export const conferir = (slots, secreto) => secreto.map((c, i) => (slots[i] == null ? null : slots[i] === c));
export const acertou = (slots, secreto) => secreto.every((c, i) => slots[i] === c);
/** Estrelas pela partida: quantas rodadas foram certas de primeira. */
export const estrelas = (primeira, total = RODADAS) => { const p = total ? primeira / total : 0; return p >= 0.9 ? 3 : p >= 0.6 ? 2 : p > 0 ? 1 : 0; };
