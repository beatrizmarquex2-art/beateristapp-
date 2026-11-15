// Teoria básica com o Paul: cada sessão tem cartões clicáveis (toque pra virar e ver a explicação) e, no fim, um mini quiz de 3 perguntas.
// Estrelas: 3 de 3 = 2 ★, 2 de 3 = 1 ★ (1 vez por sessão por dia; limite de 30 ★/dia do jogo "estudos").
import { h } from '../util.js';
import { banner, toast } from '../ui.js';
import { alunoSemCodigo } from '../amostra.js';
import { robo } from './robo.js';
import { audio, click } from '../audio.js';
import { symbolEl } from '../jogos/cartas-simbolos.js';
import { epiano } from '../synth.js';
import { FASES_FIGURAS, notas } from './teoria-figuras.js';
import { FASES_PAUSAS, FASES_CLAVES, FASES_TEMPO, FASES_LEITURA } from './teoria-temas.js';
import { FASES_BATERIA, FASES_TECLADO, FASES_VIOLAO } from './teoria-instrumentos.js';

const NSV = 'http://www.w3.org/2000/svg';
const svgEl = (w, hh, inner) => { const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', `0 0 ${w} ${hh}`); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = inner; return e; };
/** Semibreve (cheia por dentro? não: vazada, sem haste) e mínima (vazada, com haste), desenhadas em SVG (fonte de música não existe em todo aparelho). */
const nt = (_x, haste) => svgEl(40, 56, `<ellipse cx="18" cy="42" rx="12" ry="8" transform="rotate(-20 18 42)" fill="none" stroke="currentColor" stroke-width="4"/>${haste ? '<line x1="29" y1="38" x2="29" y2="6" stroke="currentColor" stroke-width="3.5"/>' : ''}`);
/** As claves nasceram das letras G, F e C: é só olhar a espiral do sol, os pontinhos do fá e o "C" aberto do dó. */
const clv = (letra) => h('b', { class: 'tf-big clv' }, letra);
const emb = (a, r = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const nota = (m, len = 0.5) => { const c = audio(); epiano(c.currentTime + 0.03, [m], len, 1); };
const batidas = (n, bpm = 90) => { const c = audio(); const t = c.currentTime + 0.05; for (let i = 0; i < n; i++) click(t + (i * 60) / bpm, i === 0 ? 2 : 1); };

/** Uma sessão: cards = [{ t: título, ic: emoji ou função que desenha, txt: explicação, som?: fn }], quiz = [{ q, ops:[3], ok:índice }, …] (sorteia 3). */
export const SESSOES = [
  { id: 'figuras', ic: '🎵', li: () => notas('ee'), nome: 'Figuras', sub: 'quanto dura cada som', cor: '#d3122f', paul: FASES_FIGURAS[0].paul, fases: FASES_FIGURAS }, // cada tema: 30 aulinhas em 6 fases de 5 (teoria-figuras.js e teoria-temas.js)
  { id: 'pausas', ic: '🤫', li: () => symbolEl('p_seminima', 'tf-sym'), nome: 'Pausas', sub: 'o silêncio também conta', cor: '#17365B', paul: FASES_PAUSAS[0].paul, fases: FASES_PAUSAS },
  { id: 'claves', ic: '🔑', li: () => symbolEl('clave_sol', 'tf-sym'), nome: 'Claves', sub: 'a chave que abre a pauta', cor: '#EBA332', paul: FASES_CLAVES[0].paul, fases: FASES_CLAVES },
  { id: 'tempo', ic: '⏱️', li: () => h('b', { class: 'tf-li-t' }, '4/4'), nome: 'Tempo e compasso', sub: 'o pulso e a fórmula', cor: '#2a9d8f', paul: FASES_TEMPO[0].paul, fases: FASES_TEMPO },
  { id: 'leitura', ic: '🎼', li: () => svgEl(56, 56, '<g stroke="currentColor" stroke-width="2.4">' + [12, 20, 28, 36, 44].map((y) => `<line x1="4" x2="52" y1="${y}" y2="${y}"/>`).join('') + '</g><ellipse cx="30" cy="32" rx="7" ry="5" transform="rotate(-20 30 32)" fill="currentColor"/><line x1="36.4" y1="30" x2="36.4" y2="6" stroke="currentColor" stroke-width="2.6"/>'), nome: 'Leitura de notas', sub: 'os nomes das notas', cor: '#7b3fe4', paul: FASES_LEITURA[0].paul, fases: FASES_LEITURA },
  // aulas por instrumento (grupo 'instrumento'): moram em #/estudos/aulas/<id>; sem código só a 1ª fase abre (amostra grátis)
  { id: 'bateria', grupo: 'instrumento', ic: '🥁', nome: 'Bateria', sub: 'peças, levada e partitura', cor: '#8e1b22', paul: FASES_BATERIA[0].paul, fases: FASES_BATERIA, gratis: 1 },
  { id: 'teclado', grupo: 'instrumento', ic: '🎹', nome: 'Teclado', sub: 'teclas, escala e acordes', cor: '#17365B', paul: FASES_TECLADO[0].paul, fases: FASES_TECLADO, gratis: 1 },
  { id: 'violao', grupo: 'instrumento', ic: '🎸', nome: 'Violão', sub: 'cordas, acordes e batida', cor: '#b57a12', paul: FASES_VIOLAO[0].paul, fases: FASES_VIOLAO, gratis: 1 },
];
export const sessaoPorId = (id) => SESSOES.find((s) => s.id === id);
/** Onde mora cada sessão: os 5 temas em #/estudos/basica/<id>, as aulas de instrumento em #/estudos/aulas/<id>. */
export const hrefDe = (s) => (s.grupo === 'instrumento' ? `#/estudos/aulas/${s.id}` : `#/estudos/basica/${s.id}`);

const FEITAS = 'beaterista-teoria-feitas';
const feitas = () => { try { return JSON.parse(localStorage.getItem(FEITAS) || '{}'); } catch { return {}; } };
const marca = (id, n) => { try { const f = feitas(); f[id] = Math.max(f[id] || 0, n); localStorage.setItem(FEITAS, JSON.stringify(f)); } catch { /* sem armazenamento */ } };
export const melhor = (id) => feitas()[id] || 0;
/** Fases de um tema: os temas antigos (só `cards` + `quiz`) contam como 1 fase. */
export const fasesDe = (s) => s.fases || [{ nome: s.nome, paul: s.paul, cards: s.cards, quiz: s.quiz }];
const chaveFase = (id, k) => (k ? `${id}:${k}` : id); // a fase 1 usa a chave antiga (não perde o que a criança já ganhou)
/** Estrelas que a pessoa já tem num tema (2 por fase) e o máximo. */
export const estrelasTema = (s) => { const f = fasesDe(s); return [f.reduce((n, _, k) => n + estrelasQuiz(melhor(chaveFase(s.id, k))), 0), f.length * 2]; };
/** Estrelas de um resultado do mini quiz. */
export const estrelasQuiz = (certas) => (certas >= 3 ? 2 : certas === 2 ? 1 : 0);

async function darEstrelas(id, n) { // cada sessão paga até 2 ★ na vida (só a diferença se melhorar), sem repetir
  if (!n) return 0;
  try { const E = await import('../jogos/estrelas-jogo.js'); return await E.ganhou('estudos', n, `teoria|${id.replace(':', '|')}`); } catch { return 0; }
}

/** `#/estudos/teoria` (lista) e `#/estudos/basica/<id>` (a sessão). `aoFim()` avisa a meta do dia. */
export function mount(host, parts = [], { aoFim } = {}) {
  const s = sessaoPorId(parts[0]);
  if (!s) return lista(host);
  const FS = fasesDe(s); const livres = s.gratis || FS.length; const trancada = (k) => alunoSemCodigo() && k >= livres; // sem código só as primeiras fases abrem
  let fi = Math.max(0, FS.findIndex((_, k) => !melhor(chaveFase(s.id, k)))); if (fi < 0 || trancada(fi)) fi = 0; // abre na 1ª fase ainda sem quiz feito
  const bot = robo({ mood: 'wave', size: 84, say: '' }); let fase = 'cards'; let vistos = new Set(); let i = 0; let certas = 0; let perguntas = [];
  const corpo = h('div', { class: 'tf-corpo' }); const fala = h('p', { class: 'au-say', 'aria-live': 'polite' });
  const cabeca = h('div', { class: 'au-top' }, bot.el, h('div', { class: 'au-bubble' }, fala));
  const F = () => FS[fi];
  const quizOn = () => { fase = 'quiz'; perguntas = emb(F().quiz).slice(0, 3); i = 0; certas = 0; desenha(); };
  const irFase = (k) => { if (trancada(k)) { toast('esta fase é só pra alunos com código. a 1ª é grátis!'); return; } fi = k; fase = 'cards'; vistos = new Set(); desenha(); try { cabeca.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch { /* sem rolagem */ } };
  /** Trilha das fases (só quando o tema tem mais de uma): número, nome e as estrelas já ganhas. */
  const trilha = () => (FS.length < 2 ? null : h('div', { class: 'tf-fases', role: 'tablist', 'aria-label': `fases de ${s.nome}` }, ...FS.map((f, k) => { const e = estrelasQuiz(melhor(chaveFase(s.id, k)));
    return h('button', { type: 'button', role: 'tab', class: `tf-fase${k === fi ? ' on' : ''}${e ? ' feita' : ''}`, 'aria-selected': String(k === fi), 'aria-label': `fase ${k + 1}: ${f.nome}${e ? `, ${e} de 2 estrelas` : ''}`, onclick: () => irFase(k) }, h('b', {}, String(k + 1)), h('i', {}, trancada(k) ? '🔒' : e ? '★'.repeat(e) : '·')); })));
  function desenha() {
    corpo.style.setProperty('--c', s.cor); const f = F();
    if (fase === 'cards') {
      bot.set('wave', ''); fala.textContent = f.paul || s.paul;
      const cartoes = f.cards.map((c, k) => { const b = h('button', { type: 'button', class: `tf-card${vistos.has(k) ? ' visto' : ''}`, 'aria-expanded': String(vistos.has(k)), onclick: () => { vistos.add(k); b.classList.add('visto', 'aberto'); b.setAttribute('aria-expanded', 'true'); if (c.som) { try { c.som(); } catch { /* sem som */ } } fala.textContent = c.txt; bot.set('music', ''); atualiza(); } },
        h('span', { class: 'tf-ic' }, c.ic()), h('b', {}, c.t), h('small', {}, ''), h('em', { class: 'tf-toque' }, '👆 toque aqui')); return b; });
      const btn = h('button', { type: 'button', class: 'btn primary wide', disabled: true, onclick: quizOn }, `mini quiz (3 perguntas)`);
      // avisa onde clicar: só o PRÓXIMO cartão fechado pisca com "👆 toque aqui"; os já abertos mostram a explicação e, se tiver som, "🔊 toque pra ouvir de novo"
      const atualiza = () => { const falta = f.cards.length - vistos.size; btn.disabled = falta > 0; btn.textContent = falta > 0 ? `vire os ${falta} cartões que faltam` : 'mini quiz: 3 perguntas ▶'; btn.classList.toggle('tf-vez', falta === 0);
        const prox = f.cards.findIndex((_, k) => !vistos.has(k));
        cartoes.forEach((b, k) => { const aberto = vistos.has(k); b.classList.toggle('vez', k === prox); b.querySelector('small').textContent = aberto ? f.cards[k].txt : ''; b.querySelector('.tf-toque').textContent = aberto ? (f.cards[k].som ? '🔊 toque pra ouvir de novo' : '') : '👆 toque aqui'; }); };
      corpo.replaceChildren(...[trilha(), FS.length > 1 ? h('p', { class: 'tf-fase-t' }, `fase ${fi + 1} de ${FS.length} · ${f.nome}`) : null, h('div', { class: 'tf-cards' }, ...cartoes), btn].filter(Boolean)); atualiza();
    } else if (fase === 'quiz') {
      const q = perguntas[i]; bot.set('think', ''); fala.textContent = `pergunta ${i + 1} de 3`;
      const ops = emb(q.ops.map((t, k) => [t, k === q.ok]));
      corpo.replaceChildren(h('div', { class: 'qz-dots' }, ...perguntas.map((_, k) => h('i', { class: k < i ? 'ok' : k === i ? 'now' : '' }))), h('h3', { class: 'tf-q' }, q.q),
        h('div', { class: 'qz-ops' }, ...ops.map(([t, certo]) => h('button', { type: 'button', class: 'btn qz-op', onclick: (e) => {
          corpo.querySelectorAll('.qz-op').forEach((x) => { x.disabled = true; }); e.currentTarget.classList.add(certo ? 'certo' : 'errado'); if (!certo) corpo.querySelectorAll('.qz-op').forEach((x) => { const o = ops.find(([tt]) => tt === x.textContent); if (o && o[1]) x.classList.add('certo'); });
          if (certo) certas++; bot.set(certo ? 'cheer' : 'oops', ''); fala.textContent = certo ? 'isso mesmo!' : 'quase! a resposta certa está em verde.';
          setTimeout(() => { i++; if (i >= 3) fim(); else desenha(); }, certo ? 800 : 1700); } }, t))));
    }
  }
  async function fim() {
    fase = 'fim'; const ch = chaveFase(s.id, fi); marca(ch, certas); const est = estrelasQuiz(certas); const ganhou = await darEstrelas(ch, est); if (aoFim) aoFim(s.id);
    bot.set(certas >= 2 ? 'cheer' : 'happy', ''); fala.textContent = certas === 3 ? 'perfeito! você mandou muito bem!' : certas === 2 ? 'muito bom! mais uma e fica perfeito.' : 'bora rever os cartões e tentar de novo!';
    const proxFase = fi + 1 < FS.length && !trancada(fi + 1) ? fi + 1 : -1; const mesmo = SESSOES.filter((x) => (x.grupo || '') === (s.grupo || '')); const prox = fi + 1 < FS.length ? null : mesmo[mesmo.findIndex((x) => x.id === s.id) + 1];
    corpo.replaceChildren(...[trilha(), h('div', { class: 'jg-result' }, h('h3', { class: 'hand' }, `${certas} de 3`), h('p', { class: 'tf-estrelas' }, '★'.repeat(est) + '☆'.repeat(2 - est)), ganhou ? h('p', {}, `+${ganhou} ★ nas suas estrelas!`) : est ? h('p', { class: 'muted' }, 'as estrelas desta fase você já ganhou.') : null),
      h('div', { class: 'jg-actions' }, proxFase >= 0 ? h('button', { class: 'btn primary', type: 'button', onclick: () => irFase(proxFase) }, `próxima fase: ${FS[proxFase].nome} ▶`) : null, h('button', { class: `btn${proxFase >= 0 ? '' : ' primary'}`, type: 'button', onclick: () => { fase = 'cards'; vistos = new Set(); desenha(); } }, 'rever os cartões'), h('button', { class: 'btn', type: 'button', onclick: quizOn }, 'quiz de novo'), proxFase < 0 ? (prox ? h('a', { class: 'btn', href: hrefDe(prox) }, `próxima: ${prox.nome} ▶`) : h('a', { class: 'btn', href: '#/estudos/aulas' }, 'todos os temas')) : null)].filter(Boolean));
  }
  host.append(banner(s.nome, s.grupo === 'instrumento' ? 'aula do Paul' : 'teoria básica com o Paul'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('a', { class: 'jg-link', href: '#/estudos/aulas' }, '‹ robôterista ensina'), cabeca, corpo));
  desenha();
  return () => {};
}
/** Os cartões dos 5 temas (com aulinhas e estrelas), pra aparecerem dentro do "Robôterista ensina". */
export const cartoesDosTemas = () => SESSOES.filter((s) => s.grupo !== 'instrumento').map((s) => { const [tem, max] = estrelasTema(s); const n = fasesDe(s).reduce((q, f) => q + f.cards.length, 0); return h('a', { class: 'es-modo tf-tema', href: hrefDe(s), style: `--c:${s.cor};--f:#fff` }, h('span', { class: 'es-mi tf-li', 'aria-hidden': 'true' }, s.li ? s.li() : s.ic), h('span', { class: 'es-mt' }, h('b', {}, s.nome), h('small', {}, `${s.sub} · ${n} aulinhas`), h('small', { class: 'tf-tema-st' }, `${'★'.repeat(tem)}${'☆'.repeat(max - tem)}`)), h('span', { class: 'es-go' }, '▶')); });
function lista(host) { // endereço antigo (#/estudos/basica): leva pro Robôterista ensina, onde os temas moram agora
  location.replace('#/estudos/aulas'); return () => {};
}
