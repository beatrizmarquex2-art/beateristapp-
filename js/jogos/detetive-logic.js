// Detetive Note (regras puras): o secreto é 1 compasso de 4 tempos; a criança ouve e MONTA com cartas de um tema (comida, parque, corpo, animal)
// ou com figuras (modo normal). Sem tela nem áudio, testado em tests/detetive-note.test.mjs.

import { starsFor } from '../kids/levels.js';

export const FASES = 12; // fases por modo
export const RODADAS = 3; // ritmos por fase
export const BPMS = [80, 100, 120]; // a criança escolhe a velocidade do ritmo (a 120 toca direto, sem a contagem)
export const COM_CONTAGEM = (bpm) => bpm < 120;
/** Uma palavra por tipo de tempo em cada tema (as mesmas do "Monte seu ritmo"): 1 tempo, 2 colcheias, 4 semicolcheias; a pausa é sempre "shhh". */
export const TEMAS = {
  comida: { nome: 'comida', '1000': 'pao', '1010': 'bolo', '1111': 'chocolate' },
  parque: { nome: 'parque', '1000': 'ceu', '1010': 'bola', '1111': 'bicicleta' },
  corpo: { nome: 'corpo', '1000': 'mao', '1010': 'braco', '1111': 'esqueleto' },
  animal: { nome: 'animal', '1000': 'cao', '1010': 'pato', '1111': 'borboleta' },
};
/** 3 mundos de figuras (como o Toca Aqui): o 1 tem semínima, colcheias e pausas de semínima e de colcheia; o 2 tem as semicolcheias com pausa no 1, 2, 3 ou 4; o 3 tem pontuadas e flam. Depois vêm os 4 modos com desenhos. */
export const MUNDOS = ['m1', 'm2', 'm3'];
export const ehMundo = (m) => MUNDOS.includes(m);
export const MODOS = MUNDOS;
/** Estilo das cartas: só o mundo 1 deixa a criança trocar (figuras ou desenhos); nos mundos 2 e 3 são sempre as figuras. */
export const ESTILOS = ['figuras', ...Object.keys(TEMAS)];
export const estiloDe = (modo, escolhido) => (modo === 'm1' && TEMAS[escolhido] ? escolhido : 'figuras');
/** Célula = 4 semicolcheias do tempo (1 = bate); sufixo "f" = a nota leva um flam (notinha de ornamento um tiquinho antes). */
export const baseDe = (cell) => cell.slice(0, 4);
export const temFlam = (cell) => cell.length > 4;
const ORDEM = ['1000', '1010', '1111', '1011', '1110', '1101', '0111', '1001', '1100', '1000f', '0010', '0000'];
/** Cartas de cada fase dos mundos (no máximo 6, sempre com a novidade da fase). */
const POOLS = {
  m1: [['1000', '1010'], ['1000', '1010', '0000'], ['1000', '1010', '0010'], ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010'],
    ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010'], ['1000', '1010', '0000', '0010']],
  m2: [['1000', '1010', '1111'], ['1000', '1010', '1111', '1011'], ['1000', '1111', '1011', '1110'], ['1000', '1010', '1111', '1101'], ['1000', '1010', '1101', '0111'], ['1000', '1111', '0111', '1110', '1011'],
    ['1000', '1010', '1111', '0000', '1011'], ['1000', '1111', '1011', '1101', '0010'], ['1010', '1111', '1110', '0111', '0000'], ['1000', '1011', '1110', '1101', '0111'], ['1010', '1111', '1011', '1101', '0010', '0000'], ['1000', '1111', '1011', '1110', '1101', '0111']],
  m3: [['1000', '1010', '1001'], ['1000', '1010', '1100', '1001'], ['1000', '1111', '1001', '1100'], ['1000', '1010', '1000f'], ['1000', '1001', '1100', '1000f'], ['1000', '1111', '1101', '1001', '1000f'],
    ['1010', '1001', '1100', '0111', '1000f'], ['1000', '1001', '1100', '1000f', '0000'], ['1000', '1010', '1111', '1001', '1100', '1000f'], ['1010', '1001', '1100', '1000f', '0010', '1101'], ['1000', '1001', '1100', '1000f', '0111', '0000'], ['1111', '1001', '1100', '1000f', '1011', '0010']],
};
/** Andamento (BPM) de cada fase, sempre subindo: mundo 1 de 70 a 100, mundo 2 de 90 a 120, mundo 3 de 100 a 140; os modos com desenho de 70 a 120. */
const FAIXA = { m1: [70, 100], m2: [90, 120], m3: [100, 140] };
/** `rapido` (opção pra adultos): no mundo 1 já toca a 100 bpm desde a fase 1 (o andamento do fim do mundo), pra passar mais rápido. */
export const bpmFase = (modo, n, rapido = false) => { if (rapido && modo === 'm1') return FAIXA.m1[1]; const [a, b] = FAIXA[modo] || [70, 120]; return Math.round((a + ((b - a) * (Math.min(Math.max(n, 1), FASES) - 1)) / (FASES - 1)) / 5) * 5; };
/** Células que cada fase usa (a dificuldade sobe e CADA fase muda alguma coisa): 1 só semínima e colcheias; 2 entra a pausa; 3-4 saem as pausas e entram as 4 semicolcheias; 5-6 tudo junto; 7-12 tudo, mais variedade. */
export const poolFase = (n, modo) => (ehMundo(modo) ? POOLS[modo][n - 1] : n <= 1 ? ['1000', '1010'] : n === 2 ? ['1000', '1010', '0000'] : n <= 4 ? ['1000', '1010', '1111'] : ['1000', '1010', '1111', '0000']);
/** As cartas de um modo nessa fase (ordem fixa): id da palavra (ou null no modo normal) e a célula rítmica. */
export const cartas = (modo, n = FASES, estilo = TEMAS[modo] ? modo : 'figuras') => poolFase(n, modo).slice().sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b)).map((cell) => ({ cell, id: !TEMAS[estilo] ? null : cell === '0000' ? 'shh' : cell === '0010' ? 'shh' : TEMAS[estilo][baseDe(cell)] }));
/** Pausas permitidas no compasso: 1 até a fase 10; 2 nas fases 11-12. */
export const maxPausas = (n) => (n >= 11 ? 2 : 1);
/** Quantas vezes dá pra OUVIR o ritmo da rodada (a 1ª, automática, já conta): fases 1-6 sem limite; 7-8 = 6; 9-10 = 4; 11 = 3; 12 = 2 (Infinity = sem limite). */
export const ouvidasMax = (n) => (n <= 6 ? Infinity : n <= 8 ? 6 : n <= 10 ? 4 : n === 11 ? 3 : 2);
/** Sorteia o compasso secreto da fase `n`: 4 células do conjunto da fase (nunca começa com pausa, no máximo `maxPausas` pausas, usa pelo menos 2 tipos (3 a partir da fase 7), traz a novidade da fase e NUNCA repete o compasso anterior `evitar`). */
export function sortear(n = FASES, rnd = Math.random, evitar = null, modo = 'comida') {
  const pool = poolFase(n, modo); const ev = evitar ? evitar.join() : null;
  if (ehMundo(modo)) { // mundos: precisa trazer pelo menos uma carta nova da fase (a que não estava na fase anterior)
    const nova = n > 1 ? pool.filter((c) => !POOLS[modo][n - 2].includes(c)) : [];
    for (let g = 0; g < 1500; g++) {
      const b = Array.from({ length: 4 }, () => pool[Math.floor(rnd() * pool.length)]);
      if (b[0] === '0000' || b.filter((c) => c === '0000').length > maxPausas(n) || new Set(b).size < Math.min(pool.length, n >= 7 ? 3 : 2) || b.join() === ev) continue;
      if (nova.length && !b.some((c) => nova.includes(c))) continue;
      return b;
    }
    return [pool[0], pool[1], pool[0], pool[1]];
  }
  for (let g = 0; g < 800; g++) {
    const b = Array.from({ length: 4 }, () => pool[Math.floor(rnd() * pool.length)]);
    if (b[0] === '0000' || b.filter((c) => c === '0000').length > maxPausas(n) || new Set(b).size < (n >= 7 ? 3 : 2) || b.join() === ev) continue;
    if (n === 2 && !b.includes('0000')) continue; // a fase que apresenta a pausa sempre usa
    if ((n === 3 || n === 4) && !b.includes('1111')) continue; // as que apresentam as semicolcheias sempre usam
    if ((n === 5 || n === 6) && !(b.includes('1111') && b.includes('0000'))) continue; // junta tudo
    if (n >= 9 && !b.includes('0000')) continue; // fases 9-12: o silêncio sempre aparece (o mais difícil de contar de ouvido)
    if (n >= 7 && !b.includes('1111')) continue; // fases 7-12: sempre tem as 4 semicolcheias (3 ou mais tipos de tempo, nunca só semínima e colcheia)
    return b;
  }
  return pool.slice(0, 1).concat(pool.slice(1, 2), pool.slice(0, 1), pool.slice(1, 2));
}
/** Confere o que foi montado: um booleano por tempo (null = tempo ainda vazio). */
export const conferir = (slots, secreto) => secreto.map((c, i) => (slots[i] == null ? null : slots[i] === c));
export const acertou = (slots, secreto) => secreto.every((c, i) => slots[i] === c);
/** Estrelas da fase, igual à pauLta: % de ritmos acertados de primeira. 60% = 1 estrela, 80% = 2, 100% = 3; abaixo de 60% = 0 (quase lá, tenta de novo). */
export const estrelas = (primeira, total = RODADAS) => starsFor(primeira, total);
