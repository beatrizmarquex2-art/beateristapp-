// O vocabulário de banda/estúdio/jeito de falar (js/glossary-palco.js) entra no Dicionário do app sem quebrar nada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMS, CATS, byId } from '../js/glossary.js';
import { GRUPOS_PALCO } from '../js/glossary-palco.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
test('75 termos novos em 3 grupos de 25, com as categorias no dicionário', () => {
  assert.equal(GRUPOS_PALCO.length, 3);
  for (const g of GRUPOS_PALCO) { assert.equal(g.t.length, 25); assert.ok(CATS.some((c) => c[0] === g.id), g.id); }
  assert.equal(TERMS.filter((x) => GRUPOS_PALCO.some((g) => g.id === x.cat)).length, 75);
});
test('ids únicos e todo termo novo tem explicação, exemplo de uso e ícone', () => {
  const ids = TERMS.map((x) => x.id); assert.equal(new Set(ids).size, ids.length, 'id repetido');
  for (const g of GRUPOS_PALCO) for (const [t, en, d, uso, ic] of g.t) { assert.ok(t && en && d && uso && ic, t); assert.ok(byId(norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')), t); }
});
test('a explicação não entrega o nome do termo (o jogo Dicas usa a explicação como pista)', () => {
  for (const x of TERMS.filter((y) => y.uso)) assert.ok(!norm(x.d).includes(norm(x.t)), `${x.t}: ${x.d}`);
});
