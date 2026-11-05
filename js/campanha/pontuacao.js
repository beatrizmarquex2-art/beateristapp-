// "Como pontuar": explicação simples, jogo a jogo, do que dá estrela, XP e figurinha. Cada frase espelha o que o código realmente faz hoje.
// Se mudar uma regra de pontuação num jogo, mude o texto aqui junto.
import { h } from '../util.js';

const NAO = (t) => ({ sim: false, txt: t });
const SIM = (t) => ({ sim: true, txt: t });
const FASES = {
  pontos: 'você responde e vê a sua % de acertos.',
  estrelas: SIM('até 3 ★ por fase: 60% de acertos = 1 ★, 80% = 2 ★, 100% = 3 ★. a 1ª estrela abre a fase seguinte.'),
  xp: NAO('não ganha XP aqui. as ★ somam no ranking dos alunos.'),
  figurinha: SIM('cada ★ nova (acima do seu melhor naquela fase) rende 1 figurinha nova pro álbum.'),
};
const AV = {
  estrelas: SIM('1 ★ = cumprir o objetivo da missão. 2 ★ e 3 ★ = jogar melhor. o jeito exato aparece no começo de cada missão.'),
  xp: NAO('a Aventura não dá XP.'),
  figurinha: NAO('a Aventura ainda não dá figurinha pro álbum.'),
  medalhas: 'medalhas: primeira missão, meio caminho, turnê completa, 3 ★ em tudo e as especiais de cada jogo. só ganha cumprindo de verdade.',
};
const LIVRE_SEM = { estrelas: NAO('sem estrelas.'), xp: NAO('sem XP.'), figurinha: NAO('sem figurinha.') };

export const PONTOS = {
  pauta: { fases: FASES }, figuras: { fases: FASES }, eco: { fases: FASES },
  cartas: { livre: { ...LIVRE_SEM, pontos: 'conta vitórias, derrotas e empates contra o Paul.' }, aventura: AV },
  bingo: { livre: { ...LIVRE_SEM, pontos: 'não tem pontos: o que vale é gritar “bingo!” com a combinação certa.' }, aventura: AV },
  velha: { livre: { ...LIVRE_SEM, pontos: 'placar da partida: cada vitória vale 1 ponto.' }, aventura: AV },
  quebra: { livre: { ...LIVRE_SEM, pontos: 'guarda o seu melhor tempo em cada tamanho (recorde).' }, aventura: AV },
  cara: { livre: { ...LIVRE_SEM, pontos: 'guarda o seu recorde: acertar com o menor número de perguntas.' }, aventura: AV },
  stop: { livre: { ...LIVRE_SEM, pontos: 'resposta válida e só sua = 10 pontos. válida e igual à de outro jogador = 5. errada, vazia ou pendente = 0.' }, aventura: { ...AV, estrelas: SIM('cumprir a meta de pontos da missão = 1 ★. quanto mais pontos, mais ★ (a meta de 2 ★ e 3 ★ aparece na missão). o tempo não muda as estrelas.') } },
  memoria: { livre: { ...LIVRE_SEM, pontos: 'guarda o seu melhor número de tentativas por tema e tamanho.' }, aventura: AV },
  monte: { livre: { ...LIVRE_SEM, pontos: 'não tem pontos: o ritmo está certo ou não.' }, aventura: AV },
  toca: { livre: { ...LIVRE_SEM, pontos: 'mostra a precisão (%) e a média de ms de cada compasso; o caminho abre cada exercício com 70%.' }, aventura: { ...AV, estrelas: SIM('70% de precisão = 1 ★, 85% = 2 ★, 95% = 3 ★. a meta aparece em cada missão.') } },
  noritmo: {
    livre: {
      pontos: 'ganha pontos, precisão (%) e combo a cada música.',
      estrelas: SIM('no Beat Hero: 45% de precisão = 1 ★, 65% = 2 ★, 80% = 3 ★, 90% = 4 ★, 97% = 5 ★.'),
      xp: SIM('sim, de 4 a 20 XP por música (mais precisão, mais XP). jogando 2 minutos o XP é em dobro.'),
      figurinha: NAO('as ★ do jogo de 2 minutos ficam guardadas, mas ainda não viram figurinha no álbum.'),
    },
    aventura: { ...AV, xp: SIM('o XP é o mesmo de uma música normal (4 a 20, em dobro com 2 minutos).'), estrelas: SIM('cumprir a meta de precisão da missão = 1 ★. mais precisão = 2 ★ e 3 ★ (as metas aparecem na missão). nenhuma música fica bloqueada.') },
  },
};

const row = (ico, nome, v) => h('li', { class: `pt-row ${v.sim ? 'sim' : 'nao'}` }, h('span', { class: 'pt-i', 'aria-hidden': 'true' }, ico), h('div', {}, h('b', {}, `${nome}: ${v.sim ? 'sim' : 'não'}`), h('span', {}, ` ${v.txt}`)));
/** Caixinha "como pontuar" de um jogo (`modo`: 'livre' | 'aventura' | 'fases'). */
export function pontuacaoEl(gameId, modo, { open = false } = {}) {
  const g = (PONTOS[gameId] || {})[modo]; if (!g) return null;
  const titulo = modo === 'aventura' ? 'como pontuar na Aventura' : modo === 'fases' ? 'como pontuar' : 'como pontuar no Modo Livre';
  return h('details', { class: 'pt-box', open: open || null }, h('summary', {}, titulo),
    g.pontos ? h('p', { class: 'pt-pontos' }, h('b', {}, 'pontos: '), g.pontos) : null,
    h('ul', { class: 'pt-list' }, row('⭐', 'estrelas', g.estrelas), row('⚡', 'XP', g.xp), row('🎴', 'figurinha', g.figurinha)),
    g.medalhas ? h('p', { class: 'pt-med' }, `🏅 ${g.medalhas}`) : null);
}
