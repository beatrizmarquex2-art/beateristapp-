// Detetive Note: escuta um ritmo de 1 compasso e descobre qual é entre 4 opções. Só adivinha (não toca).
//  • modo infantil: as opções são desenhos (pão, bolo, chocolate…); • modo normal: as opções são figuras rítmicas na pauta.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio } from '../audio.js';
import { session } from '../session.js';
import * as N from '../notation.js';
import { layoutRhythm } from '../reading.js';
import { pergunta, QUESTOES, BPM } from './detetive-logic.js';
import { schedule } from '../views/treinos.js';
import { FOODS } from '../kids-logic.js';
import { svgEl } from '../kids/art.js';
import * as FB from '../feedback.js';

const quadro = (bar, modo, rnd) => {
  if (modo !== 'infantil') return svgEl(N.toSVG(layoutRhythm(bar, { width: 300, count: false })), 'dn-fig');
  return h('div', { class: 'dn-pics' }, ...bar.map((cell) => { const f = FOODS.filter((x) => x.cell === cell)[0]; return h('span', {}, h('i', { 'aria-hidden': 'true' }, f.emoji), h('small', {}, f.syl.join('-'))); }));
};

export function mount(host) {
  const saved = getGame('detetive'); let modo = saved.modo === 'normal' ? 'normal' : 'infantil'; let lv = [1, 2, 3].includes(saved.lv) ? saved.lv : 1;
  const root = h('div', { class: 'jg jg-detetive' }); host.replaceChildren(root);
  // S = tempos da tela (próxima pergunta); Au = só o som (ouvir de novo não cancela a próxima)
  const S = session(); const Au = session(); let q = null; let n = 0; let certas = 0; let travado = false; let gone = false; let jogando = false;
  const chip = (txt, on, fn) => h('button', { type: 'button', class: `kd-chip${on ? ' on' : ''}`, role: 'radio', 'aria-checked': String(on), onclick: fn }, txt);
  const entrada = () => {
    S.reset(); Au.reset(); jogando = false;
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, 'detetive note'),
      h('p', { class: 'jg-p' }, 'escute o ritmo e descubra qual é. ouve quantas vezes quiser.'),
      h('div', { class: 'dn-modos', role: 'radiogroup', 'aria-label': 'Modo' }, chip('infantil (desenhos)', modo === 'infantil', () => { modo = 'infantil'; setGame('detetive', { modo, lv }); entrada(); }), chip('normal (figuras)', modo === 'normal', () => { modo = 'normal'; setGame('detetive', { modo, lv }); entrada(); })),
      modo === 'normal' ? h('div', { class: 'dn-modos', role: 'radiogroup', 'aria-label': 'Nível' }, ...[1, 2, 3].map((v) => chip(`nível ${v}`, lv === v, () => { lv = v; setGame('detetive', { modo, lv }); entrada(); }))) : null,
      h('button', { class: 'btn primary wide', type: 'button', onclick: () => { n = 0; certas = 0; jogando = true; proxima(); } }, 'jogar'));
  };
  const ouvir = () => { Au.reset(); audio(); schedule(q.bar, BPM, { play: true }); };
  const proxima = () => {
    S.reset(); travado = false; q = pergunta(modo, lv);
    const msg = h('p', { class: 'jg-msg', 'aria-live': 'polite' }, 'qual é o ritmo?');
    const cards = q.opts.map((o, i) => h('button', { type: 'button', class: 'dn-op', onclick: (e) => escolher(i, e.currentTarget, msg) }, quadro(o, modo)));
    root.replaceChildren(h('p', { class: 'dn-prog' }, `${n + 1} de ${QUESTOES} · ${certas} certas`),
      h('button', { class: 'btn primary wide dn-ouvir', type: 'button', onclick: ouvir }, '▶ ouvir o ritmo'), msg, h('div', { class: 'dn-ops' }, ...cards));
    Au.later(ouvir, 350);
  };
  const escolher = (i, el, msg) => {
    if (travado) return; travado = true; const ok = i === q.ok; if (ok) certas++; n++;
    el.classList.add(ok ? 'ok' : 'no'); const certo = root.querySelectorAll('.dn-op')[q.ok]; certo.classList.add('ok');
    msg.textContent = ok ? 'isso! ✓' : 'era esse ✓'; if (ok) FB.win(el); else FB.lose(el);
    S.later(() => (n >= QUESTOES ? fim() : proxima()), 1300);
  };
  const fim = async () => {
    S.reset(); jogando = false; const p = certas / QUESTOES; const est = p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.4 ? 1 : 0;
    if (est) import('../figurinhas/mesa.js').then((M) => M.vitoria('detetive', est)).catch(() => {});
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, `${certas} de ${QUESTOES}`), h('p', { class: 'jg-p' }, est === 3 ? 'detetive de ouro! ⭐⭐⭐' : est === 2 ? 'muito bem! ⭐⭐' : est === 1 ? 'bom começo! ⭐' : 'bora treinar mais um pouco'),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { n = 0; certas = 0; jogando = true; proxima(); } }, 'jogar de novo'), h('button', { class: 'btn', type: 'button', onclick: entrada }, 'mudar o modo')));
  };
  entrada();
  return { inProgress: () => jogando, restart: () => { if (!gone) entrada(); }, destroy() { gone = true; S.dispose(); Au.dispose(); } };
}
