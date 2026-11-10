// Aulas do Paul: bateria, teclado e violão. Cada aula tem passos curtos (fala do Paul + algo pra ouvir) e termina levando pra aba Tocar.
// Os sons são sintetizados (sem amostras). Sem código só os primeiros passos de cada aula abrem (GRATIS.aulinha), como na aulinha das figuras.
import { h } from '../util.js';
import { audio, click, kick, snare, hihat } from '../audio.js';
import { epiano, guitar } from '../synth.js';
import { session } from '../session.js';
import { robo } from './robo.js';
import { alunoSemCodigo, GRATIS, avisoCodigo } from '../amostra.js';

const t0now = () => audio().currentTime + 0.12;
const ouvir = (txt, fn, cls = 'kd-btn') => h('button', { type: 'button', class: cls, onclick: () => fn(t0now()) }, txt);

// ---- bateria ----
const LEVADA = { // 8 colcheias por compasso: 1 e 2 e 3 e 4 e
  chimbal: [1, 1, 1, 1, 1, 1, 1, 1], caixa: [0, 0, 1, 0, 0, 0, 1, 0], bumbo: [1, 0, 0, 0, 1, 0, 0, 0],
};
const levadaGrade = () => h('table', { class: 'ap-grade', 'aria-label': 'levada de rock: chimbal em todas, caixa no 2 e no 4, bumbo no 1 e no 3' },
  h('thead', {}, h('tr', {}, h('th', {}), ...['1', 'e', '2', 'e', '3', 'e', '4', 'e'].map((x) => h('th', {}, x)))),
  h('tbody', {}, ...Object.entries(LEVADA).map(([k, v]) => h('tr', {}, h('th', {}, k), ...v.map((x) => h('td', { class: x ? 'on' : '' }, x ? '●' : ''))))));
function tocaLevada(t, bpm = 80, comp = 2) {
  const q = 60 / bpm / 2;
  for (let c = 0; c < comp; c++) for (let i = 0; i < 8; i++) {
    const tt = t + (c * 8 + i) * q;
    hihat(tt, 0.6); if (LEVADA.caixa[i]) snare(tt, 0.9); if (LEVADA.bumbo[i]) kick(tt, 0.9);
  }
}
const bateria = [
  { mood: 'wave', say: 'oi! hoje a gente conhece as 3 peças principais da bateria. toca em cada uma pra ouvir!', make: () => h('div', { class: 'au-box' },
    h('div', { class: 'ap-pecas' },
      h('div', {}, ouvir('bumbo', (t) => kick(t, 1)), h('small', {}, 'o grave, tocado com o pé direito. marca o chão do ritmo.')),
      h('div', {}, ouvir('caixa', (t) => snare(t, 1)), h('small', {}, 'o som seco do meio, tocado com a baqueta. marca o 2 e o 4.')),
      h('div', {}, ouvir('chimbal', (t) => hihat(t, 0.9), 'kd-btn'), h('small', {}, 'o “relógio” do groove: dois pratinhos que fecham.')))) },
  { mood: 'point', say: 'antes de tocar, a gente conta. quatro tempos formam um compasso: 1, 2, 3, 4. ouve o pulso!', make: () => h('div', { class: 'au-box' },
    h('p', {}, 'o primeiro clique é mais forte. tenta bater palmas junto.'),
    ouvir('ouvir 1 compasso', (t) => { for (let i = 0; i < 4; i++) click(t + i * 0.75, i === 0 ? 2 : 1, 0.6); })) },
  { mood: 'music', say: 'a levada mais famosa do rock! o chimbal toca sempre, a caixa no 2 e no 4 e o bumbo no 1 e no 3.', make: () => h('div', { class: 'au-box' }, levadaGrade(),
    h('div', { class: 'row' }, ouvir('ouvir devagar (60)', (t) => tocaLevada(t, 60)), ouvir('ouvir no ritmo (90)', (t) => tocaLevada(t, 90), 'kd-chip'))) },
  { mood: 'cool', say: 'a postura é metade do som: costas retas, ombros soltos e os pés apoiados. banco numa altura em que as coxas ficam um pouco inclinadas pra baixo.', make: () => h('div', { class: 'au-box' },
    h('ul', { class: 'ap-lista' }, h('li', {}, 'a baqueta fica entre o polegar e o indicador, mais ou menos a 1/3 do final dela'), h('li', {}, 'os outros dedos envolvem sem apertar'), h('li', {}, 'o pulso é solto: deixe a baqueta quicar na pele'))) },
  { mood: 'idea', say: 'o segredo da caixa é o rebote: bate no meio da pele e deixa a baqueta voltar sozinha. sem força!', make: () => h('div', { class: 'au-box' },
    h('p', {}, 'ouve a diferença entre um toque seco e um toque com notas “fantasma” bem fraquinhas entre as fortes.'),
    h('div', { class: 'row' }, ouvir('toque forte', (t) => { for (let i = 0; i < 4; i++) snare(t + i * 0.5, 1); }), ouvir('com fantasma', (t) => { for (let i = 0; i < 4; i++) { snare(t + i * 0.5, 1); snare(t + i * 0.5 + 0.25, 0.25); } }, 'kd-chip'))) },
  { mood: 'cheer', say: 'agora é com você! toca a levada devagar, 4 compassos seguidos, no andamento 60. depois vai pro Toca Aqui e pra aba Tocar!', make: () => h('div', { class: 'au-box au-center' },
    ouvir('ouvir o exemplo (4 compassos)', (t) => tocaLevada(t, 60, 4)),
    h('a', { class: 'kd-btn', href: '#/toque' }, 'tocar bateria'), h('a', { class: 'kd-chip', href: '#/jogos/toca' }, 'Toca Aqui')) },
];

// ---- teclado ----
const NOMES = ['dó', 'ré', 'mi', 'fá', 'sol', 'lá', 'si'];
const BRANCAS = [60, 62, 64, 65, 67, 69, 71, 72];
const PRETAS = [[61, 1], [63, 2], [66, 4], [68, 5], [70, 6]]; // [nota, posição (entre quais brancas)]
const tecla = (m, t = t0now()) => epiano(t, [m], 0.9, 1);
function teclado({ rotulos = false, ativas = [] } = {}) {
  const w = 40; const el = h('div', { class: 'ap-teclado', style: `width:${w * 8}px` });
  BRANCAS.forEach((m, i) => el.append(h('button', { type: 'button', class: `ap-tb${ativas.includes(m) ? ' on' : ''}`, style: `left:${i * w}px;width:${w}px`, 'aria-label': `tecla ${m === 72 ? 'dó' : NOMES[i]}`, onclick: () => tecla(m) }, rotulos ? (m === 72 ? 'dó' : NOMES[i]) : '')));
  PRETAS.forEach(([m, p]) => el.append(h('button', { type: 'button', class: `ap-tp${ativas.includes(m) ? ' on' : ''}`, style: `left:${p * w - 12}px`, 'aria-label': 'tecla preta', onclick: () => tecla(m) })));
  return el;
}
const teclas = [
  { mood: 'wave', say: 'oi! o teclado tem teclas brancas e pretas. toca nelas pra ouvir: quanto mais pra direita, mais agudo!', make: () => h('div', { class: 'au-box' }, h('div', { class: 'ap-scroll' }, teclado()),
    h('p', {}, 'as pretas aparecem em grupos de 2 e de 3. isso ajuda você a não se perder.')) },
  { mood: 'point', say: 'o dó é sempre a tecla branca que fica antes do grupo de 2 pretas. as 7 notas se repetem: dó ré mi fá sol lá si.', make: () => h('div', { class: 'au-box' }, h('div', { class: 'ap-scroll' }, teclado({ rotulos: true })),
    ouvir('ouvir as notas subindo', (t) => BRANCAS.forEach((m, i) => epiano(t + i * 0.45, [m], 0.5, 1)))) },
  { mood: 'idea', say: 'a escala de dó maior usa só as teclas brancas, de dó até o dó de cima. na mão direita: 1 2 3, passa o polegar, 1 2 3 4 5!', make: () => h('div', { class: 'au-box' },
    h('p', { class: 'ap-dedos' }, 'dedos (mão direita): 1 · 2 · 3 · 1 · 2 · 3 · 4 · 5'), h('div', { class: 'ap-scroll' }, teclado({ rotulos: true })),
    ouvir('ouvir a escala', (t) => BRANCAS.forEach((m, i) => epiano(t + i * 0.4, [m], 0.45, 1)))) },
  { mood: 'music', say: 'um acorde é um grupo de notas tocadas juntas. o de dó maior é dó, mi e sol: pula uma tecla branca, toca a próxima, pula de novo!', make: () => h('div', { class: 'au-box' }, h('div', { class: 'ap-scroll' }, teclado({ rotulos: true, ativas: [60, 64, 67] })),
    ouvir('ouvir dó, mi e sol juntos', (t) => epiano(t, [60, 64, 67], 1.4, 1))) },
  { mood: 'cool', say: 'com 3 acordes já dá pra tocar muita música: dó, fá e sol. ouve a sequência dó · fá · sol · dó!', make: () => h('div', { class: 'au-box' },
    h('ul', { class: 'ap-lista' }, h('li', {}, 'dó: dó · mi · sol'), h('li', {}, 'fá: fá · lá · dó'), h('li', {}, 'sol: sol · si · ré')),
    ouvir('ouvir a sequência', (t) => [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]].forEach((a, i) => epiano(t + i * 1.1, a, 1.0, 1)))) },
  { mood: 'cheer', say: 'agora é com você! vai pro piano da aba Tocar, acha o dó e toca a escala devagar. depois o acorde de dó!', make: () => h('div', { class: 'au-box au-center' }, h('a', { class: 'kd-btn', href: '#/piano' }, 'tocar piano'), h('a', { class: 'kd-chip', href: '#/xilofone' }, 'xilofone')) },
];

// ---- violão ----
const CORDAS = [['mi', 40], ['lá', 45], ['ré', 50], ['sol', 55], ['si', 59], ['mi agudo', 64]]; // da mais grossa (6ª) à mais fina (1ª)
const corda = (m, t) => guitar(t, [m + 12], 1.1, 1); // guitar() toca uma oitava abaixo do que se pede
const violao = [
  { mood: 'wave', say: 'oi! o violão tem 6 cordas. da mais grossa (grave) pra mais fina (aguda): mi, lá, ré, sol, si, mi. toca cada uma!', make: () => h('div', { class: 'au-box' },
    h('div', { class: 'ap-cordas' }, ...CORDAS.map(([n, m], i) => h('button', { type: 'button', class: 'kd-chip', onclick: () => corda(m, t0now()) }, `${6 - i}ª · ${n}`))),
    ouvir('ouvir todas, da grave pra aguda', (t) => CORDAS.forEach(([, m], i) => corda(m, t + i * 0.4)))) },
  { mood: 'point', say: 'a mão esquerda aperta as cordas no braço, perto do traste (a barrinha de metal), com a ponta dos dedos. cada dedo tem um número: indicador 1, médio 2, anelar 3 e mindinho 4.', make: () => h('div', { class: 'au-box' },
    h('ul', { class: 'ap-lista' }, h('li', {}, 'aperte com a ponta do dedo, não com a barriga'), h('li', {}, 'o polegar fica atrás do braço, fazendo apoio'), h('li', {}, 'se a corda “chia”, aperte mais perto do traste'))) },
  { mood: 'music', say: 'o primeiro acorde é o mi menor (Em): dedo 2 na casa 2 da corda lá e dedo 3 na casa 2 da corda ré. as outras cordas soltas!', make: () => h('div', { class: 'au-box' },
    h('p', {}, 'toca as 6 cordas: tem um som mais “triste”, de acorde menor.'),
    ouvir('ouvir o Em', (t) => [40, 47, 52, 55, 59, 64].forEach((m, i) => corda(m, t + i * 0.04)))) },
  { mood: 'cool', say: 'a mão direita faz a batida: pra baixo ↓ e pra cima ↑. uma batida bem conhecida é ↓ ↓↑ ↑↓↑. conta junto: 1, 2 e, e 4 e!', make: () => h('div', { class: 'au-box' },
    h('p', { class: 'ap-dedos' }, '↓   ↓ ↑   ↑ ↓ ↑'),
    ouvir('ouvir a batida no Em', (t) => { [0, 0.5, 0.75, 1.25, 1.5, 1.75].forEach((o, i) => [40, 47, 52, 55, 59, 64].forEach((m, k) => corda(m, t + o + k * 0.012 * (i % 3 === 1 ? -1 : 1) + 0.1))); })) },
  { mood: 'cheer', say: 'agora é com você! no violão da aba Tocar escolhe o acorde e passa o dedo nas cordas. depois treina a batida devagar!', make: () => h('div', { class: 'au-box au-center' }, h('a', { class: 'kd-btn', href: '#/violao' }, 'tocar violão')) },
];

export const AULAS = {
  bateria: { titulo: 'Bateria', sub: 'as peças, a levada de rock e a postura', passos: bateria, tempo: '10 min' },
  teclado: { titulo: 'Teclado', sub: 'teclas, notas, escala e acordes', passos: teclas, tempo: '10 min' },
  violao: { titulo: 'Violão', sub: 'cordas, acorde e batida', passos: violao, tempo: '8 min' },
};

/** Monta uma aula no `host`. `onPasso(i)` avisa cada passo visto (pra meta do dia). Devolve a função de limpeza. */
export function montarAula(host, id, { onPasso } = {}) {
  const A = AULAS[id]; if (!A) return () => {};
  const S = session(); let step = 0; const bot = robo({ mood: 'wave', size: 92 });
  const say = h('p', { class: 'au-say', 'aria-live': 'polite' }); const body = h('div', { class: 'au-body' }); const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' });
  const btn = (t, fn, cls = 'kd-btn') => h('button', { type: 'button', class: cls, onclick: fn }, t);
  const draw = () => {
    const trancada = alunoSemCodigo() && step >= GRATIS.aulinha;
    S.reset(); const s = A.passos[step]; bot.set(trancada ? 'wave' : s.mood, ''); say.textContent = trancada ? 'você quer exercícios e imprimir atividades? acesse a lojinha!' : s.say;
    if (!trancada && onPasso) onPasso(step);
    dots.replaceChildren(...A.passos.map((_, k) => h('i', { class: k < step ? 'done' : k === step ? 'now' : '' })));
    body.replaceChildren(trancada ? avisoCodigo(`a aula de ${A.titulo.toLowerCase()} tem ${A.passos.length} passos e os ${GRATIS.aulinha} primeiros são de graça. pra continuar, acesse a lojinha!`, 'acessar a lojinha') : s.make(), h('div', { class: 'row kx-act au-nav' },
      step > 0 ? btn('‹ voltar', () => { step--; draw(); }, 'kd-chip') : null,
      step < A.passos.length - 1 && !trancada ? btn('próximo ›', () => { step++; draw(); }, 'kd-btn') : null));
  };
  host.append(h('div', { class: 'au' }, h('div', { class: 'au-top' }, bot.el, h('div', { class: 'au-bubble' }, say)), dots, body));
  draw();
  return () => S.dispose();
}
