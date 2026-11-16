// Os 24 acordes do violão: dó, ré, mi, fá, sol, lá e si (com os sustenidos), cada um maior e menor. Só isso (sem acordes com 7).
// Cada acorde guarda as casas de cada corda, da grave (mi) pra aguda (mi): número = casa, 0 = corda solta, -1 = não toca.
// Os 24 formatos são os de sempre: os abertos (dó, ré, mi, sol, lá, e os menores de ré, mi, lá) e os de pestana (mi e lá deslizados no braço).
export const ABERTAS = [40, 45, 50, 55, 59, 64]; // mi lá ré sol si mi
export const RAIZES = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
const MAIOR = [[-1, 3, 2, 0, 1, 0], [-1, 4, 6, 6, 6, 4], [-1, -1, 0, 2, 3, 2], [-1, 6, 8, 8, 8, 6], [0, 2, 2, 1, 0, 0], [1, 3, 3, 2, 1, 1],
  [2, 4, 4, 3, 2, 2], [3, 2, 0, 0, 0, 3], [4, 6, 6, 5, 4, 4], [-1, 0, 2, 2, 2, 0], [-1, 1, 3, 3, 3, 1], [-1, 2, 4, 4, 4, 2]];
const MENOR = [[-1, 3, 5, 5, 4, 3], [-1, 4, 6, 6, 5, 4], [-1, -1, 0, 2, 3, 1], [-1, 6, 8, 8, 7, 6], [0, 2, 2, 0, 0, 0], [1, 3, 3, 1, 1, 1],
  [2, 4, 4, 2, 2, 2], [3, 5, 5, 3, 3, 3], [4, 6, 6, 4, 4, 4], [-1, 0, 2, 2, 1, 0], [-1, 1, 3, 3, 2, 1], [-1, 2, 4, 4, 3, 2]];
const monta = (pc, tipo, casas) => ({ id: `${pc}${tipo === 'maior' ? 'M' : 'm'}`, pc, nome: RAIZES[pc], tipo, casas, notas: casas.map((c, i) => (c < 0 ? null : ABERTAS[i] + c)) });
export const ACORDES = RAIZES.flatMap((_, pc) => [monta(pc, 'maior', MAIOR[pc]), monta(pc, 'menor', MENOR[pc])]);
export const acharAcorde = (id) => ACORDES.find((a) => a.id === id);
/** Os 8 de cima quando a pessoa ainda não trocou nenhum: dó, sol, lá menor, fá, ré, mi menor, lá e mi. */
export const PADRAO = ['0M', '7M', '9m', '5M', '2M', '4m', '9M', '4M'];
/** Desenho de onde apertar (SVG): 6 cordas na vertical (grave à esquerda), 4 casas; bolinha = dedo, ○ = corda solta, × = não toca. */
export function diagramaSVG(a) {
  const pos = a.casas.filter((c) => c > 0); const max = Math.max(0, ...pos); const min = pos.length ? Math.min(...pos) : 1; const base = max <= 4 ? 1 : min;
  const X = (i) => 9 + i * 8.4; let s = '<svg viewBox="0 0 60 54" aria-hidden="true" focusable="false">';
  for (let i = 0; i < 6; i++) s += `<line x1="${X(i)}" y1="11" x2="${X(i)}" y2="51" stroke="currentColor" stroke-width="1.1"/>`;
  for (let j = 0; j < 5; j++) s += `<line x1="${X(0) - 1}" y1="${11 + j * 10}" x2="${X(5) + 1}" y2="${11 + j * 10}" stroke="currentColor" stroke-width="${j === 0 && base === 1 ? 3 : 1}"/>`;
  a.casas.forEach((c, i) => {
    if (c < 0) s += `<text x="${X(i)}" y="8.5" font-size="8" text-anchor="middle" fill="currentColor" font-family="system-ui,sans-serif" font-weight="700">×</text>`;
    else if (c === 0) s += `<circle cx="${X(i)}" cy="6" r="2.3" fill="none" stroke="currentColor" stroke-width="1.1"/>`;
    else s += `<circle class="dedo" cx="${X(i)}" cy="${11 + (c - base + 0.5) * 10}" r="3.7"/>`;
  });
  if (base > 1) s += `<text x="1" y="21" font-size="7.5" fill="currentColor" font-family="system-ui,sans-serif" font-weight="800">${base}ª</text>`;
  return `${s}</svg>`;
}
