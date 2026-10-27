// Álbum de figurinhas: bateristas, guitarristas e vocalistas famosos. Frases curtas e seguras (nada de polêmica).
// A foto vem do Wikimedia Commons só quando a licença é livre (com crédito); sem foto livre aparece a inicial.
export const ROLES = { baterista: ['bateristas', '🥁'], guitarrista: ['guitarristas', '🎸'], vocalista: ['vocalistas', '🎤'] };
const c = (id, role, name, band, wiki, fact) => ({ id, role, name, band, wiki, fact });
export const CARDS = [
  c('john-bonham', 'baterista', 'John Bonham', 'Led Zeppelin', 'John_Bonham', 'tocava com muita força e deu ao Led Zeppelin um som de bateria enorme.'),
  c('dave-grohl', 'baterista', 'Dave Grohl', 'Nirvana · Foo Fighters', 'Dave_Grohl', 'foi baterista do Nirvana e depois criou o Foo Fighters, onde canta e toca guitarra.'),
  c('travis-barker', 'baterista', 'Travis Barker', 'Blink-182', 'Travis_Barker', 'toca rápido e mistura rock com hip hop na bateria.'),
  c('josh-dun', 'baterista', 'Josh Dun', 'twenty one pilots', 'Josh_Dun', 'faz shows cheios de energia, até tocando em cima da plateia.'),
  c('matt-helders', 'baterista', 'Matt Helders', 'Arctic Monkeys', 'Matt_Helders', 'o groove firme dele segura as músicas do Arctic Monkeys.'),
  c('eloy-casagrande', 'baterista', 'Eloy Casagrande', 'Sepultura · Slipknot', 'Eloy_Casagrande', 'baterista brasileiro que tocou no Sepultura e hoje toca no Slipknot.'),
  c('ringo-starr', 'baterista', 'Ringo Starr', 'The Beatles', 'Ringo_Starr', 'baterista dos Beatles: simples, musical e cheio de personalidade.'),
  c('phil-collins', 'baterista', 'Phil Collins', 'Genesis', 'Phil_Collins', 'tocava bateria e cantava, no Genesis e na carreira solo.'),
  c('neil-peart', 'baterista', 'Neil Peart', 'Rush', 'Neil_Peart', 'montava kits enormes e também escrevia as letras do Rush.'),
  c('sheila-e', 'baterista', 'Sheila E.', 'Prince e solo', 'Sheila_E.', 'baterista e percussionista que tocou com o Prince.'),
  c('karen-carpenter', 'baterista', 'Karen Carpenter', 'The Carpenters', 'Karen_Carpenter', 'cantava e tocava bateria ao mesmo tempo.'),
  c('nandi-bushell', 'baterista', 'Nandi Bushell', 'solo', 'Nandi_Bushell', 'baterista que ficou famosa na internet tocando ainda criança.'),
  c('vinnie-colaiuta', 'baterista', 'Vinnie Colaiuta', 'estúdio e turnês', 'Vinnie_Colaiuta', 'conhecido pela técnica e pelo tempo muito preciso.'),
  c('zac-farro', 'baterista', 'Zac Farro', 'Paramore', 'Zac_Farro', 'baterista do Paramore, também faz música com a banda HalfNoise.'),

  c('jimi-hendrix', 'guitarrista', 'Jimi Hendrix', 'solo', 'Jimi_Hendrix', 'inventou sons novos na guitarra, com efeitos e volume alto.'),
  c('eddie-van-halen', 'guitarrista', 'Eddie Van Halen', 'Van Halen', 'Eddie_Van_Halen', 'espalhou o "tapping": tocar com os dedos da mão direita no braço da guitarra.'),
  c('slash', 'guitarrista', 'Slash', "Guns N' Roses", 'Slash_(musician)', 'famoso pela cartola e pelos solos de guitarra.'),
  c('jimmy-page', 'guitarrista', 'Jimmy Page', 'Led Zeppelin', 'Jimmy_Page', 'criou muitos dos riffs do Led Zeppelin.'),
  c('john-mayer', 'guitarrista', 'John Mayer', 'solo', 'John_Mayer', 'guitarrista e cantor que mistura blues e pop.'),
  c('tim-henson', 'guitarrista', 'Tim Henson', 'Polyphia', 'Tim_Henson', 'mistura técnica rápida com música pop.'),
  c('angus-young', 'guitarrista', 'Angus Young', 'AC/DC', 'Angus_Young', 'toca de uniforme de colégio nos shows do AC/DC.'),
  c('kurt-cobain', 'guitarrista', 'Kurt Cobain', 'Nirvana', 'Kurt_Cobain', 'guitarrista e vocalista do Nirvana.'),
  c('tom-morello', 'guitarrista', 'Tom Morello', 'Rage Against the Machine', 'Tom_Morello', 'faz sons malucos na guitarra, quase como um DJ.'),
  c('rosetta-tharpe', 'guitarrista', 'Sister Rosetta Tharpe', 'solo', 'Sister_Rosetta_Tharpe', 'cantava e tocava guitarra elétrica nos anos 1930 e 40 e inspirou o rock.'),
  c('st-vincent', 'guitarrista', 'St. Vincent', 'solo', 'St._Vincent_(musician)', 'guitarrista e cantora que cria sons diferentes.'),
  c('nita-strauss', 'guitarrista', 'Nita Strauss', 'Alice Cooper e solo', 'Nita_Strauss', 'guitarrista que já tocou na banda do Alice Cooper.'),

  c('freddie-mercury', 'vocalista', 'Freddie Mercury', 'Queen', 'Freddie_Mercury', 'vocalista do Queen, com uma voz enorme e muito carisma.'),
  c('michael-jackson', 'vocalista', 'Michael Jackson', 'solo', 'Michael_Jackson', 'cantor e dançarino conhecido como o Rei do Pop.'),
  c('elis-regina', 'vocalista', 'Elis Regina', 'solo', 'Elis_Regina', 'uma das maiores cantoras do Brasil.'),
  c('tim-maia', 'vocalista', 'Tim Maia', 'solo', 'Tim_Maia', 'cantor brasileiro de soul e funk, de voz inconfundível.'),
  c('rita-lee', 'vocalista', 'Rita Lee', 'Os Mutantes · solo', 'Rita_Lee', 'cantora e compositora, chamada de rainha do rock brasileiro.'),
  c('amy-winehouse', 'vocalista', 'Amy Winehouse', 'solo', 'Amy_Winehouse', 'cantora de voz grave, cheia de jazz e soul.'),
  c('billie-eilish', 'vocalista', 'Billie Eilish', 'solo', 'Billie_Eilish', 'fez sucesso ainda adolescente cantando baixinho.'),
  c('taylor-swift', 'vocalista', 'Taylor Swift', 'solo', 'Taylor_Swift', 'cantora e compositora que escreve as próprias músicas.'),
  c('beyonce', 'vocalista', 'Beyoncé', 'solo', 'Beyoncé', 'cantora e dançarina de shows gigantes.'),
  c('bad-bunny', 'vocalista', 'Bad Bunny', 'solo', 'Bad_Bunny', 'cantor porto-riquenho que canta em espanhol e é um dos mais ouvidos do mundo.'),
  c('cassia-eller', 'vocalista', 'Cássia Eller', 'solo', 'Cássia_Eller', 'cantora brasileira de voz forte e muita atitude.'),
  c('chorao', 'vocalista', 'Chorão', 'Charlie Brown Jr.', 'Chorão', 'vocalista do Charlie Brown Jr., banda brasileira de rock e skate.'),
  c('whitney-houston', 'vocalista', 'Whitney Houston', 'solo', 'Whitney_Houston', 'uma das vozes mais potentes do pop.'),
  c('adele', 'vocalista', 'Adele', 'solo', 'Adele', 'cantora britânica de voz forte e músicas emocionantes.'),
];
export const byId = Object.fromEntries(CARDS.map((x) => [x.id, x]));
