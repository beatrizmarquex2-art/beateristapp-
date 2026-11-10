// Curiosidades de músicos (aba Estudos, aberta pra todo mundo). [nome, o que toca, texto].
// Escritas de memória, com fatos bem conhecidos e palavras nossas: a Bea revisa antes de divulgar muito.
export const CURIOSIDADES = [
  ['Ringo Starr', 'bateria', 'o nome de verdade dele é Richard Starkey. “Ringo” vem dos anéis que ele usava, e “Starr” é uma versão curta do sobrenome. ele é canhoto, mas tocava numa bateria montada pra destro.'],
  ['Paul McCartney', 'baixo e voz', 'o Paul também é canhoto e toca o baixo invertido. ele contou que a melodia de “Yesterday” veio num sonho, e por um tempo ela se chamou “Scrambled Eggs”, ovos mexidos, até ganhar a letra.'],
  ['Stevie Wonder', 'piano, gaita e bateria', 'o Stevie é cego desde bebê e assinou com a Motown aos 11 anos. ele toca piano, gaita e bateria, e a bateria de “Superstition” é dele mesmo.'],
  ['Phil Collins', 'bateria e voz', 'o Phil Collins é um baterista que canta. antes da música ele foi ator infantil, e o grande momento de bateria de “In the Air Tonight” ficou famoso por entrar de repente depois de uma música calma.'],
  ['Dave Grohl', 'bateria e guitarra', 'o Dave Grohl foi baterista do Nirvana. depois fundou o Foo Fighters e gravou o primeiro disco sozinho, tocando quase todos os instrumentos.'],
  ['Karen Carpenter', 'bateria e voz', 'a Karen Carpenter começou na música como baterista e só depois virou uma das vozes mais lembradas dos anos 70. ela ensina que dá pra tocar e cantar ao mesmo tempo.'],
  ['Buddy Rich', 'bateria', 'o Buddy Rich foi criança prodígio e subia nos palcos de teatro ainda pequeno. ficou famoso pela velocidade das mãos e é até hoje referência de técnica na bateria.'],
  ['Neil Peart', 'bateria', 'o Neil Peart, da banda Rush, tocava com uma bateria enorme, cheia de tambores e pratos. além de baterista, ele escrevia as letras da banda.'],
  ['Sheila E.', 'bateria e percussão', 'a Sheila E. cresceu numa família de músicos e é percussionista e baterista. ficou muito conhecida tocando com o Prince.'],
  ['Evelyn Glennie', 'percussão', 'a Evelyn Glennie perdeu boa parte da audição quando era criança e virou percussionista famosa no mundo todo. ela costuma tocar descalça pra sentir as vibrações do som no corpo.'],
  ['Mozart', 'piano e composição', 'o Mozart começou a compor por volta dos 5 anos de idade. quando adulto, escreveu mais de 600 obras.'],
  ['Beethoven', 'piano e composição', 'o Beethoven foi perdendo a audição ao longo da vida, mas não parou de compor. a Nona Sinfonia, uma das mais famosas de todas, foi escrita quando ele já quase não ouvia.'],
  ['Jimi Hendrix', 'guitarra', 'o Jimi Hendrix era canhoto e tocava uma guitarra de destro virada de cabeça pra baixo, com as cordas na ordem invertida. foi assim que ele criou um som só dele.'],
  ['Prince', 'guitarra, teclado e bateria', 'no primeiro disco, o Prince gravou quase todos os instrumentos sozinho. ele tocava guitarra, teclado, baixo e bateria.'],
  ['Pixinguinha', 'flauta e saxofone', 'o Pixinguinha é um dos pais do choro, um dos gêneros mais antigos da música brasileira. ele tocava flauta e saxofone e fez arranjos que são estudados até hoje.'],
  ['Tony Williams', 'bateria', 'o Tony Williams entrou na banda do Miles Davis aos 17 anos. é um exemplo de que dá pra tocar com os grandes quando se estuda muito cedo.'],
];
const SEMENTE = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
export const curiosidadeDeHoje = (d = new Date(), n = CURIOSIDADES.length) => SEMENTE(d) % n;
