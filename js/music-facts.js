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
  // Beatles
  ['você sabia?', 'em 30 de janeiro de 1969, os Beatles tocaram no telhado da Apple, em Londres. foi o último show deles ao vivo, e a polícia mandou parar.'],
  ['a canção diz', '“Hey Jude” (Beatles) = “ei, Jude”. o Paul escreveu pra consolar o filho do John durante a separação dos pais. tem mais de 7 minutos e o final repete o refrão sem pressa.'],
  ['você sabia?', 'em “Eleanor Rigby” (Beatles) nenhum Beatle toca instrumento: é só voz e um octeto de cordas. no auge da banda, eles ousaram fazer isso.'],
  ['você sabia?', '“Yesterday” (Beatles) foi gravada só com o Paul no violão e um quarteto de cordas. os outros três nem tocaram.'],
  ['você sabia?', 'na versão do single de “Love Me Do” quem toca bateria é o Andy White, e o Ringo fica no pandeiro. no álbum, aí sim é o Ringo na bateria.'],
  ['a canção diz', '“Octopus’s Garden” (Beatles) = “o jardim do polvo”. o Ringo escreveu depois de ouvir que polvos juntam pedrinhas e conchas no fundo do mar pra fazer um cantinho.'],
  ['você sabia?', '“Strawberry Fields Forever” (Beatles) juntou duas gravações em andamentos e tons diferentes. o produtor George Martin acelerou uma e desacelerou a outra pra casarem.'],
  ['você sabia?', 'o Ringo afinava os tambores mais graves e abafava com panos. por isso a bateria dos Beatles tem aquele som seco e quentinho.'],
  ['a canção diz', '“Blackbird” (Beatles) = “melro”. o Paul contou que escreveu pensando na luta por direitos civis nos Estados Unidos: o pássaro é uma metáfora pra quem aprende a voar.'],
  ['a canção diz', '“Come Together” (Beatles) = “venham juntos”. nasceu de um slogan de campanha do Timothy Leary, que ia concorrer a governador da Califórnia.'],
  ['você sabia?', 'o fill de bateria de “A Day in the Life” (Beatles), na volta do refrão, é o do Ringo. quem sabe tocar ele inteiro merece aplausos.'],
  // blink-182
  ['você sabia?', 'o Travis Barker entrou no blink-182 em 1998 e gravou seu primeiro disco com a banda, o “Enema of the State”, em 1999. foi aí que o som deles explodiu.'],
  ['você sabia?', 'o nome “blink” foi complementado com “182” depois que uma banda irlandesa de mesmo nome ameaçou processar. o número não quer dizer nada de especial.'],
  ['a canção diz', '“All the Small Things” (blink-182) = “todas as pequenas coisas”. é um pop punk de 2 minutos e meio, com bateria rápida e refrão grudento.'],
  ['a canção diz', '“What’s My Age Again?” (blink-182) = “qual é a minha idade de novo?”. é uma brincadeira com quem não quer crescer, e o clipe tem os três correndo pelado numa rua de Los Angeles.'],
  ['a canção diz', '“I Miss You” (blink-182) = “sinto sua falta”. foge do punk acelerado: clima sombrio e um groove de bateria mais lento e marcado.'],
  ['a canção diz', '“Adam’s Song” (blink-182) = “a canção do Adam”. fala de um dia muito pesado, mas termina com esperança.'],
  ['você sabia?', 'o Travis Barker mistura a velocidade do punk com a pegada do hip-hop e do drum’n’bass. por isso as viradas dele têm um groove próprio.'],
  ['você sabia?', 'em 2008 o Travis Barker sobreviveu a um acidente de avião e voltou a tocar depois de muitos meses. a bateria foi parte da recuperação.'],
  // John Mayer
  ['você sabia?', 'o John Mayer estudou um tempo no Berklee College of Music, mas largou depois de dois semestres pra tentar a música por conta própria.'],
  ['a canção diz', '“Waiting on the World to Change” (John Mayer) = “esperando o mundo mudar”. fala da sensação de geração que sente que não tem como mudar as coisas.'],
  ['você sabia?', 'o Steve Jordan, baterista do John Mayer Trio, também produziu o disco “Continuum” e foi chamado pelos Rolling Stones depois da morte do Charlie Watts. o jeito dele de tocar é puro “pocket”.'],
  ['você sabia?', '“pocket” é quando a bateria fica tão encaixada no tempo que o groove parece “sentar”. o Steve Jordan, que toca com o John Mayer, é referência nisso.'],
  ['você sabia?', '“Neon” (John Mayer) é tocada só no violão: ele faz baixo, harmonia e melodia ao mesmo tempo, com o polegar e os dedos. dá pra imaginar uma banda inteira ali.'],
  ['a canção diz', '“Your Body Is a Wonderland” (John Mayer) = “seu corpo é um país das maravilhas”. rendeu a ele um Grammy de melhor performance vocal pop masculina.'],
  ['você sabia?', 'no disco “Try!” (John Mayer Trio, 2005) a banda é só guitarra, baixo e bateria. com pouca coisa, a bateria precisa preencher muito espaço.'],
  // Justin Bieber
  ['você sabia?', 'o Justin Bieber foi descoberto no YouTube em 2008, quando o Scooter Braun viu vídeos de covers que a mãe dele postava.'],
  ['você sabia?', 'o Justin Bieber toca bateria, piano, guitarra e trompete. quando criança, ele tocava na rua em Stratford, no Canadá, pra juntar dinheiro.'],
  ['a canção diz', '“Love Yourself” (Justin Bieber) = “se ame”. é uma indireta pra uma ex, com violão, uma batida bem leve e muito espaço entre as notas. foi coescrita pelo Ed Sheeran.'],
  ['a canção diz', '“Sorry” (Justin Bieber) = “desculpa”. a batida é de pegada tropical, quase dancehall, e o clima é de quem quer reatar.'],
  ['você sabia?', 'em “Where Are Ü Now” (Skrillex, Diplo e Justin Bieber) a voz foi picotada e processada até virar um instrumento. é a “voz como synth”.'],
  ['você sabia?', 'o clipe de “Baby” (Justin Bieber, 2010) foi por um tempo o mais visto da história do YouTube, até ser passado por “Gangnam Style”.'],
  // Arctic Monkeys
  ['você sabia?', 'o primeiro disco do Arctic Monkeys, de 2006, foi o álbum de estreia que mais vendeu na primeira semana na história do Reino Unido até então.'],
  ['a canção diz', '“Mardy Bum” (Arctic Monkeys) = “bunda emburrada”. “mardy” é gíria de Yorkshire pra quem tá de mau humor. é uma música sobre uma briga de casal.'],
  ['a canção diz', '“505” (Arctic Monkeys): é o número de um quarto de hotel onde o personagem espera alguém. começa lenta e vai crescendo até a bateria entrar com tudo.'],
  ['você sabia?', 'o disco “AM” (Arctic Monkeys, 2013) mistura riff pesado de rock com batida de hip-hop. a bateria do Matt Helders segura essa ponte.'],
  ['você sabia?', 'o Matt Helders canta backing vocal enquanto toca bateria, e em “Brick by Brick” ele é o vocalista. é difícil cantar e manter o groove ao mesmo tempo.'],
  ['a canção diz', '“I Bet You Look Good on the Dancefloor” (Arctic Monkeys) = “aposto que você fica bem na pista de dança”. foi o primeiro single deles e chegou ao 1º lugar no Reino Unido.'],
  ['você sabia?', 'o Arctic Monkeys nasceu em Sheffield, na Inglaterra, em 2002. no começo, as músicas deles circulavam em CDs gravados que os fãs copiavam e passavam adiante.'],
];

/** O bilhete de hoje (muda à meia-noite) ou o próximo da lista. */
export function factFor(day, offset = 0) {
  const n = Math.floor(Date.parse(`${day}T12:00:00Z`) / 864e5);
  return FACTS[(((n + offset) % FACTS.length) + FACTS.length) % FACTS.length];
}

const FAVS = /beatles|blink|mayer|bieber|arctic|helders|travis barker|ringo|steve jordan/i;
const STATE_KEY = 'bt-fact-state';
/** Bilhete do dia sem repetir: guarda no aparelho quais já saíram e só recomeça quando acabam todas. As bandas favoritas da Bea têm o dobro de chance. */
export function factPicker(day, rnd = Math.random) {
  let st = null;
  try { st = JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch (e) { st = null; }
  if (!st || !Array.isArray(st.seen)) st = { day: '', cur: -1, seen: [] };
  const save = () => { try { localStorage.setItem(STATE_KEY, JSON.stringify(st)); } catch (e) { /* sem armazenamento */ } };
  const pick = () => {
    const free = () => FACTS.map((_, i) => i).filter((i) => !st.seen.includes(i));
    let pool = free();
    if (!pool.length) { st.seen = st.cur >= 0 ? [st.cur] : []; pool = free(); }
    const weighted = pool.flatMap((i) => (FAVS.test(FACTS[i][1]) ? [i, i] : [i]));
    st.cur = weighted[Math.floor(rnd() * weighted.length)];
    st.seen.push(st.cur); st.day = day; save();
  };
  if (st.day !== day || st.cur < 0 || st.cur >= FACTS.length) pick();
  return { current: () => FACTS[st.cur], next: () => { pick(); return FACTS[st.cur]; } };
}
