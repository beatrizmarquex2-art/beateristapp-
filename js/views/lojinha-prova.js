// Abas "depoimentos" e "alunos tocando" da Lojinha (visual: bolinhas de stories no topo + conversa de WhatsApp).
// Tocar numa bolinha abre o visualizador de stories: tela cheia, barrinhas de progresso, toque na direita/esquerda pra trocar, passa sozinho.
import { h } from '../util.js';
import { DEPOIMENTOS, DEPOIMENTOS_VIDEO, TOCANDO, vid, capa } from '../prova-data.js';

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
  const dlg = h('dialog', { class: 'st-dlg', 'aria-label': 'vídeos dos alunos' }, video, bar, h('div', { class: 'st-top' }, nome, som, fechar), esq, dir);
  const barras = () => [...bar.children].forEach((el, k) => { const b = el.firstChild; b.style.width = k < i ? '100%' : k > i ? '0%' : b.style.width; });
  const ir = (k) => {
    if (k < 0) k = 0; if (k >= lista.length) { dlg.close(); return; }
    i = k; const v = lista[i]; nome.textContent = v.titulo || ''; video.src = vid(v.n); video.muted = mudo; video.currentTime = 0; barras();
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

export function depoimentos() {
  return h('div', { class: 'pv' },
    h('h2', { class: 'pv-h' }, 'alunos da Beaterista'), h('p', { class: 'pv-s' }, 'toque numa bolinha pra assistir'), bolinhas(DEPOIMENTOS_VIDEO),
    h('div', { class: 'pv-zap', role: 'list', 'aria-label': 'depoimentos' }, ...DEPOIMENTOS.map((d) => h('div', { class: 'pv-m', role: 'listitem' }, d.txt, h('small', {}, d.de)))));
}
export function tocando() {
  return h('div', { class: 'pv' },
    h('h2', { class: 'pv-h' }, 'alunos tocando'), h('p', { class: 'pv-s' }, 'quem treina em casa e marca a gente. toque numa bolinha!'), bolinhas(TOCANDO),
    h('div', { class: 'pv-grid' }, ...TOCANDO.map((v, k) => h('button', { type: 'button', class: 'pv-vid', 'aria-label': `assistir ${v.titulo}`, onclick: () => stories(TOCANDO, k) }, h('img', { src: capa(v.n), alt: '', loading: 'lazy', width: 180, height: 320 }), h('i', { 'aria-hidden': 'true' }, '▶'), h('small', {}, v.titulo)))));
}
export { reduzido };
