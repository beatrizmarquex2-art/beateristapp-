// Aba "Perfil" (área do aluno): nome e foto do aluno + "minha figurinha": a criança põe a foto dela dentro de um dos 8 modelos,
// escreve o nome, arrasta/dá zoom pra enquadrar e baixa pra postar. A foto fica SÓ neste aparelho (nada sobe pra servidor).
import { h, icon } from '../util.js';
import { db } from '../db.js';
import { banner, toast } from '../ui.js';
import { criador } from '../figurinhas/criador.js';
import * as Minhas from '../figurinhas/minhas.js';
import * as CODE from '../codigo.js';
import * as AC from '../acesso.js';

const NOME_ALUNO = 'beaterista-aluno-nome', CFG = 'beaterista-perfil-cfg', FOTO = 'perfil-foto';
const ls = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ok */ } };
const loadCfg = () => { try { return { modelo: 'M1', zoom: 1, ox: 0, oy: 0, nome: '', ...JSON.parse(ls(CFG) || '{}') }; } catch { return { modelo: 'M1', zoom: 1, ox: 0, oy: 0, nome: '' }; } };

/** Foto escolhida -> JPEG de no máximo 1400 px (o navegador já corrige a rotação do celular). */
async function reduzir(file) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = url; });
    const k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
    return await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('blob'))), 'image/jpeg', 0.9));
  } finally { URL.revokeObjectURL(url); }
}
const blobImg = (b) => new Promise((ok, no) => { const u = URL.createObjectURL(b), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => no(new Error('imagem')); i.src = u; });

export function mount(host) {
  const cfg = loadCfg(); let fotoImg = null, fotoBlob = null, alive = true, cri = null;
  const salvarCfg = () => lsSet(CFG, JSON.stringify(cfg));
  const nomeAtual = () => (cfg.nome || ls(NOME_ALUNO) || '').trim();
  const body = h('div', { class: 'pad-x', style: 'display:grid;gap:14px' });
  host.append(banner('Perfil', 'seu nome e a sua figurinha'), body);

  const avatar = h('div', { class: 'pf-avatar', 'aria-label': 'Sua foto' });
  const nome = h('input', { class: 'field', type: 'text', maxlength: 20, autocomplete: 'off', 'aria-label': 'Seu nome na figurinha', placeholder: 'seu nome', value: nomeAtual(), oninput: (ev) => { cfg.nome = ev.target.value; salvarCfg(); cri && cri.refresh(); } });
  const fotoInput = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (ev) => escolher(ev.target.files[0], ev.target) });
  const selfie = h('input', { type: 'file', accept: 'image/*', capture: 'user', hidden: true, onchange: (ev) => escolher(ev.target.files[0], ev.target) });
  async function escolher(file, input) {
    if (!file) return; try { fotoBlob = await reduzir(file); fotoImg = await blobImg(fotoBlob); await db.metaSet(FOTO, fotoBlob); cfg.zoom = 1; cfg.ox = 0; cfg.oy = 0; salvarCfg(); desenhaAvatar(); cri.setFoto(fotoImg); toast('foto salva neste aparelho'); } catch { toast('não consegui abrir essa foto, tente outra'); }
    input.value = '';
  }
  async function remover() { fotoImg = null; fotoBlob = null; try { await db.metaDel(FOTO); } catch { /* ok */ } desenhaAvatar(); cri.setFoto(null); }
  function desenhaAvatar() {
    avatar.replaceChildren();
    if (fotoBlob) { const u = URL.createObjectURL(fotoBlob); avatar.append(h('img', { src: u, alt: '', onload: () => URL.revokeObjectURL(u) })); } else avatar.append(icon('id', 44));
  }
  /** O código de acesso do aluno, bem à vista pra decorar (o que já valeu, ou o que ele gerou e a professora ainda vai cadastrar). */
  const codigoDoAluno = () => { let v = ''; try { v = CODE.saved() || localStorage.getItem('beaterista-album-code') || ''; } catch { /* ok */ } return v ? { c: v, ok: true } : (CODE.pendente() ? { c: CODE.pendente(), ok: false } : null); };
  const cod = codigoDoAluno();
  const codBox = h('div', { class: 'pf-codigo', role: 'group', 'aria-label': 'Seu código de acesso' }, h('small', {}, cod ? (cod.ok ? 'seu código' : 'seu código (aguardando a professora)') : 'seu código'),
    cod ? h('b', { class: 'pf-codnum', 'aria-label': `código ${cod.c.split('').join(' ')}` }, cod.c) : h('a', { class: 'pf-codnone', href: '#/album' }, 'ainda sem código · toque pra pedir'),
    cod ? h('span', { class: 'pf-codhint' }, 'decore esse número!') : null);
  const topo = h('section', { class: 'card pad pf-top' }, h('div', { class: 'pf-left' }, avatar, codBox),
    h('div', { class: 'pf-info' }, h('label', { class: 'muted', for: 'pf-nome' }, 'nome na figurinha'), nome,
      h('div', { class: 'pf-btns' }, h('button', { type: 'button', class: 'btn small', onclick: () => fotoInput.click() }, 'escolher foto'), h('button', { type: 'button', class: 'btn small', onclick: () => selfie.click() }, 'tirar selfie'), h('button', { type: 'button', class: 'btn small ghost', onclick: remover }, 'tirar foto')),
      h('p', { class: 'muted pf-priv' }, 'sua foto fica só neste aparelho. ninguém mais vê.')), fotoInput, selfie);
  nome.id = 'pf-nome';

  /* ---- a minha figurinha ---- */
  const mc = Minhas.colecao({ titulo: 'minha coleção' });
  cri = criador({ cfg, salvar: salvarCfg, nome: nomeAtual, aoGuardar: async (e) => { try { await Minhas.guardar(e); toast('guardada na sua coleção!'); mc.refresh(); } catch (err) { toast(err.message === 'cheia' ? 'a coleção está cheia (40). apague alguma.' : 'não consegui guardar agora.'); } } }); const area = cri.el;
  body.append(topo, area, mc.el);
  (async () => { try { const b = await db.metaGet(FOTO); if (b && alive) { fotoBlob = b; fotoImg = await blobImg(b); } } catch { /* ok */ } if (!alive) return; desenhaAvatar(); cri.setFoto(fotoImg, { resetar: false }); })();
  return () => { alive = false; cri.cleanup(); mc.cleanup(); };
}
