// Nomes dos jogos de palavras na aba Jogos (caça-palavras, cruzadinha e quiz; o duelo de 2 celulares é um modo dentro de cada um). Um lugar só pra trocar os nomes: [nome, frase curta].
export const LETRAS = {
  caca: ['Caça-Som', 'ache as palavras na grade'],
  cruzadinha: ['Cruza-Som', 'preencha as pistas'],
  quiz: ['Quiz Sonoro', 'completa e liga'],
};
export const nomeLetras = (k) => (LETRAS[k] || ['Letras'])[0];
