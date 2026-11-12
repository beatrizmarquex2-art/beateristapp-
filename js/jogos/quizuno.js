// Quiz Uno Musical: 5 perguntas com a figura (nota ou pausa) e 3 opções com o nome. Acertar as 5 seguidas = 1 estrela por rodada (perguntas diferentes a cada vez).
import { h } from '../util.js';
import { symbolEl } from './cartas-simbolos.js';
import { sfx } from './base.js';
import * as Z from './quizuno-logic.js';

export function mount(host) {
  const RK = 'beaterista-quizuno-recentes'; const recentes = () => { try { return JSON.parse(localStorage.getItem(RK) || '[]'); } catch { return []; } };
  const nova = () => { const x = Z.novaRodada(Math.random, recentes()); try { localStorage.setItem(RK, JSON.stringify(x.qs.map((q) => q.sym))); } catch { /* ok */ } return x; };
  let r = nova(); let gone = false; let travado = false; let premio = null; const timers = [];
  const root = h('div', { class: 'jg jg-quizuno' }); host.replaceChildren(root);
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!gone) fn(); }, ms));
  async function entregar() { // 1 estrela por rodada perfeita (limite do dia no mesa.js); 'sem' = sem código de aluno
    try { const E = await import('./estrelas-jogo.js'); return (await E.ganhou('quizuno', 1)) ? 'estrela' : 'sem'; } catch { return 'sem'; }
  }
  function pergunta() {
    const q = r.qs[r.i]; travado = false;
    root.replaceChildren(
      h('h2', { class: 'jg-h hand' }, 'quiz Uno Musical'),
      h('p', { class: 'jg-turn', 'aria-live': 'polite' }, `pergunta ${r.i + 1} de ${Z.PERGUNTAS} · acerte as 5 seguidas e ganhe 1 ★`),
      h('div', { class: 'qz-dots', 'aria-hidden': 'true' }, ...r.qs.map((_, i) => h('i', { class: i < r.i ? 'ok' : i === r.i ? 'now' : '' }))),
      q.tipo === 'nome'
        ? h('div', { class: 'qz-card', role: 'img', 'aria-label': 'nome da pergunta' }, h('b', { class: 'hand', style: 'font-size:30px;text-align:center' }, Z.nomeDe(q.sym)))
        : h('div', { class: 'qz-card', role: 'img', 'aria-label': 'figura da pergunta' }, symbolEl(q.sym, 'cx-sym')),
      h('p', { class: 'jg-p' }, q.tipo === 'nome' ? 'qual é a figura com este nome?' : 'qual é o nome desta figura?'),
      h('div', { class: 'qz-ops', role: 'group', 'aria-label': 'opções', 'data-certa': String(q.certa), 'data-tipo': q.tipo }, ...q.opcoes.map((s, i) => h('button', { type: 'button', class: q.tipo === 'nome' ? 'btn qz-op qz-fig' : 'btn qz-op', 'data-i': String(i), 'aria-label': Z.nomeDe(s), onclick: (ev) => escolher(i, ev.currentTarget) }, q.tipo === 'nome' ? symbolEl(s, 'cx-sym') : Z.nomeDe(s)))));
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
    msg = ok ? (premio === 'estrela' ? '⭐ você ganhou 1 estrela!' : 'perfeito! entre com o seu código de aluno pra ganhar estrelas.') : `você acertou ${r.acertos} de ${Z.PERGUNTAS}. acerte as 5 seguidas pra ganhar 1 ★.`;
    root.replaceChildren(h('div', { class: 'jg-result', role: 'status' }, h('h3', { class: 'hand' }, ok ? 'perfeito! 🤘' : 'quase!'), h('p', {}, msg)),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { r = nova(); premio = null; pergunta(); } }, 'jogar de novo'),
        null));
  }
  pergunta();
  return { inProgress: () => !r.fim && r.i > 0, destroy() { gone = true; timers.forEach(clearTimeout); } };
}
