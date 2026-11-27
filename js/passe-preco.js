// Preço do passe anual (12 meses, no pix). Promoção de Natal da Bea: R$ 49,90 até 31/dez/2026 (fim do dia, horário de Brasília); a partir de 01/01/2027, R$ 99,90 (igual à função mercadopago-passe).
export const PASSE_NORMAL = 99.9; export const PASSE_OFERTA = 49.9; export const OFERTA_ATE = new Date('2026-12-31T23:59:59-03:00');
const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
/** { oferta, atual, de, ate } no momento `agora`. */
export function precoPasse(agora = new Date()) {
  const oferta = agora.getTime() <= OFERTA_ATE.getTime();
  return { oferta, atual: brl(oferta ? PASSE_OFERTA : PASSE_NORMAL), de: oferta ? brl(PASSE_NORMAL) : '', ate: '31 de dezembro' };
}
