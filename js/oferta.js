// Fonte única da oferta comercial da Beaterista Play (endereço, preços, links, chamadas).
// Só leitura: este módulo NÃO mexe em código de aluno, localStorage, Supabase, aparelhos nem autenticação.
// Pra mudar preço, link ou texto de divulgação dentro do site, é só aqui.
import * as AC from './acesso.js';
import * as CODE from './codigo.js';

export const SITE = 'https://jogos.beaterista.com.br';
export const MARCA = 'Beaterista Play';
export const PASSE_NOME = 'Passe Anual Robôterista';

export const PRECO_PIX = 49.9;
export const PRECO_CARTAO = 79.9;
const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
export const TXT_PIX = brl(PRECO_PIX);
export const TXT_CARTAO = brl(PRECO_CARTAO);
export const TXT_SELO = 'Oferta de lançamento'; // selo do Pix (troque aqui pra mudar em todo o site)

export const URL_PIX = `${SITE}/pix/`;
export const URL_CARTAO = 'https://pay.hotmart.com/Y108629105P';

// A chave do Pix mora em js/oferta-flag.js (sem imports, pra a página de vendas também ler a MESMA chave).
import { PIX_LIBERADO, pixAtivo } from './oferta-flag.js';
export { PIX_LIBERADO, pixAtivo };

export const CHAMADAS = {
  principal: 'Aprenda música jogando.',
  verbos: 'Jogue, toque, aprenda e evolua.',
  ano: `Um ano inteiro de educação musical por ${TXT_PIX} no Pix.`,
  anoSemPix: 'Um ano inteiro de educação musical.',
};
export const BENEFICIOS = ['12 meses de acesso', 'Até 2 aparelhos', 'Código enviado por e-mail assim que o pagamento é confirmado'];

/** Texto de compartilhamento (botões de compartilhar). Só o endereço oficial e a chamada. */
export const textoCompartilhar = (extra = '') => `${CHAMADAS.principal} 🎶 ${extra ? `${extra} ` : ''}${SITE}`.replace(/\s+/g, ' ').trim();

/** Esta pessoa já tem o passe anual (código completo, sem limite de telas) ou um código de professora? Só LÊ o estado; nunca grava nada.
 *  Quem tem código guardado neste aparelho também conta (a conferência com o servidor pode demorar e a propaganda não deve piscar). */
export function jaTemPasse() {
  try { if (AC.comCodigo() && !AC.escopo()) return true; } catch { /* sem acesso */ }
  try { if (CODE.saved()) return true; } catch { /* sem armazenamento */ }
  return false;
}
