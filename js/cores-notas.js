// Cores das notas (a partitura colorida da Bea): dó vermelho, ré laranja, mi amarelo, fá verde, sol azul-claro, lá azul-escuro, si rosa.
// Um lugar só pra paleta: o xilofone e o violão usam este arquivo. Notas com sustenido (♯) ficam num cinza-escuro, sem cor de nota.
export const COR_NOTA = { 0: '#e0262f', 2: '#f28c1e', 4: '#f6d11e', 5: '#3fae5a', 7: '#5ec1ee', 9: '#2a4aa8', 11: '#f06fae' };
export const COR_SUST = '#6b6558';
const CLARAS = new Set([4, 7, 11]); // amarelo, azul-claro e rosa: letra escura pra ler bem
export const corNota = (m) => COR_NOTA[((m % 12) + 12) % 12] || COR_SUST;
export const notaClara = (m) => CLARAS.has(((m % 12) + 12) % 12);
