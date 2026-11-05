import test from 'node:test';
import assert from 'node:assert/strict';
import { ART2, ART2_IDS } from '../js/jogos/bingo-art2.js';

const IDS = ['piano', 'cajon', 'tamborim', 'agogô', 'ukulele',
  'tom1', 'tom2', 'pedal_bumbo', 'pedal_chimbal', 'banco', 'maquina_chimbal', 'estante_prato', 'pele', 'aro',
  'semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia', 'pausa_semibreve', 'pausa_minima', 'pausa_seminima', 'pausa_colcheia', 'pausa_semicolcheia',
  'duas_colcheias', 'quatro_semicolcheias', 'minima_pontuada', 'seminima_pontuada', 'colcheia_pontuada', 'duas_semicolcheias',
  'clave_sol', 'clave_fa', 'sustenido', 'bemol', 'bequadro', 'fermata', 'ponto_aumento', 'ligadura_prolongamento', 'staccato', 'acento',
  'crescendo', 'decrescendo', 'barra_dupla', 'ritornello', 'compasso_3_4', 'compasso_4_4'];

function balanced(s) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;
  let m;
  while ((m = re.exec(s))) {
    const [, close, name, self] = m;
    if (self) continue;
    if (close) { if (stack.pop() !== name) return false; } else stack.push(name);
  }
  return stack.length === 0;
}

test('todos os 46 ids existem', () => {
  assert.equal(IDS.length, 46);
  for (const id of IDS) assert.ok(id in ART2, `falta ${id}`);
  assert.deepEqual([...ART2_IDS].sort(), [...IDS].sort());
});

test('markup válido, balanceado e sem <svg> externo', () => {
  for (const id of IDS) {
    const s = ART2[id];
    assert.equal(typeof s, 'string');
    assert.ok(s.length > 20, id);
    assert.ok(balanced(s), `tags desbalanceadas em ${id}`);
    assert.ok(!/<svg|<script|<image|href=/i.test(s), `elemento proibido em ${id}`);
    assert.ok(!/NaN|undefined/.test(s), `valor inválido em ${id}`);
  }
});

test('nenhum texto além dos numerais 3 e 4', () => {
  for (const id of IDS) {
    const texts = [...ART2[id].matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].trim());
    for (const t of texts) assert.match(t, /^[34]$/, `texto em ${id}: ${t}`);
    if (!id.startsWith('compasso_')) assert.equal(texts.length, 0, id);
  }
});
