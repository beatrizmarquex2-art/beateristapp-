// Abas "depoimentos" e "alunos tocando" da Lojinha (visual: bolinhas de stories no topo + conversa de WhatsApp).
// Tocar numa bolinha abre o visualizador de stories: tela cheia, barrinhas de progresso, toque na direita/esquerda pra trocar, passa sozinho.
import { h } from '../util.js';
import { DEPOIMENTOS, DEPOIMENTOS_VIDEO, TOCANDO, vid, capa } from '../prova-data.js';

// overlays de identidade: poses do Paul e rabiscos da Beaterista por cima das mídias (cantos, nunca no meio, pra não cobrir o rosto do aluno)
const POSES = ['n-skate', 'n-stick', 'n-walk', 'n-squat', 'n-amp', 'n-break'];
const RAB = ['d-stars', 'd-ulstar', 'd-burst', 'd-stars', 'd-ulstar', 'd-note'];
const ov = (cls, src) => h('img', { class: `pv-ov ${cls}`, src: `assets/paul/${src}.webp`, alt: '', 'aria-hidden': 'true', draggable: 'false', loading: 'lazy' });
const reduzido = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** Visualizador de stories: `lista` = vídeos, `i` = por onde começa. */
function stories(lista, i0 = 0) {
  let i = i0; let mudo = false;
  const video = h('video', { playsinline: true, preload: 'auto', class: 'st-video' });
  const bar = h('div', { class: 'st-bar', 'aria-hidden': 'true' }, ...lista.map(() => h('i', {}, h('b', {}))));
  const nome = h('span', { class: 'st-nome' });
  const som = h('button', { type: 'button', class: 'st-b', 'aria-label': 'ligar ou desligar o som', onclick: (e) => { e.stopPropagation(); mudo = !mudo; video.muted = mudo; som.textContent = mudo ? '🔇' : '🔊'; } }, '🔊');
  const fechar = h('button', { type: 'button', class: 'st-b', 'aria-label': 'fechar', onclick: (e) => { e.stopPropagation(); dlg.close(); } }, '✕');
  const esq = h('button', { type: 'button', class: 'st-zona esq', 'aria-label': 'vídeo anterior', onclick: () => ir(i - 1) });
  const dir = h('button', { type: 'button', class: 'st-zona dir', 'aria-label': 'próximo vídeo', onclick: () => ir(i + 1) });
  const marca = h('div', { class: 'st-ov', 'aria-hidden': 'true' }, ov('st-paul', 'n-walk'), h('span', { class: 'st-tag' }, '@beaterista_ · beaterista.com.br'));
  const dlg = h('dialog', { class: 'st-dlg', 'aria-label': 'vídeos dos alunos' }, video, marca, bar, h('div', { class: 'st-top' }, nome, som, fechar), esq, dir);
  const barras = () => [...bar.children].forEach((el, k) => { const b = el.firstChild; b.style.width = k < i ? '100%' : k > i ? '0%' : b.style.width; });
  const ir = (k) => {
    if (k < 0) k = 0; if (k >= lista.length) { dlg.close(); return; }
    i = k; const v = lista[i]; nome.textContent = v.titulo || ''; marca.firstChild.src = `assets/paul/${POSES[i % POSES.length]}.webp`; video.src = vid(v.n); video.muted = mudo; video.currentTime = 0; barras();
    const p = video.play(); if (p && p.catch) p.catch(() => { video.muted = true; mudo = true; som.textContent = '🔇'; video.play().catch(() => {}); });
  };
  video.addEventListener('timeupdate', () => { const b = bar.children[i] && bar.children[i].firstChild; if (b && video.duration) b.style.width = `${(video.currentTime / video.duration) * 100}%`; });
  video.addEventListener('ended', () => ir(i + 1));
  const tecla = (e) => { if (e.key === 'ArrowRight') ir(i + 1); else if (e.key === 'ArrowLeft') ir(i - 1); };
  dlg.addEventListener('keydown', tecla);
  dlg.addEventListener('close', () => { try { video.pause(); video.removeAttribute('src'); video.load(); } catch { /* ok */ } dlg.remove(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); ir(i0);
}

/** Fileira de bolinhas (anel colorido) que abre os stories. */
const bolinhas = (lista) => h('div', { class: 'pv-st', role: 'list' }, ...lista.map((v, k) => h('button', { type: 'button', role: 'listitem', class: 'pv-bol', 'aria-label': `assistir ${v.titulo || 'vídeo'}`, onclick: () => stories(lista, k) },
  h('span', { class: 'pv-ring' }, h('img', { src: capa(v.n), alt: '', width: 64, height: 64, loading: 'lazy' })), h('small', {}, v.titulo || 'aluno'))));

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
    h('h2', { class: 'pv-h' }, 'alunos da Beaterista'), h('p', { class: 'pv-s' }, 'toque numa bolinha pra assistir'), bolinhas(DEPOIMENTOS_VIDEO),
    chips, chat);
}
export function tocando() {
  return h('div', { class: 'pv' },
    h('h2', { class: 'pv-h' }, 'alunos tocando'), h('p', { class: 'pv-s' }, 'quem treina em casa e marca a gente. toque numa bolinha!'), bolinhas(TOCANDO),
    h('div', { class: 'pv-grid' }, ...TOCANDO.map((v, k) => h('button', { type: 'button', class: 'pv-vid', 'aria-label': `assistir ${v.titulo}`, onclick: () => stories(TOCANDO, k) }, h('img', { class: 'pv-capa', src: capa(v.n), alt: '', loading: 'lazy', width: 180, height: 320 }), ov('pv-rab', RAB[k % RAB.length]), ov('pv-ps', POSES[k % POSES.length]), h('i', { 'aria-hidden': 'true' }, '▶'), h('small', {}, v.titulo)))));
}
export { reduzido };
