// Vitrine da Lojinha Beaterista (nova, nov/2026): carrossel de banners, Passe, Universo Robôterista, A banca do Paul, combos, músicos e "experimente grátis".
// Produtos, preços e links vêm de js/loja-config.js (nada muda lá); a ARRUMAÇÃO vem de js/loja-vitrine-config.js.
import { h } from '../util.js';
import { toast } from '../ui.js';
import { PASSE, PRODUTOS, AVISO_DIGITAL, DENTRO } from '../loja-config.js';
import { precoPasse, URL_CARTAO } from '../passe-preco.js';
import { GRATIS } from '../amostra.js';
import * as AC from '../acesso.js';
import { premios } from './premios.js';
import { BANNERS, TELAS_PASSE, PILARES_PASSE, UNIVERSO, BANCA, MUSICOS, ADULTOS, COMBOS, COMBO_ITENS, GRATIS_ITENS } from '../loja-vitrine-config.js';

const CONTATO = 'fale com a equipe #BeateristaTeam pelo WhatsApp (18) 99180-4150';
const prod = (id) => PRODUTOS.find((p) => p.id === id);
const num = (s) => parseFloat(String(s || '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
const reduzido = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const rolar = (el) => el && el.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'start' });

// ---------- compra (sempre por um adulto) ----------
let adultoOk = false;
function abrirPagamento(item) {
  if (item.link) { const w = window.open(item.link, '_blank', 'noopener'); if (!w) location.href = item.link; return; }
  toast(`esse material chega em breve na Lojinha. ${CONTATO}`, { ms: 5200 });
}
/** Pagamento é com um responsável: uma confirmação simples antes de abrir a página de compra (vale pra sessão inteira). */
function comAdulto(item) {
  if (adultoOk || !item.link) { abrirPagamento(item); return; }
  const dlg = h('dialog', { class: 'lj-dlg ljv-adulto', 'aria-label': 'Compra com um responsável' },
    h('div', { class: 'ljv-adulto-i' }, h('img', { src: 'assets/paul/animacoes/web/paul-presente.webp', alt: '', width: 96, height: 96 }),
      h('h3', {}, 'a compra é com um adulto'),
      h('p', {}, 'o pagamento é feito por um responsável, na página de pagamento. ', AVISO_DIGITAL),
      h('button', { type: 'button', class: 'lj-btn amarelo', onclick: () => { adultoOk = true; dlg.close(); abrirPagamento(item); } }, 'sou responsável, continuar'),
      h('button', { type: 'button', class: 'ljv-sec', onclick: () => dlg.close() }, 'voltar')));
  dlg.addEventListener('close', () => dlg.remove()); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}
/** Janela "como você quer pagar?": Pix (página de pagamento, código por e-mail) ou cartão (Hotmart). */
function escolhaPasse() {
  const P = precoPasse(); const ir = (url) => { const w = window.open(url, '_blank', 'noopener'); if (!w) location.href = url; };
  const dlg = h('dialog', { class: 'lj-dlg lj-pay', 'aria-label': 'como você quer pagar?' },
    h('div', { class: 'lj-dtop' }, h('b', {}, 'como você quer pagar?'), h('button', { type: 'button', class: 'lj-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕')),
    h('button', { type: 'button', class: 'lj-pay-op pix', onclick: () => ir(PASSE.link) }, h('span', { class: 'lj-selo' }, 'melhor preço'), h('b', {}, 'Pix'), h('strong', {}, P.atual), h('small', {}, P.oferta ? `oferta ${P.nome} · até ${P.ate}` : 'pagamento único'), h('em', {}, 'o código chega no seu e-mail assim que o Pix é confirmado'), h('i', {}, 'Comprar com Pix ›')),
    h('button', { type: 'button', class: 'lj-pay-op cartao', onclick: () => ir(URL_CARTAO) }, h('b', {}, 'Cartão de crédito'), h('strong', {}, P.cartao), h('small', {}, 'pagamento pela Hotmart'), h('i', {}, 'Comprar com cartão ›')),
    h('p', { class: 'lj-ddig' }, '12 meses de acesso · até 2 aparelhos'));
  dlg.addEventListener('close', () => dlg.remove()); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}

const botao = (txt, item, cls = '') => (item.link
  ? h('button', { type: 'button', class: `lj-btn ${cls}`.trim(), onclick: () => comAdulto(item), 'data-id': item.id || 'passe' }, txt, h('b', { 'aria-hidden': 'true' }, '›'))
  : h('button', { type: 'button', class: `lj-btn breve ${cls}`.trim(), onclick: () => abrirPagamento(item), 'data-id': item.id || 'passe' }, 'em breve'));

// ---------- fotos grandes (zoom das páginas) ----------
function ampliar(p, inicio = 0) {
  const fotos = p.fotos && p.fotos.length ? p.fotos : [p.img];
  const dlg = h('dialog', { class: 'lj-dlg', 'aria-label': p.nome },
    h('div', { class: 'lj-dtop' }, h('b', {}, p.nome), h('button', { type: 'button', class: 'lj-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕')),
    (DENTRO[p.id] || []).length ? h('ul', { class: 'ljv-dentro' }, ...DENTRO[p.id].slice(0, 4).map((x) => h('li', {}, x))) : null,
    h('div', { class: 'lj-fotos' }, ...fotos.slice(0, 3).map((f, i) => h('div', { class: `lj-foto${i > 0 ? ' marca' : ''}`, oncontextmenu: (e) => e.preventDefault() }, h('img', { src: f, alt: `${p.nome}, página ${i + 1}`, decoding: 'async', draggable: 'false' })))),
    h('div', { class: 'lj-dbot' }, botao('Adquirir', p)));
  dlg.addEventListener('close', () => dlg.remove()); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  if (inicio) requestAnimationFrame(() => { const f = dlg.querySelectorAll('.lj-foto')[inicio]; if (f) f.scrollIntoView({ block: 'start' }); });
}

// ---------- carrossel horizontal (deslize + setas + pontinhos) ----------
function carrossel(itens, { rotulo, cls = '', pontos = true } = {}) {
  const trilho = h('div', { class: 'ljv-trilho', tabindex: '0', role: 'group', 'aria-label': rotulo }, ...itens);
  const passo = () => { const a = trilho.firstElementChild, b = a && a.nextElementSibling; return a && b ? b.offsetLeft - a.offsetLeft : trilho.clientWidth * 0.8; };
  const mover = (d) => trilho.scrollBy({ left: d * passo(), behavior: reduzido() ? 'auto' : 'smooth' });
  const ant = h('button', { type: 'button', class: 'ljv-seta ant', 'aria-label': 'anterior', onclick: () => mover(-1) }, '‹');
  const prox = h('button', { type: 'button', class: 'ljv-seta prox', 'aria-label': 'próximo', onclick: () => mover(1) }, '›');
  const pts = pontos && itens.length > 1 ? h('div', { class: 'ljv-pts', 'aria-hidden': 'true' }, ...itens.map(() => h('i', {}))) : null;
  let raf = 0;
  const atualiza = () => {
    raf = 0;
    const filhos = [...trilho.children]; if (!filhos.length) return;
    const x = trilho.scrollLeft + trilho.clientWidth / 2;
    let i = 0, melhor = Infinity; filhos.forEach((f, k) => { const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - x); if (d < melhor) { melhor = d; i = k; } });
    if (pts) [...pts.children].forEach((p, k) => p.classList.toggle('on', k === i));
    ant.disabled = trilho.scrollLeft < 4; prox.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
    ant.hidden = prox.hidden = trilho.scrollWidth <= trilho.clientWidth + 4;
  };
  trilho.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(atualiza); }, { passive: true });
  trilho.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); } });
  window.addEventListener('resize', atualiza);
  setTimeout(atualiza, 60); setTimeout(atualiza, 600);
  return h('div', { class: `ljv-car ${cls}`.trim() }, trilho, ant, prox, pts);
}

const precoEl = (p) => (p.preco ? h('b', { class: 'ljv-preco' }, p.precoDe ? [h('s', { class: 'lj-de', 'aria-label': `de ${p.precoDe}` }, p.precoDe), ' por '] : null, p.preco) : null);

// ---------- produtos: capas grandes + painel com as páginas por dentro ----------
function produtos(ids, { classe = '' } = {}) {
  const raiz = h('div', { class: `ljv-prods ${classe}`.trim() });
  const painel = h('article', { class: 'ljv-painel', 'aria-live': 'polite' });
  let sel = '';
  function desenharPainel(p) {
    const fotos = p.fotos && p.fotos.length ? p.fotos : [p.img];
    painel.replaceChildren(
      h('div', { class: 'ljv-p-top' }, h('h3', {}, p.nome), p.tag ? h('span', { class: 'lj-selo' }, p.tag) : null),
      p.selo ? h('span', { class: 'ljv-selo' }, p.selo) : null,
      fotos.length ? h('button', { type: 'button', class: 'ljv-dentro-link', 'aria-expanded': 'false', onclick: (e) => { const ab = painel.classList.toggle('aberto'); e.currentTarget.setAttribute('aria-expanded', String(ab)); e.currentTarget.textContent = ab ? 'esconder o por dentro ▴' : 'ver por dentro ▾'; } }, 'ver por dentro ▾') : null,
      fotos.length ? carrossel(fotos.slice(0, 3).map((f, i) => h('button', { type: 'button', class: `ljv-pag${i > 0 ? ' marca' : ''}`, 'aria-label': `ver a página ${i + 1} de ${p.nome}`, onclick: () => ampliar(p, i), oncontextmenu: (e) => e.preventDefault() },
        h('img', { src: f, alt: `${p.nome}, página ${i + 1}`, loading: 'lazy', draggable: 'false', onerror: (e) => { const b = e.target.closest('.ljv-pag'); if (b) b.remove(); } }))), { rotulo: `páginas de ${p.nome}`, cls: 'ljv-paginas' }) : null,
      h('div', { class: 'ljv-compra' }, precoEl(p), botao('Adquirir', p, 'amarelo')));
    painel.classList.remove('pop'); void painel.offsetWidth; painel.classList.add('pop');
  }
  function escolher(p, el) {
    sel = p.id;
    raiz.querySelectorAll('.ljv-cap').forEach((c) => { c.classList.toggle('on', c === el); c.setAttribute('aria-pressed', String(c === el)); });
    desenharPainel(p);
  }
  function montar(lista) {
    const ps = lista.map(prod).filter(Boolean);
    const capas = ps.map((p) => {
      const b = h('button', { type: 'button', class: 'ljv-cap', 'aria-pressed': 'false', 'aria-label': `ver ${p.nome}`, 'data-id': p.id }, h('img', { src: p.img, alt: p.nome, width: p.w || 640, height: p.h || 800, loading: 'lazy', draggable: 'false' }));
      b.addEventListener('click', () => { b.classList.remove('toque'); void b.offsetWidth; b.classList.add('toque'); escolher(p, b); });
      return b;
    });
    raiz.replaceChildren(carrossel(capas, { rotulo: 'materiais', cls: 'ljv-capas' }), painel);
    if (ps.length) escolher(ps.find((p) => p.id === sel) || ps[0], capas[Math.max(0, ps.findIndex((p) => p.id === sel))]);
  }
  montar(ids);
  raiz.trocar = (lista) => { sel = ''; montar(lista); };
  return raiz;
}

// ---------- partes da página ----------
const secao = (id, titulo, sub, paul, ...filhos) => h('section', { class: `ljv-s ljv-s-${id}`, id: `lj-${id}`, 'aria-labelledby': `lj-${id}-t` },
  h('header', { class: 'ljv-s-top' }, h('div', {}, h('h2', { id: `lj-${id}-t` }, titulo), sub ? h('p', {}, sub) : null), paul ? h('img', { class: 'ljv-host', src: paul.src, alt: paul.alt || '', width: 64, height: 64, loading: 'lazy' }) : null), ...filhos);

function banners() {
  const acao = (b) => (b.tipo === 'passe' ? escolhaPasse() : rolar(document.getElementById(`lj-${b.alvo}`)));
  const slides = BANNERS.filter((b) => b.tipo !== 'passe' || !AC.liberado()).map((b) => (b.arte
    ? h('button', { type: 'button', class: 'ljv-banner arte', 'aria-label': b.alt, 'data-id': b.id, onclick: () => acao(b) }, h('img', { src: b.img, alt: b.alt, width: b.w, height: b.h, draggable: 'false' }))
    : h('button', { type: 'button', class: `ljv-banner faixa f-${b.id}`, 'aria-label': b.alt, 'data-id': b.id, onclick: () => acao(b) },
      h('img', { src: b.img, alt: '', width: 96, height: 96, draggable: 'false' }),
      h('span', { class: 'ljv-faixa-t' }, h('small', {}, b.rotulo), h('b', {}, b.titulo), b.tipo === 'passe' ? h('em', {}, precoPasse().atual) : null), h('i', { 'aria-hidden': 'true' }, '›'))));
  return carrossel(slides, { rotulo: 'destaques da lojinha', cls: 'ljv-banners' });
}

function passe() {
  const pr = precoPasse();
  const telas = TELAS_PASSE.map((t) => h('figure', { class: `ljv-tela k-${t.k}` }, h('img', { src: t.img, alt: `Tela real do app: ${t.legenda}`, width: t.w, height: t.h, loading: 'lazy', draggable: 'false' }), h('figcaption', {}, t.legenda)));
  return secao('passe', 'Dentro do passe', 'jogos, instrumentos virtuais, desafios e figurinhas', { src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: 'Paul comemorando' },
    carrossel(telas, { rotulo: 'telas reais do app', cls: 'ljv-telas', pontos: false }),
    h('div', { class: 'ljv-chips' }, ...PILARES_PASSE.map(([k, t]) => h('span', { class: `ljv-chip k-${k}` }, t))),
    h('div', { class: 'ljv-passe' },
      h('div', { class: 'ljv-passe-info' }, h('b', { class: 'ljv-doze' }, h('span', {}, '12'), ' meses de acesso'), h('p', {}, 'pagamento único, sem mensalidade')),
      h('div', { class: 'ljv-passe-preco' }, h('b', { class: 'ljv-preco grande' }, pr.atual), pr.oferta ? h('small', { class: 'lj-de' }, `de ${pr.de} · até ${pr.ate}`) : null),
      h('button', { type: 'button', class: 'lj-btn amarelo', 'data-id': 'passe', onclick: escolhaPasse }, 'Adquirir o passe', h('b', { 'aria-hidden': 'true' }, '›'))));
}

function combo(c) {
  const itens = (COMBO_ITENS[c.id] || []).map(prod).filter(Boolean);
  const alvo = c.link ? c : c.provisorio ? { id: c.id, nome: c.provisorio.nome, preco: c.provisorio.preco, link: c.provisorio.link } : c;
  const paga = num(alvo.preco); const soma = itens.reduce((t, p) => t + num(p.preco), 0); const eco = c.link && paga ? soma - paga : 0; // só mostra economia quando o combo tem preço próprio e a conta fecha a favor
  const breve = !alvo.link;
  return h('article', { class: 'ljv-combo', 'data-id': c.id },
    h('div', { class: 'ljv-combo-itens', style: `--n:${itens.length}`, 'aria-label': 'o que vem no combo' }, ...itens.map((p) => h('button', { type: 'button', class: 'ljv-mini', 'aria-label': `ver ${p.nome}`, onclick: () => ampliar(p) }, h('img', { src: p.img, alt: p.nome, loading: 'lazy', draggable: 'false' })))),
    h('div', { class: 'ljv-combo-fim' },
      h('div', { class: 'ljv-combo-nome' }, h('b', {}, c.nome), h('small', {}, c.provisorio && !c.link ? 'combo chegando · por enquanto leve o jogo da memória' : `${itens.length || c.itens.length} materiais${soma ? ` · ${brl(soma)} se comprados separados` : ''}`)),
      h('div', { class: 'ljv-combo-preco' }, alvo.preco ? h('b', { class: 'ljv-preco' }, c.precoDe ? [h('s', { class: 'lj-de' }, c.precoDe), ' ', alvo.preco] : alvo.preco) : null, eco > 0.004 ? h('span', { class: 'ljv-eco' }, `economia de ${brl(eco)}`) : null)),
    breve ? h('button', { type: 'button', class: 'lj-btn breve', onclick: () => abrirPagamento({}) }, 'em breve') : botao(c.link ? 'Adquirir' : 'Levar o jogo', alvo, 'amarelo'));
}

function banca() {
  const prateleira = produtos(BANCA[0].ids, { classe: 'ljv-banca-prods' });
  const chips = h('div', { class: 'ljv-cats', role: 'group', 'aria-label': 'prateleiras da banca' }, ...BANCA.map((c, i) => h('button', { type: 'button', class: `ljv-cat${i === 0 ? ' on' : ''}`, 'aria-pressed': String(i === 0), onclick: (e) => {
    chips.querySelectorAll('.ljv-cat').forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); });
    prateleira.trocar(c.ids);
  } }, c.nome)));
  return secao('banca', 'A banca do Paul', 'colorir, jogos e cartas pra imprimir: a coleção do Paul pra aprender brincando', { src: 'assets/entrada/paul-na-lojinha.webp', alt: 'Paul na banca' }, chips, prateleira);
}

function gratis() {
  const g = `${GRATIS.termos} termos do dicionário, ${GRATIS.aulinha} passos da aulinha, ${GRATIS.caca} partidas de caça-palavras e ${GRATIS.cruzadinha} cruzadinhas`;
  return secao('gratis', 'Experimente gratuitamente', `sem código você já vê: ${g}`, { src: 'assets/paul/animacoes/web/paul-aceno.webp', alt: 'Paul acenando' },
    h('div', { class: 'ljv-gratis-grade' }, ...GRATIS_ITENS.map((it) => h('a', { class: 'ljv-gratis', href: it.href, onclick: it.href.startsWith('#lj-') ? (e) => { e.preventDefault(); rolar(document.getElementById(it.href.slice(1))); } : null }, h('img', { src: it.img, alt: '', loading: 'lazy', draggable: 'false' }), h('span', {}, h('b', {}, it.titulo), h('small', {}, it.frase))))));
}


// ---------- visual azul (pedido da Bea, 28/nov/2026): topo que vende, lendárias e barra de compra ----------
const irPara = (url) => { const w = window.open(url, '_blank', 'noopener'); if (!w) location.href = url; };
const comprarPix = () => irPara(PASSE.link);
const comprarCartao = () => irPara(URL_CARTAO);
const LENDARIAS_IMG = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06'].map((c) => `assets/figurinhas/lendarias/${c}.webp`);

/** Topo da vitrine: materiais do Paul (PDF pra imprimir). Os combos e o colorir vêm logo abaixo; o passe fica mais pra baixo. */
function heroMateriais() {
  return h('section', { class: 'ljv-hero ljv-hero-mat', id: 'lj-topo', 'aria-label': 'materiais do Paul' },
    h('div', { class: 'ljv-hero-top' },
      h('div', {}, h('small', { class: 'ljv-kick' }, 'lojinha do paul'), h('h1', {}, 'Música pra ', h('br'), 'imprimir, colorir ', h('br'), 'e brincar.')),
      h('img', { class: 'ljv-hero-paul', src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: 'Paul comemorando', width: 140, height: 140 })),
    h('div', { class: 'ljv-hero-chips' }, h('span', {}, 'PDF na hora'), h('span', {}, 'pagamento único'), h('span', {}, 'pouca tinta')));
}

/** Passe anual (acesso aos jogos): título, preço, botão do Pix e do cartão. Fica depois dos combos e da banca. */
function hero() {
  const pr = precoPasse();
  return h('section', { class: 'ljv-hero ljv-hero-passe', id: 'lj-acesso', 'aria-label': 'passe anual' },
    h('div', { class: 'ljv-hero-top' },
      h('div', {}, h('small', { class: 'ljv-kick' }, 'robôterista paul ensina'), h('h1', {}, 'Aprenda música ', h('br'), 'brincando com o Paul.')),
      h('img', { class: 'ljv-hero-paul', src: 'assets/paul/animacoes/web/paul-presente.webp', alt: 'Paul segurando um presente', width: 140, height: 140 })),
    h('div', { class: 'ljv-hero-preco' },
      h('div', { class: 'ljv-hero-p' }, h('b', {}, pr.atual), h('small', {}, pr.oferta ? `no Pix · até ${pr.ate}` : 'no Pix')),
      h('div', { class: 'ljv-hero-chips' }, h('span', {}, '12 meses'), h('span', {}, 'até 2 aparelhos'), h('span', {}, 'código no e-mail'))),
    h('button', { type: 'button', class: 'ljv-cta', 'data-id': 'passe-pix', onclick: comprarPix }, 'Quero o passe · pagar no Pix'),
    h('button', { type: 'button', class: 'ljv-cta2', 'data-id': 'passe-cartao', onclick: comprarCartao }, `ou no cartão · ${pr.cartao}`));
}

/** As 6 figurinhas lendárias (preto e dourado): só quem compra o combo ganha. */
function lendarias() {
  return h('section', { class: 'ljv-lend', id: 'lj-lendarias', 'aria-labelledby': 'lj-lendarias-t' },
    h('small', { class: 'ljv-kick' }, 'exclusivas · lendárias'), h('h2', { id: 'lj-lendarias-t' }, '6 figurinhas que só quem compra o combo ganha'),
    h('div', { class: 'ljv-fan', 'aria-hidden': 'true' }, ...LENDARIAS_IMG.map((src, i) => h('img', { src, alt: '', loading: 'lazy', draggable: 'false', style: `--i:${i}` }))),
    h('p', {}, 'preto e dourado, fora da roleta. aparecem no seu álbum depois da compra.'));
}


const ALVO = { cards: 'banca', ensina: 'universo', evoluir: 'musicos' }; // rotas antigas #/lojinha/<seção>

/** `secao` = rota antiga (cards | ensina | evoluir) ou id de seção: abre a vitrine já rolada até lá. `opts.abrirCodigo` = folha "já tenho meu código". */
export function vitrine(secao_ = '', { abrirCodigo, inicio = '#/inicio' } = {}) {
  const universo = secao('universo', 'Universo Robôterista', 'as apostilas do Paul: toque na capa e folheie por dentro', { src: 'assets/entrada/paul-professor.webp', alt: 'Paul professor' }, produtos(UNIVERSO));
  const musicos = secao('musicos', 'Para músicos', 'estudo de bateria, violão e os exercícios que a Bea leva pro palco', { src: 'assets/entrada/paul-guitarra.webp', alt: 'Paul com a guitarra' }, produtos(MUSICOS));
  const adultos = secao('adultos', 'Adolescentes e adultos', 'apostilas pra quem quer tocar de verdade: bateria e teclado', { src: 'assets/paul/animacoes/web/paul-pensativo.webp', alt: 'Paul pensando' }, produtos(ADULTOS));
  const combos = secao('combos', 'Combos completos', 'tudo que vem dentro e quanto você economiza', { src: 'assets/paul/animacoes/web/paul-bau.webp', alt: 'Paul com o baú' }, ...COMBOS.map(combo));
  const resp = h('details', { class: 'ljv-resp' },
    h('summary', {}, 'para os responsáveis: pagamento e informações'),
    h('ul', {}, h('li', {}, AVISO_DIGITAL), h('li', {}, 'o passe: 12 meses de acesso, pagamento único (pix) pelo WhatsApp. os materiais: pagamento na página da Hotmart.'), h('li', {}, CONTATO)),
    h('a', { class: 'ljv-link', href: '#/jogos/relatorio' }, 'ver o que cada jogo desenvolve ›'));
  const prem = premios(); // só quem tem o passe (código válido) vê os prêmios; quem não tem vê o Passe à venda
  const nav = [...(prem ? [['premios', 'Prêmios']] : []), ['combos', 'Combos'], ['banca', 'Colorir e jogos'], ['lendarias', 'Lendárias'], ...(prem ? [] : [['acesso', 'Passe']]), ['universo', 'Apostilas'], ['musicos', 'Músicos'], ['adultos', 'Teens e adultos'], ['gratis', 'Grátis']];
  const topo = h('div', { class: 'ljv-topo' },
    h('div', { class: 'ljv-topo-l' }, h('a', { class: 'ljv-link', href: inicio }, '‹ voltar ao início'), h('button', { type: 'button', class: 'ljv-link', onclick: () => (abrirCodigo ? abrirCodigo() : toast('digite o código no fim da página')) }, 'já tenho um código')),
    h('nav', { class: 'ljv-nav', 'aria-label': 'seções da lojinha' }, ...nav.map(([id, t]) => h('button', { type: 'button', onclick: () => rolar(document.getElementById(`lj-${id}`)) }, t))));
  const heroEl = prem ? null : hero(); // quem já tem o passe vê os prêmios no topo; quem não tem vê o passe depois dos combos
  const raiz = h('div', { class: 'ljv ljv-azul bmr' }, topo, prem || heroMateriais(), prem ? null : combos, prem ? null : banca(), prem ? combos : null, prem ? banca() : null, lendarias(), heroEl, heroEl ? passe() : null, banners(), universo, musicos, adultos, gratis(), resp);
  const alvo = ALVO[secao_] || (secao_ && document.getElementById ? secao_ : '');
  if (alvo) setTimeout(() => rolar(raiz.querySelector(`#lj-${alvo}`)), 350);
  return raiz;
}
