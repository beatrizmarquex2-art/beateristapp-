// Mundos dos mapas de aventura: um por jogo, todos no mesmo estilo (vinil + pixel art), mas cada um com cenário, cores e enfeites próprios.
// `c` = cores da região [céu de cima, céu de baixo, borda, pontinhos]. `decor` = [sprite, lado (l/r), posição 0..1 dentro da região].
const R = (id, name, sub, c, decor) => ({ id, name, sub, c, decor });
export const THEMES = {
  cartas: { id: 'cartas', name: 'Cidade Arcade de Cartas', accent: '#ff4fa3', regions: [
    R('praca', 'Praça das Cartas', 'onde o baralho nasce', ['#2c1a56', '#3a1f6b', '#ff4fa3', '#8e6bd1'], [['card', 'l', 0.25], ['lamp', 'r', 0.5], ['card', 'r', 0.8]]),
    R('fliper', 'Rua do Fliperama', 'luzes e fichas', ['#3a1f6b', '#5a1a47', '#ffd23f', '#ff4fa3'], [['amp', 'l', 0.3], ['card', 'r', 0.55], ['star', 'l', 0.85]]),
    R('mesa', 'Mesa Neon', 'o jogo esquenta', ['#1b2f6a', '#2a1b5c', '#4fd2ff', '#4fd2ff'], [['card', 'r', 0.25], ['heart', 'l', 0.55], ['lamp', 'r', 0.85]]),
    R('torre', 'Torre do Baralho', 'a partida final', ['#5a1a47', '#8e1f4a', '#ffd23f', '#ffd23f'], [['trophy', 'l', 0.3], ['card', 'r', 0.5], ['star', 'r', 0.8]]),
  ] },
  bingo: { id: 'bingo', name: 'Salão Retrô de Bingo', accent: '#ffd23f', regions: [
    R('hall', 'Hall dos Globos', 'entrada do salão', ['#3b1d5e', '#4b1f5e', '#ffd23f', '#ff8bc4'], [['ball', 'l', 0.3], ['lamp', 'r', 0.55], ['ball', 'r', 0.85]]),
    R('bolas', 'Salão das Bolas', 'cartelas por todo lado', ['#5a1a47', '#6a2c91', '#ff4fa3', '#ffd23f'], [['ball', 'r', 0.25], ['record', 'l', 0.5], ['ball', 'l', 0.8]]),
    R('palcob', 'Palco do Bingo', 'o grande sorteio', ['#2a1b5c', '#8e1f4a', '#4fd2ff', '#ffd23f'], [['curtain', 'l', 0.3], ['trophy', 'r', 0.45], ['star', 'l', 0.8]]),
  ] },
  stop: { id: 'stop', name: 'Biblioteca Musical', accent: '#4fd2ff', regions: [
    R('entrada', 'Entrada da Biblioteca', 'silêncio… quase', ['#1b2a4a', '#24305c', '#4fd2ff', '#6f8fd8'], [['book', 'l', 0.3], ['lamp', 'r', 0.55], ['book', 'r', 0.85]]),
    R('estante', 'Estante dos Instrumentos', 'cordas, sopros e peles', ['#24305c', '#3a1f6b', '#ffd23f', '#6f8fd8'], [['guitar', 'r', 0.25], ['book', 'l', 0.5], ['sax', 'r', 0.8]]),
    R('partituras', 'Sala das Partituras', 'notas pra todo lado', ['#3a1f6b', '#5a1a47', '#ff4fa3', '#ff8bc4'], [['note', 'l', 0.3], ['book', 'r', 0.55], ['note', 'l', 0.85]]),
    R('torrel', 'Torre dos Livros', 'o topo da biblioteca', ['#5a1a47', '#8e1f4a', '#ffd23f', '#ffd23f'], [['trophy', 'r', 0.3], ['book', 'l', 0.55], ['star', 'r', 0.85]]),
  ] },
  velha: { id: 'velha', name: 'Arena de Duelos', accent: '#ff4fa3', regions: [
    R('portao', 'Portão da Arena', 'quem entra, duela', ['#2a1b4d', '#5a1a47', '#ff4fa3', '#ff8bc4'], [['sticks', 'l', 0.3], ['lamp', 'r', 0.55], ['sticks', 'r', 0.85]]),
    R('patio', 'Pátio dos Duelos', 'treino de verdade', ['#5a1a47', '#6a2c91', '#ffd23f', '#ff4fa3'], [['drum', 'r', 0.3], ['sticks', 'l', 0.55], ['star', 'r', 0.85]]),
    R('arquib', 'Arquibancada', 'a torcida chegou', ['#1b2f6a', '#3a1f6b', '#4fd2ff', '#4fd2ff'], [['amp', 'l', 0.3], ['heart', 'r', 0.55], ['amp', 'r', 0.85]]),
    R('ringue', 'Ringue Final', 'só um vence', ['#6a1a3a', '#8e1f4a', '#ffd23f', '#ffd23f'], [['trophy', 'l', 0.35], ['sticks', 'r', 0.55], ['star', 'l', 0.85]]),
  ] },
  quebra: { id: 'quebra', name: 'Galeria de Arte Musical', accent: '#ffd23f', regions: [
    R('sagao', 'Saguão da Galeria', 'bem-vindo à exposição', ['#24305c', '#3a1f6b', '#ffd23f', '#8e6bd1'], [['frame', 'l', 0.3], ['lamp', 'r', 0.55], ['frame', 'r', 0.85]]),
    R('quadros', 'Sala dos Quadros', 'peça por peça', ['#3a1f6b', '#4b1f5e', '#ff4fa3', '#ffd23f'], [['frame', 'r', 0.25], ['piece', 'l', 0.5], ['frame', 'l', 0.8]]),
    R('atelie', 'Ateliê Pixel', 'tintas e pincéis', ['#17402f', '#1b2f4f', '#6ef0a0', '#6ef0a0'], [['piece', 'r', 0.3], ['note', 'l', 0.55], ['piece', 'l', 0.85]]),
    R('mestres', 'Salão dos Mestres', 'obras-primas', ['#5a1a47', '#8e1f4a', '#ffd23f', '#ffd23f'], [['trophy', 'r', 0.3], ['frame', 'l', 0.55], ['star', 'r', 0.85]]),
  ] },
  cara: { id: 'cara', name: 'Cidade dos Personagens', accent: '#4fd2ff', regions: [
    R('rostos', 'Praça dos Rostos', 'quem será?', ['#2c1a56', '#3a1f6b', '#4fd2ff', '#8e6bd1'], [['face', 'l', 0.3], ['lamp', 'r', 0.55], ['face', 'r', 0.85]]),
    R('beco', 'Beco do Palpite', 'pistas no escuro', ['#1b2f6a', '#2a1b5c', '#ff4fa3', '#4fd2ff'], [['face', 'r', 0.3], ['spot', 'l', 0.55], ['face', 'l', 0.85]]),
    R('avenida', 'Avenida dos Personagens', 'todo mundo na rua', ['#5a1a47', '#6a2c91', '#ffd23f', '#ff4fa3'], [['face', 'l', 0.3], ['shop', 'r', 0.5], ['star', 'l', 0.85]]),
  ] },
  memoria: { id: 'memoria', name: 'Museu dos Instrumentos', accent: '#ff4fa3', regions: [
    R('hallm', 'Hall do Museu', 'a coleção começa aqui', ['#24305c', '#3a1f6b', '#ffd23f', '#8e6bd1'], [['frame', 'l', 0.3], ['lamp', 'r', 0.55], ['piano', 'r', 0.85]]),
    R('cordas', 'Ala das Cordas', 'violões e companhia', ['#3a1f6b', '#5a1a47', '#ff4fa3', '#ff8bc4'], [['guitar', 'l', 0.3], ['frame', 'r', 0.55], ['guitar', 'r', 0.85]]),
    R('sopros', 'Ala dos Sopros', 'ar que vira música', ['#17402f', '#1b2f4f', '#6ef0a0', '#6ef0a0'], [['sax', 'r', 0.3], ['frame', 'l', 0.55], ['sax', 'l', 0.85]]),
    R('batidas', 'Ala das Batidas', 'tambores e pratos', ['#5a1a47', '#8e1f4a', '#ffd23f', '#ffd23f'], [['drum', 'l', 0.3], ['sticks', 'r', 0.55], ['drum', 'r', 0.85]]),
  ] },
  monte: { id: 'monte', name: 'Fábrica de Ritmos', accent: '#ffd23f', regions: [
    R('portaof', 'Portão da Fábrica', 'hora de ligar as máquinas', ['#2a1b4d', '#3a1f6b', '#ffd23f', '#8e6bd1'], [['gear', 'l', 0.3], ['lamp', 'r', 0.55], ['gear', 'r', 0.85]]),
    R('esteira', 'Esteira dos Compassos', 'tempo a tempo', ['#3a1f6b', '#1b2f6a', '#4fd2ff', '#4fd2ff'], [['gear', 'r', 0.3], ['tape', 'l', 0.55], ['drum', 'r', 0.85]]),
    R('figuras', 'Máquina das Figuras', 'colcheias e semínimas', ['#5a1a47', '#6a2c91', '#ff4fa3', '#ff8bc4'], [['note', 'l', 0.3], ['gear', 'r', 0.55], ['note', 'l', 0.85]]),
    R('pausas', 'Sala das Pausas', 'o silêncio também conta', ['#1b2a4a', '#24305c', '#6ef0a0', '#6f8fd8'], [['curtain', 'r', 0.3], ['gear', 'l', 0.55], ['star', 'r', 0.85]]),
  ] },
  noritmo: { id: 'noritmo', name: 'Estúdio e Palco', accent: '#ff4fa3', regions: [
    R('estudio', 'Estúdio de Gravação', 'luz vermelha acesa', ['#2c1a56', '#3a1f6b', '#ff4fa3', '#8e6bd1'], [['mic', 'l', 0.3], ['amp', 'r', 0.55], ['tape', 'l', 0.85]]),
    R('camarim', 'Camarim', 'últimos ajustes', ['#3a1f6b', '#5a1a47', '#ffd23f', '#ff8bc4'], [['record', 'r', 0.3], ['guitar', 'l', 0.55], ['heart', 'r', 0.85]]),
    R('palquinho', 'Palco Pequeno', 'o primeiro show', ['#1b2f6a', '#2a1b5c', '#4fd2ff', '#4fd2ff'], [['curtain', 'l', 0.3], ['drum', 'r', 0.55], ['spot', 'l', 0.85]]),
    R('grande', 'Grande Palco', 'o show de verdade', ['#5a1a47', '#8e1f4a', '#ffd23f', '#ffd23f'], [['curtain', 'r', 0.3], ['trophy', 'l', 0.5], ['star', 'r', 0.85]]),
  ] },
};
export const themeOf = (id) => THEMES[id] || THEMES.cartas;
