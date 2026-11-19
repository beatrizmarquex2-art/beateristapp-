// Boas-vindas da primeira vez (opção B "tela cheia, palco à noite", escolha da Bea): aparece UMA vez, depois que alguém entra em "experimentar grátis" (só o nome, sem código).
// Quem já é aluno (tem código) não vê. Os 3 cartões levam pra Palco, Jogos ou Estudos; "tenho um código" abre a folha do código.
import { h } from './util.js';

const KEY = 'beaterista-boas-vindas-vista';
export const jaViu = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
const marcaVista = () => { try { localStorage.setItem(KEY, '1'); } catch { /* sem armazenamento */ } };

/** Mostra a tela. `nome`: como chamar a pessoa. `aoCodigo`: abre a folha "tenho código". Devolve a função que fecha. */
export function mostrar({ nome = '', aoCodigo = () => {} } = {}) {
  if (jaViu() || document.querySelector('.bv-tela')) return () => {};
  const antes = document.activeElement;
  const fecha = (rota) => { marcaVista(); el.classList.add('out'); setTimeout(() => { el.remove(); document.body.classList.remove('bv-aberta'); if (antes && antes.isConnected && antes.focus) antes.focus(); }, 220); if (rota) location.hash = rota; };
  const cartao = (ic, t1, t2, rota) => h('button', { type: 'button', class: 'bv-card', onclick: () => fecha(rota) }, h('span', { 'aria-hidden': 'true' }, ic), h('b', {}, t1), h('small', {}, t2));
  const el = h('div', { class: 'bv-tela', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'boas-vindas' },
    h('div', { class: 'bv-luz', 'aria-hidden': 'true' }),
    h('p', { class: 'bv-tag' }, 'primeira vez por aqui'),
    h('img', { class: 'bv-paul', src: 'assets/paul/colorido/paul-festa.webp', alt: '', draggable: 'false' }),
    h('h1', { class: 'bv-oi' }, nome ? `oi, ${nome}!` : 'oi!'),
    h('p', { class: 'bv-sub' }, 'eu sou o Paul. escolha por onde começar:'),
    h('div', { class: 'bv-tres' }, cartao('♪', 'palco', 'toque', '#/tocar'), cartao('★', 'jogos', 'ganhe', '#/jogos'), cartao('?', 'estudos', 'aprenda', '#/estudos')),
    h('button', { type: 'button', class: 'bv-ir', onclick: () => fecha() }, 'entrar no app'),
    h('button', { type: 'button', class: 'bv-cod', onclick: () => { fecha(); setTimeout(aoCodigo, 260); } }, 'tenho um código de aluno'));
  document.body.append(el); document.body.classList.add('bv-aberta');
  const ir = el.querySelector('.bv-ir'); if (ir) ir.focus({ preventScroll: true });
  return () => fecha();
}
