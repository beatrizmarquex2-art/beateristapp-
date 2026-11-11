// Quiz Uno Musical: 5 perguntas com a figura (nota ou pausa) e 3 opções com o nome. Acertar as 5 seguidas = 1 giro da roleta (até 3 por dia).
import { h } from '../util.js';
import { symbolEl } from './cartas-simbolos.js';
import { sfx } from './base.js';
import * as Z from './quizuno-logic.js';

export function mount(host) {
  let r = Z.novaRodada(); let gone = false; let travado = false; let premio = null; const timers = [];
  const root = h('div', { class: 'jg jg-quizuno' }); host.replaceChildren(root);
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!gone) fn(); }, ms));
  async function entregar() { // só com jogador ativo (código de acesso); devolve 'giro' | 'limite' | 'sem'
    try {
      const AC = await import('../acesso.js'); const livre = document.documentElement.classList.contains('aluno-on') && !AC.liberado(); if (livre) return 'sem';
      const P = await import('../kids/progress.js'); const me = P.active(); if (!me) return 'sem';
      const { hoje } = await import('../figurinhas/mesa-logic.js'); const prog = P.progOf(me.id); const c = Z.contarGiro(prog.quizuno, hoje());
      if (!c.ganhou) return 'limite';
      await P.patch(me.id, { quizuno: c.q }); const FR = await import('../figurinhas/rewards.js'); await FR.grantPacks([`roleta:quizuno:${me.id}:${c.id}`]); return 'giro';
    } catch { return 'sem'; }
  }
  function pergunta() {
    const q = r.qs[r.i]; travado = false;
    root.replaceChildren(
      h('h2', { class: 'jg-h hand' }, 'quiz Uno Musical'),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, `pergunta ${r.i + 1} de ${Z.PERGUNTAS} · acerte as 5 seguidas e ganhe 1 giro da roleta`),
      h('div', { class: 'qz-dots', 'aria-hidden': 'true' }, ...r.qs.map((_, i) => h('i', { class: i < r.i ? 'ok' : i === r.i ? 'now' : '' }))),
      h('div', { class: 'qz-card', role: 'img', 'aria-label': 'figura da pergunta' }, symbolEl(q.sym, 'cx-sym')),
      h('p', { class: 'jg-p' }, 'qual é o nome desta figura?'),
      h('div', { class: 'qz-ops', role: 'group', 'aria-label': 'opções' }, ...q.opcoes.map((s, i) => h('button', { type: 'button', class: 'btn qz-op', 'data-i': String(i), onclick: (ev) => escolher(i, ev.currentTarget) }, Z.nomeDe(s)))));
  }
  function escolher(i, btn) {
    if (travado) return; travado = true; const q = r.qs[r.i]; const x = Z.responder(r, i); r = x.r;
    root.querySelectorAll('.qz-op').forEach((b) => { b.disabled = true; if (Number(b.dataset.i) === q.certa) b.classList.add('certo'); });
    if (!x.acertou) btn.classList.add('errado');
    sfx(x.acertou ? 'win' : 'bad');
    later(() => (r.fim ? fim() : pergunta()), x.acertou ? 650 : 1500);
  }
  async function fim() {
    const ok = Z.perfeita(r); let msg = '';
    if (ok) { sfx('win'); premio = await entregar(); }
    if (gone) return;
    msg = ok ? (premio === 'giro' ? '🎡 você ganhou 1 giro da roleta!' : premio === 'limite' ? 'perfeito! hoje você já ganhou os 3 giros deste quiz. volte amanhã!' : 'perfeito! entre com o seu código de aluno pra ganhar giros da roleta.') : `você acertou ${r.acertos} de ${Z.PERGUNTAS}. acerte as 5 seguidas pra ganhar o giro!`;
    root.replaceChildren(h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, ok ? 'perfeito! 🤘' : 'quase!'), h('p', {}, msg)),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { r = Z.novaRodada(); premio = null; pergunta(); } }, 'jogar de novo'),
        ok && premio === 'giro' ? h('a', { class: 'btn', href: '#/album/Pacotes' }, 'girar a roleta') : null));
  }
  pergunta();
  return { inProgress: () => !r.fim && r.i > 0, destroy() { gone = true; timers.forEach(clearTimeout); } };
}
