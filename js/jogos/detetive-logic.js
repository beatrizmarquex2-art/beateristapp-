// Detetive Note (regras puras): o secreto é 1 compasso de 4 tempos; a criança ouve e MONTA com cartas de um tema (comida, parque, corpo, animal)
// ou com figuras (modo normal). Sem tela nem áudio, testado em tests/detetive-note.test.mjs.

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
export const MODOS = ['normal', ...Object.keys(TEMAS)]; // figuras em primeiro
/** Células que cada fase usa (a dificuldade sobe e CADA fase muda alguma coisa): 1 só semínima e colcheias; 2 entra a pausa; 3-4 saem as pausas e entram as 4 semicolcheias; 5-6 tudo junto; 7-12 tudo, mais variedade. */
export const poolFase = (n) => (n <= 1 ? ['1000', '1010'] : n === 2 ? ['1000', '1010', '0000'] : n <= 4 ? ['1000', '1010', '1111'] : ['1000', '1010', '1111', '0000']);
/** As cartas de um modo nessa fase (ordem fixa): id da palavra (ou null no modo normal) e a célula rítmica. */
export const cartas = (modo, n = FASES) => poolFase(n).slice().sort((a, b) => ['1000', '1010', '1111', '0000'].indexOf(a) - ['1000', '1010', '1111', '0000'].indexOf(b)).map((cell) => ({ cell, id: modo === 'normal' ? null : cell === '0000' ? 'shh' : TEMAS[modo][cell] }));
/** Sorteia o compasso secreto da fase `n`: 4 células do conjunto da fase (nunca começa com pausa, no máximo 1 pausa, usa pelo menos 2 tipos, traz a novidade da fase e NUNCA repete o compasso anterior `evitar`). */
export function sortear(n = FASES, rnd = Math.random, evitar = null) {
  const pool = poolFase(n); const ev = evitar ? evitar.join() : null;
  for (let g = 0; g < 800; g++) {
    const b = Array.from({ length: 4 }, () => pool[Math.floor(rnd() * pool.length)]);
    if (b[0] === '0000' || b.filter((c) => c === '0000').length > 1 || new Set(b).size < 2 || b.join() === ev) continue;
    if (n === 2 && !b.includes('0000')) continue; // a fase que apresenta a pausa sempre usa
    if ((n === 3 || n === 4) && !b.includes('1111')) continue; // as que apresentam as semicolcheias sempre usam
    if ((n === 5 || n === 6) && !(b.includes('1111') && b.includes('0000'))) continue; // junta tudo
    return b;
  }
  return pool.slice(0, 1).concat(pool.slice(1, 2), pool.slice(0, 1), pool.slice(1, 2));
}
/** Confere o que foi montado: um booleano por tempo (null = tempo ainda vazio). */
export const conferir = (slots, secreto) => secreto.map((c, i) => (slots[i] == null ? null : slots[i] === c));
export const acertou = (slots, secreto) => secreto.every((c, i) => slots[i] === c);
/** Estrelas da fase (completou = 1): 2 se acertou pelo menos 2 ritmos de primeira, 3 se acertou todos de primeira. */
export const estrelas = (primeira, total = RODADAS) => (primeira >= total ? 3 : primeira >= 2 ? 2 : 1);
