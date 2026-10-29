// Dados do cara a cara: instrumentos e atributos (toda resposta vem desta tabela; nenhuma IA).
// "cordas" = como o som é produzido; "teclas" = como se toca. São atributos diferentes. Valores "nesta representação" valem para o desenho do pacote.
export const INSTRUMENTS = [
  { id: 'violao', name: 'violão', img: 'violao', attrs: ['cordas', 'portatil'] },
  { id: 'guitarra', name: 'guitarra', img: 'guitarra', attrs: ['cordas', 'eletrico', 'portatil'] },
  { id: 'baixo', name: 'baixo', img: 'baixo', attrs: ['cordas', 'eletrico', 'portatil'] },
  { id: 'teclado', name: 'teclado', img: 'teclado', attrs: ['teclas', 'eletrico'] },
  { id: 'trompete', name: 'trompete', img: 'trompete', attrs: ['sopro', 'metais', 'valvulas'] },
  { id: 'saxofone', name: 'saxofone', img: 'saxofone', attrs: ['sopro', 'madeiras', 'palheta', 'chaves'] },
  { id: 'flauta', name: 'flauta transversal', img: 'flauta', attrs: ['sopro', 'madeiras', 'chaves'] },
  { id: 'violino', name: 'violino', img: 'violino', attrs: ['cordas', 'arco', 'portatil'] },
  { id: 'bateria', name: 'bateria', img: 'bateria', attrs: ['percussao', 'conjunto', 'pele', 'baquetas'] },
  { id: 'pandeiro', name: 'pandeiro', img: 'pandeiro', attrs: ['percussao', 'pele', 'platinelas', 'maos'] },
  { id: 'triangulo', name: 'triângulo', img: 'triangulo', attrs: ['percussao', 'metal', 'batedor'] },
  { id: 'acordeao', name: 'acordeão', img: 'acordeao', attrs: ['teclas', 'fole', 'palheta'] },
];
export const BY_ID = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i]));

/** Perguntas curadas: cada uma testa um atributo; "why" explica a resposta ao jogador. */
export const QUESTIONS = [
  { id: 'cordas', text: 'tem cordas?', why: 'o som vem de cordas que vibram.' },
  { id: 'teclas', text: 'é tocado com teclas?', why: 'teclas são a forma de tocar: o teclado e o acordeão usam.' },
  { id: 'sopro', text: 'é soprado pela boca?', why: 'instrumentos de sopro precisam do ar da boca.' },
  { id: 'percussao', text: 'é da percussão?', why: 'percussão é o que se bate, se chacoalha ou se raspa.' },
  { id: 'eletrico', text: 'é elétrico nesta imagem?', why: 'os elétricos precisam de energia ou amplificador, como no desenho.' },
  { id: 'arco', text: 'usa arco?', why: 'o arco roça as cordas; é a técnica usual do violino.' },
  { id: 'pele', text: 'tem pele (couro ou plástico esticado)?', why: 'a pele é a superfície que se bate nos tambores.' },
  { id: 'fole', text: 'tem fole?', why: 'o fole é a sanfona dobrável que empurra o ar.' },
  { id: 'conjunto', text: 'é um conjunto de tambores e pratos?', why: 'vários tambores e pratos juntos formam uma bateria.' },
  { id: 'palheta', text: 'tem palheta?', why: 'palheta é uma lâmina fina que vibra; o saxofone tem uma, o acordeão tem palhetas livres.' },
  { id: 'madeiras', text: 'é da família das madeiras?', why: '“madeiras” é uma família de instrumentos de sopro (mesmo que o corpo seja de metal, como no saxofone e na flauta).' },
  { id: 'metais', text: 'é da família dos metais?', why: '“metais” é a família de sopro de bocal, como o trompete.' },
  { id: 'valvulas', text: 'tem válvulas?', why: 'as válvulas mudam o caminho do ar no trompete.' },
  { id: 'chaves', text: 'tem chaves (botões de metal que tampam furos)?', why: 'saxofone e flauta usam chaves.' },
  { id: 'baqueta', text: 'é tocado principalmente com baquetas ou batedor?', why: 'a bateria usa baquetas e o triângulo usa um batedor.' },
];
export const answerFor = (inst, qid) => {
  if (qid === 'baqueta') return inst.attrs.includes('baquetas') || inst.attrs.includes('batedor');
  return inst.attrs.includes(qid);
};
