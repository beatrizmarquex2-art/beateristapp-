// Abas "depoimentos" e "alunos tocando" da Lojinha: conversas (balões), vídeos de depoimento e vídeos dos alunos tocando. Design claro.
import { h } from '../util.js';
import { DEPOIMENTOS, DEPOIMENTOS_VIDEO, TOCANDO, vid, capa } from '../prova-data.js';

function abrir(v) {
  const video = h('video', { src: vid(v.n), controls: true, playsinline: true, autoplay: true, preload: 'metadata' });
  const dlg = h('dialog', { class: 'pv-dlg', 'aria-label': v.titulo || 'vídeo' }, h('button', { type: 'button', class: 'lj-x pv-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕'), video);
  dlg.addEventListener('close', () => { try { video.pause(); } catch { /* ok */ } dlg.remove(); }); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}
const grade = (lista) => h('div', { class: 'pv-grid' }, ...lista.map((v) => h('button', { type: 'button', class: 'pv-vid', 'aria-label': `assistir ${v.titulo || 'vídeo'} ${v.n}`, onclick: () => abrir(v) },
  h('img', { src: capa(v.n), alt: '', loading: 'lazy', width: 180, height: 320 }), h('i', { 'aria-hidden': 'true' }, '▶'), v.titulo ? h('small', {}, v.titulo) : null)));

export function depoimentos() {
  return h('div', { class: 'pv' },
    h('h2', { class: 'pv-h' }, 'o que os alunos estão dizendo'),
    h('div', { class: 'pv-baloes' }, ...DEPOIMENTOS.map((d, i) => h('figure', { class: `pv-bal c${i % 3}` }, h('blockquote', {}, d.txt), h('figcaption', {}, d.de)))),
    h('h2', { class: 'pv-h' }, 'em vídeo'), grade(DEPOIMENTOS_VIDEO));
}
export function tocando() {
  return h('div', { class: 'pv' }, h('h2', { class: 'pv-h' }, 'alunos tocando'), h('p', { class: 'pv-s' }, 'quem treina em casa e marca a gente. bora tocar junto?'), grade(TOCANDO));
}
