// Teoria musical pura (sem tela) pros materiais em PDF da Robôterista: notas com grafia correta (dó♯ ≠ ré♭), escalas, armaduras,
// intervalos, acordes de 3 e 4 sons, campo harmônico, modos, transposição. Tudo calculado, pra os exercícios e gabaritos baterem.
export const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; export const NATPC = [0, 2, 4, 5, 7, 9, 11];
export const SOLFA = { C: 'dó', D: 'ré', E: 'mi', F: 'fá', G: 'sol', A: 'lá', B: 'si' };
const mod = (a, n) => ((a % n) + n) % n;
/** Nota = { l: índice da letra (0=C), a: alteração (+1 sustenido, -1 bemol), pc: 0-11 }. Aceita 'C', 'F#', 'Bb', 'Eb'. */
export function N(s) { const m = /^([A-G])(#{0,2}|b{0,2})$/.exec(s); if (!m) throw new Error(`nota inválida: ${s}`); const l = LET.indexOf(m[1]); const a = m[2].startsWith('#') ? m[2].length : -m[2].length; return { l, a, pc: mod(NATPC[l] + a, 12) }; }
/** Sobe `grau` letras (1 = mesma) e `semis` semitons, mantendo a grafia correta. */
export function sobe(n, grau, semis) { const l = mod(n.l + grau - 1, 7); const pc = mod(n.pc + semis, 12); let a = mod(pc - NATPC[l] + 6, 12) - 6; return { l, a, pc }; }
export const acc = (a) => (a === 0 ? '' : a > 0 ? '♯'.repeat(a) : '♭'.repeat(-a));
/** 'Fá♯' (em português) e 'F♯' (cifra). */
export const pt = (n) => `${SOLFA[LET[n.l]][0].toUpperCase()}${SOLFA[LET[n.l]].slice(1)}${acc(n.a)}`;
export const ptmin = (n) => `${SOLFA[LET[n.l]]}${acc(n.a)}`;
export const cifra = (n) => `${LET[n.l]}${acc(n.a)}`;
export const igual = (a, b) => a.l === b.l && a.a === b.a;

/** Escalas: lista de [grau, semitons]. */
export const ESC = {
  maior: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 11]],
  menor: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]],
  menorHarm: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 11]],
  menorMel: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 11]],
  penta: [[1, 0], [2, 2], [3, 4], [5, 7], [6, 9]],
  pentaMenor: [[1, 0], [3, 3], [4, 5], [5, 7], [7, 10]],
  blues: [[1, 0], [3, 3], [4, 5], [5, 6], [5, 7], [7, 10]],
  jonio: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 11]],
  dorico: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 10]],
  frigio: [[1, 0], [2, 1], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]],
  lidio: [[1, 0], [2, 2], [3, 4], [4, 6], [5, 7], [6, 9], [7, 11]],
  mixolidio: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 10]],
  eolio: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]],
  locrio: [[1, 0], [2, 1], [3, 3], [4, 5], [5, 6], [6, 8], [7, 10]],
};
export const MODOS = [['jonio', 'Jônio', 'igual à escala maior', 1], ['dorico', 'Dórico', 'menor com a 6ª maior', 2], ['frigio', 'Frígio', 'menor com a 2ª menor', 3], ['lidio', 'Lídio', 'maior com a 4ª aumentada', 4], ['mixolidio', 'Mixolídio', 'maior com a 7ª menor', 5], ['eolio', 'Eólio', 'igual à escala menor natural', 6], ['locrio', 'Lócrio', 'menor com a 2ª e a 5ª diminutas', 7]];
export const escala = (raiz, tipo) => { const r = typeof raiz === 'string' ? N(raiz) : raiz; return ESC[tipo].map(([g, s]) => sobe(r, g, s)); };
export const SUST = ['F', 'C', 'G', 'D', 'A', 'E', 'B']; export const BEM = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
/** Armadura de uma escala maior ou menor: { n: quantidade, tipo: '♯' | '♭' | '', notas: [letras] }. */
export function armadura(raiz, tipo = 'maior') { const e = escala(raiz, tipo === 'menor' ? 'menor' : 'maior'); const s = e.filter((n) => n.a > 0).length; const b = e.filter((n) => n.a < 0).length; return s ? { n: s, tipo: '♯', notas: SUST.slice(0, s) } : b ? { n: b, tipo: '♭', notas: BEM.slice(0, b) } : { n: 0, tipo: '', notas: [] }; }
export const relativaMenor = (maior) => sobe(typeof maior === 'string' ? N(maior) : maior, 6, 9);
export const relativaMaior = (menor) => sobe(typeof menor === 'string' ? N(menor) : menor, 3, 3);
export const TONS_MAIORES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

/** Intervalos. `nome(a, b)` = { num, semis, qual: 'J' | 'M' | 'm' | 'A' | 'd', txt: '3ª maior' }. */
const BASE = [0, 2, 4, 5, 7, 9, 11];
export function intervalo(a, b) {
  const num = mod(b.l - a.l, 7) + 1; let semis = mod(b.pc - a.pc, 12); if (semis === 0 && num > 1 && num < 8) semis = 12; if (num === 8 || (num === 1 && semis === 0)) { /* uníssono/8ª */ }
  const base = BASE[num - 1]; const d = semis - base; const justo = [1, 4, 5].includes(num); let qual;
  if (justo) qual = d === 0 ? 'J' : d === 1 ? 'A' : d === -1 ? 'd' : d > 0 ? 'AA' : 'dd'; else qual = d === 0 ? 'M' : d === -1 ? 'm' : d === 1 ? 'A' : d === -2 ? 'd' : d > 0 ? 'AA' : 'dd';
  const nomeQ = { J: 'justa', M: 'maior', m: 'menor', A: 'aumentada', d: 'diminuta', AA: 'dobr. aumentada', dd: 'dobr. diminuta' }[qual];
  return { num, semis, qual, txt: `${num}ª ${nomeQ}` };
}
export const INTERV = [['2ª menor', 2, 1], ['2ª maior', 2, 2], ['3ª menor', 3, 3], ['3ª maior', 3, 4], ['4ª justa', 4, 5], ['4ª aumentada', 4, 6], ['5ª diminuta', 5, 6], ['5ª justa', 5, 7], ['6ª menor', 6, 8], ['6ª maior', 6, 9], ['7ª menor', 7, 10], ['7ª maior', 7, 11], ['8ª justa', 8, 12]];
/** Nota a `num`ª / `semis` semitons acima de `n`. */
export const acima = (n, num, semis) => sobe(n, num, semis);
export const transpoe = (n, num, semis) => sobe(n, num, semis);

/** Acordes. tipo: maj | min | dim | aug | sus4 | sus2 | 7 | maj7 | m7 | m7b5 | dim7 | m6 | 6 | add9 | 9 */
export const ACORDE = {
  maj: [[1, 0], [3, 4], [5, 7]], min: [[1, 0], [3, 3], [5, 7]], dim: [[1, 0], [3, 3], [5, 6]], aug: [[1, 0], [3, 4], [5, 8]],
  sus4: [[1, 0], [4, 5], [5, 7]], sus2: [[1, 0], [2, 2], [5, 7]],
  7: [[1, 0], [3, 4], [5, 7], [7, 10]], maj7: [[1, 0], [3, 4], [5, 7], [7, 11]], m7: [[1, 0], [3, 3], [5, 7], [7, 10]], m7b5: [[1, 0], [3, 3], [5, 6], [7, 10]], dim7: [[1, 0], [3, 3], [5, 6], [7, 9]],
  6: [[1, 0], [3, 4], [5, 7], [6, 9]], m6: [[1, 0], [3, 3], [5, 7], [6, 9]], add9: [[1, 0], [3, 4], [5, 7], [9, 14]], 9: [[1, 0], [3, 4], [5, 7], [7, 10], [9, 14]],
};
export const SUFIXO = { maj: '', min: 'm', dim: '°', aug: '+', sus4: 'sus4', sus2: 'sus2', 7: '7', maj7: 'maj7', m7: 'm7', m7b5: 'm7(♭5)', dim7: '°7', 6: '6', m6: 'm6', add9: 'add9', 9: '9' };
export const acorde = (raiz, tipo) => { const r = typeof raiz === 'string' ? N(raiz) : raiz; return ACORDE[tipo].map(([g, s]) => sobe(r, g, s)); };
export const nomeAcorde = (raiz, tipo) => `${cifra(typeof raiz === 'string' ? N(raiz) : raiz)}${SUFIXO[tipo]}`;
export const NOME_TIPO = { maj: 'maior', min: 'menor', dim: 'diminuto', aug: 'aumentado', sus4: 'suspenso (4ª)', sus2: 'suspenso (2ª)', 7: 'dominante (7ª menor)', maj7: '7ª maior', m7: 'menor com 7ª', m7b5: 'meio-diminuto', dim7: 'diminuto com 7ª diminuta' };

/** Campo harmônico: os 7 graus com qualidade (tríade e tétrade), numeral romano e função. */
const ROMANO = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const CAMPO = {
  maior: { tri: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], tet: ['maj7', 'm7', 'm7', 'maj7', 7, 'm7', 'm7b5'], func: ['T', 'S', 'T', 'S', 'D', 'T', 'D'] },
  menor: { tri: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'], tet: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', 7], func: ['T', 'S', 'T', 'S', 'D', 'S', 'T'] },
  menorHarm: { tri: ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim'], tet: [null, 'm7b5', null, 'm7', 7, 'maj7', 'dim7'], func: ['T', 'S', 'T', 'S', 'D', 'S', 'D'] },
};
export function campo(raiz, modo = 'maior') {
  const r = typeof raiz === 'string' ? N(raiz) : raiz; const esc = escala(r, modo === 'maior' ? 'maior' : modo === 'menor' ? 'menor' : 'menorHarm'); const C = CAMPO[modo];
  return esc.map((n, i) => { const tri = C.tri[i]; const tet = C.tet[i]; const menor = ['min', 'dim'].includes(tri); const rom = menor ? ROMANO[i].toLowerCase() + (tri === 'dim' ? '°' : '') : ROMANO[i] + (tri === 'aug' ? '+' : ''); return { grau: i + 1, nota: n, tri, tet, romano: rom, func: C.func[i], nomeTri: nomeAcorde(n, tri), nomeTet: tet == null ? null : nomeAcorde(n, tet), notasTri: acorde(n, tri), notasTet: tet == null ? null : acorde(n, tet) }; });
}
export const FUNCOES = { T: 'tônica', S: 'subdominante', D: 'dominante' };
/** Inversões de um acorde (tríade): 0 = fundamental, 1 = 1ª inversão (3ª no baixo), 2 = 2ª inversão (5ª no baixo). */
export const inversao = (notas, k) => notas.slice(k).concat(notas.slice(0, k));
/** Progressão por graus romanos (1-7) numa tonalidade maior: devolve os nomes dos acordes (cifra). `tet` usa acordes de 4 sons. */
export const progressao = (tom, graus, modo = 'maior', tet = false) => { const c = campo(tom, modo); return graus.map((g) => (tet && c[g - 1].nomeTet ? c[g - 1].nomeTet : c[g - 1].nomeTri)); };
export const dominanteDe = (n) => sobe(n, 5, 7);
