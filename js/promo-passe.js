// Cartão de divulgação do Passe Anual Robôterista (Beaterista Play). Um só componente pra todas as telas (início, jogos, perfil, lojinha, entrada).
// Regras: some pra quem já tem o passe (e some na hora se o código for confirmado depois); sem pop-up, sem faixa fixa, sem animação que prende;
// o botão do Pix só existe com PIX_LIBERADO (js/oferta.js). Não grava nada em lugar nenhum.
import { h } from './util.js';
import { MARCA, PASSE_NOME, TXT_PIX, TXT_CARTAO, URL_CARTAO, URL_PIX, PIX_LIBERADO, CHAMADAS, BENEFICIOS, jaTemPasse } from './oferta.js';

const ABRE = { target: '_blank', rel: 'noopener noreferrer' };

/** `onde`: 'inicio' | 'jogos' | 'perfil' | 'lojinha' (só muda a classe, pro CSS). `compacto`: versão de uma linha de título + botões. Devolve o elemento, ou null se a pessoa já tem o passe. */
export function cartaoPasse({ onde = 'inicio', compacto = false } = {}) {
  if (typeof document === 'undefined' || !document.body.classList.contains('aluno')) return null; // só na área dos alunos (aluno.html); o app da Bea não leva propaganda
  if (jaTemPasse()) return null;
  const preco = PIX_LIBERADO
    ? h('p', { class: 'pp-preco' }, h('b', {}, TXT_PIX), ' no Pix, pagamento único', h('small', {}, `ou ${TXT_CARTAO} no cartão`))
    : h('p', { class: 'pp-preco' }, h('b', {}, TXT_CARTAO), ' no cartão', h('small', {}, 'Pix em breve'));
  const botoes = h('div', { class: 'pp-btns' },
    PIX_LIBERADO ? h('a', { class: 'pp-btn pp-pix', href: URL_PIX, ...ABRE, 'data-compra': 'pix' }, `Quero no Pix · ${TXT_PIX}`) : null,
    h('a', { class: `pp-btn ${PIX_LIBERADO ? 'pp-alt' : 'pp-pix'}`, href: URL_CARTAO, ...ABRE, 'data-compra': 'cartao' }, PIX_LIBERADO ? `Cartão · ${TXT_CARTAO}` : `Quero meu passe · ${TXT_CARTAO}`));
  const el = h('section', { class: `pp pp-${onde}${compacto ? ' pp-c' : ''}`, 'aria-label': `${PASSE_NOME}, ${MARCA}`, 'data-onde': onde },
    h('img', { class: 'pp-paul', src: 'assets/paul/animacoes/web/paul-presente.webp', alt: '', width: 84, height: 84, loading: 'lazy', decoding: 'async', draggable: 'false' }),
    h('div', { class: 'pp-txt' },
      h('small', { class: 'pp-tag' }, `${MARCA} · ${PASSE_NOME}`),
      h('h3', {}, CHAMADAS.principal),
      compacto ? null : h('p', { class: 'pp-sub' }, `${CHAMADAS.verbos} ${PIX_LIBERADO ? CHAMADAS.ano : CHAMADAS.anoSemPix}`),
      preco,
      compacto ? null : h('ul', { class: 'pp-lista' }, ...BENEFICIOS.map((b) => h('li', {}, b))),
      botoes));
  // se o código for confirmado depois (a conferência com o servidor demora), a propaganda sai sozinha
  const confere = () => { if (!el.isConnected) { if (el.__viu) document.removeEventListener('aluno-acesso', confere); return; } el.__viu = true; if (jaTemPasse()) { el.remove(); document.removeEventListener('aluno-acesso', confere); } };
  document.addEventListener('aluno-acesso', confere);
  return el;
}
