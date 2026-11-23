// Aulinha do Paul antes dos jogos de ouvido: graus da escala, 3ª e 5ª, acorde, maior x menor, escalas e pentatônicas (tudo com som e cores).
import { h } from '../util.js';
import { silence } from '../audio.js';
import { robo } from '../kids/robo.js';
import { faixa } from './vivo-logic.js';
import { teclado, tocaNota } from './vivo-ui.js';
import { toca } from './ouvido-ui.js';
import { acordeMidis, escalaNotas, corNota, nomeEm } from './ouvido-logic.js';

const nomeC = (m) => nomeEm(m, 0, 'maior');
/** Braço do violão (SVG simples): marks = [{ s: corda 6..1, f: casa, t: texto, raiz }]. */
function bracoSVG(marks, de, ate) {
  const W = 330; const X0 = 28; const nf = ate - de + 1; const dx = (W - X0 - 8) / nf; const Y0 = 14; const dy = 16; let s = `<svg viewBox="0 0 ${W} ${Y0 + dy * 5 + 22}" class="au-braco" role="img" aria-label="braço do violão com as notas da escala">`;
  for (let c = 0; c <= nf; c++) s += `<line x1="${X0 + c * dx}" y1="${Y0}" x2="${X0 + c * dx}" y2="${Y0 + dy * 5}" stroke="#16233d" stroke-width="${c === 0 && de === 0 ? 4 : 1.4}"/>`;
  for (let r = 0; r < 6; r++) s += `<line x1="${X0}" y1="${Y0 + r * dy}" x2="${X0 + nf * dx}" y2="${Y0 + r * dy}" stroke="#16233d" stroke-width="${1 + r * 0.2}"/>`;
  for (let c = 1; c <= nf; c++) s += `<text x="${X0 + (c - 0.5) * dx}" y="${Y0 + dy * 5 + 15}" font-size="11" font-weight="700" text-anchor="middle" fill="#16233d">${de + c}</text>`;
  ['e', 'B', 'G', 'D', 'A', 'E'].forEach((n, r) => { s += `<text x="10" y="${Y0 + r * dy + 4}" font-size="11" font-weight="800" text-anchor="middle" fill="#16233d">${n}</text>`; });
  marks.forEach(({ s: cs, f, t = '', raiz = false, azul = false }) => { const r = 6 - cs; const cx = f === 0 ? X0 - 9 : X0 + (f - de - 0.5) * dx; const fill = azul ? '#8e1b2c' : raiz ? '#16233d' : '#fffaf0'; const tx = raiz || azul ? '#fff' : '#16233d';
    s += `<circle cx="${cx}" cy="${Y0 + r * dy}" r="${f === 0 ? 5 : 7.2}" fill="${fill}" stroke="#16233d" stroke-width="1.6"/>${f ? `<text x="${cx}" y="${Y0 + r * dy + 3.6}" font-size="9.5" font-weight="800" text-anchor="middle" fill="${tx}">${t}</text>` : ''}`; });
  return `${s}</svg>`;
}
const PM_A = [{ s: 6, f: 5, t: 'lá', raiz: 1 }, { s: 6, f: 8, t: 'dó' }, { s: 5, f: 5, t: 'ré' }, { s: 5, f: 7, t: 'mi' }, { s: 4, f: 5, t: 'sol' }, { s: 4, f: 7, t: 'lá', raiz: 1 }, { s: 3, f: 5, t: 'dó' }, { s: 3, f: 7, t: 'ré' }, { s: 2, f: 5, t: 'mi' }, { s: 2, f: 8, t: 'sol' }, { s: 1, f: 5, t: 'lá', raiz: 1 }, { s: 1, f: 8, t: 'dó' }];
const CROM = Array.from({ length: 13 }, (_, i) => 60 + i); const BLUES_A = [57, 60, 62, 63, 64, 67, 69];
/** Teclado colorido de dó a dó; `marca` = notas em destaque (as outras ficam claras). */
function tecladoCores(onNota, marca) {
  const kb = teclado({ notas: faixa(60, 72), nomes: true, onNota: (m, e) => { tocaNota(m); onNota && onNota(m, e); } });
  kb.el.querySelectorAll('[data-midi]').forEach((b) => { const m = Number(b.dataset.midi); b.style.setProperty('--nc', corNota(m)); if (marca && !marca.includes(m)) b.classList.add('apagada'); });
  return kb.el;
}
export function aulaOuvido(host, { onFim, onPular, textoFim = 'bora jogar!' } = {}) {
  let step = 0; const bot = robo({ mood: 'wave', size: 92 });
  const say = h('p', { class: 'au-say', 'aria-live': 'polite' }); const body = h('div', { class: 'au-body' }); const dots = h('div', { class: 'kx-dots', 'aria-hidden': 'true' });
  const btn = (t, fn, cls = 'kd-btn') => h('button', { type: 'button', class: cls, onclick: fn }, t);
  const ouvir = (txt, midis, o) => btn(`▶ ${txt}`, () => { silence(); toca(midis, o); }, 'kd-btn kd-listen');
  const tons = (a) => h('div', { class: 'vv-notas-row' }, ...a.map((m) => h('i', { class: 'vv-n vv-nota-aula', style: `--nc:${corNota(m)}` }, nomeC(m))));
  const SLIDES = [
    { mood: 'wave', say: 'oi, eu sou o Paul! antes dos jogos de ouvido, vamos entender as notas de perto: graus, acordes e escalas.', make: () => h('div', { class: 'au-box' },
      h('p', {}, 'uma ', h('b', {}, 'escala'), ' é uma escadinha de notas. a primeira é a ', h('b', {}, 'tônica'), ' (a nota que dá nome à escala: em dó maior, é o dó).'),
      tecladoCores((m) => { }, null), h('p', { class: 'muted' }, 'toque nas teclas: cada nota tem a sua cor, igual nos jogos.')) },
    { mood: 'point', say: 'cada nota da escala tem um número, o grau: 1ª, 2ª, 3ª… até a oitava (que é a tônica de novo, mais aguda).', make: () => {
      const notas = escalaNotas(0, 'maior'); const info = h('p', { class: 'au-name' }, 'toque numa nota pra ver o grau');
      return h('div', { class: 'au-box' }, h('div', { class: 'vv-notas-row' }, ...notas.map((m, i) => h('button', { type: 'button', class: 'vv-n vv-nota-aula', style: `--nc:${corNota(m)}`, onclick: () => { silence(); tocaNota(m); info.textContent = i === 7 ? '8ª: a tônica de novo, uma oitava acima' : `${i + 1}ª nota: ${nomeC(m)}`; } }, h('small', {}, `${i + 1}ª`), nomeC(m)))), info, ouvir('ouvir a escala de dó', notas, { passo: 0.42, dur: 0.5 })); } },
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
    { mood: 'idea', say: 'no violão cada casa sobe meio tom, e a forma da escala se repete pelo braço. esta é a pentatônica menor de lá: aprenda a forma e mova pelo braço!', make: () => { const d = h('div', { class: 'au-center' }); d.innerHTML = bracoSVG(PM_A, 4, 8); return h('div', { class: 'au-box' }, d,
      h('p', {}, 'as bolinhas escuras são o ', h('b', {}, 'lá'), ' (a tônica). a mesma forma na casa 8 vira dó menor.'), h('p', { class: 'muted' }, 'cordas soltas, da grave pra aguda: mi · lá · ré · sol · si · mi.')); } },
    { mood: 'wow', say: 'a escala cromática tem as 12 notas, de meio em meio tom. e o blues é a pentatônica menor com uma nota extra: a blue note!', make: () => { const d = h('div', { class: 'au-center' }); d.innerHTML = bracoSVG(PM_A.concat([{ s: 5, f: 6, t: 'mi♭', azul: true }, { s: 3, f: 8, t: 'mi♭', azul: true }]), 4, 8);
      return h('div', { class: 'au-box' }, ouvir('ouvir a cromática (12 notas)', CROM, { passo: 0.22, dur: 0.3 }), h('p', { class: 'muted' }, 'cromática: dó dó♯ ré ré♯ mi fá fá♯ sol sol♯ lá lá♯ si dó'), d, ouvir('ouvir o blues de lá', BLUES_A, { passo: 0.4, dur: 0.5 }), h('p', {}, 'blues de lá: ', h('b', {}, 'lá · dó · ré · mi♭ · mi · sol'), '. as bolinhas vermelhas são a blue note (♭5).')); } },
    { mood: 'cheer', say: 'pronto! nos jogos eu toco e você responde (ou toca a escala). cada fase tem 6 a 12 rodadas: acerte 60% pra abrir a próxima!', make: () => h('div', { class: 'au-box au-center' },
      h('p', {}, 'resumo: escala = escadinha de notas · tônica = 1ª nota · 3ª dá a cor (maior alegre, menor triste) · 5ª é o chão · acorde = 1ª + 3ª + 5ª · pentatônica = 5 notas.'),
      btn(textoFim, () => { silence(); onFim && onFim(); }, 'kd-btn kx-go')) },
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
