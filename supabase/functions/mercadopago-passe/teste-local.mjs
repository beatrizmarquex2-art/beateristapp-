// Teste local (sem Supabase/Mercado Pago/Resend de verdade): node --experimental-strip-types --no-warnings teste-local.mjs
// Ele troca o createClient real pelo fake-sb.mjs numa copia (fn.ts) e roda o fluxo todo.
import fs from 'node:fs';
fs.writeFileSync(new URL('./fn.ts', import.meta.url), fs.readFileSync(new URL('./index.ts', import.meta.url), 'utf8').replace('import { createClient } from "npm:@supabase/supabase-js@2.57.0";', 'import { createClient } from "./fake-sb.mjs";'));
import assert from 'node:assert/strict';
const env = { MP_ACCESS_TOKEN: 'APP_USR-123-abc', HOTMART_EMAIL_FROM: 'Beaterista <oi@teste.com>', RESEND_API_KEY: 're_abc', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', MP_WEBHOOK_SECRET: 'seg' };
let handler; globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
const resend = []; let mpStatus = 'pending'; let valorMP = 49.9;
globalThis.fetch = async (url, o = {}) => {
  if (url.includes('api.resend.com')) { resend.push({ h: o.headers, b: JSON.parse(o.body) }); return new Response('{}', { status: 200 }); }
  if (url.includes('api.mercadopago.com/v1/payments') && o.method === 'POST') { const p = JSON.parse(o.body); valorMP = p.transaction_amount; return new Response(JSON.stringify({ id: 99887766, payment_method_id: 'pix', status: 'pending', external_reference: p.external_reference, point_of_interaction: { transaction_data: { qr_code: '00020126PIXCOPIAECOLA', qr_code_base64: 'QUJD', ticket_url: 'https://mp/ticket' } } }), { status: 201 }); }
  if (url.includes('api.mercadopago.com/v1/payments/')) { const ped = (await import('./fake-sb.mjs')).tabela[0]; return new Response(JSON.stringify({ id: 99887766, status: mpStatus, currency_id: 'BRL', transaction_amount: valorMP, payment_method_id: 'pix', live_mode: true, external_reference: ped.pedido, payer: { email: ped.comprador_email }, date_approved: '2026-11-27T10:00:00Z', point_of_interaction: { transaction_data: { qr_code: '00020126PIXCOPIAECOLA' } } }), { status: 200 }); }
  throw Error('fetch inesperado ' + url);
};
await import('./fn.ts');
const call = (acao, body, origin = 'https://jogos.beaterista.com.br') => handler(new Request('https://x.supabase.co/functions/v1/mercadopago-passe?acao=' + acao, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }));
const J = async (r) => ({ s: r.status, ...(await r.json()) });
// 1) dados invalidos
assert.equal((await J(await call('criar', { nome: 'x', email: 'ruim', cpf: '1' }))).s, 422);
// 2) criar: gera Pix e manda o e-mail com copia e cola + link
const c = await J(await call('criar', { nome: 'Maria Souza', email: 'Maria@Teste.com', cpf: '52998224725' }));
assert.equal(c.s, 200); assert.equal(c.qr_code, '00020126PIXCOPIAECOLA');
assert.equal(resend.length, 1); const e1 = resend[0];
assert.deepEqual(e1.b.to, ['maria@teste.com']); assert.match(e1.b.html, /PIXCOPIAECOLA/); assert.match(e1.b.html, new RegExp('/pix/\\?pedido=' + c.pedido)); assert.match(e1.b.html, /R\$ 49,90/); assert.match(e1.b.html, /\d\d:\d\d/);
assert.equal(e1.h['Idempotency-Key'], 'mp-pix-gerado-' + c.pedido);
// 3) segundo Pix do mesmo e-mail na hora: NAO manda outro e-mail de aviso
const c2 = await J(await call('criar', { nome: 'Maria Souza', email: 'maria@teste.com', cpf: '52998224725' })); assert.equal(c2.s, 200); assert.equal(resend.length, 1, 'sem 2o aviso');
// 4) status pendente: sem codigo
let st = await J(await call('status', { pedido: c.pedido, email: 'maria@teste.com' })); assert.equal(st.status, 'pendente'); assert.equal(st.codigo, undefined);
// 5) paga: com o e-mail certo vem o codigo; sem e-mail ou com e-mail errado NAO
mpStatus = 'approved';
st = await J(await call('status', { pedido: c.pedido, email: 'MARIA@teste.com' })); assert.equal(st.status, 'aprovada'); assert.match(st.codigo, /^P[A-Z2-9]{9}$/); assert.equal(st.email_enviado, true);
assert.equal(resend.length, 2); assert.match(resend[1].b.html, new RegExp(st.codigo));
const sem = await J(await call('status', { pedido: c.pedido })); assert.equal(sem.codigo, undefined);
const errado = await J(await call('status', { pedido: c.pedido, email: 'outra@pessoa.com' })); assert.equal(errado.codigo, undefined);
// 6) origem estranha continua bloqueada; token com hifen nao e mutilado
assert.equal((await J(await call('criar', {}, 'https://site-ruim.com'))).s, 403);
console.log('OK: tudo passou');
