// Nomes dos jogos de palavras na aba Jogos (caça-palavras, cruzadinha e quiz; o duelo de 2 celulares é um modo dentro de cada um). Um lugar só pra trocar os nomes: [nome, frase curta].
export const LETRAS = {
  caca: ['Radar Musical', 'ache as palavras na grade'],
  cruzadinha: ['Cruzadinha', 'preencha as pistas'],
  quiz: ['Quiz do Paul', 'completa e liga'],
};
export const nomeLetras = (k) => (LETRAS[k] || ['Letras'])[0];
