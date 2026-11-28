// Prévia dos jogos que ensinam de verdade (trancados sem código): a aluna vê como é por dentro (telas reais, o que faz, o que desenvolve)
// e depois o caminho pra liberar. Imagens em assets/previa/ (telas do próprio jogo, 300 px). Textos tirados do que o jogo mostra e do relatório "Jogos Ensinam".
import { h } from './util.js';

const IMG = 'assets/previa/';
const PREVIAS = {
  ritmo: { titulo: 'Beat Hero', frase: 'toque no tempo certo em músicas de verdade',
    sobre: 'Toque no tempo certo em músicas e fases (Ritmo/Melodia, Piano Tiles, Setinhas e Figuras), com pontos, combo, estrelas e ranking.',
    faz: ['escolha a música e o andamento', 'toque nas peças quando as notas chegarem na linha', 'veja seus pontos, combo e precisão na hora'],
    desenvolve: ['coordenação motora e precisão de tempo', 'atenção e tempo de reação', 'percepção de pulso e andamento'],
    imgs: [['ritmo-1', 'escolha a música'], ['ritmo-2', 'as notas descem: toque no tempo'], ['ritmo-3', 'perfeito! combo e estrelas subindo']] },
  paulta: { titulo: 'pauLta', frase: 'leitura musical por mundos e fases',
    sobre: 'Leitura musical: escolha um mundo (Bateria, Clave de Sol, Clave de Fá e o Duelo das Claves), cumpra as fases e ganhe pontos com o Paul.',
    faz: ['escolha um mundo e siga o caminho das fases', 'leia a nota ou a peça na pauta e responda', 'junte pontos e destrave as próximas fases'],
    desenvolve: ['leitura de partitura da bateria', 'notas nas claves de sol e de fá', 'persistência: uma fase de cada vez'],
    imgs: [['paulta-1', 'os mundos'], ['paulta-2', 'o caminho das fases']] },
  toca: { titulo: 'Toca Aqui', frase: 'leia, ouça e toque no tempo',
    sobre: 'Leia a figura na pauta e toque no tempo. Ouça antes ou vá direto pra sua vez, escolha o andamento (BPM), o som e toque na tela ou no microfone.',
    faz: ['veja o ritmo escrito na pauta', 'ouça o Paul tocar e depois repita', 'toque na tela ou no microfone, em 8 exercícios por nível'],
    desenvolve: ['leitura de figuras rítmicas', 'memória rítmica (ouvir e repetir)', 'tocar no tempo, devagar ou rápido'],
    imgs: [['toca-1', 'escolha o jeito e o andamento'], ['toca-2', 'o ritmo na pauta e a sua vez']] },
  cartas: { titulo: 'Uno Musical', frase: 'jogo de cartas com as figuras rítmicas',
    sobre: 'Jogue a carta da mesma cor ou da mesma figura. Reconhecer as figuras é o segredo! Contra o computador, no mesmo aparelho ou em 2 celulares.',
    faz: ['aprenda as 10 figuras e pausas', 'jogue a carta da mesma cor ou figura', 'esqueceu de avisar o UNO? compra 2'],
    desenvolve: ['soma e comparação de durações', 'planejamento e tomada de decisão', 'atenção às regras'],
    imgs: [['cartas-1', 'as figuras do jogo'], ['cartas-2', 'a mesa de jogo']] },
  detetive: { titulo: 'Detetive Note', frase: 'escute o ritmo e monte ele, peça por peça',
    sobre: 'Um caso por fase: o Paul toca um ritmo e você descobre quais figuras ele usou, montando na ordem certa. Mundos de comida, parque, corpo e animais ligam o som que você ouve ao símbolo escrito.',
    faz: ['ouça a pista (no andamento que você escolher)', 'monte o ritmo na ordem, com as figuras certas', 'toque em conferir e veja se acertou'],
    desenvolve: ['ouvido rítmico: reconhecer o que se escuta', 'leitura das figuras rítmicas', 'atenção e memória'],
    imgs: [['detetive-1', 'o mapa dos casos'], ['detetive-2', 'ouça a pista e monte o ritmo']], video: 'detetive' },
  figurix: { titulo: 'Figurix', frase: 'aprenda a ler quanto dura cada figura',
    sobre: '12 fases por mundo para reconhecer as figuras rítmicas e as pausas, saber quanto cada uma dura e compará-las. Cada fase começa com uma aulinha rápida do Paul e termina com desafios que mudam a cada rodada.',
    faz: ['veja a aulinha da fase e a tabela das figuras', 'resolva desafios: comparar, somar, completar o compasso', 'ganhe estrelas e abra o próximo mundo'],
    desenvolve: ['ler quanto dura cada som e cada silêncio', 'noção de metade, quarto e dobro', 'contar os tempos da música'],
    imgs: [['figurix-1', 'os mundos e as fases'], ['figurix-2', 'a aulinha do Paul']], video: 'figurix' },
  rudimentos: { titulo: 'Rudimentix', frase: 'treine os rudimentos das mãos: esquerda e direita',
    sobre: 'Os padrões que todo baterista pratica, em 11 fases: o app mostra qual mão toca e você toca no tempo, caixa (E) e bumbo (D), cada vez mais difícil.',
    faz: ['veja qual lado toca: E ou D', 'toque no tempo, alternando as mãos', 'passe de fase quando fizer limpo'],
    desenvolve: ['coordenação entre as duas mãos', 'precisão de tempo', 'base técnica da bateria'],
    imgs: [['rudimentos-1', 'o mapa das 11 fases'], ['rudimentos-2', 'toque E e D no tempo']], video: 'rudimentos' },
  treino: { titulo: 'Treino livre', frase: 'os jogos de estudar, soltos, pra jogar à vontade',
    sobre: '10 jogos de estudo reunidos: genius de sons, caminho de notas, memória, notas caindo, monte o ritmo, complete o compasso, intruso, caça-palavras e cruzadinha. Escolha o nível e jogue rodadas novas sem parar: ótimo pra aula e pra treinar em casa.',
    faz: ['escolha o jogo e o nível (fácil, médio ou difícil)', 'jogue quantas rodadas quiser, sempre novas', 'sem trilha e sem estrela: só treinar'],
    desenvolve: ['leitura de figuras e de compasso', 'ouvido e memória musical', 'vocabulário musical (palavras e cruzadinha)'],
    imgs: [['treino-1', 'os 10 jogos'], ['treino-2', 'uma rodada: caça-palavras']], video: 'treino' },
  album: { titulo: 'Álbum de figurinhas', frase: 'colecione bandas e artistas de verdade',
    sobre: 'Um álbum com figurinhas de bandas, cantores e bateristas. Você ganha estrelas jogando e estudando, gira a roleta, abre pacotes e cola as figurinhas no álbum. Dá pra trocar o Paul da foto e montar a sua figurinha.',
    faz: ['junte estrelas nos jogos e nos estudos', 'gire a roleta e abra os pacotinhos', 'cole as figurinhas e complete as coleções'],
    desenvolve: ['cultura musical: bandas, cantores e bateristas', 'constância: um pouquinho todo dia', 'o prazer de completar uma coleção'],
    imgs: [['album-1', 'o álbum e as coleções'], ['album-2', 'estrelas, roleta e baú']] },
  ranking: { titulo: 'Ranking', frase: 'veja quem terminou mundos e quem treina mais',
    sobre: 'Quadros com setinhas: mundos terminados, quem chegou mais longe, mais estrelas, mais figurinhas, quem mais estudou, Eco do Paul e dias em sequência. Pódio com 1º, 2º e 3º lugar. Só aparece o primeiro nome e a inicial.',
    faz: ['passe pelos quadros com as setinhas', 'veja o pódio de cada um, do mês e de sempre', 'suba de posição estudando e jogando'],
    desenvolve: ['motivação e meta pessoal', 'constância nos estudos', 'brincar com os colegas, sem expor ninguém'],
    imgs: [['ranking-1', 'quadros e setinhas'], ['ranking-2', 'o pódio com 1º, 2º e 3º']] },
};

/** Qual prévia vale pra esta rota (ou null). */
export function previaDaRota(r) {
  if (r.name === 'ritmo') return 'ritmo';
  if (r.name === 'paulta') return 'paulta';
  if (r.name === 'jogos' && r.parts[0] === 'toca') return 'toca';
  if (r.name === 'album') return 'album';
  if (r.name === 'ranking') return 'ranking';
  if (r.name === 'jogos' && r.parts[0] === 'un') return 'cartas'; // (o Uno Musical agora abre: 2 partidas grátis contra o robô)
  if (r.name === 'jogos' && ['detetive', 'figurix', 'treino'].includes(r.parts[0])) return r.parts[0];
  if (r.name === 'jogos' && r.parts[0] === 'rudimentos') return 'rudimentos';
  return null;
}
export const tituloDaPrevia = (k) => (PREVIAS[k] ? PREVIAS[k].titulo : '');
/** Os jogos que ensinam de verdade, na ordem da vitrine (#/premium). */
export const PREMIUM = ['toca', 'detetive', 'figurix', 'rudimentos', 'paulta', 'treino', 'album', 'ranking'];
export const dadosDaPrevia = (k) => PREVIAS[k] || null;
/** Quando a Bea grava a tela do jogo funcionando: salvar em assets/previa/video-<id>.mp4 (sem som ou com; 9:16, até ~20 s) e a vitrine mostra sozinha. */
export const urlDoVideo = (k) => `${IMG}video-${PREVIAS[k] && PREVIAS[k].video ? PREVIAS[k].video : k}.mp4`;
/** Caixa de vídeo: só aparece se o arquivo existir (sem arquivo não mostra nada, sem buraco). */
export function caixaVideo(k) {
  const box = h('div', { class: 'pv-video', hidden: true }); const url = urlDoVideo(k);
  fetch(url, { method: 'HEAD' }).then((r) => { if (!r.ok || !/video/.test(r.headers.get('content-type') || '')) return; box.hidden = false; box.append(h('p', { class: 'pv-tag' }, 'veja funcionando'), h('video', { src: url, controls: true, playsinline: true, preload: 'metadata', 'aria-label': `${PREVIAS[k].titulo} funcionando` })); }).catch(() => { /* sem vídeo ainda */ });
  return box;
}

/** A prévia em si: galeria das telas, o que é, o que você faz e o que desenvolve. */
export function previa(k) {
  const p = PREVIAS[k]; if (!p) return null;
  return h('section', { class: 'pv', 'aria-label': `Prévia: ${p.titulo}` },
    caixaVideo(k),
    h('p', { class: 'pv-tag' }, 'dá uma olhada por dentro'),
    h('div', { class: 'pv-gal', role: 'group', 'aria-label': 'Telas do jogo' }, ...p.imgs.map(([f, leg]) => h('figure', { class: 'pv-fig' }, h('img', { src: `${IMG}${f}.webp`, alt: `${p.titulo}: ${leg}`, draggable: 'false' }), h('figcaption', {}, leg)))),
    h('div', { class: 'card pad pv-txt' }, h('h2', { class: 'tag' }, p.titulo), h('p', {}, p.sobre),
      h('b', {}, 'o que você faz'), h('ul', {}, ...p.faz.map((x) => h('li', {}, x))),
      h('b', {}, 'o que desenvolve'), h('ul', {}, ...p.desenvolve.map((x) => h('li', {}, x)))));
}
