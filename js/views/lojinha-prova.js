// Aba "depoimentos" da Lojinha: só TEXTO, em conversa de WhatsApp (sem foto, vídeo nem nome de aluno).
import { h } from '../util.js';
import { DEPOIMENTOS } from '../prova-data.js';

const TEMA_KEY = 'beaterista-depo-tema';
const lerTema = () => { try { return localStorage.getItem(TEMA_KEY) === 'escuro' ? 'escuro' : 'claro'; } catch { return 'claro'; } };
const gravarTema = (t) => { try { localStorage.setItem(TEMA_KEY, t); } catch { /* sem armazenamento: vale só agora */ } };
const REACOES = ['❤️', '🥁', '', '🔥', '🤘', ''];
const POSE_ZAP = { claro: 'n-skate', escuro: 'n-amp' };

/** Depoimentos em conversa (modelo "zap" da Beaterista) com dois temas: claro (papel creme) e escuro (azul-marinho de pôster). */
export function depoimentos() {
  let tema = lerTema();
  const chat = h('div', { class: 'zp' });
  const chips = h('div', { class: 'zp-chips', role: 'group', 'aria-label': 'tema da conversa' });
  const desenha = () => {
    chat.className = `zp zp-${tema}`;
    chips.replaceChildren(...['claro', 'escuro'].map((t) => h('button', { type: 'button', class: `kd-chip${tema === t ? ' on' : ''}`, 'aria-pressed': String(tema === t), onclick: () => { tema = t; gravarTema(t); desenha(); } }, t)));
    chat.replaceChildren(
      h('div', { class: 'zp-head' }, h('img', { src: 'assets/paul/n-stick.webp', alt: '', width: 44, height: 44 }), h('div', {}, h('b', {}, 'alunos da Beaterista'), h('small', {}, `online · ${DEPOIMENTOS.length} depoimentos`))),
      h('div', { class: 'zp-body', role: 'list', 'aria-label': 'depoimentos' },
        h('span', { class: 'zp-dia' }, 'o que dizem'),
        ...DEPOIMENTOS.map((d, k) => h('div', { class: 'zp-m', role: 'listitem' }, h('span', { class: 'zp-nome' }, d.de), d.txt, h('small', {}, '✓✓'), REACOES[k % REACOES.length] ? h('span', { class: 'zp-re', 'aria-hidden': 'true' }, REACOES[k % REACOES.length]) : null))),
      h('img', { class: 'zp-paul', src: `assets/paul/${POSE_ZAP[tema]}.webp`, alt: '', 'aria-hidden': 'true', draggable: 'false' }));
  };
  desenha();
  return h('div', { class: 'pv' },
    h('h2', { class: 'pv-h' }, 'alunos da Beaterista'), h('p', { class: 'pv-s' }, 'o que dizem quem já estuda com a gente'),
    chips, chat);
}
