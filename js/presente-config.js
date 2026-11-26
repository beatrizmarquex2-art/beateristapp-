// Presente do Paul: opções do formulário e os brindes por faixa de idade.
// ===== PRA LIGAR O PRESENTE: ponha os arquivos (PDF ou imagem) em assets/presente/ e liste aqui. Sem nenhum arquivo, o cartão NÃO aparece pra ninguém. =====
export const FAIXAS = [['4-12', '4 a 12 anos'], ['13-17', '13 a 17 anos'], ['18-29', '18 a 29 anos'], ['30+', '30 anos ou mais']];
export const INSTRUMENTOS = [['bateria', 'Bateria'], ['guitarra', 'Guitarra'], ['teclado', 'Teclado'], ['violao', 'Violão'], ['outro', 'Outro']];
export const ICONE_INSTRUMENTO = { bateria: '🥁', guitarra: '🎸', teclado: '🎹', violao: '🪕', outro: '✨' };
/** Os presentes que a pessoa pode ESCOLHER (1 deles). `arquivos`: [{ nome, arquivo, faixas? }]. `faixas` (opcional) = só pra essas idades (ex.: ['4-12']);
 *  sem `faixas`, vale pra todo mundo. Um presente sem nenhum arquivo não aparece na escolha. */
export const PRESENTES = {
  planner: { titulo: 'Planner de estudo', icone: '🗓️', desc: 'organize seus estudos de música', arquivos: [] },
  wallpaper: { titulo: 'Wallpaper', icone: '📱', desc: 'o Paul no fundo da tela do seu celular', arquivos: [] },
  colorir: { titulo: 'Para colorir', icone: '🎨', desc: 'desenhos do Paul pra você colorir', arquivos: [] },
};
