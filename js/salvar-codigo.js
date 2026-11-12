// "Quer guardar o seu código?": depois de entrar com o código (e quando o app é adicionado à tela de início), oferece guardar no gerenciador
// de senhas do aparelho, copiar, compartilhar (Notas, WhatsApp…) ou baixar. Nada vai pra servidor: tudo fica no aparelho da pessoa.
import { h } from './util.js';
import { sheet, toast } from './ui.js';
import * as CODE from './codigo.js';

const ASK_KEY = 'beaterista-codigo-pergunta'; // { entrada: código, instalado: código } = já perguntamos
const lerAsk = () => { try { return JSON.parse(localStorage.getItem(ASK_KEY) || '{}') || {}; } catch { return {}; } };
const gravaAsk = (o) => { try { localStorage.setItem(ASK_KEY, JSON.stringify(o)); } catch { /* sem armazenamento: pergunta de novo na próxima */ } };
export const jaPerguntou = (tipo, code) => lerAsk()[tipo] === code;
const marcar = (tipo, code) => gravaAsk({ ...lerAsk(), [tipo]: code });
/** O app está aberto como ícone na tela de início (PWA)? */
export const instalado = () => { try { return !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch { return false; } };

/** Pede ao gerenciador de senhas do navegador pra guardar (nome = usuário, código = senha). Sem truques de formulário: o Safari/iPhone costuma oferecer "salvar senha" sozinho quando o formulário de entrada some da tela; se não oferecer, valem as outras opções (enviar, copiar, baixar). */
export async function guardarNoGerenciador(nome, code) {
  let feito = false;
  try { if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) { await navigator.credentials.store(new window.PasswordCredential({ id: String(nome || 'aluno'), name: String(nome || 'aluno'), password: code })); feito = true; } } catch { /* navegador sem suporte */ }
  return feito;
}
const texto = (code) => `meu código de aluno da Beaterista: ${code}\nsite: https://jogos.beaterista.com.br`;
async function copiar(code) { try { await navigator.clipboard.writeText(code); toast('código copiado!', { ms: 2200 }); return true; } catch { toast('não consegui copiar. anote o código na tela.', { ms: 3200 }); return false; } }
async function compartilhar(code) {
  if (navigator.share) { try { await navigator.share({ title: 'meu código Beaterista', text: texto(code) }); return true; } catch { return false; } }
  return copiar(code);
}
function baixar(code, nome) {
  try { const url = URL.createObjectURL(new Blob([`${texto(code)}\naluno: ${nome || ''}\n`], { type: 'text/plain' })); const a = h('a', { href: url, download: 'codigo-beaterista.txt' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); toast('arquivo baixado!', { ms: 2200 }); } catch { /* sem download */ }
}

/** Abre a pergunta "quer guardar o seu código?". `tipo` = 'entrada' (acabou de entrar) ou 'instalado' (adicionou à tela de início). Pergunta 1 vez por tipo e por código. */
export function perguntarSalvar(tipo, nome) {
  const code = CODE.saved(); if (!code || jaPerguntou(tipo, code)) return false;
  marcar(tipo, code);
  sheet(tipo === 'instalado' ? 'app na tela de início! 🎉' : 'guardar o seu código?', (close) => {
    const ok = (msg) => { toast(msg, { ms: 2600 }); };
    return h('div', { class: 'sheet-body al-guardar' },
      h('p', {}, tipo === 'instalado' ? 'agora o app está na sua tela de início. quer guardar o seu código em algum lugar, pra não perder?' : 'quer guardar o seu código em algum lugar, pra não perder?'),
      h('div', { class: 'al-lock-code', role: 'status', 'aria-label': `seu código ${code.split('').join(' ')}` }, code),
      h('button', { class: 'btn primary wide', type: 'button', onclick: async () => { await guardarNoGerenciador(nome, code); ok('pronto! se o aparelho perguntar, toque em “salvar senha”.'); close(); } }, 'salvar senha (neste aparelho)'),
      h('button', { class: 'btn wide', type: 'button', onclick: async () => { if (await compartilhar(code)) close(); } }, 'enviar pra mim (Notas, WhatsApp…)'),
      h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn small', type: 'button', style: 'flex:1', onclick: () => copiar(code) }, 'copiar'), h('button', { class: 'btn small', type: 'button', style: 'flex:1', onclick: () => baixar(code, nome) }, 'baixar')),
      h('button', { class: 'btn ghost wide', type: 'button', onclick: close }, 'agora não'));
  });
  return true;
}

/** Liga os gatilhos: logo depois que a pessoa libera o acesso com um código, quando o app é instalado (Android/Chrome: appinstalled) e na 1ª abertura como ícone (iPhone/iPad). */
const FLAG = 'beaterista-perguntar-codigo';
/** A primeira tela chama isto quando a pessoa entrou com código: o shell do app (que ainda vai montar) faz a pergunta. */
export const agendar = () => { try { sessionStorage.setItem(FLAG, '1'); } catch { /* sem sessão */ } };
export function ligar({ nome = () => '' } = {}) {
  let ag = false; try { ag = sessionStorage.getItem(FLAG) === '1'; sessionStorage.removeItem(FLAG); } catch { /* ok */ }
  if (ag) setTimeout(() => perguntarSalvar(instalado() ? 'instalado' : 'entrada', nome()), 1500);
  document.addEventListener('aluno-acesso', (ev) => { if (ev.detail) setTimeout(() => perguntarSalvar(instalado() ? 'instalado' : 'entrada', nome()), 1500); });
  window.addEventListener('appinstalled', () => setTimeout(() => perguntarSalvar('instalado', nome()), 800));
  if (instalado() && CODE.saved()) setTimeout(() => perguntarSalvar('instalado', nome()), 2500);
}
