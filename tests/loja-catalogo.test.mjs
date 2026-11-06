import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUTOS, PASSE, checkoutDe, precoDe, passeCheckout, brl, ordenados, porSlug } from '../js/loja/catalogo.js';
import { registrarBonus, temBonus, juntarBonus, IDS_PASSE, CARTAS_PASSE } from '../js/figurinhas/passe-cartas.js';
import { mergeStates, emptyState, stats } from '../js/figurinhas/album-logic.js';
import { readFileSync } from 'node:fs';

test('catálogo: ordem inicial e 7 produtos, slugs únicos', () => {
  assert.deepEqual(ordenados().slice(0, 4).map((p) => p.id), ['memoria', 'kids', 'robo', 'violao']);
  assert.equal(PRODUTOS.length, 7); assert.equal(new Set(PRODUTOS.map((p) => p.slug)).size, 7);
  assert.equal(PRODUTOS.filter((p) => p.id.startsWith('robo')).length, 1);
  assert.equal(porSlug('roboterista-ensina').galeria.length, 2);
});
test('só oferta confirmada tem checkout, e só da Hotmart (https)', () => {
  const com = PRODUTOS.filter((p) => checkoutDe(p));
  assert.deepEqual(com.map((p) => p.id), ['curso']);
  assert.equal(checkoutDe(com[0]), 'https://pay.hotmart.com/M76102148V?checkoutMode=10&off=va81350a');
  assert.equal(checkoutDe({ oferta: { estado: 'confirmada', checkout: 'http://pay.hotmart.com/x' } }), null);
  assert.equal(checkoutDe({ oferta: { estado: 'confirmada', checkout: 'https://evil.example/x' } }), null);
  assert.equal(checkoutDe({ oferta: { estado: 'pendente', checkout: 'https://pay.hotmart.com/x' } }), null);
});
test('curso e e-book são produtos separados; e-book não usa o checkout do curso', () => {
  const e = porSlug('bateria-start-ebook'), c = porSlug('bateria-start-curso');
  assert.equal(checkoutDe(e), null); assert.equal(precoDe(e), null); assert.equal(precoDe(c), 'R$ 79,90');
  assert.equal(precoDe(porSlug('beaterista-mood')), null, 'R$ 29,90 é adicional do curso, não preço avulso');
});
test('Passe: R$ 49,90, 12 meses, pagamento único, sem checkout até a oferta existir', () => {
  assert.equal(PASSE.preco, 49.9); assert.equal(PASSE.meses, 12); assert.equal(PASSE.pagamento, 'pagamento único'); assert.equal(passeCheckout(), null); assert.equal(brl(49.9), 'R$ 49,90');
});
test('3 cartas bônus: IDs estáveis, resgate idempotente, não entra na contagem das 125', () => {
  assert.deepEqual(IDS_PASSE, ['P01', 'P02', 'P03']); assert.equal(CARTAS_PASSE.length, 3);
  const a = registrarBonus(emptyState(), 111), b = registrarBonus(a, 999);
  assert.equal(b.passe.em, 111); assert.equal(temBonus(b), true); assert.equal(temBonus(emptyState()), false);
  const cat = JSON.parse(readFileSync(new URL('../assets/figurinhas/catalogo.json', import.meta.url)));
  assert.equal(cat.length, 125); assert.equal(cat.filter((c) => /^P0/.test(c.codigo)).length, 0);
  assert.equal(stats(b, cat).total, 125);
  const m = mergeStates(emptyState(), b); assert.equal(temBonus(m), true);
  assert.equal(mergeStates(m, registrarBonus(emptyState(), 50)).passe.em, 50, 'junta aparelhos sem duplicar');
  assert.equal(juntarBonus(emptyState(), emptyState()), null);
});
test('interruptores: publicação e compra do Passe vêm desligados', async () => {
  const f = await import('../js/loja/flags.js'); assert.equal(f.LOJA_PUBLICA, false); assert.equal(f.PASSE_COMPRA_ATIVA, false);
});
