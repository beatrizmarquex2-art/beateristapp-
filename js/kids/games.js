// Os jogos com fases da área Kids. Cada jogo diz como desenhar a pergunta e o que falar no acerto e no erro; o motor (engine.js) cuida do resto.
import { h } from '../util.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { audio, later } from '../audio.js';
import { VOICE } from '../views/beatlab.js';
import { nameOf, bumboBar } from '../kids-logic.js';
import { pieceQ, pautaQ, pairName, figureQ, bumboQ, hintOf } from './quiz.js';
import { FIGS, FIG_NAME, FIG_BY, GROUPS, VAR_BY, beatsLabel, specOf, contaOf } from './figs.js';
import { layoutRhythm } from '../reading.js';
import { click } from '../audio.js';
import { ROW_NAME } from './groove.js';
import { KIT_COLORS } from './icons.js';
import { kitMarkup, staffMarkup, figureMarkup, noteMarkup, restMarkup, groupMarkup, svgEl, play, tone } from './art.js';
import { runMemory } from './memory.js';
import { runEco } from './eco.js';
import { runToque } from './toque.js';
import { runDetetive } from './detetive.js';
import { nameOf as instName } from './instruments.js';

const BEATS = Object.fromEntries(FIGS.map((f) => [f.id, f.beats]));
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
    id: 'figuras', title: 'Figuras rítmicas', blurb: 'quanto vale, desenho, pausas, tercina…', emoji: '⏳', ages: 'a partir de 6 anos',
    makeQuestion: (rnd, d) => figureQ(rnd, d),
    say: (q) => ({ dura: 'qual vale mais?', tempos: 'quanto vale?', nome: 'quem é?', desenho: 'qual é o desenho?', montar: 'qual está montado certinho?', pausa: 'e o silêncio?', pausaValor: 'quanto dura o silêncio?', grupo: 'quantas notas cabem?', grupoN: 'quantas notas?' }[q.kind] || 'qual será?'),
    render: (q) => {
      const big = (m) => svgEl(m, 'kd-fig-svg kx-bigfig');
      switch (q.kind) {
        case 'dura': return h('div', { class: 'kx-q' }, h('p', { class: 'kd-q' }, 'qual vale mais tempo? (toca pra ouvir)'));
        case 'tempos': return h('div', { class: 'kx-q' }, big(figureMarkup(q.fig)), h('p', { class: 'kd-q' }, `quanto vale a ${FIG_NAME[q.fig]}?`));
        case 'nome': return h('div', { class: 'kx-q' }, big(figureMarkup(q.fig)), h('p', { class: 'kd-q' }, 'qual é o nome dessa figura?'));
        case 'desenho': return h('div', { class: 'kx-q' }, h('p', { class: 'kd-q' }, `qual é o desenho da ${FIG_NAME[q.fig]}?`));
        case 'montar': return h('div', { class: 'kx-q' }, h('p', { class: 'kd-q' }, `qual desenho está montado certinho para a ${FIG_NAME[q.fig]}?`), h('p', { class: 'muted' }, 'olha a cabeça (vazia ou cheia), a haste e as bandeirinhas.'));
        case 'pausa': return h('div', { class: 'kx-q' }, big(restMarkup(q.fig)), h('p', { class: 'kd-q' }, 'qual é o nome dessa pausa?'));
        case 'pausaValor': return h('div', { class: 'kx-q' }, big(restMarkup(q.fig)), h('p', { class: 'kd-q' }, `quanto tempo de silêncio vale a pausa de ${FIG_NAME[q.fig]}?`));
        case 'variacao': return h('div', { class: 'kx-q' }, svgEl(N.toSVG(layoutRhythm([q.cell], { width: 220, count: true, clef: false })), 'kd-score'), h('p', { class: 'kd-q' }, 'como se chama esse tempo?'));
        case 'variacaoSom': return h('div', { class: 'kx-q' }, h('button', { class: 'kd-btn kd-listen', type: 'button', onclick: () => playCell(q.cell) }, '▶ ouvir de novo'), h('p', { class: 'kd-q' }, 'qual é o ritmo que você ouviu?'));
        case 'grupo': return h('div', { class: 'kx-q' }, big(groupMarkup(q.group)), h('p', { class: 'kd-q' }, 'que grupo de notas é esse?'));
        default: return h('div', { class: 'kx-q' }, big(groupMarkup(q.group)), h('p', { class: 'kd-q' }, `quantas notas tem a ${GROUPS.find((x) => x.id === q.group).name}?`));
      }
    },
    // comparar e desenhar: os botões são os próprios desenhos (comparar também toca a duração ao escolher)
    onShow: (q) => { if (q.kind === 'variacaoSom') later(() => playCell(q.cell), 250); },
    optionLabel: (q, o) => (q.kind === 'variacaoSom' ? svgEl(N.toSVG(layoutRhythm([VAR_BY[o.id].p], { width: 120, count: false, clef: false })), 'kd-score kx-opt-cell') : q.kind === 'dura' || q.kind === 'desenho' ? svgEl(figureMarkup(o.id), 'kd-fig-svg kx-opt-fig') : q.kind === 'montar' ? svgEl(noteMarkup(specOf(o.id), 'desenho montado'), 'kd-fig-svg kx-opt-fig') : o.label),
    picked: (q, id) => { if (q.kind === 'dura' && id) tone(BEATS[id]); },
    okText: (q) => { const f = FIG_BY[q.fig]; switch (q.kind) {
      case 'dura': return `isso! ${FIG_NAME[q.ans]} dura mais ⭐`; case 'tempos': return `isso! ${f.name} = ${beatsLabel(f.beats)} ⭐`; case 'nome': return `isso! é ${FIG_NAME[q.ans]} ⭐`;
      case 'montar': return 'isso! montou certinho ⭐'; case 'variacao': case 'variacaoSom': return `isso! ${contaOf(VAR_BY[q.ans].p)} ⭐`; case 'pausa': return `isso! pausa de ${FIG_NAME[q.ans]} ⭐`; case 'pausaValor': return `isso! silêncio de ${beatsLabel(f.beats)} ⭐`; default: return 'isso! ⭐'; } },
    noText: (q) => { const f = FIG_BY[q.fig];
      switch (q.kind) {
        case 'dura': return `a ${FIG_NAME[q.ans]} dura mais!`;
        case 'tempos': case 'pausaValor': return `vale ${beatsLabel(Number(q.ans))}`;
        case 'montar': return `a ${f.name} tem ${f.open ? 'cabeça vazia' : 'cabeça cheia'}, ${f.stem ? 'haste' : 'sem haste'}${f.flags ? ` e ${f.flags} bandeirinha${f.flags > 1 ? 's' : ''}` : ''}`;
        case 'grupo': return `era ${q.ans === 'tercina' ? 'a tercina (3 notas)' : q.ans === 'sextina' ? 'a sextina (6 notas)' : 'outro grupo'}`;
        case 'grupoN': return `são ${q.ans} notas`;
        case 'variacao': case 'variacaoSom': return `era ${VAR_BY[q.ans].name} (${contaOf(VAR_BY[q.ans].p)})`;
        default: return `era ${FIG_NAME[q.ans]}`;
      } },
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
/** Toca a variação (1 tempo) duas vezes a 80 BPM, com o pulso por baixo. */
function playCell(p) { const c = audio(); const q = 60 / 80; const t0 = c.currentTime + 0.1; for (let b = 0; b < 2; b++) { click(t0 + b * q, b === 0 ? 2 : 1, 0.4); [...p].forEach((x, k) => { if (x === '1') VOICE.sn(t0 + b * q + (k * q) / 4, 0.85); }); } }
function playBumbos(q) {
  const bar = bumboBar(q.n); const c = audio(); const dt = 60 / q.bpm / 2; const t0 = c.currentTime + 0.15;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) for (const p of ['hh', 'sn', 'bd']) if (bar.rows[p][i]) VOICE[p](t0 + (r * 8 + i) * dt, p === 'hh' ? 0.6 : 1);
}
GAMES.memoria = { id: 'memoria', title: 'Memória dos instrumentos', blurb: 'som + imagem ou imagem + imagem', emoji: '🧠', ages: 'a partir de 4 anos',
  modes: [['som', '🔊 som + imagem'], ['imagem', '🖼 imagem + imagem']], mode: 'som', run: runMemory, hint: (k) => `treinar: ${instName(k)}` };
GAMES.detetive = { id: 'detetive', title: 'Detetive do groove', blurb: 'clica, escreve e toca o groove', emoji: '🕵️', ages: 'a partir de 7 anos', run: runDetetive, hint: (k) => `treinar: ouvir o ${ROW_NAME[k] || k}` };
GAMES.eco = { id: 'eco', title: 'Eco rítmico', blurb: 'ouve e repete na tela ou no seu pad / bateria (o microfone escuta)', emoji: '📣', ages: 'a partir de 5 anos', modes: [['tela', '📱 na tela'], ['mic', '🎙 pad de estudo ou bateria de verdade']], mode: 'tela', run: runEco,
  hint: (k) => (k === 'figuras' ? 'repetir os ritmos com pão, bo-lo e cho-co-la-te' : 'repetir ritmos com contratempo') };
GAMES.toque = { id: 'toque', title: 'Toque as figuras', blurb: 'lê a partitura e toca na tela ou no pad / bateria', emoji: '🥁', icon: 'ritmo', ages: 'a partir de 6 anos', modes: [['tela', '📱 na tela'], ['mic', '🎙 pad de estudo ou bateria de verdade']], mode: 'tela', run: runToque,
  hint: (k) => (k === 'figuras' ? 'ler e tocar semínima, colcheias e pausas' : 'ler e tocar semicolcheias e suas variações') };
export const ORDER = ['pauta', 'figuras', 'toque', 'eco']; // a memória virou jogo livre (sem fases); peças, bumbos e detetive saíram da lista // peças, bumbos e detetive saíram da lista (o código e o progresso ficam guardados)
