// Nomes dos jogos de palavras na aba Jogos (caça-palavras, cruzadinha, quiz e duelo). Um lugar só pra trocar os nomes: [nome, frase curta].
export const LETRAS = {
  caca: ['Caça-Som', 'ache as palavras na grade'],
  cruzadinha: ['Cruza-Som', 'preencha as pistas'],
  quiz: ['Quiz Sonoro', 'completa e liga'],
  duelo: ['Duelo Sonoro', 'palavras em 2 celulares'],
};
export const nomeLetras = (k) => (LETRAS[k] || ['Letras'])[0];
