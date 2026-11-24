// Preço do passe anual (12 meses). Valem os preços da oferta oficial (js/oferta.js): R$ 49,90 no Pix (pagamento único) e R$ 79,90 no cartão (Hotmart).
// A oferta de Black Friday por data saiu; `atual` segue sendo o valor do Pix (usado no texto do painel de códigos, que registra vendas pagas no Pix).
import { TXT_PIX, TXT_CARTAO } from './oferta.js';
export const PASSE_NORMAL = 79.9; export const PASSE_OFERTA = 49.9;
/** { oferta, atual, de, ate, cartao } (sem data de fim). */
export function precoPasse() { return { oferta: false, atual: TXT_PIX, de: '', ate: '', cartao: TXT_CARTAO }; }
