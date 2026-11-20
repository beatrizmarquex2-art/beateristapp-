// Uno Musical: o baralho inteiro pra IMPRIMIR e recortar (A4, 9 cartas por folha, 60 × 87 mm), colorido ou preto e branco, com manual e legenda das figuras.
// Usa as mesmas cartas do jogo (cardEl/backEl), então a figura, a cor e o nome são idênticos. Impressão do navegador (no celular: "salvar como PDF"); nada sobe pra servidor.
import { h } from '../util.js';
import * as C from './cartas-logic.js';
import { cardEl, backEl } from './cartas.js';
import { SYMS, SYM_NAME, SYM_LEARN, symbolEl } from './cartas-simbolos.js';

const COR = { vermelho: 'vermelho', amarelo: 'amarelo', azul: 'azul', verde: 'verde' };
const SITE = 'jogos.beaterista.com.br'; const LOGO = 'assets/paul/colorido/paul-logo.webp'; // Robôterista Paul (marca) e o endereço do jogo, que vão nas cartas
const page = (...kids) => h('section', { class: 'cxp-page' }, ...kids);

/** As 128 cartas na ordem de impressão: por cor (figuras, depois pular/inverter/+2) e por fim os curingas. */
export function ordemDoBaralho() {
  const deck = C.makeDeck(); const por = (c) => `${c.color ? C.COLORS.indexOf(c.color) : 9}|${c.kind === 'fig' ? String(SYMS.indexOf(c.sym)).padStart(2, '0') : `9${C.ACTIONS.indexOf(c.kind)}${c.kind}`}`;
  return deck.slice().sort((a, b) => (por(a) < por(b) ? -1 : por(a) > por(b) ? 1 : 0));
}
const celula = (c) => { const el = cardEl(c); if (c.color) el.append(h('b', { class: 'cxp-cor' }, COR[c.color])); el.append(h('small', { class: 'cxp-site' }, SITE)); return h('div', { class: 'cxp-cell' }, el); }; // o nome da cor também em texto (ajuda no preto e branco e em quem não distingue as cores)
/** Verso com a marca: o Robôterista Paul no meio e o endereço do jogo embaixo. */
const LOGO_PB = 'assets/uno/paul-logo-colorir.png'; // o mesmo desenho em contorno, pra pintar
const celulaVerso = (pintar = false) => { const v = backEl(); v.classList.add('cxp-verso'); if (pintar) v.classList.add('cxp-v-pintar'); v.replaceChildren(h('b', { class: 'cxp-v-top' }, 'uno musical'), h('span', { class: 'cx-oval' }, h('img', { class: 'cxp-v-logo', src: pintar ? LOGO_PB : LOGO, alt: '' })), h('b', { class: 'cxp-v-site' }, SITE)); return h('div', { class: 'cxp-cell' }, v); };

/** Monta o material (manual, legenda e cartas) sem imprimir. `versos`: depois de cada folha de frente vem uma de versos (impressão frente e verso). */
export function montarBaralho({ color = true, versos = false } = {}) {
  const root = h('div', { class: `cx cx-print cx-names cxp${color ? '' : ' bw pintar'}`, 'aria-hidden': 'true' });
  const cartas = ordemDoBaralho();
  root.append(page(h('img', { class: 'cxp-logo', src: LOGO, alt: 'Robôterista Paul' }), h('h1', {}, 'Uno Musical Beaterista'), h('p', { class: 'cxp-sub' }, 'baralho para imprimir e recortar · 2 a 4 jogadores · a partir de 6 anos (valide com a sua turma)'),
    h('h2', {}, `O que tem aqui (${cartas.length} cartas)`),
    h('ul', {}, h('li', {}, '4 cores (vermelho, amarelo, azul e verde), cada uma com as 12 figuras da música em 2 cartas cada: semínima, colcheia, semicolcheia, fusa, as 4 pausas, acento, clave de sol, clave de fá e ritornelo.'),
      h('li', {}, 'Em cada cor: 2 cartas de pular, 2 de inverter e 2 de +2.'), h('li', {}, '4 curingas (mudam a cor) e 4 curingas +4.')),
    h('h2', {}, 'Como jogar'),
    h('ol', {}, h('li', {}, 'Cada um começa com 7 cartas. Vira-se uma carta na mesa e o resto fica de monte.'), h('li', {}, 'Na sua vez, jogue uma carta da mesma cor ou da mesma figura da carta da mesa.'),
      h('li', {}, 'Tem carta que serve? Tem que jogar. Não tem? Compre uma: se servir, jogue ou passe; se não servir, passa a vez.'),
      h('li', {}, 'Pular: o próximo perde a vez. Inverter: muda o sentido (com 2 jogadores vale como pular). +2: o próximo compra 2 e perde a vez.'),
      h('li', {}, 'Curinga muda a cor. Curinga +4: muda a cor e o próximo compra 4 e perde a vez, mas só vale se você não tiver a cor da mesa.'),
      h('li', {}, 'Ficou com uma carta? Fale UNO! Quem esquecer e for pego compra 2 cartas. Ganha quem ficar sem cartas primeiro.')),
    h('h2', {}, 'Para imprimir'),
    h('ul', {}, h('li', {}, 'Papel A4, imprimindo em 100% (sem "ajustar à página"). As cartas medem 60 × 87 mm e saem 9 por folha.'),
      h('li', {}, 'Para durar mais: papel mais grosso (180 g ou mais) ou plastifique antes de recortar.'), h('li', {}, 'Com versos: imprima frente e verso, virando pela borda comprida; todos os versos são iguais.'),
      h('li', {}, 'Recorte pelas linhas pontilhadas.'), color ? null : h('li', {}, 'Versão para pintar: as cartas saem brancas, com o nome da cor escrito em cima. Pinte cada carta com a cor do nome (lápis de cor ou canetinha). Tem uma carta bônus com o Paul para colorir do jeito que quiser e, na última folha, 9 versos com o Robôterista Paul para pintar, recortar e colar atrás das cartas.')),
    h('p', { class: 'cxp-site-pg' }, `Jogue online, de graça: ${SITE}`)));
  // legenda das figuras (pra quem ensina)
  root.append(page(h('h1', {}, 'As figuras do baralho'), h('p', { class: 'cxp-sub' }, 'o que cada figura quer dizer (pra conversar com a turma durante o jogo)'),
    h('div', { class: 'cxp-leg' }, ...SYMS.map((id) => h('div', { class: 'cxp-leg-it' }, h('span', { class: 'cxp-leg-ic' }, symbolEl(id, 'cxp-leg-svg')), h('div', {}, h('b', {}, SYM_NAME[id]), h('p', {}, SYM_LEARN[id])))))));
  const bonus = color ? null : h('div', { class: 'cxp-cell' }, h('span', { class: 'cx-card cxp-paul-card', 'aria-hidden': 'true' }, h('b', { class: 'cxp-v-top' }, 'pinte o paul!'), h('span', { class: 'cx-oval' }, h('img', { class: 'cxp-paul-img', src: 'assets/uno/paul-colorir.png', alt: '' })), h('small', { class: 'cxp-site' }, SITE)));
  const grupos = []; for (let i = 0; i < cartas.length; i += 9) grupos.push(cartas.slice(i, i + 9));
  if (bonus) { const ult = grupos[grupos.length - 1]; if (ult.length < 9) ult.push('bonus'); else grupos.push(['bonus']); }
  for (const lote of grupos) {
    root.append(page(h('div', { class: 'cxp-grid' }, ...lote.map((c) => (c === 'bonus' ? bonus : celula(c))))));
    if (versos) root.append(page(h('div', { class: 'cxp-grid' }, ...lote.map(() => celulaVerso()))));
  }
  if (!color) root.append(page(h('div', { class: 'cxp-grid' }, ...Array.from({ length: 9 }, () => celulaVerso(true))))); // folha de VERSOS pra pintar e recortar (todos iguais)
  return root;
}

/** Monta e abre a janela de impressão. */
/** Espera as imagens do material carregarem (o logo), pra não sair em branco. */
export const esperaImagens = (root) => Promise.all([...root.querySelectorAll('img')].map((i) => (i.complete ? Promise.resolve() : new Promise((ok) => { i.onload = i.onerror = ok; }))));
export function imprimirBaralho(opts = {}) {
  if (document.documentElement.classList.contains('aluno-on')) return null; // o baralho pra imprimir é produto da Bea: não sai pelo app dos alunos
  const root = montarBaralho(opts);
  document.body.append(root); document.body.classList.add('cxp-printing'); esperaImagens(root);
  const done = () => { document.body.classList.remove('cxp-printing'); root.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  esperaImagens(root).then(() => setTimeout(() => { try { window.print(); } catch { done(); } }, 150));
  setTimeout(() => { if (document.body.classList.contains('cxp-printing') && !matchMedia('print').matches) done(); }, 60000);
  return root;
}
