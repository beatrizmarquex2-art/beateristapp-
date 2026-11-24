// Vitrine da Lojinha Beaterista (desenho da Bea): materiais em cartões + Passe Beaterista. Textos, imagens e links em js/loja-config.js.
// Tocar na capa abre as fotos grandes do material (o que tem dentro), com o botão Adquirir.
import { h } from '../util.js';
import { toast } from '../ui.js';
import { PRODUTOS, COMBO, SECOES, AVISO_DIGITAL, DENTRO } from '../loja-config.js';
import { cartaoPasse } from '../promo-passe.js';

const CONTATO = 'fale com a equipe #BeateristaTeam pelo WhatsApp (18) 99180-4150';
const comprar = (item) => () => {
  if (item.link) { const w = window.open(item.link, '_blank', 'noopener'); if (!w) location.href = item.link; return; } // se o celular bloquear a janela nova, abre na mesma aba
  toast(`esse material chega em breve na Lojinha. ${CONTATO}`, { ms: 5200 });
};
// sem link de compra ainda: o botão diz "em breve" e, ao tocar, explica e mostra o contato (antes ficava desligado e não mostrava nada)
const botao = (txt, item, cls) => (item.link
  ? h('button', { type: 'button', class: `lj-btn ${cls || ''}`.trim(), onclick: comprar(item), 'data-id': item.id || 'passe' }, txt, h('b', { 'aria-hidden': 'true' }, '›'))
  : h('button', { type: 'button', class: `lj-btn breve ${cls || ''}`.trim(), onclick: comprar(item), 'data-id': item.id || 'passe' }, 'em breve'));

/** Janela com as fotos grandes do material. */
function detalhe(p) {
  const fotos = p.fotos && p.fotos.length ? p.fotos : [p.img]; // sempre tem pelo menos a capa
  const info = h('div', { class: 'lj-dinfo' },
    p.tag ? h('span', { class: 'lj-selo' }, p.tag) : null,
    h('p', { class: 'lj-ddesc' }, p.desc || ''),
    (DENTRO[p.id] || []).length ? h('div', { class: 'lj-dentro' }, h('b', {}, 'o que tem dentro'), h('ul', {}, ...DENTRO[p.id].map((x) => h('li', {}, x)))) : null,
    p.preco ? h('b', { class: 'lj-preco lj-preco-card' }, p.precoDe ? [h('s', { class: 'lj-de', 'aria-label': `de ${p.precoDe}` }, p.precoDe), ' por '] : null, p.preco) : null,
    h('p', { class: 'lj-ddig' }, 'material digital (PDF): você baixa depois da compra, imprime e usa.'));
  const dlg = h('dialog', { class: 'lj-dlg', 'aria-label': p.nome },
    h('div', { class: 'lj-dtop' }, h('b', {}, p.nome), h('button', { type: 'button', class: 'lj-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕')),
    info,
    // sem loading="lazy": dentro da janela (dialog) o iPhone não carregava as fotos e a tela ficava vazia
    h('div', { class: 'lj-fotos' }, ...fotos.slice(0, 3).map((f, i) => h('div', { class: `lj-foto${i > 0 ? ' marca' : ''}`, oncontextmenu: (e) => e.preventDefault() }, h('img', { src: f, alt: `${p.nome}, imagem ${i + 1}`, decoding: 'async', draggable: 'false', onerror: (e) => { e.target.parentNode.hidden = true; } }))), h('p', { class: 'lj-previa' }, 'prévia: só algumas páginas, o material completo é bem maior')),
    h('div', { class: 'lj-dbot' }, botao('Adquirir', p)));
  dlg.addEventListener('close', () => dlg.remove()); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}

/** Destaque do combo Black Friday: primeira coisa da Lojinha. */
function destaqueCombo() {
  return h('article', { class: 'lj-bf lj-bf-topo', 'data-id': COMBO.id },
    h('button', { type: 'button', class: 'lj-bf-link', 'aria-label': 'comprar o combo Robôterista', onclick: comprar(COMBO) }, h('img', { class: 'lj-bf-arte', src: COMBO.img, alt: `${COMBO.nome}: ${COMBO.desc}, por ${COMBO.preco}`, width: COMBO.w, height: COMBO.h })),
    h('div', { class: 'lj-bf-cta' }, h('span', { class: 'lj-selo' }, 'promoção black friday'), h('b', { class: 'lj-preco' }, COMBO.preco), botao('Adquirir o combo', COMBO, 'amarelo')));
}


const cartao = (p) => h('article', { class: 'lj-card', 'data-id': p.id },
  h('button', { type: 'button', class: 'lj-capa', 'aria-label': `ver ${p.nome}`, onclick: () => detalhe(p) }, h('img', { src: p.img, alt: p.nome, loading: 'lazy', width: p.w || 640, height: p.h || 800 })),
  h('h3', {}, p.nome), h('p', {}, p.desc), p.selo ? h('span', { class: 'lj-selo' }, p.selo) : null, p.preco ? h('b', { class: 'lj-preco lj-preco-card' }, p.precoDe ? [h('s', { class: 'lj-de', 'aria-label': `de ${p.precoDe}` }, p.precoDe), ' por '] : null, p.preco) : null, botao('Adquirir', p));

/** Cartão grande de uma seção: três capas em leque + o nome. Cada seção tem a sua cara (classe `lj-sec-<id>`). */
function tile(s) {
  const capas = s.capas.map((id) => PRODUTOS.find((p) => p.id === id)).filter(Boolean);
  const emBreve = PRODUTOS.filter((p) => p.secao === s.id).every((p) => !p.link);
  return h('a', { class: `lj-sec lj-sec-${s.id}`, href: `#/lojinha/${s.id}`, 'aria-label': `${s.nome}: ${s.chamada}` },
    h('span', { class: 'lj-sec-txt' }, emBreve ? h('i', { class: 'lj-sec-breve' }, 'em breve') : null, h('b', {}, s.nome), h('small', {}, s.chamada), h('em', { 'aria-hidden': 'true' }, 'ver ›')),
    h('span', { class: 'lj-sec-leque', 'aria-hidden': 'true' }, ...capas.map((p, i) => h('img', { class: `l${i}`, src: p.img, alt: '', loading: 'lazy', draggable: 'false' }))));
}

/** `secao` vazio = a vitrine inicial (combo + as 3 seções). `secao` = 'cards' | 'ensina' | 'evoluir' abre os produtos daquela seção. */
export function vitrine(secao = '') {
  const S = SECOES.find((x) => x.id === secao);
  if (S) {
    return h('div', { class: `lj lj-pg lj-pg-${S.id}` },
      h('a', { class: 'lj-volta', href: '#/lojinha' }, '‹ lojinha'),
      h('header', { class: 'lj-pg-top' }, h('h2', {}, S.titulo), h('p', {}, S.sub), S.id === 'cards' ? h('img', { class: 'lj-paul-cards', src: 'assets/entrada/paul-na-lojinha.webp', alt: 'Paul segurando os 3 baralhos: Teoria, Instrumentos e Dicionário', width: 318, height: 350 }) : null),
      h('p', { class: 'lj-digital' }, h('b', {}, '📄 materiais digitais. '), AVISO_DIGITAL),
      h('div', { class: 'lj-grid' }, ...PRODUTOS.filter((p) => p.secao === S.id).map(cartao)),
      h('a', { class: 'lj-volta lj-volta-b', href: '#/lojinha' }, '‹ ver as outras seções'));
  }
  return h('div', { class: 'lj' },
    cartaoPasse({ onde: 'lojinha' }), // Passe Anual: some pra quem já tem o passe
    destaqueCombo(),
    h('img', { class: 'lj-topo', src: 'assets/loja/topo.webp', alt: 'Lojinha Beaterista', width: 610, height: 230 }),
    h('h2', { class: 'lj-esc' }, h('span', {}, 'Por onde você quer começar?')),
    h('div', { class: 'lj-secs' }, ...SECOES.map(tile)),
    h('p', { class: 'lj-digital' }, h('b', {}, '📄 materiais digitais. '), AVISO_DIGITAL));
}
