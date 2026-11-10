// Dicas musicais do dia (abertas pra todo mundo): sempre sobre tocar, ouvir, contar ou estudar música.
// As dicas do MÉTODO da Bea (só com código) vêm do Supabase e ficam em outro lugar.
export const DICAS_MUSICAIS = [
  ['bateria', 'comece o treino pelo exercício mais difícil da música, quando o foco está inteiro. deixe o que você já domina pro final.'],
  ['bateria', 'errou a virada? volte dois compassos e repita certo. o cérebro grava o que você repete, então repita o certo.'],
  ['ritmo', 'cante a levada com a boca antes de tocar: tum, tá, tum tum, tá. se você consegue cantar, suas mãos aprendem mais rápido.'],
  ['ritmo', 'conte as pausas com o mesmo cuidado das notas. o silêncio entre as notas também é música.'],
  ['estudo', 'não faça um exercício só por 30 minutos. troque a cada 5 ou 10 minutos e volte depois: o cérebro aprende mais quando precisa se readaptar.'],
  ['estudo', 'escolha uma meta pequena por dia, tipo "a virada do refrão". treino com meta pequena rende mais que treino solto.'],
  ['estudo', 'estude a música à noite e depois durma: é dormindo que o cérebro guarda o que você tocou. de manhã, a música já está mais firme.'],
  ['metrônomo', 'liga o metrônomo bem devagar. primeiro certo, depois rápido, nunca ao contrário.'],
  ['metrônomo', 'quando o ritmo ficar fácil, tire o clique de alguns tempos: o metrônomo só toca no 1 e você segura o resto sozinho.'],
  ['mente', 'antes de tocar, feche os olhos e imagine a música inteira, mãos e pés. quem ensaia na mente chega mais seguro no instrumento.'],
  ['mente', 'acertou o que errava ontem? comemore! a alegria do pequeno avanço faz o cérebro querer voltar amanhã.'],
  ['palco', 'respire fundo antes de começar a música e solte o ar com calma. ombros baixos, pulso firme e menos nervosismo no palco.'],
  ['bateria', 'a consistência no bumbo vale mais que o volume. toque todas as batidas do mesmo tamanho, como um relógio.'],
  ['bateria', 'o controle da caixa vale mais que a força. toque no meio, deixe a baqueta quicar e procure as notas fantasma.'],
  ['bateria', 'treine coordenação fora da bateria, sentado: bata as mãos nas pernas. dá pra estudar a levada em qualquer lugar.'],
  ['ouvido', 'ouça a música três vezes prestando atenção em um instrumento de cada vez: primeiro a bateria, depois o baixo, depois a voz.'],
  ['ouvido', 'respeite a forma original da música antes de criar variações. assim, se bater insegurança numa virada, você tem o original como base firme.'],
  ['teclado', 'toque a escala de dó bem devagar, nota por nota, escutando o som de cada tecla. a qualidade do som vale mais que a velocidade.'],
  ['violão', 'segure o acorde e toque uma corda de cada vez: se alguma estiver abafada, ajuste o dedo antes de seguir pro próximo acorde.'],
  ['estudo', 'filme um trecho seu tocando e assista sem som, só olhando as mãos. você vai ver tensão que o ouvido não pega.'],
  ['estudo', 'treino curto e todo dia ganha de treino longo uma vez por semana. 10 minutos de música hoje já contam.'],
];
const SEMENTE = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
/** Índice da dica de hoje (muda todo dia, igual pra todo mundo). */
export const dicaDeHoje = (d = new Date(), n = DICAS_MUSICAIS.length) => SEMENTE(d) % n;
