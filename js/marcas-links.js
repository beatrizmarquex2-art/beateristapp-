// Para onde cada logotipo leva quando alguém toca nele. Deixe '' enquanto não tiver o material: o logo fica só desenhado.
// Regras da Bea (17/nov/2026): Beaterista → o site dela · Nagano → uma PÁGINA dentro do app sobre a parceria, com ela no evento TDT · Spark → um VÍDEO/destaque dela tocando cajón (link do Instagram).
export const TDT_LINK = 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MTI2NjU3NjczNjg2MTMz?obrf=MTRvMnQwMjhqcjJyZQ=='; // link (vídeo/fotos) da Bea no evento TDT: a Bea vai mandar. Preenchido, o logo da Nagano passa a abrir a página.
export const SPARK_VIDEO = 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MTEzMDY5NzYxODgxNTAz?vrfl=MTh2dDBnNTczeWpqeQ=='; // link do YouTube da Bea tocando com o cajón Spark: a Bea vai mandar. Preenchido, o logo da Spark passa a abrir o vídeo.
export const MARCAS = {
  beaterista: 'https://beaterista.com.br',
  nagano: TDT_LINK ? '#/nagano' : '',
  spark: SPARK_VIDEO,
};
// Quebra-cabeça "Nagano Drums & Beaterista": ao montar, aparece um link pra visita da Bea na fábrica da Nagano (reel do Instagram que a Bea mandou, 17/nov/2026).
export const NAGANO_FABRICA = 'https://www.instagram.com/reel/DbRtnCuJjGX/';
