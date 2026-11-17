// Para onde cada logotipo leva quando alguém toca nele. Deixe '' enquanto não tiver o material: o logo fica só desenhado.
// Regras da Bea (17/nov/2026): Beaterista → o site dela · Nagano → uma PÁGINA dentro do app sobre a parceria, com ela no evento TDT · Spark → um VÍDEO dela tocando cajón no YouTube.
export const TDT_LINK = ''; // link (vídeo/fotos) da Bea no evento TDT: a Bea vai mandar. Preenchido, o logo da Nagano passa a abrir a página.
export const SPARK_VIDEO = ''; // link do YouTube da Bea tocando com o cajón Spark: a Bea vai mandar. Preenchido, o logo da Spark passa a abrir o vídeo.
export const MARCAS = {
  beaterista: 'https://beaterista.com.br',
  nagano: TDT_LINK ? '#/nagano' : '',
  spark: SPARK_VIDEO,
};
