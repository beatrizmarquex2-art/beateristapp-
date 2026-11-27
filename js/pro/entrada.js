// Tela de entrada do PRO: entrar, criar conta e recuperar a senha (Supabase Auth, cada professor com a sua conta).
import { h, campo, entrada, aviso } from './ui.js';
import { CONFIG } from '../config.js';
import * as auth from '../auth.js';

const cab = () => ({ apikey: CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' });
async function criarConta(email, senha, nome) {
  let r; try { r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/signup`, { method: 'POST', headers: cab(), body: JSON.stringify({ email, password: senha, data: { nome, origem: 'pro' } }) }); } catch { throw new Error('Sem conexão. Tente de novo.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(/already|registered/i.test(JSON.stringify(j)) ? 'Esse e-mail já tem conta. Use "entrar".' : /password/i.test(JSON.stringify(j)) ? 'A senha precisa ter pelo menos 8 caracteres.' : 'Não consegui criar a conta agora.');
  return !!j.access_token || !!(j.session && j.session.access_token); // false = falta confirmar o e-mail
}
async function recuperar(email) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/recover`, { method: 'POST', headers: cab(), body: JSON.stringify({ email }) }).catch(() => null);
  if (!r || !r.ok) throw new Error('Não consegui enviar agora. Confira o e-mail e tente de novo.');
}

export function mount(host, { aoEntrar }) {
  let modo = 'entrar'; const msg = h('p', { class: 'pe-msg', role: 'alert' });
  const email = entrada({ type: 'email', required: true, autocomplete: 'email', name: 'email' });
  const senha = entrada({ type: 'password', required: true, autocomplete: 'current-password', name: 'senha', minlength: 8 });
  const nome = entrada({ autocomplete: 'name', name: 'nome', maxlength: 80 });
  const forma = h('form', { class: 'pe-form', novalidate: true });
  const titulo = h('h1', { class: 'pe-h' }); const sub = h('p', { class: 'pe-sub' }); const ok = h('button', { type: 'submit', class: 'pb ouro' });
  const troca = h('button', { type: 'button', class: 'pe-link' }); const esq = h('button', { type: 'button', class: 'pe-link' }, 'esqueci a senha');
  const pinta = () => {
    const criar = modo === 'criar'; titulo.textContent = criar ? 'Crie sua conta' : 'Bem-vindo de volta'; sub.textContent = criar ? 'Teste o Beaterista PRO. Seus alunos e materiais ficam só com você.' : 'Entre para continuar de onde parou.';
    ok.textContent = criar ? 'Criar conta' : 'Entrar'; troca.textContent = criar ? 'já tenho conta' : 'criar conta grátis'; senha.setAttribute('autocomplete', criar ? 'new-password' : 'current-password'); msg.textContent = '';
    forma.replaceChildren(...(criar ? [campo('Seu nome', nome)] : []), campo('E-mail', email), campo(criar ? 'Senha (mín. 8 caracteres)' : 'Senha', senha), msg, ok, h('div', { class: 'pe-links' }, troca, criar ? null : esq));
  };
  troca.addEventListener('click', () => { modo = modo === 'criar' ? 'entrar' : 'criar'; pinta(); });
  esq.addEventListener('click', async () => { if (!email.value.includes('@')) { msg.textContent = 'Digite seu e-mail acima primeiro.'; return; } try { await recuperar(email.value.trim()); aviso('Se esse e-mail tem conta, enviamos o link para criar uma nova senha.', 5000); } catch (e) { msg.textContent = e.message; } });
  forma.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.textContent = ''; const em = email.value.trim(); const se = senha.value;
    if (!em.includes('@') || se.length < 8) { msg.textContent = 'Confira o e-mail e use uma senha de pelo menos 8 caracteres.'; return; }
    ok.disabled = true;
    try {
      if (modo === 'criar') { const logou = await criarConta(em, se, nome.value.trim()); if (!logou) { msg.textContent = 'Conta criada! Abra o e-mail que enviamos, confirme, e volte para entrar.'; modo = 'entrar'; ok.disabled = false; return; } }
      await auth.signIn(em, se); aoEntrar(modo === 'criar' ? nome.value.trim() : '');
    } catch (er) { msg.textContent = er.message; } ok.disabled = false;
  });
  host.append(h('main', { class: 'pe' },
    h('div', { class: 'pe-marca' }, h('span', { class: 'pe-b' }, 'BEATERISTA'), h('span', { class: 'pe-pro' }, 'PRO'), h('p', { class: 'pe-lema' }, 'Crie. Ensine. Transforme.')),
    h('section', { class: 'pe-cx' }, titulo, sub, forma)));
  pinta(); return () => {};
}
