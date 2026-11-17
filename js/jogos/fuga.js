// A Fuga do Estúdio: o Paul ficou trancado no estúdio e só sai abrindo 3 portas em ordem.
//  porta 1 · sala de controle = quiz (5 perguntas, precisa de 3 certas) · porta 2 · cabine = caça-palavras · porta 3 · sala de ensaio = cruzadinha.
// Reaproveita os três jogos de palavras (modo "D" do duelo: sem estrela e sem recorde próprios); no fim paga 3 ★ (limite de 30 ★ por dia, como todo jogo).
import { h } from '../util.js';
import { banner } from '../ui.js';
import * as FB from '../feedback.js';
import { alunoSemCodigo, avisoCodigo } from '../amostra.js';
import { corSrc } from '../paul-cor.js';
import { ganhou } from './estrelas-jogo.js';

export const PORTAS = [
  { id: 'quiz', nome: 'sala de controle', ic: '🎛️', fala: 'acerte 3 de 5 perguntas pra destravar a mesa de som!' },
  { id: 'caca', nome: 'cabine de gravação', ic: '🎙️', fala: 'ache todas as palavras escondidas na grade!' },
  { id: 'cruz', nome: 'sala de ensaio', ic: '🥁', fala: 'complete a cruzadinha pra abrir a última porta!' },
];
export const MIN_QUIZ = 3;
const KB = 'beaterista-fuga-melhor';
const melhor = () => { try { return Number(localStorage.getItem(KB)) || 0; } catch { return 0; } };
const seg = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export function mount(host) {
  const box = h('div', { class: 'dc-box' }); let gone = false; let t0 = 0; let abertas = 0; let tentativas = 0;
  const wrap = h('div', { class: 'jg jg-wrap dc-wrap fg-wrap' });
  host.append(banner('A Fuga do Estúdio', 'o Paul está trancado!'), wrap);
  const portas = () => h('div', { class: 'fg-portas', role: 'list' }, ...PORTAS.map((p, i) => h('div', { role: 'listitem', class: `fg-porta${i < abertas ? ' aberta' : i === abertas ? ' vez' : ''}`, 'aria-label': `${p.nome}, ${i < abertas ? 'aberta' : i === abertas ? 'a da vez' : 'trancada'}` },
    h('span', { class: 'fg-i' }, i < abertas ? '🔓' : i === abertas ? p.ic : '🔒'), h('small', {}, p.nome))));
  const topo = () => h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'));
  const fala = (txt, ...extra) => h('section', { class: 'card pad fg-fala' }, h('img', { src: corSrc('professor'), alt: '', draggable: 'false', width: 84, height: 84 }), h('p', {}, txt), ...extra);
  const comeca = () => { abertas = 0; tentativas = 0; t0 = Date.now(); fase(); };
  const intro = () => wrap.replaceChildren(topo(), portas(), fala('socorro! a porta do estúdio trancou comigo aqui dentro 😱 só saio se você abrir as 3 portas: quiz, caça-palavras e cruzadinha. bora?',
    h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'abrir as portas'), melhor() ? h('p', { class: 'muted' }, `seu recorde: ${seg(melhor())}`) : null));
  const fase = async () => {
    if (gone) return; const P = PORTAS[abertas]; const mod = (await import('../views/dicas.js'))._duelo; const T = await import('../tips.js'); if (gone) return;
    const its = mod.items(); box.replaceChildren(); let api = null; let feito = false;
    const fim = () => setTimeout(() => { if (gone || feito) return; feito = true; resolve(); }, 700);
    const resolve = () => {
      if (P.id === 'quiz' && api && api.stats().found < MIN_QUIZ) { tentativas++; wrap.replaceChildren(topo(), portas(), fala(`só ${api.stats().found} certa${api.stats().found === 1 ? '' : 's'}: a mesa de som precisa de ${MIN_QUIZ}. tenta de novo!`, h('button', { class: 'btn primary wide', type: 'button', onclick: fase }, 'tentar outra vez'))); return; }
      abertas++; if (abertas >= PORTAS.length) { vitoria(); return; }
      wrap.replaceChildren(topo(), portas(), fala(`porta aberta! 🔓 agora: ${PORTAS[abertas].nome}. ${PORTAS[abertas].fala}`, h('button', { class: 'btn primary wide', type: 'button', onclick: fase }, 'próxima porta')));
    };
    wrap.replaceChildren(topo(), portas(), h('p', { class: 'tr-count' }, `${P.nome} · ${P.fala}`), box);
    if (P.id === 'quiz') { const qs = []; const vistos = new Set(); for (let k = 0; k < 80 && qs.length < Math.min(5, its.length); k++) { const q = T.question(its, ['blank', 'continua'][k % 2]); if (!vistos.has(q.item.n)) { vistos.add(q.item.n); qs.push(q); } } api = mod.quiz(box, ['blank', 'continua'], 'fuga', { qs, fim }); }
    else if (P.id === 'caca') api = mod.caca(box, { pick: T.easyPick(its, 6), mk: () => Math.random, fim });
    else api = mod.cruzadinha(box, { pick: T.easyPick(its, 5, { min: 4, max: 8 }), mk: () => Math.random, fim });
  };
  const vitoria = () => {
    const ms = Date.now() - t0; const rec = melhor(); const novo = !rec || ms < rec; if (novo) { try { localStorage.setItem(KB, String(ms)); } catch { /* sem armazenamento */ } }
    ganhou('fuga', 3).catch(() => {});
    const tela = fala(`💥 você abriu as 3 portas e libertou o Paul! tempo: ${seg(ms)}${tentativas ? ` · ${tentativas} tentativa${tentativas === 1 ? '' : 's'} na mesa de som` : ''}`, h('p', { class: 'muted' }, novo ? '🏆 novo recorde!' : `seu recorde: ${seg(rec)}`), h('p', { class: 'muted' }, '+ até 3 ★ (limite de 30 por dia)'),
      h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'fugir de novo'), h('a', { class: 'btn ghost wide', href: '#/jogos' }, 'voltar pros jogos'));
    wrap.replaceChildren(topo(), portas(), tela); FB.great(tela);
  };
  if (alunoSemCodigo()) wrap.replaceChildren(topo(), avisoCodigo('a Fuga do Estúdio é pra alunos da Beaterista: usa as dicas do método. peça seu código pra professora Bea!'));
  else import('../views/dicas.js').then((m) => { if (gone) return; if (m._duelo.items().length < 6) wrap.replaceChildren(topo(), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'abre o app com internet uma vez e volta aqui.'))); else intro(); });
  return () => { gone = true; };
}
