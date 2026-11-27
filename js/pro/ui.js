// Peças de tela do PRO (sem depender do visual do PLAY): campos, diálogo, aviso e ícones.
import { h } from '../util.js';
export { h };

const tr = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const ICONE = {
  inicio: tr('M4 11l8-7 8 7M6 10v10h12V10'),
  aulas: tr('M5 4h11l3 3v13H5zM8 10h8M8 14h8M8 18h5'),
  estudio: tr('M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z'),
  biblioteca: tr('M5 4v16M10 4v16M15 6l4 14M3 20h18'),
  alunos: tr('M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-7 8-7s8 3 8 7'),
  assistente: tr('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z'),
  pedaleira: tr('M5 7h14v10H5zM8.5 12a1.5 1.5 0 1 0 0 .01M15.5 12a1.5 1.5 0 1 0 0 .01M12 9v6'),
  mais2: tr('M5 12h.01M12 12h.01M19 12h.01'),
  banco: tr('M12 3l2.2 5 5.3.5-4 3.6 1.2 5.2L12 14.6 7.3 17.3l1.2-5.2-4-3.6 5.3-.5z'),
  agenda: tr('M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'),
  menu: tr('M4 7h16M4 12h16M4 17h16'),
  sair: tr('M10 5H5v14h5M15 8l4 4-4 4M19 12H9'),
  mais: tr('M12 5v14M5 12h14'),
  fechar: tr('M6 6l12 12M18 6L6 18'),
  seta: tr('M5 12h14M13 6l6 6-6 6'),
};

let tTimer = 0;
export function aviso(msg, ms = 3200) {
  let el = document.getElementById('pro-aviso'); if (!el) { el = h('div', { id: 'pro-aviso', role: 'status', 'aria-live': 'polite' }); document.body.append(el); }
  el.textContent = msg; el.classList.add('on'); clearTimeout(tTimer); tTimer = setTimeout(() => el.classList.remove('on'), ms);
}

/** Campo com rótulo. `ctl` = input/select/textarea já criado. */
export const campo = (rotulo, ctl, dica = '') => h('label', { class: 'pf' }, h('span', { class: 'pf-r' }, rotulo), ctl, dica ? h('small', { class: 'pf-d' }, dica) : null);
export const entrada = (attrs = {}) => h('input', { class: 'pi', type: 'text', autocomplete: 'off', ...attrs });
export const area = (attrs = {}) => h('textarea', { class: 'pi', rows: 4, ...attrs });
export const escolha = (opcoes, atual, attrs = {}) => { const s = h('select', { class: 'pi', ...attrs }, ...opcoes.map(([v, t]) => h('option', { value: v }, t))); s.value = atual; return s; };

/** Diálogo (folha lateral no computador, de baixo no celular). `corpo(fechar)` devolve o conteúdo. */
export function dialogo(titulo, corpo, { largo = false, aoFechar = null } = {}) {
  const d = h('dialog', { class: `pd${largo ? ' largo' : ''}`, 'aria-label': titulo });
  let fechado = false; const fechar = () => { if (fechado) return; fechado = true; try { d.close(); } catch { /* já fechou */ } d.remove(); if (aoFechar) aoFechar(); };
  d.append(h('header', { class: 'pd-t' }, h('h2', {}, titulo), h('button', { type: 'button', class: 'pb-i', 'aria-label': 'Fechar', onclick: fechar })));
  d.querySelector('button').innerHTML = ICONE.fechar;
  d.append(h('div', { class: 'pd-c' }, corpo(fechar)));
  d.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
  d.addEventListener('click', (e) => { if (e.target === d) fechar(); });
  document.body.append(d); d.showModal(); return fechar;
}
export function confirma(titulo, texto, ok = 'Apagar') {
  return new Promise((res) => {
    let r = false;
    dialogo(titulo, (c) => h('div', {}, h('p', {}, texto), h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: c }, 'Cancelar'), h('button', { type: 'button', class: 'pb perigo', onclick: () => { r = true; c(); } }, ok))), { aoFechar: () => res(r) });
  });
}
export const quandoTxt = (t) => { try { return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(t)); } catch { return ''; } };
export const diaTxt = (t) => { try { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(t)); } catch { return ''; } };
export const vazio = (titulo, texto, acao) => h('div', { class: 'pv' }, h('p', { class: 'pv-t' }, titulo), h('p', { class: 'pv-x' }, texto), acao || null);
