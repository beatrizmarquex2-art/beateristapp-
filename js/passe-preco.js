// Preço do passe anual (12 meses, no pix): R$ 49,90 até 31/dez/2026 (fim do dia, horário de Brasília); a partir de 01/01/2027, R$ 99,90 (igual à função mercadopago-passe).
// A mesma oferta tem 2 nomes: Black Friday até 15/dez e, do dia 16 em diante, Natal até 31/dez (com a arte do Paul Noel). O preço não muda.
export const PASSE_NORMAL = 99.9; export const PASSE_OFERTA = 49.9; export const OFERTA_ATE = new Date('2026-12-31T23:59:59-03:00'); export const BF_ATE = new Date('2026-12-15T23:59:59-03:00');
const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;
/** { oferta, atual, de, ate } no momento `agora`. */
export function precoPasse(agora = new Date()) {
  const oferta = agora.getTime() <= OFERTA_ATE.getTime(); const bf = agora.getTime() <= BF_ATE.getTime();
  return { oferta, atual: brl(oferta ? PASSE_OFERTA : PASSE_NORMAL), de: oferta ? brl(PASSE_NORMAL) : '', bf, nome: bf ? 'Black Friday' : 'de Natal', ate: bf ? '15 de dezembro' : '31 de dezembro' };
}
