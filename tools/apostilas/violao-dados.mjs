// Dados do violão: dicionário de acordes (casas e dedos), melodias e escalas. Tudo é validado em violao-lib.mjs.
export const AC = {
  // maiores
  C: { c: 'C', f: 'x32010', d: 'x32.1.', nome: 'Dó maior' }, D: { c: 'D', f: 'xx0232', d: 'xx.132', nome: 'Ré maior' }, E: { c: 'E', f: '022100', d: '.231..', nome: 'Mi maior' },
  F: { c: 'F', f: '133211', d: '134211', pest: { casa: 1, de: 6, ate: 1 }, nome: 'Fá maior (pestana)' }, G: { c: 'G', f: '320003', d: '21...3', nome: 'Sol maior' }, A: { c: 'A', f: 'x02220', d: 'x.123.', nome: 'Lá maior' },
  B: { c: 'B', f: 'x24442', d: 'x12341', pest: { casa: 2, de: 5, ate: 1 }, nome: 'Si maior (pestana)' }, Bb: { c: 'Bb', f: 'x13331', d: 'x12341', pest: { casa: 1, de: 5, ate: 1 }, nome: 'Si bemol maior (pestana)' },
  // menores
  Am: { c: 'Am', f: 'x02210', d: 'x.231.', nome: 'Lá menor' }, Bm: { c: 'Bm', f: 'x24432', d: 'x13421', pest: { casa: 2, de: 5, ate: 1 }, nome: 'Si menor (pestana)' }, Cm: { c: 'Cm', f: 'x35543', d: 'x13421', pest: { casa: 3, de: 5, ate: 1 }, nome: 'Dó menor (pestana)' },
  Dm: { c: 'Dm', f: 'xx0231', d: 'xx.231', nome: 'Ré menor' }, Em: { c: 'Em', f: '022000', d: '.23...', nome: 'Mi menor' }, Fm: { c: 'Fm', f: '133111', d: '134111', pest: { casa: 1, de: 6, ate: 1 }, nome: 'Fá menor (pestana)' },
  Gm: { c: 'Gm', f: '355333', d: '134111', pest: { casa: 3, de: 6, ate: 1 }, nome: 'Sol menor (pestana)' }, 'F#m': { c: 'F#m', f: '244222', d: '134111', pest: { casa: 2, de: 6, ate: 1 }, nome: 'Fá♯ menor (pestana)' },
  'C#m': { c: 'C#m', f: 'x46654', d: 'x13421', pest: { casa: 4, de: 5, ate: 1 }, nome: 'Dó♯ menor (pestana)' }, 'G#m': { c: 'G#m', f: '466444', d: '134111', pest: { casa: 4, de: 6, ate: 1 }, nome: 'Sol♯ menor (pestana)' },
  // sétima menor (dominante)
  A7: { c: 'A7', f: 'x02020', d: 'x.2.3.', nome: 'Lá com sétima' }, B7: { c: 'B7', f: 'x21202', d: 'x213.4', nome: 'Si com sétima' }, C7: { c: 'C7', f: 'x32310', d: 'x3241.', nome: 'Dó com sétima' },
  D7: { c: 'D7', f: 'xx0212', d: 'xx.213', nome: 'Ré com sétima' }, E7: { c: 'E7', f: '020100', d: '.2.1..', nome: 'Mi com sétima' }, G7: { c: 'G7', f: '320001', d: '32...1', nome: 'Sol com sétima' },
  // sétima maior
  Cmaj7: { c: 'Cmaj7', f: 'x32000', d: 'x32...', nome: 'Dó com sétima maior' }, Gmaj7: { c: 'Gmaj7', f: '320002', d: '32...1', nome: 'Sol com sétima maior' }, Amaj7: { c: 'Amaj7', f: 'x02120', d: 'x.213.', nome: 'Lá com sétima maior' },
  Dmaj7: { c: 'Dmaj7', f: 'xx0222', d: 'xx.123', nome: 'Ré com sétima maior' }, Fmaj7: { c: 'Fmaj7', f: 'xx3210', d: 'xx321.', nome: 'Fá com sétima maior' },
  // menor com sétima
  Am7: { c: 'Am7', f: 'x02010', d: 'x.2.1.', nome: 'Lá menor com sétima' }, Em7: { c: 'Em7', f: '020000', d: '.2....', nome: 'Mi menor com sétima' }, Dm7: { c: 'Dm7', f: 'xx0211', d: 'xx.211', pest: { casa: 1, de: 2, ate: 1, mini: true }, nome: 'Ré menor com sétima' },
  // diminutos e aumentados
  Bdim: { c: 'Bdim', rotulo: 'B°', f: 'x2343x', d: 'x1243x', nome: 'Si diminuto' }, Cdim: { c: 'Cdim', rotulo: 'C°', f: 'x3454x', d: 'x1342x', nome: 'Dó diminuto' },
  Caug: { c: 'Caug', rotulo: 'C+', f: 'x32110', d: 'x4311.', pest: { casa: 1, de: 3, ate: 2, mini: true }, nome: 'Dó aumentado' }, Gaug: { c: 'Gaug', rotulo: 'G+', f: '321003', d: '321..4', nome: 'Sol aumentado' },
  // suspensos
  Asus2: { c: 'Asus2', f: 'x02200', d: 'x.12..', nome: 'Lá sus2' }, Dsus2: { c: 'Dsus2', f: 'xx0230', d: 'xx.12.', nome: 'Ré sus2' }, Asus4: { c: 'Asus4', f: 'x02230', d: 'x.123.', nome: 'Lá sus4' },
  Dsus4: { c: 'Dsus4', f: 'xx0233', d: 'xx.134', nome: 'Ré sus4' }, Esus4: { c: 'Esus4', f: '022200', d: '.123..', nome: 'Mi sus4' },
  // power chords (5)
  E5: { c: 'E5', f: '022xxx'.replace(/x/g, 'x'), d: '.12xxx', nome: 'Mi 5' }, A5: { c: 'A5', f: 'x022xx', d: 'x.12xx', nome: 'Lá 5' }, G5: { c: 'G5', f: '355xxx', d: '134xxx', nome: 'Sol 5' }, C5: { c: 'C5', f: 'x355xx', d: 'x134xx', nome: 'Dó 5' }, D5: { c: 'D5', f: 'x577xx', d: 'x134xx', base: 5, nome: 'Ré 5' },
  // baixo invertido
  'C/E': { c: 'C/E', f: '032010', d: '.32.1.', nome: 'Dó com baixo em Mi (1ª inversão)' }, 'C/G': { c: 'C/G', f: '332010', d: '342.1.', nome: 'Dó com baixo em Sol (2ª inversão)' }, 'D/F#': { c: 'D/F#', f: '200232', d: '1..243', nome: 'Ré com baixo em Fá♯ (1ª inversão)' },
  'G/B': { c: 'G/B', f: 'x20003', d: 'x1...2', nome: 'Sol com baixo em Si (1ª inversão)' }, 'F/C': { c: 'F/C', f: 'x3321x', d: 'x3421x', nome: 'Fá com baixo em Dó (2ª inversão)' }, 'Am/E': { c: 'Am/E', f: '002210', d: '..231.', nome: 'Lá menor com baixo em Mi (2ª inversão)' },
  // Fá simplificado (minipestana de duas cordas)
  Fmini: { c: 'F', f: 'xx3211', d: 'xx3211', pest: { casa: 1, de: 2, ate: 1, mini: true }, nome: 'Fá maior (minipestana de 2 cordas)' },
};
AC.E5.f = '022xxx';
// "x" no fim das power chords: validaAcorde lê x como corda abafada.

/* ---- melodias: sons reais (como o violão soa), em semicolcheias (4 = semínima). Domínio público / tradicionais. ---- */
const N = (n, d, extra = {}) => ({ n, d, ...extra });
const seq = (pares) => pares.map(([n, d, e]) => (n === 'r' ? { r: true, d } : N(n, d, e)));
export const MELODIAS = {
  parabens: { titulo: 'Parabéns pra você', origem: 'tradicional (melodia de domínio público)', compasso: '3/4', pickup: 4, tempo: '♩ = 90', porLinha: 4, tom: 'Dó maior', anacruse: true,
    evs: seq([['G3', 3], ['G3', 1], ['A3', 4], ['G3', 4], ['C4', 4], ['B3', 8], ['G3', 3], ['G3', 1], ['A3', 4], ['G3', 4], ['D4', 4], ['C4', 8], ['G3', 3], ['G3', 1], ['G4', 4], ['E4', 4], ['C4', 4], ['B3', 4], ['A3', 4], ['F4', 3], ['F4', 1], ['E4', 4], ['C4', 4], ['D4', 4], ['C4', 12]]) },
  brilha: { titulo: 'Brilha, brilha, estrelinha', origem: 'cantiga tradicional (domínio público)', compasso: '4/4', pickup: 0, tempo: '♩ = 90', porLinha: 4, tom: 'Dó maior',
    evs: seq([['C4', 4], ['C4', 4], ['G4', 4], ['G4', 4], ['A4', 4], ['A4', 4], ['G4', 8], ['F4', 4], ['F4', 4], ['E4', 4], ['E4', 4], ['D4', 4], ['D4', 4], ['C4', 8], ['G4', 4], ['G4', 4], ['F4', 4], ['F4', 4], ['E4', 4], ['E4', 4], ['D4', 8], ['G4', 4], ['G4', 4], ['F4', 4], ['F4', 4], ['E4', 4], ['E4', 4], ['D4', 8], ['C4', 4], ['C4', 4], ['G4', 4], ['G4', 4], ['A4', 4], ['A4', 4], ['G4', 8], ['F4', 4], ['F4', 4], ['E4', 4], ['E4', 4], ['D4', 4], ['D4', 4], ['C4', 8]]) },
  frei: { titulo: 'Frei João (Frère Jacques)', origem: 'cantiga tradicional (domínio público)', compasso: '4/4', pickup: 0, tempo: '♩ = 100', porLinha: 4, tom: 'Dó maior',
    evs: seq([['C4', 4], ['D4', 4], ['E4', 4], ['C4', 4], ['C4', 4], ['D4', 4], ['E4', 4], ['C4', 4], ['E4', 4], ['F4', 4], ['G4', 8], ['E4', 4], ['F4', 4], ['G4', 8], ['G4', 2], ['A4', 2], ['G4', 2], ['F4', 2], ['E4', 4], ['C4', 4], ['G4', 2], ['A4', 2], ['G4', 2], ['F4', 2], ['E4', 4], ['C4', 4], ['C4', 4], ['G3', 4], ['C4', 8], ['C4', 4], ['G3', 4], ['C4', 8]]) },
  noite: { titulo: 'Noite Feliz', origem: 'Franz Xaver Gruber, 1818 (domínio público), versão simplificada', compasso: '6/8', pickup: 0, tempo: '♩. = 56', porLinha: 3, tom: 'Sol maior',
    evs: seq([['D4', 3], ['E4', 1], ['D4', 2], ['B3', 6], ['D4', 3], ['E4', 1], ['D4', 2], ['B3', 6], ['A4', 4], ['A4', 2], ['F#4', 6], ['G4', 4], ['G4', 2], ['D4', 6], ['E4', 4], ['E4', 2], ['G4', 3], ['F#4', 1], ['E4', 2], ['D4', 3], ['E4', 1], ['D4', 2], ['B3', 6], ['E4', 4], ['E4', 2], ['G4', 3], ['F#4', 1], ['E4', 2], ['D4', 3], ['E4', 1], ['D4', 2], ['B3', 6], ['A4', 4], ['A4', 2], ['C5', 3], ['A4', 1], ['F#4', 2], ['G4', 4], ['B4', 2], ['G4', 3], ['D4', 1], ['B3', 2], ['D4', 4], ['C4', 2], ['A3', 6], ['G3', 12]]) },
  jingle: { titulo: 'Jingle Bells (refrão)', origem: 'James Lord Pierpont, 1857 (domínio público)', compasso: '4/4', pickup: 0, tempo: '♩ = 120', porLinha: 4, tom: 'Dó maior',
    evs: seq([['E4', 4], ['E4', 4], ['E4', 8], ['E4', 4], ['E4', 4], ['E4', 8], ['E4', 4], ['G4', 4], ['C4', 6], ['D4', 2], ['E4', 16], ['F4', 4], ['F4', 4], ['F4', 6], ['F4', 2], ['F4', 4], ['E4', 4], ['E4', 4], ['E4', 2], ['E4', 2], ['E4', 4], ['D4', 4], ['D4', 4], ['E4', 4], ['D4', 8], ['G4', 8]]) },
  ode: { titulo: 'Ode à Alegria', origem: 'Ludwig van Beethoven, 1824 (domínio público)', compasso: '4/4', pickup: 0, tempo: '♩ = 100', porLinha: 4, tom: 'Dó maior',
    evs: seq([['E4', 4], ['E4', 4], ['F4', 4], ['G4', 4], ['G4', 4], ['F4', 4], ['E4', 4], ['D4', 4], ['C4', 4], ['C4', 4], ['D4', 4], ['E4', 4], ['E4', 6], ['D4', 2], ['D4', 8], ['E4', 4], ['E4', 4], ['F4', 4], ['G4', 4], ['G4', 4], ['F4', 4], ['E4', 4], ['D4', 4], ['C4', 4], ['C4', 4], ['D4', 4], ['E4', 4], ['D4', 6], ['C4', 2], ['C4', 8]]) },
};
