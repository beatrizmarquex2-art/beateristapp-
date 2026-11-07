// Depoimentos e vídeos dos alunos (aba dentro da Lojinha). Pra acrescentar vídeo: colocar assets/alunos/vNN.mp4 + pNN.webp (capa) e uma linha aqui.
// IMPORTANTE: só publicar vídeo de aluno com autorização (dele ou do responsável).
export const DEPOIMENTOS = [
  { txt: 'amei a didática, é bem mais fácil de entender, amei que também tem uma parte que explica partitura, estou bem empolgada para continuar', de: 'aluna do Bateria Start' },
  { txt: 'está muito legal!! agora é treinar! amei a estrutura!', de: 'aluna do Bateria Start' },
  { txt: 'achei bem objetivas mesmo as aulas. não estão cansativas, e dá pra entender bem. tô gostando bastante', de: 'aluna do Bateria Start' },
  { txt: 'tô gostando pra caramba! seu método é simplificado e direto, de um jeito que não tem como não entender', de: 'aluno do Bateria Start' },
  { txt: 'era um sonho que eu tenho desde criança, mas não tinha condições de comprar uma bateria nem de fazer um curso. mas hoje eu estou realizando esse sonho', de: 'aluna do Bateria Start' },
  { txt: 'eu amo demais tocar. e com o teu curso junto tenho certeza que ficarei mais confiante', de: 'aluna do Bateria Start' },
];
export const DEPOIMENTOS_VIDEO = [1, 2, 3, 4].map((n) => ({ n, titulo: 'aluna do treinamento' }));
export const TOCANDO = [5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ n, titulo: '' }));
export const vid = (n) => `assets/alunos/v${String(n).padStart(2, '0')}.mp4`;
export const capa = (n) => `assets/alunos/p${String(n).padStart(2, '0')}.webp`;
