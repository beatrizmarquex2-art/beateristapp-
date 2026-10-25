// Bilhete do início: uma curiosidade de música ou o sentido de uma canção por dia (toque para ver outra).
// Canções: título traduzido + do que ela fala, com palavras nossas (nada de copiar letra).
export const FACTS = [
  ['você sabia?', 'o break de “Amen, Brother” (The Winstons, 1969) virou um dos trechos de bateria mais sampleados da história: tá no jungle, no drum’n’bass e no hip-hop.'],
  ['a canção diz', '“Stand By Me” (Ben E. King) = “fica do meu lado”. é sobre ter alguém junto mesmo se o mundo desabar.'],
  ['você sabia?', 'o “M.M.” que aparece no andamento das partituras é de “Metrônomo de Maelzel”, que patenteou o aparelho em 1815.'],
  ['a canção diz', '“Let It Be” (Beatles) = “deixa estar”. Paul contou que a ideia veio de um sonho com a mãe dele, Mary, que tinha morrido quando ele era adolescente.'],
  ['você sabia?', 'a Percussive Arts Society organiza 40 rudimentos internacionais. o paradiddle tem esse nome pelo som: pa-ra-di-ddle, D E D D · E D E E.'],
  ['a canção diz', '“Here Comes the Sun” (George Harrison) = “lá vem o sol”. ele escreveu no jardim de um amigo, fugindo de um dia de reuniões chatas da banda.'],
  ['você sabia?', 'o cajón nasceu no Peru, com a comunidade afro-peruana. o Paco de Lucía levou ele pro flamenco no fim dos anos 70 e aí ele rodou o mundo.'],
  ['a canção diz', '“Take Five” (Dave Brubeck Quartet, 1959) = “dá uma pausa de cinco”. a piada é que ela é em 5/4, e o Joe Morello segura tudo na bateria.'],
  ['você sabia?', 'a bateria de “When the Levee Breaks” (Led Zeppelin) foi gravada no vão de uma escada de pedra numa casa antiga. o eco gigante vem da sala, não de efeito.'],
  ['a canção diz', '“Stressed Out” (Twenty One Pilots) = “estressado”. é saudade de quando a gente era criança e não tinha boleto pra pagar.'],
  ['você sabia?', '“andante” quer dizer “andando” em italiano: é o andamento de quem caminha tranquilo. “allegro” quer dizer “alegre”.'],
  ['a canção diz', '“Seven Nation Army” (White Stripes) = “exército de sete nações”. o Jack White chamava assim o Exército da Salvação quando era criança.'],
  ['você sabia?', 'o chimbal surgiu nos anos 1920, de uns pratos baixinhos tocados com o pé. depois subiram de altura pra dar pra tocar com a baqueta também.'],
  ['a canção diz', '“Do I Wanna Know?” (Arctic Monkeys) = “eu quero mesmo saber?”. a dúvida de quem não sabe se o sentimento é recíproco. o Matt Helders segura o groove lento.'],
  ['você sabia?', 'notas fantasma (ghost notes) são toques bem fraquinhos na caixa entre as notas fortes. quase não se ouve, mas é o que dá o “molho” do groove.'],
  ['a canção diz', '“Imagine” (John Lennon) = “imagine”. ele pede pra gente imaginar um mundo sem fronteiras, sem guerras e sem posses.'],
  ['você sabia?', 'a afinação de referência mais usada hoje é o lá a 440 Hz. é ele que a gente ouve no diapasão.'],
  ['a canção diz', '“Smells Like Teen Spirit” (Nirvana): o título saiu de uma pichação de amiga. Teen Spirit era uma marca de desodorante, e o Kurt Cobain não sabia.'],
  ['você sabia?', 'o Ringo Starr é canhoto, mas tocava numa bateria montada pra destro. por isso as viradas dele soam tão diferentes.'],
  ['a canção diz', '“Don’t Stop Me Now” (Queen) = “não me para agora”. é aquela euforia de quem tá vivendo o melhor momento e não quer frear.'],
  ['você sabia?', 'no samba, o surdo de primeira marca o tempo forte, que cai no 2. por isso o samba “puxa” o corpo pra frente.'],
  ['a canção diz', '“All You Need Is Love” (Beatles) = “tudo o que você precisa é amor”. e tem uma pegadinha: partes do verso são em 7/4.'],
  ['você sabia?', '“Funky Drummer” (James Brown, 1970) tem um break do Clyde Stubblefield que virou base de centenas de músicas de hip-hop.'],
  ['a canção diz', '“Come As You Are” (Nirvana) = “vem do jeito que você é”. um convite sem máscara nem pose.'],
  ['você sabia?', 'misturar exercícios no mesmo treino (em vez de repetir um só por meia hora) parece mais difícil na hora, mas fixa mais. tem texto sobre isso no Meus Estudos.'],
  ['a canção diz', '“Money” (Pink Floyd) = “dinheiro”. é uma crítica à ganância, e quase toda em 7/4, com o barulho de caixa registradora marcando o ritmo.'],
  ['você sabia?', 'o primeiro nome da bateria em inglês era “trap set”, de “contraption”: uma geringonça pra uma pessoa só tocar vários instrumentos.'],
  ['a canção diz', '“Believer” (Imagine Dragons) = “alguém que acredita”. é sobre transformar a dor em força.'],
  ['você sabia?', 'a clave cubana tem dois lados: 3-2 e 2-3. o lado em que ela começa muda o jeito de encaixar o resto da banda.'],
  ['você sabia?', 'muita gente bate o pé de um jeito natural perto de 100 a 120 BPM. por isso tanta música dançante fica nessa faixa.'],
];

/** O bilhete de hoje (muda à meia-noite) ou o próximo da lista. */
export function factFor(day, offset = 0) {
  const n = Math.floor(Date.parse(`${day}T12:00:00Z`) / 864e5);
  return FACTS[(((n + offset) % FACTS.length) + FACTS.length) % FACTS.length];
}
