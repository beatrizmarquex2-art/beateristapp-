// Janela "como você quer pagar?" do Passe Anual Robôterista: PIX em destaque (R$ 49,90) e cartão (R$ 79,90, Hotmart) sempre visível.
// Só abre quando o Pix está à venda (pixAtivo, em js/oferta.js). Enquanto isso as chamadas de compra seguem o caminho de antes (cartão/Lojinha).
// Não grava nada em lugar nenhum e não toca em código, aparelho nem autenticação.
import { h } from './util.js';
import { MARCA, PASSE_NOME, TXT_PIX, TXT_CARTAO, TXT_SELO, URL_PIX, URL_CARTAO, pixAtivo } from './oferta.js';

/** Abre a janela de escolha. `origem` só identifica a tela (data-origem), pra conferir qual botão chamou. */
export function abrirEscolha(origem = 'site') {
  document.querySelectorAll('dialog.ep-dlg').forEach((d) => d.remove());
  const dlg = h('dialog', { class: 'ep-dlg', 'aria-labelledby': 'ep-t', 'data-origem': origem },
    h('div', { class: 'ep-topo' },
      h('div', {}, h('img', { class: 'ep-logo', src: 'assets/logo-beaterista-play.webp', alt: MARCA, width: 120, height: 40, draggable: 'false' }), h('small', {}, PASSE_NOME), h('h2', { id: 'ep-t' }, 'como você quer pagar?')),
      h('button', { type: 'button', class: 'ep-x', 'aria-label': 'fechar', onclick: () => dlg.close() }, '✕')),
    h('a', { class: 'ep-op ep-pix', href: URL_PIX, 'data-compra': 'pix', 'data-origem': origem },
      h('span', { class: 'ep-selo' }, 'melhor preço'),
      h('b', { class: 'ep-nome' }, 'Pix'),
      h('span', { class: 'ep-preco' }, TXT_PIX),
      h('span', { class: 'ep-eco' }, TXT_SELO),
      h('span', { class: 'ep-det' }, 'Pagamento único · o código chega no seu e-mail assim que o Pix é confirmado'),
      h('span', { class: 'ep-btn' }, 'Comprar com Pix')),
    h('a', { class: 'ep-op ep-cartao', href: URL_CARTAO, target: '_blank', rel: 'noopener noreferrer', 'data-compra': 'cartao', 'data-origem': origem },
      h('b', { class: 'ep-nome' }, 'Cartão de crédito'),
      h('span', { class: 'ep-preco' }, TXT_CARTAO),
      h('span', { class: 'ep-det' }, 'Pagamento pela Hotmart'),
      h('span', { class: 'ep-btn' }, 'Comprar com cartão')),
    h('p', { class: 'ep-rod' }, '12 meses de acesso · até 2 aparelhos · código enviado por e-mail após a confirmação do pagamento'));
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg);
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  return dlg;
}

/** Liga um botão/link de compra do passe: com o Pix ativo abre a janela de escolha; senão segue o caminho original do elemento (href). */
export function ligarCompra(el, origem) {
  if (!el) return el;
  el.dataset.origem = origem;
  el.addEventListener('click', (e) => { if (pixAtivo()) { e.preventDefault(); abrirEscolha(origem); } });
  return el;
}
