// Telas da Lojinha e do Passe (públicas: abrem por link direto e depois de recarregar, sem conta).
import { h, icon } from '../util.js';
import { PRODUTOS, PASSE, HOTMART, brl, porSlug, ordenados, checkoutDe, precoDe, passeCheckout } from './catalogo.js';
import * as API from './passe-api.js';
import { modoTeste, lojaLigada } from './flags.js';
import { CARTAS_PASSE } from '../figurinhas/passe-cartas.js';

export const ehRotaLoja = (hash) => /^#\/(lojinha|passe)(\/|$|\?)/.test(String(hash || ''));
const dataBR = (iso) => { try { return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); } catch { return ''; } };
const reduzido = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } };

/** Placa azul-marinho "Lojinha Beaterista" com o Paul espreitando por cima. */
function placa() {
  return h('header', { class: 'lj-placa' },
    h('img', { class: 'lj-peek', src: 'assets/paul/e03.webp', alt: 'Paul espiando por cima da placa', width: 118, height: 90 }),
    h('div', { class: 'lj-sign' }, h('small', {}, 'LOJINHA'), h('h1', {}, 'BEATERISTA')));
}
const estrelas = () => [h('i', { class: 'lj-star s1', 'aria-hidden': 'true' }, '✦'), h('i', { class: 'lj-star s2', 'aria-hidden': 'true' }, '✦')];

function botaoCompra(p, extra = '') {
  const url = checkoutDe(p);
  return url
    ? h('a', { class: `lj-btn${extra}`, href: url, target: '_blank', rel: 'noopener noreferrer', 'data-checkout': p.id, 'aria-label': `Adquirir ${p.titulo}` }, 'Adquirir', h('span', { 'aria-hidden': 'true' }, ' ›'))
    : h('span', { class: `lj-btn soon${extra}`, role: 'note', 'aria-label': `${p.titulo}: em breve` }, 'Em breve');
}

function cartao(p) {
  const preco = precoDe(p);
  return h('article', { class: 'lj-card', 'data-produto': p.id },
    h('a', { class: 'lj-card-link', href: `#/lojinha/${p.slug}`, 'aria-label': `Ver detalhes de ${p.titulo}` },
      h('div', { class: 'lj-art', style: `aspect-ratio:${p.ratio.replace('/', ' / ')}` }, h('img', { src: p.arte, alt: p.alt, decoding: 'async' })),
      h('span', { class: 'lj-selo' }, p.formato), h('h2', {}, p.titulo), h('p', { class: 'lj-curta' }, p.curta), preco ? h('p', { class: 'lj-preco' }, preco) : null),
    botaoCompra(p));
}

function ingresso() {
  const c = passeCheckout();
  return h('a', { class: 'lj-ingresso', href: '#/passe', 'aria-label': 'Conhecer o Passe Beaterista' },
    h('img', { class: 'lj-ing-paul', src: 'assets/aluno/paul-bateria.webp', alt: '' }),
    h('div', { class: 'lj-ing-txt' }, h('h2', {}, 'Passe ', h('b', {}, 'Beaterista')),
      h('ul', {}, h('li', {}, `${PASSE.meses} meses de acesso`), h('li', {}, PASSE.pagamento))),
    h('div', { class: 'lj-ing-buy' }, h('span', { class: 'lj-pill' }, brl(PASSE.preco)), h('span', { class: 'lj-btn gold' }, c ? 'Adquirir passe ›' : 'Conhecer o passe ›')));
}

function vitrine(view) {
  const ord = ordenados(); const quatro = ord.slice(0, 4), resto = ord.slice(4);
  view.append(h('div', { class: 'loja' }, placa(), ...estrelas(),
    h('p', { class: 'lj-escolha' }, h('span', {}, 'Escolha seu material')),
    h('div', { class: 'lj-grid' }, ...quatro.map(cartao)),
    ingresso(),
    h('h2', { class: 'lj-sub' }, 'Mais materiais'),
    h('div', { class: 'lj-grid' }, ...resto.map(cartao)),
    h('p', { class: 'lj-nota' }, 'A compra é feita na Hotmart, com pagamento seguro. Você não precisa de cadastro aqui para comprar.'),
    modoTeste() ? painelTeste() : null));
}

/* ---------- Paul apresenta o Bateria Start ---------- */
function paulApresenta() {
  const roteiro = 'Oi, eu sou o Paul! No Bateria Start, a profe Bea te ensina do zero. Você conhece a bateria, pratica seus primeiros ritmos e aprende viradas em aulas curtinhas. Quer ver como é? Dá o play!';
  const player = h('div', { class: 'lj-video', hidden: true });
  const abrir = h('button', { class: 'lj-btn', type: 'button', onclick: () => {
    if (player.dataset.on) return; player.dataset.on = '1'; player.hidden = false; // o play é sempre do usuário: nada toca sozinho
    const f = h('iframe', { src: `https://www.youtube-nocookie.com/embed/${HOTMART.video.id}?rel=0&cc_load_policy=1&playsinline=1`, title: 'Paul apresenta o Bateria Start', allow: 'encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '', referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy' });
    player.replaceChildren(f);
  } }, icon('play', 18), ' Assistir à apresentação');
  return h('section', { class: 'lj-paul', 'aria-label': 'Paul apresenta o Bateria Start' },
    h('div', { class: 'lj-paul-top' },
      h('img', { class: `lj-paul-img${reduzido() ? '' : ' anim'}`, src: 'assets/paul/e03.webp', alt: 'Paul espiando', width: 110, height: 80 }),
      h('div', {}, h('b', {}, 'O Paul apresenta o curso'), h('p', { class: 'muted' }, 'um vídeo curtinho, o som só toca quando você apertar o play.'), abrir)),
    player,
    h('details', { class: 'lj-legenda' }, h('summary', {}, 'ler o que o Paul diz'), h('p', {}, roteiro)),
    h('a', { class: 'lj-ext', href: HOTMART.video.watch, target: '_blank', rel: 'noopener noreferrer' }, 'se o vídeo não abrir, assistir no YouTube'));
}

function detalhe(view, slug) {
  const p = porSlug(slug);
  if (!p) { view.append(h('div', { class: 'loja' }, placa(), h('p', { class: 'lj-nota' }, 'Não achei esse material.'), h('a', { class: 'lj-btn', href: '#/lojinha' }, '‹ Voltar à Lojinha'))); return; }
  const g = p.galeria.length ? p.galeria : [{ src: p.arte, alt: p.alt }];
  const big = h('img', { src: g[0].src, alt: g[0].alt, decoding: 'async' });
  const thumbs = g.length > 1 ? h('div', { class: 'lj-thumbs', role: 'group', 'aria-label': 'Artes do produto' }, ...g.map((x, i) => h('button', { type: 'button', class: i ? '' : 'on', 'aria-label': x.alt, 'aria-pressed': i ? 'false' : 'true', onclick: (e) => { big.src = x.src; big.alt = x.alt; [...e.currentTarget.parentNode.children].forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } }, h('img', { src: x.src, alt: '' })))) : null;
  const preco = precoDe(p);
  view.append(h('div', { class: 'loja' }, h('a', { class: 'lj-voltar', href: '#/lojinha' }, '‹ Lojinha'),
    h('article', { class: 'lj-det', 'data-produto': p.id },
      h('div', { class: 'lj-det-art', style: `aspect-ratio:${(g.length > 1 ? '1 / 1' : p.ratio.replace('/', ' / '))}` }, big),
      h('span', { class: 'lj-selo det' }, p.formato), thumbs, h('h1', {}, p.titulo), h('p', { class: 'lj-longa' }, p.longa),
      preco ? h('p', { class: 'lj-preco big' }, preco) : h('p', { class: 'lj-aviso' }, 'Este material chega em breve. Já dá para ver como ele é.'),
      botaoCompra(p, ' wide'),
      p.oferta.estado === 'confirmada' ? h('p', { class: 'lj-nota' }, 'Você vai para o pagamento seguro da Hotmart (Pix quando a oferta aceitar).') : null,
      p.paul ? paulApresenta() : null)));
}

/* ---------- Passe ---------- */
function formAtivar(ctx, msg) {
  const email = h('input', { class: 'field', type: 'email', autocomplete: 'email', inputmode: 'email', required: true, placeholder: 'e-mail da compra', 'aria-label': 'E-mail usado na compra' });
  const cod = h('input', { class: 'field', type: 'text', maxlength: 8, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', required: true, placeholder: 'PAUL0000', 'aria-label': 'Código de ativação PAUL e quatro números' });
  const out = h('p', { class: 'lj-msg', role: 'status', 'aria-live': 'polite' });
  const btn = h('button', { class: 'lj-btn', type: 'submit' }, 'Ativar meu Passe');
  const f = h('form', { class: 'lj-form', onsubmit: async (e) => {
    e.preventDefault(); btn.disabled = true; out.textContent = 'conferindo…';
    try {
      const r = await API.ativar(email.value, cod.value);
      if (r && r.ok) { out.textContent = 'Passe ativado! 🎉'; ctx.onAtivado && ctx.onAtivado({ ...r, email: email.value.trim().toLowerCase() }); return; }
      out.textContent = r && r.motivo === 'espere' ? 'muitas tentativas. espere alguns minutos e tente de novo.' : r && r.motivo === 'sem_direito' ? 'este Passe não está ativo. fale com a professora Bea.' : 'não conferiu. veja o e-mail da compra e o código, ou peça um novo à professora Bea.';
    } catch { out.textContent = 'sem internet agora. tente de novo.'; }
    btn.disabled = false;
  } }, h('label', {}, h('span', {}, 'e-mail da compra'), email), h('label', {}, h('span', {}, 'código de ativação (PAUL + 4 números)'), cod), btn, out);
  return h('section', { class: 'lj-box', id: 'ativar' }, h('h2', {}, 'Já comprei: ativar meu Passe'), h('p', { class: 'muted' }, msg || 'O código chega depois que o pagamento é confirmado. Ele vale uma vez só, junto com o e-mail da compra.'), f);
}

function passeTopo() {
  return h('header', { class: 'lj-passe-top' }, h('img', { class: 'lj-passe-banner', src: PASSE.arte, alt: 'Passe Beaterista' }), h('h1', {}, PASSE.titulo));
}
function listaInclui() {
  return h('ul', { class: 'lj-inclui' }, ...PASSE.inclui.map((t) => h('li', {}, t.charAt(0).toUpperCase() + t.slice(1))));
}
function cartasPrevia() {
  return h('div', { class: 'lj-cartas' }, h('h3', {}, 'Edição Passe Beaterista'), h('p', { class: 'muted' }, 'três cartas bônus que chegam num envelope quando você ativa o Passe. Elas ficam numa seção própria do álbum.'),
    h('div', { class: 'lj-cartas-row' }, ...CARTAS_PASSE.map((c) => h('figure', { class: 'lj-carta mini' }, h('img', { src: c.arte, alt: '' }), h('figcaption', {}, c.titulo)))));
}

async function passe(view, parts, ctx) {
  const root = h('div', { class: 'loja passe' }, h('a', { class: 'lj-voltar', href: '#/lojinha' }, '‹ Lojinha'), passeTopo());
  view.append(root);
  const code = ctx.codigo ? ctx.codigo() : '';
  let st = { tipo: 'nenhum' }; let offline = false;
  try { st = await API.status(code); } catch { offline = true; }
  if (parts[0] === 'retorno') return retorno(root, ctx);
  if (parts[0] === 'envelope') return envelope(root, ctx, st);
  if (offline) root.append(h('p', { class: 'lj-aviso' }, 'sem internet: não consegui conferir o seu Passe agora.'));
  if (st.tipo === 'passe') {
    const ate = dataBR(st.expira_em);
    if (st.estado === 'ativo') {
      root.append(h('section', { class: 'lj-box ok', 'data-estado': 'ativo' }, h('h2', {}, 'Seu Passe está ativo'), h('p', {}, `Vale até ${ate}.`), listaInclui(),
        h('a', { class: 'lj-btn', href: st.bonus_resgatado ? '#/album' : '#/passe/envelope' }, st.bonus_resgatado ? 'Ver no álbum' : 'Abrir meu envelope bônus'), h('a', { class: 'lj-link', href: '#/jogos' }, 'ir para os jogos')));
    } else {
      const vencido = st.estado === 'vencido';
      root.append(h('section', { class: 'lj-box warn', 'data-estado': st.estado }, h('h2', {}, vencido ? 'Seu Passe venceu' : 'Seu Passe foi encerrado'),
        h('p', {}, vencido ? `Ele valeu até ${ate}. Seu progresso e suas figurinhas continuam guardados.` : 'Esse acesso foi encerrado. Seu progresso continua guardado. Fale com a professora Bea se achar que é engano.'),
        vencido ? renovar() : null));
    }
    if (modoTeste()) root.append(painelTeste());
    return;
  }
  root.append(h('section', { class: 'lj-box', 'data-estado': st.tipo }, st.tipo === 'aluno' ? h('p', { class: 'lj-aviso' }, 'Você já entra como aluno com o seu código. O Passe é outra opção de acesso, com a Edição Passe Beaterista.') : null,
    h('p', { class: 'lj-preco big' }, brl(PASSE.preco), h('small', {}, ` · ${PASSE.pagamento} · ${PASSE.meses} meses de acesso`)), listaInclui(), cartasPrevia(), renovar(true)));
  root.append(formAtivar(ctx));
  if (modoTeste()) root.append(painelTeste());
}
function renovar(primeira) {
  const url = passeCheckout();
  return url ? h('a', { class: 'lj-btn gold wide', href: url, target: '_blank', rel: 'noopener noreferrer', 'data-checkout': 'passe' }, primeira ? 'Adquirir passe ›' : 'Renovar o Passe ›')
    : h('div', {}, h('span', { class: 'lj-btn soon wide', role: 'note' }, 'Compra em breve'), h('p', { class: 'lj-nota' }, 'A venda do Passe abre quando a oferta de pagamento único estiver pronta. Quem já recebeu um código pode ativar aqui embaixo.'));
}

/** Página de retorno do pagamento: só informa o andamento. Nunca libera nada. */
function retorno(root, ctx) {
  const passos = ['pagamento enviado', 'confirmação da Hotmart', 'código de ativação', 'Passe ativo'];
  root.append(h('section', { class: 'lj-box', 'data-estado': 'retorno' }, h('h2', {}, 'Estamos confirmando seu pagamento'),
    h('p', {}, 'Pix e cartão podem levar alguns minutos. Quando a Hotmart confirmar, você recebe o código de ativação (PAUL + 4 números). Esta página só mostra o andamento: ela não libera o Passe.'),
    h('ol', { class: 'lj-passos' }, ...passos.map((t, i) => h('li', { class: i === 0 ? 'on' : '' }, t))),
    h('p', { class: 'lj-nota' }, 'Se o pagamento falhar ou expirar, nada é cobrado e você pode tentar de novo.')));
  root.append(formAtivar(ctx, 'Recebeu o código? Ative aqui.'));
}

/** Envelope bônus: salva ANTES da animação (servidor e álbum), depois mostra as 3 cartas. Reabrir ou renovar não repete. */
function envelope(root, ctx, st) {
  if (!(st.tipo === 'passe' && st.estado === 'ativo')) { root.append(h('section', { class: 'lj-box warn' }, h('h2', {}, 'O envelope é do Passe ativo'), h('a', { class: 'lj-btn', href: '#/passe' }, 'Ver o Passe'))); return; }
  const palco = h('div', { class: 'lj-env' });
  const msg = h('p', { class: 'lj-msg', role: 'status', 'aria-live': 'polite' });
  const mostrar = (novo) => {
    const cartas = CARTAS_PASSE.map((c, i) => h('figure', { class: `lj-carta${reduzido() ? '' : ' flip'}`, style: `--i:${i}` }, h('img', { src: c.arte, alt: `${c.titulo}: ${c.descricao}` }), h('figcaption', {}, c.titulo), modoTeste() && c.provisoria ? h('em', {}, 'arte provisória') : null));
    palco.replaceChildren(h('p', { class: 'lj-aviso' }, novo ? 'Três cartas novas na sua Edição Passe Beaterista!' : 'Você já abriu o seu envelope. As cartas estão no álbum.'), h('div', { class: 'lj-cartas-row big' }, ...cartas), h('a', { class: 'lj-btn wide', href: '#/album' }, 'Ver no álbum'));
  };
  const btn = h('button', { class: 'lj-btn wide', type: 'button', onclick: async () => {
    btn.disabled = true; msg.textContent = 'guardando suas cartas…';
    try {
      const r = await API.resgatarBonus(ctx.codigo()); if (!r || !r.ok) { msg.textContent = 'não deu para abrir agora. tente de novo.'; btn.disabled = false; return; }
      if (ctx.guardarBonus) await ctx.guardarBonus(r.ids); // persistência antes da animação
      msg.textContent = ''; mostrar(!!r.novo);
    } catch { msg.textContent = 'sem internet agora. tente de novo.'; btn.disabled = false; }
  } }, 'Abrir envelope');
  palco.append(h('div', { class: 'lj-envelope', 'aria-hidden': 'true' }, '✉️'), h('h2', {}, 'Seu envelope bônus'), h('p', { class: 'muted' }, 'três cartas exclusivas do Passe, fora do sorteio do álbum.'), btn, msg);
  root.append(h('section', { class: 'lj-box' }, palco));
}

/** Atalhos de teste (só no preview): simulam o que o webhook faria. */
function painelTeste() {
  const b = (t, fn) => h('button', { type: 'button', class: 'lj-t', onclick: () => { fn(); location.reload(); } }, t);
  return h('details', { class: 'lj-teste' }, h('summary', {}, 'modo teste (só no preview)'),
    h('p', {}, `Simulação, sem Hotmart e sem cobrança. Para ativar: e-mail ${API.SIM.email} e código ${API.SIM.codigo}.`),
    h('div', {}, b('nova compra simulada', API.simular.comprar), b('vencer', API.simular.vencer), b('revogar', API.simular.revogar), b('renovar', API.simular.renovar), b('zerar', API.simular.zerar)));
}

/** Ponto de entrada: parts = partes depois de #/lojinha ou #/passe. */
export function mount(view, nome, parts, ctx = {}) {
  view.replaceChildren();
  if (nome === 'passe') { passe(view, parts, ctx); return; }
  if (parts[0]) detalhe(view, parts[0]); else vitrine(view);
}
export { lojaLigada };
