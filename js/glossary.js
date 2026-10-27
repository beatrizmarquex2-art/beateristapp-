// Dicionário da bateria: termos com explicação curta, dica de estudo, nome em inglês (quando o mundo usa o inglês),
// exemplo que toca (grade do Beat Lab) e ligação com os textos da Mente Musical. Puro, testado em tests/glossary.test.mjs.

export const CATS = [
  ['tempo', 'tempo e pulso'], ['figuras', 'figuras e contagem'], ['levadas', 'levadas e estilos'],
  ['tecnica', 'técnica e rudimentos'], ['som', 'dinâmica e som'], ['forma', 'forma e estrutura'],
];

const on = (n, s) => Array.from({ length: n }, (_, i) => (s.includes(i) ? 1 : 0));
const ex = (steps, bpm, rows, acc) => ({ steps, bpm, rows, acc: acc || null });
const R8 = (s) => on(8, s), R16 = (s) => on(16, s), R12 = (s) => on(12, s);
const ROCK = { hh: R8([0, 1, 2, 3, 4, 5, 6, 7]), sn: R8([2, 6]), bd: R8([0, 4]) };

export const TERMS = [
  // tempo e pulso
  { id: 'pulso', t: 'pulso', en: 'beat', cat: 'tempo', d: 'a batida regular que a gente sente por baixo da música, a que faz o pé marcar sozinho.', dica: 'antes de tocar qualquer música, marque o pulso com o pé ou com a cabeça por 4 compassos.', ex: ex(8, 90, { hh: R8([0, 2, 4, 6]) }), art: 'beat-perception-beat-finding', see: ['bpm', 'tempo-forte'] },
  { id: 'bpm', t: 'BPM', en: 'beats per minute', cat: 'tempo', d: 'quantos pulsos cabem em um minuto. 60 BPM = um por segundo; 120 BPM = dois por segundo.', dica: 'não sabe o BPM de uma música? use o tap tempo nas Ferramentas.', link: '#/ferramentas/tap', see: ['pulso', 'metronomo'] },
  { id: 'metronomo', t: 'metrônomo', en: 'click', cat: 'tempo', d: 'o aparelho (ou app) que marca o pulso certinho. no estúdio e no palco chamam de "click".', dica: 'estude devagar com o metrônomo e suba de 5 em 5 BPM só quando sair limpo 3 vezes seguidas.', link: '#/metronomo', see: ['bpm'] },
  { id: 'compasso', t: 'compasso', en: 'bar / measure', cat: 'tempo', d: 'um grupinho de pulsos que se repete. no 4/4 cada compasso tem 4 tempos: 1, 2, 3, 4.', dica: 'conte o "1" mais forte: é ele que te mostra onde o compasso começa.', ex: ex(8, 100, ROCK, R8([0])), see: ['formula', 'tempo-forte'] },
  { id: 'formula', t: 'fórmula de compasso', en: 'time signature', cat: 'tempo', d: 'os dois números no começo da partitura. o de cima diz quantos tempos tem o compasso; o de baixo, qual figura vale um tempo (4 = semínima, 8 = colcheia).', dica: '4/4 é o mais comum; 3/4 é a valsa; 6/8 é o "balanço de três" de muita balada.', see: ['compasso', 'composto'] },
  { id: 'tempo-forte', t: 'tempo forte e tempo fraco', en: 'downbeat / weak beat', cat: 'tempo', d: 'no 4/4, o 1 é o mais forte, o 3 é meio forte e o 2 e o 4 são fracos. a bateria de rock costuma pôr bumbo nos fortes e caixa nos fracos.', ex: ex(8, 90, { bd: R8([0, 4]), sn: R8([2, 6]) }), link: '#/ferramentas/um', see: ['backbeat', 'compasso'] },
  { id: 'contratempo', t: 'contratempo', en: 'offbeat / upbeat', cat: 'tempo', d: 'a nota que cai no "e", entre um pulso e outro. é o "&" da contagem 1 & 2 & 3 & 4 &.', dica: 'toque o chimbal só no "&" com o bumbo no tempo: é a base da disco e do reggae.', ex: ex(8, 100, { hh: R8([1, 3, 5, 7]), bd: R8([0, 2, 4, 6]) }), see: ['sincope'] },
  { id: 'sincope', t: 'síncope', en: 'syncopation', cat: 'tempo', d: 'quando a nota forte cai fora do pulso esperado e "puxa" o ritmo. é o que dá vontade de mexer.', dica: 'conte em voz alta e toque só onde não tem número: e, &, a.', ex: ex(16, 90, { hh: R16([0, 2, 4, 6, 8, 10, 12, 14]), sn: R16([4, 12]), bd: R16([0, 3, 6, 10]) }), art: 'syncopation-urge-to-move', see: ['contratempo', 'groove'] },
  { id: 'microtempo', t: 'microtempo', en: 'microtiming', cat: 'tempo', d: 'as diferencinhas de milissegundos entre o que está "no grid" e o que o músico toca. caixa um tiquinho atrasada deixa o groove mais pesado e relaxado.', dica: 'o Juiz de Tempo mostra se você tende a correr ou arrastar.', link: '#/tempo', art: 'microtiming', see: ['groove', 'pocket'] },
  { id: 'pocket', t: 'pocket (no bolso)', en: 'pocket', cat: 'tempo', d: 'quando a levada assenta: firme, confortável, sem correr nem arrastar. "tocar no pocket" é o elogio máximo pra baterista.', dica: 'grave 1 minuto de groove simples e ouça: o pocket aparece mais no simples do que no difícil.', see: ['microtempo', 'groove'] },
  // figuras e contagem
  { id: 'seminima', t: 'semínima', en: 'quarter note', cat: 'figuras', d: 'a nota que vale 1 tempo no 4/4. conta "1, 2, 3, 4".', ex: ex(8, 80, { sn: R8([0, 2, 4, 6]) }), link: '#/treinos', see: ['colcheia'] },
  { id: 'colcheia', t: 'colcheia', en: 'eighth note', cat: 'figuras', d: 'metade da semínima: 2 notas por tempo. conta "1 & 2 & 3 & 4 &".', ex: ex(8, 80, { hh: R8([0, 1, 2, 3, 4, 5, 6, 7]) }), see: ['seminima', 'semicolcheia'] },
  { id: 'semicolcheia', t: 'semicolcheia', en: 'sixteenth note', cat: 'figuras', d: 'metade da colcheia: 4 notas por tempo. conta "1 e & a 2 e & a…".', ex: ex(16, 70, { sn: R16([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) }), see: ['colcheia', 'toque-simples'] },
  { id: 'tercina', t: 'tercina (quiáltera)', en: 'triplet', cat: 'figuras', d: '3 notas no espaço de 2: o tempo dividido em três partes iguais. conta "1 tri ô 2 tri ô".', ex: ex(12, 70, { sn: R12([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), bd: R12([0, 6]) }), see: ['shuffle', 'composto'] },
  { id: 'pausa', t: 'pausa', en: 'rest', cat: 'figuras', d: 'o silêncio com duração certa. pausa também se conta: o tempo continua andando.', dica: 'na leitura, fale a contagem da pausa baixinho em vez de pular.', see: ['seminima'] },
  { id: 'ponto', t: 'ponto de aumento', en: 'dotted note', cat: 'figuras', d: 'o pontinho do lado da nota soma metade do valor dela. colcheia pontuada = colcheia + semicolcheia.', ex: ex(16, 80, { sn: R16([0, 3, 4, 7, 8, 11, 12, 15]) }), see: ['colcheia', 'semicolcheia'] },
  { id: 'contagem', t: 'contagem', en: 'counting', cat: 'figuras', d: 'o jeito de falar o ritmo: números no tempo, "&" no meio, "e" e "a" nas semicolcheias.', dica: 'contar em voz alta enquanto toca é um dos treinos mais eficientes que existem.', art: 'production-effect-learning', see: ['semicolcheia'] },
  // levadas e estilos
  { id: 'groove', t: 'groove (levada)', en: 'groove', cat: 'levadas', d: 'o padrão que se repete e sustenta a música. groove bom é o que faz o corpo querer mexer.', ex: ex(8, 100, ROCK), art: 'groove-inverted-u', link: '#/beatlab', see: ['pocket', 'virada'] },
  { id: 'backbeat', t: 'backbeat', en: 'backbeat', cat: 'levadas', d: 'a caixa no 2 e no 4. é a assinatura do rock, do pop e do funk.', ex: ex(8, 100, ROCK), see: ['tempo-forte', 'groove'] },
  { id: 'quatro-no-chao', t: 'quatro no chão', en: 'four on the floor', cat: 'levadas', d: 'bumbo nos 4 tempos do compasso. base da disco, do dance e de muito pop.', ex: ex(8, 118, { hh: R8([1, 3, 5, 7]), sn: R8([2, 6]), bd: R8([0, 2, 4, 6]) }), see: ['contratempo'] },
  { id: 'meio-tempo', t: 'meio tempo', en: 'half time', cat: 'levadas', d: 'a caixa só no 3: a música parece andar na metade da velocidade, mesmo com o mesmo BPM. fica pesado.', ex: ex(8, 140, { hh: R8([0, 2, 4, 6]), sn: R8([4]), bd: R8([0, 1]) }), see: ['dobro'] },
  { id: 'dobro', t: 'tempo dobrado', en: 'double time', cat: 'levadas', d: 'a caixa em todo tempo (ou no "&"): a sensação de que a música acelerou, sem mudar o BPM.', ex: ex(8, 100, { hh: R8([0, 1, 2, 3, 4, 5, 6, 7]), sn: R8([1, 3, 5, 7]), bd: R8([0, 2, 4, 6]) }), see: ['meio-tempo'] },
  { id: 'shuffle', t: 'shuffle (balanço)', en: 'shuffle', cat: 'levadas', d: 'colcheias "mancando": a primeira mais longa e a segunda mais curta, como tercina sem a nota do meio.', ex: ex(12, 90, { hh: R12([0, 2, 3, 5, 6, 8, 9, 11]), sn: R12([3, 9]), bd: R12([0, 6]) }), see: ['tercina', 'swing'] },
  { id: 'swing', t: 'swing', en: 'swing', cat: 'levadas', d: 'o balanço do jazz: colcheias desiguais e condução no prato "ding, ding-da-ding".', ex: ex(12, 120, { rd: R12([0, 3, 5, 6, 9, 11]), hf: R12([3, 9]) }), see: ['shuffle'] },
  { id: 'composto', t: 'compasso composto', en: 'compound meter', cat: 'levadas', d: 'cada tempo se divide em 3 (6/8, 12/8). é o balanço de muita balada e blues lento.', ex: ex(12, 60, { hh: R12([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), sn: R12([6]), bd: R12([0]) }), see: ['tercina', 'formula'] },
  { id: 'ostinato', t: 'ostinato', en: 'ostinato', cat: 'levadas', d: 'um padrão que fica repetindo sem parar (normalmente no pé ou numa mão) enquanto o resto varia.', dica: 'ótimo pra independência: deixe o pé fixo e invente na mão.', see: ['independencia'] },
  { id: 'polirritmia', t: 'polirritmia', en: 'polyrhythm', cat: 'levadas', d: 'dois agrupamentos diferentes ao mesmo tempo, tipo 3 contra 2: uma mão divide o tempo em 3, a outra em 2.', dica: 'conte até 6 em loop: uma mão toca no 1, 3 e 5 (três), a outra no 1 e 4 (dois).', see: ['tercina'] },
  // técnica e rudimentos
  { id: 'rudimento', t: 'rudimento', en: 'rudiment', cat: 'tecnica', d: 'os "exercícios-vocabulário" da caixa: combinações de mão direita e esquerda que viram base pra tudo.', link: '#/rudimentos', see: ['toque-simples', 'paradiddle'] },
  { id: 'toque-simples', t: 'toque simples', en: 'single stroke roll', cat: 'tecnica', d: 'mãos alternadas: D E D E. o rudimento mais usado em viradas.', ex: ex(16, 80, { sn: R16([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) }, R16([0, 2, 4, 6, 8, 10, 12, 14])), link: '#/rudimentos', see: ['toque-duplo'] },
  { id: 'toque-duplo', t: 'toque duplo', en: 'double stroke roll', cat: 'tecnica', d: 'duas batidas por mão: D D E E. a segunda nasce do rebote da baqueta, não de força.', link: '#/rudimentos', see: ['toque-simples', 'rebote'] },
  { id: 'paradiddle', t: 'paradiddle', en: 'paradiddle', cat: 'tecnica', d: 'D E D D  E D E E: simples + duplo. troca a mão que começa e é ótimo pra levar pro chimbal e pros tons.', link: '#/rudimentos', see: ['rudimento'] },
  { id: 'flam', t: 'flam', en: 'flam', cat: 'tecnica', d: 'duas baquetas quase juntas: uma bem baixinha logo antes da forte. soa "gordo", como uma nota só mais larga.', dica: 'a nota pequena sai de perto da pele; a grande, de cima.', link: '#/rudimentos', see: ['rudimento'] },
  { id: 'rebote', t: 'rebote', en: 'rebound', cat: 'tecnica', d: 'deixar a baqueta voltar sozinha depois da batida em vez de "enterrar" ela na pele. economiza energia e dá som.', dica: 'segure a baqueta sem apertar: polegar e indicador fazem o fulcro, os outros dedos só acompanham.', see: ['toque-duplo'] },
  { id: 'independencia', t: 'independência', en: 'independence / coordination', cat: 'tecnica', d: 'cada membro fazendo uma coisa diferente sem um arrastar o outro.', dica: 'aprenda em camadas: pé, depois mão, depois junta devagar.', art: 'motor-chunking', see: ['ostinato'] },
  { id: 'virada', t: 'virada', en: 'fill', cat: 'tecnica', d: 'o "enfeite" que sai do groove pra anunciar uma parte nova da música. normalmente no último compasso antes da troca.', ex: ex(16, 90, { sn: R16([0, 1, 2, 3]), tt: R16([4, 5, 6, 7]), mt: R16([8, 9, 10, 11]), ft: R16([12, 13, 14, 15]) }), link: '#/beatlab/viradas', see: ['groove', 'forma'] },
  // dinâmica e som
  { id: 'acento', t: 'acento', en: 'accent', cat: 'som', d: 'a nota tocada mais forte que as outras (o sinal ">"). acento muda totalmente a cara de um rudimento.', ex: ex(16, 80, { sn: R16([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) }, R16([0, 4, 8, 12])), link: '#/acentuacao', see: ['ghost', 'dinamica'] },
  { id: 'ghost', t: 'nota fantasma', en: 'ghost note', cat: 'som', d: 'nota bem fraquinha na caixa, entre as fortes. quase não se ouve, mas se sente: deixa o groove "recheado". escreve-se entre parênteses.', dica: 'baqueta a 2 dedos da pele pra nota fantasma; lá de cima pro backbeat.', see: ['acento', 'dinamica'] },
  { id: 'dinamica', t: 'dinâmica', en: 'dynamics', cat: 'som', d: 'o volume da música: piano (p) é fraco, forte (f) é forte, mezzo (m) é o meio. crescendo vai aumentando, decrescendo vai diminuindo.', dica: 'toque a mesma levada em 3 volumes: ninguém pede isso e todo mundo precisa.', see: ['acento'] },
  { id: 'aro', t: 'aro (rimshot)', en: 'rimshot', cat: 'som', d: 'baqueta acertando a pele e o aro ao mesmo tempo: estalo forte e brilhante na caixa.', see: ['cross-stick'] },
  { id: 'cross-stick', t: 'baqueta deitada', en: 'cross-stick', cat: 'som', d: 'a baqueta deitada na caixa batendo só no aro: o "toc" de madeira das baladas e da bossa.', see: ['aro'] },
  { id: 'conducao', t: 'condução', en: 'ride', cat: 'som', d: 'o prato grande onde se "conduz" o ritmo em vez do chimbal. deixa a música mais aberta, comum em refrão e no jazz.', ex: ex(8, 100, { rd: R8([0, 1, 2, 3, 4, 5, 6, 7]), sn: R8([2, 6]), bd: R8([0, 4]) }), see: ['groove'] },
  // forma e estrutura
  { id: 'forma', t: 'forma', en: 'song form', cat: 'forma', d: 'o mapa da música: intro, verso, pré-refrão, refrão, ponte, final. cada parte costuma ter 4, 8 ou 16 compassos.', dica: 'monte o mapa da música antes de ensaiar: Ferramentas → Mapa da música.', link: '#/ferramentas/mapa', see: ['virada', 'convencao'] },
  { id: 'convencao', t: 'convenção', en: 'hits / kicks', cat: 'forma', d: 'aquele trecho em que a banda inteira ataca junto as mesmas notas. o baterista marca com prato e bumbo.', dica: 'anote as convenções no mapa da música pra não errar no show.', see: ['forma'] },
  { id: 'contagem-entrada', t: 'contagem de entrada', en: 'count-in', cat: 'forma', d: 'o "1, 2, 3, 4" (ou as baquetadas) que o baterista dá pra banda começar junto, já no andamento certo.', dica: 'pense o andamento antes de contar: cante o refrão por dentro e conte nele.', art: 'audiation-voluntary-musical-imagery', see: ['bpm'] },
];

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Busca sem acento no termo, no nome em inglês e na explicação (termo vem primeiro). */
export function searchTerms(q, list = TERMS) {
  const t = norm(q.trim()); if (!t) return list;
  const hit = list.filter((x) => norm(`${x.t} ${x.en || ''} ${x.d}`).includes(t));
  return hit.sort((a, b) => (norm(`${b.t} ${b.en}`).includes(t) ? 1 : 0) - (norm(`${a.t} ${a.en}`).includes(t) ? 1 : 0));
}
export const byId = (id) => TERMS.find((x) => x.id === id) || null;
