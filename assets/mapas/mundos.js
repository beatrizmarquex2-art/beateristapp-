const themes = [
  ['toca-1-geleira','Geleira das Semínimas','gelo','#8beaff','verde',72],
  ['toca-2-estudio','Estúdio das Semicolcheias','estudio','#bc9aff','vermelho',-54],
  ['toca-3-por-do-sol','Pôr do Sol das Síncopes','poente','#ffbb84','dourado',-15],
  ['detetive-1-espaco','Espaço do Pulso','espaco','#ffd16b','dourado',0],
  ['detetive-2-floresta','Floresta das Semicolcheias','floresta','#88ef8c','verde',0],
  ['detetive-3-vulcao','Vulcão das Pontuadas','vulcao','#ff8655','vermelho',22],
  ['figurix-1-floresta','Floresta das Semínimas','floresta','#c8ef88','verde',-24],
  ['figurix-2-deserto','Deserto das Pausas','deserto','#f1c87d','dourado',7],
  ['figurix-3-mar','Mar das Colcheias','mar','#7affeb','verde',46],
  ['figurix-4-espaco','Espaço das Semifusas','espaco','#d8adff','vermelho',-64],
  ['paulta-1-selva','Selva da Bateria','selva','#bdf177','verde',-10],
  ['paulta-2-deserto','Deserto das Colcheias','deserto','#ffb158','dourado',-5],
  ['paulta-3-vulcao','Vulcão das Semicolcheias','vulcao','#ff7d94','vermelho',-17],
  ['paulta-4-clave-de-sol','Mundo da Clave de Sol','sol','#ffd88b','dourado',-2],
  ['paulta-5-clave-de-fa','Mundo da Clave de Fá','fa','#9bc8ff','verde',98],
  ['paulta-6-duelo','Duelo das Claves','duelo','#c1a9ff','vermelho',-82],
  ['fuga-1-estudio','Estúdio dos Lasers','estudio','#ff6074','vermelho',0],
  ['fuga-2-vulcao','Vulcão das Portas de Pedra','vulcao','#fba75a','vermelho',32],
  ['fuga-3-espaco','Estação Espacial','espaco','#91baff','dourado',162],
  ['groove-eco-de-groove','Eco de Groove','gelo','#a9c6ff','verde',102],
  ['rudimentix','Rudimentix','vulcao','#ff995f','vermelho',16],
  ['escape-room','Escape Room · Laboratório do Paul','estudio','#ff6a54','vermelho',-6],
];

export const mundos = Object.fromEntries(themes.map(([id, nome, cenario, cor, aro, matiz]) =>
  [id, {nome, cenario, cor, aro, matiz}]));

function asset(file) {
  return new URL('./assets/' + file, import.meta.url).href;
}

// Chame após renderizar o mapa. O DOM do jogo continua responsável pelas fases.
export function aplicarTema(mapa, id, moldura) {
  const tema = mundos[id];
  if (!tema) throw new RangeError('Mundo desconhecido: ' + id);
  mapa.classList.add('beat-mapa');
  mapa.dataset.beatMundo = id;
  mapa.style.setProperty('--beat-cenario', 'url("' + asset(tema.cenario + '.webp') + '")');
  mapa.style.setProperty('--beat-cor', tema.cor);
  if (moldura) {
    moldura.classList.add('beat-moldura');
    moldura.dataset.aro = tema.aro;
    moldura.style.setProperty('--beat-aro', 'url("' + asset('aro-' + tema.aro + '.webp') + '")');
    moldura.style.setProperty('--beat-matiz', tema.matiz + 'deg');
  }
}
