// As 7 figuras rítmicas (e as pausas delas), com quanto valem e como se desenham. Puro (sem tela), testado em tests/figuras.test.mjs.
// A semínima é a unidade (1 tempo). Cada figura seguinte vale a metade da anterior.
export const FIGS = [
  { id: 'semibreve', name: 'semibreve', beats: 4, open: true, stem: false, flags: 0, per: 1, frac: 'a maior: dura o compasso inteiro' },
  { id: 'minima', name: 'mínima', beats: 2, open: true, stem: true, flags: 0, per: 2, frac: 'metade da semibreve' },
  { id: 'seminima', name: 'semínima', beats: 1, open: false, stem: true, flags: 0, per: 4, frac: 'é o pulso: a que a gente bate o pé' },
  { id: 'colcheia', name: 'colcheia', beats: 0.5, open: false, stem: true, flags: 1, per: 8, frac: 'metade da semínima' },
  { id: 'semicolcheia', name: 'semicolcheia', beats: 0.25, open: false, stem: true, flags: 2, per: 16, frac: 'metade da colcheia' },
  { id: 'fusa', name: 'fusa', beats: 0.125, open: false, stem: true, flags: 3, per: 32, frac: 'metade da semicolcheia' },
  { id: 'semifusa', name: 'semifusa', beats: 0.0625, open: false, stem: true, flags: 4, per: 64, frac: 'metade da fusa: a menor de todas' },
];
export const FIG_BY = Object.fromEntries(FIGS.map((f) => [f.id, f]));
export const FIG_NAME = Object.fromEntries(FIGS.map((f) => [f.id, f.name]));

export const beatsLabel = (b) => (b >= 2 ? `${b} tempos` : b === 1 ? '1 tempo' : b === 0.5 ? 'meio tempo' : b === 0.25 ? '¼ de tempo' : b === 0.125 ? '⅛ de tempo' : '1/16 de tempo');

/** Grupos de notas que "cabem" num espaço menor: a tercina põe 3 notas onde cabiam 2; a sextina põe 6 onde cabiam 4. */
export const GROUPS = [
  { id: 'tercina', name: 'tercina', n: 3, normal: 2, flags: 1, text: '3 colcheias no tempo de 2: o tempo é dividido em 3 partes iguais' },
  { id: 'sextina', name: 'sextina', n: 6, normal: 4, flags: 2, text: '6 semicolcheias no tempo de 4: o tempo é dividido em 6 partes iguais' },
];

/** Qual figura é esse desenho (cabeça vazia/cheia, haste, bandeirinhas)? undefined se não existe. */
export const figBySpec = ({ open, stem, flags }) => FIGS.find((f) => f.open === !!open && f.stem === !!stem && f.flags === flags);
/** Código do desenho montado (cabeça vazia=1/cheia=0, haste, bandeirinhas) e o contrário. */
export const specId = (s) => `${s.open ? 1 : 0}${s.stem ? 1 : 0}${s.flags}`;
export const specOf = (id) => ({ open: id[0] === '1', stem: id[1] === '1', flags: Number(id[2]) });

/** Desenhos montados errado de propósito (pro jogo "qual está certinho?"): mexe na cabeça, na haste ou nas bandeirinhas. */
export function wrongSpecs(fig, rnd = Math.random, k = 3) {
  const ok = specId(fig); const out = new Set();
  const tries = [
    { ...fig, open: !fig.open }, { ...fig, stem: !fig.stem }, { ...fig, flags: fig.flags + 1 }, { ...fig, flags: Math.max(0, fig.flags - 1) },
    { ...fig, open: !fig.open, stem: true }, { ...fig, stem: true, flags: fig.flags + 2 },
  ].filter((s) => (s.flags > 0 ? s.stem : true)); // bandeirinha sem haste não existe: nem como pegadinha
  for (const s of tries.sort(() => rnd() - 0.5)) { const id = specId(s); if (id !== ok) out.add(id); if (out.size >= k) break; }
  return [...out].slice(0, k);
}
