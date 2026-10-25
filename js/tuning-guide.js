// Guia de afinação por tambor: ordem dos parafusos em estrela, quanto girar e alvos sugeridos. Lógica pura (tests/tuneguide.test.mjs).

/** Ordem em estrela (posições 1..n no sentido do relógio): sempre cruza pro lado oposto, como se aperta roda de carro. */
export function starOrder(n) {
  const half = n / 2; const ks = [];
  for (let k = 0; k < half; k += 2) ks.push(k);
  for (let k = 1; k < half; k += 2) ks.push(k);
  return ks.flatMap((k) => [k + 1, k + half + 1]);
}

/** Quanto girar a partir da diferença em cents (aproximado: depende da pele e do tambor). */
export function turnHint(cents) {
  const a = Math.abs(cents);
  if (a <= 8) return { dir: 0, text: 'afinado ✓' };
  const amt = a <= 30 ? '1/8 de volta' : a <= 80 ? '1/4 de volta' : a <= 200 ? '1/2 volta' : '1 volta';
  return { dir: cents < 0 ? 1 : -1, amt, text: `${cents < 0 ? '↑ aperta' : '↓ afrouxa'} ~${amt} em cada parafuso (em estrela)` };
}

/** Alvos sugeridos quando ainda não tem "afinação do meu kit" (faixa média de kit 10/12/14/16/22). */
export const SUGGEST = { caixa: 220, tom1: 165, tom2: 130, surdo: 92, bumbo: 58 };
export const LUGS = { caixa: 10, tom1: 6, tom2: 6, surdo: 8, bumbo: 10 };

/** Parafusos fora da média (comparando a nota perto de cada um): quem está grave aperta, quem está agudo afrouxa. */
export function evenness(perLug) {
  const vals = Object.values(perLug).filter((x) => x > 0);
  if (vals.length < 2) return {};
  const s = [...vals].sort((a, b) => a - b); const med = s[s.length >> 1];
  return Object.fromEntries(Object.entries(perLug).filter(([, f]) => f > 0).map(([lug, f]) => {
    const c = Math.round(1200 * Math.log2(f / med));
    return [lug, { cents: c, hint: Math.abs(c) <= 10 ? 'ok' : c < 0 ? 'aperta' : 'afrouxa' }];
  }));
}

export const STEPS = [
  ['soltar', 'solta os parafusos e encosta todos com o dedo, por igual'],
  ['baixo', 'pele de baixo: mesma volta em cada parafuso, na ordem da estrela'],
  ['cima', 'pele de cima: meia volta por parafuso, em estrela, até sumir as rugas'],
  ['fino', 'ajuste fino: bate no meio e segue a seta até o alvo'],
  ['igualar', 'igualar: bate perto de cada parafuso e acerta os que fugiram'],
];
