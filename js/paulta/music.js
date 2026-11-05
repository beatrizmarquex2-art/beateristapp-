// pauLta: música pura (sem tela). Nota = número diatônico n = oitava*7 + letra (dó4 = 28). Só notas naturais.
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const SYL = { C: 'dó', D: 'ré', E: 'mi', F: 'fá', G: 'sol', A: 'lá', B: 'si' };
const SEMI = [0, 2, 4, 5, 7, 9, 11];
export const mk = (letter, oct) => oct * 7 + LETTERS.indexOf(letter);
export const letterOf = (n) => LETTERS[((n % 7) + 7) % 7];
export const octOf = (n) => Math.floor(n / 7);
/** "mi4": nome com a oitava (dó4 = dó central). */
export const noteName = (n) => `${SYL[letterOf(n)]}${octOf(n)}`;
export const sylOf = (n) => SYL[letterOf(n)];
export const freqOf = (n) => 440 * 2 ** ((12 * (octOf(n) + 1) + SEMI[((n % 7) + 7) % 7] - 69) / 12);

/** `bottom` = nota da 1ª linha (de baixo). Sol: mi4. Fá: sol2. */
export const CLEFS = {
  sol: { id: 'sol', name: 'clave de sol', bottom: mk('E', 4) },
  fa: { id: 'fa', name: 'clave de fá', bottom: mk('G', 2) },
};
export const OTHER = { sol: 'fa', fa: 'sol' };
/** posição na pauta: 0 = 1ª linha, 1 = 1º espaço, 2 = 2ª linha … 8 = 5ª linha; negativo = abaixo, 9+ = acima. */
export const posOf = (clef, n) => n - CLEFS[clef].bottom;
export const noteAt = (clef, s) => CLEFS[clef].bottom + s;
/** a nota que ocupa a MESMA posição na outra clave (sol→fá: 12 casas abaixo). */
export const sameSpotOther = (clef, n) => noteAt(OTHER[clef], posOf(clef, n));

const ORD = ['', '1ª', '2ª', '3ª', '4ª', '5ª'];
/** Onde a nota mora na pauta, em palavras. */
export function placeText(clef, n) {
  const s = posOf(clef, n);
  if (s >= 0 && s <= 8) return s % 2 === 0 ? `${ORD[s / 2 + 1]} linha` : `${ORD[(s + 1) / 2]} espaço`.replace('ª', 'º');
  if (s < 0) { const k = -s; return k % 2 === 0 ? `${k / 2}ª linha suplementar abaixo da pauta` : k === 1 ? 'espaço logo abaixo da pauta' : `espaço entre as linhas suplementares de baixo`; }
  const k = s - 8; return k % 2 === 0 ? `${k / 2}ª linha suplementar acima da pauta` : k === 1 ? 'espaço logo acima da pauta' : 'espaço entre as linhas suplementares de cima';
}
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const inStaff = (clef) => range(CLEFS[clef].bottom, CLEFS[clef].bottom + 8);

export function shuffle(a, rnd = Math.random) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export const pick = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];
/** mulberry32: sorteio com semente (testes e reforço repetível). */
export function seeded(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
