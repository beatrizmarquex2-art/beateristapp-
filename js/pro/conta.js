// Meu perfil: nome, escola, instrumentos e o logotipo que sai no cabeçalho dos seus PDFs.
import { h, campo, entrada, aviso } from './ui.js';
import * as D from './dados.js';
import * as auth from '../auth.js';

/** Reduz a imagem escolhida pra caber no cabeçalho do PDF (máx. 360×160) e devolve data URL PNG. */
export const reduzLogo = (file) => new Promise((ok, no) => {
  if (!file || !/^image\//.test(file.type)) return no(new Error('Escolha uma imagem (PNG ou JPG).'));
  const url = URL.createObjectURL(file); const i = new Image();
  i.onload = () => { const k = Math.min(1, 360 / i.width, 160 / i.height); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.width * k)); c.height = Math.max(1, Math.round(i.height * k)); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/png')); };
  i.onerror = () => { URL.revokeObjectURL(url); no(new Error('Não consegui ler essa imagem.')); }; i.src = url;
});

export function mount(host, ctx, _rota, { primeira = false } = {}) {
  const p = ctx.perfil; let logo = p.logo || '';
  const nome = entrada({ value: p.nome || '', maxlength: 80, autocomplete: 'name' }); const escola = entrada({ value: p.escola || '', maxlength: 80, placeholder: 'Opcional' });
  const inst = entrada({ value: (p.instrumentos || []).join(', '), placeholder: 'Ex.: violão, teclado, canto' });
  const prev = h('div', { class: 'pc-logo' }); const pinta = () => { prev.replaceChildren(logo ? h('img', { src: logo, alt: 'Seu logotipo' }) : h('span', {}, 'sem logotipo')); }; pinta();
  const arq = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => { try { logo = await reduzLogo(e.target.files[0]); pinta(); } catch (er) { aviso(er.message); } } });
  host.append(h('div', { class: 'pt' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, primeira ? 'Bem-vindo ao PRO' : 'Meu perfil'), h('h1', {}, primeira ? 'Como você quer aparecer?' : 'Seus dados'))),
    h('form', { class: 'pa-form', onsubmit: async (e) => { e.preventDefault(); try { const l = await D.gravarPerfil({ nome: nome.value.trim(), escola: escola.value.trim(), instrumentos: inst.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12), logo: logo || null }); Object.assign(ctx.perfil, l); aviso('Perfil salvo'); if (primeira) location.hash = '#/inicio'; } catch (er) { aviso(D.textoErro(er)); } } },
      campo('Seu nome', nome), campo('Nome da escola ou do seu estúdio', escola, 'aparece no cabeçalho dos PDFs'), campo('Instrumentos que você ensina', inst, 'separe por vírgula'),
      h('div', { class: 'pf' }, h('span', { class: 'pf-r' }, 'Logotipo (opcional)'), prev, h('div', { class: 'pd-b esq' }, h('button', { type: 'button', class: 'pb', onclick: () => arq.click() }, 'escolher imagem'), logo ? h('button', { type: 'button', class: 'pb', onclick: () => { logo = ''; pinta(); } }, 'remover') : null), arq),
      h('div', { class: 'pd-b esq' }, h('button', { type: 'submit', class: 'pb ouro' }, 'Salvar'), primeira ? null : h('button', { type: 'button', class: 'pb perigo', onclick: async () => { await auth.signOut(); location.hash = ''; location.reload(); } }, 'Sair da conta')),
      h('p', { class: 'pt-mudo' }, `Conta: ${auth.userEmail()}`))));
  return () => {};
}
