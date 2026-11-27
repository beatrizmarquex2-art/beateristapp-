// Exercícios iniciais do banco do PRO (revisáveis e editáveis pela Bea no painel). Os dados são partituras no mesmo formato dos editores.
// Usado pelo botão "Carregar exercícios iniciais" do painel e testado em tests/pro-banco.test.mjs.
import * as T from './teoria.js';

export function exerciciosIniciais() {
const bat = (evs, bpm, kit = 'medio') => ({ versao: 2, tipo: 'bateria', inst: 'bateria', escrita: 'pauta', kit, evs, bpm });
const cord = (inst, ncord, evs, bpm) => ({ versao: 2, tipo: 'tab', inst, ncord, escrita: 'tab', evs, bpm });
const tec = (evs, bpm) => ({ versao: 1, evs, bpm, grade: 2, clave: 'sol', cor: true });
const ex = [];
const add = (titulo, instrumento, nivel, categoria, descricao, dados, bpm, ordem) => ex.push({ titulo, instrumento, nivel, categoria, descricao, dados, bpm, ordem });

/* ---------- bateria ---------- */
const hhOito = Array.from({ length: 8 }, (_, k) => ({ p: 'hh', ini: k * 2, d: 2, mao: 'D' }));
add('Groove de rock básico', 'bateria', 'iniciante', 'Grooves', 'Chimbal em colcheias, bumbo no 1 e no 3, caixa no 2 e no 4. Conte "1 e 2 e 3 e 4 e" em voz alta. Comece devagar (70 a 80) e só suba o andamento quando as três peças saírem juntas e no mesmo lugar.', bat([...hhOito, { p: 'bd', ini: 0, d: 2, mao: '' }, { p: 'bd', ini: 8, d: 2, mao: '' }, { p: 'sn', ini: 4, d: 2, mao: 'E' }, { p: 'sn', ini: 12, d: 2, mao: 'E' }], 80), 80, 10);
add('Groove com bumbo extra', 'bateria', 'iniciante', 'Grooves', 'O mesmo groove de rock, com um bumbo a mais no "e" do 2 e outro no 3. O pé tem que ficar solto: o chimbal não pode atrasar nem acelerar quando o bumbo entra.', bat([...hhOito, ...[0, 6, 8].map((i) => ({ p: 'bd', ini: i, d: 2, mao: '' })), { p: 'sn', ini: 4, d: 2, mao: 'E' }, { p: 'sn', ini: 12, d: 2, mao: 'E' }], 80), 80, 20);
add('Groove com notas fantasma', 'bateria', 'intermediario', 'Grooves', 'Caixa forte (acento) no 2 e no 4 e caixa bem baixinha (fantasma, entre parênteses) nos "e" antes dela. A mão da caixa sobe pouco nas fantasmas e bastante nos acentos.', bat([...hhOito, { p: 'bd', ini: 0, d: 2, mao: '' }, { p: 'bd', ini: 8, d: 2, mao: '' }, { p: 'sn', ini: 3, d: 1, mao: 'E', fan: true }, { p: 'sn', ini: 4, d: 2, mao: 'E', acc: true }, { p: 'sn', ini: 11, d: 1, mao: 'E', fan: true }, { p: 'sn', ini: 12, d: 2, mao: 'E', acc: true }], 70), 70, 30);
const mao = (padrao) => padrao.split('').map((m, k) => ({ p: 'sn', ini: k, d: 1, mao: m }));
add('Rulo simples (D E D E)', 'bateria', 'iniciante', 'Rudimentos', 'Mãos alternadas, uma batida por mão, só na caixa. Mantenha as duas mãos com a mesma altura e a mesma força. Comece a 60 e vá subindo de 5 em 5.', bat(mao('DEDEDEDEDEDEDEDE'), 60, 'simples'), 60, 40);
add('Rulo duplo (D D E E)', 'bateria', 'intermediario', 'Rudimentos', 'Duas batidas com cada mão (D D E E). A segunda batida de cada par é a que mais cai de volume: deixe a baqueta quicar. Devagar primeiro.', bat(mao('DDEEDDEEDDEEDDEE'), 60, 'simples'), 60, 50);
add('Paradiddle (D E D D  E D E E)', 'bateria', 'intermediario', 'Rudimentos', 'O rudimento mais útil pra viradas: D E D D, E D E E. A mão que começa troca a cada grupo. Acentue a primeira de cada grupo de quatro.', bat(mao('DEDDEDEE'.repeat(2)).map((e, k) => ({ ...e, acc: k % 4 === 0 })), 60, 'simples'), 60, 60);

/* ---------- violão ---------- */
const prog = (nomes, batida, bpm) => { let evs = []; nomes.forEach((id, k) => { evs = evs.concat(T.batidaEmEventos(T.acharAcorde(id), batida, k * 16, 2, 6)); }); return cord('violao', 6, evs, bpm); };
add('Dó – Sol – Lá menor – Fá (batida pop)', 'violao', 'iniciante', 'Acordes e batidas', 'A progressão mais tocada do mundo, um compasso pra cada acorde. Batida: baixo, (segura), baixo, cima, (segura), cima, baixo, cima. Primeiro só troque de acorde sem tocar; depois com a batida devagar.', prog(['0M', '7M', '9m', '5M'], T.BATIDAS[0][2], 80), 80, 10);
add('Lá menor – Sol – Fá – Mi (balada)', 'violao', 'iniciante', 'Acordes e batidas', 'Progressão descendente, muito usada em baladas. Batida de balada: baixo, (segura), baixo, (segura), baixo, cima, baixo, cima.', prog(['9m', '7M', '5M', '4M'], T.BATIDAS[3][2], 72), 72, 20);
const nota = (c, f, ini, d = 2) => ({ c, f, ini, d });
add('Escala de Dó maior no braço', 'violao', 'iniciante', 'Escalas', 'Dó ré mi fá sol lá si dó em uma oitava, na posição aberta. Use um dedo por casa e toque alternando palheta pra baixo e pra cima. Cante os nomes das notas enquanto toca.', cord('violao', 6, [nota(4, 3, 0), nota(3, 0, 2), nota(3, 2, 4), nota(3, 3, 6), nota(2, 0, 8), nota(2, 2, 10), nota(1, 0, 12), nota(1, 1, 14)], 80), 80, 30);
add('Pentatônica menor de Lá (1ª posição)', 'violao', 'intermediario', 'Escalas', 'A escala do blues e do rock: Lá, Dó, Ré, Mi, Sol. Começa na casa 5 da corda mais grave. Quase não existe nota "errada" nela, então é ótima pra improvisar em cima de uma base em Lá menor.', cord('violao', 6, [nota(5, 5, 0), nota(5, 8, 2), nota(4, 5, 4), nota(4, 7, 6), nota(3, 5, 8), nota(3, 7, 10), nota(2, 5, 12), nota(2, 7, 14), nota(1, 5, 16), nota(1, 8, 18), nota(0, 5, 20), nota(0, 8, 22)], 70), 70, 40);

/* ---------- baixo ---------- */
add('Raízes: Dó – Sol – Lá – Fá', 'baixo', 'iniciante', 'Linhas de baixo', 'Só a nota fundamental de cada acorde, uma por tempo, durante um compasso inteiro. Use o dedo indicador e o médio alternando. O mais importante é a regularidade.', cord('baixo', 4, [0, 1, 2, 3].flatMap((k) => { const [c, f] = [[2, 3], [3, 3], [2, 0], [3, 1]][k]; return [0, 4, 8, 12].map((t) => nota(c, f, k * 16 + t, 4)); }), 80), 80, 10);

/* ---------- teclado ---------- */
const mel = (ms, d = 4) => ms.map((m, k) => ({ m, ini: k * d, d }));
add('Escala de Dó maior (mão direita)', 'teclas', 'iniciante', 'Escalas', 'Dó ré mi fá sol lá si dó, uma oitava. Polegar no dó, e passe o polegar por baixo da mão depois do mi. Notas coloridas: cada uma com a sua cor do jogo.', tec(mel([60, 62, 64, 65, 67, 69, 71, 72]), 80), 80, 10);
add('Brilha, brilha, estrelinha', 'teclas', 'iniciante', 'Melodias', 'Melodia de domínio público, só com cinco notas diferentes. Toque devagar e cante a letra por cima. Depois tente tocar a mesma melodia começando em outra nota.', tec([60, 60, 67, 67, 69, 69].map((m, k) => ({ m, ini: k * 4, d: 4 })).concat([{ m: 67, ini: 24, d: 8 }]).concat([65, 65, 64, 64, 62, 62].map((m, k) => ({ m, ini: 32 + k * 4, d: 4 }))).concat([{ m: 60, ini: 56, d: 8 }]), 90), 90, 20);
add('Ode à Alegria', 'teclas', 'iniciante', 'Melodias', 'Melodia de Beethoven (domínio público) em dó maior, com mão direita só. Tem notas repetidas e movimentos de grau conjunto: ideal pra treinar a conduzir os dedos sem pular.', tec([64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64].map((m, k) => ({ m, ini: k * 4, d: 4 })).concat([{ m: 64, ini: 48, d: 6 }, { m: 62, ini: 54, d: 2 }, { m: 62, ini: 56, d: 8 }]), 90), 90, 30);

/* ---------- gerais (sem partitura) ---------- */
add('Aquecimento de 5 minutos', 'geral', 'iniciante', 'Rotina de estudo', 'Antes de qualquer exercício: 1 min soltando mãos e ombros, 2 min de movimentos lentos e regulares no instrumento (escala, rulo ou uma nota só), 2 min do mesmo movimento, mais rápido, sem tensão. Se algo doer, pare.', {}, null, 10);
add('Estudar com metrônomo: sobe 5 por vez', 'geral', 'iniciante', 'Rotina de estudo', 'Escolha um trecho curto e toque 4 vezes seguidas sem errar no andamento que você consegue. Só então suba 5 bpm. Errou? Volta 5 e recomeça. É o jeito mais seguro de ganhar velocidade sem criar vício.', {}, null, 20);

  return ex;
}
