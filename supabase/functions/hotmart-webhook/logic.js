// Lógica pura do webhook da Hotmart (testada em Node; a função Deno só liga isto ao HTTP).
// Os caminhos do JSON seguem o formato 2.0.0 conhecido (data.buyer.email, data.purchase.transaction, data.purchase.offer.code, data.product.id).
// PENDENTE: conferir contra a página oficial (developers.hotmart.com não abriu neste ambiente). O SQL só aceita a oferta e o produto cadastrados em passe_config.
export function igual(a, b) { // comparação em tempo constante
  a = String(a || ''); b = String(b || ''); let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
/** Confere o hottok (cabeçalho X-Hotmart-Hottok). Segredo vazio = recusa tudo (nunca aceita "sem segredo"). */
export const autorizado = (headers, segredo) => !!segredo && String(segredo).length >= 8 && igual(headers.get ? headers.get('x-hotmart-hottok') : headers['x-hotmart-hottok'], segredo);
/** Valida o formato mínimo antes de ir pro banco. Devolve { ok, motivo }. */
export function formatoOk(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, motivo: 'json' };
  if (typeof p.event !== 'string' || p.event.length > 60) return { ok: false, motivo: 'evento' };
  if (JSON.stringify(p).length > 100000) return { ok: false, motivo: 'tamanho' };
  return { ok: true };
}
/** Resposta HTTP para cada resultado do banco: 200 sempre que o evento foi tratado (a Hotmart não precisa reenviar). */
export const statusDe = (res) => (res && res.ok ? 200 : 500);
