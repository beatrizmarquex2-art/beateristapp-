// Bingo musical: pacote para imprimir (A4, colorido ou preto e branco): manual, 24 cartelas numeradas, fichas de sorteio e marcadores.
// Usa a impressão do navegador (no celular: "salvar como PDF"). Não altera fotos nem metadados de nada.
import { h } from '../util.js';
import * as B from './bingo-logic.js';
import { imgHtml } from './bingo-img.js';

const nm = (tema, id) => B.nameOf(tema, id);
const AGE = '6 anos ou mais · 1 a 24 jogadores · 15 a 25 minutos (valide com a sua turma)';

function cell(tema, id, salt) { const d = h('div', { class: 'bp-cell' }); d.innerHTML = `<span class="bp-img">${imgHtml(tema, id, salt)}</span>`; d.append(h('b', {}, nm(tema, id))); return d; }
function card(tema, c, salt, n) {
  return h('div', { class: 'bp-card' }, h('div', { class: 'bp-ch' }, h('b', {}, `Cartela ${n}`), h('small', {}, `${c.id} · ${B.THEME_NAME[tema]}`)), h('div', { class: 'bp-grid' }, ...c.grid.map((id) => cell(tema, id, salt))));
}
const page = (...kids) => h('section', { class: 'bp-page' }, ...kids);

/** Monta o pacote na página e abre a janela de impressão. */
export function printPack(tema, { color = true, vitoria = 'qualquer', recent = [] } = {}) {
  const salt = `print-${tema}`; const { pool, cards } = B.printCards(tema, Math.random, recent);
  const vit = (B.VICTORIES.find((x) => x[0] === vitoria) || B.VICTORIES[0])[1];
  const root = h('div', { class: `bg-print${color ? '' : ' bw'}`, 'aria-hidden': 'true' });
  // manual
  root.append(page(h('h1', {}, `Bingo Musical Beaterista — ${B.THEME_NAME[tema]}`), h('p', { class: 'bp-sub' }, AGE),
    h('h2', {}, 'Como jogar'), h('ol', {}, h('li', {}, 'Cada jogador pega uma cartela (são 24 diferentes, numeradas).'), h('li', {}, 'O professor sorteia uma ficha por vez, mostra a imagem e diz o nome.'), h('li', {}, 'Quem tiver o item na cartela cobre a casa com um marcador.'),
      h('li', {}, `Vence quem completar três casas em linha — condição desta rodada: ${vit}.`), h('li', {}, 'Confira sempre se os itens marcados realmente saíram antes de declarar o bingo.')),
    h('h2', {}, 'Para o professor'), h('ul', {}, h('li', {}, `Sorteie sem repetir os ${pool.length} itens deste tema; todas as cartelas só usam esses itens.`), h('li', {}, 'Defina a condição de vitória ANTES de começar e não a mude no meio da rodada.'), h('li', {}, 'As cartelas de papel não ficam conectadas ao app. Para sortear na tela, use “Sala de aula” no Bingo do app.'),
      tema === 'artistas' ? h('li', {}, 'As fotos são do catálogo da escola e servem só para uso em sala de aula; para distribuir publicamente, confirme licenças de imagem.') : null),
    h('p', { class: 'bp-sub' }, 'Cada cartela tem 9 itens diferentes (sem casa livre). Imprima em 100% (sem “ajustar à página”).')));
  // 24 cartelas, 6 por folha
  for (let i = 0; i < cards.length; i += 6) root.append(page(h('div', { class: 'bp-cards' }, ...cards.slice(i, i + 6).map((c, k) => card(tema, c, salt, i + k + 1)))));
  // fichas de sorteio
  const fichas = h('div', { class: 'bp-fichas' }, ...pool.map((id) => { const f = cell(tema, id, salt); f.classList.add('bp-ficha'); return f; }));
  root.append(page(h('h2', {}, 'Fichas de sorteio (recorte)'), fichas));
  // marcadores
  root.append(page(h('h2', {}, 'Marcadores recortáveis'), h('div', { class: 'bp-marks' }, ...Array.from({ length: 54 }, () => h('i', {})))));
  document.body.append(root); document.body.classList.add('bg-printing');
  const done = () => { document.body.classList.remove('bg-printing'); root.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => { try { window.print(); } catch { done(); } }, 150);
  setTimeout(() => { if (document.body.classList.contains('bg-printing') && !matchMedia('print').matches) done(); }, 60000); // segurança: se o navegador não avisar o fim da impressão
  return root;
}
