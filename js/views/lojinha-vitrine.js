// Vitrine da Lojinha Beaterista (desenho da Bea): materiais em cartões + Passe Beaterista. Textos, imagens e links em js/loja-config.js.
// Tocar na capa abre as fotos grandes do material (o que tem dentro), com o botão Adquirir.
import { h } from '../util.js';
import { iconePaul } from '../icone-paul.js';
import { toast } from '../ui.js';
import { PASSE, PRODUTOS, COMBOS, AMADOS, BANNER_COMBOS, ANUAL, SECOES, AVISO_DIGITAL, DENTRO } from '../loja-config.js';
import { precoPasse } from '../passe-preco.js';

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
    (DENTRO[p.id] || p.itens || []).length ? h('div', { class: 'lj-dentro' }, h('b', {}, 'o que tem dentro'), h('ul', {}, ...(DENTRO[p.id] || p.itens).map((x) => h('li', {}, x)))) : null,
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

/** Banner do acesso anual (oferta Black Friday / Natal): fica em cima dos combos enquanto vale a oferta. */
function destaqueAnual() {
  return h('article', { class: 'lj-bf lj-bf-topo lj-anual', 'data-id': ANUAL.id },
    h('button', { type: 'button', class: 'lj-bf-link', 'aria-label': `comprar o acesso anual por ${precoPasse().atual}`, onclick: comprar(ANUAL) }, h('img', { class: 'lj-bf-arte', src: ANUAL.img, alt: ANUAL.desc, width: ANUAL.w, height: ANUAL.h })),
    h('div', { class: 'lj-bf-cta' }, botao('Quero o acesso anual', ANUAL, 'amarelo')));
}

/** Combos: cada um é um banner de arte (como o combo antigo) com preço e botão; sem link, um bloco vermelho "em breve" com a lista do que vai dentro. */
const heroCombo = (c) => (c.img
  ? h('article', { class: 'lj-bf lj-bf-topo lj-combo-hero', 'data-id': c.id },
    h('button', { type: 'button', class: 'lj-bf-link', 'aria-label': `ver ${c.nome}`, onclick: () => detalhe({ ...c, fotos: [c.img], tag: 'combo' }) }, h('img', { class: 'lj-bf-arte', src: c.img, alt: `${c.nome}: ${c.desc}`, loading: 'lazy', width: c.w, height: c.h })),
    h('div', { class: 'lj-bf-cta' }, h('span', { class: 'lj-selo' }, c.precoDe ? 'combo · economize' : 'combo'), h('b', { class: 'lj-preco' }, c.precoDe ? [h('s', { class: 'lj-de' }, c.precoDe), ' ', c.preco] : c.preco), botao('Adquirir o combo', c, 'amarelo')))
  : h('article', { class: 'lj-combo-vazio', 'data-id': c.id },
    h('span', { class: 'lj-selo' }, 'em breve'), h('h3', {}, c.nome), h('ul', {}, ...c.itens.map((x) => h('li', {}, x))),
    h('img', { src: 'assets/paul/colorido/paul-presente.webp', alt: '', loading: 'lazy', draggable: 'false' })));
/** Os preferidos da turma: colorir, atividades e jogo da memória (à venda) + o UNO Musical (jogo do app: leva pro jogo, não vende). */
const unoApp = () => h('article', { class: 'lj-card lj-uno', 'data-id': 'uno-app' },
  h('a', { class: 'lj-capa', href: '#/jogos/cartas', 'aria-label': 'jogar o Uno Musical no app' }, h('img', { src: 'assets/jogos/icones/cartas.webp', alt: 'Uno Musical', loading: 'lazy', width: 640, height: 640 })),
  h('h3', {}, 'Uno Musical'), h('p', {}, 'o jogo de cartas das figuras rítmicas, contra o robô ou com um amigo'), h('span', { class: 'lj-selo' }, 'jogo do app · já é seu'),
  h('a', { class: 'lj-btn amarelo', href: '#/jogos/cartas' }, 'Jogar agora', h('b', { 'aria-hidden': 'true' }, '›')));
function amados() {
  const itens = AMADOS.map((id) => PRODUTOS.find((p) => p.id === id)).filter(Boolean);
  return h('section', { class: 'lj-amados', 'aria-labelledby': 'lj-amados-t' },
    h('div', { class: 'lj-amados-top' }, h('i', { 'aria-hidden': 'true' }, '⭐'), h('h2', { id: 'lj-amados-t' }, 'Os preferidos da turma', h('small', {}, 'o que a galera mais ama: colorir, atividades e jogos'))),
    h('div', { class: 'lj-amados-faixa' }, ...itens.map(cartao), unoApp()),
    h('p', { class: 'lj-amados-dica', 'aria-hidden': 'true' }, 'deslize pro lado ›'));
}
function combos() {
  return h('section', { class: 'lj-combos', 'aria-label': 'Combos especiais' },
    h('img', { class: 'lj-combos-banner', src: BANNER_COMBOS.img, alt: BANNER_COMBOS.alt, width: BANNER_COMBOS.w, height: BANNER_COMBOS.h }),
    ...COMBOS.slice().sort((a, b) => Number(!!b.link) - Number(!!a.link)).map(heroCombo)); // os combos com link primeiro; "em breve" por último
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
    destaqueAnual(),
    amados(),
    combos(),
    h('img', { class: 'lj-topo', src: 'assets/loja/topo.webp', alt: 'Lojinha Beaterista', width: 610, height: 230 }),
    h('h2', { class: 'lj-esc' }, h('span', {}, 'Por onde você quer começar?')),
    h('div', { class: 'lj-secs' }, ...SECOES.map(tile)),
    h('p', { class: 'lj-digital' }, h('b', {}, '📄 materiais digitais. '), AVISO_DIGITAL),
    PASSE.link ? h('article', { class: 'lj-passe' }, h('img', { src: PASSE.img, alt: '', loading: 'lazy' }),
      h('div', { class: 'lj-pm' }, h('h3', {}, iconePaul('passe-beaterista', 30), PASSE.nome), h('ul', {}, ...PASSE.info.map((x) => h('li', {}, x)))),
      h('div', { class: 'lj-pp' }, h('span', { class: 'lj-preco' }, precoPasse().atual), precoPasse().oferta ? h('small', { class: 'lj-de' }, `de ${precoPasse().de} · oferta até ${precoPasse().ate}`) : null, botao('Adquirir passe', PASSE, 'amarelo'))) : null);
}
