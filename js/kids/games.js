// Os jogos com fases da área Kids. Cada jogo diz como desenhar a pergunta e o que falar no acerto e no erro; o motor (engine.js) cuida do resto.
import { h } from '../util.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, later } from '../audio.js';
import { VOICE } from '../views/beatlab.js';
import { nameOf, bumboBar } from '../kids-logic.js';
import { pieceQ, pautaQ, pairName, figureQ, bumboQ, beatsLabel, hintOf, FIG_NAME } from './quiz.js';
import { ROW_NAME } from './groove.js';
import { KIT_COLORS } from './icons.js';
import { kitMarkup, staffMarkup, figureMarkup, svgEl, play, tone } from './art.js';
import { runMemory } from './memory.js';
import { runEco } from './eco.js';
import { runDetetive } from './detetive.js';
import { nameOf as instName } from './instruments.js';

const BEATS = { semibreve: 4, minima: 2, seminima: 1, colcheia: 0.5, semicolcheia: 0.25 };
const colorOf = (id) => (KIT_COLORS[id] || B.COLORS[id]);
const withColor = (q) => ({ ...q, options: q.options.map((o) => ({ ...o, color: colorOf(o.id) })) });

export const GAMES = {
  pecas: {
    id: 'pecas', title: 'Que peça é essa?', blurb: 'pelo desenho ou pelo som', emoji: '👀', ages: 'a partir de 4 anos',
    modes: [['ver', '👀 ver'], ['ouvir', '👂 ouvir']], mode: 'ver',
    makeQuestion: (rnd, d, i, { mode }) => ({ ...withColor(pieceQ(rnd, d)), mode }),
    render: (q) => h('div', { class: 'kx-q' }, svgEl(kitMarkup(q.mode === 'ver' ? q.ans : null, q.mode === 'ouvir'), 'kd-kit'),
      q.mode === 'ouvir' ? h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => play(q.ans) }, '▶ ouvir de novo') : h('p', { class: 'kd-q' }, 'qual é a peça pintada?')),
    onShow: (q) => { if (q.mode === 'ouvir') later(() => play(q.ans), 250); },
    picked: (q, id) => { if (id) play(id); },
    okText: (q) => `isso! é ${nameOf(q.ans)} ⭐`, noText: (q) => `era ${nameOf(q.ans)}`, hint: (k) => hintOf('pecas', k),
  },
  pauta: {
    id: 'pauta', title: 'Onde mora na pauta?', blurb: 'cada peça tem a sua casinha', emoji: '🎼', ages: 'a partir de 7 anos',
    modes: [['nomes', '🔤 com nomes'], ['desenho', '🖼 com desenho']], mode: 'nomes',
    makeQuestion: (rnd, d, i, { mode }) => ({ ...withColor(pautaQ(rnd, d)), mode }),
    // com desenho: as respostas são a bateria pintada (pra quem ainda não lê os nomes das peças)
    optionLabel: (q, o) => (q.mode === 'desenho' ? h('span', { class: 'kx-opt-kit', 'aria-label': o.label }, svgEl(kitMarkup(null, false, o.id), 'kx-kit-op')) : o.label),
    render: (q) => h('div', { class: 'kx-q' }, svgEl(staffMarkup(q.ids), 'kd-staff'), h('p', { class: 'kd-q' }, q.ids.length > 1 ? 'quem toca nessas duas casinhas juntas?' : 'quem mora nessa casinha?')),
    picked: (q, id) => { if (id) String(id).split('+').forEach((x) => play(x)); },
    okText: (q) => `isso! ${pairName(q.ans)} ⭐`, noText: (q) => (q.ids.length > 1 ? `eram ${pairName(q.ans)} juntos` : `essa casinha é do ${nameOf(q.ans)}`), hint: (k) => hintOf('pauta', k),
  },
  figuras: {
    id: 'figuras', title: 'Figuras rítmicas', blurb: 'semibreve, mínima, semínima…', emoji: '⏳', ages: 'a partir de 6 anos',
    makeQuestion: (rnd, d) => figureQ(rnd, d),
    render: (q) => {
      if (q.kind === 'dura') return h('div', { class: 'kx-q' }, h('p', { class: 'kd-q' }, 'qual dura mais tempo? (toca pra ouvir)'));
      return h('div', { class: 'kx-q' }, svgEl(figureMarkup(q.fig), 'kd-fig-svg kx-bigfig'), h('p', { class: 'kd-q' }, q.kind === 'tempos' ? `quantos tempos dura a ${FIG_NAME[q.fig]}?` : 'qual é o nome dessa figura?'));
    },
    // comparar: os botões são as próprias figuras (tocam o som da duração ao escolher)
    optionLabel: (q, o) => (q.kind === 'dura' ? svgEl(figureMarkup(o.id), 'kd-fig-svg kx-opt-fig') : o.label),
    picked: (q, id) => { if (q.kind === 'dura' && id) tone(BEATS[id]); },
    okText: (q) => (q.kind === 'dura' ? `isso! ${FIG_NAME[q.ans]} dura mais ⭐` : q.kind === 'tempos' ? 'isso! ⭐' : `isso! é ${FIG_NAME[q.ans]} ⭐`),
    noText: (q) => (q.kind === 'dura' ? `a ${FIG_NAME[q.ans]} dura mais!` : q.kind === 'tempos' ? `dura ${beatsLabel(Number(q.ans))}` : `era ${FIG_NAME[q.ans]}`),
    hint: (k) => hintOf('figuras', k),
  },
  bumbos: {
    id: 'bumbos', title: 'Quantos bumbos?', blurb: 'escuta e conta', emoji: '👂', ages: 'a partir de 5 anos',
    makeQuestion: (rnd, d) => bumboQ(rnd, d),
    render: (q) => h('div', { class: 'kx-q' }, h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playBumbos(q) }, '▶ ouvir de novo'), h('p', { class: 'kd-q' }, 'quantos bumbos tem em cada compasso?')),
    onShow: (q) => later(() => playBumbos(q), 250),
    okText: (q) => `isso! ${q.n} bumbo${q.n > 1 ? 's' : ''} ⭐`, noText: (q) => `eram ${q.n} bumbo${q.n > 1 ? 's' : ''}!`, hint: (k) => hintOf('bumbos', k),
  },
};
function playBumbos(q) {
  const bar = bumboBar(q.n); const c = audio(); const dt = 60 / q.bpm / 2; const t0 = c.currentTime + 0.15;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) for (const p of ['hh', 'sn', 'bd']) if (bar.rows[p][i]) VOICE[p](t0 + (r * 8 + i) * dt, p === 'hh' ? 0.6 : 1);
}
GAMES.memoria = { id: 'memoria', title: 'Memória dos instrumentos', blurb: 'som + imagem ou imagem + imagem', emoji: '🧠', ages: 'a partir de 4 anos',
  modes: [['som', '🔊 som + imagem'], ['imagem', '🖼 imagem + imagem']], mode: 'som', run: runMemory, hint: (k) => `treinar: ${instName(k)}` };
GAMES.detetive = { id: 'detetive', title: 'Detetive do groove', blurb: 'clica, escreve e toca o groove', emoji: '🕵️', ages: 'a partir de 7 anos', run: runDetetive, hint: (k) => `treinar: ouvir o ${ROW_NAME[k] || k}` };
GAMES.eco = { id: 'eco', title: 'Eco rítmico', blurb: 'ouve e repete na tela ou no seu pad / bateria (o microfone escuta)', emoji: '📣', ages: 'a partir de 5 anos', modes: [['tela', '📱 na tela'], ['mic', '🎙 pad de estudo ou bateria de verdade']], mode: 'tela', run: runEco,
  hint: (k) => (k === 'figuras' ? 'repetir os ritmos com pão, bo-lo e cho-co-la-te' : 'repetir ritmos com contratempo') };
export const ORDER = ['pauta', 'figuras', 'eco']; // a memória virou jogo livre (sem fases); peças, bumbos e detetive saíram da lista // peças, bumbos e detetive saíram da lista (o código e o progresso ficam guardados)
