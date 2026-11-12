import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarCodigoPasse, daquiA12Meses, linhaPasse, mensagemPasse, linkWhatsapp } from '../js/passe-anual.js';

test('código: P + 9 do alfabeto sem confusão, e cabe na regra do banco (4 a 12 letras/números)', () => {
  const set = new Set(); for (let i = 0; i < 2000; i++) { const c = gerarCodigoPasse(); assert.match(c, /^P[A-HJ-NP-Z2-9]{9}$/); set.add(c); }
  assert.equal(set.size, 2000);
});
test('12 meses a partir de hoje (29/02 não pula pra março)', () => {
  assert.equal(daquiA12Meses(new Date('2026-11-12T09:00:00Z')).toISOString(), '2027-11-12T09:00:00.000Z');
  assert.equal(daquiA12Meses(new Date('2028-02-29T12:00:00Z')).toISOString(), '2029-02-28T12:00:00.000Z');
});
test('linha do banco: passe, 2 aparelhos, 12 meses, sem a coluna jogos', () => {
  const l = linhaPasse('Maria Souza', 'PABC234XYZ', new Date('2027-11-12T09:00:00Z'));
  assert.deepEqual(l, { code: 'PABC234XYZ', nome: 'Passe Maria Souza', tipo: 'passe', dias: 365, max_aparelhos: 2, expira_em: '2027-11-12T09:00:00.000Z', ativo: true });
  assert.ok(!('jogos' in l)); assert.ok(linhaPasse('x'.repeat(200), 'PABC234XYZ', new Date()).nome.length <= 60);
});
test('mensagem pronta com código, validade e instruções; link do WhatsApp', () => {
  const m = mensagemPasse({ nome: 'Maria Souza', code: 'PABC234XYZ', expira: new Date('2027-11-12T15:00:00Z') });
  assert.ok(m.includes('oi, Maria!') && m.includes('PABC234XYZ') && m.includes('12/11/2027') && m.includes('jogos.beaterista.com.br') && m.includes('2 aparelhos'));
  assert.ok(linkWhatsapp('(18) 99180-4150', m).startsWith('https://wa.me/5518991804150?text=oi%2C%20Maria'));
  assert.ok(linkWhatsapp('5518991804150', 'a').startsWith('https://wa.me/5518991804150')); assert.equal(linkWhatsapp('123', 'a'), null); assert.equal(linkWhatsapp('', 'a'), null);
});
