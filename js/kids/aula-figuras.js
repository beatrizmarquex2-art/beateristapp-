// Aulinha do Paul sobre as figuras rítmicas: o tempo, quanto vale cada figura, como montar o desenho, as pausas e a tercina/sextina.
// Cada passo tem uma fala do Paul e uma coisa pra mexer ou ouvir. No fim, leva pros jogos.
import { h } from '../util.js';
import { audio, click } from '../audio.js';
import { VOICE } from '../views/beatlab.js';
import { session } from '../session.js';
import { robo } from './robo.js';
import { noteMarkup, figureMarkup, restMarkup, groupMarkup, svgEl } from './art.js';
import { FIGS, GROUPS, beatsLabel, figBySpec } from './figs.js';

const Q = 1; // 60 BPM: 1 tempo = 1 segundo (fácil de sentir)
const t0now = () => audio().currentTime + 0.12;
/** Toca N cliques de pulso (1 por tempo), pra a criança sentir o "tempo" andando. */
function pulse(n = 4) { const t0 = t0now(); for (let i = 0; i < n; i++) click(t0 + i * Q, i === 0 ? 2 : 1, 0.6); return n * Q * 1000; }
/** Ouve a figura: nota, silêncio da mesma duração, nota (com o pulso por baixo). Figuras curtas enchem um tempo primeiro. */
function hearFig(f, kind) {
  const t0 = t0now(); const d = f.beats * Q; const total = Math.max(2, Math.ceil(d * 2 + 0.5));
  for (let i = 0; i < total; i++) click(t0 + i * Q, i === 0 ? 2 : 1, 0.35);
  if (kind === 'nota') { if (d >= 1) { VOICE.sn(t0, 0.9); VOICE.sn(t0 + d, 0.9); } else { for (let k = 0; k < 1 / d; k++) VOICE.sn(t0 + k * d, 0.8); VOICE.sn(t0 + Q, 0.9); } }
  else { VOICE.sn(t0, 0.9); VOICE.sn(t0 + d * 2, 0.9); }
  return total * 1000;
}
/** Um tempo dividido em N notas iguais (2 colcheias, 3 da tercina, 4 semicolcheias, 6 da sextina). */
function hearSplit(n) { const t0 = t0now(); click(t0, 2, 0.5); click(t0 + Q, 1, 0.5); for (let k = 0; k < n; k++) VOICE.sn(t0 + (k * Q) / n, 0.85); VOICE.sn(t0 + Q, 0.9); }

export function aulaFiguras(host, { onPlay } = {}) {
  const S = session(); let step = 0; const bot = robo({ mood: 'wave', size: 92 });
  const say = h('p', { class: 'au-say', 'aria-live': 'polite' });
  const body = h('div', { class: 'au-body' }); const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' });
  const fig = (id, cls = 'au-fig') => svgEl(figureMarkup(id), cls);
  const btn = (t, fn, cls = 'kd-btn') => h('button', { type: 'button', class: cls, onclick: fn }, t);

  const SLIDES = [
    { mood: 'wave', say: 'oi, eu sou o Paul! hoje a gente aprende como a música escreve o tempo: as figuras rítmicas.', make: () => h('div', { class: 'au-box' },
      h('p', {}, 'a música tem um batimento, igual ao coração: o ', h('b', {}, 'tempo'), ' (ou pulso). cada som pode durar mais ou menos tempo.'),
      h('p', {}, 'a figura é o desenho que diz ', h('b', {}, 'quanto tempo'), ' o som dura.'), btn('▶ ouvir o pulso (4 tempos)', () => { S.reset(); pulse(4); }, 'kd-btn kd-listen')) },
    { mood: 'point', say: 'a semínima é a nossa medida: ela vale 1 tempo. todas as outras são comparadas com ela!', make: () => h('div', { class: 'au-box' },
      h('div', { class: 'au-center' }, fig('seminima', 'au-fig big'), h('b', {}, 'semínima = 1 tempo')),
      h('p', {}, 'conta: 1 · 2 · 3 · 4 e uma semínima em cada número.'), btn('▶ ouvir 4 semínimas', () => { S.reset(); const t0 = t0now(); for (let i = 0; i < 4; i++) { click(t0 + i, i === 0 ? 2 : 1, 0.3); VOICE.sn(t0 + i, 0.9); } }, 'kd-btn kd-listen')) },
    { mood: 'idea', say: 'a escadinha: cada figura vale a metade da de cima! toca no ▶ pra ouvir quanto cada uma dura.', make: () => h('div', { class: 'au-box' },
      ...FIGS.map((f) => h('div', { class: 'au-row' }, fig(f.id, 'au-fig sm'), h('div', { class: 'au-info' }, h('b', {}, f.name), h('small', {}, `vale ${beatsLabel(f.beats)} · ${f.frac}`),
        h('span', { class: 'au-meter', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.max(2, (f.beats / 4) * 100)}%` }))), h('button', { type: 'button', class: 'kd-chip', 'aria-label': `Ouvir ${f.name}`, onclick: () => { S.reset(); hearFig(f, 'nota'); } }, '▶'))),
      h('p', { class: 'muted' }, '1 semibreve = 2 mínimas = 4 semínimas = 8 colcheias = 16 semicolcheias = 32 fusas = 64 semifusas.')) },
    { mood: 'cool', say: 'qual vale mais? a que dura mais tempo! quanto mais bandeirinhas, mais rápida e menos tempo ela vale.', make: () => {
      const a = h('div', { class: 'au-vs' }); let k = 0;
      const pairs = [['semibreve', 'seminima'], ['minima', 'colcheia'], ['semicolcheia', 'fusa'], ['semifusa', 'seminima']];
      const draw = () => { const [x, y] = pairs[k % pairs.length]; const fx = FIGS.find((f) => f.id === x); const fy = FIGS.find((f) => f.id === y); const win = fx.beats > fy.beats ? fx : fy;
        a.replaceChildren(h('div', { class: 'au-pair' }, h('button', { type: 'button', class: 'kd-btn au-card', onclick: () => { S.reset(); hearFig(fx, 'nota'); } }, fig(x, 'au-fig sm'), h('small', {}, fx.name)), h('b', {}, 'ou'), h('button', { type: 'button', class: 'kd-btn au-card', onclick: () => { S.reset(); hearFig(fy, 'nota'); } }, fig(y, 'au-fig sm'), h('small', {}, fy.name))),
          h('p', {}, h('b', {}, `${win.name} vale mais`), ` (${beatsLabel(win.beats)} contra ${beatsLabel((win === fx ? fy : fx).beats)}).`), btn('outro par', () => { k++; draw(); }, 'kd-chip')); };
      draw(); return h('div', { class: 'au-box' }, h('p', {}, 'toque em cada uma pra ouvir e comparar:'), a); } },
    { mood: 'laptop', say: 'montar o desenho é fácil: três peças! a cabeça (vazia ou cheia), a haste e as bandeirinhas. mexe aí!', make: () => {
      const st = { open: false, stem: true, flags: 0 }; const view = h('div', { class: 'au-center' }); const name = h('b', { class: 'au-name' }); const ctl = h('div', { class: 'au-ctl' });
      const draw = () => {
        view.replaceChildren(svgEl(noteMarkup(st, 'desenho montado'), 'au-fig big')); const f = figBySpec(st);
        name.textContent = f ? `${f.name} · vale ${beatsLabel(f.beats)}` : 'esse desenho não existe na música! tenta outro.';
        ctl.replaceChildren(
          h('div', { class: 'row kd-modes' }, h('span', { class: 'au-lab' }, 'cabeça'), ...[[true, 'vazia'], [false, 'cheia']].map(([v, t]) => h('button', { type: 'button', class: `kd-chip${st.open === v ? ' on' : ''}`, onclick: () => { st.open = v; draw(); } }, t))),
          h('div', { class: 'row kd-modes' }, h('span', { class: 'au-lab' }, 'haste'), ...[[false, 'sem'], [true, 'com']].map(([v, t]) => h('button', { type: 'button', class: `kd-chip${st.stem === v ? ' on' : ''}`, onclick: () => { st.stem = v; if (!v) st.flags = 0; draw(); } }, t))),
          h('div', { class: 'row kd-modes' }, h('span', { class: 'au-lab' }, 'bandeirinhas'), ...[0, 1, 2, 3, 4].map((n) => h('button', { type: 'button', class: `kd-chip${st.flags === n ? ' on' : ''}`, disabled: !st.stem && n > 0, onclick: () => { st.flags = n; draw(); } }, String(n)))));
      };
      draw();
      const recipes = h('div', { class: 'au-recipes' }, h('p', { class: 'muted' }, 'receitas prontas (toque pra montar):'), h('div', { class: 'row kd-modes' }, ...FIGS.map((f) => h('button', { type: 'button', class: 'kd-chip', onclick: () => { st.open = f.open; st.stem = f.stem; st.flags = f.flags; draw(); } }, f.name))));
      return h('div', { class: 'au-box' }, view, name, ctl, recipes, h('p', { class: 'muted' }, 'regras: vazia sem haste = semibreve · vazia com haste = mínima · cheia com haste = semínima · cada bandeirinha divide o valor ao meio.')); } },
    { mood: 'peace', say: 'e o silêncio também é música! cada figura tem uma pausa: um desenho que manda ficar quieto pelo mesmo tempo.', make: () => h('div', { class: 'au-box' },
      ...FIGS.map((f) => h('div', { class: 'au-row' }, svgEl(figureMarkup(f.id), 'au-fig sm'), svgEl(restMarkup(f.id), 'au-fig sm'), h('div', { class: 'au-info' }, h('b', {}, `pausa de ${f.name}`), h('small', {}, `silêncio de ${beatsLabel(f.beats)}`)),
        h('button', { type: 'button', class: 'kd-chip', 'aria-label': `Ouvir a pausa de ${f.name}`, onclick: () => { S.reset(); hearFig(f, 'pausa'); } }, '🤫'))),
      h('p', { class: 'muted' }, 'o 🤫 toca um som, fica em silêncio pelo tempo da pausa e toca de novo. o pulso continua andando!')) },
    { mood: 'wow', say: 'agora o mais legal: tercina e sextina! elas dividem o tempo em partes diferentes.', make: () => h('div', { class: 'au-box' },
      ...GROUPS.map((g) => h('div', { class: 'au-group' }, svgEl(groupMarkup(g.id), 'au-grp'), h('div', { class: 'au-info' }, h('b', {}, g.name), h('small', {}, g.text), btn(`▶ ouvir a ${g.name}`, () => { S.reset(); hearSplit(g.n); }, 'kd-chip')))),
      h('p', {}, 'compare como um tempo pode ser dividido:'), h('div', { class: 'row kd-modes' }, ...[[1, 'semínima'], [2, '2 colcheias'], [3, 'tercina'], [4, '4 semicolcheias'], [6, 'sextina']].map(([n, t]) => h('button', { type: 'button', class: 'kd-chip', onclick: () => { S.reset(); hearSplit(n); } }, `▶ ${t}`))),
      h('p', { class: 'muted' }, 'o número em cima do colchete diz quantas notas cabem naquele tempo.')) },
    { mood: 'cheer', say: 'pronto! agora você sabe o valor, o desenho, as pausas, a tercina e a sextina. bora jogar e ganhar estrelas!', make: () => h('div', { class: 'au-box au-center' },
      h('p', {}, 'resumo: semínima = 1 tempo · cada figura é a metade da anterior · cabeça + haste + bandeirinhas · pausa = mesmo valor, em silêncio · tercina = 3 no tempo · sextina = 6 no tempo.'),
      h('a', { class: 'kd-btn kx-go', href: '#/kids/figuras', onclick: () => { onPlay && onPlay(); } }, 'bora jogar!')) },
  ];

  const draw = () => {
    S.reset(); const s = SLIDES[step]; bot.set(s.mood, ''); say.textContent = s.say;
    dots.replaceChildren(...SLIDES.map((_, k) => h('i', { class: k < step ? 'done' : k === step ? 'now' : '' })));
    body.replaceChildren(s.make(), h('div', { class: 'row kx-act au-nav' },
      step > 0 ? btn('‹ voltar', () => { step--; draw(); }, 'kd-chip') : null,
      step < SLIDES.length - 1 ? btn('próximo ›', () => { step++; draw(); }, 'kd-btn') : null));
  };
  host.append(h('div', { class: 'au' }, h('h1', { class: 'kx-pix kx-pagetitle' }, 'aulinha do Paul'), h('div', { class: 'au-top' }, bot.el, h('div', { class: 'au-bubble' }, say)), dots, body));
  draw();
  return () => S.dispose();
}
