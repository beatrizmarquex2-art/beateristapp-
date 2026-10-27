import { h } from '../util.js';
import * as auth from '../auth.js';

export function mountLogin(host, onDone) {
  const email = h('input', { type: 'email', autocomplete: 'username', inputmode: 'email', autocapitalize: 'off', autocorrect: 'off', required: true, 'aria-label': 'E-mail' });
  const pass = h('input', { type: 'password', autocomplete: 'current-password', required: true, 'aria-label': 'Senha' });
  const err = h('p', { class: 'form-err', role: 'alert' }, '');
  const btn = h('button', { class: 'btn primary wide', type: 'submit' }, 'entrar');
  const form = h('form', { class: 'login-card', onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true; btn.textContent = 'entrando…';
    try { await auth.signIn(email.value.trim(), pass.value); pass.value = ''; onDone(); }
    catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.textContent = 'entrar'; }
  } },
    h('img', { class: 'login-logo', src: 'assets/logo-512.png', alt: 'Escola de Música Beaterista', width: 132, height: 132 }),
    h('h1', { class: 'login-title login-wordmark' }, h('img', { src: 'assets/logo-nome.png', alt: 'Beaterista, escola de música', width: 220, height: 74 })),
    h('p', { class: 'muted center' }, 'seu estúdio na palma da mão'),
    h('img', { class: 'login-paul', src: 'assets/paul/e23.webp', alt: 'Robôterista Paul' }),
    h('p', { class: 'login-paul-name' }, 'Robôterista Paul'),
    auth.configured() ? null : h('p', { class: 'form-err', role: 'alert' }, 'O servidor de login ainda não foi configurado neste app (js/config.js). Sem ele não é possível entrar.'),
    h('label', { class: 'field' }, h('span', {}, 'e-mail'), email),
    h('label', { class: 'field' }, h('span', {}, 'senha'), pass),
    err, btn,
    h('p', { class: 'muted center' }, 'Acesso privado. O primeiro login precisa de internet.'));
  host.append(h('main', { class: 'login' }, form));
  if (!auth.configured()) btn.disabled = true;
}
