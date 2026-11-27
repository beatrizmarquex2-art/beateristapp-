// Beaterista PRO: casca do app (menu lateral retrátil, rotas por hash, login). Cada tela é um módulo em js/pro/. O PLAY não é tocado.
import { h, ICONE, aviso } from './ui.js';
import * as auth from '../auth.js';
import * as D from './dados.js';
import * as entrada from './entrada.js';
import * as inicio from './inicio.js';
import * as aulas from './aulas.js';
import * as estudio from './estudio.js';
import * as biblioteca from './biblioteca.js';
import * as alunos from './alunos.js';
import * as assistente from './assistente.js';
import * as agenda from './agenda.js';
import * as conta from './conta.js';

const NAV = [['inicio', 'Início'], ['aulas', 'Criador de aulas'], ['estudio', 'Estúdio'], ['biblioteca', 'Biblioteca'], ['alunos', 'Alunos'], ['agenda', 'Agenda'], ['assistente', 'Assistente']];
const TELAS = { inicio, aulas, estudio, biblioteca, alunos, agenda, assistente };
const app = document.getElementById('pro');
const lembra = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* sem storage */ } return null; };
let limpa = () => {}; let ctx = null;

function casca() {
  const nav = h('nav', { class: 'ps-nav', 'aria-label': 'Principal' }, ...NAV.map(([k, t]) => { const a = h('a', { href: `#/${k}`, 'data-k': k, title: t }); a.innerHTML = `${ICONE[k]}<span>${t}</span>`; return a; }));
  const sair = h('a', { href: '#/conta', class: 'ps-perfil', 'data-k': 'conta', title: 'Meu perfil' }); sair.innerHTML = `${ICONE.alunos}<span class="ps-quem">${(ctx.perfil.nome || auth.userEmail() || 'Meu perfil').split(' ')[0]}</span>`;
  const rec = h('button', { type: 'button', class: 'ps-rec', 'aria-label': 'Recolher ou abrir o menu', 'aria-expanded': 'true' }); rec.innerHTML = ICONE.menu;
  const side = h('aside', { class: 'ps' }, h('div', { class: 'ps-logo' }, h('b', {}, 'BEATERISTA'), h('i', {}, 'PRO')), nav, sair, rec);
  const topo = h('header', { class: 'pm' }, h('button', { type: 'button', class: 'pm-b', 'aria-label': 'Abrir o menu' }), h('div', { class: 'ps-logo peq' }, h('b', {}, 'BEATERISTA'), h('i', {}, 'PRO')));
  topo.firstChild.innerHTML = ICONE.menu;
  const main = h('main', { class: 'pc', id: 'pro-main', tabindex: -1 });
  const ap = h('div', { class: 'psh' }, side, topo, main, h('div', { class: 'ps-vel' }));
  const colapsa = (v) => { ap.classList.toggle('mini', v); rec.setAttribute('aria-expanded', String(!v)); lembra('pro-mini', v ? '1' : '0'); };
  colapsa(lembra('pro-mini') === '1' && innerWidth >= 900);
  rec.addEventListener('click', () => { if (innerWidth < 900) ap.classList.toggle('aberto'); else colapsa(!ap.classList.contains('mini')); });
  topo.firstChild.addEventListener('click', () => ap.classList.add('aberto')); ap.querySelector('.ps-vel').addEventListener('click', () => ap.classList.remove('aberto'));
  app.replaceChildren(ap); return main;
}

async function rota() {
  if (!ctx) return; const main = document.getElementById('pro-main'); if (!main) return;
  const partes = (location.hash.replace(/^#\//, '') || 'inicio').split('/'); const k = partes[0];
  try { limpa(); } catch { /* ok */ } limpa = () => {};
  document.querySelectorAll('[data-k]').forEach((a) => a.classList.toggle('on', a.dataset.k === k || (k === 'editor' && a.dataset.k === 'estudio')));
  document.querySelector('.psh')?.classList.remove('aberto'); main.replaceChildren();
  if (!ctx.perfil.nome && k !== 'conta') { location.hash = '#/conta'; return; }
  let r;
  if (k === 'conta') r = conta.mount(main, ctx, partes, { primeira: !ctx.perfil.nome });
  else if (k === 'editor') { const m = await import('../views/editor-partitura.js'); r = m.mount(main, { voltar: '#/estudio', rodape: `Beaterista PRO${ctx.perfil.escola ? ` · ${ctx.perfil.escola}` : ''}`, semPapel: true }); }
  else r = (TELAS[k] || inicio).mount(main, ctx, partes);
  const f = await r; if (typeof f === 'function') limpa = f; main.scrollTo?.(0, 0);
}

async function entra() {
  try { const perfil = await D.perfil(); ctx = { perfil }; }
  catch (e) { app.replaceChildren(h('main', { class: 'pe' }, h('section', { class: 'pe-cx' }, h('h1', { class: 'pe-h' }, 'Quase lá'), h('p', { class: 'pe-sub' }, D.textoErro(e)), h('button', { class: 'pb', onclick: async () => { await auth.signOut(); location.reload(); } }, 'Sair')))); return; }
  casca(); rota();
}
window.addEventListener('hashchange', rota);
(async () => {
  await auth.loadSession(); if (auth.getSession()) { await auth.refresh(); }
  if (auth.getSession()) entra(); else { app.replaceChildren(); entrada.mount(app, { aoEntrar: async (nome) => { if (nome) { try { await D.perfil(); await D.gravarPerfil({ nome }); } catch { /* a tela de perfil pede o nome */ } } entra(); } }); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
void aviso;
