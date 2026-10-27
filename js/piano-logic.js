// Piano de referência: lógica pura (notas, nomes, teclas do computador, layout do teclado). Sem DOM, testável.
export const NOMES = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
export const CIFRAS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = (m) => BLACK.has(((m % 12) + 12) % 12);
/** Oitava no padrão científico (C4 = dó central = MIDI 60). */
export const octaveOf = (m) => Math.floor(m / 12) - 1;
export const nameOf = (m, mode = 'pt') => `${(mode === 'cifra' ? CIFRAS : NOMES)[((m % 12) + 12) % 12]}${octaveOf(m)}`;
export const hzOf = (m) => 440 * 2 ** ((m - 69) / 12);

/** Teclado na tela: `octaves` oitavas a partir do dó da oitava `oct`, terminando num dó. Devolve { whites:[midi], blacks:[{midi, at}] } (at = posição em "teclas brancas"). */
export function layout(oct, octaves) {
  const start = (oct + 1) * 12; const end = start + octaves * 12; // inclui o dó final
  const whites = []; const blacks = [];
  for (let m = start; m <= end; m++) {
    if (isBlack(m)) blacks.push({ midi: m, at: whites.length });
    else whites.push(m);
  }
  return { whites, blacks };
}

/** Teclas do computador: fileira do meio = brancas, de cima = pretas (a partir do dó da oitava base). Devolve semitons acima do dó. */
export const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ç: 16, ';': 16 };
export const keyToMidi = (key, baseOct) => { const s = KEYMAP[String(key).toLowerCase()]; return s === undefined ? null : (baseOct + 1) * 12 + s; };

export const clampOct = (o, octaves) => Math.max(1, Math.min(7 - octaves, o | 0)); // C1 .. (C7 como dó final)
