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

/** Carrossel: faixa que desliza (snap) + setas ‹ › + bolinhas + teclado ← →. `auto` (ms) avança sozinho e pára quando a pessoa mexe. */
function carrossel(filhos, { cls = '', label = '', auto = 0 } = {}) {
  const faixa = h('div', { class: 'lj-car-faixa', tabindex: '0', role: 'group', 'aria-label': label }, ...filhos);
  const passo = () => { const f = faixa.children[0]; if (!f) return 200; const g = parseFloat(getComputedStyle(faixa).columnGap || getComputedStyle(faixa).gap) || 0; return f.getBoundingClientRect().width + g; };
  const irPara = (i) => faixa.scrollTo({ left: i * passo(), behavior: 'smooth' });
  const ant = h('button', { type: 'button', class: 'lj-car-seta ant', 'aria-label': 'anterior', onclick: () => { parou = true; faixa.scrollBy({ left: -passo(), behavior: 'smooth' }); } }, '‹');
  const prox = h('button', { type: 'button', class: 'lj-car-seta prox', 'aria-label': 'próximo', onclick: () => { parou = true; faixa.scrollBy({ left: passo(), behavior: 'smooth' }); } }, '›');
  const pontos = h('div', { class: 'lj-car-pontos', role: 'tablist', 'aria-label': `${label}: ir para` }, ...filhos.map((_, i) => h('button', { type: 'button', role: 'tab', 'aria-label': `item ${i + 1} de ${filhos.length}`, onclick: () => { parou = true; irPara(i); } })));
  let parou = false;
  const atualiza = () => {
    const max = faixa.scrollWidth - faixa.clientWidth; const x = faixa.scrollLeft; const i = Math.min(filhos.length - 1, Math.round(x / passo()));
    ant.hidden = x <= 4; prox.hidden = x >= max - 4;
    [...pontos.children].forEach((d, k) => d.classList.toggle('on', k === i));
  };
  faixa.addEventListener('scroll', () => requestAnimationFrame(atualiza), { passive: true });
  faixa.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); prox.click(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); ant.click(); } });
  ['pointerdown', 'wheel', 'focusin'].forEach((ev) => faixa.addEventListener(ev, () => { parou = true; }, { passive: true }));
  setTimeout(atualiza, 60); setTimeout(atualiza, 600); // depois das imagens/layout
  if (auto) { const t = setInterval(() => { const raiz = faixa.isConnected; if (!raiz) { clearInterval(t); return; } if (parou || document.hidden) return; const max = faixa.scrollWidth - faixa.clientWidth; if (faixa.scrollLeft >= max - 4) irPara(0); else faixa.scrollBy({ left: passo(), behavior: 'smooth' }); }, auto); }
  return h('div', { class: `lj-car ${cls}`.trim() }, faixa, ant, prox, pontos);
}

/** Um combo = um slide: a arte (toque abre os detalhes) + uma linha com preço e botão. Sem link, bloco vermelho "em breve". */
const slideCombo = (c) => (c.img
  ? h('article', { class: 'lj-slide', 'data-id': c.id },
    h('button', { type: 'button', class: 'lj-slide-arte', 'aria-label': `ver ${c.nome}`, onclick: () => detalhe({ ...c, fotos: [c.img], tag: 'combo' }) }, h('img', { src: c.img, alt: `${c.nome}: ${c.desc}`, loading: 'lazy', width: c.w, height: c.h })),
    h('div', { class: 'lj-slide-cta' }, h('b', { class: 'lj-preco' }, c.precoDe ? [h('s', { class: 'lj-de' }, c.precoDe), ' ', c.preco] : c.preco), botao('Quero', c, 'amarelo')))
  : h('article', { class: 'lj-slide lj-slide-breve', 'data-id': c.id },
    h('div', { class: 'lj-slide-arte vazia' }, h('span', { class: 'lj-selo' }, 'em breve'), h('h3', {}, c.nome), h('ul', {}, ...c.itens.map((x) => h('li', {}, x))), h('img', { src: 'assets/paul/colorido/paul-presente.webp', alt: '', loading: 'lazy', draggable: 'false' })),
    h('div', { class: 'lj-slide-cta' }, h('b', { class: 'lj-preco' }, 'chegando'), botao('Quero', c, 'amarelo'))));

/** Os preferidos da turma (colorir, atividades, memória) + o Uno Musical (jogo do app, não vende): minicartões num carrossel. */
const mini = (p) => h('article', { class: 'lj-mini', 'data-id': p.id },
  h('button', { type: 'button', class: 'lj-mini-capa', 'aria-label': `ver ${p.nome}`, onclick: () => detalhe(p) }, h('img', { src: p.img, alt: p.nome, loading: 'lazy', width: p.w || 640, height: p.h || 800 })),
  h('b', { class: 'lj-mini-nome' }, p.nome), h('span', { class: 'lj-mini-preco' }, p.preco), botao('Quero', p, 'amarelo'));
const unoMini = () => h('article', { class: 'lj-mini lj-uno', 'data-id': 'uno-app' },
  h('a', { class: 'lj-mini-capa', href: '#/jogos/cartas', 'aria-label': 'jogar o Uno Musical no app' }, h('img', { src: 'assets/jogos/icones/cartas.webp', alt: 'Uno Musical', loading: 'lazy', width: 640, height: 640 })),
  h('b', { class: 'lj-mini-nome' }, 'Uno Musical'), h('span', { class: 'lj-mini-preco' }, 'jogo do app'), h('a', { class: 'lj-btn amarelo', href: '#/jogos/cartas' }, 'Jogar', h('b', { 'aria-hidden': 'true' }, '›')));
function amados() {
  const itens = AMADOS.map((id) => PRODUTOS.find((p) => p.id === id)).filter(Boolean);
  return h('section', { class: 'lj-amados', 'aria-labelledby': 'lj-amados-t' },
    h('div', { class: 'lj-amados-top' }, h('i', { 'aria-hidden': 'true' }, '⭐'), h('h2', { id: 'lj-amados-t' }, 'Os preferidos da turma')),
    carrossel([...itens.map(mini), unoMini()], { cls: 'lj-car-mini', label: 'preferidos da turma' }));
}
function combos() {
  const lista = COMBOS.slice().sort((a, b) => Number(!!b.link) - Number(!!a.link)); // os com link primeiro; "em breve" por último
  return h('section', { class: 'lj-combos', 'aria-labelledby': 'lj-combos-t' },
    h('h2', { class: 'lj-combos-t', id: 'lj-combos-t' }, 'Combos', h('small', {}, 'mais barato levando junto')),
    carrossel(lista.map(slideCombo), { cls: 'lj-car-combos', label: 'combos', auto: 6500 }));
}
function secoes() {
  return h('section', { class: 'lj-secs-bloco', 'aria-labelledby': 'lj-secs-t' },
    h('h2', { class: 'lj-combos-t', id: 'lj-secs-t' }, 'Explore por assunto'),
    carrossel(SECOES.map(tile), { cls: 'lj-car-secs', label: 'seções da lojinha' }));
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
  return h('div', { class: 'lj lj-compacta' },
    destaqueAnual(),
    amados(),
    combos(),
    secoes(),
    h('p', { class: 'lj-digital' }, h('b', {}, '📄 materiais digitais. '), AVISO_DIGITAL));
}
