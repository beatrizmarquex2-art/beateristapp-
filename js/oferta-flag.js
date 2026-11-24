// CHAVE ÚNICA de publicação do Pix. Sem imports de propósito: o app, a Lojinha, a entrada e a página de vendas leem a mesma chave.
/** CHAVE DE PUBLICAÇÃO DO PIX. O checkout Pix está em homologação: enquanto isto for `false`, NENHUMA chamada de compra do Pix aparece em lugar nenhum do site.
 *  Só vira `true` depois que a integração for validada e a Bea autorizar. */
export const PIX_LIBERADO = false;
/** Prévia privada pra Bea testar o fluxo antes de liberar: abrir o app com `?pix-preview` no endereço (nada é gravado; só vale naquela abertura). */
const previa = () => { try { return typeof location !== 'undefined' && /[?&]pix-preview(?:[=&#]|$)/.test(location.search); } catch { return false; } };
/** O Pix está à venda neste momento? (chave geral ou prévia privada). Todas as chamadas de compra do passe usam isto: ligam e desligam juntas. */
export const pixAtivo = () => PIX_LIBERADO || previa();
