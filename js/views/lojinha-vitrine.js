// Vitrine da Lojinha Beaterista (nova, nov/2026): carrossel de banners, Passe, Universo Robôterista, A banca do Paul, combos, músicos e "experimente grátis".
// Produtos, preços e links vêm de js/loja-config.js (nada muda lá); a ARRUMAÇÃO vem de js/loja-vitrine-config.js.
import { h } from '../util.js';
import { toast } from '../ui.js';
import { PASSE, PRODUTOS, AVISO_DIGITAL, DENTRO } from '../loja-config.js';
import { precoPasse } from '../passe-preco.js';
import { GRATIS } from '../amostra.js';
import * as AC from '../acesso.js';
import { premios } from './premios.js';
import { BANNERS, TELAS_PASSE, PILARES_PASSE, UNIVERSO, BANCA, MUSICOS, COMBOS, GRATIS_ITENS } from '../loja-vitrine-config.js';

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
  const oferta = precoPasse().oferta;
  const lista = BANNERS.filter((b) => b.so !== 'oferta-passe' || (oferta && !AC.liberado())); // quem já tem o passe não precisa da oferta
  const acao = (b) => (b.tipo === 'compra' ? comAdulto(b.item) : (() => { const p = prod(b.produto); if (p) ampliar(p); })());
  const slides = lista.map((b) => (b.arte
    ? h('button', { type: 'button', class: 'ljv-banner arte', 'aria-label': b.alt, 'data-id': b.id, onclick: () => acao(b) }, h('img', { src: b.img, alt: b.alt, width: b.w, height: b.h, draggable: 'false' }))
    : h('button', { type: 'button', class: `ljv-banner faixa f-${b.id}`, 'aria-label': b.alt, 'data-id': b.id, onclick: () => acao(b) },
      h('img', { src: b.img, alt: '', width: 96, height: 96, draggable: 'false' }),
      h('span', { class: 'ljv-faixa-t' }, h('small', {}, 'combo'), h('b', {}, b.titulo), h('em', {}, b.preco)), h('i', { 'aria-hidden': 'true' }, '›'))));
  return carrossel(slides, { rotulo: 'destaques da lojinha', cls: 'ljv-banners' });
}

function passe() {
  const pr = precoPasse();
  const telas = TELAS_PASSE.map((t) => h('figure', { class: `ljv-tela k-${t.k}` }, h('img', { src: t.img, alt: `Tela real do app: ${t.legenda}`, width: t.w, height: t.h, loading: 'lazy', draggable: 'false' }), h('figcaption', {}, t.legenda)));
  return secao('passe', 'Passe Anual Beaterista PLAY', 'jogos, instrumentos virtuais, desafios e figurinhas', { src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: 'Paul comemorando' },
    carrossel(telas, { rotulo: 'telas reais do app', cls: 'ljv-telas', pontos: false }),
    h('div', { class: 'ljv-chips' }, ...PILARES_PASSE.map(([k, t]) => h('span', { class: `ljv-chip k-${k}` }, t))),
    h('div', { class: 'ljv-passe' },
      h('div', { class: 'ljv-passe-info' }, h('b', { class: 'ljv-doze' }, h('span', {}, '12'), ' meses de acesso'), h('p', {}, 'pagamento único, sem mensalidade')),
      h('div', { class: 'ljv-passe-preco' }, h('b', { class: 'ljv-preco grande' }, pr.atual), pr.oferta ? h('small', { class: 'lj-de' }, `de ${pr.de} · até ${pr.ate}`) : null),
      botao('Adquirir o passe', PASSE, 'amarelo')));
}

function combo(c) {
  const itens = c.itens.map(prod).filter(Boolean);
  const alvo = c.produto ? prod(c.produto) : c.item;
  const soma = itens.reduce((s, p) => s + num(p.preco), 0), paga = num(alvo.preco), eco = soma - paga;
  return h('article', { class: 'ljv-combo', 'data-id': c.id },
    h('div', { class: 'ljv-combo-itens', style: `--n:${itens.length}`, 'aria-label': 'o que vem no combo' }, ...itens.map((p) => h('button', { type: 'button', class: 'ljv-mini', 'aria-label': `ver ${p.nome}`, onclick: () => ampliar(p) }, h('img', { src: p.img, alt: p.nome, loading: 'lazy', draggable: 'false' })))),
    h('div', { class: 'ljv-combo-fim' },
      h('div', { class: 'ljv-combo-nome' }, h('b', {}, alvo.nome || c.nome), h('small', {}, `${itens.length} materiais · ${brl(soma)} separados`)),
      h('div', { class: 'ljv-combo-preco' }, h('b', { class: 'ljv-preco' }, alvo.preco), eco > 0.004 ? h('span', { class: 'ljv-eco' }, `economia de ${brl(eco)}`) : null)),
    botao('Adquirir', alvo, 'amarelo'));
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

const ALVO = { cards: 'banca', ensina: 'universo', evoluir: 'musicos' }; // rotas antigas #/lojinha/<seção>

/** `secao` = rota antiga (cards | ensina | evoluir) ou id de seção: abre a vitrine já rolada até lá. `opts.abrirCodigo` = folha "já tenho meu código". */
export function vitrine(secao_ = '', { abrirCodigo, inicio = '#/inicio' } = {}) {
  const universo = secao('universo', 'Universo Robôterista', 'as apostilas do Paul: toque na capa e folheie por dentro', { src: 'assets/entrada/paul-professor.webp', alt: 'Paul professor' }, produtos(UNIVERSO));
  const musicos = secao('musicos', 'Para músicos', 'estudo de bateria, violão e os exercícios que a Bea leva pro palco', { src: 'assets/entrada/paul-guitarra.webp', alt: 'Paul com a guitarra' }, produtos(MUSICOS));
  const combos = secao('combos', 'Combos completos', 'tudo que vem dentro e quanto você economiza', { src: 'assets/paul/animacoes/web/paul-bau.webp', alt: 'Paul com o baú' }, ...COMBOS.map(combo));
  const resp = h('details', { class: 'ljv-resp' },
    h('summary', {}, 'para os responsáveis: pagamento e informações'),
    h('ul', {}, h('li', {}, AVISO_DIGITAL), h('li', {}, 'o passe: 12 meses de acesso, pagamento único (pix) pelo WhatsApp. os materiais: pagamento na página da Hotmart.'), h('li', {}, CONTATO)),
    h('a', { class: 'ljv-link', href: '#/jogos/relatorio' }, 'ver o que cada jogo desenvolve ›'));
  const prem = premios(); // só quem tem o passe (código válido) vê os prêmios; quem não tem vê o Passe à venda
  const nav = [prem ? ['premios', 'Prêmios'] : ['passe', 'Passe'], ['universo', 'Apostilas'], ['banca', 'Banca do Paul'], ['combos', 'Combos'], ['musicos', 'Músicos'], ['gratis', 'Grátis']];
  const topo = h('div', { class: 'ljv-topo' },
    h('div', { class: 'ljv-topo-l' }, h('a', { class: 'ljv-link', href: inicio }, '‹ voltar ao início'), h('button', { type: 'button', class: 'ljv-link', onclick: () => (abrirCodigo ? abrirCodigo() : toast('digite o código no fim da página')) }, 'já tenho um código')),
    h('nav', { class: 'ljv-nav', 'aria-label': 'seções da lojinha' }, ...nav.map(([id, t]) => h('button', { type: 'button', onclick: () => rolar(document.getElementById(`lj-${id}`)) }, t))));
  const raiz = h('div', { class: 'ljv' }, topo, banners(), prem || passe(), universo, banca(), combos, musicos, gratis(), resp);
  const alvo = ALVO[secao_] || (secao_ && document.getElementById ? secao_ : '');
  if (alvo) setTimeout(() => rolar(raiz.querySelector(`#lj-${alvo}`)), 350);
  return raiz;
}
