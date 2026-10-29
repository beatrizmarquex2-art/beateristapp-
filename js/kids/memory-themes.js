// Temas do jogo da memória: as cartas desenhadas pela Bea (assets/memoria/<módulo>/, uma carta por imagem e um verso por módulo).
// Cada carta vira um par de cartas iguais. Temas com mais de um módulo usam um verso só, pra o verso não entregar quem é par de quem.
export const SIZES = [4, 8, 12];

const mod = (key, list) => ({ key, verso: `assets/memoria/${key}/verso.webp`, items: list.map(([id, name]) => ({ id: `${key}-${id}`, name, img: `assets/memoria/${key}/${id}.webp` })) });
const M = {
  percussao: mod('percussao', [["01_pandeiro","pandeiro"],["02_tamborim","tamborim"],["03_agogo","agogô"],["04_reco_reco","reco-reco"],["05_triangulo","triângulo"],["06_ganza","ganzá"],["07_congas","congas"],["08_bongos","bongôs"]]),
  rock: mod('rock', [["01_beatles","The Beatles"],["02_queen","Queen"],["03_nirvana","Nirvana"],["04_acdc","AC/DC"],["05_metallica","Metallica"],["06_blink182","Blink-182"],["07_arctic_monkeys","Arctic Monkeys"],["08_rhcp","Red Hot Chili Peppers"]]),
  figuras: mod('figuras', [["01_whole","semibreve"],["02_pausa_whole","pausa de semibreve"],["03_half","mínima"],["04_pausa_half","pausa de mínima"],["05_quarter","semínima"],["06_pausa_quarter","pausa de semínima"],["07_eighth","colcheia"],["08_pausa_eighth","pausa de colcheia"],["09_sixteenth","semicolcheia"],["10_pausa_sixteenth","pausa de semicolcheia"]]),
  bateria: mod('bateria', [["01_bumbo","bumbo"],["02_caixa","caixa"],["03_tom1","tom 1"],["04_tom2","tom 2"],["05_surdo","surdo"],["06_chimbal","chimbal"],["07_ride","ride"],["08_crash","crash"]]),
  sinais: mod('sinais', [["01_acento","acento"],["02_nota_fantasma","nota fantasma"],["03_metronomo","metrônomo"]]),
  profissoes: mod('profissoes', [["01_maestro","maestro"],["02_dj","DJ"],["03_baterista","baterista"],["04_cantora","cantora"],["05_guitarrista","guitarrista"],["06_compositora","compositora"],["07_tecnico_de_som","técnico de som"],["08_produtora_musical","produtora musical"]]),
  palco: mod('palco', [["01_microfone","microfone"],["02_amplificador","amplificador"],["03_pedal","pedal"],["04_mesa_de_som","mesa de som"],["05_fone","fone"],["06_interface_de_audio","interface de áudio"],["07_pedestal","pedestal"],["08_cabo_xlr","cabo XLR"]]),
  paul: mod('paul', [["01_bateria","bateria"],["02_violao","violão"],["03_guitarra","guitarra"],["04_baixo","baixo"],["05_teclado","teclado"],["06_saxofone","saxofone"],["07_violino","violino"],["08_pandeiro","pandeiro"]]),
};
const all = (...mods) => mods.flatMap((x) => x.items);

export const THEMES = [
  { id: 'bandas', title: 'Bandas e artistas', emoji: '🎸', blurb: 'Beatles, Queen, Nirvana…', items: all(M.rock), verso: M.rock.verso },
  { id: 'instrumentos', title: 'Instrumentos musicais', emoji: '🥁', blurb: 'percussão e o Paul músico', items: all(M.percussao, M.paul), verso: M.percussao.verso },
  { id: 'figuras', title: 'Figuras rítmicas', emoji: '🎵', blurb: 'figuras, pausas e sinais', items: all(M.figuras, M.sinais), verso: M.figuras.verso },
  { id: 'partitura', title: 'Partitura e peças', emoji: '🎼', blurb: 'a peça e a posição na pauta', items: all(M.bateria), verso: M.bateria.verso },
  { id: 'profissoes', title: 'Profissões da música', emoji: '🎤', blurb: 'maestro, DJ, baterista…', items: all(M.profissoes), verso: M.profissoes.verso },
  { id: 'palco', title: 'Palco e estúdio', emoji: '🎚️', blurb: 'microfone, mesa de som, pedal…', items: all(M.palco), verso: M.palco.verso },
  { id: 'misturado', title: 'Tudo misturado', emoji: '🌈', blurb: 'todas as cartas juntas', items: all(...Object.values(M)), verso: null },
];
export const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));
/** Todas as imagens (pra pré-carregar as cartas do tema antes de começar). */
export const imagesOf = (items) => items.map((x) => x.img);
