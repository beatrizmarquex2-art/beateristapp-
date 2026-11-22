// Aulinha do Paul antes dos jogos de ouvido: graus da escala, 3ª e 5ª, acorde, maior x menor, escalas e pentatônicas (tudo com som e cores).
import { h } from '../util.js';
import { silence } from '../audio.js';
import { robo } from '../kids/robo.js';
import { faixa } from './vivo-logic.js';
import { teclado, tocaNota } from './vivo-ui.js';
import { toca } from './ouvido-ui.js';
import { acordeMidis, escalaNotas, corNota, nomeEm } from './ouvido-logic.js';

const nomeC = (m) => nomeEm(m, 0, 'maior');
/** Teclado colorido de dó a dó; `marca` = notas em destaque (as outras ficam claras). */
function tecladoCores(onNota, marca) {
  const kb = teclado({ notas: faixa(60, 72), nomes: true, onNota: (m, e) => { tocaNota(m); onNota && onNota(m, e); } });
  kb.el.querySelectorAll('[data-midi]').forEach((b) => { const m = Number(b.dataset.midi); b.style.setProperty('--nc', corNota(m)); if (marca && !marca.includes(m)) b.classList.add('apagada'); });
  return kb.el;
}
export function aulaOuvido(host, { onFim, onPular } = {}) {
  let step = 0; const bot = robo({ mood: 'wave', size: 92 });
  const say = h('p', { class: 'au-say', 'aria-live': 'polite' }); const body = h('div', { class: 'au-body' }); const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' });
  const btn = (t, fn, cls = 'kd-btn') => h('button', { type: 'button', class: cls, onclick: fn }, t);
  const ouvir = (txt, midis, o) => btn(`▶ ${txt}`, () => { silence(); toca(midis, o); }, 'kd-btn kd-listen');
  const tons = (a) => h('div', { class: 'au-center' }, ...a.map((m) => h('i', { class: 'vv-n vv-nota-aula', style: `--nc:${corNota(m)}` }, nomeC(m))));
  const SLIDES = [
    { mood: 'wave', say: 'oi, eu sou o Paul! antes dos jogos de ouvido, vamos entender as notas de perto: graus, acordes e escalas.', make: () => h('div', { class: 'au-box' },
      h('p', {}, 'uma ', h('b', {}, 'escala'), ' é uma escadinha de notas. a primeira é a ', h('b', {}, 'tônica'), ' (a nota que dá nome à escala: em dó maior, é o dó).'),
      tecladoCores((m) => { }, null), h('p', { class: 'muted' }, 'toque nas teclas: cada nota tem a sua cor, igual nos jogos.')) },
    { mood: 'point', say: 'cada nota da escala tem um número, o grau: 1ª, 2ª, 3ª… até a oitava (que é a tônica de novo, mais aguda).', make: () => {
      const notas = escalaNotas(0, 'maior'); const info = h('p', { class: 'au-name' }, 'toque numa nota pra ver o grau');
      return h('div', { class: 'au-box' }, h('div', { class: 'au-center' }, ...notas.map((m, i) => h('button', { type: 'button', class: 'vv-n vv-nota-aula', style: `--nc:${corNota(m)}`, onclick: () => { silence(); tocaNota(m); info.textContent = i === 7 ? '8ª: a tônica de novo, uma oitava acima' : `${i + 1}ª nota: ${nomeC(m)}`; } }, h('small', {}, `${i + 1}ª`), nomeC(m)))), info, ouvir('ouvir a escala de dó', notas, { passo: 0.42, dur: 0.5 })); } },
    { mood: 'cool', say: 'a 3ª e a 5ª são as notas mais importantes depois da tônica: elas formam o acorde!', make: () => h('div', { class: 'au-box' }, tecladoCores(null, [60, 64, 67]),
      h('p', {}, 'em dó: ', h('b', {}, 'dó (1ª)'), ' · ', h('b', {}, 'mi (3ª)'), ' · ', h('b', {}, 'sol (5ª)'), '.'),
      h('div', { class: 'row kd-modes' }, ouvir('dó → mi (3ª)', [60, 64], { passo: 0.9 }), ouvir('dó → sol (5ª)', [60, 67], { passo: 0.9 })),
      h('p', { class: 'muted' }, 'a 3ª soa "doce", dá a cor. a 5ª soa firme, é o chão do acorde.')) },
    { mood: 'idea', say: 'um acorde é a tônica, a 3ª e a 5ª tocadas juntas, empilhadas!', make: () => h('div', { class: 'au-box' }, tons(acordeMidis(0, 'maior', 60)), h('p', {}, 'dó + mi + sol = acorde de ', h('b', {}, 'dó maior'), '.'),
      h('div', { class: 'row kd-modes' }, ouvir('ouvir junto (acorde)', acordeMidis(0, 'maior', 60), { junto: true }), ouvir('ouvir uma por uma (arpejo)', acordeMidis(0, 'maior', 60), { passo: 0.45 })),
      h('p', { class: 'muted' }, 'nos jogos "que acorde é?" você vai reconhecer o nome só de ouvir.')) },
    { mood: 'wow', say: 'maior ou menor? só uma nota muda: a 3ª! maior soa alegre, menor soa triste.', make: () => h('div', { class: 'au-box' },
      h('div', { class: 'au-pair' }, h('div', { class: 'au-center' }, h('b', {}, 'dó maior 😄'), tons(acordeMidis(0, 'maior', 60)), ouvir('ouvir', acordeMidis(0, 'maior', 60), { junto: true })), h('div', { class: 'au-center' }, h('b', {}, 'dó menor 😢'), tons(acordeMidis(0, 'menor', 60)), ouvir('ouvir', acordeMidis(0, 'menor', 60), { junto: true }))),
      h('p', {}, 'repare: o mi virou ', h('b', {}, 'mi♭'), ' (um pouquinho mais grave). só isso muda o clima da música!')) },
    { mood: 'laptop', say: 'a escala maior e a menor também mudam a 3ª (e mais duas notas). ouça a diferença!', make: () => { const M = escalaNotas(0, 'maior'); const m = escalaNotas(9, 'menor'); return h('div', { class: 'au-box' },
      h('p', {}, h('b', {}, 'maior (dó):'), ' tom, tom, semitom, tom, tom, tom, semitom'), tons(M), ouvir('ouvir dó maior', M, { passo: 0.38, dur: 0.45 }),
      h('p', {}, h('b', {}, 'menor (lá):'), ' tom, semitom, tom, tom, semitom, tom, tom'), tons(m), ouvir('ouvir lá menor', m, { passo: 0.38, dur: 0.45 }),
      h('p', { class: 'muted' }, 'semitom = uma tecla pra outra, sem pular nenhuma (mi→fá). tom = pula uma tecla.')); } },
    { mood: 'cheer', say: 'a pentatônica tem só 5 notas: é a escala do rock e do blues! ela tira a 4ª e a 7ª, as notas que mais "esbarram".', make: () => { const P = escalaNotas(0, 'penta'); const Pm = escalaNotas(9, 'pentamenor'); return h('div', { class: 'au-box' },
      h('p', {}, h('b', {}, 'pentatônica de dó:'), ' dó ré mi sol lá'), tons(P), ouvir('ouvir', P, { passo: 0.38, dur: 0.45 }),
      h('p', {}, h('b', {}, 'pentatônica menor de lá:'), ' lá dó ré mi sol'), tons(Pm), ouvir('ouvir', Pm, { passo: 0.38, dur: 0.45 })); } },
    { mood: 'cheer', say: 'pronto! nos jogos eu toco e você responde (ou toca a escala). cada fase tem 6 a 12 rodadas: acerte 60% pra abrir a próxima!', make: () => h('div', { class: 'au-box au-center' },
      h('p', {}, 'resumo: escala = escadinha de notas · tônica = 1ª nota · 3ª dá a cor (maior alegre, menor triste) · 5ª é o chão · acorde = 1ª + 3ª + 5ª · pentatônica = 5 notas.'),
      btn('bora jogar!', () => { silence(); onFim && onFim(); }, 'kd-btn kx-go')) },
  ];
  const draw = () => {
    silence(); const s = SLIDES[step]; bot.set(s.mood, ''); say.textContent = s.say;
    dots.replaceChildren(...SLIDES.map((_, k) => h('i', { class: k < step ? 'done' : k === step ? 'now' : '' })));
    body.replaceChildren(s.make(), h('div', { class: 'row kx-act au-nav' }, step > 0 ? btn('‹ voltar', () => { step--; draw(); }, 'kd-chip') : null, step < SLIDES.length - 1 ? btn('próximo ›', () => { step++; draw(); }, 'kd-btn') : null,
      onPular && step < SLIDES.length - 1 ? btn('pular', () => { silence(); onPular(); }, 'kd-chip') : null));
  };
  host.append(h('div', { class: 'au vv-aula' }, h('h1', { class: 'kx-pix kx-pagetitle' }, 'aulinha do Paul: ouvido e escalas'), h('div', { class: 'au-top' }, bot.el, h('div', { class: 'au-bubble' }, say)), dots, body));
  draw();
  return () => silence();
}
/** Como jogo avulso (#/jogos/aula-ouvido). */
export function mount(host) { const box = h('div', { class: 'kd-game' }); host.replaceChildren(box); const off = aulaOuvido(box, { onFim: () => { location.hash = '#/jogos'; } }); return { destroy() { off(); } }; }
