// Relatório dos jogos: um documento com o nome de cada jogo e pra que ele serve no desenvolvimento e na aprendizagem do aluno.
// Texto fixo (não depende de dados). "Salvar em PDF" usa a impressão do aparelho.
import { h } from '../util.js';
import { banner } from '../ui.js';

// [nome, ícone, o que é, [o que desenvolve], como ajuda na aprendizagem]
const GROUPS = [
  ['Ritmo e bateria', [
    ['Beat Hero', 'ritmo.svg', 'Toque no tempo certo em músicas e fases (Ritmo/Melodia, Piano Tiles, Setinhas e leitura de ritmo), com pontos, estrelas e ranking.',
      ['coordenação motora e precisão de tempo', 'atenção sustentada e tempo de reação', 'percepção de pulso e andamento'],
      'O retorno imediato (acertou, adiantou, atrasou) mostra ao aluno o próprio tempo sem a fala do professor. Pontos e ranking dão motivo para repetir, e a repetição com meta é o que fixa o pulso.'],
    ['Monte seu ritmo', 'monte.svg', 'O aluno monta ritmos com palavras do dia a dia (pão, bolo, chocolate) e ouve o resultado.',
      ['relação entre sílabas, duração e subdivisão', 'criatividade e composição', 'noção de compasso e de repetição'],
      'Palavras conhecidas servem de ponte para a leitura rítmica: o aluno sente a duração no corpo antes de ver o símbolo na partitura. Compor cedo cria autonomia e vontade de criar.'],
    ['Explorar a bateria', 'explorar.svg', 'Bateria na tela para tocar livre ou descobrir o nome de cada peça ao tocar.',
      ['reconhecimento das peças e do vocabulário da bateria', 'ligação entre som, imagem e nome', 'coordenação com vários dedos'],
      'Explorar sem certo ou errado reduz o medo de errar. Nomear a peça ao mesmo tempo em que se ouve o som fixa o vocabulário por três vias (ver, ouvir, tocar).'],
    ['Eco rítmico', 'eco.svg', 'O aluno ouve um ritmo e repete logo depois, na tela ou no pad/bateria.',
      ['memória auditiva e memória rítmica', 'atenção e imitação', 'escuta ativa'],
      'Repetir de ouvido é a base de tocar com outras pessoas. Treina reter uma frase rítmica na memória de trabalho e devolver no tempo, habilidade usada em toda aula de instrumento.'],
    ['PaulBox', 'paulbox.webp', 'A banda do Paul: 10 Pauls, cada um com um instrumento (bateria, baixo, teclado, guitarra, voz, DJ, trompete, pandeiro, violino e metrônomo). Toque num Paul pra ele entrar na banda e toque de novo pra trocar o ritmo dele. Dá pra gravar 20 segundos da banda e postar.',
      ['noção de arranjo: como uma banda se monta', 'ouvir vários instrumentos tocando juntos', 'criatividade musical'],
      'Sem certo ou errado: a criança descobre sozinha que a bateria e o baixo seguram o tempo, e que cada instrumento que entra muda a música. Gravar e mostrar o que criou dá orgulho e vontade de criar de novo.'],
  ]],
  ['Leitura musical', [
    ['Figurix (leitura de ritmo)', 'figuras.svg', 'Fases para reconhecer os símbolos que mostram quanto dura cada som (semínima, colcheia…) e os símbolos de silêncio (as pausas), saber quanto cada um dura e compará-los.',
      ['ler quanto dura cada som e cada silêncio na partitura', 'noção de metade, quarto e dobro (1, 1/2, 1/4…)', 'contar os tempos da música'],
      'Liga a matemática da duração à música: o aluno entende por que um som longo dura o mesmo que dois curtinhos. Isso sustenta a leitura de partitura e a contagem em voz alta.'],
    ['Onde mora na pauta?', 'pauta.svg', 'Cada peça da bateria tem a sua casinha na pauta; o aluno descobre qual é qual.',
      ['leitura de partitura de bateria', 'orientação espacial (linhas e espaços)', 'associação peça × posição'],
      'Dá o primeiro passo para ler partitura de bateria com a peça que o aluno já conhece. Ver e ouvir a peça junto da posição acelera a memorização.'],
  ]],
  ['Cartas e tabuleiro', [
    ['Jogo da memória', 'memoria.svg', 'Cartas desenhadas (instrumentos, bandas, símbolos de som e de silêncio, profissões, palco e estúdio) para achar os pares, em 4, 8 ou 12 pares.',
      ['cultura musical: profissionais da música e situações de show', 'equipamentos de palco, percussão e símbolos de som e silêncio', 'memória visual, atenção e concentração'],
      'Cada par achado é uma retomada do nome e da imagem, o que reforça o repertório cultural (bandas, profissões, equipamentos). O recorde pessoal dá meta clara e incentiva a repetir.'],
    ['Uno Musical', 'cartas.webp', 'Jogo de cartas com números e símbolos de duração dos sons: descartar combinando soma de durações, cor ou tipo, até sobrar uma carta.',
      ['decorar as figuras musicais (os símbolos que mostram quanto dura cada som)', 'somar e comparar a duração dos sons', 'planejamento e tomada de decisão'],
      'Reforça a ligação entre o número e o símbolo que mostra a duração do som, e exige olhar a jogada do outro. Boa para turma: gera conversa e comparação entre estratégias.'],
    ['Bingo', 'bingo.webp', 'Bingo musical: cartela 3×3 de instrumentos, peças da bateria, símbolos de ritmo, símbolos de música ou artistas; o Paul sorteia (manual ou automático) e vence quem fecha 3 em linha. Sozinho, online por código, 2 no mesmo aparelho ou sala de aula (com cartelas para imprimir).',
      ['reconhecimento de instrumentos e símbolos', 'atenção auditiva e visual', 'espera e autocontrole'],
      'No modo professor serve de revisão coletiva: o professor sorteia e a turma reconhece. Repetir o reconhecimento em contexto leve consolida o vocabulário.'],
    ['Jogo da velha', 'velha.webp', 'Três em linha, baquetas contra palheta, com variante de desafio musical em que se responde para jogar.',
      ['curiosidades sobre música', 'teoria musical em perguntas rápidas', 'artistas, bandas e muito mais'],
      'A variante com perguntas transforma a jogada em retomada do conteúdo: o aluno só marca a casa se souber a resposta, o que dá motivo real para estudar.'],
    ['Quebra-cabeça', 'quebra-cabeca.webp', 'Monta a cena do Paul no palco de 6 até 70 peças.',
      ['imaginação e percepção visual', 'persistência e resolução de problemas', 'concentração com cenas de música'],
      'Atividade calma que treina foco e paciência, útil para começo de aula ou para alunos agitados. Os níveis permitem progredir sem frustração.'],
    ['Cara a cara', 'cara-a-cara.webp', 'O Paul escolhe um instrumento em segredo; o aluno faz perguntas de sim ou não para descobrir qual é.',
      ['conhecer os instrumentos musicais e as suas famílias', 'raciocínio por eliminação', 'descobrir novas bandas e artistas'],
      'Para perguntar bem o aluno precisa saber como cada instrumento soa e é tocado. Ensina a pensar por categorias (cordas, sopro, percussão), base da escuta analítica.'],
    ['Stop', 'stop.webp', 'STOP musical: com uma letra sorteada, preencher de 5 a 8 categorias (instrumentos, percussão, equipamentos, estilos, profissões, técnicas, cantores, bandas, músicas, álbuns, artistas brasileiros, marcas) antes do tempo acabar. Individual, dupla, sala de aula ou 2 celulares.',
      ['repertório e cultura musical', 'recuperação rápida da memória', 'escrita e ortografia sob tempo'],
      'Cada resposta é uma busca rápida na memória de longo prazo, o que fortalece o repertório. Na dupla, ver as respostas do colega amplia as referências.'],
  ]],
  ['Letras', [
    ['Quiz das dicas', 'quiz.svg', 'Perguntas de completar e de ligar sobre as dicas do método.',
      ['retenção do conteúdo do método', 'leitura atenta', 'autoavaliação'],
      'Testar-se é uma das formas de estudo que mais fixam o conteúdo. Depois de cada resposta a dica inteira aparece, e o erro vira explicação.'],
    ['Caça-palavras', 'caca.svg', 'Achar na grade a palavra de cada dica a partir de uma pista.',
      ['atenção visual e varredura', 'vocabulário técnico', 'persistência'],
      'A palavra só aparece quando é achada e traz a explicação junto, então o aluno liga o termo ao conceito.'],
    ['Cruzadinha', 'cruza.svg', 'Preencher a cruzadinha com as palavras das dicas, a partir das pistas.',
      ['recuperação ativa do vocabulário', 'ortografia', 'raciocínio com restrições (letras que cruzam)'],
      'Os cruzamentos funcionam como confirmação: se uma letra não encaixa, o aluno revê a resposta. Boa para fixar termos de estudo e técnica.'],
  ]],
  ['Fases e estrelas', [
    ['Fases e estrelas', 'fases.svg', 'Jogadores com progresso: cada fase vale até 3 estrelas pela porcentagem de acerto, e as estrelas liberam as próximas fases e figurinhas.',
      ['persistência e meta pessoal', 'prática espaçada (voltar para melhorar as estrelas)', 'autoestima por progresso visível'],
      'O progresso por estrelas mostra o avanço sem comparar com os outros. Fases trancadas incentivam completar a anterior antes de seguir, na ordem em que o conteúdo se constrói.'],
  ]],
];

export function relatorio(host) {
  const total = GROUPS.reduce((n, g) => n + g[1].length, 0);
  const block = ([name, img, what, skills, how]) => h('article', { class: 'rel-game' },
    h('img', { class: 'rel-ico', src: `assets/jogos/icones/${img}`, alt: '', decoding: 'async', draggable: 'false' }),
    h('div', { class: 'rel-body' },
      h('h3', {}, name),
      h('p', { class: 'rel-what' }, what),
      h('p', { class: 'rel-k' }, 'desenvolve'), h('ul', {}, ...skills.map((s) => h('li', {}, s))),
      h('p', { class: 'rel-k' }, 'na aprendizagem'), h('p', {}, how)));
  host.replaceChildren(banner('Jogos Ensinam', 'pra que serve cada jogo'), h('div', { class: 'jg jg-wrap jg-doc' },
    h('div', { class: 'rel-actions' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), h('button', { class: 'btn small', type: 'button', onclick: () => window.print() }, 'salvar em PDF')),
    h('article', { class: 'rel-page' },
      h('header', { class: 'rel-title' }, h('h1', { class: 'hand' }, 'Jogos Ensinam'), h('p', { class: 'muted' }, `Beaterista · ${total} jogos · o que cada um desenvolve e como ajuda a aprender música`)),
      h('p', { class: 'rel-intro' }, 'Os jogos da Beaterista não são só diversão: cada um treina uma habilidade que o aluno vai usar ao tocar. Jogar traz atenção, repetição com meta e retorno imediato, o que ajuda a memória e a motivação. Este documento diz, jogo a jogo, para que ele serve.'),
      ...GROUPS.map(([title, list]) => h('section', { class: 'rel-grp' }, h('h2', { class: 'hand' }, title), ...list.map(block))))));
  return null;
}
