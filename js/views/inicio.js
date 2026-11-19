// Aba INÍCIO (prévia, aparece só com ?inicio=1): o "passe do aluno" com nível, dias seguidos, desafio de hoje e semana.
// O que é de verdade: nome, código (mascarado), estrelas (as mesmas do álbum/roleta), "continuar de onde parou" (ultimo-jogo.js) e os dias de uso.
// O que é regra nova minha (a Bea ainda não aprovou): XP = 10 por estrela, nível a cada 100 XP e os títulos de nível.
import { h } from '../util.js';
import * as CODE from '../codigo.js';
import * as P from '../kids/progress.js';
import * as ESTRELAS from '../figurinhas/estrelas.js';
import { ultimoJogo } from '../ultimo-jogo.js';

const DIAS_KEY = 'bt-inicio-dias';
const dia = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lerDias = () => { try { const a = JSON.parse(localStorage.getItem(DIAS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
/** Conta o dia de hoje como "dia de uso" (chamado a cada tela que o aluno abre). */
export function marcaDia() { try { const a = lerDias(); const hoje = dia(); if (a[a.length - 1] !== hoje) { a.push(hoje); localStorage.setItem(DIAS_KEY, JSON.stringify(a.slice(-90))); } } catch { /* sem armazenamento */ } }
/** Dias seguidos até hoje (se hoje ainda não entrou, conta até ontem). */
export function sequencia() {
  const set = new Set(lerDias()); let n = 0; const d = new Date(); if (!set.has(dia(d))) d.setDate(d.getDate() - 1);
  while (set.has(dia(d))) { n++; d.setDate(d.getDate() - 1); } return n;
}
const TITULOS = ['aprendiz de garagem', 'baterista de garagem', 'músico de palco', 'mestre do ritmo', 'lenda do groove'];
const SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export function mount(host, { nome = '' } = {}) {
  let pid = null; try { const a = P.active(); pid = a && a.id; } catch { /* sem perfil ainda */ }
  let estrelas = 0; try { estrelas = pid ? ESTRELAS.estrelasTotais(pid) : 0; } catch { estrelas = 0; }
  let faltam = null; try { faltam = ESTRELAS.faltamParaRoleta(estrelas); } catch { faltam = null; }
  const xp = estrelas * 10; const nivel = Math.floor(xp / 100) + 1; const noNivel = xp % 100; const titulo = TITULOS[Math.min(TITULOS.length - 1, Math.floor((nivel - 1) / 3))];
  const seq = sequencia(); const set = new Set(lerDias()); const hoje = new Date(); const idxHoje = (hoje.getDay() + 6) % 7;
  const cod = (() => { try { const c = CODE.saved(); return c ? CODE.mascarar(c) : ''; } catch { return ''; } })();
  const u = (() => { try { return ultimoJogo(); } catch { return null; } })();

  const passe = h('section', { class: 'in-passe', 'aria-label': 'passe do aluno' },
    h('i', { class: 'in-furo', 'aria-hidden': 'true' }),
    h('p', { class: 'in-tag' }, 'beaterista · passe do aluno'),
    h('h1', { class: 'in-nome' }, nome || 'aluno'),
    h('p', { class: 'in-nivel' }, `nível ${nivel} · ${titulo}`),
    h('div', { class: 'in-xp', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': noNivel, 'aria-label': 'XP até o próximo nível' }, h('i', { style: `width:${noNivel}%` })),
    h('p', { class: 'in-xpn' }, `${noNivel} / 100 XP pro nível ${nivel + 1}`),
    h('div', { class: 'in-foto' }, h('img', { src: 'assets/paul/sprites/bateria-idle_02.webp', alt: '' })),
    cod ? h('p', { class: 'in-cod' }, `CÓDIGO ${cod}`) : null,
    h('div', { class: 'in-selos', 'aria-hidden': 'true' }, h('i', {}, '★'), h('i', {}, '♪'), h('i', {}, '●')));

  const tres = h('div', { class: 'in-tres' },
    h('div', {}, h('b', {}, String(seq)), h('small', {}, seq === 1 ? 'dia seguido' : 'dias seguidos')),
    h('div', {}, h('b', {}, String(estrelas)), h('small', {}, 'estrelas')),
    h('div', {}, h('b', {}, faltam == null ? '–' : String(faltam)), h('small', {}, 'pra próxima roleta')));

  const hojeCard = h('section', { class: 'in-hoje' },
    h('small', {}, u ? 'continue de onde parou' : 'desafio de hoje'),
    h('h2', {}, u ? u.nome : 'comece por um jogo de ritmo'),
    h('a', { class: 'in-btn', href: u ? u.href : '#/jogos' }, u ? 'continuar ▶' : 'ver os jogos ▶'),
    h('img', { src: 'assets/paul/sprites/danca-up.webp', alt: '', 'aria-hidden': 'true' }));

  const dias = h('div', { class: 'in-dias' }, ...SEMANA.map((n, i) => {
    const d = new Date(hoje); d.setDate(hoje.getDate() - idxHoje + i); const f = set.has(dia(d)); const ehHoje = i === idxHoje;
    return h('div', { class: `${f ? 'f' : ''}${ehHoje ? ' h' : ''}` }, h('i', {}, f ? '✓' : ehHoje ? '●' : ''), n);
  }));
  const semana = h('section', { class: 'in-semana' }, h('h3', {}, 'sua semana', h('span', {}, `${SEMANA.filter((_, i) => { const d = new Date(hoje); d.setDate(hoje.getDate() - idxHoje + i); return set.has(dia(d)); }).length} de 7 dias`)), dias);

  const atalhos = h('div', { class: 'in-prox' },
    h('a', { href: '#/jogos' }, h('b', {}, 'jogos'), 'Hero Drum, Piano Hero, Beat Hero e mais'),
    h('a', { href: '#/estudos' }, h('b', {}, 'estudos'), 'aulas do Paul e dicionário'),
    h('a', { href: '#/tocar' }, h('b', {}, 'palco'), 'bateria, violão, teclado e xilofone'),
    h('a', { href: '#/lojinha' }, h('b', {}, 'lojinha'), 'cards e apostilas pra imprimir'));

  host.append(h('div', { class: 'inicio' }, passe, tres, hojeCard, semana, atalhos));
  return () => {};
}
