import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarCodigo, codigoDoLink, salaEntrar, salvarSessao, lerSessao, limparSessao } from '../js/jogos/bingo-online.js';

test('código: maiúsculas, sem letras ambíguas, máximo 6', () => {
  assert.equal(normalizarCodigo('ab c-d2 e3f4g5'), 'ABCD2E');
  assert.equal(normalizarCodigo('0O1IL'), '');
});
test('link de convite devolve o código ou vazio', () => {
  assert.equal(codigoDoLink('https://x.com/#/jogos/bingo?sala=abcd23'), 'ABCD23');
  assert.equal(codigoDoLink('https://x.com/#/jogos/bingo'), '');
});
test('entrar com código curto dá mensagem humana em minúsculas, sem ir à rede', async () => {
  await assert.rejects(() => salaEntrar({ code: 'AB', nome: 'Ana' }), (e) => e.codigo === 'sala' && e.message === 'o código tem 6 letras ou números');
});
test('sessão guardada para "voltar pra sala"', () => {
  const mem = {}; globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  assert.equal(lerSessao(), null);
  salvarSessao({ code: 'ABCD23', token: 't', slot: 1 });
  assert.deepEqual(lerSessao(), { code: 'ABCD23', token: 't', slot: 1 });
  limparSessao(); assert.equal(lerSessao(), null);
  delete globalThis.localStorage;
});
