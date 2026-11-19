// Aba "Perfil" (área do aluno): nome e foto do aluno + "minha figurinha": a criança põe a foto dela dentro de um dos 8 modelos,
// escreve o nome, arrasta/dá zoom pra enquadrar e baixa pra postar. A foto fica SÓ neste aparelho (nada sobe pra servidor).
import { h, icon } from '../util.js';
import { banner, toast } from '../ui.js';
import { paulDica } from '../paul-dicas.js';
import { criador } from '../figurinhas/criador.js';
import * as Minhas from '../figurinhas/minhas.js';
import * as CODE from '../codigo.js';
import * as AC from '../acesso.js';
import * as D from '../figurinhas/dono.js';
import * as FN from '../foto-perfil-nuvem.js';
import * as EstCard from '../figurinhas/estrelas-card.js';
import * as PROG from '../kids/progress.js';
import * as PS from '../jogos/perfil-sala.js';

const NOME_ALUNO = 'beaterista-aluno-nome', CFG = 'beaterista-perfil-cfg', FOTO = 'perfil-foto';
const ls = (k) => (k === NOME_ALUNO ? (() => { try { return localStorage.getItem(k) || ''; } catch { return ''; } })() : D.lsLer(k)); // foto e configuração são de quem está com o nome agora
const lsSet = (k, v) => D.lsGravar(k, v);
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
  host.append(banner('Perfil', 'seu nome e a sua figurinha'), paulDica(), body);
  // compartilhar as estrelas (post e story): moram aqui no Perfil (pedido da Bea)
  const compartilhaEst = () => {
    let me = null; try { me = PROG.active(); } catch { /* sem perfil */ } if (!me) return null;
    const total = async () => { try { const E = await import('../figurinhas/estrelas.js'); return E.estrelasTotais(me.id); } catch { return 0; } };
    return h('section', { class: 'card pad pf-share-est' }, h('b', {}, 'compartilhar minhas ★'), h('p', { class: 'muted' }, 'gera uma imagem com as suas estrelas pra postar.'),
      h('div', { class: 'row' }, ...[['post', 'post'], ['story', 'story']].map(([f, t]) => h('button', { type: 'button', class: 'btn', onclick: async (ev) => { const b = ev.currentTarget; b.disabled = true; try { const r = await EstCard.compartilhar({ nome: nomeAtual() || me.name, total: await total(), formato: f }); if (r === 'baixado') toast('imagem baixada: é só postar!'); else if (r === 'compartilhado') toast('compartilhado!'); } catch { toast('não consegui montar a imagem agora.'); } b.disabled = false; } }, t))));
  };
  setTimeout(() => { if (alive) { const s = compartilhaEst(); if (s) body.append(s); } }, 0);

  const avatar = h('div', { class: 'pf-avatar', 'aria-label': 'Sua foto' });
  const moldPerfil = h('img', { class: 'pf-mold', alt: '', hidden: true, draggable: 'false', 'aria-hidden': 'true' }); let offMold = () => {}; import('../molduras.js').then((M) => { offMold = M.ligarImg(moldPerfil); }).catch(() => {});
  const avatarWrap = h('div', { class: 'pf-av-wrap' }, avatar, moldPerfil);
  const nome = h('input', { class: 'field', type: 'text', maxlength: 20, autocomplete: 'off', 'aria-label': 'Seu nome na figurinha', placeholder: 'seu nome', value: nomeAtual(), oninput: (ev) => { cfg.nome = ev.target.value; salvarCfg(); cri && cri.refresh(); } });
  const fotoInput = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (ev) => escolher(ev.target.files[0], ev.target) });
  const selfie = h('input', { type: 'file', accept: 'image/*', capture: 'user', hidden: true, onchange: (ev) => escolher(ev.target.files[0], ev.target) });
  async function escolher(file, input) {
    if (!file) return; try { fotoBlob = await reduzir(file); fotoImg = await blobImg(fotoBlob); await D.metaGravar(FOTO, fotoBlob); window.dispatchEvent(new Event('bt-foto-perfil')); import('../foto-perfil-nuvem.js').then((m) => m.guardou(fotoBlob)).catch(() => {}); cfg.zoom = 1; cfg.ox = 0; cfg.oy = 0; salvarCfg(); desenhaAvatar(); cri.setFoto(fotoImg); toast('foto salva neste aparelho'); } catch { toast('não consegui abrir essa foto, tente outra'); }
    input.value = '';
  }
  async function remover() { fotoImg = null; fotoBlob = null; try { await D.metaApagar(FOTO); } catch { /* ok */ } window.dispatchEvent(new Event('bt-foto-perfil')); import('../foto-perfil-nuvem.js').then((m) => m.guardou(null)).catch(() => {}); desenhaAvatar(); cri.setFoto(null); }
  function desenhaAvatar() {
    avatar.replaceChildren();
    if (fotoBlob) { const u = URL.createObjectURL(fotoBlob); avatar.append(h('img', { src: u, alt: '', onload: () => URL.revokeObjectURL(u) })); } else avatar.append(icon('id', 44));
  }
  /** O código de acesso do aluno, bem à vista pra decorar (o que já valeu, ou o que ele gerou e a professora ainda vai cadastrar). */
  const codigoDoAluno = () => { let v = ''; try { v = CODE.saved() || localStorage.getItem('beaterista-album-code') || ''; } catch { /* ok */ } return v ? { c: v, ok: true } : (CODE.pendente() ? { c: CODE.pendente(), ok: false } : null); };
  const cod = codigoDoAluno();
  const codBox = h('div', { class: 'pf-codigo', role: 'group', 'aria-label': 'Seu código de acesso' }, h('small', {}, cod ? (cod.ok ? 'seu código' : 'seu código (aguardando a professora)') : 'seu código'),
    cod ? h('b', { class: 'pf-codnum', 'aria-label': 'código escondido por segurança' }, CODE.mascarar(cod.c)) : h('a', { class: 'pf-codnone', href: '#/lojinha' }, 'ainda sem código · toque pra pegar na lojinha'),
    cod ? h('button', { type: 'button', class: 'btn small ghost pf-codguardar', onclick: () => import('../salvar-codigo.js').then((M) => M.guardarAgora(nomeAtual ? nomeAtual() : '')) }, 'guardar meu código') : null);
  // Onde fica a foto: "só nesse aparelho" (padrão) ou "em todos os meus aparelhos" (só pra quem tem código; a foto sobe em miniatura, ver foto-perfil-nuvem.js).
  const priv = h('p', { class: 'muted pf-priv' });
  const todos = (() => {
    let c = ''; try { c = CODE.saved(); } catch { /* ok */ } if (!c) return null;
    const grupo = 'pf-onde'; const op = (v, texto, dica) => { const inp = h('input', { type: 'radio', name: grupo, value: v }); inp.checked = (v === 'todos') === FN.ligado();
      inp.addEventListener('change', () => { if (!inp.checked) return; if (v === 'todos') FN.ligar(); else FN.desligar(); toast(v === 'todos' ? 'sua foto vai estar com você em todos os aparelhos' : 'sua foto ficou só neste aparelho'); });
      return h('label', { class: 'pf-todos' }, inp, h('span', {}, texto, dica ? h('small', {}, dica) : null)); };
    return h('div', { class: 'pf-onde', role: 'radiogroup', 'aria-label': 'onde fica a sua foto' }, op('aqui', 'foto só nesse aparelho'), op('todos', 'foto em todos os meus aparelhos', 'ao clicar, sempre que acessar, sua foto estará com você'));
  })();
  if (!todos) priv.textContent = 'sua foto fica só neste aparelho. só aparece na sala se você ligar a opção abaixo.'; else priv.remove();
  // mostrar o perfil (foto em miniatura + 3 favoritos) pra quem joga na mesma sala por código. Desligado por padrão.
  const salaChk = h('input', { type: 'checkbox', checked: PS.ligado(), onchange: (ev) => { PS.ligar(ev.target.checked); toast(ev.target.checked ? 'quem estiver na sala vai poder ver sua foto e seus favoritos' : 'seu perfil não aparece mais nas salas'); } });
  const salaOpt = h('label', { class: 'pf-todos pf-sala' }, salaChk, h('span', {}, 'mostrar meu perfil na sala', h('small', {}, 'foto pequena e 3 favoritos aparecem pra quem joga com você por código. desligado por padrão')));
  // sem querer pôr a própria foto? escolhe um Paul: ele vira a foto do perfil (topo, figurinha e sala)
  const paules = h('div', { class: 'pf-paules', role: 'group', 'aria-label': 'ou escolha um Paul' }, h('p', { class: 'muted' }, 'ou escolha um Paul'),
    h('div', { class: 'pf-paules-lista' }, ...[1, 2, 3, 4, 5, 6].map((n) => h('button', { type: 'button', class: 'pf-paul-op', 'aria-label': `Paul ${n}`, onclick: async () => { try { const blob = await (await fetch(`assets/paul/perfil/paul-${n}.webp`)).blob(); await escolher(new File([blob], `paul-${n}.webp`, { type: 'image/webp' }), { value: '' }); } catch { toast('não consegui abrir esse Paul agora'); } } }, h('img', { src: `assets/paul/perfil/paul-${n}.webp`, alt: '', width: 52, height: 52, loading: 'lazy' })))));
  const topo = h('section', { class: 'card pad pf-top' }, h('div', { class: 'pf-left' }, avatarWrap, codBox, paules),
    h('div', { class: 'pf-info' }, h('label', { class: 'muted', for: 'pf-nome' }, 'nome na figurinha'), nome,
      h('div', { class: 'pf-btns' }, h('button', { type: 'button', class: 'btn small', onclick: () => fotoInput.click() }, 'escolher foto'), h('button', { type: 'button', class: 'btn small', onclick: () => selfie.click() }, 'tirar selfie'), h('button', { type: 'button', class: 'btn small ghost', onclick: remover }, 'tirar foto')),
      priv, salaOpt), fotoInput, selfie, todos);
  nome.id = 'pf-nome';

  /* ---- a minha figurinha ---- */
  const mc = Minhas.colecao({ titulo: 'minha coleção' });
  cri = criador({ cfg, salvar: salvarCfg, nome: nomeAtual, aoGuardar: async (e) => { try { await Minhas.guardar(e); toast('guardada na sua coleção!'); mc.refresh(); return true; } catch (err) { toast(err.message === 'cheia' ? 'a coleção está cheia (40). apague alguma.' : err.message === 'repetida' ? 'essa figurinha já está na sua coleção. mude a foto, o modelo ou o nome pra criar outra.' : err.message === 'limite2' ? 'só dá pra ter 2 figurinhas da mesma foto no mesmo modelo de card. troque a foto ou o modelo.' : 'não consegui guardar agora.'); return err.message === 'repetida' || err.message === 'limite2'; } } }); const area = cri.el;
  body.append(topo, area, mc.el);
  (async () => { try { const b = await D.metaLer(FOTO); if (b && alive) { fotoBlob = b; fotoImg = await blobImg(b); } } catch { /* ok */ } if (!alive) return; desenhaAvatar(); cri.setFoto(fotoImg, { resetar: false }); })();
  // molduras que ganhou nos jogos (aparece quando tem alguma): toque pra usar ou tirar
  (async () => { try { const M = await import('../molduras.js'); const lista = M.MOLDURAS.filter((m) => M.tem(m.id)); if (!lista.length || !alive) return;
    const caixa = h('section', { class: 'card pad pf-molduras' }, h('b', {}, 'minhas molduras'), h('p', { class: 'muted' }, 'enfeites que você ganhou nos jogos. toque pra usar ou tirar.'));
    const pinta = () => caixa.querySelectorAll('button[data-mold]').forEach((b) => { const on = M.ativa() === b.dataset.mold; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
    lista.forEach((m) => caixa.append(h('button', { type: 'button', class: 'pf-mold-btn', 'data-mold': m.id, onclick: () => { M.escolher(M.ativa() === m.id ? '' : m.id); pinta(); } }, h('img', { src: m.img, alt: '', width: 56, height: 56 }), h('span', {}, m.nome))));
    pinta(); topo.after(caixa); window.addEventListener('moldura-mudou', pinta); } catch { /* sem molduras */ } })();
  return () => { alive = false; offMold(); cri.cleanup(); mc.cleanup(); };
}
