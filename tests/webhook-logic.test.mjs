import test from 'node:test';
import assert from 'node:assert/strict';
import { autorizado, formatoOk, igual } from '../supabase/functions/hotmart-webhook/logic.js';

test('hottok: só aceita o segredo exato; segredo vazio ou curto recusa tudo', () => {
  const h = (v) => new Headers(v == null ? {} : { 'X-Hotmart-Hottok': v });
  assert.equal(autorizado(h('segredo-longo-123'), 'segredo-longo-123'), true);
  assert.equal(autorizado(h('errado'), 'segredo-longo-123'), false);
  assert.equal(autorizado(h(null), 'segredo-longo-123'), false);
  assert.equal(autorizado(h(''), ''), false);
  assert.equal(autorizado(h('abc'), 'abc'), false);
  assert.equal(autorizado(h('x'), undefined), false);
  assert.equal(igual('a', 'ab'), false);
});
test('formato mínimo do payload', () => {
  assert.equal(formatoOk(null).ok, false);
  assert.equal(formatoOk([]).ok, false);
  assert.equal(formatoOk({}).ok, false);
  assert.equal(formatoOk({ event: 'PURCHASE_APPROVED' }).ok, true);
  assert.equal(formatoOk({ event: 'x'.repeat(100) }).ok, false);
});
